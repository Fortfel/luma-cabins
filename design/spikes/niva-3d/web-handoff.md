# Niva current web handoff

## Source and delivery

`niva-final.blend / Niva_Source` is authoritative. Use [`scripts/package-niva.py`](./scripts/package-niva.py) and the validation commands in [README.md](./README.md). No revision script, backup directory, raw intermediate GLB or authoring poster is required.

Production loads **`/cabin-3d/niva/niva-configurator.glb`**, with camera/presets beside it in `apps/nextjs/public/cabin-3d/niva/`. The exporter creates/syncs that directory and relocates finish URIs to the shared `../finishes/textures/`. The design GLB remains an intentional package/validation and optimized-texture baseline.

The shipped baseline has **96,920 triangles, 478 meshes, 479 nodes, 27 materials and eight embedded images**. Consult `niva-configurator-delivery.json` for exact current source/asset hashes and file totals. Packaging exports all current geometry; nodes/buffer indices may be regenerated, so resolve objects/materials by name. No decoder dependency or decimation is introduced.

## Current modeling constraints

- `DeckFrontFascia` meets the timber underside with a 20 mm front setback and 12 mm end setbacks.
- All four window reveals—right living room, left WC, front loft and rear kitchen—use `FixedInteriorLining`, matching the fixed interior walls. The side/front/rear lining shells meet cladding inner planes at butt joints instead of overlapping reveal faces. Cladding meshes contain separate exterior/interior-material primitives. Black metal window frames stay fixed.
- Open half-round `Left_Gutter` / `Right_Gutter` troughs have four closed end caps. Their lips clear the timber barge ends closely beneath the roof edge, approximately Blender Z=3.627 m. Hollow swept `*_GutterElbow` connectors meet the gutter underside and downspout tops.
- `Front_ContinuousTimberBarge` / `Rear_ContinuousTimberBarge` grain follows each roof slope. Broad faces are split at ridge vertices; narrow depth/end faces have noncollapsed UV islands. Mapping uses 1.83 m tiles and `FixedArchitecturalTimber`, shared with ceiling beams; preserve the roof silhouette.
- Front double doors have substantial independent black metal leaf frames (110 mm stiles, 100 mm top rails, 180 mm bottom rails), hinges, paired interior/exterior levers, backplates, key cylinders and rear/meeting seals. `Glazing` remains transparent. Doors are static.
- Rear sink/worktop and right-wall dark-stone L return meet a blind-corner cabinet. Hob/kettle sit on the return; upper cupboards wrap the corner. The fridge/freezer is aft of the right window, with overhead storage and a microwave on its adjacent timber shelf.
- Rear drawer faces are 300 mm wide; the fixed corner filler/divider leaves 44.4 mm lateral clearance to the nearest return pull. Rear/return drawer rows align with centered pulls; the corner-door pull is centered. Small rear/over-fridge grips are 140 mm; larger return grips remain unchanged. Chopping board clears both backsplash runs.
- Fridge/freezer handles are vertical 500/340 mm grips on the viewer-left (Blender +Y), beside the microwave. Doors have right-hinge intent (-Y), without animations.
- `WC_ClosedDoor`, timber liners/stops and `WC_HeaderRevealCover` close the raised opening. Header cover ends about 1 mm above the leaf; side reveals are approximately 4 mm. All this timber follows `InteriorJoinery`.
- Two opaque `WC_PleatedLinen` curtains have seven modeled pleats each, thickness, softened/scalloped hems, overlapping center seam, tabs and track. They remain fixed independently of timber finishes.
- Opaque exterior sconce backplates overlap the fixture/wall backing. Authoring lights aim downward/outward; their light settings are not exported.

The hidden `Archive_DoorsKitchen_PreRevision` collection remains editable provenance inside the master and is excluded from GLB. Inferred cabin geometry is a concept visualization, not construction documentation. These constraints consolidate relevant prior authoring decisions; no migration sequence is needed.

## Finish contract

