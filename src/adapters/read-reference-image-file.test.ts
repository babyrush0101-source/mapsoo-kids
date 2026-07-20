import { describe, expect, it } from 'vitest';

import { encodeRgbaPng } from './canvas/encode-png';
import { readBrowserReferenceImage } from './read-reference-image-file';

describe('browser reference image reader', () => {
  it('uses a canonical public-safe path instead of the local filename', async () => {
    const bytes = encodeRgbaPng(2, 3, new Uint8Array(2 * 3 * 4).fill(180));
    const file = new File([bytes.slice().buffer], 'private-child-name.png', { type: 'image/png' });
    const result = await readBrowserReferenceImage(file, 'character');
    expect(result.descriptor).toMatchObject({
      id: 'character-reference', path: 'references/character.png', width: 2, height: 3,
      rights: { allowGenerativeAdaptation: true, allowOutputRedistribution: true, allowOutputCc0Dedication: true },
    });
    expect(JSON.stringify(result.descriptor)).not.toContain('private-child-name');
  });

  it('rejects spoofed media and unsupported file types', async () => {
    await expect(readBrowserReferenceImage(new File(['not png'], 'fake.png', { type: 'image/png' }), 'environment-style')).rejects.toThrow(/PNG or JPEG bytes/);
    await expect(readBrowserReferenceImage(new File(['x'], 'fake.webp', { type: 'image/webp' }), 'environment-style')).rejects.toThrow(/PNG or JPEG bytes/);
  });
});
