"""Apply independent finish presets and validate the one updated GLB in Blender."""

import hashlib
import json
import math
import shutil
import time
from pathlib import Path

import bmesh
import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = json.loads((ROOT / 'niva-presets.json').read_text(encoding='utf-8'))
CAMERA = json.loads((ROOT / 'niva-camera.json').read_text(encoding='utf-8'))
RENDER_DIR = ROOT / 'renders/finishes'
REVIEW_SCENE = 'Niva_FinishReview'
MODEL_COLLECTIONS = ('Architecture', 'Glazing', 'ExteriorDetails', 'ShallowInterior')
QUEUE = []
SOURCE = None
REVIEW = None
BINDINGS = {}
SOURCE_BINDINGS = {}
FIXED = {}
SLOTS = None
TOTAL = 0
STARTED = 0
REPORT = {}


def materials(scene):
    return {material for obj in scene.objects if obj.type == 'MESH' for material in obj.data.materials if material}


def fingerprint(material):
    inputs, images, links = [], [], []
    for node in material.node_tree.nodes:
        if node.type == 'TEX_IMAGE':
            images.append((node.name, node.image.name if node.image else None))
        for socket in node.inputs:
            if hasattr(socket, 'default_value'):
                value = socket.default_value
                if isinstance(value, (int, float, str, bool)):
                    inputs.append((node.name, socket.name, value))
                elif hasattr(value, '__len__'):
                    inputs.append((node.name, socket.name, list(value)))
    links = [(link.from_node.name, link.from_socket.name, link.to_node.name, link.to_socket.name)
             for link in material.node_tree.links]
    return hashlib.sha256(json.dumps([inputs, images, links], sort_keys=True).encode()).hexdigest()


