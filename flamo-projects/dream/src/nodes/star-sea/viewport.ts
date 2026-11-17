import type {NodeScriptContext} from '/vendor/flamo-runtime/index.es.js';
import type {View} from './world';
import {officialLogo} from './brand';
export function createViewport(ctx:NodeScriptContext,wallpaper=false){
 const root=ctx.node()!;
 const brand=wallpaper?undefined:ctx.scene.create('htmlSurface',{name:'Flamo 官方品牌',size:{width:136,height:30},backend:'dom-portal',eventMode:'native',html:`<a href="https://flamo.dev/" target="_blank" rel="noopener noreferrer" aria-label="Flamo 官网（在新窗口打开）" style="display:flex;align-items:center;justify-content:center;gap:8px;width:136px;height:30px;color:#b7c6df;font:14px system-ui;text-decoration:none"><img src="${officialLogo}" alt="" width="22" height="22">flamo ↗</a>`,lifecycle:'ephemeral'});
 if(brand)ctx.scene.mount(brand,{parent:root});
 const nodes=(id:number)=>ctx.node(`778376733:${id}`);
 // Only HUD siblings/descendants, never the shared root or drawing layers.
 const hidden=wallpaper?[22,23,24,25,26,27,28,33,34].flatMap(id=>{
  const node=nodes(id);return node?[{node,visible:node.design().compositing.visible}]:[];
 }):[];
 for(const {node} of hidden)node.setVisible(false);
 const labels=wallpaper?[]:[34].map(nodes);
 for(const n of labels){n?.setPosition(0,0);n?.setSize(130,45);n?.set('TextCpt.textAlignHorizontal','CENTER');n?.set('TextCpt.textAlignVertical','CENTER');n?.set('TextCpt.textAutoResize','NONE');}
 let width=0,height=0,lastX=NaN,lastY=NaN,lastZoom=NaN;
 return {hitControls(point:{x:number;y:number}):boolean{
  if(wallpaper)return false;
  const w=window.innerWidth,h=window.innerHeight;
  const inside=(x:number,y:number,width:number,height:number)=>point.x>=x&&point.x<=x+width&&point.y>=y&&point.y<=y+height;
  return inside((w-136)/2,h-39,136,30)||inside(w<760?(w-130)/2:w-194,h-108,130,45);
 },update():View{
  // View coordinates are CSS pixels; no DOM renderer internals are accessed.
  const w=window.innerWidth,h=window.innerHeight,camera=ctx.camera.get();
  const zoom=Math.max(.0625,Math.min(8,camera.zoom));
  if(camera.zoom!==zoom)ctx.camera.zoomTo(zoom);
  const corner=ctx.camera.screenToWorld({x:0,y:0}),center=ctx.camera.screenToWorld({x:w/2,y:h/2});
  if(corner.x!==lastX||corner.y!==lastY||zoom!==lastZoom){root.setTransform(corner.x,corner.y,1/zoom,1/zoom);lastX=corner.x;lastY=corner.y;}
  if(zoom!==lastZoom){

   // dom-portal dimensions use camera zoom, unlike its ancestor-aware position.
   // Keep a fixed CSS content box and compensate its public surface size.
   brand?.setSize(136/zoom,30/zoom);lastZoom=zoom;
  }
  if(w!==width||h!==height){width=w;height=h;root.setSize(w,h);nodes(20)?.setSize(w,h);nodes(21)?.setSize(w,h);
   if(!wallpaper){
   const margin=w<700?22:64,narrow=w<760;
   const updates=[{ref:nodes(23)!,x:margin,y:38},{ref:nodes(24)!,x:margin-4,y:68},{ref:nodes(25)!,x:margin,y:166},
    {ref:nodes(26)!,x:narrow?margin:w-405,y:narrow?210:40},
    {ref:nodes(27)!,x:margin,y:h-(narrow?210:116)},{ref:nodes(28)!,x:margin,y:h-(narrow?174:77)}];
   updates.push({ref:nodes(33)!,x:narrow?(w-130)/2:w-194,y:h-108});
   if(narrow){updates[4].y=h-194;updates[5].y=h-158;}
   if(h<520){const ys=[14,34,105,136,h-181,h-150];for(let i=0;i<6;i++)updates[i].y=ys[i];}
   for(let i=23;i<=28;i++)nodes(i)?.setScale(h<520?.72:1,h<520?.72:1);
   ctx.setTransformsBatch(updates);brand?.setPosition((w-136)/2,h-39);
  }
  }
  return {width:w,height:h,center,zoom};
 },dispose(){brand?.remove();for(const {node,visible} of hidden)node.setVisible(visible);}};
}
