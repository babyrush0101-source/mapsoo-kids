import { useMemo, useState } from 'react';
import { downloadPortablePack } from '../adapters/export-browser-pack';
import { generateWorld } from '../core/generate-world';
import {
  BIOME_PALETTES,
  DEFAULT_WORLD_SPEC,
  cloneWorldSpec,
  type BiomeId,
  type TileSize,
  type WorldSpec,
} from '../core/world-spec';
import { validateGeneratedWorld, validateWorldSpec } from '../core/validate-world';
import { WorldPreview } from '../features/world-preview/WorldPreview';

const BIOME_LABELS: Record<BiomeId, { name: string; note: string }> = {
  meadow: { name: 'Meadow', note: 'Lush, gentle, story-ready' },
  desert: { name: 'Desert', note: 'Warm, open, high contrast' },
  snow: { name: 'Snowfield', note: 'Quiet, crisp, exploratory' },
};

function normalizeInteger(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function App() {
  const [draft, setDraft] = useState<WorldSpec>(() => cloneWorldSpec(DEFAULT_WORLD_SPEC));
  const [world, setWorld] = useState(() => generateWorld(DEFAULT_WORLD_SPEC));
  const [exportState, setExportState] = useState<'idle' | 'building' | 'failed'>('idle');
  const draftIssues = useMemo(() => validateWorldSpec(draft), [draft]);
  const packIssues = useMemo(() => validateGeneratedWorld(world), [world]);
  const hasDraftErrors = draftIssues.some((issue) => issue.severity === 'error');
  const hasPackErrors = packIssues.some((issue) => issue.severity === 'error');
  const hasChanges = JSON.stringify(draft) !== JSON.stringify(world.spec);

  function chooseBiome(biome: BiomeId) {
    setDraft((current) => ({
      ...current,
      visual: { ...current.visual, palette: [...BIOME_PALETTES[biome]] },
      map: { ...current.map, biome },
    }));
  }

  function generate() {
    if (!hasDraftErrors) setWorld(generateWorld(draft));
  }

  async function exportPack() {
    setExportState('building');
    try {
      const errors = validateGeneratedWorld(world).filter((issue) => issue.severity === 'error');
      if (errors.length > 0) {
        throw new Error(`Invalid generated world: ${errors.map((issue) => issue.code).join(', ')}`);
      }
      await downloadPortablePack(world);
      setExportState('idle');
    } catch (error) {
      console.error(error);
      setExportState('failed');
    }
  }

  function exportWorldSpec() {
    const errors = validateWorldSpec(world.spec).filter((issue) => issue.severity === 'error');
    if (errors.length > 0) {
      console.error(`Invalid world spec: ${errors.map((issue) => issue.code).join(', ')}`);
      setExportState('failed');
      return;
    }

    downloadJson(`${world.spec.id}.world.json`, world.spec);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Mapsoo Worldsmith home">
          <span className="brand-mark" aria-hidden="true">
            M
          </span>
          <span>
            <strong>Mapsoo</strong>
            <small>Worldsmith · alpha 0.1</small>
          </span>
        </a>
        <div className="topbar-meta">
          <span className="status-dot" /> Local-first
          <a href="https://github.com/babyrush0101-source/mapsoo-kids">GitHub</a>
        </div>
      </header>

      <main id="top">
        <section className="hero-copy">
          <p className="eyebrow">Open-source · Portable today · Godot importer planned</p>
          <h1>Describe a world.<br />Build a playable pack.</h1>
          <p>
            Turn a versioned world specification into coherent tiles, a map preview, validation results,
            and a portable PNG + JSON asset pack.
          </p>
        </section>

        <section className="workbench" aria-label="World generator workbench">
          <aside className="panel controls-panel">
            <div className="panel-heading">
              <div>
                <span className="step">01</span>
                <h2>World spec</h2>
              </div>
              <span className={`dirty-state ${hasChanges ? 'is-dirty' : ''}`}>{hasChanges ? 'Edited' : 'Built'}</span>
            </div>

            <label>
              World title
              <input
                value={draft.title}
                maxLength={120}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              />
            </label>

            <label>
              World ID
              <input
                value={draft.id}
                onChange={(event) => setDraft((current) => ({ ...current, id: event.target.value }))}
                spellCheck={false}
              />
            </label>

            <label>
              Brief
              <textarea
                value={draft.description}
                maxLength={1000}
                rows={3}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              />
            </label>

            <fieldset>
              <legend>Biome recipe</legend>
              <div className="biome-grid">
                {(Object.keys(BIOME_LABELS) as BiomeId[]).map((biome) => (
                  <button
                    className={draft.map.biome === biome ? 'biome-card is-active' : 'biome-card'}
                    key={biome}
                    type="button"
                    onClick={() => chooseBiome(biome)}
                  >
                    <span className={`biome-swatch biome-${biome}`} />
                    <strong>{BIOME_LABELS[biome].name}</strong>
                    <small>{BIOME_LABELS[biome].note}</small>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="two-column-fields">
              <label>
                Width
                <input
                  type="number"
                  min="8"
                  max="48"
                  step="1"
                  value={draft.map.width}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      map: { ...current.map, width: normalizeInteger(event.target.valueAsNumber, 8, 48) },
                    }))
                  }
                />
              </label>
              <label>
                Height
                <input
                  type="number"
                  min="8"
                  max="32"
                  step="1"
                  value={draft.map.height}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      map: { ...current.map, height: normalizeInteger(event.target.valueAsNumber, 8, 32) },
                    }))
                  }
                />
              </label>
            </div>

            <div className="two-column-fields">
              <label>
                Tile size
                <select
                  value={draft.visual.tileSize}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      visual: { ...current.visual, tileSize: Number(event.target.value) as TileSize },
                    }))
                  }
                >
                  <option value="16">16 px</option>
                  <option value="32">32 px</option>
                  <option value="64">64 px</option>
                </select>
              </label>
              <label>
                Seed
                <input
                  value={draft.seed}
                  maxLength={160}
                  onChange={(event) => setDraft((current) => ({ ...current, seed: event.target.value }))}
                  spellCheck={false}
                />
              </label>
            </div>

            <div className="palette-row" aria-label="World palette">
              {draft.visual.palette.map((color, index) => (
                <label className="color-control" key={`${index}-${color}`} title={`Palette color ${index + 1}`}>
                  <input
                    type="color"
                    value={color}
                    onChange={(event) => {
                      const palette = [...draft.visual.palette] as WorldSpec['visual']['palette'];
                      palette[index] = event.target.value;
                      setDraft((current) => ({ ...current, visual: { ...current.visual, palette } }));
                    }}
                  />
                </label>
              ))}
            </div>

            {draftIssues.length > 0 && (
              <div className="inline-issues">
                {draftIssues.map((issue) => (
                  <p key={issue.code} className={issue.severity}>
                    {issue.message}
                  </p>
                ))}
              </div>
            )}

            <button className="primary-action" type="button" onClick={generate} disabled={hasDraftErrors}>
              Generate local world
              <span>→</span>
            </button>
          </aside>

          <section className="panel preview-panel">
            <div className="panel-heading">
              <div>
                <span className="step">02</span>
                <h2>World preview</h2>
              </div>
              <div className="preview-tools">
                <span>{world.spec.map.width} × {world.spec.map.height}</span>
                <span>{world.spec.visual.tileSize}px</span>
              </div>
            </div>

            <WorldPreview world={world} />

            <div className="legend-row">
              {world.tiles.map((tile) => (
                <span key={tile.id}>
                  <i style={{ background: tile.color }} /> {tile.name}
                </span>
              ))}
            </div>

            <div className="build-note">
              <span>Generator</span>
              <strong>{world.generator.id}</strong>
              <span>Seed</span>
              <strong>{world.spec.seed}</strong>
            </div>
          </section>

          <aside className="panel inspector-panel">
            <div className="panel-heading">
              <div>
                <span className="step">03</span>
                <h2>Pack inspector</h2>
              </div>
              <span className="pass-badge">{packIssues.some((issue) => issue.severity === 'error') ? 'Blocked' : 'Valid'}</span>
            </div>

            <div className="metric-grid">
              <article><strong>{world.ground.length}</strong><span>map cells</span></article>
              <article><strong>{world.tiles.length}</strong><span>tile types</span></article>
              <article><strong>{world.props.length}</strong><span>props</span></article>
              <article><strong>1</strong><span>portable target</span></article>
            </div>

            <h3>Validation</h3>
            <div className="validation-list">
              {packIssues.map((issue) => (
                <article key={issue.code} className={`validation-item ${issue.severity}`}>
                  <span>{issue.severity === 'error' ? '!' : issue.severity === 'warning' ? '△' : '✓'}</span>
                  <div>
                    <strong>{issue.code}</strong>
                    <p>{issue.message}</p>
                  </div>
                </article>
              ))}
            </div>

            <h3>Export targets</h3>
            <ul className="target-list">
              <li><span>Portable pack</span><small>Current · PNG + JSON</small></li>
              <li><span>Godot 4.3+</span><small>Planned · importer + TileMapLayer</small></li>
              <li><span>itch.io</span><small>Current · versioned release ZIP</small></li>
            </ul>

            <div className="export-actions">
              <button
                className="secondary-action is-ready"
                type="button"
                onClick={exportWorldSpec}
                disabled={hasPackErrors}
              >
                Download World Spec
              </button>
              <button
                className="primary-action"
                type="button"
                onClick={exportPack}
                disabled={exportState === 'building' || hasPackErrors}
              >
                {exportState === 'building' ? 'Building ZIP…' : 'Assemble portable ZIP'}
                <span>↓</span>
              </button>
            </div>
            {exportState === 'failed' && <p className="export-error">Pack assembly failed. Check the browser console.</p>}
          </aside>
        </section>

        <section className="principles">
          <article><span>01</span><h2>World-level coherence</h2><p>One versioned spec controls the whole pack—not a folder of unrelated prompts.</p></article>
          <article><span>02</span><h2>Portable output</h2><p>PNG + JSON works today; automated Godot import validation is the planned next milestone.</p></article>
          <article><span>03</span><h2>Traceable by default</h2><p>Seeds, providers, licenses, versions, and transformations travel with every pack.</p></article>
        </section>
      </main>

      <footer>
        <span>Mapsoo Worldsmith · MIT source</span>
        <span>Don’t prompt for pictures. Build playable worlds.</span>
      </footer>
    </div>
  );
}
