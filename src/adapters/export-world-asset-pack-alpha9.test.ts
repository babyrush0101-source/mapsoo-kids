import JSZip from 'jszip';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';

import packSchema from '../../schemas/mapsoo-pack-0.6.schema.json';
import { encodeRgbaPng } from './canvas/encode-png';
import { bindGenerationRequestV2 } from '../core/generation-request-v2';
import { runWorldAssetProvider } from '../core/world-asset-provider';
import { PROCEDURAL_TOPDOWN_FARM_PROVIDER } from '../providers/procedural-topdown-farm-provider';
import { buildAlpha9WorldAssetPack } from './export-world-asset-pack-alpha9';

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes.slice().buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function makeJob() {
  const environment = encodeRgbaPng(1, 1, Uint8Array.from([30, 150, 80, 255]));
  const character = encodeRgbaPng(1, 1, Uint8Array.from([180, 80, 130, 255]));
  const descriptor = async (role: 'environment-style' | 'character', bytes: Uint8Array) => ({
    id: `${role}-reference`, role, path: `private/${role}.png`, mediaType: 'image/png' as const,
    byteLength: bytes.byteLength, width: 1, height: 1, sha256: await sha256(bytes),
    rights: { basis: 'owned' as const, license: 'LicenseRef-User-Owned', allowGenerativeAdaptation: true as const, allowOutputRedistribution: true as const },
  });
  return bindGenerationRequestV2({
    schemaVersion: '1.0.0', id: 'portable-farm-job', profile: 'topdown-farm',
    description: 'Private farm direction.', seed: 'portable-seed',
    references: [await descriptor('environment-style', environment), await descriptor('character', character)],
  }, [{ path: 'private/environment-style.png', bytes: environment }, { path: 'private/character.png', bytes: character }]);
}

describe('Alpha.9 Pack 0.6 exporter', () => {
  it('builds a schema-valid exact-coverage portable ZIP without reference leakage', async () => {
    const job = await makeJob();
    const run = await runWorldAssetProvider(PROCEDURAL_TOPDOWN_FARM_PROVIDER, job);
    const pack = await buildAlpha9WorldAssetPack(run, job.request, '2026-07-20T12:00:00.000Z');
    const zip = await JSZip.loadAsync(pack.bytes);
    const root = `mapsoo-portable-farm-job-v0.1.0-alpha.9/`;
    const manifestText = await zip.file(`${root}mapsoo.manifest.json`)!.async('string');
    const manifest = JSON.parse(manifestText);
    const ajv = new Ajv2020({ strict: true, strictTypes: false, allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(packSchema);
    expect(validate(manifest), JSON.stringify(validate.errors)).toBe(true);
    expect(Object.keys(zip.files).sort()).toEqual([
      `${root}mapsoo.manifest.json`, ...manifest.files.map(({ path }: { path: string }) => `${root}${path}`),
    ].sort());
    expect(pack.filename).toBe('mapsoo-portable-farm-job-v0.1.0-alpha.9.zip');
    expect(manifestText).not.toContain('private/');
    expect(manifestText).not.toContain('Private farm direction');
  });

  it('is byte-identical for the same trusted run and completion timestamp', async () => {
    const job = await makeJob();
    const run = await runWorldAssetProvider(PROCEDURAL_TOPDOWN_FARM_PROVIDER, job);
    const first = await buildAlpha9WorldAssetPack(run, job.request, '2026-07-20T12:00:00.000Z');
    const second = await buildAlpha9WorldAssetPack(run, job.request, '2026-07-20T12:00:00.000Z');
    expect(first.bytes).toEqual(second.bytes);
  });
});
