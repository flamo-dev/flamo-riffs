import { clamp, wind, type Run } from './wind';

// The wick is fixed in the foreground painting. Wind is sampled here even
// when the player has landed far from the tower.
export function beaconMotion(){
  let bend=0,draft=0,phase=0;
  return (s:Run,dt:number)=>{
    if(s.beaconLitAt<0){bend=0;draft=0;phase=0;return [-1,0,0,0];}
    const air=wind(1754,303,s.time,s.seed);
    const gust=clamp(Math.hypot(air.across,air.up)/156);
    const response=1-Math.exp(-dt*7);
    bend+=(Math.tanh(air.across/69)-bend)*response;
    draft+=(Math.tanh(air.up/76)-draft)*response;
    phase+=dt*(2.1+gust*13.5);
    const flicker=(.53*Math.sin(phase)+.25*Math.sin(phase*1.73+.5)+.22*air.curl)*(.07+.93*gust);
    return [s.time-s.beaconLitAt,bend,draft,flicker];
  };
}

export const beaconMaterial=`
fn fireShape(p:vec2f,foot:vec2f,h:f32,w:f32,bend:f32,sway:f32)->f32{
 let u=(foot.y-p.y)/max(.1,h);
 let v=clamp(u,0.,1.);
 let center=foot.x+bend*v*v+sway*sin(v*6.1)*v;
 let width=w*pow(max(0.,sin(3.14159*pow(v,.69))),.66);
 return (1.-smoothstep(width-.55,width+.5,abs(p.x-center)))*smoothstep(-.035,.025,u)*(1.-smoothstep(.96,1.02,u));
}
fn drawBeacon(p:vec2f,scene:vec3f,unlit:vec4f)->vec3f{
 let local=p-vec2f(1762.,296.);
 let cold=mix(scene,unlit.rgb,unlit.a);
 let age=f.beacon.x;
 if(age<0.){return cold;}
 let wick=smoothstep(.04,.57,age);
 let fill=smoothstep(.22,1.46,age);
 let bend=f.beacon.y;let draft=f.beacon.z;let flick=f.beacon.w;
 let light=fill*(.89+.09*flick);
 let flash=smoothstep(.34,.83,age)*(1.-smoothstep(.83,2.10,age));
 let d=local-vec2f(2.*bend,0.);
 let radial=exp(-dot(d/vec2f(66,53),d/vec2f(66,53)));
 let spill=exp(-dot(d/vec2f(109,81),d/vec2f(109,81)));
 // Only warm the glass within its painted outline. The posts remain in silhouette.
 let grain=dot(unlit.rgb,vec3f(.28,.54,.18));
 let glass=smoothstep(.218,.316,grain);
 let warm=mix(cold,scene,(.62+.20*glass)*unlit.a*light);
 var rgb=mix(warm,vec3f(1.,.69,.24),light*radial*.145+flash*spill*.13);
 let height=wick*(29.+6.*draft+3.8*flick-5.5*abs(bend));
 let sway=flick*4.;
 let base=vec2f(1756,305.2);
 let flame=fireShape(p,base,height,7.4*wick,bend*17.,sway);
 let small=fireShape(p,base+vec2f(5.1,.8),height*.74,5.3*wick,bend*10.+4.,-sway);
 let core=fireShape(p,base-vec2f(.7,0.),height*.70,3.7*wick,bend*9.,sway*.62);
 let pillar=1.-smoothstep(1.8,3.8,abs(p.x-1762.8));
 let screen=1.-pillar*.94;
 rgb=mix(rgb,vec3f(1.,.64,.12),wick*max(flame,small)*screen);
 rgb=mix(rgb,vec3f(1.,.96,.69),wick*core*screen);
 return rgb;
}`;
