# Accelerated path flow 2.1.0

Extends [cycle groups](hmi-path-flow.md) with independent particle age. Author `motion.acceleration` in m/s² (default 0), `pixelsPerMeter` (default100), and `emissionPeriod` (default1 second per nominal cycle). Speed is launch speed in px/s. Positive acceleration with zero launch speed still runs; use `stopFlow` to pause.

Acceleration follows path arc length and the chosen direction, not a world gravity vector. A vertical downward path with speed0 and acceleration9.8 models gravity at the chosen scale. No contacts, drag or collisions.

The saved offset is signed queue phase in canvas units. In accelerated mode the UI exposes it as playback seconds. Initial snapshots are a prefilled steady stream. Changing speed/direction/acceleration reevaluates the current phase; pause/resume preserves it. Random identities follow each moving particle.

Runtime methods and host events remain as in v2. `setFlowState` additionally accepts nonnegative `acceleration`. Changes are atomic and refuse pool growth beyond the authored capacity; regenerate in the plugin to enlarge it. The engine and preview share the same sampler, and each instance owns its handles and scheduling.

Artifact defaults use the new immutable 2.1.0 bundle; installed 1.0.0/2.0.0 bytes are preserved. Package export: `@flamo/interaction-library/hmi/path-flow-accelerated`.
