import { describe, expect, it } from 'vitest';

import packageJson from '../../package.json';
import { CURRENT_PACK_VERSION } from '../adapters/export-current-pack';
import {
  CURRENT_PUBLIC_RELEASE,
  CURRENT_PUBLIC_RELEASE_VERSION,
} from './current-public-release';

describe('current public release links', () => {
  it('keeps public links on published alpha.3 while alpha.4 is a candidate', () => {
    expect(packageJson.version).toBe('0.1.0-alpha.4');
    expect(CURRENT_PACK_VERSION).toBe(packageJson.version);
    expect(CURRENT_PUBLIC_RELEASE_VERSION).toBe('0.1.0-alpha.3');
    expect(CURRENT_PUBLIC_RELEASE.version).toBe(CURRENT_PUBLIC_RELEASE_VERSION);
    expect(CURRENT_PUBLIC_RELEASE.tag).toBe(`v${CURRENT_PUBLIC_RELEASE_VERSION}`);
    expect(CURRENT_PUBLIC_RELEASE.releaseUrl).toContain('/releases/tag/v0.1.0-alpha.3');
    expect(CURRENT_PUBLIC_RELEASE.assetPack.filename).toContain('v0.1.0-alpha.3');
    expect(CURRENT_PUBLIC_RELEASE.godotImporter.filename).toContain('v0.1.0-alpha.3');
  });

  it('uses only the official HTTPS repository for downloads and community links', () => {
    const urls = [
      CURRENT_PUBLIC_RELEASE.releaseUrl,
      CURRENT_PUBLIC_RELEASE.assetPack.url,
      CURRENT_PUBLIC_RELEASE.godotImporter.url,
      CURRENT_PUBLIC_RELEASE.firstImportGuideUrl,
      CURRENT_PUBLIC_RELEASE.feedbackFormUrl,
      CURRENT_PUBLIC_RELEASE.feedbackIndexUrl,
    ];

    for (const url of urls) {
      const parsed = new URL(url);
      expect(parsed.protocol).toBe('https:');
      expect(parsed.hostname).toBe('github.com');
      expect(parsed.pathname).toContain('/babyrush0101-source/mapsoo-kids/');
    }
  });

  it('pins the audited alpha.3 download names and digests', () => {
    expect(CURRENT_PUBLIC_RELEASE.assetPack).toEqual({
      filename: 'mapsoo-sunny-meadow-v0.1.0-alpha.3.zip',
      url: 'https://github.com/babyrush0101-source/mapsoo-kids/releases/download/v0.1.0-alpha.3/mapsoo-sunny-meadow-v0.1.0-alpha.3.zip',
      sha256: 'af95a4e57187fb85d06e34ccb0e1a1b1dba9b91e8989debf4c30a93108589696',
    });
    expect(CURRENT_PUBLIC_RELEASE.godotImporter).toEqual({
      filename: 'mapsoo-godot-importer-v0.1.0-alpha.3.zip',
      url: 'https://github.com/babyrush0101-source/mapsoo-kids/releases/download/v0.1.0-alpha.3/mapsoo-godot-importer-v0.1.0-alpha.3.zip',
      sha256: '49a2c30b0df50cff46c4a2acaa5c093d0eb58733387472ab27e6e7f2dfaabd86',
    });
  });

  it('keeps the public release record immutable at runtime', () => {
    expect(Object.isFrozen(CURRENT_PUBLIC_RELEASE)).toBe(true);
    expect(Object.isFrozen(CURRENT_PUBLIC_RELEASE.assetPack)).toBe(true);
    expect(Object.isFrozen(CURRENT_PUBLIC_RELEASE.godotImporter)).toBe(true);
  });
});
