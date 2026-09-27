# Aster source package

**Edit `aster-source.blend`, scene `Aster_Source`.** This is the authoritative current model, including the fitted kitchen, studio layout, roof/drainage joins and open half-round gutters. Save edits before exporting. The initial build and successive migration scripts are retired; they did not reproduce the final direct-source gutter edits.

## Current files

| File                                                                                           | Purpose                                                             |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `aster-source.blend`                                                                           | Editable packed master                                              |
| `aster-configurator.glb`                                                                       | Current delivery and independent design validation/handoff baseline |
| `aster-camera.json`, `aster-presets.json`                                                      | Canonical camera and independent finish contracts                   |
| `aster-lighting.json`                                                                          | Authoring lighting intent; scene lights are excluded from GLB       |
| `textures/`, `finishes/textures/`, `texture-sources.json`                                      | Editable local maps, four alternative finishes and CC0 provenance   |
| `aster-delivery.json`                                                                          | Source/asset hashes, geometry and payload accounting                |
| `scripts/package-aster.py`                                                                     | Current exporter using `../cabin-package.py`                        |
| `scripts/validate-blender.py`, `scripts/validate-gltf.cjs`                                     | Current geometry/round-trip and Khronos checks                      |
| `scripts/browser-check.*`, `scripts/build-browser-check.cjs`, `scripts/serve-browser-check.py` | Optional standalone asset/finish/camera harness                     |
| `web-handoff.md`                                                                               | Current modeling and integration constraints                        |

Local maps and the design GLB intentionally remain useful independent handoff inputs even though packed images and the production delivery duplicate them. No other cabin's source, old public imagery, revision document or history directory is required.

## Export and validate

Run from the repository root, with Blender on PATH (Windows may use its full executable path):

```sh
blender --background --python-exit-code 1 --python design/spikes/aster-3d/scripts/package-aster.py --
blender --background design/spikes/aster-3d/aster-source.blend --python-exit-code 1 --python design/spikes/aster-3d/scripts/validate-blender.py
node design/spikes/aster-3d/scripts/validate-gltf.cjs <absolute-gltf-validator-package-directory>
python design/spikes/aster-3d/scripts/package-aster.py --accounting-only
```

The exporter opens the saved master, selects renderable meshes recursively in `Aster_Architecture`, `Aster_Glazing`, `Aster_ExteriorDetails` and `Aster_ShallowInterior`, applies modifiers, and excludes review staging, lights, cameras and archives. It does not save the source or regenerate camera/lighting contracts. The default scene retained in the blend is not exported.

The design GLB and runtime contracts sync to **`apps/nextjs/public/cabin-3d/aster/`**; shared finish textures live at `apps/nextjs/public/cabin-3d/finishes/textures/`. Production URL: `/cabin-3d/aster/aster-configurator.glb`. Existing production integration is the Interactive Showcase, not a required standalone Aster route.

See [the shared pipeline](../cabin-3d-pipeline.md) for dependency installation, `--output-root` disposable export, optional browser harness usage and current camera/finish editing rules. Validators generate `validation/`; they do not need previous reports. Round-trip reports bind both the source and GLB hashes. Use Blender 5.2 for the validated workflow.

Posters are separate web-owned assets, excluded from current payload totals. Local old renders, backups and `.blend1` files are historical, not required source-package inputs. Hidden source archives remain excluded from export. Current architectural/material constraints formerly scattered across revision documents are consolidated in [web-handoff.md](./web-handoff.md).
