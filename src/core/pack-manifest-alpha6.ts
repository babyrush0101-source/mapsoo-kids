import type { GenerationRunResult } from './generation-evidence';
import {
  ALPHA5_PLACEMENT_ALGORITHM,
  ALPHA5_PLACES_SCHEMA_VERSION,
  buildAlpha5PackManifest,
  buildAlpha5PlacesSidecar,
  type Alpha5PackManifest,
  type Alpha5PlacesSidecar,
} from './pack-manifest-alpha5';
import { assertSafePackPath, type PackFileRecord } from './pack-manifest';
import { resolveSemanticPlaces } from './semantic-places';
import { resolveSemanticStructures } from './semantic-structures';
import { STRUCTURE_ARCHETYPES, type StructureArchetype } from './world-spec';

export const ALPHA6_PACK_VERSION = '0.1.0-alpha.6' as const;
export const ALPHA6_PACK_SCHEMA_VERSION = '0.4.0' as const;
export const ALPHA6_IMPORTER_MIN_VERSION = '0.1.0-alpha.6' as const;
export const ALPHA6_PLACES_PATH = 'runtime/places.json' as const;
export const ALPHA6_PLACES_SCHEMA_VERSION = '0.2.0' as const;
export const ALPHA6_PLACES_SCHEMA_PATH = 'schema/mapsoo-places-0.2.schema.json' as const;
export const ALPHA6_PLACES_ATLAS_PATH = 'atlases/places.png' as const;
export const ALPHA6_STRUCTURES_SCHEMA_VERSION = '0.1.0' as const;
export const ALPHA6_STRUCTURES_PATH = 'runtime/structures.json' as const;
export const ALPHA6_STRUCTURES_SCHEMA_PATH = 'schema/mapsoo-structures-0.1.schema.json' as const;
export const ALPHA6_STRUCTURES_ATLAS_PATH = 'atlases/structures.png' as const;
export const ALPHA6_STRUCTURE_RESOLUTION_ALGORITHM = Object.freeze({
  id: 'mapsoo-semantic-structure-resolver',
  version: '0.1.0',
} as const);

type FileReference = Readonly<{ path: string; sha256: string }>;
type StructureSpriteId = `structure-${StructureArchetype}-01`;

export type Alpha6PlacesSidecar = Omit<Alpha5PlacesSidecar, 'schema_version' | 'pack'> & Readonly<{
  schema_version: typeof ALPHA6_PLACES_SCHEMA_VERSION;
  pack: Readonly<{ id: string; version: typeof ALPHA6_PACK_VERSION }>;
}>;

export interface Alpha6StructuresSidecar {
  readonly schema_version: typeof ALPHA6_STRUCTURES_SCHEMA_VERSION;
  readonly pack: Readonly<{ id: string; version: typeof ALPHA6_PACK_VERSION }>;
  readonly world_spec: FileReference;
  readonly places: FileReference;
  readonly coordinate_space: Readonly<{
    origin: 'top-left';
    unit: 'cell';
    tile_size: number;
  }>;
  readonly resolution_algorithm: typeof ALPHA6_STRUCTURE_RESOLUTION_ALGORITHM;
  readonly atlas: Readonly<{
    path: typeof ALPHA6_STRUCTURES_ATLAS_PATH;
    sprite_size_px: readonly [number, number];
    pivot_px: readonly [number, number];
  }>;
  readonly structures: readonly Readonly<{
    id: string;
    order: number;
    place_id: string;
    archetype: StructureArchetype;
    sprite_id: StructureSpriteId;
    cell: Readonly<{ x: number; y: number }>;
    pixel_center: Readonly<{ x: number; y: number }>;
    region_px: readonly [number, number, number, number];
    pivot_px: readonly [number, number];
  }>[];
}

interface Alpha6StructureSprite {
  readonly id: StructureSpriteId;
  readonly atlas: typeof ALPHA6_STRUCTURES_ATLAS_PATH;
  readonly region_px: readonly [number, number, number, number];
  readonly pivot_px: readonly [number, number];
  readonly footprint_cells: readonly [2, 2];
  readonly tags: readonly ['structure', StructureArchetype];
}

export type Alpha6PackManifest = Omit<
  Alpha5PackManifest,
  'schema_version' | 'pack' | 'compatibility' | 'runtime' | 'sprites' | 'files'
