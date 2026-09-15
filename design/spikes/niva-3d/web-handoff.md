# Niva Configurator Asset Handoff

## Gutter delivery — September 15, 2026

`niva-final.blend / Niva_Source` now contains Veyra-style open half-round `Left_Gutter` / `Right_Gutter` meshes and four `*_GutterClosedEnd_*` caps. Their inner edges clear the timber barge ends, and the lips sit closely beneath the roof edge rather than leaving an exposed timber gap. The final gutter lip is approximately Z=3.627 m in Blender world coordinates. `Left_GutterElbow` / `Right_GutterElbow` are hollow swept connectors with tops fitted to the curved gutter underside; the downspout tops meet the new bends.

These are direct saved-source edits; older authoring scripts do not reproduce them. `niva-configurator.glb` has now been regenerated from this source and synced to `apps/nextjs/public/niva-3d/`. `niva-configurator-delivery.json` records the new source/asset hashes and counts, and the runtime's payload display is updated. No tests, browser checks, lint or typecheck were run for this export. Earlier browser/validation evidence remains historical. Existing posters are retained and predate the new gutter geometry; replacements belong to the user's web-capture workflow.

## Current Delivery

**September 15, 2026 delivery:** final gutter fit, closed end caps and hollow downpipe joints, retaining the earlier corrected roof grain, kitchen hardware, corner clearances and WC curtains. The model is regenerated and synced into `apps/nextjs/public/niva-3d/`. The runtime's displayed payload and model-count constants have been updated.

**The browser poster is now captured from the live WebGL canvas. Do not generate, sync or overwrite the Blender poster during future asset work.** The retained design poster remains unchanged and stale relative to this model.

Historical September 11 evidence: targeted typecheck and Chrome browser verification rendered the preceding GLB at 474 meshes, and its 954 x 866 poster was captured with the UI overlays hidden. That capture does not represent the September 15 export. The integrated browser capture session timed out, so Chrome CDP was used for that earlier capture.

| File                                   | Purpose                                            |      Bytes |
| -------------------------------------- | -------------------------------------------------- | ---------: |
| `niva-configurator.glb`                | Current single runtime model                       |  7,782,032 |
| `niva-presets.json`                    | Independent material/preset mapping                |      4,959 |
| `niva-camera.json`                     | Canonical camera contract                          |      2,398 |
| `renders/niva-configurator-poster.png` | Legacy 954 × 866 Blender poster; retained unchanged |    832,550 |
| `apps/nextjs/public/niva-3d/niva-configurator-poster.png` | Web-captured 954 × 866 poster used by the gate | 374,814 |
| `niva-final.blend`                     | Authoritative source, scene `Niva_Source` | 17,991,665 |
| `niva-configurator-delivery.json`      | Current SHA-256 hashes and accounting              |   See file |

Use `/niva-3d/niva-configurator.glb` and `/niva-3d/niva-configurator-poster.png` in the app. Transfer camera/preset JSON and `finishes/textures/` with their relative layout. Do not deploy source blends, backups, authoring close-ups or validation intermediates. `niva.glb` and `niva-web-candidate.glb` remain older reference assets.

## Geometry And Compatibility

The delivered GLB is a full export from the September 15 editable source, with modifiers applied for glTF. It contains **96,920 triangles, 478 meshes, 479 nodes, 27 materials and eight embedded images**. It has one model for all independent finish combinations. No new decoder dependency was introduced.

