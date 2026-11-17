# 重挂局部节点写入修复

> 历史记录：给煤机旧行程/随动判据已修正；三通以空appearance判定颜色故障或还原材质的推论撤回，不据此认定框架故障。当前规则与验收以 [NATIVE-FOLLOW-PAINT.md](NATIVE-FOLLOW-PAINT.md) 为准；本文件不作为随动/像素通过证据。

责任仍在项目共享组件行为 `src/components/coal/device.ts`，不改 Runtime、宿主或设计 scene。

- 以 `ctx.setNode(定义内 source ref, path, value)` 写入继承角色显隐和给煤机宽度。不再把派生 `handle.id` 传给布局预检。公开合同规定 ctx mutation 自身执行布局所有权约束；任何拒绝仍进入 receipt.errors。
- 保留作者宽度 122/142、位置 0..53、第一路反向/第二路正向；未知隐藏并清零。销毁时清除状态与定时器/动画，重新挂载建立独立闭包。
- 一旦收到主边界 bus 快照，本次挂载不再让默认 props watcher 覆盖它；独立定义在未收 bus 快照前仍响应 props。电机 on/off 使用同一 source-local 写入路径。
- 电机/给煤机写入后下一帧发 `coal.device.visual` trace，其中 nodes 为 ctx.probe(ref) 结果；版本守卫过滤旧快照与已卸载回调。probe 异常记为 coal.device.probe-error。应用 ACK 本身不是视觉成功证明。

## 验证边界
Typecheck、交互编译、本地脚本图通过；153 scripts /169 bindings 合同通过；源 mock 18,025 断言通过。新增三次不同派生 ID 挂载、双实例、未知清除、14 电机 props 不覆盖 bus、保护写入拒绝保留、延迟 probe 与销毁过滤测试。模拟器按 source ref 投影，不是实际 Runtime 实现，不能证明真实 remount 修复成功。

未执行真实 Web Component/browser/verifyInteractionTrace。重导出后请重新验证同一元素 remove/append，以及 14 电机的真实 probe/画面。输入 revision 是 codex_20261009035257_9c6bfff03e45；最终 revision 等服务端 promotion 回执。无新 ZIP。本轮不改变 API/47 slots/报警 # 兼容/映射；复杂公开类型解析警告仍存在。
