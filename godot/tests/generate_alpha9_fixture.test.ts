import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';

import { encodeRgbaPng } from '../../src/adapters/canvas/encode-png';
import { buildAlpha9WorldAssetPack } from '../../src/adapters/export-world-asset-pack-alpha9';
import { bindGenerationRequestV2 } from '../../src/core/generation-request-v2';
import { runWorldAssetProvider } from '../../src/core/world-asset-provider';
import { PROCEDURAL_TOPDOWN_FARM_PROVIDER } from '../../src/providers/procedural-topdown-farm-provider';

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes.slice().buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function buildFixture() {
  const environment = encodeRgbaPng(2, 2, Uint8Array.from([
    20, 140, 70, 255, 60, 170, 90, 255,
    40, 100, 180, 255, 200, 160, 90, 255,
  ]));
  const character = encodeRgbaPng(2, 2, Uint8Array.from([
    180, 40, 110, 255, 230, 180, 140, 255,
    70, 80, 160, 255, 30, 30, 40, 255,
  ]));
  const reference = async (role: 'environment-style' | 'character', bytes: Uint8Array) => ({
    id: role === 'environment-style' ? 'environment-reference' : 'character-reference',
    role,
    path: `references/${role}.png`,
    mediaType: 'image/png' as const,
    byteLength: bytes.byteLength,
    width: 2,
    height: 2,
    sha256: await sha256(bytes),
    rights: {
      basis: 'owned' as const,
      license: 'LicenseRef-User-Owned',
      allowGenerativeAdaptation: true as const,
      allowOutputRedistribution: true as const,
    },
  });
  const request = await bindGenerationRequestV2({
    schemaVersion: '1.0.0',
    id: 'alpha9-godot-smoke-pack',
    profile: 'topdown-farm',
    description: 'A bright riverside farm used only for the public importer smoke fixture.',
    seed: 'alpha9-godot-smoke-001',
    references: [
      await reference('environment-style', environment),
      await reference('character', character),
    ],
  }, [
    { path: 'references/environment-style.png', bytes: environment },
    { path: 'references/character.png', bytes: character },
  ]);
  const result = await runWorldAssetProvider(PROCEDURAL_TOPDOWN_FARM_PROVIDER, request);
  return buildAlpha9WorldAssetPack(result, request.request, '2026-07-20T00:00:00.000Z');
}

async function extractFixture(bytes: Uint8Array, outputRoot: string): Promise<void> {
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
  const archive = await JSZip.loadAsync(bytes);
  const files = Object.values(archive.files).filter((entry) => !entry.dir);
  const roots = new Set(files.map((entry) => entry.name.split('/')[0]));
  if (roots.size !== 1) throw new Error('Alpha.9 fixture archive must have exactly one root.');
  const root = [...roots][0];
  await Promise.all(files.map(async (entry) => {
    const relative = entry.name.slice(root.length + 1);
    if (!relative || relative.includes('..') || relative.startsWith('/')) {
      throw new Error(`Unsafe Alpha.9 fixture entry: ${entry.name}`);
    }
    const target = join(outputRoot, ...relative.split('/'));
    await mkdir(join(target, '..'), { recursive: true });
    await writeFile(target, await entry.async('uint8array'));
  }));
}

describe('Alpha.9 Godot fixture', () => {
  it('comes from the procedural provider and Pack 0.6 exporter', async () => {
    const pack = await buildFixture();
    expect(pack.manifest).toMatchObject({
      schema_version: '0.6.0',
      pack: { id: 'alpha9-godot-smoke-pack' },
      profile: 'topdown-farm',
      layers: expect.arrayContaining([
        { id: 'ground', order: 0 }, { id: 'water', order: 1 },
        { id: 'paths', order: 2 }, { id: 'soil', order: 3 },
        { id: 'props', order: 4 }, { id: 'structures', order: 5 }, { id: 'crops', order: 6 },
      ]),
    });
    expect(pack.manifest.character.clips).toHaveLength(8);
    expect(pack.manifest.roles.map(({ role }) => role)).toEqual(expect.arrayContaining([
      'structure.house', 'structure.barn',
      'crop.basic.stage-1', 'crop.basic.stage-2', 'crop.basic.stage-3', 'crop.basic.stage-4',
    ]));

    const outputRoot = process.env.MAPSOO_ALPHA9_FIXTURE_ROOT;
    if (outputRoot) await extractFixture(pack.bytes, outputRoot);
  });
});
