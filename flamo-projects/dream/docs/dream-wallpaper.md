# Dream / Wallpaper Engine

URL 示例：`?wallpaper=1&interactive=1&seed=20261003`。

| 参数 | HUD / brand | 项目 pointer 手势 | 项目 wheel | Replay |
|---|---|---|---|---|
| 普通预览（包括 interactive=0/1） | 保留 | 保留 | 不注册，沿用内置缩放 | 保留 |
| wallpaper=1 | 隐藏 | 不注册 | 不注册 | 不注册 |
| wallpaper=1&interactive=1 | 隐藏 | 移动响应、点击涟漪、拖动漫游 | 独立公开事件路由 | 不注册 |

开关精确匹配字符串 `1`，`true`、`01` 等不启用。导出组件宿主维持 `pan=false, zoom=false`，避免宿主相机与项目手势竞争；默认 wallpaper 没有项目输入监听。预览排查可用 `?wallpaper=1&interactive=1&pan=0&zoom=0`；不要把预览默认开启的宿主相机与“项目无交互”混为一谈。

## 最小实现

现有项目节点 `src/nodes/star-sea/script.ts` 分离 HUD 的 wallpaper 开关与指针的 interactive 开关。不新增生产模块，不改视觉、viewport、seed 或时间模型。沿用根 `778376733:1` 的 nodeArtifacts/scripts、`dream.star-sea@1.0.0` 和 `view/data/bindings.json`；编译器同步生成模块。

公开 `view/api/runtime-api.manifest.json#ctx.on` 列出独立 wheel 事件，类型 `FlamoWheelEvent` 提供 deltaY/deltaMode，`CameraApi` 提供 zoomTo。原脚本没有 wheel 监听，在 pan/zoom=false 的宿主不能依靠内置缩放。本次只在交互 wallpaper 注册 `ctx.on('wheel', ..., {passive:false})`，调用公开 `ctx.camera.zoomTo()`；不读取 Runtime 私有实现，不挂 DOM 全局 wheel。普通预览没有此监听，因此不会新增一次缩放。

wheel 对像素/行/页增量统一处理（行=16 CSS px，页=窗口高度），忽略非有限/零增量；指数缩放限于既有 viewport 范围 0.0625–8。由原帧回读记录 `dream.zoom`，没有伪造效果 trace。`dream.touch` 和 `dream.pan` 仍在原点击/拖动完成时记录，并经 `dream:trace` 发出。

seed 仍只在 wallpaper 下接受 ASCII 十进制 0–4294967295（允许前导零）；非法、缺失回退 crypto；普通模式忽略 seed。固定种子只固定随机初态，不保证帧率/时序确定性。Dream 仍持续演进，不是周期或数学无缝循环。

## 检查与证据（2026-10-03，本轮）

- `node tests/dream-wallpaper-source.mjs`：种子、HUD 层级、绑定检查。
- `node tests/dream-wallpaper-interactive.mjs`：执行真实 TS setup 的公开 API 替身测试，8 个 URL 组合、移动输入、点击涟漪、拖动不误触、三种 wheel 单位、缩放边界、取消与 trace。**不是浏览器事件路由证明。**
- TypeScript 5.7.3 安装于 `.flamo/tools`，版本记在其 package/lock 文件；`node .flamo/tools/node_modules/typescript/bin/tsc --noEmit`。
- 沿用已有 `tests/tool-resolver.mjs`，`NODE_OPTIONS="--loader ./tests/tool-resolver.mjs" node scripts/flamo-dev.mjs compile` 和同环境 `node scripts/flamo-verify.mjs`。未改编译器/验证脚本。
- 命令日志、源文件摘要和当前 revision：`.flamo/reports/dream-wallpaper-interactive/validation.json`。

## 宿主真实验收（尚待执行）

此隔离工程没有已导出的组件包或可用浏览器；仅公开合同不能证明某个宿主在 pan/zoom=false 时确实投递原生 wheel。不能把替身测试或历史报告当作真实效果验收。

1. 导出宿主设置 pan/zoom=false，在组件挂载前订阅 `window.addEventListener('dream:trace', e => console.log(e.detail))`。启用上述交互 URL，等初始 fit（400ms）完成。
2. 真实移动、点击、拖动、滚轮，核对画面与公开 `camera.get()`：涟漪有 `dream.touch`，拖动有 `dream.pan` 且不增加 touch，滚轮相机 zoom 变化并出现 `dream.zoom`；HUD/brand 不出现。不要用手动 dispatch trace 代替原生输入。
3. 默认 wallpaper 不应注册 pointer/wheel；普通预览的 Replay/brand、拖动与内置缩放保持原样。再测 seed 边界、408×480/竖屏和窗口变化。
4. Preview 可用 `debugScripts()` 核实 mounted/routed/exercised、`traceInteraction()` 查看真实事件，并执行 `await window.__flamo_project.verifyInteractionTrace()`。既有全量契约要求 Replay 等动作，必须在普通预览补齐；wallpaper 不应为了通过契约重新开启隐藏 Replay。

当前 Artifact revision 为 `codex_20261003101119_38ecfbbaa194`。不手工编造 revision；新推广 revision 由本轮服务器编译/验证后生成，当前容器尚不可见。当前仅源码、类型、编译/图检查完成，组件 ZIP 打包和真实宿主验收未完成。
