import {
  generationReceiptManifestProjection,
  validateGenerationReceipt,
  type GenerationReceipt,
} from './generation-receipt';
import type { GenerationRunResult } from './generation-evidence';
import { assertTrustedGenerationRun } from './generation-provider';
import { assertPlayableTerrainExportEvidence } from './playable-terrain-export-policy';
import { PLAYABLE_PROP_KINDS } from './generate-playable-world';
import {
  PLAYABLE_TERRAIN_ATLAS_COLUMNS,
  PLAYABLE_TERRAIN_ATLAS_ROWS,
  PLAYABLE_TERRAIN_TILE_DEFINITIONS,
} from './playable-terrain';
import { assertSafePackPath, type PackFileRecord } from './pack-manifest';
import { projectTrustedGenerationReceipt } from './trusted-generation-receipt';

export const ALPHA4_PACK_VERSION = '0.1.0-alpha.4' as const;
export const ALPHA4_PACK_SCHEMA_VERSION = '0.2.0' as const;
export const ALPHA4_IMPORTER_MIN_VERSION = '0.1.0-alpha.4' as const;
type TerrainName = 'water' | 'road';
type TerrainPeering = Readonly<{
  north: TerrainName | null;
  east: TerrainName | null;
  south: TerrainName | null;
  west: TerrainName | null;
}>;

export interface Alpha4PackManifest {
  readonly schema_version: typeof ALPHA4_PACK_SCHEMA_VERSION;
  readonly pack: {
    readonly id: string;
    readonly title: string;
    readonly version: typeof ALPHA4_PACK_VERSION;
    readonly generator: { readonly name: 'Mapsoo Worldsmith'; readonly version: typeof ALPHA4_PACK_VERSION };
    readonly created_at: string;
  };
  readonly compatibility: {
    readonly godot_min: '4.3';
    readonly grid: 'orthogonal';
    readonly art_style: 'pixel_art';
    readonly importer: {
      readonly id: 'mapsoo_importer';
      readonly min_version: typeof ALPHA4_IMPORTER_MIN_VERSION;
      readonly source: 'https://github.com/babyrush0101-source/mapsoo-kids';
    };
  };
  readonly world_spec: { readonly path: string; readonly sha256: string };
  readonly demo: { readonly map: string; readonly preview: string };
  readonly layers: readonly [
    Alpha4TileLayer,
    Alpha4TileLayer,
    Alpha4TileLayer,
    {
      readonly id: 'props';
      readonly kind: 'objects';
      readonly path: string;
      readonly json_pointer: '/props';
      readonly encoding: 'objects';
      readonly sprite_atlas: string;
    },
  ];
  readonly terrain_sets: readonly [Alpha4TerrainSet, Alpha4TerrainSet];
  readonly physics_layers: readonly [{
    readonly id: 'world-blocking';
    readonly collision_layer: 1;
    readonly collision_mask: 1;
  }];
  readonly receipt: { readonly path: string };
  readonly atlases: readonly [Alpha4Atlas];
  readonly sprites: readonly Alpha4Sprite[];
  readonly files: readonly PackFileRecord[];
  readonly license: { readonly assets: { readonly id: 'CC0-1.0'; readonly file: string } };
  readonly provenance: {
    readonly contains_generative_ai: boolean;
    readonly model_provider: string | null;
    readonly model: string | null;
    readonly seed: string;
    readonly human_curated: boolean;
  };
}

interface Alpha4TileLayer {
  readonly id: 'ground' | 'water' | 'roads';
  readonly kind: 'tilemap';
  readonly path: string;
  readonly json_pointer: '/layers/0/cells' | '/layers/1/cells' | '/layers/2/cells';
  readonly encoding: 'row-major';
  readonly dimensions_cells: readonly [number, number];
  readonly atlas_id: 'terrain';
  readonly empty_tile_id: -1;
}

interface Alpha4TerrainSet {
  readonly id: 'water' | 'roads';
  readonly mode: 'match-sides';
  readonly terrains: readonly [{
    readonly id: TerrainName;
    readonly name: 'Water' | 'Road';
    readonly color: string;
  }];
}

