// Scene-specific WGSL. All lighting/compositing stays linear until the final pass.
export const common = /* wgsl */ `
struct Frame { eye:vec4f, right:vec4f, up:vec4f, forward:vec4f, viewport:vec4f, controls:vec4f, sun:vec4f }
@group(0) @binding(0) var<uniform> f:Frame;
fn projection(p:vec3f)->vec4f {
 let q=p-f.eye.xyz;let z=dot(q,f.forward.xyz);let near=f.forward.w;let far=f.controls.w;
 return vec4f(dot(q,f.right.xyz)/(f.up.w*f.right.w),dot(q,f.up.xyz)/f.up.w,far/(far-near)*z-far*near/(far-near),z);
}
fn coc(z:f32)->f32 {return min(48.,f.viewport.w*(f.viewport.y/(2.*f.up.w))*abs(z-f.eye.w)/(max(z,.05)*f.eye.w));}
fn breeze(p:vec3f,amount:f32,phase:f32)->vec3f {
 let t=f.viewport.z;return p+vec3f(sin(t*1.1+p.z*.61+phase)*amount,0,cos(t*.81+p.x*.65+phase)*amount*.38)*f.controls.x;
}
fn plantMotion(p:vec3f)->vec3f {return breeze(p,pow(max(p.y,0.)/1.66,1.7)*.021,0.);}
fn hash(p:vec2f)->f32{return fract(sin(dot(p,vec2f(127.1,311.7)))*43758.5453);}
fn noise(p:vec2f)->f32 {let i=floor(p);let x=fract(p);let u=x*x*(3.-2.*x);return mix(mix(hash(i),hash(i+vec2f(1,0)),u.x),mix(hash(i+vec2f(0,1)),hash(i+vec2f(1,1)),u.x),u.y);}
struct Full { @builtin(position) p:vec4f,@location(0) uv:vec2f }
@vertex fn full(@builtin(vertex_index) i:u32)->Full {var p=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));var o:Full;o.p=vec4f(p[i],0,1);o.uv=p[i]*vec2f(.5,-.5)+.5;return o;}
`;
export const environment = common + /* wgsl */ `
struct MeshIn { @location(0) p:vec3f,@location(1) n:vec3f,@location(2) color:vec3f,@location(3) attributes:vec3f }
struct MeshOut { @builtin(position) p:vec4f,@location(0) world:vec3f,@location(1) n:vec3f,@location(2) color:vec3f,@location(3) kind:f32 }
struct ColorDepth { @location(0) color:vec4f,@location(1) depth:f32 }
@vertex fn meshVs(v:MeshIn)->MeshOut {
 var p=v.p;if(v.attributes.x==1.){p=plantMotion(p);}else if(v.attributes.x==2.){p=breeze(p,v.attributes.y,v.attributes.z);}
 var o:MeshOut;o.p=projection(p);o.world=p;o.n=v.n;o.color=v.color;o.kind=v.attributes.x;return o;
}
@fragment fn meshFs(v:MeshOut)->ColorDepth {
 let n=normalize(v.n);let light=normalize(f.sun.xyz);let diffuse=max(dot(n,light),0.);
 let transmission=pow(max(dot(-n,light),0.),1.5)*select(.0,.52,v.kind==2.);
 let detail=noise(v.world.xz*80.+v.world.yy*26.);
 var c=v.color*(.35+diffuse*.95+transmission);
 if(v.kind==1.){c*=.78+.42*detail; c+=vec3f(.16,.12,.055)*pow(max(dot(reflect(-light,n),normalize(f.eye.xyz-v.world)),0.),22.);}
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
export const lens = common + /* wgsl */ `
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
export const fiber = common + /* wgsl */ `
struct Strand { a:vec4f,b:vec4f,color:vec4f,attributes:vec4f }
@group(0) @binding(1) var<storage,read> strands:array<Strand>;
@group(0) @binding(2) var depths:texture_2d<f32>;
struct LineOut { @builtin(position) p:vec4f,@location(0) uv:vec2f,@location(1) color:vec4f,@location(2) metrics:vec4f }
fn seedMotion(p:vec3f,id:f32)->vec3f {
 var q=plantMotion(p);let flying=fract(id*.61803398875)>.94;
 if(flying&&f.controls.y>=0.){
   let t=max(0.,f.viewport.z-f.controls.y-fract(id*.371)*1.2);let k=min(t,14.);
   q+=vec3f(k*.23+k*k*.018,k*.13+sin(k*1.9+id)*min(.04,k*.02),-k*.09+sin(k*.8)*k*.025);
 }
 return q;
}
@vertex fn lineVs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->LineOut {
 let s=strands[ii];let a=seedMotion(s.a.xyz,s.attributes.x);let b=seedMotion(s.b.xyz,s.attributes.x);
 let ca=projection(a);let cb=projection(b);let z=(ca.w+cb.w)*.5;
 let pa=ca.xy/ca.w*f.viewport.xy*.5;let pb=cb.xy/cb.w*f.viewport.xy*.5;
 let direction=normalize(pb-pa+vec2f(.000001,0));let normal=vec2f(-direction.y,direction.x);
 let physical=s.a.w*(f.viewport.y/(2.*f.up.w))/max(z,.05);
 let blur=coc(z)*.5;let radius=sqrt(max(physical,.45)*max(physical,.45)+blur*blur);
 var corners=array<vec2f,6>(vec2f(0,-1),vec2f(1,-1),vec2f(0,1),vec2f(0,1),vec2f(1,-1),vec2f(1,1));
 let corner=corners[vi];var clip=mix(ca,cb,corner.x);
 let extension=direction*(corner.x*2.-1.)*radius;
 clip.x+=(normal.x*corner.y*radius*2.+extension.x)*2./f.viewport.x*clip.w;
 clip.y+=(normal.y*corner.y*radius*2.+extension.y)*2./f.viewport.y*clip.w;
 let tangent=normalize(b-a);let l=normalize(f.sun.xyz);let view=normalize(f.eye.xyz-(a+b)*.5);
 let fiberSpec=pow(sqrt(max(0.,1.-pow(dot(tangent,normalize(l+view)),2.))),14.);
 let scatter=pow(max(dot(-view,l),0.),3.);
 let shell=normalize((a+b)*.5-vec3f(-.035,1.66,0));
 let shade=.48+max(dot(shell,l),0.)*.46+fiberSpec*.5+scatter*.4;
 var o:LineOut;o.p=clip;o.uv=vec2f(corner.x,corner.y*2.);
 o.color=vec4f(s.color.rgb*shade,s.color.a*min(1.,physical/.45)*max(physical,.45)/radius);
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
export const composite = common + /* wgsl */ `
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NyaXB0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2NyaXB0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLG1GQUFtRjtBQUNuRixNQUFNLENBQUMsTUFBTSxNQUFNLEdBQUMsVUFBVSxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0NBZ0I3QixDQUFDO0FBQ0YsTUFBTSxDQUFDLE1BQU0sV0FBVyxHQUFDLE1BQU0sR0FBQyxVQUFVLENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQTJCekMsQ0FBQztBQUNGLE1BQU0sQ0FBQyxNQUFNLElBQUksR0FBQyxNQUFNLEdBQUMsVUFBVSxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBbUJsQyxDQUFDO0FBQ0YsTUFBTSxDQUFDLE1BQU0sS0FBSyxHQUFDLE1BQU0sR0FBQyxVQUFVLENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBK0NuQyxDQUFDO0FBQ0YsTUFBTSxDQUFDLE1BQU0sU0FBUyxHQUFDLE1BQU0sR0FBQyxVQUFVLENBQUE7Ozs7Ozs7Ozs7OztDQVl2QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gU2NlbmUtc3BlY2lmaWMgV0dTTC4gQWxsIGxpZ2h0aW5nL2NvbXBvc2l0aW5nIHN0YXlzIGxpbmVhciB1bnRpbCB0aGUgZmluYWwgcGFzcy5cbmV4cG9ydCBjb25zdCBjb21tb249Lyogd2dzbCAqL2BcbnN0cnVjdCBGcmFtZSB7IGV5ZTp2ZWM0ZiwgcmlnaHQ6dmVjNGYsIHVwOnZlYzRmLCBmb3J3YXJkOnZlYzRmLCB2aWV3cG9ydDp2ZWM0ZiwgY29udHJvbHM6dmVjNGYsIHN1bjp2ZWM0ZiB9XG5AZ3JvdXAoMCkgQGJpbmRpbmcoMCkgdmFyPHVuaWZvcm0+IGY6RnJhbWU7XG5mbiBwcm9qZWN0aW9uKHA6dmVjM2YpLT52ZWM0ZiB7XG4gbGV0IHE9cC1mLmV5ZS54eXo7bGV0IHo9ZG90KHEsZi5mb3J3YXJkLnh5eik7bGV0IG5lYXI9Zi5mb3J3YXJkLnc7bGV0IGZhcj1mLmNvbnRyb2xzLnc7XG4gcmV0dXJuIHZlYzRmKGRvdChxLGYucmlnaHQueHl6KS8oZi51cC53KmYucmlnaHQudyksZG90KHEsZi51cC54eXopL2YudXAudyxmYXIvKGZhci1uZWFyKSp6LWZhcipuZWFyLyhmYXItbmVhcikseik7XG59XG5mbiBjb2MoejpmMzIpLT5mMzIge3JldHVybiBtaW4oNDguLGYudmlld3BvcnQudyooZi52aWV3cG9ydC55LygyLipmLnVwLncpKSphYnMoei1mLmV5ZS53KS8obWF4KHosLjA1KSpmLmV5ZS53KSk7fVxuZm4gYnJlZXplKHA6dmVjM2YsYW1vdW50OmYzMixwaGFzZTpmMzIpLT52ZWMzZiB7XG4gbGV0IHQ9Zi52aWV3cG9ydC56O3JldHVybiBwK3ZlYzNmKHNpbih0KjEuMStwLnoqLjYxK3BoYXNlKSphbW91bnQsMCxjb3ModCouODErcC54Ki42NStwaGFzZSkqYW1vdW50Ki4zOCkqZi5jb250cm9scy54O1xufVxuZm4gcGxhbnRNb3Rpb24ocDp2ZWMzZiktPnZlYzNmIHtyZXR1cm4gYnJlZXplKHAscG93KG1heChwLnksMC4pLzEuNjYsMS43KSouMDIxLDAuKTt9XG5mbiBoYXNoKHA6dmVjMmYpLT5mMzJ7cmV0dXJuIGZyYWN0KHNpbihkb3QocCx2ZWMyZigxMjcuMSwzMTEuNykpKSo0Mzc1OC41NDUzKTt9XG5mbiBub2lzZShwOnZlYzJmKS0+ZjMyIHtsZXQgaT1mbG9vcihwKTtsZXQgeD1mcmFjdChwKTtsZXQgdT14KngqKDMuLTIuKngpO3JldHVybiBtaXgobWl4KGhhc2goaSksaGFzaChpK3ZlYzJmKDEsMCkpLHUueCksbWl4KGhhc2goaSt2ZWMyZigwLDEpKSxoYXNoKGkrdmVjMmYoMSwxKSksdS54KSx1LnkpO31cbnN0cnVjdCBGdWxsIHsgQGJ1aWx0aW4ocG9zaXRpb24pIHA6dmVjNGYsQGxvY2F0aW9uKDApIHV2OnZlYzJmIH1cbkB2ZXJ0ZXggZm4gZnVsbChAYnVpbHRpbih2ZXJ0ZXhfaW5kZXgpIGk6dTMyKS0+RnVsbCB7dmFyIHA9YXJyYXk8dmVjMmYsMz4odmVjMmYoLTEsLTEpLHZlYzJmKDMsLTEpLHZlYzJmKC0xLDMpKTt2YXIgbzpGdWxsO28ucD12ZWM0ZihwW2ldLDAsMSk7by51dj1wW2ldKnZlYzJmKC41LC0uNSkrLjU7cmV0dXJuIG87fVxuYDtcbmV4cG9ydCBjb25zdCBlbnZpcm9ubWVudD1jb21tb24rLyogd2dzbCAqL2BcbnN0cnVjdCBNZXNoSW4geyBAbG9jYXRpb24oMCkgcDp2ZWMzZixAbG9jYXRpb24oMSkgbjp2ZWMzZixAbG9jYXRpb24oMikgY29sb3I6dmVjM2YsQGxvY2F0aW9uKDMpIGF0dHJpYnV0ZXM6dmVjM2YgfVxuc3RydWN0IE1lc2hPdXQgeyBAYnVpbHRpbihwb3NpdGlvbikgcDp2ZWM0ZixAbG9jYXRpb24oMCkgd29ybGQ6dmVjM2YsQGxvY2F0aW9uKDEpIG46dmVjM2YsQGxvY2F0aW9uKDIpIGNvbG9yOnZlYzNmLEBsb2NhdGlvbigzKSBraW5kOmYzMiB9XG5zdHJ1Y3QgQ29sb3JEZXB0aCB7IEBsb2NhdGlvbigwKSBjb2xvcjp2ZWM0ZixAbG9jYXRpb24oMSkgZGVwdGg6ZjMyIH1cbkB2ZXJ0ZXggZm4gbWVzaFZzKHY6TWVzaEluKS0+TWVzaE91dCB7XG4gdmFyIHA9di5wO2lmKHYuYXR0cmlidXRlcy54PT0xLil7cD1wbGFudE1vdGlvbihwKTt9ZWxzZSBpZih2LmF0dHJpYnV0ZXMueD09Mi4pe3A9YnJlZXplKHAsdi5hdHRyaWJ1dGVzLnksdi5hdHRyaWJ1dGVzLnopO31cbiB2YXIgbzpNZXNoT3V0O28ucD1wcm9qZWN0aW9uKHApO28ud29ybGQ9cDtvLm49di5uO28uY29sb3I9di5jb2xvcjtvLmtpbmQ9di5hdHRyaWJ1dGVzLng7cmV0dXJuIG87XG59XG5AZnJhZ21lbnQgZm4gbWVzaEZzKHY6TWVzaE91dCktPkNvbG9yRGVwdGgge1xuIGxldCBuPW5vcm1hbGl6ZSh2Lm4pO2xldCBsaWdodD1ub3JtYWxpemUoZi5zdW4ueHl6KTtsZXQgZGlmZnVzZT1tYXgoZG90KG4sbGlnaHQpLDAuKTtcbiBsZXQgdHJhbnNtaXNzaW9uPXBvdyhtYXgoZG90KC1uLGxpZ2h0KSwwLiksMS41KSpzZWxlY3QoLjAsLjUyLHYua2luZD09Mi4pO1xuIGxldCBkZXRhaWw9bm9pc2Uodi53b3JsZC54eio4MC4rdi53b3JsZC55eSoyNi4pO1xuIHZhciBjPXYuY29sb3IqKC4zNStkaWZmdXNlKi45NSt0cmFuc21pc3Npb24pO1xuIGlmKHYua2luZD09MS4pe2MqPS43OCsuNDIqZGV0YWlsOyBjKz12ZWMzZiguMTYsLjEyLC4wNTUpKnBvdyhtYXgoZG90KHJlZmxlY3QoLWxpZ2h0LG4pLG5vcm1hbGl6ZShmLmV5ZS54eXotdi53b3JsZCkpLDAuKSwyMi4pO31cbiBsZXQgej1kb3Qodi53b3JsZC1mLmV5ZS54eXosZi5mb3J3YXJkLnh5eik7Yz1taXgoYyx2ZWMzZiguNDIsLjYxLC42MyksMS4tZXhwKC16Ki4wMDMpKTtcbiB2YXIgbzpDb2xvckRlcHRoO28uY29sb3I9dmVjNGYoYywxKTtvLmRlcHRoPXo7cmV0dXJuIG87XG59XG5AZnJhZ21lbnQgZm4gc2t5KHY6RnVsbCktPkNvbG9yRGVwdGgge1xuIGxldCByYXk9bm9ybWFsaXplKGYuZm9yd2FyZC54eXorKHYudXYueCoyLi0xLikqZi5yaWdodC54eXoqZi5yaWdodC53KmYudXAudysoMS4tdi51di55KjIuKSpmLnVwLnh5eipmLnVwLncpO1xuIGxldCBoPWNsYW1wKHJheS55KjEuNysuMjIsMC4sMS4pO3ZhciBjPW1peCh2ZWMzZiguMTIsLjQ2LC43MCksdmVjM2YoLjAwNCwuMjMsLjYxKSxoKTtcbiBsZXQgcD12ZWMyZihyYXkueC9tYXgoLjEyLHJheS55Ky4yOCkscmF5LnovbWF4KC4xMixyYXkueSsuMjgpKSoxLjM7XG4gbGV0IGNsb3VkPW5vaXNlKHApKi41OCtub2lzZShwKjIuMSkqLjI2K25vaXNlKHAqNC4zKSouMTE7XG4gbGV0IGNvdmVyYWdlPXNtb290aHN0ZXAoLjU2LC43MixjbG91ZCkqc21vb3Roc3RlcCgtLjA1LC4yNSxyYXkueSk7XG4gYz1taXgoYyx2ZWMzZiguOTIsLjk3LDEuKSxjb3ZlcmFnZSouNzgpO1xuIGMrPXZlYzNmKC4xNCwuMTEsLjA2KSpwb3cobWF4KGRvdChyYXksbm9ybWFsaXplKHZlYzNmKC0uNiwuOCwuNykpKSwwLiksMTguKTtcbiB2YXIgbzpDb2xvckRlcHRoO28uY29sb3I9dmVjNGYoYywxKTtvLmRlcHRoPTkwLjtyZXR1cm4gbztcbn1cbmA7XG5leHBvcnQgY29uc3QgbGVucz1jb21tb24rLyogd2dzbCAqL2BcbkBncm91cCgwKSBAYmluZGluZygxKSB2YXIgaW1hZ2U6dGV4dHVyZV8yZDxmMzI+O1xuQGdyb3VwKDApIEBiaW5kaW5nKDIpIHZhciBkZXB0aHM6dGV4dHVyZV8yZDxmMzI+O1xuQGdyb3VwKDApIEBiaW5kaW5nKDMpIHZhciBsaW5lYXJTYW1wbGVyOnNhbXBsZXI7XG5AZnJhZ21lbnQgZm4gYmx1cih2OkZ1bGwpLT5AbG9jYXRpb24oMCkgdmVjNGYge1xuIGxldCB4eT12ZWMyaSh2LnAueHkpO2xldCB6PXRleHR1cmVMb2FkKGRlcHRocyx4eSwwKS5yO2xldCByYWRpdXM9Y29jKHopO1xuIGlmKHJhZGl1czwuNyl7cmV0dXJuIHRleHR1cmVMb2FkKGltYWdlLHh5LDApO31cbiB2YXIgY29sb3I9dmVjM2YoMCk7dmFyIHRvdGFsPTAuO1xuIGZvcih2YXIgaT0wO2k8NDg7aSsrKXtcbiAgIGxldCByPXNxcnQoKGYzMihpKSsuNSkvNDguKSpyYWRpdXM7bGV0IGFuZ2xlPWYzMihpKSoyLjM5OTk2MzIzO1xuICAgbGV0IG9mZnNldD12ZWMyZihjb3MoYW5nbGUpLHNpbihhbmdsZSkpKnI7XG4gICBsZXQgdXY9Y2xhbXAodi51ditvZmZzZXQvZi52aWV3cG9ydC54eSx2ZWMyZigwKSx2ZWMyZiguOTk5OTk5KSk7XG4gICBsZXQgb3RoZXI9dGV4dHVyZUxvYWQoZGVwdGhzLHZlYzJpKHV2KmYudmlld3BvcnQueHkpLDApLnI7XG4gICAvLyBGb3JlZ3JvdW5kIHN1cmZhY2VzIHJldGFpbiB0aGVpciBzaWxob3VldHRlOyBubyBiYWNrZ3JvdW5kIGdhdGhlcmluZyBhY3Jvc3MgYW4gaW4tZm9jdXMgc3RlbS5cbiAgIGxldCB3ZWlnaHQ9c2VsZWN0KC4wMywxLixvdGhlcj49eiouODUgfHwgY29jKG90aGVyKT5yKi44KTtcbiAgIGNvbG9yKz10ZXh0dXJlU2FtcGxlTGV2ZWwoaW1hZ2UsbGluZWFyU2FtcGxlcix1diwwKS5yZ2Iqd2VpZ2h0O3RvdGFsKz13ZWlnaHQ7XG4gfVxuIHJldHVybiB2ZWM0Zihjb2xvci9tYXgodG90YWwsLjAwMSksMSk7XG59XG5gO1xuZXhwb3J0IGNvbnN0IGZpYmVyPWNvbW1vbisvKiB3Z3NsICovYFxuc3RydWN0IFN0cmFuZCB7IGE6dmVjNGYsYjp2ZWM0Zixjb2xvcjp2ZWM0ZixhdHRyaWJ1dGVzOnZlYzRmIH1cbkBncm91cCgwKSBAYmluZGluZygxKSB2YXI8c3RvcmFnZSxyZWFkPiBzdHJhbmRzOmFycmF5PFN0cmFuZD47XG5AZ3JvdXAoMCkgQGJpbmRpbmcoMikgdmFyIGRlcHRoczp0ZXh0dXJlXzJkPGYzMj47XG5zdHJ1Y3QgTGluZU91dCB7IEBidWlsdGluKHBvc2l0aW9uKSBwOnZlYzRmLEBsb2NhdGlvbigwKSB1djp2ZWMyZixAbG9jYXRpb24oMSkgY29sb3I6dmVjNGYsQGxvY2F0aW9uKDIpIG1ldHJpY3M6dmVjNGYgfVxuZm4gc2VlZE1vdGlvbihwOnZlYzNmLGlkOmYzMiktPnZlYzNmIHtcbiB2YXIgcT1wbGFudE1vdGlvbihwKTtsZXQgZmx5aW5nPWZyYWN0KGlkKi42MTgwMzM5ODg3NSk+Ljk0O1xuIGlmKGZseWluZyYmZi5jb250cm9scy55Pj0wLil7XG4gICBsZXQgdD1tYXgoMC4sZi52aWV3cG9ydC56LWYuY29udHJvbHMueS1mcmFjdChpZCouMzcxKSoxLjIpO2xldCBrPW1pbih0LDE0Lik7XG4gICBxKz12ZWMzZihrKi4yMytrKmsqLjAxOCxrKi4xMytzaW4oayoxLjkraWQpKm1pbiguMDQsayouMDIpLC1rKi4wOStzaW4oayouOCkqayouMDI1KTtcbiB9XG4gcmV0dXJuIHE7XG59XG5AdmVydGV4IGZuIGxpbmVWcyhAYnVpbHRpbih2ZXJ0ZXhfaW5kZXgpIHZpOnUzMixAYnVpbHRpbihpbnN0YW5jZV9pbmRleCkgaWk6dTMyKS0+TGluZU91dCB7XG4gbGV0IHM9c3RyYW5kc1tpaV07bGV0IGE9c2VlZE1vdGlvbihzLmEueHl6LHMuYXR0cmlidXRlcy54KTtsZXQgYj1zZWVkTW90aW9uKHMuYi54eXoscy5hdHRyaWJ1dGVzLngpO1xuIGxldCBjYT1wcm9qZWN0aW9uKGEpO2xldCBjYj1wcm9qZWN0aW9uKGIpO2xldCB6PShjYS53K2NiLncpKi41O1xuIGxldCBwYT1jYS54eS9jYS53KmYudmlld3BvcnQueHkqLjU7bGV0IHBiPWNiLnh5L2NiLncqZi52aWV3cG9ydC54eSouNTtcbiBsZXQgZGlyZWN0aW9uPW5vcm1hbGl6ZShwYi1wYSt2ZWMyZiguMDAwMDAxLDApKTtsZXQgbm9ybWFsPXZlYzJmKC1kaXJlY3Rpb24ueSxkaXJlY3Rpb24ueCk7XG4gbGV0IHBoeXNpY2FsPXMuYS53KihmLnZpZXdwb3J0LnkvKDIuKmYudXAudykpL21heCh6LC4wNSk7XG4gbGV0IGJsdXI9Y29jKHopKi41O2xldCByYWRpdXM9c3FydChtYXgocGh5c2ljYWwsLjQ1KSptYXgocGh5c2ljYWwsLjQ1KStibHVyKmJsdXIpO1xuIHZhciBjb3JuZXJzPWFycmF5PHZlYzJmLDY+KHZlYzJmKDAsLTEpLHZlYzJmKDEsLTEpLHZlYzJmKDAsMSksdmVjMmYoMCwxKSx2ZWMyZigxLC0xKSx2ZWMyZigxLDEpKTtcbiBsZXQgY29ybmVyPWNvcm5lcnNbdmldO3ZhciBjbGlwPW1peChjYSxjYixjb3JuZXIueCk7XG4gbGV0IGV4dGVuc2lvbj1kaXJlY3Rpb24qKGNvcm5lci54KjIuLTEuKSpyYWRpdXM7XG4gY2xpcC54Kz0obm9ybWFsLngqY29ybmVyLnkqcmFkaXVzKjIuK2V4dGVuc2lvbi54KSoyLi9mLnZpZXdwb3J0LngqY2xpcC53O1xuIGNsaXAueSs9KG5vcm1hbC55KmNvcm5lci55KnJhZGl1cyoyLitleHRlbnNpb24ueSkqMi4vZi52aWV3cG9ydC55KmNsaXAudztcbiBsZXQgdGFuZ2VudD1ub3JtYWxpemUoYi1hKTtsZXQgbD1ub3JtYWxpemUoZi5zdW4ueHl6KTtsZXQgdmlldz1ub3JtYWxpemUoZi5leWUueHl6LShhK2IpKi41KTtcbiBsZXQgZmliZXJTcGVjPXBvdyhzcXJ0KG1heCgwLiwxLi1wb3coZG90KHRhbmdlbnQsbm9ybWFsaXplKGwrdmlldykpLDIuKSkpLDE0Lik7XG4gbGV0IHNjYXR0ZXI9cG93KG1heChkb3QoLXZpZXcsbCksMC4pLDMuKTtcbiBsZXQgc2hlbGw9bm9ybWFsaXplKChhK2IpKi41LXZlYzNmKC0uMDM1LDEuNjYsMCkpO1xuIGxldCBzaGFkZT0uNDgrbWF4KGRvdChzaGVsbCxsKSwwLikqLjQ2K2ZpYmVyU3BlYyouNStzY2F0dGVyKi40O1xuIHZhciBvOkxpbmVPdXQ7by5wPWNsaXA7by51dj12ZWMyZihjb3JuZXIueCxjb3JuZXIueSoyLik7XG4gby5jb2xvcj12ZWM0ZihzLmNvbG9yLnJnYipzaGFkZSxzLmNvbG9yLmEqbWluKDEuLHBoeXNpY2FsLy40NSkqbWF4KHBoeXNpY2FsLC40NSkvcmFkaXVzKTtcbiBvLm1ldHJpY3M9dmVjNGYoeixsZW5ndGgocGItcGEpLHJhZGl1cyxzLmIudyk7cmV0dXJuIG87XG59XG5zdHJ1Y3QgQWNjdW0geyBAbG9jYXRpb24oMCkgY29sb3I6dmVjNGYsQGxvY2F0aW9uKDEpIHJldmVhbDpmMzIgfVxuQGZyYWdtZW50IGZuIGxpbmVGcyh2OkxpbmVPdXQpLT5BY2N1bSB7XG4gbGV0IG9wYXF1ZT10ZXh0dXJlTG9hZChkZXB0aHMsdmVjMmkodi5wLnh5KSwwKS5yO1xuIGlmKHYubWV0cmljcy54Pm9wYXF1ZSsuMDI1KXtkaXNjYXJkO31cbiBsZXQgYWxvbmc9di51di54Kih2Lm1ldHJpY3MueSsyLip2Lm1ldHJpY3Mueiktdi5tZXRyaWNzLno7XG4gLy8gQXBwcm94aW1hdGUgdGhlIGZpbml0ZSBzZWdtZW50J3MgR2F1c3NpYW4gY29udm9sdXRpb24uIFdpdGhvdXQgdGhpcyBsb25naXR1ZGluYWxcbiAvLyBjb3ZlcmFnZSB0ZXJtLCBkZWZvY3VzZWQgc2hvcnQgc2VnbWVudHMgZ2FpbiBlbmVyZ3kgYW5kIHR1cm4gaW50byBhbiBvcGFxdWUgd2hpdGUgYmFsbC5cbiBsZXQgZW5kcz0uNSoodGFuaCgodi5tZXRyaWNzLnktYWxvbmcpL3YubWV0cmljcy56KjEuNyktdGFuaCgtYWxvbmcvdi5tZXRyaWNzLnoqMS43KSk7XG4gbGV0IGFscGhhPWNsYW1wKHYuY29sb3IuYSpleHAoLTIuKnYudXYueSp2LnV2LnkpKmVuZHMsMC4sLjk0KTtcbiBpZihhbHBoYTwuMDAyKXtkaXNjYXJkO31cbiBsZXQgd2VpZ2h0PWNsYW1wKDMuLyguMit2Lm1ldHJpY3MueCouMDUpLC4xLDEwLik7XG4gdmFyIG86QWNjdW07by5jb2xvcj12ZWM0Zih2LmNvbG9yLnJnYiphbHBoYSp3ZWlnaHQsYWxwaGEqd2VpZ2h0KTtvLnJldmVhbD1hbHBoYTtyZXR1cm4gbztcbn1cbmA7XG5leHBvcnQgY29uc3QgY29tcG9zaXRlPWNvbW1vbisvKiB3Z3NsICovYFxuQGdyb3VwKDApIEBiaW5kaW5nKDEpIHZhciBiYWNrZHJvcDp0ZXh0dXJlXzJkPGYzMj47XG5AZ3JvdXAoMCkgQGJpbmRpbmcoMikgdmFyIGFjY3VtdWxhdGlvbjp0ZXh0dXJlXzJkPGYzMj47XG5AZ3JvdXAoMCkgQGJpbmRpbmcoMykgdmFyIHJldmVhbGFnZTp0ZXh0dXJlXzJkPGYzMj47XG5mbiBzcmdiKHY6dmVjM2YpLT52ZWMzZntyZXR1cm4gc2VsZWN0KDEyLjkyKnYsMS4wNTUqcG93KG1heCh2LHZlYzNmKDApKSx2ZWMzZigxLi8yLjQpKS0uMDU1LHY+dmVjM2YoLjAwMzEzMDgpKTt9XG5AZnJhZ21lbnQgZm4gY29tcG9zZUZzKHY6RnVsbCktPkBsb2NhdGlvbigwKSB2ZWM0ZiB7XG4gbGV0IHh5PXZlYzJpKHYucC54eSk7bGV0IGJnPXRleHR1cmVMb2FkKGJhY2tkcm9wLHh5LDApLnJnYjtsZXQgYT10ZXh0dXJlTG9hZChhY2N1bXVsYXRpb24seHksMCk7bGV0IGNvdmVyYWdlPTEuLXRleHR1cmVMb2FkKHJldmVhbGFnZSx4eSwwKS5yO1xuIHZhciBjPW1peChiZyxhLnJnYi9tYXgoYS5hLC4wMDAwMSksY292ZXJhZ2UpKmYuY29udHJvbHMuejtcbiAvLyBHZW50bGUgcGhvdG9ncmFwaGljIHNob3VsZGVyLCByZXRhaW5pbmcgd2hpdGUgZmlsYW1lbnRzIHdpdGhvdXQgYSBibG9vbSB2ZWlsLlxuIGM9Yy8oMS4rYyouMik7Yyo9MS4tLjEzKnBvdyhsZW5ndGgoKHYudXYtLjUpKnZlYzJmKC45LDEuKSksMi4pO1xuIHJldHVybiB2ZWM0ZihzcmdiKGMpLDEpO1xufVxuYDtcbiJdfQ==