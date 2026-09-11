"""Repair roof-trim UVs and size/orient kitchen hardware on the current source.

Preserves the current in-memory scene and saved source before editing. No tests
or poster operations. Call the existing exporter/metadata functions afterward.
"""

import datetime
import importlib.util
import json
import shutil
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('niva_delivery', ROOT / 'scripts/refine-doors-kitchen.py')
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
TEXTURE_METRES = 1.83
SMALL_PULL_LENGTH = 0.14


def bounds(obj):
    points = [obj.matrix_world @ Vector(p) for p in obj.bound_box]
    return (Vector([min(p[i] for p in points) for i in range(3)]),
            Vector([max(p[i] for p in points) for i in range(3)]))


def roof_grain(obj):
    old = obj.data
    world_vertices = [obj.matrix_world @ p.co for p in old.vertices]
    faces = []
    # A single concave gable face folds its UV island over itself. Split at the
    # existing ridge vertices into coplanar quads, retaining all vertex positions.
    for face in old.polygons:
        indices = list(face.vertices)
        if len(indices) == 6:
            faces.append(tuple(i for i in indices if world_vertices[i].x <= 0.000001))
            faces.append(tuple(i for i in indices if world_vertices[i].x >= -0.000001))
        else:
            faces.append(tuple(indices))
    mesh = bpy.data.meshes.new(obj.name + '_GrainAligned')
    mesh.from_pydata([tuple(p.co) for p in old.vertices], [], faces)
    mesh.update()
    mesh.materials.append(bpy.data.objects['CeilingBeam_0'].active_material)
    obj.data = mesh
    uv = mesh.uv_layers.new(name='UVMap')
    ridge = [p for p in world_vertices if abs(p.x) < 0.000001]
    half_width = max(abs(p.x) for p in world_vertices)
    ridge_top = max(p.z for p in ridge)
    ridge_bottom = min(p.z for p in ridge)
    end_top = max(p.z for p in world_vertices if abs(p.x) > half_width - 0.000001)
    drop = ridge_top - end_top
    center_y = (min(p.y for p in world_vertices) + max(p.y for p in world_vertices)) / 2
    origin = Vector((0, center_y, (ridge_top + ridge_bottom) / 2))
    normal_matrix = obj.matrix_world.to_3x3().inverted().transposed()
    for face in mesh.polygons:
        points = [world_vertices[i] for i in face.vertices]
        side = -1 if sum(p.x for p in points) < 0 else 1
        along = Vector((side * half_width, 0, -drop)).normalized()
        across = Vector((side * drop, 0, half_width)).normalized()
        normal = (normal_matrix @ face.normal).normalized()
        for index in face.loop_indices:
            co = world_vertices[mesh.loops[index].vertex_index]
            relative = co - origin
            if abs(normal.y) > 0.9:
                # Broad front/rear face: timber width across U, grain along V.
                u, v = relative.dot(across), relative.dot(along)
            elif abs(normal.x) > 0.999:
                # Small end caps get a real 2D island rather than a sampled line.
                u, v = co.y - center_y, co.z - end_top
            else:
                # Soffit/top faces must include physical depth in their U axis.
                u, v = co.y - center_y, relative.dot(along)
            uv.data[index].uv = (u / TEXTURE_METRES, v / TEXTURE_METRES)
    obj['timber_uv_mapping'] = 'Slope-aligned grain, separate broad/depth/end islands; 1.83 m tile'
    obj['timber_material_reference'] = 'CeilingBeam_0 / FixedArchitecturalTimber'


def small_pulls():
    half = SMALL_PULL_LENGTH / 2
    for index in range(3):
        name = f'KitchenPull_1_{index}'
        obj = bpy.data.objects[name]
        low, high = bounds(obj)
        center = (low + high) / 2
        base.fit(obj, (center.x - half, 1.769, center.z - 0.007),
                 (center.x + half, 1.791, center.z + 0.007))
        for sign in (-1, 1):
            x = center.x + sign * 0.052
            base.fit(bpy.data.objects[name + f'_Mount_{sign}'],
                     (x - 0.007, 1.78, center.z - 0.007), (x + 0.007, 1.832, center.z + 0.007))
    for index in range(2):
        name = f'KitchenFridge_OverheadPull_{index}'
        low, high = bounds(bpy.data.objects[name])
        center = (low + high) / 2
        base.fit(bpy.data.objects[name], (1.217, center.y - half, center.z - 0.007),
                 (1.239, center.y + half, center.z + 0.007))
        for sign in (-1, 1):
            y = center.y + sign * 0.052
            base.fit(bpy.data.objects[name + f'_Mount_{sign}'],
                     (1.228, y - 0.007, center.z - 0.007), (1.273, y + 0.007, center.z + 0.007))


def fridge_pulls():
    # Front faces -X, so screen-left when viewed head-on is +Y (microwave side).
    y = 0.383
    for name, bottom, top in (('KitchenFridge_MainHandle', 1.52, 2.02),
                              ('KitchenFridge_FreezerHandle', 0.78, 1.12)):
        base.fit(bpy.data.objects[name], (1.146, y - 0.012, bottom), (1.174, y + 0.012, top))
        for sign, z in ((-1, bottom + 0.035), (1, top - 0.035)):
            base.fit(bpy.data.objects[name + f'_Mount_{sign}'],
                     (1.16, y - 0.012, z - 0.012), (1.214, y + 0.012, z + 0.012))
    for name in ('KitchenFridge_MainDoor', 'KitchenFridge_FreezerDoor'):
        bpy.data.objects[name]['hinge_side'] = 'Right when viewed head-on (-Y); vertical pull at left (+Y)'


def author():
    scene = bpy.context.scene
    root = scene.objects.get('Niva')
    if scene.name != 'Niva_Source' or not root or Path(bpy.data.filepath).resolve() != (ROOT / 'niva-final.blend').resolve():
        raise RuntimeError('Open niva-final.blend / Niva_Source first')
    if root.get('roof_hardware_revision'):
        raise RuntimeError('Roof/hardware revision already authored')
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    backup = ROOT / 'validation' / ('before-roof-hardware-' + datetime.datetime.now().strftime('%Y%m%d-%H%M%S'))
    backup.mkdir(parents=True)
    shutil.copy2(ROOT / 'niva-final.blend', backup / 'niva-before-session.blend')
    bpy.ops.wm.save_as_mainfile(filepath=str(backup / 'niva-preserved.blend'), copy=True)
    for name in ('niva-configurator.glb', 'niva-configurator-delivery.json', 'README.md', 'web-handoff.md'):
        shutil.copy2(ROOT / name, backup / name)
    for name in ('Front_ContinuousTimberBarge', 'Rear_ContinuousTimberBarge'):
        roof_grain(scene.objects[name])
    small_pulls()
    fridge_pulls()
    root['revision_backup'] = str(backup.relative_to(ROOT))
    root['roof_hardware_revision'] = 1
    root['review_status'] = 'Roof grain and hardware updated, with corner clearance and curtains; user testing pending'
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'niva-final.blend'))
    return {'source': bpy.data.filepath, 'backup': str(backup)}


if __name__ == '__main__':
    print(json.dumps(author(), indent=2))
    print(json.dumps(base.export_delivery(), indent=2))
    print(json.dumps(base.finish_metadata(), indent=2))
