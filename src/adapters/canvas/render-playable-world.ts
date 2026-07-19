import {
  EMPTY_TERRAIN_CELL,
  PLAYABLE_TERRAIN_ATLAS_COLUMNS,
  PLAYABLE_TERRAIN_ATLAS_ROWS,
  PLAYABLE_TERRAIN_TILE_DEFINITIONS,
  projectPlayableTerrain,
  type PlayableTerrainTileDefinition,
} from '../../core/playable-terrain';
import { PLAYABLE_PROP_KINDS } from '../../core/generate-playable-world';
import type { BiomeId, GeneratedWorld, PropKind } from '../../core/world-spec';
import { normalizePixelRect } from './render-world';

function fillRect(
  context: CanvasRenderingContext2D,
  left: number,
  top: number,
  width: number,
  height: number,
): void {
  const rect = normalizePixelRect(left, top, width, height);
  context.fillRect(rect.left, rect.top, rect.width, rect.height);
}

function drawGroundTile(
  context: CanvasRenderingContext2D,
  world: GeneratedWorld,
  definition: PlayableTerrainTileDefinition,
  left: number,
  top: number,
  size: number,
): void {
  const [dark, ground, detail] = world.spec.visual.palette;
  context.fillStyle = ground;
  fillRect(context, left, top, size, size);
  context.fillStyle = definition.tileId === 2 ? detail : dark;
  context.globalAlpha = definition.tileId === 2 ? 0.5 : 0.14;
  const offset = definition.tileId === 1 ? 0.64 : 0.18;
  fillRect(context, left + size * offset, top + size * 0.2, size * 0.12, size * 0.12);
  fillRect(context, left + size * (1 - offset - 0.1), top + size * 0.68, size * 0.1, size * 0.1);
  if (definition.tileId === 2) {
    fillRect(context, left + size * 0.45, top + size * 0.42, size * 0.1, size * 0.18);
  }
  context.globalAlpha = 1;
}

function drawMaskedCross(
  context: CanvasRenderingContext2D,
  mask: number,
  left: number,
  top: number,
  size: number,
  color: string,
  accent: string,
  water: boolean,
): void {
  const breadth = water ? 0.72 : 0.48;
  const inset = (1 - breadth) / 2;
  const centerStart = inset;
  const centerEnd = 1 - inset;

  context.fillStyle = accent;
  const outline = Math.max(1, Math.round(size * 0.06));
  fillRect(
    context,
    left + size * centerStart - outline,
    top + size * centerStart - outline,
    size * breadth + outline * 2,
    size * breadth + outline * 2,
  );
  if (mask & 1) fillRect(context, left + size * centerStart - outline, top, size * breadth + outline * 2, size * centerEnd);
  if (mask & 2) fillRect(context, left + size * centerStart, top + size * centerStart - outline, size * centerEnd, size * breadth + outline * 2);
  if (mask & 4) fillRect(context, left + size * centerStart - outline, top + size * centerStart, size * breadth + outline * 2, size * centerEnd);
  if (mask & 8) fillRect(context, left, top + size * centerStart - outline, size * centerEnd, size * breadth + outline * 2);

  context.fillStyle = color;
  fillRect(context, left + size * centerStart, top + size * centerStart, size * breadth, size * breadth);
  if (mask & 1) fillRect(context, left + size * centerStart, top, size * breadth, size * centerEnd);
  if (mask & 2) fillRect(context, left + size * centerStart, top + size * centerStart, size * centerEnd, size * breadth);
  if (mask & 4) fillRect(context, left + size * centerStart, top + size * centerStart, size * breadth, size * centerEnd);
  if (mask & 8) fillRect(context, left, top + size * centerStart, size * centerEnd, size * breadth);

  context.fillStyle = water ? '#ffffff55' : accent;
  context.globalAlpha = water ? 0.55 : 0.35;
  if (water) {
    fillRect(context, left + size * 0.28, top + size * 0.42, size * 0.28, size * 0.06);
  } else {
    fillRect(context, left + size * 0.44, top + size * 0.44, size * 0.12, size * 0.12);
  }
  context.globalAlpha = 1;
}

function drawTerrainTile(
  context: CanvasRenderingContext2D,
  world: GeneratedWorld,
  definition: PlayableTerrainTileDefinition,
  left: number,
  top: number,
  size: number,
): void {
  if (definition.layer === 'ground') {
    drawGroundTile(context, world, definition, left, top, size);
    return;
  }
  const [dark, , , water, road] = world.spec.visual.palette;
  drawMaskedCross(
    context,
    definition.cardinalMask ?? 0,
    left,
    top,
    size,
    definition.layer === 'water' ? water : road,
    dark,
    definition.layer === 'water',
  );
}

export function renderPlayableTerrainAtlas(world: GeneratedWorld): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const size = world.spec.visual.tileSize;
  canvas.width = PLAYABLE_TERRAIN_ATLAS_COLUMNS * size;
  canvas.height = PLAYABLE_TERRAIN_ATLAS_ROWS * size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable.');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;

  for (const definition of PLAYABLE_TERRAIN_TILE_DEFINITIONS) {
    drawTerrainTile(
      context,
      world,
      definition,
      definition.atlasCoords[0] * size,
      definition.atlasCoords[1] * size,
      size,
    );
  }
  return canvas;
}

function propColors(biome: BiomeId, world: GeneratedWorld): { dark: string; body: string; detail: string } {
  const [dark, ground, detail, water, road] = world.spec.visual.palette;
  if (biome === 'desert') return { dark, body: road, detail: detail || ground };
  if (biome === 'snow') return { dark, body: water, detail: '#f4fbff' };
  return { dark, body: detail, detail: ground };
}

