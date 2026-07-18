# Mapsoo Worldsmith：GitHub Alpha、itch.io 与 Codex for OSS 发布执行包

更新日期：2026-07-18

目标版本：`v0.1.0-alpha.1`

目标仓库：`babyrush0101-source/mapsoo-kids`

> 本文是可复制、可逐项勾选的发布运营模板，不是已经发布的证明。所有形如 `[REPLACE: ...]` 的占位符必须在公开前替换；没有公开 URL、公开 CI 记录或第三方反馈时，不能把它写成已完成。

## 0. 当前事实边界

### 已完成并可在当前工作树验证

- Mapsoo Worldsmith 的本地优先 World Spec 编辑、确定性程序化生成、Canvas 预览、校验与可移植 ZIP 导出；
- meadow、desert、snowfield 三种本地配方；
- 素材 ZIP 使用 PNG + JSON 作为真源，包含 manifest、SHA-256、生成记录和 CC0-1.0 素材许可，不携带 GDScript 或 addon；
- 独立安装的 MIT Godot importer，可派生 `TileSet`、`TileMapLayer` scene 和 props；
- 本地测试、浏览器视觉验收，以及 Godot 4.3/4.7 导入验证；
- 真实 Sunny Meadow 浏览器导出 fixture，以及包含 10 个文件、带 SHA-256 和字节级可重复性校验的本地 release bundle；
- README、路线图、贡献指南、安全政策、issue/PR 模板与 MIT 源码许可。

### 尚未形成公开证据

- `[ ]` 当前 alpha 提交已推送并合入公开默认分支；
- `[ ]` GitHub tag 与 `v0.1.0-alpha.1` pre-release；
- `[ ]` 该公开提交上的 GitHub Actions 绿色记录；
- `[ ]` 可公开访问的在线 Demo；
- `[ ]` itch.io 免费 Graphical Assets 页面；
- `[ ]` 60–90 秒公开演示视频；
- `[ ]` 外部用户 issue、评价、下载量、star、fork 或采用案例。

因此，本文后半部分的 Codex for OSS 文案是“收集完公开证据后提交”的模板。STOYO 是计划中的首个真实使用方，不得提前写成已有生产采用或外部用户。

## 1. 发布顺序与停止条件

按以下顺序执行，不跳过验证门槛：

1. 将 alpha 分支通过 PR 合入 `main`，确认公开提交中不含旧凭据、私有 STOYO 内容或本机绝对路径；
2. 在仓库 `Settings → Pages` 把 Source 设为 `GitHub Actions`；不要选择 branch/folder 发布源；
3. 在合入后的准确 commit 上运行 `pnpm install --frozen-lockfile` 和 `pnpm check`；
4. 等待公开 GitHub Actions 的 Node、Godot 4.3/4.7 与 Pages jobs 全绿，并记录真实 Demo URL；
5. 从同一 commit 生成并复核发布附件、SHA-256、截图和演示视频；
6. 先创建 GitHub draft release，再创建 itch.io Draft 页面；
7. 用 itch.io 的 `Save & view page` 检查标题、许可、AI 披露、截图和下载文件；
8. 发布 GitHub pre-release，取得真实 `[RELEASE_URL]`；
9. 把 release、仓库和 issue 链接补进 itch.io 页面，然后才把 itch.io 可见性切换为 Public；
10. 发布演示视频并创建反馈 issue；
11. 至少收集一轮真实外部反馈并公开响应，再准备 Codex for OSS 申请。

任意一项发生时停止发布：CI 未绿、附件 hash 与记录不一致、素材 ZIP 出现 `.gd`/`addons/`、截图与实包不一致、许可文件缺失、AI 披露无法如实填写，或页面仍含占位符。

## 2. GitHub `v0.1.0-alpha.1` 发布包

### 2.1 Tag 与 Release 设置

- Tag：`v0.1.0-alpha.1`
- Target：已经合入且 CI 全绿的 `main` commit，禁止在未合入的本地 commit 上打公开 tag
- Release title：

```text
Mapsoo Worldsmith v0.1.0-alpha.1 — Portable Godot World Pack / 可移植 Godot 世界素材包
```

- 勾选：`Set as a pre-release`
- 不勾选：`Set as the latest release`
- Discussion：若仓库尚未启用 Discussions，不要临时开启；统一使用下文的反馈 issue

