# Veyra configurator candidate

Independent Veyra source and runtime delivery. **Revision 5 is authored and
validated, with final user visual approval pending.** The `validate` subagent ran
the authorized asset, round-trip, clearance and isolated R3F checks. See
[validation/README.md](./validation/README.md) for results and non-blocking notices.

## Open for review

- `veyra-source.blend` — authoritative editable file, scene `Veyra_Source`.
- `veyra-configurator.glb` — revised runtime geometry and default materials.
- [revision-5.md](./revision-5.md) — latest cabinet-access, handles and fruit corrections.
- [revision-4.md](./revision-4.md) — preceding fitted-kitchen corrections.
- [revision-3.md](./revision-3.md) — preceding kitchen/stove and furnishing revision.
- [revision-2.md](./revision-2.md) — preceding revision history.
- [web-handoff.md](./web-handoff.md) — current runtime files and material contract.

Blender is left in this independent file with the canonical camera selected as the
scene camera. Additional camera objects `Veyra_InteriorReview` and
`Veyra_BedroomReview`, plus `Veyra_GuitarDetail`, are available for interior inspection. Review cameras and
lighting are excluded from the runtime GLB.

The three initial images under `renders/` are **historical**, and the preset
manifest omits its optional `poster` field. Revision 5 includes a single default
kitchen authoring review and browser validation evidence; no user-facing finish
comparison images or replacement poster were produced.
Review the current source rather than those images. The canonical camera contract
is retained for a future updated poster.

## Approved reference interpretation

The user's September 13 clarification supersedes the inaccurate floor-plan image:
follow `Veyra-wood.png` for the exterior and author a fitting one-bedroom interior.
The toilet enclosure must be empty, with a closed door and an opaque window curtain.
The two interior images guide material atmosphere and furniture detailing only.

The proposed shell is 11.2 × 5.0 m, with floor at 0.42 m, eaves at 3.35 m and
ridge at 4.75 m. Dimensions are inferred visualization proportions, not certified
usable floor area. Product information remains `56 m² · 1 Bedroom`.

Front means Blender -Y. The primary elevation has a small left window, central
double doors and right single door; the left gable has double doors. Each entrance
has its reference canopy. Revision 2 replaces the long front landing with a 3.10 m
platform centered on the shifted double doors; the separate end steps remain.
Revision 3 lowers/thins the canopies, extends the gutters and moves the flue to
match the new rear-left living-room stove. The standing-seam roof and solar array remain.

Interior: left corner lounge/stove, fitted L-shaped rear kitchen, round two-seat dining moved
closer to the sofa, enlarged rear-central
empty toilet enclosure and a separate right bedroom with desk and office chair.
The bedroom storage wall has drawers, open shelves, closed wardrobe doors and a
trailing plant with its vines routed clear of the pot and cabinet. The furnished
corner cabinet now faces into the room from the front exterior-door wall, and a
guitar stands beside the front-right bedside unit. The wider rug covers both
bedside units; the sage bed cushions are removed. A wardrobe/shelving unit occupies
the front wall opposite the toilet. Rear openings serve the kitchen, curtained toilet and bedroom
workspace. The undocumented right gable
continues the cladding without inventing another entrance or picture window.
The original service-flue interpretation is superseded by the user's requested living-room stove.

Revision 4 fits the kitchen fronts/carcasses on shared dimensions, moves the sink
and kitchen window left, adds a short top-only Roman blind, replaces cabinet pulls
with matching wooden knobs, enlarges the freezer and splits its overhead cupboard
into paired doors. Continuous upper cabinetry and stone upstands meet the fridge.
An oven towel, outlets, coffee press, fruit bowl and restrained countertop details
are authored for the user's later interior comparison photography. Gutters now
have solid closed end stops. The central floor plant is removed.

Revision 5 widens the kitchen blind, relocates the rear outlet onto the return
wall, removes the sink-side botanical arrangement, and changes the return base
to one vertical access door plus three drawers. A fixed corner strip leaves room
for the door to open clear of the oven. Upper knobs express one left single door
and a right-hand pair. Fridge grips move to the viewer-left, with the refrigerator
grip lowered. Fruit is supported inside the bowl without penetrating it.

## Review and validation status

The user authorized validation after revision 5. Khronos validation, saved-source
round trip, cabinet/fruit checks, all nine independent finish combinations and
responsive camera/orbit checks passed for the current asset hash. Non-blocking
redundant tessellation, runtime-generated tangent-space and unused-UV notices are
documented. Final user visual approval, public integration and physical-device GPU
profiling remain separate. Authoring images alone are not validation evidence.

Niva and Aster are read-only references. No website integration is included.

## Reproduction

The current source is authoritative for further edits. Preserve a copy before
making revisions. `veyra-source.blend1` is a previous save, not a second master.
The pre-revision saved/live source and delivery are preserved under
`history/before-revision-2-20260913-140824/`. Superseded pieces are also retained in
`Veyra_Archive_PreRevision2`, hidden and excluded from the GLB. Revision 3 additionally
preserves the saved and unsaved live source in `history/before-revision-3-20260913-192040/`
and its replaced pieces in `Veyra_Archive_PreRevision3`.
Revision 4's saved/live backup is `history/before-revision-4-20260914-130932/`, with
replaced objects retained in hidden `Veyra_Archive_PreRevision4`.
Revision 5's saved/live backup is `history/before-revision-5-20260914-180111/`, with
replaced objects retained in hidden `Veyra_Archive_PreRevision5`.

For a complete fresh rebuild, start a new empty Blender file using
`bpy.ops.wm.read_homefile(use_empty=True, use_factory_startup=True)` only after
saving any current work. Load `scripts/build-veyra.py` with `runpy.run_path(...)`.
Its `prepare_sources()` copies approved local material files from Aster; it does
not open another cabin or import geometry. Existing local `textures/` and
`finishes/textures/` already contain the required files, so that preparation step
can be omitted when reproducing from this complete delivery. Call `build()`.
The build deliberately refuses to operate in an existing named/nonempty file.

Then load `scripts/revise-layout.py` and call `prepare()`, `exterior_layout()` and
`interiors()` once each to reproduce revision 2. The stage guards prevent applying
the revision twice. Do not run these stages again on the current revised source.

Next load `scripts/revise-furnishing.py` and call `prepare()`, `exterior_bedroom()`
and `living_kitchen()` once each for revision 3. These stages also refuse repetition.

Then load `scripts/refine-kitchen.py` and call `prepare()`, `furnishing_fixes()`
and `kitchen_revision()` once each for revision 4. Do not run completed stages on
the current source. These functions do not render, take screenshots or run tests.

Finally load `scripts/refine-cabinet-access.py` and call `author()` once for revision
5. It preserves saved/live source and records static-door opening intent for the
separate clearance checker. Do not run it again on the current revised source.

Load `scripts/package-veyra.py` with `runpy.run_path(...)`, then call:

1. `export_delivery()` — one GLB, camera/lighting contracts and source save.
2. `render_poster()` — optional canonical Blender presentation, only when requested.
3. `render_interiors()` — optional interior presentations, only when requested.
4. `metadata()` — file sizes, hashes, declared export counts and existing
   hash-matched validation results; it does not run tests.

None of those functions invokes a validation suite. Rendering is explicit;
`export_delivery()` alone does not regenerate presentation images. The build
uses assembly-level joining for tiny static parts and retains descriptive names,
material slots, editable bevels where practical, and separate glazing.

If a new poster is explicitly requested, `render_poster()` marks it current after
render completion; call `export_delivery()` again to publish its optional manifest
fields, followed by `metadata()`. No poster was regenerated in revisions 2–5.
