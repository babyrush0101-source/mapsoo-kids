#!/usr/bin/env node

import { readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const videoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(videoRoot, "..");
const publicRoot = resolve(repositoryRoot, "docs", "media", "v0.1.0-alpha.1", "itch");
const captionsPath = resolve(publicRoot, "captions-75s.json");
const compositionPath = resolve(videoRoot, "src", "Composition.tsx");
const configPath = resolve(videoRoot, "remotion.config.ts");

const expectedRanges = [
  [0, 6000],
  [6000, 17000],
  [17000, 28000],
  [28000, 38000],
  [38000, 49000],
  [49000, 58000],
  [58000, 69000],
  [69000, 75000],
];

const expectedImages = [
  "01-generated-pack-1600x900.png",
  "02-workbench-1600x900.png",
  "03-pack-contents-1600x900.png",
  "04-godot-verification-1600x900.png",
  "05-open-contract-1600x900.png",
  "cover-1260x1000.png",
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const captionsText = await readFile(captionsPath, "utf8");
const captions = JSON.parse(captionsText);
assert(Array.isArray(captions), "Captions must be a JSON array");
assert(captions.length === expectedRanges.length, `Expected 8 captions, received ${captions.length}`);

for (const [index, caption] of captions.entries()) {
  const [expectedStart, expectedEnd] = expectedRanges[index];
  assert(caption.startMs === expectedStart, `Caption ${index + 1} start mismatch`);
  assert(caption.endMs === expectedEnd, `Caption ${index + 1} end mismatch`);
  assert(caption.timestampMs === null, `Caption ${index + 1} timestamp must be null`);
  assert(caption.confidence === null, `Caption ${index + 1} confidence must be null`);
  const lines = typeof caption.text === "string" ? caption.text.split("\n") : [];
  assert(lines.length === 2, `Caption ${index + 1} must have exactly one Chinese and one English line`);
  assert(lines.every((line) => line.trim().length >= 12), `Caption ${index + 1} contains an empty/short line`);
}

assert(!captionsText.includes("[REPLACE:"), "Captions must not contain release placeholders");
assert(!/https?:\/\//i.test(captionsText), "Captions must not contain unpublished or remote URLs");

const composition = await readFile(compositionPath, "utf8");
const config = await readFile(configPath, "utf8");
assert(composition.includes("durationInFrames={75 * fps}"), "Composition must remain exactly 75 seconds");
assert(composition.includes("const fps = 30"), "Composition must remain at 30 fps");
assert(composition.includes("width={1920}"), "Composition width must remain 1920");
assert(composition.includes("height={1080}"), "Composition height must remain 1080");
assert(composition.includes("SAME CANDIDATE PACK VERIFIED"), "Godot evidence must remain candidate-scoped");
assert(
  config.includes('Config.setPublicDir("../docs/media/v0.1.0-alpha.1/itch")'),
  "Remotion public directory must remain pinned to the verified release visuals",
);

for (const imageName of expectedImages) {
  assert(composition.includes(`"${imageName}"`), `Composition does not reference ${imageName}`);
  const imageStat = await stat(resolve(publicRoot, imageName));
  assert(imageStat.isFile() && imageStat.size >= 100_000, `Missing or unexpectedly small visual: ${imageName}`);
}

assert(!/(?:src|href)=["']https?:\/\//i.test(composition), "Composition must not load remote media");

console.log(`MAPSOO_RELEASE_VIDEO_SOURCE_OK captions=${captions.length} visuals=${expectedImages.length}`);
