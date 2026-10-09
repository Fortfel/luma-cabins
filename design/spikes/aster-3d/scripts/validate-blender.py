"""Read-only-source geometry/round-trip/contract checks, run in BACKGROUND Blender.

Opens the saved Aster source, records evaluated meshes, then resets this background
process only and imports GLB. Never runs this module in the user's interactive file.
"""

import hashlib
import json
import math
import contextlib
import io
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

ROOT = Path(sys.argv[sys.argv.index('--') + 1]).resolve() if '--' in sys.argv else Path(__file__).resolve().parents[1]


def mesh_record(obj, evaluated=False):
    ev = obj.evaluated_get(bpy.context.evaluated_depsgraph_get()) if evaluated else obj
    data = ev.to_mesh() if evaluated else ev.data
    data.calc_loop_triangles()
    points = [ev.matrix_world @ v.co for v in data.vertices]
    record = {'triangles': len(data.loop_triangles),
              'bounds': [[min(p[i] for p in points) for i in range(3)], [max(p[i] for p in points) for i in range(3)]],
              'materials': sorted(m.name for m in data.materials if m),
              'nonfinite': sum(not all(math.isfinite(v) for v in p) for p in points),
              'zero_area': sum(t.area < 1e-12 for t in data.loop_triangles)}
    bm = bmesh.new()
    bm.from_mesh(data)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-6)
    record['boundary_edges'] = sum(e.is_boundary for e in bm.edges)
    record['nonmanifold_edges'] = sum(not e.is_manifold for e in bm.edges)
    record['volume'] = bm.calc_volume(signed=True)
    record['expected_surface'] = '_Leaves' in obj.name or obj.name.startswith('SolarCellGrid_')
    bm.free()
    if evaluated:
        ev.to_mesh_clear()
    return record


def run():
    if not bpy.app.background:
        raise RuntimeError('Run in background Blender only; this test resets its process scene.')
    source_hash = hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest()
    source = bpy.data.scenes['Aster_Source']
    bpy.context.window.scene = source
    groups = ('Architecture', 'Glazing', 'ExteriorDetails', 'ShallowInterior')
    objects = {o for g in groups for o in bpy.data.collections['Aster_' + g].all_objects if o.type == 'MESH' and not o.hide_render}
    expected = {o.name: mesh_record(o, True) for o in objects}
    bpy.ops.wm.read_factory_settings(use_empty=True)
    with contextlib.redirect_stdout(io.StringIO()):
        bpy.ops.import_scene.gltf(filepath=str(ROOT / 'aster-configurator.glb'), import_pack_images=True)
    actual = {o.name: mesh_record(o) for o in bpy.context.scene.objects if o.type == 'MESH'}
    failures, notices = [], []
    for name in sorted(set(expected) | set(actual)):
        if name not in expected or name not in actual:
            failures.append({'name': name, 'issue': 'round-trip object name missing/extra'})
            continue
        src, dst = expected[name], actual[name]
        if src['triangles'] != dst['triangles'] or src['materials'] != dst['materials']:
            failures.append({'name': name, 'issue': 'triangle/material assignment changed', 'source': src, 'import': dst})
        error = max(abs(src['bounds'][j][i] - dst['bounds'][j][i]) for j in range(2) for i in range(3))
        if error > 2e-5:
            failures.append({'name': name, 'issue': 'round-trip bounds', 'error_m': error})
        if dst['nonfinite'] or dst['zero_area']:
            failures.append({'name': name, 'issue': 'nonfinite or degenerate triangles', 'details': dst})
        if dst['nonmanifold_edges'] and not dst['expected_surface']:
            failures.append({'name': name, 'issue': 'unexpected nonmanifold mesh', 'details': dst})
        if not dst['nonmanifold_edges'] and dst['volume'] < -1e-9:
            failures.append({'name': name, 'issue': 'inverted solid', 'volume': dst['volume']})
        if dst['expected_surface']:
            notices.append({'name': name, 'reason': 'authored leaf/grid surface', 'boundary_edges': dst['boundary_edges']})
    presets = json.loads((ROOT / 'aster-presets.json').read_text())
    target_names = {v['material'] for v in presets['groups'].values()}
    materials = {m.name: m for m in bpy.data.materials}
    for name in target_names:
        if name not in materials:
            failures.append({'issue': 'missing target material', 'name': name})
    exterior = sorted(name for name, item in actual.items() if 'ExteriorCladding' in item['materials'])
    if exterior != ['Cladding_Front', 'Cladding_LeftGable', 'Cladding_Rear', 'Cladding_RightGable']:
        failures.append({'issue': 'exterior boundary', 'objects': exterior})
    for item in presets['textureFiles']:
        p = ROOT / item['path']
        if hashlib.sha256(p.read_bytes()).hexdigest() != item['sha256']:
            failures.append({'issue': 'optional texture checksum', 'file': item['path']})
    glazing = materials['Glazing'].node_tree.nodes.get('Principled BSDF')
    if abs(glazing.inputs['Alpha'].default_value - 0.09) > 1e-5:
        failures.append({'issue': 'glazing alpha changed'})
    images = [{'name': image.name, 'size': list(image.size), 'space': image.colorspace_settings.name,
               'packed': bool(image.packed_file)} for image in bpy.data.images if image.type == 'IMAGE']
    report = {'asset_sha256': hashlib.sha256((ROOT / 'aster-configurator.glb').read_bytes()).hexdigest(),
              'source_sha256': source_hash,
              'passed': not failures, 'failures': failures, 'expected_open_surfaces': notices,
              'source_objects': len(expected), 'imported_objects': len(actual),
              'triangles': sum(x['triangles'] for x in actual.values()), 'images': images,
              'exterior_boundary': exterior, 'objects': actual}
    (ROOT / 'validation').mkdir(exist_ok=True)
    (ROOT / 'validation/blender-roundtrip.json').write_text(json.dumps(report, indent=2))
    return {k: v for k, v in report.items() if k != 'objects'}


if __name__ == '__main__':
    report = run()
    print(json.dumps({k: v for k, v in report.items() if k not in ('expected_open_surfaces', 'images')}, indent=2))
    if not report['passed']:
        raise RuntimeError('Round-trip validation failed; see validation/blender-roundtrip.json')
