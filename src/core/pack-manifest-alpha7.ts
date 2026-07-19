import type { GenerationRunResult } from './generation-evidence';
import { assertSafePackPath, type PackFileRecord } from './pack-manifest';
import {
  ALPHA6_PLACES_ATLAS_PATH,
  ALPHA6_PLACES_PATH,
  ALPHA6_STRUCTURES_ATLAS_PATH,
  ALPHA6_STRUCTURES_PATH,
  buildAlpha6PackManifest,
  buildAlpha6PlacesSidecar,
  buildAlpha6StructuresSidecar,
  type Alpha6PackManifest,
  type Alpha6PlacesSidecar,
  type Alpha6StructuresSidecar,
} from './pack-manifest-alpha6';

export const ALPHA7_PACK_VERSION = '0.1.0-alpha.7' as const;
export const ALPHA7_PACK_SCHEMA_VERSION = '0.5.0' as const;
export const ALPHA7_IMPORTER_MIN_VERSION = '0.1.0-alpha.7' as const;
export const ALPHA7_PLACES_PATH = ALPHA6_PLACES_PATH;
export const ALPHA7_PLACES_ATLAS_PATH = ALPHA6_PLACES_ATLAS_PATH;
export const ALPHA7_PLACES_SCHEMA_VERSION = '0.3.0' as const;
export const ALPHA7_PLACES_SCHEMA_PATH = 'schema/mapsoo-places-0.3.schema.json' as const;
export const ALPHA7_STRUCTURES_PATH = ALPHA6_STRUCTURES_PATH;
export const ALPHA7_STRUCTURES_ATLAS_PATH = ALPHA6_STRUCTURES_ATLAS_PATH;
export const ALPHA7_STRUCTURES_SCHEMA_VERSION = '0.2.0' as const;
export const ALPHA7_STRUCTURES_SCHEMA_PATH = 'schema/mapsoo-structures-0.2.schema.json' as const;

type FileReference = Readonly<{ path: string; sha256: string }>;

export type Alpha7PlacesSidecar = Omit<Alpha6PlacesSidecar, 'schema_version' | 'pack'> & Readonly<{
  schema_version: typeof ALPHA7_PLACES_SCHEMA_VERSION;
  pack: Readonly<{ id: string; version: typeof ALPHA7_PACK_VERSION }>;
}>;

export type Alpha7StructuresSidecar = Omit<Alpha6StructuresSidecar, 'schema_version' | 'pack'> & Readonly<{
  schema_version: typeof ALPHA7_STRUCTURES_SCHEMA_VERSION;
  pack: Readonly<{ id: string; version: typeof ALPHA7_PACK_VERSION }>;
}>;

export type Alpha7PackManifest = Omit<
  Alpha6PackManifest,
  'schema_version' | 'pack' | 'compatibility' | 'runtime' | 'files'
> & Readonly<{
  schema_version: typeof ALPHA7_PACK_SCHEMA_VERSION;
  pack: Omit<Alpha6PackManifest['pack'], 'version' | 'generator'> & Readonly<{
    version: typeof ALPHA7_PACK_VERSION;
    generator: Readonly<{ name: 'Mapsoo Worldsmith'; version: typeof ALPHA7_PACK_VERSION }>;
  }>;
  compatibility: Omit<Alpha6PackManifest['compatibility'], 'importer'> & Readonly<{
    importer: Omit<Alpha6PackManifest['compatibility']['importer'], 'min_version'> & Readonly<{
      min_version: typeof ALPHA7_IMPORTER_MIN_VERSION;
    }>;
  }>;
  runtime: Readonly<{
    places: Readonly<{ path: typeof ALPHA7_PLACES_PATH; sha256: string; schema: FileReference }>;
    structures: Readonly<{ path: typeof ALPHA7_STRUCTURES_PATH; sha256: string; schema: FileReference }>;
  }>;
  files: readonly PackFileRecord[];
}>;

export interface BuildAlpha7PackManifestInput {
  readonly run: GenerationRunResult;
  readonly files: readonly PackFileRecord[];
  readonly receiptBytes: Uint8Array;
  readonly placesBytes: Uint8Array;
  readonly structuresBytes: Uint8Array;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach((child) => deepFreeze(child));
    Object.freeze(value);
  }
  return value;
}

function canonicalBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(value, null, 2)}\n`);
}

async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
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
    return { ...file, path };
  });
}

function requireFile(files: readonly PackFileRecord[], path: string): PackFileRecord {
  const file = files.find((entry) => entry.path === path);
  if (!file) throw new Error(`Manifest references missing pack file: ${path}`);
  return file;
}

function assertExactPayload(files: readonly PackFileRecord[], worldSpecPath: string): void {
  const expected = [
    'atlases/places.png', 'atlases/props.png', 'atlases/structures.png', 'atlases/terrain.png',
    'generation-receipt.json', 'license-assets.md', 'previews/map-preview.png', 'readme.md',
    ALPHA7_PLACES_PATH, ALPHA7_STRUCTURES_PATH, 'schema/mapsoo-generation-receipt.schema.json',
    'schema/mapsoo-pack-0.5.schema.json', ALPHA7_PLACES_SCHEMA_PATH, ALPHA7_STRUCTURES_SCHEMA_PATH,
    'schema/mapsoo-world-0.3.schema.json', 'worlds/demo-world.json', worldSpecPath,
  ].sort();
  if (JSON.stringify(files.map(({ path }) => path).sort()) !== JSON.stringify(expected)) {
    throw new Error('Alpha.7 manifest requires the exact 17-file multi-world semantic-structures payload contract.');
  }
}

export function buildAlpha7PlacesSidecar(run: GenerationRunResult, worldSpec: FileReference): Alpha7PlacesSidecar {
  const base = buildAlpha6PlacesSidecar(run, worldSpec);
  return deepFreeze({
    ...base,
    schema_version: ALPHA7_PLACES_SCHEMA_VERSION,
    pack: { id: base.pack.id, version: ALPHA7_PACK_VERSION },
  });
}

export function buildAlpha7StructuresSidecar(
  run: GenerationRunResult,
  worldSpec: FileReference,
  places: FileReference,
): Alpha7StructuresSidecar {
  const base = buildAlpha6StructuresSidecar(run, worldSpec, places);
  return deepFreeze({
    ...base,
    schema_version: ALPHA7_STRUCTURES_SCHEMA_VERSION,
    pack: { id: base.pack.id, version: ALPHA7_PACK_VERSION },
  });
}

export async function buildAlpha7PackManifest({
  run, files, receiptBytes, placesBytes, structuresBytes,
}: BuildAlpha7PackManifestInput): Promise<Alpha7PackManifest> {
  const fileSnapshot = snapshotFiles(files);
  const worldSpecPath = assertSafePackPath(`worlds/${run.world.spec.id}.world.json`);
  assertExactPayload(fileSnapshot, worldSpecPath);
  const worldRecord = requireFile(fileSnapshot, worldSpecPath);
  const placesRecord = requireFile(fileSnapshot, ALPHA7_PLACES_PATH);
  const structuresRecord = requireFile(fileSnapshot, ALPHA7_STRUCTURES_PATH);
  const placesSchemaRecord = requireFile(fileSnapshot, ALPHA7_PLACES_SCHEMA_PATH);
  const structuresSchemaRecord = requireFile(fileSnapshot, ALPHA7_STRUCTURES_SCHEMA_PATH);

  const expectedPlaces = buildAlpha7PlacesSidecar(run, { path: worldSpecPath, sha256: worldRecord.sha256 });
  const expectedPlacesBytes = canonicalBytes(expectedPlaces);
  if (!sameBytes(placesBytes, expectedPlacesBytes) || placesRecord.sha256 !== await sha256Bytes(expectedPlacesBytes)) {
    throw new Error('The alpha.7 places sidecar is not the canonical generated projection.');
  }
  const expectedStructures = buildAlpha7StructuresSidecar(
    run,
    { path: worldSpecPath, sha256: worldRecord.sha256 },
    { path: ALPHA7_PLACES_PATH, sha256: placesRecord.sha256 },
  );
  const expectedStructuresBytes = canonicalBytes(expectedStructures);
  if (!sameBytes(structuresBytes, expectedStructuresBytes) || structuresRecord.sha256 !== await sha256Bytes(expectedStructuresBytes)) {
    throw new Error('The alpha.7 structures sidecar is not the canonical generated projection.');
  }

  // Alpha.6 remains immutable. Reuse its proven derivation with synthetic
  // compatibility records, then restore Alpha.7's independent files and bindings.
  const alpha6Places = buildAlpha6PlacesSidecar(run, { path: worldSpecPath, sha256: worldRecord.sha256 });
  const alpha6PlacesBytes = canonicalBytes(alpha6Places);
  const alpha6PlacesHash = await sha256Bytes(alpha6PlacesBytes);
  const alpha6Structures = buildAlpha6StructuresSidecar(
    run,
    { path: worldSpecPath, sha256: worldRecord.sha256 },
    { path: ALPHA6_PLACES_PATH, sha256: alpha6PlacesHash },
  );
  const alpha6StructuresBytes = canonicalBytes(alpha6Structures);
  const alpha6StructuresHash = await sha256Bytes(alpha6StructuresBytes);
  const compatibilityFiles = fileSnapshot.map((file) => {
    if (file.path === ALPHA7_PLACES_PATH) return { ...file, bytes: alpha6PlacesBytes.byteLength, sha256: alpha6PlacesHash };
    if (file.path === ALPHA7_STRUCTURES_PATH) return { ...file, bytes: alpha6StructuresBytes.byteLength, sha256: alpha6StructuresHash };
    if (file.path === 'schema/mapsoo-pack-0.5.schema.json') return { ...file, path: 'schema/mapsoo-pack-0.4.schema.json' };
    if (file.path === ALPHA7_PLACES_SCHEMA_PATH) return { ...file, path: 'schema/mapsoo-places-0.2.schema.json' };
    if (file.path === ALPHA7_STRUCTURES_SCHEMA_PATH) return { ...file, path: 'schema/mapsoo-structures-0.1.schema.json' };
    return file;
  });
  const base = await buildAlpha6PackManifest({
    run,
    files: compatibilityFiles,
    receiptBytes: Uint8Array.from(receiptBytes),
    placesBytes: alpha6PlacesBytes,
    structuresBytes: alpha6StructuresBytes,
  });

  return deepFreeze({
    ...base,
    schema_version: ALPHA7_PACK_SCHEMA_VERSION,
    pack: {
      ...base.pack,
      version: ALPHA7_PACK_VERSION,
      generator: { name: 'Mapsoo Worldsmith', version: ALPHA7_PACK_VERSION },
    },
    compatibility: {
      ...base.compatibility,
      importer: { ...base.compatibility.importer, min_version: ALPHA7_IMPORTER_MIN_VERSION },
    },
    runtime: {
      places: {
        path: ALPHA7_PLACES_PATH,
        sha256: placesRecord.sha256,
        schema: { path: ALPHA7_PLACES_SCHEMA_PATH, sha256: placesSchemaRecord.sha256 },
      },
      structures: {
        path: ALPHA7_STRUCTURES_PATH,
        sha256: structuresRecord.sha256,
        schema: { path: ALPHA7_STRUCTURES_SCHEMA_PATH, sha256: structuresSchemaRecord.sha256 },
      },
    },
    files: fileSnapshot,
  });
}
