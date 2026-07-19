const REPOSITORY_URL = 'https://github.com/babyrush0101-source/mapsoo-kids';
export const CURRENT_PUBLIC_RELEASE_VERSION = '0.1.0-alpha.6' as const;
const tag = `v${CURRENT_PUBLIC_RELEASE_VERSION}`;
const releaseDownloadUrl = `${REPOSITORY_URL}/releases/download/${tag}`;

export const CURRENT_PUBLIC_RELEASE = Object.freeze({
  version: CURRENT_PUBLIC_RELEASE_VERSION,
  tag,
  releaseUrl: `${REPOSITORY_URL}/releases/tag/${tag}`,
  assetPack: Object.freeze({
    filename: `mapsoo-sunny-meadow-${tag}.zip`,
    url: `${releaseDownloadUrl}/mapsoo-sunny-meadow-${tag}.zip`,
    sha256: '4563552187977b38cdba86c7d3cbf5429a67b7a0a6049e978c2ef2992ef3a054',
  }),
  godotImporter: Object.freeze({
    filename: `mapsoo-godot-importer-${tag}.zip`,
    url: `${releaseDownloadUrl}/mapsoo-godot-importer-${tag}.zip`,
    sha256: 'bbfacd2b5c8503214b7647d59e9911a34fa1b4e073f86bd1310686812c9142c0',
  }),
  firstImportGuideUrl: `${REPOSITORY_URL}/blob/main/docs/16_ALPHA6_FIRST_GODOT_IMPORT.md`,
  feedbackFormUrl: `${REPOSITORY_URL}/issues/new?template=first-import-feedback.yml`,
  feedbackIndexUrl: `${REPOSITORY_URL}/issues/12`,
} as const);
