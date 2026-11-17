import assert from 'node:assert/strict';
import {meteorSize,starContact,burstPalettes} from '../.flamo/generated/interactions/scripts/dream-star-sea-v1/meteors.js';
import {starlight,shimmer} from '../.flamo/generated/interactions/scripts/dream-star-sea-v1/model.js';
import {DreamWorld} from '../.flamo/generated/interactions/scripts/dream-star-sea-v1/world.js';
for(let p=0;p<60;p++)for(let t=0;t<100;t+=.2){const a=shimmer(t,p);assert(a>.15&&a<.97);assert(Math.abs(a-shimmer(t+.01,p))<.002);const c=starlight(p);assert(Math.min(...c)>=.9);}
for(const d of [.24,.55,1])for(let s=0;s<.99;s+=.01){const a=meteorSize(s,d),b=meteorSize(s+.01,d);for(const k of Object.keys(a))assert(b[k]>a[k]);}
for(const s of [0,.5,1]){const a=meteorSize(s,.24),b=meteorSize(s,1);for(const k of Object.keys(a))assert(b[k]>a[k]);}
const m={px:0,py:0,x:10,y:0,depth:.55,radius:.1};
assert.notEqual(starContact(m,{depth:.55,radius:.1,sample:t=>({x:6-t*2,y:0})},0,1),null);
assert.equal(starContact(m,{depth:1,radius:.1,sample:t=>({x:6-t*2,y:0})},0,1),null);
assert.equal(starContact(m,{depth:.55,radius:.1,sample:t=>({x:5,y:-10+t*10})},0,1),null);
assert.equal(starContact(m,{depth:.55,radius:.1,sample:t=>({x:5,y:10})},0,1),null);
const {createNova,novaEnvelope,drawNova}=await import('../.flamo/generated/interactions/scripts/dream-star-sea-v1/supernova.js');
const topologies=new Set();let maxPrimitives=0;
for(let seed=1;seed<=100;seed++) {const n=createNova(seed);assert.deepEqual(n,createNova(seed));
 const capture=age=>{const data=[];drawNova({x:0,y:0,age,depth:.55,scale:1,nova:n},burstPalettes[seed%5],{dot:(...v)=>data.push(v),line:(...v)=>data.push(v)});return JSON.stringify(data);};assert.equal(capture(1),capture(1));assert.notEqual(capture(1),capture(1.01));
 const angles=n.jets.map(j=>j.angle).sort((a,b)=>a-b),gaps=angles.slice(1).map((a,i)=>a-angles[i]);assert(Math.max(...gaps)-Math.min(...gaps)>.01,'not equal-angle starburst');
topologies.add([n.clouds.length,n.jets.length,n.dust.length].join(','));assert(n.life>=4.8&&n.life<7.8);for(const age of [0,.2,1.3,3,n.life]){let count=0;const brush={dot(...args){assert(args.flat().every(Number.isFinite));count++;},line(a,b,w,c,alpha){assert([a.x,a.y,b.x,b.y,w,...c,alpha].every(Number.isFinite));count++;}};drawNova({x:0,y:0,age,depth:.55,scale:1,nova:n},burstPalettes[seed%5],brush);maxPrimitives=Math.max(maxPrimitives,count);}assert.equal(novaEnvelope(n.life,n.life).cloud,0);}
assert(topologies.size>90);assert(novaEnvelope(.2,6).core>novaEnvelope(1,6).core);assert(novaEnvelope(1,6).dust>0);console.log({topologies:topologies.size,maxPrimitives});
let targets=0;for(let i=0;i<120;i++){const w=new DreamWorld(i+1),v={width:960,height:640,zoom:[.2,1,3][i%3],center:{x:i%2?70000:-70000,y:i*800}},dots=[];w.render(v,22,{dot:(x,y,r,c,a)=>dots.push({x,y,r}),line(){}});assert(w.targets.length<=512);targets+=w.targets.length;for(const star of w.targets){const p=star.sample(22),x=(p.x-v.center.x)*v.zoom+v.width/2,y=(p.y-v.center.y)*v.zoom+v.height/2;assert(dots.some(q=>Math.hypot(q.x-x,q.y-y)<1e-6&&Math.abs(q.r-star.radius*v.zoom)<1e-6),'target matches rendered core');}}
assert(targets>100);console.log({silverPhaseSamples:30000,actualViewChecks:120,targets,sameTimeContactTests:4,monotonic:true,stages:true});
const {MeteorField}=await import('../.flamo/generated/interactions/scripts/dream-star-sea-v1/meteors.js');
let contacts=0,peak=0;const palettes=new Set(),contactTimes=[];
for(let seed=1;seed<=12;seed++){
 const w=new DreamWorld(seed),f=new MeteorField();f.reset(seed);const v={width:960,height:640,zoom:[.2,1,3][seed%3],center:{x:seed%2?70000:-70000,y:70000}};
 for(let n=0;n<=300;n++){const t=n*.1;w.render(v,t,{dot(){},line(){}});f.update(v,t,w.targets);peak=Math.max(peak,f.meteors.length);assert(f.meteors.length<=3);for(const e of f.events)if(e.action==='dream.collision'){assert.equal(e.detail.targetKind,'star');contacts++;contactTimes.push(t);palettes.add(e.detail.paletteIndex);}for(const b of f.bursts)assert(b.palette>=0&&b.palette<5);}
}
assert(contacts>=10);assert(palettes.size>=3);console.log({actualMovingWorldContacts:contacts,peak,contactTimes,palettes:[...palettes]});

// Brightness regression: same primitive geometry/count, stronger bounded layers.
const ejecta={angle:0,reach:1,width:1,bend:0,phase:0,energy:1};
const nova={seed:1,life:6,size:1,clouds:[ejecta],jets:[ejecta],dust:[ejecta]};
for(const age of [0,.08,.2,1,3,6]){
 const dots=[],lines=[],e=novaEnvelope(age,nova.life);
 drawNova({x:0,y:0,age,depth:1,scale:1,nova},burstPalettes[0],{dot:(...a)=>dots.push(a),line:(...a)=>lines.push(a)});
 assert.equal(dots.length,11);assert.equal(lines.length,36);
 for(const a of [...dots,...lines])assert(a[4]>=0&&a[4]<=1,'bounded opacity');
 const near=(a,b)=>assert(Math.abs(a-b)<1e-12);
 near(dots[0][4],e.cloud*.11/3);near(dots[3][4],e.cloud*.20);
 near(lines[0][4],e.jets*(1-1/12)*.8*.17);
 near(lines[1][4],e.jets*(1-1/12)*.8*.42);
 near(lines[2][4],e.jets*(1-1/12)*.8*.95);
 near(dots[6][4],e.dust*.12);near(dots[7][4],e.dust);
 near(dots[8][4],e.core*.09);near(dots[9][4],e.core*.28);near(dots[10][4],e.core);
 assert.deepEqual(dots.slice(-3).map(a=>a[2]),[18,8,2.8]);
}
console.log({novaBrightness:'passed',geometryAndOpacityBounds:true});
