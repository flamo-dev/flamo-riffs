// Only the hosted copy receives a form launcher; downloadable art remains standalone.
export function addCoCreateEntry(html, id, title) {
  const origin = new URL(process.env.RIFFS_OFFICIAL_ORIGIN || 'https://flamo.dev').origin;
  const assets =
    '<link rel="stylesheet" href="' +
    origin +
    '/co-create/entry.css"><script defer src="' +
    origin +
    '/co-create/open.js"></script>';
  // Single-page exports use an implicit head. Both export formats include a title.
  if (!html.includes('</title>')) throw Error('Missing document title on ' + (id || 'gallery'));
  html = html.replace('</title>', '</title>' + assets);
  if (!id) return html.replace('https://flamo.dev/co-create/panel.html', origin + '/co-create/panel.html');
  const query = new URLSearchParams({ from: 'work', work: id, title }).toString().replaceAll('&', '&amp;');
  const link =
    '<a class="flamo-co-trigger" data-co-create="work" data-zh="用我的设计试试" href="' +
    origin +
    '/co-create/panel.html?' +
    query +
    '">Try with my design</a>';
  if (id === 'pipe') return html.replace(/(<p class="intro-copy"[^>]*>[\s\S]*?<\/p>)/, '$1' + link);
  const newsletter = /<a class="riffs-newsletter\b/;
  if (!newsletter.test(html)) throw Error('Missing co-creation entry placement for ' + id);
  return html.replace(newsletter, link + '$&');
}
