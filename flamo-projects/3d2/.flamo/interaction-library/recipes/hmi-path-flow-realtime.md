# Real-time path flow

`hmi.pipe-flow@2.6.0` advances phase using elapsed visible time, including frames longer than 250 ms. This keeps belt and coal speed consistent on slow machines. It retains the 2.5 GPU batches, image fallback, density, seed, range, direction, acceleration and appearance controls.

Hidden documents cancel scheduling. Returning to the page starts a fresh clock, as do explicit stop/start controls. The behavior releases its visibility listener and all owned batches/nodes on disposal. Existing published bundles remain immutable; importing/regenerating a script-contract pipe selects 2.6. Local existing projects must explicitly migrate their script reference and binding version and rebuild/export.

Responsibilities: domain phase and visibility policy in `src/hmi/path-flow-realtime.ts`, depending on the public Runtime scene/batch API and `@flamo/hmi` path math. No private ECS or command access. Acceptance includes 500–1250 ms frames, background/resume, reverse, range, pause, per-instance isolation and re-mount, alongside the batched renderer tests.
