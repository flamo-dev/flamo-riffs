# Pointer-following highlights on fixed rails

Electro Wave has eight stationary, mirrored paths. Each highlight covers 12% of its own path. Moving the pointer gives each path a different nearest point. Leaving the frame brings all eight lights back to the logo.

Import `createPointerRailFollower` and `sampleCubicRail` from `@flamo/interaction-library/base`. Supply each path's local centerline and live world transform at mount. Straight or sampled paths can use point arrays directly. For cubic paths pass the starting point followed by two controls and an endpoint per segment. Recreate the follower if the track geometry or its world transform changes.

```ts
const follower = createPointerRailFollower(waves.map(wave => ({
  points: sampleCubicRail(wave.controls),
  worldTransform: wave.matrix,
  draw: (start, end) => wave.paintInterval(start, end),
  restore: () => wave.restoreAuthoredPaint(),
})), { span: 0.12, response: 18 });

const frame = ctx.sourceNodeId;
ctx.on('pointermove', event => {
  const state = ctx.figmaMotion.getState(frame);
  if (state.status === 'playing') ctx.figmaMotion.pause(frame);
  const t = state.durationMs ? state.timeMs / state.durationMs : 0;
  // Electro Wave's original light travels from 6% to 94% with cubic ease-out.
  follower.follow(event.coordinates.world, 0.06 + 0.88 * (1 - (1 - t) ** 3));
}, { capture: true });
ctx.on('pointerleave', follower.returnToEnd);
ctx.onUpdate(follower.update);
ctx.dispose(ctx.figmaMotion.subscribe(frame, state => {
  if (state.status === 'playing') follower.release();
}));
ctx.dispose(follower.release);
```

The drawing adapter receives two normalized local arc lengths. In Electro Wave it maps them onto the existing tapered stroke's diagonal gradient, hides the authored moving lights during pointer control, and restores the solid stroke and lights when playback takes over. For a path-trim renderer, the same fractions can drive its trim interval directly. The follower measures nearest points in world space, including on mirrored or nonuniformly scaled tracks.

[Play Electro Wave](https://riffs.flamo.dev/electro-wave/) · [Read the artwork-specific paint and playback adapter](../../flamo-projects/electroWave/src/pointer-wave.ts)
