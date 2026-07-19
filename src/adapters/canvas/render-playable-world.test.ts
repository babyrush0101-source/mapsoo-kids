import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateWorld } from '../../core/generate-world';
import type { ResolvedWorldPlace } from '../../core/semantic-places';
import type { ResolvedWorldStructure } from '../../core/semantic-structures';
import {
  ALPHA6_DEFAULT_WORLD_SPEC,
  DEFAULT_WORLD_SPEC,
  PLACE_KINDS,
  STRUCTURE_ARCHETYPES,
} from '../../core/world-spec';
import {
  drawSemanticPlaceMarker,
  drawSemanticStructure,
  renderSemanticPlacesAtlas,
  renderSemanticPlacesOverlay,
  renderSemanticStructuresAtlas,
  renderSemanticStructuresOverlay,
} from './render-playable-world';

function place(overrides: Partial<ResolvedWorldPlace> = {}): ResolvedWorldPlace {
  return {
    id: 'spawn',
    order: 0,
    label: 'Safe Spawn',
    kind: 'spawn',
    placement: 'center',
    tags: [],
    cell: { x: 2, y: 3 },
    pixelCenter: { x: 999, y: 999 },
    ...overrides,
  };
}

function mockContext(): CanvasRenderingContext2D {
  return {
    fillRect: vi.fn(),
    fillText: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe('renderSemanticPlacesOverlay', () => {
  it('draws bounded kind markers and labels at resolver cells', () => {
    const context = mockContext();
    const places = [
      place(),
      place({ id: 'landmark', order: 1, label: 'Old Oak', kind: 'landmark', cell: { x: 4, y: 1 } }),
      place({ id: 'exit', order: 2, label: 'North Exit', kind: 'exit', cell: { x: 0, y: 0 } }),
    ];

    renderSemanticPlacesOverlay(context, places, 20, 100, 80);

    expect(context.save).toHaveBeenCalledOnce();
    expect(context.restore).toHaveBeenCalledOnce();
    expect(context.fillRect).toHaveBeenCalledWith(44, 64, 12, 12);
    expect(context.fillRect).toHaveBeenCalledWith(84, 24, 12, 12);
    expect(context.fillRect).toHaveBeenCalledWith(4, 4, 12, 12);
    expect(context.fillText).toHaveBeenCalledWith('Safe Spawn', expect.any(Number), expect.any(Number), expect.any(Number));
  });

  it('uses cell coordinates rather than independently interpreting pixelCenter', () => {
    const context = mockContext();

    renderSemanticPlacesOverlay(context, [place({ cell: { x: 1, y: 1 }, pixelCenter: { x: 999, y: 999 } })], 16, 64, 64);

    expect(context.fillRect).toHaveBeenCalledWith(19, 19, 10, 10);
    expect(context.fillRect).not.toHaveBeenCalledWith(994, 994, 10, 10);
  });

  it('limits long labels before sending text to Canvas', () => {
    const context = mockContext();
    const longLabel = 'A'.repeat(80);

    renderSemanticPlacesOverlay(context, [place({ label: longLabel })], 20, 100, 80);

    expect(context.fillText).toHaveBeenCalledWith('A'.repeat(32), expect.any(Number), expect.any(Number), 122);
    expect(context.fillText).not.toHaveBeenCalledWith(longLabel, expect.any(Number), expect.any(Number), expect.any(Number));
  });

  it('moves a later label when the preferred label rectangle is occupied', () => {
    const context = mockContext();
    renderSemanticPlacesOverlay(context, [
      place({ id: 'one', label: 'First Place', cell: { x: 2, y: 2 } }),
      place({ id: 'two', label: 'Second Place', cell: { x: 3, y: 2 } }),
    ], 20, 120, 80);

    const labelCalls = (context.fillText as ReturnType<typeof vi.fn>).mock.calls;
    expect(labelCalls).toHaveLength(2);
    expect(labelCalls[1][2]).not.toBe(labelCalls[0][2]);
  });
});

describe('semantic place marker atlas', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('provides a font-independent drawing path for every contract kind', () => {
    for (const kind of PLACE_KINDS) {
      const context = mockContext();
      drawSemanticPlaceMarker(context, kind, 4, 8, 32);
      expect(context.fillRect).toHaveBeenCalledWith(8, 12, 24, 24);
      expect(context.fillText).not.toHaveBeenCalled();
    }
  });

  it('renders all six kinds in stable contract order as single-cell icons', () => {
    const context = mockContext();
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => context),
    };
    vi.stubGlobal('document', { createElement: vi.fn(() => canvas) });

    const result = renderSemanticPlacesAtlas(generateWorld(DEFAULT_WORLD_SPEC));

    expect(result).toBe(canvas);
    expect(canvas.width).toBe(PLACE_KINDS.length * DEFAULT_WORLD_SPEC.visual.tileSize);
    expect(canvas.height).toBe(DEFAULT_WORLD_SPEC.visual.tileSize);
    expect(context.clearRect).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
    PLACE_KINDS.forEach((_, index) => {
      expect(context.fillRect).toHaveBeenCalledWith(
        index * DEFAULT_WORLD_SPEC.visual.tileSize + 4,
        4,
        DEFAULT_WORLD_SPEC.visual.tileSize - 8,
        DEFAULT_WORLD_SPEC.visual.tileSize - 8,
      );
    });
  });
});

