"""Saved-source numerical geometry, bounds, materials and packed-image round trip.

Run only in background Blender with niva-final.blend open. Optional argument after
-- selects a disposable package directory instead of the design delivery.
"""
import contextlib
import hashlib
import io
import json
import math
from pathlib import Path
import runpy
import sys

import bpy

SOURCE_ROOT = Path(__file__).resolve().parents[1]
ROOT = Path(sys.argv[sys.argv.index('--') + 1]).resolve() if '--' in sys.argv else SOURCE_ROOT


def mesh_record(obj, evaluated):
    source = obj.evaluated_get(bpy.context.evaluated_depsgraph_get()) if evaluated else obj
    mesh = source.to_mesh() if evaluated else source.data
    mesh.calc_loop_triangles()
    points = [source.matrix_world @ vertex.co for vertex in mesh.vertices]
    result = {
        'triangles': len(mesh.loop_triangles),
        'materials': sorted(material.name for material in mesh.materials if material),
        'bounds': [[min(point[axis] for point in points) for axis in range(3)],
                   [max(point[axis] for point in points) for axis in range(3)]],
        'nonfinite': sum(not all(math.isfinite(value) for value in point) for point in points),
        'uv_nonfinite': sum(not all(math.isfinite(value) for value in uv.uv)
                            for layer in mesh.uv_layers for uv in layer.data),
        'zero_area': sum(triangle.area < 1e-12 for triangle in mesh.loop_triangles),
    }
    if evaluated:
        source.to_mesh_clear()
    return result


def run():
    if not bpy.app.background:
        raise RuntimeError('Background Blender only: the round trip resets its process scene')
    source_hash = hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest()
    bpy.context.window.scene = bpy.data.scenes['Niva_Source']
    package = runpy.run_path(str(SOURCE_ROOT.parent / 'cabin-package.py'))
    expected = {obj.name: mesh_record(obj, True) for obj in package['export_objects'](bpy, 'niva') if obj.type == 'MESH'}
    with contextlib.redirect_stdout(io.StringIO()):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=str(ROOT / 'niva-configurator.glb'), import_pack_images=True)
    actual = {obj.name: mesh_record(obj, False) for obj in bpy.context.scene.objects if obj.type == 'MESH'}
    failures, notices = [], []
    for name in sorted(expected.keys() | actual.keys()):
        if name not in expected or name not in actual:
            failures.append({'name': name, 'issue': 'missing/extra mesh'})
            continue
        before, after = expected[name], actual[name]
        if before['triangles'] != after['triangles'] or before['materials'] != after['materials']:
            failures.append({'name': name, 'issue': 'triangle/material assignment changed'})
        error = max(abs(before['bounds'][side][axis] - after['bounds'][side][axis]) for side in range(2) for axis in range(3))
        if error > 2e-5:
            failures.append({'name': name, 'issue': 'round-trip bounds', 'error_m': error})
        if before['nonfinite'] or after['nonfinite'] or before['uv_nonfinite'] or after['uv_nonfinite']:
            failures.append({'name': name, 'issue': 'nonfinite geometry/UVs'})
        if before['zero_area'] or after['zero_area']:
            notices.append({'name': name, 'issue': 'zero-area tessellation; inspect before geometry changes',
                            'source': before['zero_area'], 'imported': after['zero_area']})
    images = [{'name': image.name, 'size': list(image.size), 'packed': bool(image.packed_file)}
              for image in bpy.data.images if image.type == 'IMAGE']
    if len(images) != 8 or any(not image['packed'] or image['size'] not in ([1024, 1024], [512, 512]) for image in images):
        failures.append({'issue': 'optimized embedded-image contract', 'images': images})
    for name in ('ExteriorCladding', 'InteriorJoinery', 'Glazing', 'FixedInteriorLining'):
        if name not in bpy.data.materials:
            failures.append({'issue': 'missing material', 'name': name})
    report = {'passed': not failures, 'failures': failures, 'notices': notices,
              'source_sha256': source_hash,
              'asset_sha256': hashlib.sha256((ROOT / 'niva-configurator.glb').read_bytes()).hexdigest(),
              'source_objects': len(expected), 'imported_objects': len(actual),
              'triangles': sum(item['triangles'] for item in actual.values()), 'images': images,
              'scope': 'Numerical geometry, mesh/material identities, bounds and texture packing; not manifold certification or visual acceptance.'}
    (ROOT / 'validation').mkdir(parents=True, exist_ok=True)
    (ROOT / 'validation/blender-roundtrip.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({key: value for key, value in report.items() if key not in ('notices', 'images')}, indent=2))
    if failures:
        raise RuntimeError('Niva round-trip failed; see validation/blender-roundtrip.json')


if __name__ == '__main__':
    run()
