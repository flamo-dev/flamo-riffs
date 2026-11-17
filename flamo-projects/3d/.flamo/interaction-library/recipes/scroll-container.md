# Scroll container

Use `createScrollContainer` from `@flamo/interaction-library/base` for clipped, canvas-native scroll regions.

## Required composition

- Bind `viewport`, `content`, and the enabled axis bars as Artifact roles.
- Resolve current direct content with `ctx.mounted.children('viewport')`, use the first child as the primary content when the component contract guarantees one, and re-resolve after its `revision` changes. Do not inspect `event.composedPath()` for physical clone ids. `ctx.mountedContent()` is compatibility-only.
- Mark auto-hidden gutters with `handle.setInteractive({ mode: 'enabled', pointerEvents: 'box-only', hitTestWhenTransparent: true })`.
- Convert input with `ctx.eventPoint(event, barRole)` and call `beginThumbDrag`, `moveThumbDrag`, `jumpTo`, or `wheel`.
- For touch/pen panning on content, call `beginContentDrag`, `moveContentDrag`, and `endContentDrag`; render `displayOffsetX/Y` so bounded overscroll and spring settling remain visual while `offsetX/Y` stay clamped.
- In `onCommit`, use one `ctx.setTransformsBatch()` for content and thumb positions.
- Route `pointercancel` and `lostpointercapture` to the matching thumb/content cancel method.
- Route `keydown` while the viewport is focused; prevent defaults only when `controller.key(event.key)` returns true.
- Feed `controller.accessibility(axis, label)` into the host semantic-proxy/native accessibility adapter. Route that proxy's keydown back to `controller.key(key)`.
- Use `autoHideDelayMs` for idle hiding. Set `reducedMotion` from the host preference; momentum and bounce then settle synchronously without scheduling frames.

## Acceptance

- Hover or focus reveals bars before the first wheel event.
- Horizontal and vertical track/thumb input both work in a `both` container.
- An active drag remains continuous outside the small thumb and ends on up/cancel/lost capture.
- Auto-hidden gutters remain hittable at opacity zero.
- Touch/pen content panning produces bounded overscroll and deterministic momentum; reduced motion does not start a momentum frame.
- Arrow, PageUp/PageDown, Home and End update the expected enabled axis.
- During capture, picker `captureBypasses` grows while `deepRebuilds` stays stable.
