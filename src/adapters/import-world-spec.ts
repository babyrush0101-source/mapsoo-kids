import { cloneWorldSpec, type WorldSpec } from '../core/world-spec';
import { validateWorldSpec, type ValidationIssue } from '../core/validate-world';
import {
  FORBIDDEN_WORLD_SPEC_OBJECT_KEYS,
  MAX_WORLD_SPEC_FILE_BYTES,
  MAX_WORLD_SPEC_JSON_DEPTH,
  MAX_WORLD_SPEC_JSON_NODES,
} from '../core/world-spec-limits';

export { MAX_WORLD_SPEC_FILE_BYTES } from '../core/world-spec-limits';

export type WorldSpecImportErrorCode =
  | 'import.empty'
  | 'import.too-large'
  | 'import.invalid-json'
  | 'import.invalid-utf8'
  | 'import.duplicate-key'
  | 'import.unsafe-key'
  | 'import.non-finite-number'
  | 'import.unsafe-integer'
  | 'import.too-deep'
  | 'import.too-complex'
  | 'import.invalid-spec'
  | 'import.read-failed';

export type StrictJsonImportErrorCode = Exclude<WorldSpecImportErrorCode, 'import.invalid-spec'>;

export type StrictJsonImportResult =
  | { ok: true; value: unknown }
  | { ok: false; code: StrictJsonImportErrorCode; message: string };

export type WorldSpecImportResult =
  | { ok: true; spec: WorldSpec; issues: ValidationIssue[] }
  | { ok: false; code: WorldSpecImportErrorCode; message: string; issues: ValidationIssue[] };

export interface ReadableJsonFile {
  name: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export type ReadableWorldSpecFile = ReadableJsonFile;

class DuplicateJsonKeyError extends Error {
  constructor(readonly key: string) {
    super(`Duplicate JSON object key: ${key}`);
  }
}

class JsonStructureLimitError extends Error {
  constructor(
    readonly code: Extract<WorldSpecImportErrorCode, 'import.too-deep' | 'import.too-complex'>,
    message: string,
  ) {
    super(message);
  }
}

function failure(
  code: WorldSpecImportErrorCode,
  message: string,
  issues: ValidationIssue[] = [],
): WorldSpecImportResult {
  return { ok: false, code, message, issues };
}

function strictFailure(code: StrictJsonImportErrorCode, message: string): StrictJsonImportResult {
  return { ok: false, code, message };
}

function isValidatedWorldSpec(value: unknown, issues: ValidationIssue[]): value is WorldSpec {
  return issues.every((issue) => issue.severity !== 'error');
}

function inspectJsonTree(value: unknown, documentName: string): StrictJsonImportResult | null {
  const pending: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
  let visitedNodes = 0;

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) break;

    visitedNodes += 1;
    if (visitedNodes > MAX_WORLD_SPEC_JSON_NODES) {
      return strictFailure(
        'import.too-complex',
        `${documentName} JSON may contain at most ${MAX_WORLD_SPEC_JSON_NODES} values.`,
      );
    }

    if (current.depth > MAX_WORLD_SPEC_JSON_DEPTH) {
      return strictFailure(
        'import.too-deep',
        `${documentName} JSON may be nested at most ${MAX_WORLD_SPEC_JSON_DEPTH} levels.`,
      );
    }

    if (typeof current.value === 'number') {
      if (!Number.isFinite(current.value)) {
        return strictFailure('import.non-finite-number', `${documentName} JSON may contain only finite numbers.`);
      }
      if (Number.isInteger(current.value) && !Number.isSafeInteger(current.value)) {
        return strictFailure(
          'import.unsafe-integer',
          `${documentName} JSON integers must stay within the safe integer range.`,
        );
      }
    }

    if (Array.isArray(current.value)) {
      for (const item of current.value) pending.push({ value: item, depth: current.depth + 1 });
      continue;
    }

    if (typeof current.value !== 'object' || current.value === null) continue;

    for (const [key, child] of Object.entries(current.value)) {
      if (FORBIDDEN_WORLD_SPEC_OBJECT_KEYS.has(key)) {
        return strictFailure('import.unsafe-key', `${documentName} JSON contains a forbidden object key: ${key}.`);
      }
      pending.push({ value: child, depth: current.depth + 1 });
    }
  }

  return null;
}

