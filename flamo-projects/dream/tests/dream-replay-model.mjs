import assert from 'node:assert/strict';
import {MeteorField,sweptContact} from '../.flamo/generated/interactions/scripts/dream-star-sea-v1/meteors.js';
assert.notEqual(sweptContact({x:0,y:0},{x:10,y:0},{x:10,y:0},{x:0,y:0},.1),null);
assert.equal(sweptContact({x:0,y:0},{x:10,y:0},{x:5,y:-10},{x:5,y:0},.1),null);
assert.equal(sweptContact({x:0,y:0},{x:0,y:0},{x:5,y:0},{x:5,y:0},1),null);
let collisions=0,peak=0,bursts=0;
for(let i=0;i<120;i++){
 const f=new MeteorField();f.reset(i+1);const v={width:480+i%4*240,height:400,zoom:[.2,1,3][i%3],center:{x:(i%2?1:-1)*70000,y:i*9000}};
 for(let k=0;k<500;k++){f.update(v,k*.05,[{id:"moving-star",depth:.55,radius:2/v.zoom,sample:t=>({x:v.center.x+t/v.zoom,y:v.center.y})}]);peak=Math.max(peak,f.meteors.length);bursts=Math.max(bursts,f.bursts.length);collisions+=f.events.filter(e=>e.action==='dream.collision').length;assert(f.meteors.length<=3);assert(f.bursts.length<=6);for(const m of f.meteors)assert([m.x,m.y,m.vx,m.vy,m.depth].every(Number.isFinite));}
 f.reset(i+1);f.update(v,0);const a=JSON.stringify(f.meteors);for(let j=0;j<3;j++){f.update({...v,center:{x:-v.center.x,y:-v.center.y}},40);f.reset(i+1);assert.equal(f.bursts.length,0);f.update(v,0);assert.equal(JSON.stringify(f.meteors),a);}
}
assert(collisions>=120);console.log(JSON.stringify({views:120,steps:60000,collisions,peak,bursts,resetCycles:360,sweptTests:3}));
