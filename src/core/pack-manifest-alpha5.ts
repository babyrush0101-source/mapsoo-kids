import type { GenerationRunResult } from './generation-evidence';
import {
  buildAlpha4PackManifest,
  type Alpha4PackManifest,
} from './pack-manifest-alpha4';
import { assertSafePackPath, type PackFileRecord } from './pack-manifest';
import { resolveSemanticPlaces } from './semantic-places';

export const ALPHA5_PACK_VERSION = '0.1.0-alpha.5' as const;
export const ALPHA5_PACK_SCHEMA_VERSION = '0.3.0' as const;
export const ALPHA5_PLACES_SCHEMA_VERSION = '0.1.0' as const;
export const ALPHA5_IMPORTER_MIN_VERSION = '0.1.0-alpha.5' as const;
export const ALPHA5_PLACES_PATH = 'runtime/places.json' as const;
export const ALPHA5_PLACES_SCHEMA_PATH = 'schema/mapsoo-places-0.1.schema.json' as const;
export const ALPHA5_PLACES_ATLAS_PATH = 'atlases/places.png' as const;
export const ALPHA5_PLACEMENT_ALGORITHM = Object.freeze({
  id: 'mapsoo-semantic-place-resolver',
  version: '0.1.0',
} as const);

type FileReference = Readonly<{ path: string; sha256: string }>;
const PLACE_KINDS = [
  'spawn',
  'settlement',
  'landmark',
  'resource',
  'encounter',
  'exit',
] as const;
type Alpha5PlaceKind = typeof PLACE_KINDS[number];
type Alpha5PlaceSpriteId = `place-${Alpha5PlaceKind}-01`;

export interface Alpha5PlacesSidecar {
  readonly schema_version: typeof ALPHA5_PLACES_SCHEMA_VERSION;
  readonly pack: {
    readonly id: string;
    readonly version: typeof ALPHA5_PACK_VERSION;
  };
  readonly world_spec: FileReference;
  readonly coordinate_space: {
    readonly origin: 'top-left';
    readonly unit: 'cell';
    readonly tile_size: number;
  };
  readonly placement_algorithm: typeof ALPHA5_PLACEMENT_ALGORITHM;
  readonly places: readonly {
    readonly id: string;
    readonly order: number;
    readonly label: string;
    readonly kind: ReturnType<typeof resolveSemanticPlaces>[number]['kind'];
    readonly placement: ReturnType<typeof resolveSemanticPlaces>[number]['placement'];
    readonly sprite_id: Alpha5PlaceSpriteId;
    readonly tags: readonly string[];
    readonly cell: Readonly<{ x: number; y: number }>;
    readonly pixel_center: Readonly<{ x: number; y: number }>;
  }[];
}

export type Alpha5PackManifest = Omit<
  Alpha4PackManifest,
  'schema_version' | 'pack' | 'compatibility' | 'sprites' | 'files'
> & Readonly<{
  schema_version: typeof ALPHA5_PACK_SCHEMA_VERSION;
  pack: Omit<Alpha4PackManifest['pack'], 'version' | 'generator'> & Readonly<{
    version: typeof ALPHA5_PACK_VERSION;
    generator: Readonly<{
      name: 'Mapsoo Worldsmith';
      version: typeof ALPHA5_PACK_VERSION;
    }>;
  }>;
  compatibility: Omit<Alpha4PackManifest['compatibility'], 'importer'> & Readonly<{
    importer: Omit<Alpha4PackManifest['compatibility']['importer'], 'min_version'> & Readonly<{
      min_version: typeof ALPHA5_IMPORTER_MIN_VERSION;
    }>;
  }>;
  runtime: Readonly<{
    places: Readonly<{
      path: typeof ALPHA5_PLACES_PATH;
      sha256: string;
      schema: Readonly<{
        path: typeof ALPHA5_PLACES_SCHEMA_PATH;
        sha256: string;
      }>;
    }>;
  }>;
  sprites: readonly (Alpha4PackManifest['sprites'][number] | Alpha5PlaceSprite)[];
  files: readonly PackFileRecord[];
}>;

