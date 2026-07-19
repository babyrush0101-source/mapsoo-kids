## Layered terrain with a verifiable generation receipt

Mapsoo Sunny Meadow is a free alpha asset pack produced locally by **Mapsoo Worldsmith**, an open-source pipeline that turns a versioned World Spec into deterministic, validated 2D game assets.

This is a **versioned, verified example pack**, not a complete game and not a claim that every possible generated world is production-ready. The inspectable path is: World Spec → trusted procedural runner → layered PNG/JSON pack → Godot import.

## Included

- pack schema `0.2.0` with four declared layers: **Ground / Water / Roads / Props**;
- **35 terrain tiles**: 3 Ground variants, 16 cardinal Water masks, and 16 cardinal Road masks;
- **6 prop sprites**: tree, rock, flower, shrub, log, and marker;
- a ready-made 24 × 16 sample map with 384 Ground cells, 29 placed props, and a PNG preview;
- separate Water and Roads `MATCH_SIDES` Terrain Sets for continued painting in Godot;
- full-cell Water collision on the `world-blocking` physics layer; Ground and Roads have no collision;
- portable World Spec and layered map JSON;
- `mapsoo.manifest.json` with stable IDs and per-payload-file SHA-256 records;
- `generation-receipt.json` using `schema_version: 0.2.0`;
- `schema/mapsoo-pack-0.2.schema.json`, `schema/mapsoo-generation-receipt.schema.json`, and the World Spec schema beside the pack;
- a license map: CC0-1.0 for procedural PNG and generated map assets, MIT for bundled schemas and documentation;
- a fixed-hash import workflow gated on Godot 4.3 and Godot 4.7.

The ZIP contains exactly **12 files**: one manifest plus **11 payload records**. It is an **Executable-free asset ZIP** containing PNG, JSON, and Markdown only.

Candidate SHA-256: `a57e810baaf2f015d7db96bf0e88ab7b6340d476a61ade7447735a6109b8fb35`.

## Godot quick start

1. After the GitHub prerelease is published, download and extract `mapsoo-sunny-meadow-v0.1.0-alpha.4.zip`.
2. Install Mapsoo Importer `0.1.0-alpha.4` only from the [official GitHub release](https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.4).
3. Enable the importer in a Godot 4.3 or Godot 4.7 project.
4. Select the extracted pack's `mapsoo.manifest.json`.
5. Open the generated scene under `res://mapsoo_imports/sunny-meadow/`.

The importer creates Ground, Water, and Roads `TileMapLayer` nodes plus Props. Water and Roads use separate `MATCH_SIDES` Terrain Sets, while the included scene uses explicit portable tile IDs for a deterministic first import. Water receives full-cell blocking collision on layer/mask 1.

Safe re-import ownership remains explicit in `mapsoo.import-state.json`: a clean repeat is `unchanged`; a changed source can become `updated`; edited generated output or an unsafe baseline becomes `conflict`. Promotion uses process-level rollback. It does not claim crash- or power-loss atomicity, and concurrent writers remain outside this alpha contract.

The asset ZIP intentionally contains **no GDScript or addon**. A SHA-256 record proves file consistency, not publisher identity; never enable scripts copied from a third-party asset pack.

## What receipt 0.2 proves

Generation receipt `0.2.0` binds the shipped World Spec bytes and seed to the built-in `procedural-terrain-v2@0.2.0` provider, local execution mode, exact workflow and transformation versions, CC0 notice path, AI disclosure, and manifest provenance. The release verifier rejects unknown providers, altered execution modes, changed hashes, non-empty sources, model claims, or schema downgrades.

## License

The procedural PNG atlases, preview, and generated map assets are released under **CC0-1.0**. You may use, modify, and redistribute those assets, including commercially; `license-assets.md` inside the ZIP is authoritative for that scope. Bundled schemas and documentation use the repository's [MIT License](https://github.com/babyrush0101-source/mapsoo-kids/blob/main/LICENSE), as do the Mapsoo Worldsmith source and separately distributed importer.

## Compatibility and limits

- required release matrix: Godot 4.3 and Godot 4.7 on Linux and Windows;
- orthogonal, top-down pixel-art world;
- one biome per generated alpha world;
- importer works from an extracted pack;
- Water has basic full-cell blocking, but this pack does not provide navigation or pathfinding;
- Road gaps through Water are explicit ford/gap cells; bridges are not inferred;
- breaking format changes remain possible before v1.0.

This is an asset pack and import contract, **not a complete game, gameplay system, or production-ready navigation solution**.

## AI and procedural-generation disclosure

The distributed pixel artwork is produced by deterministic, self-contained procedural code, **not by an image-generation model**. Codex assisted project code and documentation, so the itch.io project discloses **Text & Dialog** and **Code**. The asset ZIP has no executable scripts and includes no AI-generated graphics or sound. Its `contains_generative_ai: false` field describes the generated artwork and map payload, not the project's development history.

## Candidate status, links, and feedback

The GitHub prerelease is still a candidate and the itch.io upload is postponed. This page is an offline operator draft; it does not claim a public itch.io page exists.

- Source and documentation: https://github.com/babyrush0101-source/mapsoo-kids
- Candidate GitHub release URL: https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.4
- Generator demo: https://babyrush0101-source.github.io/mapsoo-kids/
- Reproducible feedback: https://github.com/babyrush0101-source/mapsoo-kids/issues/new?template=first-import-feedback.yml

When reporting an import problem, include your OS, Godot version, release tag, pack filename, World Spec seed, exact error message, and whether it reproduces in a new Godot project.

---

## 中文说明

Mapsoo Sunny Meadow 是由 Mapsoo Worldsmith 在本地确定性生成的免费 alpha 分层地形素材候选包。它采用 pack schema `0.2.0`，提供 Ground、Water、Roads、Props 四层、35 个地形 Tile、6 个道具 Sprite，以及一个 24 × 16 示例世界。Water 与 Roads 分别导入为 Godot `MATCH_SIDES` Terrain Set；Water 使用 `world-blocking` 全格碰撞，Ground 与 Roads 无碰撞。候选包 SHA-256 为 `a57e810baaf2f015d7db96bf0e88ab7b6340d476a61ade7447735a6109b8fb35`。

程序化 PNG 与生成地图采用 CC0-1.0，随包 schema 和文档采用仓库 MIT License。素材 ZIP 不含 GDScript 或 addon；当前图像由程序化代码绘制，不是图像生成模型输出。Codex 参与代码和文档辅助，因此 itch.io 披露 Text & Dialog 与 Code。本版本不是完整游戏、导航或寻路系统。GitHub prerelease 仍是 candidate，itch.io 上传继续延期。
