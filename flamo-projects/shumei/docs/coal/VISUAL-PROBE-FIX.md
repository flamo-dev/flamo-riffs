# 继承角色物理写入与公开读回（2026-10-09）

> 历史记录：给煤机旧行程/随动判据已修正；三通以空appearance判定颜色故障或还原材质的推论撤回，不据此认定框架故障。当前规则与验收以 [NATIVE-FOLLOW-PAINT.md](NATIVE-FOLLOW-PAINT.md) 为准；本文件不作为随动/像素通过证据。

本轮责任/层：项目共享设备行为 `src/components/coal/device.ts`；主边界 `script.ts` 只转发 receipt。直接依赖现有公共 NodeScriptContext/EntityHandle、model 和实例 bus。无新增运行时模块。原 semantic source-ref 写入和 ACK 不足以证明改到渲染中的继承子节点，旧 mock 又把两种地址合并，必须补物理节点验收。

## 修复与诊断边界
- definition 的 on/off/parts/bar 源 ID 保留。由当前设备 root 的 `ctx.mounted.resolve/children` 遍历物理子树，匹配 sourceNodeId/semanticRef，必须唯一。使用该物理 entity 的公开 `setVisible`。不缓存物理 ID、不解析派生 ID、不回退全局 definition，不改 Runtime/scene/slots/合同角色。
- 给煤机宽度继续使用保护布局的 `ctx.setNode(sourceRef,'TransformCpt.size.x',width)`，保留 122/142、0..53 反向/正向。显隐用物理 handle；下一帧重新解析后读取实际 size.x，不以计算值代替测量。
- bus 控制优先与完整快照未知清理保留。版本/卸载守卫过滤陈旧 probe；新挂载重新解析当前物理树。
- 现有配置角色对应 on/off 图片，未发现需改的 roleBindings。旧引用是否确实写到了 definition、以及当前 API 写入是否改变最终渲染，仍需真实 Runtime 读回和截图确认，不能把源 mock 当已证实的 Runtime 根因。

## 公开合同（方法名及 slots 不变）
`getCoalState().devices[i].receipt` 现含 `{state, errors, visual}`。
`visual = {status: 'pending'|'observed'|'failed', application, nodes}`。
每个 nodes 项含 `ref, targetNodeId, sourceNodeId, instanceRootId, revision, expected, sourceProbe, probe`；失败项含 `probe:null,error`。
- `expected`：本次业务写入期望，不是实测。
- `sourceProbe`：语义引用 `ctx.probe(ref)` 读回，用于对比地址。
- `probe`：下一帧物理 `ctx.mounted.probe(entity)` 结果；`visible`、`size.x` 是公开探针读回值。
- 全部共享设备返回 root probe；有 on/off/parts/bars 的依赖还返回所有对应角色。未提供角色的 leaf 只有 root，不声称探针覆盖其全部后代或 slot 内宿主内容。
- 角色缺失/多义、probe 缺失、显隐或宽度不符都进入 errors，status=failed。observed 不等于 renderer/screenshot pass；不等于所有动画或 slot 内容已验收。
宿主 apply 后跨一帧再轮询 getCoalState，等待目标 receipt 非 pending，再对比 run/stop/unknown 的物理 probe 和截图。不给业务宿主注入内部节点补丁。

## 验证
TypeScript、交互编译/本地生成图、153 scripts /169 bindings 合同通过；scene/surface 与本轮基线相同，47 slots 保留。源 mock 18,342 断言通过，含定义诱饵与独立物理子树、14 motors/双实例、crusher/screen、plough、feeder 0/53/unknown、写入接受但测量不符、缺失/多义角色、陈旧帧和销毁过滤。mock 不是真实 Runtime。
本轮未执行真实浏览器/verifyInteractionTrace/截图 visual gate。输入 revision `codex_20261009040722_f2b7718bc2c5`；新 promotion revision 由轮后服务端返回。未制作 ZIP；服务端 promote 后用 Studio 正式导出 166:730 / flamo-coal-system。
