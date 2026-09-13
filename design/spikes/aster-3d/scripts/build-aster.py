"""Independent authored Aster candidate. Execute in Blender, then call build().

No tests run here. Delivery and review-image generation are explicit separate calls.
All dimensions are inferred concept geometry. Existing scenes are preserved.
"""

import json
import math
from pathlib import Path
import random

import bmesh
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
WIDTH, DEPTH = 8.4, 4.65
FLOOR, EAVE, RIDGE = 0.42, 3.32, 4.82
HALF_X, HALF_Y = WIDTH / 2, DEPTH / 2
SLOPE = (RIDGE - EAVE) / HALF_Y
SCENE_NAME = 'Aster_Source'
MODEL_GROUPS = ('Architecture', 'Glazing', 'ExteriorDetails', 'ShallowInterior')
COLLECTIONS = {}
M = {}


def mat(name, color, roughness=0.5, metallic=0):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    shader = material.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color[:3], color[3] if len(color) > 3 else 1)
    shader.inputs['Alpha'].default_value = color[3] if len(color) > 3 else 1
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    material.diffuse_color = tuple(shader.inputs['Base Color'].default_value)
    return material


def textured(material, base, normal, orm):
    nodes, links = material.node_tree.nodes, material.node_tree.links
    shader = nodes.get('Principled BSDF')
    shader.inputs['Roughness'].default_value = 1
    for key, filename in (('base', base), ('normal', normal), ('orm', orm)):
        path = str(ROOT / 'textures' / filename)
        image = bpy.data.images.load(path, check_existing=True)
        image.colorspace_settings.name = 'sRGB' if key == 'base' else 'Non-Color'
        image.pack()
        node = nodes.new('ShaderNodeTexImage')
        node.image = image
        node.label = 'Poly Haven CC0 / local 1024px material input'
        if key == 'base':
            links.new(node.outputs['Color'], shader.inputs['Base Color'])
        elif key == 'normal':
            normal_node = nodes.new('ShaderNodeNormalMap')
            normal_node.inputs['Strength'].default_value = 0.25
            links.new(node.outputs['Color'], normal_node.inputs['Color'])
            links.new(normal_node.outputs['Normal'], shader.inputs['Normal'])
        else:
            separate = nodes.new('ShaderNodeSeparateColor')
            links.new(node.outputs['Color'], separate.inputs['Color'])
            links.new(separate.outputs['Green'], shader.inputs['Roughness'])
            links.new(separate.outputs['Blue'], shader.inputs['Metallic'])


def materials():
    definitions = {
        'cladding': ('ExteriorCladding', (1, 1, 1), 1, 0),
        'joinery': ('InteriorJoinery', (1, 1, 1), 1, 0),
        'deck': ('FixedStepTimber', (1, 1, 1), 1, 0),
        'floor': ('FixedInteriorFloor', (1, 1, 1), 1, 0),
        'lining': ('FixedInteriorLining', (0.72, 0.68, 0.58), 0.84, 0),
        'roof': ('StandingSeamRoof', (0.018, 0.022, 0.025), 0.62, 0),
        'frame': ('BlackFramesAndFixtures', (0.014, 0.018, 0.018), 0.34, 0.52),
        'base': ('FoundationSteel', (0.018, 0.021, 0.019), 0.7, 0.35),
        'glass': ('Glazing', (0.07, 0.11, 0.13, 0.09), 0.16, 0),
        'privacy': ('BathroomPrivacyGlass', (0.55, 0.58, 0.54, 0.72), 0.65, 0),
        'sofa': ('FixedFlaxUpholstery', (0.67, 0.59, 0.46), 0.94, 0),
        'linen': ('FixedIvoryLinen', (0.82, 0.77, 0.65), 0.94, 0),
        'throw': ('FixedOatmealThrow', (0.45, 0.39, 0.29), 0.98, 0),
        'rug': ('FixedWovenRug', (0.51, 0.46, 0.35), 0.98, 0),
        'stone': ('WarmStoneWorktop', (0.68, 0.65, 0.55), 0.45, 0),
        'dark': ('ApplianceCharcoal', (0.025, 0.029, 0.029), 0.56, 0.18),
        'screen': ('ApplianceGlass', (0.008, 0.012, 0.012), 0.2, 0.1),
        'metal': ('BrushedSteel', (0.22, 0.24, 0.25), 0.32, 0.75),
        'ceramic': ('WarmCeramic', (0.57, 0.46, 0.31), 0.75, 0),
        'white': ('Porcelain', (0.85, 0.82, 0.73), 0.27, 0),
        'leaf': ('Foliage', (0.065, 0.13, 0.035), 0.78, 0),
        'stem': ('PlantStems', (0.085, 0.06, 0.025), 0.8, 0),
        'soil': ('PotSoil', (0.028, 0.022, 0.012), 1, 0),
        'solar': ('SolarCells', (0.012, 0.017, 0.027), 0.52, 0),
        'grid': ('SolarCellConductors', (0.035, 0.041, 0.049), 0.8, 0),
        'diffuser': ('WarmDiffusers', (0.95, 0.65, 0.31), 0.5, 0),
    }
    for key, args in definitions.items():
        M[key] = mat(*args)
    for key in ('cladding', 'joinery', 'deck'):
        base = 'natural-cladding-basecolor-1k.jpg' if key == 'cladding' else 'light-oak-basecolor-1k.jpg'
        textured(M[key], base, 'oak-normal-1k.jpg', 'oak-orm-1k.png')
    textured(M['floor'], 'floor-basecolor-1k.jpg', 'floor-normal-1k.jpg', 'floor-orm-1k.png')
    for key in ('glass', 'privacy'):
        M[key].surface_render_method = 'DITHERED'
        M[key].use_transparent_shadow = True
        M[key].use_backface_culling = True
    for key, specular in (('roof', 0.12), ('solar', 0.025), ('grid', 0.08)):
        M[key].node_tree.nodes.get('Principled BSDF').inputs['Specular IOR Level'].default_value = specular
    shader = M['diffuser'].node_tree.nodes.get('Principled BSDF')
    shader.inputs['Emission Color'].default_value = (1, 0.57, 0.22, 1)
    shader.inputs['Emission Strength'].default_value = 2.5


