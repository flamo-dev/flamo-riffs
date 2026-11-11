# Flamo Riffs 创意集

**[在线访问 Flamo Riffs 创意集 →](https://riffs.flamo.dev/)**

这里收录了用 Flamo 制作的交互演示。首页可以搜索作品、观看视频预览，点击卡片就能动手体验。在第一个作品[管道实验室](https://riffs.flamo.dev/pipe/)里，你可以逐条暂停管道、反转流向，也可以用一组按钮同时控制整个管网。

## 关于 Flamo

Flamo 是一款交互界面创作工具。你可以导入 Figma 设计，保留图层和组件结构，用 TypeScript 或 JavaScript 为图形添加行为、接入数据，再到 Flamo Studio 中预览和调试。完成的设计可以导出为 Web Component，嵌入自己的网页或业务系统。管道实验室里的五个管道组件就是这样接入页面的。

[访问 Flamo 官网](https://flamo.dev/) · [阅读开发文档](https://flamo.dev/docs/)

## 本地预览

```sh
node html-examples/serve.mjs 8189
```

打开 [本地创意首页](http://localhost:8189/) 即可预览。`html-examples/home/` 是首页源码目录，`html-examples/pipe/` 是管道实验室源码目录。

## 构建静态站

```sh
node build.mjs
```

将生成的 `dist/` 作为**独立站点根目录**。构建器保留导出包里的组件合同和版本参数，仅在交付副本中把模块与 Worker 的本机资源地址改为同源 `/common/`；源 ZIP 不变。不要直接发布整个工程（其中含有源设计和验收材料）。静态主机需要正常提供目录首页、JavaScript MIME、HTTPS 和视频 Range 请求。

## Flamo 自托管配置

配套 Flamo 仓库中，`OfficialHeader.astro` 定义“创意”导航；`deploy/ubuntu/Caddyfile` 为 `riffs.flamo.dev` 提供独立静态站点，`deploy/ubuntu/compose.yaml` 将宿主机 `/srv/flamo-riffs` 只读挂到 Web 容器的 `/srv/riffs`。官网仍使用原有站点根目录。

首次发布：在服务器上将经过验证的 `dist/` 内容解包到新的 `/srv/flamo-riffs/releases/<版本>/`，使 `/srv/flamo-riffs/current` 指向相对目标 `releases/<版本>`，再发布 Flamo 官网 Web 导航、Caddy 和挂载配置。后续更新创意集只需发布新的静态目录并原子切换 `current`；回滚切回前一版本。不要在容器内覆盖文件。发布后验证首页、搜索、视频播放、详情交互，以及从官网到演示站的跳转。

