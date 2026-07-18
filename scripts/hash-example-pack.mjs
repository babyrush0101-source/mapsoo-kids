#!/usr/bin/env node

import {
  CURRENT_RELEASE_CONFIG,
  buildExamplePackArchive,
  sha256,
} from './release-lib.mjs';

try {
  const bytes = await buildExamplePackArchive(CURRENT_RELEASE_CONFIG.version);
  console.log(
    `MAPSOO_EXAMPLE_PACK_HASH version=${CURRENT_RELEASE_CONFIG.version} bytes=${bytes.length} sha256=${sha256(bytes)}`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}
