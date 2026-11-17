# uiBindIds：JS property only（2026-10-09）

## 核查与设计决定
输入 revision：`codex_20261009133251_96ee43329e80`。只收窄项目公开合同，不新增模块、不修改业务源码。

`view/api/flamo-runtime.d.ts` 的 `FlamoControlParameterDefinition.attribute` 接受 boolean 或 `{name?, serialize?, ...}`；`serialize` 只是 string，没有枚举/保证数组 JSON 映射的导出合同。`FlamoWrapperContract` 描述 attributes/properties，但不是用于项目注入 wrapper 的公开配置。项目 control-surface 指南要求以 nodeArtifact.surface 为源；正式本地构建脚本仅委托 Studio 打包，未提供其他 JSON attribute 生成选项。

用户对正式 c 包（contractId `sha256:9e3ae133d9cde4c419a7f33efabc31fb0a9d638ca18082a40348ab47cd49b0af`）报告：现有 `attribute:{name:'ui-bind-ids',serialize:'json'}` 虽被带入 manifest，实际 `w3cSurface.attributes=[]`，observedAttributes 没有它，setAttribute 不改变消费状态。因此类型允许元数据不等于 exporter 实现 JSON attribute。当前项目公开资料未找到另一种有依据的可用声明；不猜测 controls 字段，不假称已验证替代方案，不超范围检查/修复框架。

将根 `surface.parameters.uiBindIds.attribute` 和 components 摘要显式设为 `false`。保留 array/schema/default=[]/Record兼容、真实 JS setter/getter、watcher、方法及事件。无 MutationObserver、expando、隐藏方法或 wrapper 修改。

## 宿主接入
所有 HTTP 请求继续仅在 index.html 的宿主代码中经 develop/common/httpData.js 执行。静态 slots 原样保留。请求结果按业务 ID 形成数组后：

```js
coalSystem.uiBindIds = rows; // [{id, notes?, value}]，整份替换
const consumed = coalSystem.getCoalState().values;
coalSystem.uiBindIds = []; // 缺失全部清为未知
```

不要使用 `setAttribute('ui-bind-ids', JSON.stringify(rows))`；当前合同不提供该入口。JS property 是已满足页面需求的正式路径，无需调用 applyPointValues。

## 证据归属和交付边界
用户报告 c 包真实 Chrome 已完成：24/24 业务验收，195/195 mounted probes observed/errors为空，双实例、重挂、给煤机端点等通过；额外 ready 前设置和 prototype 真实 setter/无 own expando 通过。这是用户提供的实包证据，本轮未重新运行浏览器。

本轮执行 TypeScript、完整已有 source mock 和合同/生成图检查，结果见 `.flamo/reports/coal-attribute-contract.json`。Scene、annotations、exports、47 slots/59 targets、所有 src 字节、bindings 及其他 nodeArtifacts 不变；两个 orphan 不恢复。

正式导出仍走认证 Studio → 一体化 → yhpComp → 166:730 → Web Component 导出 → flamo-coal-system。下一次正式导出应确认 JS property 保留、manifest 不再承诺 JSON attribute；不手改产物。未生成新 ZIP，最终 promotion revision 只能由轮后服务器回执给出，未自行修改 metadata.revision。
