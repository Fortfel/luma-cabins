# Veyra revision 2 — layout and intersection corrections

Status: authored and exported, awaiting the user's inspection. No tests, GLB
round trip, validator, preset suite, orbit validation or browser checks ran.
No new renders were generated; initial images are stale historical files.

## Requested fixes

1. **Central landing:** replaced the long plank/platform with a 3.10 m-wide,
   0.80 m-deep landing centered on the relocated double doors, using fixed timber
   boards and a compact metal frame/four legs. It no longer reaches the right door.
2. **Downpipes:** replaced the twisted sweep sections with constant-bore hollow
   tubes and transported cross-section frames, rounded offsets, open shoes,
   annular clips and stand-offs clear of the cladding.
3. **Roof gutters:** integrated end caps into half-round gutter geometry; kept ends
   clear of barge trim, shortened the eave fascias and rebuilt the hanger geometry.
4. **Flue:** replaced the floating level-bottom collar with a roof-conforming boot
   and annular sloped flashing. The standing seam at the penetration is interrupted
   around the flashing. Original shaft and rain-cap position remain.
5. **Cups:** replaced capped ceramic bodies with hollow vessels and recessed coffee
   surfaces. Applies to both dining cups, coffee-table cup and new bedroom desk cup.
6. **Bedroom pillows/storage:** moved sage cushions upward and toward the foot so
   their bases meet the duvet rather than cutting through it. Shifted the bed set
   0.23 m toward the front to leave space for the office chair. Replaced the old
   wardrobe, picture and floor plant with a combined four-drawer/open-shelf/closed-
   wardrobe unit, furnished shelves and trailing plant. Added a desk, monitor with
   modeled display content, keyboard, mouse, task lamp, cup and swivel office chair.
7. **Bedroom entry/shelves/window:** shifted the internal door 0.72 m rearward
   (to Y=-0.80 m), removed the bench and added four furnished corner shelves.
   Interpreted the requested new window as the exterior rear wall above the desk,
   opposite the exterior bedroom entrance: 0.98 × 1.55 m, sill Z=1.30 m.
8. **Internal door intersections:** rebuilt bedroom and toilet liners, casing,
   leaves, stops and handles. Rear stops begin behind the leaf's rear face rather
   than overlapping it; leaf side/head reveals are approximately 3 mm. All wooden
   leaf/frame/casing/stop parts use `InteriorJoinery`.
9. **Living arrangement:** tucked the sofa into the front-left corner, moved its
   coffee table/props and rug to match, removed the laptop workspace, and shifted
   the media console/TV toward the rear-left corner.
10. **Larger toilet and front entrance:** moved the toilet front wall 0.80 m toward
    the front (Y=-0.20 m), keeping the enclosure empty and its opaque curtain.
    Shifted the table/chairs/pendants by X=-1.18 m, Y=+0.21 m. Moved the central
    exterior double doors 0.54 m left so their right edge is X=0.46 m, aligned with
    the left toilet-wall centerline. Rebuilt the wall openings, canopy/lamp position
    and landing to match. The bedroom exterior door and left-gable doors remain.
11. **Sink:** rebuilt the metal basin/rim as a continuous shell with a concealed
    oversized stone/carcass cutout. Rebuilt the tap using a curved constant-section
    sweep and moved the backsplash back to clear its stem.

## Source preservation and reproduction

Saved and live pre-edit sources, GLB, manifests, docs and images are preserved at
`history/before-revision-2-20260913-140824/`. Replaced objects remain hidden in
`Veyra_Archive_PreRevision2`, outside every runtime export collection.

The authoritative source is `veyra-source.blend / Veyra_Source`. Use it directly
for subsequent corrections. To reproduce from the initial source, load
`scripts/revise-layout.py` with `runpy.run_path(...)`, then call `prepare()`,
`exterior_layout()` and `interiors()` once each. Export using
`scripts/package-veyra.py`'s `export_delivery()` and `metadata()`.

Finish IDs/maps and the canonical product camera are retained. The optional poster
field is omitted until a revised poster is explicitly generated. Renders and
archived geometry are not part of the current runtime payload.
