import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const PACKAGE_JSON_PATH = resolve(REPOSITORY_ROOT, 'package.json');

const packageJson = JSON.parse(await readFile(PACKAGE_JSON_PATH, 'utf8'));

export const PACKAGE_VERSION = packageJson.version;

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

function releaseFiles(tag) {
  return {
    web: `mapsoo-worldsmith-web-${tag}.zip`,
    godotImporter: `mapsoo-godot-importer-${tag}.zip`,
    examplePack: `mapsoo-sunny-meadow-${tag}.zip`,
    evidenceVideo: `mapsoo-worldsmith-${tag}-75s.mp4`,
    exampleWorldSpec: `sunny-meadow-${tag}.world.json`,
    worldSchema: `mapsoo-world.schema-${tag}.json`,
    packSchema: `mapsoo-pack.schema-${tag}.json`,
    license: 'LICENSE',
    changelog: 'CHANGELOG.md',
    manifest: 'release-manifest.json',
    checksums: 'SHA256SUMS',
  };
}

function assertConfig(condition, message) {
  if (!condition) throw new Error(`Invalid release config: ${message}`);
}

function assertRelativeConfigPath(path, context) {
  assertConfig(typeof path === 'string' && path.length > 0, `${context} is missing`);
  assertConfig(!path.startsWith('/') && !path.startsWith('\\') && !/^[A-Za-z]:/.test(path), `${context} must be relative`);
  assertConfig(!path.includes('\\'), `${context} must use forward slashes`);
  assertConfig(
    path.split('/').every((segment) => segment && segment !== '.' && segment !== '..'),
    `${context} contains an unsafe segment`,
  );
}

const receiptVerifierVersions = Object.freeze({
  'legacy-alpha1': Object.freeze(['0.1.0-alpha.1']),
});
const packVerificationPolicies = Object.freeze(['sunny-meadow-procedural-cc0-v1']);
const itchVerificationPolicies = Object.freeze(['sunny-meadow-procedural-cc0-v1']);

export function assertReceiptVerifierBinding(receiptVerifier, version) {
  assertConfig(
    Object.hasOwn(receiptVerifierVersions, receiptVerifier),
    `${String(receiptVerifier)} receipt verifier is not registered`,
  );
  assertConfig(
    receiptVerifierVersions[receiptVerifier].includes(version),
    `${receiptVerifier} does not authorize ${String(version)}`,
  );
}

