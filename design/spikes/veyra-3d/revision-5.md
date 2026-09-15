# Veyra revision 5 — cabinet access and validated handoff

Status: authored, exported and tested following the user's authorization. Final
visual approval remains with the user. Niva/Aster and website files were not edited.

## Requested refinements

- Kitchen Roman blind/hem widen to approximately 1.50 m; the track is 1.54 m wide,
  leaving clearance to the adjacent upper cupboard.
- The outlet formerly behind the oven relocates to the return wall at Y=1.50 m.
  The existing return-wall outlet remains at Y=1.04 m.
- The return base becomes one tall access leaf on the viewer-left and three
  horizontal drawers on the right. A 108 mm fixed blind-corner strip beside the
  oven keeps the leaf out of the oven/handle/towel region. The hinge is on the side
  away from the oven, with an effective outboard pivot at `[-0.725, 1.240, 0.567]`.
  Source custom properties describe the intended 90-degree opening for validation;
  no door animation is exported.
- The sink-side botanical arrangement, including its vase/stems/leaves, is removed.
- Upper-return knobs move from panel centers to free edges. Index 2 is the
  viewer-left single door; indices 1 and 0 form the right-hand pair. Their knob
  positions are approximately 50 mm from the appropriate edges.
- Refrigerator and freezer handles move to viewer-left, Blender Y=0.420 m.
  The refrigerator grip center lowers to Z=1.620 m; the freezer grip height stays.
- Fruit is rebuilt as separately identifiable bodies. Support placement accounts
  for the curved bowl interior, and the pear moves apart from the apples. Subsequent
  evaluated-mesh clearance checks found no fruit/bowl or fruit/fruit intersections.

## Validation and visual review

The `validate` subagent ran Khronos, Blender round-trip, clearance and isolated R3F
checks. All four final reports pass for:

`ec810585cac81b361b166ae6e86b2ae5a86463a5f662082903224ece9fe4df2c`

- 584 source/imported objects and 203,122 triangles match.
- 19 sampled door poses pass; minimum measured clearance across the tested
  obstacles is about 2.07 mm. This minimum includes nearby fixed cabinet parts,
  not only the oven.
- All nine independent finishes, embedded-default restore, 32 fixed-material
  snapshots, 630 browser geometry identities and 120 orbit frames pass.
- Desktop/mobile canonical matrices match after resize, and canonical restoration
  after orbit matches. Zero WebGL, console-error or network-error findings in the
  final successful browser run.

The initial browser harness's projection could be overwritten by R3F; this was
corrected and the browser suite rerun. An intermediate hook import error was also
fixed. Final results supersede the earlier incomplete/misframed harness runs.
The primary agent inspected the corrected canonical browser frame and one default
Blender kitchen authoring frame. No user-facing finish-comparison images or new
poster were generated.

See [validation/README.md](./validation/README.md) for non-blocking notices and test
scope. The 1,055 coincident zero-area tessellation triangles are explicitly recorded
as redundant geometry, not universally claimed to be intentional poles.

## Source preservation and reproduction

Saved/live pre-edit source and delivery:
`history/before-revision-5-20260914-180111/`.
Replaced objects are retained in `Veyra_Archive_PreRevision5`, outside all runtime
export collections. All preceding archives remain.

For reproduction from revision 4, load `scripts/refine-cabinet-access.py` with
`runpy.run_path(...)` and call `author()` once. Use the current source directly for
further edits. `scripts/package-veyra.py` exports the asset and refreshes existing
hash-matched report references; it does not invoke validation.

After the quota interruption, the saved source bytes differed from the earlier
ledger. A narrow read-only background round-trip recheck confirmed that the current
saved geometry still matches the unchanged GLB. Its source hash is recorded in the
round-trip report and refreshed delivery ledger.
