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
import { buildPortablePack } from './export-browser-pack';
import { buildAlpha2PortablePack } from './export-browser-pack-alpha2';

const PNG_FIXTURE = Uint8Array.from([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
  0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
  0, 0, 0, 13, 73, 68, 65, 84, 8, 215, 99, 248, 207, 192, 240, 31,
  0, 5, 0, 1, 255, 137, 153, 61, 29, 0, 0, 0, 0, 73, 69, 78, 68,
  174, 66, 96, 130,
]);

class CanvasStub {
  width = 0;
  height = 0;

  private readonly context = {
    fillStyle: '',
    globalAlpha: 1,
    imageSmoothingEnabled: false,
    clearRect: vi.fn(),
    fillRect: vi.fn(),
  };

  getContext(kind: string) {
    return kind === '2d' ? this.context : null;
  }

  toBlob(callback: BlobCallback) {
    callback(new Blob([PNG_FIXTURE], { type: 'image/png' }));
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

describe('alpha.2 browser pack foundation', () => {
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
    const pack = await buildAlpha2PortablePack(run);
    const zip = await JSZip.loadAsync(await pack.blob.arrayBuffer());
    const root = 'mapsoo-sunny-meadow-v0.1.0-alpha.2/';
    const fileNames = Object.keys(zip.files).filter((path) => !zip.files[path].dir);

    expect(pack.filename).toBe('mapsoo-sunny-meadow-v0.1.0-alpha.2.zip');
    expect(fileNames).toHaveLength(12);
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
      version: '0.1.0-alpha.2',
      generator: { version: '0.1.0-alpha.2' },
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

  it('keeps the current public download builder on frozen alpha.1', async () => {
    const run = await buildRun();
    expect((await buildPortablePack(run)).filename).toBe('mapsoo-sunny-meadow-v0.1.0-alpha.1.zip');
    expect((await buildAlpha2PortablePack(run)).filename).toBe('mapsoo-sunny-meadow-v0.1.0-alpha.2.zip');
  });

  it('rejects untrusted and AI runs before creating any Canvas or ZIP payload', async () => {
    await expect(buildAlpha2PortablePack(
      generateWorld(DEFAULT_WORLD_SPEC) as unknown as GenerationRunResult,
    )).rejects.toThrow('evidence.untrusted-run');
    expect(createElement).not.toHaveBeenCalled();

    const trusted = await buildRun();
    await expect(buildAlpha2PortablePack({ ...trusted })).rejects.toThrow('evidence.untrusted-run');
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
    await expect(buildAlpha2PortablePack(aiRun)).rejects.toThrow('procedural-pixel-v1@0.1.0');
    expect(createElement).not.toHaveBeenCalled();
  });
});
