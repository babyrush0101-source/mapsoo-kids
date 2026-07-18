#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  CURRENT_RELEASE_CONFIG,
  HASHED_RELEASE_FILE_NAMES,
  RELEASE_FILES,
  REPOSITORY_ROOT,
  buildRelease,
  assertReleaseBuildAllowed,
  removeSafeOutputDirectory,
  replaceSafeOutputDirectory,
  sha256,
} from './release-lib.mjs';

const releaseNames = [...HASHED_RELEASE_FILE_NAMES, RELEASE_FILES.checksums];
const releaseParent = join(REPOSITORY_ROOT, 'release');
const temporaryRoot = join(releaseParent, '.repro');

try {
  assertReleaseBuildAllowed(CURRENT_RELEASE_CONFIG);
  await replaceSafeOutputDirectory(
    releaseParent,
    temporaryRoot,
    'Refusing to replace release reproducibility output outside release/',
  );
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
  await removeSafeOutputDirectory(
    releaseParent,
    temporaryRoot,
    'Refusing to remove release reproducibility output outside release/',
  );
}
