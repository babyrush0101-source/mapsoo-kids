import {
  EMPTY_TERRAIN_CELL,
  PLAYABLE_TERRAIN_ATLAS_COLUMNS,
  PLAYABLE_TERRAIN_ATLAS_ROWS,
  PLAYABLE_TERRAIN_TILE_DEFINITIONS,
  projectPlayableTerrain,
  type PlayableTerrainTileDefinition,
} from '../../core/playable-terrain';
import { PLAYABLE_PROP_KINDS } from '../../core/generate-playable-world';
import type { ResolvedWorldPlace } from '../../core/semantic-places';
import type { ResolvedWorldStructure } from '../../core/semantic-structures';
import {
  PLACE_KINDS,
  STRUCTURE_ARCHETYPES,
  type BiomeId,
  type GeneratedWorld,
  type PlaceKind,
  type PropKind,
  type StructureArchetype,
} from '../../core/world-spec';
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
  options: Readonly<{
    places?: readonly ResolvedWorldPlace[];
    showPlaces?: boolean;
    structures?: readonly ResolvedWorldStructure[];
    showStructures?: boolean;
  }> = {},
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

  if (options.showStructures && options.structures) {
    renderSemanticStructuresOverlay(context, world, options.structures, targetSize);
  }

  if (options.showPlaces && options.places) {
    renderSemanticPlacesOverlay(context, options.places, targetSize, canvas.width, canvas.height);
  }
}

/** Stable atlas order shared with the World Spec structure contract. */
export const SEMANTIC_STRUCTURE_ATLAS_ARCHETYPES: readonly StructureArchetype[] = STRUCTURE_ARCHETYPES;
export const SEMANTIC_STRUCTURE_SPRITE_WIDTH_CELLS = 2;
export const SEMANTIC_STRUCTURE_SPRITE_HEIGHT_CELLS = 2;

function structureColors(world: GeneratedWorld): Readonly<{
  outline: string;
  wall: string;
  roof: string;
  accent: string;
}> {
  const [outline, ground, detail, water, road] = world.spec.visual.palette;
  return {
    outline,
    wall: world.spec.map.biome === 'snow' ? '#dcebf2' : road,
    roof: world.spec.map.biome === 'desert' ? detail : ground,
    accent: world.spec.map.biome === 'snow' ? water : detail,
  };
}

/**
 * Draws one transparent, deterministic structure sprite in a 2x2 tile slot.
 * The bottom-center of the slot is the structure foot point. Only pixel rects
 * are used, keeping the art independent of fonts and platform rasterizers.
 */
