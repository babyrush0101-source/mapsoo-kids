import { describe, expect, it } from 'vitest';

import {
  GENERATED_ASSET_BUNDLE_SCHEMA_VERSION,
  TOPDOWN_FARM_COMPLETENESS_POLICY,
  TOPDOWN_FARM_REQUIRED_ROLES,
  type GeneratedAssetBundle,
  type GeneratedAssetKind,
} from './generated-asset-bundle';
import { bindGenerationRequestV2 } from './generation-request-v2';
import {
  WorldAssetProviderError,
  createTopdownFarmReplayProvider,
  runWorldAssetProvider,
  type GeneratedAssetFile,
  type WorldAssetProviderOutput,
} from './world-asset-provider';

function png(width: number, height: number, marker = 0): Uint8Array {
  const bytes = new Uint8Array(33);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 13);
  bytes.set([73, 72, 68, 82], 12);
  view.setUint32(16, width);
  view.setUint32(20, height);
  bytes.set([8, 6, 0, 0, 0], 24);
  bytes[32] = marker;
  return bytes;
}

async function hash(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes.slice().buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function kindForRole(role: string): GeneratedAssetKind {
  if (role.startsWith('terrain.')) return 'terrain-atlas';
  if (role.startsWith('prop.')) return 'prop-atlas';
  if (role.startsWith('structure.')) return 'structure-sprite';
  if (role.startsWith('crop.')) return 'crop-sprite';
  if (role === 'character.player.atlas') return 'character-atlas';
  if (role === 'world.collision') return 'collision-map';
  if (role === 'world.navigation') return 'navigation-map';
  if (role === 'world.scene') return 'scene-data';
  return 'preview';
}

async function fixture(jobId = 'farm-world-job'): Promise<WorldAssetProviderOutput> {
  const files: GeneratedAssetFile[] = [];
  const assets = await Promise.all(TOPDOWN_FARM_REQUIRED_ROLES.map(async (role, index) => {
    const kind = kindForRole(role);
    const raster = !(kind.endsWith('map') || kind === 'scene-data');
    const character = kind === 'character-atlas';
    const bytes = raster
      ? png(character ? 128 : 1, character ? 256 : 1, index)
      : new TextEncoder().encode(JSON.stringify({ role, version: 1 }));
    const id = `asset-${index + 1}`;
    const path = `${raster ? 'atlases' : 'runtime'}/${id}.${raster ? 'png' : 'json'}`;
    const mediaType = raster ? 'image/png' as const : 'application/json' as const;
    files.push({ assetId: id, path, mediaType, bytes });
    return {
      id,
      kind,
      path,
      mediaType,
      bytes: bytes.byteLength,
      sha256: await hash(bytes),
      ...(raster ? { width: character ? 128 : 1, height: character ? 256 : 1 } : {}),
      sourceReferenceIds: character ? ['character-reference'] : ['environment-reference'],
    };
  }));
  const roleAsset = (role: string) => assets[TOPDOWN_FARM_REQUIRED_ROLES.indexOf(role as never)].id;
  const clips = (['idle', 'walk'] as const).flatMap((action, actionIndex) =>
    (['north', 'east', 'south', 'west'] as const).map((direction, directionIndex) => ({
      action,
      direction,
      fps: action === 'idle' ? 4 : 8,
      frames: [
        { x: actionIndex * 64, y: directionIndex * 64 },
        { x: actionIndex * 64 + 32, y: directionIndex * 64 },
      ],
    })),
  );
  const bundle: GeneratedAssetBundle = {
    schemaVersion: GENERATED_ASSET_BUNDLE_SCHEMA_VERSION,
    jobId,
    profile: 'topdown-farm',
    completenessPolicy: TOPDOWN_FARM_COMPLETENESS_POLICY,
    assets,
    roles: TOPDOWN_FARM_REQUIRED_ROLES.map((role) => ({ role, assetId: roleAsset(role) })),
    characters: [{
      id: 'player',
      atlasAssetId: roleAsset('character.player.atlas'),
      frameWidth: 32,
      frameHeight: 32,
      pivot: [16, 28],
      clips,
    }],
    scene: {
      id: 'farm-scene',
      dataAssetId: roleAsset('world.scene'),
      collisionAssetId: roleAsset('world.collision'),
      navigationAssetId: roleAsset('world.navigation'),
      previewAssetId: roleAsset('world.preview'),
      spawn: { x: 8, y: 8 },
    },
  };
  return { bundle, files };
}

async function job(profile: 'topdown-farm' | 'side-platformer' = 'topdown-farm') {
  const environment = png(2, 3, 1);
  const character = png(2, 3, 2);
  const reference = async (role: 'environment-style' | 'character', bytes: Uint8Array) => ({
    id: role === 'environment-style' ? 'environment-reference' : 'character-reference',
    role,
    path: `references/${role}.png`,
    mediaType: 'image/png' as const,
    byteLength: bytes.byteLength,
    width: 2,
    height: 3,
    sha256: await hash(bytes),
    rights: {
      basis: 'owned' as const,
      license: 'LicenseRef-User-Owned',
      allowGenerativeAdaptation: true as const,
      allowOutputRedistribution: true as const,
    },
  });
  return bindGenerationRequestV2({
    schemaVersion: '1.0.0',
    id: 'farm-world-job',
    profile,
    description: 'A compact riverside farm world.',
    seed: 'farm-001',
    references: [await reference('environment-style', environment), await reference('character', character)],
  }, [
    { path: 'references/environment-style.png', bytes: environment },
    { path: 'references/character.png', bytes: character },
  ]);
}

describe('world asset provider v2 runner', () => {
  it('accepts a complete replay and exposes copy-on-read payloads', async () => {
    const replay = createTopdownFarmReplayProvider('mapsoo-topdown-farm-replay', '0.1.0', await fixture());
    const result = await runWorldAssetProvider(replay, await job());
    expect(result.bundle.roles).toHaveLength(TOPDOWN_FARM_REQUIRED_ROLES.length);
    expect(result.payloads).toHaveLength(TOPDOWN_FARM_REQUIRED_ROLES.length);
    const first = result.payloads[0].readBytes();
    first[0] = 0;
    expect(result.payloads[0].readBytes()[0]).toBe(137);
    expect(result.provider.capabilities.outputProvenance).toBe('recorded-replay');
  });

  it('rejects unsupported profiles before invoking a top-down provider', async () => {
    const replay = createTopdownFarmReplayProvider('mapsoo-topdown-farm-replay', '0.1.0', await fixture());
    await expect(runWorldAssetProvider(replay, await job('side-platformer'))).rejects.toMatchObject({
      code: 'world-provider.unsupported-profile',
    });
  });

  it('rejects payload mutation and unknown source reference claims', async () => {
    const changed = await fixture();
    changed.files[0].bytes[32] ^= 1;
    const mutated = createTopdownFarmReplayProvider('mapsoo-mutated-replay', '0.1.0', changed);
    await expect(runWorldAssetProvider(mutated, await job())).rejects.toBeInstanceOf(WorldAssetProviderError);

    const unknown = await fixture();
    const first = unknown.bundle.assets[0];
    const badClaims = createTopdownFarmReplayProvider('mapsoo-bad-claims-replay', '0.1.0', {
      ...unknown,
      bundle: { ...unknown.bundle, assets: [{ ...first, sourceReferenceIds: ['private-reference'] }, ...unknown.bundle.assets.slice(1)] },
    });
    await expect(runWorldAssetProvider(badClaims, await job())).rejects.toMatchObject({ code: 'world-provider.invalid-output' });
  });

  it('fails closed on provider metadata accessors and pre-aborted work', async () => {
    const replay = createTopdownFarmReplayProvider('mapsoo-topdown-farm-replay', '0.1.0', await fixture());
    const accessor = { ...replay } as Record<string, unknown>;
    Object.defineProperty(accessor, 'displayName', { enumerable: true, get: () => 'unsafe' });
    await expect(runWorldAssetProvider(accessor as never, await job())).rejects.toMatchObject({
      code: 'world-provider.invalid-metadata',
    });
    const controller = new AbortController();
    controller.abort();
    await expect(runWorldAssetProvider(replay, await job(), { signal: controller.signal })).rejects.toMatchObject({
      code: 'world-provider.aborted',
    });
  });
});
