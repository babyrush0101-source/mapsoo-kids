const REPOSITORY_URL = 'https://github.com/babyrush0101-source/mapsoo-kids';
export const CURRENT_PUBLIC_RELEASE_VERSION = '0.1.0-alpha.5' as const;
const tag = `v${CURRENT_PUBLIC_RELEASE_VERSION}`;
const releaseDownloadUrl = `${REPOSITORY_URL}/releases/download/${tag}`;

export const CURRENT_PUBLIC_RELEASE = Object.freeze({
  version: CURRENT_PUBLIC_RELEASE_VERSION,
  tag,
  releaseUrl: `${REPOSITORY_URL}/releases/tag/${tag}`,
  assetPack: Object.freeze({
    filename: `mapsoo-sunny-meadow-${tag}.zip`,
    url: `${releaseDownloadUrl}/mapsoo-sunny-meadow-${tag}.zip`,
    sha256: '8d86124a4a37fa4a78487c4e91cb7f5024561f140814a5fd139c5b93fde54f36',
  }),
  godotImporter: Object.freeze({
    filename: `mapsoo-godot-importer-${tag}.zip`,
    url: `${releaseDownloadUrl}/mapsoo-godot-importer-${tag}.zip`,
    sha256: '6020bda92da56aacb924b994990bc6bd20086ddd1370f71eee36f9ee782c9894',
  }),
  firstImportGuideUrl: `${REPOSITORY_URL}/blob/main/docs/10_FIRST_GODOT_IMPORT.md`,
  feedbackFormUrl: `${REPOSITORY_URL}/issues/new?template=first-import-feedback.yml`,
  feedbackIndexUrl: `${REPOSITORY_URL}/issues/12`,
} as const);
