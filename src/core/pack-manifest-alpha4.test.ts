import { describe, expect, it } from 'vitest';
import { PROCEDURAL_TERRAIN_PROVIDER } from '../providers/procedural-terrain-provider';
import { PROCEDURAL_PIXEL_PROVIDER } from '../providers/procedural-pixel-provider';
import { runGenerationProviderWithEvidence } from './generation-provider';
import { generationReceiptManifestProjection } from './generation-receipt';
import { buildAlpha4PackManifest } from './pack-manifest-alpha4';
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
    now: () => new Date('2026-07-19T08:00:00.000Z'),
  });
  const receipt = projectTrustedGenerationReceipt(run, { path: WORLD_SPEC_PATH, sha256: HASH });
  const receiptBytes = new TextEncoder().encode(`${JSON.stringify(receipt, null, 2)}\n`);
  const files = [
    'readme.md',
    'license-assets.md',
    'generation-receipt.json',
    WORLD_SPEC_PATH,
    'worlds/demo-world.json',
    'atlases/terrain.png',
    'atlases/props.png',
    'previews/map-preview.png',
    'schema/mapsoo-pack-0.2.schema.json',
    'schema/mapsoo-world.schema.json',
    'schema/mapsoo-generation-receipt.schema.json',
  ].map((path) => ({
    path,
    media_type: path.endsWith('.json')
      ? 'application/json'
      : path.endsWith('.md')
        ? 'text/markdown'
        : 'image/png',
    bytes: path === 'generation-receipt.json' ? receiptBytes.byteLength : 1,
    sha256: path === 'generation-receipt.json' ? '' : HASH,
  }));
  const receiptRecord = files.find(({ path }) => path === 'generation-receipt.json');
  if (!receiptRecord) throw new Error('test receipt record missing');
  receiptRecord.sha256 = await sha256(receiptBytes);
  return { run, receipt, receiptBytes, files };
}

describe('alpha.4 pack manifest', () => {
  it('defines strict layered terrain, peering, physics, and six prop contracts', async () => {
    const { run, receipt, receiptBytes, files } = await buildInputs();
    const manifest = await buildAlpha4PackManifest({ run, receiptBytes, files });

    expect(manifest.schema_version).toBe('0.2.0');
    expect(manifest.pack).toMatchObject({
      version: '0.1.0-alpha.4',
      generator: { version: '0.1.0-alpha.4' },
      created_at: receipt.created_at,
    });
    expect(manifest.compatibility.importer.min_version).toBe('0.1.0-alpha.4');
    expect(manifest.layers.map(({ id }) => id)).toEqual(['ground', 'water', 'roads', 'props']);
    expect(manifest.terrain_sets.map(({ id }) => id)).toEqual(['water', 'roads']);
    expect(manifest.physics_layers).toEqual([
      { id: 'world-blocking', collision_layer: 1, collision_mask: 1 },
    ]);
    expect(manifest.atlases[0].tiles).toHaveLength(35);
    expect(manifest.sprites).toHaveLength(6);
    expect(manifest.world_spec).toEqual(receipt.world.input_spec);
    expect(manifest.provenance).toEqual(generationReceiptManifestProjection(receipt));
  });

  it('encodes every water and road cardinal mask exactly once', async () => {
    const { run, receiptBytes, files } = await buildInputs();
    const manifest = await buildAlpha4PackManifest({ run, receiptBytes, files });
    const tiles = manifest.atlases[0].tiles;
    const water = tiles.filter((tile) => tile.terrain?.set_id === 'water');
    const roads = tiles.filter((tile) => tile.terrain?.set_id === 'roads');

    expect(water.map(({ tile_id }) => tile_id)).toEqual(Array.from({ length: 16 }, (_, mask) => 16 + mask));
    expect(roads.map(({ tile_id }) => tile_id)).toEqual(Array.from({ length: 16 }, (_, mask) => 32 + mask));
    for (const [index, tile] of water.entries()) {
      expect(tile.collision).toEqual({ type: 'full-cell', physics_layer: 'world-blocking' });
      expect(tile.custom_data.walkable).toBe(false);
      expect(tile.terrain?.peering).toEqual({
        north: index & 1 ? 'water' : null,
        east: index & 2 ? 'water' : null,
        south: index & 4 ? 'water' : null,
        west: index & 8 ? 'water' : null,
      });
    }
    expect(roads.every((tile) => tile.collision.type === 'none' && tile.custom_data.walkable)).toBe(true);
  });

  it('fails closed on receipt drift, byte mismatch, or untrusted run', async () => {
    const input = await buildInputs();
    const changedReceipt = structuredClone(input.receipt);
    changedReceipt.ai_disclosure.contains_generative_ai = true;
    const changedBytes = new TextEncoder().encode(`${JSON.stringify(changedReceipt, null, 2)}\n`);
    const changedFiles = structuredClone(input.files);
    const changedRecord = changedFiles.find(({ path }) => path === 'generation-receipt.json');
    if (!changedRecord) throw new Error('test receipt record missing');
    changedRecord.bytes = changedBytes.byteLength;
    changedRecord.sha256 = await sha256(changedBytes);
    await expect(buildAlpha4PackManifest({
      run: input.run,
      receiptBytes: changedBytes,
      files: changedFiles,
    })).rejects.toThrow();

    const badHashFiles = structuredClone(input.files);
    const badHashRecord = badHashFiles.find(({ path }) => path === 'generation-receipt.json');
    if (!badHashRecord) throw new Error('test receipt record missing');
    badHashRecord.sha256 = 'f'.repeat(64);
    await expect(buildAlpha4PackManifest({
      run: input.run,
      receiptBytes: input.receiptBytes,
      files: badHashFiles,
    })).rejects.toThrow('receipt file record does not match');

    await expect(buildAlpha4PackManifest({
      run: { ...input.run },
      receiptBytes: input.receiptBytes,
      files: input.files,
    })).rejects.toThrow('evidence.untrusted-run');

    const legacyRun = await runGenerationProviderWithEvidence(
      PROCEDURAL_PIXEL_PROVIDER,
      DEFAULT_WORLD_SPEC,
    );
    await expect(buildAlpha4PackManifest({
      run: legacyRun,
      receiptBytes: input.receiptBytes,
      files: input.files,
    })).rejects.toThrow('procedural-terrain-v2@0.2.0');
  });

  it('rejects malformed or incomplete file records before returning a manifest', async () => {
    const input = await buildInputs();
    const badHash = structuredClone(input.files);
    badHash[0].sha256 = 'not-a-hash';
    await expect(buildAlpha4PackManifest({
      run: input.run,
      receiptBytes: input.receiptBytes,
      files: badHash,
    })).rejects.toThrow('Invalid pack SHA-256');

    await expect(buildAlpha4PackManifest({
      run: input.run,
      receiptBytes: input.receiptBytes,
      files: input.files.slice(1),
    })).rejects.toThrow('exact 11-file');
  });
});
