import JSZip from 'jszip';
import packSchema from '../../schemas/mapsoo-pack.schema.json';
import worldSchema from '../../schemas/mapsoo-world.schema.json';
import {
  assertSafePackPath,
  buildPackManifest,
  type PackFileRecord,
} from '../core/pack-manifest';
import type { GenerationRunResult } from '../core/generation-evidence';
import { assertTrustedGenerationRun } from '../core/generation-provider';
import { assertV01ProceduralGenerator } from '../core/generator-identity';
import { validateGeneratedWorld } from '../core/validate-world';
import { renderPropsAtlas, renderTerrainAtlas, renderWorldToCanvas } from './canvas/render-world';

function jsonBlob(value: unknown): Blob {
  return new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: 'application/json' });
}

function textBlob(value: string, type = 'text/markdown'): Blob {
  return new Blob([value], { type: `${type};charset=utf-8` });
}

const LEGACY_WORKFLOW = {
  id: 'mapsoo-procedural-world-pack',
  version: '0.1.0',
  definition_sha256: null,
} as const;
const LEGACY_TRANSFORMATIONS = [
  { id: 'seeded-map-layout', version: '0.1.0' },
  { id: 'procedural-pixel-atlas', version: '0.1.0' },
  { id: 'png-rgba-export', version: '0.1.0' },
] as const;

function exactJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function assertLegacyAlpha1Evidence(run: GenerationRunResult): void {
  const { world, evidence } = run;
  assertV01ProceduralGenerator(world.generator);
  assertV01ProceduralGenerator(evidence.provider);
  const capabilities = evidence.provider.capabilities;
  if (
    evidence.requestSpec !== world.spec
    || world.spec.output.assetLicense !== 'CC0-1.0'
    || capabilities.execution !== 'local'
    || capabilities.determinism !== 'seeded'
    || capabilities.requiresCredentials
    || capabilities.outputProvenance !== 'procedural'
    || evidence.aiDisclosure.containsGenerativeAi
    || evidence.aiDisclosure.humanCurated
    || evidence.aiDisclosure.statement !== null
    || evidence.model !== null
    || evidence.providerTerms !== null
    || evidence.sources.length !== 0
    || !exactJson(evidence.workflow, LEGACY_WORKFLOW)
    || !exactJson(evidence.transformations, LEGACY_TRANSFORMATIONS)
  ) {
    throw new Error('v0.1 portable export requires the exact runner-verified built-in procedural evidence profile.');
  }
}