export function drawSemanticStructure(
  context: CanvasRenderingContext2D,
  world: GeneratedWorld,
  archetype: StructureArchetype,
  left: number,
  top: number,
  tileSize: number,
): void {
  const unit = Math.max(1, Math.floor(tileSize / 8));
  const width = tileSize * SEMANTIC_STRUCTURE_SPRITE_WIDTH_CELLS;
  const height = tileSize * SEMANTIC_STRUCTURE_SPRITE_HEIGHT_CELLS;
  const { outline, wall, roof, accent } = structureColors(world);

  context.fillStyle = outline;
  if (archetype === 'cottage') {
    fillRect(context, left + unit * 2, top + unit * 7, width - unit * 4, unit * 8);
    fillRect(context, left + unit * 4, top + unit * 5, width - unit * 8, unit * 2);
    fillRect(context, left + unit * 6, top + unit * 3, width - unit * 12, unit * 2);
    context.fillStyle = roof;
    fillRect(context, left + unit * 3, top + unit * 7, width - unit * 6, unit * 2);
    fillRect(context, left + unit * 5, top + unit * 5, width - unit * 10, unit * 2);
    fillRect(context, left + unit * 7, top + unit * 3, width - unit * 14, unit * 2);
    context.fillStyle = wall;
    fillRect(context, left + unit * 4, top + unit * 9, width - unit * 8, unit * 5);
    context.fillStyle = outline;
    fillRect(context, left + unit * 7, top + unit * 10, unit * 3, unit * 4);
    context.fillStyle = accent;
    fillRect(context, left + unit * 5, top + unit * 10, unit * 2, unit * 2);
    fillRect(context, left + unit * 11, top + unit * 10, unit * 2, unit * 2);
  } else if (archetype === 'workshop') {
    fillRect(context, left + unit * 2, top + unit * 6, width - unit * 4, unit * 9);
    fillRect(context, left + unit * 11, top + unit * 2, unit * 3, unit * 6);
    context.fillStyle = roof;
    fillRect(context, left + unit * 2, top + unit * 6, width - unit * 4, unit * 3);
    fillRect(context, left + unit * 5, top + unit * 4, width - unit * 9, unit * 2);
    context.fillStyle = wall;
    fillRect(context, left + unit * 3, top + unit * 9, width - unit * 6, unit * 5);
    context.fillStyle = outline;
    fillRect(context, left + unit * 10, top + unit * 10, unit * 4, unit * 4);
    fillRect(context, left + unit * 2, top + unit * 12, unit * 5, unit * 2);
    context.fillStyle = accent;
    fillRect(context, left + unit * 3, top + unit * 10, unit * 4, unit * 2);
    fillRect(context, left + unit * 11, top + unit * 3, unit, unit * 3);
  } else if (archetype === 'tower') {
    fillRect(context, left + unit * 4, top + unit * 2, width - unit * 8, unit * 13);
    fillRect(context, left + unit * 3, top + unit, unit * 3, unit * 4);
    fillRect(context, left + unit * 7, top + unit, unit * 3, unit * 4);
    fillRect(context, left + unit * 11, top + unit, unit * 3, unit * 4);
    context.fillStyle = wall;
    fillRect(context, left + unit * 5, top + unit * 4, width - unit * 10, unit * 10);
    context.fillStyle = roof;
    fillRect(context, left + unit * 4, top + unit * 3, width - unit * 8, unit * 2);
    context.fillStyle = outline;
    fillRect(context, left + unit * 7, top + unit * 6, unit * 2, unit * 3);
    fillRect(context, left + unit * 7, top + unit * 11, unit * 3, unit * 3);
    context.fillStyle = accent;
    fillRect(context, left + unit * 8, top + unit * 7, unit, unit);
  } else {
    fillRect(context, left + unit * 3, top + unit * 5, width - unit * 6, unit * 10);
    fillRect(context, left + unit * 2, top + unit * 4, width - unit * 4, unit * 3);
    fillRect(context, left + unit * 6, top + unit * 2, width - unit * 12, unit * 3);
    context.fillStyle = roof;
    fillRect(context, left + unit * 3, top + unit * 4, width - unit * 6, unit * 2);
    fillRect(context, left + unit * 7, top + unit * 2, width - unit * 14, unit * 2);
    context.fillStyle = wall;
    fillRect(context, left + unit * 5, top + unit * 7, unit * 2, unit * 6);
    fillRect(context, left + unit * 11, top + unit * 7, unit * 2, unit * 6);
    context.fillStyle = accent;
    fillRect(context, left + unit * 7, top + unit * 8, width - unit * 14, unit * 4);
    context.fillStyle = outline;
    fillRect(context, left + unit * 8, top + unit * 9, unit * 2, unit * 2);
    fillRect(context, left + unit * 2, top + unit * 14, width - unit * 4, unit);
  }

  // Every sprite ends on the same one-pixel-equivalent foot line.
  context.fillStyle = outline;
  fillRect(context, left + unit * 5, top + height - unit, width - unit * 10, unit);
}

