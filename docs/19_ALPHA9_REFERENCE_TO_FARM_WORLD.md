# Alpha.9 参考图到 Top-down Farm 世界包

状态：候选实现已合入 `main`；尚未创建 Alpha.9 公共 tag、尚未发布、尚无外部采用证据。

## 1. 用户结果

Alpha.9 要验证一条公开、中立、可审核的资产生产链：

> 一张环境参考图 + 一张角色参考图 + 一段公开安全的世界描述 → 一份完整、可机器校验、可导入 Godot 4 的 `topdown-farm` 世界美术资产包

“参考图”只提供作者有权使用的视觉约束，不是要求复制原图、品牌、角色或构图。输出是可继续编辑的 2D 游戏资产集合，而不是一张看起来像游戏的合成图。环境与角色必须进入同一 palette、像素密度、光照方向、轮廓和比例合同，同时保留各自独立的来源与权利记录。

本里程碑属于通用开源工作流，不是任何私有产品的导出器。当前已实现离线程序化 Provider、完整 `topdown-farm` Pack Schema 0.6.0、一键本地浏览器流程和 Godot 4.3+ 派生；这不表示模型图像 Provider、另外三个 profile、外部消费端或公共 Alpha.9 release 已经存在。

## 2. 四个公开资产 Profile 的最终目标

项目长期只使用中立、描述几何与玩法视角的 profile ID：

| Profile | 投影与最终资产目标 | Alpha.9 状态 |
| --- | --- | --- |
| `side-platformer` | 正交侧视平台、单向平台/危险区、视差平面与侧视角色动画 | 未来独立里程碑；不在 Alpha.9 实现 |
| `isometric-action` | 菱形等距地形、高度、Y-sort 道具、斜向表现与战斗可读性 | 未来独立里程碑；不在 Alpha.9 实现 |
| `topdown-farm` | 正交俯视农场地形、耕地/作物、建筑、道具、可行走数据与四方向角色动画 | Alpha.9 已实现的唯一端到端候选 |
| `layered-depth-2d` | 前景、玩法层、背景、光照与景深平面组成的分层 2D 场景 | 未来独立里程碑；不在 Alpha.9 实现 |

四个 profile 是最终产品覆盖面，不是“一个 Provider 的四种滤镜”。每个 profile 必须有独立的投影、坐标、atlas、角色朝向、遮挡/排序与 Godot 验收合同。Alpha.9 不得用一个成功的 farm 包证明其他三类视角已经支持。

## 3. Reference World Job 输入合同

当前实现使用 Generation Request V2 `1.0.0`、Pack Schema `0.6.0` 与 completeness policy `topdown-farm-complete-v1`。这些是 `main` 上通过测试的 Alpha.9 候选合同，但在公共 tag 创建前仍不是已发布稳定 API。

### 3.1 必需输入

- `profile`：Alpha.9 只接受精确值 `topdown-farm`；
- `environmentReference`：单张环境参考图的受限本地输入句柄、媒体类型、字节数、像素尺寸与解码后尺寸；
- `characterReference`：单张角色参考图的同类受限输入；
- `description`：只描述虚构世界主题、气候、情绪、材质、农场用途与角色视觉意图的短文本；
- `seed`：控制可确定后处理、地图布局、变体选择和文件排序的字符串；
- `output`：tile size、地图尺寸、locale、资产许可选择与 `godot/common` 消费意图；
- `rightsDeclaration`：分别声明两张参考图的使用权基础、是否允许生成衍生资产、是否允许公开分发输出，以及是否需要人工复核。

### 3.2 受限可选输入

- 公共 palette 偏好、季节、昼夜、地表湿润度和农场密度等枚举化约束；
- 角色公开 archetype、服装轮廓、配色和动画集合；
- 允许或禁止的公开素材类别；
- Provider/工作流选择及明确的预算、超时和重试上限。

### 3.3 输入安全

- 两张图分别设置编码字节、像素、帧数、色彩通道和解码内存上限；拒绝动画、多页、损坏、超大或伪装媒体；
- 解码后立即去除 EXIF、ICC 注释、缩略图、文件名和其他非像素元数据；不把本地路径传给 Provider；
- 文本使用 UTF-8、长度、深度、节点数和控制字符上限；未知字段、重复键、危险对象键和不支持版本 fail closed；
- 环境图与角色图不得互换角色；缺少任一必需输入不得凭默认图或历史用户数据补齐；
- 原始输入、OCR 文本、人脸/身份推断、设备信息与自由文本错误正文不得进入浏览器日志、遥测、fixture、ZIP、公开 receipt 或截图。

