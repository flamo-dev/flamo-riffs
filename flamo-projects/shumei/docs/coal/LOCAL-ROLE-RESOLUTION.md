# 34 个依赖的局部角色解析与诊断（2026-10-09）

> 历史记录：给煤机122/142行程及三通空appearance还原结论已被真实Chrome否定。当前规则与验收以 [NATIVE-FOLLOW-PAINT.md](NATIVE-FOLLOW-PAINT.md) 为准；本文件不作为随动/像素通过证据。

## 范围和放置
责任：煤系统设备自己的角色解析、受保护写入和 committed probe 回执；层：项目组件行为；路径：`src/components/coal/device.ts`。直接依赖现有 model 和公开 NodeScriptContext/Mounted API。不增加 Runtime 能力或模块，不修改 scene、slots、points、设备配置及宿主。原 physical() 仅匹配 definition sourceNodeId，不能覆盖源 ID 与 authored 局部 ID 不同的公共映射。

## 已确认事实与未确认原因
宿主上轮真实观察：14 motor、crusher/screen 切换有效；26 plough、6 tee、2 feeder 找不到配置 refs。当前 Artifact 中失败实例均无自己携带的 `children`；使用 `of`/`symbolID` 引用定义，feeder 存在 guidPath overrides。不能据此臆造新 authored ID 或按名称匹配。尚未取得失败实例实际 mounted 子树，因此最终 Runtime 映射缺口尚未确定。

## 修改
1. 保留浏览器已证实的 motor physical sourceNodeId/semanticRef/id 唯一匹配。
2. 仅当零匹配时尝试 `ctx.mounted.resolve(ref)` 与 `ctx.mounted.resolve(ctx.node(ref))`。结果必须唯一且存在于当前设备根的 mounted 后代集合，拒绝定义、兄弟实例、根节点和多义映射。每次更新/下一帧重新解析，不缓存跨重挂实体。
3. 子树遍历有 1024 实体上限、去重和截断标志，截断不允许写角色。单个角色失败保留 errors，但继续其他角色和两条 feeder 几何，避免第一张图片失败遮蔽所有后续证据。
4. feeder 保留局部 `ctx.setNode(ref,'TransformCpt.size.x',width)` 的公开布局约束；0..53 对应第一条 122→0，第二条 0→142；未知两条隐藏且清零。没有把计算值作为实测。
5. 保留 bus 控制优先、实例销毁、陈旧帧抑制、报警 # 别名和完整快照清除。

## 公开证据读取
调用 `applyPointValues` 后等待下一帧，再读 `getCoalState().devices[].receipt`：
- `visual.nodes[]` 仍含 root/各角色/bar 的 `expected`、`sourceProbe`、实际目标 `probe`（size.x、visible）与 targetNodeId。
- 失败仍是 `visual.status='failed'` 且 errors 非空；新增 `visual.diagnostics.subtree`：limit、truncated、nodes（id/sourceNodeId/semanticRef/instanceRootId/revision/name/parent）。
- `visual.diagnostics.mappings[]`：每个配置 ref 的 ctx.node、resolveRef、resolveNode 结果；异常以 error 明示。失败也返回全部角色项，不把 missing 当通过。
- sourceProbe 是语义读回，不替代实际 mounted probe；observed 不是截图 Visual gate。
- 公共方法/47 slots（含 Robot）保持原合同；新增内容仅为现有 receipt.visual 诊断值。

## 检查和交接
源 mock 模拟 authored/source IDs 不同、nested instance、定义 decoy、两实例与两代挂载；覆盖 run/stop/unknown、feeder 端点、丢失角色不阻断 bars、域外 resolver 拒绝和清理。18,673 断言通过。此为公共契约模拟，**未运行本轮真实 Runtime/browser**。若新包仍有失败，请返回其 diagnostics，以实际映射修正角色合同；不再以理想 mock 推断已解决 34 个实例。

输入 revision：`codex_20261009042552_ff8a5677497f`。最终 promotion 由轮后服务端生成，此处不能预报。
正式导出：Studio → 一体化 → yhpComp → 166:730 → Web Component 导出 → `flamo-coal-system`。本 staging 无 `.flamo/link.json`/serverOrigin，未生成新 ZIP，不构造下载 URL；沿宿主已认证正式导出流程整体替换并核对合同后，对 run/stop/unknown 再读 probe 和截图。
