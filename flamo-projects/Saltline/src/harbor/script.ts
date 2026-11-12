import { defineNodeScript, type RuntimeNode } from '/vendor/flamo-runtime/index.es.js';
import { createHarbor, width, height } from './renderer';
import { createGame } from '../game/game';

function findPortal(id:string,scope:Document|ShadowRoot):HTMLElement|null{
  const found=scope.getElementById(id);if(found)return found;
  for(const element of scope.querySelectorAll('*'))if(element.shadowRoot){const match=findPortal(id,element.shadowRoot);if(match)return match;}
  return null;
}
export default defineNodeScript({setup(_props,ctx){
  const parent=ctx.scene.get(ctx.nodeId);if(!parent)throw Error('Saltline 场景节点缺失');
  const key='saltline-'+ctx.instance.id+'-'+ctx.nodeId,marker='ui-'+key.replace(/[^\w-]/g,'-');
  const owned:RuntimeNode[]=[],cleanups:Array<()=>void>=[];
  let disposed=false,failure='',lastReport=0,live:Awaited<ReturnType<typeof createGame>>|undefined,renderer:Awaited<ReturnType<typeof createHarbor>>|undefined;
  const diag=document.createElement('output');diag.dataset.saltline=key;diag.hidden=true;document.body.append(diag);
  const surface=ctx.createGpuSurface({imageId:key,width,height,sampling:'linear'});
  const frame={x:0,y:0,z:0,yaw:0,pitch:0,fov:60,matrix:[] as number[]};
  let host:HTMLElement|null=null,boot:HTMLElement|null=null,presented=false;
  const loadingCard='<div data-boot style="position:absolute;inset:0;z-index:8;background:linear-gradient(#10151940,#10151990);color:#e8e4da;display:grid;align-content:center;justify-items:center;gap:14px;font:14px system-ui"><strong style="font-size:clamp(32px,6vw,76px);letter-spacing:.15em">SALTLINE</strong><span>正在准备港区…</span><progress aria-label="港区加载进度" max="100" value="65" style="width:min(320px,70%);height:4px;accent-color:#ffb347"></progress></div>';
  function progress(value:number,label:string){
    const bar=boot?.querySelector('progress'),caption=boot?.querySelector('span');
    if(bar)bar.value=value;if(caption)caption.textContent=label;
    host?.dispatchEvent(new CustomEvent('saltline-progress',{bubbles:true,composed:true,detail:{value,label}}));
  }
  const portal=ctx.scene.create('htmlSurface',{id:key+'-interface',name:'Saltline · 操作界面',size:{width,height},position:{x:0,y:0},interactive:true,
    backend:'dom-portal',eventMode:'dom',html:'<div id="'+marker+'" style="width:100%;height:100%"></div>'+loadingCard});
  parent.append(portal);owned.push(portal);
  const loading=ctx.scene.create('text',{id:key+'-loading',name:'加载状态',text:'正在载入 Saltline 港区…',position:{x:30,y:662},size:{width:1200,height:46},fontSize:22,fill:'#ffffff'});
  parent.append(loading);owned.push(loading);
  function report(){
    const g=live?.g;
    diag.textContent=JSON.stringify({ready:!!live&&!!renderer,error:failure,state:g?.game.state,ammo:g?.weapon.ammo,health:g?.player.health,
      kills:g?.combat.stats.kills,shots:g?.combat.stats.shots,alive:g?.enemies.aliveCount?.(),relays:g?.game.run.cut,x:g?.player.pos.x,z:g?.player.pos.z,...renderer?.inspect()});
  }
  function fail(error:unknown){if(disposed||failure)return;failure=String(error);console.error('[Saltline]',error);loading.setText('Saltline 加载失败 · '+failure);loading.setVisible(true);boot?.remove();(host||ctx.instance.canvas)?.dispatchEvent(new CustomEvent('saltline-error',{bubbles:true,composed:true}));report();}
  ctx.dispose(()=>{disposed=true;for(const fn of cleanups)fn();diag.remove();for(const node of owned)node.remove();surface.dispose();});
  ctx.onUpdate(delta=>{
    if(disposed||failure||!live||!renderer)return;
    try{live.update(delta);const g=live.g,c=g.camera;
      frame.x=c.position.x;frame.y=c.position.y;frame.z=c.position.z;frame.fov=c.fov;frame.matrix=c.matrixWorld.elements;
      renderer.draw(frame,g.time.t,g);
      if(!presented && renderer.inspect().finished>0){
        presented=true;if(host){host.inert=false;host.style.visibility='';}progress(100,'四号泊位已就绪');boot?.remove();loading.setVisible(false);ctx.role('poster')?.setVisible(false);
      }
      if(performance.now()-lastReport>250){report();lastReport=performance.now();}
    }catch(e){fail(e);}
  });
  void(async()=>{try{
    await ctx.scene.flush();
    for(let i=0;i<160&&!host&&!disposed;i++){host=findPortal(marker,document);if(!host)await new Promise(r=>setTimeout(r,40));}
    if(disposed)return;if(!host)throw Error('无法挂载操作界面');
    boot=host.parentElement?.querySelector('[data-boot]')??null;
    progress(65,'正在启动 Flamo 渲染');
    host.inert=true;host.style.visibility='hidden';
    const [nextRenderer,game]=await Promise.all([
      createHarbor(surface,progress),
      createGame(host,fn=>{if(disposed)fn();else cleanups.push(fn);}),
    ]);
    if(disposed)return;
    const picture=ctx.scene.create('image',{id:key+'-view',name:'Saltline · Flamo WebGPU',assetId:key,position:{x:0,y:0},size:{width,height},fit:'FILL',interactive:false});
    parent.prepend(picture);owned.push(picture);renderer=nextRenderer;live=game;
    progress(97,'正在绘制首帧');await ctx.scene.flush();ctx.trace('saltline.ready',{});report();
  }catch(e){fail(e);}})();
}});