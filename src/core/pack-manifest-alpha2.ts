import {
  generationReceiptManifestProjection,
  validateGenerationReceipt,
  type GenerationReceipt,
} from './generation-receipt';
import type { GenerationRunResult } from './generation-evidence';
import { assertTrustedGenerationRun } from './generation-provider';
import {
  buildPackManifest,
  type PackFileRecord,
  type PackManifest,
} from './pack-manifest';
import { projectTrustedGenerationReceipt } from './trusted-generation-receipt';

export const ALPHA2_PACK_VERSION = '0.1.0-alpha.2' as const;

export interface BuildAlpha2PackManifestInput {
  readonly run: GenerationRunResult;
  readonly files: PackFileRecord[];
  readonly receiptBytes: Uint8Array;
}

async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function parseReceiptBytes(bytes: Uint8Array): unknown {
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new Error('The alpha.2 receipt payload must be strict UTF-8 JSON.');
  }
}

function structurallyEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((entry, index) => structurallyEqual(entry, right[index]));
  }
  if (
    typeof left !== 'object'
    || left === null
    || typeof right !== 'object'
    || right === null
  ) {
    return false;
  }
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord).sort();
  const rightKeys = Object.keys(rightRecord).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) => (
      key === rightKeys[index]
      && structurallyEqual(leftRecord[key], rightRecord[key])
    ));
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength
    && left.every((byte, index) => byte === right[index]);
}

function snapshotFileRecords(files: readonly PackFileRecord[]): PackFileRecord[] {
  return files.map((file) => ({
    path: file.path,
    media_type: file.media_type,
    bytes: file.bytes,
    sha256: file.sha256,
  }));
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach((child) => deepFreeze(child));
    Object.freeze(value);
  }
  return value;
}

/**
 * Builds the alpha.2 manifest from the already serialized payload records and
 * the validated receipt. Timestamp, World Spec binding, license, and
 * provenance deliberately have a single source of truth: the receipt.
 */
export async function buildAlpha2PackManifest({
  run,
  files,
  receiptBytes,
}: BuildAlpha2PackManifestInput): Promise<PackManifest> {
  assertTrustedGenerationRun(run);
  const receiptSnapshot = Uint8Array.from(receiptBytes);
  const fileSnapshot = snapshotFileRecords(files);
  const base = buildPackManifest(run.world, fileSnapshot, run.evidence.createdAt);
  const receiptRecord = base.files.find(({ path }) => path === base.receipt.path);
  if (
    !receiptRecord
    || receiptRecord.media_type !== 'application/json'
    || receiptRecord.bytes !== receiptSnapshot.byteLength
    || receiptRecord.sha256 !== await sha256Bytes(receiptSnapshot)
  ) {
    throw new Error('The alpha.2 receipt file record does not match the shipped receipt bytes.');
  }
  const parsedReceipt = parseReceiptBytes(receiptSnapshot);
  const expectedProvider = {
    id: run.evidence.provider.id,
    version: run.evidence.provider.version,
    execution: run.evidence.provider.capabilities.execution,
    output_provenance: run.evidence.provider.capabilities.outputProvenance,
  } as const;
  const validationContext = {
    world: run.world,
    inputSpec: base.world_spec,
    createdAt: run.evidence.createdAt,
    provider: expectedProvider,
    outputLicense: {
      id: run.world.spec.output.assetLicense,
      noticePath: 'license-assets.md',
    },
    files: fileSnapshot,
  } as const;
  const issues = validateGenerationReceipt(parsedReceipt, validationContext);
  if (issues.length > 0) {
    throw new Error(`Receipt cannot authorize the alpha.2 manifest: ${issues.map((issue) => issue.code).join(', ')}.`);
  }
  const receipt = parsedReceipt as GenerationReceipt;
  const expectedReceipt = projectTrustedGenerationReceipt(run, base.world_spec);
  if (!structurallyEqual(receipt, expectedReceipt)) {
    throw new Error('The alpha.2 receipt is not an exact projection of the runner-owned evidence.');
  }
  const canonicalReceiptBytes = new TextEncoder().encode(`${JSON.stringify(expectedReceipt, null, 2)}\n`);
  if (!bytesEqual(receiptSnapshot, canonicalReceiptBytes)) {
    throw new Error('The alpha.2 receipt payload is not the canonical receipt serialization.');
  }

  const provenance = generationReceiptManifestProjection(receipt);
  const provenanceIssues = validateGenerationReceipt(receipt, {
    ...validationContext,
    manifestProvenance: provenance,
  });
  if (provenanceIssues.length > 0) {
    throw new Error(
      `Receipt cannot authorize the alpha.2 manifest: ${provenanceIssues.map((issue) => issue.code).join(', ')}.`,
    );
  }
  const outputLicense = receipt.licensing.output;
  if (outputLicense.id !== 'CC0-1.0') {
    throw new Error('The alpha.2 Godot pack schema currently supports only CC0-1.0 assets.');
  }

  return deepFreeze({
    ...base,
    pack: {
      ...base.pack,
      version: ALPHA2_PACK_VERSION,
      generator: {
        name: 'Mapsoo Worldsmith',
        version: ALPHA2_PACK_VERSION,
      },
      created_at: receipt.created_at,
    },
    world_spec: {
      path: receipt.world.input_spec.path,
      sha256: receipt.world.input_spec.sha256,
    },
    license: {
      assets: {
        id: outputLicense.id,
        file: outputLicense.notice_path,
      },
    },
    provenance,
  });
}
