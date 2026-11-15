import { wind, type Run } from './wind';

// Root positions in the 1672 × 941 bank painting. Each clump samples the same
// world-space field as the actor, including after a retry chooses a new seed.
const roots=[
  {x:8,height:180,stiffness:29}, {x:92,height:144,stiffness:35},
  {x:203,height:109,stiffness:39}, {x:507,height:47,stiffness:52},
];
export function reedMotion(){
  const clumps=roots.map(()=>({stem:0,speed:0,tip:0,tipSpeed:0,lift:0}));
  const frame=new Float32Array(roots.length*4);
  return (s:Run,dt:number)=>{
    roots.forEach(({x,height,stiffness},i)=>{
      const q=clumps[i],air=wind(x*1920/1672,1080-height*.62*1080/941,s.time,s.seed);
      const speed=Math.hypot(air.across,.42*air.up),load=Math.tanh(speed/108);
      const target=.28*Math.tanh(air.across/101);
      // A damped stem drives a lighter, delayed plume. Fixed substeps keep
      // the spring stable when the renderer briefly drops frames.
      const steps=Math.max(1,Math.ceil(dt*90)),step=dt/steps;
      for(let k=0;k<steps;k++){
        q.speed+=(stiffness*(target-q.stem)-Math.sqrt(stiffness)*1.48*q.speed)*step;
        q.stem+=q.speed*step;
        q.tipSpeed+=((q.stem-q.tip)*stiffness*1.4-Math.sqrt(stiffness)*1.33*q.tipSpeed)*step;
        q.tip+=q.tipSpeed*step;
      }
      q.lift+=(Math.tanh(air.up/160)-q.lift)*(1-Math.exp(-dt*5));
      frame[i*4]=q.stem;frame[i*4+1]=q.tip;frame[i*4+2]=q.lift;frame[i*4+3]=load;
    });
    return frame;
  };
}

// The two atlas tiles are registered to the bottom 224 pixels of the original bank.
// Only the isolated reed pigment is displaced. The backing always samples the unbent position.
export const reedMaterial=`
@group(0) @binding(7) var reedAtlas:texture_2d<f32>;
@group(0) @binding(8) var<uniform> reedWind:array<vec4f,4>;
fn reedOffset(p:vec2f)->vec2f{
 let h=max(0.,224.-p.y);
 let small=smoothstep(425.,465.,p.x);
 let lane=p.x-.88*h;
 let height=mix(mix(180.,115.,smoothstep(-15.,165.,lane)),48.,small);
 let norm=clamp(h/height,0.,1.);
 // Adjacent points of a plume rotate around the same culm. Bending
 // diminishes above the stem so its feathery crown retains its width.
 var rootX=mix(-68.,-32.,smoothstep(-110.,-49.,lane));
 rootX=mix(rootX,44.,smoothstep(0.,52.,lane));
 rootX=mix(rootX,145.,smoothstep(94.,156.,lane));
 rootX=mix(rootX,494.,small);
 var motion=mix(reedWind[0],reedWind[1],smoothstep(-65.,52.,lane));
 motion=mix(motion,reedWind[2],smoothstep(55.,170.,lane));
 motion=mix(motion,reedWind[3],small);
 let tip=smoothstep(.32,.96,norm);
 let flex=smoothstep(2.,18.,h)*(.24+.76*smoothstep(0.,.68,norm));
 let ripple=sin(f.time*3.8+rootX*.031-h*.015)+.37*sin(f.time*5.1+p.x*.038);
 let theta=(mix(motion.x,motion.y,tip)+.015*motion.w*tip*ripple)*flex;
 let arm=p.x-rootX;
 let dx=h*sin(theta)+arm*(cos(theta)-1.);
 let dy=h*(1.-cos(theta))+arm*sin(theta)-.04*h*tip*motion.z;
 return vec2f(dx,dy);
}
fn paintReeds(uv:vec2f,shore:vec4f)->vec4f{
 let p=uv*vec2f(1672,941)-vec2f(0,717);
 if(p.y<0. || p.x>=640.){return shore;}
 let size=vec2f(640,224);let atlasSize=vec2f(640,448);
 let background=textureSampleLevel(reedAtlas,silk,clamp(p,vec2f(.5),size-.5)/atlasSize,0);
 var rest=p;
 for(var j=0;j<4;j++){rest=p-reedOffset(rest);}
 // Stems entering from the left continue down their original slope offscreen.
 let margin=max(0.,-rest.x);
 rest.y-=margin*1.45;
 let sampleAt=clamp(rest,vec2f(.5),size-.5)+vec2f(0,224);
 var plant=textureSampleLevel(reedAtlas,silk,sampleAt/atlasSize,0);
 plant.a*=1.-smoothstep(0.,30.,margin);
 if(rest.y<0. || any(rest>=size)){plant.a=0.;}
 let alpha=plant.a+(1.-plant.a)*background.a;
 return vec4f((plant.rgb*plant.a+background.rgb*background.a*(1.-plant.a))/max(alpha,.00001),alpha);
}`;
