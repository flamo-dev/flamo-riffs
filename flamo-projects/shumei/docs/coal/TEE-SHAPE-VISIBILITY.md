# 三通原形状互斥显隐修正（2026-10-10）

## 设计与开发说明（实施前）
输入 revision：`codex_20261010031646_7a7fdf3ec301`。仅调整现有项目组件层 `src/components/coal/device.ts`（依赖公开 mounted / setVisible / probe API）、项目三通行为合同与测试，不新增模块。既有角色解析足够，不需要框架或库扩展。

恢复证据：`.flamo/reports/coal-native-follow-paint.json` 的 artifactChanges，inputRevision 为 `codex_20261010025132_880b96947218`。仅将三个运行节点 fillPaints 恢复为其中完整 before 值；先验证当前值等于其 after，避免覆盖后续作者编辑。保留所有路径、层序、原生布局及其余字段。

角色顺序为左/右/上：运行 [241:320,94:101760,94:101759]，停止 [94:101761,241:319,241:318]。明确 true 显示运行、隐藏停止；false/null 显示停止、隐藏运行。上分支为左右三态 OR，保留双开。只写六个实际 mounted 节点 visible，不写任何 paint、stroke 或 opacity。

空 appearance.fills 不代表形状无颜色，更不构成框架故障证据；撤销 B 轮亮青配色及强制 paint 验收。保留实际 probe/visible 校验，角色缺失、多义及读回不符仍失败。appearance/compositing/layerProbe 仅诊断，不作为颜色通过条件。

## 保留与验收边界
保留给煤机 FIXED/MIN/MAX 原生配置、280 全行程和仅 setWidth；不写位置、不增加反馈循环。保留静止轮、Robot 三态、195 devices、47 slots/59 targets、公开 uiBindIds 数组 ABI 和删除的两个孤儿。
源 mock 验证九种左右组合、六个角色互斥、空 fills 不失败、无外观写入、双实例和清理重挂，以及物理角色错误/visible 不符仍失败。编译/图检查不代表浏览器像素或原生随动通过。
客户端后续正式整体导出，再执行 Chrome 三态截图与给煤机随动测量。若正确使用后证据指向或怀疑框架问题（包括原生 follow 仍不生效），报告复现证据并停止，不改框架/Runtime/官方库/部署、不添加绕过。

## 本轮验证结果
- TypeScript 5.7.2 `tsc --noEmit`：通过。
- `scripts/flamo-verify.mjs`（含compile与生成脚本图）：通过；保留既有复杂公开方法/事件类型推导警告，不修改ABI。
- `tests/coal/contracts.test.py`：151 scripts / 165 bindings通过。
- 源mock：20,749断言、195 devices通过；包括九种左右组合、实际角色probe、空fills、禁止外观调用、双实例/清理/重新挂载与失败路径。
- 编译后全Artifact与输入快照深比较：仅三个运行节点fillPaints改变，完整值等于保留diff的before；其他字段完全不变。
- 未执行真实浏览器或verifyInteractionTrace；不声称形状像素/原生follow通过。新promotion revision由服务端轮后返回，本地不造revision。不生成ZIP/dist。

公开诊断调整：移除`measurement.effectiveRunPaint`及`paintReadbackAvailable`，保留`appearance/compositing/layerProbe`与实际targetNodeId/probe/expected。空fills不再令receipt失败。方法、属性、事件及slots合同不变。