function validateReleaseConfig(config) {
  assertConfig(config.tag === `v${config.version}`, `${config.version} tag is inconsistent`);
  assertConfig(
    ['candidate', 'published'].includes(config.lifecycle),
    `${config.tag} lifecycle must be candidate or published`,
  );
  assertConfig(
    config.expectedExamplePackSha256 === null
      || /^[a-f0-9]{64}$/.test(config.expectedExamplePackSha256),
    `${config.tag} expected example-pack hash is invalid`,
  );
  assertConfig(typeof config.receiptVerifier === 'string' && config.receiptVerifier, `${config.tag} receipt verifier is missing`);
  assertReceiptVerifierBinding(config.receiptVerifier, config.version);
  assertConfig(
    packVerificationPolicies.includes(config.release.verificationPolicy),
    `${config.tag} pack verification policy is not registered`,
  );
  assertConfig(
    itchVerificationPolicies.includes(config.itch.verificationPolicy),
    `${config.tag} itch verification policy is not registered`,
  );

  for (const key of [
    'web',
    'godotImporter',
    'examplePack',
    'evidenceVideo',
    'exampleWorldSpec',
    'worldSchema',
    'packSchema',
    'license',
    'changelog',
    'manifest',
    'checksums',
  ]) {
    assertConfig(typeof config.release.files[key] === 'string', `${config.tag} release.files.${key} is missing`);
  }
  const fileNames = Object.values(config.release.files);
  assertConfig(new Set(fileNames).size === fileNames.length, `${config.tag} release filenames must be unique`);
  for (const [key, path] of Object.entries(config.release.files)) {
    assertRelativeConfigPath(path, `${config.tag} release.files.${key}`);
  }
  if (config.lifecycle === 'published') {
    assertConfig(
      /^[a-f0-9]{64}$/.test(config.publicExamplePackSha256),
      `${config.tag} public example-pack hash is invalid`,
    );
    const pinnedNames = Object.keys(config.publicReleaseAssetSha256).sort();
    const expectedNames = [...fileNames].sort();
    assertConfig(
      JSON.stringify(pinnedNames) === JSON.stringify(expectedNames),
      `${config.tag} published release hash list must cover every attachment exactly once`,
    );
    for (const [name, hash] of Object.entries(config.publicReleaseAssetSha256)) {
      assertConfig(/^[a-f0-9]{64}$/.test(hash), `${config.tag} published hash is invalid for ${name}`);
    }
    assertConfig(
      config.publicReleaseAssetSha256[config.release.files.examplePack]
        === config.publicExamplePackSha256,
      `${config.tag} example pack hashes disagree`,
    );
    assertConfig(
      config.expectedExamplePackSha256 === config.publicExamplePackSha256,
      `${config.tag} expected and public example-pack hashes disagree`,
    );
  } else {
    assertConfig(
      config.publicReleaseAssetSha256 === null,
      `${config.tag} candidate must not claim published release attachment hashes`,
    );
    assertConfig(
      config.publicExamplePackSha256 === null,
      `${config.tag} candidate must not claim a public example-pack hash`,
    );
  }
  assertRelativeConfigPath(config.release.notes, `${config.tag} release notes`);
  assertConfig(
    typeof config.release.examplePack.id === 'string' && config.release.examplePack.id.length > 0,
    `${config.tag} pack ID is missing`,
  );
  assertRelativeConfigPath(config.release.examplePack.sourceDirectory, `${config.tag} pack fixture`);
  assertRelativeConfigPath(config.release.examplePack.archiveRoot, `${config.tag} pack archive root`);
  assertRelativeConfigPath(
    config.release.examplePack.worldSpecPackPath,
    `${config.tag} pack World Spec path`,
  );
  for (const key of ['exampleWorldSpec', 'license', 'changelog', 'evidenceVideo']) {
    assertConfig(typeof config.release.inputs[key] === 'string', `${config.tag} release.inputs.${key} is missing`);
  }
  for (const [key, path] of Object.entries(config.release.inputs)) {
    assertRelativeConfigPath(path, `${config.tag} release.inputs.${key}`);
  }

  const schemaKeys = new Set();
  assertConfig(config.release.schemas.length > 0, `${config.tag} schema list is empty`);
  for (const schema of config.release.schemas) {
    assertConfig(!schemaKeys.has(schema.releaseFileKey), `${config.tag} schema release key is duplicated`);
    schemaKeys.add(schema.releaseFileKey);
    assertConfig(
      typeof config.release.files[schema.releaseFileKey] === 'string',
      `${config.tag} schema release key is not declared in release.files`,
    );
    assertRelativeConfigPath(schema.source, `${config.tag} schema source`);
    assertRelativeConfigPath(schema.packPath, `${config.tag} schema pack path`);
  }

  for (const key of ['sourceDirectory', 'visualDirectory', 'renderer']) {
    assertRelativeConfigPath(config.itch[key], `${config.tag} itch.${key}`);
  }
  const visualNames = new Set();
  for (const visual of config.itch.visuals) {
    assertRelativeConfigPath(visual.name, `${config.tag} itch visual name`);
    assertConfig(!visualNames.has(visual.name), `${config.tag} itch visual name is duplicated`);
    visualNames.add(visual.name);
    assertConfig(Number.isSafeInteger(visual.width) && visual.width > 0, `${visual.name} width is invalid`);
    assertConfig(Number.isSafeInteger(visual.height) && visual.height > 0, `${visual.name} height is invalid`);
  }
  return config;
}

const ALPHA_1_VERSION = '0.1.0-alpha.1';
const ALPHA_1_TAG = `v${ALPHA_1_VERSION}`;
const alpha1ReleaseFiles = releaseFiles(ALPHA_1_TAG);

