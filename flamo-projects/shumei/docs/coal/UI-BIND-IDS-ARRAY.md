# 166:730 uiBindIds 数组合同更正

> 当前补充：JS property 已获用户正式包浏览器验证；JSON attribute 未被导出监听，已撤回承诺。详见 [ATTRIBUTE-LIMITATION.md](ATTRIBUTE-LIMITATION.md)。以下验证记录为数组修复时的历史记录。

## 当前事实与设计
本轮输入 metadata.revision 为 `codex_20261009132243_26ae35e3b9fe`。
当前 Artifact documentation 的 `annotation-ab96c611ce417c70` / contentHash `d80920218d3ee8a0` 明确要求 `[{id,notes,value}]`。
旧 snapshot 拒绝数组，旧 surface 为 object/default={}，导致宿主数组被清空；本次仅修正这一增量，不恢复旧 Artifact。

现有业务层 `src/components/coal/model.ts` 负责数组/兼容 Record 归一化，无新增模块；`script.ts` 继续以实例 props watcher 和兼容方法共享 consume。依赖仅现有公开 NodeScript/instance/bus API。无需改 Runtime、设备角色映射或部署。

## 公开合同
- JS property `uiBindIds`，默认 `[]`；`attribute:false`，不提供 JSON attribute。
- 主输入 `UiBindEntry[]`：`{id:string, notes?:string, value:PointValue}`。
- 兼容 `Record<string,PointValue>`；surface schema.anyOf 明示两种形态，parameter.type 为 array。
- PointValue = number | boolean | null | {left:boolean|null,right:boolean|null}；额外公开类型定义在 model.ts，消费合同在 README。
- 数组使用业务 id 而非索引；notes 为宿主元数据，不用于计算、不变成点值。不改 ID、不去掉 #。重复 ID 最后一项生效；无效/空 id 项忽略，无效值归一化 null。
- 完整替换，不合并上次值；`[]` 清除全部旧状态。false/0/null 保留，ST 左右对象复制；既有报警别名兼容不变。
- getCoalState().values 是实际消费的业务 ID 快照（含既有报警别名），不是原始行数组；coalStateChange 在 consume 处理后发送。
- applyPointValues 兼容数组及 Record，经同一 snapshot 管线处理，并通过 setProps 保留归一化 Record。初始 props、属性变化均无需调用此方法。

```html
<flamo-coal-system id="coalSystem">
  <!-- 保留宿主原有全部静态 slots -->
</flamo-coal-system>
```
```js
coalSystem.uiBindIds = [
  {id:'GMJ_1APD#1GMJWZ', notes:'位置', value:53},
  {id:'#1APDBJ_PDSLBJ', notes:'撕裂报警', value:false},
  {id:'ST_1AST', notes:'三通', value:{left:true,right:null}}
];
coalSystem.uiBindIds = []; // 全部未知
```

## 保留与验证边界
195 个当前设备目标不变；187:638、197:315 保留 orphan 和用户删除状态。
Scene、documentation、exports、全部 slots/targets 和其余 nodeArtifacts 必须与输入深比较相等，唯一 surface 变更为根 parameters.uiBindIds。
源回归覆盖数组 false/0/null/#/ST/清空、重复/无效项、所有映射键数组与 Record 等价、初始 props、双实例、重新 setup 的保留属性袋和清理；继续跑已有真实表示的物理角色/宽度模拟。
JSON 测试仅为序列化/解码与 schema 检查；props 生命周期使用模拟 ctx。不能证明正式 wrapper 的 prototype setter、ready 前赋值、attributeChangedCallback 或真实 DOM 重连通过。

本轮无真实浏览器/Visual gate/verifyInteractionTrace 证据。正式 exporter 的 manifest/W3C/d.ts 和数组 setter 仍须 promotion 后在认证浏览器检查；不手改导出包。
正式入口：Studio → 一体化 → yhpComp → 166:730 → Web Component 导出 → flamo-coal-system（或认证 flamo_component_export）。本轮没有调用远端提交/导出，没有重复 accepted 请求，没有新 ZIP URL；最终 promotion revision 由服务端轮后生成，不能自行编造。
