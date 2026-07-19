export interface GeneratorIdentity {
  id: string;
  version: string;
}

export const PROCEDURAL_PIXEL_GENERATOR_ID = 'procedural-pixel-v1';
export const PROCEDURAL_PIXEL_GENERATOR_VERSION = '0.1.0';
export const PROCEDURAL_TERRAIN_GENERATOR_ID = 'procedural-terrain-v2';
export const PROCEDURAL_TERRAIN_GENERATOR_VERSION = '0.2.0';

const GENERATOR_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const SEMANTIC_VERSION = /^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

export function isValidGeneratorId(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 80 && GENERATOR_ID.test(value);
}

export function isValidGeneratorVersion(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 80) return false;
  const match = SEMANTIC_VERSION.exec(value);
  if (!match) return false;
  const prerelease = match[1];
  return prerelease === undefined || prerelease
    .split('.')
    .every((identifier) => !/^\d+$/.test(identifier) || identifier === '0' || !identifier.startsWith('0'));
}

export function assertV01ProceduralGenerator(identity: unknown): asserts identity is GeneratorIdentity {
  if (
    typeof identity !== 'object'
    || identity === null
    || !('id' in identity)
    || !('version' in identity)
    || identity.id !== PROCEDURAL_PIXEL_GENERATOR_ID
    || identity.version !== PROCEDURAL_PIXEL_GENERATOR_VERSION
  ) {
    throw new Error(
      `v0.1 portable export supports only ${PROCEDURAL_PIXEL_GENERATOR_ID}@${PROCEDURAL_PIXEL_GENERATOR_VERSION}.`,
    );
  }
}

export function assertPlayableTerrainGenerator(identity: unknown): asserts identity is GeneratorIdentity {
  if (
    typeof identity !== 'object'
    || identity === null
    || !('id' in identity)
    || !('version' in identity)
    || identity.id !== PROCEDURAL_TERRAIN_GENERATOR_ID
    || identity.version !== PROCEDURAL_TERRAIN_GENERATOR_VERSION
  ) {
    throw new Error(
      `Playable terrain export supports only ${PROCEDURAL_TERRAIN_GENERATOR_ID}@${PROCEDURAL_TERRAIN_GENERATOR_VERSION}.`,
    );
  }
}
