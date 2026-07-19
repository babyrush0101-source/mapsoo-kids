const REPOSITORY_URL = 'https://github.com/babyrush0101-source/mapsoo-kids';
export const CURRENT_PUBLIC_RELEASE_VERSION = '0.1.0-alpha.3' as const;
const tag = `v${CURRENT_PUBLIC_RELEASE_VERSION}`;
const releaseDownloadUrl = `${REPOSITORY_URL}/releases/download/${tag}`;

export const CURRENT_PUBLIC_RELEASE = Object.freeze({
  version: CURRENT_PUBLIC_RELEASE_VERSION,
  tag,
  releaseUrl: `${REPOSITORY_URL}/releases/tag/${tag}`,
  assetPack: Object.freeze({
    filename: `mapsoo-sunny-meadow-${tag}.zip`,
    url: `${releaseDownloadUrl}/mapsoo-sunny-meadow-${tag}.zip`,
    sha256: 'af95a4e57187fb85d06e34ccb0e1a1b1dba9b91e8989debf4c30a93108589696',
  }),
  godotImporter: Object.freeze({
    filename: `mapsoo-godot-importer-${tag}.zip`,
    url: `${releaseDownloadUrl}/mapsoo-godot-importer-${tag}.zip`,
    sha256: '49a2c30b0df50cff46c4a2acaa5c093d0eb58733387472ab27e6e7f2dfaabd86',
  }),
  firstImportGuideUrl: `${REPOSITORY_URL}/blob/main/docs/10_FIRST_GODOT_IMPORT.md`,
  feedbackFormUrl: `${REPOSITORY_URL}/issues/new?template=first-import-feedback.yml`,
  feedbackIndexUrl: `${REPOSITORY_URL}/issues/12`,
} as const);
