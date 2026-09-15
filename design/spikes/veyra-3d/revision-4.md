# Veyra revision 4 — fitted kitchen for later interior photography

Status: authored and exported, stopped for user visual review. **No screenshots,
renders, comparison images or tests were run for this revision.** The user will
make interior finish-comparison captures later. Initial images remain historical.

## Bedroom and living corrections

- Rebuilt the wardrobe-top plant using a hollow pot. Vines emerge through the pot
  opening, travel above the top board, then hang forward of the cabinet rather
  than through the pot, top or shelf bays.
- Rotated `BedroomCornerCabinet*` 90 degrees onto the front exterior-door wall.
  Its books, folded textiles, vase, drawers and hardware move with it.
- Increased/aligned the two `EntryStorage` drawer fronts, reducing the gap beneath
  the lowest shelf. Shelf/front widths and edge radii now give small consistent
  reveals instead of the earlier oversized spaces.
- Removed `Living_LoungePlant`. Moved the complete dining set by X=-0.65 m,
  Y=-0.05 m, including the pendant and its authoring light, toward the sofa.
- Added four solid half-disc `Gutter_ClosedEnd_*` plates. These close the channel
  bore; the previous annular sheet-edge closure alone left the trough open.

## Kitchen layout and fitted construction

- Sink center moves from X=-1.30 to X=-1.81 m. The existing repaired metal basin
  and drain are retained and repositioned, not replaced by an image or flat inset.
- Kitchen window center moves from X=-1.05 to X=-1.81 m. Its exterior opening,
  wall lining, cladding and frame move together; width/height remain unchanged.
- A short opaque Roman-style blind occupies only the upper part of the window,
  with modeled shallow folds, mounting track and hem.
- Oven and hob move to the rear run, beside the sink, following the supplied
  composition. Three broad drawers occupy the return before the fridge.
- Hollow cabinet structure replaces solid blocks around the sink. Fitted false
  front and lower doors conceal the basin, while shared front heights extend to
  3 mm below the counter underside. The basin has clearance behind the fronts.
- Rear/return fronts use approximately 3 mm reveals and small edge radii. The old
  projecting corner door/filler and narrow mismatched return drawers are archived.
- Continuous L-shaped upper carcass with fitted door leaves replaces the separate
  gapped cupboard blocks. The corner and fridge-end doors use tight reveals and a
  shared top at Z=2.810 m.
- One continuous L-shaped stone upstand joins the corner and reaches the fridge
  with a small terminal joint. It no longer stops short of the housing.
- All wooden kitchen cabinet/drawer pulls are now round wooden knobs using
  `InteriorJoinery`. Appliance handles remain fixed metal.
- Freezer face height increases from 0.52 to 0.76 m. Refrigerator face decreases to
  1.208 m. Two overhead cupboard leaves with paired wooden knobs replace the single
  overhead face/pull. Doors remain static, with side-opening design intent.

## Close-view detail

- Modeled off-white tea towel wraps over the oven handle. Its colored stripes are
  material regions in the same cloth mesh, avoiding layered coplanar stripe faces.
- Two wall outlets have recessed socket details and metal earth contacts.
- Chopping board and soap dispenser occupy the left counter; the plant is no
  longer intersecting or precariously positioned on the board.
- A slender botanical arrangement stands between the sink and hob, with utensils
  on the deeper corner and a fruit bowl on the clear return surface.
- A glass coffee press sits on the hob, with recessed coffee, lid, plunger, handle
  and metal base. No extra image dependencies are introduced.
- Kitchen timber uses coherent world-projected veneer coordinates at the existing
  1.83 m scale. Alternative finishes still replace only the target material maps;
  no baked camera lighting or preset-specific geometry is introduced.

These are authored corrections, not claims of validated topology or browser parity.
The source remains a concept visualization rather than construction documentation.

## Preservation and reproduction

Pre-edit saved/live source and delivery are preserved under
`history/before-revision-4-20260914-130932/`. Replaced pieces and authoring
intermediates are retained in hidden `Veyra_Archive_PreRevision4`; all archives are
outside the runtime export collections.

Use `veyra-source.blend / Veyra_Source` for further work. To reproduce from revision
3, load `scripts/refine-kitchen.py` using `runpy.run_path(...)`, then call
`prepare()`, `furnishing_fixes()` and `kitchen_revision()` once each. Stage guards
prevent repetition. Export/accounting use `scripts/package-veyra.py`.

The canonical camera and preset IDs remain unchanged. No current poster is
published, and no comparison screenshots were taken. No website integration was
performed; Niva/Aster were not modified.
