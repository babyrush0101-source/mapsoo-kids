import {
  isValidGeneratorId,
  isValidGeneratorVersion,
  PROCEDURAL_PIXEL_GENERATOR_ID,
  PROCEDURAL_PIXEL_GENERATOR_VERSION,
} from './generator-identity';
import type { ValidationIssue } from './validate-world';
import type { GeneratedWorld } from './world-spec';

export const GENERATION_RECEIPT_SCHEMA_VERSION = '0.2.0' as const;

export type ReceiptProviderExecution = 'local' | 'remote';
export type ReceiptOutputProvenance = 'procedural' | 'generative-ai';
export type ReceiptSourceKind = 'user-input' | 'reference-asset' | 'third-party-asset';

export interface GenerationReceiptProvider {
  id: string;
  version: string;
  execution: ReceiptProviderExecution;
  output_provenance: ReceiptOutputProvenance;
}

export interface GenerationReceiptModel {
  provider: string;
  id: string;
  revision: string | null;
}

export interface GenerationReceiptWorkflow {
  id: string;
  version: string;
  definition_sha256: string | null;
}

export interface GenerationReceiptTransformation {
  id: string;
  version: string;
}

export interface GenerationReceiptLicenseDeclaration {
  id: string;
  url: string | null;
  attribution: string | null;
}

export interface GenerationReceiptSource {
  id: string;
  kind: ReceiptSourceKind;
  sha256: string;
  path?: string;
  uri?: string;
  license: GenerationReceiptLicenseDeclaration;
}

export interface GenerationReceipt {
  schema_version: typeof GENERATION_RECEIPT_SCHEMA_VERSION;
  created_at: string;
  world: {
    id: string;
    input_spec: {
      path: string;
      sha256: string;
    };
    seed: string;
  };
  provider: GenerationReceiptProvider;
  model: GenerationReceiptModel | null;
  workflow: GenerationReceiptWorkflow;
  transformations: GenerationReceiptTransformation[];
  ai_disclosure: {
    contains_generative_ai: boolean;
    human_curated: boolean;
    statement: string | null;
  };
  licensing: {
    output: {
      id: string;
      notice_path: string;
    };
    provider_terms: {
      url: string;
      version: string | null;
    } | null;
  };
  sources: GenerationReceiptSource[];
}

export interface GenerationReceiptManifestProjection {
  contains_generative_ai: boolean;
  model_provider: string | null;
  model: string | null;
  seed: string;
  human_curated: boolean;
}

export interface GenerationReceiptFileRecord {
  path: string;
  sha256: string;
}

export interface GenerationReceiptValidationContext {
  world?: GeneratedWorld;
  inputSpec?: { path: string; sha256: string };
  createdAt?: string;
  provider?: GenerationReceiptProvider;
  outputLicense?: { id: string; noticePath: string };
  manifestProvenance?: GenerationReceiptManifestProjection;
  files?: readonly GenerationReceiptFileRecord[];
}

export interface BuildBuiltinProceduralReceiptInput {
  world: GeneratedWorld;
  inputSpec: { path: string; sha256: string };
  createdAt: string;
}

const WORLD_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256 = /^[0-9a-f]{64}$/;
const RELATIVE_PACK_PATH = /^[a-z0-9][a-z0-9._-]*(?:\/[a-z0-9][a-z0-9._-]*)*$/;
const LICENSE_REF = /^LicenseRef-[A-Za-z0-9][A-Za-z0-9.-]{0,68}$/;
const SUPPORTED_SPDX_LICENSE_IDS = new Set([
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'CC-BY-4.0',
  'CC-BY-NC-4.0',
  'CC-BY-NC-ND-4.0',
  'CC-BY-NC-SA-4.0',
  'CC-BY-ND-4.0',
  'CC-BY-SA-4.0',
  'CC0-1.0',
  'ISC',
  'MIT',
  'MPL-2.0',
  'OFL-1.1',
  'Unlicense',
]);
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/;
const SOURCE_KINDS = new Set<ReceiptSourceKind>(['user-input', 'reference-asset', 'third-party-asset']);
const PROVIDER_EXECUTIONS = new Set<ReceiptProviderExecution>(['local', 'remote']);
const OUTPUT_PROVENANCE = new Set<ReceiptOutputProvenance>(['procedural', 'generative-ai']);
const MAX_RECEIPT_BYTES = 256 * 1024;
const MAX_RECEIPT_DEPTH = 16;
const MAX_RECEIPT_NODES = 4_096;
const FORBIDDEN_RECEIPT_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

