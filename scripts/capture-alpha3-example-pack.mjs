import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';

import JSZip from 'jszip';

import {
  REPOSITORY_ROOT,
  assertPortableRelativePath,
  comparePortablePaths,
  createDeterministicZip,
  replaceSafeOutputDirectory,
} from './release-lib.mjs';

const VERSION = '0.1.0-alpha.3';
const ROOT = `mapsoo-sunny-meadow-v${VERSION}`;
const OUTPUT_PARENT = resolve(REPOSITORY_ROOT, 'examples', 'packs');
const OUTPUT_DIRECTORY = resolve(REPOSITORY_ROOT, `examples/packs/sunny-meadow-v${VERSION}`);
const MANIFEST_PATH = 'mapsoo.manifest.json';
const RECEIPT_PATH = 'generation-receipt.json';
const WORLD_SPEC_PATH = 'worlds/sunny-meadow.world.json';

const EXPECTED_PATHS = Object.freeze([
  'atlases/props.png',
  'atlases/terrain.png',
  RECEIPT_PATH,
  'license-assets.md',
  MANIFEST_PATH,
  'previews/map-preview.png',
  'readme.md',
  'schema/mapsoo-generation-receipt.schema.json',
  'schema/mapsoo-pack.schema.json',
  'schema/mapsoo-world.schema.json',
  'worlds/demo-world.json',
  WORLD_SPEC_PATH,
]);

const EXPECTED_PAYLOAD_PATHS = EXPECTED_PATHS.filter((path) => path !== MANIFEST_PATH);
const textDecoder = new TextDecoder('utf-8', { fatal: true });

function fail(message) {
  throw new Error(`Alpha.3 fixture capture rejected: ${message}`);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function assertExactKeys(value, keys, context) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${context} must be an object`);
  const actual = Object.keys(value).sort(comparePortablePaths);
  const expected = [...keys].sort(comparePortablePaths);
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${context} keys are not exact`);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function parseCanonicalJson(bytes, context) {
  const text = textDecoder.decode(bytes);
  let value;
  try {
    value = JSON.parse(text);
  } catch (error) {
    fail(`${context} is not valid JSON: ${error.message}`);
  }
  assert(text === stableJson(value), `${context} is not canonical pretty JSON with LF`);
  return value;
}

