import { VertexColorScenePass, type GpuSurface, type GpuSurfacePool } from '/vendor/flamo-runtime/index.es.js';
import { makeHouse, houseCamera } from './model';

export interface HouseState { time:number; yaw:number; playing:boolean; orbit:boolean; zoom:number }
export async function createHousePresentation(surface:GpuSurface,pool:GpuSurfacePool) {
  await surface.ready;
  if(surface.status!=='ready')throw new Error('House surface was disposed while mounting');
  const {device,adapter}=await pool.getGpuResources(),model=makeHouse(),errors:string[]=[];
  let disposed=false;
  const errorListener=(event:GPUUncapturedErrorEvent)=>errors.push(event.error.message);
  device.addEventListener('uncapturederror',errorListener);
  surface.own({destroy:()=>device.removeEventListener('uncapturederror',errorListener)});
  try {
    const buffer=(values:Float32Array)=>{const b=surface.own(device.createBuffer({size:values.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}));device.queue.writeBuffer(b,0,values as Float32Array<ArrayBuffer>);return b;};
    const solid=buffer(model.solid),plants=buffer(model.plants);
    const amplitudes=new Float32Array(model.plants.length/10*4);
    for(let i=0;i<model.plants.length/10;i++) amplitudes.set([model.wind[i*2],0,model.wind[i*2]*.4,model.wind[i*2+1]],i*4);
    const deformationBuffer=buffer(amplitudes);
    const pass=surface.own(await VertexColorScenePass.create(device));
    const meshes=[{buffer:solid,vertexCount:model.solid.length/10},{buffer:plants,vertexCount:model.plants.length/10,deformationBuffer}];
    return {
      draw(state:HouseState){
        if(disposed)return;
        surface.render(({encoder,color,depth})=>pass.encode(encoder,color,depth,{
          viewProjection:houseCamera(state.yaw,state.zoom),meshes,lightDirection:[-.45,.9,.6],ambient:.64,diffuse:.44,
          deformation:{time:state.time,frequency:[1.7,0,1.33],phaseOffset:[0,0,Math.PI/2]},
        }));
      },
      inspect:()=>({frames:surface.inspect().frames,counts:model.counts,vertices:meshes.map(m=>m.vertexCount),resolution:[400,400],output:[800,800],
        sharing:{sameDevice:pass.device===surface.device,sameTexture:pool.imageRegistry.getTextureSync(surface.imageId)===surface.outputTexture,cpuPixelReadback:false},
        animation:{mode:'gpu-vertex-deformation',vertexUploadBytesPerFrame:0,uniformUploadBytesPerFrame:128},surface:surface.inspect(),
        registry:pool.imageRegistry.inspectTextures(),adapter:{vendor:adapter.info?.vendor,architecture:adapter.info?.architecture},errors:[...errors],disposed}),
      destroy(){if(disposed)return;disposed=true;surface.dispose();},
    };
  }catch(error){surface.dispose();throw error;}
}
