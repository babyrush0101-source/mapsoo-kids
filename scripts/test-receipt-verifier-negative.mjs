#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import JSZip from 'jszip';

import { verifyReceiptForRelease } from './receipt-verifier.mjs';
import {
  assertReceiptVerifierBinding,
  buildExamplePackArchive,
  listReleaseConfigs,
  REPOSITORY_ROOT,
  sha256,
} from './release-lib.mjs';

let passed = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function updateRecord(manifest, path, bytes) {
  const record = manifest.files.find((candidate) => candidate.path === path);
  assert(record, `negative fixture is missing record: ${path}`);
  record.bytes = bytes.length;
  record.sha256 = sha256(bytes);
}

async function loadFixture(config) {
  const zip = await JSZip.loadAsync(await buildExamplePackArchive(config.version), {
    checkCRC32: true,
    createFolders: false,
  });
  const prefix = `${config.release.examplePack.archiveRoot}/`;
  const files = new Map();
  for (const entry of Object.values(zip.files)) {
    assert(!entry.dir, `${config.tag} negative fixture contains a directory entry`);
    assert(entry.name.startsWith(prefix), `${config.tag} negative fixture escaped its root`);
    files.set(entry.name.slice(prefix.length), await entry.async('nodebuffer'));
  }
  const manifest = JSON.parse(files.get('mapsoo.manifest.json').toString('utf8'));
  await verifyReceiptForRelease({
    version: config.version,
    manifest,
    context: `${config.tag} positive receipt fixture`,
    readPackFile: async (path) => files.get(path),
  });
  return { manifest, files };
}

async function mutatedFixture(config, mutate) {
  const base = await loadFixture(config);
  const manifest = clone(base.manifest);
  const files = new Map([...base.files].map(([path, bytes]) => [path, Buffer.from(bytes)]));
  const receiptPath = manifest.receipt.path;
  const receipt = JSON.parse(files.get(receiptPath).toString('utf8'));
  await mutate({ manifest, receipt, files });
  const receiptBytes = jsonBytes(receipt);
  files.set(receiptPath, receiptBytes);
  updateRecord(manifest, receiptPath, receiptBytes);
  return { manifest, files };
}

