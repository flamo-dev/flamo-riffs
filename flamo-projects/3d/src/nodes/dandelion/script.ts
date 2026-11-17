import { defineNodeScript, type RuntimeNode } from '/vendor/flamo-runtime/index.es.js';
import { createDandelionPresentation, initialState } from '../../dandelion/presentation';
import { mountDandelionControls, type MeadowViewport } from '../../dandelion/controls';

export default defineNodeScript({
  setup(_props, ctx) {
    const root = ctx.scene.get(ctx.nodeId);
    if (!root) throw new Error('Dandelion root missing');
    const pool = ctx.instance.app.getResourcePool();
    const state = ctx.reactive(initialState());
    const imageId = 'dandelion-' + ctx.instance.id + '-' + ctx.nodeId;
    const size = root.design().geometry.size;
    let viewport: MeadowViewport = { x: 0, y: 0, ...size, aspect: size.width/size.height, pixelsWide: 1280, pixelsHigh: 720 };
    const diagnostic = document.createElement('output');
    diagnostic.hidden = true;
    diagnostic.dataset.dandelionDiagnostics = imageId;
    document.body.append(diagnostic);

    let presentation: Awaited<ReturnType<typeof createDandelionPresentation>> | undefined;
    let image: RuntimeNode | undefined;
    let disposed = false;
    let frames = 0;
    let lastDraw = -Infinity;
    let lastReport = -Infinity;
    let eventCount = 0;
    let verified = -1;
    let verification: unknown = null;
    const mountedAt = performance.now();
    const events: { action: string; state: ReturnType<typeof initialState> }[] = [];
    function trace(action: string) {
      ctx.trace(action, { ...state, frames });
      events.push({ action, state: { ...state } });
      if (events.length > 60) events.shift();
      eventCount++;
    }

    const elapsed = () => (performance.now() - mountedAt) / 1000;
    let pendingGust = false;
    function blow() {
      if (!presentation) { pendingGust = true; return; }
      const now = elapsed();
      if (presentation.blow(now, state.yaw, state.pitch) > 0) {
        state.flight = now;
        trace('dandelion.gust');
      }
    }
    let resizeAt = 0;
    mountDandelionControls(ctx, state, trace, blow, next => {
      if (viewport.pixelsWide !== next.pixelsWide || viewport.pixelsHigh !== next.pixelsHigh) {
        resizeAt = performance.now() + 150;
      }
      viewport = next;
      image?.setPosition(next.x, next.y);
      image?.setSize(next.width, next.height);
    });
    const surface = ctx.createGpuSurface({imageId, width: viewport.pixelsWide, height: viewport.pixelsHigh, sampling: 'linear'});
    ctx.onUpdate(() => {
      if (!presentation || disposed) return;
      state.time = elapsed();
      const now = performance.now();
      if (now - lastDraw >= 32) {
        if (resizeAt && now >= resizeAt) {
          presentation.resize(viewport.pixelsWide, viewport.pixelsHigh);
          resizeAt = 0;
        }
        presentation.draw(state, viewport.aspect);
        frames++;
        lastDraw = now;
      }
      if (now - lastReport < 500) return;
      lastReport = now;
      const debug = window.__flamo_project;
      if (verified !== eventCount && typeof debug?.verifyInteractionTrace === 'function') {
        verified = eventCount;
        void debug.verifyInteractionTrace('src/interactions/contracts/dandelion.behavior.json', 'dandelion')
          .then(result => verification = result).catch(error => verification = { error: String(error) });
      }
      diagnostic.textContent = JSON.stringify({ ready: true, state: { ...state }, ...presentation.inspect(), viewport,
        events, verification, secondsSinceMount: (now - mountedAt) / 1000, lifecycle: debug?.debugScripts() });
    });
    ctx.dispose(() => {
      disposed = true;
      presentation?.destroy();
      diagnostic.remove();
      image?.remove();
    });

    void (async () => {
      try {
        const view = await createDandelionPresentation(surface, pool, () => {
          state.flight = -1;
          trace('dandelion.refilled');
        });
        if (disposed) { view.destroy(); return; }
        presentation = view;
        image = ctx.scene.create('image', { id: imageId + '-image', name: 'Dandelion · live shared GPU',
          assetId: imageId, position: { x: viewport.x, y: viewport.y }, size: {width: viewport.width, height: viewport.height}, fit: 'FILL', interactive: false });
        root.prepend(image);
        state.time = elapsed();
        if (pendingGust) { pendingGust = false; blow(); }
        view.draw(state, viewport.aspect);
        ctx.role('poster')?.setVisible(false);
        await ctx.scene.flush();
        trace('dandelion.mounted');
      } catch (error) {
        if (disposed) return;
        console.error('[Dandelion]', error);
        diagnostic.textContent = JSON.stringify({ ready: false, error: String(error) });
        trace('dandelion.error');
      }
    })();
  },
});
