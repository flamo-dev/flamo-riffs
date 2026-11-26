import { defineNodeScript } from '/vendor/flamo-runtime/index.es.js';
const FRAME = '1:72';
const TRACK_NODE = '1:75';
const REFERENCE = '1:72';
function sampleX(track, timeMs) {
  const value = track.sample(timeMs);
  return Array.isArray(value) ? value[0] : (typeof value === 'number' ? value : 0);
}
export default defineNodeScript({
  setup(_props, ctx) {
    const track = ctx.figmaMotionTracks(TRACK_NODE).find(t => t.field === 'MOTION_TRANSLATION_XY');
    if (!track) return;
    let activePointer = null;
    let startValue = 0;
    let lastValue = 0;
    let lastMoveAt = 0;
    let velocity = 0;
    let cancelCoast = () => {};
    function stopCoast() {
      cancelCoast();
      cancelCoast = () => {};
    }
    function clockMs() {
      const state = ctx.figmaMotion.getState(FRAME);
      return state && typeof state.timeMs === 'number' ? state.timeMs : 0;
    }
    function applyValue(value) {
      const time = track.timeAtValue(value, { axis: 0 });
      if (time == null) return false;
      void ctx.figmaMotion.seek(FRAME, time);
      return true;
    }
    function begin(pointerId) {
      stopCoast();
      activePointer = pointerId;
      startValue = sampleX(track, clockMs());
      lastValue = startValue;
      lastMoveAt = performance.now();
      velocity = 0;
    }
    function drag(pointerId, dx) {
      if (pointerId !== activePointer) return;
      const value = startValue + dx;
      if (!applyValue(value)) return;
      const now = performance.now();
      const elapsed = Math.max(1, now - lastMoveAt);
      const instant = (value - lastValue) / elapsed;
      velocity = velocity * 0.65 + instant * 0.35;
      lastValue = value;
      lastMoveAt = now;
    }
    function release(pointerId) {
      if (pointerId !== activePointer) return;
      activePointer = null;
      if (performance.now() - lastMoveAt > 90) velocity = 0;
      if (Math.abs(velocity) < 0.015) return;
      let coastValue = lastValue;
      let speed = velocity;
      cancelCoast = ctx.onUpdate(dt => {
        coastValue += speed * dt * 1000;
        if (!applyValue(coastValue)) { stopCoast(); return; }
        speed *= Math.exp(-dt * 4.5);
        if (Math.abs(speed) < 0.012) stopCoast();
      });
    }
    function cancel(pointerId) {
      if (pointerId !== activePointer) return;
      activePointer = null;
      velocity = 0;
      stopCoast();
    }
    ctx.on('pointerdown', e => {
      if (e.pointer.isPrimary && e.pointer.button === 0) begin(e.pointer.pointerId);
    });
    ctx.on('drag', e => {
      const delta = ctx.eventDelta(e, REFERENCE);
      if (delta) drag(e.pointer.pointerId, delta.x);
    });
    ctx.on('dragend', e => release(e.pointer.pointerId));
    ctx.on('pointerup', e => release(e.pointer.pointerId));
    ctx.on('pointercancel', e => cancel(e.pointer.pointerId));
    ctx.on('wheel', e => {
      if (e.isPinch || e.modifiers.ctrlKey) return;
      const delta = ctx.eventDelta(e, REFERENCE);
      if (!delta) return;
      const amount = Math.abs(delta.x) > 0.001 ? delta.x : delta.y;
      if (!amount) return;
      e.preventDefault();
      e.stopPropagation();
      stopCoast();
      applyValue(sampleX(track, clockMs()) - amount);
    }, { passive: false });
    const unsubscribe = ctx.figmaMotion.subscribe(FRAME, state => {
      if (state && state.playbackKind === 'full' && state.status === 'playing') stopCoast();
    });
    ctx.dispose(() => { stopCoast(); unsubscribe(); });
  },
});
