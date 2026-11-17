# 梦境右移与彩色星云准备 — 2026-10-01

## 范围与模块设计

- 基线 Artifact revision：`codex_20261001005213_851849d0687a`。保留当前 Artifact 的 `dream-radial-centers-20261001` 事务信息、原生场景、脚本角色与 `dream.star-sea@1.0.0` 绑定；没有手写新 revision 或线上完成回执。发布由 Orchestrator 事务完成。
- `src/nodes/star-sea/world.ts`：项目美术/空间分区策略，依赖已有 `model.ts` 的 PRNG、Point。修改现有模块，不扩展 Runtime 或 managed library。
- `src/nodes/star-sea/nebula.ts`：新增项目美术模块，仅导出 WGSL/GLSL 函数字符串，无运行依赖或副作用。现有点线批次不能表达连续彩色云雾；此模块尚未被 `script.ts` 引用，不冒充已具备 Shader API。
- `tests/dream-rightward.mjs`：项目测试，仅依赖编译后的项目模块和 `.flamo/tools` 中的 TypeScript。不会写 Runtime trace 或任何完成收据。

## 已实现

随机分块实体（五类星群、星点及其辉光）提高 RGB 和透明度，保留远/中/近层级。基准 alpha 从 `.19/.32/.54` 调整为 `.30/.46/.70`，线条系数 `.60 → .76`，雾光 `.017 → .023`，远层粒子 `.32 → .44`。没有提高 HUD 亮度或改写原有星鱼、流星/紫色碰撞艺术效果。

每层两条速度流带；速度基值由梦境 seed、层和流带稳定生成。实体独立随机 phase/frequency 产生轻微速度变化，垂直摆动幅度减至分块的 `.009`。固定相机与缩放下，所有随机实体的**中心**水平速度有严格正下界：`step*(.0045-.012*.07)>0`。形态呼吸与旋转允许单个顶点相对中心左右变化；不是把每个顶点都限制为向右。

按 `cameraCenter/unit - dreamTime*streamVelocity` 反查源分块；不是把原画框/整片世界周期搬移，也没有坐标取模。缓存 key 包含层/LOD/流带/绝对分块坐标，hash 不再先将坐标截断到 32 位整数。离开视区及辉光缓冲的分块删除，新进入的上游分块生成；重访相同 seed/坐标保持确定性，而非每帧抽样。hash 是有限 PRNG，不承诺数学意义上无限空间绝无哈希碰撞；实现无主动周期铺贴。

选择/释放边界包含最大半径、呼吸、雾光及中心摆动。相减后再乘屏幕尺度，避免先累计巨大屏幕位移。三层视差、LOD 混合、梦境暂停时间源及重播 seed 沿用既有路径。新增 `created/released` 计数随原有 frame 数据返回，不新增节点、batch 或每帧 trace。

## 验证

依赖版本沿用 `.flamo/tool-packages.json`：TypeScript 5.7.3，安装在 `.flamo/tools`，npm cache 同处工具目录。没有创建 `.pnpm-store`、改官方工具或预期 hash。

运行：

```sh
node .flamo/tools/node_modules/typescript/bin/tsc --noEmit
NODE_OPTIONS='--experimental-loader ./tests/tool-resolver.mjs' node scripts/flamo-verify.mjs
node tests/dream-rightward.mjs
```

使用既有测试依赖 resolver（向子进程继承 NODE_OPTIONS），原版 verify 通过：编译、公开 surface 同步、脚本图、Runtime receipt/toolchain hash。未改验证器。最初仅给父进程传 loader 时，子进程报 `TypeScript is required to compile node scripts`；修正调用环境后通过，非 Runtime 缺陷。

本轮静态/算法结果：

- 300 次远 pan 与时间推进，包含 0.2/1/3 及中间缩放，峰值 309 分块；累计创建 66,862、释放 66,575（合计多次换视区，不是并发量）。
- 随机世界峰值 4,599 点、2,629 线。60 帧完整 Painter 测试含星鱼、触摸涟漪、流星和紫色碰撞，峰值 6,676 点、4,484 线；两个批次及 Float32Array 缓冲引用保持不变，低于 22,000 点/9,000 线容量。
- 1,800 个速度样本全部为正，最小约 `.003937` 分块/梦境秒。15 组更大视区对照（包括很晚时间和流带跨格附近）验证可见图元没有因漏取上游块而消失。
- 同时刻重复绘制一致，跨远位置返回一致；不同时间（含名义跨格周期）及重播 seed 的几何不同。所有颜色/呼吸相位参数采样均比旧配方更亮。
- 三按钮持久 `130×45`、局部 `0,0`、双轴 CENTER；官网 href、安全新页属性及脚本/Artifact 绑定静态检查通过。HUD/brand/交互入口源码未改。
- 当前编译后 Artifact SHA-256：`d83143eb2e8ed08d45ddef00baf6b52098f2617ce25d934c8f5382f02ece07e1`。这些结果不是发布后 revision 的验收证据。

本轮未启动浏览器/服务器，不复用上一轮正式 trace 通过作为本轮运行态通过；未生成新的 `.flamo/reports/latest.json` 或 completion receipt。测试日志输出到临时目录，避免派生证据污染工程 revision。FPS、GPU 实际效果、中文实字居中、最终 revision 真实点击/trace 仍需发布后的 Preview 验证。无批准 PNG，pixel parity unavailable。

## 待正式 SDK 上线后接入

`nebulaWGSL` / `nebulaGLSL` 是对应的 `flamoFragment` 函数及私有纯数学 helper，没有资源声明/入口（`@group/@binding/@vertex/@fragment/#version/main`）。四层 FBM、域变形、细丝和独立慢速色彩变化准备表达紫/洋红/蓝绿/金色辉光；标题和页脚区域柔和压暗，无相机输入。

待官方 `ctx.createShaderLayer` 真正出现在声明与 snapshot：

1. 在 `script.ts` 创建 background 层，等 `ready`、检查 `status/error`，失败继续保留原有原生背景；不伪造类型或调用私有 GPU。
2. 必须核对原生不透明根背景与 shader 的绘制顺序。background 层位于原生场景前，不能盲目接入后被根背景完全盖住；仅在 ready 后通过已支持的公开 API 调整背景，并在失败/卸载时恢复。
3. 用可暂停的梦境时间显式 `setTime(state.time)`。函数内部不同时间速率使云形/颜色独立缓变，但暂停必须共同冻结；重播与 seed 的参数映射接入时再确定。
4. 验证 fixed-screen resize、颜色/动态、文字对比度、GPU 两后端编译和开销。现在只通过字符串合同静态检查与 TypeScript 检查，**未 GPU 编译、未接入、未视觉验收**。
