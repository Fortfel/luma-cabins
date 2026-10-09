# Veyra current web handoff

## Source and delivery

`veyra-source.blend / Veyra_Source` is the editable authority. Use `scripts/package-veyra.py` and the validators documented in [README.md](./README.md). The historical authoring chain is retired. Source archives remain hidden/excluded; no external history directory is required.

Production loads **`/cabin-3d/veyra/veyra-configurator.glb`** from `apps/nextjs/public/cabin-3d/veyra/`. Packaging syncs GLB/camera/presets and relocates optional finish references to shared `../finishes/textures/`. The design GLB is retained for independent source-package validation/handoff. `veyra-delivery.json` has exact current hashes/accounting; the shipped baseline has **203,034 triangles, 582 meshes/nodes, 34 materials and seven embedded 1K images**.

## Current architectural and furnishing constraints

- Product fact: **56 m² · 1 Bedroom**. The user-approved exterior interpretation supersedes the inaccurate old floor-plan reference. Inferred shell dimensions are 11.2 × 5.0 m, floor Z=0.42 m, eaves 3.35 m and ridge 4.75 m; this is a visualization, not certified net usable area or a building-services plan.
- Retain four cladded elevations, standing-seam roof, ridge/barge flashings, eight front-slope solar modules, foundation rails/feet and drainage. Front means Blender -Y. Front elevation has a small left window, central double doors and right single door; left gable has double doors. No invented right-gable door/picture window.
- Three lowered/thinner canopies cover static framed entrance leaves. Central double doors retain right edge X=0.46 m and a centered 3.10 m landing; bedroom/gable steps remain separate. There is no central stair.
- Left lounge has corner sofa, aligned coffee table/rug, media console and rear-left corner stove/hearth. A straight flue at Blender X=-4.93 m, Y=1.73 m penetrates matching roof flashing/boot and a local standing-seam interruption. The old right-side service flue is absent.
- Kitchen has a continuous L-shaped stone worktop/upstand, rear sink/drawers and oven/hob, a static vertical access door plus three return drawers, and a fitted fridge at the toilet end. Sink/window center X=-1.81 m clears continuous corner upper cabinetry. Basin structure is hollow; fronts extend beneath the top with a fitted false front. The tap has a real faucet deck clear of the wall.
- **Current blind-corner arrangement:** 108 mm `Kitchen_ReturnBlindCornerFiller`, 233 mm `Kitchen_ReturnAccessDoor`, original knob position. The temporary widening was reverted. `Kitchen_ReturnAccessHinge_0/1` are absent. The outboard opening/pivot intent is retained, but no door animation or current analytical swing certification is shipped. The old hinge-presence clearance test no longer describes this saved model and is retired.
- Upper return doors express one viewer-left single and a viewer-right pair, with knobs near free edges/the paired seam. Freezer face is 0.76 m high; overhead storage has paired static doors aligned with adjacent cabinet tops. Both appliance grips are viewer-left (+Y in Blender), with the main fridge grip lower on its face.
- Kitchen window has a 1.50 m top-only Roman blind. Both outlets are on the return wall. Oven towel, coffee press, utensils, chopping board, soap dispenser and separate fruit/bowl meshes remain; fruit follows the bowl interior rather than floating or intersecting it. The sink-side botanical arrangement and freestanding floor plant are absent.
- Round dining table is 1.04 m diameter with two chairs and a pendant, moved 0.65 m toward the sofa. A front-wall wardrobe/open-shelf unit extends toward the central entrance.
- Separate right bedroom has double bed, bedside storage, expanded rug beneath both bedside units, rear desk/monitor/keyboard/mouse/task lamp, swivel chair and a storage wall with four drawers, shelves, wardrobe doors and trailing plant. Vines route over a hollow pot and clear the cabinet. The furnished corner cabinet faces into the room from the front exterior-door wall. A fixed acoustic guitar/stand sits beside the front-right bedside unit. Sage cushions, old bench/picture/floor plant are absent.
- Rear-central toilet enclosure is **empty**, with a closed wooden door and opaque pleated linen over its rear window. Its front plane is Y=-0.20 m and left plane X=0.06 m, joined continuously to the bedroom partition. Toilet door center X=0.635 m; bedroom internal door Y=-0.80 m. Keep separated leaf/stop planes and small reveals.
- Bedroom workspace window is 0.98 × 1.55 m with sill Z=1.30 m. Kitchen, curtained toilet and bedroom rear openings remain distinct.
- Half-round gutters span X=-5.835 to +5.835 m with solid closed end stops, curved flush outlet flanges and hollow constant-section downpipes on stand-offs. Folded drip aprons bridge the roof edge/outboard troughs; canopies clear gutter bottoms. Cups have hollow interiors and separate recessed liquid surfaces.

