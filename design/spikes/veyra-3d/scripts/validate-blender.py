"""Read-only Veyra source/evaluated GLB round-trip checks for background Blender."""

import contextlib
import hashlib
import io
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy

ROOT = Path(sys.argv[sys.argv.index('--') + 1]).resolve() if '--' in sys.argv else Path(__file__).resolve().parents[1]
GROUPS = ('Architecture', 'Glazing', 'ExteriorDetails', 'ShallowInterior')
EXPECTED_EXTERIOR = {'Cladding_Front', 'Cladding_Rear', 'Cladding_LeftGable', 'Cladding_RightGable'}
SURFACE_MARKERS = ('Glass', 'Glazing', 'Curtain', 'Leaf', 'Leaves', 'Solar', 'Grid', 'Blind', 'Towel', 'Linen', 'Rug', 'Vine', 'String', 'Screen')
CONSOLIDATED_MARKERS = ('Landing', 'Steps', 'Hangers', 'Downlight', 'Hob_Ring', 'CurtainTab', 'CoffeeTable_Leg', 'Dining_Leg', 'Chair', 'Plant', 'Books', 'Mug', 'Keys', 'Desk_', 'OutletCorner', 'TrailingPlant')
THIN_BEVEL_BOXES = ('TV_Screen', 'BedroomDesk_Display', 'BedroomDesk_DisplayWindow', 'BedroomDesk_DisplaySidebar')
REVOLVED_PROFILE_OBJECTS = ('BedroomDesk_Cup', 'CoffeeTable_Cup', 'Dining_CupFront', 'Dining_CupRear')
MIXED_CONSOLIDATED_OBJECTS = ('CoffeeTable_Plant', 'MediaConsole_Plant', 'EntryStorage_Plant', 'Dining_Plant', 'BedroomStorage_TrailingPlant', 'BedroomOfficeChair')
OUTLET_OBJECTS = ('Kitchen_OutletReturn', 'Kitchen_OutletCorner')


def finite(value):
    return all(math.isfinite(float(component)) for component in value)


def mesh_record(obj, evaluated=True):
    evaluated_obj = obj.evaluated_get(bpy.context.evaluated_depsgraph_get()) if evaluated else obj
    data = evaluated_obj.to_mesh() if evaluated else evaluated_obj.data
    data.calc_loop_triangles()
    points = [evaluated_obj.matrix_world @ vertex.co for vertex in data.vertices]
    record = {
        'triangles': len(data.loop_triangles),
        'bounds': [[min(point[index] for point in points) for index in range(3)], [max(point[index] for point in points) for index in range(3)]] if points else None,
        'materials': [material.name if material else None for material in data.materials],
        'nonfinite': sum(not finite(point) for point in points),
        'zero_area': sum(triangle.area < 1e-12 for triangle in data.loop_triangles),
        'zero_area_distinct': 0,
        'zero_area_redundant': 0,
        'zero_area_coincident_pairs': 0,
        'zero_area_examples': [],
        'zero_normals': sum((not finite(polygon.normal)) or polygon.normal.length < 1e-8 for polygon in data.polygons),
        'uv_layers': len(data.uv_layers),
        'uv_nonfinite': sum(not finite(uv.uv) for layer in data.uv_layers for uv in layer.data),
    }
    for triangle in data.loop_triangles:
        if triangle.area >= 1e-12:
            continue
        triangle_points = [evaluated_obj.matrix_world @ data.vertices[index].co for index in triangle.vertices]
        pairs = [(left, right) for left in range(3) for right in range(left) if (triangle_points[left] - triangle_points[right]).length < 1e-7]
        if pairs:
            record['zero_area_redundant'] += 1
            record['zero_area_coincident_pairs'] += len(pairs)
        else:
            record['zero_area_distinct'] += 1
        if len(record['zero_area_examples']) < 3:
            record['zero_area_examples'].append({'triangle_vertices': list(triangle.vertices), 'coincident_pairs': pairs})
    record['modifier_types'] = [modifier.type for modifier in obj.modifiers]
    bm = bmesh.new()
    bm.from_mesh(data)
    record['boundary_edges'] = sum(edge.is_boundary for edge in bm.edges)
    record['nonmanifold_edges'] = sum(not edge.is_manifold for edge in bm.edges)
    record['volume'] = bm.calc_volume(signed=True) if bm.faces else 0.0
    bm.free()
    if evaluated:
        evaluated_obj.to_mesh_clear()
    return record


def classify_topology(name, record):
    if record['boundary_edges'] == 0 and record['nonmanifold_edges'] == 0:
        return None
    if any(marker.lower() in name.lower() for marker in SURFACE_MARKERS):
        return 'intentional open/sheet surface'
    if any(marker.lower() in name.lower() for marker in CONSOLIDATED_MARKERS):
        return 'consolidated assembly with intentional overlapping contacts'
    return 'open or assembled authored mesh; retained for review'


