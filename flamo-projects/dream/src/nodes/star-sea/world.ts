import {pearl,starlight,shimmer,random,TAU,type Point} from './model';
export type Ink=[number,number,number];
export interface View {width:number;height:number;center:Point;zoom:number}
type Body={x:number;y:number;r:number;phase:number;speed:number;angle:number;kind:number;hue:number;count:number};
export interface Brushes {dot(x:number,y:number,r:number,c:Ink,a:number):void;line(a:Point,b:Point,w:number,c:Ink,alpha:number):void}
// Absolute source-cell identity, including the transport stream and LOD. No tiling/modulo.
const hash=(seed:number,key:string)=>{let h=seed>>>0;for(let i=0;i<key.length;i++){h=Math.imul(h^key.charCodeAt(i),16777619);}h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;return h>>>0;};
export const DREAM_TRANSPORT = {streams:2, base:.0045, layerStep:.0015, streamStep:.003, sway:.012, vertical:.009, maxFrequency:.07} as const;
export const driftRate=(layer:number,stream:number,seed:number)=>DREAM_TRANSPORT.base+layer*DREAM_TRANSPORT.layerStep+stream*DREAM_TRANSPORT.streamStep+random(hash(seed,`velocity/${layer}/${stream}`))()*.0015;
// At fixed camera/zoom, centre dx/dt >= step * (.0045 - .012*.07) > 0.
// Each body's random phase/frequency changes its instantaneous speed independently.
export function bodySway(t:number,phase:number,speed:number){
 return {x:Math.sin(t*speed+phase)*DREAM_TRANSPORT.sway,
  y:Math.cos((t*speed+phase)*.73)*DREAM_TRANSPORT.vertical};
}
export interface StarTarget {id:string;depth:number;radius:number;sample(time:number):Point}
export class DreamWorld {
 readonly targets:StarTarget[]=[];
 seed:number;private cells=new Map<string,Body[]>();
 constructor(seed:number){this.seed=seed;}
 reset(seed:number){this.seed=seed;this.cells.clear();this.targets.length=0;}
 render(v:View,t:number,b:Brushes){
  this.targets.length=0;const used=new Set<string>();let groups=0,stars=0,nebulae=0,created=0,released=0;
  for(let layer=0;layer<3;layer++){
   const depth=[.24,.55,1][layer],z=Math.pow(v.zoom,.5+layer*.22),detail=Math.log2(z),base=Math.floor(detail),blend=detail-base;
   for(let pass=0;pass<2;pass++){
    const lod=base+pass,alpha=pass?blend:1-blend;if(alpha<.001)continue;
    const unit=480/2**lod,step=unit*z,cx=v.center.x*depth,cy=v.center.y*depth;
    // Largest fog footprint: 63 * 3.4 * step/480. Include breathing and sway.
    const margin=63*3.4*1.06*step/480+step*DREAM_TRANSPORT.sway+24;
    for(let stream=0;stream<DREAM_TRANSPORT.streams;stream++){
    // Query the upstream source lattice, not the old unadvected viewport.
    // Subtract transport before multiplying by step to retain local precision.
    const sourceX=cx/unit-t*driftRate(layer,stream,this.seed),sourceY=cy/unit;
    const minX=Math.floor(sourceX-(v.width/2+margin)/step),maxX=Math.floor(sourceX+(v.width/2+margin)/step);
    const minY=Math.floor(sourceY-(v.height/2+margin)/step),maxY=Math.floor(sourceY+(v.height/2+margin)/step);
    for(let iy=minY;iy<=maxY;iy++)for(let ix=minX;ix<=maxX;ix++){
     const key=`${layer}/${lod}/${stream}/${ix}/${iy}`;used.add(key);let bodies=this.cells.get(key);
     if(!bodies){const r=random(hash(this.seed,key));bodies=Array.from({length:5+Math.floor(r()*6)},(_,i)=>({x:r(),y:r(),r:8+r()*55,phase:r()*TAU,speed:.025+r()*.045,angle:r()*TAU,kind:i<1?Math.floor(r()*6):-1,hue:r(),count:14+Math.floor(r()*10)}));this.cells.set(key,bodies);created++;}
     for(let oi=0;oi<bodies.length;oi++){const o=bodies[oi];
      const phase=t*o.speed+o.phase,sway=bodySway(t,o.phase,o.speed);
      const x=(ix-sourceX+o.x+sway.x)*step+v.width/2;
      const y=(iy-sourceY+o.y+sway.y)*step+v.height/2;
      const radius=o.r*step/480*(1+.06*Math.sin(phase));
      const extent=(o.kind<0?3*step/480:radius*3.4)+24;
      if(x< -extent||y< -extent||x>v.width+extent||y>v.height+extent)continue;
      const c=pearl(o.hue);
      // Focus is continuous through zoom and LOD handover, not alpha-only depth.
      const focus=Math.max(0,Math.min(1,(layer+Math.log2(v.zoom)*.22)/2));
      const blur=1+(1-focus)*5;
      const core:Ink=starlight(o.hue);
      const a=alpha*[.40,.65,.95][layer]*shimmer(t,o.phase);
      if(o.kind<0){stars++;
       if(alpha>.55&&x>30&&x<v.width-30&&y>85&&y<v.height-125&&this.targets.length<512){
        const sx=ix-cx/unit+o.x,sy=iy-cy/unit+o.y,rate=driftRate(layer,stream,this.seed);
        this.targets.push({id:`${key}/${oi}`,depth,radius:(.6+o.hue*1.15)*step/480/v.zoom,sample(time){const sw=bodySway(time,o.phase,o.speed);return {x:v.center.x+(sx+time*rate+sw.x)*step/v.zoom,y:v.center.y+(sy+sw.y)*step/v.zoom};}});
       }
       const r=(.6+o.hue*1.15)*(step/480);
       b.dot(x,y,r*(2+blur),c,a*.09);b.dot(x,y,r*(1+blur*.4),c,a*.18);
       b.dot(x,y,r,core,a*(.12+.88*focus));continue;}
      groups++;const angle=o.angle+t*o.speed*.12,co=Math.cos(angle),si=Math.sin(angle);
      const project=(px:number,py:number)=>({x:x+(px*co-py*si)*radius,y:y+(px*si+py*co)*radius});
      nebulae++; // Broad layered contour glow below, not concentric fog discs.
      let previous:Point|undefined;
      for(let j=0;j<o.count;j++){
       const q=j/(o.count-1),u=q*TAU;let px=0,py=0;
       switch(o.kind){
        case 0:px=Math.cos(u*1.4)*q*1.8;py=Math.sin(u*1.4)*q;break;
        case 1:px=(q-.5)*3;py=Math.sin(q*5+phase)*.5;break;
        case 2:px=Math.cos(u)*(1+.5*Math.cos(u*3));py=Math.sin(u)*(.4+q);break;
        case 5:px=(q-.5)*3;py=Math.sin(u)*(0.35+0.55*Math.sin(q*Math.PI));break;
        case 3:px=Math.cos(u*.65)*1.7;py=Math.sin(u*.65)*.6;break;
        default:px=Math.sin(j*12.989+o.phase)*Math.sqrt(q);py=Math.cos(j*7.13+o.phase)*Math.sqrt(q);
       }
       py+=Math.sin(q*7+phase)*.09;const p=project(px,py);const flicker=shimmer(t,o.phase+j*1.73);
       if(previous&&o.kind!==4){
        b.line(previous,p,blur*3.6,c,a*.045);
        b.line(previous,p,blur*2.1,c,a*.085);
        b.line(previous,p,blur,c,a*.18);
        b.line(previous,p,.8+blur*.20,j%9===0?c:core,a*(.055+.9*focus));
       }
       b.dot(p.x,p.y,blur*2,c,a*.075);
       b.dot(p.x,p.y,blur*.85,c,a*.16);
       b.dot(p.x,p.y,1.45,j%4===0?c:core,a*flicker*(.08+.92*focus));previous=p;
      }
     }
    }
   }
  }
  }
  for(const key of this.cells.keys())if(!used.has(key)){this.cells.delete(key);released++;}
  return {seed:this.seed,partitions:this.cells.size,groups,stars,nebulae,created,released};
 }
}
