// Instanced rain uses the same projection and depth buffer as the harbor.
import layout from './baked/level';

// The level already defines sheltered volumes for audio and player wetness.
const underRoof=layout.interiorBoxes.map(box=>{
  const v=(a:number[])=>'vec3f('+a.map(n=>Number(n).toFixed(3)).join(',')+')';
  return 'if(all(drop >= '+v(box.min)+') && all(drop <= '+v(box.max)+')){opacity=0.;}';
}).join('\n');

export const rainShader = /* wgsl */ `
struct RainVertex { @builtin(position) clip:vec4f, @location(0) side:f32, @location(1) along:f32, @location(2) alpha:f32 }
fn random(seed:u32)->f32 {
 var h=seed*747796405u+2891336453u;
 h=((h>>((h>>28u)+4u))^h)*277803737u;
 return f32((h>>22u)^h)/4294967296.;
}
@vertex fn rainVertex(@builtin(vertex_index) i:u32,@builtin(instance_index) id:u32)->RainVertex {
 let seed=id*5u;
 let t=f.settings.x;
 let speed=8.+random(seed+1u)*5.;
 let height=15.-fract(random(seed)+t*speed/15.)*15.;
 // Fixed world-space trajectories repeat around the camera without swimming as it turns.
 let cell=vec2f(random(seed+2u),random(seed+3u))*36.+(15.-height)*vec2f(.145,.047);
 let xz=f.eye.xz+fract((cell-f.eye.xz)/36.+.5)*36.-18.;
 let drop=vec3f(xz.x,height,xz.y);
 let z=dot(drop-f.eye.xyz,f.forward.xyz);
 let shape=random(seed+4u);
 var opacity=(.26+.26*shape)*smoothstep(.38,1.2,z)*(1.-smoothstep(13.,18.,length(xz-f.eye.xz)))*smoothstep(0.,.25,height)*(1.-smoothstep(14.4,15.,height));
 ${underRoof}
 let corner=array<vec2f,6>(vec2f(-1.,0.),vec2f(1.,0.),vec2f(1.,1.),vec2f(-1.,0.),vec2f(1.,1.),vec2f(-1.,1.))[i];
 let tail=vec3f(-.145,1.,-.047)*(.10+.17*shape);
 let wide=f.right.xyz*max(.003,min(.017,z*.0013));
 let clip=project(drop+corner.y*tail+corner.x*wide);
 return RainVertex(clip,corner.x,corner.y,opacity);
}
@fragment fn rainFragment(v:RainVertex)->@location(0) vec4f {
 let alpha=v.alpha*(1.-abs(v.side))*(.28+.72*sin(3.14159*v.along));
 return vec4f(.77,.89,1.06,alpha);
}`;
