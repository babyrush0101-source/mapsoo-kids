#!/usr/bin/env node

import {
  CURRENT_RELEASE_CONFIG,
  assertReleaseBuildAllowed,
} from './release-config.mjs';

try {
  const operation = process.argv[2] ?? 'read';
  if (operation === 'build') assertReleaseBuildAllowed(CURRENT_RELEASE_CONFIG);
  if (!['read', 'build'].includes(operation)) {
    throw new Error(`Unknown release preflight operation: ${operation}`);
  }
  console.log(
    `MAPSOO_RELEASE_VERSION_OK version=${CURRENT_RELEASE_CONFIG.version} lifecycle=${CURRENT_RELEASE_CONFIG.lifecycle} operation=${operation}`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}
