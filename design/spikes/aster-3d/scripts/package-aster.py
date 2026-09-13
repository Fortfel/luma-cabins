"""Export the authored source and camera contract. No validation or round trip.

Call export_delivery() in Aster_Source, then payload_metadata(). Posters are deferred
to the user's web workflow. This module does not render or require any poster.
"""

import hashlib
import json
import math
from datetime import datetime, timezone
from pathlib import Path
import struct

import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]


def save_json(name, data):
    (ROOT / name).write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')


def export_delivery():
    scene = bpy.context.scene
    if scene.name != 'Aster_Source':
        raise RuntimeError('Select Aster_Source before exporting.')
    camera = scene.camera
    bpy.context.view_layer.update()
    convert = Matrix.Rotation(-math.pi / 2, 4, 'X')
    world = camera.matrix_world.copy()
    projection = camera.calc_matrix_camera(bpy.context.evaluated_depsgraph_get(),
                                           x=scene.render.resolution_x, y=scene.render.resolution_y,
                                           scale_x=scene.render.pixel_aspect_x, scale_y=scene.render.pixel_aspect_y)
    target = Vector(camera['target_blender'])
    row_arrays = lambda matrix: [list(row) for row in matrix]
    save_json('aster-camera.json', {
        'schemaVersion': 1, 'camera': camera.name, 'asset': 'aster-configurator.glb',
        'posterStatus': 'Deferred: user will capture from the web renderer. No current poster supplied.',
        'image': {'width': 1309, 'height': 697, 'transparent': True, 'background': '#f7f5f0'},
        'coordinateConvention': {'blender': '+Z up, -Y front', 'gltf': '+Y up, +Z front',
                                 'origin': 'ground level at footprint center', 'units': 'meters',
                                 'conversion': '[x, y, z] Blender -> [x, z, -y] glTF'},
        'position_blender': list(world.translation), 'position_gltf': list((convert @ world).translation),
        'target_blender': list(target), 'target_gltf': list(convert @ target),
        'lens_mm': camera.data.lens, 'sensor_width_mm': camera.data.sensor_width,
        'sensor_fit': camera.data.sensor_fit, 'near': camera.data.clip_start, 'far': camera.data.clip_end,
        'shift_x': camera.data.shift_x, 'shift_y': camera.data.shift_y,
        'matrix_world_blender': row_arrays(world), 'matrix_world_gltf': row_arrays(convert @ world),
        'projection_matrix': row_arrays(projection), 'matrixStorage': 'row arrays',
        'resize': 'Preserve horizontal sensor fit and shifts. Recompute projection for changed aspect. Do not flatten row arrays into column-major APIs.',
        'defaults': {'exterior': 'natural-timber', 'interior': 'light-oak'},
        'status': f"Revision {scene.get('layout_revision', 1)}; camera retained as an initial view. Pending user inspection; web poster deferred.",
    })
    lighting = []
    for obj in scene.objects:
        if obj.type == 'LIGHT':
            lighting.append({'name': obj.name, 'type': obj.data.type, 'position_blender': list(obj.location),
                             'matrix_world_blender': row_arrays(obj.matrix_world), 'power': obj.data.energy,
                             'color_linear': list(obj.data.color), 'shape': obj.data.shape,
                             'size': obj.data.size, 'size_y': obj.data.size_y})
    save_json('aster-lighting.json', {
        'purpose': 'Blender review intent, not a browser-equivalence claim. Lights are excluded from GLB.',
        'engine': scene.render.engine, 'view_transform': scene.view_settings.view_transform,
        'look': scene.view_settings.look, 'exposure': scene.view_settings.exposure,
        'world': {'color_linear': list(scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value)[:3],
                  'strength': scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value, 'hdri': None},
        'lights': lighting,
        'runtime_sconces': 'Keep emissive fixture geometry. Do not introduce unshadowed exterior point lights that leak through walls. Reuse the proven localized facade-pool approach after review.',
    })
    bpy.ops.object.select_all(action='DESELECT')
    groups = ('Architecture', 'Glazing', 'ExteriorDetails', 'ShallowInterior')
    for group in groups:
        for obj in bpy.data.collections['Aster_' + group].objects:
            if obj.type == 'MESH':
                obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT / 'aster-configurator.glb'), export_format='GLB',
                              use_selection=True, use_active_scene=True, export_apply=True,
                              export_yup=True, export_cameras=False, export_lights=False,
                              export_animations=False, export_texcoords=True, export_normals=True, export_tangents=False,
                              export_materials='EXPORT', export_image_format='AUTO',
                              export_draco_mesh_compression_enable=False, export_extras=False)
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'aster-source.blend'))
    return {'asset': 'aster-configurator.glb', 'camera': 'aster-camera.json', 'status': 'exported, not validated'}


