#!/usr/bin/env node

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import JSZip from 'jszip';

import { verifyReceiptForRelease } from './receipt-verifier.mjs';

import {
  CURRENT_RELEASE_CONFIG,
  DEFAULT_RELEASE_ROOT,
  HASHED_RELEASE_FILE_NAMES,
  RELEASE_FILES,
  RELEASE_TAG,
  REPOSITORY_ROOT,
  VERSION,
  assertNoLocalAbsolutePath,
  assertPortableRelativePath,
  comparePortablePaths,
  isTextPath,
  listFiles,
  examplePacksForConfig,
  normalizeText,
  readPortableFile,
  sha256,
} from './release-lib.mjs';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function exactJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function verifyAlpha4PlayableTerrainManifest(
  manifest,
  { semanticPlaces = false, semanticStructures = false, worldGallery = false } = {},
) {
  const hasSemanticPlaces = semanticPlaces || semanticStructures;
  const expectedSchemaVersion = worldGallery ? '0.5.0' : semanticStructures ? '0.4.0' : hasSemanticPlaces ? '0.3.0' : '0.2.0';
  assert(manifest.schema_version === expectedSchemaVersion, 'Playable terrain manifest schema version mismatch');
  assert(
    exactJson(manifest.pack?.generator, { name: 'Mapsoo Worldsmith', version: CURRENT_RELEASE_CONFIG.packVersion }),
    'Playable terrain manifest generator mismatch',
  );
  assert(
    exactJson(manifest.compatibility, {
      godot_min: '4.3',
      grid: 'orthogonal',
      art_style: 'pixel_art',
      importer: {
        id: 'mapsoo_importer',
        min_version: worldGallery
          ? '0.1.0-alpha.7'
          : semanticStructures
          ? '0.1.0-alpha.6'
          : hasSemanticPlaces
            ? '0.1.0-alpha.5'
            : '0.1.0-alpha.4',
        source: 'https://github.com/babyrush0101-source/mapsoo-kids',
      },
    }),
    'Playable terrain compatibility contract mismatch',
  );
  assert(manifest.receipt?.path === 'generation-receipt.json', 'Playable terrain receipt path mismatch');

  const layers = manifest.layers;
  assert(Array.isArray(layers) && layers.length === 4, 'Playable terrain manifest must declare exactly four layers');
  const tileDimensions = layers[0]?.dimensions_cells;
  assert(
    Array.isArray(tileDimensions)
      && tileDimensions.length === 2
      && tileDimensions.every((value) => Number.isSafeInteger(value) && value > 0),
    'Playable terrain layer dimensions are invalid',
  );
  assert(
    exactJson(layers, [
      { id: 'ground', kind: 'tilemap', path: 'worlds/demo-world.json', json_pointer: '/layers/0/cells', encoding: 'row-major', dimensions_cells: tileDimensions, atlas_id: 'terrain', empty_tile_id: -1 },
      { id: 'water', kind: 'tilemap', path: 'worlds/demo-world.json', json_pointer: '/layers/1/cells', encoding: 'row-major', dimensions_cells: tileDimensions, atlas_id: 'terrain', empty_tile_id: -1 },
      { id: 'roads', kind: 'tilemap', path: 'worlds/demo-world.json', json_pointer: '/layers/2/cells', encoding: 'row-major', dimensions_cells: tileDimensions, atlas_id: 'terrain', empty_tile_id: -1 },
      { id: 'props', kind: 'objects', path: 'worlds/demo-world.json', json_pointer: '/props', encoding: 'objects', sprite_atlas: 'atlases/props.png' },
    ]),
    'Playable terrain layer contract mismatch',
  );

  assert(
    Array.isArray(manifest.terrain_sets) && manifest.terrain_sets.length === 2,
    'Playable terrain manifest must declare exactly two Terrain Sets',
  );
  const [waterSet, roadSet] = manifest.terrain_sets;
  assert(
    waterSet?.id === 'water'
      && waterSet.mode === 'match-sides'
      && waterSet.terrains?.length === 1
      && waterSet.terrains[0]?.id === 'water'
      && waterSet.terrains[0]?.name === 'Water'
      && /^#[0-9A-Fa-f]{6}$/.test(waterSet.terrains[0]?.color ?? ''),
    'Playable terrain Water Terrain Set mismatch',
  );
  assert(
    roadSet?.id === 'roads'
      && roadSet.mode === 'match-sides'
      && roadSet.terrains?.length === 1
      && roadSet.terrains[0]?.id === 'road'
      && roadSet.terrains[0]?.name === 'Road'
      && /^#[0-9A-Fa-f]{6}$/.test(roadSet.terrains[0]?.color ?? ''),
    'Playable terrain Roads Terrain Set mismatch',
  );
  assert(
    exactJson(manifest.physics_layers, [{ id: 'world-blocking', collision_layer: 1, collision_mask: 1 }]),
    'Playable terrain physics layer contract mismatch',
  );

  assert(Array.isArray(manifest.atlases) && manifest.atlases.length === 1, 'Playable terrain manifest must declare one terrain atlas');
  const atlas = manifest.atlases[0];
  const tileSize = atlas?.cell_size_px?.[0];
  assert(
    Number.isSafeInteger(tileSize)
      && tileSize > 0
      && exactJson(atlas.cell_size_px, [tileSize, tileSize])
      && exactJson(atlas.image_size_px, [tileSize * 8, tileSize * 6])
      && atlas.id === 'terrain'
      && atlas.source_id === 0
      && atlas.file === 'atlases/terrain.png'
      && exactJson(atlas.margin_px, [0, 0])
      && exactJson(atlas.separation_px, [0, 0])
      && atlas.texture_padding === true,
    'Playable terrain atlas geometry mismatch',
  );
  assert(Array.isArray(atlas.tiles) && atlas.tiles.length === 35, 'Playable terrain atlas must declare exactly 35 tiles');
  const byTileId = new Map(atlas.tiles.map((tile) => [tile.tile_id, tile]));
  assert(byTileId.size === 35, 'Playable terrain atlas contains duplicate tile IDs');
  const biome = atlas.tiles[0]?.custom_data?.biome;
  assert(['meadow', 'desert', 'snow'].includes(biome), 'Playable terrain atlas biome is invalid');

  const groundIds = ['ground-base-a', 'ground-base-b', 'ground-detail'];
  for (let tileId = 0; tileId < groundIds.length; tileId += 1) {
    const tile = byTileId.get(tileId);
    assert(
      tile
        && tile.id === groundIds[tileId]
        && exactJson(tile.atlas_coords, [tileId % 8, Math.floor(tileId / 8)])
        && exactJson(tile.size_cells, [1, 1])
        && tile.alternative_id === 0
        && exactJson(tile.collision, { type: 'none' })
        && tile.terrain === null
        && exactJson(tile.custom_data, { walkable: true, biome })
        && exactJson(tile.tags, ['terrain', 'ground', groundIds[tileId]]),
      `Playable terrain ground tile contract mismatch: ${tileId}`,
    );
  }

  for (const definition of [
    { first: 16, layer: 'water', terrainSet: 'water', terrain: 'water', walkable: false, collision: { type: 'full-cell', physics_layer: 'world-blocking' } },
    { first: 32, layer: 'roads', terrainSet: 'roads', terrain: 'road', walkable: true, collision: { type: 'none' } },
  ]) {
    for (let mask = 0; mask < 16; mask += 1) {
      const tileId = definition.first + mask;
      const tile = byTileId.get(tileId);
      const tileNamePrefix = definition.layer === 'roads' ? 'road' : 'water';
      const peering = {
        north: mask & 1 ? definition.terrain : null,
        east: mask & 2 ? definition.terrain : null,
        south: mask & 4 ? definition.terrain : null,
        west: mask & 8 ? definition.terrain : null,
      };
      assert(
        tile
          && tile.id === `${tileNamePrefix}-${mask.toString(16)}`
          && exactJson(tile.atlas_coords, [tileId % 8, Math.floor(tileId / 8)])
          && exactJson(tile.size_cells, [1, 1])
          && tile.alternative_id === 0
          && exactJson(tile.collision, definition.collision)
          && exactJson(tile.terrain, { set_id: definition.terrainSet, terrain_id: definition.terrain, peering })
          && exactJson(tile.custom_data, { walkable: definition.walkable, biome })
          && exactJson(tile.tags, ['terrain', definition.layer, `mask-${mask}`]),
        `Playable terrain ${definition.layer} tile contract mismatch: mask ${mask}`,
      );
    }
  }

  const expectedSpriteCount = semanticStructures ? 16 : hasSemanticPlaces ? 12 : 6;
  assert(Array.isArray(manifest.sprites) && manifest.sprites.length === expectedSpriteCount, 'Playable terrain manifest sprite count mismatch');
  const propKinds = ['tree', 'rock', 'flower', 'shrub', 'log', 'marker'];
  for (const [index, kind] of propKinds.entries()) {
    const sprite = manifest.sprites[index];
    assert(
      sprite?.id === `${kind}-01`
        && sprite.atlas === 'atlases/props.png'
        && exactJson(sprite.region_px, [index * tileSize, 0, tileSize, tileSize])
        && exactJson(sprite.pivot_px, [Math.floor(tileSize / 2), tileSize])
        && exactJson(sprite.footprint_cells, [1, 1])
        && exactJson(sprite.tags, ['prop', kind, biome]),
      `Playable terrain prop sprite contract mismatch: ${kind}`,
    );
  }
  if (hasSemanticPlaces) {
    const placeKinds = ['spawn', 'settlement', 'landmark', 'resource', 'encounter', 'exit'];
    for (const [index, kind] of placeKinds.entries()) {
      const sprite = manifest.sprites[index + 6];
      assert(
        sprite?.id === `place-${kind}-01`
          && sprite.atlas === 'atlases/places.png'
          && exactJson(sprite.region_px, [index * tileSize, 0, tileSize, tileSize])
          && exactJson(sprite.tags, ['place', kind]),
        `Semantic place sprite contract mismatch: ${kind}`,
      );
    }
    assert(
      manifest.runtime?.places?.path === 'runtime/places.json'
        && manifest.runtime.places.schema?.path === (worldGallery
          ? 'schema/mapsoo-places-0.3.schema.json'
          : semanticStructures
          ? 'schema/mapsoo-places-0.2.schema.json'
          : 'schema/mapsoo-places-0.1.schema.json')
        && /^[a-f0-9]{64}$/.test(manifest.runtime.places.sha256)
        && /^[a-f0-9]{64}$/.test(manifest.runtime.places.schema.sha256),
      'Semantic places runtime binding mismatch',
    );
  }
  if (semanticStructures) {
    const structureKinds = ['cottage', 'workshop', 'tower', 'shrine'];
    for (const [index, kind] of structureKinds.entries()) {
      const sprite = manifest.sprites[index + 12];
      assert(
        sprite?.id === `structure-${kind}-01`
          && sprite.atlas === 'atlases/structures.png'
          && exactJson(sprite.region_px, [index * 64, 0, 64, 64])
          && exactJson(sprite.pivot_px, [32, 64])
          && exactJson(sprite.footprint_cells, [2, 2])
          && exactJson(sprite.tags, ['structure', kind]),
        `Semantic structure sprite contract mismatch: ${kind}`,
      );
    }
    assert(
      manifest.runtime?.structures?.path === 'runtime/structures.json'
        && manifest.runtime.structures.schema?.path === (worldGallery
          ? 'schema/mapsoo-structures-0.2.schema.json'
          : 'schema/mapsoo-structures-0.1.schema.json')
        && /^[a-f0-9]{64}$/.test(manifest.runtime.structures.sha256)
        && /^[a-f0-9]{64}$/.test(manifest.runtime.structures.schema.sha256),
      'Semantic structures runtime binding mismatch',
    );
  }
}

