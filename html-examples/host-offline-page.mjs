import { runtimePath, viewportPath } from './common/cdn-config.js';

const titles = {
  masterwind: '<title data-zh="Flamo · 风大侠 · 借风过峡">Flamo · MasterWind</title>',
  dandelion: '<title data-zh="蒲公英 · 草地">Dandelion · Meadow</title>',
  motion: '<title data-zh="Drop Shot · 文件投篮">Drop Shot · File Basketball</title>',
  electrolyser: '<title data-zh="600 kA 电解槽">600 kA Electrolysis Cell</title>',
  counter: '<title data-zh="Counter Drop · 四位老虎机">Counter Drop · Slot Machine</title>',
  'card-shuffle': '<title data-zh="Card Shuffle · 滑动卡片">Card Shuffle</title>',
  'glass-folder': '<title data-zh="Glass Folder · 玻璃文件夹">Glass Folder</title>',
};

const counterCredit = '<footer class="counter-credit" data-zh="原版 Figma 动效设计由 Nastaran Jamali 创作。此作使用 Flamo 添加互动脚本，改编为四位老虎机。">Original animated Figma design by Nastaran Jamali. Adapted into a four-reel slot machine with Flamo interaction scripts.</footer>';
const counterLayout = '<style>body{display:flex;flex-direction:column}body>main{flex:1;min-height:0;height:auto}.counter-credit{box-sizing:border-box;padding:8px 16px;text-align:center;background:#202022;color:#f4ede8;font:13px/1.45 system-ui,sans-serif}</style>';

// Keep the original downloadable HTML self-contained. Its hosted copy shares the
// site's runtime while the offline loader continues to unpack the artwork and interactions.
export function hostOfflinePage(bytes, page) {
  let html = new TextDecoder('windows-1252').decode(bytes);
  if (page === 'glass-folder') {
    const credit = '<footer class="artwork-credit" data-zh="Figma 原稿设计：Nastaran Jamali。鼠标交互使用 WorkBuddy、DeepSeek 和 Flamo 实现。">Original Figma design by Nastaran Jamali. Mouse interactions built with WorkBuddy, DeepSeek and Flamo.</footer>';
    html = html.replace('<body>', counterLayout.replace('.counter-credit', '.artwork-credit') + '<body>').replace('<main></main>', '<main></main>' + credit);
  }
  if (page === 'counter') html = html.replace('<body>', counterLayout + '<body>').replace('<main></main>', '<main></main>' + counterCredit);
  if (page === 'card-shuffle') {
    const credit = '<footer class="artwork-credit" data-zh="原版 Figma 设计由 Alejandro Vasquez 创作。我用 Flamo 为卡片添加了左右滑动交互。">Original Figma design by Alejandro Vasquez. I used Flamo to make the cards swipeable.</footer>';
    html = html.replace('<body>', counterLayout.replace('.counter-credit', '.artwork-credit') + '<body>').replace('<main></main>', '<main></main>' + credit);
  }
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
