# Dream shader / depth continuation
Base revision: codex_20261001015808_4c50f40cd7b7. Expected Runtime SHA256: b4bc334f98b419da51fa5694d39b01e4fe61f06592d61d65fdc8782a02d1234a (confirmed).

Project art layer only: existing `src/nodes/star-sea/nebula.ts` owns noise-warped warm filaments, cyan/magenta mist and dust absorption; depends only on documented fragment uniforms. Existing `script.ts` composes public createShaderLayer, ready/error/frame trace and an independent bounded-delta clock. No library recipe provides this project-specific art. Existing world/painter own seeded rightward source-cell transport and bounded multi-width Gaussian-like contour reconstruction. Near cores remain sharp, far cores are suppressed and broadened; adjacent LODs crossfade. No private renderer APIs, managed edits, reference image textures or camera shader parameters.

Only clear native root fills after shader ready. Preserve design still and restore on disposal. Pause freezes native dream objects, not background breathing; update explanatory text. Diagnostic evidence goes outside transaction output; promotion revision and official receipt remain server-owned, never invented locally.
