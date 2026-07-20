import { useEffect, useRef, useState, type ChangeEvent } from 'react';

import { readBrowserReferenceImage, type BrowserReferenceImage } from '../../adapters/read-reference-image-file';
import {
  generateReferenceWorldPack,
  type DownloadableWorldPack,
  type ImplementedReferenceWorldProfile,
} from './generate-reference-world-pack';

type GeneratorState = 'idle' | 'reading' | 'generating' | 'ready' | 'error';

interface ReferenceWorldGeneratorProps {
  readonly initialProfile?: ImplementedReferenceWorldProfile;
}

const PROFILE_COPY = Object.freeze({
  'topdown-farm': Object.freeze({
    pack: 'Pack 0.6', action: 'Generate complete farm pack', alt: 'Generated top-down farm preview',
    placeholder: 'Terrain, props, structures, crops and the matched player will appear here.',
    support: 'Godot 4.3+ importer verified', status: 'Published Alpha9 path',
  }),
  'side-platformer': Object.freeze({
    pack: 'Pack 0.7', action: 'Generate complete side-platformer pack', alt: 'Generated side-platformer preview',
    placeholder: 'Platforms, hazards, structures, layered backgrounds and the matched player will appear here.',
    support: 'Godot importer candidate', status: 'Alpha10 candidate',
  }),
});

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

export function ReferenceWorldGenerator({ initialProfile = 'topdown-farm' }: ReferenceWorldGeneratorProps) {
  const abortRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);
  const previewUrlRef = useRef<string | null>(null);
  const [environment, setEnvironment] = useState<BrowserReferenceImage | null>(null);
  const [character, setCharacter] = useState<BrowserReferenceImage | null>(null);
  const [profile, setProfile] = useState<ImplementedReferenceWorldProfile>(initialProfile);
  const [worldId, setWorldId] = useState('my-2d-world');
  const [description, setDescription] = useState('A welcoming riverside world with readable paths, landmarks and a distinctive player character.');
  const [seed, setSeed] = useState('world-001');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [state, setState] = useState<GeneratorState>('idle');
  const [notice, setNotice] = useState('Choose two references to begin.');
  const [pack, setPack] = useState<DownloadableWorldPack | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => () => {
    abortRef.current?.abort();
    generationRef.current += 1;
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  function replacePreviewUrl(nextUrl: string | null): void {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = nextUrl;
    setPreviewUrl(nextUrl);
  }

  function clearGeneratedResult(nextNotice: string): void {
    abortRef.current?.abort();
    generationRef.current += 1;
    setPack(null);
    replacePreviewUrl(null);
    setState('idle');
    setNotice(nextNotice);
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>, role: 'environment-style' | 'character') {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    clearGeneratedResult(`Checking ${role === 'environment-style' ? 'environment' : 'character'} reference…`);
    setState('reading');
    const token = generationRef.current;
    try {
      const image = await readBrowserReferenceImage(file, role);
      if (token !== generationRef.current) return;
      if (role === 'environment-style') setEnvironment(image); else setCharacter(image);
      setState('idle');
      setNotice(`${role === 'environment-style' ? 'Environment' : 'Character'} reference accepted: ${image.descriptor.width}×${image.descriptor.height}.`);
    } catch (error) {
      if (token !== generationRef.current) return;
      setState('error');
      setNotice(safeMessage(error));
    }
  }

  async function generate() {
    if (!environment || !character || !rightsConfirmed) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const token = generationRef.current + 1;
    generationRef.current = token;
    setState('generating');
    setPack(null);
    setNotice(`Generating the complete ${profile === 'topdown-farm' ? 'farm' : 'side-platformer'} asset graph…`);
    try {
      const generated = await generateReferenceWorldPack({
        profile, environment, character, worldId, description, seed,
        completedAt: new Date().toISOString(), signal: controller.signal,
      });
      if (controller.signal.aborted || token !== generationRef.current) return;
      const previewBuffer = new ArrayBuffer(generated.previewBytes.byteLength);
      new Uint8Array(previewBuffer).set(generated.previewBytes);
      replacePreviewUrl(URL.createObjectURL(new Blob([previewBuffer], { type: 'image/png' })));
      setPack(generated.pack);
      setState('ready');
      setNotice(`Complete Pack ${generated.packSchemaVersion} ready: ${generated.generatedFileCount} generated files, ${generated.requiredRoleCount} required roles, ${generated.characterClipCount} character clips.`);
    } catch (error) {
      if (controller.signal.aborted || token !== generationRef.current) return;
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
  const copy = PROFILE_COPY[profile];

  return (
    <section className="reference-generator" aria-labelledby="reference-generator-title">
      <div className="reference-generator-heading">
        <div>
          <p className="eyebrow">Alpha 10 workbench · complete 2D world job</p>
          <h2 id="reference-generator-title">Two references in. A world asset pack out.</h2>
        </div>
        <p>Farm is the published Alpha9 path. Side platformer is an Alpha10 source-pack candidate; its Godot importer is still planned. Isometric action and layered-depth 2D remain planned.</p>
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
          <label>World profile
            <select value={profile} onChange={(event) => {
              const next = event.target.value as ImplementedReferenceWorldProfile;
              setProfile(next);
              clearGeneratedResult('Profile changed. Generate a new pack for this world type.');
            }}>
              <option value="topdown-farm">Top-down farm — implemented / published Alpha9</option>
              <option value="side-platformer">Side platformer — experimental Alpha10 candidate</option>
              <option value="isometric-action" disabled>Isometric action — planned</option>
              <option value="layered-depth-2d" disabled>Layered-depth 2D — planned</option>
            </select>
          </label>
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
            <span>{state === 'generating' ? 'Generating complete pack…' : copy.action}</span><span>→</span>
          </button>
          <p className={`reference-generator-status ${state === 'error' ? 'error' : ''}`} aria-live="polite">{notice}</p>
        </div>
        <div className="reference-generator-output">
          {previewUrl ? <img src={previewUrl} alt={copy.alt} /> : (
            <div className="reference-output-placeholder"><strong>World preview</strong><span>{copy.placeholder}</span></div>
          )}
          <div className="reference-output-meta">
            <span>{copy.pack}</span><span>{copy.status}</span><span>{copy.support}</span><span>CC0 output</span><span>No reference images embedded</span>
          </div>
          <button className="secondary-action is-ready" type="button" disabled={!pack} onClick={() => pack && downloadBytes(pack.filename, pack.bytes)}>
            {pack ? `Download ${pack.filename}` : 'Generate before downloading'}
          </button>
        </div>
      </div>
    </section>
  );
}
