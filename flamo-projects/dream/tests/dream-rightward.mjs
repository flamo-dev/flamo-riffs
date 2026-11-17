// Project-art algorithm checks only. No synthetic Runtime traces or completion receipts.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import ts from '../.flamo/tools/node_modules/typescript/lib/typescript.js';
import {DreamWorld,bodySway,driftRate,DREAM_TRANSPORT as D} from '../.flamo/generated/interactions/scripts/dream-star-sea-v1/world.js';
const world=new DreamWorld(1234),view={width:1440,height:900,center:{x:0,y:0},zoom:1};
function draw(v=view,t=0,w=world){const dots=[],lines=[];const counts=w.render(v,t,{dot(...p){assert(p.flat().every(Number.isFinite));dots.push(p)},line(a,b,width,c,alpha){assert([a.x,a.y,b.x,b.y,width,...c,alpha].every(Number.isFinite));lines.push([a,b,width,c,alpha])}});return {counts,dots,lines,signature:JSON.stringify([dots,lines])};}
let minSpeed=Infinity,maxPartitions=0,maxDots=0,maxLines=0,created=0,released=0;
for(let layer=0;layer<3;layer++)for(let stream=0;stream<2;stream++)for(let i=0;i<300;i++){
 const t=i*171.35,phase=i*.135,speed=.025+(i%46)/1000,dt=.01;
 const a=bodySway(t,phase,speed),b=bodySway(t+dt,phase,speed);
 const vx=driftRate(layer,stream,1234)+(b.x-a.x)/dt;
 assert(vx>0);assert(Math.abs(b.y-a.y)/dt<.00047);minSpeed=Math.min(minSpeed,vx);
}
assert(D.base-D.sway*D.maxFrequency>0);
for(let i=0;i<300;i++){
 const v={...view,center:{x:(i%2?-1:1)*i*70000,y:i*-1700},zoom:[.2,1,3,.73,1.42][i%5]};
 const r=draw(v,i*1739.7);maxPartitions=Math.max(maxPartitions,r.counts.partitions);maxDots=Math.max(maxDots,r.dots.length);maxLines=Math.max(maxLines,r.lines.length);created+=r.counts.created;released+=r.counts.released;
 assert(r.counts.groups>0);assert(r.counts.stars>0);
}
assert(maxPartitions<1000);assert(maxDots<18000);assert(maxLines<18000);assert(created>0&&released>0);
const first=draw(),still=draw();assert.equal(first.signature,still.signature);
draw({...view,center:{x:1e8,y:-1e8}},1e7);assert.equal(draw().signature,first.signature);
// No wrap at one nominal source-cell transit, or at very late times.
const signatures=new Set();for(const t of [0,1,100,1/driftRate(0,0,1234),10000,1e7])signatures.add(draw(view,t).signature);assert.equal(signatures.size,6);
// Compare exact incoming primitives with a larger source-lattice query, at arbitrary
// times and both sides of a stream cell boundary. This catches missing upstream cells.
for(const t of [0,222.21,222.23,10000,1e7])for(const zoom of [.2,1,3]){
 const small=draw({...view,zoom},t,new DreamWorld(1234));
 const big=draw({...view,width:3440,height:2900,zoom},t,new DreamWorld(1234));
 const key=p=>JSON.stringify(p.map(v=>Array.isArray(v)?v:v.toFixed(4)));
 const bigVisible=big.dots.map(([x,y,...tail])=>[x-1000,y-1000,...tail]).filter(([x,y])=>x>=0&&x<=1440&&y>=0&&y<=900);
 const smallSet=new Set(small.dots.map(key));for(const p of bigVisible)assert(smallSet.has(key(p)),'upstream body missed');
}
// Exercise actual layered contour output, not a copied brightness formula.
const focusLines=draw().lines;
assert(focusLines.length>0);
for(let i=0;i<focusLines.length;i+=4){
 const layers=focusLines.slice(i,i+4);assert.equal(layers.length,4);
 assert(layers[0][2]>layers[1][2]);assert(layers[1][2]>layers[2][2]);
 assert(layers[3][3].every(c=>c>=.3&&c<=1),'bounded pearl or white core');
}
const cores=focusLines.filter((_,i)=>i%4===3);assert(cores.filter(l=>Math.min(...l[3])>=.9).length/cores.length>.8,'white structural majority');assert(cores.some(l=>Math.min(...l[3])<.7),'visible pearl accents');
assert(focusLines.some(l=>l[2]>=20),'far wider scattering');
assert(focusLines.some(l=>l[4]>.7),'near bright core');
world.reset(5678);assert.notEqual(draw().signature,first.signature);
// Exercise the actual painter with its unchanged two-batch upload API, including
// fish, meteor, collision and ripples. This is CPU regression, not GPU/FPS evidence.
const {DreamPainter}=await import('../.flamo/generated/interactions/scripts/dream-star-sea-v1/painter.js');
const buffers=new Map();let batchCount=0;
const painter=new DreamPainter({createShapeBatch({capacity}){batchCount++;return {update(data,count){assert(count<capacity);assert(data instanceof Float32Array);if(buffers.has(capacity))assert.equal(buffers.get(capacity),data);buffers.set(capacity,data)},dispose(){}}}},'lines','dots');
let painterDots=0,painterLines=0;
for(let i=0;i<60;i++){
 const result=painter.render({time:i/3,pointer:{x:800,y:500},pointerActive:true,ripples:[{x:800,y:500,time:0}],reduced:false,view:{...view,zoom:[.2,1,3][i%3]}});
 painterDots=Math.max(painterDots,result.dots);painterLines=Math.max(painterLines,result.lines);
}
assert.equal(batchCount,2);painter.dispose();
const artifactBytes=await readFile('view/data/artifact.flamo.json'),artifact=JSON.parse(artifactBytes),binding=JSON.parse(await readFile('view/data/bindings.json'));
const flatten=nodes=>nodes.flatMap(n=>[n,...flatten(n.children??[])]);
for(const id of [34]){const n=flatten(artifact.scene.nodes).find(n=>n.guid?.localID===id&&n.guid?.sessionID===778376733);
 assert.deepEqual(n.size,{x:130,y:45});assert.equal(n.transform.m02,0);assert.equal(n.transform.m12,0);assert.equal(n.textAlignHorizontal,'CENTER');assert.equal(n.textAlignVertical,'CENTER');}
