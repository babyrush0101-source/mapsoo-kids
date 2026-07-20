import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ReferenceWorldGenerator } from './ReferenceWorldGenerator';

describe('reference world generator UI', () => {
  it('renders the complete farm workflow without claiming unsupported profiles', () => {
    const markup = renderToStaticMarkup(createElement(ReferenceWorldGenerator));
    expect(markup).toContain('Environment style');
    expect(markup).toContain('Character reference');
    expect(markup).toContain('allow generative adaptation plus redistribution');
    expect(markup).toContain('Generate complete farm pack');
    expect(markup).toContain('Side platformer, isometric action and layered-depth 2D remain planned');
    expect(markup).toContain('No reference images embedded');
    expect(markup).not.toContain('private/');
  });
});
