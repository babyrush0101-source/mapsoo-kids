# Changelog

All notable changes to Mapsoo Worldsmith will be documented here. The project follows semantic versioning once the first public release is published.

## [Unreleased]

### Candidate: 0.1.0-alpha.2

### Added

- Runner-owned generation receipt 0.2 with exact World Spec byte binding, provider execution evidence, workflow and transformation versions, AI disclosure, sources, and licensing evidence.
- A 12-file alpha.2 Sunny Meadow fixture captured from the real browser exporter and pinned to SHA-256 `8c7720a8578cdc276ff69677ed0d64d8a1524d32fd00da0ffb8035b5a52bfcb6`.
- A version-bound Node receipt verifier with alpha.1 and alpha.2 negative-policy suites.
- The generation-receipt JSON Schema as both a pack payload and release attachment.
- A deterministic, verified itch.io operator kit containing only the executable-free sample pack, its dedicated checksum, exact page metadata/copy, cover, five screenshots, and a byte-level upload manifest.
- Complete CC0 and MIT license notices inside the portable pack, plus the pako MIT notice in the web distribution.

### Changed

- Switched the default workbench export to alpha.2 through a package-version-checked current-export binding.
- Made browser ZIP output byte deterministic with a pinned pure-JavaScript PNG encoder plus fixed timestamps, path order, permissions, and compression settings shared by release packaging.
- Made CI run the current exporter in a real browser and compare its raw ZIP bytes with the registered fixture before the exact artifact reaches Godot.
- Made release evidence video optional per version; alpha.1 retains its historical video while alpha.2 does not reuse it.
- Added exact alpha.2 pack import coverage for the Godot 4.3 and 4.7 PR and tag-release matrices; release drafts now wait for both jobs.
- Rebuilt Vite independently for both reproducibility passes and added a remote digest check for every immutable published GitHub attachment.

## [0.1.0-alpha.1] - 2026-07-18

### Added

- New Mapsoo Worldsmith product direction and project documentation.
- Local-first World Spec editor for meadow, desert, and snowfield recipes.
- Deterministic seed-based map and prop generation.
- Canvas world preview and pack validation panel.
- Versioned World Spec and pack-manifest JSON Schemas.
- Portable ZIP export with terrain and prop atlases, map preview, manifest, provenance receipt, hashes, and asset license.
- MIT source license and initial contributor/security documentation.
- Integer-snapped Canvas drawing primitives for crisp proportional pixel-art details.
- A versioned Sunny Meadow World Spec fixture and ZIP contract regression tests.
- Explicit manifest references for world specs, map layers, previews, receipts, and numeric tile IDs.
- A strict, namespaced `extensions` field for integrations such as STOYO.
- A separately installed Godot 4.3+ EditorPlugin that derives `TileSet`, `TileMapLayer`, and prop resources from validated portable packs.
- Godot 4.3/4.7 headless smoke tests, security-negative fixtures, and CI coverage.
- Executable-free asset packs that declare the required official importer version without bundling GDScript.
- A reusable Godot CLI verifier and a real browser ZIP-to-Godot 4.3/4.7 end-to-end acceptance path.
- A real Sunny Meadow browser-export fixture verified in Godot 4.3 and 4.7.
- Deterministic local release packaging with ZIP content verification, SHA-256 checksums, and byte-for-byte reproducibility checks.
- GitHub Pages and tag-gated release-draft workflows, plus weekly dependency update configuration.
- A deterministic itch.io cover and five evidence-based release visuals with automated dimension and source-fact verification.
- A reproducible 75-second bilingual H.264 evidence video, committed MP4 metadata checks, and release-bundle integration.
- Strict local World Spec JSON save/load with UTF-8, duplicate-key, depth, complexity, safe-number, prototype-key, schema, race, and Markdown-output protections.

### Changed

- Rebuilt the active application from scratch as a Godot-first creator tool.
- Kept PNG + JSON as the portable source of truth while adding engine-native resources as validated Godot-derived artifacts.

### Removed

- Legacy marketing site, blog, community, account, CMS, Supabase, and bundled marketing-image code from the active branch. The original site remains recoverable from Git history.