### 2.2 GitHub Release 附件

| 附件 | 是否必需 | 内容与安全边界 |
| --- | --- | --- |
| `mapsoo-sunny-meadow-v0.1.0-alpha.1.zip` | 必需 | 可执行代码为零的示例素材包；根目录必须只有一个版本化 pack 文件夹 |
| `mapsoo-godot-importer-v0.1.0-alpha.1.zip` | 必需 | 单独的官方 importer 发行包，仅包含 `addons/mapsoo_importer/`、MIT `LICENSE` 和安装说明；不得塞回素材 ZIP |
| `SHA256SUMS` | 必需 | 记录发布脚本生成的全部其他附件 SHA-256（不记录自身）；GitHub 自动生成的 Source code archives 不写入此文件 |
| `mapsoo-worldsmith-web-v0.1.0-alpha.1.zip`、两份 schema、World Spec、release manifest、LICENSE、CHANGELOG | 推荐保留 | 由 `pnpm release:local` 自动生成，便于离线部署、工具集成和复核；不要手工改名后继续沿用旧 checksum |
| `mapsoo-worldsmith-v0.1.0-alpha.1-demo.mp4` | 可选 | 60–90 秒演示；也可改为 release notes 中的公开视频链接 |
| desert / snowfield 示例包 | 本次不要求 | 只有在逐包经过同等浏览器导出和 Godot 4.3/4.7 验收后才上传 |

附件命名、ZIP 内 manifest 的 `pack.version`、tag 和 importer `plugin.cfg` 版本必须都为 `0.1.0-alpha.1`。`SHA256SUMS` 只能证明附件没有在下载中变化，不能代替发布者签名；release notes 必须继续提醒用户只从官方仓库安装 importer。

### 2.3 GitHub Release 说明——可直接粘贴

```markdown
# Mapsoo Worldsmith v0.1.0-alpha.1

## 中文

这是 Mapsoo Worldsmith 的第一个公开预发布版本。它把一个版本化的 World Spec 转换为可重复生成、可校验、适合 Godot 4.3+ 的 2D 像素世界素材包。

### 本版本包含

- meadow、desert、snowfield 三种离线程序化世界配方；
- 相同 World Spec 与 seed 得到相同地图结果；
- 浏览器内地图预览和导出前校验；
- 不含可执行代码的 PNG + JSON ZIP；
- manifest、逐文件 SHA-256、generation receipt 与 CC0-1.0 素材许可；
- 独立安装的 Godot importer，可生成 TileSet、TileMapLayer scene 与 prop sprites；
- Godot 4.3 与 4.7 自动 smoke tests。

### 快速开始

1. 下载 `mapsoo-sunny-meadow-v0.1.0-alpha.1.zip` 并解压；
2. 仅从本官方 release 下载 `mapsoo-godot-importer-v0.1.0-alpha.1.zip`，把 `addons/mapsoo_importer/` 安装到自己的 Godot 4.3+ 项目；
3. 在 Godot 中启用 **Mapsoo Pack Importer**；
4. 选择已解压 pack 根目录中的 `mapsoo.manifest.json`；
5. 打开生成到 `res://mapsoo_imports/<pack-id>/` 的 world scene。

### 安全与许可

素材 ZIP 不携带 GDScript 或 addon。请勿启用第三方素材包中附带的脚本；pack 内 SHA-256 只验证文件与 manifest 自洽。Mapsoo 源码与 importer 使用 MIT，随本 release 发布的程序化示例素材使用 CC0-1.0，具体以各 ZIP 内许可文件为准。

### 已知限制

- alpha 目前使用自包含的程序化生成器，不包含模型生成的图像；
- 每个世界当前只使用一个 biome，地图为正交、俯视像素风；
- importer 需要先解压素材 ZIP，暂不直接打开不可信 ZIP；
- 重新导入与冲突处理策略仍会继续完善；
- 在线 Demo：发布前替换为 `[REPLACE: DEMO_URL]`；若尚未上线，删除这一行。

问题与反馈：`[REPLACE: FEEDBACK_ISSUE_URL]`

## English

This is the first public pre-release of Mapsoo Worldsmith. It turns a versioned World Spec into a deterministic, validated 2D pixel-world asset pack for Godot 4.3+.

### Included

