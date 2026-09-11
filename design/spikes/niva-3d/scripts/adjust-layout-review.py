"""Apply the second user review to the existing source only. No export or render batch.

Also called by build-niva.py after constructing the preserved revision-1 baseline.
"""

import importlib.util
import json
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[1]


def apply(build):
    scene = bpy.context.scene
    root = bpy.data.objects.get('Niva')
    assert scene.name == 'Niva_Source' and root, 'Select the editable Niva source scene'
    if root.get('layout_review_revision') == 2:
        print('Layout review 2 already applied; no changes made')
        return
    required = ('WC_FrontPartition', 'WC_SidePartition', 'WC_ClosedDoor', 'Loft_FixedStructure',
                'Ceiling_PaintedPanels', 'Left_SideCladding', 'Right_SideCladding',
                'Rear_KitchenWindowCladding', 'Interior_RearLining', 'KitchenFront_0_0', 'KitchenFront_0_1')
    assert all(name in bpy.data.objects for name in required), 'Expected revision-1 objects are missing'

    def group(prefixes):
        return [obj for obj in scene.objects if obj.type == 'MESH' and obj.name.startswith(prefixes)]

    def affine(scale=(1, 1, 1), anchor=(0, 0, 0), offset=(0, 0, 0)):
        return (Matrix.Translation(Vector(anchor) + Vector(offset)) @
                Matrix.Diagonal((*scale, 1)) @ Matrix.Translation(-Vector(anchor)))

    def transform(objects, matrix):
        for obj in objects:
            obj.matrix_basis = matrix @ obj.matrix_basis

    def replace_box(name, location, dimensions, holes=()):
        old = bpy.data.objects[name]
        material = old.data.materials[0]
        collection = old.users_collection[0].name
        bpy.data.objects.remove(old, do_unlink=True)
        obj = build.box(name, location, dimensions, material, collection, bevel=0)
        for position, size in holes:
            build.cut(obj, position, size)
        obj.parent = root
        return obj

    # The sheets ended at +/-2.45, while the edge caps extend to +/-2.6125.
    transform(group(('Left_RoofPlane', 'Right_RoofPlane')), affine(scale=(1, 5.235 / 4.9, 1)))
    transform([bpy.data.objects[name] for name in ('Left_Gutter', 'Right_Gutter', 'RidgeCap')],
              affine(scale=(1, 2.615 / 2.48, 1)))

    # Old right-window head = 2.28 + 1.42/2 = 2.99. Align both small heads to it.
    transform(group(('Left_Window_', 'Rear_KitchenWindow_')), affine(offset=(0, 0, 0.31)))
    transform(group(('WC_OpaquePrivacyBlind', 'WC_BlindFold_', 'WC_BlindHeadrail')), affine(offset=(0, 0, 0.31)))
    transform(group(('Right_Window_',)), affine(scale=(1, 1, 1.62 / 1.42), anchor=(0, 0, 1.57)))
    for sign, side in ((-1, 'Left'), (1, 'Right')):
        y, z, width, height = (1.38, 2.59, 0.62, 0.80) if sign < 0 else (-0.86, 2.38, 1.25, 1.62)
        wall = replace_box(f'{side}_SideCladding', (sign * 1.77, 0, 2.175), (0.16, 4.5, 3.25),
                           [((sign * 1.85, y, z), (0.8, width, height))])
        build.project_uv(wall, side=True)
        replace_box(f'{side}_InteriorLining', (sign * 1.68, 0, 2.175), (0.04, 4.34, 3.25),
                    [((sign * 1.85, y, z), (0.9, width, height))])
    old = bpy.data.objects['Rear_KitchenWindowCladding']
    material = old.data.materials[0]
    bpy.data.objects.remove(old, do_unlink=True)
    rear = build.prism('Rear_KitchenWindowCladding', [(-1.85, 0.55), (1.85, 0.55), (1.85, 3.8),
                                                    (0, 6), (-1.85, 3.8)], 2.25, 0.16, material)
    build.cut(rear, (0.63, 2.25, 2.59), (0.66, 0.8, 0.8))
    build.project_uv(rear)
    rear.parent = root
    replace_box('Interior_RearLining', (0, 2.14, 2.17), (3.4, 0.055, 3.24),
                [((0.63, 2.25, 2.59), (0.66, 0.8, 0.8))])

    # Close the front partition and relocate the closed door to the +X-facing WC wall.
    replace_box('WC_FrontPartition', (-1.105, 0.65, 2.085), (1.23, 0.10, 3.01))
    door_scale = 2.42 / 2.155
    door_center_z = 0.5925 + (1.67 - 0.5925) * door_scale
    replace_box('WC_SidePartition', (-0.49, 1.41, 2.085), (0.10, 1.62, 3.01),
                [((-0.49, 1.08, door_center_z), (0.5, 0.77, 2.18 * door_scale))])
    rotation = (Matrix.Translation((-0.49, 1.08, 0)) @ Matrix.Rotation(1.5707963267948966, 4, 'Z') @
                Matrix.Translation((1.08, -0.65, 0)))
    transform(group(('WC_ClosedDoor', 'WC_DoorJamb_', 'WC_DoorHead', 'WC_HandleSpindle')), rotation)
    transform(group(('WC_ClosedDoor', 'WC_DoorJamb_', 'WC_DoorHead')),
              affine(scale=(1, 1, door_scale), anchor=(0, 0, 0.5925)))
    handle_z = bpy.data.objects['Front_DoubleDoor_Lever_1'].location.z
    for obj in group(('WC_HandleSpindle', 'WC_ClosedDoorLever')):
        obj.location.z = handle_z

    # Ladder plane is now YZ, close to the WC side wall and the kitchen's left edge.
    ladder_matrix = (Matrix.Translation((-0.33, 1.86, 0)) @ Matrix.Rotation(1.5707963267948966, 4, 'Z') @
                     Matrix.Diagonal((0.43 / 0.53, 1, 1, 1)) @ Matrix.Translation((0.12, -1.50, 0)))
    transform(group(('VerticalLadderRail_', 'VerticalLadderRung_')), ladder_matrix)
    bracket_material = bpy.data.materials['BlackFramesAndFixtures']
    for obj in group(('LadderBracket_',)):
        bpy.data.objects.remove(obj, do_unlink=True)
    for y in (1.645, 2.075):
        for z in (0.86, 3.32):
            bracket = build.cylinder(f'LadderBracketSide_{y}_{z}', (-0.44, y, z), (-0.33, y, z),
                                     0.012, bracket_material, 'ShallowInterior')
            bracket.parent = root
    holes = [((-0.145, 1.81, 3.64), (0.65, 0.60, 0.8)), ((1.60, -2.0, 3.64), (0.205, 0.205, 0.8))]
    replace_box('Loft_FixedStructure', (0, 0.03, 3.67), (3.33, 4.27, 0.15), holes)
    replace_box('Ceiling_PaintedPanels', (0, 0.03, 3.58), (3.31, 4.25, 0.028), holes)

    # Extend seating toward the now-solid WC front, retaining its front-door clearance.
    seating_scale = 2.53 / 2.08
    transform(group(('SofaBase', 'SofaBack', 'SofaArm_', 'SofaSeat', 'SofaFoot_', 'SofaAccentPillow')),
              affine(scale=(1, seating_scale, 1), anchor=(0, -1.98, 0)))
    transform(group(('LivingRug', 'RugWovenStripe_')),
              affine(scale=(2.22 / 2.02, 2.645 / 2.39, 1), anchor=(-0.43, -2.095, 0)))
    transform(group(('CoffeeTable', 'OpenBook', 'TableCandle', 'SofaWallArt', 'WallArtBotanicalLine_')),
              affine(offset=(0, 0.225, 0)))

    # Screenshot 2 identifies the two stacked under-sink fronts, not the wall shelves.
    front = bpy.data.objects['KitchenFront_0_0']
    material = front.data.materials[0]
    for name in ('KitchenFront_0_0', 'KitchenFront_0_1', 'KitchenPull_0_1'):
        bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)
    front = build.box('KitchenFront_0_FullHeight', (0.485, 1.539, 1.05375), (0.448, 0.038, 0.7225),
                      material, 'ShallowInterior', 0.004)
    build.project_uv(front)
    front.parent = root
    cabinet_scale = 0.97 / 0.85
    transform(group(('KitchenCabinetCarcass', 'KitchenFront_', 'KitchenPull_')),
              affine(scale=(1, 1, cabinet_scale), anchor=(0, 0, 0.60)))
    transform(group(('KitchenStoneWorktop', 'Sink', 'KitchenGooseneckFaucet', 'FaucetLever', 'KitchenSplashUpstand',
                     'KitchenInductionHob', 'HobRing', 'Kettle', 'KitchenChoppingBoard', 'KitchenHangingTeaTowel')),
              affine(offset=(0, 0, 0.12)))
    transform(group(('KitchenFloatingShelf_', 'KitchenShelfCup_')), affine(offset=(0, 0, 0.31)))

    bpy.context.view_layer.update()
    assert abs(bpy.data.objects['WC_ClosedDoorLever'].location.z - handle_z) < 1e-5
    root['layout_review_revision'] = 2
    root['review_status'] = 'Awaiting user Blender inspection; GLB and prior renders are stale'
    print(json.dumps({'revision': 2, 'wc_handle_z': handle_z, 'small_window_top_z': 2.99,
                      'right_window_top_z': 3.19, 'roof_sheet_half_length': 2.6175,
                      'wc_door_height': 2.42, 'countertop_raise': 0.12}))


if __name__ == '__main__':
    spec = importlib.util.spec_from_file_location('niva_build', ROOT / 'scripts/build-niva.py')
    build = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(build)
    apply(build)
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'niva.blend'))
