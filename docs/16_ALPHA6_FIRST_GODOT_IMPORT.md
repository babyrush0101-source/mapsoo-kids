# Alpha.6 candidate first Godot import / Alpha.6 候选首次导入 Godot

This is the acceptance guide for the **unpublished** Mapsoo Worldsmith `v0.1.0-alpha.6` candidate. It does not replace the public [Alpha.5 first-import guide](10_FIRST_GODOT_IMPORT.md). Alpha.6 release attachments do not exist at stable public download URLs while the work is in a branch or Draft PR; do not substitute guessed URLs or third-party archives.

这是尚未发布的 Mapsoo Worldsmith `v0.1.0-alpha.6` 候选验收指南，不替代公开的 [Alpha.5 首次导入指南](10_FIRST_GODOT_IMPORT.md)。在开发分支或 Draft PR 阶段，Alpha.6 Release 附件没有稳定公开下载地址；不要猜测下载 URL，也不要使用第三方归档冒充候选附件。

## Publication and digest boundary / 发布与摘要边界

- Before a matching GitHub release exists, maintainers may test locally generated candidate files only. Those files are not public release attachments.
- After the release workflow generates a Draft release, obtain both ZIPs and `SHA256SUMS` from that exact release. The generated `SHA256SUMS` is authoritative for attachment digests; this guide deliberately does not hard-code the future importer ZIP digest.
- The current local example-pack candidate is expected to reproduce SHA-256 `4563552187977b38cdba86c7d3cbf5429a67b7a0a6049e978c2ef2992ef3a054`, but it becomes a public-release claim only after the matching tag workflow and remote attachment audit succeed.
- The public, immutable download path remains [v0.1.0-alpha.5](https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.5) until Alpha.6 is deliberately published.

在正式 release 生成前只能测试本地候选文件。正式流程生成 Draft release 后，必须从同一个 release 获取两个 ZIP 与 `SHA256SUMS`，并以该文件记录的附件摘要为准。本指南不预填尚未生成的 importer ZIP 哈希。当前候选示例包哈希只是本地可复现证据，不能提前写成公开附件摘要。

## What the candidate must contain / 候选必须包含

Expected release attachment names after the release workflow succeeds:

```text
mapsoo-sunny-meadow-v0.1.0-alpha.6.zip
mapsoo-godot-importer-v0.1.0-alpha.6.zip
SHA256SUMS
```

The importer ZIP must extract with `addons/mapsoo_importer` as its project-relative root and include at least:

```text
addons/mapsoo_importer/plugin.cfg
addons/mapsoo_importer/mapsoo_importer_plugin.gd
addons/mapsoo_importer/mapsoo_pack_importer.gd
addons/mapsoo_importer/README.md
addons/mapsoo_importer/LICENSE.txt
addons/mapsoo_importer/icon.svg
```

Stop if the archive has an extra wrapper directory, lacks `README.md`, `LICENSE.txt`, or `icon.svg`, or places executable addon code inside the asset-pack ZIP. The icon is packaging evidence and a recognizable addon asset; its presence does not mean the plugin is listed in the Godot Asset Library.

若归档多出一层包装目录，缺少 README、LICENSE 或 icon，或者把 GDScript 放进素材包 ZIP，应立即停止。icon 只证明可安装归档完整，不表示已经上架 Godot Asset Library。

## 0–2 min — Verify the generated attachments / 校验生成附件

Place the two ZIPs and the exact generated `SHA256SUMS` in one directory. Verify that every listed digest matches before extraction.

PowerShell:

```powershell
Get-Content .\SHA256SUMS
(Get-FileHash .\mapsoo-sunny-meadow-v0.1.0-alpha.6.zip -Algorithm SHA256).Hash.ToLower()
(Get-FileHash .\mapsoo-godot-importer-v0.1.0-alpha.6.zip -Algorithm SHA256).Hash.ToLower()
```

macOS:

```bash
shasum -a 256 mapsoo-sunny-meadow-v0.1.0-alpha.6.zip
shasum -a 256 mapsoo-godot-importer-v0.1.0-alpha.6.zip
```

Linux:

