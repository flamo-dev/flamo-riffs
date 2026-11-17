import type { NodeScriptContext } from '/vendor/flamo-runtime/index.es.js';
import type { DandelionState } from './presentation';

export interface MeadowViewport {
  x: number; y: number; width: number; height: number;
  pixelsWide: number; pixelsHigh: number; aspect: number;
}

export function mountDandelionControls(ctx: NodeScriptContext, state: DandelionState, trace: (action: string) => void, blow: () => void,
  layoutScene: (view: MeadowViewport) => void) {
  const canvas = ctx.instance.canvas ?? ctx.instance.target?.querySelector('canvas');
  const parent = canvas?.parentElement;
  if (!canvas || !parent) throw new Error('Dandelion canvas is unavailable');

  const host = document.createElement('div');
  host.dataset.dandelionControls = '';
  host.style.cssText = 'position:absolute;overflow:hidden;pointer-events:none;z-index:1';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host { font-family: "Segoe UI","Microsoft YaHei",sans-serif; color: #243c30; }
      *, *::before, *::after { box-sizing: border-box; }
      button, a { font: inherit; -webkit-tap-highlight-color: transparent; }
      button { cursor: pointer; }
      :focus-visible { outline: 3px solid #c19b42; outline-offset: 3px; }
      .meadow { position: absolute; inset: 0; pointer-events: auto; touch-action: none; user-select: none; cursor: grab; }
      .meadow.dragging { cursor: grabbing; }
      .corner-tools { position: absolute; display: flex; align-items: center; gap: clamp(8px,1vw,16px);
        top: max(env(safe-area-inset-top,0px),clamp(10px,2vh,26px));
        right: max(env(safe-area-inset-right,0px),clamp(12px,2vw,30px)); }
      .about { min-height: 44px; padding: 0 16px; display: flex; align-items: center; gap: 8px;
        border: 1px solid #ffffff78; border-radius: 30px; color: white; background: #173a39df;
        font-size: 14px; font-weight: 600; pointer-events: auto; }
      .about:hover { background: #143932; }
      .icon { display: inline-grid; place-items: center; width: 16px; height: 16px;
        border: 1px solid currentColor; border-radius: 50%; font: bold 12px Georgia,serif; }
      dialog { width: min(420px,calc(100vw - 32px)); max-height: calc(100dvh - 32px);
        padding: 28px; margin: auto; border: 1px solid #d4d9ca; border-radius: 18px;
        color: #233a2e; background: #fbfaf4; box-shadow: 0 16px 70px #112d2b40; pointer-events: auto; }
      dialog::backdrop { background: rgb(10 28 23 / 45%); }
      header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
      h2 { margin: 0; font: 600 27px/1.25 Georgia,"Songti SC","SimSun",serif; }
      .close { width: 44px; height: 44px; margin: -8px -8px -8px 0; border: 0;
        color: #385345; background: transparent; border-radius: 50%; font-size: 24px; }
      .close:hover { background: #e8eddf; }
      p { margin: 0 0 12px; line-height: 1.7; font-size: 15px; }
      .guide { font-size: 13px; color: #506253; padding-top: 14px; border-top: 1px solid #d6dccf; }
      .brand { position: relative; display: block; pointer-events: auto; border-radius: 5px;
        width: clamp(96px,9vw,200px); aspect-ratio: 407 / 175; }
      .brand::before { content: ''; position: absolute; inset: 50% 0 auto; height: max(100%,44px); transform: translateY(-50%); }
      dialog a { display: inline-flex; align-items: center; min-height: 44px; color: #24563c;
        font-size: 14px; font-weight: 650; text-underline-offset: 4px; }
    </style>
    <div class="meadow" aria-label="蒲公英场景，拖动调整视角，点击吹散种子"></div>
    <div class="corner-tools">
      <button type="button" class="about" aria-haspopup="dialog" aria-controls="intro">
        <span class="icon" aria-hidden="true">i</span>项目介绍
      </button>
      <a class="brand" href="https://flamo.dev/" target="_blank" rel="noopener noreferrer"
        aria-label="Flamo 官网（在新标签页打开）" title="访问 Flamo 官网"></a>
    </div>
    <dialog id="intro" aria-labelledby="intro-title">
      <header><h2 id="intro-title">蒲公英</h2><button type="button" class="close" aria-label="关闭项目介绍">×</button></header>
      <p>这个互动场景由 Flamo 和 GPT-6 共同完成。</p>
      <p>Flamo 是一款交互设计与开发工具。你可以保留 Figma 设计里的图层和组件，为它们添加动画和交互，并导出可在网页中使用的组件。</p>
      <p class="guide">用鼠标或手指拖动，绕着蒲公英看一看。轻点画面，种子会随风飘远。吹空花球后，等三秒就会重新长满。</p>
      <a href="https://flamo.dev/" target="_blank" rel="noopener noreferrer">访问 Flamo 官网 ↗</a>
    </dialog>`;
  const meadow = shadow.querySelector<HTMLElement>('.meadow')!;
  const about = shadow.querySelector<HTMLButtonElement>('.about')!;
  const dialog = shadow.querySelector<HTMLDialogElement>('dialog')!;
  const brand = shadow.querySelector<HTMLAnchorElement>('.brand')!;
  const logo = ctx.scene.get('778261585:1');
  if (!logo) throw new Error('Dandelion logo is missing');
  parent.append(host);

  const bounds = ctx.probe()!.bounds;
  let previous = '';
  function place(force = false) {
    const width = canvas!.clientWidth, height = canvas!.clientHeight;
    if (!width || !height) return;
    const density = window.devicePixelRatio || 1;
    const key = [width,height,density,canvas!.offsetLeft,canvas!.offsetTop].join(',');
    if (key === previous && !force) return;
    previous = key;
    const scale = Math.max(width / bounds.width, height / bounds.height);
    const visibleWidth = width / scale, visibleHeight = height / scale;
    const x = (bounds.width - visibleWidth) / 2, y = (bounds.height - visibleHeight) / 2;
    ctx.camera.fit({x: bounds.x+x, y: bounds.y+y, width: visibleWidth, height: visibleHeight}, {padding: 0});
    Object.assign(host.style, {left: canvas!.offsetLeft+'px', top: canvas!.offsetTop+'px',
      width: width+'px', height: height+'px'});
    const layer = host.getBoundingClientRect(), badge = brand.getBoundingClientRect();
    logo!.setSize(badge.width / scale, badge.height / scale);
    logo!.setPosition(x + (badge.left-layer.left) / scale, y + (badge.top-layer.top) / scale);

    // Leave room for both render targets during a resize in the shared GPU surface pool.
    const densityLimit = Math.min(density, Math.sqrt(2600000 / (width * height)), 3840 / Math.max(width,height));
    layoutScene({x, y, width: visibleWidth, height: visibleHeight, aspect: width/height,
      pixelsWide: Math.max(1,Math.floor(width*densityLimit)), pixelsHigh: Math.max(1,Math.floor(height*densityLimit))});
  }
  place();
  ctx.onUpdate(() => place());
  let refitFrame = 0;
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(refitFrame);
    refitFrame = requestAnimationFrame(() => {
      refitFrame = requestAnimationFrame(() => place(true));
    });
  });
  observer.observe(canvas);

  let drag: { id: number; x: number; y: number; yaw: number; pitch: number; width: number; height: number; moved: boolean } | undefined;
  function cancel() {
    drag = undefined;
    meadow.classList.remove('dragging');
  }
  meadow.onpointerdown = event => {
    if (!event.isPrimary) { cancel(); return; }
    if (event.button !== 0 || dialog.open) return;
    const rect = meadow.getBoundingClientRect();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: state.yaw, pitch: state.pitch,
      width: Math.max(1, rect.width), height: Math.max(1, rect.height), moved: false };
    meadow.setPointerCapture(event.pointerId);
    event.preventDefault();
  };
  function move(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 7) return;
    drag.moved = true;
    meadow.classList.add('dragging');
    state.yaw = drag.yaw + dx / drag.width * Math.PI * 2;
    state.pitch = Math.max(-0.45, Math.min(0.65, drag.pitch + dy / drag.height * 2));
  }
  meadow.onpointermove = move;
  meadow.onpointerup = event => {
    if (!drag || event.pointerId !== drag.id) return;
    move(event);
    if (drag.moved) trace('dandelion.rotate');
    else blow();
    cancel();
  };
  meadow.onpointercancel = cancel;
  meadow.onlostpointercapture = cancel;
  about.onclick = () => {
    cancel();
    dialog.showModal();
    trace('dandelion.intro.open');
  };
  shadow.querySelector<HTMLButtonElement>('.close')!.onclick = () => dialog.close();
  dialog.onclick = event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  };
  dialog.onclose = () => { about.focus({ preventScroll: true }); trace('dandelion.intro.close'); };
  ctx.dispose(() => {
    observer.disconnect();
    cancelAnimationFrame(refitFrame);
    dialog.onclose = null;
    if (dialog.open) dialog.close();
    host.remove();
  });
}
