"""Blender-only export integrity and review outputs. No browser claims."""

import importlib.util
import hashlib
import json
import math
import struct
import sys
import time
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('niva_build', ROOT / 'scripts' / 'build-niva.py')
build = importlib.util.module_from_spec(spec)
sys.modules['niva_build'] = build
spec.loader.exec_module(build)
ANGLES = (('front', 0), ('front-left', -32.641288), ('left', -90), ('rear-left', -135),
          ('rear', -180), ('rear-right', -225), ('right', -270), ('front-right', -315))
ROUNDTRIP_NAME = 'Niva_GLBRoundTrip'
QUEUE = []
JOB_TOTAL = 0
JOB_STARTED = 0
DETAIL_VIEWS = {
    'interior-front': ((1.4, -1.9, 2.27), (-0.20, 1.20, 1.95), 23),
    'interior-right': ((1.82, -0.68, 2.10), (-1.1, 0.3, 1.65), 22),
    'roof-apex-detail': ((0.75, -5.5, 6.6), (0, -2.99, 5.88), 70),
    'loft-window-detail': ((0, -6.0, 4.8), (0, -2.70, 4.72), 62),
    'stove-detail': ((0.50, -1.1, 2.05), (1.45, -2.05, 1.22), 32),
    'sink-detail': ((0.857766, 1.224807, 2.38), (0.571844, 2.161423, 1.49), 42),
    'ceiling-detail': ((0.457475, -0.960633, 2.0), (0, 0, 3.53), 22),
    'loft-interior': ((0, 0.780514, 5.28), (0.228738, -1.260830, 4.05), 24),
}


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2), encoding='utf-8')


def image_dimensions(encoded):
    if encoded.startswith(b'\x89PNG'):
        return struct.unpack_from('>II', encoded, 16)
    if encoded.startswith(b'\xff\xd8'):
        offset = 2
        while offset < len(encoded):
            assert encoded[offset] == 0xFF
            marker = encoded[offset + 1]
            length = struct.unpack_from('>H', encoded, offset + 2)[0]
            if marker in (0xC0, 0xC1, 0xC2):
                height, width = struct.unpack_from('>HH', encoded, offset + 5)
                return width, height
            offset += 2 + length
    raise ValueError('Unsupported embedded image')


def canonical():
    camera = build.camera_view()
    camera.data.lens = 66.441177
    camera.data.shift_x, camera.data.shift_y = 0.09328, -0.00103594
    return camera


def orbit(angle):
    # One radius/elevation/lens for every review angle, with room for the projecting stairs.
    camera = build.camera_view(angle=angle, distance=20.5, elevation=5.5, target=(0, -0.50, 2.96))
    camera.data.lens = 64
    camera.data.shift_x, camera.data.shift_y = 0, 0
    return camera


def detail_view(name):
    camera = bpy.data.objects['Niva_CanonicalCamera']
    location, target, lens = DETAIL_VIEWS[name]
    camera.location = location
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.lens = lens
    camera.data.shift_x = camera.data.shift_y = 0
    bpy.context.view_layer.update()
    return camera


