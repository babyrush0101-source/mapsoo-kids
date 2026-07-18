import JSZip from 'jszip';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateWorld } from '../core/generate-world';
import { DEFAULT_WORLD_SPEC } from '../core/world-spec';
import { buildPortablePack, revokeObjectUrlLater } from './export-browser-pack';

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
    const pack = await buildPortablePack(generateWorld(DEFAULT_WORLD_SPEC));
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

    const schemaText = await zip.file(`${root}schema/mapsoo-pack.schema.json`)?.async('string');
    const schema = JSON.parse(schemaText ?? '{}') as { required?: string[] };
    expect(schema.required).toEqual(expect.arrayContaining(['world_spec', 'demo', 'layers', 'receipt']));
  });

  it('escapes an imported title before writing the pack README', async () => {
    const spec = structuredClone(DEFAULT_WORLD_SPEC);
    spec.title = '<script>alert(1)</script> # *unsafe*';
    const pack = await buildPortablePack(generateWorld(spec));
    const zip = await JSZip.loadAsync(await pack.blob.arrayBuffer());
    const readme = await zip.file('mapsoo-sunny-meadow-v0.1.0-alpha.1/readme.md')?.async('string');

    expect(readme).not.toContain('<script>');
    expect(readme).toContain('&lt;script&gt;alert\\(1\\)&lt;/script&gt; \\# \\*unsafe\\*');
  });

  it('blocks non-procedural providers until a truthful provider receipt exists', async () => {
    const world = generateWorld(DEFAULT_WORLD_SPEC);
    world.generator = { id: 'future-ai-provider', version: '1.0.0' };

    await expect(buildPortablePack(world)).rejects.toThrow(
      'v0.1 portable export supports only procedural-pixel-v1@0.1.0',
    );
  });
});
