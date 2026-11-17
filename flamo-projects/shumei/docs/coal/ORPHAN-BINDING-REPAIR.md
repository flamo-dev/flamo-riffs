# 当前快照孤立绑定修复

187:638、197:315 已不在用户当前 Scene 中，且 nodeArtifacts.provenance.status 为 orphan。保留该记录的名称、来源等元数据，移除其 scripts/interactions 活跃挂载；同步移除 bindings 和煤系统 mapping 的两个无效煤流目标。不恢复已删除节点，不推断替代节点。已撤下的绑定原文保存在 `.flamo/reports/coal-orphan-repair.json`。

当前业务映射为 195 个目标，不再期待删除节点的 receipt。5A/5B 的其他现存煤流映射和全部 point IDs 不变。uiBindIds、兼容方法、47 slots 和导出 targets 均未变更。Scene/exports 和其余 nodeArtifacts 与本轮输入逐项相等。

Typecheck、compile、generated graph、合同检查通过（151 coal scripts / 165 interactions）；源 mock 19012 断言通过。未运行真实浏览器，不代表 Visual gate 通过。最终 revision 以轮后服务端 promotion 回执为准。
