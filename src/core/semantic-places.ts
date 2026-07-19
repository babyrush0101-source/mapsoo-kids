import type {
  GeneratedWorld,
  PlacePlacement,
  WorldPlace,
} from './world-spec';

export interface ResolvedWorldPlace {
  readonly id: string;
  readonly order: number;
  readonly label: string;
  readonly kind: WorldPlace['kind'];
  readonly placement: PlacePlacement;
  readonly tags: string[];
  readonly cell: Readonly<{ x: number; y: number }>;
  readonly pixelCenter: Readonly<{ x: number; y: number }>;
}

export class PlaceResolutionError extends Error {
  readonly code = 'place.unsatisfied-placement' as const;

  constructor(
    readonly placeId: string,
    readonly placement: PlacePlacement,
  ) {
    super(`Could not resolve place "${placeId}": no unoccupied walkable cell satisfies "${placement}".`);
    this.name = 'PlaceResolutionError';
  }
}

interface CandidateCell {
  readonly x: number;
  readonly y: number;
  readonly index: number;
}

function cardinallyAdjacentTo(
  semanticGround: readonly number[],
  width: number,
  height: number,
  x: number,
  y: number,
  tileId: number,
): boolean {
  return (
    (y > 0 && semanticGround[(y - 1) * width + x] === tileId)
    || (x + 1 < width && semanticGround[y * width + x + 1] === tileId)
    || (y + 1 < height && semanticGround[(y + 1) * width + x] === tileId)
    || (x > 0 && semanticGround[y * width + x - 1] === tileId)
  );
}

function centerDistanceScore(cell: CandidateCell, width: number, height: number): number {
  // Doubled coordinates avoid floating-point midpoint comparisons on even-sized maps.
  const dx = cell.x * 2 - (width - 1);
  const dy = cell.y * 2 - (height - 1);
  return dx * dx + dy * dy;
}

function compareCandidates(a: CandidateCell, b: CandidateCell, width: number, height: number): number {
  return centerDistanceScore(a, width, height) - centerDistanceScore(b, width, height)
    || a.y - b.y
    || a.x - b.x;
}

function assertResolvableWorld(world: GeneratedWorld): void {
  const { width, height } = world.spec.map;
  if (!Number.isSafeInteger(width) || width <= 0 || !Number.isSafeInteger(height) || height <= 0) {
    throw new Error('Cannot resolve places: world dimensions must be positive safe integers.');
  }
  if (!Array.isArray(world.ground) || world.ground.length !== width * height) {
    throw new Error(`Cannot resolve places: ground must contain exactly ${width * height} cells.`);
  }
  if (!Array.isArray(world.tiles)) {
    throw new Error('Cannot resolve places: tile definitions must be an array.');
  }
}

/**
 * Resolves authored semantic locations onto generated terrain without mutating
 * the world or its spec. Places retain declaration order and always occupy
 * distinct walkable cells.
 */
export function resolveSemanticPlaces(world: GeneratedWorld): ResolvedWorldPlace[] {
  assertResolvableWorld(world);
  const places = world.spec.places;
  if (!places) return [];

  const { width, height } = world.spec.map;
  const tileById = new Map(world.tiles.map((tile) => [tile.id, tile]));
  const waterTileId = world.tiles.find((tile) => tile.name === 'water')?.id;
  const roadTileId = world.tiles.find((tile) => tile.name === 'path')?.id;
  const occupied = new Set<number>();
  const resolved: ResolvedWorldPlace[] = [];

  for (let order = 0; order < places.length; order += 1) {
    const place = places[order];
    const candidates: CandidateCell[] = [];

    for (let index = 0; index < world.ground.length; index += 1) {
      if (occupied.has(index)) continue;
      const tileId = world.ground[index];
      if (tileById.get(tileId)?.walkable !== true) continue;

      const x = index % width;
      const y = Math.floor(index / width);
      let satisfiesPlacement = false;
      switch (place.placement) {
        case 'center':
          satisfiesPlacement = true;
          break;
        case 'near-water':
          satisfiesPlacement = waterTileId !== undefined
            && cardinallyAdjacentTo(world.ground, width, height, x, y, waterTileId);
          break;
        case 'on-road':
          satisfiesPlacement = roadTileId !== undefined && tileId === roadTileId;
          break;
        case 'map-edge':
          satisfiesPlacement = x === 0 || y === 0 || x === width - 1 || y === height - 1;
          break;
      }

      if (satisfiesPlacement) candidates.push({ x, y, index });
    }

    candidates.sort((a, b) => compareCandidates(a, b, width, height));
    const selected = candidates[0];
    if (!selected) throw new PlaceResolutionError(place.id, place.placement);

    occupied.add(selected.index);
    const tileSize = world.spec.visual.tileSize;
    resolved.push({
      id: place.id,
      order,
      label: place.label,
      kind: place.kind,
      placement: place.placement,
      tags: [...place.tags],
      cell: { x: selected.x, y: selected.y },
      pixelCenter: {
        x: selected.x * tileSize + tileSize / 2,
        y: selected.y * tileSize + tileSize / 2,
      },
    });
  }

  return resolved;
}
