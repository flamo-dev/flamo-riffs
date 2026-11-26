import { defineNodeScript } from '/vendor/flamo-runtime/index.es.js';
import { createMotionDragScrubber } from '@flamo/interaction-library/base/motion-drag-scrubber';

export default defineNodeScript({
  setup(_props, ctx) {
    const track = ctx.figmaMotionTracks('1:72').find(t => t.field === 'MOTION_TRANSLATION_XY');
    if (!track) return;
    const scrubber = createMotionDragScrubber({
      frame: ctx.sourceNodeId,
      axis: 'y',
      track,
      motion: ctx.figmaMotion,
      onUpdate: callback => ctx.onUpdate(callback),
    });

    ctx.on('pointerdown', e => {
      if (e.pointer.isPrimary && e.pointer.button === 0) scrubber.begin(e.pointer.pointerId);
    });
    ctx.on('drag', e => {
      const delta = ctx.eventDelta(e);
      if (delta) scrubber.drag(e.pointer.pointerId, delta.y);
    });
    ctx.on('dragend', e => scrubber.release(e.pointer.pointerId));
    ctx.on('pointerup', e => scrubber.release(e.pointer.pointerId));
    ctx.on('pointercancel', e => scrubber.cancel(e.pointer.pointerId));
    ctx.on('wheel', e => {
      if (e.isPinch || e.modifiers.ctrlKey) return;
      const delta = ctx.eventDelta(e);
      if (!delta || !delta.y) return;
      e.preventDefault();
      e.stopPropagation();
      scrubber.wheel(delta.y);
    }, { passive: false });
    ctx.dispose(scrubber.dispose);
  },
});