interface Alpha5PlaceSprite {
  readonly id: Alpha5PlaceSpriteId;
  readonly atlas: typeof ALPHA5_PLACES_ATLAS_PATH;
  readonly region_px: readonly [number, number, number, number];
  readonly pivot_px: readonly [number, number];
  readonly footprint_cells: readonly [1, 1];
  readonly tags: readonly ['place', Alpha5PlaceKind];
}

export interface BuildAlpha5PackManifestInput {
  readonly run: GenerationRunResult;
  readonly files: readonly PackFileRecord[];
  readonly receiptBytes: Uint8Array;
  readonly placesBytes: Uint8Array;
}

async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function parseJsonBytes(bytes: Uint8Array): unknown {
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new Error('The alpha.5 places sidecar must be strict UTF-8 JSON.');
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
  if (typeof left !== 'object' || left === null || typeof right !== 'object' || right === null) {
    return false;
  }
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

function requireFile(files: readonly PackFileRecord[], path: string): PackFileRecord {
  const safePath = assertSafePackPath(path);
  const file = files.find((entry) => entry.path === safePath);
  if (!file) throw new Error(`Manifest references missing pack file: ${safePath}`);
  return file;
}

function expectedMediaType(path: string): string {
  if (path.endsWith('.json')) return 'application/json';
  if (path.endsWith('.md')) return 'text/markdown';
  if (path.endsWith('.png')) return 'image/png';
  throw new Error(`Alpha.5 payload has no registered media type: ${path}`);
}

function assertExactAlpha5Payload(files: readonly PackFileRecord[], worldSpecPath: string): void {
  const expected = [
    'atlases/props.png',
    ALPHA5_PLACES_ATLAS_PATH,
    'atlases/terrain.png',
    'generation-receipt.json',
    'license-assets.md',
    'previews/map-preview.png',
    'readme.md',
    ALPHA5_PLACES_PATH,
    'schema/mapsoo-generation-receipt.schema.json',
    'schema/mapsoo-pack-0.3.schema.json',
    ALPHA5_PLACES_SCHEMA_PATH,
    'schema/mapsoo-world-0.2.schema.json',
    'worlds/demo-world.json',
    worldSpecPath,
  ].sort();
  const actual = files.map(({ path }) => path).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error('Alpha.5 manifest requires the exact 14-file semantic-places payload contract.');
  }
  for (const file of files) {
    if (file.media_type !== expectedMediaType(file.path)) {
      throw new Error(`Alpha.5 payload media type mismatch for ${file.path}.`);
    }
  }
}

function alpha4CompatibilityFiles(files: readonly PackFileRecord[]): PackFileRecord[] {
  return files
    .filter(({ path }) => path !== ALPHA5_PLACES_PATH
      && path !== ALPHA5_PLACES_SCHEMA_PATH
      && path !== ALPHA5_PLACES_ATLAS_PATH)
    .map((file) => {
      if (file.path === 'schema/mapsoo-pack-0.3.schema.json') {
        return { ...file, path: 'schema/mapsoo-pack-0.2.schema.json' };
      }
      if (file.path === 'schema/mapsoo-world-0.2.schema.json') {
        return { ...file, path: 'schema/mapsoo-world.schema.json' };
      }
      return file;
    });
}

export function buildAlpha5PlacesSidecar(
  run: GenerationRunResult,
  worldSpec: FileReference,
): Alpha5PlacesSidecar {
  const worldSpecPath = assertSafePackPath(worldSpec.path);
  if (!/^[a-f0-9]{64}$/.test(worldSpec.sha256)) {
    throw new Error('Invalid alpha.5 World Spec SHA-256.');
  }
  const places = resolveSemanticPlaces(run.world).map((place) => ({
    id: place.id,
    order: place.order,
    label: place.label,
    kind: place.kind,
    placement: place.placement,
    sprite_id: `place-${place.kind}-01` as const,
    tags: [...place.tags],
    cell: { x: place.cell.x, y: place.cell.y },
    pixel_center: { x: place.pixelCenter.x, y: place.pixelCenter.y },
  }));
  return deepFreeze({
    schema_version: ALPHA5_PLACES_SCHEMA_VERSION,
    pack: { id: run.world.spec.id, version: ALPHA5_PACK_VERSION },
    world_spec: { path: worldSpecPath, sha256: worldSpec.sha256 },
    coordinate_space: {
      origin: 'top-left',
      unit: 'cell',
      tile_size: run.world.spec.visual.tileSize,
    },
    placement_algorithm: ALPHA5_PLACEMENT_ALGORITHM,
    places,
  });
}

