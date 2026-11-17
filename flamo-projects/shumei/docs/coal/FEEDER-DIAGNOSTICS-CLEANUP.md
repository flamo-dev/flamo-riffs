# Feeder temporary diagnostics cleanup

Scope: project device adapter only; no new module, public property, Artifact/layout/role/image change, Runtime or library change.

Plan and responsibilities:
1. Add one source-only `FEEDER_DIAGNOSTICS_ENABLED = false` constant in `src/components/coal/device.ts`. Temporary console/trace success detail, reflow snapshots, frame sampling and props polling depend on it. No prop/environment/global Runtime switch.
2. Keep business ACK/probes, expected widths, props watches, EntityHandle bridge, ownership preflight, width-only formula and boolean visibility unchanged. Keep necessary error `ctx.trace` even when diagnostics are disabled. Extra diagnostic-only child traversal is disabled; business role resolution and ACK probes remain.
3. Test unchanged source with diagnostics off, and an in-memory test-loader replacement of that single constant with true. Check scheduling, console output, error traces, business ACK and disposal. Compile bounded affected source dependencies without Artifact serialization; validate bindings and generated graph. No contract generator.

External evidence: caller reports separately authorized framework release fixed MAX/HUG/image constraints and boolean projection, with real-browser 0/141/282 passing on read-only copy. This cleanup does not reproduce or claim that browser evidence. Caller will perform post-cleanup visual acceptance.

## Result and reproduction
- Default source constant is `false`. To temporarily opt in, change **only** that constant to `true` and recompile; restore `false` after collecting evidence. No component/public schema or runtime environment override exists.
- Off: no console diagnostics, 90-second polling interval, reflow snapshot or 16-frame diagnostic chain. Business role lookup, one-frame committed ACK/probe and the original zero-delay READY resend are deliberately retained. Ownership/helper/setter errors still reach `ctx.trace`.
- Tests use `FLAMO_TEST_FEEDER_DIAGNOSTICS=1` **only in the source-test loader** to replace the same constant in memory. Default and enabled regression tests pass; source suites pass 20,827 / 20,831 assertions. Test geometry remains a double, not browser layout evidence.
- TypeScript 5.7.3 typecheck, 151-script / 165-binding contract validation, Runtime receipt/hash verification and generated import graph pass. The contract test's `sceneAndSurfacesUnchanged: false` means its historical `.flamo/tools/coal-contract-baseline.json` is absent, not a detected edit. Independent per-file SHA-256 comparison with this turn's baseline confirms all `view/` bytes unchanged.
- Bounded compilation uses the existing project compiler's import rewriting and TypeScript emission for `device.ts` in 151 existing mounted consumers; dependencies are checked but not emitted. It does not execute surface synthesis, a contract generator or Artifact serialization. Reproducible runner: `.flamo/reports/feeder-cleanup-evidence/bounded-compile.mjs`.
- Generated library files initially re-emitted by a broader dependency compile were restored to **exact original SHA-256 hashes**. Final library inputs and generated vendor outputs, Runtime/Preview files, all `view/` files and generated wrappers are unchanged.
- Input/current Artifact revision: `codex_20261010225753_e9d58dd2efb9`. No server promotion receipt is available here; `resultRevision: null`. This is not a new revision or post-cleanup visual acceptance claim.