function issue(code: string, message: string): ValidationIssue {
  return { code, severity: 'error', message };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function validateObjectShape(
  value: unknown,
  path: string,
  required: readonly string[],
  optional: readonly string[],
  issues: ValidationIssue[],
): Record<string, unknown> | null {
  if (!isPlainRecord(value)) {
    issues.push(issue('receipt.invalid-object', `${path} must be a plain object.`));
    return null;
  }

  const allowed = new Set([...required, ...optional]);
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    issues.push(issue('receipt.unknown-field', `${path} contains unknown fields: ${unknown.join(', ')}.`));
  }
  const missing = required.filter((key) => !hasOwn(value, key));
  if (missing.length > 0) {
    issues.push(issue('receipt.missing-field', `${path} is missing required fields: ${missing.join(', ')}.`));
  }
  return value;
}

function isBoundedString(value: unknown, minimum: number, maximum: number): value is string {
  if (typeof value !== 'string' || CONTROL_CHARACTERS.test(value)) return false;
  const length = Array.from(value).length;
  return length >= minimum && length <= maximum;
}

function isCanonicalTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString() === value;
}

function isHttpsUrl(value: unknown): value is string {
  if (
    typeof value !== 'string'
    || value.length > 2_048
    || CONTROL_CHARACTERS.test(value)
    || value.includes('?')
    || value.includes('#')
  ) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:'
      && parsed.username === ''
      && parsed.password === ''
      && parsed.search === ''
      && parsed.hash === '';
  } catch {
    return false;
  }
}

interface ReceiptTraversalEntry {
  value: unknown;
  depth: number;
  exit?: boolean;
}

