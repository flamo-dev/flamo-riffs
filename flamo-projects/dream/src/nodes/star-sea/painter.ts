import {drawNova} from './supernova';
import {MeteorField,burstPalettes,meteorOpacity} from './meteors';
import {DreamWorld,type View} from './world';
import {pearl,starlight,shimmer,TAU,clamp,fishGeometry,fishPose,transformPoint,orbitGeometry,type Point} from './model';
import type {NodeScriptContext,NodeScriptMountedRef,ShapeInstanceBatchHandle} from '/vendor/flamo-runtime/index.es.js';
export type ShapeBatch = ShapeInstanceBatchHandle;
export type BatchContext = Pick<NodeScriptContext,'createShapeBatch'>;
export type Ripple = Point & {time:number};
export interface DreamFrame {time:number;pointer:Point;pointerActive:boolean;ripples:Ripple[];reduced:boolean;view:View}
type RGB = [number,number,number];
const ice:RGB=[.93,.96,1], violet:RGB=[.95,.93,1];
const color=starlight;

// Project-local storage policy. CPU accumulation grows without silently losing primitives.
// Public runtime-api.manifest.json limits each GPU batch to 100,000 instances.
const MAX_BATCH_CAPACITY=100000;
// Keep high-water storage across frames; public Runtime API has no resize, so replace
// each batch at most once at submission, after all CPU growth for that frame is done.
class PrimitiveBuffer {
 data:Float32Array;
 count=0;requested=0;highWater=0;cpuGrowths=0;batchReplacements=0;
 private batch:ShapeBatch;private batchCapacity:number;
 constructor(private ctx:BatchContext,private node:NodeScriptMountedRef,private polygon:readonly number[],capacity:number) {
  this.data=new Float32Array(capacity*10);this.batchCapacity=capacity;
  this.batch=ctx.createShapeBatch({node,polygon,capacity});
 }
 get capacity(){return Math.min(this.data.length/10,MAX_BATCH_CAPACITY);}
 get cpuCapacity(){return this.data.length/10;}
 reset(){this.count=0;this.requested=0;}
 append(){
  this.requested++;
  if(this.requested>this.cpuCapacity){
   // Allocation failure is an explicit exception, never a successful truncated frame.
   const next=new Float32Array(Math.max(this.requested,this.cpuCapacity*2)*10);
   next.set(this.data.subarray(0,this.count*10));this.data=next;this.cpuGrowths++;
  }
  const offset=this.count++*10;this.highWater=Math.max(this.highWater,this.count);return offset;
 }
 reserveForeground(backgroundCount:number){
  if(this.count<=MAX_BATCH_CAPACITY)return 0;
  const foregroundCount=this.count-backgroundCount;
  if(foregroundCount>MAX_BATCH_CAPACITY)throw new Error(`Dream foreground exceeds public ShapeBatch capacity: ${foregroundCount} > ${MAX_BATCH_CAPACITY}; frame not submitted`);
  const dropped=this.count-MAX_BATCH_CAPACITY,keepBackground=backgroundCount-dropped;
  this.data.copyWithin(keepBackground*10,backgroundCount*10,this.count*10);
  this.count=MAX_BATCH_CAPACITY;return dropped;
 }
 upload(){
  if(this.capacity>this.batchCapacity){
   const next=this.ctx.createShapeBatch({node:this.node,polygon:this.polygon,capacity:this.capacity});
   try {next.update(this.data,this.count);} catch(error){next.dispose();throw error;}
   this.batch.dispose();this.batch=next;this.batchCapacity=this.capacity;this.batchReplacements++;
  }else this.batch.update(this.data,this.count);
 }
 stats(){return {requested:this.requested,accepted:this.count,dropped:this.requested-this.count,highWater:this.highWater,capacity:this.capacity,cpuCapacity:this.cpuCapacity,cpuGrowths:this.cpuGrowths,batchReplacements:this.batchReplacements};}
 dispose(){this.batch.dispose();}
}

