# Niva source package

**Edit `niva-final.blend`, scene `Niva_Source`.** This is the authoritative current model, including the deck/window reveals, open half-round gutters, fitted doors, L-kitchen and pleated WC curtains. Save edits before exporting. The old procedural build/revision chain is retired; it did not reproduce later direct-source edits.

## Current files

| File                                                       | Purpose                                                                                      |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `niva-final.blend`                                         | Editable master with packed authoring images                                                 |
| `niva-configurator.glb`                                    | Current delivery, validation input and optimized embedded-image baseline                     |
| `niva-camera.json`                                         | Authoritative canonical pose and off-axis projection                                         |
| `niva-presets.json`                                        | Independent exterior/interior material and finish mapping                                    |
| `finishes/textures/`                                       | Four optional 1K finish JPEGs                                                                |
| `texture-sources.json`                                     | Original CC0 downloads, authors and derivations; original download paths are provenance only |
| `niva-configurator-delivery.json`                          | Source/asset hashes, geometry counts and payload accounting                                  |
| `scripts/package-niva.py`                                  | Current export/package entry point, using `../cabin-package.py`                              |
| `scripts/validate-blender.py`, `scripts/validate-gltf.cjs` | Current non-browser validation                                                               |
| `web-handoff.md`                                           | Modeling constraints, material boundaries and integration contract                           |

The design GLB is intentionally retained even though production has a duplicate. The exporter reads its eight optimized embedded images **before** replacing the GLB. This avoids historical backups and preserves the seven 1K maps plus 512px fabric payload byte-for-byte while keeping packed authoring images at their original resolution. Geometry and material parameters come from the current saved blend. Texture edits require a deliberately updated, reviewed optimized baseline; they are not silently substituted or recompressed. Unknown image names fail with an actionable error.

## Export and validate

From the repository root, with Blender on PATH (on Windows substitute `& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'`):

```sh
blender --background --python-exit-code 1 --python design/spikes/niva-3d/scripts/package-niva.py --
blender --background design/spikes/niva-3d/niva-final.blend --python-exit-code 1 --python design/spikes/niva-3d/scripts/validate-blender.py
node design/spikes/niva-3d/scripts/validate-gltf.cjs <absolute-gltf-validator-package-directory>
python design/spikes/niva-3d/scripts/package-niva.py --accounting-only
```

The exporter opens the saved master in a background process, exports renderable mesh/empty objects outside archived/hidden-render collections, applies modifiers, and excludes cameras, lights, animations and authoring custom properties. It never saves or modifies the master. Temporary full-resolution export files are created and removed automatically.

It writes the design GLB and syncs the runtime delivery to **`apps/nextjs/public/cabin-3d/niva/`**, creating that directory if needed. Production uses `/cabin-3d/niva/niva-configurator.glb`. Camera/preset contracts are preserved; production finish URIs are relocated to the shared `../finishes/textures/` directory. See [the shared pipeline](../cabin-3d-pipeline.md) for validator installation, disposable output, shared-finish safeguards and camera edits.

**Posters belong to the web workflow.** No command here renders, copies or overwrites a poster. A local `renders/niva-configurator-poster.png` is optional historical accounting only; neither it nor `renders/`, `validation/` or a revision backup is an export input. Default totals are GLB + camera + presets; optional totals add exactly the four manifest finish textures. Historical poster bytes are reported separately.

Validation creates `validation/` reports. The Blender check compares evaluated source/import meshes, materials, numerical geometry, bounds and optimized image packing; it reports zero-area tessellation for inspection, not manifold certification. Hash-matched reports are accounted for, never assumed from a previous revision. Browser acceptance belongs to the user.

## Retained authoring provenance

`Archive_DoorsKitchen_PreRevision` remains hidden inside the authoritative blend and excluded from export. It preserves editable source context without requiring an external reconstruction chain. Existing local `.blend1`, history, renders and reports are not additional masters or checkout requirements. See [web-handoff.md](./web-handoff.md) for current constraints.
