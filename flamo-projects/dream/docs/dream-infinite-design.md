# Dream：无限星海实施说明

保留原生 Artifact、中文题记及 GPU ShapeBatch。新增 src/nodes/star-sea/world.ts（项目展示策略，依赖 model.ts）管理稳定空间种子、三层景深、连续双 LOD 与可回收分区；viewport.ts（项目布局，依赖公开 NodeScriptContext）做逆相机视口补偿、响应式原生 HUD 和官方品牌 HtmlSurface。现有管道粒子资产不表达本作品形态，故不修改库/框架。

相机仍为公开 Runtime camera。根的逆相机补偿使本地单位为屏幕像素；世界几何用相机采样投影到批次，HUD 不参与该投影。背景只覆盖当前视口，不伪造巨型世界。远中近层使用不同视差/软光/对比；每层两级空间网格交叉淡入，固定缓冲区上限 22000 点、9000 线。每个分区内容由 dreamSeed+层+LOD+坐标确定，离开缓冲区立即回收。所有动画以暂停感知的梦境时钟驱动。

官方资产核验：2026-09-30 https://flamo.dev/ 首页导航 official-brand-mark 明确引用 https://flamo.dev/logo.png；原文件保存在 assets/flamo-official.png。不得用自创字形替代。品牌链接用原生 HTML anchor、target=_blank、rel=noopener noreferrer 和可见焦点。

验证：本地原装 Preview + 随项目 Runtime，短生命周期测试服务；保存截图/trace/帧间隔，最终内容摘要绑定 Artifact revision。没有批准参考 PNG，像素匹配门禁 unavailable。正式线上服务器门禁若不可访问，明确保留 pending，不伪造收据。
