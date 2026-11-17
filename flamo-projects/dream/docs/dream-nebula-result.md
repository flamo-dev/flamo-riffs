# Dream nebula implementation and isolated Preview results

## Provenance / status
Tested snapshot metadata revision: `codex_20261001015808_4c50f40cd7b7`.
Final Artifact SHA256: `77de82bd510b657247bd15a3961ad0b1625c34abbdd87c01c44dbc2d1c9c027d`.
Official Runtime SHA256: `b4bc334f98b419da51fa5694d39b01e4fe61f06592d61d65fdc8782a02d1234a`.
These tests cover the new local source/generated output, not the previously published content merely sharing that metadata revision. Promotion assigns a new revision after this task. Published `isCurrentRevision` and matching online six-gate completion receipt are NOT available here. No completion receipt was fabricated or copied from earlier runs.

## Implementation
- Public `createShaderLayer` mounts original paired WGSL/GLSL procedural filaments, gold/coral ridges, cyan/purple haze and dust absorption. Independent screen coordinates/time; no camera uniforms, reference texture or watermark. Root fill is cleared only after ready; error is traced and logged. `nebula.ready/error/frame` use public tracing, frame diagnostics throttled.
- Pause freezes native dream objects while nebula continues breathing. Persistent and runtime instructions explain this. Low-cadence clock delta is bounded to 0.1s, so animation slows under load rather than making large jumps.
- Native random forms retain seeded upstream chunk transport and strictly positive horizontal center velocity. Fish, orbit centers and jelly drift right as well. Rotation can move individual vertices left; center drift stays positive. No periodic world wrap.
- Four weighted, bounded-width contours and three point-glow samples provide depth-dependent softening; far cores weaken while spread reaches ~20px, near cores remain bright and sharp. Focus varies continuously with zoom. This is an approximation to scattering, not a full Gaussian postprocess.
- Two reused batches: 22,000 dot / 18,000 line capacity, 1,600,000 bytes CPU buffers. HUD, official brand and centered native buttons remain native/existing surfaces.

## Source / build evidence
TypeScript check, unmodified official compile/verify (structure, generated script graph, binding and tool hashes), and `tests/dream-rightward.mjs` pass. Algorithm stress: 317 peak partitions, 70,194 created / 69,899 released, 15 expanded upstream-query comparisons, buffer reuse and replay differences verified. Painter stress peak 11,379 dots / 12,326 lines. These are CPU/source checks, not FPS measurements.

## Actual browser evidence
`tests/dream-nebula-preview.mjs` full-project WebGL2 run: errors [], original public `verifyInteractionTrace` passed with 32 real evidence events (mounted/frame/touch/meteor/collision/pause/replay). Seed changed 1642660166 -> 3876801957. Real drag changed camera; ±70000 and .2/1/3 zoom captured. HUD position drift about .00390625px with 13px label font retained. Actual pause/resume text changed to 继续漂游 / 暂停片刻; native CENTER/CENTER retained. Official brand click opened https://flamo.dev/ with opener=null. 390px-wide screenshot shows stacked buttons and separate footer.

Observed full-project browser peaks across samples/traces: 6,905 dots, 9,613 lines, 164 partitions, 71 groups, 2 batches. `nebulae` telemetry counts broad native glow groups, not separate shader cloud objects.

`tests/dream-nebula-controls.mjs`: native wheel changes camera y -60 -> -260 while page scroll remains (0,0), visualViewport.scale=1. Pause dream time stays 1.7 over 5.5s with updated=false; screenshots differ as background independently evolves. Resume time advances and label changes. This does not claim ctrl-wheel/Safari acceptance.

`tests/dream-nebula-backends.mjs` isolated shader pixel test (test-only network artifact/script substitution, official on-disk runtime unchanged): GLSL ready. At time12, base / +70000 .2zoom / -70000 3zoom PNGs are byte-identical, SHA256 `b00a3198ac0123ad412ab787aae78442477049b4efebc236925a081e92c80637`. At time90 image changes, SHA256 `32f6578b964345de912d89186bcc574d251dede135858b19f7808119e6275022`. This is camera invariance, not approved-image parity.

## Unresolved verification boundaries
- **WebGPU not verified:** custom WGSL and a constant-color shader both fail with `Instance dropped error in getCompilationInfo` in this container. Minimal function: `fn flamoFragment(uv:vec2<f32>)->vec4<f32>{return vec4<f32>(0.2,0.3,0.4,1.0);}`. Reproduce with `PLAYWRIGHT_BROWSERS_PATH=$PWD/.flamo/tools/browsers CONSTANT=1 node tests/dream-nebula-backends.mjs`. Native text is removed in this isolated probe; same failure persists. This establishes a device/Runtime/environment failure even for constant shader, not a proven custom WGSL syntax error. No framework/private API workaround. Failed WebGPU screenshots are not valid rendering evidence.
- **Performance not accepted:** visible headless Chromium145, ANGLE Vulkan SwiftShader software device. Warm sampling without per-frame screenshots: 23 RAF/update intervals over 10,899.5ms, ~2.11 callbacks/s, median483.3ms / P95 500ms. These are callback cadence, NOT GPU presentation FPS. Hardware desktop measurement remains required; CPU build timings do not establish the GPU bottleneck.
- CJK glyphs appear as squares in this container despite font availability metadata; real Chinese glyph visual centering must be checked on desktop.
- Detailed warm/cool background and sharper near/softer far outlines are visible in actual screenshots. It remains an original, relatively restrained interpretation, not proven flOw/reference-image equivalence. No controlled same-seed before/after brightness measurement. Approved reference PNG parity remains unavailable.
- No matching post-promotion online six-gate completion receipt. Local public trace pass does not imply all six gates verified.

## Evidence locations / rerun
Raw test artifacts intentionally outside transaction: `/tmp/dream-nebula-webgl/`, `/tmp/dream-nebula-controls/`, `/tmp/dream-nebula-isolated/`, `/tmp/dream-nebula-constant/`, `/tmp/dream-nebula-evidence.json`, `/tmp/dream-nebula-verify.log`, `/tmp/dream-rightward.json`. These are task-container evidence, not durable deployed URLs. Existing `.flamo/reports` receipts were not replaced by this work.
Full-project test used bounded local `http://127.0.0.1:5177/preview`; server stopped after tests. Online route to recheck after promotion: `/projects/u_5ce5548fa8_dream_a0o30u/preview` (no live online acceptance claimed).
