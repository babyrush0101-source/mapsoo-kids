import { readFile, writeFile, mkdir, lstat } from 'node:fs/promises';
import { join } from 'node:path';

import JSZip from 'jszip';

import { verifyReceiptForRelease } from './receipt-verifier.mjs';

import {
  CURRENT_RELEASE_CONFIG,
  RELEASE_FILES,
  RELEASE_TAG,
  REPOSITORY_ROOT,
  VERSION,
  assertNoLocalAbsolutePath,
  assertPortableRelativePath,
  assertSafeOutputPath,
  buildExamplePackArchive,
  comparePortablePaths,
  listFiles,
  normalizeText,
  removeSafeOutputDirectory,
  replaceSafeOutputDirectory,
  sha256,
} from './release-lib.mjs';

export const ITCH_SOURCE_ROOT = join(
  REPOSITORY_ROOT,
  CURRENT_RELEASE_CONFIG.itch.sourceDirectory,
);
export const ITCH_VISUAL_ROOT = join(
  REPOSITORY_ROOT,
  CURRENT_RELEASE_CONFIG.itch.visualDirectory,
);
export const ITCH_RELEASE_ROOT = join(REPOSITORY_ROOT, 'release', 'itch');
export const DEFAULT_ITCH_OUTPUT_ROOT = join(ITCH_RELEASE_ROOT, RELEASE_TAG);

export const ITCH_VISUALS = CURRENT_RELEASE_CONFIG.itch.visuals;

const OUTPUT_PATHS = Object.freeze([
  'itch-upload-manifest.json',
  'page/metadata.json',
  'page/page.md',
  ...ITCH_VISUALS.map(({ name }) => `media/${name}`),
  'uploads/SHA256SUMS',
  `uploads/${RELEASE_FILES.examplePack}`,
].sort(comparePortablePaths));

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const REQUIRED_PUBLIC_URLS = Object.freeze([
  'https://github.com/babyrush0101-source/mapsoo-kids',
  `https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/${RELEASE_TAG}`,
  'https://babyrush0101-source.github.io/mapsoo-kids/',
  CURRENT_RELEASE_CONFIG.itch.feedbackUrl,
]);
const MAX_PACK_BYTES = 25 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 64;
const MAX_ZIP_ENTRY_BYTES = 10 * 1024 * 1024;
const MAX_ZIP_TOTAL_BYTES = 50 * 1024 * 1024;
const MAX_TEXT_ENTRY_BYTES = 1024 * 1024;
const EXPECTED_SHORT_DESCRIPTION = CURRENT_RELEASE_CONFIG.itch.shortDescription;
const EXPECTED_TAGS = Object.freeze([
  'Pixel Art',
  '2D',
  'Top-Down',
  'Tileset',
  'Sprites',
  'Asset Pack',
  'Godot',
  'Procedural Generation',
  'CC0',
]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function assertExactKeys(value, expectedKeys, context) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${context} must be an object`);
  const actual = Object.keys(value).sort(comparePortablePaths);
  const expected = [...expectedKeys].sort(comparePortablePaths);
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${context} contains unexpected or missing fields`);
}

