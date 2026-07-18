# 资产与导出规格 v0.1

本文描述 v0.1 的目标合同。当前 alpha 已输出 PNG、JSON、manifest、receipt、资产许可和所需 importer 版本；独立安装的官方 Godot EditorPlugin 可从已解压 pack 在 Godot 4.3/4.7 中派生 `TileSet`、`TileMapLayer` scene 和 props。素材包不携带可执行 GDScript，直接读取不可信 ZIP 也未开放。

## 1. 像素资产约束

| 属性 | v0.1 默认值 |
| --- | --- |
| 风格 | pixel-art |
| Tile 尺寸 | 32×32 px |
| 可选尺寸 | 16×16、64×64 px |
| 色彩 | sRGB |
| 图像格式 | PNG RGBA |
| 采样 | nearest-neighbor，无平滑 |
| 边距/间隔 | 0，除非 manifest 明确声明 |
| 文件名 | lowercase-kebab-case ASCII |
| 原点 | top-left；对象 pivot 单独记录 |
| Godot 最低版本 | 4.3 |
| Godot 地图节点 | TileMapLayer |

像素风输出不得在最终缩放时使用双线性插值。Godot 4.3 中这几项属于不同层级：PNG 导入设置使用 Lossless 压缩并关闭 mipmap；nearest 采样由显示纹理的 `CanvasItem` 控制，importer 应把生成的 `TileMapLayer`/预览节点的 `texture_filter` 设为 `TEXTURE_FILTER_NEAREST`。透明背景资产需要检查 alpha；完全不透明的地形 tilesheet 可以被允许，但必须在 manifest 标注。参考：[Godot 图片导入](https://docs.godotengine.org/en/stable/tutorials/assets_pipeline/importing_images.html)、[CanvasItem](https://docs.godotengine.org/en/stable/classes/class_canvasitem.html) 与 [TileMapLayer](https://docs.godotengine.org/en/stable/classes/class_tilemaplayer.html)。

## 2. 资产类别

- `terrain`：grass、soil、sand、snow 等基础地形；
- `transition`：岸线、道路边缘、地形过渡；
- `water`：静态水面，动画帧后续加入；
- `prop`：树、石、花、路牌等可摆放对象；
- `building`：v0.2 以后；
- `character`：v0.3 以后；
- `effect`：v0.3 以后；
- `preview`：封面和地图预览，不直接进入游戏。

## 3. Tilesheet 约定

v0.1 采用显式 atlas manifest，不依赖隐含位置：

```json
{
  "image": "assets/tiles/terrain.png",
  "tileSize": 32,
  "columns": 4,
  "rows": 2,
  "tiles": [
    { "id": 0, "name": "grass", "x": 0, "y": 0 },
    { "id": 1, "name": "water", "x": 1, "y": 0 },
    { "id": 2, "name": "path", "x": 2, "y": 0 }
  ]
}
```

`x/y` 是格子坐标而不是像素坐标。Tile ID 在同一个 tileset 内稳定；删除 Tile 时避免立即复用 ID。

Godot Atlas 额外规则：

- `TileSet.tile_size` 与 manifest 的 `cell_size_px` 一致；
- `TileSetAtlasSource.texture_region_size` 不小于 Tile 尺寸；
- v0.1 的 `margin` 和 `separation` 默认都是 0；
- `use_texture_padding = true`，减少纹理过滤产生的边缘接缝；
- Tile 由 manifest 显式创建，不扫描透明区域猜测；
- 已发布的 `source_id`、atlas 坐标和 alternative ID 不重新编号。

参考：[TileSet](https://docs.godotengine.org/en/stable/classes/class_tileset.html)、[TileSetAtlasSource](https://docs.godotengine.org/en/stable/classes/class_tilesetatlassource.html)。

## 4. 地图约定

- 使用二维 layer；
- v0.1 至少包含 `ground` 和 `props`；
- 地图坐标从左上角 `(0,0)` 开始；
- 空格使用 `-1`；
- layer 数据按 row-major 平铺，或二维数组，但 manifest 必须明确；
- 所有 Tile 引用必须指向已声明的 tileset 与有效 ID。

## 5. 包清单

`mapsoo.manifest.json` 至少包含：

- pack ID、标题、版本；
- Mapsoo 版本与 schema 版本；
- 生成时间；
- 目标引擎与验证版本；
- World Spec 路径和 hash；
- 每个文件的角色、字节数、媒体类型与必填 SHA-256；
- tileset 定义；
- map layers；
- provider receipt 路径；
- 资产许可，以及独立 importer 的 ID、最低版本和官方来源；
- attribution 条目。

## 6. v0.1 统一 ZIP 结构

```text
mapsoo-sunny-meadow-v0.1.0-alpha.1/
  readme.md
  license-assets.md
  mapsoo.manifest.json
  generation-receipt.json
  worlds/
    sunny-meadow.world.json
    demo-world.json
  atlases/
    terrain.png
    props.png
  previews/
    map-preview.png
  schema/
    mapsoo-pack.schema.json
    mapsoo-world.schema.json
```

所有消费者读取同一套 PNG、JSON、manifest 和许可文件。Godot 用户从官方仓库或未来的 Godot Asset Library 独立安装 importer；素材 ZIP 只在 manifest 中声明 importer ID、最低版本和官方来源，不维护容易漂移的第二套“Godot ZIP”。

## 7. Godot 导入流程

Godot 资源通常在导入时产生 UID 和 `.godot/imported` 状态，因此 v0.1 由 Godot 内运行的普通 `EditorPlugin` 创建 TileSet/场景，而不是在浏览器里手写依赖特定 UID 的 `.tres`，也不抢占通用 `.json` 扩展名注册 `EditorImportPlugin`。`.godot/` 和 `.import` 缓存不进入导出包。参考：[Godot editor plugins](https://docs.godotengine.org/en/4.3/tutorials/plugins/editor/making_plugins.html)。

使用顺序：从官方可信来源安装并启用 Mapsoo importer → 解压 pack → 从 Tools 菜单选择已解压 pack 的 `mapsoo.manifest.json` → 打开 `res://mapsoo_imports/<pack-id>/<pack-id>.world.tscn`。

安全边界：pack 内的 SHA-256 只能证明文件与 manifest 自洽，不能证明发布者身份。第三方素材包即使附带 `addons/` 或 `.gd` 文件，也不得复制并启用；可执行 importer 必须通过独立可信渠道获得。

Importer 职责：

1. 读取 manifest；
2. 在解码前检查 PNG IHDR 尺寸/像素预算，解码后以内嵌 Lossless `PortableCompressedTexture2D` 保存，并把使用它们的 `CanvasItem`（尤其 `TileMapLayer`）设为 nearest texture filter；
3. 创建 TileSet atlas source；
4. 按 manifest 添加 Tile；
5. 创建 Godot 4.3+ 的 `TileMapLayer` 和地图内容；
6. 把生成资源保存到项目目录；
7. 输出可读的错误信息。

## 8. itch.io 友好包

itch.io 不应成为私有格式。发布包在通用 ZIP 上增加：

- 清楚的封面和 2–4 张预览；
- 一页 Quick Start；
- 支持的 Tile 尺寸、引擎版本与文件格式；
- 商业使用、修改、再分发和署名规则；
- 版本号与 changelog；
- 联系方式、issue 地址和项目主页；
- 可选的 Godot demo，避免把编辑器缓存打包。

发布时将素材包归类为 `Graphical Assets`，不要因为 PNG 能在 Windows 打开就勾选 Windows 平台；生成器本身若发布到 itch.io，则归类为 Tool。生成式素材必须按 itch.io 要求填写 AI Disclosure。参考：[itch.io Creator guide](https://itch.io/docs/creators/getting-started)、[Quality guidelines](https://itch.io/docs/creators/quality-guidelines)。

## 9. 许可证模型

以下许可必须分开：

- **Mapsoo 源代码**：MIT；
- **Mapsoo 内置程序化示例资产**：推荐 CC0-1.0；
- **用户导入资产**：由用户声明并保留 attribution；
- **AI 生成资产**：记录 provider 条款、模型/工作流、生成日期和用户选择；
- **第三方字体/图标/模板**：单独列入 `THIRD_PARTY_NOTICES.md`。

导出器不能用“Mapsoo 是 MIT”推导“所有输出资产都是 MIT”。

## 10. 验收清单

- [x] 所有 PNG 尺寸与 manifest 一致；
- [x] tilesheet 宽高可被 Tile 尺寸整除；
- [x] 对象背景具有预期 alpha；
- [x] 地图中不存在越界 Tile ID；
- [x] 所有 manifest 路径使用 `/` 且为相对路径；
- [x] 不包含绝对本机路径、API Key 或用户目录；
- [x] README、资产许可和 generation receipt 存在；
- [x] ZIP 根目录只有一个带版本的 pack 文件夹；
- [x] 素材 ZIP 不包含 `.gd`、`addons/` 或其他可执行 importer 代码；
- [ ] Windows/macOS/Linux 解压后文件名稳定；
- [x] Godot 示例导入后保持 nearest-neighbor；
- [x] 在 Godot 4.3 与发布时最新稳定版完成导入 smoke test；
- [x] 示例场景使用 `TileMapLayer`，不依赖已弃用的旧 `TileMap`；
- [ ] itch.io 预览与实际包内容一致。

推荐实现顺序：`manifest/PNG validator → ZIP exporter → Godot importer → 示例世界 → itch.io release pipeline`。