## 4. `topdown-farm` 完整包合同

Alpha.9 的“完整”由版本化 `topdown-farm-complete-v1` completeness matrix 定义，不是人工觉得画面丰富。已实现候选包包含以下类别：

### 4.1 环境与地图

- Ground：草地、泥地、耕地及必要视觉变体；
- Water：共享 N/E/S/W 邻接合同的完整 autotile 集；
- Paths/Fences：道路或田埂的完整连接集合，以及农场边界所需 fence/gate 外观；
- Crops：至少一组作物的空地、播种、成长和成熟等有序阶段；
- Structures：至少一个可识别的农舍或农场建筑外观，并通过稳定地点 ID 关联；
- Props：树木、岩石、容器、工具或农场装饰等受限类别；
- Map：确定性的 ground/water/path/crop/structure/prop 图层、语义地点、结构引用、可行走/阻挡数据和 preview/cover。

### 4.2 角色

- 一个由角色参考图约束、但不携带真实身份的稳定角色 ID；
- `idle` 与 `walk` 两个最小动画集合；
- `north/east/south/west` 四方向，允许通过合同声明的镜像策略复用 east/west，但不得伪造缺失帧；
- 固定帧尺寸、foot point/pivot、透明背景、帧时长与 atlas region；
- 与环境一致的 palette、轮廓、像素密度和光照方向；角色不得烧录进地图或 preview 作为唯一资产。

### 4.3 Portable 文件与元数据

- 环境 tileset/atlas、透明 structures/props/crops atlas、透明 character atlas；
- 引擎中立的 map layers、places、structures、crop stages、walkability/collision intent 和 character animation sidecar；
- World Spec/Reference World Job 的公开安全投影、manifest、generation receipt、license/assets disclosure、README、preview/cover；
- 每个资产的稳定 ID、类型、尺寸、alpha/pivot、atlas region、来源类别、生成/后处理版本、字节大小与 SHA-256；
- manifest 中的 completeness matrix 明确列出本 profile 的必需类别、预期计数/枚举和实际引用，不能靠 README 补充缺失事实。

文件名与 sidecar 版本以实现合同为准。portable PNG + JSON 是跨引擎真源；Godot `.tres/.tscn` 由独立 importer 派生，不进入素材真源定义。

## 5. 生成与标准化流程

1. **本地摄取**：分别校验环境图与角色图的真实 PNG/JPEG 签名、字节数、像素尺寸、摘要、运行时绑定和明确权利声明，并限制描述长度。当前不执行人脸识别、OCR、商标识别或其他内容级净化。
2. **隐私投影**：公开 receipt 不保留原图字节、本地路径、文件名、原始参考摘要、自由文本或 attribution 文本；World ID 与 seed 必须由用户填写公开安全值，ID 会进入 ZIP 文件名、manifest 与 README，receipt 会投影 profile、seed、角色、owned 权利、许可、CC0 dedication 与不可逆的完整请求 fingerprint。
3. **候选生成**：当前离线程序化 Provider 使用 seed、描述和参考摘要派生 palette/视觉变体，再按 `topdown-farm-complete-v1` 返回分类资产；它不进行模型级图像理解，也不允许只返回一张整图。
4. **标准化**：执行切图、透明背景、nearest-neighbor 缩放、palette 约束、tile 对齐、pivot/foot point、atlas packing、autotile masks 和动画帧整理。
5. **地图解析**：使用受信 seed 算法建立图层、地点、建筑、作物、道具和可行走数据；不得从参考图中的私人位置或人物关系推断玩法语义。
6. **完整性校验**：在导出前执行 schema、语义、像素、引用、权限/provenance 和 profile completeness 门禁；任何 error 阻止下载。
7. **便携导出与 Godot 派生**：只从通过门禁的同一冻结 generation result 构建 ZIP；Godot importer 再从该 ZIP 派生引擎资源。

若 Provider 不声明 deterministic capability，不承诺再次调用模型可产生相同像素；但同一次被接受的冻结结果、所有确定性后处理、地图解析、atlas packing 与 ZIP 序列化必须可重建并逐字节复核。receipt 必须如实区分模型生成、人工选择和确定性转换，不能用 seed 暗示不存在的模型级可重复性。

## 6. 机器完整性门禁

