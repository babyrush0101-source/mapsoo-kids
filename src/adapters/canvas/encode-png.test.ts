import pako from 'pako';
import { describe, expect, it } from 'vitest';
import { encodeRgbaPng } from './encode-png';

function chunks(bytes: Uint8Array): Map<string, Uint8Array> {
  const result = new Map<string, Uint8Array>();
  for (let offset = 8; offset < bytes.byteLength;) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, bytes.byteLength - offset);
    const length = view.getUint32(0);
    const type = new TextDecoder().decode(bytes.subarray(offset + 4, offset + 8));
    result.set(type, bytes.slice(offset + 8, offset + 8 + length));
    offset += 12 + length;
  }
  return result;
}

describe('deterministic PNG encoder', () => {
  it('encodes exact RGBA scanlines with stable PNG bytes', () => {
    const rgba = Uint8Array.from([
      255, 0, 0, 255,
      0, 255, 0, 128,
    ]);
    const first = encodeRgbaPng(2, 1, rgba);
    const second = encodeRgbaPng(2, 1, rgba);
    const parsed = chunks(first);
    const ihdr = parsed.get('IHDR');
    const idat = parsed.get('IDAT');

    expect(first).toEqual(second);
    expect(Array.from(first.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(ihdr).toBeDefined();
    expect(new DataView(ihdr?.buffer ?? new ArrayBuffer(0), ihdr?.byteOffset ?? 0).getUint32(0)).toBe(2);
    expect(new DataView(ihdr?.buffer ?? new ArrayBuffer(0), ihdr?.byteOffset ?? 0).getUint32(4)).toBe(1);
    expect(Array.from(pako.inflate(idat ?? new Uint8Array()))).toEqual([0, ...rgba]);
    expect(parsed.get('IEND')).toEqual(new Uint8Array());
  });

  it('rejects invalid dimensions and mismatched pixel buffers', () => {
    expect(() => encodeRgbaPng(0, 1, new Uint8Array())).toThrow('dimensions');
    expect(() => encodeRgbaPng(2, 1, new Uint8Array(4))).toThrow('does not match');
  });
});
