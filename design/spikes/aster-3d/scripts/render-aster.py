"""Produce current presentation images for the user's visual review, not a test suite.

The canonical image is the loading poster. The rear-right image exposes the two
secondary-reference windows. Neither image constitutes a validated full orbit.
"""

from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]


def render_review():
    scene = bpy.context.scene
    if scene.name != 'Aster_Source':
        raise RuntimeError('Select Aster_Source first.')
    camera = scene.camera
    pose = camera.matrix_world.copy()
    lens, sx, sy = camera.data.lens, camera.data.shift_x, camera.data.shift_y
    path = scene.render.filepath
    folder = ROOT / 'renders'
    folder.mkdir(exist_ok=True)
    try:
        scene.render.filepath = str(folder / 'aster-configurator-poster.png')
        bpy.ops.render.render(write_still=True)
        camera.location = (13.8, 26.0, 7.0)
        camera.rotation_euler = (Vector((0, 0, 2.4)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
        camera.data.lens, camera.data.shift_x, camera.data.shift_y = 74, 0, 0
        bpy.context.view_layer.update()
        scene.render.filepath = str(folder / 'aster-rear-right-review.png')
        bpy.ops.render.render(write_still=True)
    finally:
        camera.matrix_world = pose
        camera.data.lens, camera.data.shift_x, camera.data.shift_y = lens, sx, sy
        scene.render.filepath = path
        bpy.context.view_layer.update()
    return {'images': ['renders/aster-configurator-poster.png', 'renders/aster-rear-right-review.png'],
            'status': 'Presentation images only; visual approval pending.'}


if __name__ == '__main__':
    render_review()
