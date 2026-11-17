import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from '../.flamo/tools/node_modules/playwright/index.mjs';
const out='.flamo/reports/dream-infinite';await mkdir(out,{recursive:true});
const server=spawn(process.execPath,['scripts/flamo-dev.mjs'],{env:{...process.env,PORT:'5177'},stdio:'ignore'});
let browser;const report={errors:[],shots:[],samples:[]};
try{
 await new Promise(r=>setTimeout(r,1000));browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});page.setDefaultTimeout(120000);page.on('pageerror',e=>report.errors.push(String(e)));
 await page.addInitScript(()=>{window.dreamTelemetry=[];window.addEventListener('dream:telemetry',e=>{window.dreamTelemetry.push(e.detail);if(window.dreamTelemetry.length>300)window.dreamTelemetry.shift()})});
 await page.goto('http://127.0.0.1:5177/preview');await page.waitForFunction(()=>window.dreamTelemetry?.length>2);
 const sample=async name=>{const s=await page.evaluate(async()=>{const p=window.__flamo_project;const ids=[1,24,29,30,31,32,33,34];return {telemetry:window.dreamTelemetry.slice(-1)[0],revision:p.artifactData.metadata?.revision,camera:p.flamo.camera.get(),trace:p.traceInteraction('dream'),nodes:await Promise.all(ids.map(async id=>({id,semantic:await p.flamo.$('778376733:'+id).current()}))),brand:{href:document.querySelector('a')?.href,target:document.querySelector('a')?.target,rel:document.querySelector('a')?.rel,rect:document.querySelector('a')?.getBoundingClientRect().toJSON()},viewport:{width:innerWidth,height:innerHeight}}});report.samples.push({name,...s});return s};
 const shot=async name=>{await page.screenshot({path:`${out}/${name}.png`});report.shots.push(name);await sample(name)};
 await shot('start');
 await page.evaluate(()=>{window.dreamIntervals=[];let last;function tick(t){if(last)window.dreamIntervals.push(t-last);last=t;if(window.dreamIntervals.length<300)requestAnimationFrame(tick)}requestAnimationFrame(tick)});
 await page.mouse.click(820,420);await page.waitForTimeout(4000);await shot('motion-touch');
 await page.mouse.click(1165,812);await page.waitForTimeout(12000);await shot('meteor-collision');
 await page.mouse.click(1015,812);await page.waitForTimeout(1000);await shot('paused');await page.waitForTimeout(3000);await shot('paused-later');
 await page.mouse.click(1015,812);await page.waitForTimeout(1000);
 // Space + primary-button pan follows the Preview input route.
 await page.keyboard.down('Space');for(let i=0;i<12;i++){await page.mouse.move(1100,620);await page.mouse.down();await page.mouse.move(180,200,{steps:3});await page.mouse.up();}await page.keyboard.up('Space');
 await page.waitForTimeout(1500);await shot('pan');
 await page.mouse.move(700,450);await page.keyboard.down('Control');await page.mouse.wheel(0,2000);await page.keyboard.up('Control');await page.waitForTimeout(1500);await shot('zoom-far');
 await page.keyboard.down('Control');await page.mouse.wheel(0,-3500);await page.keyboard.up('Control');await page.waitForTimeout(1500);await shot('zoom-near');
 // Public-camera stress supplements, never substitutes for input-route tests above.
 for(let i=0;i<24;i++){await page.evaluate(i=>window.__flamo_project.flamo.camera.panTo({x:i*3200,y:i%2?i*2200:-i*2200}),i);await page.waitForTimeout(60);}
 await page.waitForTimeout(1000);await shot('long-pan');
 await page.mouse.click(1320,812);await page.waitForTimeout(1500);await shot('new-seed');
 report.traceVerification=await page.evaluate(()=>window.__flamo_project.verifyInteractionTrace('src/interactions/contracts/dream-star-sea.behavior.json','dream'));
 report.frameIntervals=await page.evaluate(()=>window.dreamIntervals);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(2000);await shot('narrow');
 await page.locator('a[href="https://flamo.dev/"]').focus();report.brandKeyboard=await page.locator('a').evaluate(a=>a===document.activeElement);
 const popupPromise=page.waitForEvent('popup');await page.locator('a').click();const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded',{timeout:10000}).catch(()=>{});report.brandOpened=popup.url();await popup.close();
}catch(e){report.errors.push(String(e));}finally{await browser?.close();server.kill('SIGTERM');const artifact=await readFile('view/data/artifact.flamo.json');report.artifactSha256=createHash('sha256').update(artifact).digest('hex');report.environment={browser:'Chromium 145, Playwright 1.58.2, headless, local bundled Runtime',viewport:'1440x900 and 390x844',chineseFont:'Unavailable in fixed environment'};await writeFile(out+'/acceptance.json',JSON.stringify(report,null,2));console.log(JSON.stringify({errors:report.errors,shots:report.shots,trace:report.traceVerification},null,2));}
