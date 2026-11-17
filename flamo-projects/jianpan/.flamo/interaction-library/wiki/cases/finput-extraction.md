# FInput Extraction Case

The first assets were extracted from the downloaded user project's FInput implementation. The reusable seams were DOM input bridging, caret blinking, and single-line overflow layout. Node lookup, dimensions, rendering, public surface, and product behavior stay in the consuming component.

This case is evidence, not an API contract. Use the recipe and TypeScript signatures for implementation.

Related: [`../../recipes/text-input.md`](../../recipes/text-input.md), [`../decisions/asset-boundaries.md`](../decisions/asset-boundaries.md).
