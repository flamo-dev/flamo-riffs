# Path cycle motion

Use `hmi.pipe-flow@2.0.0` for PipeSpec v3. The server materializer supplies the path, deterministic cycle group, a native Figma material pool, and exact `motion:N` role bindings. Use the managed module from the catalog; do not hand-write node IDs or vendor snapshots.

The behavior exposes `setFlowState({enabled, speed, direction, offset})`, `getFlowState()`, `startFlow()`, and `stopFlow({resetOffset})`. Speed uses canvas px/s. Offset is continuous signed travel; direction reversal preserves its current value. Every host command must target a node and/or instance. The old dash fields retain their v1 behavior when no cycle group is present. Shape, color ranges and pool size are authoring settings; edit them in Figma and synchronize again.

Required acceptance: hidden walls and medium reveal scene content, image snapshots survive source deletion, group seed replay is stable, forward/reverse animation does not reseed, copying or mounting a second instance never writes into the first, and disposal cancels both RAF and document listeners. Native slots are a bounded pool, including initially hidden slots; a serializer must retain them. Random sampling is deterministic and reusable outside the engine through `@flamo/hmi`.

See [contract](../contracts/hmi-path-flow.behavior.json) and [implementation](../src/hmi/path-flow.ts).
