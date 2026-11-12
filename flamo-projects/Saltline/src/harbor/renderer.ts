import type { GpuSurface } from '/vendor/flamo-runtime/index.es.js';
import { packedScene, recipe, atlasURL } from './baked/scene';
import workerSource from './baked/worker';
import { rainShader } from './rain';
import { createActors } from './actors';
import { atmosphere, geometry, pavement, display } from './shaders';

export { packedScene };
export type Camera = { x:number; z:number; yaw:number; pitch:number; y?:number; fov?:number; matrix?:number[] };
export const startCamera: Camera = { x:-32, z:6, yaw:.018, pitch:.055 };
export const width=1280, height=720;
const hdr:GPUTextureFormat='rgba16float', zFormat:GPUTextureFormat='depth32float';

type HarborGeometry={vertices:Uint8Array<ArrayBuffer>;indices:Uint32Array<ArrayBuffer>;solidIndices:number};
function loadGeometry(surface:GpuSurface):Promise<HarborGeometry>{
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(new Blob([workerSource],{type:'text/javascript'}));
    const worker=new Worker(url);
    let running=true;
    function finish(){
      if(!running)return;
      running=false;worker.terminate();URL.revokeObjectURL(url);
    }
    surface.own({destroy(){finish();reject(new Error('港区已关闭'));}});
    worker.onerror=event=>{finish();reject(new Error(event.message));};
    worker.onmessage=event=>{
      finish();
      if(event.data.error)reject(new Error(event.data.error));else resolve(event.data);
    };
    worker.postMessage(recipe);
  });
}
function cameraData(c:Camera, mirror:boolean, time:number){
  const co=Math.cos(c.yaw),si=Math.sin(c.yaw),cp=Math.cos(c.pitch),sp=Math.sin(c.pitch),sign=mirror?-1:1;
  const m=c.matrix;
  const axes=m?[m[0],m[1]*sign,m[2],0,m[4],m[5]*sign,m[6],0,-m[8],-m[9]*sign,-m[10],0]:[-si,0,co,0,-co*sp,cp*sign,-si*sp,0,co*cp,sp*sign,si*cp,0];
  const tan=Math.tan((c.fov??68)*Math.PI/360), sun=[.91635,.22509,.33113], norm=Math.hypot(...sun);
  return new Float32Array([
    c.x,(c.y??1.67)*sign,c.z,0, ...axes,
    tan*width/height,tan,0,0, ...sun.map(x=>x/norm),0, time,0,0,0
  ]);
}
export async function createHarbor(surface:GpuSurface,onProgress:(value:number,label:string)=>void){
  await surface.ready;
  onProgress(71,'正在准备港区几何与材质');
  const device=surface.device, errors:string[]=[];
  const observe=(event:GPUUncapturedErrorEvent)=>{errors.push(event.error.message);};
  device.addEventListener('uncapturederror',observe);
  surface.own({destroy:()=>device.removeEventListener('uncapturederror',observe)});
  function texture(label:string,w:number,h:number,format:GPUTextureFormat){
    return surface.own(device.createTexture({label,size:[w,h],format,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.RENDER_ATTACHMENT}));
  }
  const shadow=texture('Saltline / static sun',2048,2048,zFormat).createView();
  const mirrorColor=texture('Saltline / planar reflection',width/2,height/2,hdr).createView();
  const mirrorDepth=texture('Saltline / mirror depth',width/2,height/2,zFormat).createView();
  const scene=texture('Saltline / linear scene',width,height,hdr).createView();
  const cmp=device.createSampler({compare:'less-equal',minFilter:'linear',magFilter:'linear'});
  const smooth=device.createSampler({minFilter:'linear',magFilter:'linear'});
  const repeat=device.createSampler({minFilter:'linear',magFilter:'linear',mipmapFilter:'linear',addressModeU:'repeat',addressModeV:'repeat',maxAnisotropy:4});
  const solid=device.createShaderModule({label:'Saltline / steel and sky',code:atmosphere+geometry});
  const ground=device.createShaderModule({label:'Saltline / wet pavement',code:atmosphere+pavement});
  const grade=device.createShaderModule({label:'Saltline / film response',code:atmosphere.split('@group(0) @binding(1)')[0]+display});
  const format:GPUVertexBufferLayout={arrayStride:24,attributes:[
    {shaderLocation:0,offset:0,format:'sint16x4'},{shaderLocation:1,offset:8,format:'snorm8x4'},
    {shaderLocation:2,offset:12,format:'unorm8x4'},{shaderLocation:3,offset:16,format:'float32x2'}
  ]};
  function pipeline(module:GPUShaderModule,entry:string,fragment?:string,target:GPUTextureFormat=hdr,depth=false,mesh=false,bias=0,alpha=false){
    return device.createRenderPipelineAsync({label:'Saltline / '+(fragment||entry),layout:'auto',
      vertex:{module,entryPoint:entry,buffers:mesh?[format]:[]},
      ...(fragment?{fragment:{module,entryPoint:fragment,targets:[{format:target,...(alpha?{blend:{color:{operation:"add",srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{operation:"add",srcFactor:"one",dstFactor:"one-minus-src-alpha"}}} as const:{})}]}}:{}),
      primitive:{topology:'triangle-list'},
      ...(depth?{depthStencil:{format:zFormat,depthWriteEnabled:!alpha,depthCompare:'less-equal',depthBias:bias,depthBiasSlopeScale:bias>0?1.5:0}}:{})
    });
  }
  const mips=Math.log2(packedScene.tile)+1;
  const atlas=surface.own(device.createTexture({label:'Saltline / berth materials',size:[packedScene.tile,packedScene.tile,packedScene.rows*8],format:'rgba8unorm',mipLevelCount:mips,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT}));
  async function uploadAtlas(){
    const payload=atlasURL.slice(atlasURL.indexOf(',')+1);
    const bitmap=await createImageBitmap(new Blob([Uint8Array.from(atob(payload),x=>x.charCodeAt(0))],{type:atlasURL.slice(5,atlasURL.indexOf(';'))}));
    const canvas=new OffscreenCanvas(1,1), ctx=canvas.getContext('2d');
    if(!ctx)throw Error('材质图集初始化失败');
    try{
      for(let mip=0;mip<mips;mip++){
        const size=packedScene.tile>>mip; canvas.width=8*size;canvas.height=packedScene.rows*size;
        ctx.imageSmoothingQuality='high';ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
        for(let layer=0;layer<packedScene.rows*8;layer++){
          device.queue.copyExternalImageToTexture({source:canvas,origin:[(layer%8)*size,Math.floor(layer/8)*size]},
            {texture:atlas,mipLevel:mip,origin:[0,0,layer]},[size,size]);
        }
      }
    } finally{bitmap.close();}
  }
  const rainModule=device.createShaderModule({label:'Saltline / windblown rain',code:atmosphere.split('@group(0) @binding(1)')[0]+rainShader});
  const [shadowPipe,skyPipe,opaquePipe,decalPipe,groundPipe,gradePipe,rainPipe,data,actors]=await Promise.all([
    pipeline(solid,'shadowVertex',undefined,hdr,true,true,2),pipeline(solid,'fullscreen','sky'),
    pipeline(solid,'geometry','surface',hdr,true,true),pipeline(solid,'geometry','surface',hdr,true,true,-1,true),pipeline(ground,'fullscreen','pavement',hdr,true),
    pipeline(grade,'fullscreen','grade','rgba8unorm'),pipeline(rainModule,'rainVertex','rainFragment',hdr,true,false,0,true),
    loadGeometry(surface),createActors(surface),uploadAtlas()
  ]);
  function createBuffer(label:string,size:number,usage:number){return surface.own(device.createBuffer({label,size,usage:usage|GPUBufferUsage.COPY_DST}));}
  const indexCount=data.indices.length,solidIndices=data.solidIndices;
  const vertices=createBuffer('Berth meshes',data.vertices.byteLength,GPUBufferUsage.VERTEX);
  const indices=createBuffer('Berth indices',data.indices.byteLength,GPUBufferUsage.INDEX);
  device.queue.writeBuffer(vertices,0,data.vertices);
  device.queue.writeBuffer(indices,0,data.indices);
  function group(pipe:GPURenderPipeline,entries:[number,GPUBindingResource][]){return device.createBindGroup({layout:pipe.getBindGroupLayout(0),entries:entries.map(([binding,resource])=>({binding,resource}))});}
  const atlasView=atlas.createView({dimension:'2d-array'});
  function viewBindings(){
    const uni=createBuffer('Camera',112,GPUBufferUsage.UNIFORM),res={buffer:uni};
    const materialBindings:[number,GPUBindingResource][]= [[0,res],[1,shadow],[2,cmp],[3,atlasView],[4,repeat]];
    return {uni,decals:group(decalPipe,materialBindings), sky:group(skyPipe,[[0,res]]),mesh:group(opaquePipe,materialBindings)};
  }
  onProgress(85,'正在准备角色与雨幕');
  const main=viewBindings(), reflected=viewBindings();
  const rainBindings=group(rainPipe,[[0,{buffer:main.uni}]]);
  const lightGroup=group(shadowPipe,[[0,{buffer:main.uni}]]);
  const floorGroup=group(groundPipe,[[0,{buffer:main.uni}],[1,shadow],[2,cmp],[3,mirrorColor],[4,smooth]]);
  const sunlitComposite=(depth:GPUTextureView)=>group(gradePipe,[[0,{buffer:main.uni}],[1,scene],[2,smooth],[3,depth],[4,shadow],[5,cmp]]);
  const gunDepth=texture('Saltline / foreground depth',width,height,zFormat).createView();
  let first=true,lastPose='',busy=false,frames=0,mirrorFrames=0,finished=0,lastWait=0;
  function draw(c:Camera,time:number,game?:any){
    if(busy || surface.status!=='ready')return;
    const pose=[c.x,c.y,c.z,c.fov,...(c.matrix?.slice(0,12)||[c.yaw,c.pitch])].map(x=>Math.round((x||0)*1000)).join(',');
    if(game)actors.prepare(game);
    const updateMirror=pose!==lastPose && (first || !game || frames%(game.quality.name==='low'?5:2)===0);
    device.queue.writeBuffer(main.uni,0,cameraData(c,false,time));
    if(updateMirror)device.queue.writeBuffer(reflected.uni,0,cameraData(c,true,time));
    surface.render(({encoder,color,depth})=>{
      function attachment(view:GPUTextureView,loadOp:GPULoadOp='clear'):GPURenderPassColorAttachment{return {view,loadOp,storeOp:'store',clearValue:[0,0,0,1]};}
      function zAttachment(view:GPUTextureView):GPURenderPassDepthStencilAttachment{return {view,depthLoadOp:'clear',depthClearValue:1,depthStoreOp:'store'};}
      function drawIndexed(p:GPURenderPassEncoder,count:number){p.setVertexBuffer(0,vertices);p.setIndexBuffer(indices,'uint32');p.drawIndexed(count);}
      if(first){const p=encoder.beginRenderPass({label:'Directional shadow',colorAttachments:[],depthStencilAttachment:zAttachment(shadow)});
        p.setPipeline(shadowPipe);p.setBindGroup(0,lightGroup);drawIndexed(p,solidIndices);p.end();first=false;}
      function drawView(out:GPUTextureView,z:GPUTextureView,bindings:ReturnType<typeof viewBindings>,withFloor:boolean){
        const sky=encoder.beginRenderPass({colorAttachments:[attachment(out)]});sky.setPipeline(skyPipe);sky.setBindGroup(0,bindings.sky);sky.draw(3);sky.end();
        const p=encoder.beginRenderPass({colorAttachments:[attachment(out,'load')],depthStencilAttachment:zAttachment(z)});
        if(withFloor){p.setPipeline(groundPipe);p.setBindGroup(0,floorGroup);p.draw(3);}
        p.setPipeline(opaquePipe);p.setBindGroup(0,bindings.mesh);drawIndexed(p,solidIndices);
        p.setPipeline(decalPipe);p.setBindGroup(0,bindings.decals);p.drawIndexed(indexCount-solidIndices,1,solidIndices);p.end();
      }
      if(updateMirror){drawView(mirrorColor,mirrorDepth,reflected,false);mirrorFrames++;lastPose=pose;}
      drawView(scene,depth,main,true);
      if(game){for(const gun of [false,true]){const pass=encoder.beginRenderPass({label:gun?'PAC-9':'Harbor actors',colorAttachments:[attachment(scene,'load')],depthStencilAttachment:{...zAttachment(gun?gunDepth:depth),depthLoadOp:gun?'clear':'load'}});actors.draw(pass,gun);
        if(!gun){pass.setPipeline(rainPipe);pass.setBindGroup(0,rainBindings);pass.draw(6,game.quality.name==='low'?3200:6200);}
        pass.end();}}
      const end=encoder.beginRenderPass({colorAttachments:[attachment(color)]});end.setPipeline(gradePipe);end.setBindGroup(0,sunlitComposite(depth));end.draw(3);end.end();
    });
    busy=true;frames++;
    const start=performance.now();
    device.queue.onSubmittedWorkDone().then(()=>{lastWait=performance.now()-start;finished++;busy=false;},()=>{busy=false;});
  }
  return {draw,inspect:()=>({...actors.stats(),frames,finished,mirrorFrames,lastQueueWaitMs:lastWait,triangles:indexCount/3,resolution:[width,height],errors:[...errors]})};
}