const alpha1 = deepFreeze(validateReleaseConfig({
  version: ALPHA_1_VERSION,
  tag: ALPHA_1_TAG,
  lifecycle: 'published',
  receiptVerifier: 'legacy-alpha1',
  expectedExamplePackSha256: 'e9434cebdecdc9ad2c1cdfa1629cb323c0384385dc70b6943426bfbf96205c8a',
  publicExamplePackSha256: 'e9434cebdecdc9ad2c1cdfa1629cb323c0384385dc70b6943426bfbf96205c8a',
  publicReleaseAssetSha256: {
    [alpha1ReleaseFiles.changelog]: '84ded87f294c6136b2a2699738a3a7c8394cc7176e2f0fcb20d82829d88f4b51',
    [alpha1ReleaseFiles.license]: '0fb6db3e8b9916a72339ad81b200c8b9419d5524ed333d42eaac86c41b6a1581',
    [alpha1ReleaseFiles.godotImporter]: 'c5d27f6df15026006c1bec7d8086569de1527da5091a87a7f941102dd34fc726',
    [alpha1ReleaseFiles.packSchema]: 'c64118ca191b47e9aa5df8970490e00d57b29c096e0d125036de6fe0b4aeb0f9',
    [alpha1ReleaseFiles.examplePack]: 'e9434cebdecdc9ad2c1cdfa1629cb323c0384385dc70b6943426bfbf96205c8a',
    [alpha1ReleaseFiles.worldSchema]: 'f51c34a56110d5536514f2add6abc565f13f687a2cfbed8c20fa40fb5578ad31',
    [alpha1ReleaseFiles.evidenceVideo]: 'e98b3e07d121ab28462a08a6cfffc375556e2234aba0eb713bff8556bb9cb13f',
    [alpha1ReleaseFiles.web]: 'f32b3cfa0defa961bf90d4e1f9c3a37db82be7328eb7fd2ba4ddb4efc8ff8b6f',
    [alpha1ReleaseFiles.manifest]: '531bb50066a2c492021f6af69fd4a045f3cb933eed3061c041dc242c81bb3449',
    [alpha1ReleaseFiles.checksums]: '5e38338d3e476d446454f0a5496ebdb5aca0e336c38545fc9ec77b0123f667bb',
    [alpha1ReleaseFiles.exampleWorldSpec]: '81734ed934bf80719a852dfee227538d0a3927cf9b568adbd6dd7a3586313bd9',
  },
  release: {
    verificationPolicy: 'sunny-meadow-procedural-cc0-v1',
    files: alpha1ReleaseFiles,
    notes: `docs/releases/${ALPHA_1_TAG}.md`,
    examplePack: {
      id: 'sunny-meadow',
      sourceDirectory: `examples/packs/sunny-meadow-${ALPHA_1_TAG}`,
      archiveRoot: `mapsoo-sunny-meadow-${ALPHA_1_TAG}`,
      worldSpecPackPath: 'worlds/sunny-meadow.world.json',
    },
    inputs: {
      exampleWorldSpec: 'examples/sunny-meadow.world.json',
      license: 'LICENSE',
      changelog: 'CHANGELOG.md',
      evidenceVideo: `docs/media/${ALPHA_1_TAG}/video/mapsoo-worldsmith-${ALPHA_1_TAG}-75s.mp4`,
    },
    schemas: [
      {
        releaseFileKey: 'worldSchema',
        source: 'schemas/mapsoo-world.schema.json',
        packPath: 'schema/mapsoo-world.schema.json',
      },
      {
        releaseFileKey: 'packSchema',
        source: 'schemas/mapsoo-pack.schema.json',
        packPath: 'schema/mapsoo-pack.schema.json',
      },
    ],
  },
  itch: {
    verificationPolicy: 'sunny-meadow-procedural-cc0-v1',
    sourceDirectory: `docs/itch-kit/${ALPHA_1_TAG}`,
    visualDirectory: `docs/media/${ALPHA_1_TAG}/itch`,
    renderer: 'docs/release-visuals/renderer.html',
    rendererFrames: ['cover', 'hero', 'workbench', 'contents', 'godot', 'contract'],
    requiredRendererFacts: [
      'CC0-1.0',
      'Godot 4.3',
      'Godot 4.7',
      'contains_generative_ai',
      'Executable-free asset ZIP',
    ],
    supportingFiles: ['captions-75s.json'],
    visuals: [
      { name: 'cover-1260x1000.png', width: 1260, height: 1000, role: 'cover' },
      { name: '01-generated-pack-1600x900.png', width: 1600, height: 900, role: 'screenshot' },
      { name: '02-workbench-1600x900.png', width: 1600, height: 900, role: 'screenshot' },
      { name: '03-pack-contents-1600x900.png', width: 1600, height: 900, role: 'screenshot' },
      { name: '04-godot-verification-1600x900.png', width: 1600, height: 900, role: 'screenshot' },
      { name: '05-open-contract-1600x900.png', width: 1600, height: 900, role: 'screenshot' },
    ],
  },
}));

const releaseConfigs = Object.freeze({
  [alpha1.version]: alpha1,
});

export function getReleaseConfig(version) {
  if (typeof version !== 'string' || !Object.hasOwn(releaseConfigs, version)) {
    throw new Error(`Unsupported release version: ${String(version)}`);
  }
  return releaseConfigs[version];
}

export function assertRegisteredReleaseConfig(config) {
  const registered = getReleaseConfig(config?.version);
  if (registered !== config) {
    throw new Error(`Release config is not the registered immutable config for ${config?.version}`);
  }
  return registered;
}

export function assertReleaseBuildAllowed(config) {
  const registered = assertRegisteredReleaseConfig(config);
  if (registered.lifecycle === 'published') {
    throw new Error(
      `Refusing to rebuild published release ${registered.tag}; create a new candidate version instead`,
    );
  }
  return registered;
}

export function listReleaseConfigs() {
  return Object.values(releaseConfigs);
}

export function listPublishedReleaseConfigs() {
  return listReleaseConfigs().filter(({ lifecycle }) => lifecycle === 'published');
}

export const CURRENT_RELEASE_CONFIG = getReleaseConfig(PACKAGE_VERSION);
