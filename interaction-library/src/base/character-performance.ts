export type PerformancePose = Record<string,number>;
export function ambientCharacterState(timeMs:number,blinkIntervalMs=5700):{breath:number;blink:boolean} {
  if(!Number.isFinite(timeMs)||!Number.isFinite(blinkIntervalMs)||blinkIntervalMs<1000)throw Error('Invalid idle clock');
  const phase=((timeMs%blinkIntervalMs)+blinkIntervalMs)%blinkIntervalMs;
  return {breath:Math.sin(timeMs*.0016),blink:phase>blinkIntervalMs-180};
}
export interface PerformanceClip { durationMs: number; priority: number; sample(progress:number): PerformancePose }
const ease=(v:number)=>{const u=Math.max(0,Math.min(1,v));return u*u*(3-2*u);};
function blend(a:PerformancePose,b:PerformancePose,u:number):PerformancePose {
  return Object.fromEntries([...new Set([...Object.keys(a),...Object.keys(b)])].map(k=>[k,(a[k]??0)*(1-u)+(b[k]??0)*u]));
}
/** Instance-local policy. The caller supplies a narrative or ambient clock in milliseconds. */
export class CharacterPerformance {
  private active?: {id:string;start:number;from:PerformancePose};
  private last:PerformancePose={};
  constructor(private clips:Record<string,PerformanceClip>,private transitionMs=180) {
    if (!Number.isFinite(transitionMs)||transitionMs<0||Object.values(clips).some(c=>!Number.isFinite(c.durationMs)||c.durationMs<=0||!Number.isFinite(c.priority))) throw Error('Invalid performance clips');
  }
  play(id:string,timeMs:number,force=false):boolean {
    const clip=this.clips[id];if(!clip||!Number.isFinite(timeMs))throw Error('Unknown performance or time');
    const from=this.sample(timeMs);
    if(this.active&&!force&&clip.priority<this.clips[this.active.id].priority)return false;
    this.active={id,start:timeMs,from:{...from}};return true;
  }
  sample(timeMs:number):PerformancePose {
    if(!Number.isFinite(timeMs))throw Error('Invalid performance time');
    if(!this.active)return {...this.last};
    const {id,start,from}=this.active,clip=this.clips[id],elapsed=Math.max(0,timeMs-start),u=Math.min(1,elapsed/clip.durationMs);
    const pose=clip.sample(u);if(Object.values(pose).some(v=>!Number.isFinite(v)))throw Error('Invalid sampled pose');
    this.last=blend(from,pose,this.transitionMs?ease(elapsed/this.transitionMs):1);
    if(elapsed>=clip.durationMs)this.active=undefined;
    return {...this.last};
  }
  reset():void {this.active=undefined;this.last={};}
  inspect():{id:string|null;startMs:number|null} {return {id:this.active?.id??null,startMs:this.active?.start??null};}
}
/** Additive, normalized channels; anatomy and bone mapping belong to the consuming project. */
export function gentleCharacterClips():Record<string,PerformanceClip> {
  const pulse=(u:number)=>Math.sin(Math.PI*u)**2;
  return {
    attention:{durationMs:1200,priority:1,sample:u=>({head:pulse(u)*2,earL:-pulse(u)*3,earR:pulse(u)*2})},
    sniff:{durationMs:2200,priority:2,sample:u=>({head:-pulse(u)*5,earL:-pulse(u)*4,earR:pulse(u)*3})},
    react:{durationMs:1000,priority:3,sample:u=>({head:Math.sin(u*Math.PI*2)*2*(1-u),earL:pulse(u)*4,earR:-pulse(u)*3})},
  };
}
