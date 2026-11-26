# Flamo Riffs 创意集

[English](README.md) · **简体中文**

用 Flamo，你可以把 Figma 设计稿做成能在浏览器里亲手操作的作品。在 Flamo Studio 里，直接给画好的图层加上行为：用自然语言告诉 AI 你想要什么交互，或用 TypeScript、JavaScript 编写脚本，再打开 Preview 试手感。完成后可以导出为独立 HTML 发给别人，也可以导出为 Web Component，嵌入自己的网页或业务系统。

[体验在线创意集](https://riffs.flamo.dev/) · [试用 Flamo](https://flamo.dev/) · [阅读开发文档](https://flamo.dev/docs/)

## 两分钟认识 Flamo

拉下 *Counter Drop* 的橙色摇杆，四个转轴就会转起来。短片从 Figma 里的两个计数器讲起，展示它们怎样变成一台能玩的老虎机。你还会看到，一段带弯钩的管道怎样保留原稿形状嵌入网页，以及一片能吹散蒲公英的 3D 草地怎样装进一个 HTML 文件。

https://github.com/user-attachments/assets/36ca9a8b-ef2a-48f6-9f97-deb6f1b99d51

[中文视频文件 · 2:04](readme-video/flamo-cn.mp4)

## 动手试试

- **电光轨道。** 移动鼠标，八条蓝光会沿各自的弯轨滑到离指针最近的位置。[体验电光轨道](https://riffs.flamo.dev/electro-wave/)
- **管道实验室。** 暂停一条管道，让另一条反向流动，或用一组按钮同时控制整个管网。页面里的五个管道组件都由 Flamo 导出。[体验管道实验室](https://riffs.flamo.dev/pipe/)

创意集支持搜索和视频预览，点击任意卡片就能打开作品体验。

## 官方交互示例

按手势、组件方法或 Runtime API 在[案例索引](interaction-examples.json)查找作品。`source` 指向实际脚本，`first` 和 `last` 标记相关调用。[线上目录](https://riffs.flamo.dev/interaction-library/cases.json)可以直接打开对应源码行。[Glass Folder 脚本](interaction-examples/glass-folder.ts)演示了悬停、快速反向、两次激活和移出复位时，手势如何与原稿动画交接。[官方交互库](interaction-library/)收录了可复用的行为和接入示例。

## 本地预览

```sh
node html-examples/serve.mjs 8189
```

打开 [本地创意首页](http://localhost:8189/) 即可预览。`html-examples/home/` 是首页源码目录。`html-examples/shumei/`、`html-examples/jianpan/` 分别存放输煤监测中心、智能监盘中心及各自的 15 秒预览视频。

## 构建静态站

```sh
node build.mjs
```

将生成的 `dist/` 作为**独立站点根目录**。构建器保留导出包里的组件合同，并将在线页面的模块和 Worker 指向同源的共享资源。不要直接发布整个工程（其中含有源设计和验收材料）。静态主机需要正常提供目录首页、JavaScript MIME、HTTPS 和视频 Range 请求。

所有在线案例共用 `/common/flamo-runtime/` 和 `/common/component-viewport.js`。升级时，将最新 Flamo 共享资源包安装到 `html-examples/common/`，并将包提供的两个版本参数更新到 `html-examples/common/cdn-config.js`。风大侠和蒲公英的原始单页 HTML 仍可离线打开。发布时用空目录构建，避免带入上次发布的旧文件。

## Flamo 自托管配置

配套 Flamo 仓库中，`OfficialHeader.astro` 定义“创意”导航；`deploy/ubuntu/Caddyfile` 为 `riffs.flamo.dev` 提供独立静态站点，`deploy/ubuntu/compose.yaml` 将宿主机 `/srv/flamo-riffs` 只读挂到 Web 容器的 `/srv/riffs`。官网仍使用原有站点根目录。

首次发布：在服务器上将经过验证的 `dist/` 内容解包到新的 `/srv/flamo-riffs/releases/<版本>/`，使 `/srv/flamo-riffs/current` 指向相对目标 `releases/<版本>`，再发布 Flamo 官网 Web 导航、Caddy 和挂载配置。后续更新创意集只需发布新的静态目录并原子切换 `current`；回滚切回前一版本。不要在容器内覆盖文件。发布后验证首页、搜索、视频播放、详情交互，以及从官网到演示站的跳转。
