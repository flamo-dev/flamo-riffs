export const atmosphere = /* wgsl */ `struct Frame {
  eye: vec4f, right: vec4f, up: vec4f, forward: vec4f,
  lens: vec4f, sun: vec4f, settings: vec4f,
}
@group(0) @binding(0) var<uniform> f: Frame;
const PI = 3.14159265;
fn hash2(p: vec2f) -> f32 {
  var q = fract(vec3f(p.xyx) * vec3f(.1031,.1030,.0973));
  q += dot(q,q.yzx+33.33);
  return fract((q.x+q.y)*q.z);
}
fn noise(p: vec2f) -> f32 {
  let i=floor(p); let u=fract(p); let w=u*u*(3.-2.*u);
  return mix(mix(hash2(i),hash2(i+vec2f(1,0)),w.x),mix(hash2(i+vec2f(0,1)),hash2(i+1.),w.x),w.y);
}
fn fbm(p:vec2f)->f32 {
  let spin=mat2x2f(.8,.6,-.6,.8);
  var q=p; var sum=0.; var gain=.52;
  for(var i=0;i<5;i++){sum+=gain*noise(q);q=spin*q*2.04+vec2f(8.9,11.3);gain*=.49;}
  return sum;
}
fn skyColor(ray:vec3f)->vec3f {
 let s=max(dot(ray,f.sun.xyz),0.);let h=max(ray.y,0.);let east=clamp(.5+.5*dot(normalize(ray.xz+vec2f(.00001)),normalize(f.sun.xz)),0.,1.);
 let gold=vec3f(.96,.61,.29);let horizon=mix(vec3f(.26,.36,.46),vec3f(1.62,.99,.48),pow(east,7.));
 let clear=mix(mix(horizon,mix(vec3f(.14,.23,.34),vec3f(.70,.49,.35),pow(east,3.)),smoothstep(0.,.18,h)),vec3f(.085,.145,.24),smoothstep(.11,.54,h))+
   gold*(pow(s,8.)*.16+pow(s,64.)*.8+pow(s,550.)*2.8);
 let q=ray.xz/(h+.10)*vec2f(.62,.95);
 let warped=q+(fbm(q*.45+7.1)-.48)*1.4;
 let density=fbm(warped)*.86+(1.-abs(2.*fbm(warped*3.1+5.)-1.)-.6)*.12;
 let body=density*.74+noise(q*.19+3.7)*.36;
 let edge=mix(.035,.285,pow(east,1.7));
 let rag=(noise(q*.9+11.)-.5)*.16+(density-.5)*.11;
 let hole=smoothstep(.972,.9985,s+(density-.5)*.012);
 let cover=smoothstep(.30,.49,body)*smoothstep(edge-.035,edge+.11,h+rag*(.35+east))*(1.-.93*hole);
 let relief=clamp((density-fbm(warped+normalize(f.sun.xz)*.22))*4.5+.5,0.,1.);
 let thick=smoothstep(.39,.69,body);
 let slate=mix(vec3f(.155,.195,.255),vec3f(.025,.035,.053),thick)*(.50+.9*relief*relief);
 let under=pow(east,5.)*exp(-max(h-edge,0.)*4.5)+pow(s,7.);
 let lit=gold*under*(.025+1.75*pow(relief,3.))+gold*cover*(1.-cover)*3.6*pow(east,4.)*(1.-.85*hole);
 let clouds=mix(slate+lit,horizon*.55+(slate+lit)*.45,exp(-h*11.));
 let sky=mix(clear,clouds,cover*.985)+vec3f(65.,47.,25.)*smoothstep(.99990,.99996,s)*(1.-cover*.91);
 return mix(sky,horizon*.35,smoothstep(0.,.24,-ray.y));
}
fn project(world:vec3f)->vec4f {
  let p=world-f.eye.xyz;
  let z=dot(p,f.forward.xyz);
  return vec4f(dot(p,f.right.xyz)/f.lens.x,dot(p,f.up.xyz)/f.lens.y,z*1.00025-.07002,z);
}
fn shadowClip(world:vec3f)->vec4f {
  let axisX=normalize(cross(vec3f(0,1,0),f.sun.xyz));
  let axisY=cross(f.sun.xyz,axisX);
  let p=world-vec3f(-9,3,6);
  return vec4f(dot(axisX,p)/44.,dot(axisY,p)/31.,.5-dot(f.sun.xyz,p)/260.,1);
}
struct Quad { @builtin(position) pos:vec4f, @location(0) ndc:vec2f }
@vertex fn fullscreen(@builtin(vertex_index) i:u32)->Quad{
  let xy=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));
  return Quad(vec4f(xy[i],.999999,1),xy[i]);
}
fn rayAt(ndc:vec2f)->vec3f{
 return normalize(f.forward.xyz+f.right.xyz*ndc.x*f.lens.x+f.up.xyz*ndc.y*f.lens.y);
}
@fragment fn sky(q:Quad)->@location(0) vec4f {return vec4f(skyColor(rayAt(q.ndc)),1);}
@group(0) @binding(1) var shadowMap:texture_depth_2d;
@group(0) @binding(2) var shadowSampler:sampler_comparison;
fn sunlight(p:vec3f,n:vec3f)->f32{
 let projected=shadowClip(p+n*.025); let uv=projected.xy*vec2f(.5,-.5)+.5;
 let depth=projected.z-.00012; let delta=vec2f(.00055,.00055);
 let v=(textureSampleCompareLevel(shadowMap,shadowSampler,uv-delta,depth)+textureSampleCompareLevel(shadowMap,shadowSampler,uv+delta,depth)+textureSampleCompareLevel(shadowMap,shadowSampler,uv+delta*vec2f(-1,1),depth)+textureSampleCompareLevel(shadowMap,shadowSampler,uv+delta*vec2f(1,-1),depth))*.25;
 return select(1.,v,all(abs(projected.xy)<vec2f(.995)));
}
fn atmosphere(c:vec3f,world:vec3f)->vec3f{
 let ray=normalize(world-f.eye.xyz); let dist=distance(world,f.eye.xyz);
 let fog=1.-exp(-dist*.0019); let hot=pow(max(0.,dot(ray,f.sun.xyz)),10.);
 return mix(c,vec3f(.22,.26,.30)+vec3f(.68,.34,.10)*hot,fog);
}
`;

