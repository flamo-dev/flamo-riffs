// Short real Preview diagnosis. No Runtime trace injection or private API access.
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from '../.flamo/tools/node_modules/playwright/index.mjs';
const out='.flamo/reports/dream-meteor-fade/preview';await mkdir(out,{recursive:true});
const artifact=await readFile('view/data/artifact.flamo.json');
const report={revision:JSON.parse(artifact).metadata.revision,artifactSha256:createHash('sha256').update(artifact).digest('hex'),errors:[],samples:[],environment:{headless:true,viewport:{width:480,height:400},launchArgs:['--no-sandbox']}};
const server=spawn(process.execPath,['scripts/flamo-dev.mjs'],{env:{...process.env,PORT:'5177'},stdio:['ignore','pipe','pipe']});let logs='',browser;
server.stdout.on('data',x=>logs+=x);server.stderr.on('data',x=>logs+=x);
const deadline=setTimeout(()=>{report.errors.push('270-second bounded diagnostic deadline');browser?.close();server.kill();},270000);
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
 await page.mouse.move(400,280);await page.mouse.down();await page.mouse.move(460,320,{steps:3});await page.mouse.up();await page.mouse.wheel(0,100);await page.waitForTimeout(400);await click(33);
 // Public camera tracking keeps an ordinary projectile in view for its full life.
 // No clocks, trajectories, collision targets, traces or seeds are written.
 await page.evaluate(()=>{window.fadeFollow={id:null,enabled:true};window.addEventListener('dream:telemetry',e=>{const state=window.fadeFollow;if(!state.enabled)return;const f=e.detail;if(state.id===null){const m=f.meteorStates.find(m=>m.age===0);if(m){state.id=m.id;state.start=performance.now();}}const m=f.meteorStates.find(m=>m.id===state.id);if(!m)return;const camera=window.__flamo_project.flamo.camera,c=camera.get(),center=camera.screenToWorld({x:innerWidth/2,y:innerHeight/2});camera.panTo({x:c.positionX+(m.x-center.x)*c.zoom,y:c.positionY+(m.y-center.y)*c.zoom});});});
 // Observe actual rendered telemetry; no clock mutation or synthetic events.
 const captured=new Set();let trackedId; report.tracking='Public camera follows one ordinary meteor; no time, trajectory, trace or seed mutation.';
 const shotSession=await page.context().newCDPSession(page);
 for(let i=0;i<160&&captured.size!==3;i++){
  const f=await page.evaluate(()=>{const w=window.dreamWitness,f=w.frames.at(-1);return {...f,states:f.meteorStates.map(m=>({...m,screen:window.__flamo_project.flamo.camera.worldToScreen(m)})),follow:window.fadeFollow,collision:w.trace.find(t=>t.action==='dream.collision')};});
  for(const m of f.states||[]){
   if(trackedId===undefined&&f.follow.id!==null)trackedId=f.follow.id;
   if(m.id!==trackedId)continue;

   const phase=m.age>0&&m.age<m.fadeIn*.7?'birth':m.opacity===1?'middle':m.age>m.life-m.fadeOut&&m.opacity>0&&m.opacity<.8?'fade':null;
   if(phase&&!captured.has(phase)){
    const shot=await shotSession.send('Page.captureScreenshot',{format:'png'});await writeFile(`${out}/meteor-${phase}.png`,Buffer.from(shot.data,'base64'));
    const after=await page.evaluate(()=>window.dreamWitness.frames.at(-1));report.samples.push({name:'meteor-'+phase,frame:f,selectedMeteor:m,afterCapture:after});captured.add(phase);
   }
  }
  report.fadeStages=[...captured];report.witness=await page.evaluate(()=>window.dreamWitness);await writeFile(out+'/preview.json',JSON.stringify(report,null,2));
  await page.waitForTimeout(100);
 }
 if(captured.size!==3)throw new Error('Incomplete lifecycle: '+JSON.stringify([...captured]));
 report.follow=await page.evaluate(()=>{window.fadeFollow.enabled=false;return window.fadeFollow;});
 report.ordinary={trackedId,collisions:report.witness.trace.filter(t=>t.action==='dream.collision'&&t.detail.meteorId===trackedId&&t.wall>=report.follow.start)};
 if(report.ordinary.collisions.length)throw new Error('Tracked meteor collided: ordinary lifecycle not established');
 await click(33);await page.waitForFunction(()=>window.dreamWitness.trace.some(t=>t.action==='dream.collision'),null,{timeout:150000});
 report.contact=await page.evaluate(()=>window.dreamWitness.trace.find(t=>t.action==='dream.collision'));

 await click(33);await page.waitForTimeout(500);
 report.resets=await page.evaluate(()=>window.dreamWitness.trace.filter(t=>t.action==='dream.replay'));
 for(const r of report.resets)if(JSON.stringify(r.detail.after.camera)!==JSON.stringify(r.detail.initialCamera))throw new Error('camera reset mismatch');
 await page.evaluate(()=>window.dreamWitness.intervals=[]);await page.waitForTimeout(6000);
 report.performance=await page.evaluate(()=>({visibility:document.visibilityState,intervals:window.dreamWitness.intervals,frames:window.dreamWitness.frames.slice(-20)}));
 report.traceVerification=await page.evaluate(()=>window.__flamo_project.verifyInteractionTrace('src/interactions/contracts/dream-star-sea.behavior.json','dream'));
 await writeFile(out+'/preview.json',JSON.stringify(report,null,2));
 report.pageGesture=await page.evaluate(()=>({scrollX,scrollY,scale:visualViewport.scale}));
 report.witness=await page.evaluate(()=>window.dreamWitness);
 await writeFile(out+'/preview.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({out,traceVerification:report.traceVerification,resets:report.resets.length,errors:report.errors}));
}catch(e){try{report.traceVerification=await browser.contexts()[0].pages()[0].evaluate(()=>window.__flamo_project.verifyInteractionTrace('src/interactions/contracts/dream-star-sea.behavior.json','dream'));}catch{}report.errors.push(String(e));await writeFile(out+'/preview.json',JSON.stringify(report,null,2));console.error(e);process.exitCode=1;}finally{clearTimeout(deadline);await browser?.close();server.kill();await writeFile(out+'/server.log',logs);}
