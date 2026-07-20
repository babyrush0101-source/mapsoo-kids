import { describe, expect, it } from 'vitest';

import {
  GENERATED_ASSET_BUNDLE_SCHEMA_VERSION,
  TOPDOWN_FARM_COMPLETENESS_POLICY,
  TOPDOWN_FARM_REQUIRED_ROLES,
  assertCompleteTopdownFarmAssetBundle,
  validateTopdownFarmAssetBundle,
  type GeneratedAssetBundle,
  type GeneratedAssetKind,
} from './generated-asset-bundle';

const HASH = 'a'.repeat(64);

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

function completeBundle(): GeneratedAssetBundle {
  const assets = TOPDOWN_FARM_REQUIRED_ROLES.map((role, index) => {
    const kind = kindForRole(role);
    return {
      id: `asset-${index + 1}`,
      kind,
      path: `${kind}/${index + 1}.${kind.endsWith('map') || kind === 'scene-data' ? 'json' : 'png'}`,
      mediaType: kind.endsWith('map') || kind === 'scene-data' ? 'application/json' as const : 'image/png' as const,
      bytes: 128,
      sha256: HASH,
      ...(kind === 'character-atlas' ? { width: 128, height: 256 } : {}),
      sourceReferenceIds: kind === 'character-atlas' ? ['character-reference'] : ['environment-reference'],
    };
  });
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
  return {
    schemaVersion: GENERATED_ASSET_BUNDLE_SCHEMA_VERSION,
    jobId: 'farm-world-job',
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
}

describe('topdown-farm-complete-v1', () => {
  it('accepts a complete asset graph with all four-direction idle and walk clips', () => {
    const bundle = completeBundle();
    expect(validateTopdownFarmAssetBundle(bundle)).toEqual([]);
    expect(() => assertCompleteTopdownFarmAssetBundle(bundle)).not.toThrow();
  });

  it.each(TOPDOWN_FARM_REQUIRED_ROLES)('fails closed when required role %s is missing', (role) => {
    const bundle = completeBundle();
    const incomplete = { ...bundle, roles: bundle.roles.filter((binding) => binding.role !== role) };
    expect(validateTopdownFarmAssetBundle(incomplete)).toContainEqual(expect.objectContaining({
      code: 'completeness.missing-role',
      role,
    }));
  });

  it('rejects a missing directional animation clip', () => {
    const bundle = completeBundle();
    const character = bundle.characters[0];
    const incomplete = {
      ...bundle,
      characters: [{ ...character, clips: character.clips.filter((clip) => !(clip.action === 'walk' && clip.direction === 'west')) }],
    };
    expect(validateTopdownFarmAssetBundle(incomplete)).toContainEqual(expect.objectContaining({
      code: 'completeness.missing-clip',
    }));
  });

  it('rejects frames outside the declared character atlas', () => {
    const bundle = completeBundle();
    const character = bundle.characters[0];
    const invalid = {
      ...bundle,
      characters: [{
        ...character,
        clips: [{ ...character.clips[0], frames: [{ x: 127, y: 255 }] }, ...character.clips.slice(1)],
      }],
    };
    expect(validateTopdownFarmAssetBundle(invalid)).toContainEqual(expect.objectContaining({
      code: 'character.frame-bounds',
    }));
  });

  it('does not pretend another profile satisfies the farm policy', () => {
    const bundle = { ...completeBundle(), profile: 'side-platformer' as const };
    expect(validateTopdownFarmAssetBundle(bundle)).toContainEqual(expect.objectContaining({ code: 'bundle.profile' }));
  });

  it('rejects unsafe paths and broken role references', () => {
    const bundle = completeBundle();
    const invalid = {
      ...bundle,
      assets: [{ ...bundle.assets[0], path: '../secret.png' }, ...bundle.assets.slice(1)],
      roles: [{ ...bundle.roles[0], assetId: 'missing-asset' }, ...bundle.roles.slice(1)],
    };
    const codes = validateTopdownFarmAssetBundle(invalid).map((issue) => issue.code);
    expect(codes).toEqual(expect.arrayContaining(['asset.path', 'role.missing-asset']));
  });
});
