# Silver dream — implementation and bounded verification

## Identity
Input revision: `codex_20261001045213_b7080901c286`.
Tested Artifact SHA256: `b91c25ea9655ea2190dc515e2cfbe3ab3d844b9d520c47b714ea035715dcb02d`.
The isolated source is changed and officially compiled. Promotion revision and `isCurrentRevision` must come from the orchestrator; neither is asserted here. No previous completion receipt was reused; no derived completion/report directories were written.

## Implementation
- Foreground fish, grid, fins, tail, random forms and stars use silver temperature channels in .90–1, not saturated rainbow. Stable phases use continuous .39/.71 rad/s oscillators; no per-frame random sampling. Depth softening and rightward transport remain.
- World exposes up to 512 visible analytic star targets, sampled at the same times as meteor segments. Collision uses simultaneous relative swept contact and .035 depth tolerance; camera discontinuities cannot fabricate a swept contact. No engine-private state read.
- All spawn paths enforce 3 meteors; free-flight creation reserves a slot for occasional real rendezvous. First rendezvous starts at scene time18, aims for an actual star at +2.6 seconds, and only contact triggers the burst. Later targets are spaced14–24 seconds. Ordinary spawn interval3–7 seconds; lifetime7–12 seconds; speed30–170 screen pixels/scene-second.
- One size and common perspective p=.42+.58*depth control screen dimensions: tail=(30+100size)p; head=(.7+1.9size)p; width=(.45+1.35size)p; halo=(3+7size)p. Speed is independent, dimensions are not independently randomized.
- Max6 bursts,6-second lifetime. White-purple core, six organic petal contours, three broken arcs and26 dust points. Fixed palette per burst;80% violet/blue-violet/rose and20% cyan/coral choices. Core0–.3s, petals .15–2s, arcs .3–3s, dust .5–6s.
- Replay and its existing full original-camera/seed/clocks/transient reset retained; no Pause/manual Meteor nodes introduced. Below520px height, HUD typography scales .72 and positions compact without deleting words. Normal desktop strings unchanged.

## Source and model checks
Passed TypeScript5.7.3 noEmit, official compile/verify including ABI/script graph, source/managed hash checks. Playwright1.58.2 and its Chromium used from project-local tools. Component packaging helper only prepares README without Studio linkage; not claimed as a complete packaged build.
- `tests/dream-replay-model.mjs`:120 views,60,000 steps; peak3 meteors/2 bursts,121 contacts,360 deterministic resets.
- `tests/dream-silver-model.mjs`:30,000 palette/time samples; monotonic common-size/depth dimensions; swept positive/negative cases including wrong-depth and asynchronous path crossings;120 views,7,274 targets matching actually rendered dots;12 seeds,17 actual model contacts across all five fixed palette IDs.
- `tests/dream-rightward.mjs`:positive center drift, deterministic partitions, upstream coverage, reused buffers; partition peak317; painter peaks10,346 dots/11,916 lines. These are model tests, not browser FPS.

## Real isolated GLSL Preview
Command: `PLAYWRIGHT_BROWSERS_PATH=$PWD/.flamo/tools/browsers BACKEND=webgl NODE_OPTIONS="--experimental-loader=$PWD/tests/tool-resolver.mjs" node tests/dream-silver-preview.mjs`.
Bounded official local Preview server stopped on test exit. Raw JSON/screenshots/server log: `/tmp/dream-silver-preview/`. First interrupted run was not counted; subsequent full run exited0.
- `nebula.ready`, no page errors. Actual native pointer touch, drag, wheel, meteor/star collision and Replay events. Unmodified public `verifyInteractionTrace` passed with92 evidence records and the full causal action sequence. This is not a promoted six-gate completion receipt.
- Three actual Replay cycles after repeated gestures and camera extremes ±70000 at .2/3 zoom restore initial camera x=-16,y=-60,zoom=.28,rotation0 (public Float32 readback .28000000119). Reset events show both clocks, meteors, bursts, touches, collision count and dragging cleared.
- Captured real star collision at20.7 scene seconds, star target `2/-2/1/-1/0/6`, depth1, palette4 coral. World contact(194.892,687.267), approximately screen(70.6,252.4) in480x400. Core/petals/dust screenshots correspond to measured ages .2/1.3/2.9 seconds, not nominal filenames alone. Other seeds have different targets/positions and palettes. Desktop reproduction: Replay, leave camera still about20–30 scene seconds, watch for a meteor approaching a visible star. Software dt clamping makes wall time substantially longer.
- Inspected initial, collision,390x400,390x600 and960x640 images: silver continuous fish against multicolor nebula; broad far-layer soft contours; HUD words/Replay/brand do not overlap each other. Chinese glyphs are missing in this fixed Linux environment, so actual Chinese typography requires desktop confirmation.
- Native wheel leaves page scroll0/0 and visualViewport.scale1. Brand safety attributes retained/read, not freshly popup-clicked in this test.
- Visible Chromium145.0.7632.6 headless ANGLE Vulkan SwiftShader software renderer: bounded6-second cadence sample12 intervals, median516.6ms,P95 566.6ms. This measures RAF/update cadence, not GPU-presented FPS and is NOT a performance pass.

## Remaining acceptance boundaries
Desktop WGSL and Chinese font/centering review remain; known Linux software WGSL constant-shader failure was not repeatedly retried. Full current-revision six official gates require post-promotion desktop receipt. No approved reference PNG => reference pixel gate unavailable. No controlled quantitative before/after image reference pass is asserted. Runtime snapshot/framework/managed tools/hashes unchanged.
Post-promotion Preview route: `/projects/u_5ce5548fa8_dream_a0o30u/preview`.
