import { describe, expect, it } from 'vitest';
import { resolveSemanticPlaces } from './semantic-places';
import { resolveSemanticStructures, StructureResolutionError } from './semantic-structures';
import {
  ALPHA6_DEFAULT_WORLD_SPEC,
  PLACES_WORLD_SCHEMA_VERSION,
  cloneWorldSpec,
  migrateWorldSpecV020,
  type WorldSpecV020,
} from './world-spec';
import { generateWorld } from './generate-world';
import { validateWorldSpec } from './validate-world';

describe('World Spec 0.3 semantic structures', () => {
  it('validates the strict structure contract and cross-references', () => {
    expect(validateWorldSpec(ALPHA6_DEFAULT_WORLD_SPEC).filter(({ severity }) => severity === 'error')).toEqual([]);

    const malformed = cloneWorldSpec(ALPHA6_DEFAULT_WORLD_SPEC) as unknown as Record<string, unknown>;
    malformed.structures = [
      { id: 'Bad/ID', placeId: 'missing', archetype: 'castle', coordinates: [1, 2] },
      { id: 'Bad/ID', placeId: 'missing', archetype: 'castle' },
    ];
    expect(validateWorldSpec(malformed).map(({ code }) => code)).toEqual(expect.arrayContaining([
      'spec.unknown-structure-field',
      'spec.structure-id',
      'spec.structure-place-reference',
      'spec.duplicate-structure-place',
      'spec.structure-archetype',
    ]));

    const duplicateId = cloneWorldSpec(ALPHA6_DEFAULT_WORLD_SPEC);
    duplicateId.structures = [
      { id: 'same', placeId: 'spawn', archetype: 'cottage' },
      { id: 'same', placeId: 'landmark', archetype: 'tower' },
    ];
    expect(validateWorldSpec(duplicateId)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'spec.duplicate-structure-id' })]),
    );

    const empty = cloneWorldSpec(ALPHA6_DEFAULT_WORLD_SPEC);
    empty.structures = [];
    expect(validateWorldSpec(empty)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'spec.structures' })]),
    );
  });

  it('fails closed on structure fields and keeps them illegal in World Spec 0.2', () => {
    const unknown = cloneWorldSpec(ALPHA6_DEFAULT_WORLD_SPEC) as unknown as { structures: Record<string, unknown>[] };
    unknown.structures[0].privateState = true;
    expect(validateWorldSpec(unknown)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'spec.unknown-structure-field' })]),
    );

    const previous = {
      ...cloneWorldSpec(ALPHA6_DEFAULT_WORLD_SPEC),
      schemaVersion: PLACES_WORLD_SCHEMA_VERSION,
    } as unknown as WorldSpecV020 & { structures: unknown };
    expect(validateWorldSpec(previous)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'spec.unknown-root-field' })]),
    );
  });

  it('migrates v0.2 without inventing structures or sharing nested data', () => {
    const { structures: _structures, ...current } = cloneWorldSpec(ALPHA6_DEFAULT_WORLD_SPEC);
    const previous: WorldSpecV020 = { ...current, schemaVersion: PLACES_WORLD_SCHEMA_VERSION };
    const migrated = migrateWorldSpecV020(previous);

    expect(migrated).not.toHaveProperty('structures');
    expect(migrated.places).toEqual(previous.places);
    expect(migrated.places).not.toBe(previous.places);
    expect(migrated.places?.[0].tags).not.toBe(previous.places?.[0].tags);
  });
});

describe('semantic structure resolution', () => {
  it('anchors structures to resolved places in stable declaration order without mutation', () => {
    const world = generateWorld(ALPHA6_DEFAULT_WORLD_SPEC);
    const before = structuredClone(world);
    const places = new Map(resolveSemanticPlaces(world).map((place) => [place.id, place]));

    const first = resolveSemanticStructures(world);
    const second = resolveSemanticStructures(world);

    expect(second).toEqual(first);
    expect(first.map(({ id, order, placeId, archetype }) => ({ id, order, placeId, archetype }))).toEqual([
      { id: 'spawn-cottage', order: 0, placeId: 'spawn', archetype: 'cottage' },
      { id: 'landmark-shrine', order: 1, placeId: 'landmark', archetype: 'shrine' },
    ]);
    for (const structure of first) {
      expect(structure.cell).toEqual(places.get(structure.placeId)?.cell);
      expect(structure.pixelCenter).toEqual(places.get(structure.placeId)?.pixelCenter);
    }
    expect(world).toEqual(before);
  });

  it('returns an empty list when structures are omitted and throws a typed error for an unresolved reference', () => {
    const specWithoutStructures = cloneWorldSpec(ALPHA6_DEFAULT_WORLD_SPEC);
    delete specWithoutStructures.structures;
    const withoutStructures = generateWorld(specWithoutStructures);
    expect(resolveSemanticStructures(withoutStructures)).toEqual([]);

    const world = generateWorld(ALPHA6_DEFAULT_WORLD_SPEC);
    world.spec.structures = [{ id: 'orphan', placeId: 'missing', archetype: 'tower' }];
    expect(() => resolveSemanticStructures(world)).toThrowError(new StructureResolutionError('orphan', 'missing'));
  });
});
