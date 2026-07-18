#!/usr/bin/env node

import { verifyItchKit } from './itch-kit-lib.mjs';

try {
  const result = await verifyItchKit(process.argv[2]);
  console.log(`MAPSOO_ITCH_KIT_OK files=${result.files.length} pack_sha256=${result.packHash}`);
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}
