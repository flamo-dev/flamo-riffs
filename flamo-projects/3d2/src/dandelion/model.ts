// Authored botanical geometry for this scene. Units are arbitrary scene metres.
export type V3 = [number, number, number];
export type Quaternion = [number, number, number, number];
export const FLOWER_CENTER: V3 = [-0.035, 1.66, 0];
const add=(a:V3,b:V3):V3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const mul=(a:V3,s:number):V3=>[a[0]*s,a[1]*s,a[2]*s];
const cross=(a:V3,b:V3):V3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export interface SeedGeometry { hub: V3; first: number; count: number }
export const unit=(v:V3):V3=>mul(v,1/Math.max(1e-9,Math.hypot(...v)));
export function createDandelionModel(){
  let seed=192731;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const mesh:number[]=[],fibers:number[]=[];let blades=0,trees=0;
  function tri(a:V3,b:V3,c:V3,color:V3,kind=0,sway=0,phase=0){
    const n=unit(cross(add(b,mul(a,-1)),add(c,mul(a,-1))));
    for(const p of [a,b,c])mesh.push(...p,...n,...color,kind,sway*Math.max(0,p[1]),phase);
  }
  function ellipsoid(p:V3,r:V3,col:V3,lat=7,lon=10,kind=0){
    const point=(i:number,j:number):V3=>[p[0]+r[0]*Math.sin(i/lat*Math.PI)*Math.cos(j/lon*Math.PI*2),p[1]+r[1]*Math.cos(i/lat*Math.PI),p[2]+r[2]*Math.sin(i/lat*Math.PI)*Math.sin(j/lon*Math.PI*2)];
    for(let i=0;i<lat;i++)for(let j=0;j<lon;j++){const c=mul(col,.85+rand()*.25);tri(point(i,j),point(i+1,j),point(i,j+1),c,kind);tri(point(i+1,j),point(i+1,j+1),point(i,j+1),c,kind);}
  }
  function tube(points:V3[],radius:number,color:V3,kind=0){
    const sides=9;
    for(let i=0;i<points.length-1;i++){
      const tangent=unit(add(points[i+1],mul(points[i],-1))),u=unit(cross(tangent,[0,0,1])),v=cross(tangent,u);
      const at=(p:V3,t:number,r:number)=>add(p,add(mul(u,Math.cos(t)*r),mul(v,Math.sin(t)*r)));
      for(let j=0;j<sides;j++){const t=j/sides*2*Math.PI,t2=(j+1)/sides*2*Math.PI,c=mul(color,.85+rand()*.3);
        tri(at(points[i],t,radius),at(points[i+1],t,radius*.98),at(points[i],t2,radius),c,kind,kind===1?.014:0);
        tri(at(points[i+1],t,radius*.98),at(points[i+1],t2,radius*.98),at(points[i],t2,radius),c,kind,kind===1?.014:0);
      }
    }
  }
  // A true ground plane and staggered grass, with empty space immediately around the flower.
  tri([-60,-.045,8],[60,-.045,8],[-60,-.045,-70],[.12,.20,.025]);
  tri([60,-.045,8],[60,-.045,-70],[-60,-.045,-70],[.12,.20,.025]);
  for(let i=0;i<8500;i++){
    const z=3-rand()*39,x=(rand()-.5)*(8+Math.abs(z)*2.0);
    if(Math.abs(x)<.55&&z>-.6)continue;
    const h=.12+rand()**2*.9,w=.008+rand()*.025,lean=(rand()-.5)*.4,theta=rand()*Math.PI*2,phase=rand()*6.28;
    const side:V3=[Math.cos(theta)*w,0,Math.sin(theta)*w],a:V3=[x,0,z],b:V3=[x+lean*.24,h*.52,z+lean*.15],tip:V3=[x+lean,h,z+lean*.4];
    const patch=.65+.35*Math.sin(x*1.1+z*.7);
    const col:V3=[(.09+rand()*.17)*patch,(.24+rand()*.29)*patch,.012+rand()*.022];
    const flexibility = 0.30 + 0.075 * Math.sin(phase);
    tri(add(a,side),add(a,mul(side,-1)),add(b,mul(side,-.58)),col,2,flexibility,phase);
    tri(add(a,side),add(b,mul(side,-.58)),add(b,mul(side,.58)),col,2,flexibility,phase);
    tri(add(b,mul(side,.58)),add(b,mul(side,-.58)),tip,mul(col,1.16),2,flexibility,phase);blades++;
  }
  // Distant, three-dimensional canopies create the dark green shapes seen through the bokeh.
  for(const [x,z,h,w] of [[-4.8,-17,9,2.5],[8,-24,11,3.3],[-17,-33,10,4],[21,-39,13,4.4]]){
    tube([[x,0,z],[x+.1,h*.78,z]],.24,[.05,.062,.025]);
    for(let i=0;i<14;i++)ellipsoid([x+(rand()-.5)*w*1.3,h*.54+rand()*h*.45,z+(rand()-.5)*w],[w*(.45+rand()*.45),h*.15+rand(),w*.6],[.018+rand()*.023,.05+rand()*.04,.012],6,9);trees++;
  }
  for(let i=0;i<20;i++)ellipsoid([(rand()-.5)*45,.4+rand()*.9,-13-rand()*22],[1+rand()*2,.5+rand(),1.5],[.06+rand()*.04,.15+rand()*.08,.012],5,8);
  // Occasional distant flowers produce depth-correct soft yellow/ivory accents.
  for(let i=0;i<45;i++){const x=(rand()-.5)*13,z=-2-rand()*20,h=.2+rand()*.4;ellipsoid([x,h,z],[.075,.045,.075],rand()<.7?[.72,.55,.045]:[.73,.74,.56],4,6);}
  ellipsoid([.88,.69,-1.8],[.12,.12,.12],[.72,.75,.53],7,10);
  ellipsoid([-1.06,.43,-3.2],[.11,.11,.11],[.78,.65,.07],7,10);
  const center=FLOWER_CENTER;
  const stalk:V3[]=[];for(let i=0;i<=30;i++){const y=i/30*1.66;stalk.push([-.035*Math.sin(i/30*1.57)+.04*Math.sin(i/30*3.1),y,.01*Math.sin(i/30*4)]);}
  tube(stalk,.012,[.27,.19,.035],1);
  ellipsoid(center,[.049,.046,.048],[.19,.13,.039],10,16,3);
  // Recurved sepals below the seed head.
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const s:V3=[Math.cos(a)*.035,1.615,Math.sin(a)*.035];tri(s,add(s,[.018,0,.016]),[Math.cos(a)*.065,1.55,Math.sin(a)*.065],[.13,.19,.035],3,.02);}
  function strand(a:V3,b:V3,width:number,color:V3,alpha:number,id:number,kind:number){fibers.push(...a,width,...b,kind,...color,alpha,id,rand()*6.28,0,0);}
  const seeds: SeedGeometry[] = [];
  const count=238;
  for(let i=0;i<count;i++){
    const y=1-2*(i+.5)/count,angle=i*2.39996323+(rand()-.5)*.31,n:V3=[Math.sqrt(1-y*y)*Math.cos(angle),y,Math.sqrt(1-y*y)*Math.sin(angle)];
    if(y<-.88&&rand()<.35)continue;
    const u=unit(cross(n,Math.abs(y)>.95?[1,0,0]:[0,1,0])),v=cross(n,u),length=.28+rand()*.13;
    const hub=add(center,mul(n,length)),start=add(center,mul(n,.067));
    const first = fibers.length / 16, id = seeds.length;
    strand(start,hub,.00075,[.52,.43,.23],.49,id,0);
    const hairs=30+Math.floor(rand()*13),r=.074+rand()*.05;
    for(let j=0;j<hairs;j++){
      const a=(j+rand()*.35)/hairs*Math.PI*2,radial=add(mul(u,Math.cos(a)),mul(v,Math.sin(a))),extent=r*(.7+rand()*.4);
      const c:V3=[.8+rand()*.12,.79+rand()*.13,.64+rand()*.2];
      const sideways=cross(n,radial),curl=(rand()-.5)*.034,drop=-.009+rand()*.036,alpha=.72+rand()*.24;
      let prev=hub;
      for(let k=1;k<=4;k++){
        const t=k/4;const next=add(hub,add(mul(radial,extent*t),add(mul(n,Math.sin(t*Math.PI)*.018+drop*t),mul(sideways,curl*t*t))));
        strand(prev,next,.00108*(1-.60*t),c,alpha,id,1);prev=next;
      }
    }
    seeds.push({hub, first, count: fibers.length / 16 - first});
  }
  const solid=new Float32Array(mesh),lines=new Float32Array(fibers);
  if(!solid.every(Number.isFinite)||!lines.every(Number.isFinite))throw Error('Dandelion generated non-finite geometry');
  return {solid,lines,seeds,counts:{triangles:solid.length/36,segments:lines.length/16,seeds:seeds.length,grass:blades,trees}};
}

