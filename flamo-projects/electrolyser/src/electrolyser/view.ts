import { surfaceTile, workshopLight } from './finish';
import type { Piece } from './parts';
import { buildCell } from './cell';
import { add, cross, dot, finishes, mul, sub, unit, type V } from './mesh';
import { composite, depthFragment, depthVertex, fragment, fullVertex, vertex } from './shading';

type M=Float32Array;
function product(a:M,b:M){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let i=0;i<4;i++)o[c*4+r]+=a[i*4+r]*b[c*4+i];return o;}
function inverse(m:M){
  const a=Array.from({length:4},(_,i)=>[m[i],m[4+i],m[8+i],m[12+i],...Array.from({length:4},(_,j)=>Number(j===i))]);
  for(let i=0;i<4;i++){let pivot=i;for(let j=i+1;j<4;j++)if(Math.abs(a[j][i])>Math.abs(a[pivot][i]))pivot=j;
    [a[i],a[pivot]]=[a[pivot],a[i]];const t=a[i][i];for(let k=0;k<8;k++)a[i][k]/=t;
    for(let j=0;j<4;j++){if(j===i)continue;const v=a[j][i];for(let k=0;k<8;k++)a[j][k]-=v*a[i][k];}}
  return new Float32Array(Array.from({length:16},(_,i)=>a[i%4][4+Math.floor(i/4)]));
}
function look(eye:V,at:V){const z=unit(sub(eye,at)),x=unit(cross([0,1,0],z)),y=cross(z,x);
  return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
function perspective(aspect:number){const v=1/Math.tan(32*Math.PI/360),n=.24,f=420;
  return new Float32Array([v/aspect,0,0,0,0,v,0,0,0,0,(f+n)/(n-f),-1,0,0,2*f*n/(n-f),0]);}
function illumination(direction:V, amount:number) {
  const centre:V=[0,2.4+amount*7,0], distance=31+amount*19;
  const view=look(add(centre,mul(unit(direction),distance)),centre);
  const projection=new Float32Array([1/(13.85+8*amount),0,0,0,0,1/(12.4+9*amount),0,0,0,0,-1/distance,0,0,0,-1,1]);
  return product(projection,view);
}
export interface ModelPiece extends Piece { id:number; min:V; max:V }
export type ProjectPoint=(p:V)=>{x:number;y:number};

export interface Camera {yaw:number; pitch:number; zoom:number; focus:V}
export const home=():Camera=>({yaw:-.85,pitch:.265,zoom:1,focus:[0,1.82,.10]});
function camera(state:Camera,aspect:number,amount:number,selected?:ModelPiece){
  let focus:V=[state.focus[0],state.focus[1]+amount*8.4,state.focus[2]];
  let distance=27.9+amount*18.6;
  const yaw=state.yaw+amount*.47, pitch=state.pitch+amount*.014;
  if(selected){
    focus=selected.min.map((v,i)=>(v+selected.max[i])*.5) as V;
    const size=sub(selected.max,selected.min);
    distance=Math.max(1.65,Math.hypot(size[0]/aspect,size[1],size[2])*2.55);
    focus=add(focus,sub(state.focus,home().focus));
  }
  const cs=Math.cos(pitch),dir:V=[Math.sin(yaw)*cs,Math.sin(pitch),Math.cos(yaw)*cs];
  const dist=distance*state.zoom*Math.max(1,1.65/aspect),eye=add(focus,mul(dir,dist));
  const matrix=product(perspective(aspect),look(eye,focus));
  // Optical shift centres the whole long assembly in its three-quarter portrait.
  const shift=selected?0:(-.135*Math.sin(2*yaw)*(1-amount)-.04*amount)*Math.min(1,state.zoom);
  for(let i=0;i<4;i++)matrix[i*4]+=matrix[i*4+3]*shift;
  return {eye,matrix};
}
export function makeView(canvas:OffscreenCanvas|HTMLCanvasElement){
  const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:true,premultipliedAlpha:false,preserveDrawingBuffer:true}) as WebGL2RenderingContext|null;
  if(!gl)throw new Error('WebGL 2 is required to display the electrolyser');
  const g=gl,drop:(()=>void)[]=[];
  function program(vs:string,fs:string){
    const p=g.createProgram()!;
    for(const [type,source] of [[g.VERTEX_SHADER,vs],[g.FRAGMENT_SHADER,fs]] as const){
      const s=g.createShader(type)!;g.shaderSource(s,source);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw new Error(g.getShaderInfoLog(s)||'shader compilation');
      g.attachShader(p,s);g.deleteShader(s);}
    g.linkProgram(p);if(!g.getProgramParameter(p,g.LINK_STATUS))throw new Error(g.getProgramInfoLog(p)||'shader link');drop.push(()=>g.deleteProgram(p));return p;
  }
  const solids=program(vertex,fragment),caster=program(depthVertex,depthFragment),finish=program(fullVertex,composite);
  const loc=(p:WebGLProgram,key:string)=>g.getUniformLocation(p,key);
  const buffer=(kind:number,array:Float32Array|Uint32Array)=>{const b=g.createBuffer();g.bindBuffer(kind,b);g.bufferData(kind,array,g.STATIC_DRAW);drop.push(()=>g.deleteBuffer(b));};
  const batches=buildCell(),packed:number[]=[],indices:number[]=[];
  const pieces=new Map<string,ModelPiece>(),motion:number[]=[];
  for(const b of batches){
    let part=pieces.get(b.part);
    if(!part){
      part={...b.piece,id:pieces.size+1,min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
      pieces.set(b.part,part);
    }
    for(let i=0;i<b.pos.length;i+=3){
      for(let axis=0;axis<3;axis++){
        part.min[axis]=Math.min(part.min[axis],b.pos[i+axis]);
        part.max[axis]=Math.max(part.max[axis],b.pos[i+axis]);
      }
      motion.push(...part.offset,part.id);
    }
    const offset=packed.length/13,mat=finishes[b.mat];
    for(let i=0;i<b.tint.length;i++)packed.push(...b.pos.slice(3*i,3*i+3),...b.normal.slice(3*i,3*i+3),...mat.color,mat.rough,mat.metal,mat.texture,b.tint[i]);
    for(const idx of b.index)indices.push(offset+idx);
  }
  const modelCount=indices.length,ground=packed.length/13;
  for(const [x,z] of [[-180,-180],[-180,180],[180,180],[180,-180]])packed.push(x,-.009,z,0,1,0,.30,.34,.37,.81,.04,9,1);
  indices.push(ground,ground+1,ground+2,ground,ground+2,ground+3);
  const geometry=g.createVertexArray()!;g.bindVertexArray(geometry);drop.push(()=>g.deleteVertexArray(geometry));
  buffer(g.ARRAY_BUFFER,new Float32Array(packed));buffer(g.ELEMENT_ARRAY_BUFFER,new Uint32Array(indices));
  for(const [i,n,offset] of [[0,3,0],[1,3,3],[2,3,6],[3,4,9]]){g.enableVertexAttribArray(i);g.vertexAttribPointer(i,n,g.FLOAT,false,52,offset*4);}
  motion.push(...Array(16).fill(0));
  buffer(g.ARRAY_BUFFER,new Float32Array(motion));g.enableVertexAttribArray(4);g.vertexAttribPointer(4,4,g.FLOAT,false,16,0);
  function target(w:number,h:number,internal:number,format:number,type:number,linear=false){
    const t=g.createTexture()!;g.bindTexture(g.TEXTURE_2D,t);g.texImage2D(g.TEXTURE_2D,0,internal,w,h,0,format,type,null);
    g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,linear?g.LINEAR:g.NEAREST);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,linear?g.LINEAR:g.NEAREST);
    g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);drop.push(()=>g.deleteTexture(t));return t;
  }
  function framebuffer(){const f=g.createFramebuffer();g.bindFramebuffer(g.FRAMEBUFFER,f);drop.push(()=>g.deleteFramebuffer(f));return f;}
  function check(){const status=g.checkFramebufferStatus(g.FRAMEBUFFER);if(status!==g.FRAMEBUFFER_COMPLETE)throw new Error('Framebuffer status '+status);}
  const patina=g.createTexture()!;g.bindTexture(g.TEXTURE_2D,patina);
  const samples8=Uint8Array.from(atob(surfaceTile),c=>c.charCodeAt(0));
  g.texImage2D(g.TEXTURE_2D,0,g.R8,128,128,0,g.RED,g.UNSIGNED_BYTE,samples8);
  g.generateMipmap(g.TEXTURE_2D);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR_MIPMAP_LINEAR);
  g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.MIRRORED_REPEAT);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.MIRRORED_REPEAT);
  drop.push(()=>g.deleteTexture(patina));
  const roomTexture=g.createTexture()!;g.bindTexture(g.TEXTURE_2D,roomTexture);
  g.texImage2D(g.TEXTURE_2D,0,g.R8,256,64,0,g.RED,g.UNSIGNED_BYTE,Uint8Array.from(atob(workshopLight),c=>c.charCodeAt(0)));
  g.generateMipmap(g.TEXTURE_2D);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR_MIPMAP_LINEAR);
  g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.MIRRORED_REPEAT);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.MIRRORED_REPEAT);
  drop.push(()=>g.deleteTexture(roomTexture));
  const directions:V[]=[[-.527,.767,.365],[.359,.801,-.479]];
  function shadowMap(){
    const size=Math.min(3072,g.getParameter(g.MAX_TEXTURE_SIZE) as number);
    const t=target(size,size,g.DEPTH_COMPONENT24,g.DEPTH_COMPONENT,g.UNSIGNED_INT,true);
    g.texParameteri(g.TEXTURE_2D,g.TEXTURE_COMPARE_MODE,g.COMPARE_REF_TO_TEXTURE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_COMPARE_FUNC,g.LEQUAL);
    const f=framebuffer();g.framebufferTexture2D(g.FRAMEBUFFER,g.DEPTH_ATTACHMENT,g.TEXTURE_2D,t,0);
    g.drawBuffers([g.NONE]);g.readBuffer(g.NONE);check();
    return {texture:t,fbo:f,size};
  }
  const shadows=directions.map(()=>shadowMap());
  let lastAmount=-1,lastSelected=-1;
  let lights:M[]=[];
  function shape(p:WebGLProgram,amount:number,selected:number){
    g.uniform1f(loc(p,'exploded'),amount);g.uniform1f(loc(p,'selected'),selected);
  }
  function updateShadows(amount:number,selected:number){
    if(amount===lastAmount&&selected===lastSelected)return;
    lights=directions.map(d=>illumination(d,amount));
    g.enable(g.DEPTH_TEST);g.useProgram(caster);shape(caster,amount,selected);
    shadows.forEach(({fbo,size},i)=>{
      g.bindFramebuffer(g.FRAMEBUFFER,fbo);g.viewport(0,0,size,size);g.clear(g.DEPTH_BUFFER_BIT);
      g.uniformMatrix4fv(loc(caster,'lightMatrix'),false,lights[i]);g.drawElements(g.TRIANGLES,modelCount,g.UNSIGNED_INT,0);
    });
    lastAmount=amount;lastSelected=selected;
  }
  const {width:w,height:h}=canvas,lit=target(w,h,g.RGBA8,g.RGBA,g.UNSIGNED_BYTE,true),normal=target(w,h,g.RGBA8,g.RGBA,g.UNSIGNED_BYTE),depth=target(w,h,g.DEPTH_COMPONENT24,g.DEPTH_COMPONENT,g.UNSIGNED_INT);
  const attachments=[g.COLOR_ATTACHMENT0,g.COLOR_ATTACHMENT1,g.DEPTH_ATTACHMENT],outputs=[lit,normal,depth],resolved=framebuffer();
  outputs.forEach((tex,i)=>g.framebufferTexture2D(g.FRAMEBUFFER,attachments[i],g.TEXTURE_2D,tex,0));g.drawBuffers(attachments.slice(0,2));check();
  const samples=Math.min(4,g.getParameter(g.MAX_SAMPLES) as number);
  const msaa=framebuffer();for(let i=0;i<3;i++){const rb=g.createRenderbuffer()!;g.bindRenderbuffer(g.RENDERBUFFER,rb);
    g.renderbufferStorageMultisample(g.RENDERBUFFER,samples,i<2?g.RGBA8:g.DEPTH_COMPONENT24,w,h);g.framebufferRenderbuffer(g.FRAMEBUFFER,attachments[i],g.RENDERBUFFER,rb);drop.push(()=>g.deleteRenderbuffer(rb));}
  g.drawBuffers(attachments.slice(0,2));check();
  const bind=(p:WebGLProgram,name:string,id:number,texture:WebGLTexture)=>{g.activeTexture(g.TEXTURE0+id);g.bindTexture(g.TEXTURE_2D,texture);g.uniform1i(loc(p,name),id);};
  let disposed=false;
  return {pieces:[...pieces.values()],draw(state:Camera,progress=0,selected?:ModelPiece){
    if(disposed)return;
    const amount=selected?0:progress,id=selected?.id??0;
    const view=camera(state,w/h,amount,selected);g.bindVertexArray(geometry);
    updateShadows(amount,id);g.bindFramebuffer(g.FRAMEBUFFER,msaa);
    g.viewport(0,0,w,h);g.drawBuffers(attachments.slice(0,2));g.clearColor(.029,.038,.048,1);g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);
    g.enable(g.DEPTH_TEST);g.useProgram(solids);shape(solids,amount,id);g.uniformMatrix4fv(loc(solids,'vp'),false,view.matrix);g.uniform3fv(loc(solids,'eye'),view.eye);bind(solids,'patina',3,patina);bind(solids,'roofMap',4,roomTexture);
    lights.forEach((m,i)=>{g.uniformMatrix4fv(loc(solids,'light'+i),false,m);bind(solids,'shadow'+i,i,shadows[i].texture);});
    g.drawElements(g.TRIANGLES,indices.length,g.UNSIGNED_INT,0);
    g.bindFramebuffer(g.READ_FRAMEBUFFER,msaa);g.bindFramebuffer(g.DRAW_FRAMEBUFFER,resolved);
    for(let i=0;i<2;i++){g.readBuffer(attachments[i]);g.drawBuffers(i===0?[attachments[0]]:[g.NONE,attachments[1]]);
      g.blitFramebuffer(0,0,w,h,0,0,w,h,g.COLOR_BUFFER_BIT|(i===0?g.DEPTH_BUFFER_BIT:0),g.NEAREST);}
    g.bindFramebuffer(g.FRAMEBUFFER,null);g.bindVertexArray(null);g.disable(g.DEPTH_TEST);g.useProgram(finish);
    bind(finish,'lit',0,lit);bind(finish,'normals',1,normal);bind(finish,'depth',2,depth);g.uniform2f(loc(finish,'pixels'),1/w,1/h);
    g.uniformMatrix4fv(loc(finish,'invVP'),false,inverse(view.matrix));g.drawArrays(g.TRIANGLES,0,3);g.flush();
    const matrix=view.matrix;
    const project:ProjectPoint=([x,y,z])=>{
      const w=matrix[3]*x+matrix[7]*y+matrix[11]*z+matrix[15];
      return {x:(1+(matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12])/w)/2,
              y:(1-(matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13])/w)/2};
    };
    return project;
  },triangles:modelCount/3,dispose(){if(disposed)return;disposed=true;drop.reverse().forEach(fn=>fn());g.getExtension('WEBGL_lose_context')?.loseContext();}};
}