function drawPlayableProp(
  context: CanvasRenderingContext2D,
  world: GeneratedWorld,
  kind: PropKind,
  left: number,
  top: number,
  size: number,
): void {
  const { dark, body, detail } = propColors(world.spec.map.biome, world);
  const biome = world.spec.map.biome;
  context.fillStyle = dark;

  if (kind === 'tree') {
    if (biome === 'desert') {
      fillRect(context, left + size * 0.43, top + size * 0.12, size * 0.18, size * 0.76);
      fillRect(context, left + size * 0.25, top + size * 0.35, size * 0.28, size * 0.16);
      fillRect(context, left + size * 0.55, top + size * 0.5, size * 0.24, size * 0.16);
      context.fillStyle = body;
      fillRect(context, left + size * 0.47, top + size * 0.16, size * 0.1, size * 0.64);
    } else {
      fillRect(context, left + size * 0.44, top + size * 0.52, size * 0.14, size * 0.36);
      context.fillStyle = body;
      fillRect(context, left + size * 0.2, top + size * 0.16, size * 0.62, size * 0.5);
      fillRect(context, left + size * 0.12, top + size * 0.34, size * 0.78, size * 0.22);
      if (biome === 'snow') {
        context.fillStyle = detail;
        fillRect(context, left + size * 0.22, top + size * 0.16, size * 0.58, size * 0.1);
      }
    }
  } else if (kind === 'rock') {
    fillRect(context, left + size * 0.2, top + size * 0.48, size * 0.62, size * 0.3);
    context.fillStyle = detail;
    fillRect(context, left + size * 0.32, top + size * 0.5, size * 0.22, size * 0.08);
  } else if (kind === 'flower') {
    fillRect(context, left + size * 0.46, top + size * 0.38, size * 0.1, size * 0.42);
    context.fillStyle = biome === 'snow' ? '#d7f5ff' : '#fff1a8';
    fillRect(context, left + size * 0.3, top + size * 0.22, size * 0.42, size * 0.25);
  } else if (kind === 'shrub') {
    context.fillStyle = body;
    fillRect(context, left + size * 0.2, top + size * 0.5, size * 0.62, size * 0.28);
    fillRect(context, left + size * 0.3, top + size * 0.34, size * 0.42, size * 0.28);
    context.fillStyle = detail;
    fillRect(context, left + size * 0.56, top + size * 0.42, size * 0.1, size * 0.1);
  } else if (kind === 'log') {
    fillRect(context, left + size * 0.16, top + size * 0.56, size * 0.7, size * 0.2);
    context.fillStyle = body;
    fillRect(context, left + size * 0.22, top + size * 0.52, size * 0.54, size * 0.12);
    context.fillStyle = detail;
    fillRect(context, left + size * 0.72, top + size * 0.56, size * 0.1, size * 0.2);
  } else {
    fillRect(context, left + size * 0.44, top + size * 0.3, size * 0.12, size * 0.58);
    context.fillStyle = body;
    fillRect(context, left + size * 0.26, top + size * 0.18, size * 0.5, size * 0.32);
    context.fillStyle = detail;
    fillRect(context, left + size * 0.34, top + size * 0.26, size * 0.28, size * 0.08);
  }
}

export function renderPlayablePropsAtlas(world: GeneratedWorld): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const size = world.spec.visual.tileSize;
  canvas.width = PLAYABLE_PROP_KINDS.length * size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable.');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;
  PLAYABLE_PROP_KINDS.forEach((kind, index) => (
    drawPlayableProp(context, world, kind, index * size, 0, size)
  ));
  return canvas;
}

export function renderPlayableWorldToCanvas(
  canvas: HTMLCanvasElement,
  world: GeneratedWorld,
  cellSize: number,
): void {
  const projection = projectPlayableTerrain(world);
  const targetSize = Math.max(1, Math.round(cellSize));
  const sourceSize = world.spec.visual.tileSize;
  canvas.width = projection.width * targetSize;
  canvas.height = projection.height * targetSize;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable.');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;

  const terrainAtlas = renderPlayableTerrainAtlas(world);
  const propsAtlas = renderPlayablePropsAtlas(world);
  const definitionById = new Map(PLAYABLE_TERRAIN_TILE_DEFINITIONS.map((entry) => [entry.tileId, entry]));

  for (const layer of projection.layers) {
    layer.cells.forEach((tileId, index) => {
      if (tileId === EMPTY_TERRAIN_CELL) return;
      const definition = definitionById.get(tileId);
      if (!definition || definition.layer !== layer.id) {
        throw new Error(`Playable terrain layer ${layer.id} references undefined tile ${tileId}.`);
      }
      const x = index % projection.width;
      const y = Math.floor(index / projection.width);
      context.drawImage(
        terrainAtlas,
        definition.atlasCoords[0] * sourceSize,
        definition.atlasCoords[1] * sourceSize,
        sourceSize,
        sourceSize,
        x * targetSize,
        y * targetSize,
        targetSize,
        targetSize,
      );
    });
  }

  const propIndex = new Map(PLAYABLE_PROP_KINDS.map((kind, index) => [kind, index]));
  for (const prop of world.props) {
    const index = propIndex.get(prop.kind);
    if (index === undefined) throw new Error(`Playable prop atlas does not define ${prop.kind}.`);
    context.drawImage(
      propsAtlas,
      index * sourceSize,
      0,
      sourceSize,
      sourceSize,
      prop.x * targetSize,
      prop.y * targetSize,
      targetSize,
      targetSize,
    );
  }
}
