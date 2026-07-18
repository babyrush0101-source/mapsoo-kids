import { createHash } from 'node:crypto';
import { readFile, readdir, rm, mkdir, writeFile, lstat } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import JSZip from 'jszip';

export const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const PACKAGE_JSON_PATH = join(REPOSITORY_ROOT, 'package.json');

const packageJson = JSON.parse(await readFile(PACKAGE_JSON_PATH, 'utf8'));

export const VERSION = packageJson.version;
export const RELEASE_TAG = `v${VERSION}`;
export const DEFAULT_RELEASE_ROOT = join(REPOSITORY_ROOT, 'release', RELEASE_TAG);
export const ZIP_DATE = new Date(Date.UTC(1980, 0, 1, 0, 0, 0, 0));

export function comparePortablePaths(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export const RELEASE_FILES = Object.freeze({
  web: `mapsoo-worldsmith-web-${RELEASE_TAG}.zip`,
  godotImporter: `mapsoo-godot-importer-${RELEASE_TAG}.zip`,
  examplePack: `mapsoo-sunny-meadow-${RELEASE_TAG}.zip`,
  evidenceVideo: `mapsoo-worldsmith-${RELEASE_TAG}-75s.mp4`,
  exampleWorldSpec: `sunny-meadow-${RELEASE_TAG}.world.json`,
  worldSchema: `mapsoo-world.schema-${RELEASE_TAG}.json`,
  packSchema: `mapsoo-pack.schema-${RELEASE_TAG}.json`,
  license: 'LICENSE',
  changelog: 'CHANGELOG.md',
  manifest: 'release-manifest.json',
  checksums: 'SHA256SUMS',
});

export const HASHED_RELEASE_FILE_NAMES = Object.freeze(
  Object.values(RELEASE_FILES)
    .filter((name) => name !== RELEASE_FILES.checksums)
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

export async function buildRelease(outputRoot = DEFAULT_RELEASE_ROOT) {
  if (!VERSION || VERSION !== '0.1.0-alpha.1') {
    throw new Error(`This release pipeline targets 0.1.0-alpha.1; package.json reports ${VERSION}`);
  }

  const resolvedOutputRoot = resolve(outputRoot);
  const releaseParent = resolve(REPOSITORY_ROOT, 'release');
  const relativeOutput = relative(releaseParent, resolvedOutputRoot);
  if (!relativeOutput || relativeOutput.startsWith('..') || relativeOutput.includes(`..${sep}`)) {
    throw new Error(`Refusing to replace output outside release/: ${resolvedOutputRoot}`);
  }

  await rm(resolvedOutputRoot, { recursive: true, force: true });
  await mkdir(resolvedOutputRoot, { recursive: true });

  const distRoot = join(REPOSITORY_ROOT, 'dist');
  const webFiles = await listFiles(distRoot);
  if (!webFiles.some((entry) => entry.archivePath === 'index.html')) {
    throw new Error('dist/index.html is missing; run the web build first');
  }
  const webZipEntries = webFiles.map((entry) => ({
    ...entry,
    archivePath: `mapsoo-worldsmith-web-${RELEASE_TAG}/${entry.archivePath}`,
  }));
  await writeFile(
    join(resolvedOutputRoot, RELEASE_FILES.web),
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
    join(resolvedOutputRoot, RELEASE_FILES.godotImporter),
    await createDeterministicZip(importerZipEntries),
  );

  const examplePackRootName = `mapsoo-sunny-meadow-${RELEASE_TAG}`;
  const examplePackRoot = join(
    REPOSITORY_ROOT,
    'examples',
    'packs',
    `sunny-meadow-${RELEASE_TAG}`,
  );
  const examplePackFiles = await listFiles(examplePackRoot);
  const examplePackZipEntries = examplePackFiles.map((entry) => ({
    ...entry,
    archivePath: `${examplePackRootName}/${entry.archivePath}`,
  }));
  await writeFile(
    join(resolvedOutputRoot, RELEASE_FILES.examplePack),
    await createDeterministicZip(examplePackZipEntries),
  );

  const copiedFiles = [
    [join(REPOSITORY_ROOT, 'examples', 'sunny-meadow.world.json'), RELEASE_FILES.exampleWorldSpec],
    [join(REPOSITORY_ROOT, 'schemas', 'mapsoo-world.schema.json'), RELEASE_FILES.worldSchema],
    [join(REPOSITORY_ROOT, 'schemas', 'mapsoo-pack.schema.json'), RELEASE_FILES.packSchema],
    [join(REPOSITORY_ROOT, 'LICENSE'), RELEASE_FILES.license],
    [join(REPOSITORY_ROOT, 'CHANGELOG.md'), RELEASE_FILES.changelog],
    [
      join(
        REPOSITORY_ROOT,
        'docs',
        'media',
        RELEASE_TAG,
        'video',
        `mapsoo-worldsmith-${RELEASE_TAG}-75s.mp4`,
      ),
      RELEASE_FILES.evidenceVideo,
    ],
  ];

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
    version: VERSION,
    releaseTag: RELEASE_TAG,
    artifacts: {
      web: {
        file: RELEASE_FILES.web,
        purpose: 'Static web generator build',
      },
      godotImporter: {
        file: RELEASE_FILES.godotImporter,
        purpose: 'Godot 4.3+ editor plugin; extract into a Godot project root',
      },
      examplePack: {
        file: RELEASE_FILES.examplePack,
        purpose: 'Executable-free Sunny Meadow PNG + JSON pack verified in Godot 4.3 and 4.7',
      },
      evidenceVideo: {
        file: RELEASE_FILES.evidenceVideo,
        purpose: 'Silent bilingual 75-second H.264 evidence cut for the verified release candidate',
      },
      exampleWorldSpec: {
        file: RELEASE_FILES.exampleWorldSpec,
        purpose: 'Versioned Sunny Meadow input example',
      },
      schemas: [RELEASE_FILES.worldSchema, RELEASE_FILES.packSchema],
      license: RELEASE_FILES.license,
      changelog: RELEASE_FILES.changelog,
      checksums: RELEASE_FILES.checksums,
    },
  };
  const manifestText = stableJson(releaseManifest);
  assertNoLocalAbsolutePath(manifestText, RELEASE_FILES.manifest);
  await writeFile(join(resolvedOutputRoot, RELEASE_FILES.manifest), manifestText, 'utf8');

  const checksumLines = [];
  for (const fileName of HASHED_RELEASE_FILE_NAMES) {
    const bytes = await readFile(join(resolvedOutputRoot, fileName));
    checksumLines.push(`${sha256(bytes)}  ${fileName}`);
  }
  await writeFile(
    join(resolvedOutputRoot, RELEASE_FILES.checksums),
    `${checksumLines.join('\n')}\n`,
    'utf8',
  );

  return {
    outputRoot: resolvedOutputRoot,
    files: [...HASHED_RELEASE_FILE_NAMES, RELEASE_FILES.checksums],
  };
}
