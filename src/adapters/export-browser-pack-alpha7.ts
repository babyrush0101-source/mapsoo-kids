import JSZip from 'jszip';
import generationReceiptSchema from '../../schemas/mapsoo-generation-receipt.schema.json';
import packSchema from '../../schemas/mapsoo-pack-0.5.schema.json';
import placesSchema from '../../schemas/mapsoo-places-0.3.schema.json';
import structuresSchema from '../../schemas/mapsoo-structures-0.2.schema.json';
import worldSchema from '../../schemas/mapsoo-world-0.3.schema.json';
import type { GenerationRunResult } from '../core/generation-evidence';
import { assertTrustedGenerationRun } from '../core/generation-provider';
import { assertSafePackPath, type PackFileRecord } from '../core/pack-manifest';
import {
  ALPHA7_PACK_VERSION,
  ALPHA7_PLACES_PATH,
  ALPHA7_STRUCTURES_PATH,
  buildAlpha7PackManifest,
  buildAlpha7PlacesSidecar,
  buildAlpha7StructuresSidecar,
} from '../core/pack-manifest-alpha7';
import { assertPlayableTerrainExportEvidence } from '../core/playable-terrain-export-policy';
import { projectPlayableTerrain } from '../core/playable-terrain';
import { resolveSemanticPlaces } from '../core/semantic-places';
import { resolveSemanticStructures } from '../core/semantic-structures';
import { projectTrustedGenerationReceipt } from '../core/trusted-generation-receipt';
import { validateGeneratedWorld } from '../core/validate-world';
import { ALPHA6_WORLD_SCHEMA_VERSION } from '../core/world-spec';
import { encodeCanvasPng } from './canvas/encode-png';
import {
  renderPlayablePropsAtlas,
  renderPlayableTerrainAtlas,
  renderPlayableWorldToCanvas,
  renderSemanticPlacesAtlas,
  renderSemanticStructuresAtlas,
} from './canvas/render-playable-world';
import { escapeMarkdownInline, revokeObjectUrlLater } from './export-browser-pack';

interface PayloadEntry {
  readonly path: string;
  readonly bytes: Uint8Array;
  readonly record: PackFileRecord;
}

const ZIP_DATE = new Date(Date.UTC(1980, 0, 1));

function jsonBlob(value: unknown): Blob {
  return new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: 'application/json' });
}

function textBlob(value: string): Blob {
  return new Blob([value], { type: 'text/markdown;charset=utf-8' });
}

async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function payloadEntry(path: string, blob: Blob): Promise<PayloadEntry> {
  const safePath = assertSafePackPath(path);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return {
    path: safePath,
    bytes,
    record: {
      path: safePath,
      media_type: blob.type.split(';')[0],
      bytes: bytes.byteLength,
      sha256: await sha256Bytes(bytes),
    },
  };
}

export function assertAlpha7ExportEvidence(run: GenerationRunResult): void {
  assertPlayableTerrainExportEvidence(
    run,
    `${ALPHA7_PACK_VERSION} portable export requires the exact runner-verified playable terrain evidence profile.`,
  );
}