/** Renders the four structure archetypes as a transparent single-row atlas. */
export function renderSemanticStructuresAtlas(world: GeneratedWorld): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const tileSize = world.spec.visual.tileSize;
  const spriteWidth = tileSize * SEMANTIC_STRUCTURE_SPRITE_WIDTH_CELLS;
  canvas.width = SEMANTIC_STRUCTURE_ATLAS_ARCHETYPES.length * spriteWidth;
  canvas.height = tileSize * SEMANTIC_STRUCTURE_SPRITE_HEIGHT_CELLS;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable.');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;
  SEMANTIC_STRUCTURE_ATLAS_ARCHETYPES.forEach((archetype, index) => {
    drawSemanticStructure(context, world, archetype, index * spriteWidth, 0, tileSize);
  });
  return canvas;
}

/**
 * Draws resolved structures with each referenced place cell as its foot point.
 * Negative sprite coordinates are intentional at map edges; Canvas clips them
 * to the already-sized world surface.
 */
export function renderSemanticStructuresOverlay(
  context: CanvasRenderingContext2D,
  world: GeneratedWorld,
  structures: readonly ResolvedWorldStructure[],
  cellSize: number,
): void {
  const size = Math.max(1, Math.round(cellSize));
  const spriteWidth = size * SEMANTIC_STRUCTURE_SPRITE_WIDTH_CELLS;
  const spriteHeight = size * SEMANTIC_STRUCTURE_SPRITE_HEIGHT_CELLS;
  for (const structure of structures) {
    const footX = structure.cell.x * size + size / 2;
    const footY = (structure.cell.y + 1) * size;
    drawSemanticStructure(
      context,
      world,
      structure.archetype,
      Math.round(footX - spriteWidth / 2),
      Math.round(footY - spriteHeight),
      size,
    );
  }
}

const PLACE_MARKERS = Object.freeze({
  spawn: { color: '#d8f36b' },
  settlement: { color: '#79d7ff' },
  landmark: { color: '#ffd36b' },
  resource: { color: '#87e0a0' },
  encounter: { color: '#ff8f87' },
  exit: { color: '#d5a8ff' },
} as const);

/** Stable atlas order shared with the semantic place contract. */
export const SEMANTIC_PLACE_ATLAS_KINDS: readonly PlaceKind[] = PLACE_KINDS;

/** Draws one deterministic, font-independent semantic place icon. */
export function drawSemanticPlaceMarker(
  context: CanvasRenderingContext2D,
  kind: PlaceKind,
  left: number,
  top: number,
  size: number,
): void {
  const marker = PLACE_MARKERS[kind];
  const unit = Math.max(1, Math.floor(size / 8));
  const outerLeft = left + unit;
  const outerTop = top + unit;
  const outerSize = Math.max(1, size - unit * 2);
  const innerLeft = left + unit * 2;
  const innerTop = top + unit * 2;
  const innerSize = Math.max(1, size - unit * 4);
  const centerX = left + size / 2;
  const centerY = top + size / 2;

  context.fillStyle = 'rgba(8, 14, 12, 0.92)';
  fillRect(context, outerLeft, outerTop, outerSize, outerSize);
  context.fillStyle = marker.color;
  fillRect(context, innerLeft, innerTop, innerSize, innerSize);
  context.fillStyle = '#101712';

  if (kind === 'spawn') {
    fillRect(context, centerX - unit, innerTop + unit, unit * 2, innerSize - unit * 2);
    fillRect(context, innerLeft + unit, centerY - unit, innerSize - unit * 2, unit * 2);
  } else if (kind === 'settlement') {
    fillRect(context, innerLeft + unit, centerY, innerSize - unit * 2, innerSize / 2 - unit);
    fillRect(context, innerLeft + unit * 2, centerY - unit * 2, innerSize - unit * 4, unit * 2);
    fillRect(context, centerX - unit / 2, centerY + unit, unit, innerSize / 2 - unit * 2);
  } else if (kind === 'landmark') {
    fillRect(context, centerX - unit, innerTop + unit, unit * 2, innerSize - unit * 2);
    fillRect(context, centerX - unit * 2, centerY - unit * 2, unit * 4, unit * 4);
  } else if (kind === 'resource') {
    fillRect(context, centerX - unit * 2, innerTop + unit * 2, unit * 4, unit * 3);
    fillRect(context, centerX - unit, innerTop + unit, unit * 2, innerSize - unit * 2);
  } else if (kind === 'encounter') {
    fillRect(context, centerX - unit / 2, innerTop + unit, unit, innerSize - unit * 4);
    fillRect(context, centerX - unit / 2, innerTop + innerSize - unit * 2, unit, unit);
  } else {
    fillRect(context, innerLeft + unit, centerY - unit, innerSize - unit * 2, unit * 2);
    fillRect(context, innerLeft + innerSize - unit * 3, centerY - unit * 2, unit * 2, unit * 4);
  }
}

