import { describe, expect, it } from 'vitest';
import {
  GenerationProviderError,
  runGenerationProviderWithEvidence,
  snapshotGeneratorProvider,
  type GeneratorProvider,
} from '../core/generation-provider';
import { assertPlayableTerrainExportEvidence } from '../core/playable-terrain-export-policy';
import { DEFAULT_WORLD_SPEC } from '../core/world-spec';
import {
  PROCEDURAL_TERRAIN_CLAIMS,
  PROCEDURAL_TERRAIN_PROVIDER,
} from './procedural-terrain-provider';

describe('procedural terrain provider', () => {
  it('mints trusted, export-authorized procedural evidence', async () => {
    const run = await runGenerationProviderWithEvidence(
      PROCEDURAL_TERRAIN_PROVIDER,
      DEFAULT_WORLD_SPEC,
      { now: () => new Date('2026-07-19T08:00:00.000Z') },
    );

    expect(run.evidence.workflow).toEqual(PROCEDURAL_TERRAIN_CLAIMS.workflow);
    expect(run.evidence.transformations).toEqual(PROCEDURAL_TERRAIN_CLAIMS.transformations);
    expect(run.evidence.aiDisclosure).toEqual({
      containsGenerativeAi: false,
      humanCurated: false,
      statement: null,
    });
    expect(() => assertPlayableTerrainExportEvidence(run, 'not authorized')).not.toThrow();
  });

  it('reserves the built-in alpha.4 identity against lookalike providers', () => {
    const lookalike: GeneratorProvider = {
      ...PROCEDURAL_TERRAIN_PROVIDER,
      capabilities: { ...PROCEDURAL_TERRAIN_PROVIDER.capabilities },
      generate: PROCEDURAL_TERRAIN_PROVIDER.generate,
    };

    expect(() => snapshotGeneratorProvider(lookalike)).toThrowError(GenerationProviderError);
    expect(() => snapshotGeneratorProvider(lookalike)).toThrow(/reserved/);
  });

  it('rejects cancellation before generation', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(runGenerationProviderWithEvidence(
      PROCEDURAL_TERRAIN_PROVIDER,
      DEFAULT_WORLD_SPEC,
      { signal: controller.signal },
    )).rejects.toMatchObject({ code: 'provider.aborted' });
  });
});
