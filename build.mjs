// Emit only the static files used by the gallery, never the project sources or verification data.
import { cp, mkdir, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { relocateExport } from './html-examples/relocate-export.mjs';
import { hostOfflinePage } from './html-examples/host-offline-page.mjs';
import { buildInteractionExamples, verifyPublishedSources } from './interaction-examples.mjs';
import { addCoCreateEntry } from './html-examples/co-create-entry.mjs';
const source = fileURLToPath(new URL('./html-examples/',import.meta.url));
const out = process.env.RIFFS_BUILD_DIR ? resolve(process.env.RIFFS_BUILD_DIR) : fileURLToPath(new URL('./dist/',import.meta.url));
const root = dirname(resolve(source));
if (process.argv.includes('--release') && !process.env.RIFFS_RELEASE_COMMIT) throw Error('Set RIFFS_RELEASE_COMMIT to the published GitHub commit');
const catalog = await buildInteractionExamples(root,process.env.RIFFS_RELEASE_COMMIT);
if (process.env.RIFFS_RELEASE_COMMIT) await verifyPublishedSources(root,catalog);
async function copy(path, dest = path) {
  await mkdir(dirname(join(out,dest)),{recursive:true});
  await cp(join(source,path),join(out,dest),{recursive:true});
}
for (const path of ['home','common/riffs-shell.js','common/product-language.js','common/riffs-language.js','common/language-picker.css','common/riffs.css','common/favicon.png','common/logo.png','common/component-viewport.js','common/flamo-runtime','pipe/index.html','pipe/styles.css','pipe/demo.js','pipe/preview-viewport.js','pipe/pipe.mp4','pipe/pipe-preview.mp4','pipe/pipe-poster.jpg']) await copy(path);
await copy('home/index.html','index.html');
await copy('favicon.ico');
await copy('common/demo-screen.js');
await copy('common/cdn-config.js');
for (const [page, component, hostFiles] of [
  ['shumei', 'flamo-coal-system', ['coal-slots.js', 'robot-template.js']],
  ['jianpan', 'flamo-jianpan', ['monitor.css', 'trend.js', 'beng-green.png', 'beng-red.png', 'feng-green.png', 'feng-red.png', 'fire-burning.gif', 'smoke.gif']],
]) {
  for (const file of ['index.html', 'demo.js', page+'-preview.mp4', page+'-poster.jpg', ...hostFiles]) {
    await copy(page+'/'+file);
  }
  const componentDist = page+'/'+component+'-web-component/dist';
  for (const file of [component+'.js', component+'.loader.js', 'cdn-config.js', 'component-loading.css', 'component-resources.js', 'assets', 'interactions', 'resources']) {
    await copy(componentDist+'/'+file);
  }
}
await copy('MasterWind/masterwind-preview.mp4','masterwind/masterwind-preview.mp4');
await copy('MasterWind/masterwind-poster.jpg','masterwind/masterwind-poster.jpg');
await copy('dandelion/dandelion-preview.mp4');
await copy('dandelion/dandelion-poster.jpg');
await copy('motion/motion-preview.mp4');
await copy('motion/motion-poster.jpg');
await copy('electrolyser/electrolyser-preview.mp4');
await copy('electrolyser/electrolyser-poster.jpg');
await copy('counter/counter-preview.mp4');
await copy('counter/counter-poster.jpg');
await copy('cardShuffle/card-shuffle-preview.mp4', 'card-shuffle/card-shuffle-preview.mp4');
await copy('cardShuffle/card-shuffle-poster.jpg', 'card-shuffle/card-shuffle-poster.jpg');
await copy('glassFolder/glass-folder-preview.mp4', 'glass-folder/glass-folder-preview.mp4');
await copy('glassFolder/glass-folder-poster.jpg', 'glass-folder/glass-folder-poster.jpg');
// The offline exports embed binary data as Windows-1252 text. The web host serves HTML as UTF-8.
for (const [file, destination] of [
  ['MasterWind/MasterWind.html', 'masterwind/index.html'],
  ['dandelion/Dandelion · meadow.html', 'dandelion/index.html'],
  ['motion/index.html', 'motion/index.html'],
  ['electrolyser/index.html', 'electrolyser/index.html'],
  ['counter/index.html', 'counter/index.html'],
  ['cardShuffle/playable.html', 'card-shuffle/index.html'],
  ['glassFolder/index.html', 'glass-folder/index.html'],
]) {
  await writeFile(join(out, destination), hostOfflinePage(await readFile(join(source, file)), destination.split('/')[0]));
}
const game='saltline/flamo-saltline-web-component/';
const gameManifest=JSON.parse(await readFile(join(source,game,'manifest.json'),'utf8'));
const gameVersion=gameManifest.packaging.artifactRevision;
if(!/^local-[a-f0-9]+$/.test(gameVersion)) throw Error('Invalid Saltline export revision');
const publicGame='saltline/'+gameVersion+'/';
await copy('saltline/saltline-poster.jpg');
await copy('saltline/saltline-preview.mp4');
await copy(game+'manifest.json',publicGame+'manifest.json');
const gameHost=await readFile(join(source,'saltline/index.html'),'utf8');
await writeFile(join(out,'saltline/index.html'),gameHost.replaceAll('./flamo-saltline-web-component/','./'+gameVersion+'/'));
for (const path of ['component-integration.js','component-resources.js','component-loading.css','interactions','resources','assets']) await copy(game+'dist/'+path,publicGame+'dist/'+path);
for (const path of ['flamo-saltline.js','interactions/bundle.js']) {
  const file = game+'dist/'+path;
  await writeFile(join(out,publicGame+'dist/'+path), relocateExport(file,await readFile(join(source,file),'utf8')));
}
for (const id of ['1','2','3','4','group']) {
  const tag = 'flamo-pipe-' + id;
  const ws = 'pipe/' + tag + '-web-component/';
  await copy(ws+'manifest.json');
  for (const file of await readdir(join(source,ws,'dist'), {withFileTypes:true})) {
    if (file.name.endsWith('.d.ts') || file.name.endsWith('.map')) continue;
    if (!file.isDirectory() && !['cdn-config.js','component-integration.js','component-resources.js','component-loading.css',tag+'.js'].includes(file.name)) continue;
    const name = ws+'dist/'+file.name;
    if (file.name === 'cdn-config.js' || file.name === tag+'.js') {
      const data = await readFile(join(source,name),'utf8');
      await mkdir(dirname(join(out,name)),{recursive:true});
      await writeFile(join(out,name),relocateExport(name,data));
    } else await copy(name);
  }
}
await mkdir(join(out,'interaction-library'),{recursive:true});
const hostedWorks = new Map(catalog.examples.map(({id,title})=>[id,title]));
// Archived industrial works still have public detail URLs outside the gallery.
for (const [id,title] of [['shumei','Coal Handling Monitor'],['jianpan','Power Plant Monitor'],['electrolyser','600 kA Electrolysis Cell']])
  if (!hostedWorks.has(id)) hostedWorks.set(id,title);
for (const [id,title] of hostedWorks) {
  const page = await stat(join(out,id,'index.html')).catch(()=>null);
  if (!page?.isFile() || !page.size) throw Error('Missing staged gallery page: '+id);
  const path = join(out,id,'index.html');
  await writeFile(path,addCoCreateEntry(await readFile(path,'utf8'),id,title));
}
for (const path of [join(out,'index.html'),join(out,'home/index.html')])
  await writeFile(path,addCoCreateEntry(await readFile(path,'utf8')));
await writeFile(join(out,'interaction-library/cases.json'),JSON.stringify(catalog,null,2)+'\n');
console.log('Built Flamo Riffs: '+out);

