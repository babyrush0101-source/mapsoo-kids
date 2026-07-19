import { describe, expect, it } from 'vitest';
import packSchema from '../../schemas/mapsoo-pack-0.4.schema.json';
import placesSchema from '../../schemas/mapsoo-places-0.2.schema.json';
import structuresSchema from '../../schemas/mapsoo-structures-0.1.schema.json';
import worldSchema from '../../schemas/mapsoo-world-0.3.schema.json';
import { PROCEDURAL_TERRAIN_PROVIDER } from '../providers/procedural-terrain-provider';
import { runGenerationProviderWithEvidence } from './generation-provider';
import {
  ALPHA6_PLACES_ATLAS_PATH,
  ALPHA6_PLACES_PATH,
  ALPHA6_PLACES_SCHEMA_PATH,
  ALPHA6_STRUCTURES_ATLAS_PATH,
  ALPHA6_STRUCTURES_PATH,
  ALPHA6_STRUCTURES_SCHEMA_PATH,
  buildAlpha6PackManifest,
  buildAlpha6PlacesSidecar,
  buildAlpha6StructuresSidecar,
} from './pack-manifest-alpha6';
import { projectTrustedGenerationReceipt } from './trusted-generation-receipt';
import { ALPHA6_DEFAULT_WORLD_SPEC, cloneWorldSpec, type WorldSpecV030 } from './world-spec';

const HASH = 'a'.repeat(64);
const WORLD_PATH = 'worlds/sunny-meadow.world.json';

