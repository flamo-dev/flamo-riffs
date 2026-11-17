import assert from 'node:assert/strict';
import {DreamWorld} from '../.flamo/generated/interactions/scripts/dream-star-sea-v1/world.js';
import {writeFile} from 'node:fs/promises';
const w=new DreamWorld(1234);let signature='',dots=0,lines=0;
const brush={dot(...v){dots++;assert(v.slice(0,3).every(Number.isFinite));signature+=v.slice(0,3).join(',')+';'},line(a,b){lines++;assert([a.x,a.y,b.x,b.y].every(Number.isFinite))}};
const draw=(x,y,z,t=10)=>{signature='';dots=lines=0;const counts=w.render({width:1440,height:900,center:{x,y},zoom:z},t,brush);return {counts,signature,dots,lines}};
let maxPartitions=0,maxDots=0,maxLines=0;
for(let i=0;i<300;i++){const r=draw(i*3200,i*-1700,2**(-4+i%8));maxPartitions=Math.max(maxPartitions,r.counts.partitions);maxDots=Math.max(maxDots,r.dots);maxLines=Math.max(maxLines,r.lines)}
const a=draw(0,0,1),b=draw(0,0,1);assert.equal(a.signature,b.signature);draw(1e8,-1e8,8);assert.equal(draw(0,0,1).signature,a.signature);assert.notEqual(draw(0,0,1,12).signature,a.signature);w.reset(5678);assert.notEqual(draw(0,0,1).signature,a.signature);assert(maxPartitions<1000);assert(maxDots<22000);assert(maxLines<9000);
const report={passed:true,seedDeterminism:true,revisitStable:true,motionChangesGeometry:true,replayChangesGeometry:true,maxPartitions,maxDots,maxLines,note:'Algorithm checks only; not FPS or Preview acceptance'};await writeFile('.flamo/reports/dream-infinite/world-checks.json',JSON.stringify(report,null,2));console.log(report);
