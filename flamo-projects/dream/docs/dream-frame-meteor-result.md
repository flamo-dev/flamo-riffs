# 同帧 HUD / 视区外流星 — 实施与验收

## 身份与范围
输入修订 `codex_20261001073105_e3ad3eadd998`。本轮测试 Artifact SHA256：
`417edc053cbfe28b0b40fdb558093f0542bb8209b3c939a8729fcf5f859ce777`。
Runtime SHA256：`4234e91a24b5762b7c697c1227352bc61fbb501003ac8a16398569d153e017d7`。
新 revision 由服务器事务晋升后分配；本地不能确认新修订/isCurrentRevision，不复用历史 completion。

## 实施
- `script.ts` 仅在公开 `ctx.onUpdate` 内运行既有时钟、viewport、draw、遥测；没有项目动画 RAF/nextFrame。保留原 performance.now 差值和 0.1 秒上限，不改变软件环境下场景推进节奏。
- `viewport.ts` 在该 tick 读取公开相机，使用一次 `setTransform` 提交根逆相机位置及缩放。编辑态原生文字、布局/字号、唯一 Replay、官方品牌 DOM 均保留。
- Runtime manifest 已包含 onUpdate；生成 `view/api/flamo-runtime.d.ts` 尚缺该签名。项目仅用与 manifest 一致的局部交叉类型接入。未改框架、API 快照或 managed library。
- `meteors.ts` 统一出生函数沿飞行反向射线退出完整视区的扩张边界，头、尾和最宽光晕都在外；飞行方向指向内部。出生 age=0/opacity=0。尚未入场的对象被新镜头暴露时，同一名额重新安置在外并重新淡入。
- 尺寸由 size+depth 共同生成可感知屏幕尺度，屏幕速度固定为 `35 + 1.35 * tailLength` CSS px/场景秒，头/尾/光晕与此一致单调。缩放调整世界速度以维持该关系；不将用户手势引起的相机运动当成流星固有速度。
- 淡出阶段保持相同速度积分；出生等待/淡出都计入最多3条。完整几何离屏才回收；自然寿命终点透明度归零。真实同时间同深度扫掠仍是唯一碰撞触发，配对预测不会强制爆炸。
- 未重设计鱼、珠光、超新星、Shader、世界分区或 Replay。

## 构建与模型
官方 TypeScript、compile、verify（结构、绑定/ABI、generated graph、managed 检查）通过，日志在 `.flamo/reports/dream-frame-meteor/`。首次 verify 未传 loader 的环境错误保留于日志，正确 loader 重跑通过。

- 72,000步 / 60 seeds / 735出生：完整几何在外，数值有限；5,302移动淡出样本；120确定性reset；极端 pan/zoom .0625/8；相机暴露未入场对象重定位且不增加名额。
- 尺寸—实际屏幕速度单调；真实分析扫掠一次消耗及错深度反例。
- 复用超新星回归：17次实际运动世界接触，峰值3，99种拓扑组合，最大667图元；未重跑无关 WGSL 长测。
- 63,063包络样本及39实际 painter图层一致乘透明度、几何尺寸不变。

## 真实连续手势 HUD
正式项目 Preview + 随项目发布 Runtime，Chromium/SwiftShader 强制 GLSL，480×400 CSS viewport。实际鼠标拖动24步、Ctrl-wheel 正反各16次；没有 setCamera 替代手势。原始文件 `raw.json`，计算脚本 `tests/dream-frame-meteor-summary.py`，结果 `summary.json`。

| 动作 | 不同 RAF 时间戳 | 每个原生节点样本数 | 品牌最大位置误差 | 原生最大位置误差 |
|---|---:|---:|---:|---:|
| 连续拖动 | 91 | 91 | 0.000046 px | 0.000035 px |
| Ctrl-wheel 放大 | 57 | 57 | 0.000046 px | 0.000056 px |
| Ctrl-wheel 缩小 | 55 | 55 | 0.000061 px | 0.000046 px |

