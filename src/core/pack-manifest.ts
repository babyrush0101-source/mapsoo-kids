import type { GeneratedWorld } from './world-spec';
import { assertV01ProceduralGenerator } from './generator-identity';

export interface PackFileRecord {
  path: string;
  media_type: string;
  bytes: number;
  sha256: string;
}

export type PackReleaseVersion = '0.1.0-alpha.1' | '0.1.0-alpha.2';

export interface PackManifest {
  schema_version: '0.1.0';
  pack: {
    id: string;
    title: string;
    version: PackReleaseVersion;
    generator: { name: 'Mapsoo Worldsmith'; version: PackReleaseVersion };
    created_at: string;
  };
  compatibility: {
    godot_min: '4.3';
    grid: 'orthogonal';
    art_style: 'pixel_art';
    importer: {
      id: 'mapsoo_importer';
      min_version: '0.1.0-alpha.1';
      source: 'https://github.com/babyrush0101-source/mapsoo-kids';
    };
  };
  world_spec: { path: string; sha256: string };
  demo: { map: string; preview: string };
  layers: [
    {
      id: 'ground';
      kind: 'tilemap';
      path: string;
      json_pointer: '/layers/0/cells';
      encoding: 'row-major';
      dimensions_cells: [number, number];
      atlas_id: 'terrain';
      empty_tile_id: -1;
    },
    {
      id: 'props';
      kind: 'objects';
      path: string;
      json_pointer: '/props';
      encoding: 'objects';
      sprite_atlas: string;
    },
  ];
  receipt: { path: string };
  atlases: Array<{
    id: string;
    source_id: number;
    file: string;
    image_size_px: [number, number];
    cell_size_px: [number, number];
    margin_px: [0, 0];
    separation_px: [0, 0];
    texture_padding: true;
    tiles: Array<{
      tile_id: number;
      id: string;
      atlas_coords: [number, number];
      size_cells: [1, 1];
      alternative_id: 0;
      collision: { type: 'none' };
      terrain: null;
      custom_data: { walkable: boolean; biome: string };
      tags: string[];
    }>;
  }>;
  sprites: Array<{
    id: string;
    atlas: string;
    region_px: [number, number, number, number];
    pivot_px: [number, number];
    footprint_cells: [1, 1];
    tags: string[];
  }>;
  files: PackFileRecord[];
  license: {
    assets: { id: 'CC0-1.0'; file: string };
  };
  provenance: {
    contains_generative_ai: boolean;
    model_provider: string | null;
    model: string | null;
    seed: string;
    human_curated: boolean;
  };
}

export function isSafePackPath(path: string): boolean {
  const segments = path.split('/');
  return (
    path.length > 0 &&
    !path.includes('\\') &&
    !path.startsWith('/') &&
    segments.every((segment) => /^[a-z0-9][a-z0-9._-]*$/.test(segment))
  );
}

export function assertSafePackPath<T extends string>(path: T): T {
  if (!isSafePackPath(path)) {
    throw new Error(`Unsafe pack path: ${JSON.stringify(path)}`);
  }
  return path;
}

function indexPackFiles(files: PackFileRecord[]): Map<string, PackFileRecord> {
  const byPath = new Map<string, PackFileRecord>();

  files.forEach((file) => {
    assertSafePackPath(file.path);
    if (byPath.has(file.path)) {
      throw new Error(`Duplicate pack file path: ${file.path}`);
    }
    byPath.set(file.path, file);
  });

  return byPath;
}

function requirePackFile(files: Map<string, PackFileRecord>, path: string): PackFileRecord {
  const safePath = assertSafePackPath(path);
  const file = files.get(safePath);
  if (!file) {
    throw new Error(`Manifest references missing pack file: ${safePath}`);
  }
  return file;
}

export function buildPackManifest(
  world: GeneratedWorld,
  files: PackFileRecord[],
  createdAt: string,
): PackManifest {
  assertV01ProceduralGenerator(world.generator);
  const tileSize = world.spec.visual.tileSize;
  const propKinds = ['tree', 'rock', 'flower'] as const;
  const filesByPath = indexPackFiles(files);
  const worldSpecPath = assertSafePackPath(`worlds/${world.spec.id}.world.json`);
  const demoMapPath = assertSafePackPath('worlds/demo-world.json');
  const previewPath = assertSafePackPath('previews/map-preview.png');
  const receiptPath = assertSafePackPath('generation-receipt.json');
  const terrainAtlasPath = assertSafePackPath('atlases/terrain.png');
  const propsAtlasPath = assertSafePackPath('atlases/props.png');
  const licensePath = assertSafePackPath('license-assets.md');

  const worldSpecFile = requirePackFile(filesByPath, worldSpecPath);
  [demoMapPath, previewPath, receiptPath, terrainAtlasPath, propsAtlasPath, licensePath].forEach((path) =>
    requirePackFile(filesByPath, path),
  );

  return {
    schema_version: '0.1.0',
    pack: {
      id: world.spec.id,
      title: world.spec.title,
      version: '0.1.0-alpha.1',
      generator: { name: 'Mapsoo Worldsmith', version: '0.1.0-alpha.1' },
      created_at: createdAt,
    },
    compatibility: {
      godot_min: '4.3',
      grid: 'orthogonal',
      art_style: 'pixel_art',
      importer: {
        id: 'mapsoo_importer',
        min_version: '0.1.0-alpha.1',
        source: 'https://github.com/babyrush0101-source/mapsoo-kids',
      },
    },
    world_spec: { path: worldSpecPath, sha256: worldSpecFile.sha256 },
    demo: { map: demoMapPath, preview: previewPath },
    layers: [
      {
        id: 'ground',
        kind: 'tilemap',
        path: demoMapPath,
        json_pointer: '/layers/0/cells',
        encoding: 'row-major',
        dimensions_cells: [world.spec.map.width, world.spec.map.height],
        atlas_id: 'terrain',
        empty_tile_id: -1,
      },
      {
        id: 'props',
        kind: 'objects',
        path: demoMapPath,
        json_pointer: '/props',
        encoding: 'objects',
        sprite_atlas: propsAtlasPath,
      },
    ],
    receipt: { path: receiptPath },
    atlases: [
      {
        id: 'terrain',
        source_id: 0,
        file: terrainAtlasPath,
        image_size_px: [tileSize * world.tiles.length, tileSize],
        cell_size_px: [tileSize, tileSize],
        margin_px: [0, 0],
        separation_px: [0, 0],
        texture_padding: true,
        tiles: world.tiles.map((tile, index) => ({
          tile_id: tile.id,
          id: `${tile.name}_01`,
          atlas_coords: [index, 0],
          size_cells: [1, 1],
          alternative_id: 0,
          collision: { type: 'none' },
          terrain: null,
          custom_data: { walkable: tile.walkable, biome: world.spec.map.biome },
          tags: ['terrain', tile.name],
        })),
      },
    ],
    sprites: propKinds.map((kind, index) => ({
      id: `${kind}_01`,
      atlas: propsAtlasPath,
      region_px: [index * tileSize, 0, tileSize, tileSize],
      pivot_px: [Math.floor(tileSize / 2), tileSize],
      footprint_cells: [1, 1],
      tags: ['prop', kind, world.spec.map.biome],
    })),
    files,
    license: {
      assets: { id: 'CC0-1.0', file: licensePath },
    },
    provenance: {
      contains_generative_ai: false,
      model_provider: null,
      model: null,
      seed: world.spec.seed,
      human_curated: false,
    },
  };
}
