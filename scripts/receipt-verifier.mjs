import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { REPOSITORY_ROOT, assertPortableRelativePath, sha256 } from './release-lib.mjs';
import { getReleaseConfig } from './release-config.mjs';

const MAX_RECEIPT_BYTES = 128 * 1024;
const LEGACY_GENERATOR = Object.freeze({
  id: 'procedural-pixel-v1',
  version: '0.1.0',
});
const LEGACY_TRANSFORMATIONS = Object.freeze([
  'seeded-map-layout',
  'procedural-pixel-atlas',
  'png-rgba-export',
]);
const ALPHA2_PROVIDER = Object.freeze({
  id: 'procedural-pixel-v1',
  version: '0.1.0',
  execution: 'local',
  output_provenance: 'procedural',
});
const ALPHA2_WORKFLOW = Object.freeze({
  id: 'mapsoo-procedural-world-pack',
  version: '0.1.0',
  definition_sha256: null,
});
const ALPHA2_TRANSFORMATIONS = Object.freeze([
  Object.freeze({ id: 'seeded-map-layout', version: '0.1.0' }),
  Object.freeze({ id: 'procedural-pixel-atlas', version: '0.1.0' }),
  Object.freeze({ id: 'png-rgba-export', version: '0.1.0' }),
]);
const ALPHA4_PROVIDER = Object.freeze({
  id: 'procedural-terrain-v2',
  version: '0.2.0',
  execution: 'local',
  output_provenance: 'procedural',
});
const ALPHA4_WORKFLOW = Object.freeze({
  id: 'mapsoo-playable-terrain-pack',
  version: '0.2.0',
  definition_sha256: null,
});
const ALPHA4_TRANSFORMATIONS = Object.freeze([
  Object.freeze({ id: 'seeded-map-layout', version: '0.1.0' }),
  Object.freeze({ id: 'cardinal-terrain-projection', version: '0.2.0' }),
  Object.freeze({ id: 'procedural-pixel-atlas', version: '0.2.0' }),
  Object.freeze({ id: 'png-rgba-export', version: '0.1.0' }),
]);
const ALPHA2_PAYLOAD_PATHS = Object.freeze([
  'atlases/props.png',
  'atlases/terrain.png',
  'generation-receipt.json',
  'license-assets.md',
  'previews/map-preview.png',
  'readme.md',
  'schema/mapsoo-generation-receipt.schema.json',
  'schema/mapsoo-pack.schema.json',
  'schema/mapsoo-world.schema.json',
  'worlds/demo-world.json',
  'worlds/sunny-meadow.world.json',
]);
const ALPHA2_PAYLOAD_MEDIA_TYPES = Object.freeze({
  'atlases/props.png': 'image/png',
  'atlases/terrain.png': 'image/png',
  'generation-receipt.json': 'application/json',
  'license-assets.md': 'text/markdown',
  'previews/map-preview.png': 'image/png',
  'readme.md': 'text/markdown',
  'schema/mapsoo-generation-receipt.schema.json': 'application/json',
  'schema/mapsoo-pack.schema.json': 'application/json',
  'schema/mapsoo-world.schema.json': 'application/json',
  'worlds/demo-world.json': 'application/json',
  'worlds/sunny-meadow.world.json': 'application/json',
});
const ALPHA4_PACK_SCHEMA_PATH = 'schema/mapsoo-pack-0.2.schema.json';
const ALPHA4_PAYLOAD_PATHS = Object.freeze(
  ALPHA2_PAYLOAD_PATHS.map((path) => path === 'schema/mapsoo-pack.schema.json'
    ? ALPHA4_PACK_SCHEMA_PATH
    : path),
);
const ALPHA4_PAYLOAD_MEDIA_TYPES = Object.freeze(Object.fromEntries(
  Object.entries(ALPHA2_PAYLOAD_MEDIA_TYPES).map(([path, mediaType]) => [
    path === 'schema/mapsoo-pack.schema.json' ? ALPHA4_PACK_SCHEMA_PATH : path,
    mediaType,
  ]),
));
const ALPHA5_PACK_SCHEMA_PATH = 'schema/mapsoo-pack-0.3.schema.json';
const ALPHA5_WORLD_SCHEMA_PATH = 'schema/mapsoo-world-0.2.schema.json';
const ALPHA5_PLACES_SCHEMA_PATH = 'schema/mapsoo-places-0.1.schema.json';
const ALPHA5_PLACES_PATH = 'runtime/places.json';
const ALPHA5_PLACES_ATLAS_PATH = 'atlases/places.png';
const ALPHA5_PAYLOAD_PATHS = Object.freeze([
  'atlases/props.png',
  ALPHA5_PLACES_ATLAS_PATH,
  'atlases/terrain.png',
  'generation-receipt.json',
  'license-assets.md',
  'previews/map-preview.png',
  'readme.md',
  ALPHA5_PLACES_PATH,
  'schema/mapsoo-generation-receipt.schema.json',
  ALPHA5_PACK_SCHEMA_PATH,
  ALPHA5_PLACES_SCHEMA_PATH,
  ALPHA5_WORLD_SCHEMA_PATH,
  'worlds/demo-world.json',
  'worlds/sunny-meadow.world.json',
]);
const ALPHA6_PACK_SCHEMA_PATH = 'schema/mapsoo-pack-0.4.schema.json';
const ALPHA6_WORLD_SCHEMA_PATH = 'schema/mapsoo-world-0.3.schema.json';
const ALPHA6_PLACES_SCHEMA_PATH = 'schema/mapsoo-places-0.2.schema.json';
const ALPHA6_STRUCTURES_SCHEMA_PATH = 'schema/mapsoo-structures-0.1.schema.json';
const ALPHA6_STRUCTURES_PATH = 'runtime/structures.json';
const ALPHA6_STRUCTURES_ATLAS_PATH = 'atlases/structures.png';
const ALPHA6_PAYLOAD_PATHS = Object.freeze([
  'atlases/props.png',
  ALPHA5_PLACES_ATLAS_PATH,
  ALPHA6_STRUCTURES_ATLAS_PATH,
  'atlases/terrain.png',
  'generation-receipt.json',
  'license-assets.md',
  'previews/map-preview.png',
  'readme.md',
  ALPHA5_PLACES_PATH,
  ALPHA6_STRUCTURES_PATH,
  'schema/mapsoo-generation-receipt.schema.json',
  ALPHA6_PACK_SCHEMA_PATH,
  ALPHA6_PLACES_SCHEMA_PATH,
  ALPHA6_STRUCTURES_SCHEMA_PATH,
  ALPHA6_WORLD_SCHEMA_PATH,
  'worlds/demo-world.json',
  'worlds/sunny-meadow.world.json',
]);
const EXPECTED_ALPHA2_RECEIPT_SCHEMA_SOURCE = JSON.parse(await readFile(
  join(REPOSITORY_ROOT, 'schemas', 'mapsoo-generation-receipt.schema.json'),
  'utf8',
));
const EXPECTED_ALPHA2_RECEIPT_SCHEMA_BYTES = Buffer.from(
  `${JSON.stringify(EXPECTED_ALPHA2_RECEIPT_SCHEMA_SOURCE, null, 2)}\n`,
  'utf8',
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertPlainObject(value, context) {
  assert(
    typeof value === 'object' && value !== null && !Array.isArray(value),
    `${context} must be an object`,
  );
}

function assertExactKeys(value, expectedKeys, context) {
  assertPlainObject(value, context);
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${context} contains unexpected or missing fields`,
  );
}

function decodeJson(bytes, context) {
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${context} is not valid UTF-8`);
  }
  assert(!text.includes('\r'), `${context} must use LF line endings`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${context} is not valid JSON`);
  }
}

function decodeCanonicalJson(bytes, context) {
  const value = decodeJson(bytes, context);
  const canonical = Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8');
  assert(Buffer.from(bytes).equals(canonical), `${context} must use canonical pretty JSON with LF`);
  return value;
}

function assertCanonicalTimestamp(value, context) {
  assert(typeof value === 'string', `${context} must be a string`);
  const date = new Date(value);
  assert(!Number.isNaN(date.valueOf()) && date.toISOString() === value, `${context} must be canonical ISO-8601 UTC`);
}

function indexManifestFiles(manifest, context) {
  assert(Array.isArray(manifest.files), `${context} manifest.files must be an array`);
  const records = new Map();
  for (const record of manifest.files) {
    assertExactKeys(
      record,
      ['bytes', 'media_type', 'path', 'sha256'],
      `${context} manifest.files record`,
    );
    assert(typeof record.path === 'string' && record.path.length > 0, `${context} file path is invalid`);
    assertPortableRelativePath(record.path);
    assert(typeof record.media_type === 'string' && record.media_type.length > 0, `${context} media type is invalid: ${record.path}`);
    assert(Number.isSafeInteger(record.bytes) && record.bytes >= 0, `${context} byte count is invalid: ${record.path}`);
    assert(/^[a-f0-9]{64}$/.test(record.sha256), `${context} SHA-256 is invalid: ${record.path}`);
    assert(!records.has(record.path), `${context} manifest.files contains duplicate path: ${record.path}`);
    records.set(record.path, record);
  }
  return records;
}

async function requireVerifiedFile(path, records, readPackFile, context) {
  const record = records.get(path);
  assert(record, `${context} is not declared in manifest.files: ${path}`);
  const bytes = await readPackFile(path);
  assert(Buffer.isBuffer(bytes) || bytes instanceof Uint8Array, `${context} is missing pack file: ${path}`);
  assert(bytes.length === record.bytes, `${context} byte count mismatch: ${path}`);
  assert(sha256(bytes) === record.sha256, `${context} SHA-256 mismatch: ${path}`);
  return Buffer.from(bytes);
}

/**
 * Verifies the exact legacy receipt contract published by v0.1.0-alpha.1.
 * This is deliberately not a generic future-provider validator.
 */
export async function verifyLegacyAlpha1Receipt({ manifest, readPackFile, context = 'alpha1 pack' }) {
  assertPlainObject(manifest, `${context} manifest`);
  assert(typeof readPackFile === 'function', `${context} readPackFile must be a function`);
  assert(manifest.schema_version === '0.1.0', `${context} manifest schema must be 0.1.0`);
  assert(manifest.pack?.id === 'sunny-meadow', `${context} legacy pack ID must be sunny-meadow`);
  assert(manifest.pack?.version === '0.1.0-alpha.1', `${context} legacy pack version mismatch`);
  assert(
    manifest.pack?.generator?.name === 'Mapsoo Worldsmith'
      && manifest.pack?.generator?.version === '0.1.0-alpha.1',
    `${context} legacy pack generator mismatch`,
  );

  assertExactKeys(manifest.receipt, ['path'], `${context} manifest.receipt`);
  assert(
    manifest.receipt.path === 'generation-receipt.json',
    `${context} legacy receipt path must be generation-receipt.json`,
  );
  assertExactKeys(manifest.license, ['assets'], `${context} manifest.license`);
  assertExactKeys(manifest.license.assets, ['file', 'id'], `${context} manifest.license.assets`);
  assert(
    manifest.license.assets.id === 'CC0-1.0'
      && manifest.license.assets.file === 'license-assets.md',
    `${context} legacy procedural assets must declare CC0-1.0 in license-assets.md`,
  );
  assertExactKeys(
    manifest.provenance,
    ['contains_generative_ai', 'human_curated', 'model', 'model_provider', 'seed'],
    `${context} manifest.provenance`,
  );
  assert(
    manifest.provenance.contains_generative_ai === false,
    `${context} legacy manifest provenance must declare contains_generative_ai=false`,
  );
  assert(
    manifest.provenance.model_provider === null && manifest.provenance.model === null,
    `${context} legacy procedural provenance must not name an AI model or provider`,
  );
  assert(
    manifest.provenance.human_curated === false,
    `${context} legacy procedural provenance human_curated must be false`,
  );
  assert(
    typeof manifest.provenance.seed === 'string' && manifest.provenance.seed.length > 0,
    `${context} legacy provenance seed is invalid`,
  );

  const records = indexManifestFiles(manifest, context);
  const receiptRecord = records.get(manifest.receipt.path);
  assert(receiptRecord?.media_type === 'application/json', `${context} legacy receipt media type mismatch`);
  const receiptBytes = await requireVerifiedFile(
    manifest.receipt.path,
    records,
    readPackFile,
    `${context} legacy receipt`,
  );
  assert(receiptBytes.length <= MAX_RECEIPT_BYTES, `${context} legacy receipt exceeds size limit`);
  const receipt = decodeJson(receiptBytes, `${context} legacy receipt`);

  assertExactKeys(
    receipt,
    ['contains_generative_ai', 'generator', 'schema_version', 'seed', 'transformations', 'world_id'],
    `${context} legacy receipt`,
  );
  assert(receipt.schema_version === '0.1.0', `${context} legacy receipt schema must be 0.1.0`);
  assertExactKeys(receipt.generator, ['id', 'version'], `${context} legacy receipt generator`);
  assert(
    receipt.generator.id === LEGACY_GENERATOR.id
      && receipt.generator.version === LEGACY_GENERATOR.version,
    `${context} legacy receipt must use builtin ${LEGACY_GENERATOR.id}@${LEGACY_GENERATOR.version}`,
  );
  assert(
    receipt.world_id === manifest.pack.id,
    `${context} legacy receipt world_id must match manifest pack.id`,
  );
  assert(
    receipt.seed === manifest.provenance.seed,
    `${context} legacy receipt seed must match manifest provenance`,
  );
  assert(
    receipt.contains_generative_ai === false,
    `${context} legacy receipt must declare contains_generative_ai=false`,
  );
  assert(
    JSON.stringify(receipt.transformations) === JSON.stringify(LEGACY_TRANSFORMATIONS),
    `${context} legacy receipt transformations mismatch`,
  );

  assertExactKeys(manifest.world_spec, ['path', 'sha256'], `${context} manifest.world_spec`);
  const worldBytes = await requireVerifiedFile(
    manifest.world_spec.path,
    records,
    readPackFile,
    `${context} World Spec`,
  );
  assert(
    sha256(worldBytes) === manifest.world_spec.sha256,
    `${context} world_spec.sha256 mismatch`,
  );
  const worldSpec = decodeJson(worldBytes, `${context} World Spec`);
  assert(worldSpec.id === receipt.world_id, `${context} receipt world_id must match World Spec id`);
  assert(worldSpec.seed === receipt.seed, `${context} receipt seed must match World Spec seed`);
  assert(
    worldSpec.output?.assetLicense === 'CC0-1.0',
    `${context} World Spec asset license must remain CC0-1.0`,
  );

  const licenseBytes = await requireVerifiedFile(
    manifest.license.assets.file,
    records,
    readPackFile,
    `${context} asset license`,
  );
  const licenseText = new TextDecoder('utf-8', { fatal: true }).decode(licenseBytes);
  assert(
    licenseText.includes('procedural PNG and map assets') && licenseText.includes('CC0 1.0'),
    `${context} asset license must scope CC0 to the procedural PNG and map assets`,
  );
  assert(
    /does not cover user-imported or future third-party\/AI-provider assets/i.test(licenseText),
    `${context} asset license must preserve its non-procedural exclusion`,
  );

  return { receipt, receiptSha256: sha256(receiptBytes) };
}

/**
 * Verifies the exact receipt-0.2 snapshot exported by the trusted built-in
 * procedural runner for v0.1.0-alpha.2. This policy intentionally does not
 * authorize future providers, models, workflows, or license profiles.
 */
export async function verifyAlpha2BuiltinReceipt({ manifest, readPackFile, context = 'alpha2 pack' }) {
  assertPlainObject(manifest, `${context} manifest`);
  assert(typeof readPackFile === 'function', `${context} readPackFile must be a function`);
  assert(manifest.schema_version === '0.1.0', `${context} manifest schema must be 0.1.0`);
  assertExactKeys(manifest.pack, ['created_at', 'generator', 'id', 'title', 'version'], `${context} manifest.pack`);
  assert(manifest.pack.id === 'sunny-meadow', `${context} pack ID must be sunny-meadow`);
  assert(manifest.pack.version === '0.1.0-alpha.2', `${context} pack version mismatch`);
  assertExactKeys(manifest.pack.generator, ['name', 'version'], `${context} manifest.pack.generator`);
  assert(
    manifest.pack.generator.name === 'Mapsoo Worldsmith'
      && manifest.pack.generator.version === '0.1.0-alpha.2',
    `${context} pack generator mismatch`,
  );
  assertCanonicalTimestamp(manifest.pack.created_at, `${context} manifest pack.created_at`);

  assertExactKeys(manifest.receipt, ['path'], `${context} manifest.receipt`);
  assert(manifest.receipt.path === 'generation-receipt.json', `${context} receipt path mismatch`);
  assertExactKeys(manifest.world_spec, ['path', 'sha256'], `${context} manifest.world_spec`);
  assert(
    manifest.world_spec.path === 'worlds/sunny-meadow.world.json'
      && /^[a-f0-9]{64}$/.test(manifest.world_spec.sha256),
    `${context} World Spec binding is invalid`,
  );
  assertExactKeys(manifest.license, ['assets'], `${context} manifest.license`);
  assertExactKeys(manifest.license.assets, ['file', 'id'], `${context} manifest.license.assets`);
  assert(
    manifest.license.assets.id === 'CC0-1.0'
      && manifest.license.assets.file === 'license-assets.md',
    `${context} procedural assets must declare CC0-1.0 in license-assets.md`,
  );
  assertExactKeys(
    manifest.provenance,
    ['contains_generative_ai', 'human_curated', 'model', 'model_provider', 'seed'],
    `${context} manifest.provenance`,
  );
  assert(
    JSON.stringify(manifest.provenance) === JSON.stringify({
      contains_generative_ai: false,
      model_provider: null,
      model: null,
      seed: 'mapsoo-demo-001',
      human_curated: false,
    }),
    `${context} manifest provenance is not the exact built-in receipt projection`,
  );

  const records = indexManifestFiles(manifest, context);
  assert(records.size === 11, `${context} alpha.2 manifest must contain 11 payload records`);
  assert(
    JSON.stringify([...records.keys()].sort()) === JSON.stringify([...ALPHA2_PAYLOAD_PATHS].sort()),
    `${context} alpha.2 payload path set mismatch`,
  );
  for (const [path, mediaType] of Object.entries(ALPHA2_PAYLOAD_MEDIA_TYPES)) {
    assert(records.get(path).media_type === mediaType, `${context} media type mismatch: ${path}`);
  }

  const receiptRecord = records.get(manifest.receipt.path);
  assert(receiptRecord.media_type === 'application/json', `${context} receipt media type mismatch`);
  const receiptBytes = await requireVerifiedFile(
    manifest.receipt.path,
    records,
    readPackFile,
    `${context} receipt`,
  );
  assert(receiptBytes.length <= MAX_RECEIPT_BYTES, `${context} receipt exceeds size limit`);
  const receipt = decodeCanonicalJson(receiptBytes, `${context} receipt`);
  assertExactKeys(receipt, [
    'ai_disclosure',
    'created_at',
    'licensing',
    'model',
    'provider',
    'schema_version',
    'sources',
    'transformations',
    'workflow',
    'world',
  ], `${context} receipt`);
  assert(receipt.schema_version === '0.2.0', `${context} receipt schema must be 0.2.0`);
  assertCanonicalTimestamp(receipt.created_at, `${context} receipt.created_at`);
  assert(receipt.created_at === manifest.pack.created_at, `${context} receipt time must match manifest`);

  assertExactKeys(receipt.world, ['id', 'input_spec', 'seed'], `${context} receipt.world`);
  assert(receipt.world.id === manifest.pack.id, `${context} receipt world id mismatch`);
  assert(receipt.world.seed === manifest.provenance.seed, `${context} receipt seed mismatch`);
  assertExactKeys(receipt.world.input_spec, ['path', 'sha256'], `${context} receipt.world.input_spec`);
  assert(
    JSON.stringify(receipt.world.input_spec) === JSON.stringify(manifest.world_spec),
    `${context} receipt input spec must match manifest world_spec`,
  );

  assertExactKeys(receipt.provider, ['execution', 'id', 'output_provenance', 'version'], `${context} receipt.provider`);
  assert(JSON.stringify(receipt.provider) === JSON.stringify(ALPHA2_PROVIDER), `${context} provider evidence mismatch`);
  assert(receipt.model === null, `${context} built-in procedural receipt model must be null`);
  assertExactKeys(receipt.workflow, ['definition_sha256', 'id', 'version'], `${context} receipt.workflow`);
  assert(JSON.stringify(receipt.workflow) === JSON.stringify(ALPHA2_WORKFLOW), `${context} workflow mismatch`);
  assert(
    JSON.stringify(receipt.transformations) === JSON.stringify(ALPHA2_TRANSFORMATIONS),
    `${context} transformations mismatch`,
  );
  for (const [index, transformation] of receipt.transformations.entries()) {
    assertExactKeys(transformation, ['id', 'version'], `${context} receipt.transformations[${index}]`);
  }
  assertExactKeys(
    receipt.ai_disclosure,
    ['contains_generative_ai', 'human_curated', 'statement'],
    `${context} receipt.ai_disclosure`,
  );
  assert(
    JSON.stringify(receipt.ai_disclosure) === JSON.stringify({
      contains_generative_ai: false,
      human_curated: false,
      statement: null,
    }),
    `${context} AI disclosure mismatch`,
  );
  assertExactKeys(receipt.licensing, ['output', 'provider_terms'], `${context} receipt.licensing`);
  assertExactKeys(receipt.licensing.output, ['id', 'notice_path'], `${context} receipt.licensing.output`);
  assert(
    JSON.stringify(receipt.licensing) === JSON.stringify({
      output: { id: 'CC0-1.0', notice_path: 'license-assets.md' },
      provider_terms: null,
    }),
    `${context} licensing mismatch`,
  );
  assert(Array.isArray(receipt.sources) && receipt.sources.length === 0, `${context} sources must be empty`);

  const worldBytes = await requireVerifiedFile(
    manifest.world_spec.path,
    records,
    readPackFile,
    `${context} World Spec`,
  );
  assert(sha256(worldBytes) === manifest.world_spec.sha256, `${context} World Spec hash mismatch`);
  const worldSpec = decodeCanonicalJson(worldBytes, `${context} World Spec`);
  assert(worldSpec.id === receipt.world.id, `${context} World Spec id mismatch`);
  assert(worldSpec.seed === receipt.world.seed, `${context} World Spec seed mismatch`);
  assert(worldSpec.output?.assetLicense === 'CC0-1.0', `${context} World Spec license mismatch`);

  const receiptSchemaPath = 'schema/mapsoo-generation-receipt.schema.json';
  const receiptSchemaRecord = records.get(receiptSchemaPath);
  assert(receiptSchemaRecord.media_type === 'application/json', `${context} receipt schema media type mismatch`);
  const receiptSchemaBytes = await requireVerifiedFile(
    receiptSchemaPath,
    records,
    readPackFile,
    `${context} receipt schema`,
  );
  assert(
    receiptSchemaBytes.equals(EXPECTED_ALPHA2_RECEIPT_SCHEMA_BYTES),
    `${context} receipt schema bytes differ from the registered source schema`,
  );
  const receiptSchema = decodeCanonicalJson(receiptSchemaBytes, `${context} receipt schema`);
  assert(
    receiptSchema.$id === 'https://mapsoo.dev/schemas/mapsoo-generation-receipt.schema.json',
    `${context} receipt schema $id mismatch`,
  );
  assert(receiptSchema.additionalProperties === false, `${context} receipt schema must reject extra fields`);
  assert(receiptSchema.properties?.schema_version?.const === '0.2.0', `${context} receipt schema const mismatch`);

  const licenseBytes = await requireVerifiedFile(
    manifest.license.assets.file,
    records,
    readPackFile,
    `${context} asset license`,
  );
  const licenseText = new TextDecoder('utf-8', { fatal: true }).decode(licenseBytes);
  assert(
    licenseText.includes('procedural PNG and map assets') && licenseText.includes('CC0 1.0'),
    `${context} asset license must scope CC0 to the procedural PNG and map assets`,
  );
  assert(
    /does not cover user-imported or future third-party\/AI-provider assets/i.test(licenseText),
    `${context} asset license must preserve its non-procedural exclusion`,
  );
  for (const requiredMitText of [
    'Copyright (c) 2026 babyrush0101-source',
    'Permission is hereby granted, free of charge',
    'The above copyright notice and this permission notice shall be included',
    'THE SOFTWARE IS PROVIDED "AS IS"',
  ]) {
    assert(
      licenseText.includes(requiredMitText),
      `${context} pack must carry the complete MIT notice for bundled readme and schemas`,
    );
  }

  return { receipt, receiptSha256: sha256(receiptBytes) };
}

/**
 * Verifies the alpha.3 release envelope while reusing the unchanged, exact
 * receipt-0.2 payload contract from alpha.2. The wrapper narrows authority to
 * alpha.3 before delegating; the historical alpha.2 verifier remains intact.
 */
export async function verifyAlpha3BuiltinReceipt({ manifest, readPackFile, context = 'alpha3 pack' }) {
  assertPlainObject(manifest, `${context} manifest`);
  assertExactKeys(manifest.pack, ['created_at', 'generator', 'id', 'title', 'version'], `${context} manifest.pack`);
  assert(manifest.pack.version === '0.1.0-alpha.3', `${context} pack version mismatch`);
  assertExactKeys(manifest.pack.generator, ['name', 'version'], `${context} manifest.pack.generator`);
  assert(
    manifest.pack.generator.name === 'Mapsoo Worldsmith'
      && manifest.pack.generator.version === '0.1.0-alpha.3',
    `${context} pack generator mismatch`,
  );

  return verifyAlpha2BuiltinReceipt({
    manifest: {
      ...manifest,
      pack: {
        ...manifest.pack,
        version: '0.1.0-alpha.2',
        generator: {
          ...manifest.pack.generator,
          version: '0.1.0-alpha.2',
        },
      },
    },
    readPackFile,
    context,
  });
}

/**
 * Verifies the exact procedural-terrain-v2 receipt introduced by alpha.4.
 * The alpha.4-only identity, workflow, and transformation snapshot is checked
 * before the unchanged receipt-0.2 file, World Spec, licensing, and canonical
 * JSON checks are delegated to the frozen alpha.2 common contract.
 */
export async function verifyAlpha4PlayableTerrainReceipt({
  manifest,
  readPackFile,
  context = 'alpha4 pack',
}) {
  assertPlainObject(manifest, `${context} manifest`);
  assert(typeof readPackFile === 'function', `${context} readPackFile must be a function`);
  assert(manifest.schema_version === '0.2.0', `${context} manifest schema must be 0.2.0`);
  assertExactKeys(manifest.pack, ['created_at', 'generator', 'id', 'title', 'version'], `${context} manifest.pack`);
  assert(manifest.pack.id === 'sunny-meadow', `${context} pack ID must be sunny-meadow`);
  assert(manifest.pack.version === '0.1.0-alpha.4', `${context} pack version mismatch`);
  assertExactKeys(manifest.pack.generator, ['name', 'version'], `${context} manifest.pack.generator`);
  assert(
    manifest.pack.generator.name === 'Mapsoo Worldsmith'
      && manifest.pack.generator.version === '0.1.0-alpha.4',
    `${context} pack generator mismatch`,
  );

  const records = indexManifestFiles(manifest, context);
  assert(records.size === 11, `${context} alpha.4 manifest must contain 11 payload records`);
  assert(
    JSON.stringify([...records.keys()].sort()) === JSON.stringify([...ALPHA4_PAYLOAD_PATHS].sort()),
    `${context} alpha.4 payload path set mismatch`,
  );
  for (const [path, mediaType] of Object.entries(ALPHA4_PAYLOAD_MEDIA_TYPES)) {
    assert(records.get(path).media_type === mediaType, `${context} media type mismatch: ${path}`);
  }

  assertExactKeys(manifest.receipt, ['path'], `${context} manifest.receipt`);
  assert(manifest.receipt.path === 'generation-receipt.json', `${context} receipt path mismatch`);
  const receiptBytes = await requireVerifiedFile(
    manifest.receipt.path,
    records,
    readPackFile,
    `${context} receipt`,
  );
  assert(receiptBytes.length <= MAX_RECEIPT_BYTES, `${context} receipt exceeds size limit`);
  const receipt = decodeCanonicalJson(receiptBytes, `${context} receipt`);
  assertExactKeys(receipt, [
    'ai_disclosure',
    'created_at',
    'licensing',
    'model',
    'provider',
    'schema_version',
    'sources',
    'transformations',
    'workflow',
    'world',
  ], `${context} receipt`);
  assert(receipt.schema_version === '0.2.0', `${context} receipt schema must be 0.2.0`);

  assertExactKeys(receipt.provider, ['execution', 'id', 'output_provenance', 'version'], `${context} receipt.provider`);
  assert(JSON.stringify(receipt.provider) === JSON.stringify(ALPHA4_PROVIDER), `${context} provider evidence mismatch`);
  assert(receipt.model === null, `${context} playable terrain receipt model must be null`);
  assertExactKeys(receipt.workflow, ['definition_sha256', 'id', 'version'], `${context} receipt.workflow`);
  assert(JSON.stringify(receipt.workflow) === JSON.stringify(ALPHA4_WORKFLOW), `${context} workflow mismatch`);
  assert(
    JSON.stringify(receipt.transformations) === JSON.stringify(ALPHA4_TRANSFORMATIONS),
    `${context} transformations mismatch`,
  );
  for (const [index, transformation] of receipt.transformations.entries()) {
    assertExactKeys(transformation, ['id', 'version'], `${context} receipt.transformations[${index}]`);
  }
  assertExactKeys(
    receipt.ai_disclosure,
    ['contains_generative_ai', 'human_curated', 'statement'],
    `${context} receipt.ai_disclosure`,
  );
  assert(
    JSON.stringify(receipt.ai_disclosure) === JSON.stringify({
      contains_generative_ai: false,
      human_curated: false,
      statement: null,
    }),
    `${context} AI disclosure mismatch`,
  );
  assertExactKeys(receipt.licensing, ['output', 'provider_terms'], `${context} receipt.licensing`);
  assertExactKeys(receipt.licensing.output, ['id', 'notice_path'], `${context} receipt.licensing.output`);
  assert(
    JSON.stringify(receipt.licensing) === JSON.stringify({
      output: { id: 'CC0-1.0', notice_path: 'license-assets.md' },
      provider_terms: null,
    }),
    `${context} licensing mismatch`,
  );
  assert(Array.isArray(receipt.sources) && receipt.sources.length === 0, `${context} sources must be empty`);

  // Rebind only the already-verified alpha.4-specific fields so the historical
  // common verifier can check the unchanged receipt schema bytes, World Spec,
  // license boundary, provenance projection, timestamps, and payload hashes.
  const commonReceipt = {
    ...receipt,
    provider: ALPHA2_PROVIDER,
    workflow: ALPHA2_WORKFLOW,
    transformations: ALPHA2_TRANSFORMATIONS,
  };
  const commonReceiptBytes = Buffer.from(`${JSON.stringify(commonReceipt, null, 2)}\n`, 'utf8');
  const commonManifest = {
    ...manifest,
    schema_version: '0.1.0',
    pack: {
      ...manifest.pack,
      version: '0.1.0-alpha.2',
      generator: {
        ...manifest.pack.generator,
        version: '0.1.0-alpha.2',
      },
    },
    files: manifest.files.map((record) => {
      if (record.path === manifest.receipt.path) {
        return { ...record, bytes: commonReceiptBytes.length, sha256: sha256(commonReceiptBytes) };
      }
      if (record.path === ALPHA4_PACK_SCHEMA_PATH) {
        return { ...record, path: 'schema/mapsoo-pack.schema.json' };
      }
      return record;
    }),
  };

  await verifyAlpha2BuiltinReceipt({
    manifest: commonManifest,
    readPackFile: async (path) => {
      if (path === manifest.receipt.path) return commonReceiptBytes;
      if (path === 'schema/mapsoo-pack.schema.json') return readPackFile(ALPHA4_PACK_SCHEMA_PATH);
      return readPackFile(path);
    },
    context,
  });
  return { receipt, receiptSha256: sha256(receiptBytes) };
}

/** Verifies alpha.5's semantic-place envelope before delegating its unchanged receipt-0.2 evidence. */
export async function verifyAlpha5SemanticPlacesReceipt({
  manifest,
  readPackFile,
  context = 'alpha5 pack',
}) {
  assertPlainObject(manifest, `${context} manifest`);
  assert(typeof readPackFile === 'function', `${context} readPackFile must be a function`);
  assert(manifest.schema_version === '0.3.0', `${context} manifest schema must be 0.3.0`);
  assert(manifest.pack?.id === 'sunny-meadow', `${context} pack ID must be sunny-meadow`);
  assert(manifest.pack?.version === '0.1.0-alpha.5', `${context} pack version mismatch`);
  assert(
    JSON.stringify(manifest.pack?.generator) === JSON.stringify({ name: 'Mapsoo Worldsmith', version: '0.1.0-alpha.5' }),
    `${context} pack generator mismatch`,
  );
  assert(manifest.compatibility?.importer?.min_version === '0.1.0-alpha.5', `${context} importer minimum mismatch`);

  const records = indexManifestFiles(manifest, context);
  assert(records.size === 14, `${context} alpha.5 manifest must contain 14 payload records`);
  assert(
    JSON.stringify([...records.keys()].sort()) === JSON.stringify([...ALPHA5_PAYLOAD_PATHS].sort()),
    `${context} alpha.5 payload path set mismatch`,
  );
  for (const [path, mediaType] of [
    [ALPHA5_PLACES_ATLAS_PATH, 'image/png'],
    [ALPHA5_PLACES_PATH, 'application/json'],
    [ALPHA5_PLACES_SCHEMA_PATH, 'application/json'],
    [ALPHA5_PACK_SCHEMA_PATH, 'application/json'],
    [ALPHA5_WORLD_SCHEMA_PATH, 'application/json'],
  ]) assert(records.get(path)?.media_type === mediaType, `${context} media type mismatch: ${path}`);
  const placesRecord = records.get(ALPHA5_PLACES_PATH);
  const placesBytes = await requireVerifiedFile(ALPHA5_PLACES_PATH, records, readPackFile, `${context} places`);
  const places = decodeCanonicalJson(placesBytes, `${context} places`);
  assert(places.schema_version === '0.1.0', `${context} places schema must be 0.1.0`);
  assert(
    JSON.stringify(places.pack) === JSON.stringify({ id: 'sunny-meadow', version: '0.1.0-alpha.5' }),
    `${context} places pack binding mismatch`,
  );
  assert(
    JSON.stringify(places.world_spec) === JSON.stringify(manifest.world_spec),
    `${context} places World Spec binding mismatch`,
  );
  assert(
    JSON.stringify(places.placement_algorithm) === JSON.stringify({ id: 'mapsoo-semantic-place-resolver', version: '0.1.0' }),
    `${context} placement algorithm mismatch`,
  );
  assert(Array.isArray(places.places) && places.places.length >= 1 && places.places.length <= 8, `${context} places count is invalid`);
  const placeIds = new Set();
  for (const [index, place] of places.places.entries()) {
    assertPlainObject(place, `${context} places[${index}]`);
    assert(place.order === index, `${context} place order must be contiguous`);
    assert(typeof place.id === 'string' && place.id && !placeIds.has(place.id), `${context} place ID is invalid or duplicated`);
    placeIds.add(place.id);
    assert(place.sprite_id === `place-${place.kind}-01`, `${context} place sprite binding mismatch`);
    assert(Number.isSafeInteger(place.cell?.x) && Number.isSafeInteger(place.cell?.y), `${context} place cell is invalid`);
  }
  assert(
    manifest.runtime?.places?.path === ALPHA5_PLACES_PATH
      && manifest.runtime.places.sha256 === placesRecord.sha256
      && manifest.runtime.places.schema?.path === ALPHA5_PLACES_SCHEMA_PATH
      && manifest.runtime.places.schema.sha256 === records.get(ALPHA5_PLACES_SCHEMA_PATH)?.sha256,
    `${context} runtime places binding mismatch`,
  );

  const actualLicenseBytes = await requireVerifiedFile('license-assets.md', records, readPackFile, `${context} asset license`);
  const actualLicense = new TextDecoder('utf-8', { fatal: true }).decode(actualLicenseBytes);
  assert(
    actualLicense.includes('procedural PNG, map, and semantic-place assets') && actualLicense.includes('CC0 1.0'),
    `${context} asset license must scope CC0 to semantic-place assets`,
  );
  const commonLicenseBytes = Buffer.from(
    actualLicense.replace('procedural PNG, map, and semantic-place assets', 'procedural PNG and map assets'),
    'utf8',
  );
  const commonFiles = manifest.files
    .filter(({ path }) => ![ALPHA5_PLACES_PATH, ALPHA5_PLACES_SCHEMA_PATH, ALPHA5_PLACES_ATLAS_PATH].includes(path))
    .map((record) => {
      if (record.path === ALPHA5_PACK_SCHEMA_PATH) return { ...record, path: ALPHA4_PACK_SCHEMA_PATH };
      if (record.path === ALPHA5_WORLD_SCHEMA_PATH) return { ...record, path: 'schema/mapsoo-world.schema.json' };
      if (record.path === 'license-assets.md') return { ...record, bytes: commonLicenseBytes.length, sha256: sha256(commonLicenseBytes) };
      return record;
    });
  const commonManifest = {
    ...manifest,
    schema_version: '0.2.0',
    runtime: undefined,
    pack: { ...manifest.pack, version: '0.1.0-alpha.4', generator: { ...manifest.pack.generator, version: '0.1.0-alpha.4' } },
    compatibility: { ...manifest.compatibility, importer: { ...manifest.compatibility.importer, min_version: '0.1.0-alpha.4' } },
    files: commonFiles,
  };
  delete commonManifest.runtime;
  return verifyAlpha4PlayableTerrainReceipt({
    manifest: commonManifest,
    readPackFile: async (path) => {
      if (path === ALPHA4_PACK_SCHEMA_PATH) return readPackFile(ALPHA5_PACK_SCHEMA_PATH);
      if (path === 'schema/mapsoo-world.schema.json') return readPackFile(ALPHA5_WORLD_SCHEMA_PATH);
      if (path === 'license-assets.md') return commonLicenseBytes;
      return readPackFile(path);
    },
    context,
  });
}

/** Verifies Alpha.6's place-linked structures envelope, then reuses the unchanged Alpha.5 receipt proof. */
export async function verifyAlpha6SemanticStructuresReceipt({
  manifest,
  readPackFile,
  context = 'alpha6 pack',
}) {
  assertPlainObject(manifest, `${context} manifest`);
  assert(typeof readPackFile === 'function', `${context} readPackFile must be a function`);
  assert(manifest.schema_version === '0.4.0', `${context} manifest schema must be 0.4.0`);
  assert(manifest.pack?.id === 'sunny-meadow', `${context} pack ID must be sunny-meadow`);
  assert(manifest.pack?.version === '0.1.0-alpha.6', `${context} pack version mismatch`);
  assert(
    JSON.stringify(manifest.pack?.generator) === JSON.stringify({ name: 'Mapsoo Worldsmith', version: '0.1.0-alpha.6' }),
    `${context} pack generator mismatch`,
  );
  assert(manifest.compatibility?.importer?.min_version === '0.1.0-alpha.6', `${context} importer minimum mismatch`);

  const records = indexManifestFiles(manifest, context);
  assert(records.size === 17, `${context} alpha.6 manifest must contain 17 payload records`);
  assert(
    JSON.stringify([...records.keys()].sort()) === JSON.stringify([...ALPHA6_PAYLOAD_PATHS].sort()),
    `${context} alpha.6 payload path set mismatch`,
  );
  for (const [path, mediaType] of [
    [ALPHA6_STRUCTURES_ATLAS_PATH, 'image/png'],
    [ALPHA6_STRUCTURES_PATH, 'application/json'],
    [ALPHA6_STRUCTURES_SCHEMA_PATH, 'application/json'],
    [ALPHA6_PLACES_SCHEMA_PATH, 'application/json'],
    [ALPHA6_PACK_SCHEMA_PATH, 'application/json'],
    [ALPHA6_WORLD_SCHEMA_PATH, 'application/json'],
  ]) assert(records.get(path)?.media_type === mediaType, `${context} media type mismatch: ${path}`);

  const placesRecord = records.get(ALPHA5_PLACES_PATH);
  const placesBytes = await requireVerifiedFile(ALPHA5_PLACES_PATH, records, readPackFile, `${context} places`);
  const places = decodeCanonicalJson(placesBytes, `${context} places`);
  assert(places.schema_version === '0.2.0', `${context} places schema must be 0.2.0`);
  assert(
    JSON.stringify(places.pack) === JSON.stringify({ id: 'sunny-meadow', version: '0.1.0-alpha.6' }),
    `${context} places pack binding mismatch`,
  );
  assert(JSON.stringify(places.world_spec) === JSON.stringify(manifest.world_spec), `${context} places World Spec binding mismatch`);

  const structuresRecord = records.get(ALPHA6_STRUCTURES_PATH);
  const structuresBytes = await requireVerifiedFile(ALPHA6_STRUCTURES_PATH, records, readPackFile, `${context} structures`);
  const structures = decodeCanonicalJson(structuresBytes, `${context} structures`);
  assertExactKeys(
    structures,
    ['schema_version', 'pack', 'world_spec', 'places', 'coordinate_space', 'resolution_algorithm', 'atlas', 'structures'],
    `${context} structures sidecar`,
  );
  assert(structures.schema_version === '0.1.0', `${context} structures schema must be 0.1.0`);
  assert(
    JSON.stringify(structures.pack) === JSON.stringify({ id: 'sunny-meadow', version: '0.1.0-alpha.6' }),
    `${context} structures pack binding mismatch`,
  );
  assert(JSON.stringify(structures.world_spec) === JSON.stringify(manifest.world_spec), `${context} structures World Spec binding mismatch`);
  assert(
    JSON.stringify(structures.places) === JSON.stringify({ path: ALPHA5_PLACES_PATH, sha256: placesRecord.sha256 }),
    `${context} structures places binding mismatch`,
  );
  assert(
    JSON.stringify(structures.resolution_algorithm) === JSON.stringify({ id: 'mapsoo-semantic-structure-resolver', version: '0.1.0' }),
    `${context} structure resolution algorithm mismatch`,
  );
  assert(
    structures.atlas?.path === ALPHA6_STRUCTURES_ATLAS_PATH
      && Array.isArray(structures.atlas.sprite_size_px)
      && Array.isArray(structures.atlas.pivot_px),
    `${context} structures atlas contract mismatch`,
  );
  assert(Array.isArray(structures.structures) && structures.structures.length <= 8, `${context} structures count is invalid`);

  const worldBytes = await requireVerifiedFile(manifest.world_spec.path, records, readPackFile, `${context} World Spec`);
  const world = decodeCanonicalJson(worldBytes, `${context} World Spec`);
  const authored = world.structures ?? [];
  assert(world.schemaVersion === '0.3.0' && Array.isArray(authored), `${context} World Spec 0.3 structures are invalid`);
  assert(authored.length === structures.structures.length, `${context} authored/resolved structure count mismatch`);
  const structureIds = new Set();
  const placeIds = new Set();
  for (const [index, structure] of structures.structures.entries()) {
    assertPlainObject(structure, `${context} structures[${index}]`);
    const declaration = authored[index];
    assertPlainObject(declaration, `${context} World Spec structures[${index}]`);
    assert(structure.order === index, `${context} structure order must be contiguous`);
    assert(typeof structure.id === 'string' && structure.id && !structureIds.has(structure.id), `${context} structure ID is invalid or duplicated`);
    assert(typeof structure.place_id === 'string' && structure.place_id && !placeIds.has(structure.place_id), `${context} structure place is invalid or duplicated`);
    structureIds.add(structure.id);
    placeIds.add(structure.place_id);
    assert(
      declaration.id === structure.id
        && declaration.placeId === structure.place_id
        && declaration.archetype === structure.archetype,
      `${context} structure is not an ordered projection of the World Spec`,
    );
    assert(structure.sprite_id === `structure-${structure.archetype}-01`, `${context} structure sprite binding mismatch`);
    assert(Array.isArray(structure.region_px) && structure.region_px.length === 4, `${context} structure region is invalid`);
    assert(Array.isArray(structure.pivot_px) && structure.pivot_px.length === 2, `${context} structure pivot is invalid`);
  }
  assert(
    manifest.runtime?.structures?.path === ALPHA6_STRUCTURES_PATH
      && manifest.runtime.structures.sha256 === structuresRecord.sha256
      && manifest.runtime.structures.schema?.path === ALPHA6_STRUCTURES_SCHEMA_PATH
      && manifest.runtime.structures.schema.sha256 === records.get(ALPHA6_STRUCTURES_SCHEMA_PATH)?.sha256,
    `${context} runtime structures binding mismatch`,
  );
  assert(
    manifest.runtime?.places?.path === ALPHA5_PLACES_PATH
      && manifest.runtime.places.sha256 === placesRecord.sha256
      && manifest.runtime.places.schema?.path === ALPHA6_PLACES_SCHEMA_PATH
      && manifest.runtime.places.schema.sha256 === records.get(ALPHA6_PLACES_SCHEMA_PATH)?.sha256,
    `${context} runtime places binding mismatch`,
  );

  const actualLicenseBytes = await requireVerifiedFile('license-assets.md', records, readPackFile, `${context} asset license`);
  const actualLicense = new TextDecoder('utf-8', { fatal: true }).decode(actualLicenseBytes);
  const alpha6LicensePhrase = 'procedural PNG, map, semantic-place, and semantic-structure assets';
  assert(actualLicense.includes(alpha6LicensePhrase) && actualLicense.includes('CC0 1.0'), `${context} asset license must scope CC0 to semantic structures`);
  const alpha5LicenseBytes = Buffer.from(
    actualLicense.replace(alpha6LicensePhrase, 'procedural PNG, map, and semantic-place assets'),
    'utf8',
  );
  const alpha5Places = { ...places, schema_version: '0.1.0', pack: { ...places.pack, version: '0.1.0-alpha.5' } };
  const alpha5PlacesBytes = Buffer.from(`${JSON.stringify(alpha5Places, null, 2)}\n`, 'utf8');
  const commonFiles = manifest.files
    .filter(({ path }) => ![ALPHA6_STRUCTURES_PATH, ALPHA6_STRUCTURES_SCHEMA_PATH, ALPHA6_STRUCTURES_ATLAS_PATH].includes(path))
    .map((record) => {
      if (record.path === ALPHA6_PACK_SCHEMA_PATH) return { ...record, path: ALPHA5_PACK_SCHEMA_PATH };
      if (record.path === ALPHA6_WORLD_SCHEMA_PATH) return { ...record, path: ALPHA5_WORLD_SCHEMA_PATH };
      if (record.path === ALPHA6_PLACES_SCHEMA_PATH) return { ...record, path: ALPHA5_PLACES_SCHEMA_PATH };
      if (record.path === ALPHA5_PLACES_PATH) return { ...record, bytes: alpha5PlacesBytes.length, sha256: sha256(alpha5PlacesBytes) };
      if (record.path === 'license-assets.md') return { ...record, bytes: alpha5LicenseBytes.length, sha256: sha256(alpha5LicenseBytes) };
      return record;
    });
  const commonManifest = {
    ...manifest,
    schema_version: '0.3.0',
    pack: { ...manifest.pack, version: '0.1.0-alpha.5', generator: { ...manifest.pack.generator, version: '0.1.0-alpha.5' } },
    compatibility: { ...manifest.compatibility, importer: { ...manifest.compatibility.importer, min_version: '0.1.0-alpha.5' } },
    runtime: {
      places: {
        path: ALPHA5_PLACES_PATH,
        sha256: sha256(alpha5PlacesBytes),
        schema: { path: ALPHA5_PLACES_SCHEMA_PATH, sha256: records.get(ALPHA6_PLACES_SCHEMA_PATH).sha256 },
      },
    },
    sprites: manifest.sprites.filter((sprite) => !Array.isArray(sprite.tags) || sprite.tags[0] !== 'structure'),
    files: commonFiles,
  };
  return verifyAlpha5SemanticPlacesReceipt({
    manifest: commonManifest,
    readPackFile: async (path) => {
      if (path === ALPHA5_PACK_SCHEMA_PATH) return readPackFile(ALPHA6_PACK_SCHEMA_PATH);
      if (path === ALPHA5_WORLD_SCHEMA_PATH) return readPackFile(ALPHA6_WORLD_SCHEMA_PATH);
      if (path === ALPHA5_PLACES_SCHEMA_PATH) return readPackFile(ALPHA6_PLACES_SCHEMA_PATH);
      if (path === ALPHA5_PLACES_PATH) return alpha5PlacesBytes;
      if (path === 'license-assets.md') return alpha5LicenseBytes;
      return readPackFile(path);
    },
    context,
  });
}

/** Verifies Alpha.7's three-world gallery packs without delegating identity to pack content. */
export async function verifyAlpha7WorldGalleryReceipt({
  manifest,
  readPackFile,
  context = 'alpha7 pack',
  expectedPackIds = ['sunny-meadow', 'dustwind-outpost', 'frostwatch-vale'],
}) {
  assertPlainObject(manifest, `${context} manifest`);
  assert(typeof readPackFile === 'function', `${context} readPackFile must be a function`);
  assert(manifest.schema_version === '0.5.0', `${context} manifest schema must be 0.5.0`);
  assert(expectedPackIds.includes(manifest.pack?.id), `${context} pack ID is not authorized by the release registry`);
  assert(manifest.pack?.version === '0.1.0-alpha.7', `${context} pack version mismatch`);
  assert(
    JSON.stringify(manifest.pack?.generator) === JSON.stringify({ name: 'Mapsoo Worldsmith', version: '0.1.0-alpha.7' }),
    `${context} pack generator mismatch`,
  );
  assertCanonicalTimestamp(manifest.pack.created_at, `${context} manifest pack.created_at`);
  assert(manifest.compatibility?.importer?.min_version === '0.1.0-alpha.7', `${context} importer minimum mismatch`);

  const worldPath = `worlds/${manifest.pack.id}.world.json`;
  const packSchemaPath = 'schema/mapsoo-pack-0.5.schema.json';
  const expectedPaths = [
    'atlases/places.png', 'atlases/props.png', 'atlases/structures.png', 'atlases/terrain.png',
    'generation-receipt.json', 'license-assets.md', 'previews/map-preview.png', 'readme.md',
    'runtime/places.json', 'runtime/structures.json', 'schema/mapsoo-generation-receipt.schema.json',
    packSchemaPath, 'schema/mapsoo-places-0.3.schema.json', 'schema/mapsoo-structures-0.2.schema.json',
    'schema/mapsoo-world-0.3.schema.json', 'worlds/demo-world.json', worldPath,
  ].sort();
  const records = indexManifestFiles(manifest, context);
  assert(records.size === expectedPaths.length, `${context} manifest must contain the exact 17-file payload`);
  assert(JSON.stringify([...records.keys()].sort()) === JSON.stringify(expectedPaths), `${context} payload path set mismatch`);
  for (const path of expectedPaths) await requireVerifiedFile(path, records, readPackFile, `${context} payload ${path}`);

  assert(JSON.stringify(manifest.world_spec) === JSON.stringify({ path: worldPath, sha256: records.get(worldPath).sha256 }), `${context} World Spec binding mismatch`);
  const world = decodeCanonicalJson(await readPackFile(worldPath), `${context} World Spec`);
  assert(world.schemaVersion === '0.3.0' && world.id === manifest.pack.id, `${context} World Spec identity mismatch`);

  const receiptBytes = await readPackFile('generation-receipt.json');
  assert(receiptBytes.length <= MAX_RECEIPT_BYTES, `${context} receipt exceeds size limit`);
  const receipt = decodeCanonicalJson(receiptBytes, `${context} receipt`);
  assertExactKeys(receipt, [
    'ai_disclosure', 'created_at', 'licensing', 'model', 'provider', 'schema_version',
    'sources', 'transformations', 'workflow', 'world',
  ], `${context} receipt`);
  assert(receipt.schema_version === '0.2.0' && receipt.created_at === manifest.pack.created_at, `${context} receipt version/time mismatch`);
  assert(JSON.stringify(receipt.provider) === JSON.stringify(ALPHA4_PROVIDER), `${context} provider evidence mismatch`);
  assert(JSON.stringify(receipt.workflow) === JSON.stringify(ALPHA4_WORKFLOW), `${context} workflow evidence mismatch`);
  assert(JSON.stringify(receipt.transformations) === JSON.stringify(ALPHA4_TRANSFORMATIONS), `${context} transformations mismatch`);
  assert(receipt.model === null && Array.isArray(receipt.sources) && receipt.sources.length === 0, `${context} procedural provenance mismatch`);
  assert(JSON.stringify(receipt.world) === JSON.stringify({ id: world.id, input_spec: manifest.world_spec, seed: world.seed }), `${context} receipt World Spec binding mismatch`);
  assert(JSON.stringify(receipt.ai_disclosure) === JSON.stringify({ contains_generative_ai: false, human_curated: false, statement: null }), `${context} AI disclosure mismatch`);
  assert(JSON.stringify(receipt.licensing) === JSON.stringify({ output: { id: 'CC0-1.0', notice_path: 'license-assets.md' }, provider_terms: null }), `${context} license evidence mismatch`);
  assert(manifest.provenance?.seed === world.seed && manifest.provenance?.contains_generative_ai === false, `${context} manifest provenance mismatch`);

  const places = decodeCanonicalJson(await readPackFile('runtime/places.json'), `${context} places`);
  assert(places.schema_version === '0.3.0', `${context} places schema mismatch`);
  assert(JSON.stringify(places.pack) === JSON.stringify({ id: world.id, version: '0.1.0-alpha.7' }), `${context} places pack binding mismatch`);
  assert(JSON.stringify(places.world_spec) === JSON.stringify(manifest.world_spec), `${context} places World Spec binding mismatch`);
  assert(Array.isArray(places.places) && places.places.length === (world.places ?? []).length, `${context} place projection count mismatch`);

  const structures = decodeCanonicalJson(await readPackFile('runtime/structures.json'), `${context} structures`);
  assert(structures.schema_version === '0.2.0', `${context} structures schema mismatch`);
  assert(JSON.stringify(structures.pack) === JSON.stringify({ id: world.id, version: '0.1.0-alpha.7' }), `${context} structures pack binding mismatch`);
  assert(JSON.stringify(structures.world_spec) === JSON.stringify(manifest.world_spec), `${context} structures World Spec binding mismatch`);
  assert(Array.isArray(structures.structures) && structures.structures.length === (world.structures ?? []).length, `${context} structure projection count mismatch`);
  const authoredPlaces = new Set((world.places ?? []).map(({ id }) => id));
  for (const [index, structure] of structures.structures.entries()) {
    const authored = world.structures[index];
    assert(authored?.id === structure.id && authored?.placeId === structure.place_id && authored?.archetype === structure.archetype, `${context} structure projection mismatch`);
    assert(authoredPlaces.has(structure.place_id), `${context} structure references an unknown place`);
  }

  const packSchema = decodeCanonicalJson(await readPackFile(packSchemaPath), `${context} pack schema`);
  assert(packSchema.properties?.schema_version?.const === '0.5.0', `${context} pack schema const mismatch`);
  assert(packSchema.properties?.pack?.properties?.version?.const === '0.1.0-alpha.7', `${context} pack schema version binding mismatch`);
  return { receipt, receiptSha256: sha256(receiptBytes) };
}

/**
 * Selects a receipt policy from the trusted release registry. The manifest and
 * receipt never choose their own verifier; unknown versions and policies fail closed.
 */
export async function verifyReceiptForRelease({
  version,
  manifest,
  readPackFile,
  context = 'release pack',
}) {
  const config = getReleaseConfig(version);
  let verifier;

  switch (config.receiptVerifier) {
    case 'legacy-alpha1':
      assert(
        config.version === '0.1.0-alpha.1',
        'The legacy-alpha1 receipt policy only authorizes release 0.1.0-alpha.1',
      );
      verifier = verifyLegacyAlpha1Receipt;
      break;
    case 'builtin-procedural-alpha2-v0.2':
      assert(
        config.version === '0.1.0-alpha.2',
        'The builtin-procedural-alpha2-v0.2 receipt policy only authorizes release 0.1.0-alpha.2',
      );
      verifier = verifyAlpha2BuiltinReceipt;
      break;
    case 'builtin-procedural-alpha3-v0.2':
      assert(
        config.version === '0.1.0-alpha.3',
        'The builtin-procedural-alpha3-v0.2 receipt policy only authorizes release 0.1.0-alpha.3',
      );
      verifier = verifyAlpha3BuiltinReceipt;
      break;
    case 'builtin-playable-terrain-alpha4-v0.2':
      assert(
        config.version === '0.1.0-alpha.4',
        'The builtin-playable-terrain-alpha4-v0.2 receipt policy only authorizes release 0.1.0-alpha.4',
      );
      verifier = verifyAlpha4PlayableTerrainReceipt;
      break;
    case 'builtin-semantic-places-alpha5-v0.2':
      assert(
        config.version === '0.1.0-alpha.5',
        'The builtin-semantic-places-alpha5-v0.2 receipt policy only authorizes release 0.1.0-alpha.5',
      );
      verifier = verifyAlpha5SemanticPlacesReceipt;
      break;
    case 'builtin-semantic-structures-alpha6-v0.2':
      assert(
        config.version === '0.1.0-alpha.6',
        'The builtin-semantic-structures-alpha6-v0.2 receipt policy only authorizes release 0.1.0-alpha.6',
      );
      verifier = verifyAlpha6SemanticStructuresReceipt;
      break;
    case 'builtin-world-gallery-alpha7-v0.2':
      assert(
        config.packVersion === '0.1.0-alpha.7'
          && ['0.1.0-alpha.7', '0.1.0-alpha.8'].includes(config.version),
        'The builtin-world-gallery-alpha7-v0.2 receipt policy requires the trusted Alpha.7 pack contract',
      );
      verifier = verifyAlpha7WorldGalleryReceipt;
      break;
    default:
      throw new Error(
        `Unsupported receipt verifier policy for ${config.version}: ${String(config.receiptVerifier)}`,
      );
  }

  assertPlainObject(manifest, `${context} manifest`);
  const trustedPackIds = [config.release.examplePack, ...(config.release.additionalExamplePacks ?? [])].map(({ id }) => id);
  assert(
    trustedPackIds.includes(manifest.pack?.id),
    `${context} pack ID must match trusted release config`,
  );
  assert(
    manifest.pack?.version === config.packVersion,
    `${context} pack version must match trusted release config pack contract`,
  );
  return verifier({ manifest, readPackFile, context, expectedPackIds: trustedPackIds });
}