async function sha256(bytes: Uint8Array): Promise<string> {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function inputs(spec: WorldSpecV030 = cloneWorldSpec(ALPHA6_DEFAULT_WORLD_SPEC) as WorldSpecV030) {
  const run = await runGenerationProviderWithEvidence(PROCEDURAL_TERRAIN_PROVIDER, spec, {
    now: () => new Date('2026-07-19T10:00:00.000Z'),
  });
  const receipt = projectTrustedGenerationReceipt(run, { path: WORLD_PATH, sha256: HASH });
  const receiptBytes = new TextEncoder().encode(`${JSON.stringify(receipt, null, 2)}\n`);
  const places = buildAlpha6PlacesSidecar(run, { path: WORLD_PATH, sha256: HASH });
  const placesBytes = new TextEncoder().encode(`${JSON.stringify(places, null, 2)}\n`);
  const placesHash = await sha256(placesBytes);
  const structures = buildAlpha6StructuresSidecar(run, { path: WORLD_PATH, sha256: HASH }, {
    path: ALPHA6_PLACES_PATH, sha256: placesHash,
  });
  const structuresBytes = new TextEncoder().encode(`${JSON.stringify(structures, null, 2)}\n`);
  const paths = [
    'readme.md', 'license-assets.md', 'generation-receipt.json', WORLD_PATH, 'worlds/demo-world.json',
    'atlases/terrain.png', 'atlases/props.png', ALPHA6_PLACES_ATLAS_PATH, ALPHA6_STRUCTURES_ATLAS_PATH,
    'previews/map-preview.png', ALPHA6_PLACES_PATH, ALPHA6_STRUCTURES_PATH,
    'schema/mapsoo-pack-0.4.schema.json', 'schema/mapsoo-world-0.3.schema.json',
    ALPHA6_PLACES_SCHEMA_PATH, ALPHA6_STRUCTURES_SCHEMA_PATH, 'schema/mapsoo-generation-receipt.schema.json',
  ];
  const files = await Promise.all(paths.map(async (path) => {
    const bytes = path === 'generation-receipt.json' ? receiptBytes
      : path === ALPHA6_PLACES_PATH ? placesBytes
        : path === ALPHA6_STRUCTURES_PATH ? structuresBytes : undefined;
    return {
      path,
      media_type: path.endsWith('.json') ? 'application/json' : path.endsWith('.md') ? 'text/markdown' : 'image/png',
      bytes: bytes?.byteLength ?? 1,
      sha256: bytes ? await sha256(bytes) : HASH,
    };
  }));
  return { run, receiptBytes, places, placesBytes, structures, structuresBytes, files };
}

describe('alpha.6 place-linked structures pack manifest', () => {
  it('pins exact 17-file payload and cross-bound sidecars', async () => {
    const input = await inputs();
    const manifest = await buildAlpha6PackManifest(input);
    expect(manifest.schema_version).toBe('0.4.0');
    expect(manifest.pack.version).toBe('0.1.0-alpha.6');
    expect(manifest.compatibility.importer.min_version).toBe('0.1.0-alpha.6');
    expect(manifest.files).toHaveLength(17);
    expect(manifest.sprites).toHaveLength(16);
    expect(manifest.runtime.places).toMatchObject({ path: ALPHA6_PLACES_PATH, schema: { path: ALPHA6_PLACES_SCHEMA_PATH } });
    expect(manifest.runtime.structures).toMatchObject({ path: ALPHA6_STRUCTURES_PATH, schema: { path: ALPHA6_STRUCTURES_SCHEMA_PATH } });
    expect(input.places).toMatchObject({ schema_version: '0.2.0', pack: { version: '0.1.0-alpha.6' } });
    expect(input.structures).toMatchObject({
      schema_version: '0.1.0', pack: { version: '0.1.0-alpha.6' },
      places: { path: ALPHA6_PLACES_PATH, sha256: await sha256(input.placesBytes) },
      atlas: { path: ALPHA6_STRUCTURES_ATLAS_PATH, sprite_size_px: [64, 64], pivot_px: [32, 64] },
    });
    expect(input.structures.structures.map(({ id, place_id, sprite_id, region_px }) => ({ id, place_id, sprite_id, region_px }))).toEqual([
      { id: 'spawn-cottage', place_id: 'spawn', sprite_id: 'structure-cottage-01', region_px: [0, 0, 64, 64] },
      { id: 'landmark-shrine', place_id: 'landmark', sprite_id: 'structure-shrine-01', region_px: [192, 0, 64, 64] },
    ]);
  });

  it('exports an empty structures projection without inference', async () => {
    const { structures: _authoredStructures, ...spec } = cloneWorldSpec(ALPHA6_DEFAULT_WORLD_SPEC) as WorldSpecV030;
    const input = await inputs(spec as WorldSpecV030);
    expect(input.structures.structures).toEqual([]);
    await expect(buildAlpha6PackManifest(input)).resolves.toMatchObject({ schema_version: '0.4.0' });
  });

  it('fails closed on non-canonical or cross-binding drift', async () => {
    const input = await inputs();
    const nonCanonical = new TextEncoder().encode(JSON.stringify(input.structures));
    const files = structuredClone(input.files);
    const record = files.find(({ path }) => path === ALPHA6_STRUCTURES_PATH)!;
    record.bytes = nonCanonical.byteLength;
    record.sha256 = await sha256(nonCanonical);
    await expect(buildAlpha6PackManifest({ ...input, structuresBytes: nonCanonical, files }))
      .rejects.toThrow('not the canonical serialization');

    const changed = structuredClone(input.structures) as unknown as { places: { sha256: string } };
    changed.places.sha256 = 'f'.repeat(64);
    const changedBytes = new TextEncoder().encode(`${JSON.stringify(changed, null, 2)}\n`);
    const changedFiles = structuredClone(input.files);
    const changedRecord = changedFiles.find(({ path }) => path === ALPHA6_STRUCTURES_PATH)!;
    changedRecord.bytes = changedBytes.byteLength;
    changedRecord.sha256 = await sha256(changedBytes);
    await expect(buildAlpha6PackManifest({ ...input, structuresBytes: changedBytes, files: changedFiles }))
      .rejects.toThrow('not an exact projection');

    await expect(buildAlpha6PackManifest({ ...input, files: input.files.slice(1) })).rejects.toThrow('exact 17-file');
  });

  it('ships mutually aligned immutable schema versions', () => {
    expect(packSchema.properties.schema_version.const).toBe('0.4.0');
    expect(packSchema.$defs.placesRuntime).toEqual(expect.objectContaining({ allOf: expect.any(Array) }));
    expect(JSON.stringify(packSchema)).toContain(ALPHA6_PLACES_SCHEMA_PATH);
    expect(JSON.stringify(packSchema)).toContain(ALPHA6_STRUCTURES_SCHEMA_PATH);
    expect(placesSchema.properties.schema_version.const).toBe('0.2.0');
    expect(placesSchema.properties.pack.properties.version.const).toBe('0.1.0-alpha.6');
    expect(structuresSchema.properties.structures.minItems).toBe(0);
    expect(worldSchema.properties.schemaVersion.const).toBe('0.3.0');
  });
});
