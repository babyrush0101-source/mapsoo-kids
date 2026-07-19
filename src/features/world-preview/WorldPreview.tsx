import { useEffect, useMemo, useRef, useState } from 'react';
import { renderPlayableWorldToCanvas } from '../../adapters/canvas/render-playable-world';
import {
  PlaceResolutionError,
  resolveSemanticPlaces,
  type ResolvedWorldPlace,
} from '../../core/semantic-places';
import {
  StructureResolutionError,
  resolveSemanticStructures,
  type ResolvedWorldStructure,
} from '../../core/semantic-structures';
import type { GeneratedWorld } from '../../core/world-spec';

interface WorldPreviewProps {
  world: GeneratedWorld;
}

const PLACE_KIND_ABBREVIATIONS = Object.freeze({
  spawn: 'S',
  settlement: 'H',
  landmark: 'L',
  resource: 'R',
  encounter: '!',
  exit: 'E',
} as const);

export type WorldPreviewPlacesState =
  | Readonly<{ status: 'ready'; places: readonly ResolvedWorldPlace[] }>
  | Readonly<{ status: 'error'; code: string; message: string }>;

export function resolveWorldPreviewPlaces(world: GeneratedWorld): WorldPreviewPlacesState {
  try {
    return { status: 'ready', places: resolveSemanticPlaces(world) };
  } catch (error) {
    if (error instanceof PlaceResolutionError) {
      return { status: 'error', code: error.code, message: error.message };
    }
    return {
      status: 'error',
      code: 'place.invalid-world',
      message: error instanceof Error ? error.message : 'Semantic places could not be resolved.',
    };
  }
}

export type WorldPreviewStructuresState =
  | Readonly<{ status: 'ready'; structures: readonly ResolvedWorldStructure[] }>
  | Readonly<{ status: 'error'; code: string; message: string }>;

export function resolveWorldPreviewStructures(world: GeneratedWorld): WorldPreviewStructuresState {
  try {
    return { status: 'ready', structures: resolveSemanticStructures(world) };
  } catch (error) {
    if (error instanceof StructureResolutionError || error instanceof PlaceResolutionError) {
      return { status: 'error', code: error.code, message: error.message };
    }
    return {
      status: 'error',
      code: 'structure.invalid-world',
      message: error instanceof Error ? error.message : 'Semantic structures could not be resolved.',
    };
  }
}

export function WorldPreview({ world }: WorldPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showPlaces, setShowPlaces] = useState(true);
  const [showStructures, setShowStructures] = useState(true);
  const placesState = useMemo(() => resolveWorldPreviewPlaces(world), [world]);
  const structuresState = useMemo(() => resolveWorldPreviewStructures(world), [world]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cellSize = Math.max(12, Math.min(28, Math.floor(760 / world.spec.map.width)));
    renderPlayableWorldToCanvas(canvas, world, cellSize, {
      places: placesState.status === 'ready' ? placesState.places : [],
      showPlaces: showPlaces && placesState.status === 'ready',
      structures: structuresState.status === 'ready' ? structuresState.structures : [],
      showStructures: showStructures && structuresState.status === 'ready',
    });
  }, [placesState, showPlaces, showStructures, structuresState, world]);

  const places = placesState.status === 'ready' ? placesState.places : [];
  const structures = structuresState.status === 'ready' ? structuresState.structures : [];
  const placesOverlayVisible = showPlaces && places.length > 0;
  const structuresOverlayVisible = showStructures && structures.length > 0;

  return (
    <div className="world-preview">
      <div className="preview-frame">
        <canvas
          ref={canvasRef}
          className="world-canvas"
          aria-label={`Generated preview of ${world.spec.title}${structuresOverlayVisible ? ` with ${structures.length} semantic structures` : ''}${placesOverlayVisible ? ` with ${places.length} semantic places` : ''}`}
        />
      </div>

      <section className="structures-panel" aria-labelledby="structures-heading">
        <div className="structures-heading-row">
          <div>
            <h3 id="structures-heading">Semantic structures</h3>
            <p>
              {structuresState.status === 'error'
                ? 'Resolution blocked'
                : `${structures.length} ${structures.length === 1 ? 'structure' : 'structures'} anchored to semantic places`}
            </p>
          </div>
          <button
            type="button"
            className="structures-toggle"
            aria-pressed={structuresOverlayVisible}
            aria-controls="semantic-structure-list"
            disabled={structuresState.status === 'error' || structures.length === 0}
            onClick={() => setShowStructures((current) => !current)}
          >
            {structuresOverlayVisible ? 'Hide structures' : 'Show structures'}
          </button>
        </div>

        {structuresState.status === 'error' ? (
          <div className="structures-error" id="semantic-structure-list" role="alert">
            <strong>{structuresState.code}</strong>
            <p>{structuresState.message}</p>
            <p>Repair the referenced place or generated terrain, then generate the world again.</p>
          </div>
        ) : structures.length > 0 ? (
          <ol id="semantic-structure-list" className="structures-list">
            {structures.map((structure) => (
              <li key={structure.id}>
                <span className={`structure-kind structure-kind-${structure.archetype}`} aria-hidden="true" />
                <span>
                  <strong>{structure.id}</strong>
                  <small>{structure.archetype} · place {structure.placeId} · cell {structure.cell.x}, {structure.cell.y}</small>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="structures-empty" id="semantic-structure-list">
            No semantic structures are declared. Add structures to a World Spec 0.3 document to preview them.
          </p>
        )}
      </section>

      <section className="places-panel" aria-labelledby="places-heading">
        <div className="places-heading-row">
          <div>
            <h3 id="places-heading">Semantic places</h3>
            <p>
              {placesState.status === 'error'
                ? 'Resolution blocked'
                : `${places.length} ${places.length === 1 ? 'place' : 'places'} resolved from the World Spec`}
            </p>
          </div>
          <button
            type="button"
            className="places-toggle"
            aria-pressed={placesOverlayVisible}
            aria-controls="semantic-place-list"
            disabled={placesState.status === 'error' || places.length === 0}
            onClick={() => setShowPlaces((current) => !current)}
          >
            {placesOverlayVisible ? 'Hide overlay' : 'Show overlay'}
          </button>
        </div>

        {placesState.status === 'error' ? (
          <div className="places-error" id="semantic-place-list" role="alert">
            <strong>{placesState.code}</strong>
            <p>{placesState.message}</p>
            <p>Change the place placement or generated terrain, then generate the world again.</p>
          </div>
        ) : places.length > 0 ? (
          <ol id="semantic-place-list" className="places-list">
            {places.map((place) => (
              <li key={place.id}>
                <span className={`place-kind place-kind-${place.kind}`} aria-hidden="true">
                  {PLACE_KIND_ABBREVIATIONS[place.kind]}
                </span>
                <span>
                  <strong>{place.label}</strong>
                  <small>{place.kind} · {place.placement} · cell {place.cell.x}, {place.cell.y}</small>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="places-empty" id="semantic-place-list">
            No semantic places are declared. Add places to the World Spec and generate again.
          </p>
        )}
      </section>
    </div>
  );
}
