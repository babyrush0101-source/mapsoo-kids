import { describe, expect, it } from 'vitest';

import packageJson from '../../package.json';
import { CURRENT_PUBLIC_RELEASE } from './current-public-release';

describe('current public release links', () => {
  it('binds every public link to the selected package version', () => {
    expect(CURRENT_PUBLIC_RELEASE.version).toBe(packageJson.version);
    expect(CURRENT_PUBLIC_RELEASE.tag).toBe(`v${packageJson.version}`);
    expect(CURRENT_PUBLIC_RELEASE.releaseUrl).toContain(`/releases/tag/v${packageJson.version}`);
    expect(CURRENT_PUBLIC_RELEASE.assetPack.filename).toContain(`v${packageJson.version}`);
    expect(CURRENT_PUBLIC_RELEASE.godotImporter.filename).toContain(`v${packageJson.version}`);
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

  it('pins the audited alpha.2 download names and digests', () => {
    expect(CURRENT_PUBLIC_RELEASE.assetPack).toEqual({
      filename: 'mapsoo-sunny-meadow-v0.1.0-alpha.2.zip',
      url: 'https://github.com/babyrush0101-source/mapsoo-kids/releases/download/v0.1.0-alpha.2/mapsoo-sunny-meadow-v0.1.0-alpha.2.zip',
      sha256: '8c7720a8578cdc276ff69677ed0d64d8a1524d32fd00da0ffb8035b5a52bfcb6',
    });
    expect(CURRENT_PUBLIC_RELEASE.godotImporter).toEqual({
      filename: 'mapsoo-godot-importer-v0.1.0-alpha.2.zip',
      url: 'https://github.com/babyrush0101-source/mapsoo-kids/releases/download/v0.1.0-alpha.2/mapsoo-godot-importer-v0.1.0-alpha.2.zip',
      sha256: 'c5d27f6df15026006c1bec7d8086569de1527da5091a87a7f941102dd34fc726',
    });
  });

  it('keeps the public release record immutable at runtime', () => {
    expect(Object.isFrozen(CURRENT_PUBLIC_RELEASE)).toBe(true);
    expect(Object.isFrozen(CURRENT_PUBLIC_RELEASE.assetPack)).toBe(true);
    expect(Object.isFrozen(CURRENT_PUBLIC_RELEASE.godotImporter)).toBe(true);
  });
});