`niva-presets.json` is authoritative. Keep exterior/interior selections independent.

| Material           | IDs                                                         | Roughness multipliers |
| ------------------ | ----------------------------------------------------------- | --------------------- |
| `ExteriorCladding` | `natural-timber`, `whitewashed-timber`, `charred-black-oil` | 1.00 / 1.00 / 0.86    |
| `InteriorJoinery`  | `light-oak`, `warm-ash`, `dark-walnut`                      | 1.00 / 1.00 / 0.92    |

Showcase exterior IDs map `wood` → `natural-timber`, `white` → `whitewashed-timber`, `black` → `charred-black-oil`. Interior IDs already match.

Exterior swaps apply only to `ExteriorCladding` primitives, not the fixed reveal primitives on the same meshes. Deck, steps, roof, structure, gutters, chimney and metal/exterior frames remain fixed. Joinery includes cabinetry, tables, chopping board, ladder, WC timber, corner filler/divider, fridge enclosure and microwave shelf. Appliances, stone worktops, hardware, glazing, wall/floor/ceiling/loft structure, textiles and lights remain fixed.

Find configurable materials by exact name, including array-valued slots. Cache original maps and baseline roughness once; default selections restore the embedded map. External JPEGs are sRGB with `flipY=false` and inherit sampler, UV channel/transform, filters and anisotropy. Set `baselineRoughness * multiplier`; preserve all normal/ORM, alpha/glass, metalness, emission and extension settings. Do not mutate image data shared by fixed materials. Guard asynchronous selections and invalidate demand rendering.

## Camera, lighting and posters

`niva-camera.json` remains the canonical row-array pose/off-axis projection contract: **954 × 866**, approximately 18° front-left, glTF position `[-5.715943, 3.322870, 17.891865]`, target `[0, 3, 0.3]`, lens 74.525391 mm, sensor width 36 mm, near/far 0.1/1000, shifts X=0.0765452385 and Y=-0.0161585305. Blender +Z up / -Y front becomes glTF +Y up / +Z front. Preserve the authored root and row-to-column matrix conversion.

Production framing, Niva's fixed visual offset/initial yaw, responsive projection and interaction are owned by `interactive-showcase-3d-runtime.tsx` and `interactive-showcase-3d-framing.ts`. See [Interactive Showcase 3D](../../../docs/features/interactive-showcase-3d.md). Packaging preserves the camera contract instead of adopting a selected inspection camera.

The production runtime already supplies shadow-casting downward exterior spotlights, opaque casters/receivers, transparent-glazing exclusions, nearby shadow clipping and demand invalidation. GLB fixtures/backplates alone cannot enable those shadows. Preserve this lighting setup; final side-window light balance is a browser-review concern.

**Posters are web-owned.** Configuration posters are mapped in `interactive-showcase-configuration.ts` under `/images/showcase/configurations/`. No legacy Blender poster is required or generated. If a local historical poster exists, accounting records it separately and excludes its bytes from runtime totals. Default delivery totals comprise GLB + camera + presets; four optional finish JPEGs add 1,183,666 bytes. Authoring source and runtime code are not runtime asset totals.

## Texture provenance and validation

Poly Haven CC0 `oak_veneer_01` (Jenelle van Heerden) and `wood_floor` (Dimitrios Savva) supply the timber maps. `texture-sources.json` preserves original download URLs/hashes and material-only derivations. Download paths are historical provenance, not required local files. Current authoring images are packed; the delivery embeds seven 1K maps plus the 512px woven fabric. Palette names describe tones rather than certified species. No HDRI or camera/light bake is used.

Current exporters and validators were exercised in a disposable clean source package without historical inputs. GLB round-trip geometry/material/bounds checks and Khronos validation passed; the optimized images matched byte-for-byte. There is a pre-existing 24-triangle zero-area tessellation notice on `KitchenMicrowave_Window` and loader-generated-tangent warnings. These are recorded limitations, not visual acceptance. No browser checks or renders were run for this cleanup.
