# Aster — user-directed layout revision 2

## Scope and authority

The user's eight screenshots and requested fixes supersede the initial Aster
interior interpretation. This is a fictional concept layout, not construction
documentation. No tests were requested or run; the user will inspect the result.

Before revision, the saved source, exported assets, scripts and renders were copied
to `history/before-layout-revision-20260910-231952/`. The dirty connected Blender
state was separately saved there as `aster-live-before-revision.blend`.

## Current layout

Coordinates are Blender meters: front = -Y, left = -X, up = +Z.

- **Bed:** center (-2.75, -1.06), headboard at Y=-2.08 against the interior front
  wall. Bedside tops at X=-3.805 and -1.695, Y=-1.81, radius 0.19. Lamp on the
  wall-side table; books and a small floral arrangement on the other.
- **Left entrance:** center Y=0.55, opening Y=0.075…1.025. Landing follows it.
  This enters the aisle between the foot of the bed and rear TV/stove furniture.
- **Stove:** rear-left at (-3.55, 1.64). Internal and external flue share exactly
  that X/Y, rising straight through a new rear-slope flashing. No right-hand flue.
- **TV console:** rear wall, center (-2.33, 1.86), 1.42 m wide, next to the stove.
  Television has a separate screen, body and connected supporting feet.
- **Kitchen:** short 2.30 m rear worktop plus return against the toilet partition.
  Sink beneath the enlarged rear window; cooktop and oven beside it. Return drawers,
  upper cupboards, under-cabinet diffuser, utensils/herbs, and a tall fridge/freezer
  replace the former long run and open shelves.
- **Dining:** round table at (-0.20, -0.60), two connected chairs. The sofa and
  coffee table are completely removed.
- **Toilet:** left partition moves from X=1.75 to X=1.40; front partition from
  Y=0.11 to Y=-0.15. Walls follow the ceiling slopes to close the room. It contains
  no sanitary/furniture geometry. A solid pleated curtain conceals the window.
- **Workspace:** front-right desk at (3.70, -1.43), laptop/keyboard, desk lamp,
  books and a padded supported chair facing the right-wall window. Drawer storage
  stands between desk and toilet, clear of the toilet door.

## Architectural and material fixes

- Both exterior doors retain clear glazing but gain separate outer frames and
  substantial door-leaf stiles, top rails and bottom rails.
- Horizontal lever, spindle, backplate and escutcheon sit on the **left as viewed
  from outside**: -X on the front door, +Y on the left-gable door.
- Rear kitchen and toilet windows: 1.20 × 1.05 m. Desk window: 1.20 × 1.05 m.
- The opaque toilet curtain is fixed ivory linen, independent of finish presets.
- Existing ceiling and wall objects are explicitly assigned `FixedInteriorLining`
  with the same neutral base color. Neutral upward review illumination reduces the
  prior dark/warm ceiling cast; natural lighting differences still remain.
- The sink is an open steel bowl with rim, sloping sides, bottom and drain. The
  worktop **and cabinet carcass** are recessed so wood cannot fill the basin. The
  faucet is one continuous tube with a separate operating lever.
- Chairs have continuous rear supports connecting backrests to seats, plus side
  and cross rails. Tables, console, desk, door and stove handles have modeled supports.

`ExteriorCladding` and `InteriorJoinery` retain their independent preset names and
texture contract. New cabinetry, wooden chair parts, bedside furniture, TV console
and workspace tops use joinery; walls/ceiling, appliances, glass, curtain, metal and
lighting remain fixed.

## Reproduction and delivery

`scripts/build-aster.py` remains the initial source builder. Follow it with
`scripts/revise-layout.py` → `apply_revision()` for the current candidate. This
revision function refuses to run twice on the same marked scene. All current
geometry changes are represented in these scripts.

The canonical camera is retained. The GLB, camera metadata, lighting metadata,
canonical poster, rear-right presentation image and delivery accounting were updated.
The new images are presentation artifacts, not test or acceptance evidence.

Current declared payload: 63,194 triangles, 459 meshes/nodes, 24 materials;
GLB 6,795,896 bytes. No optimization pass or runtime-performance claim is made.

**Stop for the user's inspection.** GLB round-trip, automated geometry/finish tests,
orbit validation and browser checks remain unrun.
