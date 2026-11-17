// Pure CPU regression: no canvas, viewport fitting, private Runtime API or GPU claim.
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {createNova} from '../.flamo/generated/interactions/scripts/dream-star-sea-v1/supernova.js';
import {DreamPainter} from '../.flamo/generated/interactions/scripts/dream-star-sea-v1/painter.js';

function harness(){
 const active=new Map(),counts={creates:0,disposes:0,peak:0};
 let failNext=false;
 const ctx={createShapeBatch({node,polygon,capacity}){
  assert(polygon.length>=8);assert(Number.isInteger(capacity)&&capacity>0&&capacity<=100000);
  const record={node,capacity,data:null,count:0,source:null};
  active.set(record,record);counts.creates++;counts.peak=Math.max(counts.peak,active.size);
  return {update(data,count){
   assert(active.has(record),'update after disposal');
   assert(count<=capacity,'Runtime would truncate');assert(count*10<=data.length);
   if(failNext){failNext=false;throw Error('injected upload failure');}
   record.data=data.slice(0,count*10);record.source=data;record.count=count;
  },dispose(){assert(active.delete(record),'double disposal');counts.disposes++;}};
 }};
 return {ctx,active,counts,fail(){failNext=true;},get(node){const rows=[...active.values()].filter(r=>r.node===node);assert.equal(rows.length,1);return rows[0];}};
}
function painter(seed=1){const h=harness(),p=new DreamPainter(h.ctx,'lines','dots');p.world.reset(seed);p.meteors.reset(seed);return {h,p};}
function check(h,s){
 assert.equal(h.active.size,2);assert.equal(s.batchCount,2);
 for(const kind of ['lines','dots']){
  const a=s.primitiveStats[kind],r=h.get(kind);
  assert.equal(a.requested,a.accepted);assert.equal(a.dropped,0);assert.equal(a.accepted,s[kind]);
  assert.equal(a.capacity,r.capacity);assert(a.highWater>=a.accepted);assert(a.accepted<=a.capacity);
  assert.equal(r.count,s[kind]);assert(r.data.every(Number.isFinite));
 }
}
const results=[];
for(const [width,height] of [[1920,1080],[2560,1600],[3840,2160]]){
 for(const zoom of [.0625,.0883883476,.125,.3535533906,.7071067812,1,1.4142135624,2,2.8284271247,4,5.6568542495,8]){
  for(const [seed,time] of [[1,0],[19,37]]){
   const frame={time,pointer:{x:800,y:500},pointerActive:true,ripples:[{x:800,y:500,time:time-1}],reduced:false,view:{width,height,zoom,center:{x:800,y:500}}};
   const {h,p}=painter(seed),reference=painter(seed);
   // Same complete foreground with no world pressure. Compare actual Float32 payload,
   // not just the new telemetry: every fish/glow/orbit/ripple/pointer primitive survives.
   reference.p.world.render=()=>({});
   // Remove collision-target differences only; all geometry/render code remains real.
   p.meteors.update=reference.p.meteors.update=()=>{};
   // Exercise maximum normal transient pools too, with visible real renderer geometry.
   for(const target of [p,reference.p]){
    for(let i=0;i<3;i++)target.meteors.meteors.push({id:i,x:800,y:500,px:800,py:500,vx:90,vy:20,depth:1,radius:2,hue:.5,age:1,life:8,scale:1/zoom,size:1,tailLength:130,headRadius:2,lineWidth:1,halo:10,fadeIn:.2,fadeOut:1,entered:true});
    for(let i=0;i<6;i++)target.meteors.bursts.push({id:i,x:800,y:500,age:.5,depth:1,hue:.5,scale:1/zoom,palette:i%5,targetId:'test',nova:createNova(seed+i)});
   }
   const expected=reference.p.render(frame),actual=p.render(frame);check(h,actual);
   assert.deepEqual(actual.fishPrimitives,expected.fishPrimitives);
   for(const kind of ['lines','dots']){
    const foreground=h.get(kind).data.subarray(actual.worldPrimitives[kind]*10);
    assert.deepEqual(foreground,reference.h.get(kind).data,`foreground ${width}x${height} z=${zoom} ${kind}`);
    assert(actual.fishPrimitives[kind]>=0);
   }
   if(zoom===1&&time===0)assert.deepEqual(actual.fishPrimitives,{lines:7272,dots:3158});
   // High-water reuse, smaller views and returning to high LOD do not churn buffers/batches.
   const sources=['lines','dots'].map(k=>h.get(k).source),creates=h.counts.creates;
   for(let n=0;n<3;n++)check(h,p.render(frame));
   p.render({...frame,view:{...frame.view,width:640,height:480}});check(h,p.render(frame));
   assert.equal(h.counts.creates,creates);
   for(const [i,k] of ['lines','dots'].entries())assert.equal(h.get(k).source,sources[i]);
   assert(h.counts.peak<=3,'only one replacement live in addition to two batches');
   for(const k of ['lines','dots'])assert(actual.primitiveStats[k].accepted<actual.primitiveStats[k].capacity);
   results.push({width,height,zoom,seed,time,lines:actual.primitiveStats.lines,dots:actual.primitiveStats.dots,world:actual.worldPrimitives,fish:actual.fishPrimitives});
   p.dispose();reference.p.dispose();assert.equal(h.active.size,0);assert.equal(h.counts.creates,h.counts.disposes);
  }
 }
}
// Multiple CPU doublings in one frame still perform at most one GPU replacement per kind.
{
 const {h,p}=painter(),frame={time:1,pointer:{x:800,y:500},pointerActive:true,reduced:false,ripples:Array.from({length:1000},()=>({x:800,y:500,time:0})),view:{width:3840,height:2160,zoom:1,center:{x:800,y:500}}};
 const s=p.render(frame);check(h,s);assert(s.lines>70000);assert(s.primitiveStats.lines.cpuGrowths>=3);assert.equal(s.primitiveStats.lines.batchReplacements,1);assert(h.counts.creates<=4);p.dispose();
}
// Runtime limit: preserve ALL foreground; only background may be dropped, observably.
{
 const {h,p}=painter(),ref=painter();
 const frame={time:0,pointer:{x:800,y:500},pointerActive:true,reduced:false,ripples:[{x:800,y:500,time:0}],view:{width:2560,height:1600,zoom:1,center:{x:800,y:500}}};
 p.world.render=(_v,_t,b)=>{for(let i=0;i<110000;i++){b.dot(50,50,1,[1,1,1],1);b.line({x:50,y:50},{x:51,y:51},1,[1,1,1],1);}return {};};
 ref.p.world.render=()=>({});p.meteors.update=ref.p.meteors.update=()=>{};
 const expected=ref.p.render(frame),s=p.render(frame);
 assert.deepEqual(s.fishPrimitives,expected.fishPrimitives);
 for(const k of ['lines','dots']){
  const a=s.primitiveStats[k];assert.equal(a.requested,110000+expected[k]);assert.equal(a.accepted,100000);assert.equal(a.dropped,a.requested-100000);assert.equal(a.highWater,a.requested);
  assert.deepEqual(h.get(k).data.subarray(s.worldPrimitives[k]*10),ref.h.get(k).data);
 }
 assert.equal(h.active.size,2);p.dispose();ref.p.dispose();
}
// Foreground alone beyond the public limit must fail explicitly, never silently truncate.
{
 const {h,p}=painter();
 assert.throws(()=>p.render({time:1,pointer:{x:800,y:500},pointerActive:false,reduced:false,ripples:Array.from({length:3000},()=>({x:800,y:500,time:0})),view:{width:3840,height:2160,zoom:1,center:{x:800,y:500}}}),/foreground exceeds public ShapeBatch capacity/);
 assert.equal(h.active.size,2);p.dispose();
}
// Failed upload is explicit and destroys the failed replacement, retaining the old batch.
{
 const {h,p}=painter(),frame={time:0,pointer:{x:800,y:500},pointerActive:false,reduced:false,ripples:[],view:{width:3840,height:2160,zoom:1,center:{x:800,y:500}}};
 h.fail();assert.throws(()=>p.render(frame),/injected upload failure/);assert.equal(h.active.size,2);
 check(h,p.render(frame));p.dispose();assert.equal(h.active.size,0);
}
const summary={cases:results.length,peakLines:Math.max(...results.map(r=>r.lines.accepted)),peakDots:Math.max(...results.map(r=>r.dots.accepted)),dropped:0,results};
mkdirSync('.flamo/reports/dream-painter-capacity',{recursive:true});
writeFileSync('.flamo/reports/dream-painter-capacity/statistics.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({...summary,results:undefined}));
