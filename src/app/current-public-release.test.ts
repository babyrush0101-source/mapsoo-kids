import { describe, expect, it } from 'vitest';

import packageJson from '../../package.json';
import { CURRENT_PACK_VERSION } from '../adapters/export-current-pack';
import {
  CURRENT_PUBLIC_RELEASE,
  CURRENT_PUBLIC_RELEASE_VERSION,
} from './current-public-release';

describe('current public release links', () => {
  it('points the alpha.6 workbench at the published alpha.6 release', () => {
    expect(packageJson.version).toBe('0.1.0-alpha.6');
    expect(CURRENT_PACK_VERSION).toBe(packageJson.version);
    expect(CURRENT_PUBLIC_RELEASE_VERSION).toBe('0.1.0-alpha.6');
    expect(CURRENT_PUBLIC_RELEASE.version).toBe(CURRENT_PUBLIC_RELEASE_VERSION);
    expect(CURRENT_PUBLIC_RELEASE.tag).toBe(`v${CURRENT_PUBLIC_RELEASE_VERSION}`);
    expect(CURRENT_PUBLIC_RELEASE.releaseUrl).toContain('/releases/tag/v0.1.0-alpha.6');
    expect(CURRENT_PUBLIC_RELEASE.assetPack.filename).toContain('v0.1.0-alpha.6');
    expect(CURRENT_PUBLIC_RELEASE.godotImporter.filename).toContain('v0.1.0-alpha.6');
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

  it('pins the audited alpha.6 download names and digests', () => {
    expect(CURRENT_PUBLIC_RELEASE.assetPack).toEqual({
      filename: 'mapsoo-sunny-meadow-v0.1.0-alpha.6.zip',
      url: 'https://github.com/babyrush0101-source/mapsoo-kids/releases/download/v0.1.0-alpha.6/mapsoo-sunny-meadow-v0.1.0-alpha.6.zip',
      sha256: '4563552187977b38cdba86c7d3cbf5429a67b7a0a6049e978c2ef2992ef3a054',
    });
    expect(CURRENT_PUBLIC_RELEASE.godotImporter).toEqual({
      filename: 'mapsoo-godot-importer-v0.1.0-alpha.6.zip',
      url: 'https://github.com/babyrush0101-source/mapsoo-kids/releases/download/v0.1.0-alpha.6/mapsoo-godot-importer-v0.1.0-alpha.6.zip',
      sha256: 'bbfacd2b5c8503214b7647d59e9911a34fa1b4e073f86bd1310686812c9142c0',
    });
  });

  it('keeps the public release record immutable at runtime', () => {
    expect(Object.isFrozen(CURRENT_PUBLIC_RELEASE)).toBe(true);
    expect(Object.isFrozen(CURRENT_PUBLIC_RELEASE.assetPack)).toBe(true);
    expect(Object.isFrozen(CURRENT_PUBLIC_RELEASE.godotImporter)).toBe(true);
  });
});
