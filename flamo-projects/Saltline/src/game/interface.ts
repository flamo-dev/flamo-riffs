import { interfaceStyle } from './generated/interface';

export function mountInterface(host:HTMLElement) {
  const root=host.attachShadow({mode:'open'}), style=document.createElement('style');
  style.textContent=interfaceStyle+'\n:host{display:block;width:100%;height:100%;position:relative;color:var(--bone);font-family:var(--f-label)}#app{background:transparent}.about-copy a{color:#ffbf6b;text-decoration:underline}.m-word{letter-spacing:-.045em}.menu button{cursor:pointer}.loc-card,.loc-card *{pointer-events:none}';
  const app=document.createElement('div'),view=document.createElement('div'),ui=document.createElement('div');
  app.id='app';view.id='view';view.tabIndex=0;ui.id='ui';app.append(view,ui);root.append(style,app);
  const outer=host.getRootNode(),stage=outer instanceof ShadowRoot?outer.host as HTMLElement:host.closest('[data-flamo-html-surface]')?.parentElement?.parentElement;
  if(stage?.requestFullscreen)app.requestFullscreen=stage.requestFullscreen.bind(stage);
  function resize(){const scale=Math.min(1,host.clientWidth/860);if(scale<=0)return;app.style.width=host.clientWidth/scale+'px';app.style.height=host.clientHeight/scale+'px';app.style.transformOrigin='0 0';app.style.transform='scale('+scale+')';}
  const observer=new ResizeObserver(resize);resize();observer.observe(host);
  const listeners=new AbortController(),timers=new Set<number>();
  let active=false;
  window.addEventListener('pointerdown',e=>{active=e.composedPath().includes(host);},{capture:true,signal:listeners.signal});
  host.addEventListener('focusin',()=>{active=true;},{signal:listeners.signal});
  function listen(target:EventTarget,type:string,fn:EventListener,opts?:AddEventListenerOptions|boolean){
    const settings=typeof opts==='boolean'?{capture:opts}:opts;
    target.addEventListener(type,(e:Event)=>{
      if(/^(key|mouse|pointer)/.test(type)&&!e.composedPath().includes(host)&&!active&&!root.pointerLockElement)return;
      fn(e);
    },{...settings,signal:listeners.signal});
  }
  const localDoc=new Proxy(document,{get(target,key){
    if(key==='getElementById')return (id:string)=>root.getElementById(id);
    if(key==='pointerLockElement')return root.pointerLockElement;
    if(key==='activeElement')return root.activeElement;
    if(key==='documentElement')return app;
    if(key==='addEventListener')return listen.bind(null,target);
    const v=Reflect.get(target,key,target);return typeof v==='function'?v.bind(target):v;
  }});
  const localWin=new Proxy(window,{get(target,key){
    if(key==='addEventListener')return listen.bind(null,target);
    const v=Reflect.get(target,key,target);return typeof v==='function'&&['matchMedia','getComputedStyle','removeEventListener'].includes(String(key))?v.bind(target):v;
  }});
  const environment={document:localDoc,window:localWin,navigator,AudioContext:window.AudioContext,OfflineAudioContext:window.OfflineAudioContext,
    innerWidth:host.clientWidth||1280,innerHeight:host.clientHeight||720,viewport:()=>app, bounds:()=>view.getBoundingClientRect(),
    addEventListener:listen.bind(null,window),removeEventListener:window.removeEventListener.bind(window),matchMedia:window.matchMedia.bind(window),
    setTimeout(fn:()=>void,ms:number){const id=window.setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);return id;},clearTimeout:window.clearTimeout.bind(window)};
  return {view,environment,dispose(){
    observer.disconnect();listeners.abort();timers.forEach(id=>clearTimeout(id));if(root.pointerLockElement)document.exitPointerLock();
    root.replaceChildren();
  }};
}