function assertNoDuplicateObjectKeys(text: string, documentName: string): void {
  let cursor = 0;
  let visitedNodes = 0;

  function skipWhitespace(): void {
    while (/\s/.test(text[cursor] ?? '')) cursor += 1;
  }

  function readString(): string {
    const start = cursor;
    cursor += 1;
    while (cursor < text.length) {
      const character = text[cursor];
      if (character === '\\') {
        cursor += 2;
        continue;
      }
      cursor += 1;
      if (character === '"') return JSON.parse(text.slice(start, cursor)) as string;
    }
    throw new SyntaxError('Unterminated JSON string.');
  }

  function readPrimitive(): void {
    while (cursor < text.length && !/[\s,}\]]/.test(text[cursor])) cursor += 1;
  }

  function readValue(depth: number): void {
    visitedNodes += 1;
    if (visitedNodes > MAX_WORLD_SPEC_JSON_NODES) {
      throw new JsonStructureLimitError(
        'import.too-complex',
        `${documentName} JSON may contain at most ${MAX_WORLD_SPEC_JSON_NODES} values.`,
      );
    }
    if (depth > MAX_WORLD_SPEC_JSON_DEPTH) {
      throw new JsonStructureLimitError(
        'import.too-deep',
        `${documentName} JSON may be nested at most ${MAX_WORLD_SPEC_JSON_DEPTH} levels.`,
      );
    }

    skipWhitespace();
    const character = text[cursor];
    if (character === '{') {
      readObject(depth);
      return;
    }
    if (character === '[') {
      readArray(depth);
      return;
    }
    if (character === '"') {
      readString();
      return;
    }
    readPrimitive();
  }

  function readArray(depth: number): void {
    cursor += 1;
    skipWhitespace();
    if (text[cursor] === ']') {
      cursor += 1;
      return;
    }
    while (cursor < text.length) {
      readValue(depth + 1);
      skipWhitespace();
      if (text[cursor] === ']') {
        cursor += 1;
        return;
      }
      cursor += 1;
    }
  }

  function readObject(depth: number): void {
    cursor += 1;
    const keys = new Set<string>();
    skipWhitespace();
    if (text[cursor] === '}') {
      cursor += 1;
      return;
    }
    while (cursor < text.length) {
      skipWhitespace();
      const key = readString();
      if (keys.has(key)) throw new DuplicateJsonKeyError(key);
      keys.add(key);
      skipWhitespace();
      cursor += 1;
      readValue(depth + 1);
      skipWhitespace();
      if (text[cursor] === '}') {
        cursor += 1;
        return;
      }
      cursor += 1;
    }
  }

  readValue(0);
}

export function parseStrictJsonDocument(
  text: string,
  documentName = 'Document',
): StrictJsonImportResult {
  const normalizedText = text.startsWith('\uFEFF') ? text.slice(1) : text;
  const byteLength = new TextEncoder().encode(normalizedText).byteLength;

  if (normalizedText.trim().length === 0) {
    return strictFailure('import.empty', `Choose a non-empty ${documentName} JSON file.`);
  }

  if (byteLength > MAX_WORLD_SPEC_FILE_BYTES) {
    return strictFailure(
      'import.too-large',
      `${documentName} JSON must be no larger than ${MAX_WORLD_SPEC_FILE_BYTES / 1024} KiB.`,
    );
  }

  let candidate: unknown;
  try {
    candidate = JSON.parse(normalizedText);
  } catch {
    return strictFailure('import.invalid-json', 'The selected file is not valid JSON.');
  }

  try {
    assertNoDuplicateObjectKeys(normalizedText, documentName);
  } catch (error) {
    if (error instanceof JsonStructureLimitError) {
      return strictFailure(error.code, error.message);
    }
    if (error instanceof DuplicateJsonKeyError) {
      const displayKey = error.key.length > 80 ? `${error.key.slice(0, 77)}...` : error.key;
      return strictFailure('import.duplicate-key', `${documentName} JSON repeats the object key: ${displayKey}.`);
    }
    return strictFailure('import.invalid-json', 'The selected file is not valid JSON.');
  }

  const unsafeTree = inspectJsonTree(candidate, documentName);
  if (unsafeTree) return unsafeTree;

  return { ok: true, value: candidate };
}

function validateParsedWorldSpec(candidate: unknown): WorldSpecImportResult {

  const issues = validateWorldSpec(candidate);
  const errors = issues.filter((issue) => issue.severity === 'error');
  if (!isValidatedWorldSpec(candidate, issues)) {
    return failure(
      'import.invalid-spec',
      `World Spec validation failed: ${errors.map((issue) => issue.code).join(', ')}.`,
      issues,
    );
  }

  return { ok: true, spec: cloneWorldSpec(candidate), issues };
}

function worldSpecFailure(result: Extract<StrictJsonImportResult, { ok: false }>): WorldSpecImportResult {
  return { ...result, issues: [] };
}

export function parseWorldSpecJson(text: string): WorldSpecImportResult {
  const parsed = parseStrictJsonDocument(text, 'World Spec');
  if (!parsed.ok) return worldSpecFailure(parsed);
  return validateParsedWorldSpec(parsed.value);
}

export async function readStrictJsonDocumentFile(
  file: ReadableJsonFile,
  documentName = 'Document',
): Promise<StrictJsonImportResult> {
  if (file.size <= 0) {
    return strictFailure('import.empty', `Choose a non-empty ${documentName} JSON file.`);
  }

  if (file.size > MAX_WORLD_SPEC_FILE_BYTES) {
    return strictFailure(
      'import.too-large',
      `${documentName} JSON must be no larger than ${MAX_WORLD_SPEC_FILE_BYTES / 1024} KiB.`,
    );
  }

  try {
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_WORLD_SPEC_FILE_BYTES) {
      return strictFailure(
        'import.too-large',
        `${documentName} JSON must be no larger than ${MAX_WORLD_SPEC_FILE_BYTES / 1024} KiB.`,
      );
    }
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      return strictFailure('import.invalid-utf8', `${documentName} JSON must use valid UTF-8 encoding.`);
    }
    return parseStrictJsonDocument(text, documentName);
  } catch {
    return strictFailure('import.read-failed', `Could not read ${file.name || 'the selected file'}.`);
  }
}

export async function readWorldSpecFile(file: ReadableWorldSpecFile): Promise<WorldSpecImportResult> {
  const parsed = await readStrictJsonDocumentFile(file, 'World Spec');
  if (!parsed.ok) return worldSpecFailure(parsed);
  return validateParsedWorldSpec(parsed.value);
}
