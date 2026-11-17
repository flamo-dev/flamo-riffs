// Real project controls, public API readback; no synthetic Runtime trace.
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from '../.flamo/tools/node_modules/playwright/index.mjs';
const out='/tmp/dream-nebula-controls';await mkdir(out,{recursive:true});const bytes=await readFile('view/data/artifact.flamo.json');const r={revision:JSON.parse(bytes).metadata.revision,artifactSha256:createHash('sha256').update(bytes).digest('hex'),errors:[]};
const server=spawn(process.execPath,['scripts/flamo-dev.mjs'],{env:{...process.env,PORT:'5179'},stdio:'ignore'});let browser;const stop=setTimeout(()=>{browser?.close();server.kill();},90000);
try{for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:5179/preview')).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-background-timer-throttling','--disable-renderer-backgrounding']});const page=await browser.newPage({viewport:{width:480,height:400}});
 await page.addInitScript(()=>{Object.defineProperty(navigator,'gpu',{value:undefined});window.framesSeen=[];window.tracesSeen=[];window.addEventListener('dream:telemetry',e=>window.framesSeen.push(e.detail));window.addEventListener('dream:trace',e=>window.tracesSeen.push(e.detail));});
 await page.goto('http://127.0.0.1:5179/preview');await page.waitForFunction(()=>window.framesSeen.length>2);
 const snapshot=()=>page.evaluate(async()=>{const p=window.__flamo_project;return {camera:p.flamo.camera.get(),scroll:[scrollX,scrollY],viewportScale:visualViewport.scale,frame:framesSeen.at(-1),pause:(await p.flamo.$('778376733:30').current()).text};});
 r.beforeWheel=await snapshot();await page.mouse.move(240,140);await page.mouse.wheel(0,-200);await page.waitForTimeout(1200);r.afterWheel=await snapshot();
 const xy=await page.evaluate(async()=>{const p=window.__flamo_project,b=(await p.flamo.$('778376733:29').current()).geometry.worldBounds;return p.flamo.camera.worldToScreen({x:b.x+b.width/2,y:b.y+b.height/2});});await page.mouse.click(xy.x,xy.y);await page.waitForTimeout(700);r.pauseStart=await snapshot();
 const cdp=await page.context().newCDPSession(page);const shot=async name=>{const s=await cdp.send('Page.captureScreenshot',{format:'png'});await writeFile(`${out}/${name}.png`,Buffer.from(s.data,'base64'));};await shot('pause-start');await page.waitForTimeout(5500);r.pauseEnd=await snapshot();await shot('pause-end');
 await page.mouse.click(xy.x,xy.y);await page.waitForTimeout(700);r.resume=await snapshot();r.trace=await page.evaluate(()=>tracesSeen);
}catch(e){r.errors.push(String(e));}finally{clearTimeout(stop);await browser?.close();server.kill();await writeFile(out+'/result.json',JSON.stringify(r,null,2));console.log(JSON.stringify(r));}
