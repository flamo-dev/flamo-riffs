import type { NodeScriptContext } from '/vendor/flamo-runtime/index.es.js';
import { catalogue, type Family } from './parts';
import type { ModelPiece, ProjectPoint } from './view';
import type { V } from './mesh';

const labels:{key:Family; point:V}[]=[
  {key:'casing',point:[8.4,17.34,-2.3]},
  {key:'carbon',point:[10,9.95,1.98]},
  {key:'bath',point:[9.6,7.95,.05]},
  {key:'aluminium',point:[9.6,6.17,.05]},
  {key:'ledge',point:[10,6.96,3.67]},
  {key:'lining',point:[10,4.64,0]},
  {key:'collector',point:[10,3.1,1.9]},
  {key:'insulation',point:[10,1.87,.60]},
  {key:'shell',point:[10.65,1.11,1.95]},
];
type Actions={explode:()=>void;reset:()=>void;inspect:(piece?:ModelPiece)=>void};
export function mountControls(ctx:NodeScriptContext,pieces:ModelPiece[],actions:Actions){
  const canvas=ctx.instance.canvas??ctx.instance.target?.querySelector('canvas');
  const parent=canvas?.parentElement;
  const node=ctx.scene.get(ctx.nodeId);
  if(!canvas||!parent||!node)throw new Error('Model controls need their mounted canvas');
  const host=document.createElement('div');
  host.dataset.cellControls=ctx.instance.id;
  host.style.cssText='position:absolute;pointer-events:none;overflow:hidden;z-index:3';
  parent.appendChild(host);
  const ui=host.attachShadow({mode:'open'});
  ui.innerHTML=`<style>
    :host{font:500 14px/1.3 "Microsoft YaHei",system-ui,sans-serif;color:#eff2ed;container-type:inline-size}
    [hidden]{display:none!important} button,select{font:inherit;cursor:pointer} button:focus-visible,select:focus-visible{outline:2px solid #ffcf73;outline-offset:3px}
    .bar{position:absolute;left:2.8%;bottom:3.2%;max-width:94%;display:flex;flex-wrap:wrap;align-items:center;gap:5px;padding:5px;border:1px solid #687477ab;border-radius:9px;background:#182225f5;box-shadow:0 3px 15px #06101455;pointer-events:auto}
    .bar button,.bar select{height:35px;border:0;border-radius:5px}
    .bar button{padding:0 16px;font-weight:650;background:transparent;color:#eef0ec}
    .bar button:hover{background:#374247}
    .bar button:first-child{background:#e9b64e;color:#202526}
    .bar button:first-child:hover{background:#f6ca6b}
    .choose{display:flex;align-items:center;gap:6px;border-left:1px solid #657175;padding:0 3px 0 10px}
    select{background:#303b40;color:#f5f5f2;border:1px solid #546167!important;padding:0 5px;max-width:200px}
    .tag{position:absolute;z-index:1;transform:translateY(-50%);padding:4px 8px 4px 9px;white-space:nowrap;color:#f0f4f0;background:#202c30eb;border:1px solid #596769;border-radius:3px;pointer-events:auto;text-align:left;font-size:12px;letter-spacing:.04em}
    .tag:hover{color:#ffcf73;border-color:#dbaf5a}
    .line{position:absolute;height:1px;background:#b2c4bf96;transform-origin:0 50%}
    .dot{position:absolute;width:4px;height:4px;border-radius:50%;background:#ecc674;transform:translate(-50%,-50%)}
    @container(max-width:680px){.annotations{display:none}.bar{gap:3px;padding:3px;left:1%;bottom:2%;max-width:98%}.bar button,.bar select{height:30px;font-size:12px}.bar button{padding:0 9px}.choose{padding-left:5px;gap:3px}.bar select{max-width:112px}}
  </style><div class="annotations" hidden></div><div class="bar" role="group" aria-label="电解槽装配控制">
    <button type="button" aria-pressed="false" data-action="explode">炸开</button>
    <button type="button" data-action="reset">重置</button>
    <div class="choose" hidden><select aria-label="查看部件"></select><select aria-label="部件实例" hidden></select></div>
  </div>`;
  const explode=ui.querySelector<HTMLButtonElement>('[data-action=explode]')!;
  const reset=ui.querySelector<HTMLButtonElement>('[data-action=reset]')!;
  const choose=ui.querySelector<HTMLElement>('.choose')!;
  const annotations=ui.querySelector<HTMLElement>('.annotations')!;
  const [families,instances]=Array.from(ui.querySelectorAll('select'));
  const option=(el:HTMLSelectElement,value:string,name:string)=>el.add(new Option(name,value));
  option(families,'','全部部件');
  const byFamily=new Map<Family,ModelPiece[]>();
  pieces.forEach(p=>{const group=byFamily.get(p.family)??[];group.push(p);byFamily.set(p.family,group);});
  for(const key of Object.keys(catalogue) as Family[])if(byFamily.has(key))option(families,key,catalogue[key].label);
  function inspectFamily(){
    const group=byFamily.get(families.value as Family)??[];
    instances.replaceChildren();
    for(const p of group)option(instances,String(p.id),p.name.split(' · ')[1]??p.name);
    instances.hidden=group.length<2;
    actions.inspect(group[0]);
  }
  families.onchange=inspectFamily;
  instances.onchange=()=>actions.inspect(pieces.find(p=>p.id===Number(instances.value)));
  explode.onclick=actions.explode;reset.onclick=actions.reset;
  const tags=labels.map(info=>{
    const line=document.createElement('span'),dot=document.createElement('span'),button=document.createElement('button');
    line.className='line';dot.className='dot';button.className='tag';button.type='button';button.textContent=catalogue[info.key].label;
    button.onclick=()=>{families.value=info.key;inspectFamily();};
    annotations.append(line,dot,button);return {...info,button,line,dot};
  });
  let lastLayout='',project:ProjectPoint|undefined,showLabels=false;
  function labelPositions(){
    annotations.hidden=!showLabels;
    if(!showLabels||!project||host.clientWidth<680)return;
    const w=host.clientWidth,h=host.clientHeight,gap=Math.min(27,h*.044);
    const right=w*.866;
    const projected=tags.map(tag=>({tag,anchor:project!(tag.point),row:0})).sort((a,b)=>a.anchor.y-b.anchor.y);
    let next=h*.08;
    for(const item of projected){item.row=Math.max(next,item.anchor.y*h);next=item.row+gap;}
    let limit=h*.91;
    for(const item of [...projected].reverse()){item.row=Math.min(limit,item.row);limit=item.row-gap;}
    for(const {tag,anchor,row} of projected){
      const x=anchor.x*w,y=anchor.y*h,dx=right-x,dy=row-y;
      tag.button.style.cssText='left:'+right+'px;top:'+row+'px';
      tag.line.style.cssText='left:'+x+'px;top:'+y+'px;width:'+Math.hypot(dx,dy)+'px;transform:rotate('+Math.atan2(dy,dx)+'rad)';
      tag.dot.style.cssText='left:'+x+'px;top:'+y+'px';
    }
  }
  const bounds=node.design().geometry.worldBounds;
  function place(){
    const a=ctx.camera.worldToScreen({x:bounds.x,y:bounds.y}),b=ctx.camera.worldToScreen({x:bounds.x+bounds.width,y:bounds.y+bounds.height});
    const x=canvas!.offsetLeft+a.x,y=canvas!.offsetTop+a.y,w=b.x-a.x,h=b.y-a.y;
    const signature=[x,y,w,h].map(Math.round).join('/');
    if(lastLayout===signature)return;lastLayout=signature;
    Object.assign(host.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});
    labelPositions();
  }
  place();ctx.onUpdate(place);ctx.dispose(()=>host.remove());
  return {
    mode(open:boolean){choose.hidden=!open;explode.setAttribute('aria-pressed',String(open));families.value='';instances.replaceChildren();instances.hidden=true;},
    annotate(projection:ProjectPoint|undefined,on:boolean){project=projection;showLabels=on;labelPositions();}
  };
}
