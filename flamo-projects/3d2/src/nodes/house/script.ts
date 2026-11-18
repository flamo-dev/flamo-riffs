import { defineNodeScript, type RuntimeNode } from '/vendor/flamo-runtime/index.es.js';
import { createHousePresentation, type HouseState } from '../../house/presentation';

export default defineNodeScript({
  setup(_props,ctx) {
    const app=ctx.instance.app;
    const state:HouseState=ctx.reactive({time:0,yaw:.68,playing:true,orbit:true,zoom:1});
    let destroyed=false,presentation:Awaited<ReturnType<typeof createHousePresentation>>|undefined,image:RuntimeNode|undefined,status:RuntimeNode|undefined,frames=0,lastDraw=-Infinity;
    const pool=app.getResourcePool(),assetId='house-3d-'+ctx.instance.id+'-'+ctx.nodeId;
    const surface=ctx.createGpuSurface({imageId:assetId,width:400,height:400,scale:2,sampling:'nearest'});
    const diagnostic=document.createElement('output');diagnostic.hidden=true;diagnostic.dataset.houseDiagnostics=assetId;document.body.append(diagnostic);
    const events:{action:string;time:number;yaw:number;playing:boolean}[]=[];
    let lastDiagnostic=0,lastSignature='',verification:unknown=null,lifecycle:unknown=null,verifiedEvents=-1;
    const root=ctx.scene.get(ctx.nodeId);
    if(!root)throw new Error('house root missing');
    const labels:RuntimeNode[]=[];
    function text(id:string,value:string,x:number,width:number){
      const n=ctx.scene.create('text',{id:assetId+'-'+id,name:id,text:value,position:{x,y:826},size:{width,height:22},fontSize:14,fontFamily:'Inter',fill:'#afb1a3',interactive:false});root!.append(n);labels.push(n);return n;
    }
    function trace(action:string){ctx.trace(action,{...state,frame:frames});events.push({action,time:state.time,yaw:state.yaw,playing:state.playing});if(events.length>40)events.shift();}
    const read=()=>({ready:!!presentation&&!destroyed,state:{...state},...presentation?.inspect()});
    const setStatus=(value:string)=>status?.setText(value);
    const reset=()=>{Object.assign(state,{time:0,yaw:.68,playing:true,orbit:true,zoom:1});trace('house.reset');setStatus('AUTO ORBIT');};
    ctx.onNode('0:12','click',()=>{state.orbit=false;state.yaw-=.28;trace('house.rotate');setStatus('MANUAL VIEW');});
    ctx.onNode('0:13','click',()=>{state.playing=!state.playing;trace('house.pause');setStatus(state.playing?'PLAYING':'PAUSED');});
    ctx.onNode('0:14','click',()=>{state.orbit=false;state.yaw+=.28;trace('house.rotate');setStatus('MANUAL VIEW');});
    ctx.onNode('0:15','click',reset);
    let dragStart:number|null=null,dragYaw=0;
    ctx.on('pointerdown',event=>{const p=ctx.eventPoint(event);if(p&&p.y<795){dragStart=p.x;dragYaw=state.yaw;state.orbit=false;event.preventDefault();}});
    ctx.on('pointermove',event=>{if(dragStart===null)return;const p=ctx.eventPoint(event);if(p){state.yaw=dragYaw+(p.x-dragStart)*.006;setStatus('MANUAL VIEW');}});
    ctx.on('pointerup',()=>{if(dragStart!==null){trace('house.rotate');dragStart=null;}});
    ctx.on('pointerleave',()=>{dragStart=null;});
    ctx.on('pointercancel',()=>{dragStart=null;});
    ctx.onUpdate(dt=>{
      if(!presentation||destroyed)return;
      if(state.playing){state.time+=Math.min(dt,.1);if(state.orbit)state.yaw=.68+Math.sin(state.time*Math.PI*2/8.05)*.33;}
      const now=performance.now();if(now-lastDraw<32)return;lastDraw=now;
      const signature=[state.time,state.yaw,state.zoom].join(':');
      if(signature!==lastSignature){presentation.draw(state);frames++;lastSignature=signature;}
      if(now-lastDiagnostic>500){
        lastDiagnostic=now;
        const debug=window.__flamo_project;
        if(debug&&verifiedEvents!==events.length){
          verifiedEvents=events.length;lifecycle=debug.debugScripts();
          if(typeof debug.verifyInteractionTrace==='function')void debug.verifyInteractionTrace('src/interactions/contracts/house.behavior.json','house').then(v=>{verification=v;}).catch(e=>{verification={error:String(e)};});
          else verification={available:false,reason:'Server project-preview exposes debugScripts/traceInteraction, but not verifyInteractionTrace (local preview does).'};
        }
        diagnostic.textContent=JSON.stringify({...read(),events,verification,lifecycle,previewDebugAvailable:!!debug});
      }
    });
    ctx.dispose(()=>{destroyed=true;presentation?.destroy();diagnostic.remove();try{image?.remove();labels.forEach(n=>n.remove());}catch{} });
    void(async()=>{
      try{
        const next=await createHousePresentation(surface,pool);
        if(destroyed){next.destroy();return;}
        presentation=next;
        image=ctx.scene.create('image',{id:assetId+'-image',name:'House · shared GPU output',assetId,position:{x:0,y:0},size:{width:800,height:800},fit:'FILL',interactive:false});
        root.prepend(image);
        // A static poster remains useful in Studio design mode; hide it in this running instance.
        ctx.scene.get('0:3')?.setVisible(false);
        text('left','LEFT',206,70);text('pause','PAUSE',301,70);text('right','RIGHT',398,70);text('reset','RESET',494,70);
        status=text('status','AUTO ORBIT',621,160);
        presentation.draw(state);await ctx.scene.flush();trace('house.mounted');
      }catch(error){if(destroyed)return;console.error('[House3D]',error);status=text('error',String(error),12,770);trace('house.error');}
    })();
  },
});
