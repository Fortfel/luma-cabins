"""User-directed revision 3. Preserve live work before apply_revision(). No renders/tests.

Reproduction: initial build -> revise-layout.py -> this revision.
"""

import importlib.util
import json
import math
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('aster_layout', ROOT / 'scripts/revise-layout.py')
r = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r)
b = r.b
F = b.FLOOR


def fit_appliances():
    # Replace the detached tap rod with a hub/spindle/lever assembly intersecting
    # the main faucet body. Keep a real operating handle, not a floating cylinder.
    r.remove_prefixes('FaucetLever')
    b.cylinder('FaucetValveHub', (-0.61, 2.05, F + 1.03), (-0.555, 2.05, F + 1.03), 0.028, 'metal', vertices=24)
    b.cylinder('FaucetLeverSpindle', (-0.563, 2.05, F + 1.03), (-0.525, 2.05, F + 1.03), 0.014, 'metal', vertices=20)
    b.cylinder('FaucetLever', (-0.53, 2.05, F + 1.015), (-0.53, 2.05, F + 1.145), 0.010, 'metal', vertices=20)
    for poly in bpy.context.scene.objects['KitchenFaucet'].data.polygons:
        poly.use_smooth = True

    # A dedicated built-in bay beneath the existing centered cooktop replaces
    # the cabinet fronts that were previously visible behind the oven facade.
    r.remove_prefixes('Oven', 'KitchenCornerCabinet_Front_', 'KitchenCornerCabinet_Pull_')
    carcass = bpy.context.scene.objects['KitchenCornerCabinet_Carcass']
    b.cut(carcass, (0.33, 1.82, F + 0.525), (0.62, 0.80, 0.75))
    b.box('OvenBayLeftFiller', (-0.06, 1.502, F + 0.505), (0.14, 0.035, 0.79), 'joinery', bevel=0.003)
    b.box('OvenBayRightDoor', (0.913, 1.502, F + 0.505), (0.514, 0.035, 0.79), 'joinery', bevel=0.003)
    b.box('OvenBayRightDoorPull', (0.913, 1.476, F + 0.82), (0.16, 0.024, 0.018), 'frame', bevel=0.004)
    b.box('OvenChassis', (0.33, 1.81, F + 0.525), (0.594, 0.52, 0.73), 'dark', bevel=0.008)
    b.box('OvenFittedFrame', (0.33, 1.481, F + 0.525), (0.604, 0.045, 0.735), 'metal', bevel=0.006)
    b.box('OvenControlPanel', (0.33, 1.451, F + 0.823), (0.573, 0.018, 0.12), 'metal', bevel=0.005)
    b.box('OvenDoor', (0.33, 1.450, F + 0.448), (0.565, 0.021, 0.55), 'frame', bevel=0.009)
    b.box('OvenGlass', (0.33, 1.435, F + 0.418), (0.505, 0.009, 0.42), 'screen', bevel=0.01)
    b.box('OvenControlDisplay', (0.33, 1.438, F + 0.827), (0.13, 0.009, 0.043), 'screen', bevel=0.003)
    for x in (0.115, 0.545):
        b.cylinder('OvenDial_' + str(x), (x, 1.45, F + 0.827), (x, 1.42, F + 0.827), 0.026, 'frame', vertices=32)
        b.box('OvenDialMarker_' + str(x), (x, 1.417, F + 0.844), (0.003, 0.004, 0.012), 'metal', bevel=0.001)
        b.cylinder('OvenHandleMount_' + str(x), (x, 1.46, F + 0.683), (x, 1.395, F + 0.683), 0.010, 'metal', vertices=16)
    b.cylinder('OvenHandle', (0.09, 1.395, F + 0.683), (0.57, 1.395, F + 0.683), 0.013, 'metal', vertices=24)


