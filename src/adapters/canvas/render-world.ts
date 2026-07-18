import type { GeneratedWorld, PropKind, WorldProp } from '../../core/world-spec';

export type PixelRect = Readonly<{
  left: number;
  top: number;
  width: number;
  height: number;
}>;

/**
 * Snaps both edges of a rectangle to the pixel grid. Keeping this conversion in
 * one place prevents fractional Canvas coordinates from introducing softened
 * edges, even when an icon uses proportional dimensions internally.
 */
export function normalizePixelRect(left: number, top: number, width: number, height: number): PixelRect {
  const pixelLeft = Math.round(left);
  const pixelTop = Math.round(top);
  const pixelRight = Math.round(left + width);
  const pixelBottom = Math.round(top + height);

  return {
    left: pixelLeft,
    top: pixelTop,
    width: Math.max(1, pixelRight - pixelLeft),
    height: Math.max(1, pixelBottom - pixelTop),
  };
}

function fillPixelRect(
  context: CanvasRenderingContext2D,
  left: number,
  top: number,
  width: number,
  height: number,
) {
  const rectangle = normalizePixelRect(left, top, width, height);
  context.fillRect(rectangle.left, rectangle.top, rectangle.width, rectangle.height);
}

function drawTilePattern(
  context: CanvasRenderingContext2D,
  name: GeneratedWorld['tiles'][number]['name'],
  left: number,
  top: number,
  size: number,
  accent: string,
) {
  context.fillStyle = accent;

  if (name === 'water') {
    fillPixelRect(context, left + size * 0.15, top + size * 0.35, size * 0.35, size * 0.07);
    fillPixelRect(context, left + size * 0.55, top + size * 0.7, size * 0.3, size * 0.07);
  } else if (name === 'path') {
    context.globalAlpha = 0.28;
    fillPixelRect(context, left, top, size, size * 0.08);
    context.globalAlpha = 1;
  } else if (name === 'detail') {
    fillPixelRect(context, left + size * 0.2, top + size * 0.2, size * 0.16, size * 0.16);
    fillPixelRect(context, left + size * 0.68, top + size * 0.58, size * 0.12, size * 0.12);
  } else {
    context.globalAlpha = 0.16;
    fillPixelRect(context, left + size * 0.12, top + size * 0.18, size * 0.1, size * 0.1);
    fillPixelRect(context, left + size * 0.7, top + size * 0.62, size * 0.08, size * 0.08);
    context.globalAlpha = 1;
  }
}

export function drawPropIcon(
  context: CanvasRenderingContext2D,
  kind: PropKind,
  left: number,
  top: number,
  size: number,
  dark: string,
  detail: string,
) {
  const centerX = left + size / 2;

  if (kind === 'tree') {
    context.fillStyle = dark;
    fillPixelRect(context, centerX - size * 0.08, top + size * 0.5, size * 0.16, size * 0.38);
    context.fillStyle = detail;
    fillPixelRect(context, left + size * 0.2, top + size * 0.1, size * 0.6, size * 0.55);
    fillPixelRect(context, left + size * 0.1, top + size * 0.25, size * 0.8, size * 0.25);
  } else if (kind === 'rock') {
    context.fillStyle = dark;
    fillPixelRect(context, left + size * 0.24, top + size * 0.48, size * 0.54, size * 0.3);
    context.fillStyle = '#ffffff55';
    fillPixelRect(context, left + size * 0.34, top + size * 0.5, size * 0.2, size * 0.08);
  } else {
    context.fillStyle = detail;
    fillPixelRect(context, left + size * 0.42, top + size * 0.3, size * 0.16, size * 0.48);
    context.fillStyle = '#fff1a8';
    fillPixelRect(context, left + size * 0.3, top + size * 0.18, size * 0.4, size * 0.24);
  }
}

export function renderWorldToCanvas(canvas: HTMLCanvasElement, world: GeneratedWorld, cellSize: number) {
  const { width, height } = world.spec.map;
  const pixelCellSize = Math.max(1, Math.round(cellSize));
  canvas.width = width * pixelCellSize;
  canvas.height = height * pixelCellSize;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable.');

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;

  world.ground.forEach((tileId, index) => {
    const tile = world.tiles.find((candidate) => candidate.id === tileId) ?? world.tiles[0];
    const x = index % width;
    const y = Math.floor(index / width);
    const left = x * pixelCellSize;
    const top = y * pixelCellSize;

    context.fillStyle = tile.color;
    fillPixelRect(context, left, top, pixelCellSize, pixelCellSize);
    drawTilePattern(context, tile.name, left, top, pixelCellSize, tile.accent);
  });

  const [dark, , detail] = world.spec.visual.palette;
  world.props.forEach((prop: WorldProp) => {
    drawPropIcon(
      context,
      prop.kind,
      prop.x * pixelCellSize,
      prop.y * pixelCellSize,
      pixelCellSize,
      dark,
      detail,
    );
  });
}

export function renderTerrainAtlas(world: GeneratedWorld): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const size = world.spec.visual.tileSize;
  canvas.width = size * world.tiles.length;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable.');

  context.imageSmoothingEnabled = false;
  world.tiles.forEach((tile, index) => {
    const left = index * size;
    context.fillStyle = tile.color;
    fillPixelRect(context, left, 0, size, size);
    drawTilePattern(context, tile.name, left, 0, size, tile.accent);
  });
  return canvas;
}

export function renderPropsAtlas(world: GeneratedWorld): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const size = world.spec.visual.tileSize;
  const kinds: PropKind[] = ['tree', 'rock', 'flower'];
  canvas.width = size * kinds.length;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable.');

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;
  const [dark, , detail] = world.spec.visual.palette;
  kinds.forEach((kind, index) => drawPropIcon(context, kind, index * size, 0, size, dark, detail));
  return canvas;
}