export class DreamPainter {
 private dotBuffer:PrimitiveBuffer;private lineBuffer:PrimitiveBuffer;
 readonly meteors=new MeteorField();
 readonly world=new DreamWorld(1);private view:View|undefined;private projection=false;
 private get dots(){return this.dotBuffer.count;}
 private get lines(){return this.lineBuffer.count;}
 constructor(ctx:BatchContext,lineNode:NodeScriptMountedRef,dotNode:NodeScriptMountedRef) {
  const polygon=Array.from({length:12},(_,i)=>[Math.cos(i/12*TAU),Math.sin(i/12*TAU)]).flat();
  this.lineBuffer=new PrimitiveBuffer(ctx,lineNode,[0,-.5,1,-.5,1,.5,0,.5],18000);
  this.dotBuffer=new PrimitiveBuffer(ctx,dotNode,polygon,22000);
 }
 private dot(x:number,y:number,r:number,c:RGB,a:number) {if(this.projection&&this.view){const v=this.view;x=(x-v.center.x)*v.zoom+v.width/2;y=(y-v.center.y)*v.zoom+v.height/2;r*=v.zoom;if(x< -r*2||y< -r*2||x>v.width+r*2||y>v.height+r*2)return;}if(a<.003||r<.1)return;const o=this.dotBuffer.append(),d=this.dotBuffer.data;d[o]=r;d[o+1]=0;d[o+2]=0;d[o+3]=r;d[o+4]=x;d[o+5]=y;d[o+6]=c[0];d[o+7]=c[1];d[o+8]=c[2];d[o+9]=clamp(a);}
 private glow(x:number,y:number,r:number,c:RGB,a:number=1) {this.dot(x,y,r*9,c,a*.013);this.dot(x,y,r*5,c,a*.032);this.dot(x,y,r*2.7,c,a*.09);this.dot(x,y,r,c,a*.88);this.dot(x,y,r*.38,c,a);}
 private line(a:Point,b:Point,width:number,c:RGB,alpha:number) {if(this.projection&&this.view){const v=this.view;const map=(p:Point)=>({x:(p.x-v.center.x)*v.zoom+v.width/2,y:(p.y-v.center.y)*v.zoom+v.height/2});a=map(a);b=map(b);width*=v.zoom;}if(this.view){const {width:w,height:h}=this.view;const m=Math.max(2,width);if(Math.max(a.x,b.x)<-m||Math.min(a.x,b.x)>w+m||Math.max(a.y,b.y)<-m||Math.min(a.y,b.y)>h+m)return;}if(alpha<.003)return;const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<.001)return;const o=this.lineBuffer.append(),d=this.lineBuffer.data;d[o]=dx;d[o+1]=dy;d[o+2]=-dy/len*width;d[o+3]=dx/len*width;d[o+4]=a.x;d[o+5]=a.y;d[o+6]=c[0];d[o+7]=c[1];d[o+8]=c[2];d[o+9]=clamp(alpha);}
 render(f:DreamFrame) {
  this.dotBuffer.reset();this.lineBuffer.reset();const t=f.time,p=f.pointer;
  this.view=f.view;this.projection=false;const population=this.world.render(f.view,t,{dot:this.dot.bind(this),line:this.line.bind(this)});this.projection=true;
  const worldPrimitives={lines:this.lines,dots:this.dots};
  for(let fish=0;fish<2;fish++){
   const pose=fishPose(t,fish,p),strands=fishGeometry(t,fish);
   for(let k=0;k<strands.length;k++){const s=strands[k];const breath=.6+.4*shimmer(t,fish*3+k*.17);let prior:Point|undefined;
    for(let j=0;j<s.points.length;j++){const q=transformPoint(s.points[j],pose),c=color(s.hue),accent=pearl(fish?.75:.2),ink=k%11===0?accent:c;const focus=clamp((fish?.3:1)+Math.log2(f.view.zoom)*.16),blur=1+(1-focus)*5;if(prior){this.line(prior,q,blur*4,accent,s.alpha*breath*.13);this.line(prior,q,blur*2,accent,s.alpha*breath*.3);this.line(prior,q,1.3+blur*.2,ink,s.alpha*breath*(.35+focus*3.3));}prior=q;
     if(j%2===0){const a=shimmer(t,j*1.77+k*.71);if(j%6===0)this.glow(q.x,q.y,(1.1+(j%5)*.2)*pose.scale,j%12===0?accent:c,.65+a*.45);else this.dot(q.x,q.y,.85*pose.scale,c,.6+a*.5);}}
   }
   const eye=transformPoint({x:140,y:-8},pose);this.glow(eye.x,eye.y,2.7*pose.scale,pearl(fish?.75:.2),1);this.dot(eye.x,eye.y,1.1*pose.scale,ice,1);
  }
  const fishPrimitives={lines:this.lines-worldPrimitives.lines,dots:this.dots-worldPrimitives.dots};
  for(const strand of orbitGeometry(t)){let prev:Point|undefined;for(let j=0;j<strand.points.length;j++){const p2=strand.points[j];if(prev)this.line(prev,p2,.55,color(strand.hue),strand.alpha*shimmer(t,strand.hue*17));if(j%5===0)this.glow(p2.x,p2.y,.95,pearl(.8),.85);prev=p2;}}
  // Tiny drifting jelly constellation, different from the winged fish.
  for(let k=0;k<6;k++){let prev:Point|undefined;for(let j=0;j<=32;j++){const q=j/32;const pt={x:1350+t*2+(k-2.5)*9+Math.sin(q*6-t*.4+k*.6)*q*27,y:745+q*130+Math.sin(t*.1)*12};if(prev)this.line(prev,pt,.5,violet,.16*(1-q));if(j%7===0)this.glow(pt.x,pt.y,.95,k%2?pearl(.3):violet,.7);prev=pt;}}
  this.meteors.update(f.view,t,this.world.targets);
  for(const m of this.meteors.meteors){
   const opacity=meteorOpacity(m);
   const focus=clamp(m.depth+Math.log2(f.view.zoom)*.12),blur=(1+(1-focus)*5)*m.scale,c=color(m.hue);
   const speed=Math.hypot(m.vx,m.vy),length=m.tailLength*m.scale;
   for(let i=0;i<12;i++){const q=i/12,q2=(i+1)/12,a={x:m.x-m.vx/speed*length*q,y:m.y-m.vy/speed*length*q},b={x:m.x-m.vx/speed*length*q2,y:m.y-m.vy/speed*length*q2};
    this.line(a,b,m.halo*m.scale*2,c,opacity*(1-q)*.055);this.line(a,b,m.halo*m.scale,c,opacity*(1-q)*.14);this.line(a,b,m.lineWidth*m.scale,c,opacity*(1-q)*(.15+focus*.7));}
   this.dot(m.x,m.y,m.halo*m.scale*2,c,opacity*.055);this.dot(m.x,m.y,m.halo*m.scale,c,opacity*.18);this.dot(m.x,m.y,m.radius,c,opacity*(.25+focus*.65));
  }
  for(const b of this.meteors.bursts)drawNova(b,burstPalettes[b.palette],{dot:this.dot.bind(this),line:this.line.bind(this)});
  for(const ripple of f.ripples){const age2=t-ripple.time;if(age2<0||age2>4)continue;let prev:Point|undefined;const radius=12+age2*65;for(let j=0;j<=70;j++){const a=j/70*TAU;const pt={x:ripple.x+Math.cos(a)*radius,y:ripple.y+Math.sin(a)*radius*.85};if(prev)this.line(prev,pt,1.1,ice,Math.exp(-age2)*.65);prev=pt;}this.glow(ripple.x,ripple.y,3,ice,Math.exp(-age2));}
  if(f.pointerActive){this.glow(p.x,p.y,2.2,[.78,.9,1],.75);for(let j=0;j<12;j++){const a=j/12*TAU+t*.22;this.dot(p.x+Math.cos(a)*17,p.y+Math.sin(a)*17,.7,ice,.45);}}
  // Budget overflow against background only, after foreground demand is known.
  // Normal frames never enter this branch; no quality/LOD or geometry is changed.
  worldPrimitives.lines-=this.lineBuffer.reserveForeground(worldPrimitives.lines);
  worldPrimitives.dots-=this.dotBuffer.reserveForeground(worldPrimitives.dots);
  this.lineBuffer.upload();this.dotBuffer.upload();
  return {...population,batchCount:2,dotCapacity:this.dotBuffer.capacity,lineCapacity:this.lineBuffer.capacity,primitiveStats:{lines:this.lineBuffer.stats(),dots:this.dotBuffer.stats()},worldPrimitives,fishPrimitives,bufferBytes:this.dotBuffer.data.byteLength+this.lineBuffer.data.byteLength,uploadBytes:(this.dots+this.lines)*40,dots:this.dots,lines:this.lines,meteors:this.meteors.meteors.length,bursts:this.meteors.bursts.length,meteorLimit:3,meteorStates:this.meteors.meteors.map(m=>({id:m.id,vx:m.vx,vy:m.vy,scale:m.scale,entered:m.entered,age:m.age,life:m.life,fadeIn:m.fadeIn,fadeOut:m.fadeOut,opacity:meteorOpacity(m),x:m.x,y:m.y,depth:m.depth,tailLength:m.tailLength,headRadius:m.headRadius,halo:m.halo})),burstLimit:6,targetCount:this.world.targets.length,burstStates:this.meteors.bursts.map(b=>({age:b.age,novaSeed:b.nova.seed,life:b.nova.life,clouds:b.nova.clouds.length,jets:b.nova.jets.length,dust:b.nova.dust.length,palette:b.palette,x:b.x,y:b.y,depth:b.depth}))};
 }
 dispose(){this.dotBuffer.dispose();this.lineBuffer.dispose();}
}
