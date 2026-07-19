import type { GeneratedWorld } from './world-spec';

export const EMPTY_TERRAIN_CELL = -1 as const;
export const PLAYABLE_TERRAIN_ATLAS_COLUMNS = 8 as const;

export const CARDINAL_MASK = Object.freeze({
  north: 1,
  east: 2,
  south: 4,
  west: 8,
} as const);

export type PlayableTerrainLayerId = 'ground' | 'water' | 'roads';

export interface PlayableTerrainLayer {
  readonly id: PlayableTerrainLayerId;
  readonly encoding: 'row-major';
  readonly cells: number[];
}

export interface PlayableTerrainTileDefinition {
  readonly tileId: number;
  readonly id: string;
  readonly layer: PlayableTerrainLayerId;
  readonly atlasCoords: readonly [number, number];
  readonly walkable: boolean;
  readonly cardinalMask?: number;
}

export interface PlayableTerrainProjection {
  readonly width: number;
  readonly height: number;
  readonly layers: readonly [PlayableTerrainLayer, PlayableTerrainLayer, PlayableTerrainLayer];
  readonly tileDefinitions: typeof PLAYABLE_TERRAIN_TILE_DEFINITIONS;
}

function atlasCoords(tileId: number): readonly [number, number] {
  return Object.freeze([
    tileId % PLAYABLE_TERRAIN_ATLAS_COLUMNS,
    Math.floor(tileId / PLAYABLE_TERRAIN_ATLAS_COLUMNS),
  ] as const);
}

function tileDefinition(
  tileId: number,
  id: string,
  layer: PlayableTerrainLayerId,
  walkable: boolean,
  cardinalMask?: number,
): PlayableTerrainTileDefinition {
  return Object.freeze({
    tileId,
    id,
    layer,
    atlasCoords: atlasCoords(tileId),
    walkable,
    ...(cardinalMask === undefined ? {} : { cardinalMask }),
  });
}

export const GROUND_TILE_DEFINITIONS = Object.freeze([
  tileDefinition(0, 'ground-base-a', 'ground', true),
  tileDefinition(1, 'ground-base-b', 'ground', true),
  tileDefinition(2, 'ground-detail', 'ground', true),
] as const);

export const WATER_TILE_DEFINITIONS = Object.freeze(
  Array.from({ length: 16 }, (_, mask) => (
    tileDefinition(16 + mask, `water-${mask.toString(16)}`, 'water', false, mask)
  )),
);

export const ROAD_TILE_DEFINITIONS = Object.freeze(
  Array.from({ length: 16 }, (_, mask) => (
    tileDefinition(32 + mask, `road-${mask.toString(16)}`, 'roads', true, mask)
  )),
);

/** Stable atlas contract: 3 ground variants, 16 water masks, then 16 road masks. */
export const PLAYABLE_TERRAIN_TILE_DEFINITIONS = Object.freeze([
  ...GROUND_TILE_DEFINITIONS,
  ...WATER_TILE_DEFINITIONS,
  ...ROAD_TILE_DEFINITIONS,
] as const);

export const PLAYABLE_TERRAIN_ATLAS_ROWS = Math.max(
  ...PLAYABLE_TERRAIN_TILE_DEFINITIONS.map(({ atlasCoords }) => atlasCoords[1]),
) + 1;

function fail(message: string): never {
  throw new Error(`Invalid playable terrain world: ${message}`);
}

function assertRecord(value: unknown, name: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail(`${name} must be an object.`);
  }
}

interface ProjectionInput {
  readonly width: number;
  readonly height: number;
  readonly seed: string;
  readonly semanticGround: readonly number[];
}

