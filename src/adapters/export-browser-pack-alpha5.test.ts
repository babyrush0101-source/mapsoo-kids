import JSZip from 'jszip';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GenerationRunResult } from '../core/generation-evidence';
import {
  generationReceiptManifestProjection,
  validateGenerationReceipt,
  type GenerationReceipt,
} from '../core/generation-receipt';
import { runGenerationProviderWithEvidence } from '../core/generation-provider';
import type { PackFileRecord } from '../core/pack-manifest';
import type { Alpha5PlacesSidecar } from '../core/pack-manifest-alpha5';
import { DEFAULT_WORLD_SPEC } from '../core/world-spec';
import { PROCEDURAL_PIXEL_PROVIDER } from '../providers/procedural-pixel-provider';
import { PROCEDURAL_TERRAIN_PROVIDER } from '../providers/procedural-terrain-provider';
import { buildAlpha5PortablePack } from './export-browser-pack-alpha5';

class CanvasStub {
  width = 0;
  height = 0;

  private readonly context = {
    fillStyle: '',
    font: '',
    globalAlpha: 1,
    imageSmoothingEnabled: false,
    textAlign: 'left',
    textBaseline: 'alphabetic',
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    getImageData: vi.fn((_left: number, _top: number, width: number, height: number) => ({
      data: new Uint8ClampedArray(width * height * 4),
    })),
    restore: vi.fn(),
    save: vi.fn(),
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
  return runGenerationProviderWithEvidence(PROCEDURAL_TERRAIN_PROVIDER, DEFAULT_WORLD_SPEC, {
    now: () => new Date('2026-07-19T10:00:00.000Z'),
  });
}

describe('alpha.5 semantic places browser pack', () => {
  let createElement: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createElement = vi.fn(() => new CanvasStub());
    vi.stubGlobal('document', { createElement });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('ships the exact 14-payload contract plus manifest with canonical places bindings', async () => {
    const run = await buildRun();
    const pack = await buildAlpha5PortablePack(run);
    const zip = await JSZip.loadAsync(await pack.blob.arrayBuffer());
    const root = 'mapsoo-sunny-meadow-v0.1.0-alpha.5/';
    const fileNames = Object.keys(zip.files);

    expect(pack.filename).toBe('mapsoo-sunny-meadow-v0.1.0-alpha.5.zip');
    expect(fileNames).toHaveLength(15);
    expect(Object.values(zip.files).every(({ dir }) => !dir)).toBe(true);
    expect(fileNames.every((path) => path.startsWith(root))).toBe(true);
    expect(fileNames).toEqual(expect.arrayContaining([
      `${root}mapsoo.manifest.json`,
      `${root}generation-receipt.json`,
      `${root}runtime/places.json`,
      `${root}schema/mapsoo-pack-0.3.schema.json`,
      `${root}schema/mapsoo-world-0.2.schema.json`,
      `${root}schema/mapsoo-places-0.1.schema.json`,
      `${root}atlases/terrain.png`,
      `${root}atlases/props.png`,
      `${root}atlases/places.png`,
      `${root}previews/map-preview.png`,
    ]));
    expect(fileNames.some((path) => path.endsWith('.gd') || path.includes('/addons/'))).toBe(false);

    const manifest = JSON.parse(
      await zip.file(`${root}mapsoo.manifest.json`)?.async('string') ?? '{}',
    ) as {
      schema_version: string;
      pack: { version: string; generator: { version: string }; created_at: string };
      world_spec: { path: string; sha256: string };
      receipt: { path: string };
      runtime: { places: { path: string; sha256: string; schema: { path: string; sha256: string } } };
      sprites: Array<{ id: string; atlas: string }>;
      license: { assets: { id: string; file: string } };
      provenance: ReturnType<typeof generationReceiptManifestProjection>;
      files: PackFileRecord[];
    };
    const receipt = JSON.parse(
      await zip.file(`${root}${manifest.receipt.path}`)?.async('string') ?? '{}',
    ) as GenerationReceipt;
    const placesBytes = await zip.file(`${root}${manifest.runtime.places.path}`)?.async('uint8array');
    const places = JSON.parse(new TextDecoder().decode(placesBytes)) as Alpha5PlacesSidecar;
    const demoWorld = JSON.parse(
      await zip.file(`${root}worlds/demo-world.json`)?.async('string') ?? '{}',
    ) as { schema_version?: string };

    expect(manifest.schema_version).toBe('0.3.0');
    expect(demoWorld.schema_version).toBe('0.3.0');
    expect(manifest.pack).toMatchObject({
      version: '0.1.0-alpha.5',
      generator: { version: '0.1.0-alpha.5' },
      created_at: receipt.created_at,
    });
    expect(manifest.files).toHaveLength(14);
    expect(manifest.sprites).toHaveLength(12);
    expect(manifest.sprites.slice(6).map(({ id, atlas }) => ({ id, atlas }))).toEqual([
      { id: 'place-spawn-01', atlas: 'atlases/places.png' },
      { id: 'place-settlement-01', atlas: 'atlases/places.png' },
      { id: 'place-landmark-01', atlas: 'atlases/places.png' },
      { id: 'place-resource-01', atlas: 'atlases/places.png' },
      { id: 'place-encounter-01', atlas: 'atlases/places.png' },
      { id: 'place-exit-01', atlas: 'atlases/places.png' },
    ]);
    expect(places).toMatchObject({
      schema_version: '0.1.0',
      pack: { id: 'sunny-meadow', version: '0.1.0-alpha.5' },
      world_spec: manifest.world_spec,
      coordinate_space: { origin: 'top-left', unit: 'cell', tile_size: 32 },
      placement_algorithm: { id: 'mapsoo-semantic-place-resolver', version: '0.1.0' },
    });
    expect(places.places.map(({ id, order, sprite_id }) => ({ id, order, sprite_id }))).toEqual([
      { id: 'spawn', order: 0, sprite_id: 'place-spawn-01' },
      { id: 'landmark', order: 1, sprite_id: 'place-landmark-01' },
      { id: 'exit', order: 2, sprite_id: 'place-exit-01' },
    ]);
    expect(await sha256(placesBytes ?? new Uint8Array())).toBe(manifest.runtime.places.sha256);
    const placesSchema = manifest.files.find(({ path }) => path === manifest.runtime.places.schema.path);
    expect(placesSchema?.sha256).toBe(manifest.runtime.places.schema.sha256);
    expect(receipt.schema_version).toBe('0.2.0');
    expect(manifest.world_spec).toEqual(receipt.world.input_spec);
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
    const first = new Uint8Array(await (await buildAlpha5PortablePack(run)).blob.arrayBuffer());
    const second = new Uint8Array(await (await buildAlpha5PortablePack(run)).blob.arrayBuffer());
    expect(first).toEqual(second);
    expect(await sha256(first)).toBe(await sha256(second));
  });

  it('rejects untrusted and legacy-provider runs before creating Canvas payloads', async () => {
    const legacyRun = await runGenerationProviderWithEvidence(
      PROCEDURAL_PIXEL_PROVIDER,
      DEFAULT_WORLD_SPEC,
    );
    await expect(buildAlpha5PortablePack(legacyRun)).rejects.toThrow('procedural-terrain-v2@0.2.0');
    expect(createElement).not.toHaveBeenCalled();

    const trusted = await buildRun();
    await expect(buildAlpha5PortablePack({ ...trusted })).rejects.toThrow('evidence.untrusted-run');
    expect(createElement).not.toHaveBeenCalled();
  });
});
