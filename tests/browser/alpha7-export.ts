import { buildAlpha7PortablePack } from '../../src/adapters/export-browser-pack-alpha7';
import { WORLD_EXAMPLES } from '../../src/app/world-example-registry';
import { runGenerationProviderWithEvidence } from '../../src/core/generation-provider';
import { ALPHA7_PACK_VERSION } from '../../src/core/pack-manifest-alpha7';
import { PROCEDURAL_TERRAIN_PROVIDER } from '../../src/providers/procedural-terrain-provider';

const FIXED_COMPLETION_TIME = '2026-07-19T12:00:00.000Z';

function base64(bytes: Uint8Array): string {
  const chunks: string[] = [];
  for (let offset = 0; offset < bytes.byteLength; offset += 0x8000) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)));
  }
  return btoa(chunks.join(''));
}

async function exportThreeWorlds(): Promise<void> {
  const result = document.querySelector<HTMLPreElement>('#result');
  const error = document.querySelector<HTMLPreElement>('#error');
  if (!result || !error) throw new Error('Browser export harness markup is incomplete.');
  try {
    const exports = [];
    for (const example of WORLD_EXAMPLES) {
      const run = await runGenerationProviderWithEvidence(PROCEDURAL_TERRAIN_PROVIDER, example.spec, {
        now: () => new Date(FIXED_COMPLETION_TIME),
      });
      const pack = await buildAlpha7PortablePack(run);
      exports.push({
        id: example.id,
        filename: pack.filename,
        bytes: base64(new Uint8Array(await pack.blob.arrayBuffer())),
      });
    }
    result.dataset.version = ALPHA7_PACK_VERSION;
    result.dataset.count = String(exports.length);
    result.textContent = JSON.stringify(exports);
    document.documentElement.dataset.state = 'ready';
  } catch (cause) {
    error.textContent = cause instanceof Error ? cause.stack ?? cause.message : String(cause);
    document.documentElement.dataset.state = 'failed';
  }
}

void exportThreeWorlds();
