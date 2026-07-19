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
    default:
      throw new Error(
        `Unsupported receipt verifier policy for ${config.version}: ${String(config.receiptVerifier)}`,
      );
  }

  assertPlainObject(manifest, `${context} manifest`);
  assert(
    manifest.pack?.id === config.release.examplePack.id,
    `${context} pack ID must match trusted release config`,
  );
  assert(
    manifest.pack?.version === config.version,
    `${context} pack version must match trusted release config`,
  );
  return verifier({ manifest, readPackFile, context });
}
