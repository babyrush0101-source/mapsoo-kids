import { describe, expect, it } from 'vitest';
import type { GeneratedWorld } from './world-spec';
import {
  CARDINAL_MASK,
  EMPTY_TERRAIN_CELL,
  GROUND_TILE_DEFINITIONS,
  PLAYABLE_TERRAIN_ATLAS_COLUMNS,
  PLAYABLE_TERRAIN_TILE_DEFINITIONS,
  ROAD_TILE_DEFINITIONS,
  WATER_TILE_DEFINITIONS,
  projectPlayableTerrain,
} from './playable-terrain';
import { DEFAULT_WORLD_SPEC, cloneWorldSpec } from './world-spec';

function worldWith(width: number, height: number, ground: number[], seed = 'terrain-test'): GeneratedWorld {
  const spec = cloneWorldSpec(DEFAULT_WORLD_SPEC);
  spec.map.width = width;
  spec.map.height = height;
  spec.seed = seed;
  return {
    generator: { id: 'test-generator', version: '1.0.0' },
    spec,
    tiles: [],
    ground,
    props: [],
  };
}

function centerMaskWorld(semanticId: 1 | 2, mask: number): GeneratedWorld {
  const cells = new Array<number>(9).fill(0);
  cells[4] = semanticId;
  if (mask & CARDINAL_MASK.north) cells[1] = semanticId;
  if (mask & CARDINAL_MASK.east) cells[5] = semanticId;
  if (mask & CARDINAL_MASK.south) cells[7] = semanticId;
  if (mask & CARDINAL_MASK.west) cells[3] = semanticId;
  return worldWith(3, 3, cells);
}

describe('playable terrain tile contract', () => {
  it('defines exactly 3 ground, 16 water, and 16 road tiles with stable IDs', () => {
    expect(GROUND_TILE_DEFINITIONS.map((tile) => tile.tileId)).toEqual([0, 1, 2]);
    expect(WATER_TILE_DEFINITIONS.map((tile) => tile.tileId)).toEqual(
      Array.from({ length: 16 }, (_, mask) => 16 + mask),
    );
    expect(ROAD_TILE_DEFINITIONS.map((tile) => tile.tileId)).toEqual(
      Array.from({ length: 16 }, (_, mask) => 32 + mask),
    );
    expect(PLAYABLE_TERRAIN_TILE_DEFINITIONS).toHaveLength(3 + 16 + 16);
    expect(new Set(PLAYABLE_TERRAIN_TILE_DEFINITIONS.map((tile) => tile.tileId)).size).toBe(35);
  });

  it('maps every tile to its stable coordinate in an eight-column atlas', () => {
    expect(PLAYABLE_TERRAIN_ATLAS_COLUMNS).toBe(8);
    for (const tile of PLAYABLE_TERRAIN_TILE_DEFINITIONS) {
      expect(tile.atlasCoords).toEqual([
        tile.tileId % 8,
        Math.floor(tile.tileId / 8),
      ]);
    }
    expect(WATER_TILE_DEFINITIONS.map((tile) => tile.cardinalMask)).toEqual(
      Array.from({ length: 16 }, (_, mask) => mask),
    );
    expect(ROAD_TILE_DEFINITIONS.map((tile) => tile.cardinalMask)).toEqual(
      Array.from({ length: 16 }, (_, mask) => mask),
    );
  });
});