/** Builds one deterministic Alpha.7 ZIP from any registered World Spec 0.3 example. */
export async function buildAlpha7PortablePack(run: GenerationRunResult): Promise<{ filename: string; blob: Blob }> {
  assertTrustedGenerationRun(run);
  assertAlpha7ExportEvidence(run);
  const { world } = run;
  if (world.spec.schemaVersion !== ALPHA6_WORLD_SCHEMA_VERSION) {
    throw new Error(`Alpha.7 export requires World Spec ${ALPHA6_WORLD_SCHEMA_VERSION}.`);
  }
  const errors = validateGeneratedWorld(world).filter((issue) => issue.severity === 'error');
  if (errors.length > 0) throw new Error(`Invalid generated world: ${errors.map(({ code }) => code).join(', ')}`);

  const places = resolveSemanticPlaces(world);
  const structures = resolveSemanticStructures(world);
  const rootName = assertSafePackPath(`mapsoo-${world.spec.id}-v${ALPHA7_PACK_VERSION}`);
  const filename = assertSafePackPath(`${rootName}.zip`);
  const worldSpecPath = assertSafePackPath(`worlds/${world.spec.id}.world.json`);
  const projection = projectPlayableTerrain(world);
  const worldEntry = await payloadEntry(worldSpecPath, jsonBlob(world.spec));
  const placesSidecar = buildAlpha7PlacesSidecar(run, { path: worldEntry.path, sha256: worldEntry.record.sha256 });
  const placesEntry = await payloadEntry(ALPHA7_PLACES_PATH, jsonBlob(placesSidecar));
  const structuresSidecar = buildAlpha7StructuresSidecar(
    run,
    { path: worldEntry.path, sha256: worldEntry.record.sha256 },
    { path: placesEntry.path, sha256: placesEntry.record.sha256 },
  );
  const structuresEntry = await payloadEntry(ALPHA7_STRUCTURES_PATH, jsonBlob(structuresSidecar));

  const previewCanvas = document.createElement('canvas');
  renderPlayableWorldToCanvas(previewCanvas, world, world.spec.visual.tileSize, {
    structures,
    showStructures: true,
  });
  const payloads = new Map<string, Blob>([
    ['readme.md', textBlob(
      `# ${escapeMarkdownInline(world.spec.title)}\n\nGenerated by Mapsoo Worldsmith ${ALPHA7_PACK_VERSION}.\n\n- Grid: orthogonal\n- Tile size: ${world.spec.visual.tileSize}px\n- Map: ${world.spec.map.width} × ${world.spec.map.height}\n- Layers: Ground, Water, Roads, Props\n- Semantic places: ${places.length}\n- Exterior structures: ${structures.length}\n- Godot target: 4.3+\n- Minimum compatible importer: Mapsoo Pack Importer ${ALPHA7_PACK_VERSION}+\n- Asset license: CC0-1.0\n- Pack graphics use generative AI: no\n- Pack schema: 0.5.0\n- World Spec: 0.3.0\n- Places sidecar: 0.3.0\n- Structures sidecar: 0.2.0\n- Generation receipt: 0.2.0\n\n## Godot quick start\n\n1. Install **Mapsoo Pack Importer** from https://github.com/babyrush0101-source/mapsoo-kids\n2. Extract this data pack.\n3. In Godot choose **Project → Tools → Import Mapsoo Pack...** and select the extracted \`mapsoo.manifest.json\`.\n4. Open the generated scene under \`res://mapsoo_imports/${world.spec.id}/\`.\n\nPNG and JSON are the portable source of truth. This pack contains no executable GDScript or addon. SHA-256 records verify pack consistency, not publisher identity.\n`,
    )],
    ['license-assets.md', textBlob(
      '# Pack license map\n\n## CC0-1.0 assets\n\nThe procedural PNG, map, semantic-place, and semantic-structure assets in this pack are dedicated to the public domain under CC0 1.0. This notice does not cover user-imported or future third-party/AI-provider assets.\n\n## MIT-licensed bundled files\n\nThe bundled `readme.md` and files under `schema/` are distributed under the MIT License in the Mapsoo Worldsmith repository. The copyright and permission notice must remain with copies of those files.\n',
    )],
    ['worlds/demo-world.json', jsonBlob({
      schema_version: '0.5.0',
      width: projection.width,
      height: projection.height,
      layers: projection.layers.map(({ id, cells }) => ({ id, encoding: 'row-major', cells })),
      props: world.props,
    })],
    ['atlases/terrain.png', encodeCanvasPng(renderPlayableTerrainAtlas(world))],
    ['atlases/props.png', encodeCanvasPng(renderPlayablePropsAtlas(world))],
    ['atlases/places.png', encodeCanvasPng(renderSemanticPlacesAtlas(world))],
    ['atlases/structures.png', encodeCanvasPng(renderSemanticStructuresAtlas(world))],
    ['previews/map-preview.png', encodeCanvasPng(previewCanvas)],
    ['schema/mapsoo-pack-0.5.schema.json', jsonBlob(packSchema)],
    ['schema/mapsoo-world-0.3.schema.json', jsonBlob(worldSchema)],
    ['schema/mapsoo-places-0.3.schema.json', jsonBlob(placesSchema)],
    ['schema/mapsoo-structures-0.2.schema.json', jsonBlob(structuresSchema)],
    ['schema/mapsoo-generation-receipt.schema.json', jsonBlob(generationReceiptSchema)],
  ]);
  const initialEntries = [
    worldEntry,
    placesEntry,
    structuresEntry,
    ...await Promise.all(Array.from(payloads, ([path, blob]) => payloadEntry(path, blob))),
  ];
  const receipt = projectTrustedGenerationReceipt(run, { path: worldEntry.path, sha256: worldEntry.record.sha256 });
  const receiptEntry = await payloadEntry('generation-receipt.json', jsonBlob(receipt));
  const entries = [...initialEntries, receiptEntry];
  const manifest = await buildAlpha7PackManifest({
    run,
    files: entries.map(({ record }) => record),
    receiptBytes: receiptEntry.bytes,
    placesBytes: placesEntry.bytes,
    structuresBytes: structuresEntry.bytes,
  });
  const entryPaths = entries.map(({ path }) => path).sort();
  if (JSON.stringify(entryPaths) !== JSON.stringify(manifest.files.map(({ path }) => path).sort())) {
    throw new Error('Alpha.7 manifest files must cover every payload exactly once.');
  }

  const manifestBytes = new TextEncoder().encode(`${JSON.stringify(manifest, null, 2)}\n`);
  const archiveEntries = [
    ...entries.map(({ path, bytes }) => ({ archivePath: `${rootName}/${path}`, bytes })),
    { archivePath: `${rootName}/mapsoo.manifest.json`, bytes: manifestBytes },
  ].sort((left, right) => left.archivePath.localeCompare(right.archivePath, 'en'));
  const zip = new JSZip();
  for (const { archivePath, bytes } of archiveEntries) {
    zip.file(archivePath, bytes, { binary: true, createFolders: false, date: ZIP_DATE, unixPermissions: 0o100644 });
  }
  const zipBytes = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
    platform: 'UNIX',
    streamFiles: false,
  });
  const buffer = new ArrayBuffer(zipBytes.byteLength);
  new Uint8Array(buffer).set(zipBytes);
  return { filename, blob: new Blob([buffer], { type: 'application/zip' }) };
}

export async function downloadAlpha7PortablePack(run: GenerationRunResult): Promise<void> {
  const pack = await buildAlpha7PortablePack(run);
  const url = URL.createObjectURL(pack.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = pack.filename;
  try { link.click(); } finally { revokeObjectUrlLater(url); }
}
