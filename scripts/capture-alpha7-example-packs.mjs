#!/usr/bin/env node

import { lstat, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import JSZip from 'jszip';

import { verifyReceiptForRelease } from './receipt-verifier.mjs';
import { CURRENT_RELEASE_CONFIG, REPOSITORY_ROOT } from './release-config.mjs';
import { assertPortableRelativePath, examplePacksForConfig, sha256 } from './release-lib.mjs';

const captureRoot = resolve(REPOSITORY_ROOT, 'release', 'browser-captures');
const fixtureRoot = resolve(REPOSITORY_ROOT, 'examples', 'packs');

function assert(condition, message) { if (!condition) throw new Error(message); }

async function capturePack(descriptor) {
  const fileName = CURRENT_RELEASE_CONFIG.release.files[descriptor.releaseFileKey];
  const source = resolve(captureRoot, fileName);
  const output = resolve(REPOSITORY_ROOT, descriptor.sourceDirectory);
  assert(dirname(output) === fixtureRoot && output.startsWith(`${fixtureRoot}${sep}`), `Unsafe fixture path for ${descriptor.id}.`);
  try { assert(!(await lstat(output)).isSymbolicLink(), `Fixture path is a link: ${output}`); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
  const bytes = await readFile(source);
  const hash = sha256(bytes);
  assert(hash === descriptor.expectedSha256, `${descriptor.id} capture differs from its pinned candidate hash.`);
  const zip = await JSZip.loadAsync(bytes, { checkCRC32: true, createFolders: false });
  const zipEntries = Object.values(zip.files);
  assert(zipEntries.length === 18 && zipEntries.every(({ dir }) => !dir), `${descriptor.id} ZIP must contain exactly 18 files.`);
  const prefix = `${descriptor.archiveRoot}/`;
  const entries = new Map();
  for (const entry of zipEntries) {
    assertPortableRelativePath(entry.name);
    assert(entry.name.startsWith(prefix), `${descriptor.id} entry escapes its archive root: ${entry.name}`);
    const path = entry.name.slice(prefix.length);
    assertPortableRelativePath(path);
    assert(!entries.has(path), `Duplicate ${descriptor.id} fixture path: ${path}`);
    entries.set(path, await entry.async('nodebuffer'));
  }
  const expectedPaths = [
    'atlases/places.png', 'atlases/props.png', 'atlases/structures.png', 'atlases/terrain.png',
    'generation-receipt.json', 'license-assets.md', 'mapsoo.manifest.json', 'previews/map-preview.png',
    'readme.md', 'runtime/places.json', 'runtime/structures.json',
    'schema/mapsoo-generation-receipt.schema.json', 'schema/mapsoo-pack-0.5.schema.json',
    'schema/mapsoo-places-0.3.schema.json', 'schema/mapsoo-structures-0.2.schema.json',
    'schema/mapsoo-world-0.3.schema.json', 'worlds/demo-world.json', descriptor.worldSpecPackPath,
  ].sort();
  assert(JSON.stringify([...entries.keys()].sort()) === JSON.stringify(expectedPaths), `${descriptor.id} fixture path contract mismatch.`);
  const manifest = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(entries.get('mapsoo.manifest.json')));
  await verifyReceiptForRelease({
    version: CURRENT_RELEASE_CONFIG.version,
    manifest,
    context: `${descriptor.id} Alpha.7 captured browser pack`,
    readPackFile: async (path) => entries.get(path),
  });
  await rm(output, { recursive: true, force: true });
  for (const [path, entryBytes] of entries) {
    const destination = resolve(output, ...path.split('/'));
    assert(destination.startsWith(`${output}${sep}`), `Unsafe ${descriptor.id} fixture destination.`);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, entryBytes);
  }
  return `${descriptor.id}:files=${entries.size}:sha256=${hash}`;
}

async function capture() {
  assert(CURRENT_RELEASE_CONFIG.version === '0.1.0-alpha.7' && CURRENT_RELEASE_CONFIG.lifecycle === 'candidate', 'Alpha.7 fixture capture requires the active candidate config.');
  const packs = examplePacksForConfig();
  assert(packs.length === 3, 'Alpha.7 fixture capture requires exactly three registered packs.');
  const results = [];
  for (const pack of packs) results.push(await capturePack(pack));
  console.log(`MAPSOO_ALPHA7_FIXTURES_CAPTURED ${results.join(' ')}`);
}

try { await capture(); } catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}
