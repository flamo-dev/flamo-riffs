# src

This is the authoring area for human and AI-written Flamo composition scripts.

- `components/<Name>/`: behavior and probes for exported component boundaries.
- `instances/<Name>/`: optional helpers for complex instance overlays.
- `nodes/<safeNodeId-or-role>/`: local behavior for ordinary scene nodes.
- `interactions/`: project-local reusable behavior that is not yet an official asset.
- `.flamo/interaction-library/`: managed knowledge snapshot from `@flamo/interaction-library`; import executable assets with `@flamo/interaction-library/*` and do not edit the backing source snapshot.

`view/data/artifact.flamo.json` remains the structured source of truth. Use `nodeArtifacts[*].scripts[].src` to point from the artifact to files in this directory, and compile generated runtime output into `.flamo/generated/`.

Use `ctx.reactive()`, `ctx.ref()`, `ctx.computed()`, and `ctx.watch()` in `defineNodeScript` hooks. The downloaded dev server compiles multi-file source modules referenced by artifact scripts and verifies the generated module graph with `npm run verify`.
