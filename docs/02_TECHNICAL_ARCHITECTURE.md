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

当前代码仍采用较浅目录：Provider 契约位于 `src/core/generation-provider.ts`，身份规则位于 `src/core/generator-identity.ts`，内置 Provider 与注册表位于 `src/providers/`。只有模块继续增长时才做机械目录迁移，避免为了理想树形打乱已发布路径。

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
  readonly displayName: string;
  readonly capabilities: GeneratorCapabilities;
  generate(spec: WorldSpec, options?: { signal?: AbortSignal }): Promise<GeneratedWorld>;
}
```

当前注册表内置 `procedural-pixel-v1@0.1.0`，声明本地执行、seeded determinism、零凭据、程序化 provenance、支持的 biome/Tile 尺寸、地图上限和局部重生成能力。`runGenerationProvider()` 在执行前验证并快照 Provider 元数据、World Spec 与 capabilities，向 Provider 传入第二份 spec 副本，并在执行后验证 tile/prop 完整性、Provider 身份和 spec 未被改写；AbortSignal 在调用前后都有稳定错误边界，vendor 异常则统一包装为 `provider.execution-failed`。World Spec 的程序化调用与文件导入共享 128 KiB、32 层和 10,000 节点上限，且拒绝循环和非 JSON extension 值。详见 [Provider SDK](09_PROVIDER_SDK.md)。

Workbench 的首次生成、编辑器生成和 World Spec 导入都通过同一个 runner。UI 以单一 generation session 管理请求：新意图会中止并淘汰旧请求，每个异步边界后都检查请求是否仍为最新，只有最新成功结果能替换预览。失败时保留最后一个成功世界；面向用户和控制台的状态只暴露稳定错误码，不输出 Provider 自定义错误正文或 `cause`。导入读取或生成期间禁用导出，避免把旧世界误当成刚导入的结果。

未来 AI Provider 不能绕过 domain validation；它们只返回标准化候选世界/资产，后续仍执行切图、缩放、命名、元数据与检查。当前 v0.1 exporter 只接受程序化 Provider，防止尚无 receipt 的模型输出被错误声明为 `contains_generative_ai: false` 或 CC0 程序化资产。

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
- `godot`：common + importer 版本/官方来源声明；可执行 addon 独立安装，不进入素材包；
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
