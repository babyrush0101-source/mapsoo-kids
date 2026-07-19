const REPOSITORY_URL = 'https://github.com/babyrush0101-source/mapsoo-kids';
export const CURRENT_PUBLIC_RELEASE_VERSION = '0.1.0-alpha.2' as const;
const tag = `v${CURRENT_PUBLIC_RELEASE_VERSION}`;
const releaseDownloadUrl = `${REPOSITORY_URL}/releases/download/${tag}`;

export const CURRENT_PUBLIC_RELEASE = Object.freeze({
  version: CURRENT_PUBLIC_RELEASE_VERSION,
  tag,
  releaseUrl: `${REPOSITORY_URL}/releases/tag/${tag}`,
  assetPack: Object.freeze({
    filename: `mapsoo-sunny-meadow-${tag}.zip`,
    url: `${releaseDownloadUrl}/mapsoo-sunny-meadow-${tag}.zip`,
    sha256: '8c7720a8578cdc276ff69677ed0d64d8a1524d32fd00da0ffb8035b5a52bfcb6',
  }),
  godotImporter: Object.freeze({
    filename: `mapsoo-godot-importer-${tag}.zip`,
    url: `${releaseDownloadUrl}/mapsoo-godot-importer-${tag}.zip`,
    sha256: 'c5d27f6df15026006c1bec7d8086569de1527da5091a87a7f941102dd34fc726',
  }),
  firstImportGuideUrl: `${REPOSITORY_URL}/blob/main/docs/10_FIRST_GODOT_IMPORT.md`,
  feedbackFormUrl: `${REPOSITORY_URL}/issues/new?template=first-import-feedback.yml`,
  feedbackIndexUrl: `${REPOSITORY_URL}/issues/12`,
} as const);
