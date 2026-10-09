# Current cabin source and delivery pipeline

Start from the **saved current blend**, not a sequence of procedural revisions. Historical authoring scripts are retired; later direct-source edits made that chain incomplete. This package supports editing, exporting, validating and handing off the current cabins.

| Cabin | Authoritative file / scene                     | Export entry point                  | Production directory                 |
| ----- | ---------------------------------------------- | ----------------------------------- | ------------------------------------ |
| Niva  | `niva-3d/niva-final.blend` / `Niva_Source`     | `niva-3d/scripts/package-niva.py`   | `apps/nextjs/public/cabin-3d/niva/`  |
| Aster | `aster-3d/aster-source.blend` / `Aster_Source` | `aster-3d/scripts/package-aster.py` | `apps/nextjs/public/cabin-3d/aster/` |
| Veyra | `veyra-3d/veyra-source.blend` / `Veyra_Source` | `veyra-3d/scripts/package-veyra.py` | `apps/nextjs/public/cabin-3d/veyra/` |

Paths in the first two columns are relative to this directory. Each cabin README supplies exact commands. All three entry points use [`cabin-package.py`](./cabin-package.py); include it when handing off a cabin folder. Blender 5.2 is the validated exporter version. Python 3.10+ supports standalone accounting; Node runs Khronos and optional browser-harness builds.

## Supported workflow

1. Open the authoritative blend and inspect its scene/dirty state before editing. Preserve local work, make edits and save. The exporter deliberately opens the disk source in a separate background process and never saves it.
2. Run the cabin's `package-<cabin>.py` with `blender --background --python-exit-code 1 --python ... --`. It exports the current renderable collection selection, applies modifiers and leaves cameras, lights, staging, archives and animations out. No geometry decimation, Draco, meshopt, KTX2 or baked camera lighting is introduced.
3. Run `validate-blender.py` with the master open in **background** Blender, then `validate-gltf.cjs`. The round-trip validator resets only its background process, imports the GLB and compares the current saved source. It must never run in the interactive authoring session.
4. Run `python .../package-<cabin>.py --accounting-only` to refresh delivery metadata and bind reports to hashes. Reports are generated under `validation/`; missing or stale reports are not passing evidence. Geometry/byte accounting is not visual or performance acceptance.
5. Review the production changes and test the actual Interactive Showcase when authorized. Browser acceptance, posters and device/GPU profiling are separate web-workflow responsibilities.

Normal export writes the design GLB, accounts for it, and syncs the GLB plus camera/presets into the listed production directory, creating it when missing. External texture URIs are rewritten from design-local `finishes/textures/` to production-shared `../finishes/textures/`; all texture references remain relative to the manifest. Existing shared textures must be byte-identical or publishing fails: a shared finish change requires reconciling all three contracts deliberately.

### Disposable output / clean-checkout verification

Append `--output-root <absolute-directory>` after Blender's `--` to export a self-contained disposable GLB/camera/presets/finishes package and delivery metadata. This mode never syncs production. Temporary raw GLBs use an automatically created/cleaned system temporary directory. No historical `validation/`, `renders/`, revision backup, or external Niva download directory is required.

Validate a disposable delivery by passing its directory after `--` to the Blender validator, and as the final argument to the glTF validator:

```sh
blender --background design/spikes/niva-3d/niva-final.blend --python-exit-code 1 --python design/spikes/niva-3d/scripts/validate-blender.py -- <absolute-output-directory>
node design/spikes/niva-3d/scripts/validate-gltf.cjs <absolute-gltf-validator-package-directory> <absolute-output-directory>
```

Use the analogous Aster/Veyra paths. The source blend passed to validation must be the source used for that export. `--accounting-only --output-root` instead copies/accounts for the existing design delivery; it does **not** validate or recreate geometry.

### Khronos dependency

The validator is a standalone source-tool dependency, not a production web dependency. Install into an existing local tools directory, outside the source package if desired:

```sh
npm install --prefix <tools-directory> gltf-validator@2.0.0-dev.3.10
node design/spikes/niva-3d/scripts/validate-gltf.cjs <tools-directory>/node_modules/gltf-validator
```

