import { describe, expect, it } from 'vitest';
import { generateWorld } from './generate-world';
import { generatePlayableWorld, PLAYABLE_PROP_KINDS } from './generate-playable-world';
import {
  PROCEDURAL_TERRAIN_GENERATOR_ID,
  PROCEDURAL_TERRAIN_GENERATOR_VERSION,
} from './generator-identity';
import { BIOME_PALETTES, DEFAULT_WORLD_SPEC, cloneWorldSpec } from './world-spec';
import { validateGeneratedWorld } from './validate-world';

describe('playable terrain world generation', () => {
  it('uses a new identity without changing the published v1 semantic map or positions', () => {
    const legacy = generateWorld(DEFAULT_WORLD_SPEC);
    const playable = generatePlayableWorld(DEFAULT_WORLD_SPEC);

    expect(playable.generator).toEqual({
      id: PROCEDURAL_TERRAIN_GENERATOR_ID,
      version: PROCEDURAL_TERRAIN_GENERATOR_VERSION,
    });
    expect(playable.ground).toEqual(legacy.ground);
    expect(playable.props.map(({ x, y }) => [x, y])).toEqual(legacy.props.map(({ x, y }) => [x, y]));
    expect(playable.props).not.toEqual(legacy.props);
  });

  it('is deterministic and uses all six prop definitions across stable biome fixtures', () => {
    const kinds = new Set<string>();
    for (const biome of ['meadow', 'desert', 'snow'] as const) {
      for (let variant = 0; variant < 4; variant += 1) {
        const spec = cloneWorldSpec(DEFAULT_WORLD_SPEC);
        spec.id = `${biome}-terrain-${variant}`;
        spec.seed = `mapsoo-${biome}-terrain-${variant}`;
        spec.map.biome = biome;
        spec.visual.palette = [...BIOME_PALETTES[biome]];
        const first = generatePlayableWorld(spec);
        const second = generatePlayableWorld(spec);
        expect(second).toEqual(first);
        first.props.forEach((prop) => kinds.add(prop.kind));
      }
    }
    expect([...kinds].sort()).toEqual([...PLAYABLE_PROP_KINDS].sort());
  });

  it('passes the generated-world contract', () => {
    expect(validateGeneratedWorld(generatePlayableWorld(DEFAULT_WORLD_SPEC)))
      .not.toEqual(expect.arrayContaining([expect.objectContaining({ severity: 'error' })]));
  });
});
