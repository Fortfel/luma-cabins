# Aster revision 6 — kitchen/roof corrections and authorized validation

## Delivery

Current editable source: `aster-source.blend`, scene `Aster_Source`, revision 6 with
`validation_geometry_fix` enabled. Current runtime: `aster-configurator.glb`.

- SHA-256: `b3ba2f7e98d1188f4c21520dd9722c3f18731ae563c7ffca6da09c5e0529e1c5`
- GLB: **7,742,856 bytes**, 73,866 triangles, 568 meshes/nodes, 25 materials.
- Seven embedded 1K maps and four external 1K alternative finishes.
- No Blender poster/render generation. Browser diagnostics are test captures only.
- Final user visual approval, public integration and physical mobile/GPU profiling
  are not implied by the completed checks below.

## Requested corrections

1. Kitchen wall cupboards now form a continuous L-shaped corner, with a rear arm
   beside the window and paired front panels along the return. Tops stay at 2.94 m.
2. Fridge and over-fridge unit move 80 mm toward the partition end. Exactly one
   25 mm wooden cheek per side remains. Right cheek outside face is Y=-0.15 m,
   matching the wall end; backs meet X=1.34 m. Old double-wall/base infills are gone.
   Return drawers widen to 0.90 m, and the continuous worktop reaches the surround
   at Y=0.59 m. All exposed joinery surfaces retain their material/UV assignment.
3. A folded 8.98 m ridge cap covers both roof slopes and extends beyond the outer
   barge edges. The previous short rectangular cap is removed.
4. Eave fascia extends to 8.94 m, with closed corner returns over the junctions.
5. Chimney flashing has a circular pipe opening and follows the roof pitch. The
   collar lower ring follows the sloping flashing rather than intersecting it with
   a horizontal cone foot. Its annular rims are flat-shaded and conical sides smooth.
6. Two equal sink fronts span the full space left of the oven; the old filler plank
   is removed. Carcass, sink recess and oven bay are resized consistently.

## Defects found and resolved during validation

- Whole-board opening booleans replace touching sub-prisms in cladding. Welded
  seam inspection no longer reports coincident internal/nonmanifold edges.
- Bevel radii are reduced only on the thin details identified by zero-area triangle
  checks (soil/coffee/hob surfaces and two laptop details). Other reviewed furniture
  and upholstery bevels are preserved.
- Faucet endpoints are capped. The visible model is a closed solid, not a fluid model.
- Final triangulation and dimensional reprojection resolve problematic UV-edge
  construction on seven identified objects, retaining their evaluated shapes.
- An explicit-tangent export experiment produced zero-vector tangents in Blender
  5.2. It was not shipped. The delivered GLB uses the same implicit/loader-generated
  tangent convention as the proven pipeline.

The source and GLB before cleanup are retained under `validation/before-geometry-cleanup/`.
The preceding saved and dirty live states are preserved under
`history/before-kitchen-roof-20260911-232643/`.

## Completed checks

All reports below refer to the current GLB SHA-256 above.

| Check | Result | Evidence |
| --- | --- | --- |
| Khronos glTF Validator 2.0.0-dev.3.10 | 0 errors | `validation/khronos-validator.json` |
| Source → GLB → Blender round-trip | 568 object names, triangle counts, bounds and material assignments retained | `validation/blender-roundtrip.json` |
| Geometry integrity | No nonfinite coordinates, zero-area triangles, inverted closed solids or unexpected nonmanifold meshes | Same report |
| Intentional surfaces | Leaf meshes and solar conductor grids remain documented open surfaces | Same report |
| Images/material boundaries | Embedded 1K maps packed; sRGB base maps, non-color data maps; four exterior targets; optional map checksums match | Same report |
| R3F / Three.js r186 browser loading | Current GLB loaded and rendered in WebKit WebGL | `validation/browser-report.json` |
| Finishes | All 9 exterior/interior combinations pass and produce 9 distinct rendered pixel hashes | Same report |
| Independent switching | 23 fixed materials and 568 geometry objects unchanged; normal/ORM maps retained | Same report |
| Restore/races/roughness | Embedded maps restored, latest selection wins, roughness computed from baseline | Same report |
| Orbit | 120 frames over 360 degrees without WebGL errors | Same report |
| Independent evidence audit | No blocking findings; current report hashes/topology/authoring bounds agree | `validation/evidence-audit.json` |

**Retained validator notices:** 107 `MESH_PRIMITIVE_GENERATED_TANGENT_SPACE`
warnings and 461 `UNUSED_OBJECT` UV informational notices. No corrupt explicit
tangent data is included. Browser console observations included a dependency-level
`THREE.Clock` deprecation and, in an earlier session, nonfatal driver shader precision
warnings. No WebGL errors occurred during the measured orbit.

## Visual and performance scope

The primary agent inspected representative browser views of the kitchen, overall
exterior, chimney, ridge and eave junctions. The current configuration is visually
coherent at the inspected angles; this does not replace the user's final review.
Canonical canvas diagnostics at 1408 px and 343 px retain the full model. They
correspond to desktop and narrow browser layouts, not physical device tests. A
tablet resize was exercised but no completed tablet capture is claimed.

The harness uses a procedural RoomEnvironment, neutral lights and AgX rather than
claiming parity with a finished production lighting rig. It preserves the authored
camera frustum with a contain policy at changed canvas aspects; no loading poster
is authored here. Browser capture-tool failure was handled by capturing the same
browser canvas through the local harness, not by opening another browser stack.

Observed desktop orbit: **568 draw calls**, about **2.5 ms median CPU render
submission**, 13 renderer textures after all alternative maps were used. GPU cost,
frame rate, cold network loading, and physical mobile performance were not measured.
Reported ready times from repeated local runs are warm-session observations only.

## Reproduction

Build/revision chain: `build-aster.py` → `revise-layout.py` → `revise-details.py` →
`revise-cabinets.py` → `fit-fridge.py` → `revise-kitchen-roof.py` →
`fix-validation-geometry.py` (`apply_fixes()`), then `package-aster.py`.

The Blender MCP background helper lacked a configured executable path, so the
background round-trip was run directly using the installed executable:

```powershell
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background "design/spikes/aster-3d/aster-source.blend" --python-exit-code 1 --python "design/spikes/aster-3d/scripts/validate-blender.py"
```

The official npm validator and esbuild were installed only in the approved temporary
directory, without changing repository dependencies. From the workspace root:

```powershell
node "design/spikes/aster-3d/scripts/validate-gltf.cjs" "C:\Users\fortf\AppData\Local\Temp\opencode\aster-validation\node_modules\gltf-validator"
node "design/spikes/aster-3d/scripts/build-browser-check.cjs" "C:\Users\fortf\AppData\Local\Temp\opencode\aster-validation\node_modules\esbuild"
python "design/spikes/aster-3d/scripts/serve-browser-check.py"
```

The server binds loopback on a free port and records its URL in
`validation/browser-server.json`. Open that URL and use **Run all checks** for a
new export. It uses the installed project React/R3F/Three versions and does not
modify the website or Niva. The current suites should not be repeated unless a
new change, failure, or evidence gap justifies it.

`aster-delivery.json` now records source SHA-256, scene revision and reproduction
script hashes at delivery. This supplements the original reports; it does not
pretend that source hashes were recorded during earlier test execution.

The validation subagent's stale-metadata findings were addressed by regenerating
delivery metadata and refreshing README/handoff here. Its evidence-boundary findings
remain documented above. No additional validation reruns were needed for that audit.
