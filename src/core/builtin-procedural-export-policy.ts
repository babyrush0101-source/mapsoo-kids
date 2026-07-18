import type { GenerationRunResult } from './generation-evidence';
import { assertV01ProceduralGenerator } from './generator-identity';

const BUILTIN_WORKFLOW = {
  id: 'mapsoo-procedural-world-pack',
  version: '0.1.0',
  definition_sha256: null,
} as const;
const BUILTIN_TRANSFORMATIONS = [
  { id: 'seeded-map-layout', version: '0.1.0' },
  { id: 'procedural-pixel-atlas', version: '0.1.0' },
  { id: 'png-rgba-export', version: '0.1.0' },
] as const;

function exactJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * Current portable packs are a deliberately narrow publication surface. A
 * complete receipt contract does not by itself authorize third-party or AI
 * output to inherit the built-in CC0 policy.
 */
export function assertBuiltinProceduralExportEvidence(
  run: GenerationRunResult,
  errorMessage: string,
): void {
  const { world, evidence } = run;
  assertV01ProceduralGenerator(world.generator);
  assertV01ProceduralGenerator(evidence.provider);
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
    || !exactJson(evidence.workflow, BUILTIN_WORKFLOW)
    || !exactJson(evidence.transformations, BUILTIN_TRANSFORMATIONS)
  ) {
    throw new Error(errorMessage);
  }
}