function assertLfText(text, context) {
  assert(!text.includes('\r'), `${context} must use LF line endings`);
  assert(!/\[REPLACE\s*:/i.test(text), `${context} contains a replacement placeholder`);
  assert(!/coming\s+soon/i.test(text), `${context} contains a coming-soon claim`);
  assertNoLocalAbsolutePath(text, context);
}

function pngDimensions(bytes, context) {
  assert(bytes.length >= 24, `${context} is too small to be a PNG`);
  assert(bytes.subarray(0, 8).equals(PNG_SIGNATURE), `${context} has an invalid PNG signature`);
  assert(bytes.subarray(12, 16).toString('ascii') === 'IHDR', `${context} is missing PNG IHDR`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

async function verifyVisual(path, visual) {
  const fileStat = await lstat(path);
  assert(!fileStat.isSymbolicLink(), `itch visual may not be a symbolic link: ${visual.name}`);
  assert(fileStat.isFile(), `itch visual is not a file: ${visual.name}`);
  assert(
    fileStat.size >= visual.minBytes,
    `itch visual is unexpectedly small: ${visual.name} (${fileStat.size} < ${visual.minBytes})`,
  );
  const bytes = await readFile(path);
  const dimensions = pngDimensions(bytes, visual.name);
  assert(
    dimensions.width === visual.width && dimensions.height === visual.height,
    `${visual.name} is ${dimensions.width}x${dimensions.height}; expected ${visual.width}x${visual.height}`,
  );
  return bytes;
}

function verifyProceduralMetadata(metadata) {
  assertExactKeys(
    metadata,
    [
      'schema_version',
      'version',
      'title',
      'slug',
      'classification',
      'kind',
      'upload_type',
      'release_status',
      'pricing',
      'platforms',
      'asset_license',
      'visibility',
      'community',
      'repository_url',
      'release_url',
      'demo_url',
      'short_description',
      'tags',
      'generative_ai_disclosure',
    ],
    'itch metadata',
  );
  assertExactKeys(metadata.pricing, ['minimum_usd', 'free_download', 'donations_optional'], 'itch pricing');
  assertExactKeys(metadata.community, ['comments_enabled', 'canonical_feedback_url'], 'itch community');
  assertExactKeys(
    metadata.generative_ai_disclosure,
    ['answer', 'categories', 'graphics', 'sound', 'code', 'notes'],
    'itch AI disclosure',
  );
  assert(metadata?.schema_version === 'mapsoo.itch-page/v1', 'itch metadata schema is invalid');
  assert(metadata.version === VERSION, 'itch metadata version differs from package.json');
  assert(metadata.title === 'Mapsoo Sunny Meadow — Free Pixel World Pack for Godot', 'itch title changed');
  assert(metadata.slug === 'mapsoo-sunny-meadow', 'itch slug changed');
  assert(metadata.classification === 'Assets', 'itch classification must be Assets');
  assert(metadata.kind === 'Downloadable', 'itch kind must be Downloadable');
  assert(metadata.upload_type === 'Graphical Assets', 'itch upload type must be Graphical Assets');
  assert(metadata.release_status === 'In development', 'alpha status must be In development');
  assert(metadata.pricing?.minimum_usd === 0, 'itch minimum price must be zero');
  assert(metadata.pricing?.free_download === true, 'itch pack must allow free download');
  assert(metadata.pricing?.donations_optional === true, 'donations may only be optional');
  assert(Array.isArray(metadata.platforms) && metadata.platforms.length === 0, 'asset page must not claim OS platforms');
  assert(metadata.asset_license === 'CC0-1.0', 'itch asset license must be CC0-1.0');
  assert(metadata.visibility === 'Draft', 'generated metadata must remain Draft until manual review');
  assert(metadata.community?.comments_enabled === true, 'itch comments must remain enabled');
  assert(
    metadata.community.canonical_feedback_url === REQUIRED_PUBLIC_URLS[3],
    'itch canonical feedback URL changed',
  );
  assert(metadata.repository_url === REQUIRED_PUBLIC_URLS[0], 'itch repository URL changed');
  assert(metadata.release_url === REQUIRED_PUBLIC_URLS[1], 'itch release URL changed');
  assert(metadata.demo_url === REQUIRED_PUBLIC_URLS[2], 'itch demo URL changed');
  assert(metadata.short_description === EXPECTED_SHORT_DESCRIPTION, 'itch short description changed');
  assert(JSON.stringify(metadata.tags) === JSON.stringify(EXPECTED_TAGS), 'itch tags changed');
  assert(metadata.generative_ai_disclosure?.answer === 'Yes', 'itch AI disclosure must answer Yes');
  assert(
    JSON.stringify(metadata.generative_ai_disclosure?.categories) === JSON.stringify(['Text & Dialog', 'Code']),
    'itch AI categories must contain Text & Dialog and Code for this upload',
  );
  for (const field of ['graphics', 'sound']) {
    assert(metadata.generative_ai_disclosure?.[field] === false, `itch AI ${field} disclosure must be false`);
  }
  assert(metadata.generative_ai_disclosure?.code === true, 'itch AI code disclosure must be true');
  const serialized = stableJson(metadata);
  assertLfText(serialized, 'itch metadata');
  for (const url of REQUIRED_PUBLIC_URLS) {
    assert(serialized.includes(url), `itch metadata is missing public URL: ${url}`);
  }
}

function verifyProceduralPageMarkdown(page) {
  assertLfText(page, 'itch page Markdown');
  for (const url of REQUIRED_PUBLIC_URLS) {
    assert(page.includes(url), `itch page Markdown is missing public URL: ${url}`);
  }
  for (const requiredText of [
    'CC0-1.0',
    'Godot 4.3',
    'Godot 4.7',
    RELEASE_FILES.examplePack,
    'no GDScript or addon',
    'Text & Dialog',
    'Code',
    'per-payload-file SHA-256',
    'MIT License',
    'contains_generative_ai: false',
  ]) {
    assert(page.includes(requiredText), `itch page Markdown is missing required fact: ${requiredText}`);
  }
  assert(
    /not (?:by|produced by) an image-generation model/.test(page),
    'itch page Markdown must state that pixel art was not produced by an image-generation model',
  );
  if (CURRENT_RELEASE_CONFIG.itch.verificationPolicy.endsWith('-v6')) {
    assert(/unpublished.{0,80}candidate/s.test(page), 'Alpha.6 itch page must identify itself as an unpublished candidate');
  } else {
    assert(page.includes('versioned, verified example pack'), 'itch page Markdown is missing its verified-pack statement');
  }
  assert(!/Godot 4\.3\+/.test(page), 'itch page must not claim untested Godot 4.3+ compatibility');
  assert(!/\b(?:Windows|macOS|Linux)\b\s+(?:download|build)/i.test(page), 'itch page falsely claims an OS build');
}

function verifyMetadata(metadata) {
  switch (CURRENT_RELEASE_CONFIG.itch.verificationPolicy) {
    case 'sunny-meadow-procedural-cc0-v1':
    case 'sunny-meadow-procedural-cc0-v2':
    case 'sunny-meadow-procedural-cc0-v3':
    case 'sunny-meadow-playable-terrain-cc0-v4':
    case 'sunny-meadow-semantic-places-cc0-v5':
    case 'sunny-meadow-semantic-structures-cc0-v6':
      return verifyProceduralMetadata(metadata);
    default:
      throw new Error(
        `Unsupported itch metadata policy: ${CURRENT_RELEASE_CONFIG.itch.verificationPolicy}`,
      );
  }
}

function verifyPageMarkdown(page) {
  switch (CURRENT_RELEASE_CONFIG.itch.verificationPolicy) {
    case 'sunny-meadow-procedural-cc0-v1':
      return verifyProceduralPageMarkdown(page);
    case 'sunny-meadow-procedural-cc0-v2':
    case 'sunny-meadow-procedural-cc0-v3':
    case 'sunny-meadow-playable-terrain-cc0-v4':
    case 'sunny-meadow-semantic-places-cc0-v5':
    case 'sunny-meadow-semantic-structures-cc0-v6': {
      verifyProceduralPageMarkdown(page);
      const semanticStructures = CURRENT_RELEASE_CONFIG.itch.verificationPolicy.endsWith('-v6');
      const semanticPlaces = semanticStructures
        || CURRENT_RELEASE_CONFIG.itch.verificationPolicy.endsWith('-v5');
      for (const requiredText of [
        'generation-receipt.json',
        'schema/mapsoo-generation-receipt.schema.json',
        'schema_version: 0.2.0',
        semanticStructures ? '18 files' : semanticPlaces ? '15 files' : '12 files',
        semanticStructures ? '17 payload records' : semanticPlaces ? '14 payload records' : '11 payload records',
        'Executable-free asset ZIP',
      ]) {
        assert(page.includes(requiredText), `receipt-era itch page is missing required fact: ${requiredText}`);
      }
      if (CURRENT_RELEASE_CONFIG.itch.verificationPolicy.endsWith('-v4')) {
        for (const requiredText of [
          'pack schema `0.2.0`',
          'Ground / Water / Roads / Props',
          '35 terrain tiles',
          '6 prop sprites',
          'MATCH_SIDES',
          'world-blocking',
          'does not provide navigation or pathfinding',
          'not a complete game',
        ]) {
          assert(page.includes(requiredText), `playable-terrain itch page is missing required fact: ${requiredText}`);
        }
      }
      if (CURRENT_RELEASE_CONFIG.itch.verificationPolicy.endsWith('-v5')) {
        for (const requiredText of [
          'pack schema `0.3.0`',
          'World Spec `0.2.0`',
          'places sidecar `0.1.0`',
          'runtime/places.json',
          '6 semantic place markers',
          'does not provide navigation or pathfinding',
          'not a complete game',
        ]) assert(page.includes(requiredText), `semantic-places itch page is missing required fact: ${requiredText}`);
      }
      if (semanticStructures) {
        for (const requiredText of [
          'pack schema `0.4.0`',
          'World Spec `0.3.0`',
          'places sidecar `0.2.0`',
          'structures sidecar `0.1.0`',
          '4 reusable structure archetypes',
          'does not provide navigation or pathfinding',
          'not a complete game',
        ]) assert(page.includes(requiredText), `semantic-structures itch page is missing required fact: ${requiredText}`);
        assert(/place-linked exterior structures/i.test(page), 'semantic-structures itch page must describe place-linked exterior structures');
      }
      return;
    }
    default:
      throw new Error(
        `Unsupported itch page policy: ${CURRENT_RELEASE_CONFIG.itch.verificationPolicy}`,
      );
  }
}

function verifyConfiguredItchPackManifest(manifest) {
  switch (CURRENT_RELEASE_CONFIG.itch.verificationPolicy) {
    case 'sunny-meadow-procedural-cc0-v1':
    case 'sunny-meadow-procedural-cc0-v2':
    case 'sunny-meadow-procedural-cc0-v3':
    case 'sunny-meadow-playable-terrain-cc0-v4':
    case 'sunny-meadow-semantic-places-cc0-v5':
    case 'sunny-meadow-semantic-structures-cc0-v6':
      assert(manifest.license?.assets?.id === 'CC0-1.0', 'itch asset manifest license mismatch');
      assert(
        manifest.provenance?.contains_generative_ai === false,
        'itch asset manifest AI provenance mismatch',
      );
      if (!CURRENT_RELEASE_CONFIG.itch.verificationPolicy.endsWith('-v1')) {
        assert(manifest.receipt?.path === 'generation-receipt.json', 'receipt-era itch receipt path mismatch');
        const receiptPaths = new Set((manifest.files ?? []).map(({ path }) => path));
        const semanticStructures = CURRENT_RELEASE_CONFIG.itch.verificationPolicy.endsWith('-v6');
        const semanticPlaces = semanticStructures
          || CURRENT_RELEASE_CONFIG.itch.verificationPolicy.endsWith('-v5');
        assert(receiptPaths.size === (semanticStructures ? 17 : semanticPlaces ? 14 : 11), 'receipt-era itch manifest payload count mismatch');
        assert(receiptPaths.has('generation-receipt.json'), 'receipt-era itch manifest is missing its receipt');
        assert(
          receiptPaths.has('schema/mapsoo-generation-receipt.schema.json'),
          'receipt-era itch manifest is missing its receipt schema',
        );
      }
      if (CURRENT_RELEASE_CONFIG.itch.verificationPolicy.endsWith('-v4')) {
        assert(manifest.schema_version === '0.2.0', 'playable-terrain itch manifest schema must be 0.2.0');
        assert(manifest.pack?.generator?.version === VERSION, 'playable-terrain itch generator version mismatch');
        assert(
          JSON.stringify(manifest.layers?.map(({ id }) => id))
            === JSON.stringify(['ground', 'water', 'roads', 'props']),
          'playable-terrain itch layer order mismatch',
        );
        assert(
          JSON.stringify(manifest.terrain_sets?.map(({ id, mode }) => [id, mode]))
            === JSON.stringify([['water', 'match-sides'], ['roads', 'match-sides']]),
          'playable-terrain itch Terrain Set contract mismatch',
        );
        assert(
          JSON.stringify(manifest.physics_layers)
            === JSON.stringify([{ id: 'world-blocking', collision_layer: 1, collision_mask: 1 }]),
          'playable-terrain itch physics contract mismatch',
        );
        assert(
          manifest.atlases?.length === 1 && manifest.atlases[0]?.tiles?.length === 35,
          'playable-terrain itch atlas must declare exactly 35 tiles',
        );
        assert(manifest.sprites?.length === 6, 'playable-terrain itch manifest must declare exactly six sprites');
      }
      if (CURRENT_RELEASE_CONFIG.itch.verificationPolicy.endsWith('-v5')) {
        assert(manifest.schema_version === '0.3.0', 'semantic-places itch manifest schema must be 0.3.0');
        assert(manifest.pack?.generator?.version === VERSION, 'semantic-places itch generator version mismatch');
        assert(manifest.sprites?.length === 12, 'semantic-places itch manifest must declare six props and six place sprites');
        assert(manifest.runtime?.places?.path === 'runtime/places.json', 'semantic-places itch runtime path mismatch');
        assert(manifest.runtime?.places?.schema?.path === 'schema/mapsoo-places-0.1.schema.json', 'semantic-places itch schema path mismatch');
      }
      if (CURRENT_RELEASE_CONFIG.itch.verificationPolicy.endsWith('-v6')) {
        assert(manifest.schema_version === '0.4.0', 'semantic-structures itch manifest schema must be 0.4.0');
        assert(manifest.pack?.generator?.version === VERSION, 'semantic-structures itch generator version mismatch');
        assert(manifest.sprites?.length === 16, 'semantic-structures itch manifest must declare six props, six places, and four structures');
        assert(manifest.runtime?.places?.path === 'runtime/places.json', 'semantic-structures itch places runtime path mismatch');
        assert(manifest.runtime?.places?.schema?.path === 'schema/mapsoo-places-0.2.schema.json', 'semantic-structures itch places schema path mismatch');
        assert(manifest.runtime?.structures?.path === 'runtime/structures.json', 'semantic-structures itch runtime path mismatch');
        assert(manifest.runtime?.structures?.schema?.path === 'schema/mapsoo-structures-0.1.schema.json', 'semantic-structures itch schema path mismatch');
        const structureSprites = manifest.sprites.slice(12);
        assert(
          JSON.stringify(structureSprites.map(({ id }) => id))
            === JSON.stringify(['structure-cottage-01', 'structure-workshop-01', 'structure-tower-01', 'structure-shrine-01']),
          'semantic-structures itch sprite IDs or order mismatch',
        );
        assert(
          structureSprites.every((sprite, index) =>
            sprite.atlas === 'atlases/structures.png'
              && JSON.stringify(sprite.region_px) === JSON.stringify([index * 64, 0, 64, 64])),
          'semantic-structures itch sprite atlas binding mismatch',
        );
      }
      return;
    default:
      throw new Error(
        `Unsupported itch pack policy: ${CURRENT_RELEASE_CONFIG.itch.verificationPolicy}`,
      );
  }
}

export async function verifyItchSource() {
  const sourceFiles = await listFiles(ITCH_SOURCE_ROOT);
  const sourceNames = sourceFiles.map(({ archivePath }) => archivePath);
  assert(
    JSON.stringify(sourceNames) === JSON.stringify(['metadata.json', 'page.md']),
    'itch page source must contain exactly metadata.json and page.md',
  );

  const metadataText = await readFile(join(ITCH_SOURCE_ROOT, 'metadata.json'), 'utf8');
  const page = await readFile(join(ITCH_SOURCE_ROOT, 'page.md'), 'utf8');
  assertLfText(metadataText, 'itch metadata source');
  verifyMetadata(JSON.parse(metadataText));
  verifyPageMarkdown(page);

  for (const visual of ITCH_VISUALS) {
    await verifyVisual(join(ITCH_VISUAL_ROOT, visual.name), visual);
  }

  return { sourceRoot: ITCH_SOURCE_ROOT, files: sourceNames, visuals: ITCH_VISUALS.length };
}

async function assertSafeOutputRoot(outputRoot) {
  return assertSafeOutputPath(
    ITCH_RELEASE_ROOT,
    outputRoot,
    'Refusing to use itch output outside release/itch/',
  );
}

export async function removeItchOutput(outputRoot) {
  await removeSafeOutputDirectory(
    ITCH_RELEASE_ROOT,
    outputRoot,
    'Refusing to remove itch output outside release/itch/',
  );
}

function roleFor(path) {
  if (path === `uploads/${RELEASE_FILES.examplePack}`) return 'download';
  if (path === 'uploads/SHA256SUMS') return 'download-checksum';
  if (path === 'page/metadata.json') return 'page-metadata';
  if (path === 'page/page.md') return 'page-copy';
  const visual = ITCH_VISUALS.find(({ name }) => path === `media/${name}`);
  return visual?.role ?? 'unknown';
}

async function recordsFor(outputRoot) {
  const files = (await listFiles(outputRoot))
    .filter(({ archivePath }) => archivePath !== 'itch-upload-manifest.json')
    .sort((left, right) => comparePortablePaths(left.archivePath, right.archivePath));
  const records = [];
  for (const file of files) {
    const bytes = await readFile(file.absolutePath);
    const record = {
      path: file.archivePath,
      role: roleFor(file.archivePath),
      bytes: bytes.length,
      sha256: sha256(bytes),
    };
    const visual = ITCH_VISUALS.find(({ name }) => file.archivePath === `media/${name}`);
    if (visual) {
      record.width = visual.width;
      record.height = visual.height;
    }
    records.push(record);
  }
  return records;
}

async function readBoundedPack(path, context) {
  const fileStat = await lstat(path);
  assert(!fileStat.isSymbolicLink(), `${context} may not be a symbolic link`);
  assert(fileStat.isFile(), `${context} must be a file`);
  assert(fileStat.size > 0 && fileStat.size <= MAX_PACK_BYTES, `${context} exceeds the ${MAX_PACK_BYTES}-byte limit`);
  return readFile(path);
}

async function loadAuthoritativePack() {
  const packBytes = await buildExamplePackArchive(VERSION);
  assert(
    packBytes.length > 0 && packBytes.length <= MAX_PACK_BYTES,
    `configured asset pack exceeds the ${MAX_PACK_BYTES}-byte limit`,
  );
  const expectedHash = CURRENT_RELEASE_CONFIG.expectedExamplePackSha256;
  assert(expectedHash, `no immutable example-pack hash is configured for ${RELEASE_TAG}`);
  assert(sha256(packBytes) === expectedHash, 'rebuilt example pack differs from its configured hash');
  return { packBytes, expectedHash };
}

export async function buildItchKit(outputRoot = DEFAULT_ITCH_OUTPUT_ROOT) {
  await verifyItchSource();
  const { packBytes, expectedHash: expectedPackHash } = await loadAuthoritativePack();
  const resolvedOutputRoot = await replaceSafeOutputDirectory(
    ITCH_RELEASE_ROOT,
    outputRoot,
    'Refusing to replace itch output outside release/itch/',
  );

  await mkdir(join(resolvedOutputRoot, 'uploads'), { recursive: true });
  await mkdir(join(resolvedOutputRoot, 'page'), { recursive: true });
  await mkdir(join(resolvedOutputRoot, 'media'), { recursive: true });

  await writeFile(join(resolvedOutputRoot, 'uploads', RELEASE_FILES.examplePack), packBytes);
  await writeFile(
    join(resolvedOutputRoot, 'uploads', 'SHA256SUMS'),
    `${expectedPackHash}  ${RELEASE_FILES.examplePack}\n`,
    'utf8',
  );

  for (const fileName of ['metadata.json', 'page.md']) {
    const text = normalizeText(await readFile(join(ITCH_SOURCE_ROOT, fileName), 'utf8'));
    await writeFile(join(resolvedOutputRoot, 'page', fileName), text, 'utf8');
  }
  for (const visual of ITCH_VISUALS) {
    await writeFile(
      join(resolvedOutputRoot, 'media', visual.name),
      await readFile(join(ITCH_VISUAL_ROOT, visual.name)),
    );
  }

  const manifest = {
    schema_version: 'mapsoo.itch-upload-manifest/v1',
    version: VERSION,
    release_tag: RELEASE_TAG,
    page_visibility: 'Draft',
    repository_url: 'https://github.com/babyrush0101-source/mapsoo-kids',
    release_url: `https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/${RELEASE_TAG}`,
    files: await recordsFor(resolvedOutputRoot),
  };
  await writeFile(join(resolvedOutputRoot, 'itch-upload-manifest.json'), stableJson(manifest), 'utf8');

  return { outputRoot: resolvedOutputRoot, files: OUTPUT_PATHS };
}

function decodeUtf8(bytes, context) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${context} is not valid UTF-8`);
  }
}

function normalizedZipPath(entry, rawName) {
  return entry.dir && rawName.endsWith('/') ? rawName.slice(0, -1) : rawName;
}

export async function verifyPackZip(packPath, authoritativeHash) {
  const bytes = await readBoundedPack(packPath, 'itch asset ZIP');
  assert(sha256(bytes) === authoritativeHash, 'itch asset ZIP differs from the trusted configured example-pack hash');
  const zip = await JSZip.loadAsync(bytes, { checkCRC32: true, createFolders: false });
  const allEntries = Object.values(zip.files);
  assert(allEntries.length > 0 && allEntries.length <= MAX_ZIP_ENTRIES, 'itch asset ZIP has an invalid entry count');
  const expectedRoot = CURRENT_RELEASE_CONFIG.release.examplePack.archiveRoot;
  for (const entry of allEntries) {
    const originalName = normalizedZipPath(entry, entry.unsafeOriginalName ?? entry.name);
    const sanitizedName = normalizedZipPath(entry, entry.name);
    assertPortableRelativePath(originalName);
    assertPortableRelativePath(sanitizedName);
    assert(originalName === sanitizedName, `itch asset ZIP contains a sanitized unsafe path: ${originalName}`);
    assert(
      sanitizedName === expectedRoot || sanitizedName.startsWith(`${expectedRoot}/`),
      `itch asset ZIP entry is outside its versioned root: ${sanitizedName}`,
    );
  }
  const entries = allEntries.filter((entry) => !entry.dir);
  assert(entries.length > 0, 'itch asset ZIP is empty');
  const entryBytes = new Map();
  let totalUncompressedBytes = 0;
  for (const entry of entries) {
    const lower = entry.name.toLowerCase();
    assert(!/(^|\/)(?:addons|\.godot)(?:\/|$)/.test(lower), `itch asset ZIP contains a forbidden engine path: ${entry.name}`);
    assert(/\.(?:png|json|md)$/.test(lower), `itch asset ZIP contains a non-data file: ${entry.name}`);
    const declaredSize = entry._data?.uncompressedSize;
    assert(
      Number.isSafeInteger(declaredSize) && declaredSize >= 0 && declaredSize <= MAX_ZIP_ENTRY_BYTES,
      `itch asset ZIP entry exceeds its declared size limit: ${entry.name}`,
    );
    totalUncompressedBytes += declaredSize;
    assert(totalUncompressedBytes <= MAX_ZIP_TOTAL_BYTES, 'itch asset ZIP exceeds its total uncompressed size limit');
    const contents = await entry.async('nodebuffer');
    assert(contents.length === declaredSize, `itch asset ZIP entry size changed while reading: ${entry.name}`);
    entryBytes.set(entry.name.slice(expectedRoot.length + 1), contents);
    if (lower.endsWith('.json') || lower.endsWith('.md')) {
      assert(contents.length <= MAX_TEXT_ENTRY_BYTES, `itch text entry is too large: ${entry.name}`);
      const text = decodeUtf8(contents, `itch asset ZIP:${entry.name}`);
      assertLfText(text, `itch asset ZIP:${entry.name}`);
    }
  }

  if (CURRENT_RELEASE_CONFIG.itch.verificationPolicy !== 'sunny-meadow-procedural-cc0-v1') {
    assert(allEntries.every(({ dir }) => !dir), 'receipt-era itch asset ZIP must not contain directory entries');
  }

  const manifestBytes = entryBytes.get('mapsoo.manifest.json');
  assert(manifestBytes, 'itch asset ZIP is missing mapsoo.manifest.json');
  assert(entryBytes.has('license-assets.md'), 'itch asset ZIP is missing license-assets.md');
  const manifest = JSON.parse(decodeUtf8(manifestBytes, 'itch asset ZIP:mapsoo.manifest.json'));
  assert(
    manifest.pack?.id === CURRENT_RELEASE_CONFIG.release.examplePack.id,
    'itch asset manifest pack ID mismatch',
  );
  assert(manifest.pack?.version === VERSION, 'itch asset manifest version mismatch');
  verifyConfiguredItchPackManifest(manifest);
  const records = manifest.files;
  assert(Array.isArray(records), 'itch asset manifest files must be an array');
  const recordPaths = new Set(records.map((record) => record.path));
  assert(recordPaths.size === records.length, 'itch asset manifest contains duplicate paths');
  assert(entryBytes.size === records.length + 1, 'itch asset ZIP contains files not covered by its manifest');
  for (const [path, contents] of entryBytes) {
    if (path !== 'mapsoo.manifest.json') {
      assert(recordPaths.has(path), `itch asset ZIP file is not covered by its manifest: ${path}`);
    }
  }
  for (const record of records) {
    assertPortableRelativePath(record.path);
    const contents = entryBytes.get(record.path);
    assert(contents, `itch asset manifest references a missing file: ${record.path}`);
    assert(contents.length === record.bytes, `itch asset byte count mismatch: ${record.path}`);
    assert(sha256(contents) === record.sha256, `itch asset SHA-256 mismatch: ${record.path}`);
  }
  await verifyReceiptForRelease({
    version: VERSION,
    manifest,
    context: 'itch Sunny Meadow pack',
    readPackFile: async (path) => entryBytes.get(path),
  });
  return bytes;
}

export async function verifyItchKit(outputRoot = DEFAULT_ITCH_OUTPUT_ROOT) {
  const resolvedOutputRoot = await assertSafeOutputRoot(outputRoot);
  const files = await listFiles(resolvedOutputRoot);
  const actualPaths = files.map(({ archivePath }) => archivePath).sort(comparePortablePaths);
  assert(JSON.stringify(actualPaths) === JSON.stringify(OUTPUT_PATHS), 'itch upload directory file list is invalid');

  const metadataText = await readFile(join(resolvedOutputRoot, 'page', 'metadata.json'), 'utf8');
  const page = await readFile(join(resolvedOutputRoot, 'page', 'page.md'), 'utf8');
  assertLfText(metadataText, 'itch metadata output');
  verifyMetadata(JSON.parse(metadataText));
  verifyPageMarkdown(page);

  for (const visual of ITCH_VISUALS) {
    await verifyVisual(join(resolvedOutputRoot, 'media', visual.name), visual);
  }

  const packPath = join(resolvedOutputRoot, 'uploads', RELEASE_FILES.examplePack);
  const { expectedHash: authoritativeHash } = await loadAuthoritativePack();
  const packBytes = await verifyPackZip(packPath, authoritativeHash);
  const expectedChecksum = `${sha256(packBytes)}  ${RELEASE_FILES.examplePack}\n`;
  const checksumText = await readFile(join(resolvedOutputRoot, 'uploads', 'SHA256SUMS'), 'utf8');
  assertLfText(checksumText, 'itch SHA256SUMS');
  assert(checksumText === expectedChecksum, 'itch SHA256SUMS must contain only the uploaded asset ZIP');

  const manifestText = await readFile(join(resolvedOutputRoot, 'itch-upload-manifest.json'), 'utf8');
  assertLfText(manifestText, 'itch upload manifest');
  const manifest = JSON.parse(manifestText);
  assert(manifest.schema_version === 'mapsoo.itch-upload-manifest/v1', 'itch upload manifest schema is invalid');
  assert(manifest.version === VERSION && manifest.release_tag === RELEASE_TAG, 'itch upload manifest version is invalid');
  assert(manifest.page_visibility === 'Draft', 'itch upload manifest must preserve Draft visibility');
  assert(
    JSON.stringify(manifest.files) === JSON.stringify(await recordsFor(resolvedOutputRoot)),
    'itch upload manifest records differ from final output bytes',
  );

  return { outputRoot: resolvedOutputRoot, files: actualPaths, packHash: sha256(packBytes) };
}
