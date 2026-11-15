import { clamp, noise, type Run, type wind } from './wind';

export function windAudio() {
  let audio:AudioContext|undefined, master:GainNode, windGain:GainNode, airFilter:BiquadFilterNode;
  let clothGain:GainNode, clothFilter:BiquadFilterNode, snaps:GainNode, bodyFilter:BiquadFilterNode;
  let muted=false,beat=0,previousGrip=0,previousPressure=0;
  function unlock(){
    if(muted)return;
    try{
      if(!audio){
        audio=new AudioContext();const ac=audio;
        master=ac.createGain();master.gain.value=.85;master.connect(ac.destination);
        const noiseClip=(seconds:number,brown:boolean)=>{
          const data=ac.createBuffer(1,ac.sampleRate*seconds,ac.sampleRate),samples=data.getChannelData(0);
          let low=0;for(let i=0;i<samples.length;i++){const n=Math.random()*2-1;low=(low+.18*n)/1.08;samples[i]=brown?low:n;}
          const loop=ac.createBufferSource();loop.buffer=data;loop.loop=true;loop.start();return loop;
        };
        const gain=()=>{const g=ac.createGain();g.gain.value=0;g.connect(master);return g;};
        windGain=gain();airFilter=ac.createBiquadFilter();airFilter.type='lowpass';airFilter.Q.value=.65;
        noiseClip(3,true).connect(airFilter).connect(windGain);
        // A separate broad, dry midrange rustle and a lower transient from the fold snapping taut.
        clothGain=gain();snaps=gain();const thread=noiseClip(2,false);
        clothFilter=ac.createBiquadFilter();clothFilter.type='bandpass';clothFilter.Q.value=.84;
        bodyFilter=ac.createBiquadFilter();bodyFilter.type='bandpass';bodyFilter.Q.value=1.05;
        thread.connect(clothFilter).connect(clothGain);thread.connect(bodyFilter).connect(snaps);
      }
      if(audio.state==='suspended')void audio.resume().catch(()=>{});
    }catch{/* Silent devices still support the whole level. */}
  }
  function update(s:Run,air:ReturnType<typeof wind>,dt:number){
    if(!audio||!clothGain)return;
    const t=audio.currentTime;
    const field=clamp(Math.hypot(air.across*.65,air.up)/390);
    const relative=clamp(Math.hypot(air.across-s.vx,air.up+s.vy)/365);
    const flying=s.mode==='glide';
    windGain.gain.setTargetAtTime(.035+field*(flying?.42:.31),t,.16);
    airFilter.frequency.setTargetAtTime(250+1320*field,t,.16);
    const pull=flying?clamp((s.grip-previousGrip)/Math.max(.008,dt)*.45):0;
    const catchAir=flying?clamp((s.pressure-previousPressure)/Math.max(.008,dt)):0;
    previousGrip=s.grip;previousPressure=s.pressure;
    const exposed=flying?.48+.52*s.grip:.28;
    const drive=exposed*(.72*relative+.28*field);
    const variation=noise(s.time*2.0,s.seed+73);
    beat+=dt*(1.2+4.5*drive+1.6*variation);
    const flick=Math.sin(beat*Math.PI*2)*.5+.5;
    const crease=.14+Math.pow(flick,4)*(.53+variation*.43);
    clothFilter.frequency.setTargetAtTime(950+1800*drive+480*pull,t,.05);
    clothGain.gain.setTargetAtTime((.013+.34*drive)*crease+pull*.13,t,.025);
    bodyFilter.frequency.setTargetAtTime(245+390*drive+260*catchAir,t,.05);
    snaps.gain.setTargetAtTime((drive*.5+catchAir*.29)*Math.pow(flick,10),t,.013);
  }
  function bell(){
    if(!audio||muted)return;
    [523.25,784.88].forEach((frequency,i)=>{
      const ac=audio!,tone=ac.createOscillator(),env=ac.createGain(),now=ac.currentTime+i*.11;
      tone.frequency.value=frequency;env.gain.setValueAtTime(.0001,now);env.gain.exponentialRampToValueAtTime(.045,now+.02);
      env.gain.exponentialRampToValueAtTime(.0001,now+1.55);tone.connect(env).connect(master);tone.start(now);tone.stop(now+1.6);
    });
  }
  return {unlock,update,bell,toggle(){muted=!muted;if(!muted)unlock();if(audio&&master)master.gain.setTargetAtTime(muted?0:.85,audio.currentTime,.025);return muted;},
    dispose(){if(audio)void audio.close().catch(()=>{});}};
}
