"""Revision 8: separate gutter and roof-trim surfaces; no tests or renders."""

import importlib.util
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('aster_layout', ROOT / 'scripts/revise-layout.py')
r = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r)
b = r.b


def apply_revision():
    scene = bpy.context.scene
    if scene.name != 'Aster_Source' or scene.get('layout_revision') != 7:
        raise RuntimeError('Use preserved Aster_Source revision 7.')
    r.setup()
    # Retain the 8.94m length. Inner gutter edge becomes |Y|=2.571,
    # outside fascia |Y|=2.5625, so their solid surfaces no longer intersect.
    for sign in (-1, 1):
        scene.objects['Gutter_' + str(sign)].location.y = sign * 2.626
    for obj in scene.objects:
        if obj.name.startswith('EaveCornerReturn_'):
            sign = -1 if obj.location.y < 0 else 1
            obj.location.y = sign * 2.516
            obj.scale.y *= 0.092 / 0.13
        elif obj.name.startswith('BargeFlashing_'):
            # Slide 25mm up the same roof slope. The lower end clears the gutter;
            # the ridge end remains covered by the folded ridge cap.
            sign = -1 if obj.location.y < 0 else 1
            obj.location.y -= sign * 0.025
            obj.location.z += 0.025 * b.SLOPE
    for sign in (-1, 1):
        # A separate thin apron bridges over the small gutter/trim separation.
        # Bottom Z=3.315, above gutter crown Z=3.300, avoids new coincident faces.
        b.box('GutterDripApron_' + str(sign), (0, sign * 2.56, 3.3225),
              (8.94, 0.10, 0.015), 'roof', 'ExteriorDetails', bevel=0.001)
    r.remove_prefixes('DownpipeOffset_')
    for x, sign in ((-3.84, -1), (3.84, 1)):
        b.cylinder('DownpipeOffset_' + str(sign), (x, sign * 2.41, 3.19),
                   (x, sign * 2.626, 3.245), 0.034, 'frame', 'ExteriorDetails', 20)
    scene['layout_revision'] = 8
    scene['asset_status'] = 'Revision 8 gutter/trim separation; untested by user request.'
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'aster-source.blend'))
    return {'revision': 8, 'gutter_length_m': 8.94, 'gutter_inner_edge_abs_y': 2.571,
            'fascia_outer_edge_abs_y': 2.5625, 'status': scene['asset_status']}


if __name__ == '__main__':
    apply_revision()
