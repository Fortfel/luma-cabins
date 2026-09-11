"""Correct corner clearance and replace the WC blind with pleated fabric.

Run with the current Niva_Source open. Preserves unsaved scene edits in a dated
backup before authoring. Does not render or publish posters, or run tests.
"""

import datetime
import importlib.util
import json
import math
import shutil
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('niva_doors_kitchen', ROOT / 'scripts/refine-doors-kitchen.py')
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)

DRAWER_X = (0.8246, 1.1246)
DRAWER_ROWS = ((1.29, 1.536), (1.01, 1.282), (0.726, 1.002))


def kitchen_clearance():
    scene = bpy.context.scene
    # Rest the board on the worktop, with at least 20 mm to either upstand.
    # The existing lean/rotation and grain are retained.
    base.move(scene.objects['KitchenChoppingBoard'], (-0.23, -0.035, -0.03046))
    center_x = sum(DRAWER_X) / 2
    for index, (bottom, top) in enumerate(DRAWER_ROWS):
        z = (bottom + top) / 2
        base.fit(scene.objects[f'KitchenFront_1_{index}'],
                 (DRAWER_X[0], 1.8252, bottom), (DRAWER_X[1], 1.87083, top))
        base.fit(scene.objects[f'KitchenPull_1_{index}'],
                 (center_x - 0.12, 1.766, z - 0.009), (center_x + 0.12, 1.794, z + 0.009))
        for sign in (-1, 1):
            base.box(f'KitchenPull_1_{index}_Mount_{sign}',
                     ((center_x + sign * 0.10 - 0.009, 1.78, z - 0.009),
                      (center_x + sign * 0.10 + 0.009, 1.832, z + 0.009)), base.METAL)
        # Match the existing return drawer reveals and center each pull in its face.
        y = (0.508 + 1.165) / 2
        base.fit(scene.objects[f'KitchenLReturn_Pull_{index}'],
                 (1.169, y - 0.12, z - 0.009), (1.197, y + 0.12, z + 0.009))
        for sign in (-1, 1):
            base.fit(scene.objects[f'KitchenLReturn_Pull_{index}_Mount_{sign}'],
                     (1.183, y + sign * 0.10 - 0.009, z - 0.009),
                     (1.228, y + sign * 0.10 + 0.009, z + 0.009))
    # A real fixed filler rather than another door hidden behind the perpendicular run.
    base.box('KitchenCorner_ClearanceFiller', ((1.1326, 1.8252, 0.726), (1.35, 1.87083, 1.536)))
    base.box('KitchenCorner_RearDrawerDivider', ((1.1326, 1.876, 0.72), (1.1526, 2.515, 1.558)))
    for name in ('KitchenCorner_AccessPull', 'KitchenCorner_AccessPull_Mount_-1', 'KitchenCorner_AccessPull_Mount_1'):
        base.move(scene.objects[name], (0, 0.014, 0))
    scene.objects['KitchenCorner_AccessDoor']['hinge_side'] = 'Near end, y=1.18; opens toward the clear aisle'
    scene.objects['KitchenCorner_ClearanceFiller']['purpose'] = '44.4 mm drawer-edge clearance to the closest return pull'


