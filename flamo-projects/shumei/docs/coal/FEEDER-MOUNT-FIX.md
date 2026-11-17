# 给煤机 Web Component 挂载修复（2026-10-09）

> 历史记录：给煤机122/142行程及三通空appearance还原结论已被真实Chrome否定。当前规则与验收以 [NATIVE-FOLLOW-PAINT.md](NATIVE-FOLLOW-PAINT.md) 为准；本文件不作为随动/像素通过证据。

## 范围与根因
输入 Artifact metadata.revision: `artifact-rev-1791516529523-82d11c`。
主边界 `166:730`；共享定义 `209:639`（叶轮给煤机）。不改设计 scene、slots、宿主业务或 Runtime。

`334:306`、`334:317` 是 HUG_CONTENTS 容器，分别包含 `334:338`、`334:361`。
旧 bindNumber 把其 content-owned width 当独立测量值，挂载立即触发布局约束。
本次没有关闭 guard、伪造固定 layout 或修改 bindNumber/Runtime。

责任仍在项目组件层：`src/components/coal/device-209-639.ts` 提供作者确定的全宽
`barWidths: [122,142]`（现有 Artifact 条及边框设计宽度）；`device.ts` 通过公开
`ctx.node`、`ctx.assertLayoutWritable`、`setWidth` 投影。该设备的固定业务范围为 0..53，
第一路 width=122*(1-clamp(value)/53)，第二路 width=142*clamp(value)/53。
没有新增框架模块。references 仅保留原合同角色/证据，不再作运行时测量。
如果未来重新设计全宽，需要同步此作者参数及测试；不会用自我依赖的 HUG 实测自动适配。

null/undefined/NaN/Infinity 隐藏条、fillOpacity=0、width=0；0 是有效数值，不当缺测。
运行色状态仍由独立 run 值控制。dispose 清零隐藏，监听由 ctx 管理，不新增 observer、watch 或定时器。
实例通过 scoped ctx 解析，不缓存全局尺寸或实体；原 of 继承不变。

## Runtime import 核验
本工程不存在 `src/scripts/`；相关源在 `src/components/coal/`。
尝试 `@flamo/runtime` + tsconfig paths 后，实际编译的 register.definition.js 仍保留裸 specifier。
本地编译器没有对该导入执行打包路径重写。隔离工程没有正式服务器 exporter 实现/连接，
不能据此声称服务器 exporter 支持或不支持该写法。因此撤销该尝试，保留原 Runtime import。
没有修改 compiler、Runtime、生成 dist 或宿主。

重新正式导出后，检查包中 JS 的 Runtime specifier。若仍含
`/vendor/flamo-runtime/index.js` 或 `/vendor/flamo-runtime/index.es.js`，宿主需在模块加载前
用 importmap 将二者映射到**该 ZIP 内同一个真实 Runtime 入口 URL**；不要指向 Studio 根路径，
不要另装一个不同版本 Runtime。入口路径以实际 manifest/ZIP 为准，本文不虚构包路径。
若 exporter 已改写为包内相对路径则无需此映射。

## 验证级别与复现命令
依赖：`.flamo/tools/package-lock.json` 固定 TypeScript 5.7.3。

```sh
node .flamo/tools/node_modules/typescript/bin/tsc --noEmit
NODE_OPTIONS="--loader=$(pwd)/.flamo/tools/compiler-loader.mjs" node scripts/flamo-verify.mjs
node --loader ./tests/coal/loader.mjs tests/coal/source.test.mjs
python3 tests/coal/contracts.test.py
```

- typecheck、源编译、本地生成模块图验证通过。
- 261 条 source mock 断言；197 个 mapping；合同检查 153 个煤系统脚本、169 个绑定。
- mock 现在从真实 Artifact 的 HUG_CONTENTS/设计宽度构造 layout ownership；真实 bindNumber
  必须复现旧错误；真实 feeder definition setup 必须不再依赖测量；target 写入仍检查 ownership。
- 覆盖 0/53/中间/越界、缺测/非有限、停止/运行/未知、三通组合、犁煤器/落煤、液位/报警、实例隔离、清理重挂。
- 这不是浏览器 layout 求解器运行证据。尚未执行真实 Web Component 挂载、Runtime trace 或 localhost 验收。
- 编译器既有 complex public type 警告仍存在；未在本聚焦修复中改变公开方法。

## 正式重新导出与真实 layout 验收门槛
服务端接受本任务后负责 compile/graph/promote；本地不伪造最终 promotion revision。
已认证 Studio → 一体化 → yhpComp(0:1) → 166:730 → Web Component 导出，标签 flamo-coal-system。
正式命令入口：`npm run build:component -- --boundary 166:730 --name flamo-coal-system`（需要工程链接）。
本轮未生成 ZIP，也不复用旧 ZIP URL。

在实际导出包浏览器中检查：
1. 所有继承 209:639 的给煤机脚本 mounted，无 Number binding 异常；记录实际 layout().owners：
   两个旧参照允许 content，两个目标宽度应可写。确认没有把 parent-layout 目标强行写入。
2. applyPointValues 输入四组 GMJ 的 WZ=0/53/26.5，YX=true/false，等两帧后用 Runtime probe
   读回目标 width（122/0、0/142、61/71），而不是 EntityHandle.get() 设计快照；留截图。
3. applyPointValues({})，等帧后检查 bars invisible、width=0，运行高亮清除，getCoalState receipt 无错误。
4. 两个 Web Component 同时挂载，交替快照，第二个不受第一个影响；卸载重连无残留。
5. 对 feeder binding 采集 traceInteraction / verifyInteractionTrace，保留实际结果后方可宣称浏览器通过。
