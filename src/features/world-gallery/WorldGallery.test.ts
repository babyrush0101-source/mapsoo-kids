import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { WORLD_EXAMPLES } from '../../app/world-example-registry';
import { WorldGallery } from './WorldGallery';

describe('WorldGallery', () => {
  it('renders all three candidates with explicit candidate and active states', () => {
    const html = renderToStaticMarkup(createElement(WorldGallery, {
      examples: WORLD_EXAMPLES,
      activeWorldId: 'dustwind-outpost',
      loadingWorldId: null,
      disabled: false,
      onSelect: vi.fn(),
    }));

    expect(html).toContain('Alpha.7 candidate gallery');
    expect(html).toContain('Sunny Meadow');
    expect(html).toContain('Dustwind Outpost');
    expect(html).toContain('Frostwatch Vale');
    expect(html).toContain('Candidate status is not a published Alpha.7 release.');
    expect(html).toContain('gallery-biome-desert is-active');
    expect(html).toContain('--gallery-dark:#6f4e37');
    expect(html).toContain('--gallery-light:#e9c46a');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('Loaded in Workbench');
  });

  it('marks the selected candidate as loading and disables every action during generation', () => {
    const html = renderToStaticMarkup(createElement(WorldGallery, {
      examples: WORLD_EXAMPLES,
      activeWorldId: 'sunny-meadow',
      loadingWorldId: 'frostwatch-vale',
      disabled: true,
      onSelect: vi.fn(),
    }));

    expect(html).toContain('Generating…');
    expect(html.match(/disabled=""/g)).toHaveLength(3);
  });
});
