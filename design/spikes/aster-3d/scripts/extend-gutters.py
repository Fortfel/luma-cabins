"""Revision 7: extend both gutters to the revised fascia ends. No tests/renders."""

from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[1]


def apply_revision():
    scene = bpy.context.scene
    if scene.name != 'Aster_Source' or scene.get('layout_revision') != 6:
        raise RuntimeError('Use preserved Aster_Source revision 6.')
    # Gutters run along local Z, rotated onto world X. Their old 8.76m length
    # ended at +/-4.38m, while the revised fascia reaches +/-4.47m.
    for name in ('Gutter_-1', 'Gutter_1'):
        obj = scene.objects[name]
        if obj.data.users > 1:
            obj.data = obj.data.copy()
        for vertex in obj.data.vertices:
            vertex.co.z *= 8.94 / 8.76
        obj.data.update()
    scene['layout_revision'] = 7
    scene['asset_status'] = 'Revision 7 gutter extension; untested by user request. Revision 6 validation is historical.'
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'aster-source.blend'))
    return {'revision': 7, 'gutter_length_m': 8.94, 'extension_per_end_m': 0.09,
            'status': scene['asset_status']}


if __name__ == '__main__':
    apply_revision()
