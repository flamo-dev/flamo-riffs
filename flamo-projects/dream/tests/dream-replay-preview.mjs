// Short real Preview diagnosis. No Runtime trace injection or private API access.
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from '../.flamo/tools/node_modules/playwright/index.mjs';
const out='/tmp/dream-replay-preview';await mkdir(out,{recursive:true});
const artifact=await readFile('view/data/artifact.flamo.json');
const report={revision:JSON.parse(artifact).metadata.revision,artifactSha256:createHash('sha256').update(artifact).digest('hex'),errors:[],samples:[],environment:{headless:true,viewport:{width:480,height:400},launchArgs:['--no-sandbox']}};
const server=spawn(process.execPath,['scripts/flamo-dev.mjs'],{env:{...process.env,PORT:'5177'},stdio:['ignore','pipe','pipe']});let logs='',browser;
server.stdout.on('data',x=>logs+=x);server.stderr.on('data',x=>logs+=x);
const deadline=setTimeout(()=>{report.errors.push('330-second bounded diagnostic deadline');browser?.close();server.kill();},330000);
try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:5177/preview')).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});report.environment.browser=browser.version();
 const cdp=await browser.newBrowserCDPSession();report.environment.systemInfo=await cdp.send('SystemInfo.getInfo');
 const page=await browser.newPage({viewport:report.environment.viewport});page.setDefaultTimeout(12000);
 page.on('pageerror',e=>report.errors.push(String(e)));
 await page.addInitScript(({backend})=>{
  window.contextWitness=[];
  if(backend==='webgl')Object.defineProperty(navigator,'gpu',{value:undefined});
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(kind,...args){const result=original.call(this,kind,...args);window.contextWitness.push({kind,ok:!!result});return result;};
  window.dreamWitness={trace:[],frames:[],intervals:[],dropped:0};
  window.addEventListener('dream:trace',e=>{const w=window.dreamWitness;if(w.trace.length<1000)w.trace.push({...e.detail,wall:performance.now()});else w.dropped++;});
  window.addEventListener('dream:telemetry',e=>{const w=window.dreamWitness;w.frames.push(e.detail);if(w.frames.length>300)w.frames.shift();});
  let last;const tick=t=>{if(last){window.dreamWitness.intervals.push(t-last);if(window.dreamWitness.intervals.length>300)window.dreamWitness.intervals.shift();}last=t;requestAnimationFrame(tick);};requestAnimationFrame(tick);
 },{backend:process.env.BACKEND});
 await page.goto('http://127.0.0.1:5177/preview');await page.waitForFunction(()=>window.__flamo_project&&window.dreamWitness.frames.length>=2,null,{timeout:60000});
 const sample=async name=>{
  report.samples.push(await page.evaluate(async name=>{const p=window.__flamo_project,nodes=[];await Promise.all([24,34].map(async id=>{const n=p.flamo.$('778376733:'+id),semantic=await n.current();nodes.push({id,semantic,screen:p.flamo.camera.worldToScreen(semantic.geometry.worldBounds)});}));const a=document.querySelector('a[href="https://flamo.dev/"]');return {name,camera:p.flamo.camera.get(),frame:window.dreamWitness.frames.at(-1),nodes,brand:a?{href:a.href,target:a.target,rel:a.rel,name:a.getAttribute('aria-label'),rect:a.getBoundingClientRect().toJSON()}:null};},name));
  report.witness=await page.evaluate(()=>window.dreamWitness);await writeFile(out+'/preview.json',JSON.stringify(report,null,2));const shot=await (await page.context().newCDPSession(page)).send('Page.captureScreenshot',{format:'png'});await writeFile(`${out}/${name}.png`,Buffer.from(shot.data,'base64'));
 };
 await page.bringToFront();
 const click=async id=>{const point=await page.evaluate(async id=>{const p=window.__flamo_project,b=(await p.flamo.$('778376733:'+id).current()).geometry.worldBounds;return p.flamo.camera.worldToScreen({x:b.x+b.width/2,y:b.y+b.height/2});},id);await page.mouse.click(point.x,point.y);};

 report.contexts=await page.evaluate(()=>window.contextWitness);
 await page.waitForTimeout(1500);await sample('initial');
 await page.mouse.click(240,150);
 for(let cycle=0;cycle<3;cycle++){
  await page.mouse.move(200,160);await page.mouse.down();await page.mouse.move(350,220,{steps:5});await page.mouse.up();
  await page.mouse.wheel(0,cycle%2?-300:300);await page.waitForTimeout(700);
  await page.evaluate(c=>window.__flamo_project.flamo.camera.set({positionX:70000*(c%2?-1:1),positionY:-70000,zoom:c===0?.2:3}),cycle);
  await page.waitForTimeout(600);if(cycle===0)await sample('pan-zoom-'+cycle);await click(33);await page.waitForTimeout(500);
  report.resets=await page.evaluate(()=>window.dreamWitness.trace.filter(t=>t.action==='dream.replay'));
  if(!report.resets.length)throw new Error('Replay route absent');
  const r=report.resets.at(-1).detail;if(JSON.stringify(r.after.camera)!==JSON.stringify(r.initialCamera))throw new Error('camera reset mismatch');
 }
 await page.waitForFunction(()=>window.dreamWitness.trace.some(t=>t.action==='dream.collision'),null,{timeout:100000});await click(33);await page.waitForTimeout(600);report.traceVerification=await page.evaluate(()=>window.__flamo_project.verifyInteractionTrace('src/interactions/contracts/dream-star-sea.behavior.json','dream'));await writeFile(out+'/preview.json',JSON.stringify(report,null,2));
 await page.evaluate(()=>window.dreamWitness.intervals=[]);await page.waitForTimeout(6000);
 report.performance=await page.evaluate(()=>({visibility:document.visibilityState,intervals:window.dreamWitness.intervals,frames:window.dreamWitness.frames.slice(-20)}));
 report.traceVerification=await page.evaluate(()=>window.__flamo_project.verifyInteractionTrace('src/interactions/contracts/dream-star-sea.behavior.json','dream'));
 await writeFile(out+'/preview.json',JSON.stringify(report,null,2));
 report.pageGesture=await page.evaluate(()=>({scrollX,scrollY,scale:visualViewport.scale}));
 await page.setViewportSize({width:390,height:600});await page.waitForTimeout(800);await click(33);await page.waitForTimeout(800);await sample('narrow-reset');
 report.witness=await page.evaluate(()=>window.dreamWitness);
 await writeFile(out+'/preview.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({out,traceVerification:report.traceVerification,resets:report.resets.length,errors:report.errors}));
}catch(e){report.errors.push(String(e));await writeFile(out+'/preview.json',JSON.stringify(report,null,2));console.error(e);process.exitCode=1;}finally{clearTimeout(deadline);await browser?.close();server.kill();await writeFile(out+'/server.log',logs);}
