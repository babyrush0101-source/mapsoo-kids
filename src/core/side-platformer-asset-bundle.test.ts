import { describe, expect, it } from 'vitest';

import type { GeneratedAssetBundle, GeneratedAssetKind } from './generated-asset-bundle';
import {
  SIDE_PLATFORMER_ACTIONS,
  SIDE_PLATFORMER_ASSET_BUNDLE_SCHEMA_VERSION,
  SIDE_PLATFORMER_COMPLETENESS_POLICY,
  SIDE_PLATFORMER_DIRECTIONS,
  SIDE_PLATFORMER_REQUIRED_ROLES,
  assertCompleteSidePlatformerAssetBundle,
  validateSidePlatformerAssetBundle,
} from './side-platformer-asset-bundle';

const HASH = 'b'.repeat(64);

function kindForRole(role: string): GeneratedAssetKind {
  if (role.startsWith('terrain.')) return 'platform-atlas';
  if (role.startsWith('hazard.')) return 'hazard-atlas';
  if (role.startsWith('prop.')) return 'prop-atlas';
  if (role.startsWith('structure.')) return 'structure-sprite';
  if (role.startsWith('collectible.')) return 'collectible-atlas';
  if (role.startsWith('background.')) return 'background-layer';
  if (role.startsWith('foreground.')) return 'foreground-layer';
  if (role === 'character.player.atlas') return 'character-atlas';
  if (role === 'world.collision') return 'collision-map';
  if (role === 'world.navigation') return 'navigation-map';
  if (role === 'world.scene') return 'scene-data';
  return 'preview';
}

function completeSideBundle(): GeneratedAssetBundle {
  const assets = SIDE_PLATFORMER_REQUIRED_ROLES.map((role, index) => {
    const kind = kindForRole(role);
    const json = kind === 'collision-map' || kind === 'navigation-map' || kind === 'scene-data';
    return {
      id: `side-asset-${index + 1}`,
      kind,
      path: `${json ? 'runtime' : 'atlases'}/${index + 1}.${json ? 'json' : 'png'}`,
      mediaType: json ? 'application/json' as const : 'image/png' as const,
      bytes: 128,
      sha256: HASH,
      ...(!json ? { width: kind === 'character-atlas' ? 384 : 320, height: kind === 'character-atlas' ? 128 : 180 } : {}),
      sourceReferenceIds: kind === 'character-atlas'
        ? ['environment-reference', 'character-reference']
        : ['environment-reference'],
    };
  });
  const roleAsset = (role: string) => assets[SIDE_PLATFORMER_REQUIRED_ROLES.indexOf(role as never)].id;
  const clips = SIDE_PLATFORMER_ACTIONS.flatMap((action, actionIndex) =>
    SIDE_PLATFORMER_DIRECTIONS.map((direction, directionIndex) => ({
      action,
      direction,
      fps: action === 'idle' ? 4 : 8,
      frames: [{ x: actionIndex * 32, y: directionIndex * 64 }],
    })),
  );
  return {
    schemaVersion: SIDE_PLATFORMER_ASSET_BUNDLE_SCHEMA_VERSION,
    jobId: 'side-world-job',
    profile: 'side-platformer',
    completenessPolicy: SIDE_PLATFORMER_COMPLETENESS_POLICY,
    assets,
    roles: SIDE_PLATFORMER_REQUIRED_ROLES.map((role) => ({ role, assetId: roleAsset(role) })),
    characters: [{
      id: 'player', atlasAssetId: roleAsset('character.player.atlas'),
      frameWidth: 32, frameHeight: 32, pivot: [16, 30], clips,
    }],
    scene: {
      id: 'side-scene',
      dataAssetId: roleAsset('world.scene'),
      collisionAssetId: roleAsset('world.collision'),
      navigationAssetId: roleAsset('world.navigation'),
      previewAssetId: roleAsset('world.preview'),
      spawn: { x: 96, y: 576 },
    },
  };
}

describe('side-platformer-complete-v1', () => {
  it('accepts the complete role graph and twelve canonical side-view clips', () => {
    const bundle = completeSideBundle();
    expect(validateSidePlatformerAssetBundle(bundle)).toEqual([]);
    expect(() => assertCompleteSidePlatformerAssetBundle(bundle)).not.toThrow();
  });

  it.each(SIDE_PLATFORMER_REQUIRED_ROLES)('fails closed when required role %s is missing', (role) => {
    const bundle = completeSideBundle();
    const invalid = { ...bundle, roles: bundle.roles.filter((binding) => binding.role !== role) };
    expect(validateSidePlatformerAssetBundle(invalid)).toContainEqual(expect.objectContaining({
      code: 'completeness.missing-role', role,
    }));
  });

  it.each(SIDE_PLATFORMER_ACTIONS.flatMap((action) => SIDE_PLATFORMER_DIRECTIONS.map((direction) => [action, direction] as const)))(
    'rejects a missing %s.%s clip',
    (action, direction) => {
      const bundle = completeSideBundle();
      const character = bundle.characters[0];
      const invalid = {
        ...bundle,
        characters: [{ ...character, clips: character.clips.filter((clip) => clip.action !== action || clip.direction !== direction) }],
      };
      expect(validateSidePlatformerAssetBundle(invalid)).toContainEqual(expect.objectContaining({ code: 'completeness.missing-clip' }));
    },
  );

  it('rejects farm policy/profile mixing and the Alpha9 bundle schema', () => {
    const invalid = {
      ...completeSideBundle(),
      schemaVersion: '0.1.0' as const,
      completenessPolicy: 'topdown-farm-complete-v1',
    };
    const codes = validateSidePlatformerAssetBundle(invalid).map(({ code }) => code);
    expect(codes).toEqual(expect.arrayContaining(['bundle.schema-version', 'bundle.completeness-policy']));
  });

  it('rejects undeclared roles, unsafe paths and out-of-bounds character frames', () => {
    const bundle = completeSideBundle();
    const character = bundle.characters[0];
    const invalid = {
      ...bundle,
      assets: [{ ...bundle.assets[0], path: '../escape.png' }, ...bundle.assets.slice(1)],
      roles: [...bundle.roles, { role: 'terrain.farm-soil', assetId: bundle.assets[0].id }],
      characters: [{
        ...character,
        clips: [{ ...character.clips[0], frames: [{ x: 383, y: 127 }] }, ...character.clips.slice(1)],
      }],
    };
    const codes = validateSidePlatformerAssetBundle(invalid).map(({ code }) => code);
    expect(codes).toEqual(expect.arrayContaining([
      'asset.path', 'completeness.unexpected-role', 'character.frame-bounds',
    ]));
  });
});