def bind(scene):
    result = {}
    scene_materials = materials(scene)
    for group, definition in MANIFEST['groups'].items():
        name = definition['material']
        matches = [material for material in scene_materials if material.name == name or material.name.startswith(name + '.')]
        assert len(matches) == 1, (name, [material.name for material in matches])
        material = matches[0]
        shader = next(node for node in material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
        image_node = shader.inputs['Base Color'].links[0].from_node
        assert image_node.type == 'TEX_IMAGE'
        original = bpy.data.images.get(material.get('niva_default_image', '')) or image_node.image
        material['niva_default_image'] = original.name
        roughness = material.node_tree.nodes.get('Niva Finish Roughness')
        if not roughness:
            rough_input = shader.inputs['Roughness']
            original_link = rough_input.links[0].from_socket if rough_input.is_linked else None
            original_value = rough_input.default_value
            roughness = material.node_tree.nodes.new('ShaderNodeMath')
            roughness.name = 'Niva Finish Roughness'
            roughness.operation = 'MULTIPLY'
            if original_link:
                material.node_tree.links.new(original_link, roughness.inputs[0])
            else:
                roughness.inputs[0].default_value = original_value
            roughness.inputs[1].default_value = 1
            material.node_tree.links.new(roughness.outputs[0], rough_input)
        result[group] = {'material': material, 'image_node': image_node, 'original_image': original,
                         'roughness': roughness, 'normal_link': shader.inputs['Normal'].links[0].from_node.as_pointer()}
    return result


def set_finish(bindings, group, identifier):
    preset = next(item for item in MANIFEST['groups'][group]['presets'] if item['id'] == identifier)
    other = 'interior' if group == 'exterior' else 'exterior'
    other_before = fingerprint(bindings[other]['material'])
    binding = bindings[group]
    texture = preset['baseColorTexture']
    if texture['source'] == 'embedded-default':
        image = binding['original_image']
    else:
        image = bpy.data.images.load(str(ROOT / texture['uri']), check_existing=True)
        image.colorspace_settings.name = 'sRGB'
        image.pack()
    binding['image_node'].image = image
    binding['roughness'].inputs[1].default_value = preset['roughnessMultiplier']
    shader = next(node for node in binding['material'].node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
    assert shader.inputs['Normal'].links[0].from_node.as_pointer() == binding['normal_link']
    assert fingerprint(bindings[other]['material']) == other_before


def apply_choices(scene, exterior='natural-timber', interior='light-oak'):
    bindings = bind(scene)
    set_finish(bindings, 'exterior', exterior)
    set_finish(bindings, 'interior', interior)


def canonical(camera):
    camera.matrix_world = Matrix(CAMERA['matrix_world_blender'])
    camera.data.lens, camera.data.sensor_width = CAMERA['lens_mm'], CAMERA['sensor_width_mm']
    camera.data.shift_x, camera.data.shift_y = CAMERA['shift_x'], CAMERA['shift_y']
    camera.data.clip_start, camera.data.clip_end = CAMERA['near'], CAMERA['far']


def view(camera, name):
    if name == 'canonical':
        canonical(camera)
    elif name == 'handle-detail':
        camera.location = (0.70, -1.02, 1.63)
        target = Vector((1.16, -1.98, 1.17))
        camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
        camera.data.lens, camera.data.shift_x, camera.data.shift_y = 52, 0, 0
    else:
        angle = {'left-three-quarter': -65, 'right-three-quarter': 35, 'rear': 180}[name]
        theta, phi = math.radians(angle), math.radians(5.5)
        target = Vector((0, -0.5, 2.96))
        camera.location = target + Vector((math.sin(theta) * math.cos(phi), -math.cos(theta) * math.cos(phi), math.sin(phi))) * 20.5
        camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
        camera.data.lens, camera.data.shift_x, camera.data.shift_y = 64, 0, 0


def geometry_slots(scene):
    return sorted((obj.name, obj.data.as_pointer(), tuple(mat.name if mat else None for mat in obj.data.materials))
                  for obj in scene.objects if obj.type == 'MESH')


def begin():
    global SOURCE, REVIEW, BINDINGS, SOURCE_BINDINGS, FIXED, SLOTS, QUEUE, TOTAL, STARTED, REPORT
    assert not QUEUE and REVIEW_SCENE not in bpy.data.scenes
    SOURCE = bpy.data.scenes['Niva_Source']
    assert bpy.data.objects['Niva'].get('configurator_handle_fixed'), 'Open niva-configurator.blend, not the old source'
    RENDER_DIR.mkdir(parents=True, exist_ok=True)
    SOURCE_BINDINGS = bind(SOURCE)
    # Store all authored maps in the editable file without changing its default material selection.
    for group, definition in MANIFEST['groups'].items():
        for preset in definition['presets']:
            set_finish(SOURCE_BINDINGS, group, preset['id'])
        set_finish(SOURCE_BINDINGS, group, definition['default'])
    text = bpy.data.texts.get('Niva Runtime Finish Presets') or bpy.data.texts.new('Niva Runtime Finish Presets')
    text.clear()
    text.write(json.dumps(MANIFEST, indent=2))

    REVIEW = SOURCE.copy()
    REVIEW.name = REVIEW_SCENE
    for collection in list(REVIEW.collection.children):
        if collection.name in (*MODEL_COLLECTIONS, 'ReviewStaging'):
            REVIEW.collection.children.unlink(collection)
    camera = SOURCE.camera.copy()
    camera.data = SOURCE.camera.data.copy()
    camera.name = 'FinishReviewCamera'
    REVIEW.collection.objects.link(camera)
    REVIEW.camera = camera
    if bpy.context.window:
        bpy.context.window.scene = REVIEW
    with bpy.context.temp_override(scene=REVIEW, view_layer=REVIEW.view_layers[0], collection=REVIEW.collection):
        bpy.ops.import_scene.gltf(filepath=str(ROOT / 'niva-configurator.glb'))
    REVIEW.view_layers[0].update()
    BINDINGS = bind(REVIEW)
    targets = {binding['material'] for binding in BINDINGS.values()}
    FIXED = {material: fingerprint(material) for material in materials(REVIEW) if material not in targets}
    SLOTS = geometry_slots(REVIEW)
    invalid, triangles = [], 0
    meshes = [obj for obj in REVIEW.objects if obj.type == 'MESH']
    for obj in meshes:
        obj.data.calc_loop_triangles()
        triangles += len(obj.data.loop_triangles)
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bad = any(face.calc_area() < 1e-12 for face in bm.faces) or bm.calc_volume(signed=True) < -1e-8
        bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-6)
        if bad or any(not edge.is_manifold for edge in bm.edges):
            invalid.append(obj.name)
        bm.free()
    assert not invalid, invalid
    handle = next(obj for obj in meshes if obj.name.startswith('StoveDoorHandle'))
    frame = next(obj for obj in meshes if obj.name.startswith('StoveDoorFrame'))
    trees = []
    components = 0
    for obj in (handle, frame):
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-6)
        if obj == handle:
            remaining = set(bm.verts)
            while remaining:
                components += 1
                stack = [remaining.pop()]
                while stack:
                    vertex = stack.pop()
                    for edge in vertex.link_edges:
                        other = edge.other_vert(vertex)
                        if other in remaining:
                            remaining.remove(other)
                            stack.append(other)
        bm.transform(obj.matrix_world)
        trees.append(BVHTree.FromBMesh(bm))
        bm.free()
    contacts = len(trees[0].overlap(trees[1]))
    assert components == 1 and contacts > 0, (components, contacts)
    canonical(camera)
    bpy.context.view_layer.update()
    kitchen = [obj for obj in meshes if obj.name.startswith('KitchenFront_')]
    points = [world_to_camera_view(REVIEW, camera, obj.matrix_world @ Vector(corner)) for obj in kitchen for corner in obj.bound_box]
    roi = [round(min(p.x for p in points) * 954), round((1 - max(p.y for p in points)) * 866),
           round(max(p.x for p in points) * 954), round((1 - min(p.y for p in points)) * 866)]
    REPORT = {'asset': 'niva-configurator.glb', 'mesh_count': len(meshes), 'triangles': triangles,
              'invalid_meshes': invalid, 'handle_connected_components': components, 'handle_frame_contact_pairs': contacts,
              'kitchen_roi_pixels': roi, 'fixed_materials': sorted(material.name for material in FIXED),
              'target_materials': {group: binding['material'].name for group, binding in BINDINGS.items()},
              'material_assignments_unchanged': True, 'independent_selection_checks': True, 'renders': []}
    cases = []
    for group, definition in MANIFEST['groups'].items():
        for preset in definition['presets']:
            exterior = preset['id'] if group == 'exterior' else 'natural-timber'
            interior = preset['id'] if group == 'interior' else 'light-oak'
            cases.append((group + '-' + preset['id'], exterior, interior))
    QUEUE = [(case, exterior, interior, angle) for case, exterior, interior in cases
             for angle in ('canonical', 'left-three-quarter', 'right-three-quarter', 'rear')]
    QUEUE.extend([('combined-white-walnut', 'whitewashed-timber', 'dark-walnut', 'canonical'),
                  ('combined-black-ash', 'charred-black-oil', 'warm-ash', 'canonical'),
                  ('handle', 'natural-timber', 'light-oak', 'handle-detail')])
    TOTAL, STARTED = len(QUEUE), time.monotonic()
    if bpy.app.background:
        while QUEUE:
            render_next()
        render_next()
    else:
        bpy.app.timers.register(render_next, first_interval=0.1)
    print('Finish review scheduled/completed:', TOTAL)


