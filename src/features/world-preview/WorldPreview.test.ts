import { describe, expect, it } from 'vitest';
import { generateWorld } from '../../core/generate-world';
import { DEFAULT_WORLD_SPEC, cloneWorldSpec } from '../../core/world-spec';
import { resolveWorldPreviewPlaces } from './WorldPreview';

describe('resolveWorldPreviewPlaces', () => {
  it('exposes the resolver records used by both the list and overlay', () => {
    const world = generateWorld(DEFAULT_WORLD_SPEC);

    const state = resolveWorldPreviewPlaces(world);

    expect(state.status).toBe('ready');
    if (state.status === 'ready') {
      expect(state.places.map(({ id, kind }) => ({ id, kind }))).toEqual([
        { id: 'spawn', kind: 'spawn' },
        { id: 'landmark', kind: 'landmark' },
        { id: 'exit', kind: 'exit' },
      ]);
    }
  });

  it('turns an unsatisfied placement into an actionable UI state', () => {
    const spec = cloneWorldSpec(DEFAULT_WORLD_SPEC);
    spec.places = [{
      id: 'missing-road',
      label: 'Missing Road',
      kind: 'exit',
      placement: 'on-road',
      tags: ['test'],
    }];
    const world = generateWorld(spec);
    const pathId = world.tiles.find(({ name }) => name === 'path')?.id;
    world.ground = world.ground.map((tileId) => tileId === pathId ? 0 : tileId);

    expect(resolveWorldPreviewPlaces(world)).toEqual({
      status: 'error',
      code: 'place.unsatisfied-placement',
      message: 'Could not resolve place "missing-road": no unoccupied walkable cell satisfies "on-road".',
    });
  });

  it('reports malformed generated terrain instead of throwing through React', () => {
    const world = generateWorld(DEFAULT_WORLD_SPEC);
    world.ground = [];

    expect(resolveWorldPreviewPlaces(world)).toMatchObject({
      status: 'error',
      code: 'place.invalid-world',
      message: expect.stringContaining('ground must contain exactly'),
    });
  });
});