export async function buildAlpha5PackManifest({
  run,
  files,
  receiptBytes,
  placesBytes,
}: BuildAlpha5PackManifestInput): Promise<Alpha5PackManifest> {
  const fileSnapshot = snapshotFiles(files);
  const placesSnapshot = Uint8Array.from(placesBytes);
  const worldSpecPath = assertSafePackPath(`worlds/${run.world.spec.id}.world.json`);
  assertExactAlpha5Payload(fileSnapshot, worldSpecPath);

  const base = await buildAlpha4PackManifest({
    run,
    receiptBytes: Uint8Array.from(receiptBytes),
    files: alpha4CompatibilityFiles(fileSnapshot),
  });
  const worldSpec = requireFile(fileSnapshot, worldSpecPath);
  const placesRecord = requireFile(fileSnapshot, ALPHA5_PLACES_PATH);
  const placesSchemaRecord = requireFile(fileSnapshot, ALPHA5_PLACES_SCHEMA_PATH);
  requireFile(fileSnapshot, ALPHA5_PLACES_ATLAS_PATH);
  if (placesRecord.bytes !== placesSnapshot.byteLength || placesRecord.sha256 !== await sha256Bytes(placesSnapshot)) {
    throw new Error('The alpha.5 places file record does not match the shipped sidecar bytes.');
  }

  const expectedPlaces = buildAlpha5PlacesSidecar(run, {
    path: worldSpecPath,
    sha256: worldSpec.sha256,
  });
  const parsedPlaces = parseJsonBytes(placesSnapshot);
  if (!structurallyEqual(parsedPlaces, expectedPlaces)) {
    throw new Error('The alpha.5 places sidecar is not an exact projection of the generated world.');
  }
  const canonicalPlacesBytes = new TextEncoder().encode(`${JSON.stringify(expectedPlaces, null, 2)}\n`);
  if (!bytesEqual(placesSnapshot, canonicalPlacesBytes)) {
    throw new Error('The alpha.5 places sidecar is not the canonical serialization.');
  }

  return deepFreeze({
    ...base,
    schema_version: ALPHA5_PACK_SCHEMA_VERSION,
    pack: {
      ...base.pack,
      version: ALPHA5_PACK_VERSION,
      generator: { name: 'Mapsoo Worldsmith', version: ALPHA5_PACK_VERSION },
    },
    compatibility: {
      ...base.compatibility,
      importer: {
        ...base.compatibility.importer,
        min_version: ALPHA5_IMPORTER_MIN_VERSION,
      },
    },
    runtime: {
      places: {
        path: ALPHA5_PLACES_PATH,
        sha256: placesRecord.sha256,
        schema: {
          path: ALPHA5_PLACES_SCHEMA_PATH,
          sha256: placesSchemaRecord.sha256,
        },
      },
    },
    sprites: [
      ...base.sprites,
      ...PLACE_KINDS.map((kind, index): Alpha5PlaceSprite => ({
        id: `place-${kind}-01`,
        atlas: ALPHA5_PLACES_ATLAS_PATH,
        region_px: [index * run.world.spec.visual.tileSize, 0, run.world.spec.visual.tileSize, run.world.spec.visual.tileSize],
        pivot_px: [Math.floor(run.world.spec.visual.tileSize / 2), run.world.spec.visual.tileSize],
        footprint_cells: [1, 1],
        tags: ['place', kind],
      })),
    ],
    files: fileSnapshot,
  });
}
