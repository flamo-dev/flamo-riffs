import assert from 'node:assert/strict';
import {meteorOpacity,meteorFadeDurations,meteorVisible,MeteorField} from '../.flamo/generated/interactions/scripts/dream-star-sea-v1/meteors.js';
let samples=0;
for(const life of [.001,.1,.5,1,7,12,100])for(const depth of [.24,.55,1])for(const speed of [30,90,170]){
 const m={life,...meteorFadeDurations(life,depth,speed)};
 assert.equal(meteorOpacity({...m,age:0}),0);assert.equal(meteorOpacity({...m,age:life}),0);
 assert.equal(meteorOpacity({...m,age:life*.5}),1);
 for(let i=0;i<=1000;i++){const a=meteorOpacity({...m,age:life*i/1000}),b=meteorOpacity({...m,age:life*(i+.001)/1000});assert(a>=0&&a<=1);assert(Math.abs(a-b)<.001);samples++;}
 assert(meteorOpacity({...m,age:life*1e-8})<1e-8);assert(meteorOpacity({...m,age:life*(1-1e-8)})<1e-8);
}
console.log({samples});
// Project painter sink test: all 36 tail strokes and three head/halo layers
// get the same envelope, without changing their geometry or color.
const {DreamPainter}=await import('../.flamo/generated/interactions/scripts/dream-star-sea-v1/painter.js');
const painter=new DreamPainter({createShapeBatch:()=>({update(){},dispose(){}})}, {}, {});
painter.world.render=()=>({});painter.meteors.update=()=>{};
const projectile={id:99,x:200,y:200,vx:40,vy:0,depth:.55,scale:1,size:.5,tailLength:60,headRadius:1.5,lineWidth:1,halo:5,radius:1.5,hue:.5,life:10,fadeIn:.8,fadeOut:1.2,age:3};
painter.meteors.meteors.push(projectile);
const draw=age=>{projectile.age=age;const lines=[],dots=[];painter.line=(...args)=>lines.push(args);painter.dot=(...args)=>dots.push(args);painter.render({time:0,pointer:{x:0,y:0},pointerActive:false,ripples:[],reduced:false,view:{width:480,height:400,zoom:1,center:{x:240,y:200}}});return [...lines.slice(-36),...dots.slice(-3)];};
const full=draw(3);for(const age of [0,.1,.4,9.4,9.9,10]){const current=draw(age),a=meteorOpacity({...projectile,age});for(let i=0;i<39;i++){assert.deepEqual(current[i].slice(0,-1),full[i].slice(0,-1));assert(Math.abs(current[i].at(-1)-full[i].at(-1)*a)<1e-12);}}
painter.dispose();console.log({unifiedPainterLayers:39,geometryAndPaletteUnchanged:true});
