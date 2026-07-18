# 路线图

路线图按可验证成果排序，不用日期掩盖不确定性。每一阶段都应保持主分支可运行。

## Phase 0 — Foundation

目标：把“公开网站代码”变成可信的开源工具基线。

- [x] 接入公开仓库并创建开发分支；
- [x] 建立新产品定位和总控文档；
- [x] 加入 MIT 源码许可证；
- [x] 移除工作树中的硬编码管理员凭证；
- [x] 把旧 Supabase 客户端配置外置；
- [x] 完成已知硬编码凭证的最低限度处置与用户提醒；
- [x] 清理当前工作树中的 AppleDouble `._*` 文件并加入忽略规则；
- [x] 重命名 package 与页面 metadata；
- [x] 建立 typecheck、test、build；
- [x] 确认旧 UI、账号、社区、CMS 和营销内容全部不迁移。
- [x] 删除当前工作树中的旧站源码与旧图片；
- [x] 建立全新 Worldsmith 工作台入口。

## v0.1 — Local World Pack

目标：零账号、零 API Key 完成一次可用导出。

- [x] World Spec TypeScript 类型与基础运行时校验；
- [x] 固定 seed 的 PRNG；
- [x] meadow/desert/snow 程序化配色与 Tile 定义；
- [x] 基础地图生成；
- [x] 工作台表单；
- [x] Canvas 地图预览；
- [x] 基础 validation report；
- [x] v0.1 manifest、JSON Schema 和 generation receipt；
- [x] 浏览器端 PNG + JSON portable ZIP 导出；
- [x] World Spec JSON 本地下载/严格加载闭环与浏览器验收；
- [x] 确定性生成、基础校验、稳定 Godot ID/atlas 坐标单元测试；
- [x] 版本化示例 World Spec 与 ZIP 文件清单/hash 回归测试；
- [x] Godot 4.3+ importer alpha 与 4.3/4.7 headless smoke；
- [x] 真实浏览器 ZIP → Godot 4.3/4.7 跨管线验收；
- [x] 固化真实 Sunny Meadow 浏览器导出包，并纳入可重复 release 打包；
- [x] GitHub Pages 与 tag-gated release-draft 工作流准备；
- [x] 完成可校验的 itch.io 封面与五张真实 release 证据图；
- [x] 完成只含素材 ZIP、校验和、页面输入与媒体的可复现 itch.io operator upload kit；
- [x] 完成 75 秒中英双语、无音轨的本地 release-candidate 证据视频；
- [x] `v0.1.0-alpha.1` GitHub 预发布、公开 CI 与 Pages Demo。

## v0.2 — AI-assisted Assets

目标：在不破坏本地闭环的前提下接入 AI 候选资产。

- [x] provider SDK、capabilities、注册表与执行前后验证边界；
- [x] 把 `procedural-pixel-v1` 包装为零凭据、离线 Provider，同时保持 v0.1 输出不变；
- [x] Workbench 首次生成、编辑器生成和 JSON 导入统一接入 Provider runner，并处理取消、过期结果和安全错误状态；
- [ ] 至少一个可选 provider；
- [ ] prompt 模板与风格约束；
- [ ] 去背景、切图、nearest 缩放与调色；
- [ ] 单个 Tile/prop 局部重生成；
- [ ] 成本/错误/重试 UI；
- [x] 下一版本的 `0.2.0` provider receipt 类型、JSON Schema、runtime validator 与 legacy release 语义校验；
- [x] runner-owned 原子 evidence envelope、Provider claims 校验、深冻结 world/spec snapshot 与 legacy exporter 信任边界；
- [x] 可信版本 registry、按版本选择的 release/itch 输入、receipt verifier 分派、已发布 pack 重建门禁与完整 GitHub 附件 digest 固定；
- [ ] manifest/export receipt 投影与新版本 fixture；
- [ ] 内容安全和许可提醒。

## v0.3 — Godot-native Workflow

目标：让 Godot 用户在编辑器内稳定导入和更新 Mapsoo pack。

- [x] EditorPlugin alpha；
- [x] manifest importer alpha；
- [x] TileSetAtlasSource 创建；
- [x] `TileMapLayer` 地图 scene 创建；
- [ ] 重新导入和冲突策略；
- [x] importer 基线 headless smoke test；
- [ ] Godot Asset Library 发布准备。

## v0.4 — World System

- [ ] 多 biome 与 transition；
- [ ] 地点、道路与兴趣点；
- [ ] 建筑和内部场景；
- [ ] 角色 sprite/动画合同；
- [ ] 世界版本和增量更新；
- [ ] STOYO World Spec 扩展字段。

## v0.5 — Community Beta

- [ ] 3–5 个高质量示例包；
- [ ] 贡献指南、issue/PR 模板；
- [ ] 文档站或完整示例页；
- [ ] 外部试玩与可复现反馈；
- [ ] itch.io 免费素材页；
- [ ] beta release 与 changelog。

## v1.0 — Stable

- [ ] schema 稳定性与迁移政策；
- [ ] 跨浏览器、跨平台构建；
- [ ] Godot 支持矩阵；
- [ ] 性能和文件大小预算；
- [ ] 无障碍与国际化；
- [ ] 安全、隐私和依赖审计；
- [ ] 正式文档、演示视频和 release。
