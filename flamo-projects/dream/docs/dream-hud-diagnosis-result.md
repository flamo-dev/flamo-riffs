# 固定 HUD 连续手势诊断结果（仅诊断，未发布）

## 身份和范围
- 实读输入/结束 revision：`codex_20261001064511_e9b806a2996f`。
- Artifact SHA256（前后相同）：`3d32dabb718d77e650ea1936343c21a25e9d98178143cabd41211005cd24c1ba`。
- 没有新 revision；未修改 src、Artifact、bindings、生成脚本、Runtime 或 managed library，未执行 compile/pull/push/发布或复用 completion。
- 实验使用项目原样 `.flamo/preview/index.html`、`main.js`、`.flamo/runtime/`、现有生成交互脚本。静态路由适配器不是替代渲染器。浏览器实际创建 webgl2，收到真实 nebula.ready、dream.mounted、dream.pan 和123条 dream.zoom。

## 结论
**结束坐标正确不等于运动过程中稳定。当前把世界根做逆相机补偿的实现，存在可复现的相机/节点提交不同步窗口。** 同一 RAF 的项目 draw 已执行补偿，品牌仍偏移，下一次 Runtime 周期才归位。原生文字公开几何投影也出现位置和尺度偏移。不是只有 subpixel 舍入；也没有证据表明原生文字被持续重复缩放两次。

这证明当前项目机制不满足固定 HUD 需求，但**不等于已定位框架内部具体函数缺陷**。未读取私有实现，不能据此虚构 ECS/提交/GPU 的内部先后或框架源文件路径。

## 真实代码路径
`src/nodes/star-sea/viewport.ts:18–27`：
```ts
const w=window.innerWidth,h=window.innerHeight,camera=ctx.camera.get();
const zoom=Math.max(.0625,Math.min(8,camera.zoom));
if(camera.zoom!==zoom)ctx.camera.zoomTo(zoom);
const corner=ctx.camera.screenToWorld({x:0,y:0}),center=ctx.camera.screenToWorld({x:w/2,y:h/2});
if(corner.x!==lastX||corner.y!==lastY){root.setPosition(corner.x,corner.y);lastX=corner.x;lastY=corner.y;}
if(zoom!==lastZoom){
 root.setScale(1/zoom,1/zoom);
 brand.setSize(136/zoom,30/zoom);lastZoom=zoom;
}
```
HUD 是 StarSea 根的子节点，不是真正不受世界相机影响的原生屏幕层。位置与逆 scale 分开写；lastX/lastZoom 缓存的是已请求值，不是已渲染值。品牌位于同一根下，另有 DOM surface 尺寸补偿；不能将这一尺寸补偿泛化为所有原生文字的“双重 transform”。标签34保持0/0、130×45和双轴CENTER，未发现逐手势改字号路径。

`src/nodes/star-sea/script.ts` pointermove 路径：
```ts
const c=gesture.camera;
ctx.camera.panTo({x:c.positionX-dx/c.zoom,y:c.positionY-dy/c.zoom});
active=false;e.preventDefault();return;
```
这里不调用 viewport.update。`gesture.camera` 是 pointerdown 镜头，dx/dy是累计view位移。实测zoom=.28时每步view(6,-2)对应camera position变化约(-21.4286,+7.1429)；这会放大低倍率下的单步跳变量，应在后续修复核对 panTo 坐标单位，不能盲加取整。

`script.ts:88–105` 每次独立 RAF：
```ts
function draw(now:number) {
 // 更新时间、shader、pointer、ripples
 const view=viewport.update();
 const frame=updated?painter.render(/*...*/):previousFrame!;
 // 真实事件、dream.zoom、telemetry
 raf=requestAnimationFrame(draw);
}
raf=requestAnimationFrame(draw);
```

## 注册、读取和帧内顺序
1. 正式 Preview `.flamo/preview/main.js` 先 createFlamoRuntime、await runtime.mount、fit，再 activateInteractions。项目 setup 最后注册 draw。
2. 浏览器实际注册栈：Runtime `bound renderFrame` 来自 `/vendor/flamo-runtime/index.es.js:5:2097615`；项目draw来自生成 `register.definition.js:171:15`。这些是**浏览器栈中的构建产物定位**，不是对框架源码的猜测。anonymous回调包含Runtime/探针，不能按同名认定全部属于一个系统。
3. 同一RAF timestamp内观察到 Runtime回调入口/返回 → anonymous异步读回调 → 项目draw。**回调返回不等于异步Runtime工作/GPU提交完成**；仪器不await或改写回调的返回值。
4. 正常范围内，viewport.update的get与两次screenToWorld在同一同步JS段；没有发现两者之间await。它取的是**项目draw执行时公开的当前camera**，不是有原子呈现承诺的camera revision。相机缩放平滑更新后，先前已提交的root逆scale仍可属于上一代camera。
5. 超出clamp范围时先zoomTo再screenToWorld，存在另一条潜在混代路径；本次zoom .28–.41771未触发，不把它列为本次根因。

具体重复样本（页面performance.now毫秒）：
| 时刻 | 回调阶段 | camera X/Y/zoom | 品牌 DOM x/y |
|---|---|---|---|
|43349.7|draw before|-508.85715 /104.28577 /.28|193.42871 /353.85712|
|43351.3|draw after（已调用viewport.update）|同上|193.42871 /353.85712|
|43588.6|下一RAF Runtime入口/同步返回|同上|193.42871 /353.85712|
|43591.8|下一RAF anonymous前|同上|172.00002 /361|
|43594.7|下一draw后|同上|172.00002 /361|

