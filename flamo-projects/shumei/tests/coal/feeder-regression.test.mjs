// Real installed helper + bundled Runtime reactivity; geometry handles remain doubles, NOT renderer evidence.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {reactive,ref,watch} from '../../.flamo/runtime/index.es.js';
import script from '../../src/components/coal/device-209-639.ts';
const diagnosticsEnabled=process.env.FLAMO_TEST_FEEDER_DIAGNOSTICS==='1';
assert.match(fs.readFileSync('src/components/coal/device.ts','utf8'),/const FEEDER_DIAGNOSTICS_ENABLED: boolean = false;/);
const debugRecords=[];
const nativeInterval=globalThis.setInterval, nativeClearInterval=globalThis.clearInterval;
let intervalCreates=0;const activeIntervals=new Set();
globalThis.setInterval=(...args)=>{intervalCreates++;const id=nativeInterval(...args);activeIntervals.add(id);return id;};
globalThis.clearInterval=id=>{activeIntervals.delete(id);return nativeClearInterval(id);};
const originalDebug=console.debug;
console.debug=(prefix,json)=>{assert.equal(prefix,'[coal.feeder]');debugRecords.push(JSON.parse(json));};
const refs=['225:1068','225:1086','225:1064','225:1087','334:338','334:361','334:306','334:317'];
function fixture(extent=282,layoutSource='runtime',denyWidth=false,advanceFrames=false){
 const frameQueue=[];
 const work={nextFrame:0,design:0,children:0,acks:[]};
 const prefix=Math.random().toString()+':', root='209:639';
 const owner=id=>['334:306','334:317'].includes(id)?'content':'input';
 const children={ [root]:['334:306','334:317'], '334:306':['334:338'], '334:317':['334:361'], '334:338':['225:1068','225:1064'], '334:361':['225:1086','225:1087'] };
 const local=id=>id.startsWith(prefix)?id.slice(prefix.length):id;
 const props=reactive({}),watchers=[],cleanups=[],observers=[],events=new Map(),traces=[],writes=[];
 const nodes=new Map(['209:639',...refs].map(id=>[id,{id:prefix+id,name:id,width:id==='334:361'?142:122,visible:true,current:async()=>({geometry:{},constraints:{}}),
  design:()=>{work.design++;return ({state:"design",geometry:{},layout:{},constraints:{}});},
  layout:()=>({source:layoutSource,owners:{width:{owner:owner(id)},height:{owner:'input'}},contentBox:{width:id===root?extent:17,height:20},borderBox:{width:id===root?extent+8:25,height:20}}),
  setWidth(v){this.width=v;writes.push(['width',id,v]);},setHeight(){throw Error('unexpected height')},setVisible(v){this.visible=v;writes.push(['visible',id,v]);}
 }]));
 // Reject the old bridge: physical string IDs must not resolve as semantic refs.
 const layoutHandle=handle=>{assert.equal(typeof handle,'object','layout API must receive the original EntityHandle, not its physical ID');assert.ok([...nodes.values()].includes(handle),'must retain this mounted instance handle');return handle;};
 const snapshot=id=>({entity:nodes.get(id),sourceNodeId:id,semanticRef:id,instanceRootId:prefix+root});
 const ctx={probe:()=>null,nodeId:prefix+root,instance:{id:Math.random().toString()},node:(id='209:639')=>nodes.get(local(id)),
  mounted:{probe:h=>({nodeId:h.id,size:{x:h.width,y:19},visible:h.visible,transform:{m00:1,m01:0,m02:0,m10:0,m11:1,m12:0}}),resolve:r=>snapshot(local(typeof r==='string'?r:r.id)),children:r=>{work.children++;return {children:(children[local(r.id)]??[]).map(snapshot)}}},
  ref,watch(read,cb){const stop=watch(read,cb);watchers.push(stop);return stop},
  observeLayout(handle,cb){const id=layoutHandle(handle).id;assert.equal(local(id),root,'measurement must use mounted root, never HUG/bar');const o={id,cb};observers.push(o);cb(nodes.get(local(id)).layout());return()=>observers.splice(observers.indexOf(o),1)},
  assertLayoutWritable(handle,properties){const id=layoutHandle(handle).id;assert.deepEqual(properties,['width']);assert.equal(owner(local(id)),'input');if(denyWidth)throw new Error('test ownership denied')},dispose:f=>cleanups.push(f),trace:(...v)=>traces.push(v),nextFrame:()=>{work.nextFrame++;return new Promise(resolve=>{if(advanceFrames)frameQueue.push(resolve)})},
  bus:{on:(id,cb)=>events.set(id,cb),emit(id,payload){if(id==='coal:device:ack')work.acks.push(payload)} }
 };
 script.setup(props,ctx);
 function flush(){} // bundled Vue watch executes synchronously; no fabricated notification
 return {nodes,traces,writes,work,async frame(){const batch=frameQueue.splice(0);for(const resolve of batch)resolve();await Promise.resolve();await Promise.resolve();},layoutReady(){layoutSource='runtime';for(const o of observers)o.cb(nodes.get(local(o.id)).layout())},set(p){Object.assign(props,p);flush()},resize(v){extent=v;for(const o of observers)o.cb(nodes.get(local(o.id)).layout())},dispose(){for(const f of cleanups)f();for(const stop of watchers)stop();watchers.length=0;events.clear()},bus(values){events.get('coal:device:update')({target:prefix+root,owner:'root',epoch:1,state:{kind:'feeder',values}});flush()}};
}
const vis=(f,a,b)=>assert.deepEqual(['225:1068','225:1064','225:1086','225:1087'].map(id=>f.nodes.get(id).visible),[a,!a,b,!b]);
const widths=f=>['334:338','334:361'].map(id=>f.nodes.get(id).width);
const a=fixture(),b=fixture(400);vis(a,false,false);
for(const x of [false,true])for(const y of [false,true]){a.set({gmjRun1:x,gmjRun2:y});vis(a,x,y);vis(b,false,false)}
for(const p of [0,26.5,53]){a.set({gmjPosition1:p,gmjPosition2:p});assert.deepEqual(widths(a),[282*p/53,282*p/53]);assert.equal(a.nodes.get('334:338').visible,true)}
a.set({gmjRun1:undefined,gmjRun2:null});vis(a,false,false);
for(const p of [null,undefined,NaN,Infinity,-1,54,'26.5']){a.set({gmjPosition1:p,gmjPosition2:p});assert.deepEqual(widths(a),[282,282]);vis(a,false,false)}
a.set({gmjPosition1:26.5,gmjPosition2:53});a.resize(500);assert.deepEqual(widths(a),[250,500]);assert.deepEqual(widths(b),[122,142]);
a.bus([53,true,0,false]);vis(a,true,false);assert.deepEqual(widths(a),[500,0]);
const n=a.writes.length;a.dispose();a.resize(700);a.set({gmjPosition1:0});assert.equal(a.writes.length,n);b.dispose();
const remount=fixture();vis(remount,false,false);assert.deepEqual(widths(remount),[122,142]);remount.dispose();
assert.ok(a.writes.every(([kind])=>kind==='width'||kind==='visible'));
console.log('PASS installed helper + bundled Runtime reactivity (handle doubles only): Fixed mounted root + HUG parents; 0/26.5/53; boolean/default/invalid; content padding; resize; scoped instances; disposal/remount. Native MAX/HUG execution and pixels NOT simulated or verified.');

