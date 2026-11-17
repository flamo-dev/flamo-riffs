# 彩色星鱼 / 原点回放 / 自动流星

基准 Artifact revision: codex_20261001030822_13d68dddb563。参考鱼图已目视检查；不作为纹理使用。

- 保留现有 model/world/painter/viewport/script 项目层职责。model 提供连续分区彩色谱，painter 使用彩色亮芯及深度加权宽轮廓，不拉白全部 RGB。
- 新增 `src/nodes/star-sea/meteors.ts`：项目艺术/模拟层，仅依赖 model/world 的数学与 View 类型。现有定时全局爆炸无法表达真实相对扫掠碰撞，故新增有界视区流星模拟；复用既有 painter GPU 缓冲，不创建节点。14 流星、6 爆光上限，三层深度、不同速度，成对轨迹真实相交后才产生爆光。
- Replay 捕获首个正式 fit 后真实 camera；同窗口恢复该基线，窗口变化后重新 fit 原艺术边界并记录新基线。恢复同一初始 seed、时钟、粒子、指针、分区和独立 shader 时间，不重建 shader。
- 删除 Pause/Meteor 原生节点、标签、roles 和事件。仅 Replay 保留 130×45 原生居中文字，固定页脚。
- 更新行为合同，保留正式验证要求。测试产物写 /tmp，不能将旧 revision completion 当作本次通过。Linux 软件 WGSL 已知故障不重复排查。
