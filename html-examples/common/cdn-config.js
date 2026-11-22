// Pin the entry modules served by this gallery.
export const runtimePath = '/common/flamo-runtime/index.es.js?v=590cc2e6ffae8c6033052d8a2c817a6e6823b4b9a3ce8057823a6bbe1d491174';
export const viewportPath = '/common/component-viewport.js?v=8a9625e8b5d2fa2deb7a029f6c243937929a722f2a098a30bd3157466c5df6ae';
export const FLAMO_CDN_URLS = {
  runtime: new URL(runtimePath, import.meta.url).href,
  viewport: new URL(viewportPath, import.meta.url).href,
};
