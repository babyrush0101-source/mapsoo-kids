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
import { DEFAULT_WORLD_SPEC } from '../core/world-spec';
import { PROCEDURAL_PIXEL_PROVIDER } from '../providers/procedural-pixel-provider';
import { PROCEDURAL_TERRAIN_PROVIDER } from '../providers/procedural-terrain-provider';
import { buildAlpha4PortablePack } from './export-browser-pack-alpha4';
import packageJson from '../../package.json';
import { buildCurrentPortablePack, CURRENT_PACK_VERSION } from './export-current-pack';

class CanvasStub {
  width = 0;
  height = 0;

  private readonly context = {
    fillStyle: '',
    globalAlpha: 1,
    imageSmoothingEnabled: false,
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
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
  return runGenerationProviderWithEvidence(PROCEDURAL_TERRAIN_PROVIDER, DEFAULT_WORLD_SPEC, {
    now: () => new Date('2026-07-19T00:00:00.000Z'),
  });
}

describe('alpha.4 playable terrain browser pack', () => {
  let createElement: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createElement = vi.fn(() => new CanvasStub());
    vi.stubGlobal('document', { createElement });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('ships an exact schema-0.2 layered payload with 35 tiles and 6 prop sprites', async () => {
    const run = await buildRun();
    const pack = await buildAlpha4PortablePack(run);
    const zip = await JSZip.loadAsync(await pack.blob.arrayBuffer());
    const root = 'mapsoo-sunny-meadow-v0.1.0-alpha.4/';
    const fileNames = Object.keys(zip.files);

    expect(pack.filename).toBe('mapsoo-sunny-meadow-v0.1.0-alpha.4.zip');
    expect(fileNames).toHaveLength(12);
    expect(Object.values(zip.files).every(({ dir }) => !dir)).toBe(true);
    expect(fileNames.every((path) => path.startsWith(root))).toBe(true);
    expect(fileNames).toEqual(expect.arrayContaining([
      `${root}mapsoo.manifest.json`,
      `${root}generation-receipt.json`,
      `${root}schema/mapsoo-pack-0.2.schema.json`,
      `${root}worlds/demo-world.json`,
      `${root}atlases/terrain.png`,
      `${root}atlases/props.png`,
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
      layers: Array<{ id: string }>;
      terrain_sets: Array<{ id: string }>;
      physics_layers: Array<{ id: string }>;
      atlases: Array<{ tiles: unknown[] }>;
      sprites: unknown[];
      license: { assets: { id: string; file: string } };
      provenance: ReturnType<typeof generationReceiptManifestProjection>;
      files: PackFileRecord[];
    };
    const demo = JSON.parse(
      await zip.file(`${root}worlds/demo-world.json`)?.async('string') ?? '{}',
    ) as { schema_version: string; width: number; height: number; layers: Array<{ id: string; cells: number[] }> };
    const receipt = JSON.parse(
      await zip.file(`${root}${manifest.receipt.path}`)?.async('string') ?? '{}',
    ) as GenerationReceipt;

    expect(manifest.schema_version).toBe('0.2.0');
    expect(manifest.pack).toMatchObject({
      version: '0.1.0-alpha.4',
      generator: { version: '0.1.0-alpha.4' },
      created_at: receipt.created_at,
    });
    expect(manifest.layers.map(({ id }) => id)).toEqual(['ground', 'water', 'roads', 'props']);
    expect(manifest.terrain_sets.map(({ id }) => id)).toEqual(['water', 'roads']);
    expect(manifest.physics_layers).toEqual([{ id: 'world-blocking', collision_layer: 1, collision_mask: 1 }]);
    expect(manifest.atlases[0]?.tiles).toHaveLength(35);
    expect(manifest.sprites).toHaveLength(6);
    expect(demo.schema_version).toBe('0.2.0');
    expect(demo.layers.map(({ id }) => id)).toEqual(['ground', 'water', 'roads']);
    expect(demo.layers.every(({ cells }) => cells.length === demo.width * demo.height)).toBe(true);
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
    const first = new Uint8Array(await (await buildAlpha4PortablePack(run)).blob.arrayBuffer());
    const second = new Uint8Array(await (await buildAlpha4PortablePack(run)).blob.arrayBuffer());
    expect(first).toEqual(second);
    expect(await sha256(first)).toBe(await sha256(second));
  });

  it('binds the candidate package and Workbench export to alpha.4', () => {
    expect(packageJson.version).toBe('0.1.0-alpha.4');
    expect(CURRENT_PACK_VERSION).toBe(packageJson.version);
    expect(buildCurrentPortablePack).toBe(buildAlpha4PortablePack);
  });

  it('rejects untrusted and legacy-provider runs before creating Canvas payloads', async () => {
    const legacyRun = await runGenerationProviderWithEvidence(
      PROCEDURAL_PIXEL_PROVIDER,
      DEFAULT_WORLD_SPEC,
    );
    await expect(buildAlpha4PortablePack(legacyRun)).rejects.toThrow('procedural-terrain-v2@0.2.0');
    expect(createElement).not.toHaveBeenCalled();

    const trusted = await buildRun();
    await expect(buildAlpha4PortablePack({ ...trusted })).rejects.toThrow('evidence.untrusted-run');
    expect(createElement).not.toHaveBeenCalled();
  });
});
