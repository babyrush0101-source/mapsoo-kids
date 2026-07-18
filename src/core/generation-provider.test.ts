import { describe, expect, it, vi } from 'vitest';
import { generateWorld } from './generate-world';
import {
  GenerationProviderError,
  runGenerationProvider,
  type GeneratorCapabilities,
  type GeneratorProvider,
} from './generation-provider';
import { cloneWorldSpec, DEFAULT_WORLD_SPEC, type GeneratedWorld, type WorldSpec } from './world-spec';
import { PROCEDURAL_PIXEL_PROVIDER } from '../providers/procedural-pixel-provider';
import {
  isValidGeneratorVersion,
  PROCEDURAL_PIXEL_GENERATOR_ID,
  PROCEDURAL_PIXEL_GENERATOR_VERSION,
} from './generator-identity';
import {
  DEFAULT_GENERATION_PROVIDER,
  GENERATION_PROVIDER_REGISTRY,
  GeneratorProviderRegistry,
} from '../providers/provider-registry';

function capabilities(overrides: Partial<GeneratorCapabilities> = {}): GeneratorCapabilities {
  return {
    execution: 'local',
    determinism: 'seeded',
    requiresCredentials: false,
    outputProvenance: 'procedural',
    supportedStyles: ['pixel-art'],
    supportedBiomes: ['meadow', 'desert', 'snow'],
    supportedTileSizes: [16, 32, 64],
    maxMapSize: { width: 48, height: 32 },
    supportsAbort: true,
    supportsPartialRegeneration: false,
    ...overrides,
  };
}

function identify(world: GeneratedWorld, provider: GeneratorProvider): GeneratedWorld {
  return { ...world, generator: { id: provider.id, version: provider.version } };
}

function fakeProvider(
  generate: GeneratorProvider['generate'],
  overrides: Partial<GeneratorProvider> = {},
): GeneratorProvider {
  return {
    id: 'test-provider',
    version: '1.0.0',
    displayName: 'Test Provider',
    capabilities: capabilities(),
    generate,
    ...overrides,
  };
}