export function cameraEye(yaw:number,pitch:number):V3 {
  return add(FLOWER_CENTER,[Math.sin(yaw)*3.65,.06+pitch,Math.cos(yaw)*3.65]);
}
// The resting head anchors the composition. Size the lens for the swept crown;
// the lower stem may leave the frame and gusts never move or zoom the camera.
const crownRadius=1.05;
const crownHeights=[FLOWER_CENTER[1]-.63,FLOWER_CENTER[1]+.48];
export function cameraUniform(eye:V3,time:number,focus:number,aperture:number,wind:number,width:number,height:number,aspect:number,tip:V3,rotation:Quaternion,grassBlend:number){
  const orbit=add(eye,mul(FLOWER_CENTER,-1));
  const f=unit(mul(orbit,-1)),right=unit(cross(f,[0,1,0])),up=cross(right,f);
  const distance=Math.hypot(orbit[0],orbit[2]), horizontalForward=Math.hypot(f[0],f[2]);
  let tangent=.40;
  for (const y of crownHeights) {
    const radius=crownRadius;
    const dy=y-eye[1], depth=distance*horizontalForward+dy*f[1];
    // Perspective silhouette of a horizontal disk, with 10% margin on either side.
    const horizontal=radius/Math.sqrt(depth*depth-(horizontalForward*radius)**2);
    tangent=Math.max(tangent,horizontal/(.80*aspect));
    for (const d of [distance-radius,distance+radius]) {
      const vertical=Math.abs(-f[1]*d+up[1]*dy)/(horizontalForward*d+f[1]*dy);
      tangent=Math.max(tangent,vertical/.82);
    }
  }
  return new Float32Array([...eye,focus,...right,aspect,...up,tangent,...f,.035,width,height,time,aperture,wind,0,1.13,90,-.6,.8,.7,1,...tip,grassBlend,...rotation]);
}