- `Front_ContinuousTimberBarge` / `Rear_ContinuousTimberBarge`: fixed zero-width UVs on the narrow faces and aligned the grain with each roof slope. Material is the same `FixedArchitecturalTimber` used by `CeilingBeam_0`. The two broad concave faces are split into coplanar quads at existing ridge vertices, allowing separate slope UV islands without changing vertex positions or silhouette. Mapping uses 1.83 m tiles and proper two-dimensional islands for broad faces, narrow depth faces and end caps.
- `KitchenPull_1_*` / `KitchenFridge_OverheadPull_*`: grips shortened to 140 mm, centered as before, with narrower mount spacing. Larger return-drawer pulls retain their existing size.
- `KitchenFridge_MainHandle` / `KitchenFridge_FreezerHandle`: vertical 500 mm / 340 mm pulls on the left edge viewed head-on, which is Blender **+Y**, beside the microwave. Doors have right-side hinge intent (Blender -Y), with no exported door animation.
- `WC_ClosedDoor`: fitted leaf, `WC_RebatedLiner_*` and `WC_DoorStop_*` retained. The raised opening in `WC_SidePartition` and new `WC_HeaderRevealCover` hide the painted strip; the cover ends about 1 mm above the leaf, with approximately 4 mm side reveals.
- `WC_Curtain_LeftPanel` / `WC_Curtain_RightPanel`: opaque modeled fabric with seven vertical pleats per panel, cloth thickness, softened hem and an overlapping center seam. `WC_Curtain_Track*` and `WC_Curtain_HeaderTab_*` form the mounting. Fixed material `WC_PleatedLinen` uses ordinary PBR with no extra texture dependency. The previous blind/fold bars are archived.
- `Front_DoubleDoor_Leaf_*`: individually framed leaves, stout perimeter rails, hinges, paired lever handles, backplates and key cylinders. `Front_DoubleDoor_*Stop` and `Front_DoubleDoor_MeetingSeal` close the rear sightlines around working gaps. Existing `Front_DoubleDoor_Glass_*` nodes retain transparent `Glazing` with resized panes.
- `KitchenLReturn_*`, `KitchenCorner_*`: dark-stone L return, drawers, toe kick and blind-corner base cabinet. Rear sink and its cutout remain; hob/kettle move to the return.
- `KitchenFront_1_*`: rear drawer faces narrowed to 300 mm, with `KitchenCorner_ClearanceFiller` and `KitchenCorner_RearDrawerDivider` closing the fixed corner. The drawer edge ends 44.4 mm before the closest return pull, clearing its straight opening path. The rear and return drawer rows align and their pulls are centered on each face. The corner access door is authored for hinging at its near end; no opening animations are exported.
- `KitchenChoppingBoard`: moved onto the worktop clear of the intersecting backsplash geometry.
- `KitchenUpperCorner_*`: wall cabinets wrap the rear/right corner formerly occupied by open mug shelves.
- `KitchenFridge_*`: tall fridge/freezer, timber enclosure and overhead storage just aft of the right-side window.
- `KitchenMicrowave_*`: modeled appliance on a timber shelf beside the fridge, with storage above.
- `SconceOpaqueBackplate_*`: opaque exterior metal backing behind the existing lamps.

The hidden `Archive_DoorsKitchen_PreRevision` collection preserves superseded pieces in Blender and is excluded from the GLB. Node indices and geometry buffers are regenerated; find objects/materials by name. Historical statements that only the stove handle or cladding UV buffers changed are obsolete for this delivery.

## Exterior Lamp Leak — Runtime Action Required

The reported interior glow is consistent with the exterior point lights authored in `apps/nextjs/src/app/[locale]/niva-3d/niva-3d-runtime.tsx`: positions `[-1.69, 2.77, 2.88]` and `[1.69, 2.77, 2.88]`, intensity 5, distance 3. They currently have no `castShadow` setting. A non-shadow-casting light illuminates surfaces through opaque walls; thicker Blender walls cannot make that light perform occlusion.

### Blender changes included

- Solid metal `SconceOpaqueBackplate_-1` and `SconceOpaqueBackplate_1` overlap the existing fixture/wall backing.
- `SconceReviewLight_*` area lights have shadows enabled and aim down/outside the facade.
- Existing opaque wall linings are retained.

These changes improve the authored fixture geometry and Blender illumination. **They do not resolve the application's shadowless point lights by themselves.** Scene lights/cameras are deliberately excluded from the GLB, and glTF does not carry Three.js renderer/mesh shadow configuration.

### Required Three.js integration

