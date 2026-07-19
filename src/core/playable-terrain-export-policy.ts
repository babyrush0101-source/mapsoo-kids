import type { GenerationRunResult } from './generation-evidence';
import { assertPlayableTerrainGenerator } from './generator-identity';
import { PROCEDURAL_TERRAIN_CLAIMS } from '../providers/procedural-terrain-provider';

function exactJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function assertPlayableTerrainExportEvidence(
  run: GenerationRunResult,
  errorMessage: string,
): void {
  const { world, evidence } = run;
  assertPlayableTerrainGenerator(world.generator);
  assertPlayableTerrainGenerator(evidence.provider);
  const capabilities = evidence.provider.capabilities;
  if (
    evidence.requestSpec !== world.spec
    || world.spec.output.assetLicense !== 'CC0-1.0'
    || capabilities.execution !== 'local'
    || capabilities.determinism !== 'seeded'
    || capabilities.requiresCredentials
    || capabilities.outputProvenance !== 'procedural'
    || evidence.aiDisclosure.containsGenerativeAi
    || evidence.aiDisclosure.humanCurated
    || evidence.aiDisclosure.statement !== null
    || evidence.model !== null
    || evidence.providerTerms !== null
    || evidence.sources.length !== 0
    || !exactJson(evidence.workflow, PROCEDURAL_TERRAIN_CLAIMS.workflow)
    || !exactJson(evidence.transformations, PROCEDURAL_TERRAIN_CLAIMS.transformations)
  ) {
    throw new Error(errorMessage);
  }
}
