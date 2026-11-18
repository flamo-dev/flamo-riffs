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
      .meadow { position: absolute; inset: 0; pointer-events: auto; touch-action: none; user-select: none; cursor: grab; }
      .meadow.dragging { cursor: grabbing; }
    </style>
    <div class="meadow" aria-label="蒲公英场景，拖动调整视角，点击吹散种子"></div>`;
  const meadow = shadow.querySelector<HTMLElement>('.meadow')!;
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
    if (event.button !== 0) return;
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
  ctx.dispose(() => {
    observer.disconnect();
    cancelAnimationFrame(refitFrame);
    host.remove();
  });
}