标题24、提示27/28、Replay label34都测量，净宽高误差最高约0.000023px。缩放约0.28→0.418→0.28。普通视区公开几何/DOM层达到<=0.1CSSpx目标。相机准备→脚本onUpdate补偿→Runtime变换/呈现，在实测中未再出现旧版数像素不同步窗口。

**精度边界**：品牌为同步DOM矩形；原生文字为异步 `current()` 解析后的公开几何投影，不是 GPU 像素逐帧定位。重复 RAF 回调不是独立呈现帧，表中已去重时间戳。实际查看开始、拖动、缩放中及流星阶段截图；中文在Linux为缺字方框，因此不能证明中文光栅形态/字体居中达到亚像素精度。没有批准像素参考PNG，像素门禁 unavailable。

高密度采样测得更新间隔中位519.3ms / P95 2080.8ms，包含异步读取开销，不是桌面GPU FPS或性能通过。此轮有330秒截止，HUD及流星阶段已保存，等待接触时超时关闭浏览器；原始错误保留。另运行轻量 lifecycle Preview补充完整接触/Replay/公开trace，不用伪造事件补齐。

## 生命周期画面
HUD轮 seed `131735309`、普通流星ID1（真实 Replay 后原镜头）：
- 入场截图后遥测：场景0.702、age0.7、alpha0.99955；这不是出生瞬间截图。
- 中段：场景2.402、age2.4、alpha1。
- 淡出：场景3.902、age3.9、alpha0.32153，位置持续变化。
- 固有屏幕速度约113.49 CSSpx/场景秒，尾长58.14px；完整出生边界和初始alpha0另由原始 dream.meteor 事件及逐tick遥测核对。
截图/遥测有采集延迟，不把截图后遥测冒充精确像素时刻。轻量轮数据见 `lifecycle/`；最终状态由后附补充记录说明。

## 未验边界
晋升后同一新revision的桌面WGSL、中文字体/真实光栅、实体触控板pinch、正式六门禁待主线程。未改品牌URL、安全属性和布局；本轮未重新打开官网弹窗。未复用旧completion；build-verified及隔离GLSL验证均不等同于新revision六项verified。

## 补充：真实接触与完整 Replay，完整 trace 未通过
轻量正式 GLSL 轮 `lifecycle/raw.json` 无 pageerror，保留原始52条验证证据：seed **1993432695**；场景 **12.5006秒**、meteor4 与可见运动星点 `1/-1/0/0/0/1` 同深度 **0.55** 扫掠接触，世界触点 **(472.1869,168.9158)**；区间12.4006→12.5006、q≈0.408768，消耗一次。实际查看 `real-contact.png`，截图后遥测14.3006秒（爆发约1.8秒，非白热芯瞬间）。该轮轻量帧间隔中位约540.95ms、P95约599.1ms，仍非桌面性能结论。

真实两次点击 Replay 均恢复原seed、相机(-16,-60,0.28)、time/shaderTime=0及全部流星/爆发/涟漪/触摸/碰撞瞬态=0。`birth.png`是文件名，不代表像素拍摄在age0；该图取得时对象已进入，出生在外且透明度0的证据来自原始出生事件和模型/逐tick遥测，而不是将该截图伪称出生瞬间。

此轮正式 `verifyInteractionTrace` 返回 **passed=false，missing=dream.pan**；短拖动未产生该事件。测试随后改用带真实等待的连续鼠标拖动补跑，`lifecycle-final/raw.json` 已记录 dream.pan、dream.zoom、dream.touch、dream.replay，但进程在entry截图阶段以 **143** 退出，未取得完整回执。退出原因未确证，不归因于Runtime。保留最后成功快照和日志。**不拼接不同轮trace、不放宽行为合同、不宣称完整单轮trace通过。**

最终 typecheck / 官方 verify 再次通过，Artifact hash不变。最终状态：**build-verified；隔离GLSL的HUD连续手势、流星阶段、真实接触及Replay分别有证据；完整单轮公开trace与晋升后六门禁未完成。**
