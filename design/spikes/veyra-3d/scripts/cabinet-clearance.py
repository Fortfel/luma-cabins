"""Focused revision-5 cabinet, appliance-handle and fruit checks in background Blender."""

import hashlib
import json
import math
from pathlib import Path

import bpy
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[1]
PIVOT = Vector((-.725, 1.240, .567))
SAMPLES = tuple(range(0, 91, 5))


def evaluated_mesh(obj):
    evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = evaluated.to_mesh()
    vertices = [evaluated.matrix_world @ vertex.co for vertex in mesh.vertices]
    polygons = [tuple(polygon.vertices) for polygon in mesh.polygons]
    bvh = BVHTree.FromPolygons(vertices, polygons, all_triangles=False) if polygons else None
    bounds = [[min(vertex[index] for vertex in vertices) for index in range(3)], [max(vertex[index] for vertex in vertices) for index in range(3)]] if vertices else None
    evaluated.to_mesh_clear()
    return vertices, polygons, bvh, bounds


def rotated_bvh(obj, angle_degrees):
    vertices, polygons, _, _ = evaluated_mesh(obj)
    rotation = Matrix.Rotation(math.radians(angle_degrees), 4, 'Z')
    transformed = [PIVOT + rotation @ (vertex - PIVOT) for vertex in vertices]
    return BVHTree.FromPolygons(transformed, polygons, all_triangles=False), transformed


def bounds_overlap(a, b, tolerance=1e-6):
    return all(a[0][axis] <= b[1][axis] + tolerance and b[0][axis] <= a[1][axis] + tolerance for axis in range(3))


def bvh_bounds(points):
    return [[min(point[index] for point in points) for index in range(3)], [max(point[index] for point in points) for index in range(3)]]


def center(bounds):
    return Vector((bounds[0][axis] + bounds[1][axis] for axis in range(3))) / 2


