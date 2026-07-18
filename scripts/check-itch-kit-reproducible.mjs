#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ITCH_RELEASE_ROOT, buildItchKit, removeItchOutput, verifyItchKit } from './itch-kit-lib.mjs';
import { comparePortablePaths, listFiles } from './release-lib.mjs';

const reproRoot = join(ITCH_RELEASE_ROOT, '.repro');
const firstRoot = join(reproRoot, 'first');
const secondRoot = join(reproRoot, 'second');

try {
  await removeItchOutput(reproRoot);
  await buildItchKit(firstRoot);
  await buildItchKit(secondRoot);
  await verifyItchKit(firstRoot);
  await verifyItchKit(secondRoot);

  const firstFiles = (await listFiles(firstRoot)).sort((a, b) => comparePortablePaths(a.archivePath, b.archivePath));
  const secondFiles = (await listFiles(secondRoot)).sort((a, b) => comparePortablePaths(a.archivePath, b.archivePath));
  const firstNames = firstFiles.map(({ archivePath }) => archivePath);
  const secondNames = secondFiles.map(({ archivePath }) => archivePath);
  if (JSON.stringify(firstNames) !== JSON.stringify(secondNames)) {
    throw new Error('itch kit reproducibility runs produced different file lists');
  }
  for (let index = 0; index < firstFiles.length; index += 1) {
    const first = await readFile(firstFiles[index].absolutePath);
    const second = await readFile(secondFiles[index].absolutePath);
    if (!first.equals(second)) {
      throw new Error(`itch kit output is not reproducible: ${firstFiles[index].archivePath}`);
    }
  }
  console.log(`MAPSOO_ITCH_KIT_REPRODUCIBLE files=${firstFiles.length}`);
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
} finally {
  await removeItchOutput(reproRoot);
}
