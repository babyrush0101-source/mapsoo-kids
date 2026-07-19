#!/usr/bin/env node

import JSZip from 'jszip';

import { verifyReceiptForRelease } from './receipt-verifier.mjs';
import {
  assertReceiptVerifierBinding,
  buildExamplePackArchive,
  listReleaseConfigs,
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
    }, /11 payload records|payload path set mismatch/],
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
    }, /World Spec seed mismatch/],
  ];
  for (const [name, mutate, expected] of cases) await expectFailure(config, name, mutate, expected);
}

try {
  const configs = listReleaseConfigs();
  assert(configs.length >= 3, 'receipt negative gate requires alpha.1, alpha.2, and alpha.3 configs');
  for (const config of configs) {
    if (config.receiptVerifier === 'legacy-alpha1') await runAlpha1(config);
    else if (
      config.receiptVerifier === 'builtin-procedural-alpha2-v0.2'
      || config.receiptVerifier === 'builtin-procedural-alpha3-v0.2'
    ) await runReceiptV02(config);
    else throw new Error(`No negative suite for ${config.receiptVerifier}`);
  }
  for (const [policy, version] of [
    ['legacy-alpha1', '0.1.0-alpha.2'],
    ['legacy-alpha1', '0.1.0-alpha.3'],
    ['builtin-procedural-alpha2-v0.2', '0.1.0-alpha.1'],
    ['builtin-procedural-alpha2-v0.2', '0.1.0-alpha.3'],
    ['builtin-procedural-alpha3-v0.2', '0.1.0-alpha.1'],
    ['builtin-procedural-alpha3-v0.2', '0.1.0-alpha.2'],
    ['unknown-policy', '0.1.0-alpha.2'],
  ]) {
    try {
      assertReceiptVerifierBinding(policy, version);
    } catch {
      passed += 1;
      continue;
    }
    throw new Error(`${policy} unexpectedly authorized ${version}`);
  }
  console.log(`MAPSOO_RECEIPT_NEGATIVE_OK cases=${passed} versions=${configs.length}`);
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}
