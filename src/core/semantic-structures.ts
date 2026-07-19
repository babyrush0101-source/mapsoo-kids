import { resolveSemanticPlaces } from './semantic-places';
import type { GeneratedWorld, StructureArchetype } from './world-spec';

export interface ResolvedWorldStructure {
  readonly id: string;
  readonly order: number;
  readonly placeId: string;
  readonly archetype: StructureArchetype;
  readonly cell: Readonly<{ x: number; y: number }>;
  readonly pixelCenter: Readonly<{ x: number; y: number }>;
}

export class StructureResolutionError extends Error {
  readonly code = 'structure.missing-place' as const;

  constructor(readonly structureId: string, readonly placeId: string) {
    super(`Could not resolve structure "${structureId}": place "${placeId}" was not resolved.`);
    this.name = 'StructureResolutionError';
  }
}

/**
 * Anchors authored structures to their referenced semantic place. Declaration
 * order is retained and no random state is consumed.
 */
export function resolveSemanticStructures(world: GeneratedWorld): ResolvedWorldStructure[] {
  const structures = world.spec.structures;
  if (!structures) return [];

  const placesById = new Map(resolveSemanticPlaces(world).map((place) => [place.id, place]));
  return structures.map((structure, order) => {
    const place = placesById.get(structure.placeId);
    if (!place) throw new StructureResolutionError(structure.id, structure.placeId);

    return {
      id: structure.id,
      order,
      placeId: structure.placeId,
      archetype: structure.archetype,
      cell: { ...place.cell },
      pixelCenter: { ...place.pixelCenter },
    };
  });
}
