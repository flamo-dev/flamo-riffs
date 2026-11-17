import { FLOWER_CENTER } from './model';

// Scene-specific WGSL. All lighting/compositing stays linear until the final pass.
export const common=/* wgsl */`
struct Frame { eye:vec4f, right:vec4f, up:vec4f, forward:vec4f, viewport:vec4f, controls:vec4f, sun:vec4f, stem:vec4f, crownRotation:vec4f }
@group(0) @binding(0) var<uniform> f:Frame;
fn projection(p:vec3f)->vec4f {
 let q=p-f.eye.xyz;let z=dot(q,f.forward.xyz);let near=f.forward.w;let far=f.controls.w;
 return vec4f(dot(q,f.right.xyz)/(f.up.w*f.right.w),dot(q,f.up.xyz)/f.up.w,far/(far-near)*z-far*near/(far-near),z);
}
fn coc(z:f32)->f32 {return min(48.,f.viewport.w*(f.viewport.y/(2.*f.up.w))*abs(z-f.eye.w)/(max(z,.05)*f.eye.w));}
const flowerCenter = vec3f(${FLOWER_CENTER.join(',')});
fn rotateVector(q:vec4f, p:vec3f)->vec3f {
 let v = 2.*cross(q.xyz,p);
 return p+q.w*v+cross(q.xyz,v);
}
fn stemPoint(p:vec3f)->vec3f {
 let h=clamp(p.y/flowerCenter.y,0.,1.);
 return p+f.stem.xyz*vec3f(h*h,h*h*h,h*h);
}
fn crownPoint(p:vec3f)->vec3f {
 return flowerCenter+f.stem.xyz+rotateVector(f.crownRotation,p-flowerCenter);
}
fn hash(p:vec2f)->f32{return fract(sin(dot(p,vec2f(127.1,311.7)))*43758.5453);}
fn noise(p:vec2f)->f32 {let i=floor(p);let x=fract(p);let u=x*x*(3.-2.*x);return mix(mix(hash(i),hash(i+vec2f(1,0)),u.x),mix(hash(i+vec2f(0,1)),hash(i+vec2f(1,1)),u.x),u.y);}
struct Full { @builtin(position) p:vec4f,@location(0) uv:vec2f }
@vertex fn full(@builtin(vertex_index) i:u32)->Full {var p=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));var o:Full;o.p=vec4f(p[i],0,1);o.uv=p[i]*vec2f(.5,-.5)+.5;return o;}
`;
export const environment=common+/* wgsl */`
struct GrassBends { origin:vec4f, dimensions:vec4f, cells:array<vec4f> }
@group(0) @binding(1) var<storage,read> grass:GrassBends;
fn grassSlope(position:vec3f, phase:f32)->vec2f {
 let dims=vec2u(u32(grass.origin.w),u32(grass.dimensions.x));
 let coord=clamp((position.xz-grass.origin.xy)*grass.origin.z,vec2f(0.),vec2f(dims)-1.);
 let a=vec2u(coord);let b=min(a+vec2u(1u),dims-vec2u(1u));let uv=fract(coord);
 let row0=mix(grass.cells[a.y*dims.x+a.x],grass.cells[a.y*dims.x+b.x],uv.x);
 let row1=mix(grass.cells[b.y*dims.x+a.x],grass.cells[b.y*dims.x+b.x],uv.x);
 let times=mix(row0,row1,uv.y);
 let lean=mix(times.xy,times.zw,f.stem.w);
 let flutter=.09*sin(f.viewport.z*3.4+phase+dot(position.xz,vec2f(.48,.33)));
 return lean+vec2f(-lean.y,lean.x)*flutter;
}
struct MeshIn { @location(0) p:vec3f,@location(1) n:vec3f,@location(2) color:vec3f,@location(3) attributes:vec3f }
struct MeshOut { @builtin(position) p:vec4f,@location(0) world:vec3f,@location(1) n:vec3f,@location(2) color:vec3f,@location(3) kind:f32 }
struct ColorDepth { @location(0) color:vec4f,@location(1) depth:f32 }
@vertex fn meshVs(v:MeshIn)->MeshOut {
 var p=v.p;var n=v.n;
 if(v.attributes.x==1.){p=stemPoint(p);}
 if(v.attributes.x==3.){p=crownPoint(p);n=rotateVector(f.crownRotation,n);}
 if(v.attributes.x==2.){
   let h=max(0.,p.y);let lean=grassSlope(p,v.attributes.z);
   let offset=lean*v.attributes.y*(.34+.66*smoothstep(0.,.75,h));
   p+=vec3f(offset.x,-.36*dot(offset,offset)/max(.10,h),offset.y);
   n=normalize(vec3f(n.x,n.y-dot(n.xz,lean)*min(.52,h*.68),n.z));
 }
 var o:MeshOut;o.p=projection(p);o.world=p;o.n=n;o.color=v.color;o.kind=v.attributes.x;return o;
}
@fragment fn meshFs(v:MeshOut)->ColorDepth {
 let n=normalize(v.n);let light=normalize(f.sun.xyz);let diffuse=max(dot(n,light),0.);
 let transmission=pow(max(dot(-n,light),0.),1.5)*select(.0,.52,v.kind==2.);
 let detail=noise(v.world.xz*80.+v.world.yy*26.);
 var c=v.color*(.35+diffuse*.95+transmission);
 if(v.kind==1. || v.kind==3.){c*=.78+.42*detail; c+=vec3f(.16,.12,.055)*pow(max(dot(reflect(-light,n),normalize(f.eye.xyz-v.world)),0.),22.);}
 let z=dot(v.world-f.eye.xyz,f.forward.xyz);c=mix(c,vec3f(.42,.61,.63),1.-exp(-z*.003));
 var o:ColorDepth;o.color=vec4f(c,1);o.depth=z;return o;
}
@fragment fn sky(v:Full)->ColorDepth {
 let ray=normalize(f.forward.xyz+(v.uv.x*2.-1.)*f.right.xyz*f.right.w*f.up.w+(1.-v.uv.y*2.)*f.up.xyz*f.up.w);
 let h=clamp(ray.y*1.7+.22,0.,1.);var c=mix(vec3f(.12,.46,.70),vec3f(.004,.23,.61),h);
 let p=vec2f(ray.x/max(.12,ray.y+.28),ray.z/max(.12,ray.y+.28))*1.3;
 let cloud=noise(p)*.58+noise(p*2.1)*.26+noise(p*4.3)*.11;
 let coverage=smoothstep(.56,.72,cloud)*smoothstep(-.05,.25,ray.y);
 c=mix(c,vec3f(.92,.97,1.),coverage*.78);
 c+=vec3f(.14,.11,.06)*pow(max(dot(ray,normalize(vec3f(-.6,.8,.7))),0.),18.);
 var o:ColorDepth;o.color=vec4f(c,1);o.depth=90.;return o;
}
`;
export const lens=common+/* wgsl */`
@group(0) @binding(1) var image:texture_2d<f32>;
@group(0) @binding(2) var depths:texture_2d<f32>;
@group(0) @binding(3) var linearSampler:sampler;
@fragment fn blur(v:Full)->@location(0) vec4f {
 let xy=vec2i(v.p.xy);let z=textureLoad(depths,xy,0).r;let radius=coc(z);
 if(radius<.7){return textureLoad(image,xy,0);}
 var color=vec3f(0);var total=0.;
 for(var i=0;i<48;i++){
   let r=sqrt((f32(i)+.5)/48.)*radius;let angle=f32(i)*2.39996323;
   let offset=vec2f(cos(angle),sin(angle))*r;
   let uv=clamp(v.uv+offset/f.viewport.xy,vec2f(0),vec2f(.999999));
   let other=textureLoad(depths,vec2i(uv*f.viewport.xy),0).r;
   // Foreground surfaces retain their silhouette; no background gathering across an in-focus stem.
   let weight=select(.03,1.,other>=z*.85 || coc(other)>r*.8);
   color+=textureSampleLevel(image,linearSampler,uv,0).rgb*weight;total+=weight;
 }
 return vec4f(color/max(total,.001),1);
}
`;
export const fiber=common+/* wgsl */`
struct Strand { a:vec4f,b:vec4f,color:vec4f,attributes:vec4f }
@group(0) @binding(1) var<storage,read> strands:array<Strand>;
@group(0) @binding(2) var depths:texture_2d<f32>;
struct SeedPose { pivot:vec4f, drift:vec4f, rotation:vec4f, geometry:vec4f }
@group(0) @binding(3) var<storage,read> seeds:array<SeedPose>;
struct LineOut { @builtin(position) p:vec4f,@location(0) uv:vec2f,@location(1) color:vec4f,@location(2) metrics:vec4f }
fn flyingPoint(p:vec3f, seed:SeedPose)->vec3f {
 return seed.pivot.xyz+seed.drift.xyz+rotateVector(seed.rotation,p-seed.pivot.xyz);
}
@vertex fn lineVs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->LineOut {
 // Head strands use six vertices per instance. A flight instance draws one whole seed.
 let airborne=vi>=6u;
 var hidden:LineOut;hidden.p=vec4f(2.,2.,2.,1.);
 var s:Strand;var seed:SeedPose;
 if(airborne){
   seed=seeds[ii];
   let segment=(vi-6u)/6u;
   let first=u32(seed.drift.w);
   let count=u32(seed.geometry.x);
   if(seed.geometry.y>0.5 && segment>0u){
     // A distant hair is sub-pixel: join its four original curved segments into one.
     let hair=1u+(segment-1u)*4u;
     if(hair+3u>=count){return hidden;}
     s=strands[first+hair];s.b=strands[first+hair+3u].b;
     s.a.w*=.76;
   }else{
     if(segment>=count){return hidden;}
     s=strands[first+segment];
   }
 }else{
   s=strands[ii];
   seed=seeds[u32(s.attributes.x)];
 }
 let opacity=seed.pivot.w;
 if(opacity<=0.){return hidden;}
 var a:vec3f;var b:vec3f;
 if(airborne){a=flyingPoint(s.a.xyz,seed);b=flyingPoint(s.b.xyz,seed);}
 else{a=crownPoint(s.a.xyz);b=crownPoint(s.b.xyz);}
 let ca=projection(a);let cb=projection(b);
 if(min(ca.w,cb.w)<=f.forward.w){return hidden;}
 let z=(ca.w+cb.w)*.5;
 let pa=ca.xy/ca.w*f.viewport.xy*.5;let pb=cb.xy/cb.w*f.viewport.xy*.5;
 let direction=normalize(pb-pa+vec2f(.000001,0));let normal=vec2f(-direction.y,direction.x);
 let physical=s.a.w*(f.viewport.y/(2.*f.up.w))/max(z,.05);
 let blur=select(coc(z)*.5,min(coc(z)*.24,2.8),airborne);let radius=sqrt(max(physical,.45)*max(physical,.45)+blur*blur);
 var corners=array<vec2f,6>(vec2f(0,-1),vec2f(1,-1),vec2f(0,1),vec2f(0,1),vec2f(1,-1),vec2f(1,1));
 let corner=corners[vi%6u];var clip=mix(ca,cb,corner.x);
 let extension=direction*(corner.x*2.-1.)*radius;
 clip.x+=(normal.x*corner.y*radius*2.+extension.x)*2./f.viewport.x*clip.w;
 clip.y+=(normal.y*corner.y*radius*2.+extension.y)*2./f.viewport.y*clip.w;
 let tangent=normalize(b-a);let l=normalize(f.sun.xyz);let view=normalize(f.eye.xyz-(a+b)*.5);
 let fiberSpec=pow(sqrt(max(0.,1.-pow(dot(tangent,normalize(l+view)),2.))),14.);
 let scatter=pow(max(dot(-view,l),0.),3.);
 let shell=normalize((a+b)*.5-(flowerCenter+f.stem.xyz));
 let shade=.48+max(dot(shell,l),0.)*.46+fiberSpec*.5+scatter*.4;
 var o:LineOut;o.p=clip;o.uv=vec2f(corner.x,corner.y*2.);
 o.color=vec4f(s.color.rgb*shade,opacity*s.color.a*min(1.,physical/.45)*max(physical,.45)/radius);
 o.metrics=vec4f(z,length(pb-pa),radius,s.b.w);return o;
}
struct Accum { @location(0) color:vec4f,@location(1) reveal:f32 }
@fragment fn lineFs(v:LineOut)->Accum {
 let opaque=textureLoad(depths,vec2i(v.p.xy),0).r;
 if(v.metrics.x>opaque+.025){discard;}
 let along=v.uv.x*(v.metrics.y+2.*v.metrics.z)-v.metrics.z;
 // Approximate the finite segment's Gaussian convolution. Without this longitudinal
 // coverage term, defocused short segments gain energy and turn into an opaque white ball.
 let ends=.5*(tanh((v.metrics.y-along)/v.metrics.z*1.7)-tanh(-along/v.metrics.z*1.7));
 let alpha=clamp(v.color.a*exp(-2.*v.uv.y*v.uv.y)*ends,0.,.94);
 if(alpha<.002){discard;}
 let weight=clamp(3./(.2+v.metrics.x*.05),.1,10.);
 var o:Accum;o.color=vec4f(v.color.rgb*alpha*weight,alpha*weight);o.reveal=alpha;return o;
}
`;
export const composite=common+/* wgsl */`
@group(0) @binding(1) var backdrop:texture_2d<f32>;
@group(0) @binding(2) var accumulation:texture_2d<f32>;
@group(0) @binding(3) var revealage:texture_2d<f32>;
fn srgb(v:vec3f)->vec3f{return select(12.92*v,1.055*pow(max(v,vec3f(0)),vec3f(1./2.4))-.055,v>vec3f(.0031308));}
@fragment fn composeFs(v:Full)->@location(0) vec4f {
 let xy=vec2i(v.p.xy);let bg=textureLoad(backdrop,xy,0).rgb;let a=textureLoad(accumulation,xy,0);let coverage=1.-textureLoad(revealage,xy,0).r;
 var c=mix(bg,a.rgb/max(a.a,.00001),coverage)*f.controls.z;
 // Gentle photographic shoulder, retaining white filaments without a bloom veil.
 c=c/(1.+c*.2);c*=1.-.13*pow(length((v.uv-.5)*vec2f(.9,1.)),2.);
 return vec4f(srgb(c),1);
}
`;
