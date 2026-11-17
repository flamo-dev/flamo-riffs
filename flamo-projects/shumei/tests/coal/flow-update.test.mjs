import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {readArtifact} from './read-artifact.mjs';
import {mapping} from '../../src/components/coal/mapping.ts';
import {snapshot,stateFor} from '../../src/components/coal/model.ts';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const a=readArtifact();
const fixture=json('tests/coal/flow-update-fixture.json');
const {points}=fixture;
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const entries=Object.values(points).flatMap(g=>g.data),nodes=new Map();
function walk(ns){for(const n of ns){nodes.set(`${n.guid.sessionID}:${n.guid.localID}`,n);walk(n.children??[]);}}walk(a.scene.nodes);
assert.equal(digest(a.scene),fixture.sceneSha256);
assert.equal(digest(a.nodeArtifacts['166:730'].surface.slots),fixture.slotsSha256);
assert.equal(mapping.length,195);assert.equal(new Set(mapping.map(m=>m.node)).size,195);
const flows=mapping.filter(m=>m.flowTargets);assert.equal(flows.length,56);
for(const m of mapping){assert.ok(nodes.has(m.node),m.node);for(const k of m.keys)assert.ok(entries.some(p=>p.id===k)||/^(PDSLBJ|PDDMBJ|PDPPBJ|PDYHBJ|RYRQBJ)_/.test(k),k);}
for(const p of entries.filter(p=>p.id.startsWith('LM_'))){
 const m=flows.find(m=>m.keys[0]===p.id);assert.ok(m,p.id);
 assert.equal(nodes.get(m.node).name.replace(/_GIF$/,''),p.notes.replace(/^落煤_/,''));
 assert.equal(m.flowTargets.length,1);assert.ok(nodes.get(m.node).children.some(n=>`${n.guid.sessionID}:${n.guid.localID}`===m.flowTargets[0]));
 assert.equal(a.nodeArtifacts[m.flowTargets[0]].of,'348:459');
}
assert.deepEqual(mapping.filter(m=>m.kind==='extension').map(m=>m.keys[0]).sort(),entries.filter(p=>p.id.startsWith('PDTBSSZZ_')).map(p=>p.id).sort());
const feeder=mapping.find(m=>m.node==='209:721');
assert.deepEqual(stateFor(feeder,snapshot({'GMJ_1BPD#1GMJWZ':26.5,'GMJ_1BPD#1GMJYX':true,'GMJ_1BPD#2GMJWZ':53,'GMJ_1BPD#2GMJYX':false})).values,[26.5,true,53,false]);
assert.deepEqual(stateFor(feeder,snapshot({'GMJ_2APD#1GMJWZ':53})).values,[null,null,null,null]);
for(const [id,na] of Object.entries(a.nodeArtifacts))if(!nodes.has(id))assert.ok(!(na.scripts??[]).some(s=>s.src?.startsWith('src/components/coal/')),id);
console.log(JSON.stringify({status:'passed',scope:'current-scene/config binding and preservation',mapped:195,fallingFlows:56,extensions:4}));