export const geometry = /* wgsl */ `struct V {
 @builtin(position) pos:vec4f,@location(0) world:vec3f,@location(1) normal:vec3f,
 @location(2) uv:vec2f,@location(3) color:vec4f,@location(4) @interpolate(flat) layer:i32,
 @location(5) @interpolate(flat) isLabel:f32,
}
@vertex fn geometry(@location(0) p:vec4i,@location(1) n:vec4f,@location(2) color:vec4f,@location(3) uv:vec2f)->V {
 let w=vec3f(p.xyz)/192.;let offset=select(0.,.008,n.w>.5);let lifted=w+n.xyz*offset*sign(dot(f.eye.xyz-w,n.xyz));return V(project(lifted),w,n.xyz,uv,color,p.w,n.w);
}
@vertex fn shadowVertex(@location(0) p:vec4i)->@builtin(position) vec4f {return shadowClip(vec3f(p.xyz)/192.);}
@group(0) @binding(3) var atlas:texture_2d_array<f32>;
@group(0) @binding(4) var repeating:sampler;
@fragment fn surface(v:V)->@location(0) vec4f{
 let coord=select(v.uv,clamp(v.uv,vec2f(.002),vec2f(.998)),v.isLabel>.5);
 let tex=textureSample(atlas,repeating,coord,v.layer);
 if(tex.a<.035 || (v.isLabel>.5 && dot(f.eye.xyz-v.world,v.normal)<0.)){discard;}
 let n=normalize(v.normal); let eye=normalize(f.eye.xyz-v.world);
 let light=sunlight(v.world,n);let incidence=max(dot(f.sun.xyz,n),0.);
 let ambient=mix(vec3f(.035,.042,.060),vec3f(.17,.235,.30),clamp(.50+n.y*.47+n.x*.13,0.,1.));
 let albedo=pow(max(tex.rgb*v.color.rgb,vec3f(.001)),vec3f(2.12));
 let gloss=pow(max(dot(normalize(eye+f.sun.xyz),n),0.),mix(85.,11.,v.color.a));
 let lighting=ambient*(.69+.31*smoothstep(.05,2.6,v.world.y))+vec3f(3.2,2.04,1.03)*light*incidence;
 let outColor=albedo*lighting+vec3f(.80,.48,.19)*gloss*light*(1.-v.color.a*.65);
 return vec4f(atmosphere(outColor,v.world),select(1.,tex.a,v.isLabel>.5));
}
`;

