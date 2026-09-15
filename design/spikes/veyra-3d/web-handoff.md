# Veyra configurator candidate handoff

## Status and review gate

**Revision 5 — authored and validated; final user visual approval pending.**
The user authorized checks, which ran through the `validate` subagent. Khronos
validation, saved-source/GLB round trip, sampled cabinet opening and fruit clearance,
all nine finish combinations, default restoration, orbit rendering and responsive
canonical camera checks passed. See [validation/README.md](./validation/README.md)
for exact reports, scope and non-blocking notices.

The initial Blender images remain stale. A single default kitchen authoring review
and browser validation captures were inspected, but no replacement poster or
user-facing finish-comparison photography was generated.

This is a fresh standalone Blender file created from an empty startup scene.
It contains Veyra only. Niva and Aster were read-only references for reusable
material bytes and contracts. Their source files and runtime assets were not edited.
No website files were changed or runtime assets copied into the app.

## Current delivery

Paths are relative to `design/spikes/veyra-3d/`.

| File | Purpose |
| --- | --- |
| `veyra-source.blend` | Authoritative packed editable source, scene `Veyra_Source` |
| `veyra-configurator.glb` | One geometry asset with Natural Timber / Light Oak defaults |
| `veyra-camera.json` | Canonical camera pose, projection, shifts and image dimensions |
| `veyra-presets.json` | Schema-version-1 independent exterior/interior finish contract |
| `finishes/textures/*.jpg` | Four on-demand alternative base-color maps |
| `revision-5.md` | Latest cabinet-access, handle and fruit correction record |
| `validation/README.md` | Hash-bound validation results, notices and reproduction |
| `veyra-lighting.json` | Authoring light/world intent, excluded from GLB |
| `veyra-delivery.json` | Current file accounting and declared geometry counts |
| `texture-sources.json` | Poly Haven CC0 provenance and derivations |
| `scripts/` and `textures/` | Independent reproduction scripts and local material sources |

Deploy only runtime files after review and authorization. `.blend1` is a prior
save; it is not the master. Review cameras, lights and world are excluded from GLB.
`Veyra_Archive_PreRevision2`, `Veyra_Archive_PreRevision3` and
`Veyra_Archive_PreRevision4` and `Veyra_Archive_PreRevision5` are hidden and excluded.
The most recent pre-edit saved/live source and delivery are preserved under
`history/before-revision-5-20260914-180111/`; the preceding backups remain.

The optional `poster` field is omitted from `veyra-presets.json`; integration must
not request the stale initial image. The files under `renders/` are historical.

## Architecture and interior

The user's clarification makes the exterior authoritative and supersedes the
inaccurate floor-plan reference. Inferred dimensions are 11.2 × 5.0 m, finished
floor 0.42 m, eaves 3.35 m and ridge 4.75 m. `56 m² · 1 Bedroom` remains the
product fact, not a certified measured net usable area.

- Four complete cladded elevations, standing-seam roof, ridge/barge flashings,
  eight front-slope solar modules, gutters, downpipes, foundation rails and feet.
- Front small window, central double doors and right single door; left-gable
  double doors. Static leaves have separate framing, hardware and rebates.
- Three lowered/thinner entrance canopies, a shortened 3.10 m central landing, and
  separate bedroom/gable steps. Central doors retain the revision-2 leftward shift
  and right edge X=0.46 m. The toilet is now wider, so that earlier wall alignment
  is superseded. No central stair is added.
- Left lounge with corner-positioned sofa, aligned coffee table/rug and media
  console shifted right to make room for the corner stove/hearth and straight flue.
  The old living-room workspace is removed. A front-wall wardrobe/open-shelf unit
  extends from near the bedroom partition toward the central double doors.
- Fitted L-shaped kitchen with continuous stone worktop/upstand, rear sink/drawers
  and oven/hob, a vertical access door plus three return drawers and a fitted fridge at the toilet-corner
  end. Sink/window move left, making space for a continuous corner upper-cabinet
  run. Fronts use small consistent reveals, a fitted sink false front and matching
  round wooden knobs. The tap/lever stay clear of the real wall and the basin is
  enclosed behind correctly placed fronts and hollow cabinet structure.
  The access leaf has an effective outboard hinge on the side away from the oven,
  with a deliberate 108 mm blind-corner filler. Its door/knob clearance was checked
  in 19 sampled poses across 0–90 degrees. It remains static in the GLB.
- The freezer face increases from 0.52 to 0.76 m in height, with a correspondingly
  shorter refrigerator face. The over-fridge cupboard has paired side-opening
  door intent, two wooden knobs and the same top as adjacent upper cupboards.