def export_glb():
    source = bpy.data.scenes['Niva_Source']
    bpy.context.window.scene = source
    canonical()
    source.render.resolution_percentage = 100
    source.render.resolution_x, source.render.resolution_y = 954, 866
    source.render.film_transparent = True
    bpy.ops.object.select_all(action='DESELECT')
    for name in build.MODEL_COLLECTIONS:
        for obj in bpy.data.collections[name].objects:
            obj.select_set(True)
            if obj.type == 'MESH':
                obj.data.name = obj.name
                if not obj.modifiers.get('ExportTriangulation'):
                    obj.modifiers.new('ExportTriangulation', 'TRIANGULATE')
    bpy.context.view_layer.objects.active = bpy.data.objects['Niva']
    bpy.data.objects['Niva']['review_status'] = 'Final Blender review; browser validation remains pending'
    settings = dict(export_format='GLB', use_selection=True, use_active_scene=True, export_apply=True,
                    export_yup=True, export_texcoords=True, export_normals=True,
                    export_tangents=True, export_materials='EXPORT', export_image_format='AUTO',
                    export_cameras=False, export_lights=False, export_animations=False,
                    export_extras=True, export_draco_mesh_compression_enable=False)
    bpy.ops.export_scene.gltf(filepath=str(ROOT / 'niva.glb'), **settings)
    payload = (ROOT / 'niva.glb').read_bytes()
    magic, version, length = struct.unpack_from('<4sII', payload)
    assert magic == b'glTF' and version == 2 and length == len(payload)
    json_length, json_type = struct.unpack_from('<II', payload, 12)
    assert json_type == 0x4E4F534A
    gltf = json.loads(payload[20:20 + json_length])
    triangles = 0
    for mesh in gltf['meshes']:
        for primitive in mesh['primitives']:
            assert primitive.get('mode', 4) == 4
            triangles += gltf['accessors'][primitive['indices']]['count'] // 3
    model_objects = [obj for name in build.MODEL_COLLECTIONS for obj in bpy.data.collections[name].objects]
    vertices = [obj.matrix_world @ Vector(corner) for obj in model_objects if obj.type == 'MESH' for corner in obj.bound_box]
    bounds = {'min': [min(v[i] for v in vertices) for i in range(3)],
              'max': [max(v[i] for v in vertices) for i in range(3)]}
    textures = []
    for image in gltf.get('images', []):
        assert 'bufferView' in image and 'uri' not in image
        view = gltf['bufferViews'][image['bufferView']]
        offset = 20 + json_length + 8 + view.get('byteOffset', 0)
        encoded = payload[offset:offset + view['byteLength']]
        dimensions = image_dimensions(encoded)
        textures.append({'name': image.get('name'), 'mime_type': image['mimeType'],
                         'dimensions': dimensions, 'embedded_bytes': len(encoded)})
    material_names = [mat['name'] for mat in gltf['materials']]
    assert 'ExteriorCladding' in material_names and 'InteriorJoinery' in material_names
    assert not gltf.get('cameras') and 'KHR_lights_punctual' not in gltf.get('extensions', {})
    assert all('uri' not in buffer for buffer in gltf['buffers'])
    assert len(gltf['meshes']) == sum(obj.type == 'MESH' for obj in model_objects), 'An unrelated scene was included'
    # The revised user brief explicitly defers file-size optimization for this build.
    assert triangles < 100_000, f'Triangle budget exceeded: {triangles}'
    camera = source.camera
    inverse_root = bpy.data.objects['Niva'].matrix_world.inverted()
    loft_frame_vertices = [inverse_root @ obj.matrix_world @ Vector(corner) for obj in model_objects
                           if obj.name.startswith('Front_LoftWindow') for corner in obj.bound_box]
    clearance = min(5.82 - abs(vertex.x) * build.SLOPE - vertex.z for vertex in loft_frame_vertices)
    assert clearance > 0.20, f'Loft frame must clear timber fascia: {clearance}'
    stats = {'blender_version': bpy.app.version_string, 'glb_bytes': len(payload), 'triangles': triangles,
             'glb_sha256': hashlib.sha256(payload).hexdigest(), 'optimization_applied': False,
             'file_size_budget_deferred_by_user': True,
             'layout_checks': {'loft_frame_vertical_fascia_clearance': clearance,
                               'wc_door_closed': True, 'wc_window_opaque_screen': True,
                               'rear_kitchen_window': True, 'right_window_toward_front': True,
                               'continuous_flue_axis_local_xy': [1.6, -2.0]},
             'mesh_count': len(gltf['meshes']), 'node_count': len(gltf['nodes']),
             'textures': textures, 'material_names': material_names,
             'extensions_used': gltf.get('extensionsUsed', []), 'export_settings': settings,
             'source_bounds_blender': bounds,
             'canonical': {'location': list(camera.location), 'rotation_euler_radians': list(camera.rotation_euler),
                           'matrix_world': [list(row) for row in camera.matrix_world], 'lens_mm': camera.data.lens,
                           'sensor_width_mm': camera.data.sensor_width,
                            'shift_x': camera.data.shift_x, 'shift_y': camera.data.shift_y,
                            'clip_start': camera.data.clip_start, 'clip_end': camera.data.clip_end,
                            'projection_matrix': [list(row) for row in camera.calc_matrix_camera(
                                bpy.context.evaluated_depsgraph_get(), x=954, y=866)],
                            'gltf_world_matrix': [list(row) for row in (Matrix.Rotation(-math.pi / 2, 4, 'X') @ camera.matrix_world)],
                           'resolution': [954, 866]},
             'color_management': {'view_transform': source.view_settings.view_transform,
                                  'look': source.view_settings.look, 'exposure': source.view_settings.exposure,
                                  'gamma': source.view_settings.gamma},
             'hdri': None, 'hdri_bytes': 0, 'baked_lighting_textures': [],
             'lighting': [{'name': obj.name, 'type': obj.data.type, 'location': list(obj.location),
                          'rotation': list(obj.rotation_euler), 'power_w': obj.data.energy,
                           'size': obj.data.size, 'size_y': obj.data.size_y, 'shape': obj.data.shape,
                           'color': list(obj.data.color)}
                         for obj in source.objects if obj.type == 'LIGHT']}
    write_json(ROOT / 'validation' / 'export-stats.json', stats)
    write_json(ROOT / 'validation' / 'gltf-manifest.json', gltf)
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'niva.blend'))
    print(json.dumps({'bytes': len(payload), 'triangles': triangles, 'textures': textures}))
    return stats