def uv_project(obj, horizontal=False):
    uv = obj.data.uv_layers.get('UVMap') or obj.data.uv_layers.new(name='UVMap')
    for face in obj.data.polygons:
        for loop in face.loop_indices:
            co = obj.data.vertices[obj.data.loops[loop].vertex_index].co
            if abs(face.normal.z) > 0.5:
                u, v = co.y, co.x
            elif abs(face.normal.x) > abs(face.normal.y):
                u, v = co.y, co.z
            else:
                u, v = co.x, co.z
            uv.data[loop].uv = (u / 1.83, v / 1.83)


def finish(obj, name, material, group, bevel=0, segments=2):
    obj.name = name
    obj.data.name = name
    for col in list(obj.users_collection):
        col.objects.unlink(obj)
    COLLECTIONS[group].objects.link(obj)
    obj.data.materials.append(M[material] if isinstance(material, str) else material)
    uv_project(obj)
    if bevel:
        modifier = obj.modifiers.new('Authored edge radius', 'BEVEL')
        modifier.width, modifier.segments = bevel, segments
        modifier = obj.modifiers.new('Weighted face normals', 'WEIGHTED_NORMAL')
        modifier.keep_sharp = True
    return obj


def box(name, location, size, material, group='ShallowInterior', bevel=0.008, rotation=None, segments=2):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    finish(obj, name, material, group, bevel, segments)
    if rotation:
        obj.rotation_euler = rotation
    return obj


def cylinder(name, a, b, radius, material, group='ShallowInterior', vertices=16, radius_top=None):
    direction = Vector(b) - Vector(a)
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius,
                                    radius2=radius if radius_top is None else radius_top,
                                    depth=direction.length, location=(Vector(a) + Vector(b)) / 2)
    obj = bpy.context.object
    obj.rotation_euler = direction.to_track_quat('Z', 'Y').to_euler()
    finish(obj, name, material, group, 0.002 if radius > 0.025 else 0)
    for poly in obj.data.polygons:
        poly.use_smooth = len(poly.vertices) == 4
    return obj


def mesh(name, verts, faces, material, group='Architecture', bevel=0):
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces)
    data.update()
    bm = bmesh.new()
    bm.from_mesh(data)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(data)
    bm.free()
    obj = bpy.data.objects.new(name, data)
    COLLECTIONS[group].objects.link(obj)
    return finish(obj, name, material, group, bevel, 1)


def cut(obj, center, size):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    cutter = bpy.context.object
    cutter.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.context.view_layer.objects.active = obj
    modifier = obj.modifiers.new('Reference opening', 'BOOLEAN')
    modifier.operation, modifier.solver, modifier.object = 'DIFFERENCE', 'EXACT', cutter
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.data.objects.remove(cutter, do_unlink=True)
    uv_project(obj)


def elevation(name, axis, plane, span, openings, gable=False):
    """Board solids with actual end grain/returns; no stretched corner UVs."""
    verts, faces = [], []
    count = math.ceil(span / 0.1525)
    pitch = span / count
    def roof_height(u):
        return RIDGE - abs(u) * SLOPE if gable else EAVE
    for i in range(count):
        a, b = -span / 2 + i * pitch + 0.0009, -span / 2 + (i + 1) * pitch - 0.0009
        breaks = sorted({a, b} | {v for opening in openings for v in opening[:2] if a < v < b})
        for lo, hi in zip(breaks, breaks[1:]):
            ranges = [(FLOOR - 0.06, max(roof_height(lo), roof_height(hi)))]
            for left, right, bottom, top in openings:
                if left < (lo + hi) / 2 < right:
                    ranges = [(z0, z1) for start, end in ranges
                              for z0, z1 in ((start, min(end, bottom)), (max(start, top), end)) if z1 > z0]
            for bottom, top in ranges:
                zlo, zhi = min(top, roof_height(lo)), min(top, roof_height(hi))
                if min(zlo, zhi) <= bottom:
                    continue
                outline = [(lo, bottom), (hi, bottom), (hi, zhi), (lo, zlo)]
                n = len(verts)
                for depth in (-0.025, 0.025):
                    verts.extend((u, plane + depth, z) if axis == 'x' else (plane + depth, u, z)
                                 for u, z in outline)
                faces.extend(tuple(n + j for j in f) for f in
                             ((3, 2, 1, 0), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)))
    return mesh(name, verts, faces, 'cladding', bevel=0.001)


