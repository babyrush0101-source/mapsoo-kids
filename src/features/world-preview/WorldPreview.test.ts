import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { generateWorld } from '../../core/generate-world';
import {
  ALPHA6_DEFAULT_WORLD_SPEC,
  DEFAULT_WORLD_SPEC,
  cloneWorldSpec,
  type WorldSpecV030,
} from '../../core/world-spec';
import {
  WorldPreview,
  resolveWorldPreviewPlaces,
  resolveWorldPreviewStructures,
} from './WorldPreview';

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

describe('resolveWorldPreviewStructures', () => {
  it('exposes stable resolved records shared by the list and Canvas overlay', () => {
    const state = resolveWorldPreviewStructures(generateWorld(ALPHA6_DEFAULT_WORLD_SPEC));

    expect(state).toMatchObject({
      status: 'ready',
      structures: [
        { id: 'spawn-cottage', archetype: 'cottage', placeId: 'spawn' },
        { id: 'landmark-shrine', archetype: 'shrine', placeId: 'landmark' },
      ],
    });
  });

  it('converts structure and terrain resolver failures into UI errors', () => {
    const orphanWorld = generateWorld(ALPHA6_DEFAULT_WORLD_SPEC);
    (orphanWorld.spec as WorldSpecV030).structures = [
      { id: 'orphan', placeId: 'missing', archetype: 'tower' },
    ];
    expect(resolveWorldPreviewStructures(orphanWorld)).toEqual({
      status: 'error',
      code: 'structure.missing-place',
      message: 'Could not resolve structure "orphan": place "missing" was not resolved.',
    });

    const malformedWorld = generateWorld(ALPHA6_DEFAULT_WORLD_SPEC);
    malformedWorld.ground = [];
    expect(resolveWorldPreviewStructures(malformedWorld)).toMatchObject({
      status: 'error',
      code: 'structure.invalid-world',
      message: expect.stringContaining('ground must contain exactly'),
    });
  });
});

describe('WorldPreview structure UI', () => {
  it('renders an independent enabled structure toggle and the complete readable list', () => {
    const html = renderToStaticMarkup(createElement(WorldPreview, {
      world: generateWorld(ALPHA6_DEFAULT_WORLD_SPEC),
    }));

    expect(html).toContain('aria-controls="semantic-structure-list"');
    expect(html).toContain('aria-controls="semantic-place-list"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('<strong>spawn-cottage</strong>');
    expect(html).toContain('cottage · place spawn · cell ');
    expect(html).toContain('<strong>landmark-shrine</strong>');
    expect(html).toContain('shrine · place landmark · cell ');
  });

  it('shows a disabled structure toggle and explicit empty state without affecting places', () => {
    const html = renderToStaticMarkup(createElement(WorldPreview, {
      world: generateWorld(DEFAULT_WORLD_SPEC),
    }));

    expect(html).toContain('No semantic structures are declared.');
    expect(html).toMatch(/class="structures-toggle"[^>]*aria-pressed="false"[^>]*disabled/);
    expect(html).toMatch(/class="places-toggle"[^>]*aria-pressed="true"/);
  });

  it('renders a structure resolution alert instead of throwing through React', () => {
    const world = generateWorld(ALPHA6_DEFAULT_WORLD_SPEC);
    (world.spec as WorldSpecV030).structures = [
      { id: 'orphan', placeId: 'missing', archetype: 'tower' },
    ];

    expect(() => renderToStaticMarkup(createElement(WorldPreview, { world }))).not.toThrow();
    const html = renderToStaticMarkup(createElement(WorldPreview, { world }));
    expect(html).toContain('role="alert"');
    expect(html).toContain('structure.missing-place');
  });
});
