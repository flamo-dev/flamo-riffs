# 叶轮给煤机四项回归：设计与实施计划（2026-10-10）

历史原始 revision：artifact-rev-1791617965665-9qxvxb。本轮实际输入 revision：codex_20261010081834_fb03d2899cbe。以用户最后补充为准，撤销旧 NATIVE-FOLLOW-PAINT / FEEDER-MOUNT-FIX 中反比宽度、固定 extent、手动坐标建议。

## 职责及范围
- 既有项目组件层 `src/components/coal/device.ts` 的 feeder 分支与 `device-209-639.ts`：当前 mounted 子树角色解析、两组静/动态图显隐、内部 bus 状态、数值投影。复用 installed `@flamo/interaction-library/base` bindNumber（1.0.0）及公开 Runtime；不新增通用模块，不修改其它设备分支。
- `nodeArtifacts[209:639].surface.parameters`：只保留 gmjPosition1/2 number（0..53）及 gmjRun1/2 boolean（默认 false）。位置无有效输入时保留设计宽度；invalid/out-of-range 保留最后有效值。删除本组件 coalInput，不删除其它组件的同名属性。同步已有 components 投影；exports 如为 surfaceRef 则保持引用。
- Server Preview：从真实 surface 投影可编辑控件；不是脚本职责。不以伪 binding/number/string 代替 boolean。工程 `.flamo/preview/main.js` 不包含报告中的 `Property type unsupported` 编辑器实现；不能在未读宿主源码、未真实复现情况下断定其精确内部原因。

## 2026-10-10 08:33 修订设计与实施计划（取代此前 HUG 阻塞判断）
- HUG 中间框是合法设计，撤回要求固定轨道或同步全轨道的结论。独立 measurement 必须来自当前 mounted 叶轮组件根（209:639 的具体实例），不是 334:306/334:317 或进度条。
- 复用现有项目组件模块及 installed bindNumber，不新增模块；依赖公开 ctx.mounted / ctx.node / observeLayout / assertLayoutWritable。唯一尺寸写入是 bars1/2.width = mountedRoot.contentBox.width * position / 53，root padding 由 contentBox 保留。
- 删除项目 feeder 的 HUG_REF 拒绝路径；库对真正 content-owned reference 的安全检查保留。目标进度条必须 input-owned，绝不修改父尺寸、坐标或布局。
- 公共属性仍是四个既有参数；两 boolean 默认 false、互补显隐、coalInput 移除成果保持。Preview 控件投影归宿主，不伪造 binding。
- 实施顺序：修正 root reference 与合同/投影说明；源测试用 Fixed 根 + 真实 HUG 中间层；校验 receipt/API、scene 不变、四参数及编译模块图。真实 Preview / MAX 布局和 GIF 生命周期只接受浏览器 readback，不用 mock 代替。
- Artifact 核对：根 282×101、两框 HUG、第一 HORIZONTAL/MAX 及 horizontalConstraint MAX、两进度条自由布局与给定位置/尺寸一致。两叶轮 GROUP 在 Artifact 为 FRAME；225:1085 组本身缺显式 horizontalConstraint MAX，但内部运行/停止图片 225:1086/225:1087 均为 MAX；应区分组与图片，不能宣称约束全部丢失或 native follow 已执行。保留这些事实，不补坐标、不改 scene；是否影响 native follow 待 Chrome 实测。

## Runtime 依据
runtime-contract schemaVersion=3，buildReceipt=1efd458171aff5d6a38bc44a0cd41b7ca3ce8dc2dc87e8dd489fca29f1162760。bundle、声明及全部 10 个 manifest 的 SHA256 与 receipt 完全匹配，protection-manifest 的 bundle hash 同样匹配。声明公开 observeLayout/assertLayoutWritable/setWidth/setVisible。项目快照未发现 `component-script-capabilities-v1` 命名能力证明；不能把 API 匹配夸大为此能力认证。未获工程同步 endpoint，不修改框架/配置/部署。运行环境兼容性仍需授权 bootstrap/宿主核验。

## 实施顺序与验收
1. 参数/default/consumer 与 source/export 投影清理；静态状态以 run===true / run!==true 互补，尺寸无效不隐藏其图片祖先。
2. 移除固定 extent 和反比公式；复用 bindNumber，独立 live mounted root、content box、无坐标写入。保留图片内容及 Runtime 自有图片动画生命周期，不制造定时旋转或替换图片。
3. Source/typecheck/compile/local graph，检查 scene/test实例完全不变；记录真实测试与 source mock 的区别。
4. 宿主后续验证 371:315：0/26.5/53、右端固定、四组布尔组合、invalid、resize、临时双实例、remount/disposal。本容器无已连接 Preview 会话且禁止启动常驻 server；不声称视觉通过。

测试模块 `tests/coal/feeder-regression.test.mjs` 属项目验证层，依赖既有 source loader、真实组件 TypeScript 和 installed bindNumber；使用明确标记的 mock context 验证算法/状态隔离，不能代替 Runtime/Preview。已有 source.test.mjs 包含旧固定 extent/反比断言，不把那些历史预期作为新行为标准。

