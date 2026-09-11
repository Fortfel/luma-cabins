"""Targeted wall, sink and bed corrections. Editable Blender source only."""

import importlib.util
import json
import math
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[1]


def apply(build):
    root = bpy.data.objects.get('Niva')
    assert bpy.context.scene.name == 'Niva_Source' and root
    assert root.get('layout_review_revision') == 2, 'Apply the approved layout adjustments first'
    if root.get('surface_review_revision') == 1:
        print('Surface review already applied; no changes made')
        return
    required = ('Interior_FrontLining', 'KitchenCabinetCarcass', 'SinkBasinBottom', 'SinkSide_0.305',
                'SinkSide_0.695', 'SinkRim_1.621', 'SinkRim_1.979', 'Bed_FixedBase', 'Loft_FixedStructure')
    assert all(name in bpy.data.objects for name in required), 'Expected source objects are missing'

    def boolean(obj, operation, center, dimensions):
        bpy.ops.mesh.primitive_cube_add(size=1)
        cutter = bpy.context.object
        cutter.name = 'TemporarySurfaceReviewCutter'
        cutter.matrix_world = root.matrix_world @ Matrix.Translation(center) @ Matrix.Diagonal((*dimensions, 1))
        cutter.data.materials.append(obj.data.materials[0])
        bpy.context.view_layer.update()
        modifier = obj.modifiers.new('Surface review geometry', 'BOOLEAN')
        modifier.operation, modifier.solver, modifier.object = operation, 'EXACT', cutter
        bpy.context.view_layer.objects.active = obj
        # Cut the authored solid, retaining its existing bevel/triangulation modifiers.
        bpy.ops.object.modifier_move_to_index(modifier=modifier.name, index=0)
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        bpy.data.objects.remove(cutter, do_unlink=True)

    # Preserve door/window openings while clipping only the exposed outer lining ends.
    boolean(bpy.data.objects['Interior_FrontLining'], 'INTERSECT', (0, 0, 3), (3.34, 20, 20))
    boolean(bpy.data.objects['KitchenCabinetCarcass'], 'DIFFERENCE', (0.50, 1.80, 1.60), (0.415, 0.385, 0.42))

    sink_material = bpy.data.objects['SinkBasinBottom'].data.materials[0]
    for name in ('SinkBasinBottom', 'SinkSide_0.305', 'SinkSide_0.695', 'SinkRim_1.621', 'SinkRim_1.979'):
        bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)

    # Rounded-rectangle rings form one closed shell: flange, sloped bowl, floor and underside.
    ring_specs = ((0.405, 0.375, 0.035, 1.617), (0.378, 0.338, 0.028, 1.610),
                  (0.315, 0.275, 0.045, 1.425), (0.335, 0.295, 0.045, 1.408))
    vertices = []
    for width, depth, radius, z in ring_specs:
        for sign_x, sign_y, start in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
            cx, cy = sign_x * (width / 2 - radius), sign_y * (depth / 2 - radius)
            for step in range(8):
                angle = math.radians(start + step * 90 / 7)
                vertices.append((0.50 + cx + radius * math.cos(angle),
                                 1.80 + cy + radius * math.sin(angle), z))
    count = 32
    faces = []
    for first, second in ((0, 1), (1, 2), (3, 0)):
        for index in range(count):
            next_index = (index + 1) % count
            faces.append((first * count + index, first * count + next_index,
                          second * count + next_index, second * count + index))
    faces.extend((tuple(range(2 * count, 3 * count)), tuple(range(4 * count - 1, 3 * count - 1, -1))))
    mesh = bpy.data.meshes.new('Sink_ClosedBasin')
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    assert all(edge.is_manifold for edge in bm.edges) and bm.calc_volume(signed=True) > 0
    bm.to_mesh(mesh)
    bm.free()
    basin = bpy.data.objects.new('Sink_ClosedBasin', mesh)
    bpy.data.collections['ShallowInterior'].objects.link(basin)
    basin.data.materials.append(sink_material)
    basin.parent = root
    drain_material = bpy.data.materials.get('SinkDrainMetal') or build.material(
        'SinkDrainMetal', (0.20, 0.22, 0.23), roughness=0.32, metallic=0.75)
    for name, radius, bottom, top, material in (
        ('Sink_DrainFlange', 0.025, 1.4255, 1.4295, drain_material),
        ('Sink_DrainOpening', 0.009, 1.4295, 1.431, bpy.data.materials['BlackFramesAndFixtures']),
    ):
        drain = build.cylinder(name, (0.50, 1.80, bottom), (0.50, 1.80, top), radius,
                               material, 'ShallowInterior', vertices=32)
        drain.parent = root

    def local_bounds(obj):
        inverse = root.matrix_world.inverted()
        points = [inverse @ obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
        return Vector([min(point[i] for point in points) for i in range(3)]), Vector(
            [max(point[i] for point in points) for i in range(3)])

    bpy.context.view_layer.update()
    floor_min, floor_max = local_bounds(bpy.data.objects['Loft_FixedStructure'])
    bed_min, bed_max = local_bounds(bpy.data.objects['Bed_FixedBase'])
    offset = (floor_min + floor_max - bed_min - bed_max) / 2
    offset.z = 0
    for obj in bpy.context.scene.objects:
        if obj.name.startswith('Bed_') or obj.name in ('LoftSideTable', 'LoftBook'):
            obj.matrix_basis = Matrix.Translation(offset) @ obj.matrix_basis
    bpy.context.view_layer.update()
    bed_min, bed_max = local_bounds(bpy.data.objects['Bed_FixedBase'])
    assert abs((bed_min.x + bed_max.x) / 2) < 1e-5
    assert abs((bed_min.y + bed_max.y - floor_min.y - floor_max.y) / 2) < 1e-5
    assert bed_max.y < 1.51, 'Keep the rear ladder opening clear'
    root['surface_review_revision'] = 1
    root['review_status'] = 'Wall/sink/bed corrections awaiting Blender review; prior exports are stale'
    print(json.dumps({'lining_half_width': 1.67, 'basin_depth': 0.185,
                      'bed_offset_local': list(offset), 'bed_center_local': list((bed_min + bed_max) / 2),
                      'bed_to_ladder_opening_gap': 1.51 - bed_max.y}))


if __name__ == '__main__':
    spec = importlib.util.spec_from_file_location('niva_build', ROOT / 'scripts/build-niva.py')
    build = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(build)
    apply(build)
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'niva.blend'))