def opening(name, axis, plane, u, bottom, width, height, door=False, privacy=False):
    group = 'ExteriorDetails'
    def part(suffix, du, z, w, h, depth=0.14, material='frame', group=group, offset=0):
        pos = (u + du, plane + offset, z) if axis == 'x' else (plane + offset, u + du, z)
        dims = (w, depth, h) if axis == 'x' else (depth, w, h)
        return box(name + '_' + suffix, pos, dims, material, group, 0.004)
    frame = 0.065 if not door else 0.09
    center = bottom + height / 2
    for sign in (-1, 1):
        part('Jamb' + str(sign), sign * (width - frame) / 2, center, frame, height)
        part('Sill' if sign < 0 else 'Head', 0, center + sign * (height - frame) / 2, width, frame)
    part('Pane', 0, center, width - frame * 2, height - frame * 2, 0.008,
         'privacy' if privacy else 'glass', 'Glazing')
    part('DripSill', 0, bottom - 0.02, width + 0.06, 0.025, 0.21)
    if door:
        for sign in (-1, 1):
            part('HandleMount' + str(sign), -width * 0.31, FLOOR + 1.05 + sign * 0.17,
                 0.04, 0.035, 0.23)
        part('PullHandle', -width * 0.31, FLOOR + 1.05, 0.026, 0.4, 0.028, offset=-0.128)
        for z in (FLOOR + 0.35, FLOOR + 1.8):
            part('Hinge' + str(z), width * 0.40, z, 0.025, 0.1, 0.16)
        part('Canopy', 0, bottom + height + 0.16, width + 0.52, 0.14, 0.5, offset=-0.13)


def architecture():
    front = [(-1.8, 1.05, 0.78, 2.91), (2.1, 3.05, FLOOR, 2.89)]
    rear = [(-1.1, -0.23, 1.66, 2.22)]
    left = [(-0.6, 0.35, FLOOR, 2.89)]
    right = [(0.83, 1.58, 1.46, 2.36)]
    for label, axis, plane, span, openings, gable in (
        ('Front', 'x', -HALF_Y, WIDTH, front, False),
        ('Rear', 'x', HALF_Y, WIDTH, rear, False),
        ('LeftGable', 'y', -HALF_X, DEPTH, left, True),
        ('RightGable', 'y', HALF_X, DEPTH, right, True),
    ):
        elevation('Cladding_' + label, axis, plane, span, openings, gable)
        sign = -1 if plane < 0 else 1
        center_plane = plane - sign * 0.125
        if gable:
            outline = [(-HALF_Y, FLOOR - 0.04), (HALF_Y, FLOOR - 0.04),
                       (HALF_Y, EAVE), (0, RIDGE - 0.02), (-HALF_Y, EAVE)]
            verts = [(center_plane + d, u, z) for d in (-0.1, 0.1) for u, z in outline]
            wall = mesh('Lining_' + label, verts,
                        [(4, 3, 2, 1, 0), (5, 6, 7, 8, 9)] +
                        [(i, (i + 1) % 5, (i + 1) % 5 + 5, i + 5) for i in range(5)], 'lining')
        else:
            wall = box('Lining_' + label, (0, center_plane, (FLOOR + EAVE) / 2),
                       (WIDTH, 0.20, EAVE - FLOOR), 'lining', 'Architecture', 0)
        for a, b, bottom, top in openings:
            center = ((a + b) / 2, plane, (bottom + top) / 2) if axis == 'x' else (plane, (a + b) / 2, (bottom + top) / 2)
            size = (b - a, 0.8, top - bottom + 0.005) if axis == 'x' else (0.8, b - a, top - bottom + 0.005)
            cut(wall, center, size)
    box('FloorSlab', (0, 0, FLOOR - 0.07), (WIDTH - 0.25, DEPTH - 0.25, 0.14), 'floor', 'Architecture')
    for y in (-1.92, 1.92):
        box('LongitudinalBaseRail_' + str(y), (0, y, 0.23), (8.35, 0.12, 0.23), 'base', 'Architecture')
        for x in (-3.85, -1.4, 1.4, 3.85):
            box('FoundationFoot_' + str((x, y)), (x, y, 0.12), (0.15, 0.20, 0.24), 'base', 'Architecture', 0.003)
    for x in (-3.8, 0, 3.8):
        box('CrossRail_' + str(x), (x, 0, 0.24), (0.12, 4.42, 0.17), 'base', 'Architecture')
    opening('FrontPictureWindow', 'x', -HALF_Y - 0.015, -0.375, 0.78, 2.85, 2.13)
    opening('FrontEntrance', 'x', -HALF_Y - 0.025, 2.575, FLOOR, 0.95, 2.47, door=True)
    opening('LeftEntrance', 'y', -HALF_X - 0.025, -0.125, FLOOR, 0.95, 2.47, door=True)
    opening('RearKitchenWindow', 'x', HALF_Y + 0.015, -0.665, 1.66, 0.87, 0.56)
    opening('RightBathroomWindow', 'y', HALF_X + 0.015, 1.205, 1.46, 0.75, 0.90, privacy=True)
    angle = math.atan(SLOPE)
    half_run = HALF_Y + 0.19
    roof_length = half_run * math.sqrt(1 + SLOPE ** 2)
    for sign in (-1, 1):
        rotation = (-sign * angle, 0, 0)
        box('RoofPlane_' + str(sign), (0, sign * half_run / 2, RIDGE - half_run * SLOPE / 2 + 0.055),
            (WIDTH + 0.35, roof_length, 0.075), 'roof', 'Architecture', 0.007, rotation)
        box('FixedCeiling_' + str(sign), (0, sign * HALF_Y / 2, RIDGE - HALF_Y * SLOPE / 2 - 0.12),
            (WIDTH - 0.25, HALF_Y * math.sqrt(1 + SLOPE ** 2), 0.085), 'lining', 'Architecture', 0.003, rotation)
        for i in range(19):
            x = -4.28 + i * 8.56 / 18
            box('RoofSeam_' + str((sign, i)), (x, sign * half_run / 2, RIDGE - half_run * SLOPE / 2 + 0.105),
                (0.018, roof_length, 0.035), 'roof', 'ExteriorDetails', 0.003, rotation)
        for x in (-4.38, 4.38):
            box('BargeFlashing_' + str((sign, x)), (x, sign * half_run / 2, RIDGE - half_run * SLOPE / 2 + 0.035),
                (0.105, roof_length + 0.07, 0.14), 'roof', 'ExteriorDetails', 0.006, rotation)
        box('EaveFascia_' + str(sign), (0, sign * (half_run + 0.015), EAVE - 0.065),
            (8.83, 0.065, 0.12), 'roof', 'ExteriorDetails')
        cylinder('Gutter_' + str(sign), (-4.38, sign * (half_run + 0.05), EAVE - 0.075),
                 (4.38, sign * (half_run + 0.05), EAVE - 0.075), 0.055, 'frame', 'ExteriorDetails', 20)
    box('RidgeCap', (0, 0, RIDGE + 0.12), (8.8, 0.16, 0.065), 'roof', 'ExteriorDetails')
    for x, sign in ((-3.84, -1), (3.84, 1)):
        y = sign * (HALF_Y + 0.085)
        cylinder('Downpipe_' + str(sign), (x, y, 0.17), (x, y, EAVE - 0.13), 0.034, 'frame', 'ExteriorDetails', 20)
        cylinder('DownpipeOffset_' + str(sign), (x, y, EAVE - 0.13),
                 (x, sign * (half_run + 0.05), EAVE - 0.075), 0.034, 'frame', 'ExteriorDetails', 20)
        for z in (0.6, 2.4):
            box('PipeClip_' + str((sign, z)), (x, y, z), (0.09, 0.084, 0.023), 'frame', 'ExteriorDetails', 0.003)
        cylinder('DrainShoe_' + str(sign), (x, y, 0.20), (x, y + sign * 0.13, 0.06), 0.035, 'frame', 'ExteriorDetails')


