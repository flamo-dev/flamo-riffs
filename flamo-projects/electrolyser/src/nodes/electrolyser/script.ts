import { defineNodeScript } from '/vendor/flamo-runtime/index.es.js';
import { mountControls } from '../../electrolyser/controls';
import { home, makeView, type Camera, type ModelPiece } from '../../electrolyser/view';

const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export default defineNodeScript({
  setup(_props,ctx){
    const root=ctx.scene.get(ctx.nodeId);
    if(!root)return;
    const state:Camera=home(),id='electrolyser-view-'+ctx.instance.id+'-'+ctx.nodeId;
    const displayWidth=1600,displayHeight=900;
    const width=window.matchMedia('(max-width: 800px)').matches?1152:1600;
    const canvas=new OffscreenCanvas(width,Math.round(width*displayHeight/displayWidth));
    const registry=ctx.instance.app.getResourcePool().imageRegistry;
    const lease=registry.registerTransientCanvas?.(id,canvas);
    if(!lease)throw new Error('The local runtime does not expose transient images');
    let view:ReturnType<typeof makeView>|undefined;
    let live:ReturnType<typeof ctx.scene.create>|undefined;
    let changed=true;
    ctx.dispose(()=>{live?.remove();lease.dispose();view?.dispose();});
    view=makeView(canvas);
    let amount=0,destination=0,from=0,started=0,duration=0;
    let selected:ModelPiece|undefined,controls:ReturnType<typeof mountControls>|undefined;
    const repaint=()=>{
      if(!view||(!changed&&!duration))return;
      if(duration){
        const t=Math.min(1,(performance.now()-started)/duration);
        amount=from+(destination-from)*t*t*(3-2*t);
        if(t===1){amount=destination;duration=0;ctx.trace('electrolyser.pose',{amount});}
      }
      const project=view.draw(state,amount,selected);
      lease.commit();changed=false;
      controls?.annotate(project,!selected&&amount>.995&&destination===1);
    };
    repaint();
    live=ctx.scene.create('image',{id:id+'-image',name:'600 kA 预焙阳极电解槽',assetId:id,
      position:{x:0,y:0},size:{width:displayWidth,height:displayHeight},fit:'FILL',interactive:false});
    root.append(live);
    ctx.onUpdate(repaint);
    const drag=new Map<number,{x:number;y:number}>();
    const trace=(action:string)=>ctx.trace('electrolyser.'+action,{yaw:state.yaw,pitch:state.pitch,zoom:state.zoom});
    let lastTap=0,moved=false;
    function changeAssembly(open:boolean){
      selected=undefined;drag.clear();Object.assign(state,home());
      from=amount;destination=open?1:0;started=performance.now();
      duration=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:Math.abs(destination-from)*1150;
      if(!duration)amount=destination;
      changed=true;controls?.mode(open);
      trace(open?'explode':'reset');
    }
    const reset=()=>changeAssembly(false);
    controls=mountControls(ctx,view.pieces,{
      explode:()=>changeAssembly(true),reset,
      inspect:part=>{
        selected=part;Object.assign(state,home());changed=true;
        ctx.trace('electrolyser.inspect',{part:part?.name??'全部部件'});
      }
    });
    ctx.on('pointerdown',e=>{const p=ctx.eventPoint(e);if(!p)return;drag.set(e.pointer.pointerId,p);moved=false;e.preventDefault();});
    ctx.on('pointermove',e=>{
      const old=drag.get(e.pointer.pointerId),p=ctx.eventPoint(e);if(!old||!p)return;
      const dx=p.x-old.x,dy=p.y-old.y;
      if(dx||dy)moved=true;
      if(drag.size===2){
        const other=[...drag.entries()].find(([i])=>i!==e.pointer.pointerId)![1];
        const a=Math.hypot(other.x-old.x,other.y-old.y),b=Math.hypot(other.x-p.x,other.y-p.y);
        if(a>2&&b>2)state.zoom=clamp(state.zoom*a/b,.22,1.65);
      }else if(e.modifiers.shiftKey||e.pointer.buttons===2){
        const scale=state.zoom*.014;
        state.focus[0]=clamp(state.focus[0]-dx*Math.cos(state.yaw)*scale,-11.4,11.4);
        state.focus[2]=clamp(state.focus[2]+dx*Math.sin(state.yaw)*scale,-3.3,3.3);
        state.focus[1]=clamp(state.focus[1]+dy*scale,.3,6.1);
      }else{
        state.yaw-=dx*.005;state.pitch=clamp(state.pitch+dy*.004,.065,1.29);
      }
      drag.set(e.pointer.pointerId,p);changed=true;e.preventDefault();
    });
    ctx.on('pointerup',e=>{
      if(!drag.delete(e.pointer.pointerId))return;
      if(moved){trace('orbit');lastTap=0;}
      else{const now=performance.now();if(now-lastTap<330&&lastTap>0)reset();lastTap=now;}
    });
    ctx.on('pointercancel',e=>drag.delete(e.pointer.pointerId));
    ctx.on('pointerleave',()=>drag.clear());
    ctx.on('contextmenu',e=>e.preventDefault());
    const zoom=(delta:number,mode:number)=>{
      const pixels=delta*(mode===1?16:mode===2?380:1);
      state.zoom=clamp(state.zoom*Math.exp(clamp(pixels,-350,350)*.0015),.22,1.65);
      changed=true;trace('zoom');
    };
    ctx.on('wheel',e=>{zoom(e.deltaY,e.deltaMode);e.preventDefault();});
    // The Studio canvas also binds the native wheel to page pan. Consume it only over this model.
    const host=ctx.instance.canvas??ctx.instance.target?.querySelector('canvas');
    const parent=host?.parentElement;
    if(host&&parent){
      const wheel=(e:WheelEvent)=>{
        if(e.target!==host)return;
        const rect=host.getBoundingClientRect(),bounds=root.design().geometry.worldBounds;
        const p=ctx.camera.screenToWorld({x:e.clientX-rect.left,y:e.clientY-rect.top});
        if(p.x<bounds.x||p.y<bounds.y||p.x>bounds.x+bounds.width||p.y>bounds.y+bounds.height)return;
        e.preventDefault();e.stopImmediatePropagation();zoom(e.deltaY,e.deltaMode);
      };
      parent.addEventListener('wheel',wheel,{capture:true,passive:false});
      ctx.dispose(()=>parent.removeEventListener('wheel',wheel,true));
    }

    void ctx.scene.flush().then(()=>ctx.trace('electrolyser.mounted',{triangles:view!.triangles}));
  },
});
