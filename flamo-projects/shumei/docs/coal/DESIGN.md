# 166:730 输煤组件：设计与开发说明

基线 revision: artifact-rev-1791511428893-cxcem0。只修改该边界及实际依赖的局部行为，不改变 scene 布局、资源、名称或任何 slot 合同。

## 模块分层
- `src/components/coal/model.ts`：项目领域层，纯 TypeScript 全快照解析、三态、限幅、数值格式；无 Runtime/网络依赖。通用库不知道杨伙盘配置 ID，因此项目负责映射。
- `mapping.ts`：从现有 scene 的具体 ID 固化配置映射，不在浏览器按名称猜测。
- `device.ts` 及 `device-*.ts`：组件局部层，依赖公开 NodeScriptContext；定义脚本经 `of` 继承。边界仅发送目标实例消息，依赖自己修改自己的子节点。
- `script.ts`：166:730 公共 API，完整快照替换、实例寻址、设备回执；无平台请求。

## 明确映射与歧义
第二给煤机实例 209:721 源名“叶轮给煤机-1B皮带”，本配置仅提供 GMJ_2A，因此显式接到 GMJ_2A（不是重命名源）。需现场确认配置物理对应。5B落煤组278:3728中278:3726、278:3765、298:432名称误写5A，按父组映射5B。6D按主配置ID，不生成6AD点。

## 数据合同
`applyPointValues(values)` 接收 Record<string, number|boolean|null|{left:boolean|null,right:boolean|null}>。每次是完整快照，缺失/非法均未知。ST支持左右同时运行；上支 true 优先，两侧 false 才停机，其余未知。LM由宿主计算，本组件不重复推导平台tag。LMQ使用同名+LDW/TDW两个布尔量，不把缺失当false。true/false/null分开保留。
`getCoalState()` 返回本次规范化状态、设备回执及缺少挂载的节点；回执是 setter 已执行的证据，不是像素验收。

电流/原煤仓料位/消防水位和Robot/Alarm仍是真实slot；源提供原始值、限幅值、两位小数文本、ratio和报警分项，宿主投影内容必须消费这些语义。源不伪造机器人接口，不覆写宿主DOM。Unknown文本为--，ratio为null。所有原slot键、名称、outlets不变（包括历史残留）。slots.json是完整原合同。

未知时高亮隐藏，动画停；停止显示对应停止图；煤流使用已有 hmi.pipe-flow 公共命令，GIF以可见性控制，现有公开API不支持GIF解码器暂停，隐藏不宣称暂停解码器。设备监听由ctx生命周期清理，转动RAF显式取消。卸载清空局部状态，再挂载从unknown起。

## 验收分层
纯函数/局部脚本模拟测试不能替代真实Runtime。正式验收须执行preview trace + verifyInteractionTrace，检查三态、三通双开、0/53、LMQ组合、液位边界、70报警项、双实例/重连及投影slot。未取得真实浏览器证据时明确标记未验收。

## 验证模块放置
`tests/coal/loader.mjs` 和 `tests/coal/source.test.mjs` 属于本项目测试层：直接加载源码，依赖固定TypeScript5.7.2与Node内置assert，不依赖框架私有实现。现有结构验证不能验证快照和生命周期，故新增此窄范围测试。源侧位置填充复用官方base.bindNumber的observeLayout，不使用硬编码宽度。完整宿主合同与出口限制见README/INTERACTIONS。

## 验证修复：行为合同（2026-10-09）
责任：将已有输煤脚本的真实读写角色显式登记，供静态图验证与导出消费；不增加运行时实现层。
位置：项目行为合同 `.flamo/interaction-library/contracts/project-coal-*.behavior.json`、Artifact interactions 与 bindings；直接依赖现有 coal 源码和已核对节点 ID。
现有 text-input/pipe-flow 等合同不能描述输煤业务，故使用 `project.coal.*@1.0.0` 独立命名空间，不冒充官方库资产。定义级合同列出实际 on/off、挡板、填充条及尺寸参考节点；叶节点合同描述自身角色，实例仍继承定义脚本。
煤流 2.4.0 的 wallOutline 是可选装饰层，原 required=false/cardinality=one 自相矛盾。本项目合同快照改为 zero-or-one，与已有 2.5.0 合同一致；不改运行时、不虚构描边角色、不替换其他页面煤流行为。
本次编译和源级回归不等同于服务器完整图验证或真实浏览器轨迹验收。
