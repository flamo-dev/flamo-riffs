# Horizontal photo strip with a short flick

Attach the node script below to the fixed frame. The strip samples the current pose when pressed, converts horizontal drag distance into authored time with `track.timeAtValue`, and seeks the entire frame. Photographs, text and masks stay on their original timeline.

SoftScrollX smooths the last movement speed (35% new sample). Releasing within 90 ms of the last move starts a coast above 0.015 local units/ms. The coast advances by the current speed, applies exponential decay at 4.5 per second and stops below 0.012 local units/ms. Holding still before release stops the strip at the chosen photograph. A new press catches a moving strip.

```ts
import { defineNodeScript } from '/vendor/flamo-runtime/index.es.js';
import { createFlickMotionStrip } from '@flamo/interaction-library/base/flick-motion-strip';

export default defineNodeScript({
  setup(_props, ctx) {
    const frame = ctx.sourceNodeId;
    const track = ctx.figmaMotionTracks('1:75').find(t => t.field === 'MOTION_TRANSLATION_XY');
    if (!track) return;
    const strip = createFlickMotionStrip({
      frame, track, motion: ctx.figmaMotion, onUpdate: fn => ctx.onUpdate(fn),
    });
    ctx.on('pointerdown', e => {
      if (e.pointer.isPrimary && e.pointer.button === 0) strip.begin(e.pointer.pointerId);
    });
    ctx.on('drag', e => {
      const d = ctx.eventDelta(e, frame);
      if (d) strip.drag(e.pointer.pointerId, d.x);
    });
    ctx.on('dragend', e => strip.release(e.pointer.pointerId));
    ctx.on('pointerup', e => strip.release(e.pointer.pointerId));
    ctx.on('pointercancel', e => strip.cancel(e.pointer.pointerId));
    ctx.on('wheel', e => {
      if (e.isPinch || e.modifiers.ctrlKey) return;
      const d = ctx.eventDelta(e, frame);
      if (d && strip.wheel(d.x, d.y)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, { passive: false });
    ctx.dispose(strip.dispose);
  },
});
```

Replace `1:75` with your moving layer's horizontal translation track. Use the stationary frame's local coordinate system for both drag and wheel input. A two-axis trackpad uses its X delta when present. A vertical wheel uses its Y delta to travel horizontally. Pinch and Ctrl-wheel remain available for zoom.

The standalone import above is also exported from `@flamo/interaction-library/base` in version 0.25.0. For Studio installations with an older built-in library, copy `package/src/base/flick-motion-strip.ts` from this release archive into the project's `src/.flamo/interaction-library/base/` directory before building.

[Play SoftScrollX](https://riffs.flamo.dev/soft-scroll-x/) · [Original project script](../../flamo-projects/softScrollX/src/scroll-x.ts)

Nastaran Jamali created the original Figma design. The horizontal drag interaction was added using Flamo and Codex.