- Offline meadow, desert, and snowfield recipes;
- deterministic map output for the same World Spec and seed;
- an in-browser preview and pre-export validation;
- an executable-free PNG + JSON asset ZIP;
- a manifest, per-file SHA-256 records, generation receipt, and CC0-1.0 asset license;
- a separately installed Godot importer that derives a TileSet, TileMapLayer scene, and prop sprites;
- automated smoke tests on Godot 4.3 and 4.7.

### Quick start

1. Download and extract `mapsoo-sunny-meadow-v0.1.0-alpha.1.zip`.
2. Download `mapsoo-godot-importer-v0.1.0-alpha.1.zip` only from this official release and copy `addons/mapsoo_importer/` into your Godot 4.3+ project.
3. Enable **Mapsoo Pack Importer** in Godot.
4. Select `mapsoo.manifest.json` from the extracted pack root.
5. Open the generated world scene under `res://mapsoo_imports/<pack-id>/`.

### Security and licensing

The asset ZIP contains no GDScript or addon. Never enable scripts bundled by a third-party asset pack. SHA-256 values inside a pack prove internal consistency, not publisher identity. Mapsoo source and the importer are MIT-licensed; the procedural example assets in this release are CC0-1.0. The files inside each archive are authoritative.

### Known limitations

- This alpha uses a self-contained procedural generator and contains no model-generated imagery.
- Each world currently uses one biome and an orthogonal top-down pixel-art layout.
- The importer operates on an extracted pack and does not directly open untrusted ZIP files.
- Re-import and conflict handling will continue to evolve.
- Online demo: replace with `[REPLACE: DEMO_URL]`, or delete this line if it is not live.

Issues and feedback: `[REPLACE: FEEDBACK_ISSUE_URL]`
```

### 2.4 发布前验证记录

将以下结果复制到 draft release 的内部检查单，不要凭记忆勾选：

```text
[ ] tag 指向已合入 main 的 commit: [REPLACE: COMMIT_SHA]
[ ] public CI URL: [REPLACE: CI_URL]
[ ] pnpm check: passed at [REPLACE: UTC_TIME]
[ ] Godot 4.3 smoke: passed at [REPLACE: CI_JOB_URL]
[ ] Godot 4.7 smoke: passed at [REPLACE: CI_JOB_URL]
[ ] browser ZIP -> Godot 4.3/4.7: passed for exact attached pack
[ ] asset ZIP contains no .gd, .uid, addons/, .godot/ or absolute paths
[ ] manifest version, ZIP name, tag and importer version agree
[ ] SHA256SUMS recomputed from final upload bytes
[ ] release notes contain no [REPLACE: ...] placeholder
```

## 3. itch.io 免费 Graphical Assets 页面

itch.io 官方建议封面保持 315:250 比例，推荐至少使用 630×500，并上传 3–5 张截图；Graphical Assets 不应虚假勾选 Windows/macOS/Linux 平台。素材页必须准确填写生成式 AI 披露。参考：[Your first itch.io page](https://itch.io/docs/creators/getting-started) 与 [Content creator quality guidelines](https://itch.io/docs/creators/quality-guidelines)。

### 3.1 页面字段

| 字段 | 填写值 |
| --- | --- |
| Title | `Mapsoo Sunny Meadow — Free Pixel World Pack for Godot` |
| URL slug | `mapsoo-sunny-meadow`，若占用则 `mapsoo-sunny-meadow-godot` |
| Classification | `Assets` |
| Kind of project / Upload type | `Downloadable` / `Graphical Assets`，采用页面当前对应字段 |
| Release status | `In development`，因为这是 alpha；稳定后再改 `Released` |
| Pricing | 最低价格 `0`，允许免费直接下载；是否开启自愿捐赠由维护者决定，不得写成必须付费 |
| Platforms | 全部不勾选；PNG 能在某系统打开不等于可执行程序支持该平台 |
| Asset license | `CC0-1.0`；正文同时链接/说明 ZIP 内 `license-assets.md` 为准 |
| Visibility | 准备阶段 `Draft`；所有文件、图片、许可和 AI 披露复核后改 `Public` |
| Community | 开启 comments，正文仍以 GitHub issue 为可复现 bug 的主入口 |
| Repository | `https://github.com/babyrush0101-source/mapsoo-kids` |
| Release | `[REPLACE: RELEASE_URL]` |
| Demo | `[REPLACE: DEMO_URL]`；尚未上线就不显示该字段和相关句子 |

