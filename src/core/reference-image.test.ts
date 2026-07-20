import { describe, expect, it } from 'vitest';

import {
  MAX_REFERENCE_IMAGE_BYTES,
  MAX_REFERENCE_IMAGE_PIXELS,
  ReferenceImageError,
  bindReferenceImage,
  materializeReferenceImageDescriptor,
  type ReferenceImageDescriptor,
} from './reference-image';

const PNG_2_BY_3_SHA256 = 'b63355f9a1f6274e48ef9c27ab6d683c460bf87cb4eefe3139711bcbea77c75c';

function png(width = 2, height = 3): Uint8Array {
  const bytes = new Uint8Array(33);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 13);
  bytes.set([73, 72, 68, 82], 12);
  view.setUint32(16, width);
  view.setUint32(20, height);
  bytes.set([8, 6, 0, 0, 0], 24);
  return bytes;
}

function descriptor(bytes: Uint8Array, overrides: Partial<ReferenceImageDescriptor> = {}): ReferenceImageDescriptor {
  return {
    id: 'environment-reference',
    role: 'environment-style',
    path: 'references/environment.png',
    mediaType: 'image/png',
    byteLength: bytes.byteLength,
    width: 2,
    height: 3,
    sha256: PNG_2_BY_3_SHA256,
    rights: {
      basis: 'owned',
      license: 'LicenseRef-User-Owned',
      allowGenerativeAdaptation: true,
      allowOutputRedistribution: true,
    },
    ...overrides,
  };
}

describe('reference image safety contract', () => {
  it('binds copied PNG bytes to strict JSON-safe metadata', async () => {
    const source = png();
    const bound = await bindReferenceImage(descriptor(source), source);

    source[0] = 0;
    const firstRead = bound.readBytes();
    expect(firstRead[0]).toBe(137);
    firstRead[0] = 0;
    expect(bound.readBytes()[0]).toBe(137);
    expect(bound.descriptor.width * bound.descriptor.height).toBe(6);
    expect(JSON.stringify(bound.descriptor)).not.toContain('137,80,78');
  });

  it('rejects MIME magic, dimensions, byte length, and hash mismatches', async () => {
    const bytes = png();
    await expect(bindReferenceImage(descriptor(bytes, { mediaType: 'image/jpeg' }), bytes)).rejects.toMatchObject({
      code: 'reference.mime-mismatch',
    });
    await expect(bindReferenceImage(descriptor(bytes, { width: 4 }), bytes)).rejects.toMatchObject({
      code: 'reference.dimension-mismatch',
    });
    await expect(bindReferenceImage(descriptor(bytes, { byteLength: bytes.byteLength + 1 }), bytes)).rejects.toMatchObject({
      code: 'reference.invalid-bytes',
    });
    await expect(bindReferenceImage(descriptor(bytes, { sha256: '0'.repeat(64) }), bytes)).rejects.toMatchObject({
      code: 'reference.hash-mismatch',
    });
  });

  it('fails closed on unsafe paths, unknown fields, size/pixel excess, and incomplete rights', () => {
    const bytes = png();
    expect(() => materializeReferenceImageDescriptor({
      ...descriptor(bytes),
      path: '../private.png',
    })).toThrow(ReferenceImageError);
    expect(() => materializeReferenceImageDescriptor({
      ...descriptor(bytes),
      privatePrompt: 'must-not-cross-the-boundary',
    })).toThrow(/declared fields/);
    expect(() => materializeReferenceImageDescriptor({
      ...descriptor(bytes),
      byteLength: MAX_REFERENCE_IMAGE_BYTES + 1,
    })).toThrow(/byteLength/);
    expect(() => materializeReferenceImageDescriptor({
      ...descriptor(bytes),
      width: 4097,
      height: 4097,
    })).toThrow(new RegExp(String(MAX_REFERENCE_IMAGE_PIXELS)));
    expect(() => materializeReferenceImageDescriptor({
      ...descriptor(bytes),
      rights: { basis: 'owned', license: 'LicenseRef-User-Owned', allowGenerativeAdaptation: false, allowOutputRedistribution: true },
    })).toThrow(/explicitly allow/);
    expect(() => materializeReferenceImageDescriptor({
      ...descriptor(bytes),
      rights: { basis: 'licensed', license: 'CC-BY-4.0', allowGenerativeAdaptation: true, allowOutputRedistribution: true },
    })).toThrow(/attribution/);
    expect(() => materializeReferenceImageDescriptor({
      ...descriptor(bytes),
      rights: { basis: 'owned', license: 'LicenseRef-User-Owned', allowGenerativeAdaptation: true, allowOutputRedistribution: false },
    })).toThrow(/output redistribution/);
  });
});
