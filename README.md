# Mapsoo Worldsmith

> Open-source world asset generator for Godot creators.

Mapsoo Worldsmith is evolving from the original `mapsoo-kids` website into a local-first tool that turns a compact world specification into a previewable, versioned game-art asset pack. The first target is a complete path from world settings to a Godot-friendly ZIP that can also be published on itch.io.

## Project status

The current worktree is a **portable v0.1 alpha**. It already provides a deterministic, offline generation and export loop without accounts, a backend, or API keys:

1. Edit a compact World Spec for meadow, desert, or snowfield worlds.
2. Generate the same starter tiles and map again from the same seed.
3. Preview the pixel-art result in the browser and review validation issues.
4. Download the World Spec JSON or a portable ZIP containing PNG atlases, a map preview, schemas, manifest, provenance receipt, and asset license.

The versioned starter input is available at [`examples/sunny-meadow.world.json`](examples/sunny-meadow.world.json).

The ZIP uses engine-neutral PNG and JSON as its source of truth. A tested Godot 4.3+ importer, generated `TileSet`/scene resources, and a Godot example project are **planned next**; the current portable alpha should not yet be described as a one-click Godot-ready pack.

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

No environment variables are required for the portable alpha. See [`.env.example`](.env.example) for the key-handling policy before adding a future provider.

The old marketing website is not part of the new product. Its history remains available in Git, while the active source tree is being rebuilt as the Worldsmith workbench.

## License

Source code is licensed under the [MIT License](LICENSE). Generated packs and bundled examples carry their own license metadata; do not assume that every imported or generated image is MIT-licensed.
