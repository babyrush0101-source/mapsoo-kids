#!/usr/bin/env node

import { stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseMedia } from "@remotion/media-parser";
import { nodeReader } from "@remotion/media-parser/node";

const videoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultOutputPath = resolve(
  videoRoot,
  "..",
  "docs",
  "media",
  "v0.1.0-alpha.1",
  "video",
  "mapsoo-worldsmith-v0.1.0-alpha.1-75s.mp4",
);
const outputPath = process.argv[2] ? resolve(videoRoot, process.argv[2]) : defaultOutputPath;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const metadata = await parseMedia({
  src: outputPath,
  reader: nodeReader,
  acknowledgeRemotionLicense: true,
  fields: {
    container: true,
    dimensions: true,
    durationInSeconds: true,
    fps: true,
    videoCodec: true,
    audioCodec: true,
    size: true,
    slowNumberOfFrames: true,
  },
});

const fileStat = await stat(outputPath);

assert(metadata.container === "mp4", `Expected MP4 container, received ${metadata.container}`);
assert(metadata.videoCodec === "h264", `Expected H.264 video, received ${metadata.videoCodec}`);
assert(metadata.audioCodec === null, `Evidence cut must remain silent, received ${metadata.audioCodec}`);
assert(metadata.dimensions?.width === 1920, `Expected width 1920, received ${metadata.dimensions?.width}`);
assert(metadata.dimensions?.height === 1080, `Expected height 1080, received ${metadata.dimensions?.height}`);
assert(metadata.fps === 30, `Expected 30 fps, received ${metadata.fps}`);
assert(
  Math.abs(metadata.durationInSeconds - 75) <= 1 / 30,
  `Expected 75 seconds, received ${metadata.durationInSeconds}`,
);
assert(metadata.slowNumberOfFrames === 2250, `Expected 2250 frames, received ${metadata.slowNumberOfFrames}`);
assert(metadata.size === fileStat.size, `Parser size ${metadata.size} does not match file size ${fileStat.size}`);
assert(fileStat.size >= 5_000_000, `Rendered MP4 is unexpectedly small: ${fileStat.size} bytes`);

console.log(
  `MAPSOO_RELEASE_VIDEO_OK duration=${metadata.durationInSeconds}s fps=${metadata.fps} ` +
    `dimensions=${metadata.dimensions.width}x${metadata.dimensions.height} frames=${metadata.slowNumberOfFrames} ` +
    `bytes=${fileStat.size}`,
);