1. Enable `renderer.shadowMap.enabled` (in React Three Fiber, enable shadows on the `Canvas`).
2. Enable `castShadow` on both exterior lights.
3. Enable `castShadow` on opaque cabin meshes, including exterior cladding, interior wall linings and the new lamp backplates. Enable `receiveShadow` on opaque interior surfaces. Handle arrays of materials, and keep transparent glazing out of the opaque caster set.
4. Set the exterior shadow camera's near plane sufficiently small to include nearby fixture/wall backing, e.g. **0.01 m**, and far plane to the useful light range, e.g. **3 m**. A default near plane can clip a backing surface only centimetres from the light. Start with small bias values and tune in the browser; excessive bias/normal bias can reintroduce leaks.
5. A shadow-casting downward spotlight per lamp better matches the Blender fixture than an omnidirectional point light, and needs one shadow view rather than six. In GLB coordinates, an approximate target is `[±1.69266, 1.70, 3.02]` from `[±1.69266, 2.77, 2.88190]`. If choosing this approach, replace the exterior point lights rather than adding duplicate illumination; tune cone and intensity visually.
6. In a demand-rendered scene, invalidate after the shadow setup or relevant light changes.

Runtime lighting behavior was not changed in this asset pass. Check the originally reported view through the side window when implementing the shadow fix. Current Three.js shadow documentation was consulted; no successful browser check is claimed.

## Exact Preset Mapping

`niva-presets.json` remains authoritative. Exterior and interior are separate state values.

| Group    | ID                   | Label              | Target material    | Base-color source                                             | Roughness multiplier |
| -------- | -------------------- | ------------------ | ------------------ | ------------------------------------------------------------- | -------------------: |
| exterior | `natural-timber`     | Natural Timber     | `ExteriorCladding` | Cached original embedded map                                  |                 1.00 |
| exterior | `whitewashed-timber` | Whitewashed Timber | `ExteriorCladding` | `finishes/textures/exterior-whitewashed-timber-basecolor.jpg` |                 1.00 |
| exterior | `charred-black-oil`  | Charred Black Oil  | `ExteriorCladding` | `finishes/textures/exterior-charred-black-oil-basecolor.jpg`  |                 0.86 |
| interior | `light-oak`          | Light Oak          | `InteriorJoinery`  | Cached original embedded map                                  |                 1.00 |
| interior | `warm-ash`           | Warm Ash           | `InteriorJoinery`  | `finishes/textures/interior-warm-ash-basecolor.jpg`           |                 1.00 |
| interior | `dark-walnut`        | Dark Walnut        | `InteriorJoinery`  | `finishes/textures/interior-dark-walnut-basecolor.jpg`        |                 0.92 |

If bridging showcase IDs, map `wood` → `natural-timber`, `white` → `whitewashed-timber`, `black` → `charred-black-oil`. Interior IDs match already.

### Material preparation and application

1. Load the GLB once. Find `ExteriorCladding` and `InteriorJoinery` by exact material name. Clone each configurable material once per independently configurable model instance, sharing that clone across its slots. Handle both material arrays and individual materials.
2. Cache original base-color maps and baseline roughness. Default `source: "embedded-default"` restores the original map, not `null` or an additional download.
3. Keep exterior/interior selections independent. For external selections, load/cache the JPEG relative to the preset manifest directory and apply `baselineRoughness * roughnessMultiplier`; do not multiply the current value repeatedly.
4. Preserve normal/roughness/metalness maps, normal scale, color factor, alpha/glass settings, sidedness, emissions and extension behavior. Do not replace the material with a generic material or tint the entire model.
5. External base-color maps use `THREE.SRGBColorSpace` and `flipY = false`. Inherit UV channel, wrapping, filters, anisotropy, repeat, offset, center, rotation and matrix settings from the default map. Normal and packed roughness maps are not sRGB.
6. Mark changes updated and invalidate demand rendering. Guard asynchronous completion per group so stale loads cannot overwrite a newer choice. Dispose only owned external resources, not shared original GLTF maps.

### Finish boundaries

`ExteriorCladding` targets only the four exterior cladding meshes. Deck, steps, roof, structural trim, gutters, chimney and metal/exterior frames remain fixed.

