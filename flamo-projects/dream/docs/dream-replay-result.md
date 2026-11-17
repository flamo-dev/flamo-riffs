# 彩色星鱼、原点重放、自动流星 — 本轮结果

## 状态与身份
- 输入 revision：`codex_20261001030822_13d68dddb563`。事务晋升后的 revision 由服务器产生，本地不生成 revision 或 completion receipt。
- 实测 Artifact SHA256：`659268efc2653ef91727d0a44b5980d090573f6d34025c7830c09cae89b3c635`。
- 已完成源码/编译验证及隔离 GLSL 浏览器的局部功能验证；**不是发布后六门禁全部 verified**，`isCurrentRevision` 需晋升后由客户端查询。
- 线上复查入口：`/projects/u_5ce5548fa8_dream_a0o30u/preview`。本地测试启动项目自带服务器，测试后停止。

## 实现
- model / painter：七色连续光谱用于主鱼鳍骨、轮廓、网格、尾丝、星点；保持彩色亮芯，不将所有通道拉到白色。保留近锐远软的多宽度轮廓。world 的随机形体使用同一彩色光谱，不再使用白化核心。
- Artifact 真正删除 `778376733:29/30/31/32`；bindings、角色与监听同步删除。只保留 Replay33/34，130×45 标签局部0/0，CENTER/CENTER。
- 首次延时 fit 后保存真实 camera 和窗口尺寸；Replay 同窗口恢复保存值，窗口变化重新 fit 原始构图。恢复原 seed；world/chunk、流星/爆光、scheduler、触摸涟漪、碰撞计数、指针/gesture 全清，世界和 shader 时钟归零。复用同一 shader layer。
- MeteorField：按当前视区生成，正常目标6–12，硬上限14；深度0.2/0.55/1，普通速度30–170屏幕像素/场景秒，成对55–115；每5–10场景秒安排部分会合轨迹，实际同时相对扫掠接触后才爆光。普通补充间隔0.7–2秒，数量不足时立即补充。生命周期6–11秒，屏外130px释放；爆光上限6、4秒消退、屏外200px释放。缩放调整轨迹速度/尺寸的世界尺度，保持屏幕占用有界。不是全局定时爆炸。
- 原有无限分区、正水平漂移、固定品牌/HUD、独立星云和原生触摸保留。GPU仍为2个原生batch，22000点/18000线固定容量和复用缓冲。

## 可复现检查
- `node .flamo/tools/node_modules/typescript/bin/tsc --noEmit`
- `NODE_OPTIONS="--experimental-loader=$PWD/tests/tool-resolver.mjs" node scripts/flamo-verify.mjs`：正式编译、结构、脚本图、ABI与现行runtime-contract完整性通过。
- `node tests/dream-replay-source.mjs`：删除节点/监听、Replay居中、官网安全链接及现行managed hashes检查通过。使用当前runtime-contract，不使用旧报告中已过时的manifest hashes。
- `node tests/dream-replay-model.mjs`：120视区、60000步、±70000及更大纵向位移，0.2/1/3倍率；458次真实数学碰撞，流星峰值8、爆光峰值2；360次确定性清空/恢复；3项相对扫掠正反例通过。这些是算法证据而非GPU证据。
- `PLAYWRIGHT_BROWSERS_PATH=$PWD/.flamo/tools/browsers BACKEND=webgl NODE_OPTIONS="--experimental-loader=$PWD/tests/tool-resolver.mjs" node tests/dream-replay-preview.mjs`

## 真实浏览器证据
输出 `/tmp/dream-replay-preview/preview.json`，当前截图只认 `initial.png`、`pan-zoom-0.png`、`narrow-reset.png`；该目录其他早期截图不算本次最终证据。
- Chromium145，可见headless页面，关闭后台节流，ANGLE/SwiftShader软件renderer，强制GLSL；`nebula.ready`真实观察到，无pageerror。
- 真鼠标触摸、拖动、wheel，外加公开camera设置极端位置：三次Replay从±70000、0.2/3恢复保存的camera `{positionX:-15.999999999999972,positionY:-60,zoom:0.28,rotation:0}`；原seed344733624保持。trace的after时间、shader时间、meteors、bursts、ripples、touches、collisions全0、gesture false。
- 390×600窗口再Replay，fit到 `positionX:-16, positionY:-188.125, zoom:0.22374999523162842`，页脚单按钮和品牌不重叠。
- 自动流星与真实collision有前后位置、速度、接触q和消除计数。完成碰撞后实际点击Replay，原版 `verifyInteractionTrace` **通过，92条真实证据**。首次试跑因Replay先于collision，顺序合同未通过；调整实际测试操作顺序而非放宽合同后通过。
- 页面scrollX/Y=0，visualViewport.scale=1。
- 6秒有界节奏样本11间隔，均值548.46ms、中位533.4ms、P95 600.1ms。**这是RAF/更新节奏，不是GPU呈现FPS，不是硬件性能通过**。尾段原生图元约5200点/8700线、122分区、4–6流星/0–1爆光。

## 未验边界
- 桌面WGSL、实际中文字体、发布后当前revision的六门禁receipt由客户端继续验证；不重复重试已知Linux纯软件WGSL故障。
- 中文字体缺字；400px高的短窗口HUD存在文字重叠，390×600截图未见同样重叠。未宣称所有窗口布局通过。
- 本轮未重新实际点击官网弹窗（源码href/安全属性已检查，保留既有实现）。未完成固定seed的像素定量亮度前后对照、所有缩放的burst截图和硬件性能测量。
- 无批准参考PNG，像素参考门禁 unavailable。参考图片未被当作背景或纹理。
- 未写入/复制旧completion报告。测试产物留/tmp，避免派生目录污染事务。

## 保留能力回归
`node tests/dream-rightward.mjs` 通过：1800项正水平速度采样、300组长位移/时间/缩放、15组扩展上游边界比较。分区峰值317；创建70194/释放69899；完整painter缓冲复用通过（10681点/12497线）。显式不同seed仍能生成不同世界，但Replay按本轮要求恢复原seed，不换seed。数据见 `/tmp/dream-rightward-current.json`，仅为算法与源码回归。
