# Instanced path flow

`hmi.pipe-flow@2.5.0` retains path, range, acceleration, direction, visibility and lifecycle controls from 2.3/2.4. Polygon/dot tracks use the public Runtime `ctx.createShapeBatch`. Tracks containing image materials retain per-node rendering for all materials to preserve mixed draw order. Requires a Runtime that implements shape batches. No particle density or seed is changed.

The generator selects this version for script-contract pipes with runtime motion projections. Never replace a published old managed bundle in place. Legacy projections without a path contract retain their existing behavior.

One batch per item/material uses a shared local polygon and affine/RGBA instance data. Owner transforms, clipping, opacity and canvas scope remain Runtime responsibilities. Stop holds the last frame; disabled/empty range submits zero visible instances. Destroy releases each batch before removing its ephemeral scene subtree.

Acceptance: compare fixed phase to the node renderer, curved paths and reverse, accelerated flow, per-instance isolation, pause/resume and range changes, WebGPU/WebGL2, destruction/recreation. Report visible instances and frame latency for 60/100 flows separately from pool capacity and unit tests.