function verifyConfiguredExampleManifest(manifest, expectedPackId = CURRENT_RELEASE_CONFIG.release.examplePack.id) {
  assert(
    manifest.pack?.id === expectedPackId,
    'Example manifest pack ID mismatch',
  );
  assert(manifest.pack?.version === CURRENT_RELEASE_CONFIG.packVersion, 'Example manifest pack-contract version mismatch');

  switch (CURRENT_RELEASE_CONFIG.release.verificationPolicy) {
    case 'sunny-meadow-procedural-cc0-v1':
    case 'sunny-meadow-procedural-cc0-v2':
    case 'sunny-meadow-procedural-cc0-v3':
      assert(
        manifest.provenance?.contains_generative_ai === false,
        'Procedural example pack must disclose contains_generative_ai=false',
      );
      assert(manifest.license?.assets?.id === 'CC0-1.0', 'Procedural asset license mismatch');
      assert(
        manifest.compatibility?.importer?.source ===
          'https://github.com/babyrush0101-source/mapsoo-kids',
        'Procedural pack importer source must point to the official repository',
      );
      if (!CURRENT_RELEASE_CONFIG.release.verificationPolicy.endsWith('-v1')) {
        assert(manifest.schema_version === '0.1.0', 'Receipt-bearing manifest schema must remain 0.1.0');
        assert(
          manifest.pack?.generator?.version === CURRENT_RELEASE_CONFIG.packVersion,
          'Receipt-bearing manifest generator version mismatch',
        );
        assert(
          manifest.receipt?.path === 'generation-receipt.json',
          'Receipt-bearing manifest receipt path mismatch',
        );
        const receiptPaths = new Set((manifest.files ?? []).map(({ path }) => path));
        assert(receiptPaths.size === 11, 'Receipt-bearing manifest must contain 11 unique payload records');
        assert(receiptPaths.has('generation-receipt.json'), 'Receipt-bearing manifest is missing its receipt record');
        assert(
          receiptPaths.has('schema/mapsoo-generation-receipt.schema.json'),
          'Receipt-bearing manifest is missing its receipt schema record',
        );
      }
      return;
    case 'sunny-meadow-playable-terrain-cc0-v4':
      assert(
        manifest.provenance?.contains_generative_ai === false,
        'Playable terrain pack must disclose contains_generative_ai=false',
      );
      assert(manifest.license?.assets?.id === 'CC0-1.0', 'Playable terrain asset license mismatch');
      verifyAlpha4PlayableTerrainManifest(manifest);
      return;
    case 'sunny-meadow-semantic-places-cc0-v5':
      assert(manifest.provenance?.contains_generative_ai === false, 'Semantic places pack must disclose contains_generative_ai=false');
      assert(manifest.license?.assets?.id === 'CC0-1.0', 'Semantic places asset license mismatch');
      verifyAlpha4PlayableTerrainManifest(manifest, { semanticPlaces: true });
      return;
    case 'sunny-meadow-semantic-structures-cc0-v6':
      assert(manifest.provenance?.contains_generative_ai === false, 'Semantic structures pack must disclose contains_generative_ai=false');
      assert(manifest.license?.assets?.id === 'CC0-1.0', 'Semantic structures asset license mismatch');
      verifyAlpha4PlayableTerrainManifest(manifest, { semanticStructures: true });
      return;
    case 'world-gallery-semantic-structures-cc0-v7':
      assert(manifest.provenance?.contains_generative_ai === false, 'World gallery pack must disclose contains_generative_ai=false');
      assert(manifest.license?.assets?.id === 'CC0-1.0', 'World gallery asset license mismatch');
      verifyAlpha4PlayableTerrainManifest(manifest, { semanticStructures: true, worldGallery: true });
      return;
    default:
      throw new Error(
        `Unsupported pack verification policy: ${CURRENT_RELEASE_CONFIG.release.verificationPolicy}`,
      );
  }
}