def steps(name, axis, u, plane):
    def part(suffix, local_u, distance, z, width, depth, height, material='deck'):
        pos = (u + local_u, plane - distance, z) if axis == 'x' else (plane - distance, u + local_u, z)
        size = (width, depth, height) if axis == 'x' else (depth, width, height)
        return box(name + '_' + suffix, pos, size, material, 'ExteriorDetails', 0.008)
    for step, (distance, height, width, depth) in enumerate(((0.32, 0.40, 1.55, 0.67), (0.77, 0.265, 1.70, 0.30), (1.06, 0.13, 1.85, 0.30))):
        for plank in range(3 if step == 0 else 2):
            count = 3 if step == 0 else 2
            part('Tread_' + str((step, plank)), 0, distance + (plank - (count - 1) / 2) * depth / count,
                 height - 0.022, width, depth / count - 0.006, 0.044)
        part('Riser_' + str(step), 0, distance + depth / 2 - 0.04, height - 0.09, width - 0.08, 0.025, 0.11)
        for sign in (-1, 1):
            part('Support_' + str((step, sign)), sign * (width / 2 - 0.15), distance, (height - 0.045) / 2,
                 0.08, depth - 0.04, height - 0.045, 'base')


def roof_equipment():
    angle = math.atan(SLOPE)
    y = -1.34
    z = RIDGE + y * SLOPE + 0.17
    for i in range(7):
        x = -2.95 + i * 0.90
        box('SolarPanelFrame_' + str(i), (x, y, z), (0.88, 1.68, 0.045), 'frame', 'ExteriorDetails', 0.003, (angle, 0, 0))
        normal = Vector((0, -math.sin(angle), math.cos(angle)))
        center = Vector((x, y, z)) + normal * 0.026
        box('SolarPanelCells_' + str(i), center, (0.845, 1.645, 0.007), 'solar', 'ExteriorDetails', 0.001, (angle, 0, 0))
        # Grid belongs to a single authored mesh per panel, not hundreds of nodes.
        verts, faces = [], []
        for vertical in (True, False):
            for j in range(1, 6 if vertical else 11):
                u = -0.4225 + j * 0.845 / 6 if vertical else 0
                v = 0 if vertical else -0.8225 + j * 1.645 / 11
                w, h = (0.0013, 1.645) if vertical else (0.845, 0.0013)
                start = len(verts)
                for du, dv in ((-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)):
                    verts.append(tuple(center + normal * 0.005 + Vector((u + du, (v + dv) * math.cos(angle), (v + dv) * math.sin(angle)))))
                faces.append((start, start + 1, start + 2, start + 3))
        mesh('SolarCellGrid_' + str(i), verts, faces, 'grid', 'ExteriorDetails')
    x, y = 3.46, -0.55
    roof_z = RIDGE - abs(y) * SLOPE
    box('ChimneyFlashing', (x, y, roof_z + 0.1), (0.44, 0.45, 0.035), 'roof', 'ExteriorDetails', 0.006, (angle, 0, 0))
    cylinder('FlueWeatherCollar', (x, y, roof_z + 0.08), (x, y, roof_z + 0.25), 0.14, 'frame', 'ExteriorDetails', 24, 0.10)
    cylinder('Chimney', (x, y, roof_z + 0.12), (x, y, 5.5), 0.085, 'dark', 'ExteriorDetails', 24)
    for z in (roof_z + 0.27, 5.40):
        cylinder('FlueBand_' + str(z), (x, y, z), (x, y, z + 0.024), 0.093, 'frame', 'ExteriorDetails', 24)
    cylinder('FlueRainCap', (x, y, 5.5), (x, y, 5.54), 0.145, 'roof', 'ExteriorDetails', 24, 0.08)


