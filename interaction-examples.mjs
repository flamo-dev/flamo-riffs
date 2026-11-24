import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';

const origin = 'https://riffs.flamo.dev';

export async function buildInteractionExamples(root, revision = 'main') {
  if (revision !== 'main' && !/^[a-f0-9]{40}$/.test(revision)) throw Error('Invalid Riffs commit');
  const home = await readFile(resolve(root, 'html-examples/home/index.html'), 'utf8');
  const specs = JSON.parse(await readFile(resolve(root, 'interaction-examples.json'), 'utf8'));
  const result = [];
  const seen = new Set();
  for (const [, attributes, body] of home.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/gi)) {
    if (!classNames(attributes).includes('entry')) continue;
    const links = [...body.matchAll(/<a\b([^>]+)>/gi)].filter(([, a]) => classNames(a).includes('entry-link'));
    const href = links.length === 1 && attribute(links[0][1], 'href');
    const id = href && /^\/([a-z0-9-]+)\/$/.exec(href)?.[1];
    if (!id || seen.has(id) || !Object.hasOwn(specs,id)) throw Error('Missing or ambiguous interaction example for gallery card '+href);
    seen.add(id);
    const {title, usage, api, source, first, last} = specs[id];
    if (![title,usage,first,last].every(value=>typeof value==='string' && value.trim()) ||
        !Array.isArray(api) || !api.length || !api.every(value=>typeof value==='string' && value.trim()) ||
        !/^(?:flamo-projects\/[\w-]+\/src\/|html-examples\/[\w-]+\/)[\w./-]+\.(?:ts|js)$/.test(source) || source.split('/').includes('..'))
      throw Error('Invalid interaction example for '+id);
    const file = await realpath(resolve(root, source));
    const resolved = relative(await realpath(root), file);
    if (isAbsolute(resolved) || resolved.split(sep).join('/') !== source) throw Error('Unexpected example source '+source);
    const lines = (await readFile(file, 'utf8')).split(/\r?\n/);
    const starts = lines.flatMap((line, i) => line.trim() === first ? [i] : []);
    const start = starts[0], end = lines.findIndex((line, i) => i >= start && line.trim() === last);
    if (starts.length !== 1 || end < start || end-start >= 60) throw Error('Review source anchors for '+id+' in '+source);
    const code = lines.slice(start,end+1).join('\n');
    result.push({id,title,url:origin+href,usage,api,source,line:start+1,endLine:end+1,sourceUrl:`https://github.com/flamo-dev/flamo-riffs/blob/${revision}/${source}#L${start+1}-L${end+1}`,sha256:createHash('sha256').update(code).digest('hex')});
  }
  if (!seen.size || Object.keys(specs).some(id=>!seen.has(id))) throw Error('Gallery and interaction examples differ');
  return {schemaVersion:1,revision,examples:result};
}

export async function verifyPublishedSources(root, catalog) {
  if (catalog.revision === 'main') throw Error('Use an immutable RIFFS_RELEASE_COMMIT to verify public sources');
  const base = 'https://raw.githubusercontent.com/flamo-dev/flamo-riffs/'+catalog.revision+'/';
  const sources = new Set(['html-examples/home/index.html','interaction-examples.json',...catalog.examples.map(item=>item.source)]);
  await Promise.all([...sources].map(async source => {
    const response = await fetch(base+source,{signal:AbortSignal.timeout(30000)});
    if (!response.ok) throw Error('GitHub source unavailable: '+source+' ('+response.status+')');
    const normalize = text => text.replaceAll('\r\n','\n');
    if (normalize(await response.text()) !== normalize(await readFile(resolve(root,source),'utf8'))) {
      throw Error('Source differs from the public commit: '+source);
    }
  }));
}

function attribute(attributes, name) {
  return new RegExp('(?:^|\\s)'+name+'\\s*=\\s*(["\x27])([\\s\\S]*?)\\1','i').exec(attributes)?.[2];
}
function classNames(attributes) {
  return (attribute(attributes,'class') ?? '').split(/\s+/);
}


if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const catalog = await buildInteractionExamples(fileURLToPath(new URL('./',import.meta.url)));
  console.log('Verified '+catalog.examples.length+' gallery source examples');
}
