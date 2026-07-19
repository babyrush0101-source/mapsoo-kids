import type { GeneratorIdentity } from './generator-identity';

export const LEGACY_WORLD_SCHEMA_VERSION = '0.1.0' as const;
export const WORLD_SCHEMA_VERSION = '0.2.0' as const;

export type BiomeId = 'meadow' | 'desert' | 'snow';
export type TileSize = 16 | 32 | 64;

export const PLACE_KINDS = Object.freeze([
  'spawn',
  'settlement',
  'landmark',
  'resource',
  'encounter',
  'exit',
] as const);
export type PlaceKind = typeof PLACE_KINDS[number];

export const PLACE_PLACEMENTS = Object.freeze([
  'center',
  'near-water',
  'on-road',
  'map-edge',
] as const);
export type PlacePlacement = typeof PLACE_PLACEMENTS[number];

export interface WorldPlace {
  /** Stable, path-safe semantic identifier. */
  id: string;
  label: string;
  kind: PlaceKind;
  placement: PlacePlacement;
  /** Zero to eight unique, path-safe classification tags. */
  tags: string[];
}

interface WorldSpecBase {
  id: string;
  title: string;
  description: string;
  seed: string;
  visual: {
    style: 'pixel-art';
    tileSize: TileSize;
    palette: [string, string, string, string, string];
  };
  map: {
    width: number;
    height: number;
    biome: BiomeId;
  };
  output: {
    targets: ['common', 'godot', 'itch'];
    assetLicense: 'CC0-1.0';
  };
  /** Namespaced integration metadata, for example { "dev.stoyo": { ... } }. */
  extensions?: Record<string, unknown>;
}

/** The published Alpha.1-Alpha.4 contract, retained for explicit migration. */
export interface WorldSpecV010 extends WorldSpecBase {
  schemaVersion: typeof LEGACY_WORLD_SCHEMA_VERSION;
}

/** Alpha.5 contract. Omitting places means the author has declared no semantic locations. */
export interface WorldSpecV020 extends WorldSpecBase {
  schemaVersion: typeof WORLD_SCHEMA_VERSION;
  places?: WorldPlace[];
}

export type WorldSpec = WorldSpecV020;
export type AnyWorldSpec = WorldSpecV010 | WorldSpecV020;

export interface TileDefinition {
  id: number;
  name: 'ground' | 'water' | 'path' | 'detail';
  color: string;
  accent: string;
  walkable: boolean;
}

export type PropKind = 'tree' | 'rock' | 'flower' | 'shrub' | 'log' | 'marker';

export interface WorldProp {
  id: string;
  kind: PropKind;
  x: number;
  y: number;
}

export interface GeneratedWorld {
  generator: GeneratorIdentity;
  spec: WorldSpec;
  tiles: TileDefinition[];
  ground: number[];
  props: WorldProp[];
}

export const BIOME_PALETTES: Record<BiomeId, WorldSpec['visual']['palette']> = {
  meadow: ['#2f5d3a', '#76a950', '#b8d978', '#4f91ad', '#d6c18b'],
  desert: ['#6f4e37', '#c88b4a', '#e9c46a', '#5d91a8', '#f4e1b6'],
  snow: ['#34495e', '#8aa7bb', '#dcebf2', '#4e82a6', '#a8bbc8'],
};

export const DEFAULT_WORLD_SPEC: WorldSpec = {
  schemaVersion: WORLD_SCHEMA_VERSION,
  id: 'sunny-meadow',
  title: 'Sunny Meadow',
  description: 'A gentle meadow crossed by a winding stream.',
  seed: 'mapsoo-demo-001',
  visual: {
    style: 'pixel-art',
    tileSize: 32,
    palette: [...BIOME_PALETTES.meadow],
  },
  map: {
    width: 24,
    height: 16,
    biome: 'meadow',
  },
  output: {
    targets: ['common', 'godot', 'itch'],
    assetLicense: 'CC0-1.0',
  },
  places: [
    { id: 'spawn', label: 'Meadow Spawn', kind: 'spawn', placement: 'center', tags: ['start', 'safe'] },
    {
      id: 'landmark',
      label: 'Riverside Landmark',
      kind: 'landmark',
      placement: 'near-water',
      tags: ['water', 'navigation'],
    },
    { id: 'exit', label: 'Road Exit', kind: 'exit', placement: 'map-edge', tags: ['travel'] },
  ],
};

export function cloneWorldSpec(spec: WorldSpec): WorldSpec {
  return {
    ...spec,
    visual: { ...spec.visual, palette: [...spec.visual.palette] },
    map: { ...spec.map },
    output: { ...spec.output, targets: [...spec.output.targets] },
    ...(spec.places ? { places: spec.places.map((place) => ({ ...place, tags: [...place.tags] })) } : {}),
    ...(spec.extensions ? { extensions: structuredClone(spec.extensions) } : {}),
  };
}

/**
 * Losslessly upgrades the structural v0.1 contract. No places are invented:
 * semantic locations must be an explicit author decision in v0.2.
 */
export function migrateWorldSpecV010(spec: WorldSpecV010): WorldSpecV020 {
  return {
    schemaVersion: WORLD_SCHEMA_VERSION,
    id: spec.id,
    title: spec.title,
    description: spec.description,
    seed: spec.seed,
    visual: { ...spec.visual, palette: [...spec.visual.palette] },
    map: { ...spec.map },
    output: { ...spec.output, targets: [...spec.output.targets] },
    ...(spec.extensions ? { extensions: structuredClone(spec.extensions) } : {}),
  };
}