interface Alpha4AtlasTile {
  readonly tile_id: number;
  readonly id: string;
  readonly atlas_coords: readonly [number, number];
  readonly size_cells: readonly [1, 1];
  readonly alternative_id: 0;
  readonly collision:
    | { readonly type: 'none' }
    | { readonly type: 'full-cell'; readonly physics_layer: 'world-blocking' };
  readonly terrain: null | {
    readonly set_id: 'water' | 'roads';
    readonly terrain_id: TerrainName;
    readonly peering: TerrainPeering;
  };
  readonly custom_data: { readonly walkable: boolean; readonly biome: string };
  readonly tags: readonly string[];
}

interface Alpha4Atlas {
  readonly id: 'terrain';
  readonly source_id: 0;
  readonly file: string;
  readonly image_size_px: readonly [number, number];
  readonly cell_size_px: readonly [number, number];
  readonly margin_px: readonly [0, 0];
  readonly separation_px: readonly [0, 0];
  readonly texture_padding: true;
  readonly tiles: readonly Alpha4AtlasTile[];
}

interface Alpha4Sprite {
  readonly id: string;
  readonly atlas: string;
  readonly region_px: readonly [number, number, number, number];
  readonly pivot_px: readonly [number, number];
  readonly footprint_cells: readonly [1, 1];
  readonly tags: readonly string[];
}

export interface BuildAlpha4PackManifestInput {
  readonly run: GenerationRunResult;
  readonly files: readonly PackFileRecord[];
  readonly receiptBytes: Uint8Array;
}

async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function parseReceiptBytes(bytes: Uint8Array): unknown {
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new Error('The alpha.4 receipt payload must be strict UTF-8 JSON.');
  }
}

function structurallyEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((entry, index) => structurallyEqual(entry, right[index]));
  }
  if (
    typeof left !== 'object'
    || left === null
    || typeof right !== 'object'
    || right === null
  ) return false;
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord).sort();
  const rightKeys = Object.keys(rightRecord).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) => key === rightKeys[index]
      && structurallyEqual(leftRecord[key], rightRecord[key]));
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((byte, index) => byte === right[index]);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach((child) => deepFreeze(child));
    Object.freeze(value);
  }
  return value;
}

function snapshotFiles(files: readonly PackFileRecord[]): PackFileRecord[] {
  const seen = new Set<string>();
  return files.map((file) => {
    const path = assertSafePackPath(file.path);
    if (seen.has(path)) throw new Error(`Duplicate pack file path: ${path}`);
    if (!/^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/.test(file.media_type)) {
      throw new Error(`Invalid pack media type for ${path}.`);
    }
    if (!Number.isSafeInteger(file.bytes) || file.bytes < 0) {
      throw new Error(`Invalid pack byte length for ${path}.`);
    }
    if (!/^[a-f0-9]{64}$/.test(file.sha256)) {
      throw new Error(`Invalid pack SHA-256 for ${path}.`);
    }
    seen.add(path);
    return { path, media_type: file.media_type, bytes: file.bytes, sha256: file.sha256 };
  });
}

function expectedPayloadMediaType(path: string): string {
  if (path.endsWith('.json')) return 'application/json';
  if (path.endsWith('.md')) return 'text/markdown';
  if (path.endsWith('.png')) return 'image/png';
  throw new Error(`Alpha.4 payload has no registered media type: ${path}`);
}

function assertExactAlpha4Payload(files: readonly PackFileRecord[], worldSpecPath: string): void {
  const expectedPaths = [
    'atlases/props.png',
    'atlases/terrain.png',
    'generation-receipt.json',
    'license-assets.md',
    'previews/map-preview.png',
    'readme.md',
    'schema/mapsoo-generation-receipt.schema.json',
    'schema/mapsoo-pack-0.2.schema.json',
    'schema/mapsoo-world.schema.json',
    'worlds/demo-world.json',
    worldSpecPath,
  ].sort();
  const actualPaths = files.map(({ path }) => path).sort();
  if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) {
    throw new Error('Alpha.4 manifest requires the exact 11-file portable payload contract.');
  }
  for (const file of files) {
    if (file.media_type !== expectedPayloadMediaType(file.path)) {
      throw new Error(`Alpha.4 payload media type mismatch for ${file.path}.`);
    }
  }
}

function requireFile(files: readonly PackFileRecord[], path: string): PackFileRecord {
  const safePath = assertSafePackPath(path);
  const file = files.find((entry) => entry.path === safePath);
  if (!file) throw new Error(`Manifest references missing pack file: ${safePath}`);
  return file;
}

