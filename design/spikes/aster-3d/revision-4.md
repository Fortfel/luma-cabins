# Aster — cabinet revision 4

Authored and exported for user inspection. No renders, posters, validation tests,
GLB round trip or browser checks ran. Prior saved and dirty live Blender states,
scripts and handoff are preserved in `history/before-cabinet-revision-20260911-020048/`.

## User-directed changes

- **Toilet door:** the prior leaf top was Z=2.42 m while the frame head underside
  was Z=2.46 m, leaving a 40 mm gap. Leaf now spans Z=0.430…2.457 m and is
  0.821 m wide inside the 0.827 m clear frame opening. Side/head reveals are 3 mm;
  floor clearance is 10 mm. Narrow bevel and wooden rear stops complete the fit.
- **Cabinet top alignment:** the actual front wardrobe top, Z=2.94 m, is the shared
  reference. Existing kitchen wall cupboards/wood underside move upward 30 mm.
  A new cupboard above the fridge spans Z=2.485…2.94 m, retaining 25 mm clearance
  over the fridge body. It matches the fridge width/depth and faces into the room.
- **Paired doors:** the wall cupboards and new over-fridge cupboard have opposing
  outer hinge sides and small wooden knobs near the lower center meeting seam,
  replacing the high horizontal pulls. Geometry stays closed/static; no interactive
  opening or animation is added.
- **Shelves:** bed and TV shelves both have top Z=2.28 m, 45 mm thickness, 300 mm
  depth, and connected metal wall brackets. Bed shelf has books and a ceramic vase;
  TV shelf has books and a plant. Both use configurable `InteriorJoinery` timber.

## Reproduction

Run the initial build, `revise-layout.py`, `revise-details.py`, then
`revise-cabinets.py` → `apply_revision()`. The last step requires revision 3 and
refuses to apply twice. Use `package-aster.py` for GLB/camera/lighting/byte metadata.
Do not run the historical Blender rendering script.

Current file accounting: 73,550 triangles, 561 meshes/nodes, 25 materials;
GLB 7,468,872 bytes. These counts do not establish geometry or performance validation.
