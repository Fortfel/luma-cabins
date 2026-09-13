"""Revision 5: close visible fridge surround gaps with fitted joinery. No tests/rendering."""

import importlib.util
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('aster_layout', ROOT / 'scripts/revise-layout.py')
r = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r)


def apply_revision():
    scene = bpy.context.scene
    if scene.name != 'Aster_Source' or scene.get('layout_revision') != 4:
        raise RuntimeError('Use preserved Aster_Source revision 4.')
    r.setup()
    b = r.b
    # Fridge side Y=.645, upper cupboard side Y=.670. Close the full-height slot
    # with a matching timber side panel, flush with the appliance front.
    b.box('FridgeFittedSidePanel', (0.9775, 0.6575, 1.68), (0.725, 0.025, 2.52),
          'joinery', bevel=0.001)
    # Base return starts farther away at Y=.710; extend its side to the surround.
    b.box('FridgeBaseReturnInfill', (1.00, 0.69, 0.875), (0.66, 0.04, 0.91),
          'joinery', bevel=0.001)
    # Fill the 25mm under-cupboard gap without changing the aligned cabinet tops.
    b.box('FridgeTopCabinetBottomInfill', (1.00, 0.30, 2.4725), (0.66, 0.69, 0.025),
          'joinery', bevel=0.001)
    # Front fascia hides the exposed chassis above the actual refrigerator door.
    # Retain only a 2mm face seam rather than the previous open slot.
    b.box('FridgeTopFittedFascia', (0.638, 0.30, 2.471), (0.050, 0.69, 0.048),
          'joinery', bevel=0.001)
    scene['layout_revision'] = 5
    scene['asset_status'] = 'Revision 5 fridge fit; awaiting user inspection. No renders or tests.'
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'aster-source.blend'))
    return {'revision': 5, 'status': scene['asset_status']}


if __name__ == '__main__':
    apply_revision()