export const pavement = /* wgsl */ `@group(0) @binding(3) var reflected:texture_2d<f32>;
@group(0) @binding(4) var linearSampler:sampler;
struct FloorOut {@builtin(frag_depth) depth:f32,@location(0) color:vec4f}
fn puddle(p:vec2f,c:vec2f,r:vec2f)->f32 {let q=(p-c)/r;return exp(-dot(q,q)*dot(q,q));}
@fragment fn pavement(q:Quad)->FloorOut{
 let ray=rayAt(q.ndc);let t=-f.eye.y/min(ray.y,-.00001);let p=f.eye.xyz+ray*t;
 let xz=p.xz;let warp=fbm(xz*.36);let grains=noise(xz*120.);
 let fineFade=1.-smoothstep(12.,50.,t);
 let tracks=exp(-pow((abs(p.z-6.)-1.08)*3.2,2.));
 let basins=max(max(puddle(xz,vec2f(-30.5,6.6),vec2f(2.6,1.65)),puddle(xz,vec2f(-19.5,5.2),vec2f(7.5,1.5))),max(puddle(xz,vec2f(-11.5,7.),vec2f(5.,1.35)),puddle(xz,vec2f(5.6,4.7),vec2f(4.,1.7))));
 let wet=smoothstep(.38,.62,basins*.55+(warp-.43)*1.7+tracks*.22+.14);
 let marking=(1.-smoothstep(.065,.115,abs(abs(p.z-6.)-3.85)))*smoothstep(.20,.53,warp*.64+grains*.36);
 let crosswalk=(1.-smoothstep(.32,.39,abs(fract((p.x+34.)/.98)-.5)))*select(0.,1.,p.x> -35.5 && p.x< -32. && abs(p.z-6.)<3.4);
 let seam=min(abs(fract((p.x+2.)/5.8)-.5),abs(fract(p.z/4.8)-.5));
 let asphalt=mix(vec3f(.082,.084,.086),vec3f(.18,.165,.15),warp)*(1.+(grains-.5)*.42*fineFade)*(.63+.70*fbm(xz*2.7))*(1.-tracks*.21)*(1.-.50*(1.-smoothstep(.001,.008,seam)));
 let paint=mix(asphalt,vec3f(.65,.43,.13),marking*.8);
 let base=mix(paint,vec3f(.47,.48,.46),crosswalk*.55);
 let visibility=sunlight(p,vec3f(0,1,0));
 let damp=smoothstep(.34,.70,warp+tracks*.16);
 let grainHeight=fbm(xz*vec2f(6.,9.));
 let slope=vec2f(noise(xz*3.7+16.)-.5,noise(xz*5.1+27.)-.5)*(.30+.12*damp)+vec2f(grains-.5,grainHeight-.5)*.12*fineFade;
 let asphaltN=normalize(vec3f(slope.x,1.,slope.y));
 let diffuse=base*(vec3f(.19,.24,.31)+vec3f(.72,.46,.24)*visibility)*(1.-wet*.59-damp*.24);
 let jitter=vec2f(noise(xz*5.+f.settings.x*.08),noise(xz.yx*7.-f.settings.x*.09))-.5;
 let uv=q.ndc*vec2f(.5,-.5)+.5;
 let rough=mix(.004,.00055,wet);
 let reflectedUV=clamp(uv+jitter*(.0025+.0008*wet)*fineFade,vec2f(.005),vec2f(.995));
 let reflection=textureSampleLevel(reflected,linearSampler,reflectedUV,0.).rgb*.50+
  (textureSampleLevel(reflected,linearSampler,reflectedUV+vec2f(rough,rough),0.).rgb+textureSampleLevel(reflected,linearSampler,reflectedUV-vec2f(rough,rough),0.).rgb)*.25;
 let fresnel=.085+.88*pow(1.-max(0.,-ray.y),3.);
 let spec=pow(max(dot(reflect(ray,asphaltN),f.sun.xyz),0.),mix(16.,90.,wet))*
   visibility*mix(.24,1.5,smoothstep(.29,.64,grainHeight+warp*.12));
 var color=mix(diffuse,reflection,clamp(fresnel*(.075+damp*.12+wet*.90),0.,.95))+vec3f(1.38,.83,.39)*spec*(.22+.96*damp+.40*wet);
 var hit=p;
 if(p.x>30.){let waterT=(-1.6-f.eye.y)/min(ray.y,-.00001);hit=f.eye.xyz+ray*waterT;
 let rip=sin(hit.x*2.6+hit.z*3.+f.settings.x*1.3)*.025+sin(hit.z*5.1-f.settings.x)*.018;
 let oceanN=normalize(vec3f(rip,1.,rip*.7));let reflectedRay=reflect(ray,oceanN);
 let fres=pow(1.-max(.0,dot(-ray,oceanN)),3.);color=mix(vec3f(.025,.082,.094),skyColor(reflectedRay),.18+.72*fres);}
 color=atmosphere(color,hit);let clip=project(hit);
 if(ray.y>=-.00001||t>250.){discard;}
 return FloorOut(clamp(clip.z/clip.w,0.,.999999),vec4f(color,1));
}
`;

