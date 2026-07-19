# Mapsoo Worldsmith：GitHub Alpha、itch.io 与 Codex for OSS 发布执行包

更新日期：2026-07-19

当前已发布版本：`v0.1.0-alpha.2`

已发布且不可变的历史版本：`v0.1.0-alpha.1`、`v0.1.0-alpha.2`

目标仓库：`babyrush0101-source/mapsoo-kids`

> 本文同时记录已完成的公开证据和仍待执行的 itch.io / Codex for OSS 模板。2026-07-19 维护者决定暂缓 itch.io 页面：GitHub Release/Pages 是当前主渠道，已验证的 itch 上传套件继续保留，但页面不是 alpha.2 或申请准备的必需前置。只有带权威 URL 的项目才算完成；模板中的 `[REPLACE: ...]` 仍必须在正式提交或公开页面粘贴前替换，不能把不存在的外部反馈写成已完成。

## 0A. alpha.2 发布执行状态（2026-07-19）

alpha.2 没有覆盖或重建已经公开的 alpha.1。它使用独立的版本注册项、fixture、receipt verifier、发布说明和 itch 素材目录；发布后生命周期已固化为 `published`，11 个公开附件的 GitHub SHA-256 均已固定，构建器会拒绝原位重建这两个历史版本。

### 当前已经由本地门禁证明

- 默认网页导出已切换到 `v0.1.0-alpha.2`，但旧 alpha.1 exporter 与公开 fixture 仍保留；
- 真实浏览器导出的 Sunny Meadow ZIP 恰好包含 12 个文件、一个根目录且没有隐式目录项；manifest 恰好记录 11 个 payload；
- 固定的纯 JavaScript PNG 编码器消除原生 Canvas PNG 压缩差异；CI 门禁会运行当前真实浏览器 exporter，并把原始 ZIP 字节与注册 fixture 比较；
- 同一个 trusted generation run 连续导出两次得到完全相同的 ZIP 字节；真实浏览器 ZIP 与规范 release ZIP 一致；
- 公开包 SHA-256 固定为 `8c7720a8578cdc276ff69677ed0d64d8a1524d32fd00da0ffb8035b5a52bfcb6`；
- receipt `0.2.0` 随包附带 schema，并绑定 World Spec 原始字节、provider 执行方式、workflow、转换、AI 披露、来源和许可；
- alpha.2 发布提交的 `pnpm check` 已通过 100 个测试、31 个跨 alpha.1/alpha.2 receipt 篡改拒绝案例、历史公开哈希复核、六张发布图验证和生产构建；
- `pnpm release:local` 已从两个隔离的 Vite 构建生成并复核 11 个 GitHub Release 附件，且逐字节一致；alpha.2 附带 receipt schema，不冒充或复用 alpha.1 的 75 秒视频；
- `pnpm release:history:remote` 已通过 GitHub API 复核公开 alpha.1/alpha.2 的附件列表与远端 SHA-256；CI 使用只读仓库 token，匿名本地运行仍可用；
- `pnpm release:itch` 已生成 11 文件的操作员上传目录，资产 ZIP 可重复、CRC/路径/文件数/许可/AI 披露均受验证，并通过 24 个负向篡改案例；
- alpha.2 的封面为真实 1260×1000 PNG，五张截图为真实 1600×900 PNG；验证器逐张确认尺寸、最小体积、本地来源且不复用 alpha.1 成品字节。

### 已完成的公开发布证据

