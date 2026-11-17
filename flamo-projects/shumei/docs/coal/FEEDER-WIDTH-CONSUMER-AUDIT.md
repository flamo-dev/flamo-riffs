# Width 消费链核查（2026-10-10，实施前计划）

输入：codex_20261010084043_d0d525838fbe。Chrome 外部证据：原实例371:315已加载、停止图存在、coalInput已消失；props receipt 12/13/14成功但宽度未变化。因此之前的source通过不是width执行证明。

职责：surface保持四参数、boolean/default false；definition负责实例props到设备状态；installed bindNumber负责范围/比例/订阅/width提交；Runtime负责live measurement/command commit/HUG约束；Preview负责编辑投影。按用户确认，宿主getEditableComponentPropertyKind无figma.id时仅number放行，boolean返回null，属于Preview控件投影缺陷，不在本工程绕过。

计划：
1. 核验本地receipt/API hash、definition挂载/instance of/roleBindings和installed helper源码、编译模块。命名capability/matching为用户本轮MCP确认，不伪称本地旧receipt含该字段。
2. 不猜测尚未捕获的线上断点。不替换helper；在现有项目设备模块增加feeder专用、只读的props/reference诊断及真实setter提交/下一帧probe记录，区分“等待runtime layout”“提交”“readback匹配”。不写x/y/父width/scene。
3. 更新旧source测试的HUG/根reference及失效业务断言；使用实际installed bindNumber，而非stub helper；补用项目Runtime bundle导出的真实reactivity检查props→ref→helper链。测试handle/layout仍为contract double，不是renderer。
4. Typecheck/compile/graph/contract；核对scene、surface、图片、原实例及库/Runtime完全不变。交给Chrome采集新trace，未取得真实trace前不宣称线上width或native MAX修复。

模块放置：不新增业务模块。`src/components/coal/device.ts`现有项目组件层增加feeder诊断，依赖公开ctx和installed bindNumber；库的applied trace只说明setter已返回，不报告props没被消费、layout等待和commit readback，故补项目证据，不改官方库。

## 结果与下一次 Chrome 的断点表

本轮没有找到可被真实 Runtime 证据确认的“位置不动”源码根因，**不宣称 width 修复完成**。现有 `bindNumber(ctx, readValue, {range,size})` 签名正确；源码与编译副本均使用根 contentBox。实装 helper 遇到 null/design layout 会无日志直接返回，Runtime layout subscription 是否在真实实例送达尚未获证；这是候选断点而非根因结论。bus 接管后 props watcher 被有意忽略也是另一个需 trace 判别的候选，未擅改已有业务所有权。

检查链：nodeArtifacts[209:639].scripts → coal-209-639/register.js 的 mountCompiledNodeScript → register.definition.js 的 setup(props,ctx) → mountDevice/fromProps → 实例内 feederPositions ref → installed bindNumber → scoped root layout → assertLayoutWritable → 实际 target.setWidth。

新增 trace（仅 feeder 分支；不更改宿主、Runtime 或官方 helper）：
- `coal.feeder.binding-installed`：两个已解析物理 bar/root ID；缺失时先查 script graph/mount 或 layout-blocked，不能判定 HUG。
- `coal.feeder.props`：从四属性派生的 state、controlledByBus。面板回执并不证明这里已收到更新。
- `coal.feeder.reference`：真实 layout/null、source、owner、contentBox；waiting-runtime-layout 表示 helper 未进入 setter。
- `coal.feeder.width-submit`：实际调用 setter 之前；接着库 `binding.number.applied` 表明 setter 已返回，仍不是 commit。
- `coal.feeder.width-readback`：下一帧重新 resolve/probe 的实际 size.x；matched 只比较 width，不证明 HUG/MAX、图标或 GIF 正确。readback-error/未匹配须继续定位，禁止写坐标补偿。

若 props 未送达：component script instance props/lifecycle subsystem；若 layout 一直 design/null：Runtime measurement/observeLayout subsystem；若 setter 返回而 probe 不变：Runtime size command/commit；只有 width probe 已正确但 HUG/MAX 未跟随，才归到 Runtime layout/constraints。现在不能从外部截图选定这些分支。

宿主 boolean 最小复现（用户提供的 main.js 定位，不冒充本地执行）：保留本组件 script-only `gmjRun1:{type:'boolean',default:false}`，不提供 figma.id；Preview 调用 getEditableComponentPropertyKind 返回 null（number 分支放行），显示 Property type unsupported。所属 Server Preview property-editor projection。修复应该扩展真实 boolean 编辑投影，而非修改工程 schema/造 binding。

## 检查与边界

旧 source.test 的 HUG/input 假设已修正；原生字段省略情况按 Artifact 原样断言，不伪造 FIXED/MIN 字段。实装 helper + 本项目 Runtime bundle 的真实 reactive/ref/watch 测试通过；几何/ctx handle 是 doubles，因此不构成 Runtime command/renderer 测试。覆盖 0/26.5/53、invalid 保留、双 run、根 resize、双实例/disposal/remount，以及 design→runtime layout gate；不模拟 MAX 求解来宣称正确。

检查中误运行旧 `scripts/coal-contracts.py`（它不是只读测试）。已恢复输入 revision、feeder 的两个 root roleBindings，并修正 feeder 合约为真实 visible/width 写集合，删除旧 fillOpacity/祖先显隐声明。它对 Artifact/bindings 做了 JSON 重序列化；这些文件列入 changedFiles，不能声称字节未变。未写 scene/layout/constraints/assets 或四参数，未改变其它业务源码。后续只运行 `tests/coal/contracts.test.py`。本轮不把完整 Artifact 的原始 hash 一致列为通过项。

真实浏览器/verifyInteractionTrace 尚未执行；完整组件打包因未配置 Studio link 只能生成说明。当前输入 revision 为 codex_20261010084043_d0d525838fbe，新 resultRevision 等待服务器提升回执，不能自行命名。
