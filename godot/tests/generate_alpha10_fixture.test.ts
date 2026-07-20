import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';

import { encodeRgbaPng } from '../../src/adapters/canvas/encode-png';
import { buildAlpha10WorldAssetPack } from '../../src/adapters/export-world-asset-pack-alpha10';
import { bindGenerationRequestV2 } from '../../src/core/generation-request-v2';
import { runWorldAssetProvider } from '../../src/core/world-asset-provider';
import { PROCEDURAL_SIDE_PLATFORMER_PROVIDER } from '../../src/providers/procedural-side-platformer-provider';

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes.slice().buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function fixture() {
  const environment = encodeRgbaPng(2, 2, Uint8Array.from([
    30, 80, 130, 255, 70, 145, 110, 255, 25, 35, 65, 255, 210, 165, 85, 255,
  ]));
  const character = encodeRgbaPng(2, 2, Uint8Array.from([
    185, 55, 105, 255, 235, 185, 135, 255, 55, 65, 145, 255, 25, 28, 38, 255,
  ]));
  const descriptor = async (role: 'environment-style' | 'character', bytes: Uint8Array) => ({
    id: `${role}-reference`, role, path: `references/${role}.png`, mediaType: 'image/png' as const,
    byteLength: bytes.byteLength, width: 2, height: 2, sha256: await sha256(bytes),
    rights: {
      basis: 'owned' as const, license: 'LicenseRef-User-Owned', allowGenerativeAdaptation: true as const,
      allowOutputRedistribution: true as const, allowOutputCc0Dedication: true as const,
    },
  });
  const request = await bindGenerationRequestV2({
    schemaVersion: '1.0.0', id: 'alpha10-godot-smoke-pack', profile: 'side-platformer',
    description: 'A public-safe side-platformer fixture with layered scenery and a matched player.',
    seed: 'alpha10-godot-smoke-001',
    references: [await descriptor('environment-style', environment), await descriptor('character', character)],
  }, [
    { path: 'references/environment-style.png', bytes: environment },
    { path: 'references/character.png', bytes: character },
  ]);
  const run = await runWorldAssetProvider(PROCEDURAL_SIDE_PLATFORMER_PROVIDER, request);
  return buildAlpha10WorldAssetPack(run, request.request, '2026-07-20T12:00:00.000Z');
}

async function extract(bytes: Uint8Array, outputRoot: string): Promise<void> {
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
  const zip = await JSZip.loadAsync(bytes);
  const files = Object.values(zip.files).filter((entry) => !entry.dir);
  const roots = new Set(files.map((entry) => entry.name.split('/')[0]));
  if (roots.size !== 1) throw new Error('Alpha10 fixture must have one archive root.');
  const root = [...roots][0];
  for (const entry of files) {
    const relative = entry.name.slice(root.length + 1);
    if (!relative || relative.includes('..') || relative.startsWith('/')) throw new Error(`Unsafe fixture path: ${entry.name}`);
    const target = join(outputRoot, ...relative.split('/'));
    await mkdir(join(target, '..'), { recursive: true });
    await writeFile(target, await entry.async('uint8array'));
  }
}

describe('Alpha10 Godot fixture', () => {
  it('materializes the exact Pack 0.7 provider/exporter candidate', async () => {
    const pack = await fixture();
    expect(pack.manifest).toMatchObject({
      schema_version: '0.7.0', pack: { id: 'alpha10-godot-smoke-pack' },
      profile: 'side-platformer', completeness_policy: 'side-platformer-complete-v1',
    });
    expect(pack.manifest.roles).toHaveLength(30);
    expect(pack.manifest.character.clips).toHaveLength(12);
    const outputRoot = process.env.MAPSOO_ALPHA10_FIXTURE_ROOT;
    if (outputRoot) await extract(pack.bytes, outputRoot);
  });
});
