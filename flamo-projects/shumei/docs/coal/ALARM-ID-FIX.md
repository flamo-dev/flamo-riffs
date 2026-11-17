# 报警原始 ID 兼容修复（2026-10-09）

## 范围与设计
仅修改项目组件领域层 `src/components/coal/model.ts` 的 snapshot 报警别名解析。
配置输入 `#1APDBJ_PDSLBJ` 归一为既有 mapping 使用的 `PDSLBJ_1APDBJ`。
正则从 `^(\d[ABCD]PDBJ)_…` 改为 `^#?(\d[ABCD]PDBJ)_…`，保留无 # 的旧输入。
不新增模块、依赖行为、点号或宿主逐层 patch。canonical 显式存在时优先，包含 false/null，
与输入键顺序无关。每次仍创建完整新快照，缺失不沿用上一帧。

注意：单个报警 false 而同皮带其他四项缺失时，聚合 run 为 null，不是假定整条皮带已停警；
五项均 false 才是 run=false；任意 true 即 run=true。false/null 均隐藏载体。

## 验证
- TypeScript 5.7.3 `tsc --noEmit`：通过。
- 工程 `flamo-verify.mjs`：源交互编译及本地生成脚本图通过。
- 合同测试：153 煤系统脚本、169 绑定通过。
- 源 mock：17,809 断言通过；覆盖 14×5 实际 # ID，false→true→false→缺失，
  公开 applyPointValues/getCoalState → 设备 ACK errors=[] → 可见性；所有其他皮带无误报警。
  canonical false/null/true 在两种键顺序下优先，无 # 旧输入继续支持，双实例隔离与清理。
- 非报警 mapping 输入键逐项检查：snapshot 不改名，ST 对象保留；没有 6AD 输入键。
  此检查针对当前 mapping，不宣称重新读取外部宿主 config.js。
- 原 feeder 的实际定义测试、HUG 参照错误复现、0/53 投影与未知清除回归仍通过。
- 47 slots 与既有 slots.json 一致，包括 Robot；公开 API 未改动。
- 编译器原有 complex public type / unknown 警告仍存在，本次不扩大修改范围。

用户已报告上一版真实浏览器挂载成功（47 slots、59 targets、197 receipts、errors=[]）；
那是上一版的外部验收信息，不是本轮报警修复的浏览器证据。
本轮未执行 localhost/browser/Runtime trace，也未生成 ZIP。

## Promotion / 重导出
本轮输入 revision：`codex_20261009034428_a47429c6826c`。
最终新 revision 只能来自回合结束后的服务端 compile/graph/promote 回执，本地不生成或冒充。
完成 promotion 后在已认证 Studio → 一体化 → yhpComp(0:1) → 166:730 → Web Component 导出，
标签 `flamo-coal-system`。重新导出后以 # 原始 ID 验证报警显隐与清空快照。
