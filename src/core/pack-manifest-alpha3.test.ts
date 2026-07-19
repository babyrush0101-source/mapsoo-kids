import { describe, expect, it } from 'vitest';
import { runGenerationProviderWithEvidence } from './generation-provider';
import { generationReceiptManifestProjection } from './generation-receipt';
import { DEFAULT_WORLD_SPEC } from './world-spec';
import { PROCEDURAL_PIXEL_PROVIDER } from '../providers/procedural-pixel-provider';
import { buildAlpha3PackManifest } from './pack-manifest-alpha3';
import { projectTrustedGenerationReceipt } from './trusted-generation-receipt';

const HASH = 'a'.repeat(64);
const WORLD_SPEC_PATH = 'worlds/sunny-meadow.world.json';

async function sha256(bytes: Uint8Array): Promise<string> {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function packageReceipt(receipt: unknown) {
  const receiptBytes = new TextEncoder().encode(`${JSON.stringify(receipt, null, 2)}\n`);
  const files = [
    'readme.md',
    'license-assets.md',
    'generation-receipt.json',
    WORLD_SPEC_PATH,
    'worlds/demo-world.json',
    'atlases/terrain.png',
    'atlases/props.png',
    'previews/map-preview.png',
    'schema/mapsoo-pack.schema.json',
    'schema/mapsoo-world.schema.json',
    'schema/mapsoo-generation-receipt.schema.json',
  ].map((path) => path === 'generation-receipt.json'
    ? {
        path,
        media_type: 'application/json',
        bytes: receiptBytes.byteLength,
        sha256: '',
      }
    : {
        path,
        media_type: 'application/octet-stream',
        bytes: 1,
        sha256: HASH,
      });
  const receiptRecord = files.find(({ path }) => path === 'generation-receipt.json');
  if (!receiptRecord) throw new Error('test receipt record missing');
  receiptRecord.sha256 = await sha256(receiptBytes);
  return { receiptBytes, files };
}

async function buildInputs() {
  const run = await runGenerationProviderWithEvidence(PROCEDURAL_PIXEL_PROVIDER, DEFAULT_WORLD_SPEC, {
    now: () => new Date('2026-07-19T00:00:00.000Z'),
  });
  const receipt = projectTrustedGenerationReceipt(run, {
    path: WORLD_SPEC_PATH,
    sha256: HASH,
  });
  return { run, receipt };
}

describe('alpha.3 pack manifest', () => {
  it('derives version, time, World Spec, license, and provenance from the receipt', async () => {
    const { run, receipt } = await buildInputs();
    const packaged = await packageReceipt(receipt);
    const manifest = await buildAlpha3PackManifest({ run, ...packaged });

    expect(manifest.pack).toMatchObject({
      version: '0.1.0-alpha.3',
      generator: { name: 'Mapsoo Worldsmith', version: '0.1.0-alpha.3' },
      created_at: receipt.created_at,
    });
    expect(manifest.world_spec).toEqual(receipt.world.input_spec);
    expect(manifest.license.assets).toEqual({
      id: receipt.licensing.output.id,
      file: receipt.licensing.output.notice_path,
    });
    expect(manifest.provenance).toEqual(generationReceiptManifestProjection(receipt));
    expect(manifest.compatibility.importer.min_version).toBe('0.1.0-alpha.1');
  });

  it('rejects receipt drift instead of independently relabeling the manifest', async () => {
    const { run, receipt } = await buildInputs();
    const wrongHashReceipt = structuredClone(receipt);
    wrongHashReceipt.world.input_spec.sha256 = 'b'.repeat(64);
    await expect(buildAlpha3PackManifest({
      run,
      ...await packageReceipt(wrongHashReceipt),
    })).rejects.toThrow('receipt.context-input-spec');

    const wrongTimeReceipt = structuredClone(receipt);
    wrongTimeReceipt.created_at = '2026-07-19T00:00:01.000Z';
    await expect(buildAlpha3PackManifest({
      run,
      ...await packageReceipt(wrongTimeReceipt),
    })).rejects.toThrow('receipt.context-created-at');
  });

  it('fails closed on provider, disclosure, license, and shape mutations', async () => {
    const { run, receipt } = await buildInputs();
    const mutations: Array<(value: typeof receipt) => void> = [
      (value) => { value.provider.execution = 'remote'; },
      (value) => { value.ai_disclosure.contains_generative_ai = true; },
      (value) => { value.licensing.output.notice_path = 'different-license.md'; },
      (value) => { Object.assign(value, { undeclared_private_claim: 'must-not-ship' }); },
    ];

    for (const mutate of mutations) {
      const changed = structuredClone(receipt);
      mutate(changed);
      await expect(buildAlpha3PackManifest({
        run,
        ...await packageReceipt(changed),
      })).rejects.toThrow();
    }
  });

  it('rejects legal-looking workflow, transformation, and source claims absent from runner evidence', async () => {
    const { run, receipt } = await buildInputs();

    const changedWorkflow = structuredClone(receipt);
    changedWorkflow.workflow = {
      id: 'different-procedural-workflow',
      version: '1.0.0',
      definition_sha256: null,
    };
    changedWorkflow.transformations = [{ id: 'different-pixel-export', version: '1.0.0' }];
    await expect(buildAlpha3PackManifest({
      run,
      ...await packageReceipt(changedWorkflow),
    })).rejects.toThrow('exact projection of the runner-owned evidence');

    const changedSources = structuredClone(receipt);
    changedSources.sources.push({
      id: 'invented-source',
      kind: 'reference-asset',
      sha256: 'c'.repeat(64),
      path: 'sources/invented.png',
      license: { id: 'CC0-1.0', url: null, attribution: null },
    });
    const packaged = await packageReceipt(changedSources);
    packaged.files.push({
      path: 'sources/invented.png',
      media_type: 'image/png',
      bytes: 1,
      sha256: 'c'.repeat(64),
    });
    await expect(buildAlpha3PackManifest({ run, ...packaged })).rejects.toThrow(
      'exact projection of the runner-owned evidence',
    );
  });

  it('binds the parsed receipt to the exact file record bytes', async () => {
    const { run, receipt } = await buildInputs();
    const packaged = await packageReceipt(receipt);
    const receiptRecord = packaged.files.find(({ path }) => path === 'generation-receipt.json');
    if (!receiptRecord) throw new Error('test receipt record missing');
    receiptRecord.sha256 = 'f'.repeat(64);

    await expect(buildAlpha3PackManifest({ run, ...packaged })).rejects.toThrow(
      'receipt file record does not match the shipped receipt bytes',
    );
  });

  it('requires canonical receipt JSON and snapshots mutable inputs before awaiting', async () => {
    const { run, receipt } = await buildInputs();
    const nonCanonical = await packageReceipt(receipt);
    nonCanonical.receiptBytes = new TextEncoder().encode(JSON.stringify(receipt));
    const nonCanonicalRecord = nonCanonical.files.find(({ path }) => path === 'generation-receipt.json');
    if (!nonCanonicalRecord) throw new Error('test receipt record missing');
    nonCanonicalRecord.bytes = nonCanonical.receiptBytes.byteLength;
    nonCanonicalRecord.sha256 = await sha256(nonCanonical.receiptBytes);
    await expect(buildAlpha3PackManifest({ run, ...nonCanonical })).rejects.toThrow(
      'canonical receipt serialization',
    );

    const mutable = await packageReceipt(receipt);
    const manifestPromise = buildAlpha3PackManifest({ run, ...mutable });
    mutable.receiptBytes.fill(0);
    mutable.files[0].path = '../changed-after-call';
    mutable.files[1].sha256 = 'f'.repeat(64);
    const manifest = await manifestPromise;

    expect(manifest.files[0].path).toBe('readme.md');
    expect(manifest.files[1].sha256).toBe(HASH);
    expect(Object.isFrozen(manifest)).toBe(true);
    expect(Object.isFrozen(manifest.files)).toBe(true);
    expect(Object.isFrozen(manifest.files[0])).toBe(true);
  });

  it('requires a runner-minted run even when the receipt and file records are well formed', async () => {
    const { run, receipt } = await buildInputs();
    const packaged = await packageReceipt(receipt);
    await expect(buildAlpha3PackManifest({
      run: { ...run },
      ...packaged,
    })).rejects.toThrow('evidence.untrusted-run');
  });
});