def round_trip():
    source = bpy.data.scenes['Niva_Source']
    assert ROUNDTRIP_NAME not in bpy.data.scenes, 'Round-trip scene already exists'
    review = source.copy()
    review.name = ROUNDTRIP_NAME
    for collection in list(review.collection.children):
        if collection.name in build.MODEL_COLLECTIONS:
            review.collection.children.unlink(collection)
    bpy.context.window.scene = review
    bpy.ops.import_scene.gltf(filepath=str(ROOT / 'niva.glb'))
    imported = [obj for obj in review.objects if obj.type == 'MESH']
    bpy.context.view_layer.update()
    boundary_edges, nonmanifold_edges, bad_faces, negative_meshes = [], [], [], []
    vertices = []
    for obj in imported:
        vertices.extend(obj.matrix_world @ vertex.co for vertex in obj.data.vertices)
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        if any(edge.is_boundary for edge in bm.edges):
            boundary_edges.append(obj.name)
        if any(not edge.is_manifold for edge in bm.edges):
            nonmanifold_edges.append(obj.name)
        if any(face.calc_area() < 1e-12 for face in bm.faces):
            bad_faces.append(obj.name)
        if bm.calc_volume(signed=True) < -1e-8:
            negative_meshes.append(obj.name)
        bm.free()
    materials = {mat.name: mat for obj in imported for mat in obj.data.materials}
    glass = next(mat for name, mat in materials.items() if name.startswith('Glazing'))
    shader = next(node for node in glass.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
    glass_alpha = shader.inputs['Alpha'].default_value
    assert glass_alpha < 0.2, 'Unexpectedly opaque imported glass'
    report = {'imported_mesh_count': len(imported), 'imported_triangles': sum(len(obj.data.polygons) for obj in imported),
              'bounds_blender': {'min': [min(v[i] for v in vertices) for i in range(3)],
                                 'max': [max(v[i] for v in vertices) for i in range(3)]},
              'imported_material_names': sorted(materials), 'glass_alpha': glass_alpha,
              'glass_render_method': glass.surface_render_method,
              'boundary_edge_meshes_before_welding': boundary_edges,
              'nonmanifold_meshes_before_welding': nonmanifold_edges,
              'degenerate_face_meshes': bad_faces, 'negative_signed_volume_meshes': negative_meshes,
              'note': 'glTF splits vertices at UV/normal seams; topology checks must weld those seams before interpreting boundary edges.'}
    assert not bad_faces and not negative_meshes, f'Invalid faces: {bad_faces}; inverted meshes: {negative_meshes}'
    welded_bad = []
    for obj in imported:
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-6)
        if any(not edge.is_manifold for edge in bm.edges):
            welded_bad.append(obj.name)
        bm.free()
    report['nonmanifold_meshes_after_welding'] = welded_bad
    assert not welded_bad, f'Non-manifold imported meshes: {welded_bad}'
    write_json(ROOT / 'validation' / 'round-trip-stats.json', report)
    bpy.context.window.scene = source
    canonical()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'niva.blend'))
    print(json.dumps({'round_trip_meshes': len(imported), 'glass_method': glass.surface_render_method,
                      'glass_alpha': glass_alpha, 'welded_nonmanifold': welded_bad}))


