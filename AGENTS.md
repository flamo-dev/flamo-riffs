# Flamo Riffs 项目约定

发布或更新创意列表时使用 Flamo 的 `flamo-riffs-publish` skill。把卡片、源码和 `interaction-examples.json` 随同一变更发布到 GitHub，将 `RIFFS_RELEASE_COMMIT` 设为该提交的完整 SHA，以空的 `RIFFS_BUILD_DIR` 执行 `node build.mjs --release`。它逐卡核对公开 GitHub 源码与实际详情页，生成带固定版本链接的 `interaction-library/cases.json`。将目录与对应首页一同激活。

创意列表中所有视频预览都应在卡片显示时自动播放。新增或修改卡片时，沿用 `html-examples/home/index.html` 中的 `<video autoplay muted loop playsinline>` 和播放／暂停按钮。搜索筛选隐藏卡片时暂停视频，重新显示时恢复播放，并保留用户手动暂停的选择。