function verifyConfiguredWorldSpec(worldSpec) {
  switch (CURRENT_RELEASE_CONFIG.release.verificationPolicy) {
    case 'sunny-meadow-procedural-cc0-v1':
    case 'sunny-meadow-procedural-cc0-v2':
    case 'sunny-meadow-procedural-cc0-v3':
    case 'sunny-meadow-playable-terrain-cc0-v4':
      assert(worldSpec.schemaVersion === '0.1.0', 'Example World Spec has an unexpected schema version');
      assert(worldSpec.output?.targets?.includes('godot'), 'Example World Spec does not target Godot');
      assert(worldSpec.output?.targets?.includes('itch'), 'Example World Spec does not target itch.io');
      return;
    case 'sunny-meadow-semantic-places-cc0-v5':
      assert(worldSpec.schemaVersion === '0.2.0', 'Example World Spec must use schema 0.2.0');
      assert(Array.isArray(worldSpec.places) && worldSpec.places.length >= 1 && worldSpec.places.length <= 8, 'Example World Spec must declare semantic places');
      assert(worldSpec.output?.targets?.includes('godot'), 'Example World Spec does not target Godot');
      assert(worldSpec.output?.targets?.includes('itch'), 'Example World Spec does not target itch.io');
      return;
    case 'sunny-meadow-semantic-structures-cc0-v6':
    case 'world-gallery-semantic-structures-cc0-v7': {
      assert(worldSpec.schemaVersion === '0.3.0', 'Example World Spec must use schema 0.3.0');
      assert(Array.isArray(worldSpec.places) && worldSpec.places.length >= 1 && worldSpec.places.length <= 8, 'Example World Spec must declare semantic places');
      assert(Array.isArray(worldSpec.structures) && worldSpec.structures.length <= 8, 'Example World Spec structures are invalid');
      const placeIds = new Set(worldSpec.places.map((place) => place.id));
      const structureIds = new Set();
      const linkedPlaceIds = new Set();
      for (const structure of worldSpec.structures) {
        assert(typeof structure?.id === 'string' && structure.id && !structureIds.has(structure.id), 'Example World Spec structure IDs must be unique');
        assert(placeIds.has(structure.placeId) && !linkedPlaceIds.has(structure.placeId), 'Example World Spec structures must link one-to-one to declared places');
        assert(['cottage', 'workshop', 'tower', 'shrine'].includes(structure.archetype), 'Example World Spec structure archetype is invalid');
        structureIds.add(structure.id);
        linkedPlaceIds.add(structure.placeId);
      }
      assert(worldSpec.output?.targets?.includes('godot'), 'Example World Spec does not target Godot');
      assert(worldSpec.output?.targets?.includes('itch'), 'Example World Spec does not target itch.io');
      return;
    }
    default:
      throw new Error(
        `Unsupported World Spec verification policy: ${CURRENT_RELEASE_CONFIG.release.verificationPolicy}`,
      );
  }
}

