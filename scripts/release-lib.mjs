import { createHash } from 'node:crypto';
import { readFile, readdir, rm, mkdir, writeFile, lstat } from 'node:fs/promises';
import * as nodePath from 'node:path';
import { join, relative, resolve, sep } from 'node:path';

import JSZip from 'jszip';

import {
  CURRENT_RELEASE_CONFIG,
  PACKAGE_JSON_PATH,
  REPOSITORY_ROOT,
  assertReleaseBuildAllowed,
  assertReceiptVerifierBinding,
  assertRegisteredReleaseConfig,
  getReleaseConfig,
  listPublishedReleaseConfigs,
  listReleaseConfigs,
} from './release-config.mjs';

export {
  CURRENT_RELEASE_CONFIG,
  PACKAGE_JSON_PATH,
  REPOSITORY_ROOT,
  assertReleaseBuildAllowed,
  assertReceiptVerifierBinding,
  assertRegisteredReleaseConfig,
  getReleaseConfig,
  listPublishedReleaseConfigs,
  listReleaseConfigs,
};

export const VERSION = CURRENT_RELEASE_CONFIG.version;
export const RELEASE_TAG = CURRENT_RELEASE_CONFIG.tag;
export const DEFAULT_RELEASE_ROOT = join(REPOSITORY_ROOT, 'release', RELEASE_TAG);
export const ZIP_DATE = new Date(Date.UTC(1980, 0, 1, 0, 0, 0, 0));

// Published hashes are immutable evidence. Add a new tag entry for a new pack;
// never replace an existing value to make a rebuilt historical release pass.
export const VERIFIED_PUBLIC_EXAMPLE_PACK_HASHES = Object.freeze({
  ...Object.fromEntries(
    listPublishedReleaseConfigs().map(({ tag, publicExamplePackSha256 }) => [
      tag,
      publicExamplePackSha256,
    ]),
  ),
});

