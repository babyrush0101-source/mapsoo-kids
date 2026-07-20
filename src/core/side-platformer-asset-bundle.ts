import {
  GENERATED_ASSET_KINDS,
  SIDE_PLATFORMER_ASSET_BUNDLE_SCHEMA_VERSION,
  type AssetBundleIssue,
  type CharacterAction,
  type CharacterDirection,
  type GeneratedAssetBundle,
  type GeneratedAssetKind,
  type GeneratedAssetRecord,
} from './generated-asset-bundle';

export { SIDE_PLATFORMER_ASSET_BUNDLE_SCHEMA_VERSION } from './generated-asset-bundle';

export const SIDE_PLATFORMER_COMPLETENESS_POLICY = 'side-platformer-complete-v1' as const;

export const SIDE_PLATFORMER_REQUIRED_ROLES = Object.freeze([
  'terrain.solid',
  'terrain.one-way',
  'terrain.slope-up',
  'terrain.slope-down',
  'terrain.wall',
  'terrain.ceiling',
  'hazard.spikes',
  'hazard.pit',
  'hazard.moving-platform',
  'prop.crate',
  'prop.rock',
  'prop.plant',
  'prop.sign',
  'prop.lamp',
  'prop.breakable',
  'structure.entrance',
  'structure.exit',
  'structure.checkpoint',
  'collectible.primary',
  'collectible.health',
  'background.sky',
  'background.far',
  'background.mid',
  'background.near',
  'foreground.overlay',
  'character.player.atlas',
  'world.collision',
  'world.navigation',
  'world.scene',
  'world.preview',
] as const);

export const SIDE_PLATFORMER_ACTIONS = Object.freeze([
  'idle', 'run', 'jump', 'fall', 'land', 'hurt',
] as const satisfies readonly CharacterAction[]);
export const SIDE_PLATFORMER_DIRECTIONS = Object.freeze([
  'left', 'right',
] as const satisfies readonly CharacterDirection[]);

const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256 = /^[a-f0-9]{64}$/;

function safeRelativePath(path: string): boolean {
  return path.length > 0
    && path.length <= 240
    && !path.includes('\\')
    && !path.startsWith('/')
    && path.split('/').every((segment) => segment && segment !== '.' && segment !== '..');
}

function integer(value: unknown, minimum: number, maximum: number): value is number {
  return Number.isSafeInteger(value) && (value as number) >= minimum && (value as number) <= maximum;
}

function validateAsset(
  asset: GeneratedAssetRecord,
  ids: Set<string>,
  paths: Set<string>,
  issues: AssetBundleIssue[],
): void {
  if (!SAFE_ID.test(asset.id) || asset.id.length > 80 || ids.has(asset.id)) {
    issues.push({ code: 'asset.id', message: 'Asset IDs must be unique safe identifiers.', assetId: asset.id });
  }
  ids.add(asset.id);
  if (!safeRelativePath(asset.path) || paths.has(asset.path)) {
    issues.push({ code: 'asset.path', message: 'Asset paths must be unique safe relative paths.', assetId: asset.id });
  }
  paths.add(asset.path);
  if (!GENERATED_ASSET_KINDS.includes(asset.kind as GeneratedAssetKind)) {
    issues.push({ code: 'asset.kind', message: 'Asset kind is unsupported.', assetId: asset.id });
  }
  if (!integer(asset.bytes, 1, 64 * 1024 * 1024) || !SHA256.test(asset.sha256)) {
    issues.push({ code: 'asset.integrity', message: 'Asset byte count and SHA-256 are required.', assetId: asset.id });
  }
  const raster = asset.mediaType === 'image/png';
  if (raster !== (asset.width !== undefined && asset.height !== undefined)) {
    issues.push({ code: 'asset.dimensions', message: 'PNG assets require dimensions and JSON assets forbid them.', assetId: asset.id });
  } else if (raster && (!integer(asset.width, 1, 8192) || !integer(asset.height, 1, 8192))) {
    issues.push({ code: 'asset.dimensions', message: 'Raster dimensions must be bounded integers.', assetId: asset.id });
  }
  if (new Set(asset.sourceReferenceIds).size !== asset.sourceReferenceIds.length) {
    issues.push({ code: 'asset.reference-binding', message: 'Asset source reference IDs must be unique.', assetId: asset.id });
  }
}