```bash
sha256sum mapsoo-sunny-meadow-v0.1.0-alpha.6.zip
sha256sum mapsoo-godot-importer-v0.1.0-alpha.6.zip
```

Compare the command output with `SHA256SUMS`; stop on any mismatch. SHA-256 proves byte consistency, not publisher identity, so obtain the files only from the official repository's matching release.

## 2–5 min — Install and enable / 安装并启用

1. Close the target Godot project if it is open.
2. Extract `mapsoo-godot-importer-v0.1.0-alpha.6.zip` into the project root.
3. Confirm these project-relative paths exist:

   ```text
   addons/mapsoo_importer/plugin.cfg
   addons/mapsoo_importer/README.md
   addons/mapsoo_importer/LICENSE.txt
   addons/mapsoo_importer/icon.svg
   ```

4. Open the project in Godot 4.3 or newer.
5. Choose **Project → Project Settings → Plugins**.
6. Enable **Mapsoo Pack Importer**.

If the plugin is missing, close Godot and fix the extraction path. It must be `<project>/addons/mapsoo_importer/plugin.cfg`, not `<project>/mapsoo-godot-importer-.../addons/...`.

如果插件未显示，关闭 Godot 并修正解压路径。禁止从第三方素材包中启用来源不明的 GDScript。

## 5–8 min — Import the candidate pack / 导入候选素材包

1. Extract `mapsoo-sunny-meadow-v0.1.0-alpha.6.zip` to a local folder outside the Godot project's managed output directory.
2. In Godot choose **Project → Tools → Import Mapsoo Pack...**.
3. Select the extracted root manifest:

   ```text
   mapsoo-sunny-meadow-v0.1.0-alpha.6/mapsoo.manifest.json
   ```

4. The first clean import must report `created`.
5. Open:

   ```text
   res://mapsoo_imports/sunny-meadow/sunny-meadow.world.tscn
   ```

6. Confirm the generated scene contains a `Structures` container with exactly **2** `Sprite2D` structure children. The candidate example links `spawn-cottage` to place `spawn` and `landmark-shrine` to place `landmark`.
7. Confirm each structure's queryable metadata preserves its stable structure ID, `place_id`, archetype, cell, pivot, and atlas region, and that the linked place exists under `Places`.

素材包自身只含 PNG、JSON 与 Markdown，不含 addon 或 GDScript。成功标准包括：首次状态为 `created`，场景中恰好有 2 个建筑 `Sprite2D`，并且两者都能通过稳定 `place_id` 关联到已有地点。

## 8–10 min — Prove a no-op re-import / 验证无改写重复导入

Without changing the source pack or anything under `res://mapsoo_imports/sunny-meadow/`:

1. Run **Project → Tools → Import Mapsoo Pack...** again.
2. Select the same `mapsoo.manifest.json`.
3. The second result must be `unchanged`.
4. Reopen the generated scene and confirm the same two structure nodes and links remain.

The expected transition is exactly:

```text
created → unchanged
```

If the second import reports `updated` or `conflict`, record the full result and stop. Do not delete or overwrite the managed directory until the failure is understood. Keep hand-authored scenes, scripts, and gameplay outside `res://mapsoo_imports/<pack-id>/`; see the [safe re-import contract](11_SAFE_GODOT_REIMPORT.md).

相同干净输入的第二次导入必须是 `unchanged`，且不应改写托管资源。若出现 `updated` 或 `conflict`，记录完整错误并停止，不要为了“通过”而覆盖用户文件。

## Record the acceptance result / 记录验收结果

For a release review, record:

- source release/Draft release URL or an explicit “local candidate only” label;
- operating system and exact Godot version;
- both ZIP filenames and their matching `SHA256SUMS` entries;
- confirmation that `README.md`, `LICENSE.txt`, and `icon.svg` existed at the expected addon path;
- the first and second import results (`created → unchanged`);
- generated scene path and exact structure count (`2`);
- structure IDs, `place_id` links, or the complete importer error.

Do not submit credentials, private local paths, child data, private STOYO content, or unlicensed assets. This procedure is candidate acceptance evidence only; it is not proof of external adoption or production use.