export function inspectGenerationReceiptJsonContract(value: unknown): ValidationIssue | null {
  const pending: ReceiptTraversalEntry[] = [{ value, depth: 0 }];
  const ancestors = new WeakSet<object>();
  let nodes = 0;
  let scheduledNodes = 1;
  let approximateStringUnits = 0;

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) break;
    if (current.exit) {
      ancestors.delete(current.value as object);
      continue;
    }

    scheduledNodes -= 1;
    nodes += 1;
    if (nodes > MAX_RECEIPT_NODES) {
      return issue('receipt.too-complex', `Generation receipts may contain at most ${MAX_RECEIPT_NODES} JSON values.`);
    }
    if (current.depth > MAX_RECEIPT_DEPTH) {
      return issue('receipt.too-deep', `Generation receipts may be nested at most ${MAX_RECEIPT_DEPTH} levels.`);
    }

    const valueType = typeof current.value;
    if (valueType === 'string') {
      approximateStringUnits += (current.value as string).length + 2;
      if (approximateStringUnits > MAX_RECEIPT_BYTES) {
        return issue('receipt.too-large', `Generation receipts may be at most ${MAX_RECEIPT_BYTES / 1024} KiB.`);
      }
      continue;
    }
    if (current.value === null || valueType === 'boolean') continue;
    if (valueType === 'number') {
      if (!Number.isFinite(current.value) || (Number.isInteger(current.value) && !Number.isSafeInteger(current.value))) {
        return issue('receipt.non-json-value', 'Generation receipt numbers must be finite and JSON-safe.');
      }
      continue;
    }
    if (valueType !== 'object') {
      return issue('receipt.non-json-value', 'Generation receipt values must be representable as JSON.');
    }

    const objectValue = current.value as object;
    if (ancestors.has(objectValue)) {
      return issue('receipt.circular-json', 'Generation receipts must not contain circular references.');
    }
    const isArray = Array.isArray(objectValue);
    const prototype = Object.getPrototypeOf(objectValue);
    if (!isArray && prototype !== Object.prototype && prototype !== null) {
      return issue('receipt.non-json-value', 'Generation receipt objects must be plain JSON objects.');
    }
    if (Object.getOwnPropertySymbols(objectValue).length > 0) {
      return issue('receipt.non-json-value', 'Generation receipt values must not use symbol keys.');
    }

    ancestors.add(objectValue);
    pending.push({ value: objectValue, depth: current.depth, exit: true });

    if (isArray) {
      const arrayValue = objectValue as unknown[];
      const ownKeys = Object.getOwnPropertyNames(arrayValue);
      for (const key of ownKeys) {
        if (key === 'length') continue;
        const index = Number(key);
        if (!Number.isSafeInteger(index) || index < 0 || index >= arrayValue.length || `${index}` !== key) {
          return issue('receipt.non-json-value', 'Generation receipt arrays must contain indexed values only.');
        }
      }
      if (nodes + scheduledNodes + arrayValue.length > MAX_RECEIPT_NODES) {
        return issue('receipt.too-complex', `Generation receipts may contain at most ${MAX_RECEIPT_NODES} JSON values.`);
      }
      scheduledNodes += arrayValue.length;
      for (let index = arrayValue.length - 1; index >= 0; index -= 1) {
        const descriptor = Object.getOwnPropertyDescriptor(arrayValue, index);
        if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
          return issue('receipt.non-json-value', 'Generation receipt arrays must not contain holes or accessors.');
        }
        pending.push({ value: descriptor.value, depth: current.depth + 1 });
      }
      continue;
    }

    const keys = Object.getOwnPropertyNames(objectValue);
    if (nodes + scheduledNodes + keys.length > MAX_RECEIPT_NODES) {
      return issue('receipt.too-complex', `Generation receipts may contain at most ${MAX_RECEIPT_NODES} JSON values.`);
    }
    scheduledNodes += keys.length;
    for (let index = keys.length - 1; index >= 0; index -= 1) {
      const key = keys[index];
      approximateStringUnits += key.length + 3;
      if (approximateStringUnits > MAX_RECEIPT_BYTES) {
        return issue('receipt.too-large', `Generation receipts may be at most ${MAX_RECEIPT_BYTES / 1024} KiB.`);
      }
      if (FORBIDDEN_RECEIPT_KEYS.has(key)) {
        return issue('receipt.unsafe-json-key', `Generation receipt contains forbidden key ${key}.`);
      }
      const descriptor = Object.getOwnPropertyDescriptor(objectValue, key);
      if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
        return issue('receipt.non-json-value', 'Generation receipt objects must contain enumerable data properties only.');
      }
      pending.push({ value: descriptor.value, depth: current.depth + 1 });
    }
  }

  if (new TextEncoder().encode(JSON.stringify(value)).byteLength > MAX_RECEIPT_BYTES) {
    return issue('receipt.too-large', `Generation receipts may be at most ${MAX_RECEIPT_BYTES / 1024} KiB.`);
  }
  return null;
}

function isSafePackPath(value: unknown): value is string {
  return typeof value === 'string'
    && value.length <= 240
    && RELATIVE_PACK_PATH.test(value)
    && !value.split('/').some((segment) => segment === '.' || segment === '..');
}

function isAcceptedLicenseId(value: unknown): value is string {
  return typeof value === 'string'
    && (SUPPORTED_SPDX_LICENSE_IDS.has(value) || LICENSE_REF.test(value));
}

