import {spawn} from 'node:child_process';
import {writeFile,mkdir} from 'node:fs/promises';
import {chromium} from '../.flamo/tools/node_modules/playwright/index.mjs';
const output='.flamo/reports/dream-infinite';await mkdir(output,{recursive:true});
const server=spawn(process.execPath,['scripts/flamo-dev.mjs'],{env:{...process.env,PORT:'5177'},stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',x=>logs+=x);server.stderr.on('data',x=>logs+=x);
let browser;const errors=[];
try{await new Promise(r=>setTimeout(r,1200));browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await page.goto('http://127.0.0.1:5177/preview');await page.waitForFunction(()=>window.__flamo_project?.debugScripts?.().nodeScripts?.some(s=>s.status==='mounted'),{},{timeout:90000});await page.waitForTimeout(20000);await page.screenshot({path:output+'/smoke.png'});const state=await page.evaluate(()=>({keys:Object.keys(window.__flamo_project||{}),body:document.body.innerText,trace:window.__flamo_project?.traceInteraction?.(),mounts:window.__flamo_project?.debugScripts?.()}));await writeFile(output+'/smoke.json',JSON.stringify({errors,state,logs},null,2));console.log(JSON.stringify({errors,keys:state.keys,body:state.body,trace:state.trace?.slice(-3)},null,2));}finally{await browser?.close();server.kill('SIGTERM');}
