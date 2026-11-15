import type { NodeScriptContext, EntityHandle } from '/vendor/flamo-runtime/index.es.js';
import { reedMaterial, reedMotion } from './reeds';
import { beaconMaterial, beaconMotion } from './beacon';
import { edge, ground, type Run } from './wind';

// The fog is advected at quarter resolution. Each mountain plate is translated as one painting.
const common = `
struct Frame { camera:vec2f, time:f32, seed:f32, air:vec2f, pad:vec2f, beacon:vec4f }
@group(0) @binding(0) var<uniform> f:Frame;
struct Out { @builtin(position) p:vec4f, @location(0) uv:vec2f }
@vertex fn vs(@builtin(vertex_index) i:u32)->Out {
 let p=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));var o:Out;
 o.p=vec4f(p[i],0,1);o.uv=p[i]*vec2f(.5,-.5)+.5;return o;
}
`;
const vapour = common+`
fn hash(p:vec2f)->f32{
 var a=fract(vec3f(p.xyx)*vec3f(.1031,.1030,.0973));a+=dot(a,a.yzx+33.33);
 return fract((a.x+a.y)*a.z);
}
fn noise(p:vec2f)->f32{
 let i=floor(p);let r=fract(p);let u=r*r*(3.-2.*r);
 return mix(mix(hash(i),hash(i+vec2f(1,0)),u.x),mix(hash(i+vec2f(0,1)),hash(i+1.),u.x),u.y);
}
fn fbm(p:vec2f)->f32{
 let q=mat2x2f(.84,.54,-.54,.84);
 let a=q*p*2.08+15.4;let b=q*a*2.03-5.2;let c=q*b*2.12+37.;
 return noise(p)*.52+noise(a)*.26+noise(b)*.14+noise(c)*.08;
}
fn wash(uv:vec2f,depth:f32)->f32{
 let t=f.time;let seed=f.seed+depth*24.;
 let p=uv*vec2f(4.7+depth,10.+depth*2.)+vec2f(seed,seed*.39);
 let adv=f.air*(.58+depth*.50)+vec2f(0.,.016*t);
 let warp=vec2f(fbm(p*.67+adv*.75+vec2f(0.,t*.037)),fbm(p*.61-vec2f(t*.035,11.7)));
 let q=p+adv+1.48*warp;
 let curls=fbm(q+vec2f(0.,.3*sin(t*.18+uv.x*7.)));
 let stream=uv.y-.35-depth*.22+.068*sin(uv.x*6.+t*.08+seed)+.14*(warp.y-.5);
 let belt=exp(-stream*stream/(.006+depth*.004));
 let wisps=smoothstep(.31,.76,curls)*(.76+.24*noise(q*3.2));
 return belt*wisps*(.45+.22*depth);
}
@fragment fn fs(o:Out)->@location(0) vec4f{
 let uv=o.uv;let distant=wash(uv+f.camera*.15,0.12);let middle=wash(uv+f.camera*.45,.84);
 return vec4f(distant,middle,0,1);
}`;
const composite=common+`
@group(0) @binding(1) var distant:texture_2d<f32>;
@group(0) @binding(2) var ridges:texture_2d<f32>;
@group(0) @binding(3) var banks:texture_2d<f32>;
@group(0) @binding(4) var unlitPane:texture_2d<f32>;
@group(0) @binding(5) var washes:texture_2d<f32>;
@group(0) @binding(6) var silk:sampler;
${beaconMaterial}
${reedMaterial}
@fragment fn fs(o:Out)->@location(0) vec4f{
 let uv=o.uv;
 let camera=clamp(f.camera,vec2f(-.020,-.037),vec2f(.065,.031));
 // The inset gives each moving plate enough painted margin at both extremes of travel.
 let farUV=uv*vec2f(.981,.985)+vec2f(.005,.008)+camera*.17;
 let ridgeUV=uv*vec2f(.938,.950)+vec2f(.017,.025)+camera*.64;
 let far=textureSampleLevel(distant,silk,farUV,0).rgb;
 let middle=textureSampleLevel(ridges,silk,ridgeUV,0);
 let shore=paintReeds(uv,textureSampleLevel(banks,silk,uv,0));
 let fog=textureSampleLevel(washes,silk,uv,0).rg;
 let veil=vec3f(.966,.935,.886);
 let behind=mix(far,veil,.80*fog.x);
 let mountain=mix(behind,middle.rgb,middle.a);
 var scene=mix(mix(mountain,veil,.58*fog.y),shore.rgb,shore.a);
 let p=uv*vec2f(1920,1080);
 if(all(abs(p-vec2f(1763,292))<vec2f(220,165))){
   let paneUV=(p-vec2f(1720,262))/vec2f(86,60);
   var pane=textureSampleLevel(unlitPane,silk,paneUV,0);
   if(any(paneUV<vec2f(0.)) || any(paneUV>vec2f(1.))){pane.a=0.;}
   scene=drawBeacon(p,scene,pane);
 }
 return vec4f(scene,1);
}`;
type ArtPool={getBitmap(id:string):Promise<ImageBitmap|OffscreenCanvas|null>};
export function landscape(ctx:NodeScriptContext,layers:EntityHandle[],id:string,seed:number){
  const surface=ctx.createGpuSurface({imageId:id+'-valley',width:1600,height:900,sampling:'linear'});
  let alive=true,node:ReturnType<typeof ctx.scene.create>|undefined;
  async function mount(){
    await surface.ready;if(!alive)return;
    const device=surface.device,pool=ctx.instance.app.getResourcePool().imageRegistry as unknown as ArtPool;
    const papers=await Promise.all(layers.map(layer=>pool.getBitmap(layer.design().media!.assetId)));
    if(!alive)return;
    const pipelines=await Promise.all([vapour,composite].map(code=>{
      const module=device.createShaderModule({code});
      return device.createRenderPipelineAsync({layout:'auto',vertex:{module,entryPoint:'vs'},fragment:{module,entryPoint:'fs',targets:[{format:'rgba8unorm'}]},primitive:{topology:'triangle-list'}});
    }));
    if(!alive)return;
    const views=papers.map((paper,i)=>{
      if(!paper)throw Error('峡谷图层加载失败 '+i);
      const size:[number,number]=[paper.width,paper.height];
      const texture=surface.own(device.createTexture({size,format:'rgba8unorm',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT}));
      device.queue.copyExternalImageToTexture({source:paper},{texture},size);
      // Four scenic plates precede the reed atlas. Bindings 5 and 6 are fog and sampler.
      return {binding:i===4?7:i+1,resource:texture.createView()};
    });
    const fog=surface.own(device.createTexture({label:'山岚 · 两层密度场',size:[400,225],format:'rgba8unorm',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.RENDER_ATTACHMENT}));
    const params=surface.own(device.createBuffer({size:48,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}));
    const reeds=reedMotion();
    const reedParams=surface.own(device.createBuffer({label:'近岸芦苇 · 局部风',size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}));
    const base={binding:0,resource:{buffer:params}},fogView=fog.createView();
    const groups=[device.createBindGroup({layout:pipelines[0].getBindGroupLayout(0),entries:[base]}),
      device.createBindGroup({layout:pipelines[1].getBindGroupLayout(0),entries:[base,...views,{binding:8,resource:{buffer:reedParams}},{binding:5,resource:fogView},{binding:6,resource:device.createSampler({minFilter:'linear',magFilter:'linear'})}]})];
    node=ctx.scene.create('image',{id:id+'-mountains',name:'峡谷 · 分层山峰与山岚',assetId:surface.imageId,size:{width:1920,height:1080},position:{x:0,y:0},fit:'FILL',interactive:false});
    ctx.scene.get(ctx.nodeId)!.prepend(node);
    const flame=beaconMotion();
    let wasLit=false;
    let cx=0,cy=0,previous=-1,driftX=0,driftY=0;
    return (s:Run,dt:number,across:number,up:number)=>{
      const ease=1-Math.exp(-5*dt);
      driftX+=dt*-.085*Math.max(-1.3,Math.min(1.3,across/210));
      driftY+=dt*(-.008-.022*Math.max(-.25,Math.min(1,up/420)));
      cx+=((s.x-edge)*.000045-cx)*ease;cy+=((s.y-ground(edge))*.000049-cy)*ease;
      const sway=reeds(s,dt);
      const fire=flame(s,dt),lit=fire[0]>=0;
      if(s.time-previous<1/28 && wasLit===lit)return;
      previous=s.time;wasLit=lit;
      device.queue.writeBuffer(reedParams,0,sway);
      device.queue.writeBuffer(params,0,new Float32Array([cx,cy,s.time,seed%2931/31,driftX,driftY,0,0,...fire]));
      surface.render(({encoder,color})=>{
        for(let i=0;i<2;i++){
          const pass=encoder.beginRenderPass({colorAttachments:[{view:i?color:fogView,loadOp:'clear',storeOp:'store',clearValue:[0,0,0,1]}]});
          pass.setPipeline(pipelines[i]);pass.setBindGroup(0,groups[i]);pass.draw(3);pass.end();
        }
      });
    };
  }
  return {mount,dispose(){alive=false;node?.remove();surface.dispose();}};
}
