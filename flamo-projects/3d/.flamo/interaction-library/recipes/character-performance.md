# Character performance and contained stages

Use `CharacterPerformance` and `gentleCharacterClips` from `@flamo/interaction-library/base`. Supply milliseconds from the project's clock, map normalized channels onto your own bone bindings and use `reset()` on replay/seek. Add breathing and blinking from the same clock. Low priority actions cannot interrupt higher priority actions; a permitted interrupt starts at the sampled pose and blends for 180ms. This is additive procedural acting, without inferred anatomy or lip sync.

`containStage` keeps all stage corners visible. `stagePoint` maps pointer coordinates through that exact camera, and `parallaxOffset` applies bounded authored depth offsets. The host must use the same display bounds for controls and canvas. Verify a narrow portrait, square embedded host, short window, landscape, and resize after playback. Depth is authored 2.5D, not an estimate of baked video depth.

Sources: [policy](../src/base/character-performance.ts), [camera](../src/base/stage-camera.ts), [acceptance tests](../tests/animation-policy.test.ts), [module boundary](../wiki/decisions/asset-boundaries.md).
