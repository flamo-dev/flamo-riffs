// Diagnosis only: serves unchanged official project Preview and shipped Runtime.
// No compile, pull, push, source mutation, private Runtime reads or synthetic traces.
import http from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from '../.flamo/tools/node_modules/playwright/index.mjs';
const out='.flamo/reports/dream-frame-meteor';await mkdir(out,{recursive:true});
const bytes=await readFile('view/data/artifact.flamo.json');
const report={revision:JSON.parse(bytes).metadata.revision,sha256:createHash('sha256').update(bytes).digest('hex'),errors:[],shots:[]};
const server=http.createServer(async(req,res)=>{try{const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const rel=p==='/preview'?'.flamo/preview/index.html':p.startsWith('/preview/')?'.flamo/preview/'+p.slice(9):p.startsWith('/vendor/flamo-runtime/')?'.flamo/runtime/'+p.slice(22):p.startsWith('/files/')?p.slice(7):null;if(!rel||!resolve(rel).startsWith(process.cwd()+'/')){res.writeHead(404);res.end();return;}const b=await readFile(rel);res.setHeader('Content-Type',({'.js':'text/javascript','.json':'application/json','.html':'text/html','.png':'image/png','.woff2':'font/woff2','.wasm':'application/wasm'})[extname(rel)]||'application/octet-stream');res.end(b);}catch(e){res.writeHead(404);res.end(String(e));}});await new Promise(r=>server.listen(5188,'127.0.0.1',r));
let browser;const deadline=setTimeout(()=>{browser?.close();server.close();},330000);
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-background-timer-throttling']});report.browser=browser.version();
 report.system=await (await browser.newBrowserCDPSession()).send('SystemInfo.getInfo');
 const page=await browser.newPage({viewport:{width:480,height:400}});page.on('pageerror',e=>report.errors.push(String(e)));
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'gpu',{value:undefined});
  const w=window.hudWitness={callbacks:[],samples:[],trace:[],phase:'startup',registrations:{},contexts:[]};
  const gc=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(k,...a){w.contexts.push(k);return gc.call(this,k,...a);};
  window.addEventListener('dream:trace',e=>w.trace.push(e.detail));
  const raf=window.requestAnimationFrame.bind(window);let seq=0;
  function snapshot(kind,frame,callback){const f=window.__flamo_project?.flamo;if(!f)return;const c={...f.camera.get()},a=document.querySelector('a[href="https://flamo.dev/"]');const s={kind,frame,callback,phase:w.phase,at:performance.now(),camera:c,brand:a?.getBoundingClientRect().toJSON()};w.samples.push(s);if(kind!=='telemetry')return;for(const id of [1,24,27,28,34]){f.$('778376733:'+id)?.current().then(n=>{s.nodes??={};const b=n.geometry.worldBounds;const now=f.camera.get();s.nodes[id]={bounds:b,screen:f.camera.worldToScreen(b),cameraAtResolve:{...now},resolvedAt:performance.now(),text:typeof n.text==='string'?n.text:undefined};}).catch(e=>{s.error=String(e);});}}
  window.requestAnimationFrame=function(fn){const id=++seq,name=fn.name||'anonymous',stack=new Error().stack.split('\n').slice(2,5).join('\n');w.registrations[name]??=stack;return raf(t=>{const cb={id,name,t,start:performance.now(),phase:w.phase};w.callbacks.push(cb);snapshot('before',t,name);try{return fn(t);}finally{cb.end=performance.now();snapshot('after',t,name);}});};
  window.addEventListener('dream:telemetry',e=>{w.frames??=[];w.frames.push({time:e.detail.time,dt:e.detail.dt,meteorStates:e.detail.meteorStates,meteors:e.detail.meteors,wallTime:e.detail.wallTime});snapshot('telemetry',performance.now(),'project-draw');});
 });
 await page.goto('http://127.0.0.1:5188/preview');await page.waitForFunction(()=>window.hudWitness.trace.some(x=>x.action==='nebula.ready'),null,{timeout:60000});await page.waitForTimeout(1800);
 const cdp=await page.context().newCDPSession(page);
 const phase=async p=>page.evaluate(p=>{window.hudWitness.phase=p;},p);
 const shot=async name=>{console.log('shot-start',name);const before=await page.evaluate(()=>({at:performance.now(),camera:window.__flamo_project.flamo.camera.get(),samples:window.hudWitness.samples.slice(-4)}));const s=await cdp.send('Page.captureScreenshot',{format:'png'});await writeFile(out+'/'+name+'.png',Buffer.from(s.data,'base64'));console.log('pixels-saved',name);report.shots.push({name,meteorFrame:await page.evaluate(()=>window.hudWitness.frames?.at(-1)),before,after:await page.evaluate(()=>({at:performance.now(),camera:window.__flamo_project.flamo.camera.get()}))});report.witness=JSON.parse(await page.evaluate(()=>JSON.stringify(window.hudWitness)));await writeFile(out+'/raw.json',JSON.stringify(report,null,2));console.log('shot-complete',name);};
 await phase('baseline');await shot('baseline');
 await phase('drag');await page.mouse.move(220,245);await page.mouse.down();for(let i=1;i<=24;i++){await page.mouse.move(220+i*6,245-i*2);await page.waitForTimeout(35);if(i===8||i===16)await shot('drag-'+i);}await page.mouse.up();await phase('drag-settled');await page.waitForTimeout(1800);await shot('drag-settled');
 await page.mouse.move(250,200);await phase('ctrl-wheel-in');await page.keyboard.down('Control');for(let i=0;i<16;i++){await page.mouse.wheel(0,-25);await page.waitForTimeout(60);if(i===6)await shot('zoom-in-moving');}await page.keyboard.up('Control');await phase('zoom-in-settled');await page.waitForTimeout(2000);await shot('zoom-in-settled');
 await phase('ctrl-wheel-out');await page.keyboard.down('Control');for(let i=0;i<16;i++){await page.mouse.wheel(0,25);await page.waitForTimeout(60);if(i===6)await shot('zoom-out-moving');}await page.keyboard.up('Control');await phase('zoom-out-settled');await page.waitForTimeout(2000);await shot('zoom-out-settled');

 const replay=async()=>{const p=await page.evaluate(async()=>{const f=window.__flamo_project.flamo,b=(await f.$('778376733:33').current()).geometry.worldBounds;return f.camera.worldToScreen({x:b.x+b.width/2,y:b.y+b.height/2});});await page.mouse.click(p.x,p.y);};
 await page.mouse.click(230,150);await replay();await phase('meteor-flight');
 for(const [name,predicate] of [
 ['entry',f=>f.meteorStates?.some(m=>m.entered&&m.age<2)],
 ['flight',f=>f.meteorStates?.some(m=>m.entered&&m.opacity===1&&m.age>2)],
 ['fade-moving',f=>f.meteorStates?.some(m=>m.entered&&m.opacity>.05&&m.opacity<.85&&m.age>m.life-m.fadeOut)]
 ]){await page.waitForFunction(`(${predicate.toString()})(window.hudWitness.frames.at(-1))`,null,{timeout:65000});await shot(name);}
 await page.waitForFunction(()=>window.hudWitness.trace.some(t=>t.action==='dream.collision'),null,{timeout:150000});await shot('real-contact');
 await replay();await page.waitForTimeout(1000);await shot('replay');
 report.traceVerification=await page.evaluate(()=>window.__flamo_project.verifyInteractionTrace('src/interactions/contracts/dream-star-sea.behavior.json','dream'));
 report.witness=JSON.parse(await page.evaluate(()=>JSON.stringify(window.hudWitness)));report.gesture=await page.evaluate(()=>({scrollX,scrollY,scale:visualViewport.scale}));
}catch(e){report.errors.push(String(e));console.error(e);}finally{await writeFile(out+'/raw.json',JSON.stringify(report,null,2));await browser?.close();server.close();clearTimeout(deadline);}console.log(JSON.stringify({revision:report.revision,errors:report.errors,samples:report.witness?.samples.length}));
