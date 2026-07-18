# 开源成熟度与 Codex for OSS 准备

## 1. 当前判断

仓库设为 Public 只是起点。一个可信的开源项目还需要明确许可证、可运行说明、维护轨迹、issue/PR 流程、release、真实用户和可复用价值。

Mapsoo 应以一个核心仓库申请，不需要用两个刚公开的网站凑数量。申请叙事应围绕 Godot 世界资产管线、开放格式、真实 STOYO 使用和对独立开发者的价值。

当前开发分支已经达到本地 Godot-importable alpha：三种世界配方、确定性生成、Canvas 预览、严格校验、不含可执行代码的 PNG + JSON ZIP、独立可信安装的 EditorPlugin、桌面/390px 浏览器视觉验收、可校验的 itch.io 发布视觉套件，以及真实浏览器 ZIP 在 4.3/4.7 中的跨管线 smoke 均已运行；在线 Demo、公开 release、itch.io 页面和外部使用证据仍未完成。因此现在适合继续积累公开成果，不适合把 alpha 描述成成熟的跨平台一键管线。

官方项目页：<https://developers.openai.com/community/codex-for-oss>

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

- [ ] 在线 Demo；
- [ ] 60–90 秒演示视频；
- [x] Godot 示例项目与 importer smoke fixture；
- [ ] itch.io 免费示例包；
- [x] meadow、desert、snowfield 三种本地配方；
- [ ] v0.1 release 与 changelog；
- [x] 自动测试和 portable ZIP 导出契约验证；
- [x] 浏览器视觉验收；
- [x] 本地 itch.io 封面与五张 release 证据图；
- [x] Godot 4.3/4.7 headless 导入验证。

### 维护证据

- [ ] 连续、清晰的提交；
- [ ] 使用 issue 管理公开路线；
- [ ] 至少一轮外部用户反馈；
- [ ] 对 issue 的响应记录；
- [ ] 外部 star/fork/download 或实际使用说明；
- [ ] 明确 maintainer 身份与贡献边界。

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
- 由 STOYO 的持续世界生成需求提供真实、大规模使用场景。

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
