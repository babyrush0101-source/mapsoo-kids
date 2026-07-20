import { useEffect, useRef, useState, type ChangeEvent } from 'react';

import type { Alpha9PortablePack } from '../../adapters/export-world-asset-pack-alpha9';
import { readBrowserReferenceImage, type BrowserReferenceImage } from '../../adapters/read-reference-image-file';
import { bindGenerationRequestV2 } from '../../core/generation-request-v2';
import { runWorldAssetProvider } from '../../core/world-asset-provider';

type GeneratorState = 'idle' | 'reading' | 'generating' | 'ready' | 'error';

function downloadBytes(filename: string, bytes: Uint8Array): void {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/zip' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function safeMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'World asset generation failed.';
}

export function ReferenceWorldGenerator() {
  const abortRef = useRef<AbortController | null>(null);
  const [environment, setEnvironment] = useState<BrowserReferenceImage | null>(null);
  const [character, setCharacter] = useState<BrowserReferenceImage | null>(null);
  const [worldId, setWorldId] = useState('my-farm-world');
  const [description, setDescription] = useState('A welcoming riverside farm with a small house, barn, crops and wildflowers.');
  const [seed, setSeed] = useState('farm-world-001');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [state, setState] = useState<GeneratorState>('idle');
  const [notice, setNotice] = useState('Choose two references to begin.');
  const [pack, setPack] = useState<Alpha9PortablePack | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => () => {
    abortRef.current?.abort();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  async function chooseFile(event: ChangeEvent<HTMLInputElement>, role: 'environment-style' | 'character') {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setState('reading');
    setNotice(`Checking ${role === 'environment-style' ? 'environment' : 'character'} reference…`);
    try {
      const image = await readBrowserReferenceImage(file, role);
      if (role === 'environment-style') setEnvironment(image); else setCharacter(image);
      setPack(null);
      setState('idle');
      setNotice(`${role === 'environment-style' ? 'Environment' : 'Character'} reference accepted: ${image.descriptor.width}×${image.descriptor.height}.`);
    } catch (error) {
      setState('error');
      setNotice(safeMessage(error));
    }
  }

  async function generate() {
    if (!environment || !character || !rightsConfirmed) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState('generating');
    setPack(null);
    setNotice('Generating the complete farm asset graph…');
    try {
      const [{ PROCEDURAL_TOPDOWN_FARM_PROVIDER }, { buildAlpha9WorldAssetPack }] = await Promise.all([
        import('../../providers/procedural-topdown-farm-provider'),
        import('../../adapters/export-world-asset-pack-alpha9'),
      ]);
      const job = await bindGenerationRequestV2({
        schemaVersion: '1.0.0', id: worldId, profile: 'topdown-farm', description, seed,
        references: [environment.descriptor, character.descriptor],
      }, [
        { path: environment.descriptor.path, bytes: environment.bytes },
        { path: character.descriptor.path, bytes: character.bytes },
      ]);
      const result = await runWorldAssetProvider(PROCEDURAL_TOPDOWN_FARM_PROVIDER, job, { signal: controller.signal });
      const nextPack = await buildAlpha9WorldAssetPack(result, job.request, new Date().toISOString());
      const preview = result.payloads.find((payload) => payload.assetId === 'world-preview');
      if (!preview) throw new Error('Generated pack is missing its world preview.');
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const previewBytes = preview.readBytes();
      const previewBuffer = new ArrayBuffer(previewBytes.byteLength);
      new Uint8Array(previewBuffer).set(previewBytes);
      setPreviewUrl(URL.createObjectURL(new Blob([previewBuffer], { type: 'image/png' })));
      setPack(nextPack);
      setState('ready');
      setNotice(`Complete Pack 0.6 ready: ${result.bundle.assets.length} files, 21 required roles, 8 character clips.`);
    } catch (error) {
      if (controller.signal.aborted) return;
      setState('error');
      setNotice(safeMessage(error));
    }
  }

  const canGenerate = Boolean(
    environment && character && rightsConfirmed
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(worldId)
    && description.trim() && seed.trim()
    && state !== 'reading' && state !== 'generating',
  );

  return (
    <section className="reference-generator" aria-labelledby="reference-generator-title">
      <div className="reference-generator-heading">
        <div>
          <p className="eyebrow">Alpha 9 · complete 2D world job</p>
          <h2 id="reference-generator-title">Two references in. A Godot world pack out.</h2>
        </div>
        <p>Top-down farm is implemented end to end. Side platformer, isometric action and layered-depth 2D remain planned profiles.</p>
      </div>
      <div className="reference-generator-grid">
        <div className="reference-generator-form">
          <div className="reference-upload-grid">
            <label className={environment ? 'reference-upload is-ready' : 'reference-upload'}>
              <span>Environment style</span>
              <strong>{environment ? `${environment.descriptor.width}×${environment.descriptor.height} accepted` : 'Choose PNG or JPEG'}</strong>
              <input type="file" accept="image/png,image/jpeg" onChange={(event) => void chooseFile(event, 'environment-style')} />
            </label>
            <label className={character ? 'reference-upload is-ready' : 'reference-upload'}>
              <span>Character reference</span>
              <strong>{character ? `${character.descriptor.width}×${character.descriptor.height} accepted` : 'Choose PNG or JPEG'}</strong>
              <input type="file" accept="image/png,image/jpeg" onChange={(event) => void chooseFile(event, 'character')} />
            </label>
          </div>
          <div className="two-column-fields">
            <label>World ID<input value={worldId} maxLength={80} onChange={(event) => setWorldId(event.target.value)} /></label>
            <label>Seed<input value={seed} maxLength={160} onChange={(event) => setSeed(event.target.value)} /></label>
          </div>
          <p className="reference-generator-status">World ID and seed are public: they are written into the ZIP name, manifest, README, and receipt.</p>
          <label>Description<textarea rows={4} maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label className="rights-confirmation">
            <input type="checkbox" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} />
            <span>I own both references and allow generative adaptation, redistribution, and CC0 dedication of the newly generated output.</span>
          </label>
          <button className="primary-action" type="button" disabled={!canGenerate} onClick={() => void generate()}>
            <span>{state === 'generating' ? 'Generating complete pack…' : 'Generate complete farm pack'}</span><span>→</span>
          </button>
          <p className={`reference-generator-status ${state === 'error' ? 'error' : ''}`} aria-live="polite">{notice}</p>
        </div>
        <div className="reference-generator-output">
          {previewUrl ? <img src={previewUrl} alt="Generated top-down farm preview" /> : (
            <div className="reference-output-placeholder"><strong>World preview</strong><span>Terrain, props, structures, crops and the matched player will appear here.</span></div>
          )}
          <div className="reference-output-meta">
            <span>Pack 0.6</span><span>Godot 4.3+</span><span>CC0 output</span><span>No reference images embedded</span>
          </div>
          <button className="secondary-action is-ready" type="button" disabled={!pack} onClick={() => pack && downloadBytes(pack.filename, pack.bytes)}>
            {pack ? `Download ${pack.filename}` : 'Generate before downloading'}
          </button>
        </div>
      </div>
    </section>
  );
}
