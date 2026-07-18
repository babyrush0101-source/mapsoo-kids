# Changelog

All notable changes to Mapsoo Worldsmith will be documented here. The project follows semantic versioning once the first public release is published.

## [Unreleased]

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

### Changed

- Rebuilt the active application from scratch as a Godot-first creator tool.
- Clarified that the current deliverable is a portable PNG + JSON alpha; the Godot importer and engine-native resources are planned follow-up work.

### Removed

- Legacy marketing site, blog, community, account, CMS, Supabase, and bundled marketing-image code from the active branch. The original site remains recoverable from Git history.
