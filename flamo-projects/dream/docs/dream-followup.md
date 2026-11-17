# Dream 工程侧续修（不是整体完成收据）

## 实施边界
保持原生 Flamo 场景、星鱼、星云、中文标题、按钮与官方品牌，不替换为 HTML 星空。
只修改工程 `src/nodes/star-sea` 与测试；官方 Preview 仅恢复原件，未修改 Runtime、library、校验器或 receipt。

- `script.ts`：工程动画调度层，直接依赖公开 ctx、DreamPainter、viewport。冻结视图时不重建批次；真实 ctx.trace 调用后同步发出诊断 witness（不写任何官方 trace 数组）。
- `viewport.ts`：工程布局层，公开 camera/scene/node API；相机不变时避免重复变换写入。品牌仍使用官方 logo 与原生 DOM surface。未用私有 DOM/渲染接口强行移出父层。
- `painter.ts`：工程图元层，公开 createShapeBatch/update；屏外线段剔除、移除未使用星点数组、提供实际批次统计。固定预分配两份缓冲区，不按实体创建节点。
- `tests/dream-followup.mjs`：Playwright 真实输入、GPU 信息、截图、布局采样；90 秒总截止，失败不重跑全量。
- `tests/dream-trace-probe.mjs`：只采启动链与正式门禁；addInitScript 在 mount 前监听，exposeBinding 在采样过程中保存到测试进程，最多1000条，不伪造事件。
- `tests/tool-resolver.mjs`：测试依赖解析层，仅给未改动的编译器解析工具区 TypeScript。

## 恢复与缓存
`.flamo/preview/main.js` 已恢复为现有 runtime-contract receipt 对应原件（保留 CRLF）：
`5b8546980c0ca290bdd3dd9c44dc2b86e64e7dc9d22d9da4c2047867f9ee1db5`（精确值以 toolchain.json 为准）。
所有 receipt 列出的官方工具逐项匹配，未更新预期 hash。
130 个 `.pnpm-store` 文件全部在前轮服务器 `authoringChanges` 中为 `kind:add`，逐项核实后删除。证据 cache-cleanup.json。
工具在 `.flamo/tools`，版本 TypeScript 5.7.3、Playwright 1.58.2，未安装系统包或字体、未更换渲染后端。

## 正式 trace 门禁：仍失败，根因范围更精确
原版 `verifyInteractionTrace('src/interactions/contracts/dream-star-sea.behavior.json','dream')` 实际返回：
`passed:false, evidenceCount:0, failures:[{invariant:'pointer-focus-render-causal-chain', candidates:[] ...}], causalEvidence:null`。
测试在 boot 前监听真实源码 witness，确实收到 `dream.mounted`、随后 `dream.frame`，没有容量溢出。与此同时 `traceInteraction('dream')` **和**公开 `instance.inspectInteractions().trace` 均为空。因此本次不应简单归因为“500条容量覆盖”；还存在 trace 存储/桥接链路问题。

客户端最小需修位置（本工程未修改）：
1. `.flamo/preview/main.js` 挂载代码中的 `window.__flamo_interaction_trace = []` 位于 `await runtime.mount`、`await instance.ready` 之后。应在 mount 前初始化收集并保持挂载事件，不事后清空；核实公开 `ctx.trace(action,detail)` 的真实事件/存储桥接能到达公开 inspect/Preview trace。合同 runtime-api.manifest 明确承诺最近500条。
2. `createProjectDebugApi` 内 `verifyInteractionTrace` 的 `renders = entries.filter(... 'single-line-editor.render')` 硬编码。Dream contract 的 `renderTraceAction:'dream.frame'` 当前被忽略，candidateKeys 因而永远为空。需按合同选 render action，并只对 text-input 合同执行其滚动/光标不变量。不得把 dream.frame 改名伪装 editor render。
3. 长链容量可保留 mount/lifecycle 单独索引或允许配置有界 trace；需保证真实脚本身份/顺序，不从手工 witness 注入官方数组。

此次短启动测试并未执行整套交互链，不能据此把完整 causal gate 标记通过。正式门禁失败证据保存 trace-probe.json；旧在线 completion receipt 属于旧 revision，不复用、不伪造新收据。

## 真实 Preview / 性能
1000×700，Chromium headless，原生随附 Runtime，ANGLE Vulkan SwiftShader (Subzero)，非硬件GPU。详见 preview.json 的 CDP SystemInfo 原始信息。
综合短测完成 start / paused / paused-later，到90秒截止终止。暂停 time=3.3 两次一致，updated=false / cpuBuildMs=0，两张 PNG 字节一致。初始与暂停图形确实不同，仍是星鱼/丝线/软光艺术画面。中文是方框，未更改环境掩盖这一限制。
启动专测9个真实动画帧、8个间隔，约1.05 FPS（小样本，非性能通过）；CPU构建约2.2–12.3ms，不能把总低FPS归罪于几何生成，也不能由软件环境推断硬件性能。
固定两批次：点容量22000、线容量9000、CPU缓冲1240000字节。实际最大6681点图元/3926线图元（点图元含软光多层，不能等同独立星体）。静态300次长平移/缩放预算测试最大246分区、6281世界点、3436世界线；这是算法压力测试，不是浏览器长平移性能。uploadBytes 是最近一次构建的打包字节数，updated=false 时不调用 update。

## 居中与品牌
三个设计标签为 x=0/y=0、130×45、CENTER/CENTER/NONE；Runtime current 的尺寸/位置/字号13px与对齐一致。按暂停确实冻结，但 current().text.characters 仍读回“暂停片刻”，预期调用 `ctx.role('pauseLabel').setText('继续漂游')` 后是“继续漂游”。尚不能断定是文字写入还是语义读回缺陷；需在有真实中文字体的桌面用公开读回/实际字形核实。不以方框截图声称中文字形视觉居中通过。
品牌初始位于底部，不和按钮重叠，href/target/rel/aria-label真实存在。跨相机状态的 fixed footer 仍依赖客户端正在修的逆相机父层变换问题；本轮未完成远近/长平移/窄屏和品牌点击复测。

## Revision 与结论
本地 Artifact metadata revision 保持 `codex_20260930234551_5d28dfffc44a`；编译更新内容，以报告中的 artifact SHA-256 和源码/生成物哈希精确区分本次 staging。服务端晋升后的新 revision 尚未产生，不能声称已验那个未来版本。
Typecheck、编译、官方结构/脚本图验证、静态居中/官方工具 hash、世界预算测试通过；真实 Preview 局部证据成立；整体 browser-verified/正式完成门禁未通过，像素参考 unavailable（无批准PNG）。
