export const WIDTH = 1600;
export const HEIGHT = 1000;
export const SEED = 10012026;
export const TAU = Math.PI * 2;
export type Point = {x:number;y:number};
export type Star = Point & {r:number;depth:number;phase:number;blue:number};
export type Strand = {points:Point[];alpha:number;hue:number};
export const clamp = (n:number,a=0,b=1) => Math.max(a,Math.min(b,n));
export function random(seed=SEED) { let v=seed>>>0; return () => {v+=0x6D2B79F5;let t=Math.imul(v^v>>>15,1|v);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;}; }
export function createStars(count=1200):Star[] {const rand=random();return Array.from({length:count},()=>({x:rand()*WIDTH,y:rand()*HEIGHT,r:.35+Math.pow(rand(),5)*2.05,depth:.2+rand()*.8,phase:rand()*TAU,blue:rand()}));}
export function starPosition(s:Star,t:number,pointer:Point):Point {return {x:((s.x+t*(.32+s.depth*.65)+Math.sin(t*.08+s.phase)*3)%(WIDTH+20))-10+(pointer.x-800)*s.depth*.016,y:s.y+Math.sin(t*.045+s.phase)*4+(pointer.y-500)*s.depth*.012};}

// A transparent body, two long asymmetric wings and five streaming tail ribbons.
// Every strand is sampled continuously; no node creation is needed during flight.
export function fishGeometry(t:number,variant=0):Strand[] {
 const rows:Strand[]=[];const flutter=Math.sin(t*.55+variant*1.7);
 for(let side of [-1,1]) {
  for(let rib=0;rib<13;rib++) {
   const u=rib/12;const pts:Point[]=[];
   const rootX=-70+u*155;
   for(let j=0;j<=16;j++) {const q=j/16;const reach=Math.sin(Math.PI*(.12+u*.78));
    pts.push({x:rootX-q*(80+u*60)+Math.sin(q*Math.PI)*50,y:side*(18*Math.sin(u*Math.PI)+q*(155+reach*88)*(side<0?1:.76)*(1+flutter*.13))+Math.sin(q*4-t*.65+u*2)*q*13});}
   rows.push({points:pts,alpha:.13+(1-u)*.13,hue:(side<0?0:.4)+u*.38});
  }
  for(let ring=1;ring<=7;ring++) {const pts:Point[]=[];const q=ring/7;
   for(let rib=0;rib<=30;rib++){const u=rib/30;const rootX=-70+u*155;const reach=Math.sin(Math.PI*(.12+u*.78));pts.push({x:rootX-q*(80+u*60)+Math.sin(q*Math.PI)*50,y:side*(18*Math.sin(u*Math.PI)+q*(155+reach*88)*(side<0?1:.76)*(1+flutter*.13))+Math.sin(q*4-t*.65+u*2)*q*13});}
   rows.push({points:pts,alpha:.06+q*.08,hue:.17+q*.5});
  }
 }
 for(let side of [-1,1]){const pts:Point[]=[];for(let i=0;i<=48;i++){const u=i/48;pts.push({x:-146+u*330,y:side*Math.pow(Math.sin(Math.PI*u),.85)*38+Math.sin(u*5-t*.7)*6});}rows.push({points:pts,alpha:.6,hue:side<0?.02:.67});}
 for(let k=0;k<5;k++){const pts:Point[]=[];for(let i=0;i<=56;i++){const q=i/56;pts.push({x:-140-q*(245+k*24),y:Math.sin(q*4-t*.55+k*.18)*q*(46+k*12)+(k-2)*q*12});}rows.push({points:pts,alpha:.15+k*.018,hue:.45+k*.08});}
 return rows;
}
export function fishPose(t:number,index:number,pointer:Point):{x:number;y:number;scale:number;angle:number} {
 const bases=[{x:1050,y:440,scale:1.12,angle:-.16},{x:480,y:710,scale:.43,angle:.25}];const b=bases[index];
 const dx=pointer.x-b.x,dy=pointer.y-b.y;const attraction=.055*Math.exp(-(dx*dx+dy*dy)/260000);
 return {x:b.x+t*4+Math.sin(t*.06+index*3)*24,y:b.y+Math.sin(t*.13+index)*26+dy*attraction,scale:b.scale,angle:b.angle+Math.sin(t*.1+index)*.06};
}
export function transformPoint(p:Point,pose:{x:number;y:number;scale:number;angle:number}):Point {const c=Math.cos(pose.angle)*pose.scale,s=Math.sin(pose.angle)*pose.scale;return{x:pose.x+p.x*c-p.y*s,y:pose.y+p.x*s+p.y*c};}
export function orbitGeometry(t:number):Strand[] {const rows:Strand[]=[];for(let k=0;k<4;k++){const points:Point[]=[];for(let j=0;j<=100;j++){const a=j/100*TAU;points.push({x:382+t*3+Math.cos(a)*(125+Math.cos(a*3+t*.12)*18),y:324+Math.sin(a)*67+Math.sin(a*2+t*.18+k*.7)*32+(k-1.5)*9});}rows.push({points,alpha:.2,hue:.85});}return rows;}

// Saturated luminous palette, interpolated without a shared white floor.
export function spectral(h:number):[number,number,number]{
 const p=[[.12,.64,1],[.12,1,.72],[.26,.28,1],[.64,.22,1],[1,.20,.55],[1,.40,.20],[1,.78,.22]];
 const u=((h%1)+1)%1*p.length,i=Math.floor(u),q=u-i,a=p[i],b=p[(i+1)%p.length];
 return [a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q,a[2]+(b[2]-a[2])*q];
}

// Silver star temperatures only; collision palettes remain separate.
export function starlight(h:number):[number,number,number]{return [.91+.06*Math.sin(h*TAU)**2,.92+.06*Math.cos(h*TAU)**2,1];}
export function shimmer(t:number,phase:number){return .56+.28*Math.sin(t*.39+phase)+.12*Math.sin(t*.71+phase*2.31);}

// One coherent pearl temperature per object; never a rainbow across its skeleton.
export function pearl(h:number):[number,number,number]{return h<.5?[.32,.80+.12*h,1]:[.89+.1*(h-.5),1,.40+.20*(h-.5)];}
