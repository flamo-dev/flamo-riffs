# Flamo Interaction Library

- [Official Riffs interaction examples](https://github.com/flamo-dev/flamo-riffs/blob/main/interaction-examples.json) — find playable examples and the corresponding project or host source by gesture or API name. [Glass Folder gesture script](https://github.com/flamo-dev/flamo-riffs/blob/main/interaction-examples/glass-folder.ts).

- [Batched particles](src/hmi/path-flow-batched.ts) — `hmi.pipe-flow@2.5.0`; [recipe](recipes/hmi-path-flow-batched.md).

- [Runtime appearance](src/hmi/path-flow-appearance.ts) — `hmi.pipe-flow@2.4.0`; [recipe](recipes/hmi-path-flow-appearance.md).

Read this map first. Search with `rg`, then open only the selected capability or recipe.

## Registry Governance

- Catalog assets are immutable by `name@version`; publish a new version instead of replacing an existing one.
- Official assets use `tier: "official"` and the reserved `@flamo/*` scope. Community assets must use their own scope and compete by `kind`, `contracts`, and examples.
- Project defaults should allow `official` and `recommended`; `experimental` requires explicit opt-in.
- Every catalog asset is also its manifest: `publisher`, `tier`, `roles`, `events`, `capabilities`, `contracts`, `examples`, `source`, and `packageRef`.

## Base

- [Motion drag scrubber](src/base/motion-drag-scrubber.ts) drives a Figma Motion frame through a drag, release and inertial stop. [SoftScrollY recipe](recipes/motion-drag-scrubber.md).

- [Pointer rail follower](src/base/pointer-rail-follower.ts) slides a fixed-length highlight to the nearest point on each track. [Electro Wave recipe](recipes/pointer-rail-follower.md).

- [Motion folder](src/base/motion-folder.ts) — hover, expand, fly out and reset across two authored motion ranges. See the [recipe](recipes/motion-folder.md) and [Glass Folder demo](https://riffs.flamo.dev/glass-folder/).

- [Character performance](src/base/character-performance.ts) and [stage camera](src/base/stage-camera.ts) — interruptible additive acting, contain sizing, pointer coordinates and authored parallax; [recipe](recipes/character-performance.md).

- [`base/bind-number`](src/base/bind-number.ts) — numeric ratio dimensions and decimal text, using public Runtime layout observation and write preflight; preserves Auto Layout. See [recipe](recipes/number-binding.md).

- [`base/scroll-container`](src/base/scroll-container.ts) — two-axis scroll state, frozen thumb geometry, touch/pen momentum and bounce, delayed auto-hide, frame-coalesced commits, transparent gutters, keyboard navigation, and accessibility snapshots.
- [`base/use-cursor-blink`](src/base/use-cursor-blink.ts) — lifecycle-safe blinking state; use for carets and attention indicators.
- [`base/single-line-layout`](src/base/single-line-layout.ts) — deprecated end-caret layout retained for compatibility; new editors use `single-line-viewport`.
- [`base/single-line-viewport`](src/base/single-line-viewport.ts) — explicit `preserve`, `reveal-caret`, and `reset-start` policies.

## Web

- [`web/use-text-input`](src/web/use-text-input.ts) — hidden DOM input bridge with focus, input, composition, commit, and cleanup.
- [`web/use-single-line-text-editor`](src/web/use-single-line-text-editor.ts) — complete caret, internal-refocus, viewport-policy, keyboard, and blink orchestration.

## HMI

- [`hmi/path-flow-range`](src/hmi/path-flow-range.ts) — `hmi.pipe-flow@2.3.0`: stable path metadata, arc-length ranges, early-call-safe instance controls; [recipe and host forwarding](recipes/hmi-path-flow-range.md).

- [`hmi/path-flow-accelerated`](src/hmi/path-flow-accelerated.ts) — `hmi.pipe-flow@2.1.0`: independent acceleration in m/s², px/m scale, periodic emission; [recipe](recipes/hmi-path-flow-accelerated.md).

- [`hmi/path-flow`](src/hmi/path-flow.ts) — `hmi.pipe-flow@2.0.0`: deterministic cycle groups, scatter segments, native material pools, and path orientation. See [recipe](recipes/hmi-path-flow.md).

- [`hmi/pipe-flow`](src/hmi/pipe-flow.ts) — `hmi.pipe-flow@1.0.0` node-scoped flow controls backed by the canonical `@flamo/hmi` controller.
- [`hmi.pipe-flow managed module`](managed/behaviors/hmi.pipe-flow/1.0.0.js) — immutable Runtime-mountable ESM bundle; verify its SHA-256 through the catalog before installation.

## Recipes

- [`scroll-container`](recipes/scroll-container.md) — compose Runtime `ctx.mounted.children`, local-coordinate, capture, transparent-hit and transform-batch APIs; `mountedContent` is compatibility-only.
- [`scroll.container behavior contract`](contracts/scroll-container.behavior.json) — roles, pointer/keyboard lifecycle, invariants, traces, and visual evidence.
- [`text-input`](recipes/text-input.md) — compose the three capabilities into a canvas-native text field.
- [`text-input behavior contract`](contracts/text-input.behavior.json) — machine-readable transitions and invariants.
- [`hmi-pipe-flow`](recipes/hmi-pipe-flow.md) — bind PipeSpec-derived defaults, flow roles, node methods, and targeted W3C host events.
- [`hmi.pipe-flow behavior contract`](contracts/hmi-pipe-flow.behavior.json) — machine-readable roles, writes, traces, and visual evidence.

## Knowledge

- [`FInput extraction case`](wiki/cases/finput-extraction.md)
- [`Interaction asset boundaries`](wiki/decisions/asset-boundaries.md)

## Discovery order

1. Read the consuming project's `.flamo/wiki/index.md` and `.flamo/wiki/interactions.md`.
2. Search this map and `catalog/interactions.index.json`.
3. Open the selected recipe and TypeScript signature.
4. Read cases or failures only when implementation or verification needs more context.

- [Runtime-only path motion](recipes/hmi-path-flow-runtime.md) — hmi.pipe-flow@2.2.0 creates ephemeral particles from compact authoring metadata.
- [Real-time path flow](recipes/hmi-path-flow-realtime.md) — `hmi.pipe-flow@2.6.0`, added in `0.21.0` on 2026-11-04: elapsed-time phase on slow visible frames, background suspension, and unchanged GPU batches and public controls.