### 3.2 短描述

英文推荐值：

```text
Free CC0 pixel-art tiles, props, map JSON, and a tested Godot 4.3+ import workflow generated locally by Mapsoo Worldsmith.
```

中文备用值：

```text
由 Mapsoo Worldsmith 本地生成的免费 CC0 像素地形、道具、地图 JSON 与 Godot 4.3+ 导入流程。
```

### 3.3 标签与元数据

优先选择 itch.io 已提供的 suggested tags，最多使用以下 10 个，不额外手工添加 `AI Generated` 或 `No AI`：

```text
Pixel Art
2D
Top-Down
Tileset
Sprites
Asset Pack
Godot
Procedural Generation
Fantasy
CC0
```

如果当前界面没有某个建议标签，删除它，不为了凑满 10 个建立近义词。`Graphical Assets` 已通过分类表达，不再把 `graphical` 当推广标签。

### 3.4 AI Disclosure——当前 alpha 的保守填写法

itch.io 的生成式 AI 披露询问项目是否包含生成式 AI 的结果；选择 Yes 后可细分 Graphics、Sound、Text & Dialog、Code。官方同时明确：不依赖外部大型数据集的自包含算法和程序化关卡生成，本身不需要当作生成式 AI 图像标记。参考：[itch.io AI disclosure announcement](https://itch.io/t/4309690/generative-ai-disclosure-tagging) 与 [quality guidelines 的 AI disclosure 段落](https://itch.io/docs/creators/quality-guidelines#ai-disclosure)。

当前项目已使用 Codex 协助代码和文档，而当前 itch 素材 ZIP 不携带代码。为了不把“程序化像素图不是模型生成”误写成“整个发布过程完全没有生成式 AI”，建议按最终上传内容这样填写：

- `Generative AI disclosure`：**Yes**；
- `Text & Dialog`：**勾选**，因为项目页和随包说明文本使用了 Codex 辅助；
- `Code`：当前 Graphical Assets ZIP 不含代码，**不勾选**；如果未来在同一 itch 页面上传 importer/source，则必须勾选；
- `Graphics`：**不勾选**，当前 PNG 来自确定性、自包含的程序化绘制，不是图像模型输出；
- `Sound`：**不勾选**，当前包不含声音。

若发布前人工从头重写所有页面与随包文本，仍需按最终工件逐项复核；不能仅为了取得 `No AI` 标签而忽略实际生成式 AI 内容。未来加入图像模型输出时，必须把 disclosure 改为 Yes + Graphics，并同步更新 manifest 的 provenance。

在长描述中追加这段透明说明：

```text
AI & procedural-generation disclosure: the distributed pixel artwork is produced by deterministic, self-contained procedural code, not by an image-generation model. Codex assisted development and documentation; no AI-generated graphics or sound are included in this alpha.
```

### 3.5 长描述——可直接粘贴

```markdown
## A tiny world pack with an open contract

Mapsoo Sunny Meadow is a free alpha asset pack generated locally by **Mapsoo Worldsmith**, an open-source pipeline for turning a versioned World Spec into deterministic, validated 2D game assets.

This download is a curated sample pack, not a promise that every possible generated world is production-ready. It is designed to make the complete path inspectable: World Spec → PNG/JSON pack → validation → Godot import.

## Included

- top-down pixel-art terrain atlas;
- transparent prop atlas;
- a ready-made sample map and PNG preview;
- portable World Spec and map JSON;
- `mapsoo.manifest.json` with stable IDs and per-file SHA-256 records;
- generation/provenance receipt;
- CC0-1.0 asset license;
- a tested workflow for Godot 4.3+.

## Godot quick start

1. Download and extract the asset ZIP.
2. Install the Mapsoo Pack Importer only from the official repository or release: `[REPLACE: RELEASE_URL]`.
3. Enable the importer in your Godot 4.3+ project.
4. Select the extracted pack's `mapsoo.manifest.json`.
5. Open the generated scene under `res://mapsoo_imports/<pack-id>/`.

The asset ZIP intentionally contains no GDScript or addon. A hash inside the pack proves file consistency, not publisher identity, so do not enable scripts copied from third-party asset packs.

## License

The assets in this downloadable sample pack are released under **CC0-1.0**. You may use, modify, and redistribute them, including commercially. The exact `license-assets.md` inside the ZIP is authoritative. Mapsoo Worldsmith source code and the separately distributed importer use the MIT License.

## Compatibility and limits

- tested importer target: Godot 4.3 and 4.7;
- orthogonal, top-down pixel-art world;
- one biome per generated alpha world;
- importer works from an extracted pack;
- alpha format: breaking changes remain possible before v1.0.

## AI and procedural-generation disclosure

The distributed pixel artwork is produced by deterministic, self-contained procedural code, not by an image-generation model. Codex assisted development and documentation; no AI-generated graphics or sound are included in this alpha.

## Links and feedback

- Source and documentation: https://github.com/babyrush0101-source/mapsoo-kids
- GitHub alpha release: `[REPLACE: RELEASE_URL]`
- Online demo: `[REPLACE: DEMO_URL]` — delete this line if the demo is not live
- Reproducible feedback: `[REPLACE: FEEDBACK_ISSUE_URL]`

When reporting an import problem, include your OS, Godot version, pack filename, World Spec seed, exact error message, and whether the issue reproduces in a new Godot project.

---

## 中文说明

Mapsoo Sunny Meadow 是 Mapsoo Worldsmith 生成的免费 alpha 像素世界示例包，包含地形、道具、地图 JSON、manifest、生成记录和 CC0-1.0 素材许可。素材 ZIP 不含 GDScript；Godot importer 只从官方仓库或 release 单独安装。当前图像由确定性、自包含的程序化代码绘制，不是图像模型输出；Codex 参与了开发和文档辅助。
```

发布前必须删除所有 `[REPLACE: ...]` 行或换成真实公开 URL。特别是在线 Demo 未上线时，直接删除 Demo 行，不能用“coming soon”冒充可用入口。

### 3.6 itch.io 上传文件清单

| 顺序 | 文件 | 页面显示名 | 备注 |
| --- | --- | --- | --- |
| 1 | `mapsoo-sunny-meadow-v0.1.0-alpha.1.zip` | `Sunny Meadow asset pack — v0.1.0-alpha.1` | 必需；直接上传 itch.io，不只放第三方链接 |
| 2 | `SHA256SUMS` | `SHA-256 checksums` | 可选但推荐；必须与 itch 最终上传字节一致 |

不要在此 Graphical Assets 页面上传 Godot importer ZIP，也不要把 Windows/Linux/macOS 当下载平台。用户通过正文中的官方 GitHub release 取得 importer。desert/snowfield 只有在验证和截图都完成后才能追加；追加版本应更新同一个页面，不要为了“重新进入最新发布”复制近似页面。

### 3.7 封面和截图制作规范

封面：

- `1260×1000 PNG`，严格保持官方 315:250 比例；也可使用官方建议的 `630×500`；
- 主体占画面 70% 左右，展示一张完整的 Sunny Meadow 地图局部；
- 左上只放 `MAPSOO SUNNY MEADOW`，右下小字 `FREE • CC0 • GODOT 4.3+`；
- 像素图放大必须 nearest-neighbor，不使用模糊、光晕或虚假的概念图；
- 不写“AI asset generator”，因为当前 alpha 只完成程序化基线。

截图统一使用 `1600×900 PNG`，按以下顺序上传 5 张：

1. **最终地图 Hero**：完整世界预览，角落注明 `Actual generated pack preview`；
2. **World Spec → Preview**：工作台表单与地图并排，能看到 biome、seed、tile size 和 validation；
3. **Pack contents**：terrain atlas、props atlas、map preview 和 ZIP 目录，不出现本机绝对路径；
4. **Godot import result**：Godot 4.3+ 编辑器中的 `TileMapLayer`、props 和 FileSystem 输出目录；
5. **Open contract**：PNG + JSON + manifest + CC0 + separate trusted importer 的简洁流程图。

截图只展示这个 release 实际具备的界面和输出。在线 Demo 未发布时，不放 URL 或“Play now”按钮；Godot 截图必须来自最终附件的真实导入结果。

当前仓库已保存两张浏览器验收原图：[`hero-1585x892.png`](media/v0.1.0-alpha.1/hero-1585x892.png) 与 [`workbench-1585x892.png`](media/v0.1.0-alpha.1/workbench-1585x892.png)。它们用于证明真实 UI 状态和后续选片，不冒充最终 itch.io 上传组；最终仍需按上面的 `1600×900` 规格输出，并补齐 pack contents、Godot import result、open contract 三张图。

## 4. 75 秒演示视频脚本

目标：一镜一结论，录制本地工作台和 Godot，不依赖尚未上线的在线 Demo。输出 `1920×1080`、30 或 60 fps、MP4/H.264；鼠标操作放慢，字幕至少 42 px，像素预览使用 nearest-neighbor。

| 时间 | 画面 | 中文旁白 | 英文字幕 |
| --- | --- | --- | --- |
| 0–6s | 标题 + 最终地图快速切入 | “这是 Mapsoo Worldsmith：把一个世界设定变成 Godot 可用素材包的开源工具。” | `Mapsoo Worldsmith turns a World Spec into a Godot-ready asset pack.` |
| 6–17s | 工作台选 Sunny Meadow，展示 seed 与尺寸 | “选择 biome、地图尺寸和 seed。当前 alpha 完全本地运行，不需要账号、后端或 API key。” | `Choose a biome, size, and seed. The alpha runs locally with no account or API key.` |
| 17–28s | 点击生成；改 seed 后生成，再改回原 seed | “相同的 World Spec 和 seed 会得到相同结果，方便复现 bug 和版本化世界。” | `The same spec and seed reproduce the same world.` |
| 28–38s | validation 面板与地图预览 | “导出前会检查尺寸、Tile 引用、路径、许可和包结构，而不只是生成一张图片。” | `Validation checks the asset contract—not just the picture.` |
| 38–49s | 下载 ZIP 并快速展开目录 | “ZIP 的真源是 PNG 和 JSON，并携带 manifest、逐文件 hash、生成记录与 CC0 许可。” | `The portable ZIP contains PNG, JSON, hashes, provenance, and a CC0 license.` |
| 49–58s | 强调素材 ZIP 无 `.gd`，切到官方 importer | “素材包不带可执行脚本；Godot importer 从官方仓库单独安装。” | `Asset packs are executable-free. Install the importer separately from the official source.` |
| 58–69s | Godot 选择 manifest，展示生成场景 | “在 Godot 4.3+ 选择 manifest，就会生成 TileSet、TileMapLayer 场景和道具。” | `Select the manifest to derive a TileSet, TileMapLayer scene, and props in Godot 4.3+.` |
| 69–75s | GitHub、itch.io、反馈 issue 三个真实链接 | “alpha 免费开源。下载示例包，并把可复现问题发到 GitHub。” | `The alpha is free and open source. Try the pack and report reproducible issues.` |

若录制时 itch.io、release 或 Demo 尚未公开，最后画面只显示已经有效的仓库 URL；发布链接公开后再补录最后 6 秒，不要展示占位 URL。

## 5. 发布后 issue 与反馈计划

### 5.1 发布当天创建的反馈 issue

标题：

```text
[Feedback] v0.1.0-alpha.1 — first import experience / 首次导入体验
```

Issue body：

```markdown
Thanks for trying Mapsoo Worldsmith v0.1.0-alpha.1. This issue collects first-import feedback for the exact public release: [REPLACE: RELEASE_URL].

请不要只写“不能用”。复制下列模板，并删除不适用项：

- OS and version / 操作系统：
- Godot version（完整版本号）：
- Pack filename and SHA-256：
- New or existing Godot project / 新项目或现有项目：
- Steps to reproduce / 复现步骤：
  1.
  2.
  3.
- Expected / 预期：
- Actual result and exact error / 实际结果与完整错误：
- World Spec and seed（可公开时附上）：
- Screenshot or minimal reproduction：
- Approximate minutes from download to first imported scene：

Please remove private paths, credentials, paid API keys, and private STOYO content before posting.
```

将它 pin 在仓库 issue 列表或从 README/release/itch 页面统一链接，不在多个平台建立互不相通的重复反馈池。

### 5.2 响应节奏

| 时间 | 动作 | 公开证据 |
| --- | --- | --- |
| Day 0 | 发布 release、itch 页面、视频和反馈 issue；自己用未缓存的新 Godot 项目走一遍 | 真实 URL、最终附件、公开 CI |
| Day 1–3 | 每天检查一次；对可复现报告确认版本和 seed；把支持问题与代码 bug 分开 | maintainer 回复、label、复现评论 |
| Day 7 | 发布一篇 devlog：下载量、已知问题、已修复项，不美化零反馈 | itch devlog / GitHub issue update |
| Day 14 | 汇总首轮数据；修复最高优先级可复现 bug，必要时发 `alpha.2` | closed issue、PR、changelog、release |
| Day 30 | 决定继续 alpha、进入 beta，或调整范围；更新路线图 | milestone / roadmap commit |

建议维护承诺写成“通常在 72 小时内确认新报告，业余维护可能更久”，不要承诺无法长期兑现的 24/7 SLA。

### 5.3 需要收集而不能制造的指标

- GitHub release downloads，按附件分别记录；
- itch.io page views 与 downloads；
- GitHub stars、forks、watchers；
- 外部 issue 数、独立报告者数、已复现/已修复数；
- Godot 版本和操作系统分布；
- 从下载到首个成功导入场景的分钟数；
- 外部用户公开评论或经许可引用的简短评价；
- PR、文档修正或第三方示例等贡献。

零下载、零 issue 或负面反馈也必须如实记录。自己的下载、机器人访问、同一人的重复报告和 STOYO 内部测试不得包装成外部采用。

## 6. Codex for OSS 申请证据包

OpenAI 当前说明：活跃开源项目的 primary/core maintainer 可以申请；评审会关注使用情况、生态价值和持续维护证据。表单目前要求公开 GitHub profile/repository，并提供 role、qualifying reason，以及在申请 API credits 时说明用途；核心长文本字段上限为 500 字符。项目支持包括 6 个月 ChatGPT Pro（含 Codex）、按条件提供的 Codex Security，以及适用项目的 API credits，但都属于申请和评审结果，不能写成已获批。参考：[Codex for Open Source 项目页](https://developers.openai.com/community/codex-for-oss) 与 [当前申请表](https://openai.com/form/codex-for-oss/)。

### 6.1 官方表单字段清单

```text
[ ] First name
[ ] Last name
[ ] Email — 必须是 ChatGPT 账号邮箱
[ ] GitHub username — profile visibility 已设为 public
[ ] GitHub repository URL — repository 已设为 public
[ ] Role — Primary maintainer 或 Core maintainer
[ ] Why does this repository qualify? — 最多 500 字符
[ ] Interested in Codex Security（按真实需求选择）
[ ] Interested in API credits（有具体 OSS 自动化计划时选择）
[ ] OpenAI Organization ID（选择 API credits 时准备好）
[ ] How will you use API credits? — 最多 500 字符
[ ] Anything else we should know? — 最多 500 字符
```

本项目角色建议选择 `Primary maintainer`，前提是申请人确实负责路线、release、issue 和合并决策，而不只是仓库 owner。

### 6.2 申请前证据台账

| 证据 | 当前状态 | 可提交的权威 URL/数据 |
| --- | --- | --- |
| Public repository | 已存在公开仓库；需确认新版代码已在默认分支 | `[REPLACE: REPO_URL_AT_MAIN_COMMIT]` |
| 源码与资产许可边界 | 当前工作树已完成 | `LICENSE`、release ZIP 内 `license-assets.md` 的公开链接 |
| 可复现构建与测试 | 本地已完成；公开证据待 CI | `[REPLACE: CI_URL]` |
| Godot 4.3/4.7 兼容 | 本地已验证；公开证据待 CI/release | `[REPLACE: GODOT_CI_URL]` |
| GitHub alpha release | 未发布 | `[REPLACE: RELEASE_URL]` |
| 在线 Demo | 未部署/未证实 | `[REPLACE: DEMO_URL]` |
| itch.io 免费包 | 未发布 | `[REPLACE: ITCH_URL]` |
| 演示视频 | 未发布 | `[REPLACE: VIDEO_URL]` |
| 外部反馈与维护响应 | 尚未收集 | `[REPLACE: ISSUE_URLS]` |
| downloads / stars / forks | 尚未形成有效发布指标 | `[REPLACE: DATE + EXACT COUNTS + SOURCE URLs]` |
| STOYO 使用 | 计划中的首个真实消费者 | 只有真正接入后才附公开且不泄密的案例；否则明确写 planned |

推荐申请门槛：release、公开 CI、itch 页面、Demo/视频至少三者完成，并且有至少一轮真实外部反馈与维护响应。star 不是唯一标准，但不能用愿景替代活跃维护证据。

### 6.3 申请文案——替换证据后直接使用

以下三段已控制在 500 个英文字符以内；替换占位符后仍需重新计数。未得到真实 URL 和数量前不要提交。

**Why does this repository qualify?（417 characters before replacement）**

```text
Mapsoo Worldsmith is an active public, local-first project that turns a versioned World Spec into deterministic, validated 2D asset packs for Godot. It keeps portable PNG/JSON as source of truth, records license/provenance, and imports into TileSet/TileMapLayer through a separately installed plugin. Public evidence: [RELEASE_URL], [DEMO_URL], [ITCH_URL], Godot 4.3/4.7 CI [CI_URL], and [N] external feedback issues.
```

如果申请时仍没有外部反馈，把最后一段改成真实已有的 release/download 证据，绝不能填写虚构的 `[N]`。

**How will you use API credits for your project?（342 characters）**

```text
API credits would support maintainer automation for schema and manifest compatibility checks, PR fixture review, release/changelog validation, issue reproduction summaries, and security-focused review of the Godot importer. User-generated assets remain local by default; no private STOYO data, credentials, or paid provider keys will be sent.
```

只有确实准备实施这些开源维护自动化时才勾选 API credits。未来的商业图像生成额度不是这段文案的主理由。

**Anything else we should know?（337 characters）**

```text
I am the primary maintainer. STOYO is the planned first real consumer, not claimed as external adoption. Before submitting, I will replace every placeholder with public release, demo, itch.io, CI, and issue links. Mapsoo remains usable without an account, backend, or paid API and is designed as reusable OSS rather than STOYO-only code.
```

正式提交时删掉第二句里的流程性表述，改成已经成立的事实，例如：

```text
I am the primary maintainer responsible for roadmap, releases, issue triage, and compatibility. STOYO is [planned / now used as] the first real consumer; it is not counted as external adoption. Mapsoo remains usable without an account, backend, or paid API and is designed as reusable OSS rather than STOYO-only code. Public maintenance evidence is linked above.
```

方括号二选一必须按申请当日事实填写。若仍是 planned，只保留 `planned`。

### 6.4 推荐勾选策略

- `Primary maintainer`：建议勾选，前提是申请人与实际维护职责一致；
- `Codex Security`：可以表达兴趣，因为 importer 解析外部 asset pack、release 存在供应链边界；是否获得访问由 OpenAI 个案评审；
- `API credits`：仅当准备实施上文的 PR/manifest/release/issue 自动化时勾选并填写 Organization ID；
- 不用两个旧网站仓库凑数量；以 Mapsoo Worldsmith 一个有 release、兼容性测试、真实用户反馈的核心仓库申请；
- 不把“使用 Codex 开发过”本身当生态价值。价值来自开放格式、Godot 工作流、安全边界和持续维护。

## 7. 最终 Go / No-Go 清单

```text
代码与验证
[ ] alpha 已合入 public main
[ ] public CI 的 Node、Godot 4.3、Godot 4.7 全绿
[ ] 精确 release 附件完成真实浏览器 ZIP -> Godot 验收
[ ] secret scan、绝对路径与 ZIP 可执行文件检查通过

GitHub
[ ] tag/release 版本一致，标记为 pre-release
[ ] 三个必需附件齐全且 SHA-256 一致
[ ] 中英文 release notes 无占位符、无未上线 Demo 声称
[ ] feedback issue 已创建并可访问

itch.io
[ ] Draft 页面先完成全量预览
[ ] Graphical Assets、免费、无 OS platform 误选
[ ] CC0-1.0 与 ZIP 内许可一致
[ ] AI Disclosure 按最终上传内容逐项填写
[ ] 1 张 315:250 封面比例图 + 5 张真实截图
[ ] 实际 pack 直接上传 itch.io
[ ] 页面不存在 [REPLACE: ...]

社区与申请
[ ] 75 秒视频只展示真实功能和有效 URL
[ ] 至少一轮外部反馈得到公开响应
[ ] downloads/stars/issues 记录带日期和来源，不做推算
[ ] Codex for OSS 每个证据 URL 可匿名访问
[ ] 三段申请文本替换后仍不超过 500 字符
```

只有清单全部满足，才把“本地可运行 alpha”升级为“已有公开 release、itch.io 页面和社区证据的开源项目”。
