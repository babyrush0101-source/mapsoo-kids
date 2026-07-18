#!/usr/bin/env node

import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

import { CURRENT_RELEASE_CONFIG, REPOSITORY_ROOT } from './release-lib.mjs';

const visualRoot = join(REPOSITORY_ROOT, CURRENT_RELEASE_CONFIG.itch.visualDirectory);
const rendererPath = join(REPOSITORY_ROOT, CURRENT_RELEASE_CONFIG.itch.renderer);

const expectedVisuals = new Map(
  CURRENT_RELEASE_CONFIG.itch.visuals.map(({ name, width, height }) => [name, [width, height]]),
);

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function verifyPng(fileName, expectedWidth, expectedHeight) {
  const path = join(visualRoot, fileName);
  const fileStat = await stat(path);
  assert(fileStat.isFile(), `Release visual is not a file: ${fileName}`);
  assert(fileStat.size >= 100_000, `Release visual is unexpectedly small: ${fileName}`);

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
  for (const [fileName, [width, height]] of expectedVisuals) {
    await verifyPng(fileName, width, height);
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
