import { describe, expect, it } from 'vitest';
import { generateWorld } from '../core/generate-world';
import { validateGeneratedWorld, validateWorldSpec } from '../core/validate-world';
import {
  WORLD_EXAMPLES,
  cloneWorldExampleSpec,
  findMatchingWorldExample,
  getWorldExample,
} from './world-example-registry';

describe('Alpha.7 world example registry', () => {
  it('registers one deeply frozen candidate for every supported biome', () => {
    expect(WORLD_EXAMPLES.map((example) => [example.id, example.biome, example.status])).toEqual([
      ['sunny-meadow', 'meadow', 'candidate'],
      ['dustwind-outpost', 'desert', 'candidate'],
      ['frostwatch-vale', 'snow', 'candidate'],
    ]);
    expect(Object.isFrozen(WORLD_EXAMPLES)).toBe(true);
    for (const example of WORLD_EXAMPLES) {
      expect(Object.isFrozen(example)).toBe(true);
      expect(Object.isFrozen(example.spec)).toBe(true);
      expect(Object.isFrozen(example.spec.visual.palette)).toBe(true);
      expect(validateWorldSpec(example.spec).some((issue) => issue.severity === 'error')).toBe(false);
    }
  });

  it('clones examples without exposing the trusted registry to mutation', () => {
    const clone = cloneWorldExampleSpec('dustwind-outpost');
    expect(findMatchingWorldExample(clone)?.id).toBe('dustwind-outpost');
    clone.title = 'Edited locally';
    clone.visual.palette[0] = '#000000';

    expect(findMatchingWorldExample(clone)).toBeUndefined();
    expect(getWorldExample('dustwind-outpost')?.spec.title).toBe('Dustwind Outpost');
    expect(getWorldExample('dustwind-outpost')?.spec.visual.palette[0]).toBe('#6f4e37');
    expect(getWorldExample('unknown')).toBeUndefined();
  });

  it('generates every candidate deterministically and without validation errors', () => {
    for (const example of WORLD_EXAMPLES) {
      const first = generateWorld(example.spec);
      const second = generateWorld(example.spec);

      expect(second).toEqual(first);
      expect(validateGeneratedWorld(first).some((issue) => issue.severity === 'error')).toBe(false);
      expect(first.spec.id).toBe(example.id);
      expect(first.spec.map.biome).toBe(example.biome);
    }
  });
});