Reports include the GLB SHA-256. Niva additionally checks embedded images/materials/finish checksums; Veyra checks its detailed material/camera contracts. The Blender validators cover source/import geometry and packing. Warnings and topology notices need interpretation rather than being equated with visual failures or waived as proof of perfection.

## Source, contracts and payload policy

- Keep all three authoritative blends, canonical camera/preset contracts, finish maps and texture provenance. Packed source images make Blender editing portable. Aster/Veyra also retain small local source-map sets for material editing.
- Keep the design-side GLBs for independent packaging and validation. Niva additionally uses its committed GLB as the exact optimized-image baseline: seven 1K maps and one 512px fabric map replace the raw export's authoring images by stable name. Geometry/material parameters still come from the saved blend. Missing/ambiguous image names fail; approved texture changes require deliberately replacing the optimized baseline. Do not restore a historical backup tree.
- Camera JSON is an explicit **current contract** and is copied unchanged by packaging, not regenerated from whichever review camera happens to be selected in Blender. Intentional camera changes require updating pose, target, off-axis projection, dimensions and clipping in that JSON together, then updating poster/framing measurements in the web workflow. Authoring lighting JSON is similarly maintained explicitly when light intent changes.
- Runtime totals include GLB + camera + presets, then optionally the four manifest finish maps. They exclude source blends, reports, historical renders, runtime code and HTTP compression. Production JSON formatting/relative URIs may change its byte size; metadata labels the design-contract totals accordingly.
- **Never generate or overwrite Blender posters during packaging.** Current posters are separately captured/processed by the web workflow and mapped in `interactive-showcase-configuration.ts`. A local legacy `renders/<cabin>-configurator-poster.png` may be recorded under `historical_files`; it is optional and excluded from default/all-finish runtime totals.
- Hidden archive collections inside the saved blend preserve editable provenance and remain excluded. Local history, renders, `.blend1` saves and validation outputs are ignored generated/history files, not clone requirements. Untracked local authoring utilities are not supported entry points.

## Modeling and integration conventions

- Use metric modeling units, ground-level footprint origin, Blender +Z up / -Y front; glTF +Y up / +Z front. Matrices in camera JSON are row arrays, not Three.js column-major buffers. Preserve off-axis projection; `lookAt` alone cannot reconstruct the authored camera.
- Preserve full-orbit geometry, static door/drawer intent, descriptive names, glazing and material assignments. The inferred proportions are visualization dimensions, not certified usable floor areas or construction drawings. Cabin-specific constraints live in each `web-handoff.md`.
- `ExteriorCladding` affects wall cladding only. `InteriorJoinery` affects deliberately assigned built-in/furniture timber and wooden internal door leaves/frames. Roof, structure, fixed linings, floor, appliances, glazing, textiles and lights remain fixed; some fixed materials share default image bytes.
- Cache original maps and roughness; swap only target material maps and `baselineRoughness * multiplier`. External color maps use sRGB, `flipY=false`, and the original sampler/UV transform. Normal/ORM data stays non-color. Load one geometry asset for all independent finish combinations.
- GLB does not configure Three.js lights/shadows. The production runtime uses shadow-casting exterior spotlights and opaque mesh casters/receivers, excluding transparent glazing. Keep that contract rather than adding shadowless exterior point lights.

## Optional browser-check tooling

Aster and Veyra retain a standalone R3F asset harness for future finish/orbit/camera inspection. It is independent of production framing, pointer handling and dialog behavior; it cannot certify those features. No browser check is part of export, accounting or the Blender/Khronos validators.

After repo dependencies are installed, provide an installed `esbuild` package directory to `node design/spikes/<cabin>-3d/scripts/build-browser-check.cjs <absolute-esbuild-package-directory>`. It generates `validation/browser-check.js`. Run `python design/spikes/<cabin>-3d/scripts/serve-browser-check.py`; the local ephemeral URL is written to `validation/browser-server.json`. Open it manually only when browser testing is authorized. The server/build create generated directories; no previous reports are inputs. Stop the server after use.

For PR #3 cleanup, fresh exports, source round trips, Khronos validation, production sync and missing/optional-poster accounting were checked in a disposable source-only tree. No browser checks or renders were run. Current shipped binaries remain the reviewed baseline; regenerated exports may differ in serialization/order/custom-property metadata without changing geometry or texture payloads.
