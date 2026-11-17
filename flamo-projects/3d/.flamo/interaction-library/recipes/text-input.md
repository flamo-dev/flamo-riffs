# Text Input Recipe

Use when a canvas component needs native keyboard/IME input while its visible text and caret remain Flamo nodes.

## Compose

Prefer `useSingleLineTextEditor(ctx, ...)`, which composes the lower-level assets and makes viewport policies explicit.

Import official assets through the stable project alias; do not calculate a relative path into the managed snapshot:

The following composition belongs inside `setup(props, ctx)` so public input comes from the first parameter.

```ts
import { useSingleLineTextEditor } from '@flamo/interaction-library/web/use-single-line-text-editor';
```

The component nodeArtifact must declare `body`, `content`, and `cursor` roles. Downloaded projects infer these common roles from unambiguous component child names, and `npm run verify` stops before Preview when any required role is missing.

1. Resolve project roles (`body`, `content`, `cursor`) in component `script.ts` after the mounted instance is scene-ready.
   Read live geometry through `ctx.probe()` and typography through `measureText()`; do not parse Figma `fontName`, `lineHeight`, transforms, or hard-code role dimensions.
2. Bind `pointerdown` directly to the hit-area role with `ctx.onNode('body', ...)`, then call `ctx.eventPoint(event, content.id)`. Never depend on clone-parent bubbling, read `event.position`, or hard-code parent offsets.
   Empty text commonly has zero width; this is still a valid local coordinate space and `ctx.eventPoint()` must return a point when its transform exists.
3. Pass the returned content-local X to `editor.placeCaretFromPointer(point.x)`. Pointer placement uses `preserve`; the DOM input bridge defers blur confirmation by one task and cancels it if the editor refocuses internally, so clicking a scrolled input to reposition the caret does not run external-blur behavior.
4. Render `snapshot.contentX`, `snapshot.caretX`, `snapshot.contentWidth`, value, and cursor visibility. Rendering does not decide scrolling; the editor already selected a policy. The content TEXT node should use `snapshot.contentWidth` as its runtime-safe width so the renderer never squeezes long input into the viewport or into a box smaller than the Canvas text texture.
5. Call `ctx.trace(...)` for component-specific events and inspect `window.__flamo_project.traceInteraction()` during preview.

```ts
const body = ctx.role('body');
const content = ctx.role('content');
const cursor = ctx.role('cursor');
const bodyProbe = body ? ctx.probe(body.id) : null;
const contentProbe = content ? ctx.probe(content.id) : null;
const cursorProbe = cursor ? ctx.probe(cursor.id) : null;

const editor = useSingleLineTextEditor(ctx, {
  initialValue: props.content,
  viewportWidth: bodyProbe?.size.x ?? 0,
  contentStartX: contentProbe?.transform.m02 ?? 0,
  cursorWidth: cursorProbe?.size.x ?? 1,
  measureText: (text) => content?.measureText(text) ?? 0,
  onRender(snapshot) {
    content?.setText(snapshot.value, { preserveStyle: true });
    content?.setSize(snapshot.contentWidth, contentProbe?.size.y ?? 1);
    content?.set('TransformCpt.transform.m02', snapshot.contentX);
    cursor?.set('TransformCpt.transform.m02', snapshot.caretX);
    cursor?.setVisible(snapshot.focused && snapshot.cursorLit);
  },
});

ctx.onNode('body', 'pointerdown', (event) => {
  const point = content ? ctx.eventPoint(event, content.id) : null;
  if (point) editor.placeCaretFromPointer(point.x);
});
```

## Acceptance

- Clicking the component focuses the native input.
- Latin and IME composition update the visible value.
- Enter commits only after composition ends.
- Escape and configured commit keys blur according to options.
- Disposing the node script removes DOM listeners, input, and blink timer.
- Project node IDs and business rules do not enter the official assets.
- The behavior contract at `contracts/text-input.behavior.json` is satisfied.
- A behavior change is not complete with only typecheck and verify; attach probe and trace evidence.
- In `debugScripts()`, compare `eventRoutes.declaredMatchedEntityIds` with `matchedEntityIds`. A declared-only match means surface filtering prevented the canonical hit-test entity from reaching the canvas adapter.

## Related

- [`../wiki/cases/finput-extraction.md`](../wiki/cases/finput-extraction.md)
- [`../src/web/use-text-input.ts`](../src/web/use-text-input.ts)
