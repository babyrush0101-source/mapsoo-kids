#!/usr/bin/env node

import { buildItchKit } from './itch-kit-lib.mjs';

try {
  const result = await buildItchKit(process.argv[2]);
  console.log(`MAPSOO_ITCH_KIT_BUILT ${result.outputRoot}`);
  for (const file of result.files) {
    console.log(`  ${file}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}