async function loadZip(fileName) {
  const bytes = await readFile(join(DEFAULT_RELEASE_ROOT, fileName));
  const zip = await JSZip.loadAsync(bytes, { checkCRC32: true, createFolders: false });
  const allEntries = Object.values(zip.files);
  assert(allEntries.every((entry) => !entry.dir), `${fileName} must not contain directory entries`);
  const entries = allEntries
    .sort((left, right) => comparePortablePaths(left.name, right.name));

  for (const entry of entries) {
    assertPortableRelativePath(entry.name);
    const entryBytes = await entry.async('nodebuffer');
    if (isTextPath(entry.name)) {
      assertNoLocalAbsolutePath(entryBytes.toString('utf8'), `${fileName}:${entry.name}`);
    }
  }

  return entries;
}

async function assertZipMatches(zipFileName, expectedEntries) {
  const actualEntries = await loadZip(zipFileName);
  const actualNames = actualEntries.map((entry) => entry.name);
  const expectedNames = [...expectedEntries.keys()].sort(comparePortablePaths);
  assert(
    JSON.stringify(actualNames) === JSON.stringify(expectedNames),
    `${zipFileName} entry list differs from the expected release inputs`,
  );

  for (const entry of actualEntries) {
    const actualBytes = await entry.async('nodebuffer');
    const expectedBytes = expectedEntries.get(entry.name);
    assert(
      actualBytes.equals(expectedBytes),
      `${zipFileName}:${entry.name} differs from its source`,
    );
  }
}