function validateProvider(value: unknown, path: string, issues: ValidationIssue[]): GenerationReceiptProvider | null {
  const record = validateObjectShape(
    value,
    path,
    ['id', 'version', 'execution', 'output_provenance'],
    [],
    issues,
  );
  if (!record) return null;

  if (!isValidGeneratorId(record.id)) {
    issues.push(issue('receipt.provider', `${path}.id must be a path-safe provider ID.`));
  }
  if (!isValidGeneratorVersion(record.version)) {
    issues.push(issue('receipt.provider', `${path}.version must be a valid semantic version.`));
  }
  if (!PROVIDER_EXECUTIONS.has(record.execution as ReceiptProviderExecution)) {
    issues.push(issue('receipt.provider', `${path}.execution must be local or remote.`));
  }
  if (!OUTPUT_PROVENANCE.has(record.output_provenance as ReceiptOutputProvenance)) {
    issues.push(issue('receipt.provider', `${path}.output_provenance must be procedural or generative-ai.`));
  }

  if (
    record.id === PROCEDURAL_PIXEL_GENERATOR_ID
    && record.version === PROCEDURAL_PIXEL_GENERATOR_VERSION
    && (record.execution !== 'local' || record.output_provenance !== 'procedural')
  ) {
    issues.push(issue(
      'receipt.provider',
      'The built-in procedural provider identity must declare local execution and procedural provenance.',
    ));
  }

  return record as unknown as GenerationReceiptProvider;
}

function validateModel(value: unknown, issues: ValidationIssue[]): GenerationReceiptModel | null {
  if (value === null) return null;
  const record = validateObjectShape(value, 'receipt.model', ['provider', 'id', 'revision'], [], issues);
  if (!record) return null;
  if (!isBoundedString(record.provider, 1, 120)) {
    issues.push(issue('receipt.model', 'receipt.model.provider must be a bounded, control-character-free string.'));
  }
  if (!isBoundedString(record.id, 1, 160)) {
    issues.push(issue('receipt.model', 'receipt.model.id must be a bounded, control-character-free string.'));
  }
  if (record.revision !== null && !isBoundedString(record.revision, 1, 160)) {
    issues.push(issue('receipt.model', 'receipt.model.revision must be null or a bounded string.'));
  }
  return record as unknown as GenerationReceiptModel;
}

function validateWorkflow(value: unknown, issues: ValidationIssue[]): GenerationReceiptWorkflow | null {
  const record = validateObjectShape(
    value,
    'receipt.workflow',
    ['id', 'version', 'definition_sha256'],
    [],
    issues,
  );
  if (!record) return null;
  if (!isValidGeneratorId(record.id)) {
    issues.push(issue('receipt.workflow', 'receipt.workflow.id must be a path-safe workflow ID.'));
  }
  if (!isValidGeneratorVersion(record.version)) {
    issues.push(issue('receipt.workflow', 'receipt.workflow.version must be a semantic version.'));
  }
  if (record.definition_sha256 !== null && (typeof record.definition_sha256 !== 'string' || !SHA256.test(record.definition_sha256))) {
    issues.push(issue('receipt.workflow', 'receipt.workflow.definition_sha256 must be null or a lowercase SHA-256.'));
  }
  return record as unknown as GenerationReceiptWorkflow;
}

function validateTransformations(
  value: unknown,
  issues: ValidationIssue[],
): GenerationReceiptTransformation[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 64) {
    issues.push(issue('receipt.transformations', 'receipt.transformations must contain between 1 and 64 entries.'));
    return null;
  }

  const result: GenerationReceiptTransformation[] = [];
  value.forEach((entry, index) => {
    const record = validateObjectShape(
      entry,
      `receipt.transformations[${index}]`,
      ['id', 'version'],
      [],
      issues,
    );
    if (!record) return;
    if (!isValidGeneratorId(record.id) || !isValidGeneratorVersion(record.version)) {
      issues.push(issue(
        'receipt.transformations',
        `receipt.transformations[${index}] must contain a path-safe ID and semantic version.`,
      ));
    }
    result.push(record as unknown as GenerationReceiptTransformation);
  });
  return result;
}

