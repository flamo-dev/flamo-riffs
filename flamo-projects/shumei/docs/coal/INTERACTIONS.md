# 166:730 行为与验收

源：`src/components/coal/`。当前具体设备195个，定义行为经 of 继承，局部非定义节点绑定 leaf.ts。对象输入/数值输入/未知归一化见model.ts；配置节点、实际slot定位见mapping.json。所有可变状态都位于 setup/mountDevice 闭包，消息按 runtime nodeId 定向，owner+epoch过滤回执；ctx管理订阅，卸载取消计时器/订阅；皮带轮不启动RAF或写旋转。

## 已执行源验证
`node --loader ./tests/coal/loader.mjs tests/coal/source.test.mjs`

覆盖：运行/停机/未知；三通左右九组合及双开；给煤机0/53相反填充（固定煤仓参照线全行程280/280，非静态122/142）；犁煤器九组合与宿主已算LM三态；0..15/0..2边界限幅；14x5报警；快照缺失清理；双实例定向及返回副本；RAF停止、销毁取消监听、重建未知；所有 slots 对原合同完全相等。

这使用公开API形状的 mock，**不等于实际 Runtime 或像素验收**。结果在tests/coal/results.json。

## 必须继续的 Studio / 正式包真实浏览器验收
1. 提升任务结果，打开预览，检查 debugScripts() 无错误与 getCoalState 的 runtimeNode/receipt/errors。setter回执不是像素证据。
2. 在同页安装两个正式导出的实例，分别投影真实Robot、Alarm、电流、料位、水位slots；仅更新A，B保持未知。
3. 三态、ST左右/同时/未知、位置0/53/越界、LMQ LDW/TDW含未知、LM true/false/null、液位上下限和缺失、70报警逐项。
4. 核验运行图片颜色/停止图片颜色，轮子始终保持作者角度、原有管道煤流开关、GIF可见性，布局参考宽改变后的比例；截图确认没有布局破坏。
5. detach/reconnect 两个实例，检查残留RAF、document命令监听、ctx bus、宿主slot事件清理；重新连接恢复元素保留的最新 uiBindIds 快照；缺失值为未知。
6. 保存项目 preview trace，再执行 `await window.__flamo_project.verifyInteractionTrace()`。本隔离任务未取得这个报告，不记为pass。

## 已知缺口
- GIF仅隐藏，公开API无解码器pause能力；不可宣称实际播放游标停止/重置。
- 依赖现有图片表达运行红色/停机白、青或绿，尚无真实渲染截图确认。未知隐藏运行和停止图，保留本体布局。
- 第二给煤机源名称1B与配置2A冲突，按提供配置2A接线，需要现场确认。
- Alarm配置完整ID未提供，采用README约定并兼容belt-first别名，需宿主确认。
- 宿主真实slot DOM由coal-robot-cockpit负责，本工程提供语义和保留锚点，不访问或修改外部项目；缺少投影时不伪造数值组件。
- 正式ZIP和真实浏览器trace待联机Studio完成。不可仅凭源测试宣布上线验收完成。

## 合同修复验收（coal-2）
`python3 scripts/coal-contracts.py` 可重复同步煤系统行为合同与 bindings，不改变 scene/surface。
`python3 tests/coal/contracts.test.py` 检查全部169个绑定的合同版本、角色基数、目标存在性，以及153个输煤脚本的合同匹配。
本轮 typecheck、compile、项目本地 verify、213条 source-mock 断言通过；不能据此声称真实浏览器、verifyInteractionTrace 或服务器图验证已通过。实际 Web Component ZIP 尚未取得。

## 2026-10-09 属性驱动与物理宽度
以 [UI-BIND-IDS.md](UI-BIND-IDS.md) 为本轮增量：uiBindIds 完整快照、真实 mounted role/bar 写入和 probe；未通过 browser Visual gate，不以源 mock 替代。

数组属性增量：[UI-BIND-IDS-ARRAY.md](UI-BIND-IDS-ARRAY.md)。业务 ID 归一化后仍复用既有全快照和局部设备路径，无 HTTP、slots 或物理行为改动。

## 2026-10-10 静止轮子 / 原生宽度 / 三通 / Robot

设计与边界见 [STATIC-WHEELS-NATIVE-LAYOUT.md](STATIC-WHEELS-NATIVE-LAYOUT.md)。本次源 mock 20,136 断言通过，195 个映射保留；typecheck、交互编译及本地生成图检查通过。上一版 c 包 24/24 与 195/195 是用户提供的历史浏览器证据，不代替本轮浏览器验收。

`getCoalState().devices[].receipt.visual.nodes[].measurement` 新增：
- wheel：`rotationDegrees`（committed local transform atan2 分解）、`transform`；不写角度。
- feeder：实际 `layout` 及 `children[]` 的 targetNodeId/sourceNodeId/probe/layout；容器334:306/317也纳入测量。Frame 宽度继续在同一节点 `probe.size.x`，图标实际位置见子节点 probe.transform / bounds，不从 width 合成。
- tee：`appearance` / `compositing` 来自物理 handle.current()；`layerProbe` 为 committed visible/opacity/bounds。observed 只表明读取与声明的 visible/width 写入一致，**不等于像素高亮或原生随动通过**。

未知三通保留正常停止管；运行只启用对应支路与上管；兼容双开。Robot.animation true=running、false=stopped、null=unknown，仅给宿主提供诊断。JS uiBindIds 数组、default[]、attribute:false、47 slots/59 targets不变。

新包浏览器仍需：运行/停止/未知及双实例/重挂后的轮角度静止且煤流正常；给煤机0/26.5/53、越界/空快照实际宽度与原生图标跟随；三通左+上、右+上、停机/未知的真实截图与外观；宿主Robot播放暂停。当前没有根因证据证明第二图标会跟随，不能把 setWidth 成功认作完成该项。

## 当前原生随动 / Paint 验收
见 [NATIVE-FOLLOW-PAINT.md](NATIVE-FOLLOW-PAINT.md)。宽度一致不等于图标随动；visible一致不等于像素高亮。三通只切原运行/停止形状互斥 visible，空 appearance.fills 不失败，不重填色；截图仍必须单独验证。详见 [TEE-SHAPE-VISIBILITY.md](TEE-SHAPE-VISIBILITY.md)。新增geometry/constraints及children的实际geometry/constraints供跨快照比较，无模拟位置写入。
