# Flamo Riffs

**English** · [简体中文](README.zh-CN.md)

Flamo turns Figma designs into interactive works you can share on the web. In Flamo Studio, you can attach behavior directly to the layers you drew. Describe the interaction to AI, or write it in TypeScript or JavaScript, then try it in Preview. Export the result as a standalone HTML file to share, or as a Web Component to embed in your app.

[Explore the live gallery](https://riffs.flamo.dev/) · [Try Flamo](https://flamo.dev/) · [Developer docs](https://flamo.dev/docs/)

## Watch Flamo in action

Pull the orange lever in *Counter Drop* and four reels spin. This two-minute introduction shows how a pair of Figma counters became a playable game, how a pipe keeps its hand-drawn bend when embedded in a web page, and how a 3D dandelion meadow fits in one HTML file.

https://github.com/user-attachments/assets/2c9c2464-ecfd-4ced-b10f-702c052ae72c

[English video file · 2:08](readme-video/flamo-en.mp4)

## Try an interaction

- **Electro Wave.** Move your pointer across the canvas. Eight blue lights glide to the closest point on their own tracks. [Try Electro Wave](https://riffs.flamo.dev/electro-wave/)
- **Pipe Lab.** Pause one pipe, reverse another, or control the whole network at once. The page uses five Web Components exported from Flamo. [Try Pipe Lab](https://riffs.flamo.dev/pipe/)

The gallery has searchable previews. Open any card to try the work yourself.

## Official interaction examples

Search the [case index](interaction-examples.json) by gesture, component method, or Runtime API. Each entry’s `source` points to the script, and `first` and `last` mark the relevant lines. The [live catalog](https://riffs.flamo.dev/interaction-library/cases.json) links directly to those lines on GitHub. The [Glass Folder script](interaction-examples/glass-folder.ts) shows how hovering, two quick clicks, and leaving the folder interact with the original animation. The [official interaction library](interaction-library/) contains reusable behaviors and integration recipes.

## Preview locally

```sh
node html-examples/serve.mjs 8189
```

Open the [local gallery](http://localhost:8189/). The gallery source is in `html-examples/home/`. The coal-handling and plant-monitoring demos and their 15-second previews are in `html-examples/shumei/` and `html-examples/jianpan/`.

## Build the static site

```sh
node build.mjs
```

Publish the contents of `dist/` as the site root. The build preserves the component contracts and points modules and workers to shared assets on the same origin. Project sources and verification files stay in the checkout. The static host must support directory indexes, JavaScript MIME types, HTTPS, and video range requests.

All hosted examples use `/common/flamo-runtime/` and `/common/component-viewport.js`. To upgrade them, install the Flamo shared resources in `html-examples/common/` and update the two version parameters in `html-examples/common/cdn-config.js`. The original MasterWind and Dandelion HTML exports also work offline. Use an empty build directory for a release.

## Self-hosting with Flamo

In the companion Flamo repository, `OfficialHeader.astro` defines the gallery navigation link. `deploy/ubuntu/Caddyfile` serves `riffs.flamo.dev` as a separate static site, and `deploy/ubuntu/compose.yaml` mounts `/srv/flamo-riffs` read-only at `/srv/riffs` in the web container. The main Flamo website uses its own site root.

For the first deployment, unpack the verified build into `/srv/flamo-riffs/releases/<version>/`, point `/srv/flamo-riffs/current` at the relative target `releases/<version>`, and deploy the navigation, Caddy configuration, and volume mount. For later releases, stage a new directory and switch `current` atomically. To roll back, switch it to the previous release. Verify the homepage, search, video playback, detail-page interactions, and navigation from the Flamo website.
