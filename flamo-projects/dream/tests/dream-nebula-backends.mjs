// Isolated pixel probe; only a test response replaces the project definition.
// Official Runtime/Preview and on-disk generated modules stay untouched.
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {chromium} from '../.flamo/tools/node_modules/playwright/index.mjs';
import ts from '../.flamo/tools/node_modules/typescript/lib/typescript.js';
const out=process.env.CONSTANT?'/tmp/dream-nebula-constant':'/tmp/dream-nebula-isolated';await mkdir(out,{recursive:true});
const source=await readFile('src/nodes/star-sea/nebula.ts','utf8');
const {nebulaWGSL,nebulaGLSL}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64'));
const server=spawn(process.execPath,['scripts/flamo-dev.mjs'],{env:{...process.env,PORT:'5178'},stdio:'ignore'});let browser;
const report={scope:'isolated public shader API pixels; NOT full-project completion',runs:[]};
const deadline=setTimeout(()=>{browser?.close();server.kill();},170000);
try{for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:5178/preview')).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}for(const backend of (process.env.CONSTANT?['webgpu']:['webgl','webgpu'])){
 const run={backend,errors:[]};report.runs.push(run);
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-webgpu','--use-angle=swiftshader','--disable-background-timer-throttling']});
 const page=await browser.newPage({viewport:{width:480,height:320}});
 page.on('pageerror',e=>run.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')run.errors.push(m.text());});
 await page.addInitScript(backend=>{window.contexts=[];if(backend==='webgl')Object.defineProperty(navigator,'gpu',{value:undefined});const orig=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(k,...a){let v=orig.call(this,k,...a);window.contexts.push({kind:k,ok:!!v});return v;};},backend);
 await page.route('**/artifact.flamo.json*',async route=>{const response=await route.fetch(),a=await response.json();const seek=ns=>ns.flatMap(n=>[n,...seek(n.children||[])]);const root=seek(a.scene.nodes).find(n=>n.guid?.sessionID===778376733&&n.guid?.localID===1);root.children=[];root.fillPaints=[];const canvas=a.scene.nodes.find(n=>n.type==='CANVAS');canvas.children=[root];a.scene.nodes=[canvas];const binding=a.nodeArtifacts['778376733:1'];binding.roles={};a.nodeArtifacts={'778376733:1':binding};await route.fulfill({json:a});});
 await page.route('**/register.definition.js*' ,route=>route.fulfill({contentType:'application/javascript',body:`import {defineNodeScript} from '/vendor/flamo-runtime/index.es.js';export default defineNodeScript({setup(props,ctx){const s=ctx.createShaderLayer({wgsl:${JSON.stringify(process.env.CONSTANT?'fn flamoFragment(uv:vec2<f32>)->vec4<f32>{return vec4<f32>(0.2,0.3,0.4,1.0);}':nebulaWGSL)},glsl:${JSON.stringify(nebulaGLSL)},phase:'foreground',label:'isolated shader test'});s.setTime(12);window.shaderProbe=s;}});`}));
 try{await page.goto('http://127.0.0.1:5178/preview');await page.waitForFunction(()=>window.shaderProbe?.status==='ready'||window.shaderProbe?.status==='error',null,{timeout:30000});
 run.state=await page.evaluate(()=>({status:shaderProbe.status,error:shaderProbe.error,contexts:window.contexts,visibility:document.visibilityState}));
 if(run.state.status==='error')throw new Error(run.state.error);
 for(const [name,time,x,z] of [['base',12,0,1],['pan-far',12,70000,.2],['pan-near',12,-70000,3],['evolved',90,-70000,3]]){
 await page.evaluate(({time,x,z})=>{shaderProbe.setTime(time);const c=window.__flamo_project.flamo.camera;c.panTo({x,y:-x});c.zoomTo(z);},{time,x,z});await page.waitForTimeout(700);await page.screenshot({path:`${out}/${backend}-${name}.png`,timeout:20000});
 }
 }catch(e){run.errors.push(String(e));}await browser.close();browser=null;await writeFile(out+'/result.json',JSON.stringify(report,null,2));
}}finally{clearTimeout(deadline);await browser?.close();server.kill();await writeFile(out+'/result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
