# Number Binding

Use `bindNumber` from `@flamo/interaction-library/base` for linear value-to-size and decimal text projection. It requires the public `ctx.observeLayout` and `ctx.assertLayoutWritable` Runtime capabilities. The former Runtime `bindNumber` export has moved; update imports when upgrading.

```ts
import { bindNumber } from '@flamo/interaction-library/base';

// Inside setup(props, ctx); roles and public props belong to the consumer component.
const target = ctx.role('fill');
const reference = ctx.role('track');
const text = ctx.role('label');
if (!target || !reference || !text) throw new Error('Missing numeric display roles');
bindNumber(ctx, () => props.value, {
  range: [0, 100],
  size: { target, axis: 'height', reference, box: 'content', hideAtMinimum: true },
  text: { target: text, fractionDigits: 2 },
});
```

The finite increasing range is normalized as `(value - minimum) / (maximum - minimum)`. Explicitly choose content or border box. Text-only and width-only uses are supported. Non-finite/out-of-range live values keep the previous valid display. Invalid configuration throws; an unavailable/unmounted measurement waits for Runtime layout. Content-derived and self references are rejected to avoid feedback.

The helper owns ratio, fraction digits and visibility policy. Runtime owns measurement notifications, instance scope and write legality. A layout preflight failure happens before size or text submission. The helper never changes position, layout, padding, alignment, constraints or corners. `handle.layout()` is a read; do not replace `observeLayout` with a watch around non-reactive ECS measurements.

Verify zero/midpoint/maximum, actual text and geometry, preserved design settings, reference resize, independent instances and disposal. Observe `binding.number.applied` trace. Keep business ranges and role identities in the user project.

Related: [source](../src/base/bind-number.ts), [asset boundaries](../wiki/decisions/asset-boundaries.md), [capability map](../index.md).
