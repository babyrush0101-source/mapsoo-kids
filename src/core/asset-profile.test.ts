import { describe, expect, it } from 'vitest';

import {
  WORLD_ASSET_PROFILES,
  WORLD_ASSET_PROFILE_DESCRIPTORS,
  isWorldAssetProfile,
} from './asset-profile';

describe('world asset profiles', () => {
  it('keeps all four target game views in the public contract', () => {
    expect(WORLD_ASSET_PROFILES).toEqual([
      'side-platformer',
      'isometric-action',
      'topdown-farm',
      'layered-depth-2d',
    ]);
    expect(Object.keys(WORLD_ASSET_PROFILE_DESCRIPTORS).sort()).toEqual([...WORLD_ASSET_PROFILES].sort());
  });

  it('rejects product names and unknown profiles as contract IDs', () => {
    expect(isWorldAssetProfile('topdown-farm')).toBe(true);
    expect(isWorldAssetProfile('hades')).toBe(false);
    expect(isWorldAssetProfile('hd-2d')).toBe(false);
    expect(isWorldAssetProfile({ id: 'side-platformer' })).toBe(false);
  });
});