这是一段**跨Runtime周期的补偿生效延迟**，不是仅在函数内部瞬间出现且不跨周期的误差。不声称所有设备严格固定延迟恰好1个GPU呈现帧。

## 连续手势测量
480×400，DPR默认1；真实pointer拖动24步，每步(6,-2)，随后Ctrl-wheel ±25各16步。无相机写入式测试代替手势，无伪造trace。浏览器scrollX/Y=0、visualViewport.scale=1，排除页面本身滚动/页面缩放。

| 对象/测量 | 静止基准 | 拖动期间范围 | 放大期间范围 | 缩小期间范围 |
|---|---|---|---|---|
|品牌DOM x|172|172–193.429|170.714–172|172–173.090|
|品牌DOM y|361|353.857–361|361–363.654|358.751–361|
|标题24公开投影x|18|18–39.429|14.176–18|18–21.241|
|标题24公开投影y|34|26.857–34|31.264–34|34–36.319|
|Replay34公开投影宽|130|130|130–132.143|128.184–130|

标题公开投影宽基准432，放大最大439.121（约+1.648%），缩小最小425.965（约-1.397%）。源码fontSize仍58/13；变化来自净变换尺度，不是重设字体大小。brand CSS内容宽保持136±0.00002，不表示原生文字尺度也稳定。

停止输入后缩放仍缓动收敛，`zoom-*-settled`阶段开头仍有残余偏移；不能把该阶段所有样本视为最终状态。末尾恢复标题约(18,34)、Replay(175,292)、品牌(172,361)。静止舍入在1e-5量级，不能解释运动时1–21px偏移。

### 证据精度与未验边界
- 品牌是同步 `getBoundingClientRect`，属于真实DOM布局位置；不是从相机公式推算。
- 原生节点使用公开 `EntityHandle.current()` +公开worldToScreen。记录解析时刻与cameraAtResolve，**不是同步GPU文字像素检测**。读数延迟中位595.4ms，最大1180.6ms；不能用它断言某个更早RAF的文字像素。它支持几何瞬态诊断，但与DOM同步证据必须分开理解。
- `raw.json`保存4423个逐回调/telemetry样本；原生异步读数只在telemetry采集，避免每个RAF探针再次触发current所带来的反馈循环。首轮探针曾超时，已丢弃，最终文件来自修正后完整运行（errors=[]），不将首轮作为证据。
- 已实际查看baseline、drag-8、zoom-in-moving截图。截图展现当时作品与HUD；captureScreenshot可能在相机已经补偿后抓取，**不声称截图捕获了数值峰值**。8张截图都有前后相机记录。
- Chromium145.0.7632.6 / ANGLE Vulkan SwiftShader，draw间隔中位300ms，P95 566.6ms；探针增加负载，不是原作品性能基准，也不是GPU FPS。不可把这些时间换算为桌面60Hz延迟。
- 实测Ctrl-wheel平滑缩放，未模拟/测试实体触控板pinch。Linux中文字缺字；未进行GPU逐帧文字光栅跟踪，桌面WGSL/中文字/物理pinch仍需复核。

## 最小可继续实施方向（本轮未实施）
1. 优先由公开原生屏幕坐标层承载HUD，世界相机变化不参与其变换，仍使用原生文字和按钮，而非将作品替换HTML。
2. 若Runtime现有能力不能做到，最小公共机制应保证：**相机手势/平滑更新完成后、节点变换传播与绘制提交前**，提供同一帧不可变camera/viewport快照；允许批量提交HUD逆变换，保证该帧生效。只有onCameraChange通知、再套RAF、await nextFrame不足以保证该条件。
3. 项目侧同步pointermove中相机/根写入可作局部验证，但不能单独解决Runtime内部wheel平滑过程，不应声称全面修复。位置与scale应原子批量写入，重审根缓存和panTo坐标单位。
4. 最小复现：一原生文字子节点+同根DOM品牌，独立RAF按上述代码逆补偿；启用平滑Ctrl-wheel及panTo；比较每次camera变化后的HUD位置。具体公开合同位置 `view/api/flamo-runtime.d.ts:407` CameraApi，EntityHandle.current约383行。该合同没有相机后/绘制前阶段或同帧提交保证。
5. 已定位项目源路径和运行时构建栈；在禁止检查框架源码的边界下，**无法提供确切框架源文件/内部函数根因**。主线程可用构建栈及上述复现定位，勿虚构或绕过私有接口。

## 文件和重跑
- `docs/dream-hud-diagnosis-{plan,result}.md`
- `tests/dream-hud-diagnosis.mjs`、`tests/dream-hud-diagnosis-summary.py`
- `.flamo/reports/dream-hud-diagnosis/{raw,summary}.json`与8张PNG。
- 工具安装限定`.flamo/tools`（Playwright1.58.2与Chromium）；无业务源码修改。
- `PLAYWRIGHT_BROWSERS_PATH="$PWD/.flamo/tools/browsers" node tests/dream-hud-diagnosis.mjs`
- `python3 tests/dream-hud-diagnosis-summary.py`
- 有界临时静态服务与浏览器已关闭；未启动长期服务。此为诊断证据，不是六门禁verified或新版本验收。
