# PR #3 review fixes and source handoff

Point-in-time report: September 27, 2026. Current workflow documentation lives in
[`design/spikes/cabin-3d-pipeline.md`](../../design/spikes/cabin-3d-pipeline.md) and each cabin README/web handoff.

## Review fixes

- Added focusable live-canvas keyboard interaction, an inset focus outline and English/Polish instructions. Arrows use the existing damped rotation/elevation targets; plus/equals/minus use existing OrbitControls dolly methods; Home uses existing reset paths. Input is scoped to canvas focus, and the showcase carousel capture leaves canvas keys alone.
- Poster request identities distinguish repeat visits to the same URL. Source changes, successful loads and retries clear stale delayed feedback. Incoming retries preserve the mounted decoded raster. Obsolete same-URL callbacks cannot satisfy a new request.
- Replaced Niva's historical author/export chain with current-source packaging and optional historical-poster accounting. Production sync targets `apps/nextjs/public/cabin-3d/niva/`, creates destinations and preserves optimized embedded image bytes.
- Preserved speculative/adjacent preloading, `allowedDevOrigins`, desktop/mobile framing and existing pointer/touch subscriptions.

## Removed files

**47 tracked files: 37 historical scripts and 10 revision documents.** Paths below are relative to `design/spikes/<cabin>-3d/`.

### Niva — 20 scripts

All under `scripts/`:

- `adjust-layout-review.py`
- `build-niva.py`
- `compare-web-candidate.py`
- `create-cleanup-manifest.py`
- `finalize-configurator-source.py`
- `finalize-delivery.py`
- `finalize-wc-frame.py`
- `finish-review-sheets.py`
- `fix-ceiling-review.py`
- `fix-surface-review.py`
- `optimize-textures.py`
- `prepare-configurator-assets.py`
- `prepare-textures.py`
- `refine-corner-curtains.py`
- `refine-doors-kitchen.py`
- `refine-roof-hardware.py`
- `review-finishes.py`
- `review-images.py`
- `review-niva.py`
- `validate-web-candidate.py`

### Aster — 11 scripts and 6 documents

- Scripts: `build-aster.py`, `extend-gutters.py`, `fit-fridge.py`, `fix-validation-geometry.py`, `prepare-materials.py`, `render-aster.py`, `resolve-gutter-join.py`, `revise-cabinets.py`, `revise-details.py`, `revise-kitchen-roof.py`, `revise-layout.py`.
- Documents: `revision-2.md`, `revision-3.md`, `revision-4.md`, `revision-6.md`, `revision-7.md`, `revision-8.md`.

### Veyra — 6 scripts and 4 documents

- Scripts: `build-veyra.py`, `cabinet-clearance.py`, `refine-cabinet-access.py`, `refine-kitchen.py`, `revise-furnishing.py`, `revise-layout.py`.
- Documents: `revision-2.md`, `revision-3.md`, `revision-4.md`, `revision-5.md`.

The old Veyra clearance script required hinge meshes intentionally removed from the current source. Its historical passing report is not a current swing certification. The modeling intent is preserved in the current handoff.

## Retained assets and entry points

| Cabin | Editable master      | Export                     | Validation                                                 |
| ----- | -------------------- | -------------------------- | ---------------------------------------------------------- |
| Niva  | `niva-final.blend`   | `scripts/package-niva.py`  | `scripts/validate-blender.py`, `scripts/validate-gltf.cjs` |
| Aster | `aster-source.blend` | `scripts/package-aster.py` | `scripts/validate-blender.py`, `scripts/validate-gltf.cjs` |
| Veyra | `veyra-source.blend` | `scripts/package-veyra.py` | `scripts/validate-blender.py`, `scripts/validate-gltf.cjs` |

All exporters use `design/spikes/cabin-package.py`. Camera/preset contracts, alternative finishes, texture provenance, Aster/Veyra local source maps and authoring-light contracts remain. All three design GLBs are retained as independent delivery/validation baselines; Niva additionally depends on its current GLB for exact optimized image payloads. Source blends and shipped GLB binaries were not rewritten.

