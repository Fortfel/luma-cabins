"""Author the door/kitchen revision in Niva_Source, preserving a dated backup.

Run in Blender with the current niva-final.blend open. This is an authoring and
delivery script, not a test suite. Superseded pieces remain in a hidden archive.
All new dimensions below are world-space metres (the Niva parent is scaled).
"""

import datetime
import hashlib
import json
import shutil
import struct
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[1]
WOOD = 'InteriorJoinery'
METAL = 'BlackFramesAndFixtures'
STONE = 'DarkStoneWorktop'
ARCHIVE = 'Archive_DoorsKitchen_PreRevision'


def box(name, bounds, material=WOOD, collection='ShallowInterior', bevel=0.003):
    low, high = (Vector(v) for v in bounds)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(low + high) / 2)
    obj = bpy.context.object
    obj.name = obj.data.name = name
    obj.scale = high - low
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for current in list(obj.users_collection):
        current.objects.unlink(obj)
    bpy.data.collections[collection].objects.link(obj)
    obj.data.materials.append(bpy.data.materials[material])
    world = obj.matrix_world.copy()
    obj.parent = bpy.data.objects['Niva']
    obj.matrix_world = world
    bpy.context.view_layer.update()
    uv = obj.data.uv_layers.active
    for face in obj.data.polygons:
        for index in face.loop_indices:
            co = obj.matrix_world @ obj.data.vertices[obj.data.loops[index].vertex_index].co
            if abs(face.normal.z) > 0.5:
                pair = (co.x, co.y)
            else:
                pair = (co.y if abs(face.normal.x) > 0.5 else co.x, co.z)
            uv.data[index].uv = (pair[0] / 1.83, pair[1] / 1.83)
    if bevel:
        mod = obj.modifiers.new('Small edge highlights', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
    return obj


def archive(obj):
    for current in list(obj.users_collection):
        current.objects.unlink(obj)
    bpy.data.collections[ARCHIVE].objects.link(obj)


def fit(obj, low, high):
    bpy.context.view_layer.update()
    points = [obj.matrix_world @ Vector(p) for p in obj.bound_box]
    old_low = Vector([min(p[i] for p in points) for i in range(3)])
    old_high = Vector([max(p[i] for p in points) for i in range(3)])
    scale = [(high[i] - low[i]) / (old_high[i] - old_low[i]) for i in range(3)]
    obj.matrix_world = (Matrix.Translation(Vector(low)) @ Matrix.Diagonal((*scale, 1))
                        @ Matrix.Translation(-old_low) @ obj.matrix_world)
    bpy.context.view_layer.update()


def move(obj, delta):
    obj.matrix_world = Matrix.Translation(Vector(delta)) @ obj.matrix_world


def pull(name, x, y, z, along_y=False):
    if along_y:
        box(name, ((x - 0.014, y - 0.12, z - 0.009), (x + 0.014, y + 0.12, z + 0.009)), METAL)
        for sign in (-1, 1):
            box(name + f'_Mount_{sign}', ((x, y + sign * 0.10 - 0.009, z - 0.009),
                                        (x + 0.045, y + sign * 0.10 + 0.009, z + 0.009)), METAL)
    else:
        box(name, ((x - 0.12, y - 0.014, z - 0.009), (x + 0.12, y + 0.014, z + 0.009)), METAL)
        for sign in (-1, 1):
            box(name + f'_Mount_{sign}', ((x + sign * 0.10 - 0.009, y, z - 0.009),
                                        (x + sign * 0.10 + 0.009, y + 0.045, z + 0.009)), METAL)


def doors():
    scene = bpy.context.scene
    fit(scene.objects['WC_ClosedDoor'], (-0.5684, 0.8416, 0.5925), (-0.5204, 1.7522, 3.0484))
    wc_header_opening()
    # Full-depth jamb liners and rear stops close the sightline behind the 4 mm reveal.
    for label, a, b in (('Hinge', 0.795, 0.8376), ('Latch', 1.7562, 1.799)):
        box('WC_RebatedLiner_' + label, ((-0.615, a, 0.58), (-0.49, b, 3.07)))
    box('WC_RebatedLiner_Head', ((-0.615, 0.795, 3.0524), (-0.49, 1.799, 3.09)))
    for label, a, b in (('Hinge', 0.825, 0.857), ('Latch', 1.737, 1.77)):
        box('WC_DoorStop_' + label, ((-0.594, a, 0.586), (-0.569, b, 3.065)), bevel=0.0015)
    box('WC_DoorStop_Head', ((-0.594, 0.825, 3.031), (-0.569, 1.77, 3.065)), bevel=0.0015)

    archive(scene.objects['Front_DoubleDoor_CentralMeetingStile'])
    for sign in (-1, 1):
        archive(scene.objects[f'Front_DoubleDoor_Lever_{sign}'])
        low, high = (-1.351, -0.003) if sign < 0 else (0.003, 1.351)
        prefix = f'Front_DoubleDoor_Leaf_{sign}'
        # Each leaf has its own 110 mm stiles, 100 mm top rail and 180 mm bottom rail.
        for label, a, b in (('OuterStile', low, low + 0.11), ('InnerStile', high - 0.11, high)):
            box(prefix + '_' + label, ((a, -2.814, 0.65), (b, -2.70, 3.17)), METAL, 'ExteriorDetails')
        box(prefix + '_TopRail', ((low + 0.11, -2.814, 3.07), (high - 0.11, -2.70, 3.17)), METAL, 'ExteriorDetails')
        box(prefix + '_BottomRail', ((low + 0.11, -2.814, 0.65), (high - 0.11, -2.70, 0.83)), METAL, 'ExteriorDetails')
        fit(scene.objects[f'Front_DoubleDoor_Glass_{sign}'],
            (low + 0.106, -2.766, 0.826), (high - 0.106, -2.754, 3.074))
        # Paired interior/exterior lever handles on long narrow escutcheons.
        x = sign * 0.061
        for face, y, direction in (('Outside', -2.823, -1), ('Inside', -2.691, 1)):
            box(prefix + '_' + face + '_Backplate', ((x - 0.021, y - 0.006, 1.58), (x + 0.021, y + 0.006, 1.84)), METAL, 'ExteriorDetails')
            end_y = y + direction * 0.058
            box(prefix + '_' + face + '_Spindle', ((x - 0.014, min(y, end_y), 1.735), (x + 0.014, max(y, end_y), 1.763)), METAL, 'ExteriorDetails')
            a, b = sorted((x - sign * 0.01, x + sign * 0.155))
            box(prefix + '_' + face + '_Lever', ((a, end_y - 0.014, 1.735), (b, end_y + 0.014, 1.763)), METAL, 'ExteriorDetails', 0.007)
            box(prefix + '_' + face + '_KeyCylinder', ((x - 0.008, y - 0.009, 1.627), (x + 0.008, y + 0.009, 1.651)), 'SinkDrainMetal', 'ExteriorDetails')
        outer_x = sign * 1.34
        for index, z in enumerate((0.99, 1.89, 2.86)):
            box(prefix + f'_Hinge_{index}', ((outer_x - 0.015, -2.837, z - 0.055), (outer_x + 0.015, -2.796, z + 0.055)), METAL, 'ExteriorDetails')
    door_seals()


def wc_header_opening():
    # The old partition opening ends below the timber header, exposing a painted
    # strip in front of the taller leaf. Raise those four reveal vertices only.
    obj = bpy.data.objects['WC_SidePartition']
    if obj.data.users > 1:
        obj.data = obj.data.copy()
    inverse = obj.matrix_world.inverted()
    for vertex in obj.data.vertices:
        world = obj.matrix_world @ vertex.co
        if abs(world.z - 3.02654) < 0.0001:
            world.z = 3.07
            vertex.co = inverse @ world
    obj.data.update()
    bpy.context.view_layer.update()


def door_seals():
    # Rear rebates occlude the working reveals without fusing the two door leaves.
    for name, low, high in (
        ('MeetingSeal', (-0.017, -2.699, 0.638), (0.017, -2.679, 3.18)),
        ('HeadStop', (-1.365, -2.699, 3.154), (1.365, -2.679, 3.185)),
        ('ThresholdStop', (-1.365, -2.699, 0.632), (1.365, -2.679, 0.666)),
        ('LeftStop', (-1.37, -2.699, 0.65), (-1.335, -2.679, 3.17)),
        ('RightStop', (1.335, -2.699, 0.65), (1.37, -2.679, 3.17)),
    ):
        box('Front_DoubleDoor_' + name, (low, high), METAL, 'ExteriorDetails', 0.001)


def kitchen():
    scene = bpy.context.scene
    for obj in list(scene.objects):
        if obj.name.startswith(('KitchenFloatingShelf_', 'KitchenShelfCup_', 'KitchenFront_2_', 'KitchenPull_2_')):
            archive(obj)
    # Rear worktop is retained with its real sink opening. The return joins at y=1.821.
    box('KitchenLReturn_Carcass', ((1.255, 0.49, 0.70), (1.877, 1.8732, 1.57)))
    box('KitchenLReturn_ToeKick', ((1.31, 0.49, 0.58), (1.855, 1.994, 0.72)), METAL)
    box('KitchenLReturn_Worktop', ((1.22, 0.475, 1.5695), (1.91, 1.825, 1.6145)), STONE)
    box('KitchenLReturn_Upstand', ((1.855, 0.475, 1.59), (1.90, 2.49, 1.75)), STONE)
    # Blind-corner cabinet: accessible door on the return, closed blank at rear.
    box('KitchenCorner_RearBlank', ((1.3507, 1.8252, 0.72), (1.8631, 1.8708, 1.5358)))
    box('KitchenCorner_AccessDoor', ((1.22, 1.18, 0.726), (1.251, 1.808, 1.536)))
    pull('KitchenCorner_AccessPull', 1.183, 1.48, 1.46, along_y=True)
    for index, (bottom, top) in enumerate(((1.29, 1.536), (1.01, 1.282), (0.726, 1.002))):
        box(f'KitchenLReturn_Drawer_{index}', ((1.22, 0.508, bottom), (1.251, 1.165, top)))
        pull(f'KitchenLReturn_Pull_{index}', 1.183, 0.835, top - 0.055, along_y=True)
    # Relocate the hob and kettle together off the blind-corner seam.
    for obj in list(scene.objects):
        if obj.name.startswith(('Kettle', 'HobRing')) or obj.name == 'KitchenInductionHob':
            move(obj, (0.08, -0.69, 0))

    # Fridge sits immediately aft of the right side window, clear of its reveal.
    box('KitchenFridge_Carcass', ((1.255, -0.17, 0.625), (1.869, 0.45, 2.64)), 'StoveCastIron', bevel=0.012)
    box('KitchenFridge_FreezerDoor', ((1.205, -0.159, 0.65), (1.259, 0.439, 1.25)), 'StoveCastIron', bevel=0.009)
    box('KitchenFridge_MainDoor', ((1.205, -0.159, 1.264), (1.259, 0.439, 2.625)), 'StoveCastIron', bevel=0.009)
    pull('KitchenFridge_FreezerHandle', 1.169, 0.14, 1.18, along_y=True)
    pull('KitchenFridge_MainHandle', 1.169, 0.14, 1.34, along_y=True)
    box('KitchenFridge_Platform', ((1.27, -0.155, 0.58), (1.86, 0.435, 0.63)), METAL)
    box('KitchenFridge_TallEndPanel', ((1.205, 0.457, 0.58), (1.891, 0.482, 3.12)))
    box('KitchenFridge_WindowEndPanel', ((1.24, -0.203, 0.58), (1.891, -0.178, 3.12)))
    box('KitchenFridge_OverheadCarcass', ((1.30, -0.176, 2.69), (1.887, 0.455, 3.12)))
    for index, (a, b) in enumerate(((-0.17, 0.133), (0.141, 0.45))):
        box(f'KitchenFridge_OverheadDoor_{index}', ((1.267, a, 2.696), (1.297, b, 3.114)))
        pull(f'KitchenFridge_OverheadPull_{index}', 1.228, (a + b) / 2, 2.75, along_y=True)

    # Upper cabinetry wraps the old mug-shelf corner without covering the rear window.
    box('KitchenUpperCorner_RearCarcass', ((1.115, 2.195, 2.35), (1.89, 2.529, 3.12)))
    box('KitchenUpperCorner_SideCarcass', ((1.555, 1.185, 2.35), (1.891, 2.195, 3.12)))
    box('KitchenUpperCorner_RearDoor', ((1.12, 2.162, 2.356), (1.551, 2.192, 3.114)))
    pull('KitchenUpperCorner_RearPull', 1.33, 2.126, 2.412)
    for index, (a, b) in enumerate(((1.194, 1.68), (1.688, 2.156))):
        box(f'KitchenUpperCorner_SideDoor_{index}', ((1.521, a, 2.356), (1.552, b, 3.114)))
        pull(f'KitchenUpperCorner_SidePull_{index}', 1.482, (a + b) / 2, 2.412, along_y=True)

    # Microwave on an open timber shelf beside the fridge, with a cupboard above.
    box('KitchenMicrowave_Shelf', ((1.285, 0.487, 2.00), (1.889, 1.18, 2.035)))
    box('KitchenMicrowave_EndPanel', ((1.285, 1.158, 2.035), (1.889, 1.18, 3.12)))
    box('KitchenMicrowave_UpperCarcass', ((1.555, 0.487, 2.56), (1.89, 1.158, 3.12)))
    box('KitchenMicrowave_UpperDoor', ((1.521, 0.493, 2.566), (1.552, 1.152, 3.114)))
    pull('KitchenMicrowave_UpperPull', 1.482, 0.823, 2.62, along_y=True)
    box('KitchenMicrowave_Body', ((1.365, 0.547, 2.052), (1.806, 1.107, 2.375)), 'StoveCastIron', bevel=0.008)
    box('KitchenMicrowave_Front', ((1.345, 0.555, 2.064), (1.366, 1.098, 2.365)), METAL)
    box('KitchenMicrowave_Window', ((1.338, 0.566, 2.091), (1.345, 0.974, 2.337)), 'StoveDoorGlass', bevel=0.006)
    box('KitchenMicrowave_Display', ((1.335, 1.008, 2.282), (1.342, 1.081, 2.326)), 'StoveDoorGlass')
    box('KitchenMicrowave_Handle', ((1.302, 0.937, 2.103), (1.337, 0.955, 2.321)), METAL)
    for index, z in enumerate((2.15, 2.212)):
        box(f'KitchenMicrowave_Button_{index}', ((1.331, 1.023, z), (1.343, 1.065, z + 0.025)), 'SinkDrainMetal')
    for index, y in enumerate((0.582, 1.067)):
        box(f'KitchenMicrowave_Foot_{index}', ((1.39, y, 2.035), (1.77, y + 0.023, 2.052)), METAL)


def sconces():
    for sign in (-1, 1):
        x = sign * 1.6926577
        box(f'SconceOpaqueBackplate_{sign}', ((x - 0.06, -2.824, 2.725), (x + 0.06, -2.785, 3.025)), METAL, 'ExteriorDetails')
        obj = bpy.data.objects[f'SconceReviewLight_{sign * 1.48}']
        obj.data.use_shadow = True
        # Aim the authored area down the exterior facade, away from the wall cavity.
        world = obj.matrix_world.copy()
        obj.rotation_mode = 'QUATERNION'
        direction = Vector((x, -3.02, 1.7)) - world.translation
        world = direction.to_track_quat('-Z', 'Y').to_matrix().to_4x4()
        world.translation = obj.matrix_world.translation
        obj.matrix_world = world


def author():
    scene = bpy.context.scene
    if scene.name != 'Niva_Source' or Path(bpy.data.filepath).resolve() != (ROOT / 'niva-final.blend').resolve():
        raise RuntimeError('Open the authoritative niva-final.blend / Niva_Source first')
    if ARCHIVE in bpy.data.collections:
        raise RuntimeError('Revision already authored; use export_delivery() to re-export')
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    backup = ROOT / 'validation' / ('before-doors-kitchen-' + datetime.datetime.now().strftime('%Y%m%d-%H%M%S'))
    backup.mkdir(parents=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(backup / 'niva-preserved.blend'), copy=True)
    for name in ('niva-configurator.glb', 'niva-configurator-delivery.json', 'README.md', 'web-handoff.md'):
        shutil.copy2(ROOT / name, backup / name)
    collection = bpy.data.collections.new(ARCHIVE)
    scene.collection.children.link(collection)
    collection.hide_render = True
    collection.hide_viewport = True
    doors()
    kitchen()
    sconces()
    root = scene.objects['Niva']
    root['doors_kitchen_revision'] = 1
    root['review_status'] = 'Door and L-kitchen revision authored; user testing pending'
    root['revision_backup'] = str(backup.relative_to(ROOT))
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'niva-final.blend'))
    return {'source': bpy.data.filepath, 'backup': str(backup), 'tests_run': False}