function validateLicenseDeclaration(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): GenerationReceiptLicenseDeclaration | null {
  const record = validateObjectShape(value, path, ['id', 'url', 'attribution'], [], issues);
  if (!record) return null;
  if (!isAcceptedLicenseId(record.id)) {
    issues.push(issue(
      'receipt.license',
      `${path}.id must be an allowlisted SPDX identifier or an explicit LicenseRef-* identifier.`,
    ));
  }
  if (record.url !== null && !isHttpsUrl(record.url)) {
    issues.push(issue('receipt.license', `${path}.url must be null or an HTTPS URL.`));
  }
  if (record.attribution !== null && !isBoundedString(record.attribution, 1, 1_000)) {
    issues.push(issue('receipt.license', `${path}.attribution must be null or a bounded string.`));
  }
  if (
    typeof record.id === 'string'
    && record.id.startsWith('CC-BY')
    && !isBoundedString(record.attribution, 1, 1_000)
  ) {
    issues.push(issue('receipt.license', `${path} requires attribution for ${record.id}.`));
  }
  if (typeof record.id === 'string' && LICENSE_REF.test(record.id) && !isHttpsUrl(record.url)) {
    issues.push(issue('receipt.license', `${path} custom LicenseRef declarations require a public HTTPS terms URL.`));
  }
  return record as unknown as GenerationReceiptLicenseDeclaration;
}

function validateSources(value: unknown, issues: ValidationIssue[]): GenerationReceiptSource[] | null {
  if (!Array.isArray(value) || value.length > 64) {
    issues.push(issue('receipt.sources', 'receipt.sources must be an array with at most 64 entries.'));
    return null;
  }

  const ids = new Set<string>();
  const result: GenerationReceiptSource[] = [];
  value.forEach((entry, index) => {
    const path = `receipt.sources[${index}]`;
    const record = validateObjectShape(entry, path, ['id', 'kind', 'sha256', 'license'], ['path', 'uri'], issues);
    if (!record) return;

    if (!isValidGeneratorId(record.id)) {
      issues.push(issue('receipt.sources', `${path}.id must be a path-safe source ID.`));
    } else if (ids.has(record.id)) {
      issues.push(issue('receipt.duplicate-source', `receipt.sources contains duplicate ID ${record.id}.`));
    } else {
      ids.add(record.id);
    }
    if (!SOURCE_KINDS.has(record.kind as ReceiptSourceKind)) {
      issues.push(issue('receipt.sources', `${path}.kind is not supported.`));
    }
    if (typeof record.sha256 !== 'string' || !SHA256.test(record.sha256)) {
      issues.push(issue('receipt.sources', `${path}.sha256 must be a lowercase SHA-256.`));
    }
    if (hasOwn(record, 'path') && !isSafePackPath(record.path)) {
      issues.push(issue('receipt.sources', `${path}.path must be a safe relative pack path.`));
    }
    if (hasOwn(record, 'uri') && !isHttpsUrl(record.uri)) {
      issues.push(issue('receipt.sources', `${path}.uri must be an HTTPS URL.`));
    }
    if (!hasOwn(record, 'path') && !hasOwn(record, 'uri')) {
      issues.push(issue('receipt.sources', `${path} must identify a packaged path or public HTTPS URI.`));
    }
    validateLicenseDeclaration(record.license, `${path}.license`, issues);
    result.push(record as unknown as GenerationReceiptSource);
  });
  return result;
}

function projectManifestProvenance(receipt: GenerationReceipt): GenerationReceiptManifestProjection {
  return {
    contains_generative_ai: receipt.ai_disclosure.contains_generative_ai,
    model_provider: receipt.model?.provider ?? null,
    model: receipt.model?.id ?? null,
    seed: receipt.world.seed,
    human_curated: receipt.ai_disclosure.human_curated,
  };
}