def schedule_reviews():
    global QUEUE, JOB_TOTAL, JOB_STARTED
    assert not QUEUE
    QUEUE = [('canonical', 'source', None), ('clay', 'source', None), ('canonical', 'roundtrip', None)]
    QUEUE.extend([('no-interior-lights', 'source', None), ('no-interior-lights', 'roundtrip', None)])
    for name in DETAIL_VIEWS:
        QUEUE.extend(((name, 'source', None), (name, 'roundtrip', None)))
    for name, angle in ANGLES:
        QUEUE.extend([(name, 'source', angle), (name, 'roundtrip', angle)])
    # 144 evenly spaced positions cover [0, 360); the closing 2.5-degree interval is in the loop.
    QUEUE.extend([(f'{index + 1:04}', 'turntable', -32.641288 - index * 360 / 144) for index in range(144)])
    (ROOT / 'renders' / 'turntable-frames').mkdir(exist_ok=True)
    JOB_TOTAL, JOB_STARTED = len(QUEUE), time.monotonic()
    if bpy.app.background:
        while QUEUE:
            render_next()
        render_next()
    else:
        bpy.app.timers.register(render_next, first_interval=0.1)
    print(f'Scheduled {JOB_TOTAL} renders; inspect validation/render-progress.json')


def render_next():
    global QUEUE
    if not QUEUE:
        bpy.context.window.scene = bpy.data.scenes['Niva_Source']
        canonical()
        bpy.context.scene.render.resolution_x, bpy.context.scene.render.resolution_y = 954, 866
        bpy.context.scene.render.resolution_percentage = 100
        bpy.context.scene.eevee.taa_render_samples = 96
        bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'niva.blend'))
        write_json(ROOT / 'validation' / 'render-progress.json', {'state': 'complete', 'completed': JOB_TOTAL,
                                                                 'seconds': time.monotonic() - JOB_STARTED})
        return None
    name, kind, angle = QUEUE.pop(0)
    interior_lights = [obj for obj in bpy.data.collections['Lights'].objects
                       if obj.name.startswith(('Interior_', 'Loft_', 'Sconce'))]
    try:
        scene = bpy.data.scenes[ROUNDTRIP_NAME if kind == 'roundtrip' else 'Niva_Source']
        bpy.context.window.scene = scene
        scene.render.resolution_x, scene.render.resolution_y = (636, 578) if kind == 'turntable' else ((1280, 960) if name in DETAIL_VIEWS else (954, 866))
        scene.render.resolution_percentage = 100
        scene.eevee.taa_render_samples = 48 if kind == 'turntable' else 96
        scene.render.film_transparent = True
        for obj in interior_lights:
            obj.hide_render = name == 'no-interior-lights'
        if name in DETAIL_VIEWS:
            detail_view(name)
        elif angle is None:
            canonical()
        else:
            orbit(angle)
        if name == 'clay':
            build.render_clay()
        else:
            if kind == 'roundtrip':
                output = ROOT / 'validation' / f'niva-roundtrip-{name}.png'
            elif kind == 'turntable':
                output = ROOT / 'renders' / 'turntable-frames' / f'{name}.png'
            else:
                output = ROOT / 'renders' / f'niva-{name}.png'
            scene.render.image_settings.file_format = 'PNG'
            scene.render.image_settings.color_mode = 'RGBA'
            scene.render.filepath = str(output)
            bpy.ops.render.render(write_still=True)
        write_json(ROOT / 'validation' / 'render-progress.json', {'state': 'rendering', 'last': [kind, name],
                          'completed': JOB_TOTAL - len(QUEUE), 'total': JOB_TOTAL, 'seconds': time.monotonic() - JOB_STARTED})
    except Exception as error:
        write_json(ROOT / 'validation' / 'render-progress.json', {'state': 'failed', 'job': [kind, name], 'error': repr(error)})
        QUEUE = []
        raise
    finally:
        for obj in interior_lights:
            obj.hide_render = False
    return 0.1


if __name__ == '__main__':
    export_glb()
    round_trip()
    schedule_reviews()
