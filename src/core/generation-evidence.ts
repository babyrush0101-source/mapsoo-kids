import {
  GENERATION_RECEIPT_SCHEMA_VERSION,
  inspectGenerationReceiptJsonContract,
  validateGenerationReceipt,
  type GenerationReceipt,
  type GenerationReceiptModel,
  type GenerationReceiptProvider,
  type GenerationReceiptSource,
  type GenerationReceiptTransformation,
  type GenerationReceiptWorkflow,
} from './generation-receipt';
import type { GeneratorCapabilities } from './generation-provider';
import {
  cloneWorldSpec,
  type GeneratedWorld,
  type WorldSpec,
} from './world-spec';
import { validateGeneratedWorld, validateWorldSpec } from './validate-world';
import {
  MAX_WORLD_SPEC_FILE_BYTES,
  MAX_WORLD_SPEC_JSON_DEPTH,
  MAX_WORLD_SPEC_JSON_NODES,
} from './world-spec-limits';

export const GENERATION_EVIDENCE_SCHEMA_VERSION = '0.1.0' as const;

export interface ProviderGenerationClaims {
  readonly model: GenerationReceiptModel | null;
  readonly workflow: GenerationReceiptWorkflow;
  readonly transformations: readonly GenerationReceiptTransformation[];
  readonly disclosureStatement: string | null;
  readonly providerTerms: GenerationReceipt['licensing']['provider_terms'];
  readonly sources: readonly GenerationReceiptSource[];
}

export interface ProviderGenerationOutput {
  readonly world: GeneratedWorld;
  readonly claims: ProviderGenerationClaims;
}

export interface GeneratorProviderSnapshot {
  readonly id: string;
  readonly version: string;
  readonly displayName: string;
  readonly capabilities: GeneratorCapabilities;
}

export interface GenerationEvidenceEnvelope {
  readonly schemaVersion: typeof GENERATION_EVIDENCE_SCHEMA_VERSION;
  readonly createdAt: string;
  readonly requestSpec: WorldSpec;
  readonly provider: GeneratorProviderSnapshot;
  readonly model: GenerationReceiptModel | null;
  readonly workflow: GenerationReceiptWorkflow;
  readonly transformations: readonly GenerationReceiptTransformation[];
  readonly aiDisclosure: {
    readonly containsGenerativeAi: boolean;
    readonly humanCurated: false;
    readonly statement: string | null;
  };
  readonly providerTerms: GenerationReceipt['licensing']['provider_terms'];
  readonly sources: readonly GenerationReceiptSource[];
}

export interface GenerationRunResult {
  readonly world: GeneratedWorld;
  readonly evidence: GenerationEvidenceEnvelope;
}

interface CreateGenerationRunInput {
  readonly world: GeneratedWorld;
  readonly requestSpec: WorldSpec;
  readonly provider: GeneratorProviderSnapshot;
  readonly claims: ProviderGenerationClaims;
  readonly createdAt: string;
}

const ZERO_SHA256 = '0'.repeat(64);
const MAX_CLAIM_NODES = 4_096;
const MAX_CLAIM_DEPTH = 16;
const MAX_CLAIM_STRING_UNITS = 256 * 1024;
const CLAIM_KEYS = [
  'model',
  'workflow',
  'transformations',
  'disclosureStatement',
  'providerTerms',
  'sources',
] as const;

