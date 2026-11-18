# Script-friendly pipe flow — 2.3.0

Requires `hmiPipeScript` v1 metadata from the updated offline Figma pipe plugin and its empty runtime carrier. Explicitly regenerate old pipes and import using a compatible Flamo Server; old imports without this contract retain 2.2.0. Do not edit immutable managed bundles.

Deploy the matching Server, managed assets and Runtime before importing new pipes online. Existing user components and previously exported packages are not migrated by upgrading the plugin. New host methods require the outer component's explicit public surface and a fresh export.

The existing pipe `root/source/medium/flow/motion` roles are rebound by the importer into the current instance. Use a component-owned role binding, not a global node-name search or an absolute Figma ID. A business component (such as Box) owns the mapping from `pipStart/pipStop` to path distances.

```ts
const pipe = ctx.role('pipe');
// This component's nodeArtifact.roles maps pipe to its nested pipe root.
if (!pipe) throw new Error('Missing component pipe role');
const path = pipe.call('getFlowPath');
pipe.call('setFlowRange', { start: 0.2, end: 0.8, unit: 'ratio' });
pipe.call('stopFlow');
pipe.call('reverseFlow'); // remains paused
pipe.call('startFlow');
```

Declare the component role first. For an explicit managed binding, `ctx.behavior('your.behavior@version').role('pipe')` is also supported. Importing this recipe does not create a role automatically.

## API

- `getFlowPath()`: defensive copy of `{version:1,pathId:'centerline',coordinateSpace:'source-local',geometryHash,points,length,endpoints:{start:0,end:length}}`.
- `setFlowRange({start,end,unit:'ratio'|'distance'})`: finite, ordered, bounded values; equality hides all moving objects. Returns state with canonical distance range. Invalid input throws without modifying state. Source-local distance is not screen pixels under scaling.
- `setFlowState(patch)`: enabled, speed, acceleration (cycle motion only), direction, offset, color, width, dashPattern. Appearance fields style dashed flow, not authored image/particle materials. Acceleration requiring a larger pool is rejected.
- `getFlowState()`: state plus range, ready, paused, running, error. Methods exist during mounting, writes take effect after resources become ready. Polling state is optional; traces/state events announce ready/error.
- `startFlow()`, `stopFlow({resetOffset?:boolean})`, `reverseFlow()`: stop freezes visible particles; disabled hides them. Start does not override enabled=false. Range/reversal preserve offset and paused status.

Static walls and medium never change. The new range restricts moving flow only; it does not provide an arbitrary clip mask for the whole pipe. Dashed geometry follows the sampled subpath. Particle centers follow the original full path/phase; a conservative half-diagonal distance margin excludes whole particles at range edges. This preserves size/spacing/speed and works through bends; it is deliberately not pixel-perfect end slicing.

## Component and W3C host

Expose a forwarding method from the outer component script; nested pipe methods are not automatically the outer Web Component's public ABI:

```ts
ctx.expose({
  setRange: value => pipe.call('setFlowRange', value),
  pause: () => pipe.call('stopFlow'),
  resume: () => pipe.call('startFlow'),
  reverse: () => pipe.call('reverseFlow'),
});
// Declare these names in the outer component's surface.imperative, then export.
```

An external host script can use the newly exported element without accessing its internals:

```js
await customElements.whenDefined('flamo-box');
const box = document.querySelector('flamo-box');
await box.ready;
box.setRange({ start: 0.2, end: 0.8, unit: 'ratio' });
box.pause();
box.reverse(); // still paused
box.resume();
```

Use per-element methods for multiple Web Component instances. Low-level `flamo:hmi-pipe-flow:set` events require **both** the actual runtime instanceId and scoped nodeId; a source ID alone is rejected. No global document broadcast should be used as an instance selector.

## Acceptance

Verify straight and curved paths, 0/full/empty ranges, paused reversal, repeated creation/destruction, two instances, initialization-time calls, invalid input, unchanged original design geometry, and fresh export/reconnect. Preserve separate records for mocked Plugin API, real Figma, real Runtime browser, and Web Component host evidence.
