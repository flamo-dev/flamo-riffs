# 触得到的星海：开发与验收

## 模块归属

|职责|层与路径|直接依赖|
|---|---|---|
|固定种子、星群、星鱼几何和运动|用户工程 src/nodes/star-sea/model.ts|数学函数，无框架依赖|
|批次缓冲、发光星点、细丝、流星和涟漪|用户工程 src/nodes/star-sea/painter.ts|model，公开 createShapeBatch 合同|
|Runtime 事件、时钟、暂停、重放、生命周期|用户工程 src/nodes/star-sea/script.ts|公开 defineNodeScript/ctx，model/painter|
|交互合同|src/interactions/contracts/dream-star-sea.behavior.json|工程兼容性校验|
|可编辑静态构图|view/data/artifact.flamo.json|Flamo durable authoring service|

已有官方库提供管道运动等领域行为；星鱼拓扑、碰撞编排和梦境连续吸引场属于本作品，直接组合公开 Runtime 基础能力。不给 Runtime 增加梦境业务。创作时发现生成类型缺 createShapeBatch，已修复框架类型生成器，再为本工程重新生成声明、dev/verify 工具与匹配的 Runtime contract，通过官方 capability bootstrap 更新 ABI 凭据；工程直接使用公开类型。

## 实施

1. 读取空工程与版本，备份目标工程。
2. 通过官方 DesignService 的 typed author dry-run/apply 创建图层，保留 revision CAS 和事务回执。
3. 在 src 编写模块和合同；绑定返回的真实节点 ID，再通过项目原编译脚本产出 Runtime 模块。
4. 所有动画资源绑定脚本生命周期；销毁取消 RAF、清理临时批次，恢复设计态替身；避免逐帧创建场景节点。
5. 真实 Studio/Runtime 验证静态构图、自动运动、碰撞、指针回应、暂停/继续/重放和错误。

## 验收门禁

- 类型检查与项目 verify/编译通过。
- 真实 Runtime 挂载且无脚本异常；输入引发 dream.touch / dream.meteor / dream.pause / dream.replay 轨迹。
- 观察不同时刻星群位置、展翅变化与碰撞光芒，暂停时梦境时间不前进，重放恢复初始时刻。
- 以真实截图评估美术；无批准参考图，像素一致性门禁记为 unavailable，不自截图自证。
- 不把既有管道粒子量测当作本场景帧率。记录本次实际预览证据与未覆盖设备。

## 已完成的构建验证

- 目标工程 `bun run typecheck`、源脚本编译、`bun run verify` 通过；真实脚本图检查兼容性与 ABI 均通过。
- 最新构建日志及图保存在 `.flamo/reports/latest.json`、`.flamo/reports/dream-build.json`、`.flamo/reports/dream-verify-build.log`。
- 框架定向回归 26 通过、3 个既有 legacy 用例跳过，架构检查通过。框架源码已修复，未发布全部生产服务；本工程已应用生成产物。
- `tests/dream-preview.html` 嵌入真实线上 Preview，仅通过公开诊断接口读取状态、保存 completion；验收使用实际鼠标输入。

## 真实交互验收

2026-10-01，revision `codex_20260930190247_99255c935e42`，线上 Preview 完成 `verified`，source / graph / mount / route / behavior / visual 六项均 pass，requiredTraceActions 无缺失。完整回执见 `.flamo/reports/dream-interaction-verified.json`。

实测输入：点击星鱼区域触发涟漪；召唤流星后约 2.8 秒撞击并散成紫色星尘；暂停/继续两次 trace 的梦境时间同为 42.554 秒，间隔实际约 27.9 秒；重放 trace 恢复 time=0。画面保留 34 个可编辑节点，运动星点/翼脉使用两个瞬态实例批次，不逐帧增加场景节点。

限制：这是桌面鼠标与实际线上 Runtime 验收；未测手机触屏、手势摄像头、VR 或跨设备帧率。画面变化证据不代表与用户主观梦境的像素一致性。设计态保留静态构图，进入运行预览后播放。
