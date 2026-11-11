// Emit only the static files used by the gallery, never the project sources or verification data.
import { cp, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { relocateExport } from './html-examples/relocate-export.mjs';
const source = fileURLToPath(new URL('./html-examples/',import.meta.url));
const out = fileURLToPath(new URL('./dist/',import.meta.url));
async function copy(path, dest = path) {
  await mkdir(dirname(join(out,dest)),{recursive:true});
  await cp(join(source,path),join(out,dest),{recursive:true});
}
for (const path of ['home','common/riffs-shell.js','common/riffs.css','common/favicon.png','common/logo.png','common/component-viewport.js','common/flamo-runtime','pipe/index.html','pipe/styles.css','pipe/demo.js','pipe/preview-viewport.js','pipe/pipe.mp4','pipe/pipe-preview.mp4','pipe/pipe-poster.jpg']) await copy(path);
await copy('home/index.html','index.html');
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
console.log('Built Flamo Riffs: '+out);

