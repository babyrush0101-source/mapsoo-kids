## A tiny world pack with a verifiable generation receipt

Mapsoo Sunny Meadow is a free alpha asset pack produced locally by **Mapsoo Worldsmith**, an open-source pipeline that turns a versioned World Spec into deterministic, validated 2D game assets.

This is a versioned, verified example pack—not a claim that every possible generated world is production-ready. The full path is inspectable: World Spec → trusted procedural runner → PNG/JSON pack → Godot import.

## Included

- top-down pixel-art terrain and transparent prop atlases;
- a ready-made 24 × 16 sample map with 384 cells, 29 props, and a PNG preview;
- portable World Spec and map JSON;
- `mapsoo.manifest.json` with stable IDs and per-payload-file SHA-256 records;
- `generation-receipt.json` using `schema_version: 0.2.0`;
- `schema/mapsoo-generation-receipt.schema.json` alongside the pack and World Spec schemas;
- a license map: CC0-1.0 for procedural PNG and generated map assets, MIT for bundled schemas and documentation;
- a fixed-hash import workflow CI-gated on Godot 4.3 and Godot 4.7.

The ZIP contains exactly **12 files**: one manifest plus **11 payload records**. It is an **Executable-free asset ZIP** containing PNG, JSON, and Markdown only.

## Godot quick start

1. Download and extract `mapsoo-sunny-meadow-v0.1.0-alpha.3.zip`.
2. Install the Mapsoo Pack Importer only from the [official GitHub release](https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.3).
3. Enable the importer in a Godot 4.3 or Godot 4.7 project.
4. Select the extracted pack's `mapsoo.manifest.json`.
5. Open the generated scene under `res://mapsoo_imports/<pack-id>/`.

Alpha.3 adds safe re-import ownership state in `mapsoo.import-state.json`. A clean repeat is `unchanged`; a changed source becomes `updated`; edited generated output or an unsafe baseline becomes `conflict`. Promotion uses process-level rollback. It does not claim crash- or power-loss atomicity, and concurrent writers remain outside this alpha contract.

The asset ZIP intentionally contains **no GDScript or addon**. A SHA-256 record proves file consistency, not publisher identity; never enable scripts copied from a third-party asset pack.

## What receipt 0.2 proves

Generation receipt 0.2.0 binds the shipped World Spec bytes and seed to the built-in `procedural-pixel-v1@0.1.0` provider, local execution mode, exact workflow and transformation versions, CC0 notice path, AI disclosure, and manifest provenance. The release verifier rejects unknown providers, altered execution modes, changed hashes, non-empty sources, model claims, or schema downgrades.

## License

The procedural PNG atlases, preview, and generated map assets are released under **CC0-1.0**. You may use, modify, and redistribute those assets, including commercially; `license-assets.md` inside the ZIP is authoritative for that scope. Bundled schemas and documentation use the repository's [MIT License](https://github.com/babyrush0101-source/mapsoo-kids/blob/main/LICENSE), as do the Mapsoo Worldsmith source and separately distributed importer.

## Compatibility and limits

- required public CI matrix: Godot 4.3 and Godot 4.7;
- orthogonal, top-down pixel-art world;
- one biome per generated alpha world;
- importer works from an extracted pack;
- breaking format changes remain possible before v1.0.

## AI and procedural-generation disclosure

The distributed pixel artwork is produced by deterministic, self-contained procedural code, **not by an image-generation model**. Codex assisted project code and documentation, so the itch.io project discloses **Text & Dialog** and **Code**. The asset ZIP has no executable scripts and includes no AI-generated graphics or sound. Its `contains_generative_ai: false` field describes the generated artwork and map payload—not the project's development history.

## Links and feedback

- Source and documentation: https://github.com/babyrush0101-source/mapsoo-kids
- GitHub alpha release: https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.3
- Generator demo: https://babyrush0101-source.github.io/mapsoo-kids/
- Reproducible feedback: https://github.com/babyrush0101-source/mapsoo-kids/issues/new?template=first-import-feedback.yml

When reporting an import problem, include your OS, Godot version, pack filename, World Spec seed, exact error message, and whether it reproduces in a new Godot project.

---

## 中文说明

Mapsoo Sunny Meadow 是由 Mapsoo Worldsmith 在本地生成的免费 alpha 像素世界示例包。压缩包共 12 个文件，其中 manifest 记录 11 个 payload；`generation-receipt.json` 采用 0.2.0 契约，并绑定 World Spec、seed、内置程序化 provider、变换版本、许可与 AI 披露。程序化 PNG 与生成地图采用 CC0-1.0，随包 schema 和文档采用仓库 MIT 许可。素材 ZIP 不含 GDScript 或 addon；Godot importer 只从官方仓库或 release 单独安装。当前图像由确定性程序化代码绘制，不是图像模型输出；Codex 参与代码和文档辅助，因此 itch.io 披露 Text & Dialog 与 Code。