const artifact=JSON.parse(fs.readFileSync('view/data/artifact.flamo.json'));
const boundary=artifact.nodeArtifacts['209:639'], parameters=boundary.surface.parameters;
assert.deepEqual(Object.keys(parameters).sort(),['gmjPosition1','gmjPosition2','gmjRun1','gmjRun2'].sort());
for(const key of ['gmjRun1','gmjRun2']){assert.equal(parameters[key].type,'boolean');assert.equal(parameters[key].default,false)}
for(const key of ['gmjPosition1','gmjPosition2']){assert.equal(parameters[key].schema.minimum,0);assert.equal(parameters[key].schema.maximum,53);assert.equal(parameters[key].default,undefined)}
assert.equal(artifact.nodeArtifacts['371:315'].of,'209:639');
const projected=JSON.parse(fs.readFileSync('view/data/components.json')).components.find(c=>c.nodeId==='209:639');
assert.deepEqual(projected.surface.parameters,parameters);
for(const binding of [boundary.interactions[0],...JSON.parse(fs.readFileSync('view/data/bindings.json')).bindings.filter(b=>b.nodeId==='209:639')]){
 assert.equal(binding.roleBindings.references1,'209:639');assert.equal(binding.roleBindings.references2,'209:639');
}
console.log('PASS structural: four parameters/defaults/ranges, components projection, instance inheritance, root role bindings.');

// Exercise the installed helper's real silent precondition; do not implement a fallback.
const waiting=fixture(282,'design');
waiting.set({gmjPosition1:26.5,gmjPosition2:53});
assert.deepEqual(widths(waiting),[122,142]);
if(diagnosticsEnabled)assert.ok(waiting.traces.some(([name,d])=>name==='coal.feeder.reference'&&d.status==='waiting-runtime-layout'));
assert.ok(!waiting.traces.some(([name])=>name==='coal.feeder.width-submit'));
waiting.layoutReady();assert.deepEqual(widths(waiting),[141,282]);
if(diagnosticsEnabled)assert.ok(waiting.traces.some(([name,d])=>name==='coal.feeder.width-submit'&&d.width===141));
waiting.dispose();
console.log('PASS real-helper layout gate: design snapshot does not submit; Runtime-source notification submits. This demonstrates a possible breakpoint, NOT the Chrome root cause.');

