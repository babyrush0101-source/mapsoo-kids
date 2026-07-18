import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_WORLD_SPEC } from '../core/world-spec';
import {
  MAX_WORLD_SPEC_FILE_BYTES,
  parseWorldSpecJson,
  readWorldSpecFile,
} from './import-world-spec';

describe('World Spec JSON import', () => {
  function asFile(name: string, bytes: Uint8Array) {
    return {
      name,
      size: bytes.byteLength,
      arrayBuffer: async () => bytes.slice().buffer,
    };
  }

  it('loads a valid spec, accepts a UTF-8 BOM, and returns an independent clone', () => {
    const result = parseWorldSpecJson(`\uFEFF${JSON.stringify(DEFAULT_WORLD_SPEC)}`);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.spec).toEqual(DEFAULT_WORLD_SPEC);
    expect(result.spec).not.toBe(DEFAULT_WORLD_SPEC);
    expect(result.spec.visual.palette).not.toBe(DEFAULT_WORLD_SPEC.visual.palette);
    result.spec.visual.palette[0] = '#000000';
    expect(DEFAULT_WORLD_SPEC.visual.palette[0]).not.toBe('#000000');
  });

  it('returns stable errors for empty, malformed, and oversized JSON', () => {
    expect(parseWorldSpecJson('  ')).toMatchObject({ ok: false, code: 'import.empty' });
    expect(parseWorldSpecJson('{')).toMatchObject({ ok: false, code: 'import.invalid-json' });
    expect(parseWorldSpecJson(`"${'x'.repeat(MAX_WORLD_SPEC_FILE_BYTES)}"`)).toMatchObject({
      ok: false,
      code: 'import.too-large',
    });
  });

  it('surfaces schema validation codes and keeps warnings non-blocking', () => {
    const invalid = { ...DEFAULT_WORLD_SPEC, unexpected: true };
    const invalidResult = parseWorldSpecJson(JSON.stringify(invalid));
    expect(invalidResult).toMatchObject({ ok: false, code: 'import.invalid-spec' });
    expect(invalidResult.issues.map((issue) => issue.code)).toContain('spec.unknown-root-field');

    const warning = { ...DEFAULT_WORLD_SPEC, description: 'short' };
    const warningResult = parseWorldSpecJson(JSON.stringify(warning));
    expect(warningResult.ok).toBe(true);
    expect(warningResult.issues.map((issue) => issue.code)).toContain('spec.short-description');
  });

  it('rejects prototype keys and deeply nested extension data', () => {
    for (const forbiddenKey of ['__proto__', 'constructor', 'prototype']) {
      const unsafeJson = JSON.stringify(DEFAULT_WORLD_SPEC).replace(
        /}$/, `,"extensions":{"dev.stoyo":{"${forbiddenKey}":{"polluted":true}}}}`,
      );
      expect(parseWorldSpecJson(unsafeJson)).toMatchObject({ ok: false, code: 'import.unsafe-key' });
    }

    let nested: unknown = 'leaf';
    for (let index = 0; index < 34; index += 1) nested = { child: nested };
    const tooDeep = { ...DEFAULT_WORLD_SPEC, extensions: { 'dev.stoyo': nested } };
    expect(parseWorldSpecJson(JSON.stringify(tooDeep))).toMatchObject({ ok: false, code: 'import.too-deep' });

    const tooComplex = {
      ...DEFAULT_WORLD_SPEC,
      extensions: { 'dev.stoyo': Array.from({ length: 10_001 }, () => 0) },
    };
    expect(parseWorldSpecJson(JSON.stringify(tooComplex))).toMatchObject({ ok: false, code: 'import.too-complex' });
  });

  it('rejects duplicate keys and numbers that cannot round-trip safely', () => {
    const duplicate = JSON.stringify(DEFAULT_WORLD_SPEC).replace(
      /^{/,
      '{"schemaVersion":"0.1.0",',
    );
    expect(parseWorldSpecJson(duplicate)).toMatchObject({ ok: false, code: 'import.duplicate-key' });

    const nonFinite = JSON.stringify(DEFAULT_WORLD_SPEC).replace(
      /}$/,
      ',"extensions":{"dev.stoyo":{"value":1e400}}}',
    );
    expect(parseWorldSpecJson(nonFinite)).toMatchObject({ ok: false, code: 'import.non-finite-number' });

    const unsafeInteger = JSON.stringify(DEFAULT_WORLD_SPEC).replace(
      /}$/,
      ',"extensions":{"dev.stoyo":{"value":9007199254740993}}}',
    );
    expect(parseWorldSpecJson(unsafeInteger)).toMatchObject({ ok: false, code: 'import.unsafe-integer' });
  });

  it('uses fatal UTF-8 decoding and accepts valid UTF-8 bytes', async () => {
    const validBytes = new TextEncoder().encode(JSON.stringify(DEFAULT_WORLD_SPEC));
    await expect(readWorldSpecFile(asFile('valid.world.json', validBytes))).resolves.toMatchObject({ ok: true });

    const invalidBytes = Uint8Array.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xc3, 0x28, 0x22, 0x7d]);
    await expect(readWorldSpecFile(asFile('invalid-utf8.world.json', invalidBytes))).resolves.toMatchObject({
      ok: false,
      code: 'import.invalid-utf8',
    });
  });

  it('checks declared file size before reading and reports read failures without throwing', async () => {
    const oversizedRead = vi.fn(async () => new ArrayBuffer(0));
    const oversized = await readWorldSpecFile({
      name: 'large.world.json',
      size: MAX_WORLD_SPEC_FILE_BYTES + 1,
      arrayBuffer: oversizedRead,
    });
    expect(oversized).toMatchObject({ ok: false, code: 'import.too-large' });
    expect(oversizedRead).not.toHaveBeenCalled();

    const unreadable = await readWorldSpecFile({
      name: 'broken.world.json',
      size: 42,
      arrayBuffer: async () => {
        throw new Error('disk error');
      },
    });
    expect(unreadable).toMatchObject({ ok: false, code: 'import.read-failed' });
  });
});
