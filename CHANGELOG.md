# Changelog

All notable changes to Mapsoo Worldsmith will be documented here. The project follows semantic versioning once the first public release is published.

## [Unreleased]

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

### Changed

- Rebuilt the active application from scratch as a Godot-first creator tool.
- Kept PNG + JSON as the portable source of truth while adding engine-native resources as validated Godot-derived artifacts.

### Removed

- Legacy marketing site, blog, community, account, CMS, Supabase, and bundled marketing-image code from the active branch. The original site remains recoverable from Git history.
