# 原生随动配置与三通原形状显隐（2026-10-10）

三通当前规则以 [TEE-SHAPE-VISIBILITY.md](TEE-SHAPE-VISIBILITY.md) 为准。B轮填色方案及其强制验收已撤回。

## 设计 / 开发说明（实施前）
范围：166:730 实际依赖 209:639 与 94:101763。修改现有项目组件脚本、Artifact 原生布局/paint；不新增模块、不修改 Runtime、导出 wrapper、宿主、slots 或网络行为。

给煤机已有浏览器证据：setWidth改变宽度但图标未随动。以下为项目原生配置修正，仍待正式包复验，不认定框架故障。三通空appearance数组并不证明原有形状无颜色；此前用它推断paint故障、另行填色属于任务误解。

原生方案：位置容器横向改 FIXED，保留其当前尺寸/transform/层级。第一容器原有 HORIZONTAL/MAX 对齐负责条右端固定，条宽变动使左端移动；第一图标 MIN 约束保留 -14 偏移。第二容器 MIN 对齐；第二图标 MAX 约束保留距条右端 -14 的图标左边缘。条宽独立 FIXED；不以图标/HUG 反算条宽。脚本仍只 setWidth，不写任何 Frame/图标 x/y。

行程依据：固定煤仓 208:600 宽282；其刻度参照线 209:637 起点x=1、宽280、终点x=281，与第一容器右边159+122=281和第二容器左边1吻合。因此两条满行程均280，122/142只保留为作者静态进度。投影第一条280*(1-clamp(v,0,53)/53)，第二条280*clamp(v,0,53)/53；未知隐藏并归零。保留图标作者偏移，不能把刻度文本包围盒中心当精确位置标尺。

三通：三个运行节点 fillPaints 精确恢复 B 前 before 值。六个运行/停止形状只切互斥 visible，不改颜色/材质/描边/opacity/层序。

## 验收分层（替代旧判据）
source/build/mock只验证规则、数值和写入合同，不能证明原生布局执行或像素。receipt observed 只表示读到了 committed probes，并非视觉验收通过。
正式包Chrome：两个独立实例分别输入0/26.5/53，条宽须为280/140/0与0/140/280；两图标世界x均应每档移动140（保持作者offset），第一条右端不动、第二条左端不动，y不动。越界钳制，未知隐藏归零；重挂与隔离另验。静态设计尺寸不变。
三通左+上、右+上、全部停止/未知及双开：源验收只校验实际 mounted 角色与 committed visible。appearance仅诊断，空fills不失败；真实形状颜色/截图由客户端另验，不将旧的空fills证据称为渲染故障。

## 覆盖与实例核对
209:640、209:721的symbolOverrides仅有名称/既有运行图片visible，没有位置容器/条/图标的layout或constraints覆盖，故规则放在209:639定义继承，不逐实例patch。保留原始derived metadata，最终mounted行为须正式新包核对。本次无新增模块。

公开measurement保留：feeder geometry/constraints、children 实际 geometry/constraints 与 nativeFollowAcceptance；tee appearance/compositing/layerProbe。撤回 effectiveRunPaint / paintReadbackAvailable 强制匹配，不添加替代颜色指标。所有 observed 均不代表浏览器视觉验收。

若正式包原生 follow 仍不生效，或正确使用后证据指向/怀疑框架问题，提供证据并停止，不继续绕过。