function terrainPeering(mask: number, terrain: TerrainName): TerrainPeering {
  return {
    north: mask & 1 ? terrain : null,
    east: mask & 2 ? terrain : null,
    south: mask & 4 ? terrain : null,
    west: mask & 8 ? terrain : null,
  };
}

function atlasTile(
  definition: (typeof PLAYABLE_TERRAIN_TILE_DEFINITIONS)[number],
  biome: string,
): Alpha4AtlasTile {
  if (definition.layer === 'ground') {
    return {
      tile_id: definition.tileId,
      id: definition.id,
      atlas_coords: definition.atlasCoords,
      size_cells: [1, 1],
      alternative_id: 0,
      collision: { type: 'none' },
      terrain: null,
      custom_data: { walkable: true, biome },
      tags: ['terrain', 'ground', definition.id],
    };
  }
  const terrain = definition.layer === 'water' ? 'water' : 'road';
  return {
    tile_id: definition.tileId,
    id: definition.id,
    atlas_coords: definition.atlasCoords,
    size_cells: [1, 1],
    alternative_id: 0,
    collision: definition.layer === 'water'
      ? { type: 'full-cell', physics_layer: 'world-blocking' }
      : { type: 'none' },
    terrain: {
      set_id: definition.layer,
      terrain_id: terrain,
      peering: terrainPeering(definition.cardinalMask ?? 0, terrain),
    },
    custom_data: { walkable: definition.walkable, biome },
    tags: ['terrain', definition.layer, `mask-${definition.cardinalMask ?? 0}`],
  };
}

