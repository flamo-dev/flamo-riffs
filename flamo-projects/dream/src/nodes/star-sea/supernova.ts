import {random,TAU,type Point} from './model';
import type {Brushes,Ink} from './world';
export interface Ejecta {angle:number;reach:number;width:number;bend:number;phase:number;energy:number}
export interface Nova {seed:number;life:number;size:number;clouds:Ejecta[];jets:Ejecta[];dust:Ejecta[]}
export function createNova(seed:number):Nova {
 const r=random(seed);const sample=():Ejecta=>({angle:r()*TAU,reach:.25+r()*1.25,width:.4+r()*1.5,bend:(r()-.5)*1.8,phase:r()*TAU,energy:.35+r()*.65});
 return {seed,life:4.8+r()*3,size:.75+r()*.8,clouds:Array.from({length:7+Math.floor(r()*12)},sample),jets:Array.from({length:4+Math.floor(r()*10)},sample),dust:Array.from({length:24+Math.floor(r()*49)},sample)};
}
export function novaEnvelope(age:number,life:number){const u=Math.max(0,age)/life,fade=Math.pow(Math.max(0,1-u),2);return {core:Math.exp(-age*12),cloud:(1-Math.exp(-age*7))*fade,jets:(1-Math.exp(-age*10))*fade,dust:(1-Math.exp(-age*3))*fade,expansion:1-Math.exp(-age*1.15)};}
export function drawNova(b:Point&{age:number;depth:number;scale:number;nova:Nova},color:Ink,brush:Brushes){
 const n=b.nova,e=novaEnvelope(b.age,n.life),s=b.scale*(.42+.58*b.depth)*n.size,soft=1+(1-b.depth)*3;
 const pos=(a:number,r:number):Point=>({x:b.x+Math.cos(a)*r*s,y:b.y+Math.sin(a)*r*s});
 // Brightness-only tuning: retain seeded geometry, palette and fade timing.
 // Irregular drifting density clumps. Offsets and radii never form an equal-angle ring.
 for(const c of n.clouds){const p=pos(c.angle+c.bend*e.expansion*.28,38*c.reach*e.expansion),radius=(3+c.width*8)*( .3+.7*e.expansion)*s*soft;
  for(let k=3;k>=1;k--)brush.dot(p.x,p.y,radius*k*.65,color,e.cloud*c.energy*.11/k);
  for(let j=0;j<3;j++){const q=pos(c.angle+c.bend*(j+1)*.13, (12+16*j)*c.reach*e.expansion);brush.dot(q.x,q.y,radius*.28,color,e.cloud*c.energy*.20);}
 }
 // Unequal curved filaments with individual lengths, widths and expansion rates.
 for(const jet of n.jets){let prev:Point|undefined;for(let j=0;j<=12;j++){const u=j/12,a=jet.angle+jet.bend*u*u*.7+Math.sin(u*4+jet.phase)*.06*e.expansion,p=pos(a,(4+u*(28+jet.reach*70))*e.expansion);
  if(prev){const alpha=e.jets*jet.energy*(1-u)*.8;brush.line(prev,p,(4+soft*2)*jet.width*s,color,alpha*.17);brush.line(prev,p,(1+soft*.6)*s,color,alpha*.42);brush.line(prev,p,.65*s,[.93,.95,1],alpha*.95);}prev=p;
 }}
 for(const d of n.dust){const p=pos(d.angle+d.bend*e.expansion*.15,(3+b.age*(6+d.reach*17)));const a=e.dust*d.energy;brush.dot(p.x,p.y,(2+soft)*d.width*s,color,a*.12);brush.dot(p.x,p.y,.65*d.width*s,color,a*1.0);}
 // Brief bounded white-hot contact core, not a persistent overexposed disc.
 for(const [radius,alpha] of [[18,.09],[8,.28],[2.8,1]] as const)brush.dot(b.x,b.y,radius*s*soft,[.96,.91,1],e.core*alpha);
}
