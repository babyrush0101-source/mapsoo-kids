import JSZip from 'jszip';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateWorld } from '../core/generate-world';
import type { GenerationRunResult } from '../core/generation-evidence';
import {
  generationReceiptManifestProjection,
  validateGenerationReceipt,
  type GenerationReceipt,
} from '../core/generation-receipt';
import { runGenerationProviderWithEvidence, type GeneratorProvider } from '../core/generation-provider';
import type { PackFileRecord } from '../core/pack-manifest';
import { DEFAULT_WORLD_SPEC } from '../core/world-spec';
import { PROCEDURAL_PIXEL_PROVIDER } from '../providers/procedural-pixel-provider';
import packageJson from '../../package.json';
import { buildPortablePack } from './export-browser-pack';
import { buildAlpha3PortablePack } from './export-browser-pack-alpha3';
import {
  CURRENT_PACK_VERSION,
  buildCurrentPortablePack,
} from './export-current-pack';

class CanvasStub {
  width = 0;
  height = 0;

  private readonly context = {
    fillStyle: '',
    globalAlpha: 1,
    imageSmoothingEnabled: false,
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    getImageData: vi.fn((_left: number, _top: number, width: number, height: number) => ({
      data: new Uint8ClampedArray(width * height * 4),
    })),
  };

  getContext(kind: string) {
    return kind === '2d' ? this.context : null;
  }