def unpack(path):
    data = path.read_bytes()
    length = struct.unpack_from('<I', data, 12)[0]
    return json.loads(data[20:20 + length]), data[28 + length:]


def view_bytes(document, binary, index):
    view = document['bufferViews'][index]
    start = view.get('byteOffset', 0)
    return binary[start:start + view['byteLength']]


def export_delivery():
    scene = bpy.context.scene
    backup = ROOT / scene.objects['Niva']['revision_backup']
    previous, old_binary = unpack(backup / 'niva-configurator.glb')
    old_images = {image['name']: (image, view_bytes(previous, old_binary, image['bufferView']))
                  for image in previous['images']}
    bpy.ops.object.select_all(action='DESELECT')
    for obj in scene.objects:
        if obj.type in {'MESH', 'EMPTY'} and not obj.hide_render and all(c.name != ARCHIVE for c in obj.users_collection):
            obj.select_set(True)
    raw_path = ROOT / 'validation/niva-doors-kitchen-full.glb'
    bpy.ops.export_scene.gltf(filepath=str(raw_path), export_format='GLB', use_selection=True,
                              export_apply=True, export_animations=False, export_cameras=False,
                              export_lights=False, export_extras=True, export_yup=True)
    document, source_binary = unpack(raw_path)
    replacements = {}
    # Reuse the delivered 1K texture payloads exactly; keep the editable source at 2K.
    for image in document['images']:
        name = image['name'].split('.jpg')[0].split('.png')[0]
        name = name.removesuffix('.002').removesuffix('.001')
        old, payload = old_images[name]
        image['name'] = old['name']
        image['mimeType'] = old['mimeType']
        replacements[image['bufferView']] = payload
    binary = bytearray()
    for index, view in enumerate(document['bufferViews']):
        binary.extend(b'\0' * (-len(binary) % 4))
        payload = replacements.get(index, view_bytes(document, source_binary, index))
        view['byteOffset'], view['byteLength'] = len(binary), len(payload)
        binary.extend(payload)
    document['buffers'][0]['byteLength'] = len(binary)
    encoded = json.dumps(document, separators=(',', ':')).encode()
    encoded += b' ' * (-len(encoded) % 4)
    binary.extend(b'\0' * (-len(binary) % 4))
    payload = (struct.pack('<4sII', b'glTF', 2, 28 + len(encoded) + len(binary))
               + struct.pack('<II', len(encoded), 0x4E4F534A) + encoded
               + struct.pack('<II', len(binary), 0x004E4942) + binary)
    (ROOT / 'niva-configurator.glb').write_bytes(payload)
    public = ROOT.parents[2] / 'apps/nextjs/public/niva-3d'
    shutil.copy2(ROOT / 'niva-configurator.glb', public / 'niva-configurator.glb')
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = scene.objects['KitchenLReturn_Worktop']
    scene.objects['KitchenLReturn_Worktop'].select_set(True)
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'niva-final.blend'))
    return {'glb_bytes': len(payload), 'meshes': len(document['meshes']), 'nodes': len(document['nodes']),
            'materials': len(document['materials']), 'images': len(document['images']),
            'triangles': sum(document['accessors'][p['indices']]['count'] // 3
                             for m in document['meshes'] for p in m['primitives']), 'tests_run': False}


