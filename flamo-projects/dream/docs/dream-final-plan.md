# Dream 工程续修（2026-10-01）

- 范围：仅工程节点脚本、行为合同、tests 与诊断报告；不改 Runtime/Preview/managed library。
- `src/nodes/star-sea/script.ts`：项目手势策略，通过公开 `ctx.on` 的 pointerId/view 坐标和 `ctx.camera.panTo/get`；6 CSS px 阈值分离触摸与平移，排除 HUD 控件，取消/离开清理。既有默认相机只接受无命中区域，不能覆盖满屏交互根，故在已有脚本组合，不增加通用运行时模块。
- 保留 world/painter 的三层确定性分区、形态、缓慢漂移与两批次缓冲。先实测软件 GPU 与前台 RAF，再决定是否降低预算。
- `tests/dream-final.mjs`：只用真实浏览器输入和公开 debug API 取得 trace、current 文本、屏幕边界、GPU 与帧间隔；不修改/注入官方 trace。
- 报告绑定本地 artifact revision + SHA、生成脚本 SHA 和刷新后的 Runtime receipt；发布后 revision 的线上 POST 回执交由主线程，不伪造。
- `src/nodes/star-sea/viewport.ts` 同时负责 HUD 的屏幕命中排除：依赖 viewport 尺寸及既有断点布局，补足根节点事件的 target/path 不能稳定区分子按钮的问题。品牌 HTML 明确内容宽度，避免 auto 宽度随 portal 外层改变；这是原有公开 DOM surface 内容，不是一次性 DOM 补丁。
- 最终文字采用公开 canonical RuntimeNode.setText，消除 EntityHandle.setText 的 current 文本读回差异；品牌采用公开 surface.setSize 补偿相机缩放的裁剪框，CSS内容尺寸保持固定。实施/证据与边界见 dream-final.md。
