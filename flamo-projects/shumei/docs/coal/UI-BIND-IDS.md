# uiBindIds 与 mounted 实体修复（2026-10-09）

> 数组合同更正见 [UI-BIND-IDS-ARRAY.md](UI-BIND-IDS-ARRAY.md)；下方 object/default={} 为历史合同，已替换为数组主合同/default=[]。

## 当前输入与保留
输入 `artifact-rev-1791535907537-lcfl11`，不是旧 codex Artifact。修改前后 scene、exports、全部 slots 深比较一致；nodeArtifacts 仅 166:730 改动（新增 parameters.uiBindIds）。没有可用旧 task Git 历史，未声称完成历史逐项差异比较。用户其余节点、脚本、资源不回滚。

## 责任与合同
沿用项目组件层：`script.ts` 负责实例公开输入及分发，依赖 model/mapping/device；`device.ts` 负责当前设备 mounted 角色与受保护写入，依赖公开 Runtime API。无需新增框架模块。

当前 surface.parameters.uiBindIds 为 array/default=[]，schema 兼容 Record；attribute:false，不承诺 JSON attribute。历史 object/default={} 已被数组合同取代。源码 PointValues 类型位于 model.ts。宿主在静态 slots 外只写：

```js
coalSystem.uiBindIds = completeConfigSnapshot;
const state = coalSystem.getCoalState();
```

不需要 applyPointValues fallback；保留的方法通过 instance.setProps 更新同一参数并走同一 consume pipeline。初始 setup 消费 props；watch 监听快照内容，整份替换，遗漏清除；bus 接管后的设备不再接受默认 props 覆盖。watch/dispose 使用 Runtime 生命周期。无 HTTP、host 或 token。`getCoalState().values` 是实际规范化输入的独立副本（包含报警 canonical 别名），不是宿主 expando。处理后发 coalStateChange；nextFrame 后 receipt.visual 才是读回，事件不表示 renderer 已完成。

官方 exporter 负责生成元素 prototype getter/setter、ready 前 property 接管、重连参数持久化、manifest/W3C/d.ts。此 staging 不能执行认证 exporter，以上包装层行为和生成类型仍必须实包验收；这里不手写 wrapper 或伪造 manifest。

## 为什么此前 ACK 不够
sourceNodeId 可为未带 session 的 Figma localID，而配置引用为 qualifiedID；定义 ctx.node(ref) 也可能是全局实体。仅定义 ref 相等无法识别实际设备；语义 width 写入也不等于物理 bar width。

现在：仅遍历当前 mounted 子树；保留完整 qualifiedID；重挂 namespace 只信 public ctx.node/resolve 的映射。未限定 localID 仅在 sourceNodeId/semanticRef 末段一致且 semanticRef 的 I<instanceRootId> 与子树内 owner 一致时允许。全局/兄弟不在子树内而被拒绝，多义仍失败。不按名字、session 偏移或猜 physical ID。每次写和下一帧读均重新解析。

feeder 使用实际 physical(ref).entity.setWidth，仍由公开 setter 执行布局所有权保护；不绕过 LayoutContext。若实际 Runtime 仍拒绝，它会留在 receipt.errors，不能宣称成功。公式第一根280*(1-p/53)、第二根280*p/53（固定煤仓参照线全行程，见NATIVE-FOLLOW-PAINT.md）；未知隐藏清零。宽度证据读 probe.size.x，非 expected。root/roles/bar 读回与有界失败诊断继续公开。

## 检查与待验收
- typecheck、compile、flamo-verify 生成脚本图通过。
- 19,004 源 mock 断言通过：属性首值/替换/独立实例/新生命周期，unqualified localID + nested owner、qualified namespace 公共映射、拒绝 foreign qualified 同后缀，feeder 0/26.5/53/未知实际 mock probe，原报警等回归。
- 旧合同测试失败：当前输入已经存在 nodeArtifacts 187:638、197:315 的 root role 引用场景缺失节点；本轮未重建/删除这些用户记录。不能称全合同通过。
- 没有真实 Runtime/browser/24 项 Visual 验收。mock remount 是新 script 生命周期，不是浏览器 disconnect/reconnect。
- promotion revision 由轮后服务端提供；本地不伪造。

## 正式交付入口
认证 Studio → 一体化 → yhpComp → 166:730 → Web Component 导出 → flamo-coal-system。或认证 flamo_component_export。必须在 promotion 后整体导出/替换 ZIP，检查 publicSurface.properties.uiBindIds、真实 prototype setter、manifest/W3C/d.ts（JS property only）、47 slots/59 targets，然后仅写属性执行 24 项 browser + 截图 gate。无本轮 ZIP URL。