Alpha.9 发布前，验证器必须从文件本身证明以下事实，不能依赖截图、人工说明或文件名猜测：

### Schema 与引用

- job、World Spec、manifest、receipt 及所有 sidecar 通过对应严格 schema/runtime validator；
- 每个 manifest 引用存在且只出现一次；ZIP 不含未声明文件、重复 entry、路径穿越、绝对路径、符号链接或可执行内容；
- 每个稳定 ID 唯一且路径安全；atlas/animation/map/place/structure/crop 引用全部可达，无悬空或循环所有权；
- 文件大小、媒体类型、像素尺寸和 SHA-256 与 manifest 完全一致。

### Profile 完整性

- manifest 精确声明 `topdown-farm`，并绑定受信 profile/completeness 算法版本；
- Ground/Water/Paths-Fences/Crops/Structures/Props/Map/Character 八类必需集合逐类满足受限最小计数；
- Water、道路/田埂与 fence 连接 mask 无缺口或重复；作物阶段连续、有序且 atlas region 唯一；
- 四方向 `idle/walk` 动画可解析，帧数、帧时长、pivot、透明度和镜像声明一致；
- 地图每层尺寸一致，tile/prop/crop/structure ID 在声明范围内，地点与结构关联唯一，所有实体坐标在界内；
- walkability/阻挡数据覆盖每个地图格，并与水面、建筑 footprint 和显式阻挡物语义一致。

### 像素与视觉约束

- 每个 PNG 可安全解码，使用允许色彩模式；tile/帧尺寸整除 atlas，region 不越界、不重叠；
- 透明素材存在真实 alpha，边缘无被误当透明的底色块；缩放使用最近邻且像素网格一致；
- 环境和角色满足同一 style contract 的 palette/像素密度/光照方向容差；自动检查结果与真实浏览器桌面、390px 视觉检查共同留证；
- preview 必须由导出层和角色 atlas 合成，不能是一张与 pack 无关的 Provider 图片。

### Provenance、权利与失败边界

- receipt 绑定净化后的公开 job 投影、Provider/模型/工作流标识、参数、后处理、输入权利类别、人工选择状态和输出许可；
- AI 生成资产不得自动继承程序化基线的 CC0 声明；权利不明、禁止衍生或禁止公开分发时 fail closed；
- validator 对篡改 profile、缺失类别、伪造摘要、非法 region、错误 pivot、缺帧、悬空引用、额外文件和被污染元数据均有负向 fixture；
- 超时、取消、部分 Provider 响应或任一步校验失败时不得保留可下载的“半个完整包”。

## 7. Godot 4 验收

Alpha.9 只有在以下 Godot 证据全部成立后才可进入候选发布：

- 使用公开、可安装的 importer addon 归档，从全新项目完成校验、安装、启用和导入；不声称已上架 Godot Asset Library；
- Linux/Windows × Godot 4.3/4.7 对同一个真实浏览器 exact pack 执行 headless matrix；
- importer 生成正确的 `TileSetAtlasSource`、分层 `TileMapLayer`、透明 prop/crop/structure sprites，以及包含四方向 `idle/walk` 的 `AnimatedSprite2D` 预览节点；
- nearest texture filter、tile size、atlas region、pivot/foot point、frame duration、Y-sort/z-index 和地图坐标与 portable sidecar 一致；
- smoke scene 能实例化完整地图和角色，验证图层/资产计数、引用、可行走/阻挡数据及角色动画切换；这不是玩家控制器、寻路或完整玩法；
- `created → unchanged` 可复现；输入更新遵守 `updated/conflict` 所有权边界，手改受管输出不被静默覆盖，pack 目录外文件不被写入；
- importer 复核 completeness matrix、digest 和跨 sidecar 语义，而不是只接受“JSON 能解析”；
- 已发布 Alpha.1–Alpha.8 的 fixture、hash、tag、合同和 exact-pack 回归保持不可变。

## 8. 隐私、内容安全与权利边界

### 隐私最小化

- 参考图必须在本地完成结构、预算、摘要、绑定和权利验证；原图默认不进入导出包、示例、截图、测试夹具或公开日志。当前没有内容级自动净化能力；
- 不执行或保存人脸识别、人物姓名推断、年龄精确推断、地理定位、OCR 身份提取或用户画像；
- 不接收儿童姓名、照片、声音、学校、家庭关系、账户/设备 ID、学习记录、对话或精确位置作为资产合同字段；
- 若输入包含人物、私人环境、文字或商标，当前候选依赖用户先在本地裁剪/清理并确认权利；系统不声称自动识别这些内容。不能把敏感内容藏在 seed、slug、文件名、prompt、metadata、receipt 或 digest ledger 中；
- 私有原图的原始 SHA-256 默认只留在本地私有审计记录；公开 receipt 使用不可反推出原图的 run-local reference ID 与公开安全投影摘要。

