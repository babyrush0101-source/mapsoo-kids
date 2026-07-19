#!/usr/bin/env node

import { lstat, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';

import JSZip from 'jszip';

import { verifyReceiptForRelease } from './receipt-verifier.mjs';
import { REPOSITORY_ROOT, assertPortableRelativePath, sha256 } from './release-lib.mjs';
import { getReleaseConfig } from './release-config.mjs';

const VERSION = '0.1.0-alpha.6';
const config = getReleaseConfig(VERSION);
const sourcePath = join(REPOSITORY_ROOT, 'release', 'browser-captures', config.release.files.examplePack);
const outputDirectory = resolve(REPOSITORY_ROOT, config.release.examplePack.sourceDirectory);
const allowedFixtureRoot = resolve(REPOSITORY_ROOT, 'examples', 'packs');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function assertSafeFixtureOutput() {
  assert(
    dirname(outputDirectory) === allowedFixtureRoot && outputDirectory.startsWith(`${allowedFixtureRoot}${sep}`),
    'Refusing to replace an alpha.6 fixture outside examples/packs/.',
  );
  try {
    const stat = await lstat(outputDirectory);
    assert(!stat.isSymbolicLink(), 'Refusing to replace a symbolic-link fixture directory.');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

async function capture() {
  assert(config.lifecycle === 'candidate', 'Alpha.6 fixture capture is only valid while the release is a candidate.');
  const sourceBytes = await readFile(sourcePath);
  assert(sha256(sourceBytes) === config.expectedExamplePackSha256, 'Alpha.6 browser capture differs from the pinned candidate hash.');
  const zip = await JSZip.loadAsync(sourceBytes, { checkCRC32: true, createFolders: false });
  const allEntries = Object.values(zip.files);
  assert(allEntries.length === 18 && allEntries.every(({ dir }) => !dir), 'Alpha.6 browser ZIP must contain exactly 18 files and no directory entries.');
  const prefix = `${config.release.examplePack.archiveRoot}/`;
  const entries = new Map();
  for (const entry of allEntries) {
    assertPortableRelativePath(entry.name);
    assert(entry.name.startsWith(prefix), `ZIP entry is outside ${prefix}: ${entry.name}`);
    const path = entry.name.slice(prefix.length);
    assertPortableRelativePath(path);
    assert(!entries.has(path), `Duplicate Alpha.6 fixture path: ${path}`);
    entries.set(path, await entry.async('nodebuffer'));
  }
  const expectedPaths = [
    'atlases/places.png', 'atlases/props.png', 'atlases/structures.png', 'atlases/terrain.png',
    'generation-receipt.json', 'license-assets.md', 'mapsoo.manifest.json', 'previews/map-preview.png',
    'readme.md', 'runtime/places.json', 'runtime/structures.json',
    'schema/mapsoo-generation-receipt.schema.json', 'schema/mapsoo-pack-0.4.schema.json',
    'schema/mapsoo-places-0.2.schema.json', 'schema/mapsoo-structures-0.1.schema.json',
    'schema/mapsoo-world-0.3.schema.json', 'worlds/demo-world.json', 'worlds/sunny-meadow.world.json',
  ].sort();
  assert(JSON.stringify([...entries.keys()].sort()) === JSON.stringify(expectedPaths), 'Alpha.6 browser ZIP path contract mismatch.');
  const manifest = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(entries.get('mapsoo.manifest.json')));
  await verifyReceiptForRelease({
    version: VERSION,
    manifest,
    context: 'alpha.6 captured browser pack',
    readPackFile: async (path) => entries.get(path),
  });
  await assertSafeFixtureOutput();
  await rm(outputDirectory, { recursive: true, force: true });
  for (const [path, bytes] of entries) {
    const destination = resolve(outputDirectory, ...path.split('/'));
    assert(destination.startsWith(`${outputDirectory}${sep}`), `Unsafe fixture destination: ${path}`);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, bytes);
  }
  console.log(`MAPSOO_ALPHA6_FIXTURE_CAPTURED ${relative(REPOSITORY_ROOT, outputDirectory)} files=${entries.size} sha256=${sha256(sourceBytes)}`);
}

try {
  await capture();
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}
