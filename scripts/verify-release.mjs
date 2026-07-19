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
  normalizeText,
  readPortableFile,
  sha256,
} from './release-lib.mjs';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function verifyConfiguredExampleManifest(manifest) {
  assert(
    manifest.pack?.id === CURRENT_RELEASE_CONFIG.release.examplePack.id,
    'Example manifest pack ID mismatch',
  );
  assert(manifest.pack?.version === VERSION, 'Example manifest version mismatch');

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
          manifest.pack?.generator?.version === VERSION,
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
      assert(worldSpec.schemaVersion === '0.1.0', 'Example World Spec has an unexpected schema version');
      assert(worldSpec.output?.targets?.includes('godot'), 'Example World Spec does not target Godot');
      assert(worldSpec.output?.targets?.includes('itch'), 'Example World Spec does not target itch.io');
      return;
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

async function expectedExamplePackEntries() {
  const rootName = CURRENT_RELEASE_CONFIG.release.examplePack.archiveRoot;
  const packRoot = join(
    REPOSITORY_ROOT,
    CURRENT_RELEASE_CONFIG.release.examplePack.sourceDirectory,
  );
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
  const pinnedExamplePackHash = CURRENT_RELEASE_CONFIG.expectedExamplePackSha256;
  assert(pinnedExamplePackHash, `No example-pack hash is configured for ${RELEASE_TAG}`);
  assert(
    sha256(await readFile(join(DEFAULT_RELEASE_ROOT, RELEASE_FILES.examplePack))) === pinnedExamplePackHash,
    `Sunny Meadow ZIP differs from the configured immutable hash for ${RELEASE_TAG}`,
  );
  await assertZipMatches(RELEASE_FILES.web, await expectedWebEntries());
  await assertZipMatches(RELEASE_FILES.godotImporter, await expectedImporterEntries());
  await assertZipMatches(RELEASE_FILES.examplePack, await expectedExamplePackEntries());

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

  const examplePackEntries = await loadZip(RELEASE_FILES.examplePack);
  if (CURRENT_RELEASE_CONFIG.release.verificationPolicy !== 'sunny-meadow-procedural-cc0-v1') {
    assert(examplePackEntries.length === 12, 'Receipt-bearing Sunny Meadow ZIP must contain exactly 12 files');
  }
  const examplePackRoot = CURRENT_RELEASE_CONFIG.release.examplePack.archiveRoot;
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
  verifyConfiguredExampleManifest(exampleManifest);

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

  await verifyReceiptForRelease({
    version: VERSION,
    manifest: exampleManifest,
    context: 'Sunny Meadow release pack',
    readPackFile: async (path) => {
      const entry = exampleFiles.get(path);
      return entry ? entry.async('nodebuffer') : undefined;
    },
  });

  const sourceJsonChecks = [
    [
      CURRENT_RELEASE_CONFIG.release.examplePack.worldSpecPackPath,
      join(REPOSITORY_ROOT, CURRENT_RELEASE_CONFIG.release.inputs.exampleWorldSpec),
    ],
    ...CURRENT_RELEASE_CONFIG.release.schemas.map(({ packPath, source }) => [
      packPath,
      join(REPOSITORY_ROOT, source),
    ]),
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
    join(REPOSITORY_ROOT, CURRENT_RELEASE_CONFIG.release.inputs.exampleWorldSpec),
  );
  for (const { releaseFileKey, source } of CURRENT_RELEASE_CONFIG.release.schemas) {
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

  const worldSpec = JSON.parse(
    await readFile(join(DEFAULT_RELEASE_ROOT, RELEASE_FILES.exampleWorldSpec), 'utf8'),
  );
  verifyConfiguredWorldSpec(worldSpec);

  for (const { releaseFileKey } of CURRENT_RELEASE_CONFIG.release.schemas) {
    JSON.parse(await readFile(join(DEFAULT_RELEASE_ROOT, RELEASE_FILES[releaseFileKey]), 'utf8'));
  }

  const manifest = JSON.parse(
    await readFile(join(DEFAULT_RELEASE_ROOT, RELEASE_FILES.manifest), 'utf8'),
  );
  const expectedArtifactKeys = [
    'changelog',
    'checksums',
    'examplePack',
    'exampleWorldSpec',
    'godotImporter',
    'license',
    'schemas',
    'web',
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
    manifest.artifacts?.examplePack?.file === RELEASE_FILES.examplePack,
    'Release manifest Sunny Meadow artifact mismatch',
  );
  assert(
    JSON.stringify(manifest.artifacts?.schemas) === JSON.stringify(
      CURRENT_RELEASE_CONFIG.release.schemas.map(
        ({ releaseFileKey }) => RELEASE_FILES[releaseFileKey],
      ),
    ),
    'Release manifest schema artifacts mismatch',
  );
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
    `MAPSOO_RELEASE_VERIFIED tag=${RELEASE_TAG} files=${actualReleaseNames.length} web_entries=${webEntries.length} importer_entries=${importerEntries.length} example_pack_entries=${examplePackEntries.length}`,
  );
}

try {
  await verify();
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}
