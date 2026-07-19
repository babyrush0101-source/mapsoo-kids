# alpha.4 Playable Terrain Pack 设计与验收

状态：已发布；公开 PR/CI、GitHub prerelease 与 11 附件摘要账本均完成

目标版本：`v0.1.0-alpha.4`

本文定义 alpha.3 之后的首个内容型里程碑。alpha.1–alpha.3 已证明生成、可重复打包、Godot 导入、安全重导入和公开发布链；alpha.4 必须把 4 个平面地形 Tile 与 3 个道具的合同样例，推进为能在 Godot 中继续绘制并具有基础阻挡语义的世界地形包。

## 1. 用户结果

陌生 Godot 用户应能：

1. 在 Mapsoo Workbench 选择 biome、seed、尺寸与调色板；
2. 导出仍然不含脚本的 PNG + JSON portable pack；
3. 用独立安装的 importer 得到 `Ground`、`Water`、`Roads`、`Props` 四层场景；
4. 在 Godot Terrain 工具中继续绘制 Water 或 Roads，并获得正确的四邻接 Tile；
5. 在运行时让 water 形成基础全格阻挡，同时 ground/roads 保持可走；
6. 对同一输入重复导入得到真正 no-op 的 `unchanged`。

这不是“完整可玩游戏”或“生产级导航”。alpha.4 只承诺实际生成的 terrain painting 元数据、基础水域碰撞和经过测试的导入场景。

## 2. Portable pack v0.2 分层合同

旧 pack schema `0.1.0` 和三个公开 fixture/hash 永不原位修改。alpha.4 新增 pack schema `0.2.0`：

```text
Ground  — 满铺，不参与 Terrain Set，包含 3 个确定性视觉变体
Water   — 稀疏层，16 个 N/E/S/W mask，独立 match-sides Terrain Set
Roads   — 稀疏层，16 个 N/E/S/W mask，独立 match-sides Terrain Set
Props   — 对象层，至少 6 个 sprite 定义
```

mask 位固定为：`N=1`、`E=2`、`S=4`、`W=8`。Water Tile ID 为 `16 + mask`，Road Tile ID 为 `32 + mask`，Ground Tile ID 为 `0..2`；三层都声明 `empty_tile_id: -1`，但只有 Water/Roads 稀疏层的 `cells` 会实际出现 `-1`。Atlas 使用 8 列，坐标由版本化 tile definition 显式给出，消费者不得从文件名或数组位置推断。

每个 terrain tile 明确记录：

- `set_id` 与 `terrain_id`；
- 所属 Terrain Set 在顶层声明 `mode: match-sides`；
- `north/east/south/west` 四个 peering 值；
- 不连接的一侧为 `null`，不能猜测为其他 terrain；
- Water 使用受限 `full-cell` collision，Road/Ground 为 `none`。

Pack 顶层还要声明 `world-blocking` physics layer，collision layer/mask 固定为 1。alpha.4 不开放任意 polygon 输入，避免把未审计形状直接写进 Godot 资源。

## 3. 生成与像素来源

- semantic map 仍由固定 seed 的 Provider 生成；
- exporter 把旧的 ground/water/path/detail 语义投影为三张 row-major Tile layer；
- Ground 在所有格子下方满铺；Water/Roads 只在对应语义格子写入 mask Tile；
- 道路覆盖河流的格子不保留 Water collision；桥梁作为后续显式资产，不在 alpha.4 暗中推断；
- atlas 与浏览器预览必须复用同一像素绘制函数或从同一 atlas 回贴，禁止两套近似画法；
- meadow、desert、snow 都能产生 biome 合理的 6 个道具视觉，alpha.4 只固定发布一个审计示例；
- Provider/workflow/transformations 必须升版，历史 alpha.2/alpha.3 浏览器 verifier 继续调用冻结的 v1 Provider。

## 4. Godot importer 兼容

Importer 按 `schema_version` 分派：

- `0.1.0`：保持 alpha.1–alpha.3 的 Ground + Props 行为；
- `0.2.0`：创建 Ground/Water/Roads 三个 `TileMapLayer` 和 Props 节点；
- Water 与 Roads 分别创建 `TERRAIN_MODE_MATCH_SIDES` Terrain Set；
- TileData 从 manifest 设置 terrain、peering bits 和 full-cell water collision；
- 场景 z 顺序为 Ground 0、Water 1、Roads 2、Props 3；
- portable JSON 中的显式 Tile ID 决定导入结果；importer 不在导入时调用自动 terrain 选择，避免跨 Godot 版本漂移；
- ownership state 继续覆盖所有生成资源，旧目录冲突与进程内回滚边界不变。

## 5. 自动验收

### TypeScript / 浏览器

- Water 与 Roads 各 16 个 mask 定义齐全且 ID/atlas coords 唯一；
- 中心、边缘、异类邻居与地图边界的 mask 正确；
- 同一输入的 layer、atlas、manifest、ZIP 字节完全一致；
- preview 与 atlas 使用同一像素来源；
- 6 个 prop sprite 的透明度、region、pivot 与 biome 视觉均受测试；
- 新 ZIP 继续只有一个根目录，不含 `.gd`、`addons/` 或绝对路径；
- receipt 明确为程序化、非生成式 AI，并保留 CC0/MIT 许可边界；
- alpha.1–alpha.3 的公开 fixture 与 hash verifier 全部继续通过。

### Godot 4.3 / 4.7，Linux / Windows

- schema 0.1 历史 synthetic fixture 继续导入；
- alpha.4 exact pack 创建四层场景；
- 两个 Terrain Set、32 个 mask Tile 的 peering 数据与 manifest 一致；
- Water Tile 有 full-cell collision，Ground/Road 没有；
- 地图所有非空 Tile ID 都能解析到 atlas coords；
- nearest filtering、prop region/pivot、cell/prop 数量正确；
- exact pack 连续导入为 `created → unchanged`；
- 冲突、更新和 promote 失败回滚测试继续通过。

## 6. 发布边界

- alpha.4 先作为 candidate 生成固定浏览器 fixture、release bundle 和离线 itch.io operator kit；
- tag workflow 全绿并审计 11 个附件后，才人工发布 GitHub prerelease；
- 发布后由独立 ledger PR 固定所有远端 digest 并切换公开下载；
- itch.io 仍不登录、不上传；operator kit 只用于可重复验证；
- 反馈表单使用用户填写的 release tag、pack filename/hash、OS、Godot 版本和结果，不再硬编码旧 alpha；
- 只有独立用户的公开报告与维护响应才算外部采用，CI、维护者下载和发布审计都不算。

## 7. 停止条件

出现任一情况时不得发布：历史 hash 改变、schema 0.1 行为回归、preview 与 atlas 不一致、Water collision 覆盖道路格、Terrain peering 缺 mask、portable ZIP 出现脚本、任一 Godot 矩阵失败、远端附件 digest 不一致，或文档声称尚未实现的 navigation/production readiness/外部采用。