`InteriorJoinery` includes the existing cabinetry, tables, chopping board, ladder and WC timber, plus new timber cabinet fronts/carcasses, corner filler/divider, fridge enclosure, microwave shelf, WC liners, stops and header reveal cover. Fridge/microwave appliance faces, hardware, stone worktops, glazing, walls, floor, ceiling, fixed loft structure, textiles including `WC_PleatedLinen`, and lights remain fixed. Some fixed materials share the original oak image; assign a replacement map to the configurable material rather than editing shared image data.

## Camera And Poster

The approximately 18-degree front-left canonical camera is unchanged. `niva-camera.json` defines:

- Transparent **954 × 866** output; page background **#f7f5f0**.
- GLB convention **+Y up, +Z forward**; do not recenter or rescale the imported root.
- Position approximately **(-5.715943, 3.322870, 17.891865)**; target **(0, 3, 0.3)**.
- Lens 74.525391 mm, sensor width 36 mm, near 0.1, far 1000.
- Off-axis shifts X = 0.0765452385, Y = -0.0161585305.
- `matrix_world_gltf`, `matrix_world_blender` and `projection_matrix` contain **row arrays**. Convert correctly for column-major APIs and preserve off-axis projection on resize; naive `lookAt` alone is insufficient.

The design poster is a legacy Natural Timber / Light Oak source render from the previous door/L-kitchen revision. It does not include the latest drawer/curtain changes and remains unchanged. The browser gate now uses a separate 954 × 866 capture of the live WebGL canvas at `/niva-3d/niva-configurator-poster.png`; do not copy it back into Blender renders. `finish_metadata()` retains the design poster's old hashes/accounting and explicitly marks it stale. No new HDRI was introduced.

## Payload And Review Status

The export reuses the preceding configurator GLB's eight embedded image payloads exactly: seven 1024 × 1024 maps and one 512 × 512 fabric image. Four optional 1K JPEGs remain unchanged, totaling **1,183,666 bytes**. They are material-only derivatives of the approved oak grain; finish names describe tones rather than verified timber species.

- Current GLB + retained legacy poster + camera/preset JSON: **8,621,939 bytes**. This design-delivery total intentionally excludes the separate web poster.
- With all four optional finish textures: **9,805,605 bytes**. The retained web poster is 374,814 bytes and is accounted for separately in `niva-configurator-delivery.json` as predating the current asset.
- These are file bytes before HTTP compression and runtime assets. Additional mesh detail increases geometry/draw-call counts; no performance approval is implied.

Historical authoring images: `renders/niva-kitchen-revision.png`, `renders/niva-wc-door-revision.png`, `renders/niva-front-doors-revision.png`, and `renders/niva-configurator-poster.png`. These predate this follow-up. Its curtain/kitchen previews were rendered only in memory.

**No tests or verification commands were run for the September 15 export.** Targeted typecheck and live browser capture belong to the September 11 delivery; reports such as `validation/finish-review.json`, `finish-readability.json` and `configurator-package.json` remain historical. Current asset identities and review status are recorded in `niva-configurator-delivery.json`.

## Source And Reproduction

Use `niva-final.blend / Niva_Source`. The latest pre-edit source/GLB/docs are preserved at `validation/before-roof-hardware-20260911-194448/`, including both the last saved source and the in-memory scene. Previous backups remain at `validation/before-corner-curtains-20260911-154636/` and `validation/before-doors-kitchen-20260911-152003/`. Superseded geometry, including the old WC blind, is hidden under `Archive_DoorsKitchen_PreRevision` and must stay excluded when exporting.

`scripts/refine-roof-hardware.py` authors the September 11 changes once, after `scripts/refine-corner-curtains.py`. Both use `export_delivery()` and `finish_metadata()` from `scripts/refine-doors-kitchen.py` for repeated exports and accounting. `finish_metadata()` no longer copies posters. See [README.md](./README.md#editing-and-reproduction) for the sequence and the later direct-source gutter edits. Older build scripts do not incorporate these revisions.

Read `AGENTS.md` and the local Next.js docs before application changes. The lamp shadow fix is the outstanding runtime work for this request; the user will perform testing. Reusable cabin conventions are in `../cabin-3d-pipeline.md`.