def area(name, position, target, power, size, color=(1, 1, 1), size_y=None):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy, data.color, data.size = power, color, size
    data.shape = 'RECTANGLE' if size_y else 'DISK'
    if size_y:
        data.size_y = size_y
    obj = bpy.data.objects.new(name, data)
    COLLECTIONS['Lights'].objects.link(obj)
    obj.location = position
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()
    return obj


def fixtures():
    for name, axis, plane, u in (('FrontSconce', 'x', -HALF_Y - 0.08, 3.48), ('LeftSconce', 'y', -HALF_X - 0.08, -0.95)):
        pos = (u, plane, 2.18) if axis == 'x' else (plane, u, 2.18)
        dims = (0.075, 0.085, 0.24) if axis == 'x' else (0.085, 0.075, 0.24)
        box(name, pos, dims, 'frame', 'ExteriorDetails', 0.012)
        light_pos = Vector(pos) + Vector((0, 0, -0.125))
        cylinder(name + '_Diffuser', light_pos, light_pos + Vector((0, 0, 0.008)), 0.031, 'diffuser', 'ExteriorDetails')
        target = (u, plane + 0.10, 1.6) if axis == 'x' else (plane + 0.10, u, 1.6)
        area(name + '_ReviewLight', light_pos, target, 5, 0.07, (1, 0.67, 0.37))


def plant(name, x, y, z, scale=1):
    cylinder(name + '_Pot', (x, y, z), (x, y, z + 0.26 * scale), 0.16 * scale, 'ceramic', radius_top=0.20 * scale)
    cylinder(name + '_Soil', (x, y, z + 0.247 * scale), (x, y, z + 0.252 * scale), 0.178 * scale, 'soil')
    rng = random.Random(name)
    verts, faces = [], []
    for i in range(7):
        a = i * 2.399
        end = Vector((x + math.cos(a) * 0.24 * scale, y + math.sin(a) * 0.24 * scale, z + (0.75 + rng.random() * 0.55) * scale))
        cylinder(name + '_Stem_' + str(i), (x, y, z + 0.2 * scale), end, 0.005 * scale, 'stem', vertices=8)
        for j in range(5):
            t = 0.35 + j * 0.145
            base = Vector((x, y, z + 0.2 * scale)).lerp(end, t)
            phi = a + j * 2.1
            direction = Vector((math.cos(phi), math.sin(phi), 0.35)) * scale * (0.15 + rng.random() * 0.1)
            across = Vector((-math.sin(phi), math.cos(phi), 0)) * 0.045 * scale
            start = len(verts)
            verts.extend(tuple(v) for v in (base, base + direction * 0.5 + across,
                                            base + direction + Vector((0, 0, -0.03 * scale)),
                                            base + direction * 0.5 - across, base + direction * 0.5 + Vector((0, 0, 0.012 * scale))))
            faces.extend((start + a, start + b, start + c) for a, b, c in ((0, 1, 4), (1, 2, 4), (2, 3, 4), (3, 0, 4)))
    obj = mesh(name + '_Leaves', verts, faces, 'leaf', 'ShallowInterior')
    for poly in obj.data.polygons:
        poly.use_smooth = True


def kitchen():
    # Back wall kitchen remains visible above and beside the low sofa.
    y = 1.74
    box('KitchenToeKick', (-0.34, y, FLOOR + 0.08), (3.30, 0.48, 0.16), 'dark')
    box('KitchenCarcass', (-0.34, y, FLOOR + 0.50), (3.30, 0.61, 0.76), 'joinery')
    for i in range(6):
        x = -1.70 + i * 0.545
        if i == 4:
            box('IntegratedOven', (x, 1.414, FLOOR + 0.48), (0.52, 0.042, 0.62), 'dark')
            box('OvenGlass', (x, 1.388, FLOOR + 0.45), (0.43, 0.01, 0.39), 'screen')
            cylinder('OvenHandle', (x - 0.19, 1.35, FLOOR + 0.70), (x + 0.19, 1.35, FLOOR + 0.70), 0.012, 'metal')
        else:
            box('KitchenDoor_' + str(i), (x, 1.414, FLOOR + 0.51), (0.527, 0.035, 0.73), 'joinery', bevel=0.004)
            cylinder('KitchenPull_' + str(i), (x - 0.10, 1.38, FLOOR + 0.80), (x + 0.10, 1.38, FLOOR + 0.80), 0.009, 'frame', vertices=10)
    worktop = box('KitchenWorktop', (-0.34, y - 0.02, FLOOR + 0.91), (3.38, 0.70, 0.045), 'stone')
    cut(worktop, (-0.85, y - 0.02, FLOOR + 0.91), (0.47, 0.39, 0.20))
    box('SinkBasin', (-0.85, y - 0.02, FLOOR + 0.79), (0.465, 0.385, 0.025), 'metal', bevel=0.05, segments=4)
    for sign in (-1, 1):
        box('SinkSide_' + str(sign), (-0.85 + sign * 0.23, y - 0.02, FLOOR + 0.85), (0.016, 0.39, 0.12), 'metal')
        box('SinkEnd_' + str(sign), (-0.85, y - 0.02 + sign * 0.188, FLOOR + 0.85), (0.47, 0.016, 0.12), 'metal')
    cylinder('SinkDrain', (-0.85, y, FLOOR + 0.805), (-0.85, y, FLOOR + 0.81), 0.032, 'dark')
    points = [(-0.85, 2.015, FLOOR + 0.94), (-0.85, 2.015, FLOOR + 1.20)]
    for i in range(9):
        a = math.pi - i * math.pi / 8
        points.append((-0.85, 1.91 - 0.105 * math.cos(a), FLOOR + 1.20 + 0.105 * math.sin(a)))
    points.append((-0.85, 1.805, FLOOR + 1.14))
    for i, (a, b) in enumerate(zip(points, points[1:])):
        cylinder('KitchenTap_' + str(i), a, b, 0.013, 'frame', vertices=12)
    box('InductionCooktop', (0.48, y - 0.03, FLOOR + 0.94), (0.58, 0.49, 0.015), 'screen', bevel=0.016)
    for dx in (-0.145, 0.145):
        for dy in (-0.13, 0.13):
            cylinder('HobZone_' + str((dx, dy)), (0.48 + dx, y - 0.03 + dy, FLOOR + 0.949),
                     (0.48 + dx, y - 0.03 + dy, FLOOR + 0.951), 0.084, 'dark', vertices=24)
    box('ExtractorHood', (0.48, 2.01, 2.27), (0.65, 0.39, 0.17), 'dark')
    box('ExtractorDuct', (0.48, 2.08, 2.55), (0.25, 0.23, 0.43), 'dark')
    for level, z in enumerate((1.98, 2.43)):
        box('KitchenShelf_' + str(level), (-1.07, 2.0, z), (1.14, 0.26, 0.037), 'joinery')
        for j in range(3):
            x = -1.49 + j * 0.32
            cylinder('ShelfCeramic_' + str((level, j)), (x, 1.98, z + 0.024),
                     (x, 1.98, z + 0.14 + 0.035 * j), 0.04 + j * 0.006, 'ceramic', radius_top=0.028 + j * 0.005)
    plant('KitchenHerb', 1.15, 1.81, FLOOR + 0.94, 0.20)
    box('KitchenSideboard', (-2.7, 1.85, FLOOR + 0.37), (1.18, 0.44, 0.74), 'joinery')
    for x in (-3.0, -2.42):
        box('SideboardDoor_' + str(x), (x, 1.62, FLOOR + 0.37), (0.564, 0.025, 0.69), 'joinery')
    plant('StudioTree', -2.20, 0.91, FLOOR, 1.30)


