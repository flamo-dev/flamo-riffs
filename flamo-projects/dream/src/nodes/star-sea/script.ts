import {nebulaWGSL,nebulaGLSL} from './nebula';
import {createViewport} from './viewport';
import {defineNodeScript} from '/vendor/flamo-runtime/index.es.js';
import {DreamPainter,type Ripple} from './painter';
import {clamp,type Point} from './model';

export default defineNodeScript({setup(_props,ctx){
 const root=ctx.node(),lineNode=ctx.role('threads'),dotNode=ctx.role('starlight'),still=ctx.role('still');
 if(!root||!lineNode||!dotNode||typeof ctx.createShapeBatch!=='function')throw new Error('Dream requires the Flamo polygon batch Runtime and bound visual roles');
 const painter=new DreamPainter(ctx,lineNode,dotNode);
 // Frame this artwork's viewport after the host's initial scene framing.
 const query=new URLSearchParams(location.search);
 const wallpaper=query.get('wallpaper')==='1';
 const interactive=!wallpaper||query.get('interactive')==='1';
 const viewport=createViewport(ctx,wallpaper);
 const newSeed=()=>crypto.getRandomValues(new Uint32Array(1))[0];
 const seedText=wallpaper?query.get('seed'):null;
 const seed=seedText!==null&&/^[0-9]+$/.test(seedText)?Number(seedText):NaN;
 const initialSeed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:newSeed();painter.world.reset(initialSeed);painter.meteors.reset(initialSeed);
 ctx.role('background')?.setVisible(false);
 let initialCamera:ReturnType<typeof ctx.camera.get>|undefined;let initialSize='';
 const fit=()=>{ctx.camera.fit({x:0,y:0,width:1600,height:1000},{padding:16});initialCamera={...ctx.camera.get()};initialSize=`${innerWidth}:${innerHeight}`;};
 const fitTimer=setTimeout(fit,400);
 const media=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
 const reduced=media?.matches??false;
 const state=ctx.reactive({paused:false,time:0,touches:0,collisions:0});
 let pointer:Point={x:800,y:500},target:Point={x:800,y:500},active=false,disposed=false,last=performance.now(),lastTrace=-10;
 let ripples:Ripple[]=[];
 const aura=ctx.role('collisionAura');
 still?.setVisible(false);aura?.setOpacity(0);
 // A bounded test witness subscribes before mount. Never writes Runtime's trace store.
 const remember=(action:string,detail:Record<string,unknown>={})=>{
  const data={time:Number(state.time.toFixed(3)),paused:state.paused,...detail};
  ctx.trace(action,data);
  window.dispatchEvent(new CustomEvent('dream:trace',{detail:{action,detail:data}}));
 };
 // Native scene remains editable. Only its opaque runtime backdrop is cleared.
 const originalFills=root.design().appearance?.fills;
 const nebula=ctx.createShaderLayer({wgsl:nebulaWGSL,glsl:nebulaGLSL,label:'Dream / filament nebula',phase:'background'});
 let nebulaTime=0,lastNebulaTrace=-10;
 nebula.setTime(0);
 nebula.ready.then(()=>{if(disposed)return;root.setFill([]);remember('nebula.ready',{status:nebula.status});}).catch(error=>{
  remember('nebula.error',{status:nebula.status,error:String(error)});console.error('Dream nebula compilation failed',error);
 });
 if(!wallpaper)ctx.node('778376733:28')?.setText('拖动漫游 · 滚轮远近 · 重返最初梦境');
 let previousFrame:ReturnType<DreamPainter['render']>|undefined,previousKey='';
 // The interactive full-screen root consumes native camera hit-testing. Own only
 // primary background gestures; controls keep their canonical activation route.
 let gesture:{id:number;start:Point;camera:ReturnType<typeof ctx.camera.get>;dragging:boolean}|undefined;
 const controls=['replay'].map(role=>ctx.role(role)?.id);
 const excluded=(e:{target?:string;composedPath?:()=>string[];coordinates:{view:Point}})=>{
  const path=e.composedPath?.()??[e.target];
  return viewport.hitControls(e.coordinates.view)||controls.some(id=>id&&path.includes(id))||[34].some(id=>e.target===ctx.node(`778376733:${id}`)?.id);
 };
 if(interactive){
 // Export hosts disable native camera controls (pan/zoom=false). Only wallpaper
 // owns wheel here; ordinary preview keeps its existing native zoom route.
 if(wallpaper)ctx.on('wheel',e=>{
  if(excluded(e)||!Number.isFinite(e.deltaY)||e.deltaY===0)return;
  const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
  const zoom=clamp(ctx.camera.get().zoom*Math.exp(-clamp(pixels,-1000,1000)*.001),.0625,8);
  ctx.camera.zoomTo(zoom);
  e.preventDefault();
 },{passive:false});
 ctx.on('pointerdown',e=>{
  if(!e.pointer.isPrimary||e.pointer.button!==0||excluded(e))return;
  gesture={id:e.pointer.pointerId,start:{...e.coordinates.view},camera:ctx.camera.get(),dragging:false};
 });
 ctx.on('pointermove',e=>{
  if(gesture&&gesture.id===e.pointer.pointerId){
   const dx=e.coordinates.view.x-gesture.start.x,dy=e.coordinates.view.y-gesture.start.y;
   gesture.dragging ||= Math.hypot(dx,dy)>6;
   if(gesture.dragging){const c=gesture.camera;
    ctx.camera.panTo({x:c.positionX-dx/c.zoom,y:c.positionY-dy/c.zoom});
    active=false;e.preventDefault();return;
   }
  }
  if(!excluded(e)){target=e.coordinates.world;active=true;}
 });
 ctx.on('pointerup',e=>{
  if(!gesture||gesture.id!==e.pointer.pointerId)return;
  const wasDrag=gesture.dragging;gesture=undefined;
  if(wasDrag){remember('dream.pan',{...ctx.camera.get()});return;}
  if(excluded(e))return;
  const point=e.coordinates.world;target=point;active=true;
  ripples.push({...point,time:state.time});ripples=ripples.slice(-8);state.touches++;
  remember('dream.touch',{x:point.x,y:point.y,touches:state.touches});
 });
 const cancel=()=>{gesture=undefined;active=false;target={x:800,y:500};};
 ctx.on('pointerleave',cancel);ctx.on('pointercancel',cancel);
 }
 if(!wallpaper){
 ctx.onActivate('replay',()=>{
  const before={camera:ctx.camera.get(),time:state.time,shaderTime:nebulaTime,meteors:painter.meteors.meteors.length,bursts:painter.meteors.bursts.length,ripples:ripples.length,touches:state.touches,collisions:state.collisions};
  clearTimeout(fitTimer);
  if(!initialCamera||initialSize!==`${innerWidth}:${innerHeight}`)fit();else ctx.camera.set({...initialCamera});
  painter.world.reset(initialSeed);painter.meteors.reset(initialSeed);
  state.time=0;state.paused=false;state.touches=0;state.collisions=0;
  nebulaTime=0;nebula.setTime(0);lastNebulaTrace=-10;lastTrace=-10;
  ripples=[];pointer={x:800,y:500};target={x:800,y:500};active=false;gesture=undefined;
  previousFrame=undefined;previousKey='';last=performance.now();
  remember('dream.replay',{seed:initialSeed,before,initialCamera,after:{camera:ctx.camera.get(),time:0,shaderTime:0,meteors:0,bursts:0,ripples:0,touches:0,collisions:0,gesture:false}});
 });
 }
 let observedZoom=ctx.camera.get().zoom;
 function draw(now:number){if(disposed)return;const dt=clamp((now-last)/1000,0,.1);last=now;
  nebulaTime+=dt;nebula.setTime(nebulaTime);
  if(nebula.status==='ready'&&nebulaTime-lastNebulaTrace>=5){lastNebulaTrace=nebulaTime;remember('nebula.frame',{shaderTime:nebulaTime,status:nebula.status});}
  if(!state.paused){state.time+=dt*(reduced?.35:1);pointer.x+=(target.x-pointer.x)*Math.min(1,dt*3);pointer.y+=(target.y-pointer.y)*Math.min(1,dt*3);}
  ripples=ripples.filter(r=>state.time-r.time<4);
  const view=viewport.update();
  // A paused, unchanged view reuses both GPU buffers, including pointer/ripple input.
  const key=[state.time,view.width,view.height,view.center.x,view.center.y,view.zoom,painter.world.seed].join(':');
  const started=performance.now(),updated=!previousFrame||key!==previousKey;
  const frame=updated?painter.render({time:state.time,pointer,pointerActive:active,ripples,reduced,view}):previousFrame!;
  previousFrame=frame;previousKey=key;
  if(updated)for(const event of painter.meteors.events){if(event.action==='dream.collision')state.collisions++;remember(event.action,event.detail);}
  const zoom=ctx.camera.get().zoom;if(zoom!==observedZoom){remember('dream.zoom',{before:observedZoom,after:zoom});observedZoom=zoom;}
  window.dispatchEvent(new CustomEvent('dream:telemetry',{detail:{...frame,time:state.time,paused:state.paused,dt,wallTime:now,cpuBuildMs:performance.now()-started,updated}}));
  if(state.time-lastTrace>=4){lastTrace=state.time;remember('dream.frame',{...frame,touches:state.touches,collisions:state.collisions});}

 }
 remember('dream.mounted',{seed:painter.world.seed,reduced});
 // Public manifest signature; generated declaration snapshot has not caught up.
 const stopUpdate=(ctx as typeof ctx & {onUpdate(callback:(deltaTime:number)=>void):()=>void}).onUpdate(()=>draw(performance.now()));
 ctx.dispose(()=>{disposed=true;stopUpdate();clearTimeout(fitTimer);nebula.dispose();if(originalFills)root.setFill(originalFills);painter.dispose();viewport.dispose();ctx.role('background')?.setVisible(true);still?.setVisible(true);aura?.setOpacity(0);});
}});
