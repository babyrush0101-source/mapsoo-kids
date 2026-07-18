# 开源成熟度与 Codex for OSS 准备

## 1. 当前判断

仓库设为 Public 只是起点。一个可信的开源项目还需要明确许可证、可运行说明、维护轨迹、issue/PR 流程、release、真实用户和可复用价值。

Mapsoo 应以一个核心仓库申请，不需要用两个刚公开的网站凑数量。申请叙事应围绕 Godot 世界资产管线、开放格式、计划中的 STOYO 首个消费场景和对独立开发者的价值；在真正接入前不得把 STOYO 写成已采用。

公开 `main` 已达到 Godot-importable alpha：三种世界配方、确定性生成、Canvas 预览、严格校验、不含可执行代码的 PNG + JSON ZIP、独立可信安装的 EditorPlugin、桌面/390px 浏览器视觉验收、可校验的 itch.io 发布视觉套件，以及真实浏览器 ZIP 在 4.3/4.7 中的跨管线 smoke 均已运行。GitHub Pages Demo、公开 CI、`v0.1.0-alpha.1` pre-release 与 75 秒中英双语证据视频已经可匿名访问；itch.io 页面和真实外部使用反馈仍未完成。因此现在适合继续积累公开维护证据，不适合把 alpha 描述成成熟的跨平台一键管线。

