import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {readArtifact} from './read-artifact.mjs';
import {snapshot,stateFor,robotState} from '../../src/components/coal/model.ts';
import root from '../../src/components/coal/script.ts';
import {mountDevice,UPDATE} from '../../src/components/coal/device.ts';
import feederDefinition from '../../src/components/coal/device-209-639.ts';
import {bindNumber} from '../../src/.flamo/interaction-library/base/bind-number.ts';
import {mapping} from '../../src/components/coal/mapping.ts';
const diagnosticsEnabled=process.env.FLAMO_TEST_FEEDER_DIAGNOSTICS==='1';
let assertions=0;
const settle=async()=>{for(let i=0;i<16;i++)await Promise.resolve();};
const deviceSource=fs.readFileSync(new URL('../../src/components/coal/device.ts',import.meta.url),'utf8');
assert.ok(!/requestAnimationFrame|setRotation|setPosition|setTransform\(/.test(deviceSource));
const eq=(a,b)=>{assert.deepEqual(a,b);assertions++;};
const model=(kind,keys,values,max)=>stateFor({kind,keys,max},snapshot(values));
// Deleted Studio nodes must not survive as bus targets or active attachments.
const currentArtifact=readArtifact();
for (const deleted of ['187:638','197:315']) {
 eq(mapping.some(m=>m.node===deleted),false);
 eq(currentArtifact.nodeArtifacts[deleted]?.scripts??[],[]);
 eq(currentArtifact.nodeArtifacts[deleted]?.interactions??[],[]);
 eq(currentArtifact.nodeArtifacts[deleted]?.provenance?.status,'orphan');
}

for(const run of [true,false,null])eq(model('motor',['R'],{R:run}).run,run);
for(const left of [true,false,null])for(const right of [true,false,null]) {
 const s=model('tee',['ST_X'],{ST_X:{left,right}});eq([s.left,s.right,s.top],[left,right,left===true||right===true?true:left===false&&right===false?false:null]);
}
for(const lower of [true,false,null])for(const upper of [true,false,null]) {
 const s=model('plough',['L','U'],{L:lower,U:upper});eq(s.middle,lower===false&&upper===false?true:lower===null||upper===null?null:false);
}
for(const max of [2,15])for(const value of [-1,0,max,max+1,null]) {
 const s=model('level',['N'],{N:value},max);eq(s.ratio,value===null?null:Math.max(0,Math.min(max,value))/max);eq(s.text,value===null?'--':Math.max(0,Math.min(max,value)).toFixed(2));
}
for(const m of mapping.filter(m=>m.kind==='alarm'))for(const key of m.keys){eq(stateFor(m,snapshot({[key]:true})).run,true);eq(stateFor(m,snapshot({})).run,null);}
eq(mapping.filter(m=>m.kind==='alarm').flatMap(m=>m.keys).length,70);
eq(snapshot({'1APDBJ_PDSLBJ':true}).PDSLBJ_1APDBJ,true);
eq(robotState(snapshot({})).fields.JQR_DCDL.text,'--');
for(const [v,animation] of [[true,'running'],[false,'stopped'],[null,'unknown']])eq(robotState(snapshot({JQR_YXZT:v})).animation,animation);
// Runtime doubles exercise real source behavior; these are NOT browser/renderer evidence.
const artifactInput=currentArtifact;
const designNodes=new Map();
function index(nodes){for(const n of nodes){designNodes.set(`${n.guid.sessionID}:${n.guid.localID}`,n);index(n.children??[]);}}
index(artifactInput.scene.nodes);
// Artifact-grounded contract simulation, not a browser layout measurement.
const owners=id=>designNodes.get(id)?.layoutSizingHorizontal==='HUG_CONTENTS'?'content':'input';
for(const id of ['334:306','334:317'])eq(owners(id),'content');
eq(owners('209:639'),'input');eq(designNodes.get('209:639').size.x,282);
for(const [id,width] of [['334:338',122],['334:361',142]])eq(designNodes.get(id).size.x,width);
// Native declarations are structural evidence only, not an executed layout solver.
for(const id of ['334:306','334:317'])eq(designNodes.get(id).layoutSizingHorizontal,'HUG_CONTENTS');
for(const id of ['334:338','334:361']){eq(designNodes.get(id).layoutSizingHorizontal,undefined);eq(owners(id),'input');}
eq(designNodes.get('334:306').stackPrimaryAlignItems,'MAX');
eq(designNodes.get('334:317').stackPrimaryAlignItems,undefined); // omitted native MIN default
for(const id of ['225:1072','225:1085'])eq(designNodes.get(id).horizontalConstraint,undefined);
for(const id of ['225:1086','225:1087'])eq(designNodes.get(id).horizontalConstraint,'MAX');
eq(designNodes.get('209:637').size.x,280);
// Compare against this task's actual design baseline, not an absent historical report.
const designBaseline=JSON.parse(fs.readFileSync('tests/coal/flow-update-fixture.json'));
eq(createHash('sha256').update(JSON.stringify(artifactInput.scene)).digest('hex'),designBaseline.sceneSha256);
// Tee owns visibility only; do not recolor imported vector materials.
// Design reads are permitted only inside the isolated read-only diagnostic;
// business geometry must still use live layout, and appearance writes stay banned.
const diagnosticStart=deviceSource.indexOf(' function reflowSnapshot(');
const diagnosticEnd=deviceSource.indexOf(' function diagnostics(',diagnosticStart);
assert.ok(diagnosticStart>=0&&diagnosticEnd>diagnosticStart);
const readOnlyDiagnostic=deviceSource.slice(diagnosticStart,diagnosticEnd);
assert.ok(!/\.set[A-Z]\w*\(|\.animate\w*\(/.test(readOnlyDiagnostic));
assert.ok(!/setFill\(|setStroke\(|setOpacity\(/.test(deviceSource));
assert.ok(!/\.design\(/.test(deviceSource.slice(0,diagnosticStart)+deviceSource.slice(diagnosticEnd)));assertions++;
const listeners=new Map();let nextRaf=1;const frames=new Map();
globalThis.requestAnimationFrame=cb=>{const id=nextRaf++;frames.set(id,cb);return id;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
function context(prefix,source,projected=false){
 const clean=[],watchers=[],handles=new Map(),traces=[];
 const roleRefs=['ON','OFF','L','R','T','LS','RS','TS','D','U','M',
 '307:482','307:458','339:389','339:378','241:279','225:977',
 '225:1068','225:1086','225:1064','225:1087','334:338','334:361','334:306','334:317',
 '241:320','94:101760','94:101759','94:101761','241:319','241:318',
 '94:101201','94:101199','94:101200','94:101270','94:101268','94:101269'];
 const mountedSnapshot=ref=>({entity:ctx.node(ref),sourceNodeId:ref,semanticRef:ref,instanceRootId:ctx.nodeId,revision:1});
 const ctx={mounted:{resolve(){return mountedSnapshot(source);},children(h){return {children:h.id===prefix+source?roleRefs.map(mountedSnapshot):[]};},probe(h){return {nodeId:h.id,visible:h.visible,size:{x:h.width,y:0},opacity:1,transform:{m00:Math.cos(h.rotation*Math.PI/180),m10:Math.sin(h.rotation*Math.PI/180),m01:0,m11:1,m02:0,m12:0}};}},traces,flushProps(){for(const f of [...watchers])f();},nextFrame(){return Promise.resolve();},probe(ref){const h=ctx.node(ref);return {nodeId:h.id,visible:h.visible,size:{x:h.width,y:0},opacity:1,transform:{m00:Math.cos(h.rotation*Math.PI/180),m10:Math.sin(h.rotation*Math.PI/180),m01:0,m11:1,m02:0,m12:0}};},
  setNode(ref,path,value){assert.ok(!ref.startsWith(prefix),'must use component-local source refs');const h=ctx.node(ref);if(path==='NodeCpt.visible')h.visible=value;else if(path==='TransformCpt.size.x'){assert.equal(owners(ref),'input');assert.ok(Number.isFinite(value)&&value>=0);h.width=value;}else throw new Error('Unexpected write '+path);},
  nodeId:prefix+source,sourceNodeId:source,instance:{id:prefix,setProps(){}},
  node(id=source){if(!handles.has(id))handles.set(id,{id:prefix+id,transform:{rotation:12},visible:true,width:designNodes.get(id)?.size.x??0,rotation:12,fillOpacity:1,
   design(){return {compositing:{opacity:1},appearance:{fills:[{type:'solid',opacity:0.5}],strokes:[]}};},async current(){return {compositing:{opacity:this.opacity??1},appearance:{fills:this.fills??[],strokes:this.strokes??[]}};},setFill(x){this.fills=x;},setStroke(x){this.strokes=x;},setOpacity(x){this.opacity=x;},setVisible(x){this.visible=x;},setWidth(x){assert.equal(owners(id),'input');assert.ok(Number.isFinite(x));this.width=x;},setHeight(x){this.height=x;},setFillOpacity(x){this.fillOpacity=x;},setRotation(x){this.rotation=x;},
   layout(){return {source:'runtime',owners:{width:{owner:owners(id)},height:{owner:'input'}},borderBox:{width:id==='334:317'?142:122,height:20},contentBox:{width:id===source?282:(designNodes.get(id)?.size.x??122),height:20}};}});return handles.get(id);},
  ref(value){return {get value(){return value;},set value(v){value=v;for(const f of [...watchers])f();}};},
  watch(read,callback){let old=read();const f=()=>{const v=read();if(v!==old){const prev=old;old=v;callback(v,prev);}};watchers.push(f);const stop=()=>watchers.splice(watchers.indexOf(f),1);clean.push(stop);return stop;},
  observeLayout(handle,f){assert.ok([...handles.values()].includes(handle),'original mounted handle required');f(handle.layout());return ()=>{};},assertLayoutWritable(handle,properties){assert.ok([...handles.values()].includes(handle),'original mounted handle required');assert.deepEqual(properties,['width']);assert.equal(handle.layout().owners.width.owner,'input');},trace(event,data){traces.push({event,data});},
  dispose(f){clean.push(f);},bus:{on(k,fn){if(!listeners.has(k))listeners.set(k,new Set());listeners.get(k).add(fn);clean.push(()=>listeners.get(k).delete(fn));},emit(k,v){for(const fn of [...listeners.get(k)??[]])fn(v);}},
  expose(api){ctx.api=api;},emit(){},destroy(){for(const f of clean.splice(0).reverse())f();}}
 return ctx;
}
const roots=['A:','B:'].map(p=>{const c=context(p,'166:730');root.setup({},c);return c;});
const m=mapping.find(m=>m.kind==='motor');const a=context('A:',m.node),b=context('B:',m.node);
for(const c of [a,b])mountDevice(c,{}, {kind:'motor',on:['ON'],off:['OFF']});
roots[0].api.applyPointValues({[m.keys[0]]:true});eq(a.node('ON').visible,true);eq(b.node('ON').visible,false);
roots[0].api.applyPointValues({[m.keys[0]]:false});eq(a.node('OFF').visible,true);
roots[0].api.applyPointValues({});eq(a.node('ON').visible,false);eq(a.node('OFF').visible,false);
// Actual config alarm IDs -> public root snapshot -> source device ACK/visibility.
const belts=['1A','1B','2A','2B','3A','3B','4A','4B','5A','5B','6A','6B','6C','6D'];
const alarmTypes=['PDSLBJ','PDDMBJ','PDPPBJ','PDYHBJ','RYRQBJ'];
const alarmMappings=mapping.filter(x=>x.kind==='alarm');
const expectedKeys=belts.flatMap(b=>alarmTypes.map(t=>`${t}_${b}PDBJ`));
eq(alarmMappings.flatMap(x=>x.keys).sort(),[...expectedKeys].sort());
const alarmContexts=alarmMappings.map(x=>{const c=context('A:',x.node);mountDevice(c,{}, {kind:'alarm'});return c;});
const isolatedAlarm=context('B:',alarmMappings[0].node);mountDevice(isolatedAlarm,{}, {kind:'alarm'});
for(const belt of belts)for(const type of alarmTypes) {
 const raw=`#${belt}PDBJ_${type}`,legacy=raw.slice(1),canonical=`${type}_${belt}PDBJ`;
 for(const value of [false,true,false,undefined]) {
  roots[0].api.applyPointValues(value===undefined?{}:{[raw]:value});
  const current=roots[0].api.getCoalState();
  eq(current.values[canonical],value);
  for(let i=0;i<alarmMappings.length;i++) {
   const target=alarmMappings[i],state=current.devices.find(x=>x.node===target.node);
   const active=target.keys.includes(canonical)&&value===true;
   eq(state.run,active?true:null); // Other four inputs remain unknown, not false.
   eq(state.receipt.errors,[]);
   eq(state.receipt.state.alarms[canonical],target.keys.includes(canonical)?value??null:undefined);
   eq(alarmContexts[i].node().visible,active);
  }
  eq(isolatedAlarm.node().visible,false);
 }
 eq(snapshot({[legacy]:true})[canonical],true);
 // Canonical false/null/true, in either insertion order, beats contradictory aliases.
 for(const value of [false,null,true])for(const alias of [raw,legacy])for(const reverse of [false,true]) {
  const pairs=[[alias,value!==true],[canonical,value]];
  eq(snapshot(Object.fromEntries(reverse?pairs.reverse():pairs))[canonical],value);
 }
}
// With a complete belt snapshot false means stopped; missing means unknown.
for(const value of [false,true,false,null]) {
 roots[0].api.applyPointValues(Object.fromEntries(belts.flatMap(b=>alarmTypes.map(t=>[`#${b}PDBJ_${t}`,value]))));
 for(const x of roots[0].api.getCoalState().devices.filter(x=>x.kind==='alarm'))eq(x.run,value);
}
roots[0].api.applyPointValues({});
for(const c of alarmContexts){eq(c.node().visible,false);c.destroy();}isolatedAlarm.destroy();
// Non-alarm mapped input names pass through untouched, including 6D (not 6AD).
for(const key of new Set(mapping.filter(x=>x.kind!=='alarm').flatMap(x=>x.keys))) {
 const value=key.startsWith('ST_')?{left:true,right:null}:true;
 eq(Object.keys(snapshot({[key]:value})),[key]);eq(snapshot({[key]:value})[key],value);
}
eq(mapping.flatMap(x=>x.keys).some(k=>k.includes('6AD')),false);
// The old actual bindNumber call must fail with content-owned references.
const old=context('OLD:','209:639');
const originalOldLayout=old.node('334:306').layout;
old.node('334:306').layout=()=>({...originalOldLayout(),owners:{width:{owner:'content'},height:{owner:'input'}}});
assert.throws(()=>bindNumber({...old,observeLayout:(id,cb)=>old.observeLayout(old.node(id.replace('OLD:','')),cb)},()=>0,{range:[0,53],size:{target:old.node('334:338'),reference:old.node('334:306'),axis:'width',box:'border'}}),/must not derive/);assertions++;old.destroy();
// Mount the real definition, not a test-only feeder configuration.
const feeder=context('F:','209:639'),feeder2=context('G:','209:639');
feederDefinition.setup({},feeder);feederDefinition.setup({},feeder2);
eq(feeder.node('334:338').visible,true);eq(feeder2.node('334:361').visible,true);
const send=(c,state)=>c.bus.emit(UPDATE,{target:c.nodeId,state,owner:'test',epoch:1});
for(const pos of [0,26.5,53]){send(feeder,{kind:'feeder',values:[pos,true,pos,false]});for(const id of ['334:338','334:361'])eq(feeder.node(id).width,282*pos/53);}
eq(feeder2.node('334:361').width,142);
for(const pos of [-10,60,null,undefined,NaN,Infinity,-Infinity]){send(feeder,{kind:'feeder',values:[pos,null,pos,null]});for(const id of ['334:338','334:361']){eq(feeder.node(id).visible,true);eq(feeder.node(id).width,282);}}
send(feeder,{kind:'feeder',values:[0,true,53,true]});
feeder.destroy();eq(feeder.node('334:361').visible,true);eq(feeder.node('334:361').width,282);
send(feeder,{kind:'feeder',values:[53,true,0,true]});eq(feeder.node('334:361').width,282);
const remounted=context('F:','209:639');feederDefinition.setup({},remounted);eq(remounted.node('334:338').visible,true);eq(remounted.node('334:338').width,122);remounted.destroy();
// Remount source-contract fixture: independent fixed roots, HUG intermediary parents.
for(const generation of [0,1,2]) {
 const c=context(`generation-${generation}:`,'209:639',true),other=context(`other-${generation}:`,'209:639',true);
 feederDefinition.setup({},c);feederDefinition.setup({},other);
 for(const value of [0,26.5,53,null]) {
  send(c,{kind:'feeder',values:[value,true,value,false]});
  for(const id of ['334:338','334:361'])eq(c.node(id).width,value===null?282:282*value/53);
  eq(c.node('334:338').visible,true);eq(other.node('334:338').width,122);
 }
 c.destroy();other.destroy();eq(c.node('334:338').width,282);
}
// All actual motor mappings use the same definition-local on/off references.
for(const target of mapping.filter(m=>m.kind==='motor')) {
 const p={djRun:false},c=context('motor-local:',target.node,true);
 mountDevice(c,p,{kind:'motor',on:['307:482'],off:['307:458']});
 for(const run of [true,false,null]) {
  send(c,{kind:'motor',run});
  eq(c.node('307:482').visible,run===true);eq(c.node('307:458').visible,run===false);
  p.djRun=!p.djRun;c.flushProps(); // Default props must not overwrite a bus-owned snapshot.
  eq(c.node('307:482').visible,run===true);eq(c.node('307:458').visible,run===false);
 }
 c.destroy();eq(c.node('307:482').visible,false);
}
// Frame-delayed probe diagnostics reflect local effects and suppress disposed work.
const probed=context('probe:','209:640',true);feederDefinition.setup({},probed);
send(probed,{kind:'feeder',values:[0,true,53,false]});
await settle();
const visual=probed.traces.filter(t=>t.event==='coal.device.visual').at(-1).data;
eq(visual.errors,[]);
eq(visual.nodes.find(n=>n.ref==='334:338').probe.size.x,0);
eq(visual.nodes.find(n=>n.ref==='334:361').probe.size.x,282);
const beforeDispose=probed.traces.filter(t=>t.event==='coal.device.visual').length;
probed.destroy();await Promise.resolve();
eq(probed.traces.filter(t=>t.event==='coal.device.visual').length,beforeDispose);
// A real protected mutation rejection remains visible in the receipt, never success.
const rejected=context('reject:','209:640',true);feederDefinition.setup({},rejected);
for(const ref of ['334:338','334:361'])rejected.node(ref).setWidth=()=>{throw new Error('layout ownership conflict');};
let rejection;const listener=m=>{if(m.target===rejected.nodeId)rejection=m;};
rejected.bus.on('coal:device:ack',listener);send(rejected,{kind:'feeder',values:[0,true,53,true]});
eq(rejection.errors,['Error: layout ownership conflict']);rejected.destroy();
const tee=context('T:','tee');mountDevice(tee,{}, {kind:'tee',on:['L','R','T'],off:['LS','RS','TS']});
for(const [left,right] of [[true,false],[false,true],[false,false],[null,null]]){send(tee,model('tee',['ST_X'],{ST_X:{left,right}}));eq(['L','R','T'].map(x=>tee.node(x).visible),[left===true,right===true,left===true||right===true]);eq(['LS','RS','TS'].map(x=>tee.node(x).visible),[left!==true,right!==true,left!==true&&right!==true]);}
send(tee,model('tee',['ST_X'],{ST_X:{left:true,right:true}}));eq(['L','R','T'].map(x=>tee.node(x).visible),[true,true,true]);
send(tee,model('tee',['ST_X'],{}));eq(['L','R','T','LS','RS','TS'].map(x=>tee.node(x).visible),[false,false,false,true,true,true]);
const plough=context('P:','plough'),fall=context('P:','fall');mountDevice(plough,{}, {kind:'plough',parts:['D','U','M']});mountDevice(fall,{}, {kind:'fall'});
for(const value of [true,false,null]){send(plough,model('plough',['L','U'],{L:value,U:false}));send(fall,model('fall',['LM'],{LM:value}));eq(fall.node().visible,value===true);eq(plough.node('D').visible,value===true);}
const wheel=context('W:','wheel');mountDevice(wheel,{}, {kind:'wheel'});send(wheel,{kind:'wheel',run:true});eq(frames.size,0);send(wheel,{kind:'wheel',run:null});eq(frames.size,0);eq(wheel.node().rotation,12);
eq(roots[0].api.getCoalState().devices.find(x=>x.node===m.node).receipt.errors,[]);
// Every state, independent instances, remount: authored wheel angle is untouched.
for(const generation of [0,1]){
 const w1=context('static-a-'+generation,'wheel'),w2=context('static-b-'+generation,'wheel');
 w1.node().rotation=31;w2.node().rotation=-18;
 mountDevice(w1,{}, {kind:'wheel'});mountDevice(w2,{}, {kind:'wheel'});
 for(const run of [true,false,null]){
  send(w1,{kind:'wheel',run});await settle();
  eq(w1.node().rotation,31);eq(w2.node().rotation,-18);eq(frames.size,0);
  const n=w1.traces.filter(t=>t.event==='coal.device.visual').at(-1).data.nodes[0];
  eq(Math.abs(n.measurement.rotationDegrees-31)<1e-9,true);
 }
 w1.destroy();w2.destroy();eq(frames.size,0);
}
for(const [left,right] of [[true,false],[false,true],[false,false],[null,null]]){
 send(tee,model('tee',['ST_X'],{ST_X:{left,right}}));await settle();
 const v=tee.traces.filter(t=>t.event==='coal.device.visual').at(-1).data;
 eq(v.errors,[]);
 for(const ref of [left===true?'L':'LS',right===true?'R':'RS',left===true||right===true?'T':'TS']){
  const n=v.nodes.find(n=>n.ref===ref);
  eq(n.probe.visible,true);eq(n.measurement.appearance.fills,tee.node(ref).fills??[]);
  eq(n.measurement.compositing.opacity,1);
 }
}
// Empty semantic appearance is valid for imported vector shapes.
const emptyPaint=context('empty-paint:','tee');
for(const ref of ['L','R','T','LS','RS','TS'])for(const method of ['setFill','setStroke','setOpacity','design'])
 emptyPaint.node(ref)[method]=()=>{throw new Error('Forbidden tee appearance access/write');};
mountDevice(emptyPaint,{}, {kind:'tee',on:['L','R','T'],off:['LS','RS','TS']});
send(emptyPaint,{kind:'tee',left:true,right:false,top:true});await settle();
const emptyResult=emptyPaint.traces.filter(t=>t.event==='coal.device.visual').at(-1).data;
eq(emptyResult.status,'observed');eq(emptyResult.errors,[]);
emptyPaint.destroy();
// Separate semantic aliases from the mounted physical subtree. The old mock
// conflated these identities and could not detect writes to definition nodes.
function physicalContext(prefix,source,refs){
 const c=context(prefix,source,true),nodes=new Map();
 for(const ref of ['',...refs,'container'])nodes.set(ref,{...c.node(ref||source),id:prefix+'physical/'+(ref||source),visible:true,width:designNodes.get(ref)?.size.x??0,setVisible(v){this.visible=v;},setWidth(v){assert.equal(owners(ref),'input');assert.ok(Number.isFinite(v)&&v>=0);this.width=v;}});
 const snap=ref=>({entity:nodes.get(ref),sourceNodeId:ref||source,semanticRef:null,instanceRootId:c.nodeId,revision:2});
 c.mounted={resolve:()=>snap(''),children(h){return {children:h===nodes.get('')?[snap('container')]:h===nodes.get('container')?refs.map(snap):[]};},probe(h){return {nodeId:h.id,visible:h.visible,size:{x:h.width,y:0},opacity:1,transform:{m00:Math.cos(h.rotation*Math.PI/180),m10:Math.sin(h.rotation*Math.PI/180),m01:0,m11:1,m02:0,m12:0}};}};
 c.setNode=(ref,path,v)=>{assert.equal(path,'TransformCpt.size.x');assert.equal(owners(ref),'input');nodes.get(ref).width=v;};
 c.observeLayout=(handle,cb)=>{assert.ok([...nodes.values()].includes(handle),'physical string is not a semantic ref');cb(handle.layout());return()=>{};};
 c.assertLayoutWritable=(handle,properties)=>{const entry=[...nodes.entries()].find(([,n])=>n===handle);assert.ok(entry);eq(properties,['width']);eq(owners(entry[0]),'input');};
 c.physical=nodes;return c;
}

// Real tee definition, physically distinct instance roles, all 9 combinations.
const teeDefinition=(await import('../../src/components/coal/device-94-101763.ts')).default;
const onT=['241:320','94:101760','94:101759'],offT=['94:101761','241:319','241:318'];
for(const generation of [0,1]) {
 const a=physicalContext('tee-a-'+generation,'94:101763',[...onT,...offT]);
 const b=physicalContext('tee-b-'+generation,'94:101763',[...onT,...offT]);
 for(const c of [a,b])for(const ref of [...onT,...offT])for(const method of ['setFill','setStroke','setOpacity','design'])
  c.physical.get(ref)[method]=()=>{throw new Error('Forbidden tee paint operation');};
 teeDefinition.setup({},a);teeDefinition.setup({},b);
 for(const left of [true,false,null])for(const right of [true,false,null]) {
  send(a,model('tee',['ST_X'],{ST_X:{left,right}}));await settle();
  const v=a.traces.filter(t=>t.event==='coal.device.visual').at(-1).data;
  eq(v.errors,[]);eq(v.status,'observed');
  for(let i=0;i<3;i++) {
   const active=[left===true,right===true,left===true||right===true][i];
   for(const [ref,want] of [[onT[i],active],[offT[i],!active]]) {
    const n=v.nodes.find(n=>n.ref===ref);
    eq(n.probe.visible,want);eq(n.targetNodeId,a.physical.get(ref).id);
    eq(n.measurement.appearance.fills,[]);eq(a.node(ref).visible,true);
   }
   eq(b.physical.get(onT[i]).visible,false);eq(b.physical.get(offT[i]).visible,true);
  }
 }
 a.destroy();await settle();
 for(let i=0;i<3;i++){eq(a.physical.get(onT[i]).visible,false);eq(a.physical.get(offT[i]).visible,true);}
 send(a,{kind:'tee',left:true,right:true,top:true});eq(a.physical.get(onT[0]).visible,false);
 b.destroy();
}
// Visibility mismatch, missing probe, missing role and ambiguous role still fail.
for(const failure of ['visible','probe','missing','ambiguous']) {
 const c=physicalContext('tee-failure-'+failure,'94:101763',[...onT,...offT]);
 const children=c.mounted.children,probe=c.mounted.probe;
 if(failure==='visible')c.physical.get(onT[0]).setVisible=()=>{};
 if(failure==='probe')c.mounted.probe=h=>h===c.physical.get(onT[0])?null:probe(h);
 if(failure==='missing'||failure==='ambiguous')c.mounted.children=h=>{
  const ns=children(h).children;
  return {children:failure==='missing'?ns.filter(n=>n.sourceNodeId!==onT[0]):ns.flatMap(n=>n.sourceNodeId===onT[0]?[n,{...n,entity:{...n.entity,id:n.entity.id+'duplicate'}}]:[n])};
 };
 teeDefinition.setup({},c);send(c,{kind:'tee',left:false,right:false,top:false});await settle();
 const v=c.traces.filter(t=>t.event==='coal.device.visual').at(-1).data;
 eq(v.status,'failed');eq(v.errors.length>0,true);c.destroy();
}

for(const [kind,on,off] of [['motor','307:482','307:458'],['crusher','339:389','339:378'],['screen','241:279','225:977']]){
 const target=mapping.find(x=>x.kind===kind),prefix='physical-'+kind+':';
 const host=context(prefix,'166:730');root.setup({},host);
 const c=physicalContext(prefix,target.node,[on,off]),p={djRun:false};mountDevice(c,p,{kind,on:[on],off:[off]});
 for(const run of [true,false,null]){
  host.api.applyPointValues(run===null?{}:{[target.keys[0]]:run});
  const receipt=()=>host.api.getCoalState().devices.find(x=>x.node===target.node).receipt;
  eq(receipt().visual.status,'pending');await settle();
  eq(receipt().errors,[]);eq(receipt().visual.status,'observed');
  for(const [ref,want] of [[on,run===true],[off,run===false]]){
   const n=receipt().visual.nodes.find(x=>x.ref===ref);
   eq(n.probe.visible,want);eq(n.targetNodeId,c.physical.get(ref).id);
   eq(n.sourceProbe.visible,true);eq(c.node(ref).visible,true); // definition decoys untouched
  }
  p.djRun=!p.djRun;c.flushProps();eq(c.physical.get(on).visible,run===true);
 }
 c.destroy();host.destroy();
}
const fm=mapping.find(x=>x.kind==='feeder'),fp='physical-feeder:';
const fh=context(fp,'166:730');root.setup({},fh);
const fc=physicalContext(fp,fm.node,['225:1068','225:1086','225:1064','225:1087','334:338','334:361','334:306','334:317']);feederDefinition.setup({},fc);
const freceipt=()=>fh.api.getCoalState().devices.find(x=>x.node===fm.node).receipt;
for(const position of [0,26.5,53,-10,80,null]){
 const bounded=position!==null&&position>=0&&position<=53?position:53;
 fh.api.applyPointValues(position===null?{}:Object.fromEntries(fm.keys.map((k,i)=>[k,i%2?true:position])));
 await settle();eq(freceipt().errors,[]);
 for(const [ref,width] of [['334:338',282*bounded/53],['334:361',282*bounded/53]]){
  const n=freceipt().visual.nodes.find(x=>x.ref===ref);eq(n.probe.size.x,width);eq(n.probe.visible,true);
 }
}
// Diagnostics return supplied committed child geometry, not a position derived
// from expected width. This intentionally does not emulate native layout.
const realChildren=fc.mounted.children;
const icon={...fc.node('native-icon'),id:'physical/icon',width:37};
fc.mounted.children=h=>h===fc.physical.get('334:361')?{children:[{entity:icon,sourceNodeId:'225:1085',instanceRootId:fc.nodeId}]}:realChildren(h);
fh.api.applyPointValues(Object.fromEntries(fm.keys.map((k,i)=>[k,i%2?true:26.5])));
await settle();
const measuredBar=freceipt().visual.nodes.find(n=>n.ref==='334:361');
eq(measuredBar.probe.size.x,141);
if(diagnosticsEnabled){
 eq(measuredBar.measurement.children[0].probe.size.x,37);
 eq(measuredBar.measurement.children[0].targetNodeId,'physical/icon');
} else eq(measuredBar.measurement.children,undefined);
eq(freceipt().visual.nodes.filter(n=>['334:338','334:361'].includes(n.ref)).length,2);
// Simulate an accepted write that never reaches committed layout: must fail.
for(const ref of ['334:338','334:361'])fc.physical.get(ref).setWidth=()=>{};fh.api.applyPointValues(Object.fromEntries(fm.keys.map((k,i)=>[k,i%2?true:0])));
await settle();eq(freceipt().visual.status,'failed');eq(freceipt().errors.some(x=>x.includes('Width mismatch')),true);
fc.destroy();fh.destroy();
// Plough actual role probes, rapid snapshots, destruction and rematerialization.
for(const generation of [0,1]){
 const c=physicalContext('remat-'+generation+':','plough',['D','U','M']);let ack;
 c.bus.on('coal:device:ack',m=>{if(m.target===c.nodeId)ack=m;});mountDevice(c,{}, {kind:'plough',parts:['D','U','M']});
 for(const [lower,upper,middle] of [[true,false,false],[false,true,false],[false,false,true],[null,null,null]]){
  send(c,{kind:'plough',lower,upper,middle});await settle();eq(ack.errors,[]);
  eq(ack.visual.nodes.filter(n=>n.ref).map(n=>n.probe.visible),[lower===true,upper===true,middle===true]);
 }
 send(c,{kind:'plough',lower:true});send(c,{kind:'plough',lower:null});await settle();eq(ack.visual.nodes.find(n=>n.ref==='D').probe.visible,false);
 send(c,{kind:'plough',lower:true});c.destroy();const last=ack;await settle();eq(ack,last);
}
// All 14 physical motor instances and a second independent host, including
// definition aliases with the same source IDs. This remains a contract double.
const motorHosts=['physical-all-A:','physical-all-B:'].map(prefix=>{const h=context(prefix,'166:730');root.setup({},h);return h;});
const physicalMotors=motorHosts.map(h=>mapping.filter(x=>x.kind==='motor').map(target=>{
 const c=physicalContext(h.instance.id,target.node,['307:482','307:458']);mountDevice(c,{}, {kind:'motor',on:['307:482'],off:['307:458']});return c;
}));
for(const run of [true,false,null]){
 motorHosts[0].api.applyPointValues(run===null?{}:Object.fromEntries(mapping.filter(x=>x.kind==='motor').map(x=>[x.keys[0],run])));await settle();
 for(const d of motorHosts[0].api.getCoalState().devices.filter(x=>x.kind==='motor')){
  eq(d.receipt.errors,[]);eq(d.receipt.visual.nodes.find(n=>n.ref==='307:482').probe.visible,run===true);
  eq(d.receipt.visual.nodes.find(n=>n.ref==='307:458').probe.visible,run===false);
 }
 for(const c of physicalMotors[1])eq(c.physical.get('307:482').visible,false);
}
for(const cs of physicalMotors)for(const c of cs)c.destroy();for(const h of motorHosts)h.destroy();
// No global fallback if a mounted role is missing or ambiguous.
for(const duplicate of [false,true]){
 const c=physicalContext('invalid-'+duplicate+':','motor',duplicate?['ON','ON','OFF']:['OFF']);let ack;
 if(duplicate){const children=c.mounted.children;c.mounted.children=h=>{const result=children(h);let count=0;return {children:result.children.map(n=>n.sourceNodeId==='ON'&&count++?{...n,entity:{...n.entity,id:n.entity.id+'-duplicate'}}:n)};};}
 c.bus.on('coal:device:ack',m=>{if(m.target===c.nodeId)ack=m;});mountDevice(c,{}, {kind:'motor',on:['ON'],off:['OFF']});
 send(c,{kind:'motor',run:true});await settle();eq(ack.visual.status,'failed');eq(ack.errors.some(x=>x.includes('Expected one mounted local role')),true);c.destroy();
}

// Different authored IDs under a nested instance: only public semantic mapping
// links definition refs to physical descendants. No ID arithmetic/name matching.
const configs=[
 {kind:'plough',parts:['94:101270','94:101268','94:101269']},
 {kind:'tee',on:['241:320','94:101760','94:101759'],off:['94:101761','241:319','241:318']},
 {kind:'feeder',on:['225:1068','225:1086'],off:['225:1064','225:1087'],bars:['334:338','334:361'],barWidths:[280,280]}
];
function authoredContext(prefix,source,config,broken=false){
 const refs=[...(config.on??[]),...(config.off??[]),...(config.parts??[]),...(config.bars??[])];
 const c=physicalContext(prefix,source,refs),oldChildren=c.mounted.children;
 const snapshot=(h)=>({entity:h,sourceNodeId:'authored-'+h.id,semanticRef:'local-'+h.id,instanceRootId:'nested-instance',revision:3});
 c.mounted.children=h=>({children:oldChildren(h).children.map(n=>snapshot(n.entity))});
 c.mounted.resolve=ref=>{
  if(ref===c.node())return snapshot(c.physical.get(''));
  const key=typeof ref==='string'?ref:refs.find(k=>c.node(k)===ref);
  if(broken||!key)return null;
  return snapshot(c.physical.get(key));
 };
 return c;
}
for(const config of configs)for(const generation of [0,1]){
 const a=authoredContext('authored-a-'+generation+config.kind,config.kind,config);
 const b=authoredContext('authored-b-'+generation+config.kind,config.kind,config);
 let ack; a.bus.on('coal:device:ack',v=>{if(v.target===a.nodeId)ack=v;});
 mountDevice(a,{},config);mountDevice(b,{},config);
 for(const run of [true,false,null]){
  const state={kind:config.kind,run,left:run,right:run,top:run,lower:run,upper:run,middle:run,values:[run===null?null:run?0:53,run,run===null?null:run?53:0,run]};
  send(a,state);await settle();eq(ack.errors,[]);eq(ack.visual.status,'observed');
  for(const n of ack.visual.nodes.filter(n=>n.ref)){
   eq(n.sourceNodeId.startsWith('authored-'),true);
   if(n.expected.visible!==undefined)eq(n.probe.visible,n.expected.visible);else eq(n.probe.visible,true);
   if(n.expected.width!==undefined)eq(n.probe.size.x,n.expected.width);
   eq(b.physical.get(n.ref).visible,config.kind==='tee'?config.off.includes(n.ref):config.kind==='feeder'?(config.off.includes(n.ref)||config.bars.includes(n.ref)):false);
  }
 }
 a.destroy();b.destroy();
}
// Failure diagnostics survive public receipt transport; missing on/off must
// not prevent independently resolvable bars or the other roles being measured.
const broken=authoredContext('unresolved:','209:640',configs[2],true);let brokenAck;
broken.bus.on('coal:device:ack',v=>{if(v.target===broken.nodeId)brokenAck=v;});mountDevice(broken,{},configs[2]);
send(broken,{kind:'feeder',values:[0,true,53,true]});await settle();
eq(brokenAck.visual.status,'failed');
if(diagnosticsEnabled){
eq(brokenAck.visual.diagnostics.mappings.length,6);
eq(brokenAck.visual.diagnostics.subtree.nodes.length,8);

eq(brokenAck.visual.diagnostics.subtree.nodes[2].parent,broken.physical.get('container').id);
eq(brokenAck.visual.diagnostics.mappings[0].resolveRef,null);
} else eq(brokenAck.visual.diagnostics,{});
eq(brokenAck.visual.nodes.filter(n=>n.error).length,6);
broken.destroy();

// Missing image roles do not short-circuit independently mapped feeder bars.
const partial=authoredContext('partial:','209:640',configs[2]);
const partialResolve=partial.mounted.resolve;
partial.mounted.resolve=ref=>{
 const r=partialResolve(ref);
 return r&&configs[2].on.concat(configs[2].off).some(k=>r.entity===partial.physical.get(k))?null:r;
};
let partialAck;partial.bus.on('coal:device:ack',v=>{if(v.target===partial.nodeId)partialAck=v;});
mountDevice(partial,{},configs[2]);send(partial,{kind:'feeder',values:[0,true,53,true]});await settle();
eq(partialAck.visual.status,'failed');
for(const [ref,width] of [['334:338',0],['334:361',282]]){
 const n=partialAck.visual.nodes.find(n=>n.ref===ref);eq(n.probe.size.x,width);eq(n.probe.visible,true);
}
partial.destroy();
// A public resolver returning a sibling/global definition must never authorize writes.
const foreign=authoredContext('foreign:','plough',configs[0]);
const originalResolve=foreign.mounted.resolve;let foreignWrites=0;
foreign.mounted.resolve=ref=>ref===foreign.node()?originalResolve(ref):{
 entity:{id:'outside-device',setVisible(){foreignWrites++;}},sourceNodeId:'foreign',semanticRef:null,instanceRootId:'other',revision:1
};
let foreignAck;foreign.bus.on('coal:device:ack',v=>{if(v.target===foreign.nodeId)foreignAck=v;});
mountDevice(foreign,{},configs[0]);send(foreign,{kind:'plough',lower:true,upper:false,middle:false});await settle();
eq(foreignAck.visual.status,'failed');eq(foreignWrites,0);foreign.destroy();

// User-observed unqualified Figma IDs, nested instance owners, global decoys.
for(const config of configs)for(const generation of [0,1]){
 const refs=[...(config.on??[]),...(config.off??[]),...(config.parts??[]),...(config.bars??[])];
 const c=physicalContext('observed-'+generation+config.kind+':','device',refs),children=c.mounted.children;
 const owner=c.physical.get('container').id;
 c.mounted.children=h=>({children:children(h).children.map(n=>{
  const ref=refs.find(r=>c.physical.get(r)===n.entity);
  return ref?{...n,sourceNodeId:ref.split(':')[1],semanticRef:'I'+owner+';'+ref.split(':')[1],instanceRootId:owner}:n;
 })});
 let ack;c.bus.on('coal:device:ack',v=>{if(v.target===c.nodeId)ack=v;});mountDevice(c,{},config);
 for(const value of [0,26.5,53,null]){
  const run=value===null?null:value===0?false:true;
  send(c,{kind:config.kind,run,left:run,right:run,top:run,lower:run,upper:run,middle:run,values:[value,run,value,run]});await settle();
  eq(ack.errors,[]);eq(ack.visual.status,'observed');
  for(const n of ack.visual.nodes.filter(n=>n.ref)){if(n.expected.visible!==undefined)eq(n.probe.visible,n.expected.visible);else eq(n.probe.visible,true);eq(c.node(n.ref).visible,true);if(n.expected.width!==undefined)eq(n.probe.size.x,n.expected.width);}
 }
 // Same suffix with a different qualified source is not a safe alias.
 const old=c.mounted.children;c.mounted.children=h=>({children:old(h).children.map(n=>n.sourceNodeId?.match(/^\d+$/)?{...n,sourceNodeId:'999:'+n.sourceNodeId}:n)});
 send(c,{kind:config.kind,run:true,left:true,right:true,top:true,lower:true,values:[0,true,53,true]});await settle();eq(ack.visual.status,'failed');c.destroy();
}
// Property-only pipeline: initial/pre-ready value, replacements, two instances,
// and a fresh script lifecycle consuming the wrapper's retained property bag.
const retained={uiBindIds:{'GMJ_1APD#1GMJWZ':26.5,'#1APDBJ_PDSLBJ':true,ST_1AST:{left:true,right:null}}};
for(const generation of [0,1]){
 const c=context('prop-'+generation+':','166:730'),other=context('prop-other-'+generation+':','166:730');
 c.instance.setProps=patch=>{Object.assign(retained,patch);c.flushProps();};root.setup(retained,c);root.setup({uiBindIds:{}},other);
 eq(c.api.getCoalState().values,JSON.parse(JSON.stringify(snapshot(retained.uiBindIds))));eq(other.api.getCoalState().values,{});
 retained.uiBindIds={YXZT_1APDYX:true};c.flushProps();eq(c.api.getCoalState().values,{YXZT_1APDYX:true});
 retained.uiBindIds={};c.flushProps();eq(c.api.getCoalState().values,{});
 c.api.applyPointValues({YXZT_1APDYX:false});eq({...retained.uiBindIds},{YXZT_1APDYX:false});eq(c.api.getCoalState().values,{...retained.uiBindIds});
 c.destroy();other.destroy();
}

// Annotation array contract: source/props simulation, NOT an exported browser setter test.
{
 const parameter=currentArtifact.nodeArtifacts['166:730'].surface.parameters.uiBindIds;
 eq(parameter.type,'array');eq(parameter.default,[]);
 eq(parameter.attribute,false); // JS property only; no unobserved JSON attribute promise.
 const summary=JSON.parse(fs.readFileSync('view/data/components.json'));
 const findParameter=o=>{if(!o||typeof o!=='object')return undefined;if(o.parameters?.uiBindIds)return o.parameters.uiBindIds;for(const v of Object.values(o)){const p=findParameter(v);if(p)return p;}};
 eq(findParameter(summary),parameter);
 eq(parameter.schema.anyOf[0].items.required,['id','value']);
 eq(parameter.schema.anyOf[1].type,'object');
 const rows=[
  {id:'GMJ_1APD#1GMJWZ',notes:'position',value:0},
  {id:'GMJ_1APD#2GMJWZ',notes:'position',value:53},
  {id:'#1APDBJ_PDSLBJ',notes:'alarm',value:false},
  {id:'ST_1AST',notes:'branches',value:{left:true,right:null}},
  {id:'LM_1APDLMZ2APD',value:true},
  {id:'YXZT_1APDYX',value:false},
  {id:'SW_XFGWSX',value:null}
 ];
 const normalized=JSON.parse(JSON.stringify(snapshot(rows)));
 eq(normalized['GMJ_1APD#1GMJWZ'],0);eq(normalized['GMJ_1APD#2GMJWZ'],53);
 eq(normalized['#1APDBJ_PDSLBJ'],false);eq(normalized.PDSLBJ_1APDBJ,false);
 eq(normalized.ST_1AST,{left:true,right:null});eq(normalized.SW_XFGWSX,null);
 eq(Object.hasOwn(normalized,'0'),false);
 eq(snapshot(rows),snapshot(Object.fromEntries(rows.map(r=>[r.id,r.value]))));
 eq(snapshot(JSON.parse(JSON.stringify(rows))),snapshot(rows)); // JSON payload decode only
 eq({...snapshot([null,{}, {id:2,value:1},{id:'',value:1}])},{});
 eq({...snapshot([{id:'x',value:true},{id:'x',value:false}])},{x:false});
 eq({...snapshot([{id:'x',value:Infinity},{id:'y'}])},{x:null,y:null});
 // Every current mapping key has the same state via array and legacy Record paths.
 const keys=[...new Set(mapping.flatMap(m=>m.keys))];
 for(const value of [true,false,0,53,null]){
  const record=Object.fromEntries(keys.map(k=>[k,k.startsWith('ST_')?{left:value===true,right:null}:value]));
  const array=Object.entries(record).map(([id,value])=>({id,notes:'metadata',value}));
  for(const m of mapping)eq(stateFor(m,snapshot(array)),stateFor(m,snapshot(record)));
 }
 // Pre-mount property, replacement, cleanup and retained bag remount simulation.
 const bag={uiBindIds:rows};
 for(const generation of [0,1]){
  const c=context('array-'+generation+':','166:730'),other=context('array-other-'+generation+':','166:730');
  const events=[];c.emit=(name,payload)=>events.push({name,payload});
  c.instance.setProps=patch=>{Object.assign(bag,patch);c.flushProps();};
  root.setup(bag,c);root.setup({uiBindIds:[]},other);
  eq(c.api.getCoalState().values,JSON.parse(JSON.stringify(snapshot(bag.uiBindIds))));
  eq(other.api.getCoalState().values,{});eq(c.api.getCoalState().devices.length,195);
  for(const run of [true,false,null]){
   bag.uiBindIds=[{id:'YXZT_1APDYX',notes:'run',value:run}];c.flushProps();
   eq(c.api.getCoalState().values,{YXZT_1APDYX:run});
   eq(events.at(-1).name,'coalStateChange');eq({...events.at(-1).payload.values},{YXZT_1APDYX:run});
   eq(other.api.getCoalState().values,{});
  }
  bag.uiBindIds=[];c.flushProps();eq(c.api.getCoalState().values,{});
  c.api.applyPointValues(rows);eq(c.api.getCoalState().values,normalized);
  bag.uiBindIds=JSON.parse(JSON.stringify(rows));c.flushProps();
  c.destroy();const count=events.length;bag.uiBindIds=[];c.flushProps();eq(events.length,count);
  bag.uiBindIds=rows;other.destroy();
 }
}

// Qualified remount aliases must originate in ctx.node, not session arithmetic.
{
 const refs=['307:482','307:458'],c=physicalContext('namespace:','motor',refs),oldNode=c.node,oldChildren=c.mounted.children;
 const aliases=new Map(refs.map(r=>[r,{id:'10307:'+r.split(':')[1]}]));
 c.node=(ref)=>aliases.get(ref)??oldNode(ref);
 c.mounted.children=h=>({children:oldChildren(h).children.map(n=>{
  const ref=refs.find(r=>c.physical.get(r)===n.entity);return ref?{...n,sourceNodeId:aliases.get(ref).id}:n;
 })});
 let ack;c.bus.on('coal:device:ack',v=>{if(v.target===c.nodeId)ack=v;});mountDevice(c,{}, {kind:'motor',on:[refs[0]],off:[refs[1]]});
 for(const run of [true,false,null]){send(c,{kind:'motor',run});await settle();eq(ack.errors,[]);eq(c.physical.get(refs[0]).visible,run===true);eq(c.physical.get(refs[1]).visible,run===false);}
 c.destroy();
}

// New falling-coal carriers target each mounted nested flow, including cleanup.
{
 const commands=[];globalThis.document=new EventTarget();
 document.addEventListener('flamo:hmi-pipe-flow:set',event=>commands.push(event.detail));
 for(const m of mapping.filter(m=>m.flowTargets)) {
  const a=physicalContext('flow-a:'+m.node,m.node,m.flowTargets);
  const b=physicalContext('flow-b:'+m.node,m.node,m.flowTargets);
  for(const c of [a,b])mountDevice(c,{}, {kind:m.kind,flowTargets:m.flowTargets});
  for(const run of [true,false,null,true]) {
   const before=commands.length;send(a,stateFor(m,snapshot({[m.keys[0]]:run})));await settle();
   eq(a.physical.get('').visible,run===true);eq(b.physical.get('').visible,false);
   eq(commands.slice(before),m.flowTargets.map(ref=>({instanceId:a.instance.id,nodeId:a.physical.get(ref).id,patch:{enabled:run===true}})));
   eq(a.traces.filter(t=>t.event==='coal.device.visual').at(-1).data.status,'observed');
  }
  a.destroy();eq(commands.at(-1).patch.enabled,false);
  const count=commands.length;send(a,{kind:m.kind,run:true});await settle();eq(commands.length,count);b.destroy();
 }
 for(const m of mapping.filter(m=>m.kind==='extension')) {
  const c=physicalContext('extension:'+m.node,m.node,[]);mountDevice(c,{}, {kind:m.kind});
  for(const value of [true,false,null,'true',1,undefined]) {
   send(c,stateFor(m,snapshot({[m.keys[0]]:value})));await settle();eq(c.physical.get('').visible,value===true);
  }
  c.destroy();
 }
 delete globalThis.document;
}
const copy=roots[0].api.getCoalState();copy.values.X=true;eq(roots[0].api.getCoalState().values.X,undefined);
for(const c of [...roots,a,b,feeder,feeder2,tee,plough,fall,wheel])c.destroy();eq([...listeners.values()].reduce((n,s)=>n+s.size,0),0);eq(frames.size,0);
const re=context('A:','166:730');root.setup({},re);eq(re.api.getCoalState().values,{});re.destroy();
const artifact=currentArtifact;
eq(artifact.nodeArtifacts['166:730'].surface.slots,JSON.parse(fs.readFileSync('docs/coal/slots.json')));
eq(artifact.nodeArtifacts['166:730'].surface.slots.robot__344_0.name,'Robot');
const result={status:'passed',kind:'source-mock-not-browser',assertions,mappedDevices:mapping.length,realRuntimeTrace:false};
fs.writeFileSync('tests/coal/results.json',JSON.stringify(result,null,2)+'\n');console.log(result);