// Console contract only: these records originate from real source/helper with
// doubled geometry. They MUST NOT be read as committed Runtime evidence.
// The bridge must not catch an ownership failure and force the setter anyway.
const denied=fixture(282,'runtime',true);
denied.set({gmjPosition1:26.5});
assert.deepEqual(widths(denied),[122,142]);
assert.ok(denied.traces.some(([name,d])=>name==='coal.feeder.preflight-error'&&d.error.includes('test ownership denied')));
assert.ok(!denied.traces.some(([name])=>name==='coal.feeder.width-submit'));
denied.dispose();
if(!diagnosticsEnabled) {
 const quiet=fixture(282,'runtime',false,true);
 const before=quiet.work.nextFrame;
 quiet.set({gmjPosition1:26.5});
 assert.equal(quiet.work.nextFrame-before,1,'only original business ACK nextFrame, no diagnostic chain');
 quiet.bus([53,true,26.5,false]);
 for(let frame=0;frame<20;frame++)await quiet.frame();
 assert.ok(quiet.work.acks.some(a=>a.visual.status==='observed'),'business ACK/probe survives');
 assert.equal(quiet.work.design,0,'no diagnostic design traversal');
 const settled={...quiet.work};await quiet.frame();await quiet.frame();
 assert.equal(quiet.work.children,settled.children,'no continuing diagnostic subtree traversal');
 assert.equal(quiet.work.nextFrame,settled.nextFrame);
 assert.equal(intervalCreates,0,'default mode creates no props polling interval');
 assert.deepEqual(debugRecords,[],'default mode writes no console diagnostics');
 assert.ok(!quiet.traces.some(([a])=>a.startsWith('coal.feeder.')));
 quiet.dispose();
 console.log('PASS default diagnostics off: no console, polling, design traversal or frame chain; ACK/probe and ownership errors retained.');
} else {
// Diagnostic scheduling only: handles/probes below are doubles, not HUG/anchor evidence.
const sampled=fixture(282,'runtime',false,true);
sampled.set({gmjPosition1:26.5});
const writesBeforeFrames=sampled.writes.length;
for(let frame=1;frame<=20;frame++)await sampled.frame();
const samples=sampled.traces.filter(([a])=>a==='coal.feeder.reflow-snapshot').map(([,d])=>d);
assert.deepEqual(samples.map(d=>d.frame),[0,1,2,4,8,16]);
assert.ok(samples.every(d=>d.nodes.some(n=>n.sourceNodeId==='334:306')&&d.nodes.some(n=>n.sourceNodeId==='225:1064')));
assert.equal(sampled.writes.length,writesBeforeFrames,'diagnostic frames must never submit geometry');
sampled.set({gmjPosition1:0});sampled.set({gmjPosition1:53});
await sampled.frame();
assert.equal(sampled.traces.filter(([a,d])=>a==='coal.feeder.reflow-snapshot'&&d.frame===1).at(-1)[1].requestedWidth,282);
sampled.dispose();const traceCount=sampled.traces.length;await sampled.frame();assert.equal(sampled.traces.length,traceCount);
console.debug=originalDebug;
for(const action of ['coal.feeder.setup','coal.feeder.props','coal.feeder.props-sample',
 'coal.feeder.apply','coal.feeder.helper-read','coal.feeder.helper-watch',
 'coal.feeder.layout-notification','coal.feeder.preflight-return','coal.feeder.setter-return',
 'binding.number.applied','coal.feeder.dispose']) {
 assert.ok(debugRecords.some(r=>r.action===action),`missing console diagnostic ${action}`);
}
assert.ok(debugRecords.every(r=>r.diagnosticVersion==='feeder-console-v3-reflow'&&r.nodeId&&r.instanceId&&r.sequence>0));
assert.ok(!a.traces.some(([action])=>action==='coal.feeder.width-readback'), 'unresolved nextFrame must never invent a commit');
assert.ok(debugRecords.filter(r=>r.action==='coal.feeder.setter-return').every(r=>r.detail.status==='returned-not-commit'));
console.log('PASS immutable console diagnostic stages; no invented command commit evidence.');

assert.ok(debugRecords.filter(r=>r.action==='coal.feeder.preflight'||r.action==='coal.feeder.layout-subscribe').every(r=>r.detail.referenceKind==='EntityHandle'));

assert.ok(intervalCreates>0,'explicit diagnostic mode schedules polling');
}
console.debug=originalDebug;
assert.equal(activeIntervals.size,0,'all diagnostic intervals disposed');
globalThis.setInterval=nativeInterval;globalThis.clearInterval=nativeClearInterval;