async function expectFailure(config, name, mutate, expected) {
  const { manifest, files } = await mutatedFixture(config, mutate);
  try {
    await verifyReceiptForRelease({
      version: config.version,
      manifest,
      context: `${config.tag} ${name}`,
      readPackFile: async (path) => files.get(path),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    assert(expected.test(message), `${config.tag} ${name} failed for the wrong reason: ${message}`);
    passed += 1;
    return;
  }
  throw new Error(`${config.tag} ${name} was accepted unexpectedly`);
}

async function runAlpha1(config) {
  const cases = [
    ['extra receipt field', ({ receipt }) => { receipt.extra = true; }, /unexpected or missing fields/],
    ['receipt schema upgrade', ({ receipt }) => { receipt.schema_version = '0.2.0'; }, /schema must be 0\.1\.0/],
    ['forged generator', ({ receipt }) => { receipt.generator.id = 'future-provider'; }, /must use builtin/],
    ['AI disclosure conflict', ({ receipt }) => { receipt.contains_generative_ai = true; }, /contains_generative_ai=false/],
    ['transformation reorder', ({ receipt }) => { receipt.transformations.reverse(); }, /transformations mismatch/],
    ['world id conflict', ({ receipt }) => { receipt.world_id = 'forged-world'; }, /world_id must match/],
  ];
  for (const [name, mutate, expected] of cases) await expectFailure(config, name, mutate, expected);
}

async function runReceiptV02(config) {
  const cases = [
    ['extra receipt field', ({ receipt }) => { receipt.extra = true; }, /unexpected or missing fields/],
    ['receipt schema downgrade', ({ receipt }) => { receipt.schema_version = '0.1.0'; }, /schema must be 0\.2\.0/],
    ['created_at conflict', ({ receipt }) => { receipt.created_at = '2026-07-19T00:00:00.000Z'; }, /time must match manifest/],
    ['input spec hash conflict', ({ receipt }) => { receipt.world.input_spec.sha256 = '0'.repeat(64); }, /input spec must match/],
    ['provider id conflict', ({ receipt }) => { receipt.provider.id = 'future-provider'; }, /provider evidence mismatch/],
    ['provider execution conflict', ({ receipt }) => { receipt.provider.execution = 'remote'; }, /provider evidence mismatch/],
    ['provider provenance conflict', ({ receipt }) => { receipt.provider.output_provenance = 'generative-ai'; }, /provider evidence mismatch/],
    ['non-null model', ({ receipt }) => { receipt.model = { provider: 'Example', id: 'model' }; }, /model must be null/],
    ['workflow id conflict', ({ receipt }) => { receipt.workflow.id = 'future-workflow'; }, /workflow mismatch/],
    ['workflow hash conflict', ({ receipt }) => { receipt.workflow.definition_sha256 = 'a'.repeat(64); }, /workflow mismatch/],
    ['transformation reorder', ({ receipt }) => { receipt.transformations.reverse(); }, /transformations mismatch/],
    ['transformation version conflict', ({ receipt }) => { receipt.transformations[0].version = '9.0.0'; }, /transformations mismatch/],
    ['AI disclosure conflict', ({ receipt }) => { receipt.ai_disclosure.contains_generative_ai = true; }, /AI disclosure mismatch/],
    ['license conflict', ({ receipt }) => { receipt.licensing.output.id = 'MIT'; }, /licensing mismatch/],
    ['provider terms conflict', ({ receipt }) => { receipt.licensing.provider_terms = { url: 'https://example.com' }; }, /licensing mismatch/],
    ['non-empty sources', ({ receipt }) => { receipt.sources = [{ type: 'url', url: 'https://example.com' }]; }, /sources must be empty/],
    ['manifest provenance conflict', ({ manifest }) => { manifest.provenance.seed = 'forged'; }, /manifest provenance/],
    ['payload media type conflict', ({ manifest }) => {
      manifest.files.find(({ path }) => path === 'previews/map-preview.png').media_type = 'application/octet-stream';
    }, /media type mismatch/],
    ['missing receipt schema', ({ manifest, files }) => {
      files.delete('schema/mapsoo-generation-receipt.schema.json');
      manifest.files = manifest.files.filter(({ path }) => path !== 'schema/mapsoo-generation-receipt.schema.json');
    }, /(?:11|14|17) payload records|payload path set mismatch/],
    ['receipt schema const conflict', ({ manifest, files }) => {
      const path = 'schema/mapsoo-generation-receipt.schema.json';
      const schema = JSON.parse(files.get(path).toString('utf8'));
      schema.properties.schema_version.const = '9.0.0';
      const bytes = jsonBytes(schema);
      files.set(path, bytes);
      updateRecord(manifest, path, bytes);
    }, /receipt schema bytes differ/],
    ['missing bundled MIT notice', ({ manifest, files }) => {
      const path = 'license-assets.md';
      const text = files.get(path).toString('utf8');
      const bytes = Buffer.from(text.replace('Permission is hereby granted, free of charge', 'Permission removed'), 'utf8');
      files.set(path, bytes);
      updateRecord(manifest, path, bytes);
    }, /complete MIT notice/],
    ['World Spec semantic conflict with recomputed hashes', ({ manifest, receipt, files }) => {
      const path = manifest.world_spec.path;
      const worldSpec = JSON.parse(files.get(path).toString('utf8'));
      worldSpec.seed = 'forged-seed';
      const bytes = jsonBytes(worldSpec);
      const hash = sha256(bytes);
      files.set(path, bytes);
      updateRecord(manifest, path, bytes);
      manifest.world_spec.sha256 = hash;
      receipt.world.input_spec.sha256 = hash;
    }, /World Spec seed mismatch|places World Spec binding mismatch/],
  ];
  for (const [name, mutate, expected] of cases) await expectFailure(config, name, mutate, expected);
}

async function runAlpha6(config) {
  await runReceiptV02(config);
  const cases = [
    ['structure sidecar place binding conflict', ({ manifest, files }) => {
      const path = 'runtime/structures.json';
      const structures = JSON.parse(files.get(path).toString('utf8'));
      structures.places.sha256 = '0'.repeat(64);
      const bytes = jsonBytes(structures);
      files.set(path, bytes);
      updateRecord(manifest, path, bytes);
      manifest.runtime.structures.sha256 = sha256(bytes);
    }, /structures places binding mismatch/],
    ['structure archetype conflict', ({ manifest, files }) => {
      const path = 'runtime/structures.json';
      const structures = JSON.parse(files.get(path).toString('utf8'));
      structures.structures[0].archetype = 'tower';
      const bytes = jsonBytes(structures);
      files.set(path, bytes);
      updateRecord(manifest, path, bytes);
      manifest.runtime.structures.sha256 = sha256(bytes);
    }, /structure is not an ordered projection|structure archetype mismatch/],
    ['structure atlas binding conflict', ({ manifest }) => {
      manifest.runtime.structures.schema.sha256 = '0'.repeat(64);
    }, /runtime structures binding mismatch/],
  ];
  for (const [name, mutate, expected] of cases) await expectFailure(config, name, mutate, expected);
}

async function buildSyntheticAlpha4(config) {
  const worldPath = 'worlds/sunny-meadow.world.json';
  const receiptPath = 'generation-receipt.json';
  const sourceWorldBytes = await readFile(join(REPOSITORY_ROOT, 'examples', 'sunny-meadow.world.json'));
  const worldSpec = JSON.parse(sourceWorldBytes.toString('utf8'));
  const worldBytes = jsonBytes(worldSpec);
  const sourceReceiptSchemaBytes = await readFile(join(
    REPOSITORY_ROOT,
    'schemas',
    'mapsoo-generation-receipt.schema.json',
  ));
  const receiptSchemaBytes = jsonBytes(JSON.parse(sourceReceiptSchemaBytes.toString('utf8')));
  const licenseBytes = await readFile(join(
    REPOSITORY_ROOT,
    'examples',
    'packs',
    'sunny-meadow-v0.1.0-alpha.3',
    'license-assets.md',
  ));
  const createdAt = '2026-07-19T08:00:00.000Z';
  const receipt = {
    schema_version: '0.2.0',
    created_at: createdAt,
    world: {
      id: 'sunny-meadow',
      input_spec: { path: worldPath, sha256: sha256(worldBytes) },
      seed: worldSpec.seed,
    },
    provider: {
      id: 'procedural-terrain-v2',
      version: '0.2.0',
      execution: 'local',
      output_provenance: 'procedural',
    },
    model: null,
    workflow: {
      id: 'mapsoo-playable-terrain-pack',
      version: '0.2.0',
      definition_sha256: null,
    },
    transformations: [
      { id: 'seeded-map-layout', version: '0.1.0' },
      { id: 'cardinal-terrain-projection', version: '0.2.0' },
      { id: 'procedural-pixel-atlas', version: '0.2.0' },
      { id: 'png-rgba-export', version: '0.1.0' },
    ],
    ai_disclosure: {
      contains_generative_ai: false,
      human_curated: false,
      statement: null,
    },
    licensing: {
      output: { id: 'CC0-1.0', notice_path: 'license-assets.md' },
      provider_terms: null,
    },
    sources: [],
  };
  const receiptBytes = jsonBytes(receipt);
  const payload = new Map([
    ['atlases/props.png', Buffer.from('synthetic alpha4 props')],
    ['atlases/terrain.png', Buffer.from('synthetic alpha4 terrain')],
    [receiptPath, receiptBytes],
    ['license-assets.md', licenseBytes],
    ['previews/map-preview.png', Buffer.from('synthetic alpha4 preview')],
    ['readme.md', Buffer.from('# Synthetic alpha.4 verifier fixture\n')],
    ['schema/mapsoo-generation-receipt.schema.json', receiptSchemaBytes],
    ['schema/mapsoo-pack-0.2.schema.json', Buffer.from('{}\n')],
    ['schema/mapsoo-world.schema.json', Buffer.from('{}\n')],
    ['worlds/demo-world.json', Buffer.from('{}\n')],
    [worldPath, worldBytes],
  ]);
  const mediaTypes = {
    'atlases/props.png': 'image/png',
    'atlases/terrain.png': 'image/png',
    [receiptPath]: 'application/json',
    'license-assets.md': 'text/markdown',
    'previews/map-preview.png': 'image/png',
    'readme.md': 'text/markdown',
    'schema/mapsoo-generation-receipt.schema.json': 'application/json',
    'schema/mapsoo-pack-0.2.schema.json': 'application/json',
    'schema/mapsoo-world.schema.json': 'application/json',
    'worlds/demo-world.json': 'application/json',
    [worldPath]: 'application/json',
  };
  const manifest = {
    schema_version: '0.2.0',
    pack: {
      id: config.release.examplePack.id,
      title: 'Sunny Meadow',
      version: config.version,
      generator: { name: 'Mapsoo Worldsmith', version: config.version },
      created_at: createdAt,
    },
    world_spec: receipt.world.input_spec,
    receipt: { path: receiptPath },
    files: [...payload].map(([path, bytes]) => ({
      path,
      media_type: mediaTypes[path],
      bytes: bytes.length,
      sha256: sha256(bytes),
    })),
    license: { assets: { id: 'CC0-1.0', file: 'license-assets.md' } },
    provenance: {
      contains_generative_ai: false,
      model_provider: null,
      model: null,
      seed: worldSpec.seed,
      human_curated: false,
    },
  };
  return { manifest, payload };
}

async function runSyntheticAlpha4(config) {
  const base = await buildSyntheticAlpha4(config);
  await verifyReceiptForRelease({
    version: config.version,
    manifest: base.manifest,
    context: `${config.tag} synthetic positive receipt fixture`,
    readPackFile: async (path) => base.payload.get(path),
  });
  passed += 1;

  const cases = [
    ['provider downgrade', (receipt) => { receipt.provider.id = 'procedural-pixel-v1'; }, /provider evidence mismatch/],
    ['workflow downgrade', (receipt) => { receipt.workflow.id = 'mapsoo-procedural-world-pack'; }, /workflow mismatch/],
    ['missing terrain projection', (receipt) => { receipt.transformations.splice(1, 1); }, /transformations mismatch/],
    ['terrain projection version drift', (receipt) => { receipt.transformations[1].version = '0.1.0'; }, /transformations mismatch/],
  ];
  for (const [name, mutate, expected] of cases) {
    const { manifest, payload } = await buildSyntheticAlpha4(config);
    const receipt = JSON.parse(payload.get(manifest.receipt.path).toString('utf8'));
    mutate(receipt);
    const bytes = jsonBytes(receipt);
    payload.set(manifest.receipt.path, bytes);
    updateRecord(manifest, manifest.receipt.path, bytes);
    try {
      await verifyReceiptForRelease({
        version: config.version,
        manifest,
        context: `${config.tag} synthetic ${name}`,
        readPackFile: async (path) => payload.get(path),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      assert(expected.test(message), `${config.tag} synthetic ${name} failed for the wrong reason: ${message}`);
      passed += 1;
      continue;
    }
    throw new Error(`${config.tag} synthetic ${name} was accepted unexpectedly`);
  }
}

try {
  const configs = listReleaseConfigs();
  assert(configs.length >= 4, 'receipt negative gate requires alpha.1 through alpha.4 configs');
  const fixtureBackedConfigs = configs.filter(
    (config) => config.lifecycle === 'published' || config.expectedExamplePackSha256 !== null,
  );
  const alpha4 = configs.find(({ receiptVerifier }) => (
    receiptVerifier === 'builtin-playable-terrain-alpha4-v0.2'
  ));
  assert(alpha4, 'receipt negative gate is missing the alpha.4 receipt policy');
  await runSyntheticAlpha4(alpha4);
  for (const config of fixtureBackedConfigs) {
    if (config.receiptVerifier === 'legacy-alpha1') await runAlpha1(config);
    else if (
      config.receiptVerifier === 'builtin-procedural-alpha2-v0.2'
      || config.receiptVerifier === 'builtin-procedural-alpha3-v0.2'
      || config.receiptVerifier === 'builtin-playable-terrain-alpha4-v0.2'
      || config.receiptVerifier === 'builtin-semantic-places-alpha5-v0.2'
    ) await runReceiptV02(config);
    else if (config.receiptVerifier === 'builtin-semantic-structures-alpha6-v0.2') await runAlpha6(config);
    else throw new Error(`No negative suite for ${config.receiptVerifier}`);
  }
  for (const config of configs) {
    assertReceiptVerifierBinding(config.receiptVerifier, config.version);
  }
  const forbiddenBindings = configs.flatMap((policyConfig) => configs
    .filter((versionConfig) => versionConfig !== policyConfig)
    .map((versionConfig) => [policyConfig.receiptVerifier, versionConfig.version]));
  forbiddenBindings.push(['unknown-policy', configs[0].version]);
  for (const [policy, version] of forbiddenBindings) {
    try {
      assertReceiptVerifierBinding(policy, version);
    } catch {
      passed += 1;
      continue;
    }
    throw new Error(`${policy} unexpectedly authorized ${version}`);
  }
  console.log(
    `MAPSOO_RECEIPT_NEGATIVE_OK cases=${passed} versions=${configs.length} fixture_backed=${fixtureBackedConfigs.length}`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}
