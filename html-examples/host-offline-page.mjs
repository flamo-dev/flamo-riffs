import { runtimePath, viewportPath } from './common/cdn-config.js';

// Keep the original downloadable HTML self-contained. Its hosted copy shares the
// site's runtime while the offline loader continues to unpack the artwork and interactions.
export function hostOfflinePage(bytes) {
  const html = new TextDecoder('windows-1252').decode(bytes);
  const configTag = /(<script type="application\/json" id="page-config">)([^<]+)(<\/script>)/;
  const match = html.match(configTag);
  const loaderHook = 'const imports = Object.create(null);';
  if (!match || !html.includes(loaderHook)) throw Error('Unrecognized Flamo single-page loader');
  const config = JSON.parse(match[2]);
  const sharedBlocks = new Set();
  for (const [index, record] of config.entries.entries()) {
    if (record.id === 'flamo:/component-viewport.js') record.sharedPath = viewportPath;
    else if (record.id === 'flamo:/flamo-runtime/index.es.js') record.sharedPath = runtimePath;
    else if (record.id.startsWith('flamo:/flamo-runtime/')) {
      // The shared ES module resolves its own vendor chunks and workers over HTTP.
      record.asset = false;
      record.eager = false;
    } else continue;
    sharedBlocks.add('p'+index);
  }
  if (!config.entries.some(record => record.sharedPath === runtimePath)) throw Error('Missing Flamo runtime entry');
  return html.replace('<meta charset="windows-1252">', '<meta charset="utf-8">')
    .replace(/<script type="application\/octet-stream" id="(p\d+)">[\s\S]*?<\/script>/g,
      (block, id) => sharedBlocks.has(id) ? '' : block)
    .replace(configTag, () => match[1]+JSON.stringify(config).replaceAll('<', '\\u003c')+match[3])
    .replace(loaderHook, `for (const record of entries) {
      if (!record.sharedPath) continue;
      const url = new URL(record.sharedPath, location.href).href;
      resources.set(record.id, url);
      pending.set(record.id, url);
    }
    ${loaderHook}`);
}
