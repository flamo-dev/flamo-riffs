// Geometry is authored in metres. Y is vertical, X follows the potline.
import { piece, type Family, type Piece } from './parts';
export type V = [number, number, number];
export type P = [number, number];
export const add = (a: V,b: V): V => [a[0]+b[0],a[1]+b[1],a[2]+b[2]];
export const sub = (a: V,b: V): V => [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
export const mul = (a: V,s: number): V => [a[0]*s,a[1]*s,a[2]*s];
export const dot = (a: V,b: V) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const cross = (a: V,b: V): V => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const unit = (a: V): V => mul(a,1/(Math.hypot(...a)||1));
export const mix = (a: V,b: V,t: number): V => add(a,mul(sub(b,a),t));
export interface Finish { name: string; color: V; rough: number; metal: number; texture: number }
const finish=(name:string,hex:number,rough:number,metal:number,texture=0):Finish=>({name,color:[(hex>>16)/255,((hex>>8)&255)/255,(hex&255)/255],rough,metal,texture});
export const finishes = {
  insulation:finish('Pale aluminosilicate insulating brick',0xc69e70,.92,.01,6),
  graphite:finish('Baked cathode carbon',0x3c4245,.78,.14,6),
  anode:finish('Porous prebaked anode carbon',0x53504e,.88,.07,6),
  castIron:finish('Cast-iron thimble',0x62534a,.69,.57,1),
  alumina:finish('Granular alumina',0xe7ded0,.94,.015,6),
  firebrick:finish('Refractory joint',0x9d8366,.91,.03,6),
  bath:finish('Molten cryolite bath',0xc05b26,.35,.14,7),
  aluminium:finish('Liquid aluminium',0xbbcbd1,.19,.95,8),
  ledge:finish('Frozen bath ledge',0xaf8b69,.83,.11,6),
  shell:finish('Heat-aged pot shell',0x42484a,.74,.54,1),
  frame:finish('Graphite enamel',0x3d494e,.43,.48,1),
  ribs:finish('Worn structural edge',0x52616a,.47,.57,1),
  dark:finish('Oiled steel',0x272c30,.51,.69,1),
  black:finish('Hose and electrical insulation',0x25282a,.79,.04),
  gasket:finish('Graphite gasket',0x171b1c,.93,.12),
  hood:finish('Rolled aluminium cover',0x9da3a4,.30,.9,2),
  trim:finish('Bright folded aluminium',0xcbd0cd,.26,.94,3),
  al:finish('Cast aluminium',0xa9adae,.40,.84,3),
  stem:finish('Oxidised anode stem',0xaaa9a0,.53,.75,3),
  foil:finish('Aluminium current strap',0xbbbfc1,.27,.94,4),
  joint:finish('Graphite at plate joints',0x605e56,.5,.75,3),
  zinc:finish('Zinc fastener',0x9a9e98,.34,.89,3),
  ochre:finish('Safety yellow enamel',0xe6ac28,.44,.36,5),
  duct:finish('Heat-tinted flue',0x5c5a53,.63,.62,1),
  rust:finish('Oxidised flange',0x8c684a,.66,.55,1),
  green:finish('Faded green rail enamel',0x45665b,.56,.49,5),
  red:finish('Stamped oxide red',0x854b3e,.78,.13),
  chalk:finish('Stencil white',0xe2e3d9,.65,.1),
  lamp:finish('Amber indicator lens',0xd85e24,.26,.24),
};
export type Mat = keyof typeof finishes;
export interface Batch { part: string; piece: Piece; mat: Mat; pos: number[]; normal: number[]; tint: number[]; index: number[] }
export class Shop {
  batches=new Map<string,Batch>();
  current=piece('shell');
  select(key:Family, suffix='', spread:V=[0,0,0]) { this.current=piece(key,suffix,spread); }
  private seed=42211;
  rand(){this.seed=(Math.imul(1664525,this.seed)+1013904223)>>>0;return this.seed/4294967296;}
  batch(m:Mat){const key=this.current.name+'|'+m;let b=this.batches.get(key);if(!b){b={part:this.current.name,piece:this.current,mat:m,pos:[],normal:[],tint:[],index:[]};this.batches.set(key,b);}return b;}
  face(m:Mat,p:V[],normal:V,tone=1,ns?:V[]){
    const b=this.batch(m),base=b.pos.length/3;
    const flip=dot(cross(sub(p[1],p[0]),sub(p[2],p[0])),normal)<0;
    p.forEach((pt,i)=>{b.pos.push(...pt);b.normal.push(...(ns?ns[i]:normal));b.tint.push(tone);});
    for(let i=1;i<p.length-1;i++){if(flip)b.index.push(base,base+i+1,base+i);else b.index.push(base,base+i,base+i+1);}
  }
  // Truncated edges catch narrow highlights even on broad, nearly flat steel.
  box(c:V,size:V,m:Mat,bevel=.012,tone=1){
    const h=mul(size,.5),r=Math.min(bevel,...h.map(k=>k*.55)),k:V=[h[0]-r,h[1]-r,h[2]-r],sign=[-1,1];
    const pt=(v:V)=>add(c,v);
    for(let i=0;i<3;i++){const j=(i+1)%3,l=(i+2)%3;for(const s of sign){const n:V=[0,0,0];n[i]=s;
      this.face(m,[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>{const v:V=[0,0,0];v[i]=s*h[i];v[j]=a*k[j];v[l]=b*k[l];return pt(v);}),n,tone);
    }}
    if(r<=0)return;
    for(let i=0;i<3;i++){const j=(i+1)%3,l=(i+2)%3;for(const a of sign)for(const b of sign){
      const point=(s:number,w:number)=>{const v:V=[0,0,0];v[i]=s*k[i];v[j]=a*(w?h[j]:k[j]);v[l]=b*(w?k[l]:h[l]);return pt(v);};
      const n:V=[0,0,0];n[j]=a;n[l]=b;this.face(m,[point(-1,0),point(1,0),point(1,1),point(-1,1)],unit(n),tone);
    }}
    for(const a of sign)for(const b of sign)for(const d of sign){const n:V=[a,b,d];const start:V=[a*k[0],b*k[1],d*k[2]];
      this.face(m,[0,1,2].map(i=>{const v:V=[...start];v[i]+=n[i]*r;return pt(v);}),unit(n),tone);}
  }
  pipe(path:V[],r:number,m:Mat,sides=12,tone=1,flat=false){
    if(path.length<2)return;
    const first=unit(sub(path[1],path[0]));
    let axis=unit(cross(first,Math.abs(first[1])<.85?[0,1,0]:[1,0,0]));
    const rings:V[][]=[],ns:V[][]=[];
    path.forEach((p,i)=>{const tangent=unit(sub(path[Math.min(i+1,path.length-1)],path[Math.max(i-1,0)]));
      axis=unit(sub(axis,mul(tangent,dot(axis,tangent))));const v=unit(cross(tangent,axis));
      const normals=Array.from({length:sides},(_,j)=>{const a=j*Math.PI*2/sides;return add(mul(axis,Math.cos(a)),mul(v,Math.sin(a)));});
      ns.push(normals);rings.push(normals.map(n=>add(p,mul(n,r))));
    });
    for(let i=1;i<rings.length;i++)for(let j=0;j<sides;j++){const k=(j+1)%sides,n=[ns[i-1][j],ns[i-1][k],ns[i][k],ns[i][j]],mid=unit(add(n[0],n[1]));
      this.face(m,[rings[i-1][j],rings[i-1][k],rings[i][k],rings[i][j]],mid,tone,flat?undefined:n);}
    this.face(m,rings[0],mul(first,-1),tone);this.face(m,rings[rings.length-1],unit(sub(path[path.length-1],path[path.length-2])),tone);
  }
  beam(a:V,b:V,w:number,h:number,m:Mat,tone=1){
    const d=unit(sub(b,a)),u=unit(cross(d,Math.abs(d[0])<.9?[1,0,0]:[0,0,1])),v=unit(cross(d,u));
    const corners=(p:V)=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>add(p,add(mul(u,i*h/2),mul(v,j*w/2))));
    const lo=corners(a),hi=corners(b);this.face(m,lo,mul(d,-1),tone);this.face(m,hi,d,tone);
    for(let i=0;i<4;i++){const j=(i+1)%4;this.face(m,[lo[i],lo[j],hi[j],hi[i]],unit(sub(mix(lo[i],lo[j],.5),a)),tone);}
  }
  // Extrude a closed convex or monotone profile; cap triangulation also handles a concave outline.
  profile(x:number,width:number,yz:P[],m:Mat,tone=1){
    const area=yz.reduce((s,p,i)=>{const q=yz[(i+1)%yz.length];return s+p[0]*q[1]-p[1]*q[0];},0);
    const shape=area>=0?yz:[...yz].reverse(),n=shape.length;
    const ring=(d:number):V[]=>shape.map(([y,z])=>[x+d,y,z]);const a=ring(-width/2),b=ring(width/2);
    for(let i=0;i<n;i++){const j=(i+1)%n,p=shape[i],q=shape[j];
      this.face(m,[a[i],a[j],b[j],b[i]],unit([0,q[1]-p[1],p[0]-q[0]]),tone);}
    // The section ends are triangulated with ear clipping, including bent plate stacks.
    const ids=Array.from({length:n},(_,i)=>i);const side=(p:P,q:P,r:P)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
    while(ids.length>2){let ear=-1;
      for(let i=0;i<ids.length;i++){const l=ids[(i+ids.length-1)%ids.length],k=ids[i],r=ids[(i+1)%ids.length];
        if(side(shape[l],shape[k],shape[r])<1e-10)continue;
        if(ids.some(t=>t!==l&&t!==k&&t!==r&&side(shape[l],shape[k],shape[t])>1e-9&&side(shape[k],shape[r],shape[t])>1e-9&&side(shape[r],shape[l],shape[t])>1e-9))continue;
        this.face(m,[a[l],a[k],a[r]],[-1,0,0],tone);this.face(m,[b[l],b[k],b[r]],[1,0,0],tone);ear=i;break;
      }if(ear<0)break;ids.splice(ear,1);}
  }
}
