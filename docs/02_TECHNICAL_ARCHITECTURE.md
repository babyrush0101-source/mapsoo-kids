# 技术架构

## 1. 现状与目标

现有仓库曾是 React 18 + Vite 6 的网站前端。v0.1 只保留 React/Vite 工具链和 Git 历史，应用源代码直接重建为 Worldsmith 工作台；营销页、博客、社区、Supabase 登录和本地管理员不迁移。

目标架构把领域逻辑与 UI 分开，确保生成、校验和导出可以在浏览器 UI、测试、CLI 或未来 Godot 插件中复用。

## 2. 逻辑分层

```text
UI / Workbench
  ├─ World Spec editor
  ├─ Map preview
  ├─ Asset inspector
  └─ Export dialog
          │
Application services
  ├─ generateWorld(spec)
  ├─ validatePack(pack)
  ├─ save/load project
  └─ exportPack(pack, target)
          │
Domain core
  ├─ schemas and migrations
  ├─ seeded random
  ├─ generator/provider contracts
  ├─ asset and layer models
  └─ validation rules
          │
Adapters
  ├─ Canvas/PNG encoder
  ├─ ZIP writer
  ├─ browser storage
  ├─ procedural provider
  ├─ AI providers (later)
  └─ Godot exporter/importer
```

## 3. 建议目录

```text
src/
  app/
    App.tsx
    routes.ts
  features/
    world-editor/
    world-preview/
    asset-inspector/
    export-pack/
  core/
    schema/
      world-spec.ts
      manifest.ts
      migrations.ts
    generation/
      provider.ts
      procedural-provider.ts
      seeded-random.ts
    validation/
      rules.ts
      validate-pack.ts
    export/
      common-pack.ts
      godot-pack.ts
      itch-pack.ts
  adapters/
    canvas/
    storage/
    zip/
  examples/
    meadow.world.json
tests/
godot/
  addons/mapsoo_importer/
  example/
schemas/
```

旧网站已经存在于 Git 历史，不需要在新工作树中额外保存 `legacy` 副本。

## 4. World Spec

World Spec 是系统的主要输入，也是 STOYO 与 Mapsoo 的共享协议。示意：

```json
{
  "schemaVersion": "0.1.0",
  "id": "sunny-meadow",
  "title": "Sunny Meadow",
  "description": "A gentle meadow crossed by a winding stream.",
  "seed": "mapsoo-demo-001",
  "visual": {
    "style": "pixel-art",
    "tileSize": 32,
    "palette": ["#2f6b3b", "#65a84f", "#b8d96f", "#4c93b5", "#d7c28a"]
  },
  "map": {
    "width": 24,
    "height": 16,
    "biome": "meadow"
  },
  "content": {
    "terrain": ["grass", "water", "path"],
    "props": ["tree", "rock", "flower"]
  },
  "output": {
    "targets": ["common", "godot", "itch"],
    "assetLicense": "CC0-1.0"
  }
}
```

规则：

- `schemaVersion` 使用语义化版本；
- `id` 只能使用小写 ASCII、数字和短横线；
- `seed` 是字符串，算法内部稳定映射为整数；
- 尺寸必须设上限，防止浏览器内存失控；
- v0.1 JSON Schema 采用严格模式：未声明字段校验失败，避免拼写错误和不可复现输入被静默接受；
- v0.1 已显式声明顶层 `extensions` 对象；生态扩展必须使用 reverse-DNS namespaced key（例如 `dev.stoyo.world.v1`）；Mapsoo 原样保留其值但不解释；`extensions` 之外的未知字段仍校验失败；
- 每次迁移保留纯函数和夹具测试。

## 5. Generator Provider

```ts
interface GeneratorProvider {
  readonly id: string;
  readonly version: string;
  capabilities(): GeneratorCapabilities;
  generate(spec: WorldSpec, signal?: AbortSignal): Promise<GeneratedPack>;
}
```

v0.1 内置 `procedural-pixel-v1`。未来 AI provider 不能绕过 domain validation；它们只返回标准化候选资产，后续仍执行切图、缩放、命名、元数据与检查。

Provider receipt 至少记录：

- provider 和版本；
- 模型/工作流标识；
- seed；
- prompt 与负向约束（如适用）；
- 生成时间；
- 输入 spec hash；
- 后处理步骤；
- 用户声明与资产许可选择；
- 错误与重试次数。

## 6. Generated Pack

```ts
interface GeneratedPack {
  spec: WorldSpec;
  manifest: PackManifest;
  assets: GeneratedAsset[];
  map: TileMapData;
  receipt: GenerationReceipt;
  validation: ValidationReport;
}
```

资产在运行时使用 `Uint8Array`/`Blob`，避免把 base64 大量存入 React state。预览使用对象 URL，并在替换或卸载时释放。

## 7. 可重复随机数

不得使用 `Math.random()` 生成核心地图。实现固定算法（例如 xmur3 字符串散列 + mulberry32），并用固定输入/输出测试锁定行为。算法一旦进入 release 就带版本号；升级算法时保留旧版本或提供迁移说明。

## 8. 校验架构

每条规则返回：

```ts
type ValidationIssue = {
  code: string;
  severity: 'error' | 'warning' | 'info';
  assetId?: string;
  message: string;
  suggestion?: string;
};
```

v0.1 规则至少覆盖：schema、ID、文件名、Tile 整除、像素尺寸、alpha、引用完整性、重复 ID、地图 Tile ID 范围、license/receipt 缺失。

## 9. 导出架构

导出器接收同一个已校验的 `GeneratedPack`：

- `common`：稳定、引擎无关的素材和 JSON；
- `godot`：common + importer/addon + 示例 scene；
- `itch`：common + 封面、预览、发布 README 与 changelog 模板。

导出前若存在 error，默认阻止下载；warning 可由用户确认后继续。

## 10. 测试策略

- schema parse 和错误信息单元测试；
- seed 随机算法黄金值测试；
- 示例 world 的地图矩阵快照；
- PNG 像素数据 hash；
- ZIP 文件清单快照；
- manifest 引用完整性测试；
- Godot importer 的 headless smoke test（环境具备 Godot 时）；
- 浏览器端生成与下载 E2E；
- 对大尺寸 spec 的性能和内存上限测试。

## 11. 后端边界

v0.1 不需要后端。以下情况出现时再引入：

- 需要保护服务端 API Key；
- 需要队列处理长时间图像生成；
- 需要账户同步、公共图库或协作；
- 需要计费、速率限制、审核和审计。

即使增加后端，World Spec、manifest、validator 和 procedural provider 仍保持可离线使用。
