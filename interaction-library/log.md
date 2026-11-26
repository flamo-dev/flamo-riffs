# Recent Changes

- 2026-11-26: Released `0.24.0` with [motion-drag-scrubber@1.0.0](recipes/motion-drag-scrubber.md), extracted from SoftScrollY.

- 2026-11-26: Released `0.23.0` with [pointer-rail-follower@1.0.0](recipes/pointer-rail-follower.md), extracted from Electro Wave.

- 2026-11-24: Released `0.22.0` with [motion-folder@1.0.0](recipes/motion-folder.md), extracted from Glass Folder. Projects supply their own hit area, layers, motion ranges and flyout offsets.

- 2026-09-29: Added 0.19.0 / hmi.pipe-flow@2.5.0 for GPU-instanced polygon particles. Requires Runtime shape batches; 1.0.0–2.4.0 snapshots remain immutable. Production release is separate.

- 2026-09-29: Added 0.18.0 / hmi.pipe-flow@2.4.0 for runtime-only visibility; published 1.0.0–2.3.0 snapshots remain immutable.

- 2026-09-28: Added `0.17.0` / `hmi.pipe-flow@2.3.0`: opt-in script-friendly pipe metadata, arc-length flow range controls and instance-addressed host commands. Old 1.0.0–2.2.0 snapshots remain byte-identical; old imports remain 2.2.0 without new metadata. This source addition does not imply a production or Community release.

- 2026-09-22: Released `0.14.0`: added `hmi.pipe-flow@2.0.0` cycle-group and scatter animation over instance-scoped public handles. Retained the immutable 1.0.0 asset and legacy dash behavior.

- 2026-09-08: Released `0.13.0`: added `@flamo/number-binding@1.0.0` and `bindNumber` via `@flamo/interaction-library/base`. Numeric display policy moved out of Runtime; requires public `ctx.observeLayout` and `ctx.assertLayoutWritable`. Added module placement guidance and executable dependency boundaries; existing asset identities remain unchanged.

- 2026-09-04: Updated the Scroll composition recipe to use the final semantic/mounted split: new code resolves direct viewport content through `ctx.mounted.children()`, re-resolves on revision changes, and treats `ctx.mountedContent()` as compatibility-only.
- 2026-09-04: Released `0.12.0`: added official `scroll.container@1.0.0` state/geometry controller, transparent gutter and mounted-content composition recipe, pointer loss cleanup, delayed auto-hide, deterministic touch/pen momentum and bounded bounce, reduced-motion settling, frame-coalesced continuous commits, keyboard navigation, accessibility snapshots, and instance-isolated disposal.
- 2026-08-18: Released `0.11.0`: promoted `hmi.pipe-flow@1.0.0` from project-local glue to an official managed Behavior with exact contract, recipe, Runtime-mountable deterministic ESM bundle, and catalog-bound SHA-256 validation.
- 2026-07-16: `useSingleLineTextEditor` now delegates pointer refocus and select-all refocus to the host `ctx.schedule` API, with a microtask fallback for non-Flamo hosts; FInput no longer needs a duplicate `setTimeout(0)` refocus workaround.
- 2026-07-15: Local source now tracks `selectionStart`/`selectionEnd`, emits selection traces, and supports drag-selection plus double-click select-all while preserving the single-line viewport policies and external-blur reset behavior.
- 2026-07-14: Released `0.9.0`: text input pointer placement now treats native DOM blur as pending and cancels it on internal refocus, so clicking a horizontally scrolled canvas input to reposition the caret no longer executes external blur/reset behavior.
- 2026-07-13: Released `0.8.0`: catalog entries now carry immutable manifest metadata with publisher/tier governance, a registry validator guards reserved `@flamo/*` scope and duplicate identities, and `useSingleLineTextEditor` exposes natural text width so canvas text geometry is not squeezed while caret math uses the same metrics.
- 2026-07-13: Released `0.7.0`: instance aliases now admit canonical hit-test entities into the correct canvas surface, route diagnostics distinguish declared from adapter-registered matches, and empty zero-width text nodes retain a valid coordinate probe.
- 2026-07-12: Released `0.6.0`: instance-scoped authoring aliases are canonicalized before BindingSys/EventBridge registration, and Preview reports declared, routed, exercised, and verified event stages.
- 2026-07-12: Released `0.5.0`: text-input verification requires `body`, `content`, and `cursor`; project artifact generation infers unambiguous common component roles and Runtime has a scoped legacy fallback.
- 2026-07-12: Released `0.4.0`: text inputs bind their hit-area role through `ctx.onNode`, avoiding instance-clone bubbling; downloaded compilers emit official transitive dependencies into one stable vendor tree.
- 2026-07-12: Documented stable `@flamo/interaction-library/*` imports for downloaded projects; the local compiler maps these public specifiers to the managed source snapshot.
- 2026-07-12: Released `0.3.0`: text-input recipes use Artifact Semantic API geometry/text metrics, and acceptance requires a real canvas pointer -> focus -> render causal trace rather than direct hidden-input mutation.
- 2026-07-11: Added `useSingleLineTextEditor`, explicit viewport policies, internal pointer-refocus blur suppression, selection-aware DOM input state, and a machine-readable behavior contract in `0.2.0`.
- 2026-07-11: Text-input recipe now requires typed `event.coordinates`, `ctx.eventPoint(event, content.id)`, `pointerdown`, structured traces, and behavior probes.
- 2026-07-11: Created `@flamo/interaction-library@0.1.0` with text-input, cursor-blink, and single-line-layout assets extracted from the FInput implementation.
- 2026-07-11: Established downloaded-project overlay rules: project Wiki first, official library second; official snapshots are read-only.

- 2026-09-23: Released `0.15.0`: added `hmi.pipe-flow@2.1.0` independent particle acceleration, physical scale and periodic emission. Published 1.0.0/2.0.0 bundles and identities remain unchanged.

Older entries should move to `logs/YYYY-MM.md` when this file becomes expensive to load.

- 2026-09-23: Released `0.16.0`: `hmi.pipe-flow@2.2.0` creates runtime-owned particles; Figma stores only path metadata and image references. Published 1.0.0/2.0.0/2.1.0 snapshots remain unchanged.

- 2026-10-09: Released source 0.20.0: added base stage-camera@1.0.0 and character-performance@1.0.0 for contained 2.5D scenes and external-clock, interruptible additive performances; prior catalog identities unchanged.
- 2026-11-04: Added immutable [hmi.pipe-flow@2.6.0](recipes/hmi-path-flow-realtime.md) and package `0.21.0`; script-contract projections select it. Slow visible frames no longer drop elapsed phase time. Hidden tabs stop scheduling and resume without catch-up. 2.5 and older managed bytes stay pinned.