- [PR #23](https://github.com/babyrush0101-source/mapsoo-kids/pull/23) 与 [PR #24](https://github.com/babyrush0101-source/mapsoo-kids/pull/24) 已审查并合入 `main`，发布 tag 精确指向 commit `072a7b8`；
- 发布前 [main CI](https://github.com/babyrush0101-source/mapsoo-kids/actions/runs/29673989390) 与 [Pages](https://github.com/babyrush0101-source/mapsoo-kids/actions/runs/29673989415) 全绿；
- [tag release workflow](https://github.com/babyrush0101-source/mapsoo-kids/actions/runs/29674040991) 从 tag 重建并验证 11 个附件；[Godot 4.3](https://github.com/babyrush0101-source/mapsoo-kids/actions/runs/29674040991/job/88158028238) 与 [Godot 4.7](https://github.com/babyrush0101-source/mapsoo-kids/actions/runs/29674040991/job/88158028241) 都导入同一个固定哈希包；
- [`v0.1.0-alpha.2` GitHub prerelease](https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.2) 已公开，11 个远端附件的 digest、大小与 `SHA256SUMS` 经逐项复核一致。

### 仍需外部采用证据，当前不得提前宣称完成

- `[延期/可选]` itch.io 页面暂不创建；`release/itch/v0.1.0-alpha.2/` 的精确文件与验证门禁继续保留，未来恢复时仍须先创建 Draft 并逐张预览；
- `[延期/可选]` 若未来恢复，只有 GitHub prerelease URL 有效且 itch Draft 复核完成后，才把 itch 页面设为 Public；
- `[ ]` 收集真实下载、issue 或外部用户反馈并公开响应；不得把维护者自测、机器人访问或 STOYO 计划写成外部采用；
- `[ ]` 最后按申请当天的官方表单重新核对字段、500 字符限制、公开 GitHub profile、ChatGPT 邮箱和 OpenAI Organization ID，再提交 Codex for OSS。

alpha.2 的宣传图统一使用“CI-gated”措辞，不把静态图片当执行证明。权威执行证据是上述 tag release workflow 的真实 job URL；权威下载源是公开 prerelease，静态宣传图本身不代表测试结果。

## 0. 当前事实边界

### 已完成并可公开验证

- Mapsoo Worldsmith 的本地优先 World Spec 编辑、确定性程序化生成、Canvas 预览、校验与可移植 ZIP 导出；
- meadow、desert、snowfield 三种本地配方；
- 素材 ZIP 使用 PNG + JSON 作为真源，包含 manifest、SHA-256、生成记录和 CC0-1.0 素材许可，不携带 GDScript 或 addon；
- 独立安装的 MIT Godot importer，可派生 `TileSet`、`TileMapLayer` scene 和 props；
- 本地测试、浏览器视觉验收，以及 Godot 4.3/4.7 导入验证；
- 真实 Sunny Meadow 浏览器导出 fixture，以及包含 11 个文件、带 SHA-256 和字节级可重复性校验的本地 release bundle；
- 本地 1260×1000 封面、五张 1600×900 证据图和已验证的 75 秒中英双语 H.264 证据视频；
- README、路线图、贡献指南、安全政策、issue/PR 模板与 MIT 源码许可。
- alpha 已在公开 `main` 合并，tag 指向 merge commit `f36ef4d29020b3f7ceaf87d314ca1d80c0e44500`；后续 release 套件与输入安全加固已通过 [PR #14](https://github.com/babyrush0101-source/mapsoo-kids/pull/14) 和 [PR #15](https://github.com/babyrush0101-source/mapsoo-kids/pull/15) 公开合入；
- [产品提交 `08c5af6` 的 main GitHub Actions](https://github.com/babyrush0101-source/mapsoo-kids/actions/runs/29652421223) 中，`check`、Godot 4.3 和 Godot 4.7 jobs 全绿；此固定证据链接不随纯文档提交滚动；
- [GitHub Pages Demo](https://babyrush0101-source.github.io/mapsoo-kids/) 可匿名访问；
- [`v0.1.0-alpha.1` GitHub pre-release](https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.1) 已公开，11 个版本化附件和证据视频可下载；
- [`v0.1.0-alpha.2` GitHub pre-release](https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.2) 已公开，11 个版本化附件与 receipt 0.2 合同可下载；
- [统一反馈 issue](https://github.com/babyrush0101-source/mapsoo-kids/issues/12) 已公开。

### 尚未形成公开证据

- `[ ]` itch.io 免费 Graphical Assets 页面；
- `[ ]` 外部用户 issue、评价、下载量、star、fork 或采用案例。

因此，本文后半部分的 Codex for OSS 文案是“收集完公开证据后提交”的模板。STOYO 是计划中的首个真实使用方，不得提前写成已有生产采用或外部用户。

## 1. 发布顺序与停止条件

按以下顺序执行，不跳过验证门槛：

1. 将 alpha 分支通过 PR 合入 `main`，确认公开提交中不含旧凭据、私有 STOYO 内容或本机绝对路径；
2. 在仓库 `Settings → Pages` 把 Source 设为 `GitHub Actions`；不要选择 branch/folder 发布源；
3. 在合入后的准确 commit 上运行 `pnpm install --frozen-lockfile` 和 `pnpm check`；
4. 等待公开 GitHub Actions 的 Node、Godot 4.3/4.7 与 Pages jobs 全绿，并记录真实 Demo URL；
5. 从同一 commit 生成并复核发布附件、SHA-256、截图和演示视频；
6. 创建并人工复核 GitHub draft release，随后发布 GitHub pre-release，取得真实 `[RELEASE_URL]`；
7. 发布演示视频并创建反馈 issue；
8. 至少收集一轮真实外部反馈并公开响应，再准备 Codex for OSS 申请；
9. itch.io 已延期；若未来恢复，再创建 Draft，用 `Save & view page` 检查标题、许可、AI 披露、截图和下载文件，并在补齐 release、仓库和 issue 链接后才切换为 Public。

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
| `mapsoo-worldsmith-web-v0.1.0-alpha.1.zip`、两份 schema、World Spec、release manifest、LICENSE、CHANGELOG | 推荐保留 | 最初由候选阶段的 `pnpm release:local` 自动生成；版本公开后禁止用当前源码重建同一 tag，只能下载并按 registry 中的 GitHub digest 复核 |
| `mapsoo-worldsmith-v0.1.0-alpha.1-75s.mp4` | 推荐保留 | 已验证的 75 秒无音轨 H.264 中英双语证据视频；发布前不得把候选包证据描述成公开使用量 |
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
- manifest、manifest 所列 payload 文件的 SHA-256、generation receipt 与 CC0-1.0 素材许可；
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
- 在线 Demo：<https://babyrush0101-source.github.io/mapsoo-kids/>

问题与反馈：<https://github.com/babyrush0101-source/mapsoo-kids/issues/12>

## English

This is the first public pre-release of Mapsoo Worldsmith. It turns a versioned World Spec into a deterministic, validated 2D pixel-world asset pack for Godot 4.3+.

### Included

- Offline meadow, desert, and snowfield recipes;
- deterministic map output for the same World Spec and seed;
- an in-browser preview and pre-export validation;
- an executable-free PNG + JSON asset ZIP;
- a manifest, per-payload-file SHA-256 records, generation receipt, and CC0-1.0 asset license;
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
- Mapsoo Worldsmith generator demo: <https://babyrush0101-source.github.io/mapsoo-kids/>

Issues and feedback: <https://github.com/babyrush0101-source/mapsoo-kids/issues/12>
```

### 2.4 发布前验证记录

将以下结果复制到 draft release 的内部检查单，不要凭记忆勾选：

```text
[x] tag 指向已合入 main 的 commit: f36ef4d29020b3f7ceaf87d314ca1d80c0e44500
[x] public CI URL: https://github.com/babyrush0101-source/mapsoo-kids/actions/runs/29649158764
[x] pnpm check: passed 2026-07-18T15:01Z at https://github.com/babyrush0101-source/mapsoo-kids/actions/runs/29649158764/job/88092390534
[x] Godot 4.3 smoke: passed at https://github.com/babyrush0101-source/mapsoo-kids/actions/runs/29649158764/job/88092390515
[x] Godot 4.7 smoke: passed at https://github.com/babyrush0101-source/mapsoo-kids/actions/runs/29649158764/job/88092390497
[x] browser ZIP -> Godot 4.3/4.7: passed for exact attached pack
[x] asset ZIP contains no .gd, .uid, addons/, .godot/ or absolute paths
[x] manifest version, ZIP name, tag and importer version agree
[x] SHA256SUMS recomputed from final upload bytes
[x] release notes contain no [REPLACE: ...] placeholder
```

## 3. 历史 `v0.1.0-alpha.1` itch.io 页面模板（仅存档）

> 本节保留 alpha.1 当时的页面文案、release URL 与披露记录，只用于审计历史，不能复制到 alpha.2。已发布 alpha.2 对应的唯一 itch 上传源是 [`docs/itch-kit/v0.1.0-alpha.2/`](itch-kit/v0.1.0-alpha.2/)；页面仍延期，未来恢复时应从已验证操作员目录重新复核，不能把 GitHub 发布误写成 itch 已上线。

itch.io 官方建议封面保持 315:250 比例，推荐至少使用 630×500，并上传 3–5 张截图；Graphical Assets 不应虚假勾选 Windows/macOS/Linux 平台。素材页必须准确填写生成式 AI 披露。参考：[Your first itch.io page](https://itch.io/docs/creators/getting-started) 与 [Content creator quality guidelines](https://itch.io/docs/creators/quality-guidelines)。

### 3.1 页面字段

| 字段 | 填写值 |
| --- | --- |
| Title | `Mapsoo Sunny Meadow — Free Pixel World Pack for Godot` |
| URL slug | `mapsoo-sunny-meadow`，若占用则 `mapsoo-sunny-meadow-godot` |
| Classification | `Assets` |
| Kind of project / Upload type | `Downloadable` / `Graphical Assets`，采用页面当前对应字段 |
| Release status | `In development`，因为这是 alpha；稳定后再改 `Released` |
| Pricing | 选择 **`$0 or Donate`**，允许免费直接下载和自愿捐赠；不要选择 Paid。若不接受捐赠才选 `No payments` |
| Platforms | 全部不勾选；PNG 能在某系统打开不等于可执行程序支持该平台 |
| Asset license | `CC0-1.0`；正文同时链接/说明 ZIP 内 `license-assets.md` 为准 |
| Visibility | 准备阶段 `Draft`；所有文件、图片、许可和 AI 披露复核后改 `Public` |
| Community | 开启 comments，正文仍以 GitHub issue 为可复现 bug 的主入口 |
| Repository | `https://github.com/babyrush0101-source/mapsoo-kids` |
| Release | `https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.1` |
| Demo | `https://babyrush0101-source.github.io/mapsoo-kids/` |

### 3.2 短描述

英文推荐值：

```text
Free CC0 pixel-art tiles, props, map JSON, and an import workflow tested on Godot 4.3 and 4.7.
```

中文备用值：

```text
由 Mapsoo Worldsmith 本地生成的免费 CC0 像素地形、道具和地图 JSON；导入流程已在 Godot 4.3 与 4.7 验证。
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
CC0
```

如果当前界面没有某个建议标签，删除它，不为了凑满 10 个建立近义词。`Graphical Assets` 已通过分类表达，不再把 `graphical` 当推广标签。

### 3.4 AI Disclosure——当前 alpha 的保守填写法

itch.io 的生成式 AI 披露询问项目是否包含生成式 AI 的结果；选择 Yes 后可细分 Graphics、Sound、Text & Dialog、Code。官方同时明确：不依赖外部大型数据集的自包含算法和程序化关卡生成，本身不需要当作生成式 AI 图像标记。参考：[itch.io AI disclosure announcement](https://itch.io/t/4309690/generative-ai-disclosure-tagging) 与 [quality guidelines 的 AI disclosure 段落](https://itch.io/docs/creators/quality-guidelines#ai-disclosure)。

当前项目已使用 Codex 协助代码和文档。虽然 itch 素材 ZIP 不携带可执行脚本，最保守且可审计的披露仍覆盖项目代码与随包 schema/说明，避免把“程序化像素图不是模型生成”误写成“整个项目完全没有生成式 AI”：

- `Generative AI disclosure`：**Yes**；
- `Text & Dialog`：**勾选**，因为项目页和随包说明文本使用了 Codex 辅助；
- `Code`：**勾选**，因为 Codex 参与项目代码，随包也含 schema；同时明确 ZIP 不含可执行脚本；
- `Graphics`：**不勾选**，当前 PNG 来自确定性、自包含的程序化绘制，不是图像模型输出；
- `Sound`：**不勾选**，当前包不含声音。

若发布前人工从头重写所有页面与随包文本，仍需按最终工件逐项复核；不能仅为了取得 `No AI` 标签而忽略实际生成式 AI 内容。未来加入图像模型输出时，必须把 disclosure 改为 Yes + Graphics，并同步更新 manifest 的 provenance。

在长描述中追加这段透明说明：

```text
AI & procedural-generation disclosure: the distributed pixel artwork is produced by deterministic, self-contained procedural code, not by an image-generation model. Codex assisted project code and documentation, so this page discloses Text & Dialog and Code. The asset ZIP contains no executable scripts, and no AI-generated graphics or sound are included.
```

### 3.5 长描述——可直接粘贴

```markdown
## A tiny world pack with an open contract

Mapsoo Sunny Meadow is a free alpha asset pack generated locally by **Mapsoo Worldsmith**, an open-source pipeline for turning a versioned World Spec into deterministic, validated 2D game assets.

This download is a versioned, verified example pack, not a promise that every possible generated world is production-ready. It is designed to make the complete path inspectable: World Spec → PNG/JSON pack → validation → Godot import.

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

1. Download and extract the asset ZIP.
2. Install the Mapsoo Pack Importer only from the official repository or release: https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.1.
3. Enable the importer in a Godot 4.3 or Godot 4.7 project.
4. Select the extracted pack's `mapsoo.manifest.json`.
5. Open the generated scene under `res://mapsoo_imports/<pack-id>/`.

The asset ZIP intentionally contains no GDScript or addon. A hash inside the pack proves file consistency, not publisher identity, so do not enable scripts copied from third-party asset packs.

## License

The procedural PNG atlases, preview, and generated map assets are released under **CC0-1.0**. You may use, modify, and redistribute those assets, including commercially; `license-assets.md` inside the ZIP is authoritative for that scope. Bundled schemas and documentation use the repository's MIT License, as do Mapsoo Worldsmith source code and the separately distributed importer.

## Compatibility and limits

- tested importer target: Godot 4.3 and 4.7;
- orthogonal, top-down pixel-art world;
- one biome per generated alpha world;
- importer works from an extracted pack;
- alpha format: breaking changes remain possible before v1.0.

## AI and procedural-generation disclosure

The distributed pixel artwork is produced by deterministic, self-contained procedural code, not by an image-generation model. Codex assisted project code and documentation, so this page discloses Text & Dialog and Code. The asset ZIP contains no executable scripts, and no AI-generated graphics or sound are included. Its `contains_generative_ai: false` receipt describes the generated artwork/map payload, not project development history.

## Links and feedback

- Source and documentation: https://github.com/babyrush0101-source/mapsoo-kids
- GitHub alpha release: https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.1
- Mapsoo Worldsmith generator demo: https://babyrush0101-source.github.io/mapsoo-kids/
- Reproducible feedback: https://github.com/babyrush0101-source/mapsoo-kids/issues/12

When reporting an import problem, include your OS, Godot version, pack filename, World Spec seed, exact error message, and whether the issue reproduces in a new Godot project.

---

## 中文说明

Mapsoo Sunny Meadow 是 Mapsoo Worldsmith 生成的免费 alpha 像素世界示例包。程序化 PNG 与生成地图资产采用 CC0-1.0；随包 schema 和说明文档采用仓库 MIT 许可。素材 ZIP 不含 GDScript；Godot importer 只从官方仓库或 release 单独安装。当前图像由确定性、自包含的程序化代码绘制，不是图像模型输出；Codex 参与项目代码和文档辅助，因此 itch.io 披露 Text & Dialog 与 Code。
```

发布前必须删除所有 `[REPLACE: ...]` 行或换成真实公开 URL。特别是在线 Demo 未上线时，直接删除 Demo 行，不能用“coming soon”冒充可用入口。

### 3.6 itch.io 上传文件清单

| 顺序 | 文件 | 页面显示名 | 备注 |
| --- | --- | --- | --- |
| 1 | `mapsoo-sunny-meadow-v0.1.0-alpha.1.zip` | `Sunny Meadow asset pack — v0.1.0-alpha.1` | 必需；文件类型选 `Graphical Assets`，直接上传 itch.io |
| 2 | `SHA256SUMS` | `SHA-256 checksums` | 可选；若上传，类型选 Documentation/Other，不标成 Graphical Assets |

不要在此 Graphical Assets 页面上传 Godot importer ZIP，也不要把 Windows/Linux/macOS 当下载平台。用户通过正文中的官方 GitHub release 取得 importer。desert/snowfield 只有在验证和截图都完成后才能追加；追加版本应更新同一个页面，不要为了“重新进入最新发布”复制近似页面。

当前仓库可直接生成经校验的 operator 目录：

```bash
pnpm release:itch
```

输出位于 `release/itch/v0.1.0-alpha.1/`。`uploads/` 只允许包含 Sunny Meadow 素材 ZIP 与只覆盖该 ZIP 的 itch 专用 `SHA256SUMS`；`page/` 是人工映射到 itch.io 字段/富文本编辑器的 operator 输入，不能作为附件上传；`media/` 和 `itch-upload-manifest.json` 分别提供 1+5 张图片和最终字节记录。校验器会拒绝 importer、脚本、OS platform、非零最低价格、错误许可、未披露的 Codex 文本/代码辅助、错误图片尺寸、本机绝对路径和 `[REPLACE: ...]`。

### 3.7 封面和截图制作规范

封面：

- `1260×1000 PNG`，严格保持官方 315:250 比例；也可使用官方建议的 `630×500`；
- 主体占画面 70% 左右，展示一张完整的 Sunny Meadow 地图局部；
- 左上只放 `MAPSOO SUNNY MEADOW`，右下小字 `FREE • CC0 • GODOT 4.3+`；这里的 `4.3+` 表示 importer 的最低 API 目标，实际公开测试矩阵仍只声明 4.3 与 4.7；
- 像素图放大必须 nearest-neighbor，不使用模糊、光晕或虚假的概念图；
- 不写“AI asset generator”，因为当前 alpha 只完成程序化基线。

截图统一使用 `1600×900 PNG`，按以下顺序上传 5 张：

1. **最终地图 Hero**：完整世界预览，角落注明 `Actual generated pack preview`；
2. **World Spec → Preview**：工作台表单与地图并排，能看到 biome、seed、tile size 和 validation；
3. **Pack contents**：terrain atlas、props atlas、map preview 和 ZIP 目录，不出现本机绝对路径；
4. **Godot import evidence**：来自最终附件的真实 Godot 4.3/4.7 CLI 导入结果；获得同一附件的真实编辑器截图后可以替换，但不得伪造编辑器界面；
5. **Open contract**：PNG + JSON + manifest + CC0 + separate trusted importer 的简洁流程图。

截图只展示这个 release 实际具备的界面和输出。在线 Demo 未发布时，不放 URL 或“Play now”按钮；Godot 证据必须来自最终附件的真实导入结果。

当前本地 itch.io 上传组已经完成，并由 `pnpm release:visuals:verify` 校验 PNG 签名、尺寸、最小文件体积、渲染器帧和关键事实。渲染器及来源说明见 [`release-visuals/README.md`](release-visuals/README.md)：

- [`cover-1260x1000.png`](media/v0.1.0-alpha.1/itch/cover-1260x1000.png)；
- [`01-generated-pack-1600x900.png`](media/v0.1.0-alpha.1/itch/01-generated-pack-1600x900.png)；
- [`02-workbench-1600x900.png`](media/v0.1.0-alpha.1/itch/02-workbench-1600x900.png)；
- [`03-pack-contents-1600x900.png`](media/v0.1.0-alpha.1/itch/03-pack-contents-1600x900.png)；
- [`04-godot-verification-1600x900.png`](media/v0.1.0-alpha.1/itch/04-godot-verification-1600x900.png)；
- [`05-open-contract-1600x900.png`](media/v0.1.0-alpha.1/itch/05-open-contract-1600x900.png)。

其中 Godot 图如实展示同一 Sunny Meadow 附件的 4.3/4.7 CLI 验证结果，不冒充尚未截取的编辑器 UI。两张 [`hero-1585x892.png`](media/v0.1.0-alpha.1/hero-1585x892.png) 与 [`workbench-1585x892.png`](media/v0.1.0-alpha.1/workbench-1585x892.png) 继续保留为浏览器验收原图。

## 4. 历史 `v0.1.0-alpha.1` 75 秒证据视频（仅存档）

> alpha.2 不重命名、不复用这段视频，也不把它作为 alpha.2 通过证明；alpha.2 证据以版本化 PNG、固定哈希公开包和 tag release workflow job 为准。

本地 evidence cut 已完成：[`mapsoo-worldsmith-v0.1.0-alpha.1-75s.mp4`](media/v0.1.0-alpha.1/video/mapsoo-worldsmith-v0.1.0-alpha.1-75s.mp4)。它由 [`video/`](../video/) 下的 Remotion 工程可复现生成，并通过媒体解析器与 FFprobe 验证为 `1920×1080`、30 fps、2250 帧、75 秒、H.264/yuv420p、无音轨；SHA-256 见 [`video/SHA256SUMS`](media/v0.1.0-alpha.1/video/SHA256SUMS)。

目标：一镜一结论，只使用已验证的本地工作台、候选包、可复现 hash 和 Godot CLI 证据，不依赖尚未上线的在线 Demo。双语字幕不小于 42 px；像素预览保持清晰。当前版本是发布候选证据，不冒充完整操作录屏或公开采用证明。

| 时间 | 画面 | 中文旁白 | 英文字幕 |
| --- | --- | --- | --- |
| 0–6s | 标题 + 最终地图快速切入 | “这是 Mapsoo Worldsmith：把一个世界设定变成 Godot 可用素材包的开源工具。” | `Mapsoo Worldsmith turns a World Spec into a Godot-ready asset pack.` |
| 6–17s | 真实工作台截图缓慢推进，展示 biome、seed、尺寸和 validation | “选择 biome、地图尺寸和 seed。当前 alpha 完全本地运行，不需要账号、后端或 API key。” | `Choose a biome, size, and seed. The alpha runs locally with no account or API key.` |
| 17–28s | 同一 spec/seed 的 Run A 与 Run B，展示相同候选 ZIP SHA-256 | “在 v0.1.0-alpha.1 中，相同 spec 与 seed 会重现相同结果。” | `In v0.1.0-alpha.1, the same spec and seed reproduce the same result.` |
| 28–38s | validation 面板与地图预览 | “导出前会检查尺寸、Tile 引用、路径、许可和包结构，而不只是生成一张图片。” | `Validation checks the asset contract—not just the picture.` |
| 38–49s | 下载 ZIP 并快速展开目录 | “ZIP 的真源是 PNG 和 JSON，并携带 manifest、逐文件 hash、生成记录与 CC0 许可。” | `The portable ZIP contains PNG, JSON, hashes, provenance, and a CC0 license.` |
| 49–58s | 强调素材 ZIP 无 `.gd`，切到官方 importer | “素材包不带可执行脚本；Godot importer 从官方仓库单独安装。” | `Asset packs are executable-free. Install the importer separately from the official source.` |
| 58–69s | 同一候选包的 Godot 4.3/4.7 CLI 成功结果，不模拟编辑器 UI | “同一候选包已在 Godot 4.3 和 4.7 中完成真实 CLI 导入验证。” | `The same candidate pack passed real CLI imports in Godot 4.3 and 4.7.` |
| 69–75s | 封面与当前真实公开 GitHub 仓库 URL | “alpha 免费开源。请试用并报告可复现问题。” | `The alpha is free and open source. Try it and report reproducible issues.` |

当前最后画面只显示已经有效的公开仓库 URL。release、Pages、itch.io 或反馈 issue 公开并完成匿名访问检查后，才可以补录最后 6 秒；不得展示占位 URL。完整操作录屏仍可在公开发布后追加，但不能替换此视频已经覆盖的候选包 hash、素材包边界和 Godot CLI 证据。

## 5. 发布后 issue 与反馈计划

### 5.1 发布当天创建的反馈 issue

标题：

```text
[Feedback] v0.1.0-alpha.1 — first import experience / 首次导入体验
```

Issue body：

```markdown
Thanks for trying Mapsoo Worldsmith v0.1.0-alpha.1. This issue collects first-import feedback for the exact public release: https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.1.

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

OpenAI 当前说明：活跃开源项目的 primary/core maintainer 可以申请；评审会关注 meaningful usage、broad adoption、生态重要性，以及 PR review、issue triage、release management 等持续维护证据。表单目前要求公开 GitHub profile/repository，并提供 role、qualifying reason、OpenAI Organization ID 和 API credits 用途；三个长文本字段上限均为 500 字符。项目支持包括 6 个月 ChatGPT Pro（含 Codex）、按条件提供的 Codex Security，以及适用项目的 API credits，但都属于申请和评审结果，不能写成已获批。参考：[Codex for Open Source 项目页](https://developers.openai.com/community/codex-for-oss) 与 [当前申请表和评审说明](https://openai.com/form/codex-for-oss/)（2026-07-19 核对）。

提交前同时阅读 [Program Terms](https://developers.openai.com/codex/codex-for-oss-terms)：必须使用有效 ChatGPT 账号并准确说明身份、仓库和维护职责；提交不保证入选，OpenAI 可要求验证仓库控制权。不要提交机密 STOYO 信息，不要为多个身份重复申请，也不要将 Codex Security/API credits 用于没有授权的仓库或系统。福利不可转让，具体范围和期限以书面获批结果为准。

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
[ ] OpenAI Organization ID — 当前表单标记为必填，提交前从 Platform 账号复制并人工复核
[ ] How will you use API credits? — 当前表单标记为必填，最多 500 字符
[ ] Anything else we should know? — 最多 500 字符
```

本项目角色建议选择 `Primary maintainer`，前提是申请人确实负责路线、release、issue 和合并决策，而不只是仓库 owner。

### 6.2 申请前证据台账

| 证据 | 当前状态 | 可提交的权威 URL/数据 |
| --- | --- | --- |
| Public GitHub profile | 已匿名访问验证；申请表使用 `babyrush0101-source` | [GitHub profile](https://github.com/babyrush0101-source) |
| Public repository | Provider、runner evidence、STOYO 请求契约与 alpha.2 release architecture 已在默认分支 | [alpha.2 release commit `072a7b8`](https://github.com/babyrush0101-source/mapsoo-kids/tree/072a7b8188dabc56a2f01e9554de7194a3ce1878) |
| 源码与资产许可边界 | 已公开 | [`LICENSE`](https://github.com/babyrush0101-source/mapsoo-kids/blob/main/LICENSE)、release 素材 ZIP 内 `license-assets.md` |
| 可复现构建与测试 | alpha.2 发布前 main CI 与 tag release workflow 均通过 | [main CI run](https://github.com/babyrush0101-source/mapsoo-kids/actions/runs/29673989390)、[tag release workflow](https://github.com/babyrush0101-source/mapsoo-kids/actions/runs/29674040991) |
| Godot 4.3/4.7 兼容 | alpha.2 tag workflow 对同一个公开固定哈希包完成 exact-pack 导入 | [4.3 exact-pack](https://github.com/babyrush0101-source/mapsoo-kids/actions/runs/29674040991/job/88158028238)、[4.7 exact-pack](https://github.com/babyrush0101-source/mapsoo-kids/actions/runs/29674040991/job/88158028241) |
| 公开维护活动 | Provider contract、Workbench、receipt、runner evidence、release architecture 与 alpha.2 foundation/candidate PR 已连续合并 | [PR #18](https://github.com/babyrush0101-source/mapsoo-kids/pull/18)、[PR #19](https://github.com/babyrush0101-source/mapsoo-kids/pull/19)、[PR #20](https://github.com/babyrush0101-source/mapsoo-kids/pull/20)、[PR #21](https://github.com/babyrush0101-source/mapsoo-kids/pull/21)、[PR #22](https://github.com/babyrush0101-source/mapsoo-kids/pull/22)、[PR #23](https://github.com/babyrush0101-source/mapsoo-kids/pull/23)、[PR #24](https://github.com/babyrush0101-source/mapsoo-kids/pull/24) |
| GitHub alpha release | 两个不可变 prerelease 已公开；当前版本为 alpha.2 | [`v0.1.0-alpha.2`](https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.2) |
| 在线 Demo | 已部署并匿名访问验证 | [GitHub Pages](https://babyrush0101-source.github.io/mapsoo-kids/) |
| itch.io 免费包 | 未发布 | `[REPLACE: ITCH_URL]` |
| 演示视频 | 已作为版本化 release asset 公开 | [75 秒 H.264 MP4](https://github.com/babyrush0101-source/mapsoo-kids/releases/download/v0.1.0-alpha.1/mapsoo-worldsmith-v0.1.0-alpha.1-75s.mp4) |
| 外部反馈与维护响应 | 统一入口已创建；截至 2026-07-19 仍无评论或外部反馈 | [feedback issue #12](https://github.com/babyrush0101-source/mapsoo-kids/issues/12) |
| downloads / stars / forks | 2026-07-19：0 stars，0 forks；附件下载包含维护者发布审计且下载者身份不可见，因此计数不能证明外部采用 | [alpha.2 release](https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.2)、[repository](https://github.com/babyrush0101-source/mapsoo-kids) |
| STOYO 使用 | 计划中的首个真实消费者 | 只有真正接入后才附公开且不泄密的案例；否则明确写 planned |

推荐申请门槛：release、公开 CI、itch 页面、Demo/视频至少三者完成，并且有至少一轮真实外部反馈与维护响应。star 不是唯一标准，但不能用愿景替代活跃维护证据。

### 6.3 当前可用申请文案

以下三段不含虚构指标或占位 URL，并已按当前文本控制在 500 个英文字符以内。仓库、release、Demo、CI、视频与反馈入口由表单的 repository 字段和 README 统一承载；提交当天仍要重新计数并复核事实。

**Why does this repository qualify?（388 characters）**

```text
Mapsoo Worldsmith is an active public, local-first tool that turns versioned World Specs into deterministic, validated PNG/JSON world packs for Godot. The alpha includes an executable-free CC0 sample, a separate MIT importer, public CI on Godot 4.3/4.7, a live demo, release, and reproducible feedback workflow. It is designed for indie creators; STOYO is the planned first real consumer.
```

这段有意不写 stars、downloads 或外部用户数量：GitHub 虽报告每个 alpha.1 附件各 1 次下载，但无法证明下载者是外部用户，因此不能据此声称采用。申请当天只有在 GitHub/itch.io 出现可如实解释的真实指标时才加入精确值。

**How will you use API credits for your project?（342 characters）**

```text
API credits would support maintainer automation for schema and manifest compatibility checks, PR fixture review, release/changelog validation, issue reproduction summaries, and security-focused review of the Godot importer. User-generated assets remain local by default; no private STOYO data, credentials, or paid provider keys will be sent.
```

这是当前表单必填字段的具体维护用途；未来商业图像生成额度不是这段文案的主理由。

**Anything else we should know?（399 characters）**

```text
I am the primary maintainer responsible for roadmap, releases, issue triage, and compatibility. STOYO is the planned first real consumer and is not counted as external adoption. Mapsoo works without an account, backend, or paid API and is built as reusable open-source infrastructure rather than STOYO-only code. Public release, demo, CI, video, and feedback evidence are linked from the repository.
```

### 6.4 推荐勾选策略

- `Primary maintainer`：建议勾选，前提是申请人与实际维护职责一致；
- `Codex Security`：可以表达兴趣，因为 importer 解析外部 asset pack、release 存在供应链边界；是否获得访问由 OpenAI 个案评审；
- `API credits`：仅当准备实施上文的 PR/manifest/release/issue 自动化时勾选并填写 Organization ID；
- 不用两个旧网站仓库凑数量；以 Mapsoo Worldsmith 一个有 release、兼容性测试、真实用户反馈的核心仓库申请；
- 不把“使用 Codex 开发过”本身当生态价值。价值来自开放格式、Godot 工作流、安全边界和持续维护。

## 7. 最终 Go / No-Go 清单

```text
代码与验证
[x] alpha 已合入 public main
[x] public CI 的 Node、Godot 4.3、Godot 4.7 全绿
[x] 精确 release 附件完成真实浏览器 ZIP -> Godot 验收
[x] 绝对路径与 ZIP 可执行文件自动检查通过
[ ] 历史已暴露凭据如有复用，已由维护者确认轮换

GitHub
[x] tag/release 版本一致，标记为 pre-release
[x] 三个必需附件齐全且 SHA-256 一致
[x] 中英文 release notes 无占位符、无未上线 Demo 声称
[x] feedback issue 已创建并可访问

itch.io
[ ] Draft 页面先完成全量预览
[ ] Graphical Assets、免费、无 OS platform 误选
[ ] CC0-1.0 与 ZIP 内许可一致
[ ] AI Disclosure 按最终上传内容逐项填写
[x] 本地完成 1 张 315:250 封面比例图 + 5 张真实证据图
[ ] itch.io Draft 中逐张预览无裁切、压缩或文字可读性问题
[ ] 实际 pack 直接上传 itch.io
[ ] 页面不存在 [REPLACE: ...]

社区与申请
[x] 本地 75 秒证据视频只展示已验证功能和有效仓库 URL
[x] 公共页面已提供可匿名访问的视频 URL
[ ] 至少一轮外部反馈得到公开响应
[x] downloads/stars/issues 记录带日期和来源，不做推算
[ ] Codex for OSS 每个证据 URL 可匿名访问
[x] 三段申请文本无占位符且分别为 388 / 342 / 399 字符
```

只有清单全部满足，才把“本地可运行 alpha”升级为“已有公开 release、itch.io 页面和社区证据的开源项目”。
