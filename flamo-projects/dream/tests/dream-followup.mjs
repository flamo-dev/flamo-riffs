// Short real Preview diagnosis. No Runtime trace injection or private API access.
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from '../.flamo/tools/node_modules/playwright/index.mjs';
const out='.flamo/reports/dream-followup';await mkdir(out,{recursive:true});
const artifact=await readFile('view/data/artifact.flamo.json');
const report={revision:JSON.parse(artifact).metadata.revision,artifactSha256:createHash('sha256').update(artifact).digest('hex'),errors:[],samples:[],environment:{headless:true,viewport:{width:1000,height:700},launchArgs:['--no-sandbox']}};
const server=spawn(process.execPath,['scripts/flamo-dev.mjs'],{env:{...process.env,PORT:'5177'},stdio:['ignore','pipe','pipe']});let logs='',browser;
server.stdout.on('data',x=>logs+=x);server.stderr.on('data',x=>logs+=x);
const deadline=setTimeout(()=>{report.errors.push('90-second bounded diagnostic deadline');browser?.close();server.kill();},90000);
try{
 await new Promise(r=>setTimeout(r,1000));browser=await chromium.launch({headless:true,args:['--no-sandbox']});report.environment.browser=browser.version();
 const cdp=await browser.newBrowserCDPSession();report.environment.systemInfo=await cdp.send('SystemInfo.getInfo');
 const page=await browser.newPage({viewport:report.environment.viewport});page.setDefaultTimeout(12000);
 page.on('pageerror',e=>report.errors.push(String(e)));
 await page.addInitScript(()=>{
  window.dreamWitness={trace:[],frames:[],intervals:[],dropped:0};
  window.addEventListener('dream:trace',e=>{const w=window.dreamWitness;if(w.trace.length<1000)w.trace.push({...e.detail,wall:performance.now()});else w.dropped++;});
  window.addEventListener('dream:telemetry',e=>{const w=window.dreamWitness;w.frames.push(e.detail);if(w.frames.length>300)w.frames.shift();});
  let last;const tick=t=>{if(last){window.dreamWitness.intervals.push(t-last);if(window.dreamWitness.intervals.length>300)window.dreamWitness.intervals.shift();}last=t;requestAnimationFrame(tick);};requestAnimationFrame(tick);
 });
 await page.goto('http://127.0.0.1:5177/preview');await page.waitForFunction(()=>window.__flamo_project&&window.dreamWitness.frames.length>=2,null,{timeout:20000});
 const sample=async name=>{
  report.samples.push(await page.evaluate(async name=>{const p=window.__flamo_project,nodes=[];for(const id of [24,29,30,31,32,33,34]){const n=p.flamo.$('778376733:'+id),semantic=await n.current();nodes.push({id,semantic,screen:p.flamo.camera.worldToScreen(semantic.geometry.worldBounds)});}const a=document.querySelector('a[href="https://flamo.dev/"]');return {name,camera:p.flamo.camera.get(),frame:window.dreamWitness.frames.at(-1),nodes,brand:a?{href:a.href,target:a.target,rel:a.rel,name:a.getAttribute('aria-label'),rect:a.getBoundingClientRect().toJSON()}:null};},name));
  await page.screenshot({path:`${out}/${name}.png`,timeout:12000});
 };
 await sample('start');await page.mouse.click(600,340);await page.waitForTimeout(1800);
 // Native button hit location is read from public world bounds, never dispatch synthetic trace.
 const click=async id=>{const point=await page.evaluate(async id=>{const p=window.__flamo_project,b=(await p.flamo.$('778376733:'+id).current()).geometry.worldBounds;return p.flamo.camera.worldToScreen({x:b.x+b.width/2,y:b.y+b.height/2});},id);await page.mouse.click(point.x,point.y);};
 await click(31);await page.waitForTimeout(3500);await click(29);await page.waitForTimeout(500);await sample('paused');await page.waitForTimeout(1200);await sample('paused-later');await click(29);await click(33);await page.waitForTimeout(500);await sample('new-seed');
 report.formalTrace=await page.evaluate(()=>window.__flamo_project.verifyInteractionTrace('src/interactions/contracts/dream-star-sea.behavior.json','dream'));
 await page.evaluate(()=>window.__flamo_project.flamo.camera.panTo({x:9600,y:-6000}));await page.waitForTimeout(400);await sample('pan');
 await page.evaluate(()=>window.__flamo_project.flamo.camera.zoomTo(.2));await page.waitForTimeout(400);await sample('far');
 await page.evaluate(()=>window.__flamo_project.flamo.camera.zoomTo(3));await page.waitForTimeout(400);await sample('near');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);await sample('narrow');
 report.witness=await page.evaluate(()=>window.dreamWitness);report.runtimeTrace=await page.evaluate(()=>window.__flamo_project.instance.inspectInteractions().trace);report.officialTrace=await page.evaluate(()=>window.__flamo_project.traceInteraction('dream'));
}catch(e){report.errors.push(String(e));}finally{
 clearTimeout(deadline);if(browser){const pages=browser.contexts().flatMap(c=>c.pages());if(pages[0]){try{report.witness??=await pages[0].evaluate(()=>window.dreamWitness);}catch{}}await browser.close();}server.kill('SIGTERM');
 report.logs=logs;await writeFile(out+'/preview.json',JSON.stringify(report,null,2));console.log(JSON.stringify({errors:report.errors,samples:report.samples.map(s=>s.name),formal:report.formalTrace},null,2));
}
