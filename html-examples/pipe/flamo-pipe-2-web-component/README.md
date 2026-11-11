# flamo-pipe-2

Framework-independent Web Component exported by Flamo.

Set the element's width and height with CSS (default 300px by 150px). Content follows
the exported fit mode in manifest.viewport and adapts when the container resizes.
Width fit scrolls vertically; height fit scrolls horizontally when needed.
The canvas background is transparent; authored node fills are preserved. Host CSS
can supply a background. Canvas movement and zoom are disabled unless enabled at export.
Source maps are included only when Source Map is checked at export (default off).
The selection is recorded in manifest.packaging.sourceMap.

Keep dist/resources/ and dist/component-resources.js alongside the entry modules.
All four entry modes share these files. Serve them over HTTP(S); cross-origin
hosting must allow CORS for the JSON and binary resources as well as JavaScript.
Full diagnostic IR is available only when packaging with diagnosticIR=1.

## Use In HTML

```html
<!-- Put these in head so unupgraded light DOM never flashes. -->
<style>[data-flamo-component]:not([data-flamo-state="ready"]):not([data-flamo-state="static"]){opacity:0;pointer-events:none}</style>
<link rel="stylesheet" href="./dist/component-loading.css">
<script type="module" src="./dist/flamo-pipe-2.loader.js"></script>
<div class="flamo-component-shell" style="width: 100%; height: 400px;">
  <flamo-pipe-2 data-flamo-component inert aria-busy="true" loading-label="正在加载组件…">

  </flamo-pipe-2>
  <div data-flamo-status role="status" aria-live="polite">
    <span data-flamo-message>正在加载组件…</span>
    <button type="button" hidden>刷新重试</button>
  </div>
</div>
```

## Use In JavaScript

```js
import './dist/flamo-pipe-2.js';

const el = document.createElement('flamo-pipe-2');
el.addEventListener('flamo-ready', (event) => {
  console.log(event.detail.app, event.detail.flamo, event.detail.manifest);
});
document.body.append(el);
```

## Slot 接入合同

此组件没有声明命名 slot。

在 Figma 主组件右侧 Properties 中编辑 Slot property 的 description，重新同步再导出。
data-mark 是 description 的 HTML 副本，完整合同见 manifest.json 的 slots。
Slot 名称区分大小写；不要根据缩写猜测接口字段。没有说明时先结合项目资料补充业务含义。
上面的完整骨架中，有默认内容或不接受 DOM 的 slot 已注释；需要替换时再启用 DOM 占位，
非 DOM slot 使用 manifest 声明的内容类型。空 div 也是显式内容，会覆盖默认内容。

源 light DOM 的属性、文字和子节点变化会同步到各个投影；不要访问 shadowRoot 修改副本。
自定义 DOM 属性和 addEventListener 不会由克隆复制；有独立状态或交互的内容使用自行初始化的
Custom Element，或组件声明的 slot props/events 合同。template 内容可重复挂载。
宿主页面 CSS 不会自动进入投影；通过组件的 slotStyles 属性提供限定到 slot 内容的 CSS，
例如 el.slotStyles = '[slot] { color: white; }'。空字符串清除样式。
样式中的相对 URL 相对于宿主文档解析。运行、停止、未知状态、素材和 API 映射属于接入项目。

## Public API

