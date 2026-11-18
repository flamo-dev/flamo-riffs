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
struct MeshIn { @location(0) p:vec3f,@location(1) n:vec3f,@location(2) color:vec3f,@location(3) meta:vec3f }
struct MeshOut { @builtin(position) p:vec4f,@location(0) world:vec3f,@location(1) n:vec3f,@location(2) color:vec3f,@location(3) kind:f32 }
struct ColorDepth { @location(0) color:vec4f,@location(1) depth:f32 }
@vertex fn meshVs(v:MeshIn)->MeshOut {
 var p=v.p;if(v.meta.x==1.){p=plantMotion(p);}else if(v.meta.x==2.){p=breeze(p,v.meta.y,v.meta.z);}
 var o:MeshOut;o.p=projection(p);o.world=p;o.n=v.n;o.color=v.color;o.kind=v.meta.x;return o;
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
 let h=clamp(ray.y*1.7+.22,0.,1.);var c=mix(vec3f(.53,.75,.83),vec3f(.015,.32,.66),h);
 let p=vec2f(ray.x/max(.12,ray.y+.28),ray.z/max(.12,ray.y+.28))*1.3;
 let cloud=noise(p)*.58+noise(p*2.1)*.26+noise(p*4.3)*.11;
 let coverage=smoothstep(.48,.68,cloud)*smoothstep(-.05,.25,ray.y);
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
struct Strand { a:vec4f,b:vec4f,color:vec4f,meta:vec4f }
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
 let s=strands[ii];let a=seedMotion(s.a.xyz,s.meta.x);let b=seedMotion(s.b.xyz,s.meta.x);
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
 let alpha=clamp(v.color.a*exp(-2.*v.uv.y*v.uv.y),0.,.94);
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
@fragment fn final(v:Full)->@location(0) vec4f {
 let xy=vec2i(v.p.xy);let bg=textureLoad(backdrop,xy,0).rgb;let a=textureLoad(accumulation,xy,0);let coverage=1.-textureLoad(revealage,xy,0).r;
 var c=mix(bg,a.rgb/max(a.a,.00001),coverage)*f.controls.z;
 // Gentle photographic shoulder, retaining white filaments without a bloom veil.
 c=c/(1.+c*.2);c*=1.-.13*pow(length((v.uv-.5)*vec2f(.9,1.)),2.);
 return vec4f(srgb(c),1);
}
`;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NyaXB0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2NyaXB0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLG1GQUFtRjtBQUNuRixNQUFNLENBQUMsTUFBTSxNQUFNLEdBQUMsVUFBVSxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0NBZ0I3QixDQUFDO0FBQ0YsTUFBTSxDQUFDLE1BQU0sV0FBVyxHQUFDLE1BQU0sR0FBQyxVQUFVLENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQTJCekMsQ0FBQztBQUNGLE1BQU0sQ0FBQyxNQUFNLElBQUksR0FBQyxNQUFNLEdBQUMsVUFBVSxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBbUJsQyxDQUFDO0FBQ0YsTUFBTSxDQUFDLE1BQU0sS0FBSyxHQUFDLE1BQU0sR0FBQyxVQUFVLENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0EyQ25DLENBQUM7QUFDRixNQUFNLENBQUMsTUFBTSxTQUFTLEdBQUMsTUFBTSxHQUFDLFVBQVUsQ0FBQTs7Ozs7Ozs7Ozs7O0NBWXZDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBTY2VuZS1zcGVjaWZpYyBXR1NMLiBBbGwgbGlnaHRpbmcvY29tcG9zaXRpbmcgc3RheXMgbGluZWFyIHVudGlsIHRoZSBmaW5hbCBwYXNzLlxuZXhwb3J0IGNvbnN0IGNvbW1vbj0vKiB3Z3NsICovYFxuc3RydWN0IEZyYW1lIHsgZXllOnZlYzRmLCByaWdodDp2ZWM0ZiwgdXA6dmVjNGYsIGZvcndhcmQ6dmVjNGYsIHZpZXdwb3J0OnZlYzRmLCBjb250cm9sczp2ZWM0Ziwgc3VuOnZlYzRmIH1cbkBncm91cCgwKSBAYmluZGluZygwKSB2YXI8dW5pZm9ybT4gZjpGcmFtZTtcbmZuIHByb2plY3Rpb24ocDp2ZWMzZiktPnZlYzRmIHtcbiBsZXQgcT1wLWYuZXllLnh5ejtsZXQgej1kb3QocSxmLmZvcndhcmQueHl6KTtsZXQgbmVhcj1mLmZvcndhcmQudztsZXQgZmFyPWYuY29udHJvbHMudztcbiByZXR1cm4gdmVjNGYoZG90KHEsZi5yaWdodC54eXopLyhmLnVwLncqZi5yaWdodC53KSxkb3QocSxmLnVwLnh5eikvZi51cC53LGZhci8oZmFyLW5lYXIpKnotZmFyKm5lYXIvKGZhci1uZWFyKSx6KTtcbn1cbmZuIGNvYyh6OmYzMiktPmYzMiB7cmV0dXJuIG1pbig0OC4sZi52aWV3cG9ydC53KihmLnZpZXdwb3J0LnkvKDIuKmYudXAudykpKmFicyh6LWYuZXllLncpLyhtYXgoeiwuMDUpKmYuZXllLncpKTt9XG5mbiBicmVlemUocDp2ZWMzZixhbW91bnQ6ZjMyLHBoYXNlOmYzMiktPnZlYzNmIHtcbiBsZXQgdD1mLnZpZXdwb3J0Lno7cmV0dXJuIHArdmVjM2Yoc2luKHQqMS4xK3AueiouNjErcGhhc2UpKmFtb3VudCwwLGNvcyh0Ki44MStwLngqLjY1K3BoYXNlKSphbW91bnQqLjM4KSpmLmNvbnRyb2xzLng7XG59XG5mbiBwbGFudE1vdGlvbihwOnZlYzNmKS0+dmVjM2Yge3JldHVybiBicmVlemUocCxwb3cobWF4KHAueSwwLikvMS42NiwxLjcpKi4wMjEsMC4pO31cbmZuIGhhc2gocDp2ZWMyZiktPmYzMntyZXR1cm4gZnJhY3Qoc2luKGRvdChwLHZlYzJmKDEyNy4xLDMxMS43KSkpKjQzNzU4LjU0NTMpO31cbmZuIG5vaXNlKHA6dmVjMmYpLT5mMzIge2xldCBpPWZsb29yKHApO2xldCB4PWZyYWN0KHApO2xldCB1PXgqeCooMy4tMi4qeCk7cmV0dXJuIG1peChtaXgoaGFzaChpKSxoYXNoKGkrdmVjMmYoMSwwKSksdS54KSxtaXgoaGFzaChpK3ZlYzJmKDAsMSkpLGhhc2goaSt2ZWMyZigxLDEpKSx1LngpLHUueSk7fVxuc3RydWN0IEZ1bGwgeyBAYnVpbHRpbihwb3NpdGlvbikgcDp2ZWM0ZixAbG9jYXRpb24oMCkgdXY6dmVjMmYgfVxuQHZlcnRleCBmbiBmdWxsKEBidWlsdGluKHZlcnRleF9pbmRleCkgaTp1MzIpLT5GdWxsIHt2YXIgcD1hcnJheTx2ZWMyZiwzPih2ZWMyZigtMSwtMSksdmVjMmYoMywtMSksdmVjMmYoLTEsMykpO3ZhciBvOkZ1bGw7by5wPXZlYzRmKHBbaV0sMCwxKTtvLnV2PXBbaV0qdmVjMmYoLjUsLS41KSsuNTtyZXR1cm4gbzt9XG5gO1xuZXhwb3J0IGNvbnN0IGVudmlyb25tZW50PWNvbW1vbisvKiB3Z3NsICovYFxuc3RydWN0IE1lc2hJbiB7IEBsb2NhdGlvbigwKSBwOnZlYzNmLEBsb2NhdGlvbigxKSBuOnZlYzNmLEBsb2NhdGlvbigyKSBjb2xvcjp2ZWMzZixAbG9jYXRpb24oMykgbWV0YTp2ZWMzZiB9XG5zdHJ1Y3QgTWVzaE91dCB7IEBidWlsdGluKHBvc2l0aW9uKSBwOnZlYzRmLEBsb2NhdGlvbigwKSB3b3JsZDp2ZWMzZixAbG9jYXRpb24oMSkgbjp2ZWMzZixAbG9jYXRpb24oMikgY29sb3I6dmVjM2YsQGxvY2F0aW9uKDMpIGtpbmQ6ZjMyIH1cbnN0cnVjdCBDb2xvckRlcHRoIHsgQGxvY2F0aW9uKDApIGNvbG9yOnZlYzRmLEBsb2NhdGlvbigxKSBkZXB0aDpmMzIgfVxuQHZlcnRleCBmbiBtZXNoVnModjpNZXNoSW4pLT5NZXNoT3V0IHtcbiB2YXIgcD12LnA7aWYodi5tZXRhLng9PTEuKXtwPXBsYW50TW90aW9uKHApO31lbHNlIGlmKHYubWV0YS54PT0yLil7cD1icmVlemUocCx2Lm1ldGEueSx2Lm1ldGEueik7fVxuIHZhciBvOk1lc2hPdXQ7by5wPXByb2plY3Rpb24ocCk7by53b3JsZD1wO28ubj12Lm47by5jb2xvcj12LmNvbG9yO28ua2luZD12Lm1ldGEueDtyZXR1cm4gbztcbn1cbkBmcmFnbWVudCBmbiBtZXNoRnModjpNZXNoT3V0KS0+Q29sb3JEZXB0aCB7XG4gbGV0IG49bm9ybWFsaXplKHYubik7bGV0IGxpZ2h0PW5vcm1hbGl6ZShmLnN1bi54eXopO2xldCBkaWZmdXNlPW1heChkb3QobixsaWdodCksMC4pO1xuIGxldCB0cmFuc21pc3Npb249cG93KG1heChkb3QoLW4sbGlnaHQpLDAuKSwxLjUpKnNlbGVjdCguMCwuNTIsdi5raW5kPT0yLik7XG4gbGV0IGRldGFpbD1ub2lzZSh2LndvcmxkLnh6KjgwLit2LndvcmxkLnl5KjI2Lik7XG4gdmFyIGM9di5jb2xvciooLjM1K2RpZmZ1c2UqLjk1K3RyYW5zbWlzc2lvbik7XG4gaWYodi5raW5kPT0xLil7Yyo9Ljc4Ky40MipkZXRhaWw7IGMrPXZlYzNmKC4xNiwuMTIsLjA1NSkqcG93KG1heChkb3QocmVmbGVjdCgtbGlnaHQsbiksbm9ybWFsaXplKGYuZXllLnh5ei12LndvcmxkKSksMC4pLDIyLik7fVxuIGxldCB6PWRvdCh2LndvcmxkLWYuZXllLnh5eixmLmZvcndhcmQueHl6KTtjPW1peChjLHZlYzNmKC40MiwuNjEsLjYzKSwxLi1leHAoLXoqLjAwMykpO1xuIHZhciBvOkNvbG9yRGVwdGg7by5jb2xvcj12ZWM0ZihjLDEpO28uZGVwdGg9ejtyZXR1cm4gbztcbn1cbkBmcmFnbWVudCBmbiBza3kodjpGdWxsKS0+Q29sb3JEZXB0aCB7XG4gbGV0IHJheT1ub3JtYWxpemUoZi5mb3J3YXJkLnh5eisodi51di54KjIuLTEuKSpmLnJpZ2h0Lnh5eipmLnJpZ2h0LncqZi51cC53KygxLi12LnV2LnkqMi4pKmYudXAueHl6KmYudXAudyk7XG4gbGV0IGg9Y2xhbXAocmF5LnkqMS43Ky4yMiwwLiwxLik7dmFyIGM9bWl4KHZlYzNmKC41MywuNzUsLjgzKSx2ZWMzZiguMDE1LC4zMiwuNjYpLGgpO1xuIGxldCBwPXZlYzJmKHJheS54L21heCguMTIscmF5LnkrLjI4KSxyYXkuei9tYXgoLjEyLHJheS55Ky4yOCkpKjEuMztcbiBsZXQgY2xvdWQ9bm9pc2UocCkqLjU4K25vaXNlKHAqMi4xKSouMjYrbm9pc2UocCo0LjMpKi4xMTtcbiBsZXQgY292ZXJhZ2U9c21vb3Roc3RlcCguNDgsLjY4LGNsb3VkKSpzbW9vdGhzdGVwKC0uMDUsLjI1LHJheS55KTtcbiBjPW1peChjLHZlYzNmKC45MiwuOTcsMS4pLGNvdmVyYWdlKi43OCk7XG4gYys9dmVjM2YoLjE0LC4xMSwuMDYpKnBvdyhtYXgoZG90KHJheSxub3JtYWxpemUodmVjM2YoLS42LC44LC43KSkpLDAuKSwxOC4pO1xuIHZhciBvOkNvbG9yRGVwdGg7by5jb2xvcj12ZWM0ZihjLDEpO28uZGVwdGg9OTAuO3JldHVybiBvO1xufVxuYDtcbmV4cG9ydCBjb25zdCBsZW5zPWNvbW1vbisvKiB3Z3NsICovYFxuQGdyb3VwKDApIEBiaW5kaW5nKDEpIHZhciBpbWFnZTp0ZXh0dXJlXzJkPGYzMj47XG5AZ3JvdXAoMCkgQGJpbmRpbmcoMikgdmFyIGRlcHRoczp0ZXh0dXJlXzJkPGYzMj47XG5AZ3JvdXAoMCkgQGJpbmRpbmcoMykgdmFyIGxpbmVhclNhbXBsZXI6c2FtcGxlcjtcbkBmcmFnbWVudCBmbiBibHVyKHY6RnVsbCktPkBsb2NhdGlvbigwKSB2ZWM0ZiB7XG4gbGV0IHh5PXZlYzJpKHYucC54eSk7bGV0IHo9dGV4dHVyZUxvYWQoZGVwdGhzLHh5LDApLnI7bGV0IHJhZGl1cz1jb2Moeik7XG4gaWYocmFkaXVzPC43KXtyZXR1cm4gdGV4dHVyZUxvYWQoaW1hZ2UseHksMCk7fVxuIHZhciBjb2xvcj12ZWMzZigwKTt2YXIgdG90YWw9MC47XG4gZm9yKHZhciBpPTA7aTw0ODtpKyspe1xuICAgbGV0IHI9c3FydCgoZjMyKGkpKy41KS80OC4pKnJhZGl1cztsZXQgYW5nbGU9ZjMyKGkpKjIuMzk5OTYzMjM7XG4gICBsZXQgb2Zmc2V0PXZlYzJmKGNvcyhhbmdsZSksc2luKGFuZ2xlKSkqcjtcbiAgIGxldCB1dj1jbGFtcCh2LnV2K29mZnNldC9mLnZpZXdwb3J0Lnh5LHZlYzJmKDApLHZlYzJmKC45OTk5OTkpKTtcbiAgIGxldCBvdGhlcj10ZXh0dXJlTG9hZChkZXB0aHMsdmVjMmkodXYqZi52aWV3cG9ydC54eSksMCkucjtcbiAgIC8vIEZvcmVncm91bmQgc3VyZmFjZXMgcmV0YWluIHRoZWlyIHNpbGhvdWV0dGU7IG5vIGJhY2tncm91bmQgZ2F0aGVyaW5nIGFjcm9zcyBhbiBpbi1mb2N1cyBzdGVtLlxuICAgbGV0IHdlaWdodD1zZWxlY3QoLjAzLDEuLG90aGVyPj16Ki44NSB8fCBjb2Mob3RoZXIpPnIqLjgpO1xuICAgY29sb3IrPXRleHR1cmVTYW1wbGVMZXZlbChpbWFnZSxsaW5lYXJTYW1wbGVyLHV2LDApLnJnYip3ZWlnaHQ7dG90YWwrPXdlaWdodDtcbiB9XG4gcmV0dXJuIHZlYzRmKGNvbG9yL21heCh0b3RhbCwuMDAxKSwxKTtcbn1cbmA7XG5leHBvcnQgY29uc3QgZmliZXI9Y29tbW9uKy8qIHdnc2wgKi9gXG5zdHJ1Y3QgU3RyYW5kIHsgYTp2ZWM0ZixiOnZlYzRmLGNvbG9yOnZlYzRmLG1ldGE6dmVjNGYgfVxuQGdyb3VwKDApIEBiaW5kaW5nKDEpIHZhcjxzdG9yYWdlLHJlYWQ+IHN0cmFuZHM6YXJyYXk8U3RyYW5kPjtcbkBncm91cCgwKSBAYmluZGluZygyKSB2YXIgZGVwdGhzOnRleHR1cmVfMmQ8ZjMyPjtcbnN0cnVjdCBMaW5lT3V0IHsgQGJ1aWx0aW4ocG9zaXRpb24pIHA6dmVjNGYsQGxvY2F0aW9uKDApIHV2OnZlYzJmLEBsb2NhdGlvbigxKSBjb2xvcjp2ZWM0ZixAbG9jYXRpb24oMikgbWV0cmljczp2ZWM0ZiB9XG5mbiBzZWVkTW90aW9uKHA6dmVjM2YsaWQ6ZjMyKS0+dmVjM2Yge1xuIHZhciBxPXBsYW50TW90aW9uKHApO2xldCBmbHlpbmc9ZnJhY3QoaWQqLjYxODAzMzk4ODc1KT4uOTQ7XG4gaWYoZmx5aW5nJiZmLmNvbnRyb2xzLnk+PTAuKXtcbiAgIGxldCB0PW1heCgwLixmLnZpZXdwb3J0LnotZi5jb250cm9scy55LWZyYWN0KGlkKi4zNzEpKjEuMik7bGV0IGs9bWluKHQsMTQuKTtcbiAgIHErPXZlYzNmKGsqLjIzK2sqayouMDE4LGsqLjEzK3NpbihrKjEuOStpZCkqbWluKC4wNCxrKi4wMiksLWsqLjA5K3NpbihrKi44KSprKi4wMjUpO1xuIH1cbiByZXR1cm4gcTtcbn1cbkB2ZXJ0ZXggZm4gbGluZVZzKEBidWlsdGluKHZlcnRleF9pbmRleCkgdmk6dTMyLEBidWlsdGluKGluc3RhbmNlX2luZGV4KSBpaTp1MzIpLT5MaW5lT3V0IHtcbiBsZXQgcz1zdHJhbmRzW2lpXTtsZXQgYT1zZWVkTW90aW9uKHMuYS54eXoscy5tZXRhLngpO2xldCBiPXNlZWRNb3Rpb24ocy5iLnh5eixzLm1ldGEueCk7XG4gbGV0IGNhPXByb2plY3Rpb24oYSk7bGV0IGNiPXByb2plY3Rpb24oYik7bGV0IHo9KGNhLncrY2IudykqLjU7XG4gbGV0IHBhPWNhLnh5L2NhLncqZi52aWV3cG9ydC54eSouNTtsZXQgcGI9Y2IueHkvY2IudypmLnZpZXdwb3J0Lnh5Ki41O1xuIGxldCBkaXJlY3Rpb249bm9ybWFsaXplKHBiLXBhK3ZlYzJmKC4wMDAwMDEsMCkpO2xldCBub3JtYWw9dmVjMmYoLWRpcmVjdGlvbi55LGRpcmVjdGlvbi54KTtcbiBsZXQgcGh5c2ljYWw9cy5hLncqKGYudmlld3BvcnQueS8oMi4qZi51cC53KSkvbWF4KHosLjA1KTtcbiBsZXQgYmx1cj1jb2MoeikqLjU7bGV0IHJhZGl1cz1zcXJ0KG1heChwaHlzaWNhbCwuNDUpKm1heChwaHlzaWNhbCwuNDUpK2JsdXIqYmx1cik7XG4gdmFyIGNvcm5lcnM9YXJyYXk8dmVjMmYsNj4odmVjMmYoMCwtMSksdmVjMmYoMSwtMSksdmVjMmYoMCwxKSx2ZWMyZigwLDEpLHZlYzJmKDEsLTEpLHZlYzJmKDEsMSkpO1xuIGxldCBjb3JuZXI9Y29ybmVyc1t2aV07dmFyIGNsaXA9bWl4KGNhLGNiLGNvcm5lci54KTtcbiBsZXQgZXh0ZW5zaW9uPWRpcmVjdGlvbiooY29ybmVyLngqMi4tMS4pKnJhZGl1cztcbiBjbGlwLngrPShub3JtYWwueCpjb3JuZXIueSpyYWRpdXMqMi4rZXh0ZW5zaW9uLngpKjIuL2Yudmlld3BvcnQueCpjbGlwLnc7XG4gY2xpcC55Kz0obm9ybWFsLnkqY29ybmVyLnkqcmFkaXVzKjIuK2V4dGVuc2lvbi55KSoyLi9mLnZpZXdwb3J0LnkqY2xpcC53O1xuIGxldCB0YW5nZW50PW5vcm1hbGl6ZShiLWEpO2xldCBsPW5vcm1hbGl6ZShmLnN1bi54eXopO2xldCB2aWV3PW5vcm1hbGl6ZShmLmV5ZS54eXotKGErYikqLjUpO1xuIGxldCBmaWJlclNwZWM9cG93KHNxcnQobWF4KDAuLDEuLXBvdyhkb3QodGFuZ2VudCxub3JtYWxpemUobCt2aWV3KSksMi4pKSksMTQuKTtcbiBsZXQgc2NhdHRlcj1wb3cobWF4KGRvdCgtdmlldyxsKSwwLiksMy4pO1xuIGxldCBzaGVsbD1ub3JtYWxpemUoKGErYikqLjUtdmVjM2YoLS4wMzUsMS42NiwwKSk7XG4gbGV0IHNoYWRlPS40OCttYXgoZG90KHNoZWxsLGwpLDAuKSouNDYrZmliZXJTcGVjKi41K3NjYXR0ZXIqLjQ7XG4gdmFyIG86TGluZU91dDtvLnA9Y2xpcDtvLnV2PXZlYzJmKGNvcm5lci54LGNvcm5lci55KjIuKTtcbiBvLmNvbG9yPXZlYzRmKHMuY29sb3IucmdiKnNoYWRlLHMuY29sb3IuYSptaW4oMS4scGh5c2ljYWwvLjQ1KSptYXgocGh5c2ljYWwsLjQ1KS9yYWRpdXMpO1xuIG8ubWV0cmljcz12ZWM0Zih6LGxlbmd0aChwYi1wYSkscmFkaXVzLHMuYi53KTtyZXR1cm4gbztcbn1cbnN0cnVjdCBBY2N1bSB7IEBsb2NhdGlvbigwKSBjb2xvcjp2ZWM0ZixAbG9jYXRpb24oMSkgcmV2ZWFsOmYzMiB9XG5AZnJhZ21lbnQgZm4gbGluZUZzKHY6TGluZU91dCktPkFjY3VtIHtcbiBsZXQgb3BhcXVlPXRleHR1cmVMb2FkKGRlcHRocyx2ZWMyaSh2LnAueHkpLDApLnI7XG4gaWYodi5tZXRyaWNzLng+b3BhcXVlKy4wMjUpe2Rpc2NhcmQ7fVxuIGxldCBhbHBoYT1jbGFtcCh2LmNvbG9yLmEqZXhwKC0yLip2LnV2Lnkqdi51di55KSwwLiwuOTQpO1xuIGlmKGFscGhhPC4wMDIpe2Rpc2NhcmQ7fVxuIGxldCB3ZWlnaHQ9Y2xhbXAoMy4vKC4yK3YubWV0cmljcy54Ki4wNSksLjEsMTAuKTtcbiB2YXIgbzpBY2N1bTtvLmNvbG9yPXZlYzRmKHYuY29sb3IucmdiKmFscGhhKndlaWdodCxhbHBoYSp3ZWlnaHQpO28ucmV2ZWFsPWFscGhhO3JldHVybiBvO1xufVxuYDtcbmV4cG9ydCBjb25zdCBjb21wb3NpdGU9Y29tbW9uKy8qIHdnc2wgKi9gXG5AZ3JvdXAoMCkgQGJpbmRpbmcoMSkgdmFyIGJhY2tkcm9wOnRleHR1cmVfMmQ8ZjMyPjtcbkBncm91cCgwKSBAYmluZGluZygyKSB2YXIgYWNjdW11bGF0aW9uOnRleHR1cmVfMmQ8ZjMyPjtcbkBncm91cCgwKSBAYmluZGluZygzKSB2YXIgcmV2ZWFsYWdlOnRleHR1cmVfMmQ8ZjMyPjtcbmZuIHNyZ2Iodjp2ZWMzZiktPnZlYzNme3JldHVybiBzZWxlY3QoMTIuOTIqdiwxLjA1NSpwb3cobWF4KHYsdmVjM2YoMCkpLHZlYzNmKDEuLzIuNCkpLS4wNTUsdj52ZWMzZiguMDAzMTMwOCkpO31cbkBmcmFnbWVudCBmbiBmaW5hbCh2OkZ1bGwpLT5AbG9jYXRpb24oMCkgdmVjNGYge1xuIGxldCB4eT12ZWMyaSh2LnAueHkpO2xldCBiZz10ZXh0dXJlTG9hZChiYWNrZHJvcCx4eSwwKS5yZ2I7bGV0IGE9dGV4dHVyZUxvYWQoYWNjdW11bGF0aW9uLHh5LDApO2xldCBjb3ZlcmFnZT0xLi10ZXh0dXJlTG9hZChyZXZlYWxhZ2UseHksMCkucjtcbiB2YXIgYz1taXgoYmcsYS5yZ2IvbWF4KGEuYSwuMDAwMDEpLGNvdmVyYWdlKSpmLmNvbnRyb2xzLno7XG4gLy8gR2VudGxlIHBob3RvZ3JhcGhpYyBzaG91bGRlciwgcmV0YWluaW5nIHdoaXRlIGZpbGFtZW50cyB3aXRob3V0IGEgYmxvb20gdmVpbC5cbiBjPWMvKDEuK2MqLjIpO2MqPTEuLS4xMypwb3cobGVuZ3RoKCh2LnV2LS41KSp2ZWMyZiguOSwxLikpLDIuKTtcbiByZXR1cm4gdmVjNGYoc3JnYihjKSwxKTtcbn1cbmA7XG4iXX0=