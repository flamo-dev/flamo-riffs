import { defineNodeScript } from '/vendor/flamo-runtime/index.es.js';

export default defineNodeScript({
  setup(_props, ctx) {
    const frame = ctx.sourceNodeId;
    const motion = ctx.figmaMotion;
    const track = ctx.figmaMotionTracks('1:72').find(t => t.field === 'MOTION_TRANSLATION_XY');
    if (!track) return;

    // The fixed BG frame is the reference for the content's authored Y translation.
    const readY = () => track.sample(motion.getState(frame).timeMs)[1];
    const first = track.sample(track.startMs)[1], last = track.sample(track.endMs)[1];
    let position = readY(), start = position, velocity = 0, lastMove = 0;
    let pointer: number | null = null, endCoast: (() => void) | undefined;

    function seek(y: number) {
      position = Math.max(Math.min(first, last), Math.min(Math.max(first, last), y));
      const time = track.timeAtValue(position, {axis: 1});
      if (time !== null) void motion.seek(frame, time);
      return position === y;
    }
    function stop() {
      endCoast?.();
      endCoast = undefined;
      velocity = 0;
      pointer = null;
    }
    function coast(dt: number) {
      const elapsed = Math.min(64, dt * 1000);
      velocity *= Math.exp(-0.0012 * elapsed);
      if (Math.abs(velocity) < 0.004 || !seek(position + velocity * elapsed)) stop();
    }

    ctx.on('pointerdown', e => {
      if (!e.pointer.isPrimary || e.pointer.button !== 0) return;
      stop();
      motion.pause(frame);
      start = position = readY();
      lastMove = performance.now();
    });
    ctx.on('dragstart', e => {
      if (e.pointer.isPrimary && (e.pointer.buttons & 1)) pointer = e.pointer.pointerId;
    });
    ctx.on('drag', e => {
      if (e.pointer.pointerId !== pointer) return;
      const delta = ctx.eventDelta(e);
      if (!delta) return;
      const previous = position, now = performance.now();
      seek(start + delta.y);
      velocity = 0.7 * velocity + 0.3 * (position - previous) / Math.max(1, now - lastMove);
      lastMove = now;
    });
    ctx.on('dragend', e => {
      if (e.pointer.pointerId !== pointer) return;
      pointer = null;
      if (performance.now() - lastMove < 250) endCoast = ctx.onUpdate(coast);
    });
    ctx.on('pointercancel', stop);
    ctx.on('wheel', e => {
      if (e.isPinch || e.modifiers.ctrlKey) return;
      const delta = ctx.eventDelta(e);
      if (!delta) return;
      if (motion.getState(frame).status === 'playing') position = readY();
      stop();
      e.preventDefault();
      e.stopPropagation();
      seek(position - delta.y);
    }, {passive: false});
    motion.subscribe(frame, state => {
      if (state.playbackKind === 'full') {
        stop();
        position = track.sample(state.timeMs)[1];
      } else if (pointer === null && !endCoast) position = track.sample(state.timeMs)[1];
    });
    ctx.dispose(stop);
  },
});