def render_next():
    if not QUEUE:
        set_finish(BINDINGS, 'exterior', 'natural-timber')
        set_finish(BINDINGS, 'interior', 'light-oak')
        canonical(REVIEW.camera)
        if bpy.context.window:
            bpy.context.window.scene = SOURCE
        shutil.copyfile(RENDER_DIR / 'exterior-natural-timber-canonical.png', ROOT / 'renders/niva-configurator-poster.png')
        REPORT.update(state='complete', elapsed_seconds=time.monotonic() - STARTED)
        (ROOT / 'validation/finish-review.json').write_text(json.dumps(REPORT, indent=2), encoding='utf-8')
        (ROOT / 'validation/finish-progress.json').write_text(json.dumps({'state': 'complete', 'completed': TOTAL, 'total': TOTAL}), encoding='utf-8')
        bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'niva-finishes.blend'))
        return None
    case, exterior, interior, angle = QUEUE.pop(0)
    try:
        set_finish(BINDINGS, 'exterior', exterior)
        set_finish(BINDINGS, 'interior', interior)
        assert all(fingerprint(material) == value for material, value in FIXED.items()), 'A fixed material changed'
        assert geometry_slots(REVIEW) == SLOTS, 'Geometry or material assignments changed'
        view(REVIEW.camera, angle)
        REVIEW.render.resolution_x, REVIEW.render.resolution_y = 954, 866
        REVIEW.render.resolution_percentage = 100
        REVIEW.eevee.taa_render_samples = 96
        REVIEW.render.film_transparent = True
        REVIEW.render.image_settings.file_format = 'PNG'
        REVIEW.render.image_settings.color_mode = 'RGBA'
        REVIEW.render.filepath = str(RENDER_DIR / f'{case}-{angle}.png')
        bpy.ops.render.render(write_still=True, scene=REVIEW.name)
        REPORT['renders'].append({'case': case, 'exterior': exterior, 'interior': interior, 'view': angle,
                                  'path': Path(REVIEW.render.filepath).relative_to(ROOT).as_posix()})
        (ROOT / 'validation/finish-progress.json').write_text(json.dumps({'state': 'rendering', 'completed': TOTAL - len(QUEUE), 'total': TOTAL}), encoding='utf-8')
    except Exception as error:
        (ROOT / 'validation/finish-progress.json').write_text(json.dumps({'state': 'failed', 'error': repr(error), 'case': case}), encoding='utf-8')
        QUEUE.clear()
        raise
    return 0.1


if __name__ == '__main__':
    begin()