export function generationReceiptManifestProjection(
  receipt: GenerationReceipt,
): GenerationReceiptManifestProjection {
  return projectManifestProvenance(receipt);
}

function structurallyEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((entry, index) => structurallyEqual(entry, right[index]));
  }
  if (!isPlainRecord(left) || !isPlainRecord(right)) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) => key === rightKeys[index] && structurallyEqual(left[key], right[key]));
}

function validateContext(
  receipt: GenerationReceipt,
  context: GenerationReceiptValidationContext,
  issues: ValidationIssue[],
): void {
  if (context.world) {
    if (receipt.world.id !== context.world.spec.id || receipt.world.seed !== context.world.spec.seed) {
      issues.push(issue('receipt.context-world', 'Receipt world ID or seed does not match the generated world.'));
    }
    if (
      receipt.provider.id !== context.world.generator.id
      || receipt.provider.version !== context.world.generator.version
    ) {
      issues.push(issue('receipt.context-provider', 'Receipt provider identity does not match the generated world.'));
    }
    if (receipt.licensing.output.id !== context.world.spec.output.assetLicense) {
      issues.push(issue('receipt.context-license', 'Receipt output license does not match the World Spec.'));
    }
  }

  if (
    context.inputSpec
    && (
      receipt.world.input_spec.path !== context.inputSpec.path
      || receipt.world.input_spec.sha256 !== context.inputSpec.sha256
    )
  ) {
    issues.push(issue('receipt.context-input-spec', 'Receipt input World Spec path or hash does not match export context.'));
  }
  if (context.createdAt !== undefined && receipt.created_at !== context.createdAt) {
    issues.push(issue('receipt.context-created-at', 'Receipt timestamp does not match manifest creation time.'));
  }
  if (context.provider && !structurallyEqual(receipt.provider, context.provider)) {
    issues.push(issue('receipt.context-provider', 'Receipt provider metadata does not match the invocation snapshot.'));
  }
  if (
    context.outputLicense
    && (
      receipt.licensing.output.id !== context.outputLicense.id
      || receipt.licensing.output.notice_path !== context.outputLicense.noticePath
    )
  ) {
    issues.push(issue('receipt.context-license', 'Receipt output license does not match manifest context.'));
  }
  if (
    context.manifestProvenance
    && !structurallyEqual(projectManifestProvenance(receipt), context.manifestProvenance)
  ) {
    issues.push(issue('receipt.context-provenance', 'Manifest provenance is not an exact projection of the receipt.'));
  }

  if (context.files) {
    const byPath = new Map<string, GenerationReceiptFileRecord>();
    for (const file of context.files) {
      if (byPath.has(file.path)) {
        issues.push(issue('receipt.context-file', `Export context contains duplicate file path ${file.path}.`));
      }
      byPath.set(file.path, file);
    }

    const inputRecord = byPath.get(receipt.world.input_spec.path);
    if (!inputRecord || inputRecord.sha256 !== receipt.world.input_spec.sha256) {
      issues.push(issue('receipt.context-file', 'Receipt input World Spec does not match its exported file record.'));
    }
    if (!byPath.has(receipt.licensing.output.notice_path)) {
      issues.push(issue('receipt.context-file', 'Receipt output license notice is missing from exported files.'));
    }
    for (const source of receipt.sources) {
      if (!source.path) continue;
      const record = byPath.get(source.path);
      if (!record || record.sha256 !== source.sha256) {
        issues.push(issue('receipt.context-file', `Receipt source ${source.id} does not match its exported file record.`));
      }
    }
  }
}