def curtain_panel(name, y_min, y_max, phase):
    # Seven softly rounded vertical pleats per panel; variable depth and a subtle
    # scalloped hem make the outside face read as fabric rather than rigid slats.
    across, down = 112, 16
    vertices, faces = [], []
    for row in range(down + 1):
        t = row / down
        for column in range(across + 1):
            u = column / across
            wave = 2 * math.pi * (7 * u + phase)
            amplitude = 0.014 + 0.013 * (1 - t)
            x = -1.838 + amplitude * (math.cos(wave) + 0.14 * math.cos(2 * wave + 0.3))
            x += 0.003 * math.sin(math.pi * t) * math.sin(3 * math.pi * u)
            y = y_min + (y_max - y_min) * u
            bottom = 2.125 + 0.006 * math.cos(wave)
            z = bottom + (3.045 - bottom) * t
            vertices.append((x, y, z))
    for row in range(down):
        for column in range(across):
            a = row * (across + 1) + column
            faces.append((a, a + 1, a + across + 2, a + across + 1))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.data.collections['ShallowInterior'].objects.link(obj)
    world = obj.matrix_world.copy()
    obj.parent = bpy.data.objects['Niva']
    obj.matrix_world = world
    mesh.materials.append(bpy.data.materials['WC_PleatedLinen'])
    uv = mesh.uv_layers.new(name='UVMap')
    for face in mesh.polygons:
        face.use_smooth = True
        for index in face.loop_indices:
            vertex = mesh.loops[index].vertex_index
            uv.data[index].uv = ((vertex % (across + 1)) / across, (vertex // (across + 1)) / down)
    skin = obj.modifiers.new('Opaque fabric thickness and closed hems', 'SOLIDIFY')
    skin.thickness = 0.002
    skin.offset = 0
    skin.use_rim = True
    # Keep both sides physically present so outside views do not rely on backface hacks.
    obj['privacy'] = 'Closed fabric panels, opaque, with an overlapping center seam'
    return obj


def curtains():
    for obj in list(bpy.context.scene.objects):
        if obj.name == 'WC_OpaquePrivacyBlind' or obj.name.startswith('WC_Blind'):
            base.archive(obj)
    material = bpy.data.materials['OpaqueFlaxPrivacyBlind'].copy()
    material.name = 'WC_PleatedLinen'
    material.diffuse_color = (0.72, 0.695, 0.635, 1)
    shader = material.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = material.diffuse_color
    shader.inputs['Roughness'].default_value = 0.94
    shader.inputs['Metallic'].default_value = 0
    # Standard opaque PBR: folds provide the appearance without a new texture or extension.
    curtain_panel('WC_Curtain_LeftPanel', 1.20, 1.667, 0)
    # Continue the wave through the overlap, with separate depth, avoiding cloth intersections.
    phase = (7 * (1.647 - 1.20) / (1.667 - 1.20)) % 1
    right = curtain_panel('WC_Curtain_RightPanel', 1.647, 2.114, phase)
    base.move(right, (0.012, 0, 0))
    base.box('WC_Curtain_Track', ((-1.862, 1.18, 3.052), (-1.812, 2.134, 3.083)), base.METAL)
    for index, y in enumerate((1.23, 2.084)):
        base.box(f'WC_Curtain_TrackBracket_{index}', ((-1.911, y - 0.015, 3.059),
                                                   (-1.815, y + 0.015, 3.078)), base.METAL)
    for index in range(14):
        y = 1.217 + index * 0.068
        base.box(f'WC_Curtain_HeaderTab_{index}', ((-1.842, y - 0.009, 3.031),
                                                (-1.819, y + 0.009, 3.056)), material.name, bevel=0.001)


def author():
    scene = bpy.context.scene
    root = scene.objects.get('Niva')
    if scene.name != 'Niva_Source' or not root or Path(bpy.data.filepath).resolve() != (ROOT / 'niva-final.blend').resolve():
        raise RuntimeError('Open niva-final.blend / Niva_Source first')
    if root.get('kitchen_clearance_revision'):
        raise RuntimeError('Corner/curtain revision is already authored')
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    backup = ROOT / 'validation' / ('before-corner-curtains-' + datetime.datetime.now().strftime('%Y%m%d-%H%M%S'))
    backup.mkdir(parents=True)
    # Preserve both current in-memory work and the last saved disk version.
    shutil.copy2(ROOT / 'niva-final.blend', backup / 'niva-before-session.blend')
    bpy.ops.wm.save_as_mainfile(filepath=str(backup / 'niva-preserved.blend'), copy=True)
    for filename in ('niva-configurator.glb', 'niva-configurator-delivery.json', 'README.md', 'web-handoff.md'):
        shutil.copy2(ROOT / filename, backup / filename)
    kitchen_clearance()
    curtains()
    # Overlapping timber soffit closes the upper reveal in a straight-on view.
    base.box('WC_HeaderRevealCover', ((-0.525, 0.833, 3.0495), (-0.446, 1.76, 3.078)), bevel=0.001)
    root['revision_backup'] = str(backup.relative_to(ROOT))
    root['kitchen_clearance_revision'] = 1
    root['review_status'] = 'Corner clearance and pleated curtains authored; user testing pending'
    root['poster_policy'] = 'User generates posters from the web; do not render or overwrite posters'
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'niva-final.blend'))
    return {'backup': str(backup), 'source': bpy.data.filepath}


if __name__ == '__main__':
    print(json.dumps(author(), indent=2))
    print(json.dumps(base.export_delivery(), indent=2))
    print(json.dumps(base.finish_metadata(), indent=2))
