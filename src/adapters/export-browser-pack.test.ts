import JSZip from 'jszip';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateWorld } from '../core/generate-world';
import { createGenerationRun, type GenerationRunResult } from '../core/generation-evidence';
import { runGenerationProviderWithEvidence, type GeneratorProvider } from '../core/generation-provider';
import { DEFAULT_WORLD_SPEC, type WorldSpec } from '../core/world-spec';
import { PROCEDURAL_PIXEL_PROVIDER } from '../providers/procedural-pixel-provider';
import { assertLegacyAlpha1Evidence, buildPortablePack, revokeObjectUrlLater } from './export-browser-pack';

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

async function buildRun(spec: WorldSpec = DEFAULT_WORLD_SPEC): Promise<GenerationRunResult> {
  return runGenerationProviderWithEvidence(PROCEDURAL_PIXEL_PROVIDER, spec, {
    now: () => new Date('2026-07-18T18:30:00.000Z'),
  });
}

describe('portable pack browser download', () => {
  beforeEach(() => {
    vi.stubGlobal('document', { createElement: () => new CanvasStub() });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('revokes object URLs on a later task', () => {
    vi.useFakeTimers();
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    revokeObjectUrlLater('blob:mapsoo-test');

    expect(revoke).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith('blob:mapsoo-test');
  });

  it('assembles a single-root ZIP with a self-consistent portable manifest', async () => {
    const run = await buildRun();
    const pack = await buildPortablePack(run);
    const zip = await JSZip.loadAsync(await pack.blob.arrayBuffer());
    const fileNames = Object.keys(zip.files).filter((path) => !zip.files[path].dir);
    const root = 'mapsoo-sunny-meadow-v0.1.0-alpha.1/';

    expect(pack.filename).toBe('mapsoo-sunny-meadow-v0.1.0-alpha.1.zip');
    expect(fileNames.every((path) => path.startsWith(root))).toBe(true);
    expect(fileNames).toEqual(expect.arrayContaining([
      `${root}mapsoo.manifest.json`,
      `${root}worlds/sunny-meadow.world.json`,
      `${root}worlds/demo-world.json`,
      `${root}atlases/terrain.png`,
      `${root}atlases/props.png`,
      `${root}previews/map-preview.png`,
    ]));
    expect(fileNames.some((path) => path.endsWith('.gd') || path.includes('/addons/'))).toBe(false);

    const manifestText = await zip.file(`${root}mapsoo.manifest.json`)?.async('string');
    expect(manifestText).toBeDefined();
    const manifest = JSON.parse(manifestText ?? '{}') as {
      world_spec: { path: string; sha256: string };
      layers: Array<{ id: string; path: string }>;
      files: Array<{ path: string; sha256: string }>;
      compatibility: { importer: { id: string; min_version: string; source: string } };
      license: { assets: { id: string; file: string } };
      pack: { created_at: string };
    };
    const worldRecord = manifest.files.find((file) => file.path === manifest.world_spec.path);

    expect(worldRecord?.sha256).toBe(manifest.world_spec.sha256);
    expect(manifest.layers.map((layer) => layer.id)).toEqual(['ground', 'props']);
    expect(manifest.layers.every((layer) => manifest.files.some((file) => file.path === layer.path))).toBe(true);
    expect(manifest.license).toEqual({
      assets: { id: 'CC0-1.0', file: 'license-assets.md' },
    });
    expect(manifest.compatibility.importer).toEqual({
      id: 'mapsoo_importer',
      min_version: '0.1.0-alpha.1',
      source: 'https://github.com/babyrush0101-source/mapsoo-kids',
    });
    expect(manifest.pack.created_at).toBe(run.evidence.createdAt);

    const schemaText = await zip.file(`${root}schema/mapsoo-pack.schema.json`)?.async('string');
    const schema = JSON.parse(schemaText ?? '{}') as { required?: string[] };
    expect(schema.required).toEqual(expect.arrayContaining(['world_spec', 'demo', 'layers', 'receipt']));
  });

  it('escapes an imported title before writing the pack README', async () => {
    const spec = structuredClone(DEFAULT_WORLD_SPEC);
    spec.title = '<script>alert(1)</script> # *unsafe*';
    const pack = await buildPortablePack(await buildRun(spec));
    const zip = await JSZip.loadAsync(await pack.blob.arrayBuffer());
    const readme = await zip.file('mapsoo-sunny-meadow-v0.1.0-alpha.1/readme.md')?.async('string');

    expect(readme).not.toContain('<script>');
    expect(readme).toContain('&lt;script&gt;alert\\(1\\)&lt;/script&gt; \\# \\*unsafe\\*');
  });

  it('rejects bare worlds and blocks trusted non-procedural runs from the legacy exporter', async () => {
    await expect(
      buildPortablePack(generateWorld(DEFAULT_WORLD_SPEC) as unknown as GenerationRunResult),
    ).rejects.toThrow('evidence.untrusted-run');

    const trustedBuiltinRun = await buildRun();
    const directlyBuilt = createGenerationRun({
      world: trustedBuiltinRun.world,
      requestSpec: trustedBuiltinRun.world.spec,
      provider: trustedBuiltinRun.evidence.provider,
      claims: {
        model: trustedBuiltinRun.evidence.model,
        workflow: trustedBuiltinRun.evidence.workflow,
        transformations: trustedBuiltinRun.evidence.transformations,
        disclosureStatement: trustedBuiltinRun.evidence.aiDisclosure.statement,
        providerTerms: trustedBuiltinRun.evidence.providerTerms,
        sources: trustedBuiltinRun.evidence.sources,
      },
      createdAt: trustedBuiltinRun.evidence.createdAt,
    });
    await expect(buildPortablePack(directlyBuilt)).rejects.toThrow('evidence.untrusted-run');

    const mismatchedEvidence = {
      ...trustedBuiltinRun,
      evidence: {
        ...trustedBuiltinRun.evidence,
        transformations: [{ id: 'different-transform', version: '1.0.0' }],
      },
    } as GenerationRunResult;
    expect(() => assertLegacyAlpha1Evidence(mismatchedEvidence)).toThrow('exact runner-verified');

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

    await expect(buildPortablePack(aiRun)).rejects.toThrow(
      'v0.1 portable export supports only procedural-pixel-v1@0.1.0',
    );
  });
});
