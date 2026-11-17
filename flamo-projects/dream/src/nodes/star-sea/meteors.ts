import {createNova,type Nova} from './supernova';
import {random,clamp,TAU,type Point} from './model';
import type {View,StarTarget} from './world';
export const METEOR_LIMIT=3;
export function meteorSize(size:number,depth:number){const extent=(30+size*100)*(.42+.58*depth);return {tailLength:extent,headRadius:extent*.021,lineWidth:extent*.014,halo:extent*.079};}
export const meteorScreenSpeed=(tailLength:number)=>35+tailLength*1.35;
// Backtrace from a viewport-interior destination to a separating outer edge.
export function outsideBirth(v:View,destination:Point,angle:number,halo:number){
 const dx=Math.cos(angle),dy=Math.sin(angle),r=halo*2+6;
 const x=clamp((destination.x-v.center.x)*v.zoom,-v.width*.45,v.width*.45);
 const y=clamp((destination.y-v.center.y)*v.zoom,-v.height*.45,v.height*.45);
 const bx=dx>0?(x+v.width/2+r)/dx:dx<0?(x-v.width/2-r)/dx:Infinity;
 const by=dy>0?(y+v.height/2+r)/dy:dy<0?(y-v.height/2-r)/dy:Infinity;
 const distance=Math.min(bx,by);
 return {x:v.center.x+(x-dx*distance)/v.zoom,y:v.center.y+(y-dy*distance)/v.zoom,distance};
}
// Fixed at birth, independent of camera changes and random-number consumption.
export function meteorFadeDurations(life:number,depth:number,speed:number){
 const gentle=clamp((1-depth)*.6+(1-clamp((speed-30)/140))*.4);
 return {fadeIn:Math.min(.4+.5*gentle,Math.max(0,life)*.25),fadeOut:Math.min(.7+.7*gentle,Math.max(0,life)*.35)};
}
export function meteorOpacity(m:Pick<Meteor,'age'|'life'|'fadeIn'|'fadeOut'>){
 if(m.life<=0||m.age<=0||m.age>=m.life)return 0;
 const smooth=(x:number)=>{const q=clamp(x);return q*q*(3-2*q);};
 return smooth(m.age/Math.max(1e-9,m.fadeIn))*smooth((m.life-m.age)/Math.max(1e-9,m.fadeOut));
}
// Conservative bounds of the entire tail and widest halo, not just the head.
export function meteorVisible(m:Meteor,v:View){
 const speed=Math.hypot(m.vx,m.vy)||1,length=m.tailLength*m.scale;
 const x=(m.x-v.center.x)*v.zoom,y=(m.y-v.center.y)*v.zoom;
 const tx=x-m.vx/speed*length*v.zoom,ty=y-m.vy/speed*length*v.zoom;
 const r=Math.max(m.halo*2,m.headRadius)*m.scale*v.zoom+2;
 return Math.max(x,tx)+r>=-v.width/2&&Math.min(x,tx)-r<=v.width/2&&Math.max(y,ty)+r>=-v.height/2&&Math.min(y,ty)-r<=v.height/2;
}
export interface Meteor extends Point {id:number;vx:number;vy:number;depth:number;radius:number;hue:number;age:number;life:number;px:number;py:number;scale:number;size:number;tailLength:number;headRadius:number;lineWidth:number;halo:number;fadeIn:number;fadeOut:number;entered?:boolean}
export interface Burst extends Point {id:number;age:number;depth:number;hue:number;scale:number;palette:number;targetId:string;nova:Nova}
export const burstPalettes:[[number,number,number],[number,number,number],[number,number,number],[number,number,number],[number,number,number]]=[[.66,.3,1],[.38,.45,1],[1,.32,.74],[.4,.85,.88],[1,.53,.64]];
// Relative swept segments use the SAME interval, not unrelated path intersections.
export function sweptContact(a:Point,b:Point,c:Point,d:Point,r:number){const x=a.x-c.x,y=a.y-c.y,vx=b.x-a.x-d.x+c.x,vy=b.y-a.y-d.y+c.y;const q=clamp(-(x*vx+y*vy)/(vx*vx+vy*vy||1));return Math.hypot(x+vx*q,y+vy*q)<=r?q:null;}
export function starContact(m:Meteor,s:StarTarget,from:number,to:number){if(Math.abs(m.depth-s.depth)>.035)return null;return sweptContact({x:m.px,y:m.py},m,s.sample(from),s.sample(to),m.radius+s.radius);}
export class MeteorField {
 readonly meteors:Meteor[]=[];readonly bursts:Burst[]=[];
 private rand=random(1);private serial=0;private next=0;private targetAt=18;private last=0;private viewKey='';
 events:{action:string;detail:Record<string,unknown>}[]=[];
 reset(seed:number){this.meteors.length=0;this.bursts.length=0;this.events.length=0;this.rand=random(seed^0x73ac11);this.serial=0;this.next=0;this.targetAt=18;this.last=0;this.viewKey='';}
 private spawn(v:View,x:number,y:number,angle:number,depth:number,_speed:number,target?:StarTarget,t=0){
  if(this.meteors.length>=METEOR_LIMIT)return;
  const scale=1/v.zoom,size=this.rand(),dims=meteorSize(size,depth),speed=meteorScreenSpeed(dims.tailLength);
  let birth=outsideBirth(v,{x,y},angle,dims.halo);
  // Predict only; actual visible swept contact remains the sole explosion trigger.
  if(target)for(let i=0;i<12;i++){const p=target.sample(t+birth.distance/speed);birth=outsideBirth(v,p,angle,dims.halo);}
  x=birth.x;y=birth.y;
  const hue=this.rand(),life=birth.distance/speed+2+this.rand()*2;
  const m:Meteor={id:++this.serial,x,y,px:x,py:y,vx:Math.cos(angle)*speed*scale,vy:Math.sin(angle)*speed*scale,depth,radius:dims.headRadius*scale,hue,age:0,life,scale,size,entered:false,...dims,...meteorFadeDurations(life,depth,speed)};this.meteors.push(m);return m;
 }
 update(v:View,t:number,targets:readonly StarTarget[]=[]){
  const from=this.last,dt=Math.max(0,t-from);this.last=t;this.events.length=0;
  const key=`${v.center.x}/${v.center.y}/${v.zoom}/${v.width}/${v.height}`,stable=!this.viewKey||key===this.viewKey;this.viewKey=key;
  for(const m of this.meteors){const scale=1/v.zoom,ratio=scale/m.scale;m.vx*=ratio;m.vy*=ratio;m.radius*=ratio;m.scale=scale;}
  for(const b of this.bursts)b.scale=1/v.zoom;
  const visible=(m:Point,margin=130)=>Math.abs((m.x-v.center.x)*v.zoom)<v.width/2+margin&&Math.abs((m.y-v.center.y)*v.zoom)<v.height/2+margin;
  for(let i=this.bursts.length-1;i>=0;i--){const b=this.bursts[i];b.age+=dt;if(b.age>b.nova.life||!visible(b,200))this.bursts.splice(i,1);}
  const dead=new Set<number>();
  for(const m of this.meteors){
   if(!stable&&!m.entered&&meteorVisible(m,v)){
    const birth=outsideBirth(v,v.center,Math.atan2(m.vy,m.vx),m.halo);
    m.x=birth.x;m.y=birth.y;m.age=0;
    m.life=birth.distance/meteorScreenSpeed(m.tailLength)+3;
    Object.assign(m,meteorFadeDurations(m.life,m.depth,meteorScreenSpeed(m.tailLength)));
   }
   m.px=m.x;m.py=m.y;m.x+=m.vx*dt;m.y+=m.vy*dt;m.age+=dt;if(meteorVisible(m,v))m.entered=true;
   if(stable&&dt>0)for(const s of targets){const q=starContact(m,s,from,t);if(q===null)continue;
    const hit={x:m.px+(m.x-m.px)*q,y:m.py+(m.y-m.py)*q};if(!visible(hit,0))continue;
    const palette=[0,0,0,1,1,1,2,2,3,4][Math.floor(this.rand()*10)];
    const nova=createNova(Math.floor(this.rand()*4294967296));
    if(this.bursts.length>=6)this.bursts.shift();this.bursts.push({...hit,id:m.id,age:0,depth:m.depth,hue:m.hue,scale:m.scale,palette,targetId:s.id,nova});dead.add(m.id);
    this.events.push({action:'dream.collision',detail:{cause:'simultaneous-swept-star-contact',targetKind:'star',targetId:s.id,meteorId:m.id,depth:m.depth,targetDepth:s.depth,palette:burstPalettes[palette],paletteIndex:palette,nova,stages:{core:[0,.3],cloud:[.1,nova.life],jets:[.1,nova.life*.7],dust:[.3,nova.life]},from,to:t,before:{meteor:{x:m.px,y:m.py},star:s.sample(from)},after:{meteor:{x:m.x,y:m.y},star:s.sample(t)},q,hit,activeBefore:this.meteors.length,removed:1,bursts:this.bursts.length}});break;
   }
  }
  for(let i=this.meteors.length-1;i>=0;i--){const m=this.meteors[i];if(dead.has(m.id)||m.age>=m.life||(m.entered&&!meteorVisible(m,v)))this.meteors.splice(i,1);}
  const spawned:Meteor[]=[];
  // Reserve one slot for occasional genuine star rendezvous. Most flights are free.
  if(t>=this.targetAt&&this.meteors.length<3&&targets.length){
   const s=targets[Math.floor(this.rand()*targets.length)],delay=2.6,p=s.sample(t+delay),angle=this.rand()*TAU,speed=35+this.rand()*20;
   const m=this.spawn(v,p.x-Math.cos(angle)*speed*delay/v.zoom,p.y-Math.sin(angle)*speed*delay/v.zoom,angle,s.depth,speed,s,t);if(m)spawned.push(m);
   this.targetAt=t+14+this.rand()*10;
  }
  if(t>=this.next){if(this.meteors.length<2){const m=this.spawn(v,v.center.x+(this.rand()-.5)*v.width/v.zoom,v.center.y+(this.rand()-.5)*v.height*.65/v.zoom,this.rand()*TAU,[.24,.55,1][Math.floor(this.rand()*3)],30+this.rand()*140);if(m)spawned.push(m);}this.next=t+3+this.rand()*4;}
  if(spawned.length)this.events.push({action:'dream.meteor',detail:{automatic:true,count:spawned.length,active:this.meteors.length,limit:3,view:v,trajectories:spawned.map(m=>({id:m.id,x:m.x,y:m.y,vx:m.vx,vy:m.vy,speed:Math.hypot(m.vx,m.vy)*v.zoom,depth:m.depth,size:m.size,tailLength:m.tailLength,headRadius:m.headRadius,lineWidth:m.lineWidth,halo:m.halo,life:m.life,fadeIn:m.fadeIn,fadeOut:m.fadeOut,opacity:meteorOpacity(m)}))}});
 }
}