def apply_revision():
    scene = bpy.context.scene
    if scene.name != 'Aster_Source' or scene.get('layout_revision') != 2:
        raise RuntimeError('Apply only to preserved Aster_Source revision 2.')
    r.setup()

    # The actual material already matches. Forest material-preview illumination was
    # overriding the authored world/lights and tinting the sloped surfaces olive.
    scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value = (0.8, 0.8, 0.8, 1)
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == 'VIEW_3D':
                shading = area.spaces.active.shading
                shading.use_scene_world = True
                shading.use_scene_lights = True
    for obj in scene.objects:
        if obj.type == 'MESH' and obj.name.startswith(('FixedCeiling_', 'Lining_', 'BathroomLeftPartition', 'BathroomFrontPartition')):
            obj.data.materials.clear()
            obj.data.materials.append(b.M['lining'])

    # Interior left-wall face is X=-3.975, not the outer shell at X=-4.2.
    # Table bounds become -3.915..-3.605: clear of both wall and bed.
    for obj in scene.objects:
        if obj.name in ('BedsideTop_-1', 'BedsideStem_-1', 'BedsideFoot_-1') or obj.name.startswith('BedsideLamp_'):
            obj.location.x += 0.045
    table = scene.objects['BedsideTop_-1']
    table.scale.x *= 0.155 / 0.19
    table.scale.y *= 0.155 / 0.19

    # One continuous L top reaches the actual partition face, with a timber infill
    # beneath it. This replaces the undersized rear top and separate return top.
    r.remove_prefixes('KitchenRearWorktop', 'KitchenReturnWorktop')
    outline = [(-1.11, 1.47), (0.655, 1.47), (0.655, 0.705),
               (1.34, 0.705), (1.34, 2.15), (-1.11, 2.15)]
    verts = [(x, y, z) for z in (F + 0.91, F + 0.95) for x, y in outline]
    faces = [tuple(range(5, -1, -1)), tuple(range(6, 12))]
    faces.extend((i, (i + 1) % 6, (i + 1) % 6 + 6, i + 6) for i in range(6))
    top = b.mesh('KitchenContinuousLWorktop', verts, faces, 'stone', 'ShallowInterior')
    b.cut(top, (-0.60, 1.78, F + 0.93), (0.53, 0.40, 0.30))
    b.box('KitchenCornerInfill', (1.255, 1.825, F + 0.505), (0.17, 0.61, 0.81), 'joinery', bevel=0.001)
    r.remove_prefixes('UnderCabinetDiffuser', 'KitchenUnderCabinetLight')
    b.box('KitchenUpperWoodenUnderside', (1.11, 1.37, 2.156), (0.20, 1.30, 0.013), 'joinery', bevel=0.002)

    b.plant('TVKitchenFlowerPlant', -1.365, 1.83, F, 0.70)
    petals = b.mat('FixedOchreFlowerPetals', (0.70, 0.38, 0.075), 0.85)
    for i in range(3):
        x, y, z = -1.365 + (i - 1) * 0.065, 1.83 + (i % 2) * 0.06, F + 1.05 + i * 0.09
        b.cylinder('FlowerStem_' + str(i), (-1.365, 1.83, F + 0.16), (x, y, z), 0.004, 'stem', vertices=8)
        for j in range(6):
            a = j * math.tau / 6
            bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=6, radius=1,
                                                location=(x + 0.026 * math.cos(a), y + 0.026 * math.sin(a), z))
            obj = bpy.context.object
            obj.scale = (0.029, 0.014, 0.009)
            bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
            obj.rotation_euler.z = a
            b.finish(obj, 'FlowerPetal_' + str((i, j)), petals, 'ShallowInterior')
        b.cylinder('FlowerCenter_' + str(i), (x, y, z - 0.003), (x, y, z + 0.011), 0.013, 'ceramic', vertices=12)

    # Retain drawer height; add one full drawer rather than compressing four into
    # the old case. Move the existing plant with the raised top.
    extra = 1.55 / 3
    body = scene.objects['WorkspaceStorage_Carcass']
    body.scale.z *= 4 / 3
    body.location.z += extra / 2
    for label in ('Front', 'Pull'):
        original = scene.objects['WorkspaceStorage_' + label + '_2']
        obj = original.copy()
        obj.data = original.data.copy()
        obj.name = 'WorkspaceStorage_' + label + '_3'
        obj.data.name = obj.name
        b.COLLECTIONS['ShallowInterior'].objects.link(obj)
        obj.location.z += extra
    for obj in scene.objects:
        if obj.name.startswith('WorkspacePlant_'):
            obj.location.z += extra

    # Back against front wall, doors face +Y into the room. Keep the full window
    # and main entrance opening clear on either side of the 0.90m case.
    r.cabinet('FrontWardrobe', 1.575, -1.79, 0.90, 0.50, 2.45, F + 0.07, math.pi)
    r.remove_prefixes('FrontWardrobe_Pull_')
    b.box('FrontWardrobePlinth', (1.575, -1.81, F + 0.035), (0.84, 0.43, 0.07), 'joinery')
    for sign in (-1, 1):
        x = 1.575 + sign * 0.065
        b.cylinder('FrontWardrobeKnobStem_' + str(sign), (x, -1.515, F + 1.08), (x, -1.48, F + 1.08), 0.010, 'joinery')
        b.cylinder('FrontWardrobeKnob_' + str(sign), (x, -1.487, F + 1.08), (x, -1.467, F + 1.08), 0.021, 'joinery', vertices=20)

    # Kitchen and toilet already align. Raise the desk aperture and its complete
    # frame/pane assembly 0.15m, rebuilding the wall rather than covering old holes.
    r.remove_prefixes('Cladding_RightGable', 'Lining_RightGable')
    r.wall('RightGable', 'y', b.HALF_X, b.DEPTH,
           [(0.70, 1.90, 1.55, 2.60), (-1.98, -0.78, 1.55, 2.60)], True)
    for obj in scene.objects:
        if obj.name.startswith('WorkspaceWindow_'):
            obj.location.z += 0.15

    fit_appliances()

    # No Blender poster is part of the current runtime contract. Older images
    # are preserved only as historical artifacts; the user will capture from web.
    presets = json.loads((ROOT / 'aster-presets.json').read_text(encoding='utf-8'))
    presets.pop('poster', None)
    (ROOT / 'aster-presets.json').write_text(json.dumps(presets, indent=2) + '\n', encoding='utf-8')
    scene['layout_revision'] = 3
    scene['asset_status'] = 'Revision 3; awaiting user inspection. No renders or tests. Poster deferred to web.'
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'aster-source.blend'))
    return {'revision': 3, 'status': scene['asset_status']}


if __name__ == '__main__':
    apply_revision()
