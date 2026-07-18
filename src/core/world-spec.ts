import type { GeneratorIdentity } from './generator-identity';

export const WORLD_SCHEMA_VERSION = '0.1.0' as const;

export type BiomeId = 'meadow' | 'desert' | 'snow';
export type TileSize = 16 | 32 | 64;

export interface WorldSpec {
  schemaVersion: typeof WORLD_SCHEMA_VERSION;
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

export interface TileDefinition {
  id: number;
  name: 'ground' | 'water' | 'path' | 'detail';
  color: string;
  accent: string;
  walkable: boolean;
}

export type PropKind = 'tree' | 'rock' | 'flower';

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
};

export function cloneWorldSpec(spec: WorldSpec): WorldSpec {
  return {
    ...spec,
    visual: { ...spec.visual, palette: [...spec.visual.palette] },
    map: { ...spec.map },
    output: { ...spec.output, targets: [...spec.output.targets] },
    ...(spec.extensions ? { extensions: structuredClone(spec.extensions) } : {}),
  };
}
