#!/usr/bin/env node

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

import {
  HASHED_RELEASE_FILE_NAMES,
  RELEASE_FILES,
  REPOSITORY_ROOT,
  buildRelease,
  sha256,
} from './release-lib.mjs';

const releaseNames = [...HASHED_RELEASE_FILE_NAMES, RELEASE_FILES.checksums];
let temporaryRoot;

try {
  temporaryRoot = await mkdtemp(join(REPOSITORY_ROOT, 'release', '.repro-'));
  const firstRoot = join(temporaryRoot, 'first');
  const secondRoot = join(temporaryRoot, 'second');

  await buildRelease(firstRoot);
  await buildRelease(secondRoot);

  for (const fileName of releaseNames) {
    const firstHash = sha256(await readFile(join(firstRoot, fileName)));
    const secondHash = sha256(await readFile(join(secondRoot, fileName)));
    if (firstHash !== secondHash) {
      throw new Error(`Release output is not reproducible: ${fileName}`);
    }
  }

  console.log(`MAPSOO_RELEASE_REPRODUCIBLE files=${releaseNames.length}`);
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
} finally {
  if (temporaryRoot) {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}