def finish_metadata():
    """Update delivery accounting only. Posters are now owned/generated by the user."""
    document, _ = unpack(ROOT / 'niva-configurator.glb')
    filenames = ['niva-configurator.glb', 'niva-final.blend', 'niva-camera.json', 'niva-presets.json',
                 'renders/niva-configurator-poster.png']
    filenames.extend(str(p.relative_to(ROOT)).replace('\\', '/') for p in sorted((ROOT / 'finishes/textures').glob('*.jpg')))
    assets = {}
    for name in filenames:
        data = (ROOT / name).read_bytes()
        assets[name] = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
    texture_bytes = sum(value['bytes'] for name, value in assets.items() if name.startswith('finishes/'))
    default_bytes = sum(assets[name]['bytes'] for name in filenames[:5] if not name.endswith('.blend'))
    report = {
        'status': 'Roof grain, compact pulls and vertical fridge handles exported, including corner clearance and WC curtains; user testing pending',
        'editable_source': 'niva-final.blend', 'source_scene': 'Niva_Source', 'assets': assets,
        'revision_backup': bpy.data.objects['Niva']['revision_backup'],
        'model_triangles': sum(document['accessors'][p['indices']]['count'] // 3
                               for m in document['meshes'] for p in m['primitives']),
        'meshes': len(document['meshes']), 'nodes': len(document['nodes']),
        'materials': len(document['materials']), 'embedded_images': len(document['images']),
        'external_finish_images': len(filenames) - 5, 'all_four_finish_textures_bytes': texture_bytes,
        'default_glb_plus_poster_and_metadata_bytes': default_bytes,
        'all_presets_glb_plus_poster_and_metadata_bytes': default_bytes + texture_bytes,
        'one_geometry_asset_for_all_combinations': True,
        'camera_contract': 'niva-camera.json', 'preset_contract': 'niva-presets.json',
        'poster_source': 'Legacy Blender image from before the corner/curtain revision; retained unchanged',
        'poster_status': 'Stale reference; user will generate a replacement from the web',
        'poster_policy': 'Do not generate, sync or overwrite posters during Blender asset updates',
        'embedded_texture_source': 'Exact 1K/512px image payloads from the pre-revision configurator GLB',
        'historical_authoring_renders': ['renders/niva-kitchen-revision.png', 'renders/niva-wc-door-revision.png',
                                        'renders/niva-front-doors-revision.png'],
        'tests_run': False, 'browser_verification': 'Not run, user will test',
        'validation_note': 'Prior topology and six-preset review reports describe the older model, not this revision.',
        'lighting': {'blender': 'Opaque sconce backplates and exterior-directed shadow-casting area lights',
                     'runtime_fix_required': True,
                     'reason': 'Application-authored exterior point lights do not cast shadows; GLB geometry cannot enable renderer shadows',
                     'handoff': 'web-handoff.md#exterior-lamp-leak--runtime-action-required'},
    }
    (ROOT / 'niva-configurator-delivery.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    return report


if __name__ == '__main__':
    print(json.dumps(author(), indent=2))
    print(json.dumps(export_delivery(), indent=2))
