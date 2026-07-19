import {
  PROCEDURAL_TERRAIN_GENERATOR_ID,
  PROCEDURAL_TERRAIN_GENERATOR_VERSION,
} from './generator-identity';
import { generateWorld } from './generate-world';
import { createSeededRandom } from './seeded-random';
import type { GeneratedWorld, PropKind, WorldSpec } from './world-spec';

export const PLAYABLE_PROP_KINDS = Object.freeze([
  'tree',
  'rock',
  'flower',
  'shrub',
  'log',
  'marker',
] as const satisfies readonly PropKind[]);

/**
 * Preserves the published v1 semantic map and prop positions while assigning
 * the richer alpha.4 prop vocabulary under a new provider identity. Keeping
 * this as a separate projection prevents alpha.1-alpha.3 fixture drift.
 */
export function generatePlayableWorld(spec: WorldSpec): GeneratedWorld {
  const legacyWorld = generateWorld(spec);
  const propRandom = createSeededRandom(
    `${spec.schemaVersion}:${spec.seed}:${spec.map.biome}:playable-props-v2`,
  );

  return {
    ...legacyWorld,
    generator: {
      id: PROCEDURAL_TERRAIN_GENERATOR_ID,
      version: PROCEDURAL_TERRAIN_GENERATOR_VERSION,
    },
    props: legacyWorld.props.map((prop) => {
      const kind = PLAYABLE_PROP_KINDS[Math.floor(propRandom() * PLAYABLE_PROP_KINDS.length)];
      return {
        ...prop,
        id: `${kind}-${prop.x}-${prop.y}`,
        kind,
      };
    }),
  };
}