Aster/Veyra standalone browser harnesses remain optional future asset tooling. Hidden archive collections inside the blends preserve editable provenance and remain excluded from export. Local historical images can be accounted for separately when present, but no historical file or directory is required.

No old `public/images/huts/` assets remain to remove. Current application references use replacement paths.

## Documentation

Rewrote the three READMEs and web handoffs around current saved-source workflows, consolidating current geometry/material constraints and removing reconstruction instructions. Updated the shared pipeline, all delivery metadata, Niva texture-provenance note and the Interactive Showcase 3D feature document. Removed the stale Niva poster field from both design and production preset manifests. Added a source-package ignore file for generated validation/renders, local history and prior-save backups.

## Validation results

- `pnpm format`, `pnpm lint`, `pnpm typecheck`: passed. Additional targeted `oxfmt` checks cover edited source-package Markdown/JSON/CJS outside workspace scripts.
- `pnpm turbo run build --filter=nextjs`: passed. Existing untracked local prototype routes are present in this worktree's build and were not modified.
- IDE diagnostics: no errors in changed runtime/poster/section code. Existing style/duplication suggestions are unrelated.
- Eleven non-browser regression checks passed using the actual poster component under React Strict Mode, mocked image hosts/time, the actual keyboard handler and real OrbitControls. Covered A → B; A → B → C; A → B → C → B with obsolete same-URL callbacks; completed slow B followed by C → B; the 450 ms delay; error → retry with retained raster; initial image retry; returning to the displayed image; arrow targets/elevation clamping; all three catalog distance limits; Home dispatch; focus/modifier/unhandled-key guards; and carousel capture isolation.
- Fresh source-only disposable package: all three exporters passed without historical trees, renders, prior reports or unpacked source-texture folders. Generated production targets started absent. Production GLBs matched generated design GLBs, camera contracts were preserved and all shared finish URIs resolved.
- Niva retained all eight embedded image payloads exactly. Source hashes remained unchanged for all three cabins. `--output-root` did not change production.
- Missing-poster accounting passed. Adding a 22-byte dummy legacy poster changed only historical-file accounting; default totals, optional count and geometry stayed stable.
- Blender source/GLB round trips and Khronos checks passed for all three fresh exports: **zero glTF errors**. Niva: 478 meshes / 96,920 triangles; Aster: 574 / 88,386; Veyra: 582 / 203,034.
- Static final audit passed: current links/commands resolve, Python AST/CJS syntax checks pass, delivery hashes/counts/totals match actual files, and production URLs agree with the catalog.

Non-blocking existing asset notices: generated-tangent warnings (Niva 88, Aster 107, Veyra 159); Niva's 24 zero-area microwave-window triangles; Aster's 12 expected open leaf/grid surfaces; Veyra's 1,055 coincident/redundant zero-area triangles with zero distinct zero-area failures. No geometry repair was performed as part of this cleanup.

Local evidence is under `C:/Users/fortf/AppData/Local/Temp/opencode/cabin-package-validation-run-20260927/` (`summary.json`, per-cabin reports and `logs/commands.jsonl`). The disposable non-browser React/keyboard harness is `C:/Users/fortf/AppData/Local/Temp/opencode/showcase-regression/check.cjs`; its dependencies were installed outside the repo. This did not add a repo test framework.

## Remaining limitations

**No browser checks, visual tests or renders were run**, per the user's instruction. Desktop/dialog loading, visible focus, real input/touch/pinch, cabin/finish switching, poster visual transitions and speculative network behavior still need user browser acceptance. Numerical/state tests do not prove those visual/runtime outcomes.

The GitHub CLI was unavailable, so implementation follows the supplied review findings; the remote review thread was not independently retrieved or resolved.

Pre-existing untracked local authoring/prototype work was preserved. In particular, `design/spikes/render-production-posters.py` still has old production paths, and the untracked Niva prototype route refers to an absent legacy poster. These are outside the tracked PR and the supported current source pipeline; they should not be added to this handoff accidentally. Existing ignored history snapshots retain historical paths intentionally.
