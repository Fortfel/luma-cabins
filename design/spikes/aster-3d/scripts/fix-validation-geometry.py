"""Resolve defects identified by validate-blender.py, preserving scene design."""

import importlib.util
from pathlib import Path

import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('aster_layout', ROOT / 'scripts/revise-layout.py')
r = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r)
b = r.b


def apply_fixes():
    s = bpy.context.scene
    if s.name != 'Aster_Source' or s.get('layout_revision') != 6:
        raise RuntimeError('Use Aster revision 6.')
    if s.get('validation_geometry_fix'):
        raise RuntimeError('Geometry correction already applied.')
    r.setup()
    # Apply opening booleans to whole boards instead of touching sub-prisms that
    # create internal coincident faces when glTF seams are welded for inspection.
    definitions = [
        ('Front', 'x', -b.HALF_Y, b.WIDTH, [(-1.8, 1.05, 0.78, 2.91), (2.1, 3.05, b.FLOOR, 2.89)], False),
        ('Rear', 'x', b.HALF_Y, b.WIDTH, [(-1, 0.2, 1.55, 2.60)], False),
        ('LeftGable', 'y', -b.HALF_X, b.DEPTH, [(0.075, 1.025, b.FLOOR, 2.89)], True),
        ('RightGable', 'y', b.HALF_X, b.DEPTH, [(0.70, 1.90, 1.55, 2.60), (-1.98, -0.78, 1.55, 2.60)], True),
    ]
    for label, axis, plane, span, openings, gable in definitions:
        r.remove_prefixes('Cladding_' + label)
        obj = b.elevation('Cladding_' + label, axis, plane, span, [], gable)
        obj.modifiers.clear()
        for lo, hi, bottom, top in openings:
            center = ((lo + hi) / 2, plane, (bottom + top) / 2) if axis == 'x' else (plane, (lo + hi) / 2, (bottom + top) / 2)
            dims = (hi - lo, 0.8, top - bottom) if axis == 'x' else (0.8, hi - lo, top - bottom)
            b.cut(obj, center, dims)
        bevel = obj.modifiers.new('Cladding edge glints', 'BEVEL')
        bevel.width, bevel.segments = 0.0005, 1
    # Restrict edge changes to the precise failed objects, preserving the reviewed
    # upholstery/furniture radii elsewhere.
    failed = {'BedsideFlowers_Soil', 'DiningMug_Coffee', 'KitchenHerbs_Soil',
              'LaptopDisplay', 'LaptopTrackpad', 'TVKitchenFlowerPlant_Soil', 'TVShelfPlant_Soil'}
    failed.update(o.name for o in s.objects if o.name.startswith('HobZone_'))
    fixes = []
    for obj in s.objects:
        if obj.type != 'MESH' or obj.name not in failed:
            continue
        extents = [max(v.co[i] for v in obj.data.vertices) - min(v.co[i] for v in obj.data.vertices) for i in range(3)]
        minimum = min(extents)
        for modifier in obj.modifiers:
            if modifier.type == 'BEVEL' and minimum > 0 and modifier.width > minimum * 0.20:
                fixes.append(obj.name)
                modifier.width = minimum * 0.20
    faucet = s.objects['KitchenFaucet']
    bm = bmesh.new()
    bm.from_mesh(faucet.data)
    edges = [e for e in bm.edges if e.is_boundary]
    bmesh.ops.holes_fill(bm, edges=edges, sides=0)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(faucet.data)
    bm.free()
    for poly in faucet.data.polygons:
        if len(poly.vertices) > 4:
            poly.use_smooth = False
    # Blender cannot export tangent frames for some retained n-gons. Explicit
    # final triangulation keeps the authored outline while making normals portable.
    for obj in s.objects:
        if obj.type == 'MESH' and any(m and m.name in ('ExteriorCladding', 'InteriorJoinery', 'FixedStepTimber', 'FixedInteriorFloor') for m in obj.data.materials):
            obj.modifiers.new('Portable tangent triangulation', 'TRIANGULATE')
    repair_tangent_uvs()
    s['validation_geometry_fix'] = True
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'aster-source.blend'))
    return {'limited_bevels': fixes, 'cladding_opening_construction': 'whole-board boolean cuts', 'faucet': 'capped'}


def repair_tangent_uvs():
    # Only the specific faces whose bevel-interpolated UVs collapsed in the
    # validator. Keep evaluated shape/normals, replace zero-area UV slivers with
    # the same dimensional face projection, and retain editable mesh geometry.
    names = ('BathroomDoorStopJamb_1', 'BathroomDoorStopJamb_-1',
             'Cladding_LeftGable', 'Cladding_RightGable', 'DiningChairFront_Seat',
             'DiningChairLeft_Seat', 'WorkspaceChair_Seat')
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    for name in names:
        obj = bpy.context.scene.objects[name]
        evaluated = obj.evaluated_get(depsgraph)
        data = bpy.data.meshes.new_from_object(evaluated, preserve_all_data_layers=True, depsgraph=depsgraph)
        obj.modifiers.clear()
        obj.data = data
        data.name = name
        b.uv_project(obj)
