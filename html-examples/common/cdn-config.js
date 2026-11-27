// Pin the entry modules served by this gallery.
export const runtimePath = '/common/flamo-runtime/index.es.js?v=8dfb5cf5a7b9086ddd588d557e545c8c9e2f0799e3a5bf50ea075898d24ad615';
export const viewportPath = '/common/component-viewport.js?v=2422d4da6065ff4fedf2c98c0c721f0fb9cb6e546389c6a6448a00c0f7d6dd51';
export const FLAMO_CDN_URLS = {
  runtime: new URL(runtimePath, import.meta.url).href,
  viewport: new URL(viewportPath, import.meta.url).href,
};
