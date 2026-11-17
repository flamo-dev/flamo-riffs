import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

const source = path => readFile(new URL('../../src/components/coal/' + path, import.meta.url), 'utf8');
const moduleUrl = text => 'data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(text)).toString('base64');
const modelUrl = moduleUrl(await source('model.ts')), mappingUrl = moduleUrl(await source('mapping.ts'));
const { mapping } = await import(mappingUrl);
let script = await source('script.ts');
script = script.replace("import { defineNodeScript } from '/vendor/flamo-runtime/index.js';", 'const defineNodeScript = x => x;')
 .replace("from './model'", 'from ' + JSON.stringify(modelUrl))
 .replace("from './mapping'", 'from ' + JSON.stringify(mappingUrl))
 .replace("import { UPDATE, READY, ACK } from './device';", "const UPDATE='update',READY='ready',ACK='ack';");
const { default: root } = await import(moduleUrl(script));
function mount(prefix) {
 const messages=[], listeners=new Map(), cleanup=[], watchers=[], props={uiBindIds:[]};
 const ctx={
  nodeId:prefix+'root',node:id=>({id:prefix+id}),
  instance:{setProps(patch){Object.assign(props,patch);for(const watch of watchers)watch();}},
  bus:{on(name,fn){listeners.set(name,fn);},emit(name,data){messages.push({name,data});}},
  watch(read,changed){let last=read();watchers.push(()=>{const next=read();if(next!==last){last=next;changed();}});},
  expose(api){ctx.api=api;},emit(){},dispose(fn){cleanup.push(fn);},
 };
 root.setup(props,ctx);
 return {ctx,messages,props,send:(name,data)=>listeners.get(name)?.(data),destroy:()=>cleanup.forEach(fn=>fn())};
}
const a=mount('a:'),b=mount('b:');
assert.equal(a.messages.length,mapping.length);
a.messages.length=0;
const motor=mapping.find(m=>m.kind==='motor'), id=motor.keys[0];
a.ctx.api.applyPointValues([{id,value:true},{id:'JQR_DL',value:0}]);
const affected=mapping.filter(m=>m.keys.includes(id));
assert.deepEqual(a.messages.map(m=>m.data.target).sort(),affected.map(m=>'a:'+m.node).sort());
const first=a.messages.find(m=>m.data.target==='a:'+motor.node).data;
a.messages.length=0;
a.ctx.api.applyPointValues([{id,value:true},{id:'JQR_DL',value:4.2}]);
assert.equal(a.messages.length,0,'reading-only updates do not reapply device visuals');
a.send('ack',{owner:a.ctx.nodeId,target:first.target,epoch:first.epoch,state:first.state,errors:[],visual:{status:'observed'}});
assert.equal(a.ctx.api.getCoalState().devices.find(d=>d.node===motor.node).receipt.visual.status,'observed','unchanged device retains late receipt');
a.ctx.api.applyPointValues([{id,value:true},{id:'JQR_DL',value:4.2}]);
assert.equal(a.messages.length,0,'identical snapshots do not send device updates');
a.ctx.api.applyPointValues([{id,value:false},{id:'JQR_DL',value:0}]);
assert.equal(a.ctx.api.getCoalState().values[id],false);
assert.equal(a.ctx.api.getCoalState().values.JQR_DL,0);
a.send('ack',{owner:a.ctx.nodeId,target:first.target,epoch:first.epoch,state:first.state,errors:[],visual:{status:'observed'}});
assert.equal(a.ctx.api.getCoalState().devices.find(d=>d.node===motor.node).receipt,null,'stale receipt cannot overwrite latest state');
a.messages.length=0;
a.send('ready',{target:first.target});
assert.equal(a.messages.length,1,'rematerialized device is resynchronized');
assert.equal(a.messages[0].data.state.run,false);
a.ctx.api.applyPointValues([]);
assert.equal(a.ctx.api.getCoalState().devices.find(d=>d.node===motor.node).run,null);
assert.deepEqual(b.ctx.api.getCoalState().values,{});
a.destroy();b.destroy();
const count=a.messages.length;a.ctx.api.applyPointValues([{id,value:true}]);
assert.equal(a.messages.length,count,'disposed instance sends no updates');
console.log('PASS: per-device updates, false/zero/unknown, late/stale receipts, READY resync, two instances, disposal');
