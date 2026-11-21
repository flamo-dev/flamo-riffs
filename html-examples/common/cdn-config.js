// Pin the entry modules served by this gallery.
export const runtimePath = '/common/flamo-runtime/index.es.js?v=8f5d47e13e7bdefb2390913112ff092935863a76d5cfbd39f3b75f4cc804ce19';
export const viewportPath = '/common/component-viewport.js?v=8a9625e8b5d2fa2deb7a029f6c243937929a722f2a098a30bd3157466c5df6ae';
export const FLAMO_CDN_URLS = {
  runtime: new URL(runtimePath, import.meta.url).href,
  viewport: new URL(viewportPath, import.meta.url).href,
};
