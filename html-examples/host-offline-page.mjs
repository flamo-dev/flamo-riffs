import { runtimePath, viewportPath } from './common/cdn-config.js';

const titles = {
  masterwind: '<title data-zh="Flamo · 风大侠 · 借风过峡">Flamo · MasterWind</title>',
  dandelion: '<title data-zh="蒲公英 · 草地">Dandelion · Meadow</title>',
  motion: '<title data-zh="Drop Shot · 文件投篮">Drop Shot · File Basketball</title>',
};

// Keep the original downloadable HTML self-contained. Its hosted copy shares the
// site's runtime while the offline loader continues to unpack the artwork and interactions.
export function hostOfflinePage(bytes, page) {
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
    .replace('<html lang="zh-CN">', '<html lang="en">')
    .replace(/<title>[^<]*<\/title>/, titles[page])
    .replace('<body>', `<link rel="stylesheet" href="/common/language-picker.css?v=2"><script type="module" src="/common/riffs-language.js"></script><body><a class="riffs-newsletter artwork-newsletter" href="https://flamo.dev/newsletter/?from=riffs/${page}" target="_blank" rel="noopener" data-zh="邮件订阅">Email updates</a><riffs-language-picker class="artwork-language"></riffs-language-picker>`)
    .replace('<div id="status" role="status">&#27491;&#22312;&#21152;&#36733;&#8230;</div>', '<div id="status" role="status" data-zh="正在加载…">Loading…</div>')
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
