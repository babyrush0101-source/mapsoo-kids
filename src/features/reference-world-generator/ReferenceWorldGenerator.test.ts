import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ReferenceWorldGenerator } from './ReferenceWorldGenerator';

describe('reference world generator UI', () => {
  it('renders the published farm path and keeps unimplemented profiles disabled', () => {
    const markup = renderToStaticMarkup(createElement(ReferenceWorldGenerator, null));
    expect(markup).toContain('Environment style');
    expect(markup).toContain('Character reference');
    expect(markup).toContain('allow generative adaptation, redistribution, and CC0 dedication');
    expect(markup).toContain('World ID and seed are public');
    expect(markup).toContain('Generate complete farm pack');
    expect(markup).toContain('Side platformer — experimental Alpha10 candidate');
    expect(markup).toContain('Isometric action — planned');
    expect(markup).toContain('Layered-depth 2D — planned');
    expect(markup).toContain('value="isometric-action" disabled=""');
    expect(markup).toContain('value="layered-depth-2d" disabled=""');
    expect(markup).toContain('Godot 4.3+ importer verified');
    expect(markup).toContain('No reference images embedded');
    expect(markup).not.toContain('private/');
  });

  it('renders the Alpha10 side source-pack path without claiming a finished Godot importer', () => {
    const markup = renderToStaticMarkup(createElement(ReferenceWorldGenerator, { initialProfile: 'side-platformer' }));
    expect(markup).toContain('Generate complete side-platformer pack');
    expect(markup).toContain('Pack 0.7');
    expect(markup).toContain('Alpha10 candidate');
    expect(markup).toContain('Godot importer planned');
    expect(markup).not.toContain('Side platformer is implemented end to end');
  });
});
