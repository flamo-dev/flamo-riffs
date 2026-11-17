# 输煤组件煤流与绑点更新

输入：2026-10-21 最新 `coal-robot-cockpit/config.js` 的 points/minMaxLimit，以及本地 Artifact 中 166:730 的注释。公共输入继续为 `uiBindIds: [{id, notes, value}]`，宿主负责按 config 将平台点值计算为业务状态。组件不请求平台接口。

## 设计

- 旧落煤图片已替换为 Frame 内的煤流组件实例。按当前真实节点重建绑定，落煤条件同时控制容器显隐与内部煤流的 enabled，保持每个实例独立。
- 原 1A/1B 三通已删除，改为四个伸缩位置图形。使用 `PDTBSSZZ_1AWZ1SC/1AWZ2SH/1BWZ1SC/1BWZ2SH` 的计算结果控制显隐；仅严格 true 显示。
- 第二给煤机采用最新版 `GMJ_1BPD#...`；保持原生进度条宽度控制与两台运行状态独立。
- 2A/2B/3A/3B 的直落煤按对应皮带运行状态控制。旧注释中的 1A/1B 直落煤节点已被设计删除，不重新创建图层。
- 52 条 `LM_` 由最新版 config 的条件计算；保留三态，未知隐藏。6A/B/C/D 入仓优先级由配置中的上游犁煤器条件决定。伸缩装置条件要求相应皮带停止。

## 开发边界

修改均属于本用户工程：`src/components/coal/mapping.ts` 保存节点/业务键，`leaf.ts` 传递内部煤流目标，`device.ts` 通过公开、实例定向的 HMI 命令控制煤流。依赖现有 NodeScriptContext 与已安装的 hmi.pipe-flow；不增加引擎实现。新增伸缩显隐合同放在 `src/interactions/contracts/`，因为现有设备合同没有这个业务类型。

保留场景几何、图片、动画材质、组件定义、插槽及公共 API。删除旧孤立煤组件脚本的执行引用，保留其历史注释。通过官方 Artifact 读取工具取得语义文档，由项目编译器生成运行代码和修订。

## 验收

核对每个绑点/目标存在性、原场景与插槽不变；覆盖运行/停止/未知、全快照清理、四路伸缩、1B 给煤机、全部落煤路径、实例隔离与销毁清理。运行 TypeScript、项目 verify 与源码回归，再在本地 Preview 检查挂载、煤流状态和画面。源码模拟与真实浏览器证据分别记录。

## 结果

- 配置 SHA-256：`632e7936646b158814e4ceb8b96efac8b294c1795fa779e171f0f4bb55507498`；编译修订：`local-2d4f571377e58a2abd3a`。
- 本地 Preview 的运行、停止、未知、恢复四场景全部通过。每场景 195 个设备的提交后观测回执成功，56 个内部煤流实例均 ready 且 enabled 与输入一致，无缺失和错误；交互 trace 合同通过。
- `npm run typecheck`、项目 verify、源码回归（21861 项断言）、落煤映射检查、给煤机回归及框架架构边界检查通过。场景几何与插槽和修改前语义数据完全一致。多实例定向与销毁检查属于源码模拟证据。
- 用户同意同步宿主适配：`coal-robot-cockpit/coal-points.js` 增加四路 `PDTBSSZZ_` 的条件依赖请求和三态合取计算，移除旧 6AD 文案替换，按新配置点名计算。宿主配置/数据适配/机组隔离相关 38 项测试通过，既有计数测试同步为 282 个点。
- 浏览器证据：`.flamo/reports/evidence/latest/contract-report.json`、`interaction-trace.json`、`screenshot-after.png`；验收界面截图：`.flamo/reports/coal-update-20261021/browser-verified.png`。本任务未进行现场平台联调或 Web Component 重新导出安装。
- Studio 刷新后将文档保存为资源式 Artifact，当前修订为 `artifact-rev-1792591460752-8no6lc`，仍引用已验收的 `2d4f571377e58a2abd3a` 编译产物。使用官方 `readArtifactJson` 只读还原后复验 195 个绑定、几何和插槽均通过。测试读取资源式文档时将 `FLAMO_ARTIFACT_JSON` 指向官方读取器输出的语义导出；无需改写项目存储。测试基准已独立保存为 `tests/coal/flow-update-fixture.json`，不依赖临时备份目录。
