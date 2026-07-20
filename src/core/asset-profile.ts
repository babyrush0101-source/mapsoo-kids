export const WORLD_ASSET_PROFILES = Object.freeze([
  'side-platformer',
  'isometric-action',
  'topdown-farm',
  'layered-depth-2d',
] as const);

export type WorldAssetProfile = typeof WORLD_ASSET_PROFILES[number];

export type WorldProjection = 'orthogonal-side' | 'diamond-isometric' | 'orthogonal-topdown' | 'layered-depth';

export interface WorldAssetProfileDescriptor {
  readonly id: WorldAssetProfile;
  readonly projection: WorldProjection;
  readonly label: string;
  readonly summary: string;
}

export const WORLD_ASSET_PROFILE_DESCRIPTORS: Readonly<Record<WorldAssetProfile, WorldAssetProfileDescriptor>> =
  Object.freeze({
    'side-platformer': Object.freeze({
      id: 'side-platformer',
      projection: 'orthogonal-side',
      label: 'Side-view platformer',
      summary: 'Platforms, one-way surfaces, hazards, parallax planes, and side-view character animation.',
    }),
    'isometric-action': Object.freeze({
      id: 'isometric-action',
      projection: 'diamond-isometric',
      label: 'Isometric action',
      summary: 'Diamond-grid terrain, elevation, Y-sorted props, combat readability, and diagonal presentation.',
    }),
    'topdown-farm': Object.freeze({
      id: 'topdown-farm',
      projection: 'orthogonal-topdown',
      label: 'Top-down farm world',
      summary: 'Farm terrain, crops, structures, props, walkability, and four-direction character animation.',
    }),
    'layered-depth-2d': Object.freeze({
      id: 'layered-depth-2d',
      projection: 'layered-depth',
      label: 'Layered depth 2D',
      summary: 'Foreground, gameplay, background, lighting, and depth planes for a diorama-like 2D scene.',
    }),
  });

export function isWorldAssetProfile(value: unknown): value is WorldAssetProfile {
  return typeof value === 'string' && (WORLD_ASSET_PROFILES as readonly string[]).includes(value);
}
