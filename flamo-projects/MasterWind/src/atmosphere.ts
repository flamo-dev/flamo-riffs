import { pennant, ribbonLoad, ripple } from './cloth';
import { wind, ground, type Run } from './wind';


const tau = 2 * Math.PI;
function random(seed: number) {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

// Advect every airborne mark through the same velocity field sampled by the hero.
export function atmosphere(canvas: HTMLCanvasElement, seed:number, startTime=0) {
  const g = canvas.getContext('2d')!;
  const stalks = Array.from({length: 96}, (_, i) => {
    const x = i < 66 ? 240 + random(i) * 425 : 1300 + random(i) * 350;
    return { x, y: ground(x) + random(i + 101) * 10, h: 10 + random(i + 12) ** 2 * 41, seed: random(i + 30) };
  });
  function spawn(i:number,t:number,flyer?:Run) {
    const u=random(i+t+seed*.0001),v=random(i+t+73);
    const nearby=flyer && (flyer.mode==='glide'||flyer.mode==='jump') && i%3===1;
    const x=nearby?flyer.x+(u-.5)*500:617+u*295;
    const y=nearby?flyer.y-100+(v-.5)*210:759+v*130;
    return {x,y,age:0,ttl:2.2 + random(i + t + 5) * 2.4,scale:2 + random(i + 32) * 4,phase:random(i) * tau,trail:[] as {x:number,y:number}[]};
  }
  const leaves = Array.from({length:29}, (_,i) => spawn(i, 0));
  function drift(dt:number, t:number, flyer?:Run) {
    leaves.forEach((p,i) => {
      p.age += dt;
      if (p.age >= p.ttl || p.y < 50 || p.x > 1830 || p.x < 230 || p.y > 1090) { Object.assign(p,spawn(i,t,flyer)); return; }
      const air = wind(p.x,p.y,t,seed);
      p.x += (air.across * 1.42 + Math.sin(p.phase + p.age * 3) * 9) * dt;
      p.y += (24 - air.up * .72 + Math.cos(p.phase + p.age * 2) * 12) * dt;
      p.trail.push({x:p.x,y:p.y});
      if (p.trail.length > 25) p.trail.shift();
    });
  }
  for (let i = 0; i < 105; i++) drift(1/35, startTime+i/35-3);
  let accumulated = 0;
  function ribbon(x:number,y:number,t:number) {
    const air=wind(x,y,t,seed);
    const {strength,reach,lift}=ribbonLoad(air);
    g.strokeStyle='#584d3b'; g.lineWidth=5; g.beginPath(); g.moveTo(x-13,y+81);g.lineTo(x+1,y-13);g.stroke();
    g.strokeStyle='#c59b60';g.lineWidth=2;g.stroke();
    for (let part=0;part<2;part++) {
      const points: {x:number,y:number,w:number}[]=[];
      for(let i=0;i<=21;i++){
        const u=i/21,fall=(1-strength)*32;
        points.push({x:x+reach*u*(69+73*strength-part*19),y:y+u*(fall-22*lift+part*7)+ripple(u,t,air.curl,part*.8)*u*strength*(5+4*strength)+Math.sin(u*2.6)*12*(1-strength),w:(1-u*.82)*(part?3.3:5.7)});
      }
      // Offset across the cloth, even when its centreline hangs straight down.
      const edges=points.map((p,i)=>{
        const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];
        const scale=p.w/(Math.hypot(b.x-a.x,b.y-a.y)||1);
        return {x:(a.y-b.y)*scale,y:(b.x-a.x)*scale};
      });
      g.beginPath();points.forEach((p,i)=>{const e=edges[i];if(i)g.lineTo(p.x+e.x,p.y+e.y);else g.moveTo(p.x+e.x,p.y+e.y);});
      for(let i=points.length-1;i>=0;i--){const p=points[i],e=edges[i];g.lineTo(p.x-e.x,p.y-e.y);}
      g.closePath();g.fillStyle=part?'#a34032':'#b74a35';g.fill();
    }
  }
  return function draw(s: Run, dt:number) {
    accumulated += dt;
    while (accumulated>=1/35) {drift(1/35,s.time-accumulated,s);accumulated-=1/35;}
    g.clearRect(0,0,1920,1080);
    const t=s.time;
    for(const p of stalks) {
      const a=wind(p.x,p.y,t,seed),bend=p.h*(.10+a.across/210)+Math.sin(t*2.4+p.seed*6+a.curl)*3;
      const tipY=p.y-p.h*(.90-Math.abs(a.across)/930);
      g.strokeStyle=p.seed>.6?'#846e45aa':'#aa8b58b5';g.lineWidth=p.h/25;
      g.beginPath();g.moveTo(p.x,p.y);g.quadraticCurveTo(p.x+bend*.20,p.y-p.h*.6,p.x+bend,tipY);g.stroke();
      if(p.h>30){g.fillStyle='#c2a26ebd';g.beginPath();g.ellipse(p.x+bend-1,tipY+1,6.5,1.35,-.65,0,tau);g.fill();}
    }
    ribbon(pennant.x,pennant.y,t);
    for (const [i,p] of leaves.entries()) {
      const fade=Math.max(0,Math.min(1,p.age*2,(p.ttl-p.age)*1.6));
      if (i%3===0) {
        g.beginPath(); p.trail.forEach((q,j)=>{if(j)g.lineTo(q.x,q.y);else g.moveTo(q.x,q.y);});
        g.strokeStyle='rgba(255,250,230,'+fade*.63+')';g.lineWidth=2.4+(i%5);g.lineCap='round';g.stroke();
        g.lineWidth=1;g.strokeStyle='rgba(154,149,131,'+fade*.26+')';g.stroke();
      } else {
        g.save();g.translate(p.x,p.y);const flow=wind(p.x,p.y,t,seed);
        g.rotate(Math.atan2(-flow.up*.7,flow.across*1.42)+Math.sin(p.age*3+p.phase)*.6);
        g.scale(1,.28+Math.abs(Math.sin(p.phase+p.age*3.7))*.72);g.globalAlpha=fade;
        g.beginPath();g.moveTo(-p.scale,0);g.quadraticCurveTo(0,-p.scale*.95,p.scale*1.7,0);g.quadraticCurveTo(0,p.scale*.63,-p.scale,0);
        g.fillStyle=i%2?'#b48743':'#96804d';g.fill();g.restore();
      }
    }
    if(s.mode==='land' || s.mode==='returned'&&s.age<.85 || s.mode==='won'&&s.age<1){
      const age=s.mode==='won'?s.age+.85:s.age;
      for(let i=0;i<13;i++){const u=random(i+5);g.fillStyle='rgba(157,124,78,'+Math.max(0,1-age)*.62+')';g.beginPath();g.ellipse(s.x+(u-.5)*age*148,s.y- Math.sin(Math.min(1,age)*Math.PI)*(8+u*26),2+u*3,1.4,u,0,tau);g.fill();}
    }
  };
}