const viewport=await readFile('src/nodes/star-sea/viewport.ts','utf8');for(const text of ['https://flamo.dev/','target="_blank"','rel="noopener noreferrer"','aria-label='])assert(viewport.includes(text));
assert.equal(artifact.nodeArtifacts['778376733:1'].scripts[0].src,binding.bindings[0].src);
const contract=JSON.parse(await readFile('src/interactions/contracts/dream-star-sea.behavior.json'));
assert(JSON.stringify(contract).includes('dream.frame'));
const source=await readFile('src/nodes/star-sea/nebula.ts','utf8');
const module=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64'));
for(const text of [module.nebulaWGSL,module.nebulaGLSL]){assert(!/@(group|binding|vertex|fragment)|#version|\bmain\s*\(/.test(text));assert(text.includes('flamoFragment'));}
assert((await readFile('src/nodes/star-sea/script.ts','utf8')).includes('ctx.createShaderLayer'));
console.log(JSON.stringify({status:'algorithm-and-source-verified',revision:artifact.metadata.revision,artifactSha256:createHash('sha256').update(artifactBytes).digest('hex'),minSpeedInCellsPerSecond:minSpeed,painterDots,painterLines,buffersReused:true,maxPartitions,maxDots,maxLines,created,released,pauseDeterministic:true,differentExplicitSeeds:true,upstreamBoundaryChecks:15,shader:'integrated; GPU tested separately',preview:'not run in this test'},null,2));
