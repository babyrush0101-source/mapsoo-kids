import {
  GenerationProviderError,
  snapshotGeneratorProvider,
  type GeneratorCapabilities,
  type GeneratorProvider,
} from '../core/generation-provider';
import { PROCEDURAL_PIXEL_PROVIDER } from './procedural-pixel-provider';

export interface GeneratorProviderSummary {
  readonly id: string;
  readonly version: string;
  readonly displayName: string;
  readonly capabilities: GeneratorCapabilities;
}

export class GeneratorProviderRegistry {
  private readonly providers = new Map<string, GeneratorProvider>();

  constructor(providers: readonly GeneratorProvider[]) {
    for (const provider of providers) {
      const snapshot = snapshotGeneratorProvider(provider);
      if (this.providers.has(snapshot.id)) {
        throw new GenerationProviderError(
          'provider.invalid-metadata',
          `Duplicate provider ID: ${snapshot.id}.`,
        );
      }
      this.providers.set(snapshot.id, snapshot);
    }
  }

  get(id: string): GeneratorProvider | undefined {
    return this.providers.get(id);
  }

  require(id: string): GeneratorProvider {
    const provider = this.get(id);
    if (!provider) {
      throw new GenerationProviderError('provider.not-found', `Unknown generation provider: ${id}.`);
    }
    return provider;
  }

  list(): readonly GeneratorProviderSummary[] {
    return Object.freeze(Array.from(this.providers.values(), (provider) => Object.freeze({
      id: provider.id,
      version: provider.version,
      displayName: provider.displayName,
      capabilities: provider.capabilities,
    })));
  }
}

export const DEFAULT_GENERATION_PROVIDER_ID = PROCEDURAL_PIXEL_PROVIDER.id;
export const GENERATION_PROVIDER_REGISTRY = new GeneratorProviderRegistry([PROCEDURAL_PIXEL_PROVIDER]);
export const DEFAULT_GENERATION_PROVIDER = GENERATION_PROVIDER_REGISTRY.require(DEFAULT_GENERATION_PROVIDER_ID);
