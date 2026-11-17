# 梦境续修与隔离验收 — 2026-10-01

## 状态及证据身份

工程侧修复与本地正式 trace 通过，**整体未完成**：软件渲染性能不合格，中文实际字形及发布后桌面完成回执待验。没有修改官方工具、Runtime、managed library 或预期 hash；没有伪造完成收据。

本地 Artifact revision：`codex_20261001000436_d898212ac168`；SHA256：`7a5baf4fc3ed9197af4132a3126c8910ab56b50a77859fd04019f787e70cea98`。
本轮最终源码/生成脚本完整指纹在 `.flamo/reports/dream-final/final/preview.json` 与 `summary.json`。这些是本地测试身份，不能等同于稍后 Orchestrator 事务晋升的新 revision；本轮尚未取得线上 `/verification/interaction` 回执。

## 工程实现

- `script.ts`：公开 pointer 事件/view 坐标 + camera.get/panTo，实现主指针拖动；6 CSS px 阈值区分拖动与轻触，排除按钮与品牌，取消/离开释放手势。轻触在 pointerup 执行，保留星鱼与星光。未访问私有相机状态。
- `viewport.ts`：复用原有布局计算按钮/页脚命中范围；品牌固定 CSS 136×30，公开 HtmlSurface.setSize(136/zoom,30/zoom) 补偿 portal 裁剪尺寸，内容14px始终不缩放。官方 logo 与实际官网安全链接保留。
- 暂停文字通过 `ctx.scene.get(ctx.role('pauseLabel')).setText(...)`（实际代码处理空 role）更新 canonical RuntimeNode。持久 Artifact 与运行时三个文本框保持局部0/0、130×45、CENTER/CENTER，不依赖一次性 DOM 修补。
- 保留原有世界/绘制器、分区种子、三层景深、多种形态、缓慢漂移、星鱼/紫色碰撞/流星/重放。此次没有以改换 HTML 页面或继续削减视觉复杂度来掩盖软件 GPU 性能。

## 实际验收

最终测试 `tests/dream-final-acceptance.mjs`，原版 Preview 与原版 verifyInteractionTrace；浏览器进程与短时服务已退出。

- typecheck、compile、官方结构/脚本图、源码/绑定/居中配置、官方工具 hash 检查通过。
- 正式本地 trace：`passed:true`，29条证据，同实例真实 mounted→frame→touch→meteor→collision→pause→replay；过滤 dream、renderTraceAction=dream.frame。由官方 Preview 保存 `.flamo/reports/evidence/latest/`，不是线上 completion receipt。
- 按钮点击前后 touch 数量均1，未再误触星光。真实鼠标拖动使相机从(-16,-47.5)到(727.8017,-163.2025)，zoom约0.605。
- 暂停/恢复 canonical 运行态文本分别为“继续漂游”/“暂停片刻”。中文字体缺字仍显示方框，不能声称中文字形光学居中已验收。
- 重放 seed：3971636662→1732086632。
- 本轮较早准确指纹测试 `preview.json` + `run2-source.json` 验证±70000及0.2/1/3倍相机：原生背景/HUD未消失，无白边，12个HUD节点最大屏幕漂移0.00391 CSS px、字号不变。该证据早于最后的按钮排除/文字setter/品牌尺寸修复，未冒充最终源码完整相机矩阵复测。
- 最终源码再次真实拖动并在远坐标0.2/1/3倍截图：`final/brand-*.png`，品牌完整、未裁剪，136×30、14px，位置误差小于0.004px。390×844的`final/narrow.png`按钮/说明/品牌无重叠。已人工查看这些实际截图，星空覆盖画面且保留暗色留白；非像素参考比对。
- 实际点击品牌打开 `https://flamo.dev/`，新页 opener=null；anchor具有_blank、noopener noreferrer及可达名称，保留原生键盘链接语义。没有单独完成键盘操作全流程。
- 分区算法300段长平移测试通过：确定性、重访稳定、运动改变几何、重放改变布局、有限值；峰值246分区/6281点/3436线。它不是浏览器FPS或真实长距离连续拖动稳定性证明。

## 性能：未通过

Chromium145 / Playwright1.58.2 headless，ANGLE SwiftShader软件渲染。visibilityState=visible，已禁用后台计时器/遮挡/renderer节流。预热后无截图干扰采样，13个RAF间隔合计11.216秒，约1.159 FPS，P50 883.2ms、P95 900ms。CPU构建1.6–3.2ms不能代表GPU耗时，也不能据此断言框架瓶颈。

最终运行遥测峰值：2845点图元、936线图元、142缓存分区、98组/星云、602星、2个batch；CPU缓冲1,240,000字节，容量22000点/9000线。组/星云计数包含剔除保护带，不是逐像素可见对象真值。此前不同seed较复杂运行见`preview.json`，不是以上峰值的全局上限。必须由桌面硬件GPU验证稳定帧率和视觉流动；不能将约1FPS签为通过。

## 待主线程收口

1. Orchestrator晋升后准确新revision的真实桌面点击/线上自动POST完成回执。
2. 硬件GPU连续运动、暂停冻结及恢复、全手势/长距离多向平移、中文实际字形与键盘访问复核。
3. 无approved PNG，pixel-parity保持 **unavailable**。

总报告 `.flamo/reports/dream-final/summary.json` 明确为 `project-diagnostic-not-completion-receipt`、`complete:false`；不替代正式task状态。
