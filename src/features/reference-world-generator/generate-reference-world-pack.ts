import type { BrowserReferenceImage } from '../../adapters/read-reference-image-file';
import { bindGenerationRequestV2 } from '../../core/generation-request-v2';
import { runWorldAssetProvider, type WorldAssetGenerationResult } from '../../core/world-asset-provider';

export const IMPLEMENTED_REFERENCE_WORLD_PROFILES = Object.freeze(['topdown-farm', 'side-platformer'] as const);
export type ImplementedReferenceWorldProfile = typeof IMPLEMENTED_REFERENCE_WORLD_PROFILES[number];

export interface DownloadableWorldPack {
  readonly filename: string;
  readonly bytes: Uint8Array;
}

export interface GenerateReferenceWorldPackInput {
  readonly profile: ImplementedReferenceWorldProfile;
  readonly environment: BrowserReferenceImage;
  readonly character: BrowserReferenceImage;
  readonly worldId: string;
  readonly description: string;
  readonly seed: string;
  readonly completedAt: string;
  readonly signal?: AbortSignal;
}

export interface GeneratedReferenceWorldPack {
  readonly profile: ImplementedReferenceWorldProfile;
  readonly packSchemaVersion: '0.6.0' | '0.7.0';
  readonly pack: DownloadableWorldPack;
  readonly previewBytes: Uint8Array;
  readonly generatedFileCount: number;
  readonly requiredRoleCount: 21 | 30;
  readonly characterClipCount: 8 | 12;
}

function abortIfNeeded(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('World generation was aborted.', 'AbortError');
}

export async function generateReferenceWorldPack(input: GenerateReferenceWorldPackInput): Promise<GeneratedReferenceWorldPack> {
  if (!IMPLEMENTED_REFERENCE_WORLD_PROFILES.includes(input.profile)) {
    throw new Error(`No complete reference-world pipeline is implemented for ${String(input.profile)}.`);
  }
  abortIfNeeded(input.signal);
  const job = await bindGenerationRequestV2({
    schemaVersion: '1.0.0', id: input.worldId, profile: input.profile,
    description: input.description, seed: input.seed,
    references: [input.environment.descriptor, input.character.descriptor],
  }, [
    { path: input.environment.descriptor.path, bytes: input.environment.bytes },
    { path: input.character.descriptor.path, bytes: input.character.bytes },
  ]);
  abortIfNeeded(input.signal);

  let result: WorldAssetGenerationResult;
  let pack: DownloadableWorldPack;
  let packSchemaVersion: '0.6.0' | '0.7.0';
  let requiredRoleCount: 21 | 30;
  let characterClipCount: 8 | 12;
  if (input.profile === 'topdown-farm') {
    const [{ PROCEDURAL_TOPDOWN_FARM_PROVIDER }, { buildAlpha9WorldAssetPack }] = await Promise.all([
      import('../../providers/procedural-topdown-farm-provider'),
      import('../../adapters/export-world-asset-pack-alpha9'),
    ]);
    abortIfNeeded(input.signal);
    result = await runWorldAssetProvider(PROCEDURAL_TOPDOWN_FARM_PROVIDER, job, { signal: input.signal });
    abortIfNeeded(input.signal);
    pack = await buildAlpha9WorldAssetPack(result, job.request, input.completedAt);
    packSchemaVersion = '0.6.0'; requiredRoleCount = 21; characterClipCount = 8;
  } else {
    const [{ PROCEDURAL_SIDE_PLATFORMER_PROVIDER }, { buildAlpha10WorldAssetPack }] = await Promise.all([
      import('../../providers/procedural-side-platformer-provider'),
      import('../../adapters/export-world-asset-pack-alpha10'),
    ]);
    abortIfNeeded(input.signal);
    result = await runWorldAssetProvider(PROCEDURAL_SIDE_PLATFORMER_PROVIDER, job, { signal: input.signal });
    abortIfNeeded(input.signal);
    pack = await buildAlpha10WorldAssetPack(result, job.request, input.completedAt);
    packSchemaVersion = '0.7.0'; requiredRoleCount = 30; characterClipCount = 12;
  }
  abortIfNeeded(input.signal);
  const preview = result.payloads.find((payload) => payload.assetId === 'world-preview');
  if (!preview) throw new Error('Generated pack is missing its world preview.');
  return Object.freeze({
    profile: input.profile,
    packSchemaVersion,
    pack: Object.freeze({ filename: pack.filename, bytes: pack.bytes.slice() }),
    previewBytes: preview.readBytes(),
    generatedFileCount: result.bundle.assets.length,
    requiredRoleCount,
    characterClipCount,
  });
}