def lounge():
    x, y = -0.47, -0.61
    box('LoungeRug', (x, y - 0.36, FLOOR + 0.015), (2.50, 1.85, 0.025), 'rug', bevel=0.035)
    for dx in (-0.83, 0.83):
        for dy in (-0.3, 0.3):
            cylinder('SofaLeg_' + str((dx, dy)), (x + dx, y + dy, FLOOR + 0.03),
                     (x + dx, y + dy, FLOOR + 0.20), 0.025, 'frame')
    box('SofaBase', (x, y, FLOOR + 0.27), (2.06, 0.86, 0.22), 'sofa', bevel=0.085, segments=4)
    for sign in (-1, 1):
        box('SofaArm_' + str(sign), (x + sign * 0.94, y, FLOOR + 0.50), (0.24, 0.91, 0.46), 'sofa', bevel=0.10, segments=5)
        box('SofaSeat_' + str(sign), (x + sign * 0.415, y - 0.07, FLOOR + 0.46), (0.80, 0.71, 0.20), 'sofa', bevel=0.065, segments=4)
        box('SofaBack_' + str(sign), (x + sign * 0.43, y + 0.29, FLOOR + 0.73), (0.87, 0.23, 0.57), 'sofa',
            bevel=0.085, rotation=(math.radians(-10), 0, 0), segments=4)
        box('SofaPillow_' + str(sign), (x + sign * 0.63, y + 0.07, FLOOR + 0.73), (0.37, 0.15, 0.39), 'linen',
            bevel=0.075, rotation=(math.radians(-15), math.radians(sign * 12), math.radians(sign * 8)), segments=5)
    cy = y - 0.87
    cylinder('CoffeeTableTop', (x, cy, FLOOR + 0.34), (x, cy, FLOOR + 0.38), 0.53, 'joinery', vertices=48)
    for a in (0, 2.094, 4.188):
        dx, dy = math.cos(a) * 0.37, math.sin(a) * 0.37
        cylinder('CoffeeTableLeg_' + str(a), (x + dx, cy + dy, FLOOR + 0.03), (x + dx, cy + dy, FLOOR + 0.34), 0.012, 'frame')
    plant('CoffeeTablePlant', x, cy, FLOOR + 0.38, 0.20)
    box('CoffeeTableBook', (x + 0.23, cy - 0.06, FLOOR + 0.40), (0.21, 0.15, 0.027), 'linen', rotation=(0, 0, 0.15))


