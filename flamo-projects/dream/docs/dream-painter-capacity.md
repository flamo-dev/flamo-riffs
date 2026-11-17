# Dream painter capacity fix — 2026-10-03

## Revision and scope

Input/current artifact revision: `codex_20261003115653_bad3bf392f77`.
This is an isolated source change, not a new promoted revision or a CEF completion receipt. The server assigns the next revision after verification/promotion.

Only `src/nodes/star-sea/painter.ts` drawing storage/submission and diagnostics are changed. Fish geometry, poses, layering/glow, world density/LOD, meteor/nova generation, interactions, HUD, wallpaper mode and dreamCircle are unchanged. Existing artifact script attachment and bindings are reused. The official compiler synchronizes the artifact public script surface; no manual artifact geometry or managed snapshot edits.

## Root cause and fix

The old dot/line append paths silently returned at 22,000 / 18,000 shared primitives. World drew first and consumed the foreground's storage. Increasing a constant merely postpones that failure.

CPU arrays now double on demand, copy their populated prefix, and retain high-water storage. Public `ShapeInstanceBatchHandle` has only update/dispose, no resize. At submission each changed batch is created with its new capacity and populated, then its old batch is disposed. There are two steady-state batches, at most three live during a replacement; at most one replacement per kind per frame, even after multiple CPU doublings. No per-frame shrink/reallocation at steady demand. Replacement-upload failure disposes the replacement and throws, retaining the old batch.

**Public API ceiling:** `view/api/runtime-api.manifest.json` specifies 1..100,000 instances per batch. GPU growth saturates at that legal limit; CPU accumulation still measures full demand. If exceeded, preserve the complete foreground suffix (fish, orbits, jellyfish, meteors, novas, ripples and pointer), dropping only the tail of the background prefix. If foreground itself exceeds 100,000, throw explicitly before uploading the frame; do not pretend it rendered. No ordinary tested frame reaches this fallback. Device allocation failure also throws, not a silent success. This is not a guarantee against arbitrary memory exhaustion.

## Telemetry semantics

Existing dream:telemetry spreads the painter result, so no shell changes are needed:

- `primitiveStats.lines` / `.dots`: `requested`, `accepted`, `dropped`, `highWater`, `capacity`, `cpuCapacity`, `cpuGrowths`, `batchReplacements`.
- requested = eligible primitives after existing viewport/alpha/radius/degenerate-line culling, before capacity policy. Ordinary intentional culling is not capacity loss.
- accepted = submitted count; dropped = requested - accepted (background only on successful overflow frames).
- highWater = lifetime peak requested count, including frames above GPU capacity; capacity = current legal GPU allocation; cpuCapacity = retained CPU storage.
- growth/replacement counters are cumulative for this painter instance; normal frame counts reset each render.
- `worldPrimitives` = submitted background counts; `fishPrimitives` = complete eligible fish counts (not other foreground).
- Existing lines/dots/capacity/bytes fields remain available. Failed frames throw and do not emit a successful new painter result; prior telemetry must not be mistaken for successful current rendering.

## Reproducible local checks

Tools: Node v24.14.1, TypeScript 5.7.2 pinned under `.flamo/tools` (no root node_modules or framework changes).

```
node .flamo/tools/node_modules/typescript/bin/tsc --noEmit
NODE_OPTIONS="--loader ./tests/tool-resolver.mjs" node scripts/flamo-dev.mjs compile
node tests/dream-painter-capacity.mjs
NODE_OPTIONS="--loader ./tests/tool-resolver.mjs" node scripts/flamo-verify.mjs
node tests/dream-wallpaper-source.mjs
```

All pass. Loader is needed in NODE_OPTIONS so the verifier's compiler subprocess also resolves isolated TypeScript. An initial direct-loader-only verify attempt failed dependency resolution; rerunning with inherited NODE_OPTIONS passed. No verification scripts were modified.

72 cases: three original viewport sizes × twelve zoom points × two seed/time pairs (1/0, 19/37). Zoom: 0.0625, 0.0883883476, 0.125, 0.3535533906, 0.7071067812, 1, 1.4142135624, 2, 2.8284271247, 4, 5.6568542495, 8. These cover zoom endpoints, maximum zoom LOD and mixed LOD passes; not an exhaustive sweep over all seeds/camera positions.

Each case uses the real world and foreground painter with maximum normal transient pools (3 meteors / 6 novas), pointer and ripple. Scheduling is frozen only to make foreground equality independent of collision-target availability. Strict public batch mock rejects capacities above 100,000, invalid upload sizes, nonfinite payloads and disposal mistakes. The entire foreground Float32 payload equals the same frame rendered without background pressure. At zoom=1, t=0, both fish retain 7,272 lines and 3,158 dots. Repeat/smaller/return frames retain CPU array identity and do not replace batches; smaller views are only an extra reuse test, never the large-screen acceptance input.

| Viewport | Peak lines | Peak dots | Max line capacity | Max dot capacity | Drops |
|---|---:|---:|---:|---:|---:|
| 1920×1080 | 19,160 | 19,830 | 36,000 | 22,000 | 0 |
| 2560×1600 | 27,591 | 32,286 | 36,000 | 44,000 | 0 |
| 3840×2160 | 45,208 | 57,361 | 72,000 | 88,000 | 0 |

Additional tests: multi-doubling / single replacement with 1,000 ripples; 110,000 background primitives per kind with exact foreground preservation and accurate drops; explicit rejection of 3,000-ripple foreground overload; injected replacement upload failure, cleanup and retry. All passed.

Evidence: `.flamo/reports/dream-painter-capacity/{statistics.json,test.log,typecheck.log,compile.log,verify.log,wallpaper-source.log,validation.json}`.

## Required real CEF follow-up

No actual Wallpaper Engine/Chrome146 GPU preview or `verifyInteractionTrace()` was available/run here. Pure tests cannot establish screenshot appearance, actual GPU allocation/order/driver limits, teardown timing, frame-time spikes, sustained memory/performance, or host hot-reload behavior. On real PC use the three full sizes and zoom points above; inspect complete fish/glow and HUD, trigger ripples and collisions, pan through dense world regions, resize/replay, and observe growth plateau then stable counters. Require requested=accepted, dropped=0 under normal use and two steady-state batches. Inspect the first growth frame for flashes/missing layers and release of old GPU buffers. Obtain screenshots/trace plus passing runtime trace verification before visual acceptance. Mouse compatibility and desktop zoom buttons remain PC shell work, intentionally untouched.
