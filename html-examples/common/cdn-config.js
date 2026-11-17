// Version keys from the installed Flamo shared-resource package.
export const runtimePath = '/common/flamo-runtime/index.es.js?v=e05cccaf4d1047c23416f98d46dbb5aaaddc1a4c3d01a8fafe61e6b623ee5ff4';
export const viewportPath = '/common/component-viewport.js?v=8a9625e8b5d2fa2deb7a029f6c243937929a722f2a098a30bd3157466c5df6ae';
export const FLAMO_CDN_URLS = {
  runtime: new URL(runtimePath, import.meta.url).href,
  viewport: new URL(viewportPath, import.meta.url).href,
};
