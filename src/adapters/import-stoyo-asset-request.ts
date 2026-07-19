import {
  readStrictJsonDocumentFile,
  parseStrictJsonDocument,
  type ReadableJsonFile,
  type StrictJsonImportErrorCode,
  type StrictJsonImportResult,
} from './import-world-spec';
import {
  projectStoyoAssetRequest,
  StoyoAssetRequestError,
  type StoyoAssetProjection,
  type StoyoAssetRequestErrorCode,
} from '../integrations/stoyo/asset-request';

export type StoyoAssetRequestImportErrorCode = StrictJsonImportErrorCode | 'import.invalid-stoyo-request';

export type StoyoAssetRequestImportResult =
  | { ok: true; projection: StoyoAssetProjection }
  | {
    ok: false;
    code: StoyoAssetRequestImportErrorCode;
    message: string;
    requestCode?: StoyoAssetRequestErrorCode;
  };

function strictImportFailure(
  result: Extract<StrictJsonImportResult, { ok: false }>,
): StoyoAssetRequestImportResult {
  return result;
}

async function projectParsedRequest(value: unknown): Promise<StoyoAssetRequestImportResult> {
  try {
    return { ok: true, projection: await projectStoyoAssetRequest(value) };
  } catch (error) {
    if (error instanceof StoyoAssetRequestError) {
      return {
        ok: false,
        code: 'import.invalid-stoyo-request',
        requestCode: error.code,
        message: `STOYO Asset Request validation failed. ${error.message}`,
      };
    }
    return {
      ok: false,
      code: 'import.invalid-stoyo-request',
      message: 'The STOYO Asset Request could not be projected into a World Spec.',
    };
  }
}

export async function parseStoyoAssetRequestJson(text: string): Promise<StoyoAssetRequestImportResult> {
  const parsed = parseStrictJsonDocument(text, 'STOYO Asset Request');
  if (!parsed.ok) return strictImportFailure(parsed);
  return projectParsedRequest(parsed.value);
}

export async function readStoyoAssetRequestFile(
  file: ReadableJsonFile,
): Promise<StoyoAssetRequestImportResult> {
  const parsed = await readStrictJsonDocumentFile(file, 'STOYO Asset Request');
  if (!parsed.ok) return strictImportFailure(parsed);
  return projectParsedRequest(parsed.value);
}
