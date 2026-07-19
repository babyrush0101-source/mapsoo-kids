import type { GeneratorProvider } from '../core/generation-provider';
import { generatePlayableWorld } from '../core/generate-playable-world';
import {
  PROCEDURAL_TERRAIN_GENERATOR_ID,
  PROCEDURAL_TERRAIN_GENERATOR_VERSION,
} from '../core/generator-identity';

export const PROCEDURAL_TERRAIN_CLAIMS = Object.freeze({
  model: null,
  workflow: Object.freeze({
    id: 'mapsoo-playable-terrain-pack',
    version: '0.2.0',
    definition_sha256: null,
  }),
  transformations: Object.freeze([
    Object.freeze({ id: 'seeded-map-layout', version: '0.1.0' }),
    Object.freeze({ id: 'cardinal-terrain-projection', version: '0.2.0' }),
    Object.freeze({ id: 'procedural-pixel-atlas', version: '0.2.0' }),
    Object.freeze({ id: 'png-rgba-export', version: '0.1.0' }),
  ]),
  disclosureStatement: null,
  providerTerms: null,
  sources: Object.freeze([]),
});

export const PROCEDURAL_TERRAIN_PROVIDER = Object.freeze({
  id: PROCEDURAL_TERRAIN_GENERATOR_ID,
  version: PROCEDURAL_TERRAIN_GENERATOR_VERSION,
  displayName: 'Mapsoo Procedural Terrain',
  capabilities: Object.freeze({
    execution: 'local',
    determinism: 'seeded',
    requiresCredentials: false,
    outputProvenance: 'procedural',
    supportedStyles: Object.freeze(['pixel-art'] as const),
    supportedBiomes: Object.freeze(['meadow', 'desert', 'snow'] as const),
    supportedTileSizes: Object.freeze([16, 32, 64] as const),
    maxMapSize: Object.freeze({ width: 48, height: 32 }),
    supportsAbort: false,
    supportsPartialRegeneration: false,
  }),
  async generate(spec, options = {}) {
    if (options.signal?.aborted) {
      throw new Error('Procedural terrain generation was aborted.');
    }
    return {
      world: generatePlayableWorld(spec),
      claims: PROCEDURAL_TERRAIN_CLAIMS,
    };
  },
} satisfies GeneratorProvider);
