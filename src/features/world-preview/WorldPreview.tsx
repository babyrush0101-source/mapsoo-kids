import { useEffect, useMemo, useRef, useState } from 'react';
import { renderPlayableWorldToCanvas } from '../../adapters/canvas/render-playable-world';
import {
  PlaceResolutionError,
  resolveSemanticPlaces,
  type ResolvedWorldPlace,
} from '../../core/semantic-places';
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

export function WorldPreview({ world }: WorldPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showPlaces, setShowPlaces] = useState(true);
  const placesState = useMemo(() => resolveWorldPreviewPlaces(world), [world]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cellSize = Math.max(12, Math.min(28, Math.floor(760 / world.spec.map.width)));
    renderPlayableWorldToCanvas(canvas, world, cellSize, {
      places: placesState.status === 'ready' ? placesState.places : [],
      showPlaces: showPlaces && placesState.status === 'ready',
    });
  }, [placesState, showPlaces, world]);

  const places = placesState.status === 'ready' ? placesState.places : [];
  const overlayVisible = showPlaces && places.length > 0;

  return (
    <div className="world-preview">
      <div className="preview-frame">
        <canvas
          ref={canvasRef}
          className="world-canvas"
          aria-label={`Generated preview of ${world.spec.title}${overlayVisible ? ` with ${places.length} semantic places` : ''}`}
        />
      </div>

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
            aria-pressed={overlayVisible}
            aria-controls="semantic-place-list"
            disabled={placesState.status === 'error' || places.length === 0}
            onClick={() => setShowPlaces((current) => !current)}
          >
            {overlayVisible ? 'Hide overlay' : 'Show overlay'}
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
