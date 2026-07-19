import { buildAlpha4PortablePack } from '../../src/adapters/export-browser-pack-alpha4';
import { parseStoyoAssetRequestJson } from '../../src/adapters/import-stoyo-asset-request';
import { runGenerationProviderWithEvidence } from '../../src/core/generation-provider';
import { ALPHA4_PACK_VERSION } from '../../src/core/pack-manifest-alpha4';
import type { WorldSpec } from '../../src/core/world-spec';
import historicalWorldSpec from '../../examples/sunny-meadow.world.json';
import { PROCEDURAL_TERRAIN_PROVIDER } from '../../src/providers/procedural-terrain-provider';
import stoyoExampleRequest from '../../examples/integrations/stoyo/river-valley-asset-request.json';

const FIXED_COMPLETION_TIME = '2026-07-19T08:00:00.000Z';

function base64(bytes: Uint8Array): string {
  const chunks: string[] = [];
  for (let offset = 0; offset < bytes.byteLength; offset += 0x8000) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)));
  }
  return btoa(chunks.join(''));
}

async function exportDefaultPack(): Promise<void> {
  const result = document.querySelector<HTMLPreElement>('#result');
  const error = document.querySelector<HTMLPreElement>('#error');
  if (!result || !error) throw new Error('Browser export harness markup is incomplete.');

  try {
    const run = await runGenerationProviderWithEvidence(
      PROCEDURAL_TERRAIN_PROVIDER,
      historicalWorldSpec as unknown as WorldSpec,
      { now: () => new Date(FIXED_COMPLETION_TIME) },
    );
    const pack = await buildAlpha4PortablePack(run);
    const stoyoImport = await parseStoyoAssetRequestJson(JSON.stringify(stoyoExampleRequest));
    if (!stoyoImport.ok) throw new Error(`STOYO browser import failed: ${stoyoImport.code}`);
    const bytes = new Uint8Array(await pack.blob.arrayBuffer());
    result.dataset.filename = pack.filename;
    result.dataset.version = ALPHA4_PACK_VERSION;
    result.dataset.stoyoRequestSha256 = stoyoImport.projection.assetRequestSha256;
    result.dataset.stoyoWorldId = stoyoImport.projection.worldSpec.id;
    result.textContent = base64(bytes);
    document.documentElement.dataset.state = 'ready';
  } catch (cause) {
    error.textContent = cause instanceof Error ? cause.stack ?? cause.message : String(cause);
    document.documentElement.dataset.state = 'failed';
  }
}

void exportDefaultPack();
