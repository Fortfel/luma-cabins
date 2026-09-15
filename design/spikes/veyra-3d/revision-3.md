# Veyra revision 3 — drainage, bedroom storage and L-kitchen

Status: authored and exported, stopped for user visual review. No topology tests,
round trip, validator, finish suite, orbit validation, browser or performance tests
ran. The initial delivery renders remain stale. Two temporary authoring previews
of the kitchen and guitar were used because viewport capture returned black.

## Exterior

- Gutters now span 11.67 m to the roof ends, with integrated caps. Their centers
  move slightly outward to clear the barge geometry, and folded drip aprons carry
  runoff from the roof edge into them.
- Outlet flanges conform to the curved trough. The pipe/socket connection is
  beneath the gutter, removing the protruding stub and overlapping lip surfaces.
- Entrance canopy bodies are lowered and reduced to 0.12 m thickness. Their top
  is Z=3.105 m, clear of the gutter bottom; the underside remains above door heads.
- The original roof flue is replaced by the requested living-room stove's straight
  flue. The new penetration is X=-4.93 m, Y=1.73 m. Matching sloped flashing/boot,
  ceiling trim, rain cap and standing-seam interruption are authored. The old seam
  interruption on the right is restored and the old service riser is archived.

## Bedroom

- The rug is now 2.55 × 3.15 m, extending beneath both bedside cabinets.
- The sage cushions are removed.
- A full 0.74 m-wide shelf/drawer cabinet replaces the four floating corner shelves.
  It contains books, a vase, folded clothes and towels, following the reference's
  open-shelf-over-drawer arrangement. Cabinet timber uses `InteriorJoinery`.
- An acoustic guitar on a padded stand occupies the front-right corner beside the
  bedside unit. It has an authored double-bout body, hollow sound hole/rosette,
  fingerboard, frets, strings, bridge, saddle, nut and tuning machines. Its timber
  is fixed instrument material rather than configurable furniture joinery.

## Toilet and living room

- Toilet width increases by approximately the old door-to-corner gap: its left
  wall moves from X=0.46 to X=0.06 m. The front/left wall is now one extruded L,
  unioned with the bedroom partition to eliminate the stepped corner and internal
  overlapping wall surfaces. The enclosure remains empty and the curtain remains.
- The toilet door center moves from X=1.36 to X=0.635 m, near the left edge.
- Front-wall storage opposite the toilet runs from near the bedroom corner toward
  the central double doors, with closed wardrobe doors, drawers and furnished
  open shelves. It leaves the entry opening clear.
- A 1.04 m round table, two chairs and a single pendant replace the larger dining
  set. Existing independent finish behavior is retained.
- The kitchen is rebuilt as an L: continuous stone countertop, rear sink/drawers,
  return oven/hob, upper cupboards and a tall fridge at the toilet-corner end.
  Upper cabinets are positioned to keep the existing rear window clear.
- The basin moves forward 0.14 m. The faucet is placed at Y=2.155 m, wholly in front
  of the actual inner wall at Y=2.255 m, with a connected hub and lever. This fixes
  the cause of the vanishing stem rather than only moving the backsplash.
- A compact stove on a hearth occupies the rear-left corner. The TV and media
  console shift right 0.99 m. Its flue is vertically aligned through the roof.

## Preservation and reproduction

The previous saved source and separate unsaved live source, runtime asset and
manifests are preserved in `history/before-revision-3-20260913-192040/`.
Replaced objects remain in hidden `Veyra_Archive_PreRevision3`; the earlier archive
also remains. Both are excluded from runtime export.

Use the current `veyra-source.blend / Veyra_Source` for further edits. To reproduce
from revision 2, load `scripts/revise-furnishing.py` with `runpy.run_path(...)` and
call `prepare()`, `exterior_bedroom()` and `living_kitchen()` once each. Stage guards
prevent repeating the revision over itself. Export/accounting use the existing
`scripts/package-veyra.py` functions. No validation is invoked by these functions.

The canonical camera is retained, with an updated interior review view and a new
`Veyra_GuitarDetail` review camera. No current poster is published; `poster` remains
omitted from the preset manifest until an updated poster is requested.
