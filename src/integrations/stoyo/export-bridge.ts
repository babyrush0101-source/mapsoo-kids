import { parseStrictJsonDocument, type StrictJsonImportErrorCode } from '../../adapters/import-world-spec';
import {
  ALPHA6_WORLD_SCHEMA_VERSION,
  WORLD_SCHEMA_VERSION,
  migrateWorldSpecV020,
  type WorldSpecV020,
  type WorldSpecV030,
} from '../../core/world-spec';
import {
  projectStoyoAssetRequest,
  STOYO_ASSET_REQUEST_EXTENSION,
  StoyoAssetRequestError,
  type StoyoAssetRequestErrorCode,
} from './asset-request';

export const STOYO_MAPSOO_EXPORT_SCHEMA_VERSION = 'dev.stoyo.mapsoo-export-receipt/1.0.0' as const;

export type StoyoExportBridgeErrorCode = StrictJsonImportErrorCode | StoyoAssetRequestErrorCode | 'export.invalid-binding';

export class StoyoExportBridgeError extends Error {
  constructor(readonly code: StoyoExportBridgeErrorCode, message: string) {
    super(message);
    this.name = 'StoyoExportBridgeError';
  }
}

export interface StoyoPublicPackBinding {
  readonly packId: string;
  readonly assetRequestSha256: string;
  readonly stoyoWorldId: string;
  readonly stoyoWorldVersion: string;
  readonly sceneId: string;
  readonly requiredSceneTags: readonly string[];
  readonly contentRating: string;
}

export interface PreparedStoyoPackExport {
  readonly worldSpec: WorldSpecV030;
  readonly binding: StoyoPublicPackBinding;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredText(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new StoyoExportBridgeError('export.invalid-binding', `Projected STOYO binding is missing ${key}.`);
  }
  return value;
}

function snapshotBinding(worldSpec: WorldSpecV030, assetRequestSha256: string): StoyoPublicPackBinding {
  const extension = worldSpec.extensions?.[STOYO_ASSET_REQUEST_EXTENSION];
  if (!isRecord(extension)) {
    throw new StoyoExportBridgeError('export.invalid-binding', 'Projected World Spec is missing the STOYO binding.');
  }
  const tags = extension.requiredSceneTags;
  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string')) {
    throw new StoyoExportBridgeError('export.invalid-binding', 'Projected STOYO binding has invalid scene tags.');
  }
  if (requiredText(extension, 'assetRequestSha256') !== assetRequestSha256) {
    throw new StoyoExportBridgeError('export.invalid-binding', 'Projected STOYO request hash does not match its binding.');
  }
  return Object.freeze({
    packId: worldSpec.id,
    assetRequestSha256,
    stoyoWorldId: requiredText(extension, 'stoyoWorldId'),
    stoyoWorldVersion: requiredText(extension, 'stoyoWorldVersion'),
    sceneId: requiredText(extension, 'sceneId'),
    requiredSceneTags: Object.freeze([...tags]),
    contentRating: requiredText(extension, 'contentRating'),
  });
}

/**
 * Validates the public-safe STOYO request and losslessly advances its World
 * Spec 0.2 projection to the current Alpha.7 export contract. It deliberately
 * invents neither semantic places nor structures.
 */
export async function prepareStoyoPackExport(jsonText: string): Promise<PreparedStoyoPackExport> {
  const parsed = parseStrictJsonDocument(jsonText, 'STOYO Asset Request');
  if (!parsed.ok) throw new StoyoExportBridgeError(parsed.code, parsed.message);

  let projection;
  try {
    projection = await projectStoyoAssetRequest(parsed.value);
  } catch (error) {
    if (error instanceof StoyoAssetRequestError) {
      throw new StoyoExportBridgeError(error.code, error.message);
    }
    throw error;
  }

  if (projection.worldSpec.schemaVersion !== WORLD_SCHEMA_VERSION) {
    throw new StoyoExportBridgeError(
      'export.invalid-binding',
      `STOYO Asset Request 1.0 must project to World Spec ${WORLD_SCHEMA_VERSION}.`,
    );
  }
  const worldSpec = migrateWorldSpecV020(projection.worldSpec as WorldSpecV020);
  if (worldSpec.schemaVersion !== ALPHA6_WORLD_SCHEMA_VERSION || worldSpec.places || worldSpec.structures) {
    throw new StoyoExportBridgeError(
      'export.invalid-binding',
      'The STOYO export bridge must not invent semantic places or structures.',
    );
  }
  const binding = snapshotBinding(worldSpec, projection.assetRequestSha256);
  return Object.freeze({ worldSpec: structuredClone(worldSpec), binding });
}
