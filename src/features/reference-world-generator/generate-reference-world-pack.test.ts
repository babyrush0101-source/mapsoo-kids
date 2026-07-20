import { describe, expect, it } from 'vitest';

import { encodeRgbaPng } from '../../adapters/canvas/encode-png';
import type { BrowserReferenceImage } from '../../adapters/read-reference-image-file';
import { generateReferenceWorldPack, type ImplementedReferenceWorldProfile } from './generate-reference-world-pack';

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes.slice().buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function references(): Promise<readonly [BrowserReferenceImage, BrowserReferenceImage]> {
  const build = async (role: 'environment-style' | 'character', marker: number): Promise<BrowserReferenceImage> => {
    const bytes = encodeRgbaPng(2, 2, Uint8Array.from([marker, 90, 70, 255, 60, 120, 160, 255, 30, 50, 80, 255, 210, 170, 100, 255]));
    return {
      role,
      descriptor: {
        id: `${role}-reference`, role, path: `private/browser/${role}.png`, mediaType: 'image/png',
        byteLength: bytes.byteLength, width: 2, height: 2, sha256: await sha256(bytes),
        rights: {
          basis: 'owned', license: 'LicenseRef-User-Owned', allowGenerativeAdaptation: true,
          allowOutputRedistribution: true, allowOutputCc0Dedication: true,
        },
      },
      bytes,
    };
  };
  return [await build('environment-style', 35), await build('character', 175)];
}

async function generate(profile: ImplementedReferenceWorldProfile) {
  const [environment, character] = await references();
  return generateReferenceWorldPack({
    profile, environment, character, worldId: `route-${profile}`, description: 'A public-safe route fixture.',
    seed: 'route-seed', completedAt: '2026-07-20T12:00:00.000Z',
  });
}

describe('reference-world profile router', () => {
  it('routes farm to Alpha9 Pack 0.6 and side platformer to Alpha10 Pack 0.7', async () => {
    const farm = await generate('topdown-farm');
    const side = await generate('side-platformer');
    expect(farm).toMatchObject({ profile: 'topdown-farm', packSchemaVersion: '0.6.0', requiredRoleCount: 21, characterClipCount: 8 });
    expect(farm.pack.filename).toBe('mapsoo-route-topdown-farm-v0.1.0-alpha.9.zip');
    expect(side).toMatchObject({ profile: 'side-platformer', packSchemaVersion: '0.7.0', requiredRoleCount: 30, characterClipCount: 12 });
    expect(side.pack.filename).toBe('mapsoo-route-side-platformer-v0.1.0-alpha.10.zip');
    expect(farm.previewBytes.slice(0, 8)).toEqual(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(side.previewBytes.slice(0, 8)).toEqual(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]));
  });

  it('refuses a planned profile even if a caller bypasses the UI type', async () => {
    const [environment, character] = await references();
    await expect(generateReferenceWorldPack({
      profile: 'isometric-action' as ImplementedReferenceWorldProfile,
      environment, character, worldId: 'planned-profile', description: 'Must fail closed.', seed: 'planned-seed',
      completedAt: '2026-07-20T12:00:00.000Z',
    })).rejects.toThrow(/No complete reference-world pipeline/);
  });

  it('does not return a pack when already aborted', async () => {
    const [environment, character] = await references();
    const controller = new AbortController(); controller.abort();
    await expect(generateReferenceWorldPack({
      profile: 'side-platformer', environment, character, worldId: 'aborted-side',
      description: 'Must not finish.', seed: 'abort-seed', completedAt: '2026-07-20T12:00:00.000Z',
      signal: controller.signal,
    })).rejects.toMatchObject({ name: 'AbortError' });
  });
});
