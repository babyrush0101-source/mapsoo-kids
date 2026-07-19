import JSZip from 'jszip';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WORLD_EXAMPLES } from '../app/world-example-registry';
import { runGenerationProviderWithEvidence } from '../core/generation-provider';
import {
  ALPHA7_PACK_VERSION,
  ALPHA7_PLACES_SCHEMA_PATH,
  ALPHA7_STRUCTURES_SCHEMA_PATH,
} from '../core/pack-manifest-alpha7';
import { PROCEDURAL_TERRAIN_PROVIDER } from '../providers/procedural-terrain-provider';
import { buildAlpha7PortablePack } from './export-browser-pack-alpha7';
import { buildCurrentPortablePack, CURRENT_PACK_VERSION } from './export-current-pack';

class CanvasStub {
  width = 0;
  height = 0;
  private readonly context = {
    fillStyle: '', font: '', globalAlpha: 1, imageSmoothingEnabled: false,
    textAlign: 'left', textBaseline: 'alphabetic', clearRect: vi.fn(), drawImage: vi.fn(),
    fillRect: vi.fn(), fillText: vi.fn(), restore: vi.fn(), save: vi.fn(),
    getImageData: vi.fn((_x: number, _y: number, width: number, height: number) => ({
      data: new Uint8ClampedArray(width * height * 4),
    })),
  };
  getContext(kind: string) { return kind === '2d' ? this.context : null; }
  toBlob(callback: BlobCallback) {
    callback(new Blob([Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' }));
  }
}

async function buildPack(id: typeof WORLD_EXAMPLES[number]['id']) {
  const example = WORLD_EXAMPLES.find((candidate) => candidate.id === id)!;
  const run = await runGenerationProviderWithEvidence(PROCEDURAL_TERRAIN_PROVIDER, example.spec, {
    now: () => new Date('2026-07-19T12:00:00.000Z'),
  });
  return buildAlpha7PortablePack(run);
}

describe('alpha.7 three-world browser exporter', () => {
  beforeEach(() => vi.stubGlobal('document', { createElement: vi.fn(() => new CanvasStub()) }));
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('exports three independent exact-contract ZIPs', async () => {
    const packs = await Promise.all(WORLD_EXAMPLES.map(({ id }) => buildPack(id)));
    expect(packs.map(({ filename }) => filename)).toEqual([
      'mapsoo-sunny-meadow-v0.1.0-alpha.7.zip',
      'mapsoo-dustwind-outpost-v0.1.0-alpha.7.zip',
      'mapsoo-frostwatch-vale-v0.1.0-alpha.7.zip',
    ]);

    for (const [index, pack] of packs.entries()) {
      const id = WORLD_EXAMPLES[index].id;
      const root = `mapsoo-${id}-v${ALPHA7_PACK_VERSION}/`;
      const zip = await JSZip.loadAsync(await pack.blob.arrayBuffer());
      expect(Object.keys(zip.files)).toHaveLength(18);
      expect(Object.values(zip.files).every(({ dir }) => !dir)).toBe(true);
      const manifest = JSON.parse(await zip.file(`${root}mapsoo.manifest.json`)!.async('string')) as {
        schema_version: string;
        pack: { id: string; version: string };
        world_spec: { path: string };
        runtime: { places: { schema: { path: string } }; structures: { schema: { path: string } } };
        files: Array<{ path: string }>;
      };
      expect(manifest).toMatchObject({
        schema_version: '0.5.0',
        pack: { id, version: ALPHA7_PACK_VERSION },
        world_spec: { path: `worlds/${id}.world.json` },
      });
      expect(manifest.runtime.places.schema.path).toBe(ALPHA7_PLACES_SCHEMA_PATH);
      expect(manifest.runtime.structures.schema.path).toBe(ALPHA7_STRUCTURES_SCHEMA_PATH);
      expect(manifest.files).toHaveLength(17);
    }
  });

  it('is byte-identical per world and does not collapse distinct worlds', async () => {
    const first = await Promise.all(WORLD_EXAMPLES.map(({ id }) => buildPack(id)));
    const second = await Promise.all(WORLD_EXAMPLES.map(({ id }) => buildPack(id)));
    const firstBytes = await Promise.all(first.map(async ({ blob }) => new Uint8Array(await blob.arrayBuffer())));
    const secondBytes = await Promise.all(second.map(async ({ blob }) => new Uint8Array(await blob.arrayBuffer())));
    for (const [index, bytes] of firstBytes.entries()) expect(bytes).toEqual(secondBytes[index]);
    expect(new Set(firstBytes.map((bytes) => Array.from(bytes.slice(-64)).join(','))).size).toBe(3);
  });

  it('is the current workbench exporter while the public Alpha.6 record remains separate', () => {
    expect(CURRENT_PACK_VERSION).toBe(ALPHA7_PACK_VERSION);
    expect(buildCurrentPortablePack).toBe(buildAlpha7PortablePack);
  });
});