export function comparePortablePaths(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export const RELEASE_FILES = CURRENT_RELEASE_CONFIG.release.files;

export function hashedReleaseFileNames(config = CURRENT_RELEASE_CONFIG) {
  return Object.freeze(
    Object.values(config.release.files)
      .filter((name) => name !== config.release.files.checksums)
      .sort(comparePortablePaths),
  );
}

export function examplePacksForConfig(config = CURRENT_RELEASE_CONFIG) {
  return Object.freeze([
    Object.freeze({
      ...config.release.examplePack,
      releaseFileKey: 'examplePack',
      worldSpecReleaseFileKey: 'exampleWorldSpec',
      worldSpecInput: config.release.inputs.exampleWorldSpec,
      expectedSha256: config.expectedExamplePackSha256,
    }),
    ...(config.release.additionalExamplePacks ?? []),
  ]);
}

export const HASHED_RELEASE_FILE_NAMES = Object.freeze(
  Object.values(CURRENT_RELEASE_CONFIG.release.files)
    .filter((name) => name !== CURRENT_RELEASE_CONFIG.release.files.checksums)
    .sort(comparePortablePaths),
);

export const TEXT_EXTENSIONS = new Set([
  '.cfg',
  '.css',
  '.gd',
  '.html',
  '.js',
  '.json',
  '.md',
  '.svg',
  '.txt',
  '.uid',
  '.xml',
]);

const FORBIDDEN_PATH_SEGMENTS = new Set(['.git', '.godot', 'node_modules']);
const LOCAL_ABSOLUTE_PATH_PATTERNS = [
  { label: 'Windows drive path', expression: /(?:^|[\s"'=(])(?:[A-Za-z]:[\\/])/m },
  { label: 'Windows user profile path', expression: /(?:^|[\s"'=(])(?:\\\\[^\\\s]+\\|[A-Za-z]:\\Users\\)/im },
  { label: 'file URL', expression: /file:\/\//i },
  { label: 'Unix home path', expression: /(?:^|[\s"'=(])\/(?:home|Users)\/[^/\s]+\//m },
  { label: 'Unix temporary path', expression: /(?:^|[\s"'=(])\/(?:private\/)?tmp\//m },
];

export function normalizeText(value) {
  return value.replace(/\r\n?/g, '\n');
}

export function toPosixPath(value) {
  return value.split(sep).join('/');
}

export function extensionOf(path) {
  const fileName = path.split('/').at(-1) ?? '';
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex < 0 ? '' : fileName.slice(dotIndex).toLowerCase();
}

export function isTextPath(path) {
  const name = path.split('/').at(-1)?.toLowerCase() ?? '';
  return name === 'license' || name === 'sha256sums' || TEXT_EXTENSIONS.has(extensionOf(path));
}

export async function readPortableFile(path, archivePath = path) {
  const bytes = await readFile(path);
  if (!isTextPath(archivePath)) {
    return bytes;
  }

  return Buffer.from(normalizeText(bytes.toString('utf8')), 'utf8');
}

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function assertPortableRelativePath(path) {
  if (!path || path.startsWith('/') || path.startsWith('\\') || /^[A-Za-z]:/.test(path)) {
    throw new Error(`Release path must be relative: ${path}`);
  }
  if (path.includes('\\')) {
    throw new Error(`Release path must use forward slashes: ${path}`);
  }

  const segments = path.split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    throw new Error(`Release path contains an unsafe segment: ${path}`);
  }
  if (segments.some((segment) => FORBIDDEN_PATH_SEGMENTS.has(segment))) {
    throw new Error(`Release path contains a forbidden segment: ${path}`);
  }
}

export function assertNoLocalAbsolutePath(text, context) {
  for (const { label, expression } of LOCAL_ABSOLUTE_PATH_PATTERNS) {
    if (expression.test(text)) {
      throw new Error(`${context} contains a ${label}`);
    }
  }
}

export function assertDescendantPath(parent, candidate, context, pathApi = nodePath) {
  const resolvedParent = pathApi.resolve(parent);
  const resolvedCandidate = pathApi.resolve(candidate);
  const child = pathApi.relative(resolvedParent, resolvedCandidate);
  if (
    !child ||
    pathApi.isAbsolute(child) ||
    child === '..' ||
    child.startsWith(`..${pathApi.sep}`)
  ) {
    throw new Error(`${context}: ${resolvedCandidate}`);
  }
  return resolvedCandidate;
}

export function assertPathInsideOrEqual(parent, candidate, context, pathApi = nodePath) {
  const resolvedParent = pathApi.resolve(parent);
  const resolvedCandidate = pathApi.resolve(candidate);
  const child = pathApi.relative(resolvedParent, resolvedCandidate);
  if (
    pathApi.isAbsolute(child)
    || child === '..'
    || child.startsWith(`..${pathApi.sep}`)
  ) {
    throw new Error(`${context}: ${resolvedCandidate}`);
  }
  return resolvedCandidate;
}

async function assertNoLinkedPathComponents(parent, candidate, context) {
  const resolvedParent = resolve(parent);
  const resolvedCandidate = assertPathInsideOrEqual(resolvedParent, candidate, context);
  const components = [resolvedParent];
  let current = resolvedParent;
  const child = relative(resolvedParent, resolvedCandidate);
  for (const segment of child ? child.split(sep) : []) {
    current = join(current, segment);
    components.push(current);
  }

  for (const component of components) {
    let componentStat;
    try {
      componentStat = await lstat(component);
    } catch (error) {
      if (error?.code === 'ENOENT') {
        break;
      }
      throw error;
    }
    if (componentStat.isSymbolicLink()) {
      throw new Error(`${context}; path contains a symbolic link or junction: ${component}`);
    }
  }
  return resolvedCandidate;
}

export async function assertSafeOutputPath(parent, candidate, context) {
  const resolvedCandidate = assertDescendantPath(parent, candidate, context);
  assertPathInsideOrEqual(REPOSITORY_ROOT, parent, `${context}; parent must stay inside the repository`);
  await assertNoLinkedPathComponents(REPOSITORY_ROOT, parent, context);
  await mkdir(parent, { recursive: true });
  await assertNoLinkedPathComponents(REPOSITORY_ROOT, resolvedCandidate, context);
  return resolvedCandidate;
}

export async function replaceSafeOutputDirectory(parent, candidate, context) {
  const resolvedCandidate = await assertSafeOutputPath(parent, candidate, context);
  await rm(resolvedCandidate, { recursive: true, force: true });
  await mkdir(resolvedCandidate, { recursive: true });
  return resolvedCandidate;
}

export async function removeSafeOutputDirectory(parent, candidate, context) {
  const resolvedCandidate = await assertSafeOutputPath(parent, candidate, context);
  await rm(resolvedCandidate, { recursive: true, force: true });
}

export async function listFiles(root) {
  const rootStat = await lstat(root);
  if (!rootStat.isDirectory()) {
    throw new Error(`Expected a directory: ${root}`);
  }

  const files = [];
  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => comparePortablePaths(left.name, right.name));
    for (const entry of entries) {
      const absolutePath = join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error(`Release inputs may not contain symbolic links: ${absolutePath}`);
      }
      if (entry.isDirectory()) {
        if (FORBIDDEN_PATH_SEGMENTS.has(entry.name)) {
          throw new Error(`Release inputs contain forbidden directory: ${absolutePath}`);
        }
        await visit(absolutePath);
      } else if (entry.isFile()) {
        const archivePath = toPosixPath(relative(root, absolutePath));
        assertPortableRelativePath(archivePath);
        files.push({ absolutePath, archivePath });
      }
    }
  }

  await visit(root);
  return files;
}

export async function createDeterministicZip(entries) {
  const zip = new JSZip();
  const sortedEntries = [...entries].sort((left, right) =>
    comparePortablePaths(left.archivePath, right.archivePath),
  );

  for (const entry of sortedEntries) {
    assertPortableRelativePath(entry.archivePath);
    const bytes = entry.bytes ?? (await readPortableFile(entry.absolutePath, entry.archivePath));
    if (isTextPath(entry.archivePath)) {
      assertNoLocalAbsolutePath(bytes.toString('utf8'), `ZIP entry ${entry.archivePath}`);
    }
    zip.file(entry.archivePath, bytes, {
      binary: true,
      createFolders: false,
      date: ZIP_DATE,
      unixPermissions: 0o100644,
    });
  }

  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
    platform: 'UNIX',
    streamFiles: false,
  });
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function buildExamplePackArchive(version = VERSION, packId = undefined) {
  const config = getReleaseConfig(version);
  const pack = packId
    ? examplePacksForConfig(config).find((candidate) => candidate.id === packId)
    : examplePacksForConfig(config)[0];
  if (!pack) throw new Error(`Unknown example pack for ${config.tag}: ${String(packId)}`);
  const examplePackRoot = join(REPOSITORY_ROOT, pack.sourceDirectory);
  const examplePackFiles = await listFiles(examplePackRoot);
  const examplePackZipEntries = examplePackFiles.map((entry) => ({
    ...entry,
    archivePath: `${pack.archiveRoot}/${entry.archivePath}`,
  }));
  return createDeterministicZip(examplePackZipEntries);
}

export async function buildRelease(outputRoot, version = VERSION, options = {}) {
  const config = assertReleaseBuildAllowed(getReleaseConfig(version));
  const releaseTag = config.tag;
  const releaseFiles = config.release.files;
  const hashedFileNames = hashedReleaseFileNames(config);
  const requestedOutputRoot = outputRoot ?? join(REPOSITORY_ROOT, 'release', releaseTag);

  const releaseParent = resolve(REPOSITORY_ROOT, 'release');
  const resolvedOutputRoot = await replaceSafeOutputDirectory(
    releaseParent,
    requestedOutputRoot,
    'Refusing to replace output outside release/',
  );

  const requestedDistRoot = options.distRoot ?? join(REPOSITORY_ROOT, 'dist');
  const distRoot = await assertSafeOutputPath(
    REPOSITORY_ROOT,
    requestedDistRoot,
    'Release web input must stay inside the repository',
  );
  const webFiles = await listFiles(distRoot);
  if (!webFiles.some((entry) => entry.archivePath === 'index.html')) {
    throw new Error('dist/index.html is missing; run the web build first');
  }
  const webZipEntries = webFiles.map((entry) => ({
    ...entry,
    archivePath: `mapsoo-worldsmith-web-${releaseTag}/${entry.archivePath}`,
  }));
  await writeFile(
    join(resolvedOutputRoot, releaseFiles.web),
    await createDeterministicZip(webZipEntries),
  );

  const importerRoot = join(REPOSITORY_ROOT, 'godot', 'addons', 'mapsoo_importer');
  const importerFiles = await listFiles(importerRoot);
  const importerZipEntries = importerFiles.map((entry) => ({
    ...entry,
    archivePath: `addons/mapsoo_importer/${entry.archivePath}`,
  }));
  importerZipEntries.push({
    archivePath: 'addons/mapsoo_importer/LICENSE.txt',
    bytes: await readPortableFile(join(REPOSITORY_ROOT, 'LICENSE'), 'LICENSE.txt'),
  });
  await writeFile(
    join(resolvedOutputRoot, releaseFiles.godotImporter),
    await createDeterministicZip(importerZipEntries),
  );

  const examplePacks = examplePacksForConfig(config);
  for (const pack of examplePacks) {
    await writeFile(
      join(resolvedOutputRoot, releaseFiles[pack.releaseFileKey]),
      await buildExamplePackArchive(version, pack.id),
    );
  }

  const copiedFiles = [
    [join(REPOSITORY_ROOT, config.release.inputs.exampleWorldSpec), releaseFiles.exampleWorldSpec],
    ...examplePacks.slice(1).map((pack) => [
      join(REPOSITORY_ROOT, pack.worldSpecInput),
      releaseFiles[pack.worldSpecReleaseFileKey],
    ]),
    ...config.release.schemas.map(({ releaseFileKey, source }) => [
      join(REPOSITORY_ROOT, source),
      releaseFiles[releaseFileKey],
    ]),
    ...(config.release.extraFiles ?? []).map(({ releaseFileKey, source }) => [
      join(REPOSITORY_ROOT, source),
      releaseFiles[releaseFileKey],
    ]),
    [join(REPOSITORY_ROOT, config.release.inputs.license), releaseFiles.license],
    [join(REPOSITORY_ROOT, config.release.inputs.changelog), releaseFiles.changelog],
  ];
  if (releaseFiles.evidenceVideo) {
    copiedFiles.push([
      join(REPOSITORY_ROOT, config.release.inputs.evidenceVideo),
      releaseFiles.evidenceVideo,
    ]);
  }

  for (const [source, targetName] of copiedFiles) {
    const bytes = await readPortableFile(source, targetName);
    if (isTextPath(targetName)) {
      assertNoLocalAbsolutePath(bytes.toString('utf8'), targetName);
    }
    await writeFile(join(resolvedOutputRoot, targetName), bytes);
  }

  const releaseManifest = {
    schemaVersion: 1,
    project: 'Mapsoo Worldsmith',
    version: config.version,
    releaseTag,
    artifacts: {
      web: {
        file: releaseFiles.web,
        purpose: 'Static web generator build',
      },
      godotImporter: {
        file: releaseFiles.godotImporter,
        purpose: 'Godot 4.3+ editor plugin; extract into a Godot project root',
      },
      examplePacks: examplePacks.map((pack) => ({
        id: pack.id,
        file: releaseFiles[pack.releaseFileKey],
        purpose: `Executable-free ${pack.id} PNG + JSON pack CI-gated on Godot 4.3 and 4.7`,
      })),
      ...(releaseFiles.evidenceVideo ? {
        evidenceVideo: {
          file: releaseFiles.evidenceVideo,
          purpose: 'Silent bilingual 75-second H.264 evidence cut for the verified release candidate',
        },
      } : {}),
      exampleWorldSpecs: examplePacks.map((pack) => ({
        id: pack.id,
        file: releaseFiles[pack.worldSpecReleaseFileKey],
        purpose: `Versioned ${pack.id} input example`,
      })),
      schemas: config.release.schemas.map(({ releaseFileKey }) => releaseFiles[releaseFileKey]),
      ...((config.release.extraFiles?.length ?? 0) > 0 ? {
        integrationContracts: config.release.extraFiles.map(({ releaseFileKey, source }) => ({
          file: releaseFiles[releaseFileKey],
          source,
        })),
      } : {}),
      license: releaseFiles.license,
      changelog: releaseFiles.changelog,
      checksums: releaseFiles.checksums,
    },
  };
  const manifestText = stableJson(releaseManifest);
  assertNoLocalAbsolutePath(manifestText, releaseFiles.manifest);
  await writeFile(join(resolvedOutputRoot, releaseFiles.manifest), manifestText, 'utf8');

  const checksumLines = [];
  for (const fileName of hashedFileNames) {
    const bytes = await readFile(join(resolvedOutputRoot, fileName));
    checksumLines.push(`${sha256(bytes)}  ${fileName}`);
  }
  await writeFile(
    join(resolvedOutputRoot, releaseFiles.checksums),
    `${checksumLines.join('\n')}\n`,
    'utf8',
  );

  return {
    outputRoot: resolvedOutputRoot,
    files: [...hashedFileNames, releaseFiles.checksums],
  };
}