  toBlob(callback: BlobCallback) {
    callback(new Blob([Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' }));
  }
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function buildRun(): Promise<GenerationRunResult> {
  return runGenerationProviderWithEvidence(PROCEDURAL_PIXEL_PROVIDER, DEFAULT_WORLD_SPEC, {
    now: () => new Date('2026-07-19T00:00:00.000Z'),
  });
}

describe('alpha.3 browser pack foundation', () => {
  let createElement: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createElement = vi.fn(() => new CanvasStub());
    vi.stubGlobal('document', { createElement });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('ships a receipt-0.2 ZIP whose manifest covers the exact payload bytes', async () => {
    const run = await buildRun();
    const pack = await buildAlpha3PortablePack(run);
    const zip = await JSZip.loadAsync(await pack.blob.arrayBuffer());
    const root = 'mapsoo-sunny-meadow-v0.1.0-alpha.3/';
    const fileNames = Object.keys(zip.files);

    expect(pack.filename).toBe('mapsoo-sunny-meadow-v0.1.0-alpha.3.zip');
    expect(fileNames).toHaveLength(12);
    expect(Object.values(zip.files).every(({ dir }) => !dir)).toBe(true);
    expect(fileNames.every((path) => path.startsWith(root))).toBe(true);
    expect(fileNames).toEqual(expect.arrayContaining([
      `${root}mapsoo.manifest.json`,
      `${root}generation-receipt.json`,
      `${root}schema/mapsoo-generation-receipt.schema.json`,
      `${root}worlds/sunny-meadow.world.json`,
      `${root}worlds/demo-world.json`,
      `${root}atlases/terrain.png`,
      `${root}atlases/props.png`,
      `${root}previews/map-preview.png`,
    ]));
    expect(fileNames.some((path) => path.endsWith('.gd') || path.includes('/addons/'))).toBe(false);

    const manifest = JSON.parse(
      await zip.file(`${root}mapsoo.manifest.json`)?.async('string') ?? '{}',
    ) as {
      pack: { version: string; generator: { version: string }; created_at: string };
      world_spec: { path: string; sha256: string };
      receipt: { path: string };
      license: { assets: { id: string; file: string } };
      provenance: ReturnType<typeof generationReceiptManifestProjection>;
      files: PackFileRecord[];
    };
    const receipt = JSON.parse(
      await zip.file(`${root}${manifest.receipt.path}`)?.async('string') ?? '{}',
    ) as GenerationReceipt;

    expect(manifest.pack).toMatchObject({
      version: '0.1.0-alpha.3',
      generator: { version: '0.1.0-alpha.3' },
      created_at: receipt.created_at,
    });
    expect(receipt.schema_version).toBe('0.2.0');
    expect(manifest.world_spec).toEqual(receipt.world.input_spec);
    expect(manifest.license.assets).toEqual({
      id: receipt.licensing.output.id,
      file: receipt.licensing.output.notice_path,
    });
    expect(manifest.provenance).toEqual(generationReceiptManifestProjection(receipt));
    expect(validateGenerationReceipt(receipt, {
      world: run.world,
      inputSpec: manifest.world_spec,
      createdAt: run.evidence.createdAt,
      provider: receipt.provider,
      outputLicense: { id: 'CC0-1.0', noticePath: 'license-assets.md' },
      manifestProvenance: manifest.provenance,
      files: manifest.files,
    })).toEqual([]);

    const manifestPaths = [...manifest.files.map(({ path }) => path)].sort();
    const payloadPaths = fileNames
      .map((path) => path.slice(root.length))
      .filter((path) => path !== 'mapsoo.manifest.json')
      .sort();
    expect(manifestPaths).toEqual(payloadPaths);
    for (const record of manifest.files) {
      const bytes = await zip.file(`${root}${record.path}`)?.async('uint8array');
      expect(bytes, record.path).toBeDefined();
      expect(bytes?.byteLength, record.path).toBe(record.bytes);
      expect(await sha256(bytes ?? new Uint8Array()), record.path).toBe(record.sha256);
    }
  });

  it('emits byte-identical ZIPs for the same trusted run', async () => {
    const run = await buildRun();
    const first = new Uint8Array(await (await buildAlpha3PortablePack(run)).blob.arrayBuffer());
    const second = new Uint8Array(await (await buildAlpha3PortablePack(run)).blob.arrayBuffer());

    expect(await sha256(first)).toBe(await sha256(second));
    expect(first).toEqual(second);
  });

  it('preserves alpha.3 after the current package advances to alpha.5', async () => {
    const run = await buildRun();
    expect(packageJson.version).toBe('0.1.0-alpha.5');
    expect(CURRENT_PACK_VERSION).toBe(packageJson.version);
    expect(buildCurrentPortablePack).not.toBe(buildAlpha3PortablePack);
    expect((await buildPortablePack(run)).filename).toBe('mapsoo-sunny-meadow-v0.1.0-alpha.1.zip');
    expect((await buildAlpha3PortablePack(run)).filename).toBe('mapsoo-sunny-meadow-v0.1.0-alpha.3.zip');
  });

  it('rejects untrusted and AI runs before creating any Canvas or ZIP payload', async () => {
    await expect(buildAlpha3PortablePack(
      generateWorld(DEFAULT_WORLD_SPEC) as unknown as GenerationRunResult,
    )).rejects.toThrow('evidence.untrusted-run');
    expect(createElement).not.toHaveBeenCalled();

    const trusted = await buildRun();
    await expect(buildAlpha3PortablePack({ ...trusted })).rejects.toThrow('evidence.untrusted-run');
    expect(createElement).not.toHaveBeenCalled();

    const aiProvider: GeneratorProvider = {
      id: 'future-ai-provider',
      version: '1.0.0',
      displayName: 'Future AI Provider',
      capabilities: {
        ...PROCEDURAL_PIXEL_PROVIDER.capabilities,
        execution: 'remote',
        determinism: 'best-effort',
        requiresCredentials: true,
        outputProvenance: 'generative-ai',
      },
      async generate(spec) {
        const world = generateWorld(spec);
        world.generator = { id: 'future-ai-provider', version: '1.0.0' };
        return {
          world,
          claims: {
            model: { provider: 'Example AI', id: 'image-model-v1', revision: '2026-07-01' },
            workflow: {
              id: 'future-ai-workflow',
              version: '1.0.0',
              definition_sha256: 'd'.repeat(64),
            },
            transformations: [{ id: 'model-image-generation', version: '1.0.0' }],
            disclosureStatement: 'Generated by Example AI from a versioned workflow.',
            providerTerms: { url: 'https://example.com/terms', version: '2026-07' },
            sources: [],
          },
        };
      },
    };
    const aiRun = await runGenerationProviderWithEvidence(aiProvider, DEFAULT_WORLD_SPEC);
    await expect(buildAlpha3PortablePack(aiRun)).rejects.toThrow('procedural-pixel-v1@0.1.0');
    expect(createElement).not.toHaveBeenCalled();
  });
});
