import { describe, expect, it } from 'vitest';

import { encodeRgbaPng } from '../adapters/canvas/encode-png';
import { PROCEDURAL_TOPDOWN_FARM_PROVIDER } from '../providers/procedural-topdown-farm-provider';
import { bindGenerationRequestV2 } from './generation-request-v2';
import { projectWorldAssetReceipt } from './world-asset-receipt';
import { runWorldAssetProvider } from './world-asset-provider';

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes.slice().buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function job() {
  const environment = encodeRgbaPng(1, 1, Uint8Array.from([20, 130, 60, 255]));
  const character = encodeRgbaPng(1, 1, Uint8Array.from([180, 80, 120, 255]));
  const ref = async (role: 'environment-style' | 'character', bytes: Uint8Array) => ({
    id: `${role}-reference`, role, path: `private/user/${role}.png`, mediaType: 'image/png' as const,
    byteLength: bytes.byteLength, width: 1, height: 1, sha256: await sha256(bytes),
    rights: { basis: 'owned' as const, license: 'LicenseRef-User-Owned', allowGenerativeAdaptation: true as const, allowOutputRedistribution: true as const },
  });
  return bindGenerationRequestV2({
    schemaVersion: '1.0.0', id: 'receipt-farm-job', profile: 'topdown-farm',
    description: 'Private creative direction must not appear.', seed: 'public-seed',
    references: [await ref('environment-style', environment), await ref('character', character)],
  }, [
    { path: 'private/user/environment-style.png', bytes: environment },
    { path: 'private/user/character.png', bytes: character },
  ]);
}

describe('public world asset receipt', () => {
  it('binds output while excluding raw references and private description', async () => {
    const bound = await job();
    const run = await runWorldAssetProvider(PROCEDURAL_TOPDOWN_FARM_PROVIDER, bound);
    const receipt = await projectWorldAssetReceipt(run, bound.request, '2026-07-20T12:00:00.000Z');
    const json = JSON.stringify(receipt);
    expect(receipt.output.files).toHaveLength(run.bundle.assets.length);
    expect(json).not.toContain('private/user');
    expect(json).not.toContain('Private creative direction');
    for (const reference of bound.request.references) expect(json).not.toContain(reference.sha256);
    expect(receipt.request.fingerprint_sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects forged runs and non-canonical timestamps', async () => {
    const bound = await job();
    const run = await runWorldAssetProvider(PROCEDURAL_TOPDOWN_FARM_PROVIDER, bound);
    await expect(projectWorldAssetReceipt({ ...run }, bound.request, '2026-07-20T12:00:00.000Z')).rejects.toThrow(/trusted runner/);
    await expect(projectWorldAssetReceipt(run, bound.request, '2026-07-20T12:00:00Z')).rejects.toThrow(/canonical/);
  });
});