def degenerate_origin(name, record):
    if not record['zero_area']:
        return None
    if record['zero_area_distinct']:
        return 'distinct collinear/zero-area triangle; actionable degeneracy'
    if name in THIN_BEVEL_BOXES or 'BEVEL' in record['modifier_types']:
        return 'redundant coincident triangles from evaluated Bevel tessellation on a thin box'
    if name == 'Downlight':
        return 'redundant coincident triangles from applied bevel tessellation on consolidated cylindrical trim/lens parts'
    if name in REVOLVED_PROFILE_OBJECTS:
        return 'redundant coincident pole vertices from a revolved/lathed profile'
    if name in OUTLET_OBJECTS:
        return 'redundant coincident triangles from applied bevel/primitive tessellation in a consolidated outlet assembly'
    if name in MIXED_CONSOLIDATED_OBJECTS:
        return 'redundant coincident triangles in a consolidated mixed primitive assembly; exact component origin is lost after joining'
    return 'redundant coincident triangles; origin not inferred from current datablock'


def degenerate_notice(name, record):
    origin = degenerate_origin(name, record)
    if origin is None:
        return None
    recommendation = None
    if record['zero_area_distinct']:
        recommendation = 'Remove or retessellate only the distinct zero-area faces in a disposable authoring copy.'
    elif name in THIN_BEVEL_BOXES or 'BEVEL' in record['modifier_types']:
        recommendation = 'If required, reduce bevel width below the thin dimension limit or remove only collapsed terminal faces before export.'
    elif name == 'Downlight' or name in OUTLET_OBJECTS or name in MIXED_CONSOLIDATED_OBJECTS:
        recommendation = 'If required, remove only coincident faces from the generated component meshes before consolidation; preserve the visible bevel.'
    elif name in REVOLVED_PROFILE_OBJECTS:
        recommendation = 'If required, use one shared vertex at each radius-zero profile pole or omit only its redundant faces.'
    return {'name': name, 'origin': origin, 'zero_area_triangles': record['zero_area'], 'redundant_coincident_triangles': record['zero_area_redundant'], 'distinct_zero_area_triangles': record['zero_area_distinct'], 'coincident_vertex_pairs': record['zero_area_coincident_pairs'], 'examples': record['zero_area_examples'], 'recommendation': recommendation}


def image_records():
    return sorted({
        (image.name, tuple(image.size), image.colorspace_settings.name, bool(image.packed_file))
        for image in bpy.data.images if image.type == 'IMAGE'
    })


def live_meshes():
    objects = {}
    for group in GROUPS:
        collection = bpy.data.collections.get('Veyra_' + group)
        if collection:
            for obj in collection.all_objects:
                if obj.type == 'MESH' and not obj.hide_render:
                    objects[obj.name] = obj
    return objects


