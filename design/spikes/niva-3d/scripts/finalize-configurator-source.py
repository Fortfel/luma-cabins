"""Repair the one stove handle and fit the new product camera; preserve the original file."""

import json
import math
from pathlib import Path

import bmesh
import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[1]


def clean_handle():
    root = bpy.data.objects['Niva']
    if root.get('configurator_handle_topology_clean'):
        return
    handle = bpy.data.objects['StoveDoorHandle']
    depsgraph = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(handle.evaluated_get(depsgraph), preserve_all_data_layers=True, depsgraph=depsgraph)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-6)
    bmesh.ops.dissolve_degenerate(bm, dist=1e-8, edges=list(bm.edges))
    assert all(edge.is_manifold for edge in bm.edges) and all(face.calc_area() > 1e-12 for face in bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    handle.modifiers.clear()
    handle.data = mesh
    root['configurator_handle_topology_clean'] = True


def export_handle_patch():
    source = bpy.context.scene
    root, handle = bpy.data.objects['Niva'], bpy.data.objects['StoveDoorHandle']
    temporary = bpy.data.scenes.new('Niva_HandleExport')
    root_copy, handle_copy = root.copy(), handle.copy()
    handle_copy.data = handle.data.copy()
    mesh_copy = handle_copy.data
    temporary.collection.objects.link(root_copy)
    temporary.collection.objects.link(handle_copy)
    root_copy.matrix_world = root.matrix_world.copy()
    handle_copy.parent = root_copy
    handle_copy.matrix_parent_inverse = handle.matrix_parent_inverse.copy()
    handle_copy.matrix_basis = handle.matrix_basis.copy()
    try:
        bpy.context.window.scene = temporary
        bpy.ops.export_scene.gltf(filepath=str(ROOT / 'validation/stove-handle-fixed.glb'), export_format='GLB',
                                  use_active_scene=True, use_selection=False, export_apply=True, export_yup=True,
                                  export_normals=True, export_tangents=True, export_texcoords=True,
                                  export_cameras=False, export_lights=False, export_animations=False)
    finally:
        bpy.context.window.scene = source
        bpy.data.scenes.remove(temporary)
        bpy.data.objects.remove(handle_copy, do_unlink=True)
        bpy.data.objects.remove(root_copy, do_unlink=True)
        if mesh_copy.users == 0:
            bpy.data.meshes.remove(mesh_copy)


def apply():
    assert bpy.context.scene.name == 'Niva_Source'
    root = bpy.data.objects['Niva']
    handle = bpy.data.objects['StoveDoorHandle']
    if not root.get('configurator_handle_fixed'):
        body = bpy.data.objects['StoveBody']
        angle = handle.rotation_euler.z
        handle.location = Matrix.Rotation(angle, 3, 'Z') @ Vector((0.165, -0.281, 1.13)) + Vector((body.location.x, body.location.y, 0))
        bpy.context.view_layer.update()
        for z in (-0.052, 0.052):
            bpy.ops.mesh.primitive_cube_add(size=1)
            mount = bpy.context.object
            mount.name = 'TemporaryHandleMount'
            mount.matrix_world = handle.matrix_world @ Matrix.Translation((0, 0.025, z)) @ Matrix.Diagonal((0.020, 0.065, 0.022, 1))
            mount.data.materials.append(handle.data.materials[0])
            bpy.context.view_layer.update()
            modifier = handle.modifiers.new('Attached stove handle mount', 'BOOLEAN')
            modifier.operation, modifier.solver, modifier.object = 'UNION', 'EXACT', mount
            bpy.context.view_layer.objects.active = handle
            bpy.ops.object.modifier_move_to_index(modifier=modifier.name, index=0)
            bpy.ops.object.modifier_apply(modifier=modifier.name)
            bpy.data.objects.remove(mount, do_unlink=True)
        for modifier in handle.modifiers:
            if modifier.type == 'BEVEL':
                modifier.width = 0.003
        root['configurator_handle_fixed'] = True

    clean_handle()
    scene = bpy.context.scene
    camera = bpy.data.objects['Niva_CanonicalCamera']
    scene.camera = camera
    scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = 954, 866, 100
    target = Vector((0, -0.30, 3.0))
    azimuth, elevation, distance = math.radians(-18), math.radians(1), 18.5
    camera.location = target + distance * Vector((math.sin(azimuth) * math.cos(elevation),
                                                 -math.cos(azimuth) * math.cos(elevation), math.sin(elevation)))
    camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.lens, camera.data.shift_x, camera.data.shift_y = 74, 0, 0
    camera.data.sensor_width = 36
    bpy.context.view_layer.update()

    def projected_bounds():
        depsgraph = bpy.context.evaluated_depsgraph_get()
        points = []
        for obj in scene.objects:
            if obj.type != 'MESH':
                continue
            evaluated = obj.evaluated_get(depsgraph)
            mesh = evaluated.to_mesh()
            points.extend(world_to_camera_view(scene, camera, evaluated.matrix_world @ vertex.co) for vertex in mesh.vertices)
            evaluated.to_mesh_clear()
        return ([min(point[i] for point in points) for i in range(2)],
                [max(point[i] for point in points) for i in range(2)])

    low, high = projected_bounds()
    camera.data.lens *= min(0.92 / (high[0] - low[0]), 0.94 / (high[1] - low[1]))
    low, high = projected_bounds()
    camera.data.shift_x += (low[0] + high[0]) / 2 - 0.5
    camera.data.shift_y += ((low[1] + high[1]) / 2 - 0.5) * 866 / 954
    bpy.context.view_layer.update()
    low, high = projected_bounds()
    conversion = Matrix.Rotation(-math.pi / 2, 4, 'X')
    record = {'approximate_concept_camera': True, 'purpose': 'Frontal three-quarter product view revealing kitchen and coffee-table joinery',
              'resolution': [954, 866], 'aspect_ratio': 954 / 866,
              'location_blender': list(camera.location), 'target_blender': list(target),
              'location_gltf': list(conversion @ camera.location), 'target_gltf': list(conversion @ target),
              'azimuth_degrees': -18, 'elevation_degrees': 1, 'distance': distance,
              'matrix_world_blender': [list(row) for row in camera.matrix_world],
              'matrix_world_gltf': [list(row) for row in conversion @ camera.matrix_world],
              'projection_matrix': [list(row) for row in camera.calc_matrix_camera(bpy.context.evaluated_depsgraph_get(), x=954, y=866)],
              'matrix_storage': 'row-major rows', 'lens_mm': camera.data.lens, 'sensor_width_mm': camera.data.sensor_width,
              'shift_x': camera.data.shift_x, 'shift_y': camera.data.shift_y,
              'near': camera.data.clip_start, 'far': camera.data.clip_end,
              'projected_bounds': {'min': low, 'max': high}, 'background_srgb': '#f7f5f0'}
    (ROOT / 'niva-camera.json').write_text(json.dumps(record, indent=2), encoding='utf-8')
    root['canonical_camera_contract'] = 'niva-camera.json'
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'niva-configurator.blend'))
    print(json.dumps({'camera': record['location_blender'], 'lens': record['lens_mm'], 'shift': [record['shift_x'], record['shift_y']],
                      'projected_bounds': record['projected_bounds'], 'source': 'niva-configurator.blend'}))


if __name__ == '__main__':
    apply()
    export_handle_patch()