async function assertOutputAbsent() {
  try {
    await lstat(OUTPUT_DIRECTORY);
    fail(`output directory already exists: ${relative(REPOSITORY_ROOT, OUTPUT_DIRECTORY)}`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

async function readRepositoryJson(path) {
  return JSON.parse(await readFile(resolve(REPOSITORY_ROOT, path), 'utf8'));
}

function expectedMediaType(path) {
  if (path.endsWith('.json')) return 'application/json';
  if (path.endsWith('.md')) return 'text/markdown';
  if (path.endsWith('.png')) return 'image/png';
  fail(`no media-type policy for ${path}`);
}

const replaceOutput = process.argv.includes('--replace');
const sourceArgument = process.argv.slice(2).find((argument) => argument !== '--' && !argument.startsWith('--'));
const sourcePath = sourceArgument ? resolve(sourceArgument) : null;
assert(sourcePath, 'pass the explicit browser-exported ZIP path');
assert(sourcePath.endsWith('.zip'), 'source must be a ZIP file');
if (!replaceOutput) await assertOutputAbsent();

const sourceBytes = await readFile(sourcePath);
const zip = await JSZip.loadAsync(sourceBytes, { checkCRC32: true, createFolders: false });
const zipEntries = Object.values(zip.files);
assert(zipEntries.length === 12, `expected 12 ZIP entries, found ${zipEntries.length}`);
assert(zipEntries.every(({ dir }) => !dir), 'directory entries are forbidden');

const archivePaths = zipEntries.map(({ name }) => name).sort(comparePortablePaths);
const expectedArchivePaths = EXPECTED_PATHS
  .map((path) => `${ROOT}/${path}`)
  .sort(comparePortablePaths);
assert(
  JSON.stringify(archivePaths) === JSON.stringify(expectedArchivePaths),
  'ZIP paths do not match the exact alpha.3 fixture contract',
);

const entryBytes = new Map();
for (const archivePath of archivePaths) {
  assertPortableRelativePath(archivePath);
  const entry = zip.file(archivePath);
  assert(entry, `missing ZIP entry ${archivePath}`);
  entryBytes.set(archivePath.slice(ROOT.length + 1), Buffer.from(await entry.async('uint8array')));
}

const manifest = parseCanonicalJson(entryBytes.get(MANIFEST_PATH), MANIFEST_PATH);
assertExactKeys(manifest, [
  'schema_version',
  'pack',
  'compatibility',
  'world_spec',
  'demo',
  'layers',
  'receipt',
  'atlases',
  'sprites',
  'files',
  'license',
  'provenance',
], MANIFEST_PATH);
assert(manifest.schema_version === '0.1.0', 'manifest schema version must remain 0.1.0');
assert(manifest.pack?.id === 'sunny-meadow', 'manifest pack id must be sunny-meadow');
assert(manifest.pack?.version === VERSION, 'manifest pack version must be alpha.3');
assert(manifest.pack?.generator?.version === VERSION, 'manifest generator version must be alpha.3');
assert(manifest.receipt?.path === RECEIPT_PATH, 'manifest receipt path is wrong');
assert(manifest.world_spec?.path === WORLD_SPEC_PATH, 'manifest World Spec path is wrong');
assert(manifest.license?.assets?.id === 'CC0-1.0', 'manifest asset license must be CC0-1.0');
assert(manifest.license?.assets?.file === 'license-assets.md', 'manifest license notice path is wrong');
assert(Array.isArray(manifest.files) && manifest.files.length === 11, 'manifest must contain 11 payload records');

const recordPaths = [];
for (const record of manifest.files) {
  assertExactKeys(record, ['path', 'media_type', 'bytes', 'sha256'], `manifest record ${record?.path}`);
  assertPortableRelativePath(record.path);
  assert(EXPECTED_PAYLOAD_PATHS.includes(record.path), `unexpected manifest path ${record.path}`);
  assert(record.media_type === expectedMediaType(record.path), `media type mismatch for ${record.path}`);
  assert(Number.isSafeInteger(record.bytes) && record.bytes >= 0, `invalid byte length for ${record.path}`);
  assert(/^[a-f0-9]{64}$/.test(record.sha256), `invalid SHA-256 for ${record.path}`);
  const bytes = entryBytes.get(record.path);
  assert(bytes, `manifest references missing payload ${record.path}`);
  assert(bytes.byteLength === record.bytes, `byte length mismatch for ${record.path}`);
  assert(sha256(bytes) === record.sha256, `SHA-256 mismatch for ${record.path}`);
  recordPaths.push(record.path);
}
assert(
  JSON.stringify(recordPaths.sort(comparePortablePaths))
    === JSON.stringify([...EXPECTED_PAYLOAD_PATHS].sort(comparePortablePaths)),
  'manifest payload coverage is not exact',
);

const licenseText = textDecoder.decode(entryBytes.get('license-assets.md'));
for (const requiredLicenseText of [
  'procedural PNG and map assets',
  'CC0 1.0',
  'Copyright (c) 2026 babyrush0101-source',
  'Permission is hereby granted, free of charge',
  'The above copyright notice and this permission notice shall be included',
  'THE SOFTWARE IS PROVIDED "AS IS"',
]) {
  assert(licenseText.includes(requiredLicenseText), `license-assets.md is missing: ${requiredLicenseText}`);
}

const worldSpec = parseCanonicalJson(entryBytes.get(WORLD_SPEC_PATH), WORLD_SPEC_PATH);
const repositoryWorldSpec = await readRepositoryJson('examples/sunny-meadow.world.json');
assert(JSON.stringify(worldSpec) === JSON.stringify(repositoryWorldSpec), 'packed World Spec differs from repository source');
assert(worldSpec.id === 'sunny-meadow' && worldSpec.seed === 'mapsoo-demo-001', 'World Spec identity is wrong');
assert(manifest.world_spec.sha256 === sha256(entryBytes.get(WORLD_SPEC_PATH)), 'World Spec hash binding is wrong');

const receipt = parseCanonicalJson(entryBytes.get(RECEIPT_PATH), RECEIPT_PATH);
assertExactKeys(receipt, [
  'schema_version',
  'created_at',
  'world',
  'provider',
  'model',
  'workflow',
  'transformations',
  'ai_disclosure',
  'licensing',
  'sources',
], RECEIPT_PATH);
assert(receipt.schema_version === '0.2.0', 'receipt schema version must be 0.2.0');
assert(receipt.created_at === manifest.pack.created_at, 'receipt time is not bound to the manifest');
assert(receipt.world?.id === 'sunny-meadow', 'receipt world id is wrong');
assert(JSON.stringify(receipt.world?.input_spec) === JSON.stringify(manifest.world_spec), 'receipt World Spec binding is wrong');
assert(receipt.world?.seed === worldSpec.seed, 'receipt seed is wrong');
assert(JSON.stringify(receipt.provider) === JSON.stringify({
  id: 'procedural-pixel-v1',
  version: '0.1.0',
  execution: 'local',
  output_provenance: 'procedural',
}), 'receipt provider evidence is not the built-in procedural profile');
assert(receipt.model === null, 'built-in procedural receipt must not claim a model');
assert(JSON.stringify(receipt.workflow) === JSON.stringify({
  id: 'mapsoo-procedural-world-pack',
  version: '0.1.0',
  definition_sha256: null,
}), 'receipt workflow is wrong');
assert(JSON.stringify(receipt.transformations) === JSON.stringify([
  { id: 'seeded-map-layout', version: '0.1.0' },
  { id: 'procedural-pixel-atlas', version: '0.1.0' },
  { id: 'png-rgba-export', version: '0.1.0' },
]), 'receipt transformations are wrong');
assert(JSON.stringify(receipt.ai_disclosure) === JSON.stringify({
  contains_generative_ai: false,
  human_curated: false,
  statement: null,
}), 'receipt AI disclosure is wrong');
assert(JSON.stringify(receipt.licensing) === JSON.stringify({
  output: { id: 'CC0-1.0', notice_path: 'license-assets.md' },
  provider_terms: null,
}), 'receipt licensing is wrong');
assert(Array.isArray(receipt.sources) && receipt.sources.length === 0, 'built-in procedural receipt sources must be empty');
assert(JSON.stringify(manifest.provenance) === JSON.stringify({
  contains_generative_ai: false,
  model_provider: null,
  model: null,
  seed: 'mapsoo-demo-001',
  human_curated: false,
}), 'manifest provenance is not the exact receipt projection');

const demo = parseCanonicalJson(entryBytes.get('worlds/demo-world.json'), 'worlds/demo-world.json');
assert(demo.width === 24 && demo.height === 16, 'demo dimensions are wrong');
assert(demo.layers?.[0]?.cells?.length === 384, 'demo must contain 384 cells');
assert(demo.props?.length === 29, 'demo must contain 29 props');

for (const [packPath, sourcePathInRepository] of [
  ['schema/mapsoo-world.schema.json', 'schemas/mapsoo-world.schema.json'],
  ['schema/mapsoo-pack.schema.json', 'schemas/mapsoo-pack.schema.json'],
  ['schema/mapsoo-generation-receipt.schema.json', 'schemas/mapsoo-generation-receipt.schema.json'],
]) {
  const packedSchema = parseCanonicalJson(entryBytes.get(packPath), packPath);
  const sourceSchema = await readRepositoryJson(sourcePathInRepository);
  assert(JSON.stringify(packedSchema) === JSON.stringify(sourceSchema), `${packPath} differs from repository source`);
}

for (const path of ['atlases/terrain.png', 'atlases/props.png', 'previews/map-preview.png']) {
  const bytes = entryBytes.get(path);
  assert(bytes?.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${path} is not a PNG`);
}

const rebuiltBytes = await createDeterministicZip(
  archivePaths.map((archivePath) => ({ archivePath, bytes: entryBytes.get(archivePath.slice(ROOT.length + 1)) })),
);
assert(Buffer.compare(sourceBytes, rebuiltBytes) === 0, 'browser ZIP bytes differ from the canonical release ZIP encoding');

if (replaceOutput) {
  await replaceSafeOutputDirectory(
    OUTPUT_PARENT,
    OUTPUT_DIRECTORY,
    'Alpha.3 fixture replacement must stay inside examples/packs',
  );
}

for (const path of EXPECTED_PATHS) {
  const destination = join(OUTPUT_DIRECTORY, ...path.split('/'));
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, entryBytes.get(path), { flag: 'wx' });
}

console.log(
  `Captured ${EXPECTED_PATHS.length} alpha.3 files from a deterministic browser ZIP (${sha256(sourceBytes)}) into ${relative(REPOSITORY_ROOT, OUTPUT_DIRECTORY)}`,
);