## 实施结果与证据边界
- 已删除本组件公开 coalInput 及其优先消费路径；其它设备 coalInput 保持。四属性与现有 scripts/roleBindings 保持真实关联。两 boolean 默认 false；两个 position 不添加猜测默认，未知/非法输入保留原设计或最后有效宽度。
- 显隐按每台独立 run===true 互补；位置无效不再隐藏整个进度条祖先。保留原始静/动图片资产；动画解码/隐藏及重新显示后的播放生命周期尚未真实验证。
- 位置消费改为 installed bindNumber 的 [0,53]、mounted root live content box，仅 width；项目中错误的 HUG 拒绝逻辑已删除，HUG 中间层不是设计同步阻塞。没有改 x/y、AutoLayout、padding、图标坐标。
- tsc、compile、本地 generated graph、151 scripts/165 bindings 合同检查通过。本轮 source mock 使用 Fixed 根 + HUG 中间层，通过默认停止、四组布尔、0/26.5/53、非法保留、contentBox padding、resize、bus、双实例、dispose/remount；订阅 ID 必须是当前 mounted root。旧 source.test.mjs 在第46行要求当前轨道 owner=input 而失败：实际为 content，不能算全套源回归通过。
- build-component 仅生成 dist/README.md，缺 Studio 链接，未产出完整包。未运行真实 Preview/Chrome/verifyInteractionTrace；371:315 的右端固定、图片像素/动画、父布局 resize、真实双实例与 remount 均未验收。
- 工程内脚本 contracts 生成器仍包含历史宽度/显隐合约及旧 revision 写入，本次未运行它，以免覆盖用户场景。当前 feeder 合约已单独修正；后续若重生成需先迁移旧生成器。

### boolean Preview 最小复现（待宿主执行，不是本轮已复现）
1. 同步本轮工程后选 test 371:314 的既有 371:315；确认 source surface 仅四参数，gmjRun1/2 type=boolean/default=false，脚本直接读取这两个值，无 dummy bindings。
2. 打开 Server Preview 属性面板，记录是否仍显示 Current — / Property type unsupported。若仍出现，记录投影后的参数 kind、default/current value、editable/reason 与脚本 consumer 索引，以及 Runtime receipt/build ID。
3. 分别通过真实组件 instance.setProps 设置四组 false/false、true/false、false/true、true/true。若 Runtime 显隐切换正常而面板仍只读，即可将问题定位为 Server Preview 从 script-only boolean surface 到编辑控件的投影，而非 boolean schema/脚本消费。
当前证据只能证明原 schema 已是 boolean、原默认缺失及工程内无该编辑器实现；缺默认可解释未初始化 Current，不能据此断言 unsupported 的精确宿主内部原因。

本轮 machine-readable 结果、完整 changedFiles 与生成文件名单：`.flamo/reports/feeder-root-reference-repair.json`。输入 revision 保持；resultRevision=null，等待本轮结束后服务器编译/提升回执，不能将 input 或自造值作为结果 revision。

## 本轮对历史结论的更正
上一轮历史报告中“设计同步阻塞 / HUG 拒绝 / track owner=input”均已撤销，不是当前验收前提。之前错误在于业务测量对象选择，而非 HUG 本身。最终检查结果见 `.flamo/reports/feeder-root-reference-repair.json`。

## 本轮开发/Chrome 交接
- 源码：`physical().entity` 取得当前 mounted boundary；bindNumber 订阅其 live layout，使用 contentBox，不使用设计常量。原 bindNumber 仍检查目标 input ownership，并在 dispose 时取消 watcher/observer。
- roleBindings 的 references1/2 现在都指向 source root 209:639，脚本以当前实例根消费；test 371:315 的 of/overlay 与整个 scene 不变。未新增公开参数或 consumer。
- Source mock 在 282 内容宽度下输出 0/141/282；另测独立 400、resize 500、borderBox 比 contentBox 多 8 的 padding 场景，不模拟 native MAX 的执行。
- 本地 module graph 通过，无证据将“正在加载运行场景”归因于此组件 import。完整 Runtime/Preview 未启动（本任务禁止常驻 server、无已连接宿主会话）；不能据此宣布加载问题已解决。
- Chrome：选现有 371:315，先确认 script mounted；记录 root.contentBox、两 bar、两 HUG 框及两图片组的 committed world bounds。依次设置位置 0/26.5/53，验证 width 与 root 的比例、第一右端 constant、HUG 跟随；再测试四布尔组合、invalid、resize、临时 runtime 双实例和 remount。不要把测量公式当作 readback。
- 如 HUG 尺寸已变化但第一 MAX 未保持右边缘，提交 Runtime 布局执行缺陷及 trace；若第二图标不随动，先核对当前 Artifact 缺少 MAX 的事实，不以 x 补丁掩盖。面板若仍拒绝 boolean，使用前述最小复现区分 Runtime consumer 与 Server Preview 控件投影。

## 2026-10-10 Chrome 反馈修正
见 FEEDER-WIDTH-CONSUMER-AUDIT.md：原实例的停止图及 coalInput 移除已由用户 Chrome 验证；position props 回执成功但宽度不变，之前源码测试不证明 width 已执行。boolean readonly 已由用户定位到宿主 getEditableComponentPropertyKind 的 script-only boolean 投影缺口；capability/matching 由用户本轮 MCP 确认。当前继续保留真实 boolean，不添加假 binding。
