import type { GenerationRequestV2 } from './generation-request-v2';
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
      readonly basis: 'owned' | 'licensed' | 'public-domain';
      readonly license: string;
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

function canonical(value: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(value));
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes.slice().buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
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
  const fingerprint = await sha256(canonical({
    schemaVersion: request.schemaVersion,
    id: request.id,
    profile: request.profile,
    description: request.description,
    seed: request.seed,
    references: request.references.map((reference) => ({
      role: reference.role,
      sha256: reference.sha256,
      rights: reference.rights,
    })),
  }));
  return Object.freeze({
    schema_version: WORLD_ASSET_RECEIPT_SCHEMA_VERSION,
    completed_at: canonicalTimestamp(completedAt),
    request: Object.freeze({
      fingerprint_sha256: fingerprint,
      profile: 'topdown-farm' as const,
      seed: request.seed,
      reference_rights: Object.freeze(request.references.map((reference) => Object.freeze({
        role: reference.role,
        basis: reference.rights.basis,
        license: reference.rights.license,
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