async function expectedWebEntries() {
  const prefix = `mapsoo-worldsmith-web-${RELEASE_TAG}/`;
  const result = new Map();
  for (const entry of await listFiles(join(REPOSITORY_ROOT, 'dist'))) {
    result.set(`${prefix}${entry.archivePath}`, await readPortableFile(entry.absolutePath, entry.archivePath));
  }
  return result;
}

async function expectedImporterEntries() {
  const result = new Map();
  const importerRoot = join(REPOSITORY_ROOT, 'godot', 'addons', 'mapsoo_importer');
  for (const entry of await listFiles(importerRoot)) {
    const archivePath = `addons/mapsoo_importer/${entry.archivePath}`;
    result.set(archivePath, await readPortableFile(entry.absolutePath, archivePath));
  }
  result.set(
    'addons/mapsoo_importer/LICENSE.txt',
    await readPortableFile(join(REPOSITORY_ROOT, 'LICENSE'), 'LICENSE.txt'),
  );
  return result;
}

async function expectedExamplePackEntries(pack = examplePacksForConfig()[0]) {
  const rootName = pack.archiveRoot;
  const packRoot = join(
    REPOSITORY_ROOT,
    pack.sourceDirectory,
  );
  const result = new Map();
  for (const entry of await listFiles(packRoot)) {
    const archivePath = `${rootName}/${entry.archivePath}`;
    result.set(archivePath, await readPortableFile(entry.absolutePath, archivePath));
  }
  return result;
}

async function expectedDirectoryArchiveEntries(archive) {
  const result = new Map();
  for (const entry of await listFiles(join(REPOSITORY_ROOT, archive.sourceDirectory))) {
    const archivePath = `${archive.archiveRoot}/${entry.archivePath}`;
    result.set(archivePath, await readPortableFile(entry.absolutePath, archivePath));
  }
  return result;
}

async function verifyChecksums() {
  const checksumText = normalizeText(
    await readFile(join(DEFAULT_RELEASE_ROOT, RELEASE_FILES.checksums), 'utf8'),
  );
  const lines = checksumText.trimEnd().split('\n');
  assert(lines.length === HASHED_RELEASE_FILE_NAMES.length, 'SHA256SUMS has an unexpected line count');

  const checksummedNames = [];
  for (const line of lines) {
    const match = /^([0-9a-f]{64})  ([^/\\]+)$/.exec(line);
    assert(match, `Invalid SHA256SUMS line: ${line}`);
    const [, expectedHash, fileName] = match;
    assert(HASHED_RELEASE_FILE_NAMES.includes(fileName), `Unexpected checksummed file: ${fileName}`);
    const actualHash = sha256(await readFile(join(DEFAULT_RELEASE_ROOT, fileName)));
    assert(actualHash === expectedHash, `SHA-256 mismatch for ${fileName}`);
    checksummedNames.push(fileName);
  }

  assert(
    JSON.stringify(checksummedNames) === JSON.stringify(HASHED_RELEASE_FILE_NAMES),
    'SHA256SUMS entries are missing or not deterministically sorted',
  );
}

async function verifyCopiedFile(releaseName, sourcePath) {
  const actual = await readFile(join(DEFAULT_RELEASE_ROOT, releaseName));
  const expected = await readPortableFile(sourcePath, releaseName);
  assert(actual.equals(expected), `${releaseName} differs from its source`);
  if (isTextPath(releaseName)) {
    assertNoLocalAbsolutePath(actual.toString('utf8'), releaseName);
  }
}

