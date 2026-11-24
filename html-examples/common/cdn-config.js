// Pin the entry modules served by this gallery.
export const runtimePath = '/common/flamo-runtime/index.es.js?v=4ca579f2c786b020c32a17467a0597d377734d13cb25957c0107a91da921b9b4';
export const viewportPath = '/common/component-viewport.js?v=8a9625e8b5d2fa2deb7a029f6c243937929a722f2a098a30bd3157466c5df6ae';
export const FLAMO_CDN_URLS = {
  runtime: new URL(runtimePath, import.meta.url).href,
  viewport: new URL(viewportPath, import.meta.url).href,
};