export class GenerationEvidenceError extends Error {
  constructor(readonly codes: readonly string[]) {
    super(`Generation evidence validation failed: ${codes.join(', ')}.`);
    this.name = 'GenerationEvidenceError';
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertExactKeys(value: unknown, expected: readonly string[], code: string): asserts value is Record<string, unknown> {
  if (!isPlainRecord(value)) throw new GenerationEvidenceError([code]);
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  if (
    Object.getOwnPropertySymbols(value).length > 0
    || actual.length !== sortedExpected.length
    || actual.some((key, index) => key !== sortedExpected[index])
    || actual.some((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return !descriptor || !descriptor.enumerable || !('value' in descriptor);
    })
  ) {
    throw new GenerationEvidenceError([code]);
  }
}

interface JsonSnapshotState {
  nodes: number;
  stringUnits: number;
  readonly maxNodes: number;
  readonly maxDepth: number;
  readonly maxStringUnits: number;
  readonly ancestors: WeakSet<object>;
}

function snapshotJsonData(value: unknown, depth: number, state: JsonSnapshotState): unknown {
  state.nodes += 1;
  if (state.nodes > state.maxNodes) throw new GenerationEvidenceError(['receipt.too-complex']);
  if (depth > state.maxDepth) throw new GenerationEvidenceError(['receipt.too-deep']);

  if (typeof value === 'string') {
    state.stringUnits += value.length + 2;
    if (state.stringUnits > state.maxStringUnits) {
      throw new GenerationEvidenceError(['receipt.too-large']);
    }
    return value;
  }
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value))) {
      throw new GenerationEvidenceError(['receipt.non-json-value']);
    }
    return value;
  }
  if (typeof value !== 'object') throw new GenerationEvidenceError(['receipt.non-json-value']);

  const source = value as object;
  if (state.ancestors.has(source)) throw new GenerationEvidenceError(['receipt.circular-json']);
  if (Object.getOwnPropertySymbols(source).length > 0) {
    throw new GenerationEvidenceError(['receipt.non-json-value']);
  }

  state.ancestors.add(source);
  try {
    if (Array.isArray(source)) {
      if (Object.getPrototypeOf(source) !== Array.prototype) {
        throw new GenerationEvidenceError(['receipt.non-json-value']);
      }
      const lengthDescriptor = Object.getOwnPropertyDescriptor(source, 'length');
      const length = lengthDescriptor && 'value' in lengthDescriptor ? lengthDescriptor.value : -1;
      if (!Number.isSafeInteger(length) || length < 0 || state.nodes + length > state.maxNodes) {
        throw new GenerationEvidenceError(['receipt.too-complex']);
      }
      const names = Object.getOwnPropertyNames(source);
      if (names.length !== length + 1 || names.some((key) => key !== 'length' && !/^(0|[1-9][0-9]*)$/.test(key))) {
        throw new GenerationEvidenceError(['receipt.non-json-value']);
      }
      const result: unknown[] = [];
      for (let index = 0; index < length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(source, `${index}`);
        if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
          throw new GenerationEvidenceError(['receipt.non-json-value']);
        }
        result.push(snapshotJsonData(descriptor.value, depth + 1, state));
      }
      return result;
    }

    const prototype = Object.getPrototypeOf(source);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new GenerationEvidenceError(['receipt.non-json-value']);
    }
    const names = Object.getOwnPropertyNames(source);
    if (state.nodes + names.length > state.maxNodes) {
      throw new GenerationEvidenceError(['receipt.too-complex']);
    }
    const result: Record<string, unknown> = {};
    for (const key of names) {
      state.stringUnits += key.length + 3;
      if (state.stringUnits > state.maxStringUnits) {
        throw new GenerationEvidenceError(['receipt.too-large']);
      }
      const descriptor = Object.getOwnPropertyDescriptor(source, key);
      if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
        throw new GenerationEvidenceError(['receipt.non-json-value']);
      }
      Object.defineProperty(result, key, {
        value: snapshotJsonData(descriptor.value, depth + 1, state),
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
    return result;
  } finally {
    state.ancestors.delete(source);
  }
}

function structurallyEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) => structurallyEqual(value, right[index]));
  }
  if (!isPlainRecord(left) || !isPlainRecord(right)) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) => key === rightKeys[index] && structurallyEqual(left[key], right[key]));
}

function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (typeof value !== 'object' || value === null || seen.has(value)) return value;
  seen.add(value);
  for (const key of Object.getOwnPropertyNames(value)) {
    deepFreeze((value as Record<string, unknown>)[key], seen);
  }
  return Object.freeze(value);
}

function dataRecord(value: unknown, code: string): Record<string, unknown> {
  if (!isPlainRecord(value) || Object.getOwnPropertySymbols(value).length > 0) {
    throw new GenerationEvidenceError([code]);
  }
  return value;
}

function dataProperty(record: Record<string, unknown>, key: string, code: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
    throw new GenerationEvidenceError([code]);
  }
  return descriptor.value;
}

