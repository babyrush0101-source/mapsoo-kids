const REPOSITORY_URL = 'https://github.com/babyrush0101-source/mapsoo-kids';
export const CURRENT_PUBLIC_RELEASE_VERSION = '0.1.0-alpha.4' as const;
const tag = `v${CURRENT_PUBLIC_RELEASE_VERSION}`;
const releaseDownloadUrl = `${REPOSITORY_URL}/releases/download/${tag}`;

export const CURRENT_PUBLIC_RELEASE = Object.freeze({
  version: CURRENT_PUBLIC_RELEASE_VERSION,
  tag,
  releaseUrl: `${REPOSITORY_URL}/releases/tag/${tag}`,
  assetPack: Object.freeze({
    filename: `mapsoo-sunny-meadow-${tag}.zip`,
    url: `${releaseDownloadUrl}/mapsoo-sunny-meadow-${tag}.zip`,
    sha256: 'a57e810baaf2f015d7db96bf0e88ab7b6340d476a61ade7447735a6109b8fb35',
  }),
  godotImporter: Object.freeze({
    filename: `mapsoo-godot-importer-${tag}.zip`,
    url: `${releaseDownloadUrl}/mapsoo-godot-importer-${tag}.zip`,
    sha256: '428fdab014682fcee49b7777f9647f9222ee9793d55fd2b25053460912f167fb',
  }),
  firstImportGuideUrl: `${REPOSITORY_URL}/blob/main/docs/10_FIRST_GODOT_IMPORT.md`,
  feedbackFormUrl: `${REPOSITORY_URL}/issues/new?template=first-import-feedback.yml`,
  feedbackIndexUrl: `${REPOSITORY_URL}/issues/12`,
} as const);
