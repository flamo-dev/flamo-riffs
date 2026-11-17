# @flamo/interaction-library

Flamo's official, AI-readable interaction primitives and recipes.

Behavior/display policy belongs here; public measurement, scheduling, lifecycle and write enforcement belong in Runtime framework. Start with [module boundaries](wiki/decisions/asset-boundaries.md) and this package's AGENTS.md before adding a module. Numeric bindings use [bindNumber](recipes/number-binding.md) from the base export.

- Registry entries are append-only by immutable identity (`name@version`). Official assets use the reserved `@flamo/*` scope and community assets must publish under their own scope.
- Run `bun run validate:registry` before publishing catalog changes. It verifies registry governance, Behavior contract identity, deterministic managed bundles, and catalog SHA-256 values.
- `index.md`: small global capability map for agents.
- `log.md`: recent compatibility changes and deprecations.
- `src/`: executable, project-agnostic TypeScript.
- `managed/`: immutable Runtime-mountable ESM bundles generated from official source.
- `recipes/`: composition guidance and acceptance criteria.
- `catalog/interactions.index.json`: derived machine-readable discovery index.
- `wiki/`: cases, failures, and design rationale.

Downloaded projects receive a versioned read-only snapshot. Project-specific node roles, business rules, cases, and failures remain in the project Wiki.
