# Mapsoo Worldsmith

> Open-source world asset generator for Godot creators.

[![CI](https://github.com/babyrush0101-source/mapsoo-kids/actions/workflows/ci.yml/badge.svg)](https://github.com/babyrush0101-source/mapsoo-kids/actions/workflows/ci.yml)
[![GitHub Pages](https://github.com/babyrush0101-source/mapsoo-kids/actions/workflows/pages.yml/badge.svg)](https://github.com/babyrush0101-source/mapsoo-kids/actions/workflows/pages.yml)

[Live demo](https://babyrush0101-source.github.io/mapsoo-kids/) · [v0.1.0-alpha.1 release](https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.1) · [First-import feedback](https://github.com/babyrush0101-source/mapsoo-kids/issues/12)

Mapsoo Worldsmith is evolving from the original `mapsoo-kids` website into a local-first tool that turns a compact world specification into a previewable, versioned game-art asset pack. The first target is a complete path from world settings to a Godot-friendly ZIP that can also be published on itch.io.

## Project status

The public `main` branch and **v0.1.0-alpha.1 pre-release** provide a deterministic, offline generation and export loop without accounts, a backend, or API keys:

1. Edit a compact World Spec for meadow, desert, or snowfield worlds.
2. Generate the same starter tiles and map again from the same seed.
3. Preview the pixel-art result in the browser and review validation issues.
4. Download the World Spec JSON, then load it again later to reproduce the saved project.
5. Export an executable-free ZIP containing PNG atlases, a map preview, schemas, manifest, provenance receipt, and asset license.

The versioned starter input is available at [`examples/sunny-meadow.world.json`](examples/sunny-meadow.world.json).

Local World Spec imports are capped at 128 KiB and use strict UTF-8 decoding, duplicate-key detection, bounded JSON depth/complexity, safe-number checks, forbidden prototype-key checks, and strict schema validation. A failed or superseded import never replaces the current generated world.

![Actual Sunny Meadow pack preview](examples/packs/sunny-meadow-v0.1.0-alpha.1/previews/map-preview.png)

The committed [Sunny Meadow release fixture](examples/packs/sunny-meadow-v0.1.0-alpha.1/) was exported through the real browser UI and imported successfully with Godot 4.3 and 4.7. It is also rebuilt as a deterministic release ZIP, so the example shown above is the example users download—not a concept image.

The ZIP uses engine-neutral PNG and JSON as its source of truth and intentionally contains no executable addon code. Install the MIT-licensed importer only from this official repository (or the Godot Asset Library once published), then select the extracted pack's `mapsoo.manifest.json`; it derives a `TileSet`, `TileMapLayer` scene, and prop sprites under `res://mapsoo_imports/`. The importer and example project are headless-tested on Godot 4.3 and 4.7. SHA-256 records verify pack consistency, not publisher identity, so never enable scripts copied from a third-party asset pack.

## Why this order

Image generation alone does not make a usable game-asset pipeline. Mapsoo first makes the asset contract, validation, reproducibility, preview, and export reliable. AI providers will plug into the same contract later.

## Documentation

- [Master plan](docs/00_MASTER_PLAN.md)
- [Product and MVP specification](docs/01_PRODUCT_AND_MVP.md)
- [Technical architecture](docs/02_TECHNICAL_ARCHITECTURE.md)
- [Asset and export specification](docs/03_ASSET_AND_EXPORT_SPEC.md)
- [Roadmap](docs/04_ROADMAP.md)
- [Open-source and Codex OSS readiness](docs/05_OPEN_SOURCE_READINESS.md)
- [Security and migration audit](docs/06_SECURITY_AND_MIGRATION.md)
- [STOYO integration](docs/07_STOYO_INTEGRATION.md)
- [GitHub, itch.io, and Codex for OSS release kit](docs/08_RELEASE_ITCH_AND_OSS_KIT.md)
- [Deterministic itch.io release visuals](docs/release-visuals/README.md)
- [Verified itch.io operator upload kit](docs/itch-kit/README.md)
- [75-second evidence video source and verification](video/README.md)
- [v0.1.0-alpha.1 release notes](docs/releases/v0.1.0-alpha.1.md)

The reviewed [silent bilingual 75-second MP4](docs/media/v0.1.0-alpha.1/video/mapsoo-worldsmith-v0.1.0-alpha.1-75s.mp4) is also published as a versioned [GitHub release asset](https://github.com/babyrush0101-source/mapsoo-kids/releases/download/v0.1.0-alpha.1/mapsoo-worldsmith-v0.1.0-alpha.1-75s.mp4). It demonstrates the exact candidate pack, validator, and Godot CLI evidence; it does not claim external adoption.

## Local development

Requirements: Node.js 20+ and pnpm 11+.

```bash
pnpm install
pnpm dev
```

Run the complete local verification before contributing:

```bash
pnpm check
```

Build, validate, and reproduce the complete local alpha release bundle:

```bash
pnpm release:local
```

Build the exact itch.io operator directory—including the executable-free asset ZIP, itch-specific checksum, page metadata/copy, cover, five screenshots, and byte manifest:

```bash
pnpm release:itch
```

The GitHub files are written to `release/v0.1.0-alpha.1/`; the separate itch.io operator kit is written to `release/itch/v0.1.0-alpha.1/`. The itch kit intentionally excludes the importer and preserves page visibility as `Draft` until the maintainer previews the real page. An explicit matching version tag creates a GitHub release **draft** only after the branch has been reviewed and merged; the maintainer then deliberately publishes the verified prerelease. The public alpha was produced through that path.

No environment variables are required for the portable alpha. See [`.env.example`](.env.example) for the key-handling policy before adding a future provider.

The old marketing website is not part of the new product. Its history remains available in Git, while the active source tree is being rebuilt as the Worldsmith workbench.

## License

Source code is licensed under the [MIT License](LICENSE). Generated packs and bundled examples carry their own license metadata; do not assume that every imported or generated image is MIT-licensed.
