#!/usr/bin/env node

import { listPublishedReleaseConfigs } from './release-lib.mjs';

const REPOSITORY = 'babyrush0101-source/mapsoo-kids';

function requestHeaders() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'mapsoo-release-history-verifier',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function verify() {
  const configs = listPublishedReleaseConfigs();
  assert(configs.length > 0, 'No published release config is registered.');
  let assetCount = 0;

  for (const config of configs) {
    const response = await fetch(
      `https://api.github.com/repos/${REPOSITORY}/releases/tags/${encodeURIComponent(config.tag)}`,
      {
        headers: requestHeaders(),
      },
    );
    assert(response.ok, `${config.tag} GitHub release lookup failed: HTTP ${response.status}`);
    const release = await response.json();
    assert(release.tag_name === config.tag, `${config.tag} GitHub tag changed`);
    assert(release.draft === false, `${config.tag} public release unexpectedly became a draft`);
    assert(release.prerelease === true, `${config.tag} must remain a prerelease`);

    const assets = new Map();
    for (const asset of release.assets ?? []) {
      assert(typeof asset.name === 'string' && !assets.has(asset.name), `${config.tag} has duplicate release asset names`);
      assets.set(asset.name, asset);
    }
    const expectedNames = Object.keys(config.publicReleaseAssetSha256).sort();
    assert(
      JSON.stringify([...assets.keys()].sort()) === JSON.stringify(expectedNames),
      `${config.tag} GitHub release asset list differs from the immutable registry`,
    );

    for (const name of expectedNames) {
      const asset = assets.get(name);
      const expectedDigest = `sha256:${config.publicReleaseAssetSha256[name]}`;
      assert(asset.state === 'uploaded', `${config.tag} asset is not uploaded: ${name}`);
      assert(Number.isSafeInteger(asset.size) && asset.size > 0, `${config.tag} asset is empty: ${name}`);
      assert(asset.digest === expectedDigest, `${config.tag} GitHub digest changed: ${name}`);
      assetCount += 1;
    }
  }

  console.log(`MAPSOO_PUBLIC_RELEASE_ASSETS_OK releases=${configs.length} assets=${assetCount}`);
}

try {
  await verify();
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}