export async function buildAlpha4PackManifest({
  run,
  files,
  receiptBytes,
}: BuildAlpha4PackManifestInput): Promise<Alpha4PackManifest> {
  assertTrustedGenerationRun(run);
  assertPlayableTerrainExportEvidence(
    run,
    'Alpha.4 manifest requires the exact runner-verified playable terrain evidence profile.',
  );
  const fileSnapshot = snapshotFiles(files);
  const receiptSnapshot = Uint8Array.from(receiptBytes);
  const { world } = run;
  const tileSize = world.spec.visual.tileSize;
  const worldSpecPath = assertSafePackPath(`worlds/${world.spec.id}.world.json`);
  assertExactAlpha4Payload(fileSnapshot, worldSpecPath);
  const demoMapPath = assertSafePackPath('worlds/demo-world.json');
  const previewPath = assertSafePackPath('previews/map-preview.png');
  const receiptPath = assertSafePackPath('generation-receipt.json');
  const terrainAtlasPath = assertSafePackPath('atlases/terrain.png');
  const propsAtlasPath = assertSafePackPath('atlases/props.png');
  const licensePath = assertSafePackPath('license-assets.md');
  const worldSpecRecord = requireFile(fileSnapshot, worldSpecPath);
  const receiptRecord = requireFile(fileSnapshot, receiptPath);
  [demoMapPath, previewPath, terrainAtlasPath, propsAtlasPath, licensePath]
    .forEach((path) => requireFile(fileSnapshot, path));

  if (
    receiptRecord.media_type !== 'application/json'
    || receiptRecord.bytes !== receiptSnapshot.byteLength
    || receiptRecord.sha256 !== await sha256Bytes(receiptSnapshot)
  ) {
    throw new Error('The alpha.4 receipt file record does not match the shipped receipt bytes.');
  }

  const parsedReceipt = parseReceiptBytes(receiptSnapshot);
  const expectedProvider = {
    id: run.evidence.provider.id,
    version: run.evidence.provider.version,
    execution: run.evidence.provider.capabilities.execution,
    output_provenance: run.evidence.provider.capabilities.outputProvenance,
  } as const;
  const validationContext = {
    world,
    inputSpec: { path: worldSpecPath, sha256: worldSpecRecord.sha256 },
    createdAt: run.evidence.createdAt,
    provider: expectedProvider,
    outputLicense: { id: world.spec.output.assetLicense, noticePath: licensePath },
    files: fileSnapshot,
  } as const;
  const receiptIssues = validateGenerationReceipt(parsedReceipt, validationContext);
  if (receiptIssues.length > 0) {
    throw new Error(`Receipt cannot authorize the alpha.4 manifest: ${receiptIssues.map(({ code }) => code).join(', ')}.`);
  }
  const receipt = parsedReceipt as GenerationReceipt;
  const expectedReceipt = projectTrustedGenerationReceipt(run, validationContext.inputSpec);
  if (!structurallyEqual(receipt, expectedReceipt)) {
    throw new Error('The alpha.4 receipt is not an exact projection of the runner-owned evidence.');
  }
  const canonicalReceiptBytes = new TextEncoder().encode(`${JSON.stringify(expectedReceipt, null, 2)}\n`);
  if (!bytesEqual(receiptSnapshot, canonicalReceiptBytes)) {
    throw new Error('The alpha.4 receipt payload is not the canonical receipt serialization.');
  }
  const provenance = generationReceiptManifestProjection(receipt);
  const provenanceIssues = validateGenerationReceipt(receipt, { ...validationContext, manifestProvenance: provenance });
  if (provenanceIssues.length > 0) {
    throw new Error(`Receipt cannot authorize alpha.4 provenance: ${provenanceIssues.map(({ code }) => code).join(', ')}.`);
  }
  if (receipt.licensing.output.id !== 'CC0-1.0') {
    throw new Error('The alpha.4 playable terrain pack currently supports only CC0-1.0 assets.');
  }

  const dimensions = [world.spec.map.width, world.spec.map.height] as const;
  const [, , , waterColor, roadColor] = world.spec.visual.palette;
  const manifest: Alpha4PackManifest = {
    schema_version: ALPHA4_PACK_SCHEMA_VERSION,
    pack: {
      id: world.spec.id,
      title: world.spec.title,
      version: ALPHA4_PACK_VERSION,
      generator: { name: 'Mapsoo Worldsmith', version: ALPHA4_PACK_VERSION },
      created_at: receipt.created_at,
    },
    compatibility: {
      godot_min: '4.3',
      grid: 'orthogonal',
      art_style: 'pixel_art',
      importer: {
        id: 'mapsoo_importer',
        min_version: ALPHA4_IMPORTER_MIN_VERSION,
        source: 'https://github.com/babyrush0101-source/mapsoo-kids',
      },
    },
    world_spec: validationContext.inputSpec,
    demo: { map: demoMapPath, preview: previewPath },
    layers: [
      { id: 'ground', kind: 'tilemap', path: demoMapPath, json_pointer: '/layers/0/cells', encoding: 'row-major', dimensions_cells: dimensions, atlas_id: 'terrain', empty_tile_id: -1 },
      { id: 'water', kind: 'tilemap', path: demoMapPath, json_pointer: '/layers/1/cells', encoding: 'row-major', dimensions_cells: dimensions, atlas_id: 'terrain', empty_tile_id: -1 },
      { id: 'roads', kind: 'tilemap', path: demoMapPath, json_pointer: '/layers/2/cells', encoding: 'row-major', dimensions_cells: dimensions, atlas_id: 'terrain', empty_tile_id: -1 },
      { id: 'props', kind: 'objects', path: demoMapPath, json_pointer: '/props', encoding: 'objects', sprite_atlas: propsAtlasPath },
    ],
    terrain_sets: [
      { id: 'water', mode: 'match-sides', terrains: [{ id: 'water', name: 'Water', color: waterColor }] },
      { id: 'roads', mode: 'match-sides', terrains: [{ id: 'road', name: 'Road', color: roadColor }] },
    ],
    physics_layers: [{ id: 'world-blocking', collision_layer: 1, collision_mask: 1 }],
    receipt: { path: receiptPath },
    atlases: [{
      id: 'terrain',
      source_id: 0,
      file: terrainAtlasPath,
      image_size_px: [PLAYABLE_TERRAIN_ATLAS_COLUMNS * tileSize, PLAYABLE_TERRAIN_ATLAS_ROWS * tileSize],
      cell_size_px: [tileSize, tileSize],
      margin_px: [0, 0],
      separation_px: [0, 0],
      texture_padding: true,
      tiles: PLAYABLE_TERRAIN_TILE_DEFINITIONS.map((definition) => atlasTile(definition, world.spec.map.biome)),
    }],
    sprites: PLAYABLE_PROP_KINDS.map((kind, index) => ({
      id: `${kind}-01`,
      atlas: propsAtlasPath,
      region_px: [index * tileSize, 0, tileSize, tileSize],
      pivot_px: [Math.floor(tileSize / 2), tileSize],
      footprint_cells: [1, 1],
      tags: ['prop', kind, world.spec.map.biome],
    })),
    files: fileSnapshot,
    license: { assets: { id: 'CC0-1.0', file: licensePath } },
    provenance,
  };
  return deepFreeze(manifest);
}
