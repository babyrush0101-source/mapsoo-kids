import { fingerprintGenerationRequestV2, type GenerationRequestV2 } from './generation-request-v2';
import {
  assertTrustedWorldAssetGeneration,
  type WorldAssetGenerationResult,
} from './world-asset-provider';

export const WORLD_ASSET_RECEIPT_SCHEMA_VERSION = '0.1.0' as const;

export interface WorldAssetReceipt {
  readonly schema_version: typeof WORLD_ASSET_RECEIPT_SCHEMA_VERSION;
  readonly completed_at: string;
  readonly request: {
    readonly fingerprint_sha256: string;
    readonly profile: 'topdown-farm';
    readonly seed: string;
    readonly reference_rights: readonly {
      readonly role: 'environment-style' | 'character';
      readonly basis: 'owned';
      readonly license: 'LicenseRef-User-Owned';
      readonly permits_cc0_dedication: true;
    }[];
  };
  readonly provider: {
    readonly id: string;
    readonly version: string;
    readonly execution: 'local' | 'remote';
    readonly determinism: 'seeded' | 'best-effort' | 'replay';
    readonly output_provenance: 'procedural' | 'generative-ai' | 'recorded-replay';
  };
  readonly output: {
    readonly completeness_policy: 'topdown-farm-complete-v1';
    readonly license: 'CC0-1.0';
    readonly files: readonly { readonly path: string; readonly bytes: number; readonly sha256: string }[];
  };
  readonly disclosures: readonly string[];
}

function canonicalTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf()) || date.toISOString() !== value) {
    throw new Error('World asset receipt requires a canonical UTC ISO timestamp.');
  }
  return value;
}

/**
 * Projects a public receipt. Raw reference paths, raw image digests, the world
 * description and reference attribution text are used only inside the one-way
 * request fingerprint and never appear as receipt fields.
 */
export async function projectWorldAssetReceipt(
  run: WorldAssetGenerationResult,
  request: GenerationRequestV2,
  completedAt: string,
): Promise<WorldAssetReceipt> {
  assertTrustedWorldAssetGeneration(run);
  if (request.id !== run.requestId || request.profile !== run.bundle.profile) {
    throw new Error('World asset receipt request does not match the trusted run.');
  }
  if (run.provider.capabilities.outputProvenance !== 'procedural') {
    throw new Error('Alpha.9 portable export currently accepts only locally generated procedural assets.');
  }
  if (request.references.some(({ rights }) => (
    rights.basis !== 'owned'
    || rights.license !== 'LicenseRef-User-Owned'
    || rights.allowGenerativeAdaptation !== true
    || rights.allowOutputRedistribution !== true
    || rights.allowOutputCc0Dedication !== true
  ))) {
    throw new Error('Alpha.9 CC0 receipt requires user-owned references with explicit adaptation, redistribution, and CC0 dedication permission.');
  }
  const fingerprint = await fingerprintGenerationRequestV2(request);
  if (fingerprint !== run.requestFingerprintSha256) {
    throw new Error('World asset receipt request fingerprint does not match the trusted run.');
  }
  return Object.freeze({
    schema_version: WORLD_ASSET_RECEIPT_SCHEMA_VERSION,
    completed_at: canonicalTimestamp(completedAt),
    request: Object.freeze({
      fingerprint_sha256: fingerprint,
      profile: 'topdown-farm' as const,
      seed: request.seed,
      reference_rights: Object.freeze(request.references.map((reference) => Object.freeze({
        role: reference.role,
        basis: 'owned' as const,
        license: 'LicenseRef-User-Owned' as const,
        permits_cc0_dedication: true as const,
      }))),
    }),
    provider: Object.freeze({
      id: run.provider.id,
      version: run.provider.version,
      execution: run.provider.capabilities.execution,
      determinism: run.provider.capabilities.determinism,
      output_provenance: run.provider.capabilities.outputProvenance,
    }),
    output: Object.freeze({
      completeness_policy: 'topdown-farm-complete-v1' as const,
      license: 'CC0-1.0' as const,
      files: Object.freeze(run.bundle.assets.map((asset) => Object.freeze({
        path: asset.path,
        bytes: asset.bytes,
        sha256: asset.sha256,
      })).sort((left, right) => left.path.localeCompare(right.path, 'en'))),
    }),
    disclosures: Object.freeze([
      'Reference images are not embedded in this pack.',
      'Reference paths, original image digests, attribution text, and the source description are omitted from public fields.',
      'The request fingerprint is a one-way binding for local audit comparison.',
    ]),
  });
}