def run():
    if not bpy.app.background:
        raise RuntimeError('Run this check in background Blender only.')
    if bpy.context.scene.name != 'Veyra_Source':
        raise RuntimeError('Open Veyra_Source in background Blender.')
    failures, notices, measurements = [], [], {}
    objects = bpy.data.objects
    door = objects.get('Kitchen_ReturnAccessDoor')
    moving = sorted((obj for obj in objects if obj.name.startswith('Kitchen_ReturnAccessDoor')), key=lambda obj: obj.name)
    hinges = sorted((obj for obj in objects if obj.name.startswith('Kitchen_ReturnAccessHinge')), key=lambda obj: obj.name)
    if door is None or not moving:
        failures.append({'issue': 'access door moving assembly missing'})
    else:
        pivot = tuple(door.get('hinge_pivot_blender', ()))
        if any(abs(pivot[index] - PIVOT[index]) > 1e-5 for index in range(3)):
            failures.append({'issue': 'access door hinge pivot contract', 'actual': pivot, 'expected': list(PIVOT)})
        if tuple(door.get('hinge_axis_blender', ())) != (0, 0, 1):
            failures.append({'issue': 'access door hinge axis contract', 'actual': door.get('hinge_axis_blender')})
        if float(door.get('opening_angle_degrees', 0)) != 90.0:
            failures.append({'issue': 'access door opening angle contract', 'actual': door.get('opening_angle_degrees')})
        if door.get('moving_parts_prefix') != 'Kitchen_ReturnAccessDoor' or door.get('fixed_obstacle_prefixes') != 'Kitchen_Oven,Kitchen_ReturnDrawer_':
            failures.append({'issue': 'access door obstacle metadata contract'})
    if not hinges:
        failures.append({'issue': 'static hinge parts missing'})
    if any(not obj.name.startswith('Kitchen_ReturnAccessDoor') for obj in moving):
        failures.append({'issue': 'moving assembly prefix leakage'})

    obstacle_names = sorted(obj.name for obj in objects if obj.name.startswith('Kitchen_Oven') or obj.name.startswith('Kitchen_ReturnDrawer_'))
    filler = objects.get('Kitchen_ReturnBlindCornerFiller')
    if filler:
        _, _, _, filler_bounds = evaluated_mesh(filler)
        filler_dimensions = [filler_bounds[1][axis] - filler_bounds[0][axis] for axis in range(3)]
        filler_thickness = min(filler_dimensions, key=lambda value: abs(value - .108))
        measurements['corner_filler_thickness_m'] = filler_thickness
        if abs(filler_thickness - .108) > .004:
            failures.append({'issue': 'fixed 108mm corner filler dimension', 'actual_m': filler_thickness, 'expected_m': .108})
        notices.append({'object': filler.name, 'reason': 'deliberate fixed blind-corner filler; included as swing obstacle'})
    else:
        failures.append({'issue': 'fixed blind-corner filler missing'})
    obstacle_objects = [objects[name] for name in obstacle_names if objects[name].type == 'MESH'] + ([filler] if filler and filler.type == 'MESH' else [])
    if moving and obstacle_objects:
        collision_samples = []
        minimum_gap = None
        for angle in SAMPLES:
            for moving_obj in moving:
                moved_bvh, moved_points = rotated_bvh(moving_obj, angle)
                moved_bounds = bvh_bounds(moved_points)
                if moved_bvh is None:
                    continue
                for obstacle in obstacle_objects:
                    _, _, obstacle_bvh, obstacle_bounds = evaluated_mesh(obstacle)
                    if obstacle_bvh is None:
                        continue
                    for point in moved_points:
                        nearest = obstacle_bvh.find_nearest(point)
                        if nearest and (minimum_gap is None or nearest[3] < minimum_gap):
                            minimum_gap = nearest[3]
                    if not bounds_overlap(moved_bounds, obstacle_bounds):
                        continue
                    overlap = moved_bvh.overlap(obstacle_bvh)
                    if overlap:
                        collision_samples.append({'angle_degrees': angle, 'moving': moving_obj.name, 'obstacle': obstacle.name, 'triangle_pairs': len(overlap)})
        measurements['swing_samples'] = len(SAMPLES)
        measurements['moving_parts'] = [obj.name for obj in moving]
        measurements['obstacles'] = obstacle_names + ([filler.name] if filler else [])
        measurements['minimum_surface_distance_m'] = minimum_gap
        if collision_samples:
            failures.append({'issue': 'access door swing intersects fixed obstacle', 'samples': collision_samples[:20], 'total_samples': len(collision_samples)})

    upper_expectations = {0: 'right-pair', 1: 'right-pair', 2: 'left-single'}
    upper_measurements = {}
    for index, group in upper_expectations.items():
        door_obj = objects.get(f'Kitchen_UpperReturnDoor_{index}')
        knob_parts = [obj for obj in objects if obj.name.startswith(f'Kitchen_UpperReturnDoor_{index}_WoodKnob')]
        if not door_obj or not knob_parts:
            failures.append({'issue': 'upper return door/knob missing', 'index': index})
            continue
        _, _, _, door_bounds = evaluated_mesh(door_obj)
        knob_points = []
        for knob_part in knob_parts:
            _, _, _, part_bounds = evaluated_mesh(knob_part)
            knob_points.extend(Vector((part_bounds[side][axis] for axis in range(3))) for side in range(2))
        knob_bounds = [[min(point[axis] for point in knob_points) for axis in range(3)], [max(point[axis] for point in knob_points) for axis in range(3)]]
        knob_center = center(knob_bounds)
        edge_distances = [abs(knob_center.y - door_bounds[0][1]), abs(door_bounds[1][1] - knob_center.y)]
        free_edge = 'low-y' if index in (1, 2) else 'high-y'
        expected_distance = edge_distances[0] if free_edge == 'low-y' else edge_distances[1]
        center_distance = abs(knob_center.y - (door_bounds[0][1] + door_bounds[1][1]) / 2)
        upper_measurements[str(index)] = {'group': group, 'free_edge': free_edge, 'edge_distance_m': expected_distance, 'center_distance_m': center_distance}
        if expected_distance > .11 or center_distance < .12:
            failures.append({'issue': 'upper return knob is not at its free edge', 'index': index, 'measurement': upper_measurements[str(index)]})
    measurements['upper_return_knobs'] = upper_measurements

    housing = objects.get('Kitchen_FridgeHousing')
    main_face = objects.get('Kitchen_FridgeMainFace')
    freezer_face = objects.get('Kitchen_FridgeFreezerFace')
    fridge_measurements = {}
    if not housing or not main_face or not freezer_face:
        failures.append({'issue': 'fridge housing/faces missing'})
    else:
        _, _, _, housing_bounds = evaluated_mesh(housing)
        for name, face in [('main', main_face), ('freezer', freezer_face)]:
            handle = objects.get('Kitchen_FridgeMainHandle' if name == 'main' else 'Kitchen_FridgeFreezerHandle')
            if not handle:
                failures.append({'issue': 'fridge handle missing', 'handle': name})
                continue
            _, _, _, handle_bounds = evaluated_mesh(handle)
            inside = all(housing_bounds[0][axis] - (.15 if axis == 0 else .003) <= handle_bounds[0][axis] and handle_bounds[1][axis] <= housing_bounds[1][axis] + (.15 if axis == 0 else .003) for axis in range(3))
            face_bounds = evaluated_mesh(face)[3]
            face_center = center(face_bounds)
            handle_center = center(handle_bounds)
            fridge_measurements[name] = {'inside_housing': inside, 'center_y_m': handle_center.y, 'face_center_y_m': face_center.y, 'center_z_m': handle_center.z, 'face_center_z_m': face_center.z}
            if not inside:
                failures.append({'issue': 'fridge handle outside appliance bounds', 'handle': handle.name, 'bounds': handle_bounds, 'housing_bounds': housing_bounds})
            if handle_center.y <= face_center.y:
                failures.append({'issue': 'fridge handle not moved to viewer-left positive-Y side', 'handle': handle.name, 'handle_y': handle_center.y, 'face_y': face_center.y})
        if fridge_measurements.get('main') and fridge_measurements['main']['center_z_m'] >= fridge_measurements['main']['face_center_z_m'] - .08:
            failures.append({'issue': 'main fridge grip was not lowered', 'measurement': fridge_measurements['main']})
    measurements['fridge_handles'] = fridge_measurements

    fruit_names = ['Kitchen_FruitApple_0', 'Kitchen_FruitApple_1', 'Kitchen_FruitApple_2', 'Kitchen_FruitPear', 'Kitchen_FruitBowl']
    fruit_objects = [objects.get(name) for name in fruit_names]
    missing = [name for name, obj in zip(fruit_names, fruit_objects) if obj is None]
    if missing:
        failures.append({'issue': 'separate fruit/bowl object missing', 'objects': missing})
    if objects.get('Kitchen_Fruit'):
        failures.append({'issue': 'legacy combined fruit object remains'})
    bodies = [(name, obj) for name, obj in zip(fruit_names[:4], fruit_objects[:4]) if obj]
    body_bvhs = {}
    for name, obj in bodies:
        _, _, bvh, bounds = evaluated_mesh(obj)
        body_bvhs[name] = (bvh, bounds)
    bowl_obj = objects.get('Kitchen_FruitBowl')
    _, _, bowl_bvh, bowl_bounds = evaluated_mesh(bowl_obj) if bowl_obj else ([], [], None, None)
    if bowl_obj is None:
        failures.append({'issue': 'fruit bowl geometry missing'})
    if bowl_bvh:
        for name, obj in bodies:
            bvh = body_bvhs[name][0]
            if bvh.overlap(bowl_bvh):
                failures.append({'issue': 'fruit body penetrates bowl mesh', 'fruit': name, 'bowl': 'Kitchen_FruitBowl'})
    fruit_collisions = []
    for index, (left_name, _) in enumerate(bodies):
        for right_name, _ in bodies[index + 1:]:
            if body_bvhs[left_name][0].overlap(body_bvhs[right_name][0]):
                fruit_collisions.append((left_name, right_name))
    if fruit_collisions:
        failures.append({'issue': 'fruit body collision', 'pairs': fruit_collisions})
    notices.append({'objects': ['Kitchen_FruitStem_0', 'Kitchen_FruitStem_1', 'Kitchen_FruitStem_2', 'Kitchen_FruitPearStem'], 'reason': 'intentional connecting stems excluded from solid fruit collision test'})
    measurements['fruit_bodies'] = [name for name, _ in bodies]
    measurements['fruit_bowl_checked'] = bool(bowl_bvh)

    report = {'asset_sha256': hashlib.sha256((ROOT / 'veyra-configurator.glb').read_bytes()).hexdigest(), 'passed': not failures, 'failures': failures, 'notices': notices, 'measurements': measurements, 'static_export_note': 'Access door is intentionally static in GLB; swing was evaluated analytically from saved source meshes.'}
    validation = ROOT / 'validation'
    validation.mkdir(exist_ok=True)
    (validation / 'cabinet-clearance.json').write_text(json.dumps(report, indent=2, default=float) + '\n', encoding='utf-8')
    return report


if __name__ == '__main__':
    report = run()
    print(json.dumps(report, indent=2, default=float))
    if not report['passed']:
        raise RuntimeError('Veyra cabinet clearance validation failed; see validation/cabinet-clearance.json')
