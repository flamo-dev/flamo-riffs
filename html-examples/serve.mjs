// Run node html-examples/serve.mjs [port] for a live, same-origin preview.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve, relative, extname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isExportEntry, relocateExport } from './relocate-export.mjs';
const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2] || 8080);
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json','.wasm':'application/wasm','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.woff2':'font/woff2' };
createServer(async (req,res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) return res.writeHead(405).end();
    const url = new URL(req.url,'http://localhost');
    const path = decodeURIComponent(url.pathname);
    let target = resolve(root,'.'+(path === '/' ? '/home/index.html' : path));
    const rel = relative(root,target);
    if (rel.startsWith('..') || isAbsolute(rel)) return res.writeHead(403).end();
    if ((await stat(target)).isDirectory()) {
      if (!path.endsWith('/')) return res.writeHead(308,{Location:url.pathname+'/'+url.search}).end();
      target = resolve(target,'index.html');
    }
    const info = await stat(target);
    const headers = {'Content-Type':types[extname(target)] || 'application/octet-stream','Cache-Control':'no-cache'};
    if (isExportEntry(path)) {
      const body = Buffer.from(relocateExport(path,await readFile(target,'utf8')));
      return res.writeHead(200,{...headers,'Content-Length':body.length}).end(req.method==='HEAD'?undefined:body);
    }
    let start=0, end=info.size-1, status=200;
    if (extname(target)==='.mp4') {
      headers['Accept-Ranges']='bytes';
      if (req.headers.range) {
        const range=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        if (!range || (!range[1] && !range[2])) return res.writeHead(416,{'Content-Range':'bytes */'+info.size}).end();
        start=range[1]?Number(range[1]):Math.max(0,info.size-Number(range[2]));
        end=range[1]&&range[2]?Math.min(end,Number(range[2])):end;
        if(start>end) return res.writeHead(416,{'Content-Range':'bytes */'+info.size}).end();
        status=206; headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;
      }
    }
    res.writeHead(status,{...headers,'Content-Length':end-start+1});
    if (req.method==='HEAD'||!info.size) return res.end();
    const stream=createReadStream(target,{start,end});
    stream.on('error',()=>res.destroy()); res.on('close',()=>stream.destroy()); stream.pipe(res);
  } catch { res.writeHead(404).end('Not found'); }
}).on('error', e=>{console.error(e.message);process.exitCode=1;}).listen(port,'localhost',()=>console.log('Flamo Riffs: http://localhost:'+port+'/'));

