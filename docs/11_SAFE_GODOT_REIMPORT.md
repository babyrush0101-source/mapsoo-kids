# Godot 安全重导入合同（alpha.3 candidate）

本文描述 `Mapsoo Pack Importer` 的派生资源所有权、重导入状态机与事务边界。它是 alpha.3 候选合同；当前公开下载仍是 alpha.2，直到 alpha.3 完成独立发布、远端附件哈希登记和公开入口切换。

## 1. 受管目录

每个 pack 只管理一个固定目录：

```text
res://mapsoo_imports/<pack-id>/
  <pack-id>.tileset.tres
  <pack-id>.world.tscn
  mapsoo.import-state.json
```

目录必须精确包含这三个文件且没有子目录。手写场景、脚本和笔记必须放在受管目录外；出现额外文件时 importer fail closed，不会删除或接管。

## 2. 所有权状态

`mapsoo.import-state.json` 记录：

- 状态 schema 版本；
- importer ID 与生成版本；
- Godot `major.minor` 序列化代次；
- pack ID 与已验证 manifest SHA-256；
- `.tres`、`.tscn` 的 SHA-256；
- cell/prop 计数；
- canonical 状态字段的完整性 SHA-256。

canonical 结构使用字段白名单、排序后的文件键和显式整数计数，使 Godot 4.3/4.7 的 JSON 数字读回差异不会制造假冲突。状态文件只用于本地所有权与冲突检测，不是发布者签名；pack 内 manifest hash 也只证明内部一致性。

alpha.1/alpha.2 生成目录没有状态文件，因此 alpha.3 不会静默接管。用户应先保存自己的修改，再移动或删除旧派生目录后重新导入。

## 3. 结果状态

| 状态 | 条件 | 写盘行为 |
| --- | --- | --- |
| `created` | 最终目录不存在 | 完整 staging 目录一次 promote 到最终路径 |
| `unchanged` | manifest、importer/Godot 代次、状态、精确文件集合与输出 hash 全部匹配 | 真正 no-op；三个文件的字节和 mtime 都不改变 |
| `updated` | 旧 baseline 干净，但输入或生成代次变化 | 完整目录事务替换 |
| `conflict` | 受管文件缺失/被改、状态损坏、目录有额外内容，或提交窗口检测到变化 | 不 promote staging；恢复并保留检测到的既有内容 |
| `failed` | 输入校验、staging、资源加载或普通 I/O 失败 | 不替换最终目录；返回可操作错误 |

## 4. 更新事务

1. 从同一份 manifest 字节完成 JSON 解析与 manifest SHA-256。
2. 校验所有 `manifest.files` 的安全相对路径、字节数和 SHA-256，构建输入 snapshot。
3. 检查现有最终目录的精确文件集合、状态完整性和两个输出 hash，得到 output baseline。
4. 在 `res://mapsoo_imports/` 同父级创建唯一 staging 目录。
5. 保存 `.tres`、`.tscn` 和状态文件；从磁盘重新加载资源，核对 cell/prop 数量。
6. 再次计算 manifest 与全部声明文件的输入 snapshot；变化则删除 staging 并失败，不触碰最终目录。
7. 提交前再次检查 output baseline，关闭 staging 期间的普通修改窗口。
8. 更新时执行 `final → backup`。
9. 在 backup 上第三次核对同一 output baseline。若检查后、rename 前发生修改，则执行 `backup → final`，返回 `conflict`，并保留该修改。
10. 执行 `staging → final`。promote 失败时执行 `backup → final` 回滚。
11. 成功后只删除已验证的 importer backup；清理失败作为 warning 返回并给出恢复目录。

事务 helper 只接受 `res://mapsoo_imports/` 下同父级的安全 pack 路径，且 staging 必须是精确、状态有效的三文件目录。

## 5. 准确的可靠性边界

当前承诺是“正常进程内事务提交与回滚”：成功返回时不会暴露新旧混合资源；检测到冲突时不会用 staging 覆盖已有内容；已注入的 promote 失败能恢复完整旧目录。

当前不承诺：

- 断电或进程被强制终止时的原子性；
- 自动恢复遗留 staging/backup 的 crash journal；
- 同一个 pack 的跨进程并发锁；
- 导入期间仍有外部进程持续写入 source 或 managed output 的保护；
- 编辑器内尚未保存到磁盘的内存修改保护。

导入期间必须让选中的 source pack 与同 pack 的 managed output 保持静止。发生硬崩溃后若看到 `.mapsoo-staging-*` 或 `.mapsoo-backup-*`，停止再次导入，先人工检查并保存内容。journal/recovery 与同 pack 锁仍在 roadmap 中。

## 6. 验证门禁

`godot/tests/import_smoke.gd` 覆盖：首次创建、相同输入 no-op、干净更新、手改/缺失/额外文件/损坏状态冲突、无状态旧目录、无效输入保护、输入 snapshot 变化、promote 失败回滚以及 backup 后竞态保护。

`godot/tests/import_pack_cli.gd` 对真实固定哈希发布包执行 `created → unchanged`。公开 PR CI 在 Linux 和 Windows 上分别运行 Godot 4.3 与 4.7；发布 tag 在成为 alpha.3 候选前还必须把同一 Windows 门禁纳入 release workflow。
