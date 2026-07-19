const REPOSITORY_URL = 'https://github.com/babyrush0101-source/mapsoo-kids';
export const CURRENT_PUBLIC_RELEASE_VERSION = '0.1.0-alpha.7' as const;
const tag = `v${CURRENT_PUBLIC_RELEASE_VERSION}`;
const releaseDownloadUrl = `${REPOSITORY_URL}/releases/download/${tag}`;

function publicPack(id: string, filename: string, sha256: string) {
  return Object.freeze({ id, filename, url: `${releaseDownloadUrl}/${filename}`, sha256 });
}

const sunnyMeadowPack = publicPack(
  'sunny-meadow',
  `mapsoo-sunny-meadow-${tag}.zip`,
  '6113b30fec3615b72730d8d775919aa3c5552285c614b6916a109b887ab8012c',
);
const dustwindOutpostPack = publicPack(
  'dustwind-outpost',
  `mapsoo-dustwind-outpost-${tag}.zip`,
  'd6dd38a47522f45d24184d9b6869d92b89cc2ae3ad1c2ca1eab0b9cf4b13a502',
);
const frostwatchValePack = publicPack(
  'frostwatch-vale',
  `mapsoo-frostwatch-vale-${tag}.zip`,
  '35a49edd901becae1422731a132803eebaf07659fc3d69efa7d39cd1e87b9e12',
);

export const CURRENT_PUBLIC_RELEASE = Object.freeze({
  version: CURRENT_PUBLIC_RELEASE_VERSION,
  tag,
  releaseUrl: `${REPOSITORY_URL}/releases/tag/${tag}`,
  assetPack: sunnyMeadowPack,
  assetPacks: Object.freeze([sunnyMeadowPack, dustwindOutpostPack, frostwatchValePack]),
  godotImporter: Object.freeze({
    filename: `mapsoo-godot-importer-${tag}.zip`,
    url: `${releaseDownloadUrl}/mapsoo-godot-importer-${tag}.zip`,
    sha256: '674ce0a057c1808b8d2b04e706a26031aa7ca321304ce34c0e6a2f3553bd6a26',
  }),
  firstImportGuideUrl: `${REPOSITORY_URL}/blob/main/docs/releases/v0.1.0-alpha.7.md`,
  feedbackFormUrl: `${REPOSITORY_URL}/issues/new?template=first-import-feedback.yml`,
  feedbackIndexUrl: `${REPOSITORY_URL}/issues/12`,
} as const);