/** Strict Alpha10 bundle contract. Runtime sidecar semantics are validated separately by Pack 0.7. */
export function validateSidePlatformerAssetBundle(bundle: GeneratedAssetBundle): AssetBundleIssue[] {
  const issues: AssetBundleIssue[] = [];
  if (bundle.schemaVersion !== SIDE_PLATFORMER_ASSET_BUNDLE_SCHEMA_VERSION) {
    issues.push({ code: 'bundle.schema-version', message: 'Side-platformer bundles require schema 0.2.0.' });
  }
  if (!SAFE_ID.test(bundle.jobId) || bundle.jobId.length > 80) {
    issues.push({ code: 'bundle.job-id', message: 'Bundle job ID must be a safe stable identifier.' });
  }
  if (bundle.profile !== 'side-platformer') {
    issues.push({ code: 'bundle.profile', message: 'This contract accepts only side-platformer bundles.' });
  }
  if (bundle.completenessPolicy !== SIDE_PLATFORMER_COMPLETENESS_POLICY) {
    issues.push({ code: 'bundle.completeness-policy', message: 'Bundle must declare side-platformer-complete-v1.' });
  }

  const ids = new Set<string>();
  const paths = new Set<string>();
  const assets = new Map<string, GeneratedAssetRecord>();
  for (const asset of bundle.assets) {
    validateAsset(asset, ids, paths, issues);
    if (!assets.has(asset.id)) assets.set(asset.id, asset);
  }

  const roles = new Map<string, string>();
  for (const binding of bundle.roles) {
    if (roles.has(binding.role)) {
      issues.push({ code: 'role.duplicate', message: 'Asset roles must be unique.', role: binding.role });
    } else {
      roles.set(binding.role, binding.assetId);
    }
    if (!assets.has(binding.assetId)) {
      issues.push({ code: 'role.missing-asset', message: 'Asset role references a missing asset.', role: binding.role });
    }
  }
  for (const role of SIDE_PLATFORMER_REQUIRED_ROLES) {
    if (!roles.has(role)) issues.push({ code: 'completeness.missing-role', message: `Required role is missing: ${role}.`, role });
  }
  const unexpectedRoles = [...roles.keys()].filter((role) => !(SIDE_PLATFORMER_REQUIRED_ROLES as readonly string[]).includes(role));
  for (const role of unexpectedRoles) {
    issues.push({ code: 'completeness.unexpected-role', message: `Unexpected side-platformer role: ${role}.`, role });
  }

  if (bundle.characters.length !== 1) {
    issues.push({ code: 'character.count', message: 'A complete side-platformer bundle requires exactly one player character.' });
  }
  const character = bundle.characters[0];
  if (character) {
    const atlas = assets.get(character.atlasAssetId);
    if (!SAFE_ID.test(character.id) || atlas?.kind !== 'character-atlas') {
      issues.push({ code: 'character.atlas', message: 'Player must reference a character atlas.' });
    }
    if (!integer(character.frameWidth, 1, 512) || !integer(character.frameHeight, 1, 512)
      || character.pivot.length !== 2 || !character.pivot.every(Number.isFinite)) {
      issues.push({ code: 'character.geometry', message: 'Character frame geometry and pivot are invalid.' });
    }
    const clips = new Map<string, typeof character.clips[number]>();
    for (const clip of character.clips) {
      const key = `${clip.action}.${clip.direction}`;
      if (clips.has(key)) issues.push({ code: 'character.clip-duplicate', message: `Character clip is duplicated: ${key}.` });
      clips.set(key, clip);
      if (!(SIDE_PLATFORMER_ACTIONS as readonly string[]).includes(clip.action)
        || !(SIDE_PLATFORMER_DIRECTIONS as readonly string[]).includes(clip.direction)
        || !Number.isFinite(clip.fps) || clip.fps <= 0 || clip.fps > 60
        || clip.frames.length < 1 || clip.frames.length > 32) {
        issues.push({ code: 'character.clip', message: `Character clip is invalid: ${key}.` });
      }
      for (const frame of clip.frames) {
        if (!integer(frame.x, 0, 8191) || !integer(frame.y, 0, 8191)
          || (atlas?.width !== undefined && frame.x + character.frameWidth > atlas.width)
          || (atlas?.height !== undefined && frame.y + character.frameHeight > atlas.height)) {
          issues.push({ code: 'character.frame-bounds', message: `Character frame is outside its atlas: ${key}.` });
          break;
        }
      }
    }
    for (const action of SIDE_PLATFORMER_ACTIONS) {
      for (const direction of SIDE_PLATFORMER_DIRECTIONS) {
        const key = `${action}.${direction}`;
        if (!clips.has(key)) issues.push({ code: 'completeness.missing-clip', message: `Required clip is missing: ${key}.` });
      }
    }
  }

  const sceneKinds: readonly [string, string, GeneratedAssetKind][] = [
    ['data', bundle.scene.dataAssetId, 'scene-data'],
    ['collision', bundle.scene.collisionAssetId, 'collision-map'],
    ['navigation', bundle.scene.navigationAssetId, 'navigation-map'],
    ['preview', bundle.scene.previewAssetId, 'preview'],
  ];
  for (const [label, id, kind] of sceneKinds) {
    if (assets.get(id)?.kind !== kind) issues.push({ code: 'scene.asset', message: `Scene ${label} must target ${kind}.`, assetId: id });
  }
  if (!SAFE_ID.test(bundle.scene.id) || !integer(bundle.scene.spawn.x, 0, 8191) || !integer(bundle.scene.spawn.y, 0, 8191)) {
    issues.push({ code: 'scene.spawn', message: 'Scene ID and spawn coordinates are invalid.' });
  }
  return issues;
}

export function assertCompleteSidePlatformerAssetBundle(bundle: GeneratedAssetBundle): void {
  const issues = validateSidePlatformerAssetBundle(bundle);
  if (issues.length > 0) {
    throw new Error(`Incomplete side-platformer asset bundle: ${issues.map(({ code }) => code).join(', ')}.`);
  }
}
