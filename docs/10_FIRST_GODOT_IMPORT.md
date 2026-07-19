# First Godot import in 10 minutes / 10 分钟首次导入 Godot

This is the public acceptance path for Mapsoo Worldsmith `v0.1.0-alpha.4`. It uses the same Sunny Meadow pack imported by the release workflow on Linux and Windows with Godot 4.3 and 4.7.

这是 Mapsoo Worldsmith `v0.1.0-alpha.4` 的公开验收路径，使用发布工作流在 Linux 与 Windows 的 Godot 4.3、4.7 中验证过的同一个 Sunny Meadow 素材包。

## What you need / 准备

- Godot 4.3 or newer；
- a new or existing Godot project you can modify；
- the [audited alpha.4 release](https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.4)；
- about 10 minutes. No account, backend, or API key is required.

需要 Godot 4.3 或更高版本、一个可修改的 Godot 项目，以及约 10 分钟。无需账号、后端或 API Key。

## 0–2 min — Download and verify / 下载并校验

Download both official attachments:

1. [Sunny Meadow asset pack](https://github.com/babyrush0101-source/mapsoo-kids/releases/download/v0.1.0-alpha.4/mapsoo-sunny-meadow-v0.1.0-alpha.4.zip)
2. [Mapsoo Godot importer](https://github.com/babyrush0101-source/mapsoo-kids/releases/download/v0.1.0-alpha.4/mapsoo-godot-importer-v0.1.0-alpha.4.zip)

Expected SHA-256:

| File | SHA-256 |
| --- | --- |
| `mapsoo-sunny-meadow-v0.1.0-alpha.4.zip` | `a57e810baaf2f015d7db96bf0e88ab7b6340d476a61ade7447735a6109b8fb35` |
| `mapsoo-godot-importer-v0.1.0-alpha.4.zip` | `428fdab014682fcee49b7777f9647f9222ee9793d55fd2b25053460912f167fb` |

PowerShell:

```powershell
(Get-FileHash .\mapsoo-sunny-meadow-v0.1.0-alpha.4.zip -Algorithm SHA256).Hash.ToLower()
(Get-FileHash .\mapsoo-godot-importer-v0.1.0-alpha.4.zip -Algorithm SHA256).Hash.ToLower()
```

macOS:

```bash
shasum -a 256 mapsoo-sunny-meadow-v0.1.0-alpha.4.zip
shasum -a 256 mapsoo-godot-importer-v0.1.0-alpha.4.zip
```

Linux:

```bash
sha256sum mapsoo-sunny-meadow-v0.1.0-alpha.4.zip
sha256sum mapsoo-godot-importer-v0.1.0-alpha.4.zip
```

The complete attachment list is recorded in the release `SHA256SUMS`. Stop if a digest differs and download the file again from the official release.

完整附件列表记录在 Release 的 `SHA256SUMS` 中。如果哈希不同，请停止操作并从官方 Release 重新下载。

## 2–5 min — Install the importer / 安装导入器

1. Close the Godot editor for the target project if it is already open.
2. Extract `mapsoo-godot-importer-v0.1.0-alpha.4.zip` into the project root.
3. Confirm this exact path exists:

   ```text
   <your-project>/addons/mapsoo_importer/plugin.cfg
   ```

4. Open the project in Godot.
5. Choose **Project → Project Settings → Plugins**.
6. Enable **Mapsoo Pack Importer**.

如果插件没有出现，先确认 `addons/mapsoo_importer/plugin.cfg` 位于项目根目录下，然后重新打开项目。不要从第三方素材包中启用 GDScript。

## 5–8 min — Import the pack / 导入素材包

1. Extract `mapsoo-sunny-meadow-v0.1.0-alpha.4.zip` to any local folder.
2. In Godot choose **Project → Tools → Import Mapsoo Pack...**.
3. Select the extracted file:

   ```text
   mapsoo-sunny-meadow-v0.1.0-alpha.4/mapsoo.manifest.json
   ```

4. Wait for **Import complete**. The public fixture should report `384 cells` and `29 props`.

素材包本身只含 PNG、JSON 与 Markdown，不含 addon 或 GDScript。导入器会在写入资源前检查路径、文件大小、SHA-256、地图尺寸与 atlas 边界。

## 8–10 min — Open the generated scene / 打开生成场景

Open:

```text
res://mapsoo_imports/sunny-meadow/sunny-meadow.world.tscn
```

The derived TileSet is:

```text
res://mapsoo_imports/sunny-meadow/sunny-meadow.tileset.tres
```

Success means the scene opens without an importer error and shows the generated terrain plus props. Keep manual edits outside `res://mapsoo_imports/<pack-id>/`; the current alpha treats that directory as derived output.

成功标准：场景能无导入错误地打开，并显示生成的地形与道具。手工编辑请放在 `res://mapsoo_imports/<pack-id>/` 之外；当前 alpha 把该目录视为派生产物。

## Share the result / 提交结果

Use the [structured first-import form](https://github.com/babyrush0101-source/mapsoo-kids/issues/new?template=first-import-feedback.yml) for either success or failure. Record:

- operating system and exact Godot version；
- time from download to first opened scene；
- pack filename and SHA-256；
- generated scene path or the complete importer error；
- the instruction that was confusing or slow.

成功和失败都很有价值。请勿提交凭据、儿童数据、私有路径、私有 STOYO 内容或未获许可的素材。历史讨论和维护响应统一索引在 [issue #12](https://github.com/babyrush0101-source/mapsoo-kids/issues/12)。

## Troubleshooting / 排错

### Plugin is not listed / 插件未显示

Verify that extraction did not add an extra directory level. The required file is `<project>/addons/mapsoo_importer/plugin.cfg`, not `<project>/mapsoo-godot-importer.../addons/...`.

### Import menu is missing / 菜单未显示

Confirm the plugin is enabled, then reopen the project. The command appears under **Project → Tools → Import Mapsoo Pack...**.

### Manifest or checksum error / manifest 或哈希错误

Select the extracted root `mapsoo.manifest.json`, not a schema or world JSON file. Re-extract the complete asset ZIP; do not copy individual files out of the pack.

### Re-importing an existing pack / 重复导入

Alpha.4 preserves the ownership contract introduced in Alpha.3 and owns only the generated files recorded in `res://mapsoo_imports/<pack-id>/mapsoo.import-state.json`:

- the first clean import returns `created`;
- repeating the same clean input returns `unchanged` and does not rewrite generated files;
- importing changed source over clean managed output returns `updated`;
- manual edits, missing/extra managed files, a damaged state file, or legacy alpha.1/alpha.2 output without state return `conflict` and are not overwritten.

Keep hand-authored scenes and scripts outside the managed directory. For legacy output, save your changes, then move the old derived directory aside before importing Alpha.4. The transaction protects normal in-process commit and rollback; it does not claim power-loss/crash atomicity or concurrent-writer safety. Keep the source pack and managed output still during import. See the full [safe re-import contract](11_SAFE_GODOT_REIMPORT.md).

Alpha.4 延续 Alpha.3 的所有权合同，只管理 `res://mapsoo_imports/<pack-id>/mapsoo.import-state.json` 中登记的生成文件。首次导入为 `created`；相同干净输入为不改写文件的 `unchanged`；干净的源变化为 `updated`；手工修改、文件缺失/新增、状态损坏或没有状态文件的 alpha.1/alpha.2 旧目录都会返回 `conflict`，不会被静默覆盖。请把手工作品放在管理目录之外；迁移旧输出时先保存修改并把旧派生目录移开。当前事务保证正常进程内提交与回滚，不承诺断电/硬崩溃原子性或并发写入安全。
