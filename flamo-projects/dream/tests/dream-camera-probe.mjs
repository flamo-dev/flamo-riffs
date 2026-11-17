import {spawn} from 'node:child_process';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from '../.flamo/tools/node_modules/playwright/index.mjs';
const server=spawn(process.execPath,['scripts/flamo-dev.mjs'],{env:{...process.env,PORT:'5177'},stdio:'ignore'});let browser;const result={samples:[],errors:[]};
try{await new Promise(r=>setTimeout(r,1000));browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1440,height:900}});page.setDefaultTimeout(45000);
await page.addInitScript(()=>{window.dreamTelemetry=[];window.addEventListener('dream:telemetry',e=>{window.dreamTelemetry.push({...e.detail,wall:performance.now()});if(window.dreamTelemetry.length>500)window.dreamTelemetry.shift()})});
await page.goto('http://127.0.0.1:5177/preview');await page.waitForFunction(()=>window.dreamTelemetry.length>3);
const sample=async name=>{await page.waitForTimeout(2000);await page.screenshot({path:`.flamo/reports/dream-infinite/probe-${name}.png`});result.samples.push(await page.evaluate(async name=>{const p=window.__flamo_project;const nodes=[];for(const id of [1,24,29,30,31,32,33,34]){let semantic=await p.flamo.$('778376733:'+id).current();const b=semantic.geometry.worldBounds;nodes.push({id,semantic,screen:p.flamo.camera.worldToScreen(b)});}return {name,camera:p.flamo.camera.get(),nodes,telemetry:window.dreamTelemetry.at(-1),trace:p.traceInteraction('dream')};},name));};
await sample('initial');await page.keyboard.down('Space');await page.mouse.move(1100,600);await page.mouse.down();await page.mouse.move(100,100,{steps:2});await page.mouse.up();await page.keyboard.up('Space');await sample('space-drag');
await page.keyboard.down('Control');await page.mouse.wheel(0,900);await page.keyboard.up('Control');await sample('ctrl-zoom');
await page.evaluate(()=>window.__flamo_project.flamo.camera.zoomTo(.2));await sample('far');await page.evaluate(()=>window.__flamo_project.flamo.camera.zoomTo(3));await sample('near');
result.telemetry=await page.evaluate(()=>window.dreamTelemetry);result.traceVerification=await page.evaluate(()=>window.__flamo_project.verifyInteractionTrace('src/interactions/contracts/dream-star-sea.behavior.json','dream'));
}catch(e){result.errors.push(String(e))}finally{await browser?.close();server.kill();result.artifactSha256=createHash('sha256').update(await readFile('view/data/artifact.flamo.json')).digest('hex');await writeFile('.flamo/reports/dream-infinite/camera-probe.json',JSON.stringify(result,null,2));console.log(result.errors,result.samples.map(s=>({name:s.name,camera:s.camera})));}