- Upper return knobs are now near the free edges: one viewer-left single door and
  a viewer-right pair, with the paired knobs beside their shared seam. Both fridge
  grips are on the viewer-left (+Y in Blender); the main grip is lower on its face.
- A widened 1.50 m top-only Roman blind covers the upper part of the relocated kitchen
  window. The stone upstand runs continuously around the corner to the fridge.
  Oven tea towel, two outlets, soap dispenser, chopping board, utensils, fruit bowl
  and coffee press provide close-view detail. The sink-side botanical arrangement
  is removed. Both outlets are on the return wall rather than one behind the oven.
  Fruit support height follows the bowl's inner surface, with independently checked
  fruit/bowl and fruit/fruit clearances.
- A 1.04 m-diameter timber table with two chairs and one pendant replaces the
  rectangular four-seat dining arrangement. The dining set is now 0.65 m closer
  to the sofa, and the room's freestanding floor plant is removed.
- Separate right bedroom with double bed, bedside storage,
  a rear-wall desk/monitor/keyboard/mouse/task lamp and a swivel office chair.
  The revised storage wall combines four drawers, open shelves, closed wardrobe
  doors and a trailing plant. The previous picture, floor plant and bench are gone;
  a full furnished shelf/drawer cabinet replaces the floating corner shelves and
  is now rotated onto the front exterior-door wall. The wardrobe plant is rebuilt
  with a hollow pot and vines passing over the edge, clear of cabinet geometry.
  The rug expands beneath both bedside units and the sage cushions are removed.
  A modeled acoustic guitar with strings, frets, tuners and a stand occupies the
  front-right corner beside the bedside unit.
- Rear-central toilet enclosure is **empty**: no toilet, basin, shower or furniture.
  Its front wall moves from Y=0.60 to Y=-0.20 m, increasing enclosure length by
  0.80 m. Its left wall now shifts a further 0.40 m left to X=0.06 m, and the front
  and left sides are a continuous L-shaped shell joined to the bedroom partition,
  removing the old stepped corner. Its door center moves to X=0.635 m near the left
  edge. The bedroom internal door retains Y=-0.80 m. Timber leaf/stop planes and
  small reveals remain separated.
  The toilet's rear window retains thick opaque pleated linen.
- Kitchen/toilet rear windows and the bedroom workspace window are present.
  The kitchen window center moves to X=-1.81 m, aligned with the relocated sink.
  The bedroom window is 0.98 × 1.55 m, sill Z=1.30 m, behind the desk. The right
  gable has no invented door or picture window. The original right-side service
  flue is removed; the new living stove has a continuous vertical pipe at
  Blender X=-4.93 m, Y=1.73 m, with matching roof boot/flashing.

Drainage uses constant-section hollow tubes, wall stand-offs and full-length
half-round gutters spanning X=-5.835 to +5.835 m, now closed with solid half-disc
end stops. Curved flush outlet flanges feed
sleeves beneath the trough instead of exposed pipe stubs. Folded drip aprons bridge
the roof edge to the outboard gutters; lowered canopies clear the gutter bottoms.
The new stove flue has roof-conforming flashing/boot and a local standing-seam
interruption. The previous right-side seam is restored.
Cups have real hollow ceramic interiors and separate recessed liquid surfaces.
The sink is a continuous metal basin/rim with larger concealed countertop/carcass
clearance. Its basin moves forward to leave a real faucet deck, eliminating the
old stem/wall overlap. Its cabinet fronts now extend to just beneath the countertop,
with a fitted false front and no solid carcass occupying the basin cavity. See
`revision-5.md` for the latest fix mapping.

Doors, drawers and appliances are static concept geometry. The interior is an
authored visualization, not a fully engineered building-services or circulation plan.

## Material and finish contract

| Group | ID | Material | Source | Roughness multiplier |
| --- | --- | --- | --- | ---: |
| exterior | `natural-timber` | `ExteriorCladding` | Cached embedded default | 1.00 |
| exterior | `whitewashed-timber` | `ExteriorCladding` | External JPEG | 1.00 |
| exterior | `charred-black-oil` | `ExteriorCladding` | External JPEG | 0.86 |
| interior | `light-oak` | `InteriorJoinery` | Cached embedded default | 1.00 |
| interior | `warm-ash` | `InteriorJoinery` | External JPEG | 1.00 |
| interior | `dark-walnut` | `InteriorJoinery` | External JPEG | 0.92 |

Exterior changes only `Cladding_Front`, `Cladding_Rear`, `Cladding_LeftGable`
and `Cladding_RightGable`. Roof, decks/steps, metal frames, canopies, gutters,
solar equipment, foundation and fixtures stay fixed.