function dataArray(value: unknown, maximumLength: number, code: string): unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new GenerationEvidenceError([code]);
  }
  if (Object.getOwnPropertySymbols(value).length > 0) throw new GenerationEvidenceError([code]);
  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
  const length = lengthDescriptor && 'value' in lengthDescriptor ? lengthDescriptor.value : -1;
  if (!Number.isSafeInteger(length) || length < 0 || length > maximumLength) {
    throw new GenerationEvidenceError([code]);
  }
  const names = Object.getOwnPropertyNames(value);
  if (names.length !== length + 1 || names.some((key) => key !== 'length' && !/^(0|[1-9][0-9]*)$/.test(key))) {
    throw new GenerationEvidenceError([code]);
  }
  const result: unknown[] = [];
  for (let index = 0; index < length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, `${index}`);
    if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
      throw new GenerationEvidenceError([code]);
    }
    result.push(descriptor.value);
  }
  return result;
}

export function materializeGeneratedWorld(worldInput: unknown, requestSpec: WorldSpec): GeneratedWorld {
  const requestSnapshot = cloneWorldSpec(requestSpec);
  const root = dataRecord(worldInput, 'evidence.world-shape');
  const generator = dataRecord(dataProperty(root, 'generator', 'evidence.world-shape'), 'evidence.generator-shape');
  let providerSpec: unknown;
  try {
    providerSpec = snapshotJsonData(dataProperty(root, 'spec', 'evidence.world-shape'), 0, {
      nodes: 0,
      stringUnits: 0,
      maxNodes: MAX_WORLD_SPEC_JSON_NODES,
      maxDepth: MAX_WORLD_SPEC_JSON_DEPTH,
      maxStringUnits: MAX_WORLD_SPEC_FILE_BYTES,
      ancestors: new WeakSet<object>(),
    });
  } catch (error) {
    if (error instanceof GenerationEvidenceError) throw error;
    throw new GenerationEvidenceError(['evidence.world-spec-json']);
  }
  const tiles = dataArray(dataProperty(root, 'tiles', 'evidence.world-shape'), 64, 'evidence.tiles-shape');
  const expectedCells = requestSnapshot.map.width * requestSnapshot.map.height;
  const ground = dataArray(
    dataProperty(root, 'ground', 'evidence.world-shape'),
    expectedCells,
    'evidence.ground-shape',
  );
  const props = dataArray(
    dataProperty(root, 'props', 'evidence.world-shape'),
    expectedCells,
    'evidence.props-shape',
  );
  const snapshot: GeneratedWorld = {
    generator: {
      id: dataProperty(generator, 'id', 'evidence.generator-shape') as string,
      version: dataProperty(generator, 'version', 'evidence.generator-shape') as string,
    },
    spec: requestSnapshot,
    tiles: tiles.map((value) => {
      const tile = dataRecord(value, 'evidence.tile-shape');
      return {
        id: dataProperty(tile, 'id', 'evidence.tile-shape') as number,
        name: dataProperty(tile, 'name', 'evidence.tile-shape') as GeneratedWorld['tiles'][number]['name'],
        color: dataProperty(tile, 'color', 'evidence.tile-shape') as string,
        accent: dataProperty(tile, 'accent', 'evidence.tile-shape') as string,
        walkable: dataProperty(tile, 'walkable', 'evidence.tile-shape') as boolean,
      };
    }),
    ground: ground.map((cell) => cell as number),
    props: props.map((value) => {
      const prop = dataRecord(value, 'evidence.prop-shape');
      return {
        id: dataProperty(prop, 'id', 'evidence.prop-shape') as string,
        kind: dataProperty(prop, 'kind', 'evidence.prop-shape') as GeneratedWorld['props'][number]['kind'],
        x: dataProperty(prop, 'x', 'evidence.prop-shape') as number,
        y: dataProperty(prop, 'y', 'evidence.prop-shape') as number,
      };
    }),
  };

  const matchesRequest = structurallyEqual(providerSpec, requestSnapshot);
  const issues = [
    ...validateWorldSpec(requestSnapshot),
    ...validateGeneratedWorld(snapshot),
  ].filter((issue) => issue.severity === 'error');
  if (issues.length > 0 || !matchesRequest) {
    throw new GenerationEvidenceError([
      ...issues.map((issue) => issue.code),
      ...(!matchesRequest ? ['evidence.spec-mismatch'] : []),
    ]);
  }
  return snapshot;
}

