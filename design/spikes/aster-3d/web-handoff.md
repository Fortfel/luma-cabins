# Aster current web handoff

## Source and delivery

Edit `aster-source.blend / Aster_Source`; export with `scripts/package-aster.py`. See [README.md](./README.md) and [the shared pipeline](../cabin-3d-pipeline.md) for exact export/validation commands. Current source supersedes the retired build/revision chain.

Production loads **`/cabin-3d/aster/aster-configurator.glb`** from `apps/nextjs/public/cabin-3d/aster/`. The package script syncs the GLB/camera/presets and relocates finish references into shared `../finishes/textures/`. The retained design GLB supports independent delivery/validation. Exact identities and accounting are in `aster-delivery.json`; the shipped baseline has **88,386 triangles, 574 meshes/nodes, 25 materials and seven embedded 1K images**.

## Current modeling constraints

- Product fact: **39 m² · Studio**. The inferred 8.4 × 4.65 m shell, floor Z=0.42 m, eaves 3.32 m and ridge 4.82 m are visualization proportions, not certified usable area or construction drawings.
- Retain the long gable, vertical timber cladding, front picture window, front-right glazed entry, left-gable entrance, two stepped landings, standing-seam roof, solar array and drainage. Both entry leaves have substantial black frames and viewer-left horizontal levers. Left-gable entry serves the clear aisle between bed and TV console.
- Rear-left corner stove connects to a straight flue through the rear roof slope. Roof flashing follows the pitch and has a real pipe opening. Ridge capping spans the outer barge edges; eave fascia/end returns remain fitted.
- Rear kitchen and right-gable toilet windows are 1.20 × 1.05 m; a right-wall window faces the laptop desk. All three smaller windows align at Z=1.55 m sill / 2.60 m head. Toilet curtain is opaque.
- Bed headboard sits against the front wall with fitted bedside tables; TV console/stove are opposite. Front-right workspace has laptop, lamp, books, a supported chair and four full-height storage drawers. A front-wall double-door wardrobe occupies the gap between the picture window and main entrance.
- Retain the shorter L-shaped kitchen, upper cupboards, tall fridge, continuous worktop, fitted oven bay, connected tap hub/spindle/lever and two-chair dining table. No old sofa, coffee table or open kitchen shelves are part of the current layout. Flowers sit between TV and kitchen.
- Exactly one timber cheek fits each fridge side; the outer cheek ends at partition Y=-0.15 m. Return cabinets/worktop meet the fridge. Upper cupboards form a real L corner whose rear arm clears the window. Sink fronts fill the entire span left of the oven. Preserve the fitted appliance/front reveals, not the superseded stacked filler arrangement.
- Upper/over-fridge cupboards align with wardrobe top Z=2.94 m. Paired static doors have low knobs at their center seam; furnished bed/TV shelves share top Z=2.28 m. Cupboard underside is wood.
- Enlarged empty toilet enclosure reaches the sloping ceiling. Door leaf has 3 mm side/head reveals and wooden stops. Toilet/main wall linings and ceiling use the same fixed interior material; no emissive/unlit plaster workaround.
- `Gutter_-1` / `Gutter_1` retain **8.94 m** length, matching fascia endpoints X=±4.47 m. Outboard separation, shortened/up-slope barge ends and thin drip aprons clear the fascia/trim. Current profiles are open half-round troughs with four closed end caps; final lip is approximately Z=3.280 m. Hollow swept `DownpipeOffset_*` bends meet the underside and shortened downpipe tops. Preserve the final saved-source fit rather than applying earlier revision offsets again.

Doors/drawers are static concept geometry. Editable bevel/weighted-normal modifiers remain where practical; seven corrected UV-edge meshes retain evaluated shapes/normals as editable geometry. No decimation is used. The default startup scene and hidden archives inside the blend are excluded from runtime export.

## Materials and finishes

`aster-presets.json` defines independent exterior/interior groups:

| Material           | IDs                                                         | Roughness multipliers |
| ------------------ | ----------------------------------------------------------- | --------------------- |
| `ExteriorCladding` | `natural-timber`, `whitewashed-timber`, `charred-black-oil` | 1.00 / 1.00 / 0.86    |
| `InteriorJoinery`  | `light-oak`, `warm-ash`, `dark-walnut`                      | 1.00 / 1.00 / 0.92    |

Exterior targets only `Cladding_Front`, `Cladding_Rear`, `Cladding_LeftGable`, `Cladding_RightGable`, including gable boards. Steps, landings, base, roof/solar, metal/exterior frames, gutters/flue and sconces stay fixed.

Joinery includes furniture/cabinet carcasses and fronts, cupboard underside, TV console, bed/headboard/bedside timber, dining/desk surfaces and timber seating, wardrobe, bathroom door leaf and wooden jambs/header/stops. Wall/ceiling/floor linings, upholstery, stone worktops, curtains, appliances, fixtures, glazing, metal legs and lights remain fixed.

Resolve exact material names and all matching slots; never tint all timber. Cache original embedded maps and baseline roughness. Defaults restore the cached map; external sRGB JPEGs use `flipY=false` and inherit the original sampler/UV transform. Assign baseline roughness times the multiplier; preserve normal/ORM data, alpha/glass, metalness, emissions and extensions. Guard async finish requests and invalidate demand rendering. Exterior showcase IDs `wood/white/black` map to the three exterior IDs above.

## Camera, lighting and posters

`aster-camera.json` is the authoritative Aster-specific **1309 × 697**, approximately 28° front-left pose/projection contract. Matrices are row arrays; retain horizontal sensor fit, clipping, off-axis shifts and root coordinates. Blender +Z up / -Y front converts to glTF +Y up / +Z front at a ground-centered metric origin. Camera contracts are maintained explicitly and copied unchanged by packaging.

`aster-lighting.json` records neutral authoring scene/world lights, Eevee/AgX Medium High Contrast and exposure 0, without an HDRI. Material Preview's old forest environment was not the material color authority. GLB excludes lights/world/cameras; the production Interactive Showcase owns browser tone mapping, shadow-casting exterior spotlights and responsive framing. See [the feature contract](../../../docs/features/interactive-showcase-3d.md).

Posters are separately web-captured configuration assets under `/images/showcase/configurations/`, mapped in `interactive-showcase-configuration.ts`. The preset manifest has no required Blender poster. Local historical images are optional and never copied/generated by packaging.

## Provenance, accounting and checks

Seven default 1K images are embedded. Four alternative 1K JPEGs add 1,183,666 bytes on demand. `texture-sources.json` identifies Poly Haven CC0 `oak_veneer_01` (Jenelle van Heerden) and `wood_floor` (Dimitrios Savva), exact local maps and material-only derivations. Finish names are palette tones, not species certification. The GLB uses `KHR_materials_specular` and `KHR_materials_emissive_strength`, with no decoder dependency.

Delivery metadata separately accounts for GLB/camera/presets, optional finishes, source hash and any locally present historical poster. No historical image/report is required. Current fresh export and Blender/Khronos checks passed in a disposable source-only tree. Khronos tangent-space warnings are retained: explicit Blender tangents were previously rejected because of invalid zero vectors; loader-generated tangents remain the intended convention. Open leaf/grid surfaces are explicitly reported. No browser test, render or performance claim accompanies this cleanup.

The optional isolated browser harness remains useful for asset/finish/camera checks when authorized, but it does not reproduce the production carousel/dialog controls or framing. Final browser visual acceptance remains user-owned.
