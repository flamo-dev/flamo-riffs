# 2026-10-01 更新：旧阻断已部分解除

新官方 snapshot 下，远坐标原生 HUD/背景渲染与正式 dream trace 已通过真实测试，见 [dream-final.md](dream-final.md)。下文只保留历史，不再代表当前失败。

工程诊断的两个公开 API 差异：
- `EntityHandle.setText("PAUSED")` 实际截图已渲染PAUSED，但 `current().text.characters` 仍读到旧文案；预期应一致。`ctx.scene.get(handle).setText("SCENE")` 渲染/读回一致，工程已使用后者。原始证据 `dream-final/closure/`，无需绕过私有接口。
- 逆相机父层下，HtmlSurface portal位置继承祖先变换，但裁剪尺寸仍按camera.zoom计算：固定136×30的surface在zoom=.2时被裁剪、zoom=3时扩大。工程用公开`surface.setSize(136/zoom,30/zoom)`及固定CSS内容尺寸补偿，最终三档截图验证完整。若统一Runtime语义，预期portal尺寸与祖先变换后的屏幕尺寸一致；本轮不改Runtime。

# 历史记录提示

以下为上轮未通过记录。本轮已恢复官方工具，trace 的最新实际错误与工程修复见 [dream-followup.md](dream-followup.md)。不得把下述“Preview 诊断改动”当作当前状态。

# Dream Preview 未通过项与公开 API 复现

Revision: `dream-infinite-20260930-v2`。证据在 `.flamo/reports/dream-infinite/`。

## 原生渲染与读回不一致（尚不能断定为框架缺陷）
运行 `tests/dream-acceptance.mjs` / `tests/dream-camera-probe.mjs` 使用的原装项目 Preview。脚本每帧只调用公开能力：

```ts
const camera = ctx.camera.get();
const corner = ctx.camera.screenToWorld({x:0,y:0});
root.setPosition(corner.x, corner.y);
root.setScale(1/camera.zoom, 1/camera.zoom);
```

初始 native 画面正常。滚轮平移、公开 `camera.panTo` 到 positionX=73600、positionY=50600 后，原生背景和 HUD 消失/露白；GPU 星群仍可见，DOM 品牌仍固定。`current().geometry.worldBounds` 经 `camera.worldToScreen` 换算，按钮仍约 (950,789)，与截图不一致。参见 `long-pan.png` 和 acceptance.json 的 long-pan 样本。

需要客户端进一步定位父层 transform、可见性/裁剪和渲染更新时序；如无法支持逆相机父层变换，需要公开的 native viewport overlay/fixed-space 挂载能力。未访问 ECS/GameLoop，未修改 Runtime 或官方库。此记录不是已确认的框架归因。

补测 Ctrl+wheel 确实改变 zoom；公开 zoomTo(.2)/zoomTo(3) 的 HUD 坐标稳定、背景覆盖正常。品牌在远景截图中未清晰出现，因此品牌跨所有相机状态稳定性仍未通过。Space+拖动与初轮中键拖动均未改变相机，拖动验收未完成。初轮 zoom-far/zoom-near 文件实际是普通滚轮平移，不能当缩放证据。

## 验证工具限制
项目 Preview 诊断改为从公开 `instance.inspectInteractions().trace` 取 trace，并支持 contract.renderTraceAction（不再仅识别 text editor render）。这属于项目本地诊断改动，不是 Runtime 改动；现有工具链哈希校验因此失败。未修改校验哈希或绕过门禁。

真实 verifyInteractionTrace 返回 passed=false：缺失 dream.mounted，完整因果链不成立。已保存工具实际返回；不能用手工 trace 注入补造通过。线上完成门禁无连接，没有服务器完成收据。

## 环境与边界
Chromium145 / Playwright1.58.2 headless，项目随附 Runtime；1440×900 和390×844。实际 RAF 间隔见 acceptance.json；平均约1321ms，不能证明性能达标。GPU/驱动型号未采集。中文字体不可用，截图方框不能证明中文视觉居中；未改变固定字体环境。无批准参考 PNG，像素参考门禁 unavailable。
