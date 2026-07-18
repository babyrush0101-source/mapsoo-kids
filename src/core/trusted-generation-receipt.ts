import {
  GENERATION_RECEIPT_SCHEMA_VERSION,
  validateGenerationReceipt,
  type GenerationReceipt,
  type GenerationReceiptSource,
} from './generation-receipt';
import type { GenerationRunResult } from './generation-evidence';
import { assertTrustedGenerationRun } from './generation-provider';

export interface TrustedGenerationReceiptInputSpec {
  readonly path: string;
  readonly sha256: string;
}

function cloneSource(source: GenerationReceiptSource): GenerationReceiptSource {
  return {
    id: source.id,
    kind: source.kind,
    sha256: source.sha256,
    ...(source.path === undefined ? {} : { path: source.path }),
    ...(source.uri === undefined ? {} : { uri: source.uri }),
    license: {
      id: source.license.id,
      url: source.license.url,
      attribution: source.license.attribution,
    },
  };
}

/**
 * Projects a runner-minted, immutable generation result into the public 0.2
 * receipt contract. The function intentionally copies only declared evidence
 * fields so provider responses, credentials, prompts, and extension data can
 * never leak into an exported pack through object spreading.
 */
export function projectTrustedGenerationReceipt(
  run: GenerationRunResult,
  inputSpec: TrustedGenerationReceiptInputSpec,
  noticePath = 'license-assets.md',
): GenerationReceipt {
  assertTrustedGenerationRun(run);
  const { world, evidence } = run;

  if (evidence.requestSpec !== world.spec) {
    throw new Error('Trusted generation evidence no longer references the generated World Spec.');
  }

  const provider = {
    id: evidence.provider.id,
    version: evidence.provider.version,
    execution: evidence.provider.capabilities.execution,
    output_provenance: evidence.provider.capabilities.outputProvenance,
  } as const;
  const receipt: GenerationReceipt = {
    schema_version: GENERATION_RECEIPT_SCHEMA_VERSION,
    created_at: evidence.createdAt,
    world: {
      id: world.spec.id,
      input_spec: {
        path: inputSpec.path,
        sha256: inputSpec.sha256,
      },
      seed: world.spec.seed,
    },
    provider,
    model: evidence.model === null
      ? null
      : {
          provider: evidence.model.provider,
          id: evidence.model.id,
          revision: evidence.model.revision,
        },
    workflow: {
      id: evidence.workflow.id,
      version: evidence.workflow.version,
      definition_sha256: evidence.workflow.definition_sha256,
    },
    transformations: evidence.transformations.map((transformation) => ({
      id: transformation.id,
      version: transformation.version,
    })),
    ai_disclosure: {
      contains_generative_ai: evidence.aiDisclosure.containsGenerativeAi,
      human_curated: evidence.aiDisclosure.humanCurated,
      statement: evidence.aiDisclosure.statement,
    },
    licensing: {
      output: {
        id: world.spec.output.assetLicense,
        notice_path: noticePath,
      },
      provider_terms: evidence.providerTerms === null
        ? null
        : {
            url: evidence.providerTerms.url,
            version: evidence.providerTerms.version,
          },
    },
    sources: evidence.sources.map(cloneSource),
  };

  const issues = validateGenerationReceipt(receipt, {
    world,
    inputSpec,
    createdAt: evidence.createdAt,
    provider,
    outputLicense: {
      id: world.spec.output.assetLicense,
      noticePath,
    },
  });
  if (issues.length > 0) {
    throw new Error(`Invalid trusted generation receipt: ${issues.map((issue) => issue.code).join(', ')}.`);
  }
  return receipt;
}
