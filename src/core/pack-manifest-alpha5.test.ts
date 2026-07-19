import { describe, expect, it } from 'vitest';
import packSchema from '../../schemas/mapsoo-pack-0.3.schema.json';
import placesSchema from '../../schemas/mapsoo-places-0.1.schema.json';
import worldSchema from '../../schemas/mapsoo-world-0.2.schema.json';
import { PROCEDURAL_TERRAIN_PROVIDER } from '../providers/procedural-terrain-provider';
import { runGenerationProviderWithEvidence } from './generation-provider';
import {
  ALPHA5_PLACES_PATH,
  ALPHA5_PLACES_ATLAS_PATH,
  ALPHA5_PLACES_SCHEMA_PATH,
  buildAlpha5PackManifest,
  buildAlpha5PlacesSidecar,
} from './pack-manifest-alpha5';
import { projectTrustedGenerationReceipt } from './trusted-generation-receipt';
import { DEFAULT_WORLD_SPEC } from './world-spec';

const HASH = 'a'.repeat(64);
const WORLD_SPEC_PATH = 'worlds/sunny-meadow.world.json';

async function sha256(bytes: Uint8Array): Promise<string> {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function buildInputs() {
  const run = await runGenerationProviderWithEvidence(PROCEDURAL_TERRAIN_PROVIDER, DEFAULT_WORLD_SPEC, {
    now: () => new Date('2026-07-19T10:00:00.000Z'),
  });
  const receipt = projectTrustedGenerationReceipt(run, { path: WORLD_SPEC_PATH, sha256: HASH });
  const receiptBytes = new TextEncoder().encode(`${JSON.stringify(receipt, null, 2)}\n`);
  const sidecar = buildAlpha5PlacesSidecar(run, { path: WORLD_SPEC_PATH, sha256: HASH });
  const placesBytes = new TextEncoder().encode(`${JSON.stringify(sidecar, null, 2)}\n`);
  const paths = [
    'readme.md',
    'license-assets.md',
    'generation-receipt.json',
    WORLD_SPEC_PATH,
    'worlds/demo-world.json',
    'atlases/terrain.png',
    'atlases/props.png',
    ALPHA5_PLACES_ATLAS_PATH,
    'previews/map-preview.png',
    ALPHA5_PLACES_PATH,
    'schema/mapsoo-pack-0.3.schema.json',
    'schema/mapsoo-world-0.2.schema.json',
    ALPHA5_PLACES_SCHEMA_PATH,
    'schema/mapsoo-generation-receipt.schema.json',
  ];
  const files = await Promise.all(paths.map(async (path) => {
    const bytes = path === 'generation-receipt.json'
      ? receiptBytes
      : path === ALPHA5_PLACES_PATH
        ? placesBytes
        : undefined;
    return {
      path,
      media_type: path.endsWith('.json')
        ? 'application/json'
        : path.endsWith('.md')
          ? 'text/markdown'
          : 'image/png',
      bytes: bytes?.byteLength ?? 1,
      sha256: bytes ? await sha256(bytes) : HASH,
    };
  }));
  return { run, receipt, receiptBytes, sidecar, placesBytes, files };
}

describe('alpha.5 semantic-places pack manifest', () => {
  it('aligns schema targets and trimmed labels with the runtime contract', () => {
    const targets = worldSchema.properties.output.properties.targets;
    expect(targets.minItems).toBe(3);
    expect(targets.maxItems).toBe(3);

    const patterns = [
      worldSchema.$defs.place.properties.label.pattern,
      placesSchema.$defs.resolvedPlace.properties.label.pattern,
    ].map((pattern) => new RegExp(pattern, 'u'));
    for (const pattern of patterns) {
      expect(pattern.test('Riverside Landmark')).toBe(true);
      expect(pattern.test(' Riverside Landmark')).toBe(false);
      expect(pattern.test('Riverside Landmark ')).toBe(false);
      expect(pattern.test('\tRiverside Landmark')).toBe(false);
    }
  });

  it('pins the exact sidecar, its schema, and the alpha.5 importer contract', async () => {
    const input = await buildInputs();
    const manifest = await buildAlpha5PackManifest(input);

    expect(manifest.schema_version).toBe('0.3.0');
    expect(manifest.pack).toMatchObject({
      id: 'sunny-meadow',
      version: '0.1.0-alpha.5',
      generator: { version: '0.1.0-alpha.5' },
      created_at: input.receipt.created_at,
    });
    expect(manifest.compatibility.importer.min_version).toBe('0.1.0-alpha.5');
    expect(manifest.layers.map(({ id }) => id)).toEqual(['ground', 'water', 'roads', 'props']);
    expect(manifest.runtime.places).toEqual({
      path: ALPHA5_PLACES_PATH,
      sha256: await sha256(input.placesBytes),
      schema: { path: ALPHA5_PLACES_SCHEMA_PATH, sha256: HASH },
    });
    expect(manifest.files).toHaveLength(14);
    expect(manifest.sprites).toHaveLength(12);
    expect(manifest.sprites.slice(6).map(({ id, atlas }) => ({ id, atlas }))).toEqual([
      { id: 'place-spawn-01', atlas: ALPHA5_PLACES_ATLAS_PATH },
      { id: 'place-settlement-01', atlas: ALPHA5_PLACES_ATLAS_PATH },
      { id: 'place-landmark-01', atlas: ALPHA5_PLACES_ATLAS_PATH },
      { id: 'place-resource-01', atlas: ALPHA5_PLACES_ATLAS_PATH },
      { id: 'place-encounter-01', atlas: ALPHA5_PLACES_ATLAS_PATH },
      { id: 'place-exit-01', atlas: ALPHA5_PLACES_ATLAS_PATH },
    ]);
    expect(Object.isFrozen(manifest)).toBe(true);
    expect(Object.isFrozen(manifest.runtime.places.schema)).toBe(true);
  });

  it('serializes resolved places with stable order and bounded cell/pixel coordinates', async () => {
    const input = await buildInputs();
    expect(input.sidecar).toMatchObject({
      schema_version: '0.1.0',
      pack: { id: 'sunny-meadow', version: '0.1.0-alpha.5' },
      world_spec: { path: WORLD_SPEC_PATH, sha256: HASH },
      coordinate_space: { origin: 'top-left', unit: 'cell', tile_size: 32 },
      placement_algorithm: { id: 'mapsoo-semantic-place-resolver', version: '0.1.0' },
    });
    expect(input.sidecar.places.map(({ id, order, sprite_id }) => ({ id, order, sprite_id }))).toEqual([
      { id: 'spawn', order: 0, sprite_id: 'place-spawn-01' },
      { id: 'landmark', order: 1, sprite_id: 'place-landmark-01' },
      { id: 'exit', order: 2, sprite_id: 'place-exit-01' },
    ]);
    for (const place of input.sidecar.places) {
      expect(place.cell.x).toBeGreaterThanOrEqual(0);
      expect(place.cell.x).toBeLessThan(input.run.world.spec.map.width);
      expect(place.cell.y).toBeGreaterThanOrEqual(0);
      expect(place.cell.y).toBeLessThan(input.run.world.spec.map.height);
      expect(place.pixel_center).toEqual({
        x: place.cell.x * 32 + 16,
        y: place.cell.y * 32 + 16,
      });
    }
  });

  it('fails closed when sidecar content, bytes, file identity, or payload shape drifts', async () => {
    const input = await buildInputs();
    const changed = JSON.parse(JSON.stringify(input.sidecar)) as {
      places: Array<{
        cell: { x: number };
        pixel_center: { x: number };
        sprite_id: string;
      }>;
    };
    changed.places[0].cell.x += 1;
    changed.places[0].pixel_center.x += 32;
    changed.places[0].sprite_id = 'place-exit-01';
    const changedBytes = new TextEncoder().encode(`${JSON.stringify(changed, null, 2)}\n`);
    const changedFiles = structuredClone(input.files);
    const changedRecord = changedFiles.find(({ path }) => path === ALPHA5_PLACES_PATH);
    if (!changedRecord) throw new Error('test places record missing');
    changedRecord.bytes = changedBytes.byteLength;
    changedRecord.sha256 = await sha256(changedBytes);
    await expect(buildAlpha5PackManifest({ ...input, placesBytes: changedBytes, files: changedFiles }))
      .rejects.toThrow('not an exact projection');

    const nonCanonicalBytes = new TextEncoder().encode(JSON.stringify(input.sidecar));
    const nonCanonicalFiles = structuredClone(input.files);
    const nonCanonicalRecord = nonCanonicalFiles.find(({ path }) => path === ALPHA5_PLACES_PATH);
    if (!nonCanonicalRecord) throw new Error('test places record missing');
    nonCanonicalRecord.bytes = nonCanonicalBytes.byteLength;
    nonCanonicalRecord.sha256 = await sha256(nonCanonicalBytes);
    await expect(buildAlpha5PackManifest({
      ...input,
      placesBytes: nonCanonicalBytes,
      files: nonCanonicalFiles,
    })).rejects.toThrow('not the canonical serialization');

    const badHash = structuredClone(input.files);
    const badRecord = badHash.find(({ path }) => path === ALPHA5_PLACES_PATH);
    if (!badRecord) throw new Error('test places record missing');
    badRecord.sha256 = 'f'.repeat(64);
    await expect(buildAlpha5PackManifest({ ...input, files: badHash }))
      .rejects.toThrow('does not match the shipped sidecar bytes');

    await expect(buildAlpha5PackManifest({ ...input, files: input.files.slice(1) }))
      .rejects.toThrow('exact 14-file');

    await expect(buildAlpha5PackManifest({ ...input, files: [...input.files, input.files[0]] }))
      .rejects.toThrow('Duplicate pack file path');
  });

  it('ships strict versioned schemas for World Spec, sidecar, and pack runtime references', async () => {
    expect(worldSchema).toMatchObject({ additionalProperties: false });
    expect(placesSchema).toMatchObject({ additionalProperties: false });
    expect(packSchema).toMatchObject({ additionalProperties: false });
    expect(JSON.stringify(worldSchema)).toContain('"places"');
    expect(JSON.stringify(placesSchema)).toContain('"pixel_center"');
    expect(JSON.stringify(packSchema)).toContain('"runtime"');
    expect(JSON.stringify(packSchema)).toContain('0.1.0-alpha.5');
  });
});
