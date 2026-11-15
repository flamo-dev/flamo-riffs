import { clamp, smooth } from './wind';

type XY = [number, number];
export interface Leg {hip: XY; knee: XY; ankle: XY; sole: XY; shoeAngle:number; depth:number}
export const legs:Leg[]=[
  {hip:[210,231],knee:[182,268],ankle:[143,306],sole:[147,337],shoeAngle:1.07,depth:-8},
  {hip:[250,226],knee:[280,284],ankle:[304,331],sole:[321,347],shoeAngle:-.42,depth:6},
];
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
function rotation(from:XY,to:XY){return Math.atan2(to[1]-from[1],to[0]-from[0]);}
function rotated(x:number,y:number,a:number):XY{return [x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];}
export const strideLength=143;
const scale=.485, stance=.38, length=64;
const wrap=(phase:number)=>phase-Math.floor(phase);

function footprint(r:Leg,phase:number){
  const u=wrap(phase),swing=clamp((u-stance)/(1-stance));
  const stride=strideLength/scale;
  // Linear travel cancels the runner's forward speed for the entire planted interval.
  // The smooth return also makes the arriving foot match the ground speed at touchdown.
  const footX=stride*(stance*.47-u+smooth(0,1,swing));
  const lift=72*Math.sin(Math.PI*swing)**1.45*(1.30-.65*swing);
  const roll=u<stance?-.10+.10*smooth(0,.09,u)+.75*smooth(.19,stance,u):
    .75+.19*smooth(0,.20,swing)-1.12*smooth(.23,.81,swing)+.08*smooth(.82,1,swing);
  const angle=roll-r.shoeAngle;
  const toe=rotated(r.sole[0]-r.ankle[0],r.sole[1]-r.ankle[1],angle);
  const pivot=roll<0?-17:19;
  const soleX=230+r.depth+footX+pivot*(1-Math.cos(roll));
  const soleY=105+126/scale-1-(footX+r.depth)*.037-lift-pivot*Math.sin(roll);
  return {angle,ankleX:soleX-toe[0],ankleY:soleY-toe[1]};
}

function supportedPelvis(r:Leg,u:number){
  const foot=footprint(r,u);
  const degrees=159-20*smooth(0,.10,u)+35*smooth(.105,.31,u)-2*smooth(.33,stance,u);
  const reach=2*length*Math.sin(degrees*Math.PI/360),dx=foot.ankleX-r.hip[0];
  return scale*(foot.ankleY-r.hip[1]-Math.sqrt(Math.max(1,reach*reach-dx*dx)));
}

export function bodyBob(phase:number){
  const u=wrap(phase),first=u<.5,local=first?u:u-.5;
  const support=legs[first?1:0],next=legs[first?0:1];
  if(local<=stance)return supportedPelvis(support,local);
  // No foot supports the runner here. Carry the pelvis smoothly into the next landing.
  const t=(local-stance)/(.5-stance),h=.0005;
  const start=supportedPelvis(support,stance),end=supportedPelvis(next,0);
  const takeoff=(start-supportedPelvis(support,stance-h))*(.5-stance)/h;
  const landing=(supportedPelvis(next,h)-end)*(.5-stance)/h;
  return mix(start,end,smooth(0,1,t))+t*(1-t)*((1-t)*takeoff-t*landing)-30*(t*(1-t))**2;
}

export function solveLeg(r:Leg,phase:number,bodyY:number){
  const foot=footprint(r,phase),angle=foot.angle;
  const ankle:XY=[foot.ankleX,foot.ankleY-bodyY/scale];
  const dx=ankle[0]-r.hip[0],dy=ankle[1]-r.hip[1],distance=Math.max(.001,Math.hypot(dx,dy));
  const height=Math.sqrt(Math.max(.01,length*length-distance*distance*.25));
  const knee:XY=[r.hip[0]+dx*.5+dy/distance*height,r.hip[1]+dy*.5-dx/distance*height];
  const thighAngle=rotation(r.hip,knee)-rotation(r.hip,r.knee),shinAngle=rotation(knee,ankle)-rotation(r.knee,r.ankle);
  const upperRatio=Math.hypot(knee[0]-r.hip[0],knee[1]-r.hip[1])/Math.hypot(r.knee[0]-r.hip[0],r.knee[1]-r.hip[1]);
  const lowerRatio=Math.hypot(ankle[0]-knee[0],ankle[1]-knee[1])/Math.hypot(r.ankle[0]-r.knee[0],r.ankle[1]-r.knee[1]);
  function segment(x:number,y:number,from:XY,to:XY,target:XY,cos:number,sin:number,ratio:number):XY {
    const ox=x-from[0],oy=y-from[1],dx=to[0]-from[0],dy=to[1]-from[1];
    const t=(ox*dx+oy*dy)/(dx*dx+dy*dy)*(ratio-1);
    const lx=ox+t*dx,ly=oy+t*dy;
    return [target[0]+cos*lx-sin*ly,target[1]+sin*lx+cos*ly];
  }
  const c1=Math.cos(thighAngle),s1=Math.sin(thighAngle),c2=Math.cos(shinAngle),s2=Math.sin(shinAngle),cf=Math.cos(angle),sf=Math.sin(angle);
  return (x:number,y:number):XY=>{
    const feather=smooth(r.hip[1]-6,r.hip[1]+18,y);
    const kneeWeight=smooth(r.knee[1]-13,r.knee[1]+12,y);
    // Each painted cuff is diagonal. A horizontal blend would bend the raised toe into the shin.
    const cuff=y-r.ankle[1]+(r===legs[0]?-1.32:.64)*(x-r.ankle[0]);
    const boot=smooth(-9,2,cuff);
    const p=segment(x,y,r.hip,r.knee,r.hip,c1,s1,upperRatio);
    const q=segment(x,y,r.knee,r.ankle,knee,c2,s2,lowerRatio);
    const fx=ankle[0]+cf*(x-r.ankle[0])-sf*(y-r.ankle[1]),fy=ankle[1]+sf*(x-r.ankle[0])+cf*(y-r.ankle[1]);
    return [mix(x,mix(mix(p[0],q[0],kneeWeight),fx,boot),feather),mix(y,mix(mix(p[1],q[1],kneeWeight),fy,boot),feather)];
  };
}
