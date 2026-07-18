#!/usr/bin/env node

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import JSZip from 'jszip';

import {
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
  normalizeText,
  readPortableFile,
  sha256,
} from './release-lib.mjs';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function loadZip(fileName) {
  const bytes = await readFile(join(DEFAULT_RELEASE_ROOT, fileName));
  const zip = await JSZip.loadAsync(bytes, { checkCRC32: true, createFolders: false });
  const entries = Object.values(zip.files)
    .filter((entry) => !entry.dir)
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

async function expectedExamplePackEntries() {
  const rootName = `mapsoo-sunny-meadow-${RELEASE_TAG}`;
  const packRoot = join(REPOSITORY_ROOT, 'examples', 'packs', `sunny-meadow-${RELEASE_TAG}`);
  const result = new Map();
  for (const entry of await listFiles(packRoot)) {
    const archivePath = `${rootName}/${entry.archivePath}`;
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

  await verifyChecksums();
  await assertZipMatches(RELEASE_FILES.web, await expectedWebEntries());
  await assertZipMatches(RELEASE_FILES.godotImporter, await expectedImporterEntries());
  await assertZipMatches(RELEASE_FILES.examplePack, await expectedExamplePackEntries());

  const importerEntries = await loadZip(RELEASE_FILES.godotImporter);
  assert(
    importerEntries.some((entry) => entry.name === 'addons/mapsoo_importer/plugin.cfg'),
    'Godot importer ZIP does not contain plugin.cfg at its installable path',
  );
  assert(
    importerEntries.some((entry) => entry.name === 'addons/mapsoo_importer/LICENSE.txt'),
    'Godot importer ZIP does not contain its MIT license',
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

  const examplePackEntries = await loadZip(RELEASE_FILES.examplePack);
  const examplePackRoot = `mapsoo-sunny-meadow-${RELEASE_TAG}`;
  assert(
    examplePackEntries.every((entry) => entry.name.startsWith(`${examplePackRoot}/`)),
    'Sunny Meadow ZIP must contain exactly one versioned root folder',
  );
  assert(
    examplePackEntries.every(
      (entry) =>
        !/(^|\/)addons\//.test(entry.name) &&
        !/(^|\/)\.godot\//.test(entry.name) &&
        /\.(?:json|md|png)$/i.test(entry.name),
    ),
    'Sunny Meadow ZIP may contain only PNG, JSON, and Markdown data files',
  );

  const exampleManifestEntry = examplePackEntries.find(
    (entry) => entry.name === `${examplePackRoot}/mapsoo.manifest.json`,
  );
  assert(exampleManifestEntry, 'Sunny Meadow ZIP does not contain mapsoo.manifest.json');
  const exampleManifest = JSON.parse(await exampleManifestEntry.async('text'));
  assert(exampleManifest.pack?.id === 'sunny-meadow', 'Sunny Meadow manifest pack ID mismatch');
  assert(exampleManifest.pack?.version === VERSION, 'Sunny Meadow manifest version mismatch');
  assert(
    exampleManifest.provenance?.contains_generative_ai === false,
    'Sunny Meadow alpha must disclose that its artwork is procedural, not model-generated',
  );
  assert(exampleManifest.license?.assets?.id === 'CC0-1.0', 'Sunny Meadow asset license mismatch');
  assert(
    exampleManifest.compatibility?.importer?.source ===
      'https://github.com/babyrush0101-source/mapsoo-kids',
    'Sunny Meadow importer source must point to the official repository',
  );

  const exampleFiles = new Map(
    examplePackEntries.map((entry) => [entry.name.slice(examplePackRoot.length + 1), entry]),
  );
  const exampleFileRecords = exampleManifest.files ?? [];
  assert(Array.isArray(exampleFileRecords), 'Sunny Meadow manifest files must be an array');
  const exampleFileRecordPaths = new Set(exampleFileRecords.map((record) => record.path));
  assert(
    exampleFileRecordPaths.size === exampleFileRecords.length,
    'Sunny Meadow manifest must not contain duplicate file paths',
  );
  assert(
    exampleFiles.size === exampleFileRecords.length + 1,
    'Sunny Meadow ZIP contains files that are not covered by its manifest',
  );
  for (const packedPath of exampleFiles.keys()) {
    if (packedPath !== 'mapsoo.manifest.json') {
      assert(
        exampleFileRecordPaths.has(packedPath),
        `Sunny Meadow ZIP file is not covered by its manifest: ${packedPath}`,
      );
    }
  }
  for (const fileRecord of exampleFileRecords) {
    const entry = exampleFiles.get(fileRecord.path);
    assert(entry, `Sunny Meadow manifest references a missing file: ${fileRecord.path}`);
    const bytes = await entry.async('nodebuffer');
    assert(bytes.length === fileRecord.bytes, `Sunny Meadow byte count mismatch: ${fileRecord.path}`);
    assert(sha256(bytes) === fileRecord.sha256, `Sunny Meadow SHA-256 mismatch: ${fileRecord.path}`);
  }

  const sourceJsonChecks = [
    ['worlds/sunny-meadow.world.json', join(REPOSITORY_ROOT, 'examples', 'sunny-meadow.world.json')],
    ['schema/mapsoo-world.schema.json', join(REPOSITORY_ROOT, 'schemas', 'mapsoo-world.schema.json')],
    ['schema/mapsoo-pack.schema.json', join(REPOSITORY_ROOT, 'schemas', 'mapsoo-pack.schema.json')],
  ];
  for (const [packedPath, sourcePath] of sourceJsonChecks) {
    const entry = exampleFiles.get(packedPath);
    assert(entry, `Sunny Meadow ZIP is missing its versioned source file: ${packedPath}`);
    const packedJson = JSON.parse(await entry.async('text'));
    const sourceJson = JSON.parse(await readFile(sourcePath, 'utf8'));
    assert(
      JSON.stringify(packedJson) === JSON.stringify(sourceJson),
      `Sunny Meadow pack differs structurally from its source: ${packedPath}`,
    );
  }

  await verifyCopiedFile(
    RELEASE_FILES.exampleWorldSpec,
    join(REPOSITORY_ROOT, 'examples', 'sunny-meadow.world.json'),
  );
  await verifyCopiedFile(
    RELEASE_FILES.worldSchema,
    join(REPOSITORY_ROOT, 'schemas', 'mapsoo-world.schema.json'),
  );
  await verifyCopiedFile(
    RELEASE_FILES.packSchema,
    join(REPOSITORY_ROOT, 'schemas', 'mapsoo-pack.schema.json'),
  );
  await verifyCopiedFile(RELEASE_FILES.license, join(REPOSITORY_ROOT, 'LICENSE'));
  await verifyCopiedFile(RELEASE_FILES.changelog, join(REPOSITORY_ROOT, 'CHANGELOG.md'));

  const worldSpec = JSON.parse(
    await readFile(join(DEFAULT_RELEASE_ROOT, RELEASE_FILES.exampleWorldSpec), 'utf8'),
  );
  assert(worldSpec.schemaVersion === '0.1.0', 'Example World Spec has an unexpected schema version');
  assert(worldSpec.output?.targets?.includes('godot'), 'Example World Spec does not target Godot');
  assert(worldSpec.output?.targets?.includes('itch'), 'Example World Spec does not target itch.io');

  JSON.parse(await readFile(join(DEFAULT_RELEASE_ROOT, RELEASE_FILES.worldSchema), 'utf8'));
  JSON.parse(await readFile(join(DEFAULT_RELEASE_ROOT, RELEASE_FILES.packSchema), 'utf8'));

  const manifest = JSON.parse(
    await readFile(join(DEFAULT_RELEASE_ROOT, RELEASE_FILES.manifest), 'utf8'),
  );
  assert(manifest.version === VERSION, 'Release manifest version differs from package.json');
  assert(manifest.releaseTag === RELEASE_TAG, 'Release manifest tag differs from package.json');
  assert(manifest.artifacts?.web?.file === RELEASE_FILES.web, 'Release manifest web artifact mismatch');
  assert(
    manifest.artifacts?.godotImporter?.file === RELEASE_FILES.godotImporter,
    'Release manifest Godot importer artifact mismatch',
  );
  assert(
    manifest.artifacts?.examplePack?.file === RELEASE_FILES.examplePack,
    'Release manifest Sunny Meadow artifact mismatch',
  );
  assertNoLocalAbsolutePath(JSON.stringify(manifest), RELEASE_FILES.manifest);

  console.log(
    `MAPSOO_RELEASE_VERIFIED tag=${RELEASE_TAG} files=${actualReleaseNames.length} web_entries=${webEntries.length} importer_entries=${importerEntries.length} example_pack_entries=${examplePackEntries.length}`,
  );
}

try {
  await verify();
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}
