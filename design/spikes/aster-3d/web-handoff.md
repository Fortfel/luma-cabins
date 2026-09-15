# Aster configurator candidate handoff

## Gutter delivery — September 15, 2026

`aster-configurator.glb` is regenerated from `aster-source.blend / Aster_Source`. `Gutter_-1` / `Gutter_1` retain their 8.94 m length but now use Veyra's open half-round profile, with four `Gutter_ClosedEnd_*` caps. The final lip is approximately Z=3.280 m, 45 mm below the initial half-round conversion. `DownpipeOffset_-1` / `DownpipeOffset_1` are hollow swept bends fitted to the gutter underside, with shortened vertical downpipe tops meeting the bends. Existing drip aprons remain.

These are direct saved-source edits, not a new run of the revision scripts. `package-aster.py` regenerated the GLB, camera/lighting contracts and `aster-delivery.json`, including current source/asset hashes and payload counts. Older validation reports are explicitly unmatched to this export. No tests or renders were run; the earlier joint authoring was inspected in Blender's viewport. The package remains in this design directory, with no configured Aster app route; posters remain deferred to the user's web workflow.

## Status and review gate

**September 15 gutter follow-up — exported, untested by explicit user request.** The
earlier revision 8 established gutter/trim separation. Both
gutters retain their 8.94 m length. Their bodies are moved 61 mm outward; corner
returns and barge ends are brought behind them. Matching drain offsets and thin
drip aprons replace the intersecting end join.
No tests or renders were run for this change. The previous revision 6 passed
Khronos, Blender round-trip and isolated R3F finish/orbit checks; those reports are
historical and do not match the new GLB hash. `aster-delivery.json` marks them
`not-run-for-current-export`. See the gutter-delivery section above for the current change, `revision-8.md` for the preceding trim work and
`revision-6.md` for the earlier evidence.

No Blender renders or loading posters were generated in this revision. The user will generate
posters from the web renderer later. Earlier Blender images are stale historical
artifacts, not current delivery or validation evidence.

Browser canvas captures under `validation/browser-diagnostics/` are diagnostic
evidence, not posters. Production integration and physical-device/GPU profiling
remain outside the completed checks.

## Current delivery

All paths below are relative to `design/spikes/aster-3d/`.

| File | Purpose |
| --- | --- |
| `aster-source.blend` | Authoritative editable source; select `Aster_Source` |
| `aster-configurator.glb` | Single runtime asset; Natural Timber / Light Oak defaults |
| `aster-camera.json` | Exact canonical pose, projection, shifts, dimensions and coordinates |
| `aster-presets.json` | Independent exterior/interior finish contract |
| `finishes/textures/*.jpg` | Four external, on-demand alternative base-color maps |
| `aster-delivery.json` | File sizes, SHA-256 values and declared mesh counts |
| `aster-lighting.json` | Blender lighting intent, excluded from GLB |
| `texture-sources.json` | Poly Haven CC0 sources and material derivations |
| `scripts/` | Independent build, revision and package scripts; old render script is historical |
| `textures/` | Local source maps used to reproduce the packed Blender materials |

The initial Blender default scene is preserved separately inside the source file;
it is not part of the selected-scene GLB export. `.blend1` is a prior-save backup.

Niva was read only for its pipeline, material contract and reusable CC0 image bytes.
No Niva geometry was imported and no Niva file was modified. The existing application
and unrelated worktree changes were preserved. Aster is not copied into the public
website or connected to a browser route in this pass.

## Geometry and architecture

The user's revision instructions supersede the original interior layout and some
exterior opening/flue positions. See `revision-2.md`, `revision-3.md` and `revision-4.md` for the change record.
The long gable, front picture window, stepped landings, cladding, standing-seam roof,
solar array and gutters remain. Both doors now have robust black frame/leaf geometry
and viewer-left lever handles. The left-gable entrance shifts to the clear aisle.
The chimney moves to the rear-left corner and rises straight from the stove.

The kitchen and toilet windows are enlarged to 1.20 × 1.05 m. A new right-wall
window faces the laptop workspace. An opaque curtain covers the toilet window.
All three smaller windows now align at Z=1.55 m sill / 2.60 m head.
The interior now contains a wall-positioned bed with furnished bedside tables,
opposite TV console/stove, shorter L-shaped kitchen with upper cupboards and tall
fridge, dining table with connected chairs, and furnished laptop workspace/storage.
There is no sofa, coffee table, old kitchen shelving or bathroom fixture geometry.
The larger toilet enclosure meets the sloping ceiling. It is still a concept
visualization, not an architecturally resolved interior.

