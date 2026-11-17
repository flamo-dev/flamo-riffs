# Feeder console 消费链定位 — 实施前计划

输入 revision：codex_20261010091426_120efa2e8bbd；对象209:639，原实例371:315。

本轮不改scene、surface、bindings、图片或其它组件逻辑；不运行全工程合同生成器。
现有脚本/installed bindNumber 签名一致。props receipt只能证明属性入口接受，尚无watch/layout/setWidth的Chrome证据。

职责与实施：
- 仍由nodeArtifacts维护四参数；Preview boolean编辑投影是宿主已知缺口，本工程不绕过。
- 仅在现有src/components/coal/device.ts的feeder分支扩充诊断，不新增模块/业务接口。依赖已有ctx公开API和原installed bindNumber；ctx.trace不保证出现在浏览器console，因此同时输出console.debug的不可变JSON快照。
- 区分setup、props watcher、apply、helper read、layout notification、reference、preflight、setter返回、nextFrame probe。捕获错误后原样抛回，不改变helper门控/所有权或吞掉异常。
- 每次feeder mount进行90秒、每秒一次、仅变化时输出的只读props采样，帮助区分watch未触发与bus接管；dispose清理，无永久timer，无凭据/全局对象转储。
- 公式/无效策略不变，仅两bar width写入，根live contentBox reference；commit只依据真实probe，不将setter返回当成功。
- 运行typecheck、真实installed helper源测试及合同/图检查；source handle double明确不算Runtime证据。编译由轮后服务器完成，避免本轮全量生成文件扰动。

## 外部Chrome读取（必须用本轮服务器新提升revision，不是旧91426）

1. 打开DevTools Console，开启 **Verbose**（console.debug），勾选Preserve log；过滤 `[coal.feeder]`，选正确Preview/frame执行上下文。清屏后重新挂载/重载test页。
2. 必须看到`diagnosticVersion: feeder-console-v1`和`coal.feeder.setup`。没有则先检查新revision/脚本import/挂载，不能直接判断watch失效。每条JSON带nodeId、instanceId、单mount序号，勿混用其它实例。
3. 在mount后90秒内，按顺序提交position1=0、26.5、53，再position2同序，每次等待至少两帧。保留面板props receipt与对应console JSON；根实际contentBox为282时目标宽是0/141/282，但以reference记录的live值为准。
4. 每次应看到`props` → `apply` → `helper-watch/read` → `reference` → `preflight/return` → `width-submit` → `setter-return` → `width-readback`。初次绑定由`layout-notification`触发；无效值会helper-read valid=false并按installed策略保留宽度。相同值/extent由helper去重，不能以缺少再次提交判断错误。
5. 导出完整JSON日志，不只截warn/error。返回同时拍到面板值和轨道的截图，以及原实例身份、revision、操作值和时间。`setter-return`明确不是commit；`width-readback matched`只说明当帧probe宽度，不证明像素/HUG/MAX执行或之后无其它writer覆盖。
6. `props-sample`为每秒只读采样（只在变化时打印，90秒后自动结束；remount可重启）。sample值变但watch序号未变是watch通知缺失的证据；sample与watch都不变但面板读回变，先核对实例和props绑定，不能仅凭面板定位layout。bus-update/controlledByBus=true说明项目既有bus控制权可能使面板props未进入apply，必须带owner/epoch一起回传。

断点及责任候选（均须真实日志确认）：
- setup缺失：脚本模块加载/定义挂载链。
- props未进入apply：实例props响应/项目bus控制权。
- helper-read valid=false：输入验证；reference null/design：Runtime layout measurement/materialization gate。
- reference owner=content或preflight-error：核对解析的根/目标身份及layout ownership；不要改HUG层。
- width-submit但setter-error：Runtime command写入入口；setter-return但fresh probe不符：command commit/probe/竞争writer需进一步定位，不能断言HUG求解错误。
- width probe确实匹配但右端/HUG/icon未随动：再采集父框/图标的真实几何和截图，交Runtime layout/constraint执行子系统，不以业务x补偿。

## 本轮证据边界

本地Runtime bundle、声明、10个API manifest与receipt哈希一致；receipt buildReceipt：
`1efd458171aff5d6a38bc44a0cd41b7ca3ce8dc2dc87e8dd489fca29f1162760`。
本地runtime-contract仍为semantic-v1，未找到命名component-script-capabilities-v1字段；该能力/matching状态来自用户上一轮MCP确认，不能把两者混为一次本地真实运行证明。

已证明的工程诊断缺口：上一轮只调用ctx.trace，不保证转发到Chrome console；现在feeder日志双写console.debug并记录helper真实门控。尚无真实Chrome新trace，因此width不动根因仍未证实，未改变业务算法。
boolean问题沿用用户已定位证据：Server Preview getEditableComponentPropertyKind对无figma.id的script-only boolean返回null，而number放行。最小复现就是本组件gmjRun1 boolean/default false + 直接脚本consumer；禁止假binding或改类型绕过。
停止图/coalInput在旧revision的Chrome通过来自用户回报，不冒充本轮重测。

真实Runtime/Preview、0/26.5/53的原生HUG/MAX/icon跟随、resize、两实例隔离、remount、动画生命周期与verifyInteractionTrace本轮均未执行。source测试使用实装helper和bundle reactivity，但geometry/host为double。
