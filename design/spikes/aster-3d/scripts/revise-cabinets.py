"""Aster revision 4: fitted toilet door, aligned cupboards and furnished shelves.

Apply only to preserved revision 3. No renders, posters or tests.
"""

import importlib.util
import math
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('aster_layout', ROOT / 'scripts/revise-layout.py')
r = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r)
b = r.b


def top_of(obj):
    from mathutils import Vector
    return max((obj.matrix_world @ Vector(corner)).z for corner in obj.bound_box)


def paired_knobs(prefix, center_y, bottom, face_x, width):
    r.remove_prefixes(prefix + '_Pull_')
    # Doors remain closed/static, with opposing outer hinge edges and low knobs
    # adjacent to the meeting seam, matching the supplied paired-door reference.
    for sign in (-1, 1):
        y = center_y + sign * 0.055
        b.cylinder(prefix + '_KnobStem_' + str(sign), (face_x + 0.008, y, bottom + 0.085),
                   (face_x - 0.021, y, bottom + 0.085), 0.009, 'joinery', vertices=16)
        b.cylinder(prefix + '_Knob_' + str(sign), (face_x - 0.017, y, bottom + 0.085),
                   (face_x - 0.035, y, bottom + 0.085), 0.020, 'joinery', vertices=20)
        for z in (bottom + 0.12, bottom + 0.32):
            b.box(prefix + '_Hinge_' + str((sign, z)),
                  (face_x + 0.026, center_y + sign * (width / 2 - 0.035), z),
                  (0.026, 0.030, 0.045), 'metal', bevel=0.003)
    for index, side in ((0, 'left outer edge'), (1, 'right outer edge')):
        obj = bpy.context.scene.objects.get(prefix + '_Front_' + str(index))
        if obj:
            obj['hinge_side'] = side
            obj['pose'] = 'closed; static asset'


def shelf(name, x, y, width, top, rear=False):
    b.box(name, (x, y, top - 0.0225), (width, 0.30, 0.045), 'joinery', bevel=0.005)
    for sign in (-1, 1):
        xx = x + sign * width * 0.32
        wall_y = 2.075 if rear else -2.075
        b.box(name + '_WallBracket_' + str(sign), (xx, wall_y, top - 0.12),
              (0.027, 0.025, 0.18), 'frame', bevel=0.003)
        b.box(name + '_Support_' + str(sign), (xx, y, top - 0.055),
              (0.027, 0.27, 0.025), 'frame', bevel=0.003)


def apply_revision():
    scene = bpy.context.scene
    if scene.name != 'Aster_Source' or scene.get('layout_revision') != 3 or bpy.context.mode != 'OBJECT':
        raise RuntimeError('Use preserved Aster_Source revision 3 in Object mode.')
    r.setup()
    bpy.context.view_layer.update()

    # Existing frame clear opening: 0.827m wide, header underside Z=2.460m.
    # Use 3mm side/head reveals and 10mm floor clearance, with a real rebate stop
    # behind the leaf instead of an open strip through the header.
    door = scene.objects['BathroomDoorLeaf']
    door.scale.x *= 0.821 / 0.80
    door.scale.z *= 2.027 / 2.0
    door.location.z = (0.430 + 2.457) / 2
    for modifier in door.modifiers:
        if modifier.type == 'BEVEL':
            modifier.width = 0.0015
    for sign in (-1, 1):
        b.box('BathroomDoorStopJamb_' + str(sign), (2.15 + sign * 0.401, -0.115, 1.445),
              (0.027, 0.023, 2.03), 'joinery', bevel=0.001)
    b.box('BathroomDoorStopHead', (2.15, -0.115, 2.445), (0.827, 0.023, 0.030), 'joinery', bevel=0.001)

    top = top_of(scene.objects['FrontWardrobe_Carcass'])
    upper = scene.objects['KitchenUpperCabinets_Carcass']
    delta = top - top_of(upper)
    for obj in scene.objects:
        if obj.name.startswith(('KitchenUpperCabinets_', 'KitchenUpperWoodenUnderside')):
            obj.location.z += delta
    bottom = top - 0.74
    paired_knobs('KitchenUpperCabinets', 1.37, bottom, 0.9395, 1.40)

    fridge_top = top_of(scene.objects['FridgeBody'])
    cabinet_bottom = fridge_top + 0.025
    r.cabinet('FridgeTopCabinet', 1.00, 0.30, 0.69, 0.66,
              top - cabinet_bottom, cabinet_bottom, -math.pi / 2)
    paired_knobs('FridgeTopCabinet', 0.30, cabinet_bottom, 0.6345, 0.69)

    shelf_top = 2.28
    shelf('BedWallShelf', -2.75, -1.94, 1.45, shelf_top)
    r.books('BedShelfBooks', -3.07, -1.94, shelf_top, 3)
    b.cylinder('BedShelfVase', (-2.39, -1.94, shelf_top), (-2.39, -1.94, shelf_top + 0.18),
               0.056, 'ceramic', vertices=24, radius_top=0.028)
    shelf('TVWallShelf', -2.33, 1.94, 1.30, shelf_top, rear=True)
    r.books('TVShelfBooks', -2.66, 1.94, shelf_top, 2)
    b.plant('TVShelfPlant', -2.03, 1.94, shelf_top, 0.23)

    scene['layout_revision'] = 4
    scene['asset_status'] = 'Revision 4; awaiting user inspection. No renders, posters or tests.'
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'aster-source.blend'))
    return {'revision': 4, 'cabinet_top_z': top, 'shelf_top_z': shelf_top,
            'toilet_door_reveal_m': 0.003, 'status': scene['asset_status']}


if __name__ == '__main__':
    apply_revision()