Revision 3 adds a front-wall wooden wardrobe facing into the room, a fourth full
workspace drawer, and flowers between TV and kitchen. The L worktop/corner is
continuous, upper-cabinet underside is wood, tap lever is attached through a hub
and spindle, and the oven has a dedicated centered bay without old drawer fronts.

Revision 4 fits the toilet leaf to its frame with 3 mm side/head reveals and
wooden stops. Kitchen upper cupboards and the new over-fridge cupboard align with
the wardrobe top at Z=2.94 m. Paired closed doors have knobs low by the center seam.
Furnished bed/TV shelves share top height Z=2.28 m. All new cupboard, shelf and
door-stop timber uses `InteriorJoinery`; doors remain static.

Inferred shell dimensions are 8.4 × 4.65 m, floor height 0.42 m, eaves 3.32 m and
ridge 4.82 m. These are fictional visualization proportions; `39 m² · Studio`
remains the product fact, not a measured net usable area certified by this model.

Revision 5 closes the visible left/top fridge gaps with fitted timber side and
underside panels, base-return infill and a top fascia. These use `InteriorJoinery`.
The aligned cabinet tops remain unchanged; only a narrow 2 mm front seam remains.
Reproduce with `fit-fridge.py` after revision 4. Prior saved/live source is preserved
under `history/before-fridge-fit-20260911-021229/`.

Revision 6 replaces the previous filler arrangement with exactly one timber cheek
on each fridge side. The outer right cheek ends at the partition's Y=-0.15 m edge.
The return cabinets and continuous top expand to meet the shifted fridge. Upper
cupboards form a real L corner; the rear arm clears the kitchen window. The sink
fronts are resized to fill the entire span left of the oven, removing the old plank.

The roof now has folded ridge capping spanning the outer barge edges, extended
eave fascia/end returns, and a roof-pitch-matched flashing/collar with an actual
pipe hole. Targeted validation cleanup corrects opening-board topology, thin-detail
bevel triangles, tap end caps and seven UV-edge meshes without decimation.

The current GLB declares **88,386 triangles, 574 meshes, 574 nodes, and 25 materials**.
No geometry decimation was used. It uses the same extension types as Niva:
`KHR_materials_specular` and `KHR_materials_emissive_strength`. No extra decoder
is required. These are packaging facts, not proof of browser parity.

## Preset contract

`aster-presets.json` retains schema version 1 and the established finish groups.
Its top-level `poster` field is now omitted: no current poster is supplied. Runtime
integration must allow this omission rather than requesting the stale Blender PNG.

| Group | ID | Target | Base-color source | Roughness multiplier |
| --- | --- | --- | --- | --- |
| exterior | `natural-timber` | `ExteriorCladding` | Cached embedded default | 1.00 |
| exterior | `whitewashed-timber` | `ExteriorCladding` | External JPEG | 1.00 |
| exterior | `charred-black-oil` | `ExteriorCladding` | External JPEG | 0.86 |
| interior | `light-oak` | `InteriorJoinery` | Cached embedded default | 1.00 |
| interior | `warm-ash` | `InteriorJoinery` | External JPEG | 1.00 |
| interior | `dark-walnut` | `InteriorJoinery` | External JPEG | 0.92 |

Exterior targets only `Cladding_Front`, `Cladding_Rear`, `Cladding_LeftGable`, and
`Cladding_RightGable`, including their gable boards. Steps, landing boards, roof,
solar equipment, exterior doors/frames, gutters, flue and sconces are fixed.

Interior targets kitchen/upper-cupboard/storage/TV-console carcasses and fronts, bed
frame/headboard, bedside furniture, dining/desk tops, timber seating, and bathroom
door leaf **plus its two wooden jambs and header**. Lining, ceiling, floor,
upholstery, worktop, curtain, fixtures, appliances, glass, metal legs and lights are fixed.
The new front wardrobe, corner infill and wooden cupboard underside use `InteriorJoinery`.

### Runtime application rules

1. Load the GLB once and locate the exact target material names. Clone each target
   once per cabin instance if sharing cached GLTF materials; reuse the clone across
   every slot referencing that material, including array-valued material slots.
2. Cache each material's original map and baseline roughness before selection.
   The authored target roughness factor is 1. Keep exterior and interior state separate.
3. `embedded-default` restores the cached original map, never `null` or another
   texture request. External URIs resolve relative to the preset manifest.
