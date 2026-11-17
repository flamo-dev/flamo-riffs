# Runtime-only path motion

Use `hmi.pipe-flow@2.2.0` for compact Figma version 2 projections. The hidden motion frame carries path metadata and transparent image resource references. The behavior creates ephemeral artwork with public Scene API, reuses the accelerated sampler, and removes it on disposal or setup failure. Version 1 authored pools and dash-only bindings remain compatible.

Verify zero authored particle nodes, runtime animation, image assets, independent instances, and disposal. See [accelerated motion](hmi-path-flow-accelerated.md) for state and speed semantics.

The public `scene.flush()` is a frame boundary, not proof that queued nodes have materialized. Wait for `mounted.resolve()` for the owned subtree before writing the first visibility, color, and transform. Dispose the ephemeral group in one operation; cancel initialization when disposal occurs before readiness.