/** Renders the six place-kind icons as one transparent single-row atlas. */
export function renderSemanticPlacesAtlas(world: GeneratedWorld): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const size = world.spec.visual.tileSize;
  canvas.width = SEMANTIC_PLACE_ATLAS_KINDS.length * size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable.');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;
  SEMANTIC_PLACE_ATLAS_KINDS.forEach((kind, index) => {
    drawSemanticPlaceMarker(context, kind, index * size, 0, size);
  });
  return canvas;
}

/**
 * Draws presentation-only semantic markers. Coordinates are consumed directly
 * from the resolver records; this layer never derives or moves a place.
 */
export function renderSemanticPlacesOverlay(
  context: CanvasRenderingContext2D,
  places: readonly ResolvedWorldPlace[],
  cellSize: number,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const size = Math.max(1, Math.round(cellSize));
  const markerSize = Math.max(10, Math.min(18, Math.round(size * 0.72)));
  const labelHeight = 14;

  context.save();
  context.textBaseline = 'middle';
  context.font = '700 10px ui-sans-serif, system-ui, sans-serif';
  const occupiedLabels: Array<{ left: number; top: number; width: number; height: number }> = [];

  for (const place of places) {
    const centerX = place.cell.x * size + size / 2;
    const centerY = place.cell.y * size + size / 2;
    const markerLeft = Math.round(centerX - markerSize / 2);
    const markerTop = Math.round(centerY - markerSize / 2);

    drawSemanticPlaceMarker(context, place.kind, markerLeft, markerTop, markerSize);

    const boundedLabel = place.label.slice(0, 32);
    const labelWidth = Math.min(132, Math.max(46, boundedLabel.length * 6 + 10));
    const clampLeft = (left: number) => Math.max(0, Math.min(canvasWidth - labelWidth, left));
    const clampTop = (top: number) => Math.max(0, Math.min(canvasHeight - labelHeight, top));
    const candidates = [
      { left: Math.round(centerX - labelWidth / 2), top: markerTop - labelHeight - 4 },
      { left: Math.round(centerX - labelWidth / 2), top: markerTop + markerSize + 4 },
      { left: markerLeft + markerSize + 4, top: Math.round(centerY - labelHeight / 2) },
      { left: markerLeft - labelWidth - 4, top: Math.round(centerY - labelHeight / 2) },
    ].map(({ left, top }) => ({
      left: clampLeft(left),
      top: clampTop(top),
      width: labelWidth,
      height: labelHeight,
    }));
    const overlaps = (candidate: typeof candidates[number]) => occupiedLabels.some((existing) => !(
      candidate.left + candidate.width + 2 <= existing.left
      || existing.left + existing.width + 2 <= candidate.left
      || candidate.top + candidate.height + 2 <= existing.top
      || existing.top + existing.height + 2 <= candidate.top
    ));
    const labelRect = candidates.find((candidate) => !overlaps(candidate)) ?? candidates[0];
    occupiedLabels.push(labelRect);

    context.fillStyle = 'rgba(8, 14, 12, 0.92)';
    fillRect(context, labelRect.left, labelRect.top, labelWidth, labelHeight);
    context.fillStyle = '#f4f8f5';
    context.textAlign = 'left';
    context.fillText(boundedLabel, labelRect.left + 5, labelRect.top + labelHeight / 2, labelWidth - 10);
  }

  context.restore();
}