export function validateGenerationReceipt(
  value: unknown,
  context: GenerationReceiptValidationContext = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  let root: Record<string, unknown> | null;
  try {
    const jsonIssue = inspectGenerationReceiptJsonContract(value);
    if (jsonIssue) return [jsonIssue];
    root = validateObjectShape(
      value,
      'receipt',
      [
        'schema_version',
        'created_at',
        'world',
        'provider',
        'model',
        'workflow',
        'transformations',
        'ai_disclosure',
        'licensing',
        'sources',
      ],
      [],
      issues,
    );
  } catch {
    return [issue('receipt.invalid-root', 'Generation receipt could not be inspected safely.')];
  }
  if (!root) return issues;

  try {
    if (root.schema_version !== GENERATION_RECEIPT_SCHEMA_VERSION) {
      issues.push(issue(
        'receipt.schema-version',
        `Receipt schema version must be ${GENERATION_RECEIPT_SCHEMA_VERSION}.`,
      ));
    }
    if (!isCanonicalTimestamp(root.created_at)) {
      issues.push(issue('receipt.created-at', 'receipt.created_at must be a canonical UTC ISO timestamp.'));
    }

    const world = validateObjectShape(root.world, 'receipt.world', ['id', 'input_spec', 'seed'], [], issues);
    if (world) {
      if (typeof world.id !== 'string' || world.id.length > 80 || !WORLD_ID.test(world.id)) {
        issues.push(issue('receipt.world', 'receipt.world.id must be a path-safe world ID.'));
      }
      if (!isBoundedString(world.seed, 1, 160)) {
        issues.push(issue('receipt.world', 'receipt.world.seed must be a bounded, control-character-free string.'));
      }
      const inputSpec = validateObjectShape(
        world.input_spec,
        'receipt.world.input_spec',
        ['path', 'sha256'],
        [],
        issues,
      );
      if (inputSpec) {
        if (!isSafePackPath(inputSpec.path)) {
          issues.push(issue('receipt.input-spec', 'receipt.world.input_spec.path must be a safe pack path.'));
        }
        if (typeof inputSpec.sha256 !== 'string' || !SHA256.test(inputSpec.sha256)) {
          issues.push(issue('receipt.input-spec', 'receipt.world.input_spec.sha256 must be a lowercase SHA-256.'));
        }
      }
    }

    const provider = validateProvider(root.provider, 'receipt.provider', issues);
    const model = validateModel(root.model, issues);
    const workflow = validateWorkflow(root.workflow, issues);
    validateTransformations(root.transformations, issues);

    const disclosure = validateObjectShape(
      root.ai_disclosure,
      'receipt.ai_disclosure',
      ['contains_generative_ai', 'human_curated', 'statement'],
      [],
      issues,
    );
    if (disclosure) {
      if (typeof disclosure.contains_generative_ai !== 'boolean') {
        issues.push(issue('receipt.ai-disclosure', 'contains_generative_ai must be boolean.'));
      }
      if (typeof disclosure.human_curated !== 'boolean') {
        issues.push(issue('receipt.ai-disclosure', 'human_curated must be boolean.'));
      }
      if (disclosure.statement !== null && !isBoundedString(disclosure.statement, 1, 2_000)) {
        issues.push(issue('receipt.ai-disclosure', 'AI disclosure statement must be null or a bounded string.'));
      }
    }

    const licensing = validateObjectShape(
      root.licensing,
      'receipt.licensing',
      ['output', 'provider_terms'],
      [],
      issues,
    );
    let providerTerms: Record<string, unknown> | null = null;
    if (licensing) {
      const output = validateObjectShape(
        licensing.output,
        'receipt.licensing.output',
        ['id', 'notice_path'],
        [],
        issues,
      );
      if (output) {
        if (!isAcceptedLicenseId(output.id)) {
          issues.push(issue(
            'receipt.license',
            'Output license must be an allowlisted SPDX identifier or an explicit LicenseRef-* identifier.',
          ));
        }
        if (!isSafePackPath(output.notice_path)) {
          issues.push(issue('receipt.license', 'Output license notice must use a safe pack path.'));
        }
      }

      if (licensing.provider_terms !== null) {
        providerTerms = validateObjectShape(
          licensing.provider_terms,
          'receipt.licensing.provider_terms',
          ['url', 'version'],
          [],
          issues,
        );
        if (providerTerms) {
          if (!isHttpsUrl(providerTerms.url)) {
            issues.push(issue('receipt.license', 'Provider terms URL must use HTTPS.'));
          }
          if (providerTerms.version !== null && !isBoundedString(providerTerms.version, 1, 120)) {
            issues.push(issue('receipt.license', 'Provider terms version must be null or a bounded string.'));
          }
        }
      }
    }

    validateSources(root.sources, issues);

    if (provider && disclosure) {
      const generative = provider.output_provenance === 'generative-ai';
      if (disclosure.contains_generative_ai !== generative) {
        issues.push(issue(
          'receipt.ai-condition',
          'AI disclosure must agree with provider output provenance.',
        ));
      }
      if (generative) {
        if (model === null) {
          issues.push(issue('receipt.ai-condition', 'Generative-AI receipts must identify a model.'));
        }
        if (workflow?.definition_sha256 === null) {
          issues.push(issue('receipt.ai-condition', 'Generative-AI receipts require a hashed workflow definition.'));
        }
        if (!isBoundedString(disclosure.statement, 1, 2_000)) {
          issues.push(issue('receipt.ai-condition', 'Generative-AI receipts require a disclosure statement.'));
        }
        if (providerTerms === null) {
          issues.push(issue('receipt.ai-condition', 'Generative-AI receipts require provider terms.'));
        }
      } else {
        if (root.model !== null) {
          issues.push(issue('receipt.ai-condition', 'Procedural receipts must set model to null.'));
        }
        if (disclosure.statement !== null) {
          issues.push(issue('receipt.ai-condition', 'Procedural receipts must set AI disclosure statement to null.'));
        }
        if (licensing?.provider_terms !== null) {
          issues.push(issue('receipt.ai-condition', 'Procedural receipts must set provider terms to null.'));
        }
      }
    }
  } catch {
    issues.push(issue('receipt.invalid-root', 'Generation receipt could not be inspected safely.'));
  }

  if (issues.length === 0) {
    validateContext(root as unknown as GenerationReceipt, context, issues);
  }
  return issues;
}

