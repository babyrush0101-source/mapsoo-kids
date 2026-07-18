## A tiny world pack with an open contract

Mapsoo Sunny Meadow is a free alpha asset pack generated locally by **Mapsoo Worldsmith**, an open-source pipeline for turning a versioned World Spec into deterministic, validated 2D game assets.

This download is a versioned, verified example pack, not a promise that every possible generated world is production-ready. It makes the complete path inspectable: World Spec → PNG/JSON pack → validation → Godot import.

## Included

- top-down pixel-art terrain atlas;
- transparent prop atlas;
- a ready-made sample map and PNG preview;
- portable World Spec and map JSON;
- `mapsoo.manifest.json` with stable IDs and per-payload-file SHA-256 records;
- generation/provenance receipt;
- a license map: CC0-1.0 for procedural PNG and generated map assets, MIT for bundled schemas and documentation;
- a tested workflow for Godot 4.3 and Godot 4.7.

## Godot quick start

1. Download and extract `mapsoo-sunny-meadow-v0.1.0-alpha.1.zip`.
2. Install the Mapsoo Pack Importer only from the [official GitHub release](https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.1).
3. Enable the importer in a Godot 4.3 or Godot 4.7 project.
4. Select the extracted pack's `mapsoo.manifest.json`.
5. Open the generated scene under `res://mapsoo_imports/<pack-id>/`.

The asset ZIP intentionally contains no GDScript or addon. A hash inside the pack proves file consistency, not publisher identity, so do not enable scripts copied from third-party asset packs.

## License

The procedural PNG atlases, preview, and generated map assets are released under **CC0-1.0**. You may use, modify, and redistribute those assets, including commercially; `license-assets.md` inside the ZIP is authoritative for that scope. Bundled schemas and documentation use the repository's [MIT License](https://github.com/babyrush0101-source/mapsoo-kids/blob/main/LICENSE), as do Mapsoo Worldsmith source code and the separately distributed importer.

## Compatibility and limits

- tested importer versions: Godot 4.3 and Godot 4.7;
- orthogonal, top-down pixel-art world;
- one biome per generated alpha world;
- importer works from an extracted pack;
- breaking format changes remain possible before v1.0.

## AI and procedural-generation disclosure

The distributed pixel artwork is produced by deterministic, self-contained procedural code, not by an image-generation model. Codex assisted project code and documentation, so this itch.io page discloses **Text & Dialog** and **Code**. The asset ZIP contains no executable scripts, and no AI-generated graphics or sound are included. Its `contains_generative_ai: false` receipt describes the generated artwork/map payload, not the project's development history.

## Links and feedback

- Source and documentation: https://github.com/babyrush0101-source/mapsoo-kids
- GitHub alpha release: https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.1
- Mapsoo Worldsmith generator demo: https://babyrush0101-source.github.io/mapsoo-kids/
- Reproducible feedback: https://github.com/babyrush0101-source/mapsoo-kids/issues/12

When reporting an import problem, include your OS, Godot version, pack filename, World Spec seed, exact error message, and whether the issue reproduces in a new Godot project.

---

## 中文说明

Mapsoo Sunny Meadow 是 Mapsoo Worldsmith 生成的免费 alpha 像素世界示例包。程序化 PNG 与生成地图资产采用 CC0-1.0；随包 schema 和说明文档采用仓库 MIT 许可。素材 ZIP 不含 GDScript；Godot importer 只从官方仓库或 release 单独安装。当前图像由确定性、自包含的程序化代码绘制，不是图像模型输出；Codex 参与了项目代码和文档辅助，因此 itch.io 披露 Text & Dialog 与 Code。