export const display = /* wgsl */ `@group(0) @binding(1) var sceneColor:texture_2d<f32>;
@group(0) @binding(2) var imgSampler:sampler;
@group(0) @binding(3) var viewDepth:texture_depth_2d;
@group(0) @binding(4) var sunDepth:texture_depth_2d;
@group(0) @binding(5) var sunCompare:sampler_comparison;
fn airLight(screen:vec2f,uv:vec2f)->vec3f {
 let ray=rayAt(screen);
 let size=textureDimensions(viewDepth);
 let depth=textureLoad(viewDepth,clamp(vec2i(uv*vec2f(size)),vec2i(0),vec2i(size)-1),0);
 let dist=min(95.,.07002/max(.0001,1.00025-depth)/max(.15,dot(ray,f.forward.xyz)));
 let phase=pow(max(dot(ray,f.sun.xyz),0.),15.);
 var lit=0.;
 for(var i=0;i<8;i++){
   let along=(f32(i)+.5)*dist/8.;
   let p=f.eye.xyz+ray*along; let sp=shadowClip(p);
   let coord=sp.xy*vec2f(.5,-.5)+.5;
   let sunlit=textureSampleCompareLevel(sunDepth,sunCompare,coord,sp.z-.0003);
   lit+=select(1.,sunlit,all(abs(sp.xy)<vec2f(1.)))*exp(-max(0.,p.y)*.15);
 }
 return vec3f(.93,.56,.26)*lit*.125*(1.-exp(-dist*.028))*(.027+.47*phase);
}
@fragment fn grade(q:Quad)->@location(0) vec4f{
 let uv=q.ndc*vec2f(.5,-.5)+.5;
 var c=textureSampleLevel(sceneColor,imgSampler,uv,0.).rgb;
 c+=airLight(q.ndc,uv);
 let lightBleed=vec3f(.0)+
   max(textureSampleLevel(sceneColor,imgSampler,uv+vec2f(.004,.002),0.).rgb-1.7,vec3f(0.))+
   max(textureSampleLevel(sceneColor,imgSampler,uv+vec2f(-.004,.002),0.).rgb-1.7,vec3f(0.))+
   max(textureSampleLevel(sceneColor,imgSampler,uv+vec2f(0.,-.005),0.).rgb-1.7,vec3f(0.));
 c+=min(lightBleed,vec3f(3.))*.026;
 let exposure=.84; c*=exposure;
 c=clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),vec3f(0.),vec3f(1.));
 c=pow(c,vec3f(1./2.2));
 c*=1.-.11*dot(q.ndc*.65,q.ndc*.65);
 let grain=(hash2(floor(q.pos.xy))-.5)*.009;
 return vec4f(c+grain,1.);
}
`;
