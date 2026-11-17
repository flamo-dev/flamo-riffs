# 2026-10-10 局部设计与开发

> 历史记录：给煤机旧行程/随动判据已修正；三通以空appearance判定颜色故障或还原材质的推论撤回，不据此认定框架故障。当前规则与验收以 [NATIVE-FOLLOW-PAINT.md](NATIVE-FOLLOW-PAINT.md) 为准；本文件不作为随动/像素通过证据。

输入 revision：codex_20261009135540_9275f4fb456a。修改层为本项目 src/components/coal 的业务策略，不新增 Runtime/官方库模块。直接依赖现有 NodeScriptContext、mounted 公共 API、EntityHandle 受保护 setter。既有 uiBindIds 数组管线保持不变。

- wheel：仍保留设备及 receipt，但不注册 RAF、不写 rotation；读回矩阵计算角度，不以状态推算角度。
- feeder：当前 209:639 的 334:306/317 为 HUG 容器；334:338/361 是满宽 122/142 的普通 Frame；225:1072/1085 为其子图标。第一容器右对齐，第二容器普通横向。沿用实际 mounted Frame.setWidth：122*(1-clamp(v,0,53)/53)、142*clamp(v,0,53)/53。未知隐藏且宽度归零。禁止写容器/图标 x/y。增加容器、Frame、其真实子节点的 probe/layout，不建立反馈循环。
- 当前源已经使用物理 setWidth，不能把历史 semantic width bug 说成本轮发现。尤其第二图标的 authored x=128，未显式设置 horizontalConstraint=MAX；本轮不擅改用户 constraints。因此宽度成功不等于图标随动成功，必须在浏览器检查 native layout。
- tee：角色顺序左/右/上已对应当前六层；运行层初始 visible=false，opacity=1、原渐变填充半透明。停止/未知显示停止层。激活时通过公开 design()/setFill()/setStroke()/setOpacity() 重应用该物理角色自身的作者外观，避免只改 visible 而不刷新隐藏层绘制状态；不产生新颜色，不改绘制层次。用 current() 的 appearance/compositing 和 committed probe 诊断；是否解决真实渲染仍待浏览器截图验证，不能只以 visible=true 验收。
- Robot：仅诊断 running/stopped/unknown，宿主控制 SVG；不访问 HTTP。

不修改 Scene、slots/targets、公开 uiBindIds schema、两个 orphan。新增观测位于 receipt.visual.nodes[].measurement；paint 与布局观测不以 expected 冒充实际值。源/mock 不模拟或认证 Runtime 排版结果。