export function escapeMarkdownInline(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/([\\`*_{}\[\]()#+\-.!|])/g, '\\$1');
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed.'))), 'image/png');
  });
}

async function sha256(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function toFileRecord(path: string, blob: Blob): Promise<PackFileRecord> {
  const safePath = assertSafePackPath(path);
  return { path: safePath, media_type: blob.type.split(';')[0], bytes: blob.size, sha256: await sha256(blob) };
}

export async function buildPortablePack(run: GenerationRunResult): Promise<{ filename: string; blob: Blob }> {
  assertTrustedGenerationRun(run);
  const { world, evidence } = run;
  assertLegacyAlpha1Evidence(run);
  const errors = validateGeneratedWorld(world).filter((issue) => issue.severity === 'error');
  if (errors.length > 0) {
    throw new Error(`Invalid generated world: ${errors.map((issue) => issue.code).join(', ')}`);
  }

  const version = '0.1.0-alpha.1';
  const rootName = assertSafePackPath(`mapsoo-${world.spec.id}-v${version}`);
  const manifestPath = assertSafePackPath('mapsoo.manifest.json');
  const filename = assertSafePackPath(`${rootName}.zip`);
  const zip = new JSZip();
  const root = zip.folder(rootName);
  if (!root) throw new Error('Unable to create ZIP root folder.');

  const previewCanvas = document.createElement('canvas');
  renderWorldToCanvas(previewCanvas, world, world.spec.visual.tileSize);

  const terrainBlob = await canvasBlob(renderTerrainAtlas(world));
  const propsBlob = await canvasBlob(renderPropsAtlas(world));
  const previewBlob = await canvasBlob(previewCanvas);
  const worldBlob = jsonBlob(world.spec);
  const mapBlob = jsonBlob({
    schema_version: '0.1.0',
    width: world.spec.map.width,
    height: world.spec.map.height,
    layers: [{ id: 'ground', encoding: 'row-major', cells: world.ground }],
    props: world.props,
  });
  const receiptBlob = jsonBlob({
    schema_version: '0.1.0',
    generator: world.generator,
    world_id: world.spec.id,
    seed: world.spec.seed,
    contains_generative_ai: false,
    transformations: ['seeded-map-layout', 'procedural-pixel-atlas', 'png-rgba-export'],
  });
  const assetLicenseBlob = textBlob(
    '# Asset license\n\nThe procedural PNG and map assets in this pack are dedicated to the public domain under CC0 1.0. This notice does not cover user-imported or future third-party/AI-provider assets.\n',
  );
  const readmeBlob = textBlob(
    `# ${escapeMarkdownInline(world.spec.title)}\n\nGenerated by Mapsoo Worldsmith ${version}.\n\n- Grid: orthogonal\n- Tile size: ${world.spec.visual.tileSize}px\n- Map: ${world.spec.map.width} × ${world.spec.map.height}\n- Godot target: 4.3+\n- Required importer: Mapsoo Pack Importer 0.1.0-alpha.1+\n- Asset license: CC0-1.0\n- Generative AI: no\n\n## Godot quick start\n\n1. Install **Mapsoo Pack Importer** only from the official repository or, once published, the Godot Asset Library: https://github.com/babyrush0101-source/mapsoo-kids\n2. Extract this data pack.\n3. In Godot choose **Project → Tools → Import Mapsoo Pack...** and select the extracted \`mapsoo.manifest.json\`.\n4. Open the generated scene under \`res://mapsoo_imports/${world.spec.id}/\`.\n\n## Security boundary\n\nThis asset pack intentionally contains no executable GDScript or addon. Do not enable scripts copied from a third-party asset pack. SHA-256 records verify pack consistency, not publisher identity.\n\nPNG and JSON remain the portable source of truth; the separately installed importer derives Godot resources inside the editor.\n`,
  );
  const packSchemaBlob = jsonBlob(packSchema);
  const worldSchemaBlob = jsonBlob(worldSchema);

  const payloads = new Map<string, Blob>([
    ['readme.md', readmeBlob],
    ['license-assets.md', assetLicenseBlob],
    ['generation-receipt.json', receiptBlob],
    [`worlds/${world.spec.id}.world.json`, worldBlob],
    ['worlds/demo-world.json', mapBlob],
    ['atlases/terrain.png', terrainBlob],
    ['atlases/props.png', propsBlob],
    ['previews/map-preview.png', previewBlob],
    ['schema/mapsoo-pack.schema.json', packSchemaBlob],
    ['schema/mapsoo-world.schema.json', worldSchemaBlob],
  ]);

  payloads.forEach((_blob, path) => assertSafePackPath(path));

  const payloadEntries = await Promise.all(
    Array.from(payloads, async ([path, blob]) => ({
      path,
      bytes: new Uint8Array(await blob.arrayBuffer()),
      record: await toFileRecord(path, blob),
    })),
  );
  const fileRecords = payloadEntries.map(({ record }) => record);
  const manifest = buildPackManifest(world, fileRecords, evidence.createdAt);

  payloadEntries.forEach(({ path, bytes }) => root.file(path, bytes));
  root.file(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const zipBytes = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
  const zipBuffer = new ArrayBuffer(zipBytes.byteLength);
  new Uint8Array(zipBuffer).set(zipBytes);

  return {
    filename,
    blob: new Blob([zipBuffer], { type: 'application/zip' }),
  };
}

export async function downloadPortablePack(run: GenerationRunResult): Promise<void> {
  const pack = await buildPortablePack(run);
  const url = URL.createObjectURL(pack.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = pack.filename;
  try {
    link.click();
  } finally {
    revokeObjectUrlLater(url);
  }
}

export function revokeObjectUrlLater(url: string): void {
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 0);
}