def payload_metadata():
    """File accounting only; does not test export correctness or performance."""
    raw = (ROOT / 'aster-configurator.glb').read_bytes()
    asset_hash = hashlib.sha256(raw).hexdigest()
    length = struct.unpack_from('<I', raw, 12)[0]
    doc = json.loads(raw[20:20 + length])
    files = ['aster-configurator.glb', 'aster-camera.json', 'aster-presets.json']
    optional = sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / 'finishes/textures').glob('*.jpg'))
    def record(name):
        p = ROOT / name
        return {'path': name, 'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
    default_records, optional_records = [record(p) for p in files], [record(p) for p in optional]
    triangles = sum(doc['accessors'][primitive['indices']]['count'] // 3
                    for mesh in doc.get('meshes', []) for primitive in mesh['primitives'] if 'indices' in primitive)
    checks = {}
    for name, filename in (('gltf', 'khronos-validator.json'), ('roundtrip', 'blender-roundtrip.json'), ('browser', 'browser-report.json')):
        path = ROOT / 'validation' / filename
        if path.exists():
            report = json.loads(path.read_text())
            matches = report.get('assetSha256', report.get('asset_sha256')) == asset_hash
            passed = report.get('issues', {}).get('numErrors') == 0 if name == 'gltf' else report.get('passed', report.get('status') == 'passed')
            checks[name] = {'path': 'validation/' + filename, 'matches_current_asset': matches,
                            'passed': bool(matches and passed),
                            'status': ('passed' if passed else 'failed') if matches else 'not-run-for-current-export'}
    current_passed = len(checks) == 3 and all(check['passed'] for check in checks.values())
    metadata = {
        'asset': 'aster-configurator.glb',
        'status': f"Revision {bpy.context.scene.get('layout_revision', 1)}; " +
                  ('asset checks passed; final user visual approval pending.' if current_passed else
                   'current export is not validated; older reports are historical. Final user inspection pending.'),
        'validation': checks,
        'poster_status': 'Deferred to user web capture; historical Blender renders excluded from current delivery.',
        'layout_revision': bpy.context.scene.get('layout_revision', 1),
        'blender_version': bpy.app.version_string,
        'geometry': {'triangles': triangles, 'meshes': len(doc.get('meshes', [])),
                     'nodes': len(doc.get('nodes', [])), 'materials': len(doc.get('materials', []))},
        'embedded_images': len(doc.get('images', [])), 'embedded_image_resolution': [1024, 1024],
        'extensions_used': doc.get('extensionsUsed', []), 'default_files': default_records,
        'optional_finish_files': optional_records,
        'default_file_bytes': sum(item['bytes'] for item in default_records),
        'all_optional_texture_bytes': sum(item['bytes'] for item in optional_records),
        'hdri_bytes': 0, 'additional_runtime_support_requests': [],
        'source': record('aster-source.blend'),
        'source_provenance': {
            'recorded_at_delivery_utc': datetime.now(timezone.utc).isoformat(),
            'scene': bpy.context.scene.name,
            'layout_revision': bpy.context.scene.get('layout_revision'),
            'validation_geometry_fix': bool(bpy.context.scene.get('validation_geometry_fix')),
            'reproduction_scripts': [record('scripts/' + name) for name in (
                'build-aster.py', 'revise-layout.py', 'revise-details.py', 'revise-cabinets.py',
                'fit-fridge.py', 'revise-kitchen-roof.py', 'fix-validation-geometry.py', 'extend-gutters.py',
                'resolve-gutter-join.py', 'package-aster.py')],
            'note': 'Source hash and revision chain recorded at delivery, not retroactively claimed as part of the earlier round-trip report.',
        },
        'not_run': [name + ' validation for current export' for name in ('gltf', 'roundtrip', 'browser')
                    if not checks.get(name, {}).get('matches_current_asset')] +
                   ['final user visual acceptance', 'production website integration', 'physical mobile/GPU profiling'],
        'accounting_note': 'File byte sizes and declared topology counts only; not runtime-performance measurements.',
    }
    save_json('aster-delivery.json', metadata)
    return metadata