- Properties and imperative methods listed in manifest.surface and the exact .d.ts are available directly on the element. Scalar attribute names come from custom-elements.json; object/array inputs use DOM properties. Property assignments do not reflect back to HTML attributes.
- Set initial properties before insertion if needed. After insertion, await `el.ready` before invoking methods; before custom-element registration first await `customElements.whenDefined('flamo-pipe-2')`. Calls while disconnected/loading fail explicitly. Reconnect preserves host property inputs and creates fresh interactions.
- Use `inspectComponentIntegration(el, flamoComponentManifest).publicSurface` to check actual accessors/methods. A method resolving or host label changing is not proof of the component effect; observe state/events or rendered output. Re-export legacy packages whose declared members are absent.
- `ready`: Promise resolved after scene, interactions, initial slot images and a rendered frame are ready (also when paused).
- `data-flamo-state`: loading / static / ready / error, with `aria-busy` and `flamo-loading`, `flamo-static-ready`, `flamo-ready`, `flamo-error` events. Static means the authored scene has been presented; scripts, generated geometry and live data may still be initializing. The element stays inert/busy and `el.ready` stays pending until full readiness.
- The optional loading shell catches module/runtime failures and shows a manual refresh action after 45 seconds. Late success recovers automatically. Customize colors with `--flamo-loading-accent` and `--flamo-loading-color`.
- `instance`: mounted FlamoInstance owned by this custom element.
- `app`: underlying FlamoApp instance.
- `flamo`: interaction runtime API passed to generated scripts.
- `reloadInteractions()`: re-runs the packaged interaction entry.
- Standard light DOM slots: use native `slot="name"`; slot props are delivered through `element.flamoSlotProps` and `flamo-slot-props-change`.
- `slotStyles: string`: CSS for projected slot content, assign before or after ready; does not require Shadow DOM access.
- `destroy()`: stops and releases the runtime.
- `paused` attribute: pauses rendering while present.

## AI Notes

Start with manifest.integration and the owning Flamo server's flamo-design MCP. Call flamo_component_resolve with its projectId/contractId, then context/api/plan. Submit local browser observations through flamo_component_verify; use flamo_component_source for source revision and re-export guidance. See AGENTS.md for the full workflow. Keep the installed contractId pinned rather than requesting latest APIs.

Read INTERACTIONS.md and interactions.json for per-node design requirements, exact targets and diagnostics.
Use INTERACTION_API.md for Canvas target access and lifecycle. Documentation does not imply implemented behavior.

Start with `AGENTS.md`, `manifest.json`, and `dist/flamo-pipe-2.d.ts`. Use native Custom Elements, light DOM, DOM properties and CustomEvent.
The public tag is stable across compatible releases. Replace package resources together and keep host integration outside the exported directory.
Renaming slots or changing props/events is a contract change; review the manifest before upgrading. Different definitions cannot register the same tag in one registry.

## CDN public resources

Deploy flamo-runtime/ and component-viewport.js from the separately downloaded public resource archive directly under http://localhost:8080/common/. No generated JavaScript edits are needed.

Runtime: http://localhost:8080/common/flamo-runtime/index.es.js?v=6d2ff1a7ac46cbf71db7bc0e5e550b1103dfff6826484a351327f677c7d408f6
Viewport: http://localhost:8080/common/component-viewport.js?v=7f533668b721e562ddf4b4d8b1b520b1b229234216c8393b7cf1cf5192a1ccd0

The interactions directory contains project scripts and stays local. Serve CDN JavaScript with a JavaScript MIME type and CORS. Keep the Runtime directory contents together and use a new version directory when updating a versioned deployment.

## 运行态加载

交互脚本及本地依赖已合并到 `dist/interactions/bundle.js`，各模块仍延迟初始化，多个实例共享模块下载。 资源分块共享进行中的请求及最多 32 MiB 已校验字节，各实例仍独立解码，不共享可变状态。无 CDN 配置的 thin 入口使用 interactions-thin/，与宿主共享 /vendor/flamo-runtime/index.es.js，不另加载包内 Runtime。建议宿主开启 gzip/Brotli，并将每次更新部署到新的版本目录；此优化不自动改变宿主的缓存响应头。

## 修改 CDN 地址

统一修改 `dist/cdn-config.js` 顶部的 `FLAMO_CDN_URLS`。组件入口和交互脚本共享此配置；请保留 Runtime 目录结构，并为 CDN 开启 JavaScript MIME 类型和 CORS。
