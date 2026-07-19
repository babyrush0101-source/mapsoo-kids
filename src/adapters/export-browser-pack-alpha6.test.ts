import JSZip from 'jszip';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runGenerationProviderWithEvidence } from '../core/generation-provider';
import type { PackFileRecord } from '../core/pack-manifest';
import type { Alpha6StructuresSidecar } from '../core/pack-manifest-alpha6';
import { ALPHA6_DEFAULT_WORLD_SPEC } from '../core/world-spec';
import { PROCEDURAL_TERRAIN_PROVIDER } from '../providers/procedural-terrain-provider';
import { buildAlpha6PortablePack } from './export-browser-pack-alpha6';

class CanvasStub {
  width = 0;
  height = 0;
  private readonly context = {
    fillStyle: '', font: '', globalAlpha: 1, imageSmoothingEnabled: false,
    textAlign: 'left', textBaseline: 'alphabetic', clearRect: vi.fn(), drawImage: vi.fn(),
    fillRect: vi.fn(), fillText: vi.fn(), restore: vi.fn(), save: vi.fn(),
    getImageData: vi.fn((_x: number, _y: number, width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) })),
  };
  getContext(kind: string) { return kind === '2d' ? this.context : null; }
  toBlob(callback: BlobCallback) { callback(new Blob([Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' })); }
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

describe('alpha.6 semantic structures browser pack', () => {
  beforeEach(() => vi.stubGlobal('document', { createElement: vi.fn(() => new CanvasStub()) }));
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('ships exact canonical payload with world/places/structures hash bindings', async () => {
    const run = await runGenerationProviderWithEvidence(PROCEDURAL_TERRAIN_PROVIDER, ALPHA6_DEFAULT_WORLD_SPEC, {
      now: () => new Date('2026-07-19T10:00:00.000Z'),
    });
    const pack = await buildAlpha6PortablePack(run);
    const zip = await JSZip.loadAsync(await pack.blob.arrayBuffer());
    const root = 'mapsoo-sunny-meadow-v0.1.0-alpha.6/';
    const paths = Object.keys(zip.files);
    expect(pack.filename).toBe('mapsoo-sunny-meadow-v0.1.0-alpha.6.zip');
    expect(paths).toHaveLength(18);
    expect(Object.values(zip.files).every(({ dir }) => !dir)).toBe(true);
    expect(paths).toEqual(expect.arrayContaining([
      `${root}mapsoo.manifest.json`, `${root}runtime/places.json`, `${root}runtime/structures.json`,
      `${root}atlases/structures.png`, `${root}schema/mapsoo-pack-0.4.schema.json`,
      `${root}schema/mapsoo-world-0.3.schema.json`, `${root}schema/mapsoo-places-0.2.schema.json`,
      `${root}schema/mapsoo-structures-0.1.schema.json`,
    ]));
    const manifest = JSON.parse(await zip.file(`${root}mapsoo.manifest.json`)!.async('string')) as {
      schema_version: string; world_spec: { path: string; sha256: string };
      runtime: { places: { path: string; sha256: string }; structures: { path: string; sha256: string } };
      files: PackFileRecord[]; sprites: Array<{ id: string; atlas: string }>;
    };
    const placesBytes = await zip.file(`${root}${manifest.runtime.places.path}`)!.async('uint8array');
    const structuresBytes = await zip.file(`${root}${manifest.runtime.structures.path}`)!.async('uint8array');
    const structures = JSON.parse(new TextDecoder().decode(structuresBytes)) as Alpha6StructuresSidecar;
    expect(manifest.schema_version).toBe('0.4.0');
    expect(manifest.files).toHaveLength(17);
    expect(manifest.sprites.slice(-4).map(({ id }) => id)).toEqual([
      'structure-cottage-01', 'structure-workshop-01', 'structure-tower-01', 'structure-shrine-01',
    ]);
    expect(await sha256(placesBytes)).toBe(manifest.runtime.places.sha256);
    expect(await sha256(structuresBytes)).toBe(manifest.runtime.structures.sha256);
    expect(structures.world_spec).toEqual(manifest.world_spec);
    expect(structures.places).toEqual({ path: manifest.runtime.places.path, sha256: manifest.runtime.places.sha256 });
    const payloadPaths = paths.map((path) => path.slice(root.length)).filter((path) => path !== 'mapsoo.manifest.json').sort();
    expect(manifest.files.map(({ path }) => path).sort()).toEqual(payloadPaths);
    for (const record of manifest.files) {
      const bytes = await zip.file(`${root}${record.path}`)!.async('uint8array');
      expect(bytes.byteLength, record.path).toBe(record.bytes);
      expect(await sha256(bytes), record.path).toBe(record.sha256);
    }
  });

  it('emits byte-identical ZIPs for one trusted run', async () => {
    const run = await runGenerationProviderWithEvidence(PROCEDURAL_TERRAIN_PROVIDER, ALPHA6_DEFAULT_WORLD_SPEC, {
      now: () => new Date('2026-07-19T10:00:00.000Z'),
    });
    const first = new Uint8Array(await (await buildAlpha6PortablePack(run)).blob.arrayBuffer());
    const second = new Uint8Array(await (await buildAlpha6PortablePack(run)).blob.arrayBuffer());
    expect(first).toEqual(second);
  });
});
