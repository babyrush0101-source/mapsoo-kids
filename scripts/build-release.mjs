#!/usr/bin/env node

import { buildRelease } from './release-lib.mjs';

try {
  const result = await buildRelease();
  console.log(`MAPSOO_RELEASE_BUILT ${result.outputRoot}`);
  for (const file of result.files) {
    console.log(`  ${file}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}