def run():
    if not bpy.app.background:
        raise RuntimeError('Run this check in background Blender only.')
    source_hash = hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest()
    source = bpy.data.scenes.get('Veyra_Source')
    if source is None:
        raise RuntimeError('Veyra_Source scene is missing.')
    bpy.context.window.scene = source
    source_objects = live_meshes()
    source_records = {name: mesh_record(obj) for name, obj in source_objects.items()}
    source_images = image_records()
    source_materials = {material.name: material for material in bpy.data.materials}
    failures, notices = [], []
    for name, record in source_records.items():
        if record['nonfinite'] or record['zero_area_distinct'] or record['zero_normals'] or record['uv_nonfinite']:
            failures.append({'name': name, 'issue': 'source evaluated numerical/degenerate geometry', 'details': record})
        elif record['zero_area']:
            notices.append({**degenerate_notice(name, record), 'stage': 'source'})
        if record['boundary_edges'] or record['nonmanifold_edges']:
            reason = classify_topology(name, record)
            if reason:
                notices.append({'name': name, 'reason': reason, 'boundary_edges': record['boundary_edges'], 'nonmanifold_edges': record['nonmanifold_edges']})
            else:
                failures.append({'name': name, 'issue': 'unexpected nonmanifold source mesh', 'details': record})
        if record['boundary_edges'] == 0 and record['nonmanifold_edges'] == 0 and record['volume'] < -1e-9:
            failures.append({'name': name, 'issue': 'inverted closed source solid', 'volume': record['volume']})

    exterior = sorted(name for name, record in source_records.items() if 'ExteriorCladding' in record['materials'])
    if set(exterior) != EXPECTED_EXTERIOR:
        failures.append({'issue': 'source ExteriorCladding boundary', 'actual': exterior, 'expected': sorted(EXPECTED_EXTERIOR)})
    if 'InteriorJoinery' not in source_materials or 'Glazing' not in source_materials:
        failures.append({'issue': 'source target material missing'})
    glazing = source_materials.get('Glazing')
    glazing_node = glazing.node_tree.nodes.get('Principled BSDF') if glazing and glazing.use_nodes else None
    if glazing_node and abs(glazing_node.inputs['Alpha'].default_value - 0.085) > 1e-6:
        failures.append({'issue': 'source Glazing alpha', 'actual': glazing_node.inputs['Alpha'].default_value, 'expected': 0.085})
    if glazing_node is None:
        failures.append({'issue': 'source Glazing Principled BSDF missing'})

    with contextlib.redirect_stdout(io.StringIO()):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=str(ROOT / 'veyra-configurator.glb'), import_pack_images=True)
    imported_objects = {obj.name: obj for obj in bpy.context.scene.objects if obj.type == 'MESH'}
    imported_records = {name: mesh_record(obj, evaluated=False) for name, obj in imported_objects.items()}
    for name in sorted(set(source_records) | set(imported_records)):
        if name not in source_records or name not in imported_records:
            failures.append({'name': name, 'issue': 'round-trip object name missing/extra'})
            continue
        source_record, imported_record = source_records[name], imported_records[name]
        source_materials = [material for material in source_record['materials'] if material is not None]
        imported_materials = [material for material in imported_record['materials'] if material is not None]
        if source_record['triangles'] != imported_record['triangles'] or source_materials != imported_materials:
            failures.append({'name': name, 'issue': 'triangle/material assignment changed', 'source': {'triangles': source_record['triangles'], 'materials': source_record['materials']}, 'import': {'triangles': imported_record['triangles'], 'materials': imported_record['materials']}})
        if source_record['bounds'] and imported_record['bounds']:
            error = max(abs(source_record['bounds'][side][axis] - imported_record['bounds'][side][axis]) for side in range(2) for axis in range(3))
            if error > 2e-5:
                failures.append({'name': name, 'issue': 'round-trip bounds', 'error_m': error})
        if imported_record['nonfinite'] or imported_record['zero_area_distinct'] or imported_record['zero_normals'] or imported_record['uv_nonfinite']:
            failures.append({'name': name, 'issue': 'imported nonfinite or degenerate geometry', 'details': imported_record})
        elif imported_record['zero_area']:
            notices.append({**degenerate_notice(name, imported_record), 'stage': 'imported'})
        if imported_record['boundary_edges'] == 0 and imported_record['nonmanifold_edges'] == 0 and imported_record['volume'] < -1e-9:
            failures.append({'name': name, 'issue': 'inverted closed imported solid', 'volume': imported_record['volume']})

    imported_images = image_records()
    if len(source_images) != len(imported_images):
        failures.append({'issue': 'source/import image count changed', 'source': len(source_images), 'imported': len(imported_images)})
    for image_name, size, space, packed in imported_images:
        if list(size) != [1024, 1024] or not packed:
            failures.append({'image': image_name, 'issue': 'embedded image resolution/packing', 'size': list(size), 'packed': packed})
        if any(marker in image_name.lower() for marker in ('normal', 'orm', 'roughness', 'metallic')) and space != 'Non-Color':
            failures.append({'image': image_name, 'issue': 'non-color map colorspace', 'actual': space})
        if any(marker in image_name.lower() for marker in ('basecolor', 'diffuse', 'floor-base')) and space != 'sRGB':
            failures.append({'image': image_name, 'issue': 'base-color map colorspace', 'actual': space})

    report = {
        'asset_sha256': hashlib.sha256((ROOT / 'veyra-configurator.glb').read_bytes()).hexdigest(),
        'source_sha256': source_hash,
        'passed': not failures,
        'failures': failures,
        'notices': notices,
        'degenerate_tessellation_policy': 'Zero-area triangles with coincident vertex positions are recorded as redundant tessellation notices, not intentional geometry. Origin labels are evidence-based traces to bevel, revolved-profile, primitive, or consolidated-assembly generation; distinct collinear zero-area triangles remain failures. No degeneracy is waived solely by object name.',
        'degenerate_totals': {
            'source_zero_area_triangles': sum(record['zero_area'] for record in source_records.values()),
            'source_redundant_coincident_triangles': sum(record['zero_area_redundant'] for record in source_records.values()),
            'source_distinct_zero_area_triangles': sum(record['zero_area_distinct'] for record in source_records.values()),
            'imported_zero_area_triangles': sum(record['zero_area'] for record in imported_records.values()),
            'imported_redundant_coincident_triangles': sum(record['zero_area_redundant'] for record in imported_records.values()),
            'imported_distinct_zero_area_triangles': sum(record['zero_area_distinct'] for record in imported_records.values()),
        },
        'source_objects': len(source_records),
        'imported_objects': len(imported_records),
        'source_triangles': sum(record['triangles'] for record in source_records.values()),
        'imported_triangles': sum(record['triangles'] for record in imported_records.values()),
        'source_images': [{'name': name, 'size': list(size), 'space': space, 'packed': packed} for name, size, space, packed in source_images],
        'imported_images': [{'name': name, 'size': list(size), 'space': space, 'packed': packed} for name, size, space, packed in imported_images],
        'exterior_boundary': exterior,
        'interior_joinery_objects': sum('InteriorJoinery' in record['materials'] for record in imported_records.values()),
    }
    validation = ROOT / 'validation'
    validation.mkdir(exist_ok=True)
    (validation / 'blender-roundtrip.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    return report


if __name__ == '__main__':
    report = run()
    print(json.dumps({key: value for key, value in report.items() if key not in ('source_images', 'imported_images')}, indent=2))
    if not report['passed']:
        raise RuntimeError('Veyra Blender round-trip validation failed; see validation/blender-roundtrip.json')
