# Feeder mounted-handle repair

## Design / implementation plan (before edits)

Scope: existing feeder branch in `src/components/coal/device.ts`; no new module.
Responsibility: project composition glue between installed `bindNumber`'s string callback
contract and public Runtime's `string | EntityHandle` layout API. Dependencies remain
installed base/bindNumber and the current NodeScriptContext. No official library edits.

- Preserve four surface parameters, defaults, scripts/roleBindings, scene and original instance.
- Preserve exact mounted target/reference EntityHandles across helper callbacks. The helper
  calls `assertLayoutWritable(size.target.id)` and `observeLayout(size.reference.id)`;
  its structural handle contract does not promise to preserve handle identity. Current
  project context incorrectly forwards these physical IDs as semantic strings.
- Adapt only each binding's known target/reference ID to its original handle, rejecting
  unexpected references. Keep Runtime ownership preflight, original setters, disposal,
  invalid preservation, and root live contentBox ratio. No x/y/parent width writes.
- Keep console trace; annotate handle transport so external Chrome can distinguish this
  source version. Strengthen both source fixtures to reject physical string layout calls.
- Run TypeScript, actual installed helper + bundled reactivity tests, contract and graph
  checks. No whole-project contract generator, no Artifact serialization.

Public schema belongs to nodeArtifacts.surface; script owns consumption; Server Preview
owns boolean editor projection. No fake Figma binding or type conversion is acceptable.

## Confirmed evidence supplied by external Chrome

Input revision `codex_20261010224554_fb91cccbb523`, test 371:314 / instance 371:315,
feeder-console-v1. Receipt :1 for position1=0 and :2 for 26.5: props/watch/apply/helper
succeed; reference layout is runtime/input/282x101. Preflight passes physical string
0:1125 and throws `Layout context unavailable for 0:1125`; no width-submit or setter-return.
Thus this failure precedes any command or native HUG/MAX layout. The second target was
0:1120. These IDs are evidence only, never source constants.

Installed helper source confirms the conversion to `.id`; public declarations explicitly
accept EntityHandle. This project bridge can retain the public handle without bypassing
assertLayoutWritable; no official helper implementation or framework patch is required.

## Implemented / validation

`observeLayout` now checks the helper's known reference ID and passes the captured root
EntityHandle to ctx.observeLayout. `assertLayoutWritable` checks the known target ID and
passes the original target EntityHandle to ctx.assertLayoutWritable. The helper still
owns range checks, projection, deduplication and disposal; target.setWidth remains behind
Runtime preflight. Unknown IDs fail closed. No helper snapshot modifications.

Console version: `feeder-console-v2-handles`; preflight and layout-subscribe include
`referenceKind: EntityHandle`. Physical IDs remain diagnostic strings only.

Passed: TypeScript 5.7.3; installed-helper + bundled Runtime reactivity tests with strict
handle doubles (0/26.5/53, independent run, invalid, root resize, isolation/remount/dispose);
source suite 20,831 assertions; 151 coal scripts / 165 bindings; read-only source graph
151 source entries, no unresolved imports (14 managed source-less entries listed separately).
Negative control restoring old string preflight forwarding fails the strict regression.
Explicit denied-ownership test proves no width-submit after rejection. These are source
checks, not Runtime command/renderer tests. Contract test's historical
`sceneAndSurfacesUnchanged:false` is not a comparison against this turn; all view files
are separately byte-hash checked against the task input and unchanged.

Receipt: bundle, declarations and ten manifests match runtime-contract.json;
buildReceipt `1efd458171aff5d6a38bc44a0cd41b7ca3ce8dc2dc87e8dd489fca29f1162760`.
Installed catalog version 0.20.0, real base/bind-number.ts executed in tests.
`component-script-capabilities-v1` and projectScriptApi matching are the user's MCP evidence;
local runtime-contract does not contain that named field. Neither establishes browser pass.

Full compiler/verify intentionally not invoked: compileInteractions unconditionally
serializes the complete Artifact. Source compilation/graph promotion remains with server;
existing generated files are unchanged and do NOT yet contain this source repair.

## External Chrome acceptance after server promotion

Enable Verbose, filter `[coal.feeder]`, reload original test instance and confirm v2-handles.
For both gmjPosition properties independently submit 0 / 26.5 / 53. With measured root
content width 282, expected widths are 0 / 141 / 282 (not hardcoded by source).
Capture receipts and JSON: helper-watch → runtime reference → preflight (EntityHandle)
→ preflight-return → width-submit → setter-return → width-readback matched. A setter-return
alone is NOT commit. If preflight still fails with handles, return exact error and layout;
if readback differs, investigate public Runtime size submission/commit before HUG/MAX.
Only after width matches inspect right edge/HUG size/icon native follow. No coordinate patch.
Also verify instance-root resize (same formula with new measured content width), two runtime
instances, invalid preservation, dispose/remount, and run combinations through an authorized
Runtime props mechanism. Do not add permanent scene nodes. No real Preview/trace was run here.

Boolean readonly is still Server Preview getEditableComponentPropertyKind's script-only
boolean projection gap (external main.js diagnosis); preserve true boolean/default false.
Stopped visibility and coalInput removal were externally confirmed on input revision;
this turn does not claim renewed visual acceptance or animation lifecycle verification.

Exact input Artifact metadata.revision: `codex_20261010224554_fb91cccbb523`.
Result revision is null until server promotion receipt. Do not invent a revision.