> & Readonly<{
  schema_version: typeof ALPHA6_PACK_SCHEMA_VERSION;
  pack: Omit<Alpha5PackManifest['pack'], 'version' | 'generator'> & Readonly<{
    version: typeof ALPHA6_PACK_VERSION;
    generator: Readonly<{ name: 'Mapsoo Worldsmith'; version: typeof ALPHA6_PACK_VERSION }>;
  }>;
  compatibility: Omit<Alpha5PackManifest['compatibility'], 'importer'> & Readonly<{
    importer: Omit<Alpha5PackManifest['compatibility']['importer'], 'min_version'> & Readonly<{
      min_version: typeof ALPHA6_IMPORTER_MIN_VERSION;
    }>;
  }>;
  runtime: Readonly<{
    places: Readonly<{ path: typeof ALPHA6_PLACES_PATH; sha256: string; schema: FileReference }>;
    structures: Readonly<{ path: typeof ALPHA6_STRUCTURES_PATH; sha256: string; schema: FileReference }>;
  }>;
  sprites: readonly (Alpha5PackManifest['sprites'][number] | Alpha6StructureSprite)[];
  files: readonly PackFileRecord[];
}>;

export interface BuildAlpha6PackManifestInput {
  readonly run: GenerationRunResult;
  readonly files: readonly PackFileRecord[];
  readonly receiptBytes: Uint8Array;
  readonly placesBytes: Uint8Array;
  readonly structuresBytes: Uint8Array;
}

async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach((child) => deepFreeze(child));
    Object.freeze(value);
  }
  return value;
}

function parseJsonBytes(bytes: Uint8Array, label: string): unknown {
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new Error(`The alpha.6 ${label} sidecar must be strict UTF-8 JSON.`);
  }
}

function structurallyEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length
      && left.every((entry, index) => structurallyEqual(entry, right[index]));
  }
  if (typeof left !== 'object' || left === null || typeof right !== 'object' || right === null) return false;
  const a = left as Record<string, unknown>;
  const b = right as Record<string, unknown>;
  const ak = Object.keys(a).sort();
  const bk = Object.keys(b).sort();
  return ak.length === bk.length && ak.every((key, index) => key === bk[index] && structurallyEqual(a[key], b[key]));
}

function canonicalBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(value, null, 2)}\n`);
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((byte, index) => byte === right[index]);
}

function snapshotFiles(files: readonly PackFileRecord[]): PackFileRecord[] {
  const seen = new Set<string>();
  return files.map((file) => {
    const path = assertSafePackPath(file.path);
    if (seen.has(path)) throw new Error(`Duplicate pack file path: ${path}`);
    if (!/^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/.test(file.media_type)) {
      throw new Error(`Invalid pack media type for ${path}.`);
    }
    if (!Number.isSafeInteger(file.bytes) || file.bytes < 0) throw new Error(`Invalid pack byte length for ${path}.`);
    if (!/^[a-f0-9]{64}$/.test(file.sha256)) throw new Error(`Invalid pack SHA-256 for ${path}.`);
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
  throw new Error(`Alpha.6 payload has no registered media type: ${path}`);
}

function assertExactAlpha6Payload(files: readonly PackFileRecord[], worldSpecPath: string): void {
  const expected = [
    'atlases/props.png', ALPHA6_PLACES_ATLAS_PATH, ALPHA6_STRUCTURES_ATLAS_PATH, 'atlases/terrain.png',
    'generation-receipt.json', 'license-assets.md', 'previews/map-preview.png', 'readme.md',
    ALPHA6_PLACES_PATH, ALPHA6_STRUCTURES_PATH, 'schema/mapsoo-generation-receipt.schema.json',
    'schema/mapsoo-pack-0.4.schema.json', ALPHA6_PLACES_SCHEMA_PATH, ALPHA6_STRUCTURES_SCHEMA_PATH,
    'schema/mapsoo-world-0.3.schema.json', 'worlds/demo-world.json', worldSpecPath,
  ].sort();
  const actual = files.map(({ path }) => path).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error('Alpha.6 manifest requires the exact 17-file semantic-structures payload contract.');
  }
  for (const file of files) {
    if (file.media_type !== expectedMediaType(file.path)) throw new Error(`Alpha.6 payload media type mismatch for ${file.path}.`);
  }
}

export function buildAlpha6PlacesSidecar(run: GenerationRunResult, worldSpec: FileReference): Alpha6PlacesSidecar {
  const alpha5 = buildAlpha5PlacesSidecar(run, worldSpec);
  return deepFreeze({
    ...alpha5,
    schema_version: ALPHA6_PLACES_SCHEMA_VERSION,
    pack: { id: alpha5.pack.id, version: ALPHA6_PACK_VERSION },
  });
}

export function buildAlpha6StructuresSidecar(
  run: GenerationRunResult,
  worldSpec: FileReference,
  places: FileReference,
): Alpha6StructuresSidecar {
  const worldSpecPath = assertSafePackPath(worldSpec.path);
  const placesPath = assertSafePackPath(places.path);
  if (!/^[a-f0-9]{64}$/.test(worldSpec.sha256)) throw new Error('Invalid alpha.6 World Spec SHA-256.');
  if (!/^[a-f0-9]{64}$/.test(places.sha256)) throw new Error('Invalid alpha.6 places SHA-256.');
  const tile = run.world.spec.visual.tileSize;
  const spriteSize = tile * 2;
  const structures = resolveSemanticStructures(run.world).map((structure) => {
    const atlasIndex = STRUCTURE_ARCHETYPES.indexOf(structure.archetype);
    return {
      id: structure.id,
      order: structure.order,
      place_id: structure.placeId,
      archetype: structure.archetype,
      sprite_id: `structure-${structure.archetype}-01` as const,
      cell: { x: structure.cell.x, y: structure.cell.y },
      pixel_center: { x: structure.pixelCenter.x, y: structure.pixelCenter.y },
      region_px: [atlasIndex * spriteSize, 0, spriteSize, spriteSize] as const,
      pivot_px: [tile, spriteSize] as const,
    };
  });
  return deepFreeze({
    schema_version: ALPHA6_STRUCTURES_SCHEMA_VERSION,
    pack: { id: run.world.spec.id, version: ALPHA6_PACK_VERSION },
    world_spec: { path: worldSpecPath, sha256: worldSpec.sha256 },
    places: { path: placesPath, sha256: places.sha256 },
    coordinate_space: { origin: 'top-left', unit: 'cell', tile_size: tile },
    resolution_algorithm: ALPHA6_STRUCTURE_RESOLUTION_ALGORITHM,
    atlas: {
      path: ALPHA6_STRUCTURES_ATLAS_PATH,
      sprite_size_px: [spriteSize, spriteSize],
      pivot_px: [tile, spriteSize],
    },
    structures,
  });
}

function alpha5CompatibilityFiles(files: readonly PackFileRecord[], syntheticPlaces: PackFileRecord): PackFileRecord[] {
  const alpha6OnlyPaths = new Set<string>([
    ALPHA6_STRUCTURES_PATH,
    ALPHA6_STRUCTURES_SCHEMA_PATH,
    ALPHA6_STRUCTURES_ATLAS_PATH,
  ]);
  return files.filter(({ path }) => !alpha6OnlyPaths.has(path)).map((file) => {
    if (file.path === ALPHA6_PLACES_PATH) return syntheticPlaces;
    if (file.path === ALPHA6_PLACES_SCHEMA_PATH) return { ...file, path: 'schema/mapsoo-places-0.1.schema.json' };
    if (file.path === 'schema/mapsoo-pack-0.4.schema.json') return { ...file, path: 'schema/mapsoo-pack-0.3.schema.json' };
    if (file.path === 'schema/mapsoo-world-0.3.schema.json') return { ...file, path: 'schema/mapsoo-world-0.2.schema.json' };
    return file;
  });
}

export async function buildAlpha6PackManifest({
  run, files, receiptBytes, placesBytes, structuresBytes,
}: BuildAlpha6PackManifestInput): Promise<Alpha6PackManifest> {
  const fileSnapshot = snapshotFiles(files);
  const worldSpecPath = assertSafePackPath(`worlds/${run.world.spec.id}.world.json`);
  assertExactAlpha6Payload(fileSnapshot, worldSpecPath);

  const worldSpec = requireFile(fileSnapshot, worldSpecPath);
  const placesRecord = requireFile(fileSnapshot, ALPHA6_PLACES_PATH);
  const structuresRecord = requireFile(fileSnapshot, ALPHA6_STRUCTURES_PATH);
  const placesSchema = requireFile(fileSnapshot, ALPHA6_PLACES_SCHEMA_PATH);
  const structuresSchema = requireFile(fileSnapshot, ALPHA6_STRUCTURES_SCHEMA_PATH);
  requireFile(fileSnapshot, ALPHA6_STRUCTURES_ATLAS_PATH);

  const placesSnapshot = Uint8Array.from(placesBytes);
  const structuresSnapshot = Uint8Array.from(structuresBytes);
  if (placesRecord.bytes !== placesSnapshot.byteLength || placesRecord.sha256 !== await sha256Bytes(placesSnapshot)) {
    throw new Error('The alpha.6 places file record does not match the shipped sidecar bytes.');
  }
  if (structuresRecord.bytes !== structuresSnapshot.byteLength || structuresRecord.sha256 !== await sha256Bytes(structuresSnapshot)) {
    throw new Error('The alpha.6 structures file record does not match the shipped sidecar bytes.');
  }
  const expectedPlaces = buildAlpha6PlacesSidecar(run, { path: worldSpecPath, sha256: worldSpec.sha256 });
  const expectedStructures = buildAlpha6StructuresSidecar(run, { path: worldSpecPath, sha256: worldSpec.sha256 }, {
    path: ALPHA6_PLACES_PATH, sha256: placesRecord.sha256,
  });
  for (const [label, bytes, expected] of [
    ['places', placesSnapshot, expectedPlaces],
    ['structures', structuresSnapshot, expectedStructures],
  ] as const) {
    if (!structurallyEqual(parseJsonBytes(bytes, label), expected)) {
      throw new Error(`The alpha.6 ${label} sidecar is not an exact projection of the generated world.`);
    }
    if (!bytesEqual(bytes, canonicalBytes(expected))) {
      throw new Error(`The alpha.6 ${label} sidecar is not the canonical serialization.`);
    }
  }

  // Reuse the proven Alpha.5 manifest derivation with a synthetic canonical
  // Alpha.5 places record. The shipped Alpha.6 sidecar is verified above.
  const alpha5Places = buildAlpha5PlacesSidecar(run, { path: worldSpecPath, sha256: worldSpec.sha256 });
  const alpha5PlacesBytes = canonicalBytes(alpha5Places);
  const syntheticPlaces: PackFileRecord = {
    path: ALPHA6_PLACES_PATH,
    media_type: 'application/json',
    bytes: alpha5PlacesBytes.byteLength,
    sha256: await sha256Bytes(alpha5PlacesBytes),
  };
  const base = await buildAlpha5PackManifest({
    run,
    files: alpha5CompatibilityFiles(fileSnapshot, syntheticPlaces),
    receiptBytes: Uint8Array.from(receiptBytes),
    placesBytes: alpha5PlacesBytes,
  });
  const tile = run.world.spec.visual.tileSize;
  const spriteSize = tile * 2;
  return deepFreeze({
    ...base,
    schema_version: ALPHA6_PACK_SCHEMA_VERSION,
    pack: { ...base.pack, version: ALPHA6_PACK_VERSION, generator: { name: 'Mapsoo Worldsmith', version: ALPHA6_PACK_VERSION } },
    compatibility: { ...base.compatibility, importer: { ...base.compatibility.importer, min_version: ALPHA6_IMPORTER_MIN_VERSION } },
    runtime: {
      places: { path: ALPHA6_PLACES_PATH, sha256: placesRecord.sha256, schema: { path: ALPHA6_PLACES_SCHEMA_PATH, sha256: placesSchema.sha256 } },
      structures: { path: ALPHA6_STRUCTURES_PATH, sha256: structuresRecord.sha256, schema: { path: ALPHA6_STRUCTURES_SCHEMA_PATH, sha256: structuresSchema.sha256 } },
    },
    sprites: [
      ...base.sprites,
      ...STRUCTURE_ARCHETYPES.map((archetype, index): Alpha6StructureSprite => ({
        id: `structure-${archetype}-01`, atlas: ALPHA6_STRUCTURES_ATLAS_PATH,
        region_px: [index * spriteSize, 0, spriteSize, spriteSize],
        pivot_px: [tile, spriteSize], footprint_cells: [2, 2], tags: ['structure', archetype],
      })),
    ],
    files: fileSnapshot,
  });
}
