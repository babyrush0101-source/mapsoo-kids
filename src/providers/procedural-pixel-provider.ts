import {
  GenerationProviderError,
  type GeneratorProvider,
} from '../core/generation-provider';
import { generateWorld } from '../core/generate-world';
import {
  PROCEDURAL_PIXEL_GENERATOR_ID,
  PROCEDURAL_PIXEL_GENERATOR_VERSION,
} from '../core/generator-identity';

export const PROCEDURAL_PIXEL_PROVIDER = Object.freeze({
  id: PROCEDURAL_PIXEL_GENERATOR_ID,
  version: PROCEDURAL_PIXEL_GENERATOR_VERSION,
  displayName: 'Mapsoo Procedural Pixel',
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
      throw new GenerationProviderError('provider.aborted', 'Procedural generation was aborted.');
    }
    return generateWorld(spec);
  },
} satisfies GeneratorProvider);
