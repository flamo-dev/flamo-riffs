# 输煤 Web Component 交付合同（166:730）

这是源组件的合同，不是手写替代组件。正式包必须由 Studio exporter 从本次已提升的 Artifact 生成，建议标签 `flamo-coal-system`。

最新数组合同见 [UI-BIND-IDS-ARRAY.md](UI-BIND-IDS-ARRAY.md)。属性驱动接入历史见 [UI-BIND-IDS.md](UI-BIND-IDS.md)。宿主应设置 `uiBindIds`，方法仅保留兼容。

当前属性能力及用户实包验收记录见 [ATTRIBUTE-LIMITATION.md](ATTRIBUTE-LIMITATION.md)。不要使用 `setAttribute` 传入快照；在 index.html 请求完成后赋值 `coalSystem.uiBindIds = rows`。

## 宿主 API

```ts
type PointValue = number | boolean | null |
  { left: boolean | null; right: boolean | null };
type PointValues = Record<string, PointValue>;
interface UiBindEntry { id: string; notes?: string; value: PointValue }
type UiBindIds = UiBindEntry[] | PointValues;
interface CoalApi {
  uiBindIds: UiBindIds; // primary [{id,notes,value}]; JS property only; default []; no JSON attribute
  applyPointValues(values: UiBindIds): void;
  getCoalState(): {
    epoch: number;
    values: PointValues;
    robot: object;
    devices: Array<{
      node: string; runtimeNode: string | null; kind: string;
      slots: Array<{key:string; name:string; target?:string}>;
      run?: boolean | null; text?: string; ratio?: number | null;
      receipt: null | {state: object; errors: string[]};
    }>;
  };
}
```

上述为收窄后的消费合同。运行时入口以 `unknown` 接收并验证不可信输入；编译器自动推断的 surface 因此为 `applyPointValues(valuesInput: unknown): void`、`getCoalState(): unknown`，没有另外伪造一套 method 声明。额外 ST 对象类型定义在 `src/components/coal/model.ts`，不是原始 number|boolean|null 联合的一部分。返回值为独立 JSON 副本；未挂载、未回执和 setter 错误不会伪装成功。

每次调用替换整个快照，省略键清掉旧状态。严格布尔 true/false，不把 0/1 字符串当布尔；数值必须 finite。未知值清空效果、文本 `--`。宿主取 config.js 平台值并计算 ST 左右、LM 组合，本包不访问平台、不包含凭据。LMQ 使用 `<主ID>LDW` / `<主ID>TDW`；两个 false 才显示中间灰挡板。6D 使用给定主 ID，不添加6AD点。

报警主键约定 `PDSLBJ_1APDBJ`（其余四前缀及14条皮带同理）；兼容 `1APDBJ_PDSLBJ` 别名，主键优先。用户未提供报警完整ID清单，这一命名约定需宿主接线确认，不会猜平台 tag。`mapping.json` 是所有精确节点/配置ID/slot 的接线清单。

## 真实 slots 协作

`slots.json` 原样保存完整 surface，包含历史 metadata-only slots；不得删改或将实际 `Robot` 改成 robot。以 `mapping.json` 内 key/name/target 三元组辨别同名历史 outlet。宿主应使用正式包的 slot 投影机制，不应逐层 patch 源节点。

- 电流：源 `devices[].text` 两位小数/`--`；宿主真实 slot 显示 `text + ' A'`，15px、bold、#09BAEB。
- 原煤仓：源限幅0..15，给出 raw/text/ratio；宿主真实料位 slot 左侧文本m、右侧柱图；未知隐藏柱高亮，不显示0假值。
- 消防水位：0..2，真实水位 slot 柱图中显示两位小数m；源不缩放水箱底图。
- Alarm：源控制对应报警锚点可见性、返回五项 tri 状态；宿主仅列值为 true 的项目，用现有定位点方向绘制气泡尾巴。具体皮带的 slots 在 mapping 内。
- Robot：实际名称 `Robot` / key `robot__344_0`，投影复制的 R-02 section。`robot.fields` 对缺失数值给 `--`，`running` 和 `alarm` 为三态，`animation` 在 JQR_YXZT 为 true/false/null 时分别为 running/stopped/unknown（2026-10-10 明确需求覆盖旧注释；宿主 true 播放、false/null 暂停）；宿主消费这些语义，不虚构传感器接口。

可在 `applyPointValues` 后调用 `getCoalState()` 更新投影；也可以监听编译器导出的 `coalStateChange`。事件提供 values/devices/robot 语义，设备回执以 getCoalState 为准。事件 DOM 封装格式以正式包 README 为准，未假定私有封装。

## 正式导出入口

已执行本项目脚本：

```sh
node scripts/flamo-build-component.mjs --boundary 166:730 --name flamo-coal-system
```

当前隔离副本缺少 `.flamo/link.json.serverOrigin`，脚本只生成了占位 dist/README.md，**没有生成完整ZIP**。不补写服务器地址或凭据。

待服务端编译/校验/提升本次任务后：在已认证的 Studio 打开“一体化” → yhpComp → 选中166:730“输煤组件” → 正式 Web Component 导出，边界166:730，名称flamo-coal-system。

脚本中已有的正式同源操作路径（不是已生成的 ZIP URL）：
`/projects/u_5ce5548fa8_project_9ix5p5/package-component?transport=json&boundary=166%3A730&name=flamo-coal-system`
该接口返回 JSON 中的 fileName/base64；Studio 导出 UI 负责下载。不要把 JSON URL 当 ZIP直链。联机工程配置完成后上面命令会把官方完整ZIP保存到 dist/。

验收正式ZIP应检查：依赖（包括197:334间接电机）、原始素材、scripts、全部slots/public methods、manifest、README、INTERACTIONS。当前无法确认 exporter 是否自动收入 docs/coal/INTERACTIONS.md；需在正式导出结果中核对，不能宣称包内已经包含。禁止手工做简化替身以凑包。

## 2026-10-10 源修正（待正式包复验）
[NATIVE-FOLLOW-PAINT.md](NATIVE-FOLLOW-PAINT.md) 记录原生约束、280全行程依据及三通原形状互斥显隐（撤回填色/强制Paint验收，见 [TEE-SHAPE-VISIBILITY.md](TEE-SHAPE-VISIBILITY.md)）。保留真实JS uiBindIds属性，不增加JSON attribute承诺。本轮不执行导出、不写dist；上述导出尝试为历史记录。下一步由用户正式整体导出后测量图标世界x和三通截图，不能把source mock作为浏览器通过。
