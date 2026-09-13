# Aster revision 7 — gutter length correction

The screenshot identified a real mismatch: gutter ends were at X=±4.38 m while
the extended fascia ended at X=±4.47 m. Both gutters are extended 90 mm at each end,
from 8.76 m to 8.94 m overall. Their cross-section, finish, height, downpipes and
the surrounding roof geometry are retained.

Current files: `aster-source.blend` / `Aster_Source` and `aster-configurator.glb`.
The prior source, runtime asset and metadata are preserved in
`history/before-gutter-extension-20260913-023446/`.

- Current GLB SHA-256: `6dfa6761c94adb0af3520d197eb728415071364648e886cf57ef0343555a2bcd`
- File size: 7,742,856 bytes (same size; geometry coordinates changed).
- Reproduction: run `scripts/extend-gutters.py` → `apply_revision()` on revision 6,
  then the normal export/metadata functions in `package-aster.py`.

**No tests, browser checks, renders or posters were run/generated**, as requested.
The revision 6 validation reports remain intact as historical evidence. Delivery
metadata explicitly marks them as not matching the current export; this is an
untested change, not a failed test result.
