import { sha256 } from './release-lib.mjs';
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

function indexManifestFiles(manifest, context) {
  assert(Array.isArray(manifest.files), `${context} manifest.files must be an array`);
  const records = new Map();
  for (const record of manifest.files) {
    assertPlainObject(record, `${context} manifest.files record`);
    assert(typeof record.path === 'string' && record.path.length > 0, `${context} file path is invalid`);
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