def studio():
    # Sleeping area stays low and open, with no loft or separate bedroom.
    x, y = -2.93, -0.63
    box('StudioBedFrame', (x, y, FLOOR + 0.19), (1.63, 2.02, 0.24), 'joinery', bevel=0.025)
    box('StudioMattress', (x, y, FLOOR + 0.41), (1.56, 1.98, 0.23), 'linen', bevel=0.11, segments=4)
    box('StudioDuvet', (x, y + 0.22, FLOOR + 0.56), (1.58, 1.54, 0.15), 'linen', bevel=0.10, segments=4)
    box('BedFootThrow', (x, y + 0.54, FLOOR + 0.64), (1.60, 0.52, 0.075), 'throw', bevel=0.028, segments=3)
    box('BedHeadboard', (x, y - 1.03, FLOOR + 0.54), (1.66, 0.055, 0.82), 'joinery', bevel=0.022)
    for sign in (-1, 1):
        box('BedPillow_' + str(sign), (x + sign * 0.40, y - 0.68, FLOOR + 0.58), (0.66, 0.43, 0.17), 'linen', bevel=0.085, segments=4)
        nx = x + sign * 0.96
        cylinder('BedsideTop_' + str(sign), (nx, y - 0.61, FLOOR + 0.35), (nx, y - 0.61, FLOOR + 0.39), 0.18, 'joinery', vertices=24)
        cylinder('BedsideBase_' + str(sign), (nx, y - 0.61, FLOOR), (nx, y - 0.61, FLOOR + 0.35), 0.06, 'frame')
    # Compact dining spot beside the main circulation, rather than blocking glazing.
    x, y = 1.10, -0.01
    cylinder('DiningTop', (x, y, FLOOR + 0.72), (x, y, FLOOR + 0.76), 0.43, 'joinery', vertices=40)
    cylinder('DiningPedestal', (x, y, FLOOR + 0.04), (x, y, FLOOR + 0.72), 0.06, 'frame')
    cylinder('DiningFoot', (x, y, FLOOR + 0.015), (x, y, FLOOR + 0.04), 0.25, 'frame', vertices=32)
    for side in (-1, 1):
        cy = y + side * 0.64
        box('DiningChairSeat_' + str(side), (x, cy, FLOOR + 0.43), (0.38, 0.38, 0.055), 'joinery', bevel=0.06, segments=3)
        box('DiningChairBack_' + str(side), (x, cy + side * 0.17, FLOOR + 0.69), (0.38, 0.055, 0.35), 'joinery', bevel=0.045, segments=3)
        for dx in (-0.145, 0.145):
            for dy in (-0.145, 0.145):
                cylinder('ChairLeg_' + str((side, dx, dy)), (x + dx * 1.18, cy + dy * 1.18, FLOOR),
                         (x + dx, cy + dy, FLOOR + 0.43), 0.014, 'frame')
    # Right-rear bathroom, as established by the cutaway.
    box('BathroomLeftPartition', (1.75, 1.15, (FLOOR + 3.05) / 2), (0.12, 2.10, 3.05 - FLOOR), 'lining', 'Architecture')
    partition = box('BathroomFrontPartition', (2.9, 0.11, (FLOOR + 3.05) / 2), (2.38, 0.12, 3.05 - FLOOR), 'lining', 'Architecture', 0)
    cut(partition, (2.36, 0.11, FLOOR + 1.01), (0.79, 0.4, 2.025))
    box('BathroomDoorLeaf', (2.36, 0.10, FLOOR + 1.00), (0.75, 0.045, 1.98), 'joinery')
    for sign in (-1, 1):
        box('BathroomWoodenJamb_' + str(sign), (2.36 + sign * 0.415, 0.10, FLOOR + 1.03), (0.058, 0.17, 2.06), 'joinery')
    box('BathroomWoodenHead', (2.36, 0.10, FLOOR + 2.06), (0.89, 0.17, 0.065), 'joinery')
    cylinder('BathroomLever', (2.57, 0.028, FLOOR + 1.00), (2.69, 0.028, FLOOR + 1.00), 0.012, 'frame')
    box('BathroomVanity', (3.71, 1.34, FLOOR + 0.48), (0.51, 0.74, 0.58), 'joinery')
    box('BathroomBasin', (3.71, 1.34, FLOOR + 0.82), (0.50, 0.60, 0.10), 'white', bevel=0.08, segments=4)
    box('Wardrobe', (3.43, -0.15, FLOOR + 1.0), (1.18, 0.43, 2.0), 'joinery')
    for sign in (-1, 1):
        box('WardrobeDoor_' + str(sign), (3.43 + sign * 0.296, -0.375, FLOOR + 1.0), (0.582, 0.03, 1.96), 'joinery')
        cylinder('WardrobePull_' + str(sign), (3.43 + sign * 0.045, -0.41, FLOOR + 0.91),
                 (3.43 + sign * 0.045, -0.41, FLOOR + 1.13), 0.009, 'frame')
    box('DeskTop', (3.69, -1.60, FLOOR + 0.74), (0.54, 0.90, 0.045), 'joinery')
    for dy in (-0.35, 0.35):
        box('DeskSupport_' + str(dy), (3.69, -1.60 + dy, FLOOR + 0.37), (0.46, 0.035, 0.74), 'frame')
    box('DeskStool', (3.15, -1.60, FLOOR + 0.45), (0.38, 0.40, 0.07), 'joinery', bevel=0.055)
    cylinder('DeskStoolBase', (3.15, -1.60, FLOOR), (3.15, -1.60, FLOOR + 0.43), 0.055, 'frame')
    box('ClosedNotebook', (3.64, -1.61, FLOOR + 0.78), (0.24, 0.31, 0.025), 'throw', rotation=(0, 0, -0.1))
    # The reference flue sits beside the service zone; a compact stove completes it.
    box('StoveHearth', (3.49, -0.72, FLOOR + 0.019), (0.74, 0.57, 0.032), 'dark')
    box('CompactStove', (3.49, -0.72, FLOOR + 0.44), (0.42, 0.36, 0.67), 'dark', bevel=0.025, segments=3)
    box('StoveDoor', (3.49, -0.91, FLOOR + 0.47), (0.34, 0.025, 0.45), 'frame')
    box('StoveDoorGlass', (3.49, -0.926, FLOOR + 0.47), (0.26, 0.012, 0.34), 'screen')
    cylinder('StoveFlueInterior', (3.46, -0.55, FLOOR + 0.80), (3.46, -0.55, 4.55), 0.072, 'dark', vertices=20)


