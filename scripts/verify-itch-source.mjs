#!/usr/bin/env node

import { verifyItchSource } from './itch-kit-lib.mjs';

try {
  const result = await verifyItchSource();
  console.log(`MAPSOO_ITCH_SOURCE_OK files=${result.files.length} visuals=${result.visuals}`);
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}