async function verifyConfiguredPack(pack) {
  const fileName = RELEASE_FILES[pack.releaseFileKey];
  const entries = await loadZip(fileName);
  assert(entries.every((entry) => entry.name.startsWith(`${pack.archiveRoot}/`)), `${pack.id} ZIP must contain exactly one versioned root folder`);
  assert(entries.every((entry) => !/(^|\/)addons\//.test(entry.name) && !/(^|\/)\.godot\//.test(entry.name) && /\.(?:json|md|png)$/i.test(entry.name)), `${pack.id} ZIP may contain only PNG, JSON, and Markdown data files`);
  const manifestEntry = entries.find((entry) => entry.name === `${pack.archiveRoot}/mapsoo.manifest.json`);
  assert(manifestEntry, `${pack.id} ZIP does not contain mapsoo.manifest.json`);
  const packManifest = JSON.parse(await manifestEntry.async('text'));
  verifyConfiguredExampleManifest(packManifest, pack.id);
  const files = new Map(entries.map((entry) => [entry.name.slice(pack.archiveRoot.length + 1), entry]));
  const records = packManifest.files ?? [];
  assert(Array.isArray(records) && entries.length === records.length + 1, `${pack.id} ZIP entry count/manifest coverage mismatch`);
  assert(new Set(records.map(({ path }) => path)).size === records.length, `${pack.id} manifest contains duplicate paths`);
  for (const [path] of files) if (path !== 'mapsoo.manifest.json') assert(records.some((record) => record.path === path), `${pack.id} unrecorded ZIP file: ${path}`);
  for (const record of records) {
    const entry = files.get(record.path);
    assert(entry, `${pack.id} manifest references missing file: ${record.path}`);
    const bytes = await entry.async('nodebuffer');
    assert(bytes.length === record.bytes && sha256(bytes) === record.sha256, `${pack.id} payload digest mismatch: ${record.path}`);
  }
  await verifyReceiptForRelease({
    version: VERSION,
    manifest: packManifest,
    context: `${pack.id} release pack`,
    readPackFile: async (path) => files.get(path)?.async('nodebuffer'),
  });
  const sourceChecks = [
    [pack.worldSpecPackPath, join(REPOSITORY_ROOT, pack.worldSpecInput)],
    ...CURRENT_RELEASE_CONFIG.release.schemas.map(({ packPath, source }) => [packPath, join(REPOSITORY_ROOT, source)]),
  ];
  for (const [packedPath, sourcePath] of sourceChecks) {
    const entry = files.get(packedPath);
    assert(entry, `${pack.id} ZIP is missing source file: ${packedPath}`);
    assert(JSON.stringify(JSON.parse(await entry.async('text'))) === JSON.stringify(JSON.parse(await readFile(sourcePath, 'utf8'))), `${pack.id} pack differs from source: ${packedPath}`);
  }
  return entries.length;
}

async function verify() {
  const expectedReleaseNames = [...HASHED_RELEASE_FILE_NAMES, RELEASE_FILES.checksums].sort(
    comparePortablePaths,
  );
  const actualReleaseNames = (await readdir(DEFAULT_RELEASE_ROOT, { withFileTypes: true }))
    .map((entry) => {
      assert(entry.isFile(), `Release output contains a non-file entry: ${entry.name}`);
      assertPortableRelativePath(entry.name);
      return entry.name;
    })
    .sort(comparePortablePaths);
  assert(
    JSON.stringify(actualReleaseNames) === JSON.stringify(expectedReleaseNames),
    'Release output contains missing or unexpected files',
  );

  if (CURRENT_RELEASE_CONFIG.lifecycle === 'published') {
    for (const [fileName, expectedHash] of Object.entries(
      CURRENT_RELEASE_CONFIG.publicReleaseAssetSha256,
    )) {
      const actualHash = sha256(await readFile(join(DEFAULT_RELEASE_ROOT, fileName)));
      assert(
        actualHash === expectedHash,
        `${fileName} differs from the immutable published digest for ${RELEASE_TAG}`,
      );
    }
    console.log(
      `MAPSOO_PUBLISHED_RELEASE_VERIFIED tag=${RELEASE_TAG} files=${actualReleaseNames.length}`,
    );
    return;
  }

  await verifyChecksums();
  const configuredPacks = examplePacksForConfig();
  for (const pack of configuredPacks) {
    assert(pack.expectedSha256, `No example-pack hash is configured for ${pack.id}`);
    assert(
      sha256(await readFile(join(DEFAULT_RELEASE_ROOT, RELEASE_FILES[pack.releaseFileKey]))) === pack.expectedSha256,
      `${pack.id} ZIP differs from the configured immutable hash for ${RELEASE_TAG}`,
    );
  }
  for (const archive of CURRENT_RELEASE_CONFIG.release.directoryArchives ?? []) {
    const fileName = RELEASE_FILES[archive.releaseFileKey];
    assert(
      sha256(await readFile(join(DEFAULT_RELEASE_ROOT, fileName))) === archive.expectedSha256,
      `${archive.id} ZIP differs from the configured immutable hash for ${RELEASE_TAG}`,
    );
    await assertZipMatches(fileName, await expectedDirectoryArchiveEntries(archive));
  }
  await assertZipMatches(RELEASE_FILES.web, await expectedWebEntries());
  await assertZipMatches(RELEASE_FILES.godotImporter, await expectedImporterEntries());
  for (const pack of configuredPacks) {
    await assertZipMatches(RELEASE_FILES[pack.releaseFileKey], await expectedExamplePackEntries(pack));
  }

  const importerEntries = await loadZip(RELEASE_FILES.godotImporter);
  const pluginEntry = importerEntries.find((entry) => entry.name === 'addons/mapsoo_importer/plugin.cfg');
  assert(pluginEntry, 'Godot importer ZIP does not contain plugin.cfg at its installable path');
  const importerScriptEntry = importerEntries.find(
    (entry) => entry.name === 'addons/mapsoo_importer/mapsoo_pack_importer.gd',
  );
  assert(importerScriptEntry, 'Godot importer ZIP does not contain mapsoo_pack_importer.gd');
  const pluginText = await pluginEntry.async('text');
  const importerScriptText = await importerScriptEntry.async('text');
  assert(
    pluginText.match(/^version="([^"]+)"$/m)?.[1] === VERSION,
    'Godot importer plugin.cfg version differs from the release version',
  );
  assert(
    importerScriptText.match(/^const IMPORTER_VERSION := "([^"]+)"$/m)?.[1] === VERSION,
    'Godot importer runtime version differs from the release version',
  );
  assert(
    importerEntries.some((entry) => entry.name === 'addons/mapsoo_importer/LICENSE.txt'),
    'Godot importer ZIP does not contain its MIT license',
  );
  assert(
    importerEntries.some((entry) => entry.name === 'addons/mapsoo_importer/README.md'),
    'Godot importer ZIP does not contain its installation README',
  );
  assert(
    importerEntries.some((entry) => entry.name === 'addons/mapsoo_importer/icon.svg'),
    'Godot importer ZIP does not contain its icon',
  );

  const webEntries = await loadZip(RELEASE_FILES.web);
  const webIndexEntry = webEntries.find(
    (entry) => entry.name === `mapsoo-worldsmith-web-${RELEASE_TAG}/index.html`,
  );
  assert(webIndexEntry, 'Web ZIP does not contain index.html in its versioned root');
  const webIndexHtml = await webIndexEntry.async('text');
  assert(
    /(?:src|href)="\/assets\//.test(webIndexHtml),
    'Release web ZIP must use a root base for static hosting',
  );
  assert(
    !webIndexHtml.includes('/mapsoo-kids/assets/'),
    'Release web ZIP must not inherit the GitHub Pages repository base',
  );
  if (CURRENT_RELEASE_CONFIG.version !== '0.1.0-alpha.1') {
    const noticeEntry = webEntries.find(
      (entry) => entry.name === `mapsoo-worldsmith-web-${RELEASE_TAG}/THIRD_PARTY_NOTICES.txt`,
    );
    assert(noticeEntry, 'Alpha.2 web ZIP must carry its third-party license notices');
    const notice = await noticeEntry.async('text');
    assert(
      notice.includes('pako 1.0.11')
        && notice.includes('Copyright (C) 2014-2017 by Vitaly Puzrin and Andrei Tuputcyn'),
      'Receipt-era web ZIP pako notice is incomplete',
    );
  }

  const examplePackEntryCounts = [];
  for (const pack of configuredPacks) examplePackEntryCounts.push(await verifyConfiguredPack(pack));

  await verifyCopiedFile(
    RELEASE_FILES.exampleWorldSpec,
    join(REPOSITORY_ROOT, CURRENT_RELEASE_CONFIG.release.inputs.exampleWorldSpec),
  );
  for (const pack of configuredPacks.slice(1)) {
    await verifyCopiedFile(RELEASE_FILES[pack.worldSpecReleaseFileKey], join(REPOSITORY_ROOT, pack.worldSpecInput));
  }
  for (const { releaseFileKey, source } of CURRENT_RELEASE_CONFIG.release.schemas) {
    await verifyCopiedFile(RELEASE_FILES[releaseFileKey], join(REPOSITORY_ROOT, source));
  }
  for (const { releaseFileKey, source } of CURRENT_RELEASE_CONFIG.release.extraFiles ?? []) {
    await verifyCopiedFile(RELEASE_FILES[releaseFileKey], join(REPOSITORY_ROOT, source));
  }
  await verifyCopiedFile(
    RELEASE_FILES.license,
    join(REPOSITORY_ROOT, CURRENT_RELEASE_CONFIG.release.inputs.license),
  );
  await verifyCopiedFile(
    RELEASE_FILES.changelog,
    join(REPOSITORY_ROOT, CURRENT_RELEASE_CONFIG.release.inputs.changelog),
  );
  if (RELEASE_FILES.evidenceVideo) {
    await verifyCopiedFile(
      RELEASE_FILES.evidenceVideo,
      join(REPOSITORY_ROOT, CURRENT_RELEASE_CONFIG.release.inputs.evidenceVideo),
    );
  }

  for (const pack of configuredPacks) {
    const worldSpec = JSON.parse(await readFile(join(DEFAULT_RELEASE_ROOT, RELEASE_FILES[pack.worldSpecReleaseFileKey]), 'utf8'));
    assert(worldSpec.id === pack.id, `${pack.id} release World Spec ID mismatch`);
    verifyConfiguredWorldSpec(worldSpec);
  }

  for (const { releaseFileKey } of CURRENT_RELEASE_CONFIG.release.schemas) {
    JSON.parse(await readFile(join(DEFAULT_RELEASE_ROOT, RELEASE_FILES[releaseFileKey]), 'utf8'));
  }
  for (const { releaseFileKey } of CURRENT_RELEASE_CONFIG.release.extraFiles ?? []) {
    JSON.parse(await readFile(join(DEFAULT_RELEASE_ROOT, RELEASE_FILES[releaseFileKey]), 'utf8'));
  }

  const manifest = JSON.parse(
    await readFile(join(DEFAULT_RELEASE_ROOT, RELEASE_FILES.manifest), 'utf8'),
  );
  const expectedArtifactKeys = [
    'changelog',
    'checksums',
    'examplePacks',
    'exampleWorldSpecs',
    'godotImporter',
    'license',
    'schemas',
    'web',
    ...((CURRENT_RELEASE_CONFIG.release.extraFiles?.length ?? 0) > 0 ? ['integrationContracts'] : []),
    ...((CURRENT_RELEASE_CONFIG.release.directoryArchives?.length ?? 0) > 0 ? ['additionalPacks'] : []),
    ...(RELEASE_FILES.evidenceVideo ? ['evidenceVideo'] : []),
  ].sort(comparePortablePaths);
  assert(
    JSON.stringify(Object.keys(manifest.artifacts ?? {}).sort(comparePortablePaths))
      === JSON.stringify(expectedArtifactKeys),
    'Release manifest artifact keys do not match the configured release files',
  );
  assert(manifest.version === VERSION, 'Release manifest version differs from package.json');
  assert(manifest.releaseTag === RELEASE_TAG, 'Release manifest tag differs from package.json');
  assert(manifest.artifacts?.web?.file === RELEASE_FILES.web, 'Release manifest web artifact mismatch');
  assert(
    manifest.artifacts?.godotImporter?.file === RELEASE_FILES.godotImporter,
    'Release manifest Godot importer artifact mismatch',
  );
  assert(
    JSON.stringify(manifest.artifacts?.examplePacks?.map(({ id, file }) => ({ id, file })))
      === JSON.stringify(configuredPacks.map((pack) => ({ id: pack.id, file: RELEASE_FILES[pack.releaseFileKey] }))),
    'Release manifest example-pack artifacts mismatch',
  );
  assert(
    JSON.stringify(manifest.artifacts?.exampleWorldSpecs?.map(({ id, file }) => ({ id, file })))
      === JSON.stringify(configuredPacks.map((pack) => ({ id: pack.id, file: RELEASE_FILES[pack.worldSpecReleaseFileKey] }))),
    'Release manifest example-World-Spec artifacts mismatch',
  );
  assert(
    JSON.stringify(manifest.artifacts?.schemas) === JSON.stringify(
      CURRENT_RELEASE_CONFIG.release.schemas.map(
        ({ releaseFileKey }) => RELEASE_FILES[releaseFileKey],
      ),
    ),
    'Release manifest schema artifacts mismatch',
  );
  if ((CURRENT_RELEASE_CONFIG.release.extraFiles?.length ?? 0) > 0) {
    assert(
      JSON.stringify(manifest.artifacts?.integrationContracts)
        === JSON.stringify(CURRENT_RELEASE_CONFIG.release.extraFiles.map(({ releaseFileKey, source }) => ({
          file: RELEASE_FILES[releaseFileKey], source,
        }))),
      'Release manifest integration contract artifacts mismatch',
    );
  }
  if ((CURRENT_RELEASE_CONFIG.release.directoryArchives?.length ?? 0) > 0) {
    assert(
      JSON.stringify(manifest.artifacts?.additionalPacks)
        === JSON.stringify(CURRENT_RELEASE_CONFIG.release.directoryArchives.map((archive) => ({
          id: archive.id,
          file: RELEASE_FILES[archive.releaseFileKey],
          sha256: archive.expectedSha256,
          purpose: archive.purpose,
        }))),
      'Release manifest additional pack artifacts mismatch',
    );
  }
  if (RELEASE_FILES.evidenceVideo) {
    assert(
      manifest.artifacts?.evidenceVideo?.file === RELEASE_FILES.evidenceVideo,
      'Release manifest evidence video artifact mismatch',
    );
  } else {
    assert(
      !Object.hasOwn(manifest.artifacts ?? {}, 'evidenceVideo'),
      'Release manifest must not claim an unconfigured evidence video',
    );
  }
  assertNoLocalAbsolutePath(JSON.stringify(manifest), RELEASE_FILES.manifest);

  console.log(
    `MAPSOO_RELEASE_VERIFIED tag=${RELEASE_TAG} files=${actualReleaseNames.length} web_entries=${webEntries.length} importer_entries=${importerEntries.length} example_packs=${configuredPacks.length} example_pack_entries=${examplePackEntryCounts.join(',')}`,
  );
}

try {
  await verify();
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}
