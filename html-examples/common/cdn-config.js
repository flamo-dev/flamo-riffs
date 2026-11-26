// Pin the entry modules served by this gallery.
export const runtimePath = '/common/flamo-runtime/index.es.js?v=5778be0cd289c3718fd780d30ee8718a3fd87c697e5cbb46a9710e1d942b08d1';
export const viewportPath = '/common/component-viewport.js?v=2422d4da6065ff4fedf2c98c0c721f0fb9cb6e546389c6a6448a00c0f7d6dd51';
export const FLAMO_CDN_URLS = {
  runtime: new URL(runtimePath, import.meta.url).href,
  viewport: new URL(viewportPath, import.meta.url).href,
};
