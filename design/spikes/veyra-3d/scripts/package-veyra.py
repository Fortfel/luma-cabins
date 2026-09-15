"""Veyra packaging only. Does not run any asset or browser tests.

export_delivery() writes one GLB plus camera, presets and lighting contracts.
render_poster() makes the exact-camera authoring poster for the user's review.
metadata() records file accounting, not validation or performance results.
"""

import hashlib
import json
import math
import struct
from datetime import datetime, timezone
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]


def write_json(name, data):
    (ROOT / name).write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')


def export_delivery():
    scene = bpy.context.scene
    if scene.name != 'Veyra_Source' or Path(bpy.data.filepath).parent != ROOT:
        raise RuntimeError('Select the independent Veyra source file before exporting.')
    camera = bpy.data.objects['Veyra_CanonicalCamera']
    scene.camera = camera
    scene.render.resolution_x, scene.render.resolution_y = 1358, 553
    scene.render.resolution_percentage = 100
    bpy.context.view_layer.update()
    convert = Matrix.Rotation(-math.pi / 2, 4, 'X')
    world = camera.matrix_world.copy()
    projection = camera.calc_matrix_camera(bpy.context.evaluated_depsgraph_get(), x=1358, y=553, scale_x=1, scale_y=1)
    rows = lambda matrix: [list(row) for row in matrix]
    target = Vector(camera['target_blender'])
    is_poster_current = bool(scene.get('poster_current', True))
    presets = json.loads((ROOT / 'veyra-presets.json').read_text())
    if is_poster_current:
        presets['poster'] = 'renders/veyra-configurator-poster.png'
    else:
        presets.pop('poster', None)
    write_json('veyra-presets.json', presets)
    write_json('veyra-camera.json', {
        'schemaVersion': 1, 'camera': camera.name, 'asset': 'veyra-configurator.glb',
        **({'poster': 'renders/veyra-configurator-poster.png'} if is_poster_current else {
            'posterStatus': 'No current poster supplied. Retained initial Blender renders predate the current revision.'}),
        'image': {'width': 1358, 'height': 553, 'transparent': True, 'background': '#f7f5f0'},
        'coordinateConvention': {'blender': '+Z up, -Y front', 'gltf': '+Y up, +Z front',
                                 'origin': 'ground level at footprint center', 'units': 'meters',
                                 'conversion': '[x, y, z] Blender -> [x, z, -y] glTF'},
        'position_blender': list(world.translation), 'position_gltf': list((convert @ world).translation),
        'target_blender': list(target), 'target_gltf': list(convert @ target),
        'lens_mm': camera.data.lens, 'sensor_width_mm': camera.data.sensor_width,
        'sensor_fit': camera.data.sensor_fit, 'near': camera.data.clip_start, 'far': camera.data.clip_end,
        'shift_x': camera.data.shift_x, 'shift_y': camera.data.shift_y,
        'matrix_world_blender': rows(world), 'matrix_world_gltf': rows(convert @ world),
        'projection_matrix': rows(projection), 'matrixStorage': 'row arrays',
        'resize': 'Preserve horizontal sensor fit and shifts; recompute projection for changed aspect. Convert row arrays correctly for Three.js column-major storage.',
        'defaults': {'exterior': 'natural-timber', 'interior': 'light-oak'},
        'status': str(scene.get('revision', 'Initial candidate; pending user review')),
    })
    lights = []
    for obj in scene.objects:
        if obj.type == 'LIGHT':
            lights.append({'name': obj.name, 'type': obj.data.type, 'matrix_world_blender': rows(obj.matrix_world),
                           'power': obj.data.energy, 'color_linear': list(obj.data.color),
                           'size': obj.data.size, 'shape': obj.data.shape, 'shadows': obj.data.use_shadow})
    background = scene.world.node_tree.nodes.get('Background')
    write_json('veyra-lighting.json', {
        'purpose': 'Blender authoring presentation only. Lights, world and cameras excluded from GLB.',
        'engine': scene.render.engine, 'view_transform': scene.view_settings.view_transform,
        'look': scene.view_settings.look, 'exposure': scene.view_settings.exposure,
        'world': {'color_linear': list(background.inputs['Color'].default_value)[:3],
                  'strength': background.inputs['Strength'].default_value, 'hdri': None},
        'lights': lights,
        'runtime': 'Reuse approved cabin browser lighting; reconcile after user approval. Do not use unshadowed exterior point lights that illuminate through walls. Emissive fixture geometry is included.',
    })
    bpy.ops.object.select_all(action='DESELECT')
    for group in ('Architecture', 'Glazing', 'ExteriorDetails', 'ShallowInterior'):
        for obj in bpy.data.collections['Veyra_' + group].objects:
            if obj.type == 'MESH':
                obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(ROOT / 'veyra-configurator.glb'), export_format='GLB',
        use_selection=True, use_active_scene=True, export_apply=True,
        export_yup=True, export_cameras=False, export_lights=False,
        export_animations=False, export_texcoords=True, export_normals=True,
        export_tangents=False, export_materials='EXPORT', export_image_format='AUTO',
        export_draco_mesh_compression_enable=False, export_extras=False,
    )
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'veyra-source.blend'), compress=True)
    return {'asset': 'veyra-configurator.glb', 'status': 'exported; consult current hash-matched validation reports'}


