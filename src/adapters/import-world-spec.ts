import { cloneWorldSpec, type WorldSpec } from '../core/world-spec';
import { validateWorldSpec, type ValidationIssue } from '../core/validate-world';

export const MAX_WORLD_SPEC_FILE_BYTES = 128 * 1024;

const MAX_JSON_DEPTH = 32;
const MAX_JSON_NODES = 10_000;
const FORBIDDEN_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

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

export type WorldSpecImportResult =
  | { ok: true; spec: WorldSpec; issues: ValidationIssue[] }
  | { ok: false; code: WorldSpecImportErrorCode; message: string; issues: ValidationIssue[] };

export interface ReadableWorldSpecFile {
  name: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

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

function isValidatedWorldSpec(value: unknown, issues: ValidationIssue[]): value is WorldSpec {
  return issues.every((issue) => issue.severity !== 'error');
}

function inspectJsonTree(value: unknown): WorldSpecImportResult | null {
  const pending: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
  let visitedNodes = 0;

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) break;

    visitedNodes += 1;
    if (visitedNodes > MAX_JSON_NODES) {
      return failure('import.too-complex', `World Spec JSON may contain at most ${MAX_JSON_NODES} values.`);
    }

    if (current.depth > MAX_JSON_DEPTH) {
      return failure('import.too-deep', `World Spec JSON may be nested at most ${MAX_JSON_DEPTH} levels.`);
    }

    if (typeof current.value === 'number') {
      if (!Number.isFinite(current.value)) {
        return failure('import.non-finite-number', 'World Spec JSON may contain only finite numbers.');
      }
      if (Number.isInteger(current.value) && !Number.isSafeInteger(current.value)) {
        return failure('import.unsafe-integer', 'World Spec JSON integers must stay within the safe integer range.');
      }
    }

    if (Array.isArray(current.value)) {
      for (const item of current.value) pending.push({ value: item, depth: current.depth + 1 });
      continue;
    }

    if (typeof current.value !== 'object' || current.value === null) continue;

    for (const [key, child] of Object.entries(current.value)) {
      if (FORBIDDEN_OBJECT_KEYS.has(key)) {
        return failure('import.unsafe-key', `World Spec JSON contains a forbidden object key: ${key}.`);
      }
      pending.push({ value: child, depth: current.depth + 1 });
    }
  }

  return null;
}

function assertNoDuplicateObjectKeys(text: string): void {
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
    if (visitedNodes > MAX_JSON_NODES) {
      throw new JsonStructureLimitError(
        'import.too-complex',
        `World Spec JSON may contain at most ${MAX_JSON_NODES} values.`,
      );
    }
    if (depth > MAX_JSON_DEPTH) {
      throw new JsonStructureLimitError(
        'import.too-deep',
        `World Spec JSON may be nested at most ${MAX_JSON_DEPTH} levels.`,
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

export function parseWorldSpecJson(text: string): WorldSpecImportResult {
  const normalizedText = text.startsWith('\uFEFF') ? text.slice(1) : text;
  const byteLength = new TextEncoder().encode(normalizedText).byteLength;

  if (normalizedText.trim().length === 0) {
    return failure('import.empty', 'Choose a non-empty World Spec JSON file.');
  }

  if (byteLength > MAX_WORLD_SPEC_FILE_BYTES) {
    return failure(
      'import.too-large',
      `World Spec JSON must be no larger than ${MAX_WORLD_SPEC_FILE_BYTES / 1024} KiB.`,
    );
  }

  let candidate: unknown;
  try {
    candidate = JSON.parse(normalizedText);
  } catch {
    return failure('import.invalid-json', 'The selected file is not valid JSON.');
  }

  try {
    assertNoDuplicateObjectKeys(normalizedText);
  } catch (error) {
    if (error instanceof JsonStructureLimitError) {
      return failure(error.code, error.message);
    }
    if (error instanceof DuplicateJsonKeyError) {
      const displayKey = error.key.length > 80 ? `${error.key.slice(0, 77)}...` : error.key;
      return failure('import.duplicate-key', `World Spec JSON repeats the object key: ${displayKey}.`);
    }
    return failure('import.invalid-json', 'The selected file is not valid JSON.');
  }

  const unsafeTree = inspectJsonTree(candidate);
  if (unsafeTree) return unsafeTree;

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

export async function readWorldSpecFile(file: ReadableWorldSpecFile): Promise<WorldSpecImportResult> {
  if (file.size <= 0) {
    return failure('import.empty', 'Choose a non-empty World Spec JSON file.');
  }

  if (file.size > MAX_WORLD_SPEC_FILE_BYTES) {
    return failure(
      'import.too-large',
      `World Spec JSON must be no larger than ${MAX_WORLD_SPEC_FILE_BYTES / 1024} KiB.`,
    );
  }

  try {
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_WORLD_SPEC_FILE_BYTES) {
      return failure(
        'import.too-large',
        `World Spec JSON must be no larger than ${MAX_WORLD_SPEC_FILE_BYTES / 1024} KiB.`,
      );
    }
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      return failure('import.invalid-utf8', 'World Spec JSON must use valid UTF-8 encoding.');
    }
    return parseWorldSpecJson(text);
  } catch {
    return failure('import.read-failed', `Could not read ${file.name || 'the selected file'}.`);
  }
}
