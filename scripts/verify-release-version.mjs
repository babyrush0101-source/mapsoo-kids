#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  CURRENT_RELEASE_CONFIG,
  assertReleaseBuildAllowed,
  getReleaseConfig,
} from './release-config.mjs';
import { REPOSITORY_ROOT } from './release-lib.mjs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readText(...parts) {
  return readFile(join(REPOSITORY_ROOT, ...parts), 'utf8');
}

try {
  const operation = process.argv[2] ?? 'read';
  if (operation === 'build') assertReleaseBuildAllowed(CURRENT_RELEASE_CONFIG);
  if (!['read', 'build'].includes(operation)) {
    throw new Error(`Unknown release preflight operation: ${operation}`);
  }
  const packageJson = JSON.parse(await readText('package.json'));
  assert(packageJson.version === CURRENT_RELEASE_CONFIG.version, 'package.json version differs from the current release registry');
  assert(CURRENT_RELEASE_CONFIG.tag === `v${CURRENT_RELEASE_CONFIG.version}`, 'release tag/version binding mismatch');

  const plugin = await readText('godot', 'addons', 'mapsoo_importer', 'plugin.cfg');
  const importer = await readText('godot', 'addons', 'mapsoo_importer', 'mapsoo_pack_importer.gd');
  assert(plugin.match(/^version="([^"]+)"$/m)?.[1] === CURRENT_RELEASE_CONFIG.version, 'plugin.cfg version differs from the candidate');
  assert(importer.match(/^const IMPORTER_VERSION := "([^"]+)"$/m)?.[1] === CURRENT_RELEASE_CONFIG.version, 'IMPORTER_VERSION differs from the candidate');
  assert(!plugin.includes('-dev') && !importer.includes('-dev'), 'release importer versions must not contain -dev');

  if (CURRENT_RELEASE_CONFIG.lifecycle === 'candidate') {
    assert(/^[a-f0-9]{64}$/.test(CURRENT_RELEASE_CONFIG.expectedExamplePackSha256 ?? ''), 'candidate example pack hash is not pinned');
    assert(CURRENT_RELEASE_CONFIG.publicExamplePackSha256 === null, 'candidate must not claim a public example-pack hash');
    assert(CURRENT_RELEASE_CONFIG.publicReleaseAssetSha256 === null, 'candidate must not claim public release asset hashes');
  }

  const publicReleaseSource = await readText('src', 'app', 'current-public-release.ts');
  const publicVersion = publicReleaseSource.match(/CURRENT_PUBLIC_RELEASE_VERSION = '([^']+)'/)?.[1];
  assert(publicVersion, 'current public release ledger does not declare a version');
  assert(getReleaseConfig(publicVersion).lifecycle === 'published', 'current public release must point to a published registry entry');
  console.log(
    `MAPSOO_RELEASE_VERSION_OK version=${CURRENT_RELEASE_CONFIG.version} lifecycle=${CURRENT_RELEASE_CONFIG.lifecycle} operation=${operation}`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}
