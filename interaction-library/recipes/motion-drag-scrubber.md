# Drag a Figma Motion timeline with inertia

SoftScrollY uses the photo strip's vertical translation as a ruler for the entire frame. A drag moves the strip by the same local distance as the pointer. The scrubber looks up the corresponding authored time with `track.timeAtValue` and seeks the frame, keeping photos and caption fades in sync. Release starts a decelerating coast. Pressing again catches the current pose.

Import `createMotionDragScrubber` from `@flamo/interaction-library/base` or its standalone subpath below. Choose a monotonic translation track with distinct endpoints. Increasing and decreasing tracks both work. Bind input on a fixed frame in the track's coordinate system. When binding elsewhere, pass that fixed reference to `ctx.eventDelta`.

```ts
import { createMotionDragScrubber } from '@flamo/interaction-library/base/motion-drag-scrubber';

// In the frame's setup function. Supply your moving content node ID.
const track = ctx.figmaMotionTracks(contentId).find(t => t.field === 'MOTION_TRANSLATION_XY');
if (!track) return;
const scrubber = createMotionDragScrubber({
  frame: ctx.sourceNodeId, axis: 'y', track, motion: ctx.figmaMotion,
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
ctx.dispose(scrubber.dispose);
```

For horizontal motion choose `axis: 'x'` and pass `delta.x`. Drag consumes total displacement from pointer-down. Optional `scrubber.wheel(delta)` consumes one local wheel delta at a time. The SoftScrollY adapter leaves pinch and Ctrl-wheel available for zoom. Native playback cancels a drag or coast. The next gesture samples the visible frame time.

[Play SoftScrollY](https://riffs.flamo.dev/soft-scroll-y/) · [SoftScrollY event bindings](../../flamo-projects/softScrollY/src/scroll-y.ts)

Original Figma design by Nastaran Jamali. The SoftScrollY drag interaction was added using Flamo and Codex.