### 权利与再分发

- 当前 Alpha.9 exporter 只接受用户拥有的环境图与角色图，并要求分别明确确认使用权、衍生权、输出再分发权和将生成输出 dedicated under CC0-1.0 的权利；“能上传”不等于“可以开源发布”；
- 当前离线程序化 Provider 披露 `contains_generative_ai: false`；未来模型 Provider 必须披露模型/工作流和适用条款，不能继承该声明；
- `licensed` 参考图（包括 CC-BY/CC-BY-SA）在 Alpha.9 中 fail closed，不会被静默重新许可为 CC0。生成 PNG/runtime JSON 在满足显式 dedication 条件后使用 CC0-1.0；源码与文档使用 MIT；参考原图不进入包并保留原权利；
- 不接受要求复刻受保护角色、商标、logo、界面、具体作品构图或在世艺术家个人风格的描述；检测到可识别文字/标记时阻止公开导出并要求清理；
- 第三方素材与模型输出使用独立资产许可和 attribution/disclosure；MIT 源码许可不覆盖生成资产；
- 只有来源清楚且允许再分发的安全示例才能进入仓库和 release。真实用户输入永不成为默认 fixture。

## 9. 明确不做

Alpha.9 不包含：

- 另外三个 profile 的端到端生成或兼容承诺；
- 完整农场玩法、种植经济、背包、任务、NPC、战斗、存档、玩家控制器或寻路；
- 3D、骨骼动画、语音、实体制造或打印履约；
- 账户、云图库、训练数据收集、用户画像或私人消费端映射；
- 对任意输入图都能生成、对所有模型输出可商用或达到特定美术质量的保证；
- 自动上传 itch.io、Godot Asset Library 或其他第三方平台；
- 任何外部团队已经接入、生产采用、真实儿童使用或社区使用量声明；
- 改写 Alpha.1–Alpha.8 已发布 artifact，或把候选字段伪装成稳定 API。

## 10. 发布门禁与停止条件

### 发布门禁

- 公开 PR 明确列出 job/schema/profile/completeness/receipt 版本和兼容决策；
- TypeScript、schema、Provider、图像净化、完整性、ZIP、浏览器与负向套件全部通过；
- 至少一个许可清楚、完全虚构且不含私人数据的固定 top-down farm 候选 job 生成真实浏览器 ZIP；
- 两次重建同一冻结 run 的后处理、地图、atlas、manifest 和 ZIP 逐字节一致；若 Provider 非确定，候选像素必须作为被审核的冻结输入而非重新调用模型；
- 桌面/390px 预览与 atlas 视觉检查通过；Linux/Windows × Godot 4.3/4.7 exact-pack matrix 通过；
- 安全/依赖审计、release attachment 清单、远端 digest 和已发布历史不可变检查通过；
- README、路线图和 release notes 只描述门禁证明的能力，并保留 AI/provenance/许可、隐私和未采用声明。

### 停止条件

出现以下任一情况，不得创建 Alpha.9 公共 tag：

1. 只能输出概念图，不能得到八类必需资产、sidecar、完整性矩阵和 Godot 可用地图；
2. 环境与角色不能统一为同一 style contract，或四方向角色动画、farm autotile/crop stages 有缺口；
3. 验证器不能从 portable 文件独立证明完整性，仍需人工猜测文件含义；
4. 原始参考图、私人元数据、身份信息、自由文本或本地路径会进入公开 artifact/log/fixture；
5. 参考图权利、Provider 条款、输出许可或 AI disclosure 任一不清楚；
6. 同一冻结 generation result 不能复现，或失败会留下可误认成完整包的部分输出；
7. Godot exact-pack matrix、首次导入、安全重导入或历史回归任一失败；
8. 实现必须修改 Alpha.1–Alpha.8 已发布字节、合同、fixture、tag 或摘要；
9. 文档或演示需要声称另外三个 profile 已实现、第三方平台已上架、外部采用或私人消费端已接入才能成立。

停止后应把失败固化为最小、公开安全的负向 fixture 或 issue；在证据补齐前保持候选状态。
