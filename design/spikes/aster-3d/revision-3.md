# Aster — detail revision 3

Status: authored and exported, awaiting the user's inspection. **No renders, posters,
tests, GLB round trip or browser checks ran.** Poster creation belongs to the user's
future web workflow. Revision 2's Blender images are historical and stale.

## Preservation and continuation

The work paused after the revision script was written but before it was applied.
On resume the connected scene was still revision 2 and dirty. Both saved and live
states were preserved again before applying revision 3, including the new tap and
oven requests. Preservation directories:

- `history/before-detail-revision-20260910-235047/`
- `history/resume-detail-revision-20260911-014012/`

## Changes

1. **Ceiling appearance:** inspection identified Material Preview using `forest.exr`
   with scene world and scene lights disabled. This tinted the sloped ceiling olive
   and ignored the previous added ceiling light. Both ceiling panels already used
   the wall material, `FixedInteriorLining`, with correct flat face normals.
   Preview now uses the neutral scene world and authored lights. Material remains
   physically shaded, fixed and identical to wall lining; no emission was added.
   Natural brightness differences between differently oriented surfaces remain.
2. **Wall-side bedside table:** shift table/supports/lamp 45 mm inward and reduce
   top radius from 190 to 155 mm. New X bounds -3.915…-3.605 leave space from the
   actual interior wall plane X=-3.975 and bed edge X=-3.565.
3. **Kitchen corner:** replace the two undersized worktop pieces with a single
   closed L-shaped top reaching partition face X=1.34. Add timber infill below.
   Retain the sink cutout and recessed cabinet carcass.
4. **Cupboard underside:** remove the emissive diffuser and its dedicated area
   light. Replace the inset with `InteriorJoinery` timber.
5. **Flowers:** potted flowering plant between TV console and kitchen at
   (-1.365, 1.83), using fixed foliage/ochre petals and existing pot material.
6. **Workspace drawers:** raise the case by one original drawer height (1.55/3 m),
   add a fourth drawer and handle, and raise the existing plant with the top.
7. **Front wardrobe:** a 0.90 m wide, 0.50 m deep, 2.45 m tall double-door case
   plus 0.07 m plinth, centered at X=1.575 between the main window and door.
   Back faces the front wall; doors face +Y into the studio. Case, doors, plinth
   and knobs use configurable joinery timber.
8. **Window alignment:** raise the workspace aperture, lining, frame, glass and
   sill by 0.15 m. All three smaller windows now span Z=1.55…2.60 m. Rebuild the
   right cladding/lining openings so there is no covered-over lower opening.
9. **Tap:** replace the floating operating rod with a valve hub, horizontal spindle
   and connected vertical lever. Smooth-shade the curved faucet tube.
10. **Oven:** remove the two prior cabinet fronts and handles behind the appliance;
    cut a real bay into the carcass, add side filler and a separate right-side
    cabinet door, and fit a 0.604 m wide × 0.735 m high appliance centered under
    the cooktop at X=0.33. Add frame, chassis, control panel/display, round dials,
    glass door and mounted handle. There is no drawer pull above the oven.

## Reproduction and handoff

Run initial `build-aster.py`, then `revise-layout.py`, then `revise-details.py`.
The last script includes all ten corrections and refuses to run on a scene other
than revision 2. Export and metadata use `package-aster.py`; no render step exists
in the current workflow.

The preset manifest omits `poster`. Camera metadata retains the initial view and
records that the poster is deferred. Payload accounting excludes all historical
images. No Niva or website files were modified.

Declared export: 68,554 triangles, 510 meshes/nodes, 25 materials; GLB 7,145,888 bytes.
These are file accounting, not geometry validation or performance results.
