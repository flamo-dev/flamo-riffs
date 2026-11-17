import { runtimePath, viewportPath } from './common/cdn-config.js';

const pipeEntry = /(?:^|\/)pipe\/flamo-pipe-(1|2|3|4|group)-web-component\/dist\/(?:cdn-config|flamo-pipe-\1)\.js$/;
const saltlineEntry = /(?:^|\/)saltline\/[^/]+\/dist\/(?:flamo-saltline|interactions\/bundle)\.js$/;

export function isExportEntry(path) {
  return pipeEntry.test(path) || saltlineEntry.test(path);
}
export function relocateExport(path, text) {
  if (saltlineEntry.test(path)) {
    return text.replace(/"(?:\.\/|\.\.\/)flamo-runtime\/index\.es\.js"/g, JSON.stringify(runtimePath))
      .replaceAll('"./component-viewport.js"', JSON.stringify(viewportPath));
  }
  if (!pipeEntry.test(path)) return text;
  if (path.endsWith('/cdn-config.js')) return "export { FLAMO_CDN_URLS } from '/common/cdn-config.js';\n";
  return text.replaceAll('http://localhost:8080/common/', '/common/');
}