def lighting_camera(scene):
    world = bpy.data.worlds.new('Aster_StudioWorld')
    world.use_nodes = True
    world.node_tree.nodes.get('Background').inputs['Color'].default_value = (0.72, 0.78, 0.84, 1)
    world.node_tree.nodes.get('Background').inputs['Strength'].default_value = 0.35
    scene.world = world
    area('StudioKey', (-5, -8, 10), (0, 0, 1.8), 2300, 7, (1, 0.91, 0.79))
    area('StudioFill', (6, -3, 7), (0, 0, 2.0), 1600, 6, (0.80, 0.88, 1))
    area('StudioRim', (1, 6, 9), (0, 0, 2.0), 2200, 5, (1, 0.92, 0.78))
    area('KitchenCeilingFill', (-0.55, 1.00, 3.13), (-0.55, 1.62, 1.1), 110, 2.6, (1, 0.79, 0.55), 0.65)
    area('LoungeCeilingFill', (-0.65, -0.50, 3.14), (-0.65, -0.6, 0.6), 85, 2.1, (1, 0.84, 0.65), 1.1)
    area('BedCeilingFill', (-2.96, -0.2, 3.14), (-2.96, -0.2, 0.6), 45, 1.2, (1, 0.83, 0.62))
    cylinder('PendantCable', (-0.48, 0.30, 3.44), (-0.48, 0.30, 2.63), 0.008, 'frame')
    cylinder('PendantShade', (-0.48, 0.30, 2.47), (-0.48, 0.30, 2.68), 0.17, 'linen', vertices=32, radius_top=0.07)
    cylinder('PendantDiffuser', (-0.48, 0.30, 2.464), (-0.48, 0.30, 2.470), 0.145, 'diffuser', vertices=32)
    area('PendantReviewLight', (-0.48, 0.30, 2.455), (-0.48, 0.30, 0.8), 12, 0.22, (1, 0.76, 0.46))
    data = bpy.data.cameras.new('Aster_CanonicalCamera')
    camera = bpy.data.objects.new('Aster_CanonicalCamera', data)
    COLLECTIONS['ReviewStaging'].objects.link(camera)
    camera.location = (-13.8, -26.0, 3.8)
    target = Vector((-0.1, -0.10, 2.50))
    camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
    data.type, data.lens, data.sensor_width, data.sensor_fit = 'PERSP', 70, 36, 'HORIZONTAL'
    data.clip_start, data.clip_end = 0.1, 1000
    data.shift_x, data.shift_y = 0, 0
    camera['target_blender'] = list(target)
    scene.camera = camera
    scene.render.engine = 'BLENDER_EEVEE'
    scene.eevee.taa_render_samples = 96
    scene.render.resolution_x, scene.render.resolution_y = 1309, 697
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.film_transparent = True
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.view_settings.exposure = 0


def fit_camera(scene):
    """Author framing from projected geometry bounds; not a validation check."""
    from bpy_extras.object_utils import world_to_camera_view
    camera = scene.camera
    bpy.context.view_layer.update()
    points = [obj.matrix_world @ Vector(corner) for group in MODEL_GROUPS
              for obj in COLLECTIONS[group].objects if obj.type == 'MESH' for corner in obj.bound_box]
    for _ in range(2):
        screen = [world_to_camera_view(scene, camera, p) for p in points]
        xmin, xmax = min(p.x for p in screen), max(p.x for p in screen)
        ymin, ymax = min(p.y for p in screen), max(p.y for p in screen)
        camera.data.lens *= min(0.94 / (xmax - xmin), 0.92 / (ymax - ymin))
        bpy.context.view_layer.update()
        screen = [world_to_camera_view(scene, camera, p) for p in points]
        camera.data.shift_x += (min(p.x for p in screen) + max(p.x for p in screen)) / 2 - 0.5
        camera.data.shift_y += ((min(p.y for p in screen) + max(p.y for p in screen)) / 2 - 0.5) * 697 / 1309
        bpy.context.view_layer.update()


def build():
    if bpy.data.scenes.get(SCENE_NAME):
        raise RuntimeError('Aster_Source already exists. Preserve it before an explicitly requested rebuild.')
    if bpy.context.object and bpy.context.object.mode != 'OBJECT':
        raise RuntimeError('Leave the existing edit mode before creating a separate scene.')
    scene = bpy.data.scenes.new(SCENE_NAME)
    bpy.context.window.scene = scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1
    for group in (*MODEL_GROUPS, 'Lights', 'ReviewStaging'):
        collection = bpy.data.collections.new('Aster_' + group)
        scene.collection.children.link(collection)
        COLLECTIONS[group] = collection
    materials()
    architecture()
    steps('FrontSteps', 'x', 2.575, -HALF_Y - 0.02)
    steps('LeftSteps', 'y', -0.125, -HALF_X - 0.02)
    roof_equipment()
    fixtures()
    kitchen()
    lounge()
    studio()
    lighting_camera(scene)
    fit_camera(scene)
    scene['asset_status'] = 'First authored candidate; awaiting user visual review. No validation tests run.'
    scene['reference_dimensions'] = 'Inferred 8.4 x 4.65m shell; not measured architectural information.'
    bpy.ops.object.select_all(action='DESELECT')
    for area_ui in bpy.context.screen.areas:
        if area_ui.type == 'VIEW_3D':
            area_ui.spaces.active.region_3d.view_perspective = 'CAMERA'
            area_ui.spaces.active.overlay.show_overlays = False
            area_ui.spaces.active.shading.type = 'MATERIAL'
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'aster-source.blend'))
    return {'scene': scene.name, 'source': str(ROOT / 'aster-source.blend'),
            'status': 'authored, not validated', 'objects': len(scene.objects)}


if __name__ == '__main__':
    build()
