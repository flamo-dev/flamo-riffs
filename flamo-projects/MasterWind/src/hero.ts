import { clamp, smooth, wind, type Run } from './wind';
import { pieces, clothHistory, clothStrip, cutStation, ripple, capePanel } from './cloth';
import type { EntityHandle, NodeScriptContext } from '/vendor/flamo-runtime/index.es.js';

type Point = [number,number];
type Joint = [number,number,number,number]; // centre and radii in the original painting
interface Rig {
  role:string; anchor:Point; head:Joint; handL:Joint; handR:Joint; cloth:Joint;
  fringe:Joint; tassel:Joint; gourd:Joint; boots:Joint; width:number; height:number;
}
// The nape is the common registration point. The weights stay painted to the same pixels at every frame.
const rigs:Rig[]=[
  {role:'wait',width:277,height:360,anchor:[84,101],head:[99,23,97,31],handL:[20,202,16,23],handR:[124,195,14,20],cloth:[157,129,91,58],fringe:[221,120,63,51],tassel:[181,220,38,20],gourd:[56,216,27,35],boots:[76,318,53,44]},
  {role:'glide',width:525,height:360,anchor:[327,98],head:[267,25,85,25],handL:[141,79,108,56],handR:[498,82,84,57],cloth:[262,143,151,70],fringe:[85,198,97,79],tassel:[371,252,33,37],gourd:[308,207,25,33],boots:[233,306,72,63]},
];
const shader=`
struct VertexOut { @builtin(position) position: vec4f, @location(0) uv: vec2f, @location(1) opacity: f32, @location(2) shade:f32 }
@group(0) @binding(0) var ink: texture_2d<f32>;
@group(0) @binding(1) var silk: sampler;
@vertex fn vs(@location(0) coord:vec2f,@location(1) uv:vec2f,@location(2) strength:f32, @location(3) shade:f32)->VertexOut {
  var v:VertexOut; v.position=vec4f(coord,0,1);v.uv=uv;v.opacity=strength;v.shade=shade;return v;
}
@fragment fn fs(v:VertexOut)->@location(0) vec4f {
  let p=textureSample(ink,silk,v.uv);return vec4f(p.rgb*v.shade,p.a*v.opacity);
}
@group(1) @binding(0) var torsoRelief: texture_2d<f32>;
@group(1) @binding(1) var<uniform> contactFrame: vec4f;
@fragment fn pressedCloth(v:VertexOut)->@location(0) vec4f {
  let cloth=textureSample(ink,silk,v.uv);
  let xy=v.position.xy*contactFrame.x+contactFrame.yz;
  let body=textureSample(torsoRelief,silk,xy/vec2f(textureDimensions(torsoRelief)));
  let height=smoothstep(81.0,102.0,xy.y)*(1.0-smoothstep(169.0,202.0,xy.y));
  let pressure=contactFrame.w*height*smoothstep(0.28,0.86,body.a);
  let light=dot(body.rgb,vec3f(0.299,0.587,0.114));
  let blade=(xy-vec2f(52,121))/vec2f(26,23);
  let waist=(xy-vec2f(51,167))/vec2f(30,12);
  let form=clamp((light-0.47)*1.16,-0.23,0.30)+0.14*exp(-dot(blade,blade))-0.17*exp(-dot(waist,waist));
  return vec4f(cloth.rgb*(v.shade+pressure*form),cloth.a*v.opacity);
}`;
function weight(x:number,y:number,j:Joint){
  const u=(x-j[0])/j[2],v=(y-j[1])/j[3];return Math.exp(-1.45*(u*u+v*v));
}
const cols=40,rows=32,count=(cols+1)*(rows+1);
function skin(r:Rig) {
  return Array.from({length:count},(_,i)=>{
    const u=(i%(cols+1))/cols,v=Math.floor(i/(cols+1))/rows,x=u*r.width,y=v*r.height;
    const hat = r.role==='glide' ? (1-smooth(93,122,y))*smooth(167,210,x)*(1-smooth(407,440,x)) : 0;
    // Restrict the smaller folds to the hanging robe, sleeve cloth and shoulder cape.
    const skirt=smooth(229,249,y)*(1-smooth(274,284,y))*smooth(22,38,x)*(1-smooth(133,145,x));
    const sleeves=smooth(134,147,y)*(1-smooth(160,172,y))*Math.max(1-smooth(26,40,x),smooth(89,99,x)*(1-smooth(116,128,x)));
    const collar=smooth(102,118,y)*(1-smooth(130,142,y))*smooth(55,78,x)*(1-smooth(104,116,x));
    return {x,y,u,v,hat,skirt,sleeves,collar,head:weight(x,y,r.head),left:weight(x,y,r.handL),right:weight(x,y,r.handR),
      cloth:weight(x,y,r.cloth),hem:weight(x,y,r.fringe),silk:weight(x,y,r.tassel),jar:weight(x,y,r.gourd),
      boot:weight(x,y,r.boots),ripple:u*9-v*6,
      // Turn the entire outer wing around the nape. A point weight alone would leave a detached hand.
      span:smooth(9,175,Math.abs(x-r.anchor[0]))*(1-smooth(132,274,y))*smooth(38,77,y)};
  });
}
interface PaintSource {getBitmap(id:string):Promise<ImageBitmap|OffscreenCanvas|null>}
export function hero(ctx:NodeScriptContext,actors:EntityHandle[],id:string) {
  const W=420,H=356,pinX=245,pinY=147,standingScale=.485;
  const surface=ctx.createGpuSurface({imageId:id+'-silk',width:W*2,height:H*2,sampling:'linear'});
  let node:ReturnType<typeof ctx.scene.create>|undefined,disposed=false;
  let soft=0,jar=0,jarSpeed=0,tuft=0,billow=0;
  const strips=pieces.map(piece=>clothStrip(piece,cols,rows));
  const cape=capePanel(cols);
  const meshes=rigs.map(skin);
  const vertices=new Float32Array(count*6*(pieces.length+3));
  const indices=[];
  for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
    const a=j*(cols+1)+i,b=a+cols+1;indices.push(a,b,a+1,a+1,b,b+1);
  }
  const tris=new Uint16Array(indices);
  async function mount(){
    await surface.ready;if(disposed)return;
    const device=surface.device,registry=ctx.instance.app.getResourcePool().imageRegistry as unknown as PaintSource;
    const bitmaps=await Promise.all(actors.map(a=>registry.getBitmap(a.design().media!.assetId)));
    if(disposed)return;
    const sh=device.createShaderModule({code:shader});
    const descriptor:GPURenderPipelineDescriptor={layout:'auto',vertex:{module:sh,entryPoint:'vs',buffers:[{arrayStride:24,attributes:[
      {shaderLocation:0,offset:0,format:'float32x2'},{shaderLocation:1,offset:8,format:'float32x2'},{shaderLocation:2,offset:16,format:'float32'},{shaderLocation:3,offset:20,format:'float32'}]}]},
      fragment:{module:sh,entryPoint:'fs',targets:[{format:'rgba8unorm',blend:{color:{srcFactor:'src-alpha',dstFactor:'one-minus-src-alpha'},alpha:{srcFactor:'one',dstFactor:'one-minus-src-alpha'}}}]},
      primitive:{topology:'triangle-list'}};
    const [pipeline,clothPipeline]=await Promise.all([
      device.createRenderPipelineAsync(descriptor),
      device.createRenderPipelineAsync({...descriptor,fragment:{...descriptor.fragment!,entryPoint:'pressedCloth'}})
    ]);
    if(disposed)return;
    const sampler=device.createSampler({magFilter:'linear',minFilter:'linear'});
    const station=bitmaps[0];
    if(!station)throw Error('缺少崖边立姿原画');
    const {body,layers:looseCloth,foreground,relief}=cutStation(station);
    const views=[body,bitmaps[1],...looseCloth,foreground,relief].map(bmp=>{
      if(!bmp)throw Error('无法读取角色图层');
      const texture=surface.own(device.createTexture({size:[bmp.width,bmp.height],format:'rgba8unorm',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT}));
      device.queue.copyExternalImageToTexture({source:bmp},{texture},[bmp.width,bmp.height]);
      return texture.createView();
    });
    const bind=(layout:GPUBindGroupLayout,view:GPUTextureView)=>device.createBindGroup({layout,entries:[
      {binding:0,resource:view},{binding:1,resource:sampler}]});
    const groups=views.slice(0,-1).map(view=>bind(pipeline.getBindGroupLayout(0),view));
    const frontGear=groups[groups.length-1];
    const capeInk=bind(clothPipeline.getBindGroupLayout(0),views[2]);
    const frame=surface.own(device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}));
    const contactFrame=new Float32Array([.5/standingScale,rigs[0].anchor[0]-pinX/standingScale,
      rigs[0].anchor[1]-pinY/standingScale,0]);
    const reliefGroup=device.createBindGroup({layout:clothPipeline.getBindGroupLayout(1),entries:[
      {binding:0,resource:views[views.length-1]},{binding:1,resource:{buffer:frame}}]});
    const verts=surface.own(device.createBuffer({size:vertices.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}));
    const ix=surface.own(device.createBuffer({size:tris.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}));
    device.queue.writeBuffer(ix,0,tris);
    node=ctx.scene.create('image',{id:id+'-actor',name:'风大侠 · 衣料与配饰',assetId:surface.imageId,position:{x:0,y:0},size:{width:W,height:H},fit:'FILL',interactive:false});
    ctx.scene.get(ctx.nodeId)!.append(node);
    const render=(s:Run,dt:number)=>{
      const airborne=['jump','glide','lost'].includes(s.mode);
      const a=wind(s.x,s.y-55,s.time,s.seed);
      // Relative airflow on the moving body. Silk responds immediately; the heavier flask is a damped pendulum.
      const relX=clamp((a.across-s.vx)/145,-1.7,1.6),relUp=clamp((a.up+s.vy)/310,-1.2,1.5);
      soft+=(relX-soft)*(1-Math.exp(-dt*8));tuft+=(relX-tuft)*(1-Math.exp(-dt*14));
      const jarTarget=clamp(.25*relX-s.ax*.0013,-.7,.7);
      jarSpeed+=(30*(jarTarget-jar)-5.8*jarSpeed)*dt;jar+=jarSpeed*dt;
      billow+=(relUp-billow)*(1-Math.exp(-dt*4));

      const reach=s.grip;
      const landing=s.mode==='land'||s.mode==='returned'?1-smooth(0,.30,s.age):0;
      const grounded=1-landing;
      const layers:[number,number][]=airborne?[[1,1]]:[
        [3,grounded],[4,grounded],[0,grounded],[2,grounded],
        [5,grounded],[6,grounded],[7,grounded],[1,landing],
      ];
      const history=airborne?undefined:clothHistory(s);
      if(history){strips.forEach(strip=>strip.update(history,s.time));cape.update(history,s.time);}
      const active=layers.filter(pair=>pair[1]>.001);
      const sink=s.mode==='lost'?Math.min(250,s.age*s.age*240):0;
      const bob=s.mode==='land'||s.mode==='returned'?10*Math.sin(Math.min(1,s.age/.36)*Math.PI):0;
      const baseY=s.y-121+bob+sink;
      node!.setPosition(s.x-pinX,baseY-pinY);
      const angle=(airborne?s.pitch*.85+(s.mode==='lost'?Math.min(28,s.age*50):0):0)*Math.PI/180;
      const ca=Math.cos(angle),sa=Math.sin(angle);
      for(const [layer,[pose,opacity]] of active.entries()){
        const airPose=pose===1,index=airPose?1:0;
        const strip=pose>2?strips[pose-3]:undefined;
        const r=rigs[index],tex=meshes[index],scale=airPose?.54:standingScale;
        const fold=airPose?(1-reach)*.81:0;
        for(let i=0;i<count;i++){
          const p=tex[i];let x=p.x-r.anchor[0],y=p.y-r.anchor[1],u=p.u,v=p.v,shade=1;
          const originalX=x;
          if(airPose){
            const loose=1-reach;
            const sleeve=1-smooth(144,278,p.y);
            const outerTail=(1-smooth(140,242,p.x))*smooth(126,210,p.y);
            const gather=Math.max(sleeve*smooth(32,72,p.y),outerTail);
            x*=1-fold*.82*gather;
            x+=loose*p.hem*12;
            y+=loose*(48*p.left+41*p.right+55*p.hem);
            // A low hanging belly pulls tight between the wrists, then the wind domes its centre.
            const centre=p.cloth*(1-.85*Math.max(p.left,p.right));
            y+=centre*(44-94*s.pressure)+p.hem*(26-49*s.pressure);
            x+=p.hem*(10*soft-14*(1-s.pressure));
            y+=p.boot*(8*s.load-25*(1-reach)+Math.sin(s.time*4.3)*2);
            x+=p.boot*18*(1-reach);
            const wave=Math.sin(s.time*4.8+p.ripple+a.curl*1.4);
            x+=p.head*(tuft*10+wave*1.7)+p.hem*(soft*13+wave*(2+Math.abs(soft)*2));
            y+=p.hem*(wave*(4+Math.abs(soft)*5)-billow*14)+p.head*(wave*1.5-billow*4);
            x+=p.silk*(22*soft+wave*4.3);y+=p.silk*(-12*relUp+Math.sin(s.time*7.2+p.ripple)*4);
            x+=p.jar*jar*23;y+=p.jar*(Math.abs(jar)*3-2*jarSpeed);
            y+=p.span*originalX*.027*a.curl*s.pressure;
            if(p.hat>0){
              // The crown, brim, face and neck share the body's single rigid transform.
              x+=(originalX-x)*p.hat;
              y+=(p.y-r.anchor[1]-y)*p.hat;
            }
          }else if(pose===2){
            const col=cape.columns[cols-i%(cols+1)];
            const across=(200*p.v-col.top)/(col.bottom-col.top);
            const clothX=col.x0+(col.x1-col.x0)*across;
            const clothY=col.y0+(col.y1-col.y0)*across;
            // The inside edge wraps across the ribs to the near arm as slack is taken up.
            const ribs=smooth(133,157,clothY)*(1-smooth(171,201,clothY))
              *smooth(22,63,clothX)*(1-smooth(103,152,clothX));
            x=clothX+cape.contact*ribs*16-r.anchor[0];
            y=clothY-r.anchor[1];
            shade+=col.shade;
          }else if(strip){
            const q=strip.points[i],k=q.col*4,left=strip.rails[0],right=strip.rails[1];
            const dx=left[k+2]+(right[k+2]-left[k+2])*q.v;
            const dy=left[k+3]+(right[k+3]-left[k+3])*q.v;
            x=left[k]+(right[k]-left[k])*q.v+dx*q.side-r.anchor[0];
            y=left[k+1]+(right[k+1]-left[k+1])*q.v+dy*q.side-r.anchor[1];
            u=q.u;v=q.vTex;
            const free=smooth(.09,.68,q.col/cols),load=history![0];
            shade+=free*(.045+.087*load.strength)*ripple(q.col/cols,s.time,load.curl,pieces[pose-3].phase+q.v*.9);
          }else{
            const load=history![0],weight=p.skirt+p.sleeves*.56+p.collar*.41;
            if(weight>0){
              const along=clamp((p.y-223)/61);
              const fold=ripple(along,s.time,load.curl,p.u*3.2);
              x+=weight*load.reach*(3.8+fold*(2.1+2.5*load.strength));
              y+=weight*(fold*(.9+2.2*load.strength)-1.8*load.lift);
              shade+=weight*fold*(.048+.043*load.strength);
            }
          }
          const k=(layer*count+i)*6;
          vertices[k]=(pinX+scale*(x*ca-y*sa))/W*2-1;
          vertices[k+1]=1-(pinY+scale*(x*sa+y*ca))/H*2;
          vertices[k+2]=u;vertices[k+3]=v;vertices[k+4]=opacity*(s.mode==='lost'?clamp(1-s.age):1);vertices[k+5]=shade;
        }
      }
      device.queue.writeBuffer(verts,0,vertices,0,active.length*count*6);
      const bodyLayer=active.findIndex(([pose])=>pose===0);
      const pressed=bodyLayer>=0&&cape.contact>0;
      if(pressed){contactFrame[3]=cape.contact;device.queue.writeBuffer(frame,0,contactFrame);}
      surface.render(({encoder,color})=>{
        const pass=encoder.beginRenderPass({colorAttachments:[{view:color,loadOp:'clear',storeOp:'store',clearValue:[0,0,0,0]}]});
        pass.setPipeline(pipeline);pass.setIndexBuffer(ix,'uint16');pass.setVertexBuffer(0,verts);
        const draw=(group:GPUBindGroup,i:number)=>{
          pass.setBindGroup(0,group);pass.drawIndexed(tris.length,1,0,i*count);
        };
        active.forEach(([pose],i)=>{
          if(pose===2&&pressed){
            pass.setPipeline(clothPipeline);pass.setBindGroup(1,reliefGroup);draw(capeInk,i);
            pass.setPipeline(pipeline);
          }else draw(groups[pose],i);
          if(pose===2&&bodyLayer>=0)draw(frontGear,bodyLayer);
        });
        pass.end();
      });
    };
    return render;
  }
  return {mount,dispose(){disposed=true;node?.remove();surface.dispose();}};
}
