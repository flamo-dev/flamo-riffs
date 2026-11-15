import { defineNodeScript } from '/vendor/flamo-runtime/index.es.js';
import { newRun, act, step, settle, wind } from './wind';
import { atmosphere } from './atmosphere';
import { hero } from './hero';
import { landscape } from './mist';
import { windAudio } from './audio';

function findPortal(scope: Document | ShadowRoot, id: string): HTMLElement | null {
  const local=scope.getElementById(id);if(local)return local;
  for(const node of scope.querySelectorAll('*')) if(node.shadowRoot){
    const nested=findPortal(node.shadowRoot,id);if(nested)return nested;
  }
  return null;
}
const captions: Record<string,[string,string]> = {
  wait:['看红绸，趁叶子向对岸升起时起跳','起跳'],jump:['抓住两侧衣角','展篷'],
  glide:['借风滑翔',''],land:['风定，灯起',''],won:['已点亮峡谷灯塔','再渡一次'],lost:['跌入云海','回到崖边'],returned:['逆风送你落回山脊','再试一次']
};
const flamoSite='https://flamo.dev/';
const layout = `
<style>
  .mw-world { position:absolute;inset:0;overflow:hidden;container-type:inline-size;color:#332e27;font-family:"KaiTi","STKaiti","Noto Serif SC","SimSun",serif;outline:none;touch-action:manipulation;user-select:none }
  .mw-world canvas {position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
  .mw-heading {position:absolute;top:6%;left:4.8%;margin:0;color:#262c30;line-height:1.05;letter-spacing:.10em;font-weight:700;font-size:4.5cqw;text-shadow:0 0 .23em #fcf0de,0 0 .4em #fcf0de;pointer-events:none;transition:opacity .5s}
  .mw-heading small {display:block;font-size:1.05cqw;letter-spacing:.27em;margin-top:.6em;font-weight:600}
  .mw-world[data-mode="glide"] .mw-heading,.mw-world[data-mode="jump"] .mw-heading {opacity:.40}
  .mw-bar {position:absolute;bottom:5.2%;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:1.5cqw;white-space:nowrap;padding:.55cqw .7cqw .55cqw 1.2cqw;border-radius:3px;background:#f9efdfeb;color:#41392e;box-shadow:0 2px 12px #42342620;font-size:1.25cqw}
  .mw-world button {font:inherit;cursor:pointer}
  .mw-act {border:0;border-radius:2px;background:#923e30;color:#fff3df;letter-spacing:.1em;padding:.55em .85em}
  .mw-world :is(button,a):focus-visible {outline:3px solid #45362c;outline-offset:3px}
  .mw-bar:has(.mw-act[hidden]) {padding:.63cqw 1.1cqw}
  .mw-act small {font-size:.72em;opacity:.84;margin-left:.55em}
  .mw-logo-link {position:absolute;border-radius:.32cqw;cursor:pointer}
  .mw-tools {position:absolute;right:3%;top:4.5%;display:grid;gap:.44cqw}
  .mw-tools button {font-size:1.05cqw!important;padding:.43em .75em;border:1px solid #75674970;border-radius:2px;color:#4c412f;background:#f8eddae6}
  .mw-scrim {position:absolute;inset:0;display:grid;place-items:center;background:rgba(35,40,39,.48);z-index:2}
  .mw-scrim[hidden] {display:none}
  .mw-card {box-sizing:border-box;width:35cqw;max-height:88%;overflow:auto;touch-action:pan-y;user-select:text;padding:2cqw 2.25cqw;color:#332e27;background:#f8f0df;border:1px solid #b2a084;border-radius:4px;box-shadow:0 .6cqw 3cqw #241e2452;font-size:1.18cqw;line-height:1.65}
  .mw-card header {display:flex;align-items:center;justify-content:space-between;gap:1em}
  .mw-card h2 {margin:0;color:#292c2a;font-size:1.65em;line-height:1.2;font-weight:700}
  .mw-card h3 {margin:1.05em 0 .15em;padding-top:.8em;border-top:1px solid #cabea7;font-size:1.12em}
  .mw-card p {margin:.65em 0 0}
  .mw-card h3+p {margin-top:.15em}
  .mw-close {flex:none;border:0;background:transparent;color:#5e5547;padding:.3em .15em;line-height:1.3}
  .mw-site {display:inline-block;margin-top:.8em;color:#873b2e;text-underline-offset:.2em;text-decoration-thickness:1px}
  @media(max-width:1000px){.mw-card{width:59cqw;font-size:1.68cqw}.mw-tools button{font-size:1.5cqw!important}}

</style>
<div class="mw-world" tabindex="0" role="region" aria-label="风大侠，空格或点击即可操作">
  <canvas width="1920" height="1080" aria-hidden="true"></canvas>
  <div class="mw-hud">
    <h1 class="mw-heading">风大侠<small>借 风 过 峡</small></h1>
    <div class="mw-tools">
      <button type="button" class="mw-sound" aria-pressed="false">声音 · 开</button>
      <button type="button" class="mw-about" aria-haspopup="dialog">项目介绍</button>
    </div>
    <a class="mw-logo-link" href="${flamoSite}" target="_blank" rel="noopener noreferrer" aria-label="在新标签页打开 Flamo 官网" hidden></a>
    <div class="mw-bar"><span role="status"></span><button type="button" class="mw-act"><b></b><small>空格</small></button></div>
  </div>
  <div class="mw-scrim" hidden>
    <section class="mw-card" role="dialog" aria-modal="true" aria-label="关于《风大侠》">
      <header><h2>关于《风大侠》</h2><button type="button" class="mw-close" aria-label="关闭项目介绍">关闭</button></header>
      <p>这款水墨滑翔游戏由 GPT-6 与 Flamo 共同完成。GPT-6 参与了玩法设计和脚本编写。在 Flamo 里，同一股风吹动芦苇、撑起斗篷，也把大侠托向对岸的灯塔。</p>
      <h3>关于 Flamo</h3>
      <p>Flamo 是一款交互创作工具。你可以保留 Figma 设计里的图层和组件，用脚本为它们添加动作、连接数据，再到 Flamo Studio 里预览和调试。</p>
      <a class="mw-site" href="${flamoSite}" target="_blank" rel="noopener noreferrer">访问 Flamo 官网 <span aria-hidden="true">↗</span></a>
    </section>
  </div>
</div>`;
export default defineNodeScript({setup(_props,ctx) {
  const parent=ctx.scene.get(ctx.nodeId);
  if(!parent) throw Error('找不到关卡节点');
  const poses=['wait','glide'] as const;
  const actors=poses.map(role=>ctx.role(role));
  if(actors.some(actor=>!actor))throw Error('关卡缺少角色姿态图层');
  const marker=('masterwind-'+ctx.instance.id+'-'+ctx.nodeId).replace(/[^\w-]/g,'-');
  const portal=ctx.scene.create('htmlSurface',{id:marker+'-controls',name:'风场与操作',position:{x:0,y:0},size:{width:1920,height:1080},interactive:true,backend:'dom-portal',eventMode:'dom',html:'<div id="'+marker+'" style="position:absolute;inset:0;width:100%;height:100%"></div>'});
  parent.append(portal);
  const sound=windAudio(),s=newRun();
  const standingPoster=ctx.scene.get('545615765:1');
  const painter=hero(ctx,actors.map(n=>n!),marker);
  const plates=['distant','ridges','banks'].map(role=>{
    const layer=ctx.role(role);if(!layer)throw Error('缺少峡谷图层 '+role);
    return layer;
  });
  const lantern=ctx.scene.get('1070463637:1');
  if(!lantern)throw Error('缺少灯室暗窗图层');
  const reeds=ctx.scene.get('69583321:1');
  if(!reeds)throw Error('缺少近岸芦苇分层图');
  plates.push(lantern,reeds);
  const hills=landscape(ctx,plates,marker,s.seed);
  let drawHills:Awaited<ReturnType<typeof hills.mount>>;
  let drawHero:Awaited<ReturnType<typeof painter.mount>>;
  let disposed=false,aboutOpen=false,clock=0,screen='',host:HTMLElement|null=null,root:HTMLElement|null=null;
  let paint:ReturnType<typeof atmosphere>|undefined,actionButton:HTMLButtonElement,soundButton:HTMLButtonElement,label:HTMLElement;
  const cleanup: Array<()=>void>=[];
  const change=()=>{
    sound.unlock();
    const previous=s.seed;act(s);
    if(previous!==s.seed && root)paint=atmosphere(root.querySelector('canvas')!,s.seed,s.time);
    root?.focus({preventScroll:true});
  };
  function listener(target:EventTarget,type:string,fn:EventListener){
    target.addEventListener(type,fn);cleanup.push(()=>target.removeEventListener(type,fn));
  }
  function hud(){
    if(!root)return;
    const caption=s.mode==='glide'?(s.grip<.85?'拉开衣角':s.vx< -28?'被风吹回':s.load<.52?'斗篷吃风':'借风滑翔'):'';
    if(screen===s.mode){if(caption&&label.textContent!==caption)label.textContent=caption;return;}
    screen=s.mode;root.dataset.mode=screen;
    const [description,action]=captions[screen];label.textContent=caption||description;
    actionButton.hidden=!action;actionButton.querySelector('b')!.textContent=action;
    if(screen==='won')sound.bell();
  }
  ctx.onUpdate(dt=>{
    if(!paint||!drawHero||!drawHills||disposed||aboutOpen)return;
    const elapsed=Math.min(dt,.08);clock+=elapsed;
    while(clock>=1/90){step(s,1/90);settle(s,1/90);clock-=1/90;}
    const air=wind(s.x,s.y-55,s.time,s.seed);
    drawHills(s,elapsed,air.across,air.up);drawHero(s,elapsed);paint(s,elapsed);hud();sound.update(s,air,elapsed);
  });
  ctx.dispose(()=>{disposed=true;for(const stop of cleanup)stop();sound.dispose();painter.dispose();hills.dispose();portal.remove();});
  void (async()=>{
    await ctx.scene.flush();
    for(let i=0;i<200&&!disposed&&!host;i++){host=findPortal(document,marker);if(!host)await new Promise(r=>setTimeout(r,40));}
    if(disposed)return;if(!host)throw Error('风场操作层挂载超时');
    host.innerHTML=layout;root=host.querySelector('.mw-world')!;
    actionButton=root.querySelector('.mw-act')!;soundButton=root.querySelector('.mw-sound')!;label=root.querySelector('[role=status]')!;
    const gameHud=root.querySelector<HTMLElement>('.mw-hud')!;
    // The artwork is a Flamo image node. Match its bounds in the interactive HUD.
    const logo=ctx.scene.get('239076380:1');
    if(logo){
      const link=gameHud.querySelector<HTMLAnchorElement>('.mw-logo-link')!;
      const {position,size}=logo.design().geometry,stage=parent.design().geometry.size;
      link.style.left=100*position.x/stage.width+'%';link.style.top=100*position.y/stage.height+'%';
      link.style.width=100*size.width/stage.width+'%';link.style.height=100*size.height/stage.height+'%';
      link.hidden=false;
    }
    const aboutButton=root.querySelector<HTMLButtonElement>('.mw-about')!;
    const scrim=root.querySelector<HTMLElement>('.mw-scrim')!;
    const closeButton=scrim.querySelector<HTMLButtonElement>('.mw-close')!;
    const site=scrim.querySelector<HTMLAnchorElement>('.mw-site')!;
    function showAbout(open:boolean){
      aboutOpen=open;scrim.hidden=!open;gameHud.inert=open;
      (open?closeButton:aboutButton).focus({preventScroll:true});
    }
    listener(aboutButton,'click',()=>showAbout(true));
    listener(closeButton,'click',()=>showAbout(false));
    listener(scrim,'click',e=>{if(e.target===scrim)showAbout(false);});
    listener(scrim,'keydown',e=>{
      const k=e as KeyboardEvent;
      if(k.key==='Escape'){k.preventDefault();k.stopPropagation();showAbout(false);return;}
      if(k.key!=='Tab')return;
      if(k.shiftKey&&k.target===closeButton){k.preventDefault();site.focus();}
      if(!k.shiftKey&&k.target===site){k.preventDefault();closeButton.focus();}
    });
    listener(root,'click',(e)=>{if(aboutOpen||(e.target as Element).closest('.mw-tools,.mw-scrim,a[href]'))return;change();});
    listener(soundButton,'click',()=>{const muted=sound.toggle();soundButton.textContent='声音 · '+(muted?'关':'开');soundButton.setAttribute('aria-pressed',String(muted));});
    listener(window,'keydown',(e)=>{const k=e as KeyboardEvent;if(k.code!=='Space'||k.repeat||!root||aboutOpen)return;
      if((k.composedPath()[0] as HTMLElement)?.closest?.('.mw-tools,.mw-scrim,a[href]'))return;
      if(document.activeElement && ![document.body,document.documentElement].includes(document.activeElement as HTMLElement) && !k.composedPath().includes(root) && !ctx.instance.canvas?.matches(':focus'))return;
      k.preventDefault();change();
    });
    paint=atmosphere(root.querySelector('canvas')!,s.seed);
    [drawHills,drawHero]=await Promise.all([hills.mount(),painter.mount()]);if(disposed||!drawHero||!drawHills)return;
    drawHills(s,0,0,0);await ctx.scene.flush();if(disposed)return;plates.forEach(layer=>layer.setVisible(false));
    drawHero(s,0);standingPoster?.setVisible(false);actors.forEach(n=>n!.setVisible(false));paint(s,0);hud();
  })().catch(error=>{if(disposed)return;console.error('[风大侠]',error);if(label)label.textContent='场景加载失败，请重新打开预览';});
}});
