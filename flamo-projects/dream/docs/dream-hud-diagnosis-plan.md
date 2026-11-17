# HUD 连续手势诊断（不发布、不改交互）

输入 revision：codex_20261001064511_e9b806a2996f。
职责/层/路径：tests/dream-hud-diagnosis.mjs 是项目诊断测试，不是运行态模块；仅依赖 Node HTTP/fs/crypto、Playwright 1.58.2、项目现有正式 Preview、公开 flamo.camera 与 EntityHandle.current、浏览器 RAF/DOM rect/CDP 截图。现有测试只检验手势结束坐标，不能证明帧内稳定，因此添加有界逐回调采样。

不运行有 pull/compile 副作用的 dev 路由；只静态提供原样 .flamo/preview 与 .flamo/runtime 和项目文件。180秒自动关闭。RAF 包装只记录并原样调用回调，不改变顺序、不写相机、不注入 trace。current 为异步读取，记录解析时间及相机，不能把混合时刻投影冒充呈现像素。同步品牌 DOM rect 与操作中截图作为独立可见证据。

记录原生连续拖动、Ctrl-wheel 放大/缩小、静止后的相机与 HUD。分析项目 draw 与 Runtime RAF 的实际顺序、相机新旧代、root 逆变换生效时刻，区分逆补偿必要变换与重复变换。未检查框架源代码；若需要帧阶段机制，给公开能力需求而不猜测私有路径。