当前公开证据：[仓库](https://github.com/babyrush0101-source/mapsoo-kids)、[Demo](https://babyrush0101-source.github.io/mapsoo-kids/)、[GitHub pre-release](https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.1)、[当前 main `544e014` 的 CI](https://github.com/babyrush0101-source/mapsoo-kids/actions/runs/29658830773)、[Provider contract PR #18](https://github.com/babyrush0101-source/mapsoo-kids/pull/18)、[Workbench PR #19](https://github.com/babyrush0101-source/mapsoo-kids/pull/19)、[receipt PR #20](https://github.com/babyrush0101-source/mapsoo-kids/pull/20)、[runner evidence PR #21](https://github.com/babyrush0101-source/mapsoo-kids/pull/21)、[release architecture PR #22](https://github.com/babyrush0101-source/mapsoo-kids/pull/22)、[alpha.2 foundation Draft PR #23](https://github.com/babyrush0101-source/mapsoo-kids/pull/23)、[alpha.2 candidate Draft PR #24](https://github.com/babyrush0101-source/mapsoo-kids/pull/24)、[candidate 当前头 `c72b79a` 的公开 CI](https://github.com/babyrush0101-source/mapsoo-kids/actions/runs/29662701524)、[反馈入口](https://github.com/babyrush0101-source/mapsoo-kids/issues/12)。

`v0.1.0-alpha.2` 截至 2026-07-19 仍是未公开候选版：本地已完成 80 个测试、真实浏览器 12 文件 fixture、固定 ZIP SHA-256、纯 JavaScript PNG 编码、receipt 0.2、31 个 receipt 篡改拒绝案例、24 个 itch 套件篡改拒绝案例、公开 alpha.1 的 11 个远端附件摘要复核、从两个隔离 Vite 构建得到的 11 附件可重复 release、11 文件 itch 操作员套件，以及全新的 1260×1000 封面和五张 1600×900 说明图。Draft PR #24 当前头 `c72b79a` 已取得公开 [check](https://github.com/babyrush0101-source/mapsoo-kids/actions/runs/29662701524/job/88127939225)、[Godot 4.3](https://github.com/babyrush0101-source/mapsoo-kids/actions/runs/29662701524/job/88128038952) 与 [Godot 4.7](https://github.com/babyrush0101-source/mapsoo-kids/actions/runs/29662701524/job/88128038947) 绿灯，三个 job 绑定同一个固定哈希包。它现在可以作为公开维护与候选兼容性证据，但不能冒充已发布版本；仍需审查、合并、tag release 再次通过矩阵，并完成 itch.io Draft 复核。宣传图继续使用“CI-gated”而非伪造编辑器或静态“passed”徽章，权威结果是上述 job URL。

截至 2026-07-19，OpenAI 官方说明允许活跃开源项目的维护者申请；评审关注 meaningful usage、broad adoption、对软件生态的明确重要性，以及 PR review、issue triage、release management 等持续维护证据。项目不完全符合典型规模时仍可申请，但必须解释生态价值。入选者可获得 6 个月 ChatGPT Pro（含 Codex）；Codex Security 与 API credits 还取决于仓库和用途评审，不能在获批前写成既得权益。

官方条款还要求使用有效 ChatGPT 账号并提供准确、完整的信息；提交不保证入选，OpenAI 可验证维护者身份和仓库控制权。不要在申请材料中提交机密 STOYO 信息，也不要把 Codex Security/API credits 用于无权管理的仓库。福利是个人、有限、不可转让的，并可能因项目或用途而异。

官方来源：[Codex for Open Source 项目页](https://developers.openai.com/community/codex-for-oss)、[当前申请表与评审说明](https://openai.com/form/codex-for-oss/)、[Program Terms](https://developers.openai.com/codex/codex-for-oss-terms)。

**资格与胜算要分开判断：** 当前仓库已经是公开且活跃的 OSS，申请人拥有管理员权限并承担路线、发布、issue 与兼容性维护，因此具备提交资格；但提交不等于通过。截至 2026-07-19，公开 API 仍显示 `0 stars / 0 forks`，11 个 alpha.1 release 附件各有 1 次下载，反馈 issue 尚无评论，且 itch.io 页面未发布。这些数据不能证明外部采用，所以当前申请的主要短板是 meaningful usage，而不是工程完整性。建议完成 itch.io 免费包并取得至少一轮真实外部反馈与公开响应后提交；若选择提前申请，也必须如实保留这些限制。

## 2. 申请前证据清单

### 仓库基础

- [x] Public repository；
- [x] 明确源码许可证；
- [x] 新产品 README 与路线图；
- [x] 锁定包管理器与 lockfile，并提供 `pnpm check` 的安装后验证路径；
- [x] CI 状态徽章；
- [x] CONTRIBUTING.md；
- [x] CODE_OF_CONDUCT.md；
- [x] SECURITY.md；
- [x] issue/PR 模板；
- [x] 依赖更新和安全策略。

### 产品证据

- [x] 在线 Demo；
- [x] 本地 75 秒 release-candidate 证据视频；
- [x] 可匿名访问的公开视频 URL；
- [x] Godot 示例项目与 importer smoke fixture；
- [ ] itch.io 免费示例包；
- [x] meadow、desert、snowfield 三种本地配方；
- [x] `v0.1.0-alpha.1` pre-release 与 changelog；
- [x] 自动测试和 portable ZIP 导出契约验证；
- [x] 严格 World Spec JSON 保存/加载与非破坏性失败处理；
- [x] 浏览器视觉验收；
- [x] 本地 itch.io 封面与五张 release 证据图；
- [x] Godot 4.3/4.7 headless 导入验证。

### 维护证据

- [x] 连续、清晰的提交；
- [x] 通过公开 PR 记录 release、证据更新和输入安全加固；
- [x] 使用 issue 管理公开反馈入口；
- [ ] 至少一轮外部用户反馈；
- [ ] 对 issue 的响应记录；
- [ ] 外部 star/fork/download 或实际使用说明；
- [x] 明确 maintainer 身份与贡献边界。

## 3. 推荐申请时机

不要仅因已经 Public 就立即提交。较强的申请节点是：

1. `v0.1.0` 已发布；
2. 在线 Demo 可访问；
3. Godot 示例导入视频可验证；
4. itch.io 有一个免费 pack；
5. 有真实 issue、下载或外部反馈；
6. README 能在两分钟内解释项目价值和运行方式。

官方说明允许重要但尚未广泛使用的项目解释自身价值，因此 star 不是唯一标准，但“刚公开、没有 release、没有社区痕迹”会明显削弱可信度。

## 4. 申请叙事草案

### Role

Primary maintainer and creator of Mapsoo Worldsmith.

### Project summary

Mapsoo Worldsmith is an open-source, local-first pipeline that turns a versioned world specification into portable, validated 2D asset packs. Its current alpha combines deterministic procedural generation, engine-neutral PNG/JSON manifests, license provenance, executable-free asset packs, and a separately installed trusted Godot importer that derives engine-native resources inside Godot instead of making the browser emit fragile editor files.

### Ecosystem value

- 降低 Godot 独立开发者和 Game Jam 团队创建一致素材的门槛；
- 提供开放、版本化的 World Spec 与 manifest；
- AI provider 可替换，离线程序化流程不被单一平台锁定；
- 把许可和生成来源纳入导出包，而不是事后补记；
- 以 STOYO 的持续世界生成需求作为计划中的首个真实消费场景；只有完成接入后才提交可公开且不泄密的采用证据。

### How Codex will be used

- 维护 schema、迁移和跨平台导出；
- 构建 Godot importer 和测试夹具；
- 自动审查 asset pack manifest 与 release；
- issue triage、文档和贡献者支持；
- 安全检查、依赖更新和 PR review；
- 维护不同生成 provider 的兼容层。

## 5. 社区边界

- 不把用户生成内容默认上传；
- 不要求贡献者提供付费 API Key；
- 内置示例必须许可清楚；
- 第三方 IP、角色和商标不得进入公共示例；
- AI provider 集成必须披露条款差异，不能笼统承诺所有输出可商用；
- 项目治理应围绕可复用工具，而不是只服务 STOYO 私有逻辑。