describe('generation provider contract', () => {
  it('registers the local procedural provider with explicit capabilities', () => {
    expect(DEFAULT_GENERATION_PROVIDER).not.toBe(PROCEDURAL_PIXEL_PROVIDER);
    expect(DEFAULT_GENERATION_PROVIDER).toMatchObject({
      id: PROCEDURAL_PIXEL_PROVIDER.id,
      version: PROCEDURAL_PIXEL_PROVIDER.version,
    });
    expect(Object.isFrozen(DEFAULT_GENERATION_PROVIDER)).toBe(true);
    const summaries = GENERATION_PROVIDER_REGISTRY.list();
    expect(summaries).toEqual([
      expect.objectContaining({
        id: 'procedural-pixel-v1',
        version: '0.1.0',
        capabilities: expect.objectContaining({
          execution: 'local',
          determinism: 'seeded',
          requiresCredentials: false,
          outputProvenance: 'procedural',
          supportsAbort: false,
          supportsPartialRegeneration: false,
        }),
      }),
    ]);
    expect(Object.isFrozen(summaries)).toBe(true);
    expect(Object.isFrozen(summaries[0].capabilities)).toBe(true);
  });

  it('runs the procedural provider without changing v0.1 output', async () => {
    const result = await runGenerationProvider(PROCEDURAL_PIXEL_PROVIDER, DEFAULT_WORLD_SPEC);

    expect(result).toEqual(generateWorld(DEFAULT_WORLD_SPEC));
    expect(result.spec).not.toBe(DEFAULT_WORLD_SPEC);
  });

  it('validates the World Spec and provider capabilities before generation', async () => {
    const generate = vi.fn(async (spec: WorldSpec) => generateWorld(spec));
    const desertOnly = fakeProvider(generate, {
      capabilities: capabilities({ supportedBiomes: ['desert'] }),
    });

    await expect(runGenerationProvider(desertOnly, DEFAULT_WORLD_SPEC)).rejects.toMatchObject({
      code: 'provider.unsupported-spec',
    });
    expect(generate).not.toHaveBeenCalled();

    const invalid = cloneWorldSpec(DEFAULT_WORLD_SPEC);
    invalid.map.width = 99;
    await expect(runGenerationProvider(desertOnly, invalid)).rejects.toMatchObject({
      code: 'provider.invalid-spec',
    });
    expect(generate).not.toHaveBeenCalled();
  });

  it('passes an independent spec clone to providers', async () => {
    const input = cloneWorldSpec(DEFAULT_WORLD_SPEC);
    let providerSawIndependentInput = false;
    const provider = fakeProvider(async (spec) => {
      spec.title = 'Provider-local mutation';
      providerSawIndependentInput = input.title === DEFAULT_WORLD_SPEC.title;
      return identify(generateWorld(input), provider);
    });

    const result = await runGenerationProvider(provider, input);

    expect(providerSawIndependentInput).toBe(true);
    expect(input.title).toBe(DEFAULT_WORLD_SPEC.title);
    expect(result.spec.title).toBe(DEFAULT_WORLD_SPEC.title);
  });

  it('rejects invalid provider output and identity mismatches', async () => {
    const invalidOutput = fakeProvider(async (spec) => {
      const world = identify(generateWorld(spec), invalidOutput);
      return { ...world, ground: [] };
    });
    await expect(runGenerationProvider(invalidOutput, DEFAULT_WORLD_SPEC)).rejects.toMatchObject({
      code: 'provider.invalid-output',
    });

    const sparseGround = fakeProvider(async (spec) => {
      const world = identify(generateWorld(spec), sparseGround);
      return { ...world, ground: new Array(world.spec.map.width * world.spec.map.height) };
    });
    await expect(runGenerationProvider(sparseGround, DEFAULT_WORLD_SPEC)).rejects.toMatchObject({
      code: 'provider.invalid-output',
    });

    const invalidTiles = fakeProvider(async (spec) => {
      const world = identify(generateWorld(spec), invalidTiles);
      return {
        ...world,
        tiles: [{ id: 0 }] as unknown as GeneratedWorld['tiles'],
        ground: world.ground.map(() => 0),
      };
    });
    await expect(runGenerationProvider(invalidTiles, DEFAULT_WORLD_SPEC)).rejects.toMatchObject({
      code: 'provider.invalid-output',
    });

    const invalidProps = fakeProvider(async (spec) => {
      const world = identify(generateWorld(spec), invalidProps);
      return {
        ...world,
        props: [{ x: 0, y: 0 }] as unknown as GeneratedWorld['props'],
      };
    });
    await expect(runGenerationProvider(invalidProps, DEFAULT_WORLD_SPEC)).rejects.toMatchObject({
      code: 'provider.invalid-output',
    });

    const hostileOutput = fakeProvider(async () => new Proxy({} as GeneratedWorld, {
      get(target, property, receiver) {
        if (property === 'spec') throw new Error('hostile output getter');
        return Reflect.get(target, property, receiver);
      },
    }));
    await expect(runGenerationProvider(hostileOutput, DEFAULT_WORLD_SPEC)).rejects.toMatchObject({
      code: 'provider.invalid-output',
    });

    const wrongIdentity = fakeProvider(async (spec) => generateWorld(spec));
    await expect(runGenerationProvider(wrongIdentity, DEFAULT_WORLD_SPEC)).rejects.toMatchObject({
      code: 'provider.identity-mismatch',
    });

    const changedSpec = fakeProvider(async (spec) => {
      spec.title = 'Changed by provider';
      return identify(generateWorld(spec), changedSpec);
    });
    await expect(runGenerationProvider(changedSpec, DEFAULT_WORLD_SPEC)).rejects.toMatchObject({
      code: 'provider.spec-mismatch',
    });
  });

  it('honors abort signals before and after provider execution', async () => {
    const beforeController = new AbortController();
    beforeController.abort();
    const beforeGenerate = vi.fn(async (spec: WorldSpec) => generateWorld(spec));
    const beforeProvider = fakeProvider(beforeGenerate);

    await expect(
      runGenerationProvider(beforeProvider, DEFAULT_WORLD_SPEC, { signal: beforeController.signal }),
    ).rejects.toMatchObject({ code: 'provider.aborted' });
    expect(beforeGenerate).not.toHaveBeenCalled();

    const afterController = new AbortController();
    const afterProvider = fakeProvider(async (spec) => {
      afterController.abort();
      return identify(generateWorld(spec), afterProvider);
    });
    await expect(
      runGenerationProvider(afterProvider, DEFAULT_WORLD_SPEC, { signal: afterController.signal }),
    ).rejects.toMatchObject({ code: 'provider.aborted' });
  });

  it('snapshots provider identity, capabilities, and requested spec before awaiting', async () => {
    let releaseGeneration: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      releaseGeneration = resolve;
    });
    const input = cloneWorldSpec(DEFAULT_WORLD_SPEC);
    const mutable = fakeProvider(async (spec) => {
      await gate;
      return identify(generateWorld(spec), mutable);
    });

    const resultPromise = runGenerationProvider(mutable, input);
    (mutable as { id: string }).id = PROCEDURAL_PIXEL_GENERATOR_ID;
    (mutable as { version: string }).version = PROCEDURAL_PIXEL_GENERATOR_VERSION;
    (mutable.capabilities as { supportedBiomes: GeneratorCapabilities['supportedBiomes'] }).supportedBiomes = ['desert'];
    input.title = 'Concurrent caller mutation';
    releaseGeneration?.();

    await expect(resultPromise).rejects.toMatchObject({ code: 'provider.identity-mismatch' });

    const stableProvider = fakeProvider(async (spec) => identify(generateWorld(spec), stableProvider), {
      id: 'stable-provider',
    });
    let releaseStable: (() => void) | undefined;
    const stableGate = new Promise<void>((resolve) => {
      releaseStable = resolve;
    });
    (stableProvider as { generate: GeneratorProvider['generate'] }).generate = async (spec) => {
      await stableGate;
      return identify(generateWorld(spec), stableProvider);
    };
    const stableInput = cloneWorldSpec(DEFAULT_WORLD_SPEC);
    const stableResultPromise = runGenerationProvider(stableProvider, stableInput);
    stableInput.title = 'Changed after invocation';
    releaseStable?.();
    await expect(stableResultPromise).resolves.toMatchObject({
      spec: { title: DEFAULT_WORLD_SPEC.title },
    });
  });

  it('wraps vendor failures and rejects non-JSON extension values with stable errors', async () => {
    const vendorFailure = new Error('vendor secret detail');
    const failingProvider = fakeProvider(async () => {
      throw vendorFailure;
    });
    await expect(runGenerationProvider(failingProvider, DEFAULT_WORLD_SPEC)).rejects.toMatchObject({
      code: 'provider.execution-failed',
      cause: vendorFailure,
    });

    const cyclic = cloneWorldSpec(DEFAULT_WORLD_SPEC);
    const extension: Record<string, unknown> = {};
    extension.self = extension;
    cyclic.extensions = { 'dev.stoyo': extension };
    await expect(runGenerationProvider(failingProvider, cyclic)).rejects.toMatchObject({
      code: 'provider.invalid-spec',
    });

    const withFunction = cloneWorldSpec(DEFAULT_WORLD_SPEC);
    withFunction.extensions = { 'dev.stoyo': { callback: () => undefined } };
    await expect(runGenerationProvider(failingProvider, withFunction)).rejects.toMatchObject({
      code: 'provider.invalid-spec',
    });
  });

  it('accepts SemVer build metadata and rejects malformed prerelease identifiers', () => {
    expect(isValidGeneratorVersion('1.2.3-alpha.1+build.7')).toBe(true);
    expect(isValidGeneratorVersion('1.0.0-..')).toBe(false);
    expect(isValidGeneratorVersion('1.0.0-01')).toBe(false);
  });

  it('rejects invalid, duplicate, and unknown provider registrations', () => {
    const provider = fakeProvider(async (spec) => identify(generateWorld(spec), provider));
    expect(() => new GeneratorProviderRegistry([provider, provider])).toThrowError(GenerationProviderError);

    const invalid = fakeProvider(async (spec) => generateWorld(spec), { id: '../unsafe' });
    expect(() => new GeneratorProviderRegistry([invalid])).toThrowError(GenerationProviderError);
    expect(() => new GeneratorProviderRegistry([null as unknown as GeneratorProvider])).toThrowError(
      GenerationProviderError,
    );

    const incomplete = fakeProvider(async (spec) => generateWorld(spec), {
      capabilities: {
        ...capabilities(),
        supportedBiomes: undefined,
        maxMapSize: undefined,
      } as unknown as GeneratorCapabilities,
    });
    expect(() => new GeneratorProviderRegistry([incomplete])).toThrowError(GenerationProviderError);

    const registry = new GeneratorProviderRegistry([provider]);
    (provider as { id: string }).id = 'mutated-after-registration';
    expect(registry.require('test-provider').id).toBe('test-provider');
    expect(() => registry.require('missing-provider')).toThrowError(GenerationProviderError);
    try {
      registry.require('missing-provider');
    } catch (error) {
      expect(error).toMatchObject({ code: 'provider.not-found' });
    }

    const aiImpersonator = fakeProvider(async (spec) => generateWorld(spec), {
      id: PROCEDURAL_PIXEL_GENERATOR_ID,
      version: PROCEDURAL_PIXEL_GENERATOR_VERSION,
      capabilities: capabilities({ outputProvenance: 'generative-ai' }),
    });
    expect(() => new GeneratorProviderRegistry([aiImpersonator])).toThrowError(GenerationProviderError);
  });
});
