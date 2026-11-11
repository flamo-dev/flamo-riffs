# Flamo Riffs 创意集

源文件在 `html-examples/home/`；`pipe/` 是已接入的第一个作品。官网入口指向 `https://riffs.flamo.dev/`。

## 本地预览

```sh
node html-examples/serve.mjs 8189
```

打开 http://localhost:8189/ 。根路径和 `/home/` 都是创意首页；`/pipe/` 是工作台。搜索条件写在 `?q=`，可以复制或刷新。播放预览按钮只播放片段；点击卡片进入演示。

## 构建静态站

```sh
node build.mjs
```

将生成的 `dist/` 作为**独立站点根目录**。构建器保留导出包里的组件合同和版本参数，仅在交付副本中把模块与 Worker 的本机资源地址改为同源 `/common/`；源 ZIP 不变。不要直接发布整个工程（其中含有源设计和验收材料）。静态主机需要正常提供目录首页、JavaScript MIME、HTTPS 和视频 Range 请求。

## Flamo 自托管配置

配套 Flamo 仓库中，`OfficialHeader.astro` 定义“创意”导航；`deploy/ubuntu/Caddyfile` 为 `riffs.flamo.dev` 提供独立静态站点，`deploy/ubuntu/compose.yaml` 将宿主机 `/srv/flamo-riffs` 只读挂到 Web 容器的 `/srv/riffs`。官网仍使用原有站点根目录。

首次发布：在服务器上将经过验证的 `dist/` 内容解包到新的 `/srv/flamo-riffs/releases/<版本>/`，使 `/srv/flamo-riffs/current` 指向相对目标 `releases/<版本>`，再发布 Flamo 官网 Web 导航、Caddy 和挂载配置。后续更新创意集只需发布新的静态目录并原子切换 `current`；回滚切回前一版本。不要在容器内覆盖文件。发布后验证首页、搜索、视频播放、详情交互，以及从官网到演示站的跳转。

