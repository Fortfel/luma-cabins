# Aster revision 8 — nonintersecting gutter/trim join

The extended gutter body overlapped the eave corner return/fascia, with end faces
nearly on the same X plane. The screenshot showed the trim cutting across the
gutter's end disk. This is a geometry join issue, not a finish-texture replacement.

## Correction

- Keep both gutters at 8.94 m overall length.
- Move each centerline outward from |Y|=2.565 to 2.626 m. The inner gutter edge
  becomes |Y|=2.571, outside the fascia edge at |Y|=2.5625.
- Reduce each corner return's outward projection to |Y|=2.562.
- Slide each barge flashing 25 mm toward the ridge along the existing roof slope;
  its lower end clears the gutter while its upper end remains under the ridge cap.
- Add two thin drip aprons above the separation. Their bottoms are at Z=3.315,
  above the gutter crown at Z=3.300, so the new pieces do not cut into the gutter.
- Rebuild the two downpipe offsets to meet the new gutter centerlines.

These are authored dimensions, not post-change validation results. No unrelated
architecture, finish textures, camera contract or Niva asset was changed.

## Delivery

- `aster-source.blend`, `Aster_Source`, revision 8.
- `aster-configurator.glb`: 7,758,360 bytes.
- SHA-256: `b8531f903d1186600a24ccd891d5ba496b28f5b51ab740de9ab2f4801c9385e0`.
- 74,082 declared triangles, 570 meshes/nodes, 25 materials.
- Reproduction: `scripts/resolve-gutter-join.py` → `apply_revision()` after revision 7.
- Prior state preserved in `history/before-gutter-join-20260913-025521/`.

**No tests, renders, posters or browser checks ran, as requested.** Revision 6
reports remain historical and are explicitly marked as not matching this export
in `aster-delivery.json`. Current visual inspection is left to the user.
