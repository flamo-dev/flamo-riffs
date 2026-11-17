import type { GpuSurface, GpuSurfacePool } from '/vendor/flamo-runtime/index.es.js';
import { createDandelionModel, cameraEye, cameraUniform } from './model';
import { environment, lens, fiber, composite } from './shaders';
import { createSeedFlights } from './wind';
import { createMeadowWind } from './weather';
export interface DandelionState { time:number; yaw:number; pitch:number; focus:number; aperture:number; wind:number; flight:number }
export const initialState=():DandelionState=>({time:0,yaw:0,pitch:0,focus:3.46,aperture:.09,wind:1,flight:-1});
export async function createDandelionPresentation(surface:GpuSurface,pool:GpuSurfacePool,onRefill:()=>void){
  await surface.ready;if(surface.status!=='ready')throw Error('Dandelion surface closed during initialization');
  const device=surface.device,model=createDandelionModel(),errors:string[]=[];
  let {width,height}=surface.outputTexture;
  const weather = createMeadowWind();
  const flights = createSeedFlights(model.seeds, onRefill, weather);
  const maxSegments = Math.max(...model.seeds.map(seed => seed.count));
  const farSegments = 1 + (maxSegments - 1) / 4;
  let disposed=false;const durations:number[]=[];
  const listener=(e:GPUUncapturedErrorEvent)=>errors.push(e.error.message);
  device.addEventListener('uncapturederror',listener);surface.own({destroy:()=>device.removeEventListener('uncapturederror',listener)});
  try{
    const buffer=(data:Float32Array,usage:number)=>{const b=surface.own(device.createBuffer({size:data.byteLength,usage:usage|GPUBufferUsage.COPY_DST}));device.queue.writeBuffer(b,0,data as Float32Array<ArrayBuffer>);return b;};
    const solid=buffer(model.solid,GPUBufferUsage.VERTEX),lines=buffer(model.lines,GPUBufferUsage.STORAGE);
    const allocatePoses = () => device.createBuffer({size:flights.capacityBytes,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});
    let seedPoses = allocatePoses();
    surface.own({destroy:() => seedPoses.destroy()});
    const grassBends = surface.own(device.createBuffer({label:'Dandelion meadow bends',size:weather.grass.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}));
    const uniform=surface.own(device.createBuffer({label:'Dandelion frame',size:144,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}));
    async function module(code:string,label:string){const m=device.createShaderModule({code,label});const info=await m.getCompilationInfo();const failures=info.messages.filter(x=>x.type==='error');if(failures.length)throw Error(label+': '+failures.map(x=>x.lineNum+': '+x.message).join('\n'));return m;}
    const [env,ls,fs,cs]=await Promise.all([module(environment,'Dandelion environment'),module(lens,'Dandelion lens'),module(fiber,'Dandelion fibers'),module(composite,'Dandelion composition')]);
    const environmentTargets:GPUColorTargetState[]=[{format:'rgba16float'},{format:'r32float'}];
    const sky=await device.createRenderPipelineAsync({layout:'auto',vertex:{module:env,entryPoint:'full'},fragment:{module:env,entryPoint:'sky',targets:environmentTargets},primitive:{topology:'triangle-list'}});
    const mesh=await device.createRenderPipelineAsync({layout:'auto',vertex:{module:env,entryPoint:'meshVs',buffers:[{arrayStride:48,attributes:[{shaderLocation:0,offset:0,format:'float32x3'},{shaderLocation:1,offset:12,format:'float32x3'},{shaderLocation:2,offset:24,format:'float32x3'},{shaderLocation:3,offset:36,format:'float32x3'}]}]},fragment:{module:env,entryPoint:'meshFs',targets:environmentTargets},primitive:{topology:'triangle-list',cullMode:'none'},depthStencil:{format:'depth32float',depthWriteEnabled:true,depthCompare:'less'}});
    const blur=await device.createRenderPipelineAsync({layout:'auto',vertex:{module:ls,entryPoint:'full'},fragment:{module:ls,entryPoint:'blur',targets:[{format:'rgba16float'}]}});
    const add:GPUBlendComponent={srcFactor:'one',dstFactor:'one',operation:'add'};
    const fib=await device.createRenderPipelineAsync({layout:'auto',vertex:{module:fs,entryPoint:'lineVs'},fragment:{module:fs,entryPoint:'lineFs',targets:[{format:'rgba16float',blend:{color:add,alpha:add}},{format:'r16float',blend:{color:{srcFactor:'zero',dstFactor:'one-minus-src',operation:'add'},alpha:{srcFactor:'zero',dstFactor:'one',operation:'add'}}}]}});
    const final=await device.createRenderPipelineAsync({layout:'auto',vertex:{module:cs,entryPoint:'full'},fragment:{module:cs,entryPoint:'composeFs',targets:[{format:'rgba8unorm'}]}});
    const sampler=device.createSampler({minFilter:'linear',magFilter:'linear'});
    const group=(pipeline:GPURenderPipeline,entries:GPUBindGroupEntry[])=>device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:uniform}},...entries]});
    const skyGroup=group(sky,[]),meshGroup=group(mesh,[{binding:1,resource:{buffer:grassBends}}]);
    const bindPoses=(envDepth:GPUTexture)=>group(fib,[{binding:1,resource:{buffer:lines}},{binding:2,resource:envDepth.createView()},{binding:3,resource:{buffer:seedPoses}}]);
    function createTargets() {
      const textures: GPUTexture[] = [];
      const texture=(format:GPUTextureFormat)=>{
        const result=device.createTexture({size:[width,height],format,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING});
        textures.push(result);
        return result;
      };
      const destroy=()=>textures.forEach(t=>t.destroy());
      try {
        const envColor=texture('rgba16float'),envDepth=texture('r32float'),zbuffer=texture('depth32float');
        const blurred=texture('rgba16float'),accum=texture('rgba16float'),reveal=texture('r16float');
        const blurGroup=group(blur,[{binding:1,resource:envColor.createView()},{binding:2,resource:envDepth.createView()},{binding:3,resource:sampler}]);
        const finalGroup=group(final,[{binding:1,resource:blurred.createView()},{binding:2,resource:accum.createView()},{binding:3,resource:reveal.createView()}]);
        return {envColor,envDepth,zbuffer,blurred,accum,reveal,blurGroup,finalGroup,fiberGroup:bindPoses(envDepth),destroy};
      } catch (error) { destroy(); throw error; }
    }
    let targets=createTargets();
    surface.own({destroy:()=>targets.destroy()});
    function resize(w:number,h:number) {
      if(disposed || (w===width && h===height)) return;
      surface.resize(w,h);
      width=w; height=h;
      const next=createTargets();
      targets.destroy(); targets=next;
    }
    const attachment=(texture:GPUTexture,clear:number[]=[0,0,0,0]):GPURenderPassColorAttachment=>({view:texture.createView(),loadOp:'clear',storeOp:'store',clearValue:clear});
    function draw(state:DandelionState,aspect:number){
      if(disposed)return;const start=performance.now();
      const eye = cameraEye(state.yaw, state.pitch);
      flights.update(state.time, eye);
      const poses = flights.takeChanges();
      if (poses) {
        if (poses.byteLength > seedPoses.size) {
          const previous = seedPoses;
          seedPoses = allocatePoses();
          targets.fiberGroup = bindPoses(targets.envDepth);
          previous.destroy();
        }
        device.queue.writeBuffer(seedPoses,0,poses as Float32Array<ArrayBuffer>);
      }
      const grass = weather.prepareGrass(state.time);
      if (grass.changed) device.queue.writeBuffer(grassBends,0,weather.grass as Float32Array<ArrayBuffer>);
      const stem = weather.stemAt(state.time);
      device.queue.writeBuffer(uniform,0,cameraUniform(eye,state.time,state.focus,state.aperture,state.wind,width,height,aspect,stem.tip,stem.rotation,grass.blend) as Float32Array<ArrayBuffer>);
      const {envColor,envDepth,zbuffer,blurred,accum,reveal,blurGroup,fiberGroup,finalGroup}=targets;
      surface.render(({encoder,color})=>{
        let p=encoder.beginRenderPass({colorAttachments:[attachment(envColor),attachment(envDepth,[90,0,0,0])]});p.setPipeline(sky);p.setBindGroup(0,skyGroup);p.draw(3);p.end();
        p=encoder.beginRenderPass({colorAttachments:[{...attachment(envColor),loadOp:'load'},{...attachment(envDepth),loadOp:'load'}],depthStencilAttachment:{view:zbuffer.createView(),depthClearValue:1,depthLoadOp:'clear',depthStoreOp:'store'}});p.setPipeline(mesh);p.setBindGroup(0,meshGroup);p.setVertexBuffer(0,solid);p.draw(model.solid.length/12);p.end();
        p=encoder.beginRenderPass({colorAttachments:[attachment(blurred)]});p.setPipeline(blur);p.setBindGroup(0,blurGroup);p.draw(3);p.end();
        p=encoder.beginRenderPass({colorAttachments:[attachment(accum),attachment(reveal,[1,0,0,0])]});p.setPipeline(fib);p.setBindGroup(0,fiberGroup);p.draw(6,model.lines.length/16);
        if (flights.nearCount) p.draw(maxSegments*6,flights.nearCount,6,model.seeds.length);
        if (flights.farCount) p.draw(farSegments*6,flights.farCount,6,model.seeds.length+flights.nearCount);
        p.end();
        p=encoder.beginRenderPass({colorAttachments:[{view:color,loadOp:'clear',storeOp:'store',clearValue:[0,0,0,1]}]});p.setPipeline(final);p.setBindGroup(0,finalGroup);p.draw(3);p.end();
      });
      durations.push(performance.now()-start);if(durations.length>180)durations.shift();
    }
    return {draw,resize,blow:(now:number,yaw:number,pitch:number)=>flights.blow(now,cameraEye(yaw,pitch)),inspect:()=>({dispersion:flights.inspect(),counts:model.counts,frames:surface.inspect().frames,resolution:[width,height],surface:surface.inspect(),errors:[...errors],disposed,
      sharing:{sameDevice:device===surface.device,sameTexture:pool.imageRegistry.getTextureSync(surface.imageId)===surface.outputTexture,cpuPixelReadback:false},registry:pool.imageRegistry.inspectTextures(),
      animation:{vertexUploadBytesPerFrame:0,uniformBytesPerFrame:144},cpuEncodeMs:durations.length?durations.reduce((a,b)=>a+b)/durations.length:0}),
      destroy(){if(disposed)return;disposed=true;surface.dispose();}};
  }catch(error){surface.dispose();throw error;}
}
