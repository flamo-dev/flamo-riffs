// @ts-nocheck
// Geometry and bone poses come from the simulation. All passes share the Flamo surface device.
const shader=`
struct ObjectData { clip:mat4x4f, model:mat4x4f, bind:mat4x4f, unbind:mat4x4f, tint:vec4f, params:vec4f }
@group(0) @binding(0) var<storage,read> objects:array<ObjectData>;
@group(0) @binding(1) var<storage,read> bones:array<mat4x4f>;
@group(1) @binding(0) var pigment:texture_2d<f32>;
@group(1) @binding(1) var linearSampler:sampler;
struct Out {@builtin(position) clip:vec4f,@location(0) normal:vec3f,@location(1) color:vec3f,@location(2) params:vec3f,@location(3) uv:vec2f}
@vertex fn vs(@location(0) p:vec3f,@location(1) n:vec3f,@location(2) color:vec3f,@location(3) joints:vec4u,@location(4) weights:vec4f,@location(5) uv:vec2f,@builtin(instance_index) k:u32)->Out {
 let o=objects[k];var v=vec4f(p,1.);var norm=vec4f(n,0.);
 if(o.params.z>=0.){let b=u32(o.params.z);let skin=bones[b+joints.x]*weights.x+bones[b+joints.y]*weights.y+bones[b+joints.z]*weights.z+bones[b+joints.w]*weights.w;
 let transform=o.unbind*skin*o.bind;v=transform*v;norm=transform*norm;}
 var clip=o.clip*v;clip.z=(clip.z+clip.w)*.5;
 return Out(clip,normalize((o.model*norm).xyz),o.tint.rgb*mix(vec3f(1.),color,o.params.y),vec3f(o.params.x,o.tint.a,o.params.w),uv);
}
@fragment fn fs(in:Out)->@location(0) vec4f {
 let tex=textureSample(pigment,linearSampler,vec2f(in.uv.x,1.-in.uv.y));
 if(tex.a<.07){discard;}
 let radial=length(in.uv-vec2f(.5));
 if(in.params.x==2.){let aim=1.-smoothstep(.019,.035,radial);let ring=(1.-smoothstep(.008,.018,abs(radial-.145)));return vec4f(mix(vec3f(.15,.23,.22),vec3f(6.,.29,.02),max(aim,ring)),.10+max(aim,ring)*.9);}
 if(in.params.x==3.){return vec4f(.85,.70,.43,.035);}
 if(in.params.x==4.){let flame=max(0.,1.-radial*2.);if(flame<.22){discard;}return vec4f(7.,2.3,.30,flame*flame*.85);}
 let n=normalize(in.normal);let nd=max(0.,dot(n,normalize(vec3f(.916,.225,.331))));
 let lit=.21+.30*max(n.y,0.)+nd*1.28+in.params.z;
 let c=in.color*mix(vec3f(lit,lit*.91,lit*.84),vec3f(1.35),in.params.x);
 return vec4f(c*tex.rgb,in.params.y*tex.a);
}`;
export async function createActors(surface){
 const device=surface.device,module=device.createShaderModule({code:shader,label:'Saltline / animated actors'});
 const maxObjects=1600,maxBones=3072,stride=72;
 const buffer=(size,usage)=>device.createBuffer({size:Math.max(4,Math.ceil(size/4)*4),usage:usage|GPUBufferUsage.COPY_DST});
 const objects=surface.own(buffer(maxObjects*stride*4,GPUBufferUsage.STORAGE)),bones=surface.own(buffer(maxBones*64,GPUBufferUsage.STORAGE));
 const layout=device.createBindGroupLayout({entries:[0,1].map(binding=>({binding,visibility:GPUShaderStage.VERTEX,buffer:{type:'read-only-storage'}}))});
 const group=device.createBindGroup({layout,entries:[{binding:0,resource:{buffer:objects}},{binding:1,resource:{buffer:bones}}]});
 const paintLayout=device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{}}]});
 const sampler=device.createSampler({minFilter:'linear',magFilter:'linear'}),paints=new Map();
 function paint(image){
   if(paints.has(image))return paints.get(image);
   const texture=surface.own(device.createTexture({size:[image?.width||1,image?.height||1],format:'rgba8unorm-srgb',usage:GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}));
   if(image)device.queue.copyExternalImageToTexture({source:image},{texture},[image.width,image.height]);
   else device.queue.writeTexture({texture},new Uint8Array([255,255,255,255]),{},[1,1]);
   const group=device.createBindGroup({layout:paintLayout,entries:[{binding:0,resource:texture.createView()},{binding:1,resource:sampler}]});paints.set(image,group);return group;
 }
 const pipelineLayout=device.createPipelineLayout({bindGroupLayouts:[layout,paintLayout]});
 const pipeline=await device.createRenderPipelineAsync({label:'Saltline / skinned metal',layout:pipelineLayout,
 vertex:{module,entryPoint:'vs',buffers:[{arrayStride:68,attributes:[{shaderLocation:0,offset:0,format:'float32x3'},{shaderLocation:1,offset:12,format:'float32x3'},
 {shaderLocation:2,offset:24,format:'float32x3'},{shaderLocation:3,offset:36,format:'uint16x4'},{shaderLocation:4,offset:44,format:'float32x4'},{shaderLocation:5,offset:60,format:'float32x2'}]}]},
 fragment:{module,entryPoint:'fs',targets:[{format:'rgba16float',blend:{color:{srcFactor:'src-alpha',dstFactor:'one-minus-src-alpha'},alpha:{srcFactor:'one',dstFactor:'one-minus-src-alpha'}}}]},
 primitive:{topology:'triangle-list'},depthStencil:{format:'depth32float',depthWriteEnabled:true,depthCompare:'less-equal'}});
 const cache=new Map(),floats=new Float32Array(maxObjects*stride),poses=new Float32Array(maxBones*16);
 surface.own({destroy(){for(const entry of cache.values())entry.dispose();cache.clear();}});
 function geometry(geo){
   const cached=cache.get(geo);
   if(cached){const a=geo.attributes;if(cached.version!==a.position.version){for(let i=0;i<a.position.count;i++){const k=i*17;for(const [j,m] of ['getX','getY','getZ'].entries()){cached.data[k+j]=a.position[m](i);if(a.normal)cached.data[k+3+j]=a.normal[m](i);}}device.queue.writeBuffer(cached.vb,0,cached.data.buffer);cached.version=a.position.version;}return cached;}
   const a=geo.attributes,p=a.position;if(!p)return;
   const data=new ArrayBuffer(p.count*68),f=new Float32Array(data),u=new Uint16Array(data);
   for(let i=0;i<p.count;i++){const k=i*17;if(a.uv){f[k+15]=a.uv.getX(i);f[k+16]=a.uv.getY(i);}
     for(const [offset,attr,def] of [[0,p,0],[3,a.normal,0],[6,a.color,1]]){
       f[k+offset]=attr?attr.getX(i):def;f[k+offset+1]=attr?attr.getY(i):def;f[k+offset+2]=attr?attr.getZ(i):def;
     }
     if(a.skinIndex){for(const [j,method] of ['getX','getY','getZ','getW'].entries()){u[i*34+18+j]=a.skinIndex[method](i);f[k+11+j]=a.skinWeight[method](i);}}
   }
   const vb=buffer(data.byteLength,GPUBufferUsage.VERTEX);device.queue.writeBuffer(vb,0,data);
   let ib=null,count=p.count;if(geo.index){const index=Uint32Array.from(geo.index.array);count=index.length;ib=buffer(index.byteLength,GPUBufferUsage.INDEX);device.queue.writeBuffer(ib,0,index);}
   function dispose(){vb.destroy();ib?.destroy();cache.delete(geo);geo.removeEventListener('dispose',dispose);}
   const entry={vb,ib,count,dispose,version:p.version,data:f};cache.set(geo,entry);geo.addEventListener('dispose',dispose);return entry;
 }
 let world=[],weapon=[],count=0,boneCount=0;
 function prepare(g){
   count=0;boneCount=0;world=[];weapon=[];
   const camera=g.camera,view=camera.matrixWorldInverse,vp=view.clone(),model=view.clone(),inst=view.clone(),clip=view.clone(),identity=view.clone().identity();
   const palette=new Map();
   function item(mesh,gun){
     const geo=mesh.geometry;if(!mesh.isMesh||!geo?.attributes.position||mesh.count===0)return;
     const res=geometry(geo);if(!res)return;
     let bone=-1;
     if(mesh.isSkinnedMesh){const sk=mesh.skeleton;if(!palette.has(sk)){sk.update();const len=sk.boneMatrices.length/16;if(boneCount+len>maxBones)return;
       palette.set(sk,boneCount);poses.set(sk.boneMatrices,boneCount*16);boneCount+=len;}bone=palette.get(sk);}
     vp.multiplyMatrices(gun?g.viewCamera.projectionMatrix:camera.projectionMatrix,view);
     const groups=Array.isArray(mesh.material)?geo.groups:[{start:0,count:res.count,materialIndex:0}];
     for(let i=0;i<(mesh.isInstancedMesh?mesh.count:1);i++){
       model.copy(mesh.matrixWorld);if(mesh.isInstancedMesh){mesh.getMatrixAt(i,inst);model.multiply(inst);}clip.multiplyMatrices(vp,model);
       for(const part of groups){const mat=Array.isArray(mesh.material)?mesh.material[part.materialIndex]:mesh.material;
         if(!mat||!mat.visible||mat.opacity<.06||count>=maxObjects)continue;
         const mode=mat.uniforms?.uBright?2:mat.uniforms?.uGain?3:mat.uniforms?.uJet?4:Number(!!mat.isMeshBasicMaterial);
         if(mat.isShaderMaterial&&mode===0)continue;
         const k=count*stride,c=mat.color;
         floats.set(clip.elements,k);floats.set(model.elements,k+16);floats.set((mesh.bindMatrix||identity).elements,k+32);floats.set((mesh.bindMatrixInverse||identity).elements,k+48);
         floats.set([c?.r??1,c?.g??1,c?.b??1,mat.opacity??1,mode,Number(!!mat.vertexColors),bone,gun?.42+(g.render.flash||0)*9:.08],k+64);
         (gun?weapon:world).push([res,part.start,Math.min(part.count,res.count-part.start),count++,paint(mat.map?.image)]);
       }
     }
   }
   for(const obj of g.scene.children)if(obj!==camera)obj.traverseVisible(m=>item(m,false));
   camera.traverseVisible(m=>item(m,true));
   if(count)device.queue.writeBuffer(objects,0,floats.buffer,0,count*stride*4);
   if(boneCount)device.queue.writeBuffer(bones,0,poses.buffer,0,boneCount*64);
 }
 function draw(pass,gun){pass.setPipeline(pipeline);pass.setBindGroup(0,group);
   for(const [r,start,len,id,paintGroup] of gun?weapon:world){pass.setBindGroup(1,paintGroup);pass.setVertexBuffer(0,r.vb);if(r.ib){pass.setIndexBuffer(r.ib,'uint32');pass.drawIndexed(len,1,start,0,id);}else pass.draw(len,1,start,id);}}
 return {prepare,draw,stats:()=>({worldDraws:world.length,weaponDraws:weapon.length,bones:boneCount})};
}