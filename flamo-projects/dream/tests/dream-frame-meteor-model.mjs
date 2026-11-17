import assert from 'node:assert/strict';
import {MeteorField,meteorSize,meteorScreenSpeed,meteorVisible,meteorOpacity,starContact} from '../.flamo/generated/interactions/scripts/dream-star-sea-v1/meteors.js';
let born=0,entered=0,fadeMotion=0,peak=0,contacts=0;
const shapes=[];for(let d=.1;d<=1;d+=.1)for(let s=0;s<=1;s+=.01){const dim=meteorSize(s,d);shapes.push({...dim,speed:meteorScreenSpeed(dim.tailLength)});}
for(const key of ['tailLength','headRadius','halo']){shapes.sort((a,b)=>a[key]-b[key]);for(let i=1;i<shapes.length;i++)assert(shapes[i].speed>=shapes[i-1].speed-1e-10);}
for(let seed=1;seed<=60;seed++){
 const f=new MeteorField();f.reset(seed);let v={width:480,height:400,zoom:.28,center:{x:0,y:0}},prior=new Map();
 for(let i=0;i<1200;i++){
  if(i%300===299)v={...v,zoom:[.0625,8,.28][Math.floor(i/300)%3],center:{x:i*1000,y:-i*500}};
  f.update(v,i*.05);peak=Math.max(peak,f.meteors.length);assert(f.meteors.length<=3);
  for(const e of f.events)if(e.action==='dream.meteor')for(const m of e.detail.trajectories){born++;assert(!meteorVisible({...m,scale:1/v.zoom},v),'whole birth bounds outside');assert.equal(m.opacity,0);}
  for(const m of f.meteors){assert(Number.isFinite(m.x+m.y+m.life));const old=prior.get(m.id);if(m.entered&&!old?.entered)entered++;
   if(old&&m.age>m.life-m.fadeOut&&m.age>old.age&&m.scale===old.scale){assert(Math.hypot(m.x-old.x,m.y-old.y)>0);fadeMotion++;}
   assert(meteorOpacity(m)>=0&&meteorOpacity(m)<=1);
  }prior=new Map(f.meteors.map(m=>[m.id,{...m}]));
 }
 f.reset(seed);f.update(v,0);const a=JSON.stringify(f.meteors);f.reset(seed);f.update(v,0);assert.equal(JSON.stringify(f.meteors),a);
}
// Real analytic swept contact while inside, once only; wrong depth rejected.
const v={width:480,height:400,zoom:1,center:{x:0,y:0}},f=new MeteorField();f.reset(3);f.update(v,0);
let time=0;while(!f.meteors[0].entered){time+=.01;f.update(v,time);}
const m=f.meteors[0];while(Math.abs(m.x)>210||Math.abs(m.y)>170){time+=.01;f.update(v,time);}
const p={x:m.x+m.vx*.025,y:m.y+m.vy*.025},target={id:'analytic-visible',depth:m.depth,radius:1,sample:()=>p};
assert.equal(starContact({...m,px:m.x,py:m.y,x:p.x,y:p.y},{...target,depth:m.depth+.2},time,time+.05),null);
f.update(v,time+.05,[target]);assert.equal(f.events.filter(e=>e.action==='dream.collision').length,1);contacts++;
f.update(v,time+.1,[target]);assert.equal(f.events.filter(e=>e.action==='dream.collision').length,0);
assert(entered>0&&fadeMotion>0);console.log(JSON.stringify({born,entered,fadeMotion,peak,contacts,sizeSpeedMonotonic:true,steps:72000,resets:120}));
// Camera reveal of a not-yet-entered object restarts its fade outside, same slot.
const rebase=new MeteorField();rebase.reset(17);rebase.update(v,0);const hidden=rebase.meteors[0],hiddenId=hidden.id;
hidden.age=.3;
const revealed={...v,center:{x:hidden.x,y:hidden.y},zoom:8};
rebase.update(revealed,0);
assert.equal(rebase.meteors[0].id,hiddenId);assert.equal(hidden.age,0);assert.equal(meteorOpacity(hidden),0);assert(!meteorVisible(hidden,revealed));assert.equal(rebase.meteors.length,1);
console.log({cameraRevealRebasedOutside:true,sameSlot:true});