Doors, drawers and appliances are static concept geometry. Review cameras and `Veyra_Archive_PreRevision2` through `Veyra_Archive_PreRevision5` remain editable internal provenance, excluded from runtime export. The model does not require replaying any revision script.

## Material and finish contract

`veyra-presets.json` is authoritative:

| Material           | IDs                                                         | Roughness multipliers |
| ------------------ | ----------------------------------------------------------- | --------------------- |
| `ExteriorCladding` | `natural-timber`, `whitewashed-timber`, `charred-black-oil` | 1.00 / 1.00 / 0.86    |
| `InteriorJoinery`  | `light-oak`, `warm-ash`, `dark-walnut`                      | 1.00 / 1.00 / 0.92    |

Exterior targets the four `Cladding_*` elevation meshes only. Roof, decks/steps, frames, canopies, gutters, solar, foundation and fixtures stay fixed. Joinery includes cabinetry/wood knobs, fridge housing, bedroom desk/storage, entry storage, tables, timber chairs, console, bed/headboard/wardrobe/bedside storage, wooden interior door leaves/jambs/headers/stops, decorative frames/trays/chopping board.

Walls, ceiling, floor, rugs/textiles, stone, appliances, glazing, nonwood hardware, plants, stove, blind/towel/outlets/fruit and lighting remain fixed. Guitar materials `FixedGuitarSpruce`, `FixedGuitarWalnut` and `FixedGuitarFingerboard` are deliberately fixed even where their image bytes share the oak map.

Find exact material names across all slots; cache original maps/baseline roughness. Defaults restore embedded maps; external sRGB JPEGs use `flipY=false` and inherit the original sampler/UV transform. Apply baseline roughness times the multiplier without compounding. Preserve normal/ORM, glass/alpha, metalness, emissions and extensions; never edit shared image data. Guard asynchronous selections and invalidate demand rendering. Showcase exterior IDs `wood/white/black` map to the exterior IDs above; interior IDs match directly.

## Camera, lighting and posters

The Veyra canonical contract uses **1358 × 553**, a 73 mm lens, 36 mm horizontal sensor, shift X=0/Y=-0.012, Blender position `[-14, -29, 5.65]` and target `[0, -0.15, 2.4]`. Exact row-array pose/projection and glTF conversion are in `veyra-camera.json`. Maintain metric ground-centered origin and Blender +Z up/-Y front → glTF +Y up/+Z front. Preserve off-axis projection and horizontal sensor fit; do not recenter/rescale the GLB.

Packaging preserves explicit camera/lighting contracts. `veyra-lighting.json` records Cycles/AgX Medium High Contrast, neutral studio lights and local warm fixtures, without an HDRI. GLB exports emissive fixture geometry but not scene lights. The production runtime provides four shadow-casting exterior spots and the targeted dining-pendant light, carried by the rotating cabin. See [Interactive Showcase 3D](../../../docs/features/interactive-showcase-3d.md) for production framing/lighting behavior.

Configuration posters are separately web-owned under `/images/showcase/configurations/`, mapped in `interactive-showcase-configuration.ts`. No required Blender poster field is supplied. Legacy local renders are optional historical accounting and never generated, synced or overwritten by package commands.

## Provenance and validation

Poly Haven CC0 `oak_veneer_01` (Jenelle van Heerden) and `wood_floor` (Dimitrios Savva) supply the seven embedded 1K maps. Four external 1K finish JPEGs total 1,183,666 bytes. `texture-sources.json` and presets record exact files, derivations and author identities. Finish names describe tones, not verified species. No camera/lighting bake, decimation or extra decoder is used; glTF material extensions remain specular/emissive-strength.

Fresh clean-package exports, Blender round trips, Khronos and material-contract checks passed for this cleanup. The validator distinguishes coincident/redundant tessellation from distinct actionable zero-area geometry: 1,055 coincident zero-area triangles were reported, with no distinct zero-area failures. Open/assembled surface and generated-tangent notices remain documented limitations. File byte/count reports do not establish performance or visual acceptance. No browser checks or renders were run.

The optional standalone harness checks finish combinations, orbit and manual camera matrices when authorized. It is useful asset tooling, not a substitute for the production dialog/carousel/framing check. Current browser acceptance remains user-owned.