Interior changes furniture and built-in timber: kitchen cabinetry and round wooden
knobs, fridge housing,
bedroom desk/storage/corner cabinet, front entry storage, dining/coffee tables, timber chairs, media console, bed
frame/headboard, wardrobe, bedside storage and wooden interior door leaves,
jambs, headers and stops. Wooden decorative frames, trays and chopping board use
the same joinery material. Walls, ceiling, floor, rugs, textiles, stone worktops,
appliances, glazing, non-wood hardware, plants, stove and lighting remain fixed.
Kitchen blind, striped oven towel, outlets, fruit and coffee press are fixed.
The guitar
is deliberately fixed instrument timber, using `FixedGuitarSpruce`,
`FixedGuitarWalnut` and `FixedGuitarFingerboard`; it does not follow joinery presets.
Its soundboard reuses the existing oak image bytes through a separate material.

### Runtime application

1. Load the GLB once. Locate the exact two material names; handle material arrays.
   Clone configurable materials once per independently configured cabin instance,
   reusing that clone across every matching slot.
2. Cache the original embedded base-color maps and baseline roughness. Keep the two
   selection states independent. The authored target roughness factor is 1.
3. `embedded-default` restores the cached original map, never `null` or a new download.
   Resolve external texture URIs relative to `veyra-presets.json`.
4. Replacement base-color maps use **`THREE.SRGBColorSpace` and `flipY = false`**.
   Inherit UV channel, wrapping, min/mag filters, anisotropy, repeat, offset, center,
   rotation, matrix and matrix-auto-update settings from the embedded original.
5. Assign `cachedBaselineRoughness * roughnessMultiplier`; never compound the
   current roughness. Preserve normal/ORM maps as non-color, normal strength,
   metalness, color factor, transparency, sidedness, emission and extensions.
6. Replace only the target material's map and roughness. Fixed deck timber shares
   the oak grain; never modify shared image data or tint all wood globally.
7. Cache alternatives, guard each group against stale asynchronous loads, mark
   changes updated and invalidate demand rendering. Dispose only owned resources.

Static showcase IDs map `wood` → `natural-timber`, `white` →
`whitewashed-timber`, `black` → `charred-black-oil`.

## Camera, poster and lighting

The Veyra-specific canonical front-left view uses the primary exterior's
**1358 × 553** aspect ratio, 73 mm lens, 36 mm horizontal sensor, shift X=0 and
shift Y=-0.012. Blender position is `[-14, -29, 5.65]`, target `[0, -0.15, 2.4]`.
The JSON records exact pose/projection and glTF-converted coordinates.

- Blender +Z up / -Y front; glTF +Y up / +Z front; meters, ground-centered origin.
- Do not recenter or rescale the GLB on load.
- Matrix fields are **row arrays**. Convert correctly for column-major Three.js
  APIs, retaining off-axis projection and horizontal sensor fit on resize.
- No current poster is supplied for revision 5. The retained initial poster is
  stale. Keep the canonical camera for a future transparent poster over `#f7f5f0`.
- Once browser integration is authorized, reconcile tone mapping, shadows, glass
  and lighting before producing the browser-captured replacement poster.
- Review uses Cycles, AgX Medium High Contrast, neutral studio lights and localized
  warm interior lights. There is no HDRI or camera/lighting bake in textures.
- Reuse the proven browser lighting conventions. Do not recreate exterior lamps
  as unshadowed point lights; the GLB includes emissive fixtures, not scene lights.

The isolated test harness initially let R3F overwrite the canonical projection.
It now uses manual camera management and asserts the actual world/projection
matrices after render, resize and orbit restoration. Both matrix errors were zero
in the final successful run. Retain this protection during integration; do not
continuously lock the camera pose while the user is intentionally orbiting.
Harness lighting demonstrates compatibility, not final Blender/WebGL pixel parity.

## Payload accounting

The current GLB is **13,385,892 bytes**, with **203,122 declared triangles,
584 meshes/nodes, 34 materials and seven embedded 1K images**. It uses
`KHR_materials_specular` and `KHR_materials_emissive_strength`; no compression
decoder was introduced. No decimation was performed.

Default GLB + camera/presets total **13,393,510 bytes**, with no poster. Four optional
1K JPEGs add **1,183,666 bytes**. File sizes and export declarations are not runtime
performance measurements. The browser test measured CPU render submission only;
physical-device GPU profiling has not been performed.

Source materials reuse Poly Haven `oak_veneer_01` (Jenelle van Heerden) and
`wood_floor` (Dimitrios Savva), CC0, with the established material-only derivations.
Default maps are embedded; only alternative base colors are external/on demand.
Finish names describe palette tones, not verified species. See the JSON manifests
for file identities, authors, URLs, resolutions and derivation details.

## Next action

Final user visual review and corrections. Asset/browser compatibility checks are
complete for the recorded hash; website integration and comparison photography
remain unperformed.