describe('semantic structure art', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('draws every archetype procedurally without font rasterization', () => {
    const world = generateWorld(ALPHA6_DEFAULT_WORLD_SPEC);
    for (const archetype of STRUCTURE_ARCHETYPES) {
      const context = mockContext();
      drawSemanticStructure(context, world, archetype, 0, 0, 32);
      expect(context.fillRect).toHaveBeenCalled();
      expect(context.fillText).not.toHaveBeenCalled();
    }
  });

  it('clears transparency and renders a stable one-row 2x2-tile atlas in contract order', () => {
    const context = mockContext();
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => context),
    };
    vi.stubGlobal('document', { createElement: vi.fn(() => canvas) });

    const result = renderSemanticStructuresAtlas(generateWorld(ALPHA6_DEFAULT_WORLD_SPEC));

    expect(result).toBe(canvas);
    expect(canvas.width).toBe(STRUCTURE_ARCHETYPES.length * ALPHA6_DEFAULT_WORLD_SPEC.visual.tileSize * 2);
    expect(canvas.height).toBe(ALPHA6_DEFAULT_WORLD_SPEC.visual.tileSize * 2);
    expect(context.clearRect).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
    expect(context.fillRect).toHaveBeenCalledWith(8, 28, 48, 32); // cottage
    expect(context.fillRect).toHaveBeenCalledWith(72, 24, 48, 36); // workshop
    expect(context.fillRect).toHaveBeenCalledWith(144, 8, 32, 52); // tower
    expect(context.fillRect).toHaveBeenCalledWith(204, 20, 40, 40); // shrine
  });

  it('uses the resolved cell as a bottom-center foot point and ignores pixelCenter', () => {
    const context = mockContext();
    const world = generateWorld(ALPHA6_DEFAULT_WORLD_SPEC);
    const structure: ResolvedWorldStructure = {
      id: 'edge-cottage',
      order: 0,
      placeId: 'spawn',
      archetype: 'cottage',
      cell: { x: 0, y: 0 },
      pixelCenter: { x: 999, y: 999 },
    };

    renderSemanticStructuresOverlay(context, world, [structure], 16);

    // Sprite starts above/left of the surface; the Canvas itself clips it.
    expect(context.fillRect).toHaveBeenCalledWith(-4, -2, 24, 16);
    expect(context.fillRect).not.toHaveBeenCalledWith(999, 999, expect.any(Number), expect.any(Number));
  });
});