function validateProjectionInput(world: GeneratedWorld): ProjectionInput {
  const candidate: unknown = world;
  assertRecord(candidate, 'world');
  assertRecord(candidate.spec, 'world.spec');
  assertRecord(candidate.spec.map, 'world.spec.map');

  const width = candidate.spec.map.width;
  const height = candidate.spec.map.height;
  if (!Number.isSafeInteger(width) || (width as number) <= 0) {
    fail('world.spec.map.width must be a positive safe integer.');
  }
  if (!Number.isSafeInteger(height) || (height as number) <= 0) {
    fail('world.spec.map.height must be a positive safe integer.');
  }

  const expectedCells = (width as number) * (height as number);
  if (!Number.isSafeInteger(expectedCells)) {
    fail('world dimensions produce an unsafe cell count.');
  }
  if (typeof candidate.spec.seed !== 'string' || candidate.spec.seed.length === 0) {
    fail('world.spec.seed must be a non-empty string.');
  }
  if (!Array.isArray(candidate.ground)) {
    fail('world.ground must be an array.');
  }
  if (candidate.ground.length !== expectedCells) {
    fail(`world.ground has ${candidate.ground.length} cells; expected ${expectedCells}.`);
  }

  for (let index = 0; index < expectedCells; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(candidate.ground, index);
    if (
      !descriptor
      || !descriptor.enumerable
      || !('value' in descriptor)
      || !Number.isSafeInteger(descriptor.value)
      || descriptor.value < 0
      || descriptor.value > 3
    ) {
      fail(`world.ground[${index}] must be a semantic tile ID from 0 through 3.`);
    }
  }

  return {
    width: width as number,
    height: height as number,
    seed: candidate.spec.seed,
    semanticGround: candidate.ground as number[],
  };
}

function coordinateHash(seed: string, x: number, y: number): number {
  const value = `${seed}\u0000${x}\u0000${y}`;
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function connectedAt(
  cells: readonly number[],
  width: number,
  height: number,
  x: number,
  y: number,
  semanticId: number,
): boolean {
  return x >= 0 && x < width && y >= 0 && y < height && cells[y * width + x] === semanticId;
}

/** N=1, E=2, S=4, W=8. Out-of-bounds and other semantic tiles never connect. */
export function cardinalMaskAt(
  cells: readonly number[],
  width: number,
  height: number,
  x: number,
  y: number,
  semanticId: 1 | 2,
): number {
  let mask = 0;
  if (connectedAt(cells, width, height, x, y - 1, semanticId)) mask |= CARDINAL_MASK.north;
  if (connectedAt(cells, width, height, x + 1, y, semanticId)) mask |= CARDINAL_MASK.east;
  if (connectedAt(cells, width, height, x, y + 1, semanticId)) mask |= CARDINAL_MASK.south;
  if (connectedAt(cells, width, height, x - 1, y, semanticId)) mask |= CARDINAL_MASK.west;
  return mask;
}

function assertOutputLength(layer: PlayableTerrainLayer, expectedCells: number): void {
  if (layer.cells.length !== expectedCells) {
    throw new Error(
      `Playable terrain projection invariant failed: ${layer.id} has ${layer.cells.length} cells; expected ${expectedCells}.`,
    );
  }
}

/**
 * Projects the semantic generator layer into three Godot-ready, row-major layers.
 * The function only reads the world and always allocates new output arrays.
 */
export function projectPlayableTerrain(world: GeneratedWorld): PlayableTerrainProjection {
  const { width, height, seed, semanticGround } = validateProjectionInput(world);
  const expectedCells = width * height;
  const groundCells = new Array<number>(expectedCells);
  const waterCells = new Array<number>(expectedCells).fill(EMPTY_TERRAIN_CELL);
  const roadCells = new Array<number>(expectedCells).fill(EMPTY_TERRAIN_CELL);

  for (let index = 0; index < expectedCells; index += 1) {
    const x = index % width;
    const y = Math.floor(index / width);
    const semanticId = semanticGround[index];

    groundCells[index] = semanticId === 3
      ? 2
      : coordinateHash(seed, x, y) % 4 === 0 ? 1 : 0;

    if (semanticId === 1) {
      waterCells[index] = 16 + cardinalMaskAt(semanticGround, width, height, x, y, 1);
    } else if (semanticId === 2) {
      roadCells[index] = 32 + cardinalMaskAt(semanticGround, width, height, x, y, 2);
    }
  }

  const layers: PlayableTerrainProjection['layers'] = [
    { id: 'ground', encoding: 'row-major', cells: groundCells },
    { id: 'water', encoding: 'row-major', cells: waterCells },
    { id: 'roads', encoding: 'row-major', cells: roadCells },
  ];
  for (const layer of layers) assertOutputLength(layer, expectedCells);

  return {
    width,
    height,
    layers,
    tileDefinitions: PLAYABLE_TERRAIN_TILE_DEFINITIONS,
  };
}