export function buildBuiltinProceduralReceipt(
  input: BuildBuiltinProceduralReceiptInput,
): GenerationReceipt {
  const receipt: GenerationReceipt = {
    schema_version: GENERATION_RECEIPT_SCHEMA_VERSION,
    created_at: input.createdAt,
    world: {
      id: input.world.spec.id,
      input_spec: {
        path: input.inputSpec.path,
        sha256: input.inputSpec.sha256,
      },
      seed: input.world.spec.seed,
    },
    provider: {
      id: PROCEDURAL_PIXEL_GENERATOR_ID,
      version: PROCEDURAL_PIXEL_GENERATOR_VERSION,
      execution: 'local',
      output_provenance: 'procedural',
    },
    model: null,
    workflow: {
      id: 'mapsoo-procedural-world-pack',
      version: '0.1.0',
      definition_sha256: null,
    },
    transformations: [
      { id: 'seeded-map-layout', version: '0.1.0' },
      { id: 'procedural-pixel-atlas', version: '0.1.0' },
      { id: 'png-rgba-export', version: '0.1.0' },
    ],
    ai_disclosure: {
      contains_generative_ai: false,
      human_curated: false,
      statement: null,
    },
    licensing: {
      output: {
        id: 'CC0-1.0',
        notice_path: 'license-assets.md',
      },
      provider_terms: null,
    },
    sources: [],
  };

  const errors = validateGenerationReceipt(receipt, {
    world: input.world,
    inputSpec: input.inputSpec,
    createdAt: input.createdAt,
    provider: receipt.provider,
    outputLicense: { id: 'CC0-1.0', noticePath: 'license-assets.md' },
  });
  if (errors.length > 0) {
    throw new Error(`Invalid built-in generation receipt: ${errors.map((entry) => entry.code).join(', ')}.`);
  }
  return receipt;
}