function snapshotProvider(provider: GeneratorProviderSnapshot): GeneratorProviderSnapshot {
  return {
    id: provider.id,
    version: provider.version,
    displayName: provider.displayName,
    capabilities: {
      execution: provider.capabilities.execution,
      determinism: provider.capabilities.determinism,
      requiresCredentials: provider.capabilities.requiresCredentials,
      outputProvenance: provider.capabilities.outputProvenance,
      supportedStyles: [...provider.capabilities.supportedStyles],
      supportedBiomes: [...provider.capabilities.supportedBiomes],
      supportedTileSizes: [...provider.capabilities.supportedTileSizes],
      maxMapSize: {
        width: provider.capabilities.maxMapSize.width,
        height: provider.capabilities.maxMapSize.height,
      },
      supportsAbort: provider.capabilities.supportsAbort,
      supportsPartialRegeneration: provider.capabilities.supportsPartialRegeneration,
    },
  };
}

function snapshotClaims(claims: ProviderGenerationClaims): ProviderGenerationClaims {
  let snapshot: unknown;
  try {
    snapshot = snapshotJsonData(claims, 0, {
      nodes: 0,
      stringUnits: 0,
      maxNodes: MAX_CLAIM_NODES,
      maxDepth: MAX_CLAIM_DEPTH,
      maxStringUnits: MAX_CLAIM_STRING_UNITS,
      ancestors: new WeakSet<object>(),
    });
  } catch (error) {
    if (error instanceof GenerationEvidenceError) throw error;
    throw new GenerationEvidenceError(['evidence.claims-json']);
  }
  assertExactKeys(snapshot, CLAIM_KEYS, 'evidence.claims-shape');
  const jsonIssue = inspectGenerationReceiptJsonContract(snapshot);
  if (jsonIssue) throw new GenerationEvidenceError([jsonIssue.code]);
  return snapshot as unknown as ProviderGenerationClaims;
}

function receiptProvider(provider: GeneratorProviderSnapshot): GenerationReceiptProvider {
  return {
    id: provider.id,
    version: provider.version,
    execution: provider.capabilities.execution,
    output_provenance: provider.capabilities.outputProvenance,
  };
}

function buildValidationReceipt(
  world: GeneratedWorld,
  provider: GeneratorProviderSnapshot,
  claims: ProviderGenerationClaims,
  createdAt: string,
): GenerationReceipt {
  return {
    schema_version: GENERATION_RECEIPT_SCHEMA_VERSION,
    created_at: createdAt,
    world: {
      id: world.spec.id,
      input_spec: {
        path: `worlds/${world.spec.id}.world.json`,
        sha256: ZERO_SHA256,
      },
      seed: world.spec.seed,
    },
    provider: receiptProvider(provider),
    model: claims.model,
    workflow: claims.workflow,
    transformations: [...claims.transformations],
    ai_disclosure: {
      contains_generative_ai: provider.capabilities.outputProvenance === 'generative-ai',
      human_curated: false,
      statement: claims.disclosureStatement,
    },
    licensing: {
      output: {
        id: world.spec.output.assetLicense,
        notice_path: 'license-assets.md',
      },
      provider_terms: claims.providerTerms,
    },
    sources: [...claims.sources],
  };
}

export function createGenerationRun(input: CreateGenerationRunInput): GenerationRunResult {
  const world = materializeGeneratedWorld(input.world, input.requestSpec);
  const provider = snapshotProvider(input.provider);
  const claims = snapshotClaims(input.claims);
  const validationReceipt = buildValidationReceipt(world, provider, claims, input.createdAt);
  const inputSpec = validationReceipt.world.input_spec;
  const providerReceipt = receiptProvider(provider);
  const issues = validateGenerationReceipt(validationReceipt, {
    world,
    inputSpec,
    createdAt: input.createdAt,
    provider: providerReceipt,
    outputLicense: {
      id: world.spec.output.assetLicense,
      noticePath: 'license-assets.md',
    },
  });
  const codes = issues.map((issue) => issue.code);
  if (codes.length > 0) throw new GenerationEvidenceError(codes);

  const run: GenerationRunResult = {
    world,
    evidence: {
      schemaVersion: GENERATION_EVIDENCE_SCHEMA_VERSION,
      createdAt: input.createdAt,
      requestSpec: world.spec,
      provider,
      model: claims.model,
      workflow: claims.workflow,
      transformations: claims.transformations,
      aiDisclosure: {
        containsGenerativeAi: provider.capabilities.outputProvenance === 'generative-ai',
        humanCurated: false,
        statement: claims.disclosureStatement,
      },
      providerTerms: claims.providerTerms,
      sources: claims.sources,
    },
  };
  deepFreeze(run);
  return run;
}
