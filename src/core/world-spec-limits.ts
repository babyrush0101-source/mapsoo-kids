export const MAX_WORLD_SPEC_FILE_BYTES = 128 * 1024;
export const MAX_WORLD_SPEC_JSON_DEPTH = 32;
export const MAX_WORLD_SPEC_JSON_NODES = 10_000;

export const FORBIDDEN_WORLD_SPEC_OBJECT_KEYS = new Set([
  '__proto__',
  'constructor',
  'prototype',
]);
