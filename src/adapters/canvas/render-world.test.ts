import { describe, expect, it } from 'vitest';
import { normalizePixelRect } from './render-world';

describe('normalizePixelRect', () => {
  it('snaps proportional drawing coordinates and dimensions to integers', () => {
    const rectangle = normalizePixelRect(4.8, 5.2, 3.6, 1.1);

    expect(rectangle).toEqual({ left: 5, top: 5, width: 3, height: 1 });
    expect(Object.values(rectangle).every(Number.isInteger)).toBe(true);
  });

  it('keeps sub-pixel details visible as one pixel', () => {
    expect(normalizePixelRect(1.2, 2.8, 0.2, 0.2)).toEqual({
      left: 1,
      top: 3,
      width: 1,
      height: 1,
    });
  });
});
