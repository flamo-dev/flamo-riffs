# HMI pipe flow

Use `hmi.pipe-flow@1.0.0` for a node-scoped HMI pipe whose flow layer is driven by the canonical `@flamo/hmi` controller.

The Artifact binding must provide exactly one `root` and one `flow` role. Its `options.initialState` is a generated execution projection of the Figma `flamo-hmiPipe` PipeSpec; it is not a second authoring source.

```json
{
  "behaviorRef": "hmi.pipe-flow",
  "version": "1.0.0",
  "roleBindings": { "root": "13:15", "flow": "13:17" },
  "options": {
    "initialState": {
      "enabled": true,
      "speed": 24,
      "direction": "forward",
      "offset": 0,
      "color": "#D3725A",
      "width": 10,
      "dashPattern": [8, 16]
    }
  }
}
```

The managed script exposes `setFlowState`, `getFlowState`, `startFlow`, and `stopFlow` on the pipe root. A browser host may alternatively dispatch targeted `flamo:hmi-pipe-flow:set` events and observe `flamo:hmi-pipe-flow:state`.

Do not copy the managed module into project source or edit it in place. The catalog SHA-256 binds the immutable module bytes to the Behavior version.
