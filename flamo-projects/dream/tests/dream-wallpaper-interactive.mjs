// Executes the real TypeScript setup against a public-API double, NOT a host route test.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from '../.flamo/tools/node_modules/typescript/lib/typescript.js';
const source=readFileSync('src/nodes/star-sea/script.ts','utf8');
const js=ts.transpileModule(source.replace(/^import .*;\n/gm,'').replace('export default ','globalThis.definition='),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
function mount(search){
 const listeners=new Map(),activations=new Map(),traces=[],dispatched=[],renders=[],zoomCalls=[];
 let now=1000;
 let camera={positionX:0,positionY:0,zoom:1,rotation:0},update,wallpaper,disposed;
 const node=id=>({id,design:()=>({appearance:{fills:[]}}),setVisible(){},setOpacity(){},setText(){},setFill(){}});
 const painter={world:{seed:0,reset(s){this.seed=s;}},meteors:{reset(){},events:[],meteors:[],bursts:[]},render(input){renders.push(structuredClone(input));return {};},dispose(){}};
 const ctx={node:(id='root')=>node(id),role:node,createShapeBatch(){},reactive:s=>s,
  camera:{get:()=>({...camera}),set:p=>Object.assign(camera,p),panTo:p=>Object.assign(camera,{positionX:p.x,positionY:p.y}),zoomTo:z=>{zoomCalls.push(z);camera.zoom=z;},fit(){}},
  trace:(action,detail)=>traces.push({action,detail}),createShaderLayer:()=>({setTime(){},status:'ready',ready:Promise.resolve(),dispose(){}}),
  on:(name,fn,options)=>listeners.set(name,{fn,options}),onActivate:(role,fn)=>activations.set(role,fn),onUpdate:fn=>{update=fn;return ()=>{};},dispose:fn=>{disposed=fn;}};
 const sandbox={defineNodeScript:d=>d,DreamPainter:function(){return painter;},createViewport:(_ctx,w)=>{wallpaper=w;return {hitControls:()=>false,update:()=>({width:800,height:600,zoom:camera.zoom,center:{x:0,y:0}}),dispose(){}};},
  clamp:(x,a,b)=>Math.min(b,Math.max(a,x)),nebulaWGSL:'',nebulaGLSL:'',location:{search},URLSearchParams,
  crypto:{getRandomValues:a=>{a[0]=12345;return a;}},innerWidth:800,innerHeight:600,
  setTimeout:()=>0,clearTimeout(){},performance:{now:()=>now+=16},window:{dispatchEvent(e){assert.equal(e.type.startsWith('dream:'),true);if(e.type==='dream:trace')dispatched.push(e.detail);}},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},console};
 vm.runInNewContext(js,sandbox);sandbox.definition.setup({},ctx);
 const event=(x=100,y=150,extra={})=>({target:'root',coordinates:{view:{x,y},world:{x,y}},pointer:{isPrimary:true,button:0,pointerId:1},preventDefault(){this.prevented=true;},...extra});
 return {listeners,activations,traces,dispatched,renders,zoomCalls,ctx,event,wallpaper,seed:painter.world.seed,frame:()=>update(),fire:(name,e)=>listeners.get(name)?.fn(e),dispose:()=>disposed()};
}
const matrix=[['',false,true],['?interactive=0',false,true],['?interactive=1',false,true],['?wallpaper=1',true,false],['?wallpaper=1&interactive=0',true,false],['?wallpaper=1&interactive=true',true,false],['?wallpaper=1&interactive=01',true,false],['?wallpaper=1&interactive=1',true,true]];
for(const [url,w,i] of matrix){const m=mount(url);assert.equal(m.wallpaper,w);assert.equal(m.listeners.has('pointermove'),i);assert.equal(m.listeners.has('wheel'),w&&i);assert.equal(m.activations.has('replay'),!w);m.dispose();}
const m=mount('?wallpaper=1&interactive=1&seed=20261003');assert.equal(m.seed,20261003);
m.fire('pointermove',m.event(300,200));m.frame();assert.equal(m.renders.at(-1).pointerActive,true);
m.fire('pointerdown',m.event());m.fire('pointerup',m.event());m.frame();assert.equal(m.renders.at(-1).ripples.length,1);assert.equal(m.traces.filter(e=>e.action==='dream.touch').length,1);
m.fire('pointerdown',m.event());m.fire('pointermove',m.event(140,180));m.fire('pointerup',m.event(140,180));assert.equal(m.ctx.camera.get().positionX,-40);assert.equal(m.ctx.camera.get().positionY,-30);assert.equal(m.traces.filter(e=>e.action==='dream.pan').length,1);assert.equal(m.traces.filter(e=>e.action==='dream.touch').length,1);
for(const [deltaY,deltaMode,pixels] of [[-120,0,-120],[3,1,48],[1,2,600]]){const before=m.ctx.camera.get().zoom,e=m.event(100,150,{deltaY,deltaMode});m.fire('wheel',e);assert.equal(m.ctx.camera.get().zoom,before*Math.exp(-pixels*.001));assert.equal(e.prevented,true);m.frame();}
assert.equal(m.listeners.get('wheel').options.passive,false);assert.equal(m.traces.filter(e=>e.action==='dream.zoom').length,3);
const count=m.zoomCalls.length;for(const deltaY of [0,NaN,Infinity])m.fire('wheel',m.event(0,0,{deltaY,deltaMode:0}));assert.equal(m.zoomCalls.length,count);
for(let n=0;n<30;n++)m.fire('wheel',m.event(0,0,{deltaY:-100000,deltaMode:0}));assert.equal(m.ctx.camera.get().zoom,8);
for(let n=0;n<30;n++)m.fire('wheel',m.event(0,0,{deltaY:100000,deltaMode:0}));assert.equal(m.ctx.camera.get().zoom,.0625);
m.fire('pointerdown',m.event());m.fire('pointercancel',m.event());m.fire('pointerup',m.event());assert.equal(m.traces.filter(e=>e.action==='dream.touch').length,1);
for(const action of ['dream.touch','dream.pan','dream.zoom'])assert(m.dispatched.some(e=>e.action===action));
m.dispose();
console.log(JSON.stringify({status:'pass',urlCases:matrix.length,checks:['pointer response','ripple','drag without touch','wheel pixels/lines/pages','zoom trace','finite deltas','zoom bounds','cancel','preview wheel non-registration','seed'],runtimeRouteVerified:false}));
