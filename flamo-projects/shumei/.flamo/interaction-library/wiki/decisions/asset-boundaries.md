# Interaction Asset Boundaries

Official assets must be project-agnostic, typed, composable, and lifecycle-safe. They may depend on structural Flamo context interfaces, but not on project node IDs, Figma layer names, component dimensions, business APIs, or project Wiki facts.

Reusable policy is not automatically Runtime framework code. Numeric ratio/formatting, cursor blinking and scroll state belong in this library; identity, layout observation and write enforcement belong in framework. Base assets cannot depend on web/hmi. Assets cannot import Runtime implementation/private files or access ECS, GameLoop or command queues. Use structural public context interfaces; public type-only Runtime imports are permitted. Missing capabilities should become small public framework APIs.

Before creating/moving a module, record responsibility, layer, target path and dependencies. The repository's `pnpm check:architecture` and this package's `validate:registry` enforce configured import/access boundaries. They cannot decide semantic responsibility for every new helper. See [repository decision](../../../../../../wiki/decisions/2026-09-08-module-placement-and-dependency-boundaries.md).

Catalog publication is append-only by immutable identity (`name@version`). The `@flamo/*` scope is reserved for official assets published by Flamo. Community assets must use their own scope, declare `publisher`, `tier`, roles, events, capabilities, contracts, examples, source, and packageRef, then compete by kind and contract coverage instead of replacing an official asset.

Downloaded projects receive two overlays:

- `.flamo/wiki`: writable project memory and local decisions.
- `.flamo/interaction-library`: read-only official knowledge snapshot.

Executable official source is vendored under `src/.flamo/interaction-library` so the existing local script compiler can compile relative imports offline. The lock file records provenance and version. Project discoveries are written locally first and promoted through an explicit proposal rather than editing the snapshot.

Project defaults should resolve `official` and `recommended` assets. `experimental` assets require explicit opt-in from the project or user.

Related: [`../../index.md`](../../index.md), [`../../recipes/text-input.md`](../../recipes/text-input.md).