4. External base-color maps use **`THREE.SRGBColorSpace` and `flipY = false`**.
   Inherit UV channel, wrapping, min/mag filters, anisotropy, repeat, offset, center,
   rotation, matrix and matrix-auto-update behavior from the original map.
5. Set roughness to `cachedBaselineRoughness * roughnessMultiplier`. Never multiply
   the currently selected roughness repeatedly. Keep existing normal/ORM maps
   non-color and retain normal strength, metalness, color factor and glass settings.
6. Change only the target map and roughness; never alter image data globally or
   tint all timber. Fixed step materials share the same base grain deliberately.
7. Cache external maps, protect each group against stale asynchronous completions,
   mark updates and invalidate demand rendering. Dispose only owned resources.

For the existing static exterior IDs, `wood`, `white`, and `black` map to
`natural-timber`, `whitewashed-timber`, and `charred-black-oil` respectively.

## Camera and presentation

The canonical camera is Aster-specific, using the primary reference's **1309 × 697**
aspect ratio. Its pose is approximately a 28-degree front-left product view.
`aster-camera.json` provides the retained starting view. The user will author the
final poster from the web renderer; there is no current Blender-poster parity claim.

- Blender: +Z up, -Y front. glTF: +Y up, +Z front.
- Ground-level footprint origin. Do not recenter or rescale the GLB on load.
- `matrix_world_blender`, `matrix_world_gltf`, and `projection_matrix` are row arrays.
- Preserve pose, lens, horizontal sensor fit, clipping and off-axis shifts.
- On resize, recompute projection with the documented sensor fit and shifts. Do
  not flatten row arrays directly into Three.js column-major storage.
- Capture the future web poster with its actual camera, lighting and selected
  finishes. Do not reuse the earlier Blender image for the revised asset.
- Transparent output is intended over the shared `#f7f5f0` page background.

Blender review uses Eevee, AgX Medium High Contrast, exposure 0, neutral studio
lights and local warm interior/fixture lights. The world is procedural constant
illumination; no HDRI is used. `aster-lighting.json` records these settings.

The prior olive ceiling appearance came from Material Preview's `forest.exr`, with
scene world/lights disabled. Revision 3 enables the neutral scene world and lights
in Blender viewports. Ceiling and walls already shared `FixedInteriorLining`; no
unlit material or emissive plaster workaround was added. Browser lighting remains
independent and still requires later user-authorized reconciliation.

The GLB excludes camera, lights, world and review staging. Retain the proven browser
lighting approach, then reconcile it after user approval. Do not blindly recreate
exterior sconces as unshadowed point lights: that leaks through cabin walls. The
emissive fixture geometry is exported; facade-pool overlays can follow Niva's
localized runtime treatment when browser work is authorized.

## Payload

| Payload | File bytes |
| --- | ---: |
| GLB | 8,088,464 |
| Camera + presets JSON | 7,720 |
| Default total (no poster) | **8,096,184** |
| Four optional finish JPEGs | **1,183,666** |
| Default plus all options (no poster) | **9,279,850** |

Seven default 1024 × 1024 images are embedded. Four alternative 1024 × 1024 JPEGs
remain external and load on demand. Source maps reuse Poly Haven `oak_veneer_01`
(Jenelle van Heerden) and `wood_floor` (Dimitrios Savva), CC0, with the established
material-only derivations. Palette names describe color tones, not verified species.

No lighting, reflections or camera imagery is baked into these maps. No HDRI or
extra supporting runtime request is necessary. Byte totals exclude HTTP compression,
the app, libraries and browser lighting resources. File size is not a performance test.

## Next gate

Stop for the user's inspection. **Do not run tests on the September 15 export without renewed
authorization.** The following validator/browser observations describe revision 6,
not the gutter-adjusted current export.
Retain the proven implicit tangent convention: Khronos reports 107 generated-tangent
portability warnings and 461 unused-UV informational notices, but zero errors.
Explicit Blender tangents were rejected because they produced invalid zero vectors.
The final GLB with loader-generated tangent handling passed the real browser checks.

The standalone test harness measured 568 draw calls and approximately 2.5 ms median
CPU render-submission time over an orbit, with 13 renderer textures after all
alternatives were used. These are desktop test-session metrics, not GPU/FPS/mobile
or production performance. Cached load times are not cold network benchmarks.
Production lighting, final public UI integration and a web-generated poster still
require their own approval. No Niva or public application files were changed.
