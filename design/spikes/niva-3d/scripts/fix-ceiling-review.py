"""Restore the front loft-bed position and correct intersecting light fixtures."""

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
    assert root.get('surface_review_revision') == 1
    if root.get('ceiling_review_revision') == 1:
        print('Ceiling review already applied; no changes made')
        return
    required = ('Bed_FixedBase', 'LoftSideTable', 'LoftBook', 'Loft_WarmDiffuser',
                'Loft_ReviewSoftbox', 'Interior_LivingSoftbox', 'Interior_KitchenSoftbox',
                'InteriorCeilingFixture_-1.1', 'InteriorCeilingFixture_0.3', 'InteriorCeilingFixture_1.4')
    assert all(name in bpy.data.objects for name in required), 'Expected source objects are missing'

    # Centering is left-to-right only; restore the original placement beside the front window.
    bed = bpy.data.objects['Bed_FixedBase']
    offset = Vector((-bed.location.x, -0.98 - bed.location.y, 0))
    for obj in bpy.context.scene.objects:
        if obj.name.startswith('Bed_') or obj.name in ('LoftSideTable', 'LoftBook'):
            obj.matrix_basis = Matrix.Translation(offset) @ obj.matrix_basis

    for name in ('Loft_WarmDiffuser', 'Loft_ReviewSoftbox', 'Interior_LivingSoftbox', 'Interior_KitchenSoftbox'):
        bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)

    root_scale = root.matrix_world.to_scale()
    locations = []
    # Each housing fits inside a clear beam bay and meets, rather than intersects, the ceiling.
    for index, (old_suffix, y, power) in enumerate((('-1.1', -1.485, 25), ('0.3', -0.025, 25), ('1.4', 1.505, 30)), 1):
        fixture = bpy.data.objects[f'InteriorCeilingFixture_{old_suffix}']
        diffuser = bpy.data.objects[f'InteriorCeilingDiffuser_{old_suffix}']
        fixture.location.y, fixture.location.z = y, 3.516
        diffuser.location.y, diffuser.location.z = y, 3.459
        light = build.area(f'Interior_FixtureLight_{index:02}',
                           root.matrix_world @ Vector((0.55, y, 3.447)),
                           root.matrix_world @ Vector((0.55, y, 2.447)),
                           power, 0.055 * root_scale.x, (1, 0.83, 0.62), size_y=0.175 * root_scale.y)
        light['purpose'] = 'Review-only downward light, aligned with visible ceiling diffuser'
        locations.append([0.55, y, 3.516])

    table = bpy.data.objects['LoftSideTable']
    x, y = table.location.x, table.location.y + 0.12
    table_top = table.location.z + 0.0225
    bpy.data.objects['LoftBook'].location.y = table.location.y - 0.10
    metal = bpy.data.materials['BlackFramesAndFixtures']
    shade_material = build.material('LoftBedsideLampShade', (0.70, 0.57, 0.37), roughness=0.8,
                                    emission=(1, 0.72, 0.39), strength=0.20)
    for name, bottom, top, radius in (
        ('LoftBedsideLamp_Base', table_top, table_top + 0.025, 0.055),
        ('LoftBedsideLamp_Stem', table_top + 0.025, table_top + 0.20, 0.012),
    ):
        obj = build.cylinder(name, (x, y, bottom), (x, y, top), radius, metal, 'ShallowInterior', vertices=32)
        obj.parent = root

    # A hollow shade, not another exposed ceiling-emission strip.
    segments = 32
    rings = ((0.10, table_top + 0.145), (0.07, table_top + 0.345),
             (0.064, table_top + 0.345), (0.094, table_top + 0.145))
    vertices = [(x + radius * math.cos(index * math.tau / segments),
                 y + radius * math.sin(index * math.tau / segments), z)
                for radius, z in rings for index in range(segments)]
    faces = []
    for ring in range(4):
        next_ring = (ring + 1) % 4
        for index in range(segments):
            next_index = (index + 1) % segments
            faces.append((ring * segments + index, ring * segments + next_index,
                          next_ring * segments + next_index, next_ring * segments + index))
    mesh = bpy.data.meshes.new('LoftBedsideLamp_Shade')
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    assert all(edge.is_manifold for edge in bm.edges) and bm.calc_volume(signed=True) > 0
    bm.to_mesh(mesh)
    bm.free()
    shade = bpy.data.objects.new('LoftBedsideLamp_Shade', mesh)
    bpy.data.collections['ShallowInterior'].objects.link(shade)
    shade.data.materials.append(shade_material)
    shade.parent = root
    for polygon in mesh.polygons:
        polygon.use_smooth = abs(polygon.normal.z) < 0.9
    lamp_light = build.area('Loft_BedsideLampLight', root.matrix_world @ Vector((x, y, table_top + 0.245)),
                            root.matrix_world @ Vector((x, y, table_top - 0.755)),
                            4, 0.075, (1, 0.76, 0.48))
    lamp_light['purpose'] = 'Review-only downward emission through the bedside shade opening'

    bpy.context.view_layer.update()
    root['ceiling_review_revision'] = 1
    root['review_status'] = 'Bed and ceiling-light corrections awaiting Blender review; exports remain stale'
    print(json.dumps({'bed_center_local': list(bed.location), 'ceiling_fixture_centers': locations,
                      'loft_ceiling_strip_removed': True, 'oversized_interior_area_lights_removed': True,
                      'bedside_lamp_top': table_top + 0.345}))


if __name__ == '__main__':
    spec = importlib.util.spec_from_file_location('niva_build', ROOT / 'scripts/build-niva.py')
    build = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(build)
    apply(build)
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'niva.blend'))
