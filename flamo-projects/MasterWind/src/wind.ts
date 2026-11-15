// Screen coordinates are in the 1920 × 1080 painting. Updraft velocity is positive upwards.
export const edge = 672, shore = 1292;
export const ground = (x: number) => x < shore ? 751 - x * .037 : 551 - (x - shore) * .15;
export const clamp = (v:number, lo=0, hi=1) => Math.max(lo,Math.min(hi,v));
export function smooth(lo:number, hi:number, v:number) {
  const u=clamp((v-lo)/(hi-lo)); return u*u*(3-2*u);
}
function hash(key:number, seed:number) {
  let n=Math.imul(key^seed,0x45d9f3b); n=Math.imul(n^(n>>>16),0x45d9f3b);
  return ((n^(n>>>16))>>>0)/4294967296;
}
export function noise(v:number, seed:number) {
  const a=Math.floor(v);const t=smooth(0,1,v-a);
  return hash(a,seed)*(1-t)+hash(a+1,seed)*t;
}
// Each knot has its own bearing and speed. Interpolating vector components also
// allows opposing gusts to cancel while a front passes through the gorge.
function gust(knot:number,seed:number){
  const angle=2*Math.PI*hash(knot,seed+163);
  const speed=.32+.83*hash(knot,seed+257);
  return {x:Math.cos(angle)*speed,y:Math.sin(angle)*speed};
}
export function wind(x:number,y:number,t:number,seed:number){
  const dx=x-edge,dy=y-690;
  const travel=t+dx*.00115-dy*.00085;
  const phase=travel*.61+1.04*noise(travel*.27,seed+83)+hash(0,seed+71)*47;
  const index=Math.floor(phase),u=smooth(0,1,phase-index);
  const a=gust(index,seed),b=gust(index+1,seed);
  const side=a.x+(b.x-a.x)*u,rise=a.y+(b.y-a.y)*u;
  const swirl=noise(t*.76+dx*.0037-dy*.0022,seed+11)-.5;
  const eddy=noise(t*1.06-dx*.0028+dy*.0034,seed+31)-.5;
  const strength=smooth(.13,.65,noise(travel*.57+dx*.0004,seed+373));
  const exposure=smooth(edge-330,edge-65,x)*(1-smooth(shore+15,shore+255,x));
  const center=704-dx*.33+91*swirl;
  const height=(y-center)/390;
  const column=Math.exp(-height*height)*exposure;
  const vertical=(175+rise*577)*column+rise*74+42*eddy;
  return {
    across:strength*(83+side*414+50*swirl)*(.38+.62*exposure)+12*eddy,
    up:strength*(vertical>0?vertical*smooth(100,275,y):vertical)+11*swirl,
    curl:swirl*1.6+eddy*.8,
  };
}
export function newRun(seed=Math.floor(Math.random()*0x7fffffff)) {
  return {mode:'wait',seed,x:edge-14,y:ground(edge-14),vx:0,vy:0,ax:0,ay:0,
    age:0,time:0,grip:0,pressure:0,load:0,pitch:0,pitchRate:0,landSpeed:0,beaconLitAt:-1};
}
export type Run=ReturnType<typeof newRun>;
function enter(s:Run,mode:string){s.mode=mode;s.age=0;}
export function act(s:Run) {
  if(s.mode==='won'||s.mode==='lost'||s.mode==='returned'){
    const time=s.time;Object.assign(s,newRun(),{time});return;
  }
  if(s.mode==='wait'){
    const air=wind(s.x,s.y-55,s.time,s.seed);
    enter(s,'jump');s.vx=84+air.across*.50;s.vy=-287-clamp(air.up*.10,-26,52);
  }
  else if(s.mode==='jump')enter(s,'glide');
}
export function step(s:Run,dt:number){
  s.time+=dt;s.age+=dt;
  if(s.mode!=='jump'&&s.mode!=='glide')return;
  const air=wind(s.x,s.y-55,s.time,s.seed);
  const oldVx=s.vx,oldVy=s.vy;
  if(s.mode==='glide'){
    // Fingers pull first. Air can fill only the span already held under tension.
    s.grip=smooth(.04,.73,s.age);
    const breeze=Math.hypot(air.across-s.vx,air.up+s.vy);
    const fill=smooth(.34,.97,s.grip)*clamp(.27+breeze/455,.13,1);
    s.pressure+=(fill-s.pressure)*(1-Math.exp(-dt*(fill>s.pressure?2.85:1.9)));
    s.load+=(s.pressure*s.grip-s.load)*(1-Math.exp(-dt*3.15));
    const approach=smooth(shore,shore+230,s.x);
    const forward=(76+air.across*(.92+.24*s.load))*(1-.72*approach);
    s.vx+=(forward-s.vx)*(1-Math.exp(-dt*(1.55+.90*s.grip)));
    const sink=191-103*s.grip+smooth(shore,shore+260,s.x)*68;
    const desiredVy=sink-air.up*(.28*s.grip+1.24*s.load);
    s.vy+=(desiredVy-s.vy)*(1-Math.exp(-dt*(1.18+s.load*1.4)));
  }else{
    s.vx+=(air.across*.77+25-s.vx)*(1-Math.exp(-dt*1.6));
    s.vy+=(565-air.up*.38)*dt;
  }
  s.ax=(s.vx-oldVx)/dt;s.ay=(s.vy-oldVy)/dt;
  const target=clamp(s.vy*.048+air.curl*4,-18,19);
  s.pitchRate+=(34*(target-s.pitch)-9*s.pitchRate)*dt;s.pitch+=s.pitchRate*dt;
  const px=s.x,py=s.y;s.x+=s.vx*dt;s.y+=s.vy*dt;
  if(s.x<=edge){
    if(px>edge && s.y>ground(edge)+5){s.x=edge+3;enter(s,'lost');return;}
    if(s.vy>=0 && py<=ground(Math.min(px,edge))+5 && s.y>=ground(s.x)){
      s.y=ground(s.x);s.landSpeed=s.vy;s.vx=0;s.vy=0;s.ax=0;s.ay=0;enter(s,'returned');return;
    }
  }
  if(px<shore&&s.x>=shore&&s.y>ground(shore)+5){s.x=shore-10;enter(s,'lost');return;}
  if(s.x>=shore&&py<=ground(Math.max(shore,px))+5&&s.y>=ground(s.x)){
    s.landSpeed=s.vy;s.y=ground(s.x);s.beaconLitAt=s.time;enter(s,'land');return;
  }
  if(s.y>1130)enter(s,'lost');
}
export function settle(s:Run,dt:number) {
  if(s.mode!=='land')return;
  s.vx*=Math.exp(-dt*6);s.x+=s.vx*dt;s.y=ground(s.x);
  if(s.age>.85)enter(s,'won');
}
