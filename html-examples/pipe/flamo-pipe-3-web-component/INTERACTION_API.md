# Interaction target API

Read interactions.json for target IDs and requirements. Notes do not run code. Missing endpoints, point mappings, assets and behavior parameters must be resolved in the host project.

After element.ready, element.getInteractionTarget(targetId) returns an instance-scoped RuntimeNode handle, or null if unavailable. element.inspectInteractionTargets() reports generation and lookup diagnostics. Never use global node names or shadowRoot to reach Canvas nodes.

The handle supports id, name, get(path), set(path, value), patch(patch), design(), current(), setFillColor({r,g,b,a}), setText(text), setVisible(boolean), setOpacity(number), on(event, handler, options), and worldToLocal({x,y}). RGB channels are 0..1. design().geometry.size provides authored size. current() reads a runtime snapshot asynchronously. on() returns a disposer; pointermove, pointerleave and click are supported event names. Event coordinates.world are scene coordinates; worldToLocal converts them using the current mounted transform. Do not use clientX as node-local X.

For MCP-first integration, use manifest.integration with flamo_component_resolve and flamo_component_api. Queries stay pinned to the installed contractId. The snapshot topic describes appearance.fills: paint.kind (not type), visible, opacity, color and gradient stops. Read a visible solid paint with node.design().appearance?.fills.find(p => p.kind === 'solid' && p.visible)?.color.

Use bindInteractionTarget from dist/component-integration.js for lifecycle-safe host setup. The setup callback receives {signal} and can return a synchronous disposer. It is aborted and disposed before rebind and on flamo-disconnected/flamo-destroyed. inspectComponentIntegration collects public target observations for flamo_component_verify; observations are host-reported and do not prove business behavior by themselves.

Example (demonstration colors, not an inferred design requirement):

```js
await element.ready;
let dispose = () => {};
function connect() {
  dispose();
  const node = element.getInteractionTarget(targetId);
  if (!node) return;
  dispose = node.on('pointermove', event => {
    const p = node.worldToLocal(event.coordinates.world);
    const width = node.design().geometry.size.width;
    if (!p || !width) return;
    const t = Math.max(0, Math.min(1, p.x / width));
    node.setFillColor({ r: t, g: 0.3, b: 1 - t, a: 1 });
  });
}
element.addEventListener('flamo-interaction-targets-change', connect);
element.addEventListener('flamo-ready', connect); // reconnect
connect();
// Host teardown: dispose(); remove both listeners; cancel pending requests/frames.
```

Variant/reload/slot/composition changes invalidate old handles and dispose their listeners. flamo-interaction-targets-change contains generation and targetIds; reacquire handles there. Stale handles throw interaction_target_stale. Disconnect immediately invalidates the controller. Reconnect gets a new controller; flamo-ready is the mount boundary. Do not cache handles across these boundaries.

Slot targets retain native slot names, slot props/events and slotStyles. A shared slot assignment does not become independent per outlet just because annotations differ. Prefer declared component properties/events/methods over internal node access when available. If the required behavior cannot be expressed with the public APIs, edit the source Flamo project and export again.

Keep a host-owned flamo-integration.report.json with component revision, annotationId/contentHash, targetId, implementation files, real data mappings, implemented/verified/blocked/needs-review status and evidence. Verify independent instances, fit/resize, source switching, reconnect and disposal. Documentation is not implementation evidence.
