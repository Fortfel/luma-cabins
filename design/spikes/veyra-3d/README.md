# Veyra source package

**Edit `veyra-source.blend`, scene `Veyra_Source`.** This is the authoritative current one-bedroom model. It retains the 108 mm kitchen blind-corner filler, 233 mm static access leaf and original knob position, with the exposed access-hinge meshes removed. Save edits before exporting. The old build/revision chain and its superseded hinge-specific clearance test are retired.

## Current files

| File                                                                                           | Purpose                                                            |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `veyra-source.blend`                                                                           | Editable packed master                                             |
| `veyra-configurator.glb`                                                                       | Current delivery and standalone design validation/handoff baseline |
| `veyra-camera.json`, `veyra-presets.json`                                                      | Canonical camera and independent finish contracts                  |
| `veyra-lighting.json`                                                                          | Authoring lighting intent, excluded from runtime geometry          |
| `textures/`, `finishes/textures/`, `texture-sources.json`                                      | Local editable maps, four optional finishes and CC0 provenance     |
| `veyra-delivery.json`                                                                          | Source/asset hashes, geometry and payload accounting               |
| `scripts/package-veyra.py`                                                                     | Current exporter using `../cabin-package.py`                       |
| `scripts/validate-blender.py`, `scripts/validate-gltf.cjs`                                     | Numerical geometry/round-trip and Khronos/material-contract checks |
| `scripts/browser-check.*`, `scripts/build-browser-check.cjs`, `scripts/serve-browser-check.py` | Optional standalone asset/finish/camera harness                    |
| `web-handoff.md`                                                                               | Current constraints and web integration contract                   |

The local maps and design GLB are retained for an independent editable source handoff and repeatable validation. No Niva/Aster source or historical backup directory is needed. Blender review cameras (`Veyra_InteriorReview`, `Veyra_BedroomReview`, `Veyra_GuitarDetail`) remain useful for manual inspection, but are not exported.

## Export and validate

Run from the repository root, with Blender on PATH (Windows may use its full executable path):

```sh
blender --background --python-exit-code 1 --python design/spikes/veyra-3d/scripts/package-veyra.py --
blender --background design/spikes/veyra-3d/veyra-source.blend --python-exit-code 1 --python design/spikes/veyra-3d/scripts/validate-blender.py
node design/spikes/veyra-3d/scripts/validate-gltf.cjs <absolute-gltf-validator-package-directory>
python design/spikes/veyra-3d/scripts/package-veyra.py --accounting-only
```

The exporter opens the saved master and exports renderable meshes recursively from `Veyra_Architecture`, `Veyra_Glazing`, `Veyra_ExteriorDetails` and `Veyra_ShallowInterior`. It applies modifiers, excludes archives/review staging/lights/cameras and does not save the source or regenerate camera/lighting contracts.

The design GLB and runtime contracts sync to **`apps/nextjs/public/cabin-3d/veyra/`**; production loads `/cabin-3d/veyra/veyra-configurator.glb`. Production presets resolve the shared `../finishes/textures/` assets. The Interactive Showcase already integrates Veyra.

See [the shared pipeline](../cabin-3d-pipeline.md) for validator setup, disposable export, optional browser tooling and camera/finish editing. Validation creates `validation/` without requiring old reports. Round-trip reports bind both source and GLB hashes. Coincident zero-area bevel/revolved/assembly tessellation is reported separately from actionable distinct zero-area geometry; open/assembled surfaces are notices for review, not an assertion of watertight solids.

Posters are web-owned and never generated or overwritten by packaging. Any local old renders/history and `.blend1` files are historical, not current inputs. `Veyra_Archive_PreRevision2` through `Veyra_Archive_PreRevision5` stay inside the editable source, hidden and excluded from export. Current constraints formerly spread across revision documents are consolidated in [web-handoff.md](./web-handoff.md).
