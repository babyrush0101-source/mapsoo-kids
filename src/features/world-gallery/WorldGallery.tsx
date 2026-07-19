import type { WorldExample, WorldExampleId } from '../../app/world-example-registry';
import type { CSSProperties } from 'react';

interface WorldGalleryProps {
  examples: readonly WorldExample[];
  activeWorldId: string;
  loadingWorldId: WorldExampleId | null;
  disabled: boolean;
  onSelect: (id: WorldExampleId) => void;
}

export function WorldGallery({
  examples,
  activeWorldId,
  loadingWorldId,
  disabled,
  onSelect,
}: WorldGalleryProps) {
  return (
    <section className="world-gallery" aria-labelledby="world-gallery-title">
      <div className="world-gallery-heading">
        <div>
          <p className="eyebrow">Alpha.7 candidate gallery</p>
          <h2 id="world-gallery-title">Start from a complete world recipe.</h2>
        </div>
        <p>Three deterministic World Spec 0.3 examples. Candidate status is not a published Alpha.7 release.</p>
      </div>

      <div className="world-gallery-grid">
        {examples.map((example, index) => {
          const isActive = activeWorldId === example.id;
          const isLoading = loadingWorldId === example.id;
          const paletteStyle = {
            '--gallery-dark': example.spec.visual.palette[0],
            '--gallery-ground': example.spec.visual.palette[1],
            '--gallery-light': example.spec.visual.palette[2],
            '--gallery-water': example.spec.visual.palette[3],
            '--gallery-road': example.spec.visual.palette[4],
          } as CSSProperties;
          return (
            <article
              className={`world-gallery-card gallery-biome-${example.biome}${isActive ? ' is-active' : ''}`}
              key={example.id}
              style={paletteStyle}
            >
              <div className="world-gallery-art" aria-hidden="true">
                <span className="gallery-sun" />
                <span className="gallery-water" />
                <span className="gallery-path" />
                <span className="gallery-structure" />
              </div>
              <div className="world-gallery-card-body">
                <div className="world-gallery-meta">
                  <span>0{index + 1}</span>
                  <span>{example.biome}</span>
                  <span>{example.status}</span>
                </div>
                <h3>{example.title}</h3>
                <p>{example.summary}</p>
                <code>{example.id}</code>
                <button
                  type="button"
                  disabled={disabled}
                  aria-pressed={isActive}
                  onClick={() => onSelect(example.id)}
                >
                  {isLoading ? 'Generating…' : isActive ? 'Loaded in Workbench' : 'Load this world'}
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