describe('projectPlayableTerrain', () => {
  it('projects all 16 water cardinal masks at a center cell', () => {
    for (let mask = 0; mask < 16; mask += 1) {
      const projection = projectPlayableTerrain(centerMaskWorld(1, mask));
      expect(projection.layers[1].cells[4], `water mask ${mask}`).toBe(16 + mask);
    }
  });

  it('projects all 16 road cardinal masks at a center cell', () => {
    for (let mask = 0; mask < 16; mask += 1) {
      const projection = projectPlayableTerrain(centerMaskWorld(2, mask));
      expect(projection.layers[2].cells[4], `road mask ${mask}`).toBe(32 + mask);
    }
  });

  it('does not connect across boundaries', () => {
    const water = projectPlayableTerrain(worldWith(2, 2, [1, 1, 1, 1]));
    expect(water.layers[1].cells).toEqual([
      16 + CARDINAL_MASK.east + CARDINAL_MASK.south,
      16 + CARDINAL_MASK.south + CARDINAL_MASK.west,
      16 + CARDINAL_MASK.north + CARDINAL_MASK.east,
      16 + CARDINAL_MASK.north + CARDINAL_MASK.west,
    ]);

    const roads = projectPlayableTerrain(worldWith(2, 2, [2, 2, 2, 2]));
    expect(roads.layers[2].cells).toEqual([
      32 + CARDINAL_MASK.east + CARDINAL_MASK.south,
      32 + CARDINAL_MASK.south + CARDINAL_MASK.west,
      32 + CARDINAL_MASK.north + CARDINAL_MASK.east,
      32 + CARDINAL_MASK.north + CARDINAL_MASK.west,
    ]);
  });

  it('does not connect water, roads, ground, or detail to unlike semantics', () => {
    const projection = projectPlayableTerrain(worldWith(3, 3, [
      0, 2, 0,
      3, 1, 2,
      0, 3, 0,
    ]));

    expect(projection.layers[1].cells[4]).toBe(16);
    expect(projection.layers[2].cells[1]).toBe(32);
    expect(projection.layers[2].cells[5]).toBe(32);
  });

  it('fills Ground, keeps Water and Roads sparse, and makes detail an explicit variant', () => {
    const projection = projectPlayableTerrain(worldWith(4, 2, [0, 1, 2, 3, 3, 2, 1, 0]));
    const [ground, water, roads] = projection.layers;

    expect(projection.width).toBe(4);
    expect(projection.height).toBe(2);
    expect(projection.layers.map((layer) => layer.id)).toEqual(['ground', 'water', 'roads']);
    expect(projection.layers.every((layer) => layer.encoding === 'row-major')).toBe(true);
    expect(projection.layers.map((layer) => layer.cells.length)).toEqual([8, 8, 8]);
    expect(ground.cells.every((tileId) => tileId >= 0 && tileId <= 2)).toBe(true);
    expect(ground.cells[3]).toBe(2);
    expect(ground.cells[4]).toBe(2);
    expect(water.cells.map((cell, index) => [index, cell]).filter(([, cell]) => cell !== EMPTY_TERRAIN_CELL))
      .toEqual([[1, 16], [6, 16]]);
    expect(roads.cells.map((cell, index) => [index, cell]).filter(([, cell]) => cell !== EMPTY_TERRAIN_CELL))
      .toEqual([[2, 32], [5, 32]]);
    expect(projection.tileDefinitions).toBe(PLAYABLE_TERRAIN_TILE_DEFINITIONS);
  });

  it('is deterministic for the same seed and coordinates without mutating the input', () => {
    const world = worldWith(8, 3, new Array<number>(24).fill(0), 'repeatable-seed');
    world.ground[7] = 3;
    const before = structuredClone(world);

    const first = projectPlayableTerrain(world);
    const second = projectPlayableTerrain(world);

    expect(second).toEqual(first);
    expect(world).toEqual(before);
    expect(first.layers[0].cells).not.toBe(second.layers[0].cells);
  });

  it.each([
    ['non-object root', null],
    ['zero width', worldWith(1, 1, [0])],
    ['fractional height', worldWith(1, 1, [0])],
    ['missing ground', { ...worldWith(1, 1, [0]), ground: null }],
    ['short ground', worldWith(2, 2, [0, 0, 0])],
    ['unknown semantic ID', worldWith(1, 1, [4])],
    ['negative semantic ID', worldWith(1, 1, [-1])],
    ['non-integer semantic ID', worldWith(1, 1, [1.5])],
  ])('rejects an invalid world: %s', (label, candidate) => {
    if (label === 'zero width') (candidate as GeneratedWorld).spec.map.width = 0;
    if (label === 'fractional height') (candidate as GeneratedWorld).spec.map.height = 1.5;
    expect(() => projectPlayableTerrain(candidate as GeneratedWorld)).toThrow(/Invalid playable terrain world:/);
  });

  it('rejects a sparse semantic input array', () => {
    const ground = new Array<number>(4);
    ground[0] = 0;
    ground[1] = 0;
    ground[3] = 0;
    expect(() => projectPlayableTerrain(worldWith(2, 2, ground))).toThrow(/ground\[2\]/);
  });
});