def render_poster():
    scene = bpy.context.scene
    if scene.name != 'Veyra_Source':
        raise RuntimeError('Select Veyra_Source first.')
    scene.camera = bpy.data.objects['Veyra_CanonicalCamera']
    scene.render.resolution_x, scene.render.resolution_y = 1358, 553
    scene.render.resolution_percentage = 100
    scene.render.filepath = str(ROOT / 'renders' / 'veyra-configurator-poster.png')
    bpy.ops.render.render(write_still=True)
    scene['poster_current'] = True
    return {'poster': scene.render.filepath, 'purpose': 'user visual review, not a test'}


def metadata():
    def record(name):
        path = ROOT / name
        return {'path': name, 'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    raw = (ROOT / 'veyra-configurator.glb').read_bytes()
    chunk_length = struct.unpack_from('<I', raw, 12)[0]
    doc = json.loads(raw[20:20 + chunk_length])
    defaults = ['veyra-configurator.glb', 'veyra-camera.json', 'veyra-presets.json']
    poster = ROOT / 'renders/veyra-configurator-poster.png'
    if poster.exists() and bpy.context.scene.get('poster_current', True):
        defaults.append('renders/veyra-configurator-poster.png')
    optional = sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / 'finishes/textures').glob('*.jpg'))
    default_records, optional_records = [record(p) for p in defaults], [record(p) for p in optional]
    asset_hash = hashlib.sha256(raw).hexdigest()
    checks = {}
    not_run = ['final user visual approval', 'production website integration', 'physical mobile/GPU profiling']
    for key, filename, label in (
        ('gltf','khronos-validator.json','Khronos validator'),
        ('roundtrip','blender-roundtrip.json','Blender geometry and GLB round trip'),
        ('clearances','cabinet-clearance.json','cabinet/fruit clearance checks'),
        ('browser','browser-report.json','browser finish/orbit checks'),
    ):
        path = ROOT / 'validation' / filename
        if path.exists():
            report = json.loads(path.read_text(encoding='utf-8'))
            matches = report.get('asset_sha256',report.get('assetSha256')) == asset_hash
            passed = report.get('issues',{}).get('numErrors') == 0 if key == 'gltf' else bool(report.get('passed'))
            checks[key] = {'path':'validation/'+filename,'matches_current_asset':matches,'passed':bool(matches and passed)}
            if not matches:
                not_run.append(label + ' for the current asset')
        else:
            not_run.append(label)
    data = {
        'asset': 'veyra-configurator.glb', 'recorded_at_utc': datetime.now(timezone.utc).isoformat(),
        'status': str(bpy.context.scene.get('revision', 'Initial authored candidate')) + '; see hash-matched validation records.',
        'validation': checks,
        'revision': bpy.context.scene.get('revision_number', 1),
        'poster_current': bool(bpy.context.scene.get('poster_current', True)),
        'review_images': 'Initial renders are historical and stale for the current revision; excluded from current payload.' if not bpy.context.scene.get('poster_current', True) else 'Current authoring presentations, not validation evidence.',
        'blender_version': bpy.app.version_string,
        'geometry': {'triangles': sum(doc['accessors'][p['indices']]['count'] // 3 for m in doc.get('meshes', []) for p in m['primitives'] if 'indices' in p),
                     'meshes': len(doc.get('meshes', [])), 'nodes': len(doc.get('nodes', [])), 'materials': len(doc.get('materials', []))},
        'embedded_images': len(doc.get('images', [])), 'embedded_image_resolution': [1024, 1024],
        'extensions_used': doc.get('extensionsUsed', []), 'default_files': default_records,
        'optional_finish_files': optional_records,
        'default_file_bytes': sum(f['bytes'] for f in default_records),
        'all_optional_texture_bytes': sum(f['bytes'] for f in optional_records),
        'source': record('veyra-source.blend'), 'scene': 'Veyra_Source',
        'source_scripts': [record('scripts/build-veyra.py'), record('scripts/package-veyra.py')] +
                          ([record('scripts/revise-layout.py')] if bpy.context.scene.get('revision_number', 1) >= 2 else []) +
                          ([record('scripts/revise-furnishing.py')] if bpy.context.scene.get('revision_number', 1) >= 3 else []) +
                          ([record('scripts/refine-kitchen.py')] if bpy.context.scene.get('revision_number', 1) >= 4 else []) +
                          ([record('scripts/refine-cabinet-access.py')] if bpy.context.scene.get('revision_number', 1) >= 5 else []),
        'hdri_bytes': 0, 'additional_runtime_support_requests': [],
        'not_run': not_run,
        'note': 'Declared export counts, byte accounting and authoring images are not validation or performance evidence.',
    }
    write_json('veyra-delivery.json', data)
    return {'geometry': data['geometry'], 'default_file_bytes': data['default_file_bytes'],
            'optional_bytes': data['all_optional_texture_bytes'], 'embedded_images': data['embedded_images']}


def render_interiors():
    """Two user-facing presentation views, not an orbit or validation suite."""
    scene = bpy.context.scene
    if scene.name != 'Veyra_Source':
        raise RuntimeError('Select Veyra_Source first.')
    old = (scene.camera, scene.render.resolution_x, scene.render.resolution_y, scene.render.filepath)
    try:
        scene.render.resolution_x, scene.render.resolution_y = 1100, 720
        scene.render.resolution_percentage = 100
        for camera, filename in [('Veyra_InteriorReview', 'veyra-interior-review.png'),
                                 ('Veyra_BedroomReview', 'veyra-bedroom-review.png')]:
            scene.camera = bpy.data.objects[camera]
            scene.render.filepath = str(ROOT / 'renders' / filename)
            bpy.ops.render.render(write_still=True)
    finally:
        scene.camera, scene.render.resolution_x, scene.render.resolution_y, scene.render.filepath = old
    return {'purpose': 'two interior presentation images for user review; no tests'}
