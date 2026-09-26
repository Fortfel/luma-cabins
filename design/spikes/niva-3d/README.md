# Niva: Deck Edge And Interior Window Reveals

**Current source: September 25, 2026, deck/window follow-up.** `niva-final.blend` is the authoritative editable source, using scene `Niva_Source`. The deck fascia now meets the timber underside with 20 mm front and 12 mm end setbacks. The right living-room, left WC, front loft and rear kitchen window reveals use `FixedInteriorLining`, matching the interior walls independently of exterior palette changes. Wall shells meet at butt joints instead of overlapping on the reveal surfaces. Fixed black metal window frames remain separate from these painted reveals.

The September 25 configurator GLB is regenerated and synced to `apps/nextjs/public/cabin-3d/niva/niva-configurator.glb`. Delivery hashes/counts and runtime payload figures are updated. Saved-source geometry/material assertions and exported material/image checks passed; Blender close-ups were inspected. Browser testing is left to the user. See [web-handoff.md](./web-handoff.md#deck-and-window-delivery--september-25-2026).

The September 15 open half-round gutters, closed end caps and hollow downpipe connections are retained.

**Previous revision: September 11, 2026, roof/hardware follow-up including the corner/curtain fixes.** Those changes remain included in the new export.

**Poster policy: do not generate or overwrite Blender posters.** The browser gate uses a separate poster captured from the live web canvas; the existing design poster remains retained as a historical reference.

## Retained Roof, Hardware And Interior Changes

- **Roof timber grain:** remapped the front and rear continuous gable trim, including their narrow underside/top faces. Those faces previously had collapsed, zero-width UVs, creating transverse stripes. Grain now follows each sloping board, using the same `FixedArchitecturalTimber` material as `CeilingBeam_0`. The broad gable faces are split at the existing ridge vertices for separate UV islands; vertex positions and the roof silhouette are retained.
- **Small cabinet pulls:** the three narrow rear drawers and both above-fridge cupboard pulls are shortened from 240 mm to 140 mm, with correspondingly repositioned mounts. Their centering is retained.
- **Fridge pulls:** the fridge and freezer now have vertical handles on the left when viewed head-on, beside the microwave. The modeled doors are right-hinged in intent; no opening animation is included.
- **Kitchen corner clearance:** rear drawer fronts are now 300 mm wide with a fixed corner filler/divider. Their opening path has 44.4 mm lateral clearance to the nearest return pull. Rear and return drawer rows share the same reveals and all six drawer pulls are centered horizontally and vertically. The corner-door pull is centered across its door width. These are static meshes, not animated drawers.
- **Chopping board:** repositioned onto the worktop clear of both backsplash runs.
- **WC curtains:** replaced the flat blind and horizontal fold bars with two opaque linen panels, modeled vertical pleats, a softly scalloped hem, an overlapping center seam, header tabs and a mounted track. `WC_PleatedLinen` is a fixed material, independent of timber finishes.
- **WC door:** retained the fitted leaf, timber liners/stops and raised partition opening; added an overlapping timber header reveal cover to hide the upper strip in a straight-on view. All timber follows `InteriorJoinery`.
- **Front doors:** separate substantial metal leaf frames with 110 mm stiles, 100 mm top rails, 180 mm bottom rails, hinges, paired interior/exterior lever handles, long backplates and key cylinders. Rear rebates seal the perimeter and meeting gap. The original transparent `Glazing` material is retained.
- **Kitchen:** rear sink/worktop retained, with a matching dark-stone return along the right wall. Added return drawers, an accessible blind-corner base cabinet, corner wall cabinets replacing the mug shelves, a tall fridge/freezer next to the right-side window, overhead fridge storage, and a microwave on a timber shelf beside the fridge. The hob and kettle move onto the return.
- **Exterior lamps:** added opaque metal backplates and aimed Blender's shadow-casting area lights down/outside the facade. **The reported web light leak also requires Three.js changes:** the application's exterior point lights do not cast shadows. See the [runtime lighting instructions](./web-handoff.md#exterior-lamp-leak--runtime-action-required).

## Current Assets

| Asset                                                           | Purpose                                             |           Bytes |
| --------------------------------------------------------------- | --------------------------------------------------- | --------------: |
| `niva-final.blend`                                              | Authoritative editable source                       |      17,994,341 |
| `niva-configurator.glb`                                         | Current web model                                   |       7,786,100 |
| `renders/niva-configurator-poster.png`                          | Legacy 954 × 866 Blender poster; retained unchanged |         832,550 |
| `apps/nextjs/public/cabin-3d/niva/niva-configurator-poster.png` | Web-captured 954 × 866 gate poster                  |         374,814 |
| `niva-camera.json`                                              | Canonical pose and off-axis projection              |           2,398 |
| `niva-presets.json`                                             | Independent exterior/interior finish mapping        |           4,959 |
| `finishes/textures/`                                            | Four optional finish JPEGs                          | 1,183,666 total |
| `niva-configurator-delivery.json`                               | Current hashes, counts and review status            |        See file |

Export accounting: **96,920 triangles, 478 meshes, 479 nodes, 27 materials, eight embedded images**. Model plus retained legacy poster and camera/preset payload: **8,626,007 bytes**. With all four optional finish textures: **9,809,673 bytes**, before HTTP compression and runtime code. The separate retained web poster is 374,814 bytes.

The export reuses the previous GLB's eight optimized image payloads exactly: seven 1K maps and one 512 px fabric map. Authoring textures remain 2K where originally supplied. No decoder or additional texture dependency was introduced. This is a full export from the saved September 25 source, including the final gutter fit and downpipe connections.

## Finishes And Camera

| Material           | Presets                                                     | Runtime changes                                |
| ------------------ | ----------------------------------------------------------- | ---------------------------------------------- |
| `ExteriorCladding` | `natural-timber`, `whitewashed-timber`, `charred-black-oil` | Base-color map; roughness × 1.00 / 1.00 / 0.86 |
| `InteriorJoinery`  | `light-oak`, `warm-ash`, `dark-walnut`                      | Base-color map; roughness × 1.00 / 1.00 / 0.92 |

New timber cabinetry, fridge enclosure, microwave shelf and WC liners/stops use `InteriorJoinery`. Appliance faces, worktops, hardware and exterior door frames remain fixed. The preset IDs, external textures and camera contract remain the same.

The retained design poster was rendered during the previous door/L-kitchen pass and is now a historical reference. `finish_metadata()` no longer syncs posters; it records their retained bytes and marks them stale. The current web workflow has captured the replacement into the app's public Niva asset directory.

## Authoring Images And Testing Status

- [Kitchen](./renders/niva-kitchen-revision.png)
- [WC door](./renders/niva-wc-door-revision.png)
- [Front doors](./renders/niva-front-doors-revision.png)
- [Legacy authoring poster](./renders/niva-configurator-poster.png)

The linked design image files predate these follow-ups. The separate web poster and the targeted typecheck/live Chrome capture belong to the September 11 delivery. **No tests, topology-validation scripts, browser checks, lint or typecheck were run for the September 15 export.** Earlier reports under `validation/` and finish sheets describe preceding models. The raw `validation/niva-doors-kitchen-full.glb` is an export intermediate, not a validation report.

## Editing And Reproduction

The September 25 follow-up is implemented in `scripts/fix-deck-window-reveals.py`. Its `author()` backs up the current source before editing and refuses to run twice. Its `validate()` checks all four reveal joints/materials and the deck fascia clearances. Latest pre-edit backup: `validation/before-deck-window-reveals-20260925-175854/`.

The September 15 gutter edits are authored directly in the saved source and are not reproduced by the older authoring scripts. Continue from `niva-final.blend`; use the existing export/accounting workflow when a new web delivery is requested.

The successive authoring scripts are `scripts/refine-doors-kitchen.py`, `scripts/refine-corner-curtains.py`, then `scripts/refine-roof-hardware.py`. Use the current source directly for further work:

1. `refine-roof-hardware.py` provides `author()` for the corner/curtain revision. It backs up both the in-memory scene and saved source, then updates the roof UVs and hardware. Each follow-up's `author()` refuses to run twice on the same source.
2. `export_delivery()` can be called again after editing the current source. It exports renderable mesh/empty objects, excluding `Archive_DoorsKitchen_PreRevision`, cameras and lights; restores the optimized embedded image payloads; and syncs the configurator GLB into the public asset directory.
3. Save the source after any authoring work. **Do not render or overwrite Blender posters.** Capture browser replacements separately from the loaded GLB.
4. `finish_metadata()` writes current delivery hashes/accounting without copying or changing Blender posters. Refresh the model and web-poster byte/count display constants in `niva-3d-runtime.tsx` after delivery changes.

Superseded shelves, mugs, rear corner fronts, old door hardware and the old WC blind remain in the hidden `Archive_DoorsKitchen_PreRevision` collection, excluded from export. The latest pre-edit source/GLB/docs backup is `validation/before-roof-hardware-20260911-194448/`. Earlier backups remain at `validation/before-corner-curtains-20260911-154636/` and `validation/before-doors-kitchen-20260911-152003/`.

`niva.blend`, `niva-finishes.blend`, `niva.glb` and `niva-web-candidate.glb` are earlier intermediates/reference assets, not this revision. Do not run older build/finalization scripts over the current source expecting them to retain this kitchen. The high-quality export at `validation/niva-doors-kitchen-full.glb` is an intermediate; ship `niva-configurator.glb`.

See **[web-handoff.md](./web-handoff.md)** for integration details and **[../cabin-3d-pipeline.md](../cabin-3d-pipeline.md)** for reusable asset conventions. Texture provenance remains in `texture-sources.json`.
