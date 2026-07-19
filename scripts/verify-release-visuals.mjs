#!/usr/bin/env node

import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

import {
  CURRENT_RELEASE_CONFIG,
  REPOSITORY_ROOT,
  getReleaseConfig,
  sha256,
} from './release-lib.mjs';

const visualRoot = join(REPOSITORY_ROOT, CURRENT_RELEASE_CONFIG.itch.visualDirectory);
const rendererPath = join(REPOSITORY_ROOT, CURRENT_RELEASE_CONFIG.itch.renderer);

const expectedVisuals = new Map(
  CURRENT_RELEASE_CONFIG.itch.visuals.map(({ name, width, height, minBytes }) => [
    name,
    { width, height, minBytes },
  ]),
);

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function verifyPng(fileName, { width: expectedWidth, height: expectedHeight, minBytes }) {
  const path = join(visualRoot, fileName);
  const fileStat = await stat(path);
  assert(fileStat.isFile(), `Release visual is not a file: ${fileName}`);
  assert(
    fileStat.size >= minBytes,
    `Release visual is unexpectedly small: ${fileName} (${fileStat.size} < ${minBytes})`,
  );

  const bytes = await readFile(path);
  assert(bytes.subarray(0, 8).equals(pngSignature), `Invalid PNG signature: ${fileName}`);
  assert(bytes.subarray(12, 16).toString('ascii') === 'IHDR', `Missing PNG IHDR: ${fileName}`);

  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  assert(
    width === expectedWidth && height === expectedHeight,
    `${fileName} is ${width}x${height}; expected ${expectedWidth}x${expectedHeight}`,
  );
}

async function verify() {
  for (const [fileName, visual] of expectedVisuals) {
    await verifyPng(fileName, visual);
  }

  if (CURRENT_RELEASE_CONFIG.version === '0.1.0-alpha.2') {
    const alpha1VisualRoot = join(
      REPOSITORY_ROOT,
      getReleaseConfig('0.1.0-alpha.1').itch.visualDirectory,
    );
    for (const fileName of expectedVisuals.keys()) {
      const [alpha1Bytes, alpha2Bytes] = await Promise.all([
        readFile(join(alpha1VisualRoot, fileName)),
        readFile(join(visualRoot, fileName)),
      ]);
      assert(
        sha256(alpha1Bytes) !== sha256(alpha2Bytes),
        `alpha.2 release visual must not reuse alpha.1 bytes: ${fileName}`,
      );
    }
  }

  const renderer = await readFile(rendererPath, 'utf8');
  assert(
    !/(?:src|href)=["']https?:\/\//i.test(renderer),
    'Release visual renderer must not load remote images, scripts, styles, or fonts',
  );

  for (const frame of CURRENT_RELEASE_CONFIG.itch.rendererFrames) {
    const matches = renderer.match(new RegExp(`data-frame=["']${frame}["']`, 'g')) ?? [];
    assert(matches.length === 1, `Renderer must contain exactly one ${frame} frame`);
  }

  for (const requiredText of CURRENT_RELEASE_CONFIG.itch.requiredRendererFacts) {
    assert(renderer.includes(requiredText), `Renderer is missing required release fact: ${requiredText}`);
  }

  console.log(`MAPSOO_RELEASE_VISUALS_OK files=${expectedVisuals.size}`);
}

try {
  await verify();
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}
