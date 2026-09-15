# Aster configurator asset

## Current source — September 15, 2026

`aster-source.blend / Aster_Source` now has Veyra-style open half-round gutters with closed end caps. Both gutters sit 45 mm below the initial half-round conversion, and hollow swept outlet bends replace the clipping downpipe joints. These changes were authored directly in the saved source; the revision scripts below do not reproduce them.

The September 15 GLB and delivery metadata have now been regenerated from this source: **8,088,464 bytes, 88,386 triangles and 574 meshes/nodes**. Camera/finish contracts are included in the design package. No Aster app route is configured. Posters remain deferred to the user's web workflow. No tests were run for this export; the earlier joint authoring was inspected in Blender's viewport. See [web-handoff.md](./web-handoff.md#gutter-delivery--september-15-2026).

## Review status

The September 15 export includes the half-round gutter follow-up after revision 8's
gutter/trim separation. **No tests or renders were run for this export, as requested.** Revision 6 passed the authorized asset checks, but
those reports apply to its earlier GLB hash, not the current export. See
`revision-8.md` for the earlier trim work and the explicit historical-report status in `aster-delivery.json`.

No Blender renders or loading posters were generated in this pass. Diagnostic
browser captures under `validation/` are test evidence only. The user will capture the
poster later from the web renderer. Older `renders/` images are stale historical
artifacts, excluded from the current delivery. Open `aster-source.blend` and use the
`Aster_Source` scene for an editable review. See `web-handoff.md` for current files
and the browser contract. This is a production candidate, not an approved asset.

## Reference decisions

- **Current authority:** the user's successive revision requests and screenshots
  supersede the initial raster layout wherever they differ. See `revision-2.md`
  for the layout foundation, `revision-3.md` for details, and `revision-4.md` for
  the cabinet, door and shelf changes. `revision-6.md` records the latest kitchen,
  roof, validation cleanup and delivery state.
- Primary: `apps/nextjs/public/images/huts/aster/Aster-wood.png` (1309 × 697).
- Finish boundaries: `Aster-white.png` and `Aster-black.png` in that directory.
- Secondary: `Aster-floorplan.jpg` for unseen elevations and studio furnishings;
  `Aster.jpg` for exterior and interior atmosphere. The three `design/images/Aster*`
  references show the same compositions as their public counterparts.
- Product data and `design/briefs/HOMEPAGE.md` establish **39 m² · Studio**.
- Retain the long gabled form, vertical timber, front picture window, front-right
  glazed entrance, two stepped landings, standing-seam roof, solar array and gutters.
- Left-gable entrance and landing move rearward to the clear aisle between bed and
  TV console. Both entrance leaves have substantial black rails/stiles, clear glass
  and exterior-viewer-left horizontal lever handles.
- The flue now rises vertically from the rear-left corner stove through the rear
  roof slope. The original right-hand chimney and penetration are removed.
- Rear kitchen and right-gable toilet windows are each 1.20 × 1.05 m. A new right
  wall window faces the laptop desk. An opaque curtain covers the toilet window.
- All three smaller windows now have sill height 1.55 m and head height 2.60 m.
- The sofa, coffee table and open kitchen shelves are removed. A shorter L-shaped
  kitchen, upper cupboards and tall fridge face a small dining table with two chairs.
- The bed's headboard is against the front wall; bedside tables fit within the wall
  and bed boundaries. TV console/stove sit opposite. The front-right workspace has
  a laptop, lamp, books, supported chair and storage.
- Workspace storage has four full-height drawers. A double-door wooden wardrobe
  stands with its back to the front wall between picture window and main entrance.
- The kitchen has a continuous L worktop, a fitted oven bay, connected tap lever,
  and wooden upper-cabinet underside. A flowering plant sits between TV and kitchen.
- The toilet is larger, empty, and enclosed to the sloping ceiling. All its lining
  and the main ceiling use the same fixed material as the walls.
- Initial inferred shell: 8.4 × 4.65 m (39.06 m² gross footprint), floor 0.42 m,
  eaves 3.32 m, ridge 4.82 m. These are visual modeling dimensions, not a measured
  39 m² usable-floor-area claim or construction documentation.

## Reproduction

`scripts/prepare-materials.py` is a one-time, read-only material extraction from the
existing licensed Niva runtime material set. All copied inputs live locally afterward.
`scripts/build-aster.py` creates a separate `Aster_Source` scene without clearing other
scenes. It refuses to replace an existing Aster source. The initial default Blender
scene is retained. Build and export are explicit separate entry points.

In Blender's Python Console, load a script module with `importlib.util` and call:

1. `prepare-materials.py`: `prepare()` only if local maps have not been prepared.
2. `build-aster.py`: `build()` in a file without an existing `Aster_Source` scene.
3. `revise-layout.py`: `apply_revision()` to apply the user-directed revision 2.
4. `revise-details.py`: `apply_revision()` for revision 3 including tap/oven fixes.
5. `revise-cabinets.py`: `apply_revision()` for revision 4.
6. `fit-fridge.py`: `apply_revision()` for revision 5's fitted timber surround.
7. `revise-kitchen-roof.py`: `apply_revision()` for revision 6.
8. `fix-validation-geometry.py`: `apply_fixes()` for the validated geometry cleanup.
9. `extend-gutters.py`: `apply_revision()` for revision 7.
10. `resolve-gutter-join.py`: `apply_revision()` for revision 8.
11. `package-aster.py`: `export_delivery()` in `Aster_Source`.
12. Run the authorized validation commands documented in `revision-6.md` only when
    checking a new export, then `package-aster.py`: `payload_metadata()` to bind
    current asset hashes to matching reports and source provenance.

Do not run `render-aster.py`; it belongs to the earlier Blender-poster workflow.

Example module loading (substitute the absolute local spike directory):

```python
import importlib.util
from pathlib import Path

root = Path(r'C:\path\to\design\spikes\aster-3d')
spec = importlib.util.spec_from_file_location('aster_build', root / 'scripts/build-aster.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
module.build()
```

The source uses editable bevel/weighted-normal modifiers. Export applies them to
the runtime mesh, except seven specifically corrected UV-edge meshes whose evaluated
shape/normals were retained as editable mesh geometry. No decimation, Draco, KTX2, meshopt, or texture light baking
is used. The Blender-created `.blend1` file is an automatic prior-save backup,
not a second authoritative model.

Blender +Z up / -Y front; glTF +Y up / +Z front. Origin is ground-level footprint
center. Review cameras and lights are excluded from the runtime asset.

## Material boundaries

- `ExteriorCladding`: four exterior timber elevations, including gable infill.
- `InteriorJoinery`: kitchen cabinetry/underside, furniture timber, bed frame and
  bedside tops, dining/desk tops, wardrobe and bathroom wooden door/trim.
- Fixed: roof, frames, gutters, flue, solar panels, steps/landings, structural base,
  walls/ceiling/floor, upholstery, fixtures, appliances, glass and lighting.
- Defaults and alternative textures follow `aster-presets.json` exactly. Defaults
  are embedded; alternatives are independent on-demand base-color maps.

Material provenance and derivations are recorded in `texture-sources.json`.

## Revision 8 accounting

- Blender 5.2.1 LTS; Eevee, 96 render samples, AgX Medium High Contrast, exposure 0.
- 74,082 exported triangles, 570 meshes/nodes, 25 materials.
- One 7,758,360-byte GLB; seven embedded 1024 × 1024 maps.
- Four optional 1024 × 1024 finish JPEGs, 1,183,666 bytes combined.
- Camera JSON retained as a starting view; no current poster supplied or required.
- No HDRI or other runtime supporting asset request.
- Revision 6 geometry/round-trip, nine finish combinations and a 120-frame browser
  orbit passed. Revision 8 is untested; these are historical results. No production
  or physical-device/GPU performance claim is made.

Both the previous disk source and unsaved live Blender state were preserved under
`history/before-layout-revision-20260910-231952/` before editing. History is not part
of runtime delivery. Niva remains unchanged.

Revision 3 preservation: `history/before-detail-revision-20260910-235047/` and
`history/resume-detail-revision-20260911-014012/` preserve the prior saved and dirty
live states before applying the pending corrections.

Revision 4 aligns the upper cupboards and new over-fridge cupboard to the wardrobe
top at Z=2.94 m. Paired closed doors have low center knobs. Bed and TV shelves share
top height Z=2.28 m and carry books/vase/plant. Toilet leaf now has 3 mm side/head
reveals and wooden stops. Preservation: `history/before-cabinet-revision-20260911-020048/`.

Revision 5 adds fitted `InteriorJoinery` panels beside and above the fridge, including
the base-return infill and a front fascia above the appliance door. Cabinet tops
remain aligned. The visible top seam is reduced to 2 mm. Prior disk/live source is
preserved in `history/before-fridge-fit-20260911-021229/`. No renders or tests ran.

Revision 6 replaces these earlier added fillers with one fridge cheek per side,
shifts the fridge to the partition end, extends the return cabinetry/worktop,
adds L-shaped corner wall cupboards, and makes the two sink fronts fill the span
left of the oven. Roof ridge/eave terminations and sloped chimney flashing are revised.
Preservation: `history/before-kitchen-roof-20260911-232643/` and
`validation/before-geometry-cleanup/`.

Revision 7 extends each gutter from 8.76 m to 8.94 m (90 mm per end), matching the
fascia's X=±4.47 m endpoints. Prior source/export preservation:
`history/before-gutter-extension-20260913-023446/`.

Revision 8 keeps that length while separating the gutters outward from the fascia,
bringing the corner returns behind them, and sliding the barge ends slightly up
their roof slopes. Matching drain offsets and two thin drip aprons complete the
join. Preservation: `history/before-gutter-join-20260913-025521/`.
