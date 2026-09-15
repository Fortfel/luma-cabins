"""Author Veyra in an EMPTY fresh Blender file; never load or edit another cabin.

Use prepare_sources(), then build() in the new empty file. Export is separate.
No validation, round trip, browser workflow or automated tests are invoked.
"""

import json
import math
import random
import shutil
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
W, D, F, E, R = 11.2, 5.0, 0.42, 3.35, 4.75
SLOPE = (R - E) / (D / 2)
COL = {}
M = {}
RNG = random.Random(318)


def prepare_sources():
    """Copy only approved CC0 texture bytes and preset data, never cabin geometry."""
    src = ROOT.parent / 'aster-3d'
    for folder in ('textures', 'finishes/textures', 'renders'):
        (ROOT / folder).mkdir(parents=True, exist_ok=True)
    for folder in ('textures', 'finishes/textures'):
        for path in (src / folder).iterdir():
            if path.suffix.lower() in ('.jpg', '.png'):
                shutil.copyfile(path, ROOT / folder / path.name)
    presets = json.loads((src / 'aster-presets.json').read_text())
    presets.update(asset='veyra-configurator.glb', camera='veyra-camera.json',
                   poster='renders/veyra-configurator-poster.png')
    (ROOT / 'veyra-presets.json').write_text(json.dumps(presets, indent=2) + '\n')
    sources = json.loads((src / 'texture-sources.json').read_text())
    sources['provenance'] = 'Approved CC0 Niva/Aster material bytes copied locally; no cabin geometry imported.'
    (ROOT / 'texture-sources.json').write_text(json.dumps(sources, indent=2) + '\n')


def material(key, name, color, roughness=0.65, metal=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    rgba = (*color[:3], color[3] if len(color) == 4 else 1)
    bsdf.inputs['Base Color'].default_value = rgba
    bsdf.inputs['Alpha'].default_value = rgba[3]
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metal
    mat.diffuse_color = rgba
    M[key] = mat
    return mat


def texture(key, base, family='oak'):
    mat = M[key]
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes.get('Principled BSDF')
    bsdf.inputs['Roughness'].default_value = 1
    for kind, filename in [('base', base), ('normal', family + '-normal-1k.jpg'), ('orm', family + '-orm-1k.png')]:
        image = bpy.data.images.load(str(ROOT / 'textures' / filename), check_existing=True)
        image.colorspace_settings.name = 'sRGB' if kind == 'base' else 'Non-Color'
        image.pack()
        node = nodes.new('ShaderNodeTexImage')
        node.image = image
        node.label = 'Poly Haven CC0; local 1K material-only map'
        if kind == 'base':
            links.new(node.outputs['Color'], bsdf.inputs['Base Color'])
        elif kind == 'normal':
            normal = nodes.new('ShaderNodeNormalMap')
            normal.inputs['Strength'].default_value = 0.22
            links.new(node.outputs['Color'], normal.inputs['Color'])
            links.new(normal.outputs['Normal'], bsdf.inputs['Normal'])
        else:
            split = nodes.new('ShaderNodeSeparateColor')
            links.new(node.outputs['Color'], split.inputs['Color'])
            links.new(split.outputs['Green'], bsdf.inputs['Roughness'])
            links.new(split.outputs['Blue'], bsdf.inputs['Metallic'])


def materials():
    for key, name in [('clad', 'ExteriorCladding'), ('wood', 'InteriorJoinery'),
                      ('deck', 'FixedDeckTimber'), ('floor', 'FixedInteriorFloor')]:
        material(key, name, (1, 1, 1), 1)
    texture('clad', 'natural-cladding-basecolor-1k.jpg')
    texture('wood', 'light-oak-basecolor-1k.jpg')
    texture('deck', 'light-oak-basecolor-1k.jpg')
    texture('floor', 'floor-basecolor-1k.jpg', 'floor')
    for args in [
        ('plaster', 'FixedWarmPlaster', (.78, .744, .664), .88),
        ('roof', 'StandingSeamGraphite', (.022, .027, .03), .6, .05),
        ('black', 'PowderCoatedFrames', (.014, .019, .02), .38, .25),
        ('base', 'FoundationSteel', (.018, .023, .022), .72, .25),
        ('glass', 'Glazing', (.1, .14, .15, .085), .16),
        ('linen', 'FixedIvoryLinen', (.80, .75, .65), .96),
        ('sofa', 'FixedFlaxUpholstery', (.56, .49, .38), .94),
        ('olive', 'FixedSageTextile', (.21, .25, .16), .96),
        ('rug', 'FixedOatmealWeave', (.48, .41, .30), 1),
        ('stone', 'FixedPaleLimestone', (.66, .64, .55), .48),
        ('appliance', 'ApplianceCharcoal', (.035, .042, .042), .48, .25),
        ('screen', 'DarkDisplayGlass', (.006, .009, .011), .21, .1),
        ('steel', 'BrushedStainless', (.30, .32, .32), .3, .8),
        ('ceramic', 'WarmCeramic', (.63, .50, .35), .65),
        ('white', 'Porcelain', (.86, .83, .74), .3),
        ('leaf', 'Foliage', (.08, .17, .047), .85),
        ('soil', 'SoilAndStems', (.043, .030, .016), 1),
        ('paper', 'BookPaper', (.65, .59, .45), .95),
        ('terra', 'TerracottaAndBookCloth', (.30, .11, .063), .9),
        ('solar', 'SolarCells', (.014, .022, .033), .52),
        ('grid', 'SolarConductors', (.039, .05, .058), .75),
        ('glow', 'WarmLightDiffusers', (.95, .72, .43), .6),
    ]:
        material(*args)
    M['glass'].surface_render_method = 'DITHERED'
    M['glass'].use_transparent_shadow = True
    M['glass'].use_backface_culling = True
    for key, value in [('roof', .12), ('solar', .025), ('grid', .06)]:
        M[key].node_tree.nodes.get('Principled BSDF').inputs['Specular IOR Level'].default_value = value
    bsdf = M['glow'].node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Emission Color'].default_value = (1, .66, .32, 1)
    bsdf.inputs['Emission Strength'].default_value = 2


def uv(obj, scale=1.83):
    layer = obj.data.uv_layers.get('UVMap') or obj.data.uv_layers.new(name='UVMap')
    for face in obj.data.polygons:
        for index in face.loop_indices:
            co = obj.data.vertices[obj.data.loops[index].vertex_index].co
            n = face.normal
            a, b = (co.y, co.x) if abs(n.z) > .5 else ((co.y, co.z) if abs(n.x) > abs(n.y) else (co.x, co.z))
            layer.data[index].uv = (a / scale, b / scale)


def finish(obj, name, mat, group, bevel=0, segments=2):
    obj.name = obj.data.name = name
    for col in list(obj.users_collection):
        col.objects.unlink(obj)
    COL[group].objects.link(obj)
    obj.data.materials.append(M[mat])
    uv(obj)
    if bevel:
        mod = obj.modifiers.new('Authored soft edges', 'BEVEL')
        mod.width, mod.segments = bevel, segments
        mod = obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
        mod.keep_sharp = True
    return obj


def box(name, loc, size, mat='wood', group='ShallowInterior', bevel=.006, rotation=None, segments=2):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    finish(obj, name, mat, group, bevel, segments)
    if bevel and mat in ('linen', 'sofa', 'olive', 'rug'):
        for polygon in obj.data.polygons:
            polygon.use_smooth = True
    if rotation:
        obj.rotation_euler = rotation
    return obj


def mesh(name, verts, faces, mat, group='Architecture', bevel=0):
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces)
    data.update()
    bm = bmesh.new()
    bm.from_mesh(data)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(data)
    bm.free()
    obj = bpy.data.objects.new(name, data)
    COL[group].objects.link(obj)
    return finish(obj, name, mat, group, bevel)


def cyl(name, a, b, radius, mat='black', group='ShallowInterior', top=None, vertices=16):
    delta = Vector(b) - Vector(a)
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius, radius2=radius if top is None else top,
                                    depth=delta.length, location=(Vector(a) + Vector(b)) / 2)
    obj = bpy.context.object
    finish(obj, name, mat, group, .002 if radius > .025 else 0)
    obj.rotation_euler = delta.to_track_quat('Z', 'Y').to_euler()
    for poly in obj.data.polygons:
        poly.use_smooth = len(poly.vertices) == 4
    return obj


def sphere(name, loc, size, mat, segments=16, rings=8):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=loc)
    obj = bpy.context.object
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    finish(obj, name, mat, 'ShallowInterior')
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


def tube(name, points, radius, mat='black', group='ShallowInterior'):
    # Low-sided swept polyline with continuous joints.
    verts, faces = [], []
    for i, p in enumerate(points):
        direction = Vector(points[min(i + 1, len(points) - 1)]) - Vector(points[max(0, i - 1)])
        tangent = direction.normalized()
        side = tangent.cross(Vector((0, 0, 1)))
        if side.length < .01:
            side = tangent.cross(Vector((0, 1, 0)))
        side.normalize()
        other = tangent.cross(side).normalized()
        for k in range(10):
            q = Vector(p) + radius * (math.cos(k * math.tau / 10) * side + math.sin(k * math.tau / 10) * other)
            verts.append(tuple(q))
        if i:
            for k in range(10):
                j, prev = i * 10 + k, (i - 1) * 10 + k
                faces.append((prev, (i - 1) * 10 + (k + 1) % 10, i * 10 + (k + 1) % 10, j))
    faces += [tuple(reversed(range(10))), tuple(range(len(verts) - 10, len(verts)))]
    obj = mesh(name, verts, faces, mat, group)
    for p in obj.data.polygons:
        p.use_smooth = len(p.vertices) == 4
    return obj


def cut(obj, center, dims):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    cutter = bpy.context.object
    cutter.scale = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.context.view_layer.objects.active = obj
    mod = obj.modifiers.new('Architectural opening', 'BOOLEAN')
    mod.operation, mod.solver, mod.object = 'DIFFERENCE', 'EXACT', cutter
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)
    uv(obj)


def elevation(name, axis, plane, span, openings, gable=False):
    verts, faces = [], []
    count = math.ceil(span / .1525)
    pitch = span / count
    height = lambda u: R - abs(u) * SLOPE if gable else E
    for i in range(count):
        a, b = -span / 2 + i * pitch + .001, -span / 2 + (i + 1) * pitch - .001
        breaks = sorted({a, b} | {v for op in openings for v in op[:2] if a < v < b})
        for lo, hi in zip(breaks, breaks[1:]):
            intervals = [(F - .065, max(height(lo), height(hi)))]
            for left, right, bottom, top in openings:
                if left < (lo + hi) / 2 < right:
                    intervals = [(z0, z1) for start, end in intervals
                                 for z0, z1 in ((start, min(end, bottom)), (max(start, top), end)) if z1 > z0]
            for bottom, top in intervals:
                z0, z1 = min(top, height(lo)), min(top, height(hi))
                if min(z0, z1) <= bottom:
                    continue
                n = len(verts)
                for depth in (-.027, .027):
                    for u, z in [(lo, bottom), (hi, bottom), (hi, z1), (lo, z0)]:
                        verts.append((u, plane + depth, z) if axis == 'x' else (plane + depth, u, z))
                faces.extend(tuple(n + j for j in face) for face in
                             [(3, 2, 1, 0), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)])
    return mesh('Cladding_' + name, verts, faces, 'clad', bevel=.001)


def opening(name, axis, plane, u, bottom, width, height, leaves=0, outside=-1):
    def part(suffix, du, z, w, h, depth=.16, mat='black', offset=0, group='ExteriorDetails'):
        loc = (u + du, plane + offset, z) if axis == 'x' else (plane + offset, u + du, z)
        size = (w, depth, h) if axis == 'x' else (depth, w, h)
        return box(name + '_' + suffix, loc, size, mat, group, .003)
    center, frame = bottom + height / 2, .075
    for sign in (-1, 1):
        part('OuterJamb_' + str(sign), sign * (width - frame) / 2, center, frame, height, .23)
        part('OuterSill' if sign < 0 else 'OuterHead', 0, center + sign * (height - frame) / 2, width, frame, .23)
    part('WeatherSill', 0, bottom - .015, width + .055, .026, .28)
    if not leaves:
        part('Glass', 0, center, width - .15, height - .15, .008, 'glass', group='Glazing')
        return
    inner = width - frame * 2 - .009
    leaf_width = (inner - (leaves - 1) * .006) / leaves
    for i in range(leaves):
        du = -inner / 2 + leaf_width / 2 + i * (leaf_width + .006)
        h = height - .16
        for sign in (-1, 1):
            part(f'Leaf{i}_Stile{sign}', du + sign * (leaf_width - .09) / 2, center, .09, h, .085)
            part(f'Leaf{i}_Rail{sign}', du, center + sign * (h - (.14 if sign < 0 else .09)) / 2,
                 leaf_width, .14 if sign < 0 else .09, .085)
        part(f'Leaf{i}_Glass', du, center + .025, leaf_width - .18, h - .23, .008, 'glass', group='Glazing')
        handle_side = 1 if i == 0 and leaves == 2 else -1
        handle = du + handle_side * (leaf_width / 2 - .12)
        for direction in (-1, 1):
            part(f'Leaf{i}_Plate{direction}', handle, F + 1.05, .034, .20, .015, offset=direction * .055)
            part(f'Leaf{i}_Spindle{direction}', handle, F + 1.10, .025, .025, .07, offset=direction * .08)
            part(f'Leaf{i}_Lever{direction}', handle - handle_side * .055, F + 1.10, .135, .021, .022, offset=direction * .115)
            part(f'Leaf{i}_Key{direction}', handle, F + 1.00, .013, .02, .016, 'steel', direction * .065)
        for z in (F + .30, F + 1.20, F + 2.15):
            part(f'Leaf{i}_Hinge{z:.2f}', du - handle_side * (leaf_width / 2 - .01), z, .027, .09, .12)
    for sign in (-1, 1):
        part('Rebate_' + str(sign), sign * (width / 2 - .08), center, .035, height - .12, .035, offset=-outside * .07)
    if leaves == 2:
        part('MeetingSeal', 0, center, .028, height - .15, .025, offset=-outside * .06)
    part('Canopy', 0, bottom + height + .20, width + .60, .18, .56, offset=outside * .15)
    part('CanopyUnderside', 0, bottom + height + .102, width + .46, .016, .43, offset=outside * .14)


def shell():
    openings = [
        ('Front', 'x', -2.5, W, [(-3.95, -3.05, 1.80, 2.94), (-1.0, 1.0, F, 2.94), (3.75, 4.75, F, 2.94)], False),
        ('Rear', 'x', 2.5, W, [(-1.75, -.35, 1.72, 2.67), (1.0, 1.90, 1.83, 2.67)], False),
        ('LeftGable', 'y', -5.6, D, [(-1.15, .35, F, 2.94)], True),
        ('RightGable', 'y', 5.6, D, [], True),
    ]
    for name, axis, plane, span, holes, gable in openings:
        elevation(name, axis, plane, span, holes, gable)
        inward = plane - math.copysign(.135, plane)
        loc = (0, inward, (F + E) / 2) if axis == 'x' else (inward, 0, (F + E) / 2)
        dims = (span, .22, E - F) if axis == 'x' else (.22, span - .26, E - F)
        wall = box('Lining_' + name, loc, dims, 'plaster', 'Architecture', 0)
        for a, b, z0, z1 in holes:
            loc = ((a + b) / 2, plane, (z0 + z1) / 2) if axis == 'x' else (plane, (a + b) / 2, (z0 + z1) / 2)
            dims = (b - a, .9, z1 - z0 + .002) if axis == 'x' else (.9, b - a, z1 - z0 + .002)
            cut(wall, loc, dims)
        # Matching baseboards stop at floor-level doors.
        intervals = [(-span / 2 + .24, span / 2 - .24)]
        for a, b, z0, z1 in holes:
            if z0 < F + .10:
                intervals = [(lo, hi) for p, q in intervals for lo, hi in ((p, min(q, a)), (max(p, b), q)) if hi > lo]
        p = plane - math.copysign(.262, plane)
        for i, (a, b) in enumerate(intervals):
            loc = ((a + b) / 2, p, F + .055) if axis == 'x' else (p, (a + b) / 2, F + .055)
            dims = (b - a, .022, .11) if axis == 'x' else (.022, b - a, .11)
            box(f'Baseboard_{name}_{i}', loc, dims, 'plaster', 'Architecture', .003)
    box('FinishedFloor', (0, 0, F - .055), (W - .30, D - .30, .11), 'floor', 'Architecture')
    box('FixedFlatCeiling', (0, 0, 3.235), (W - .25, D - .25, .09), 'plaster', 'Architecture')
    for y in (-2.10, 2.10):
        box(f'Base_LongitudinalRail_{y}', (0, y, .235), (11.1, .13, .23), 'base', 'Architecture')
        for x in (-5.15, -2.6, 0, 2.6, 5.15):
            box(f'Base_Foot_{x}_{y}', (x, y, .105), (.19, .22, .21), 'base', 'Architecture')
    for x in (-5.1, -2.5, 0, 2.5, 5.1):
        box(f'Base_Crossmember_{x}', (x, 0, .24), (.10, 4.45, .17), 'base', 'Architecture')
    opening('FrontSmallWindow', 'x', -2.51, -3.5, 1.80, .90, 1.14)
    opening('CentralDoubleDoors', 'x', -2.51, 0, F, 2, 2.52, leaves=2)
    opening('BedroomExteriorDoor', 'x', -2.51, 4.25, F, 1, 2.52, leaves=1)
    opening('LeftGableDoubleDoors', 'y', -5.61, -.40, F, 1.5, 2.52, leaves=2)
    opening('KitchenRearWindow', 'x', 2.51, -1.05, 1.72, 1.4, .95, outside=1)
    opening('ToiletRearWindow', 'x', 2.51, 1.45, 1.83, .90, .84, outside=1)


def roof_and_details():
    angle = math.atan(SLOPE)
    half = 2.69
    length = half * math.sqrt(1 + SLOPE ** 2)
    for sign in (-1, 1):
        rot = (-sign * angle, 0, 0)
        box(f'Roof_Slope_{sign}', (0, sign * half / 2, R - half * SLOPE / 2 + .035),
            (11.6, length, .075), 'roof', 'ExteriorDetails', .004, rot)
        for i in range(27):
            box(f'Roof_Seam_{sign}_{i}', (-5.65 + i * 11.3 / 26, sign * half / 2, R - half * SLOPE / 2 + .08),
                (.018, length, .033), 'roof', 'ExteriorDetails', .003, rot)
        for x in (-5.77, 5.77):
            box(f'Roof_Barge_{sign}_{x}', (x, sign * half / 2, R - half * SLOPE / 2),
                (.115, length + .08, .16), 'roof', 'ExteriorDetails', .004, rot)
        box(f'Eave_Fascia_{sign}', (0, sign * 2.54, E - .005), (11.65, .095, .135), 'black', 'ExteriorDetails')
        # Open U-shaped trough, with end caps, rather than a solid gutter cylinder.
        verts, faces = [], []
        for x in (-5.78, 5.78):
            for j in range(13):
                a = math.pi + j * math.pi / 12
                verts.append((x, sign * 2.66 + .072 * math.cos(a), 3.28 + .072 * math.sin(a)))
        faces = [(j, j + 1, j + 14, j + 13) for j in range(12)]
        gutter = mesh(f'Gutter_{sign}', verts, faces, 'black', 'ExteriorDetails')
        mod = gutter.modifiers.new('Folded aluminum thickness', 'SOLIDIFY')
        mod.thickness = .005
        for x in (-5.78, 5.78):
            box(f'Gutter_Endcap_{sign}_{x}', (x, sign * 2.66, 3.245), (.012, .15, .075), 'black', 'ExteriorDetails')
        for x in (-4.9, -2.5, 0, 2.5, 4.9):
            box(f'Gutter_Bracket_{sign}_{x}', (x, sign * 2.63, 3.235), (.023, .16, .018), 'black', 'ExteriorDetails')
    box('Roof_RidgeCap', (0, 0, R + .073), (11.67, .17, .075), 'roof', 'ExteriorDetails')
    for x, sign in [(-4.98, -1), (5.18, 1)]:
        y = sign * 2.56
        tube(f'Drainpipe_{x}', [(x, sign * 2.66, 3.27), (x, y, 3.05), (x, y, .35), (x, y + sign * .14, .12)],
             .042, 'black', 'ExteriorDetails')
        for z in (.60, 2.75):
            box(f'Drainclip_{x}_{z}', (x, y, z), (.105, .095, .024), 'black', 'ExteriorDetails')
    # One array of eight portrait modules on the visible slope.
    for i in range(8):
        x, y = -4.35 + i * 1.19, -1.30
        z = R + y * SLOPE + .15
        box(f'Solar_{i}_Frame', (x, y, z), (1.17, 1.87, .055), 'black', 'ExteriorDetails', .003, (angle, 0, 0))
        panel = box(f'Solar_{i}_Cells', (x, y - .015, z + .027), (1.125, 1.81, .008), 'solar', 'ExteriorDetails', 0, (angle, 0, 0))
        # Cell lines share the panel's plane and are collected per array below.
        rotation = panel.rotation_euler.to_matrix()
        for k in range(1, 7):
            local = Vector((-1.125 / 2 + k * 1.125 / 7, 0, .006))
            pos = panel.location + rotation @ local
            box(f'SolarGrid_{i}_V{k}', pos, (.002, 1.805, .001), 'grid', 'ExteriorDetails', 0, (angle, 0, 0))
        for k in range(1, 13):
            local = Vector((0, -.905 + k * 1.81 / 13, .006))
            box(f'SolarGrid_{i}_H{k}', panel.location + rotation @ local, (1.12, .002, .001), 'grid', 'ExteriorDetails', 0, (angle, 0, 0))
    # Concealed service flue above the bedroom storage zone; no invented stove.
    x, y = 4.35, .70
    z = R - y * SLOPE
    box('ServiceFlue_Flashing', (x, y, z + .055), (.40, .46, .055), 'roof', 'ExteriorDetails', .006, (-angle, 0, 0))
    cyl('ServiceFlue_Stack', (x, y, z - .12), (x, y, 5.23), .067, 'black', 'ExteriorDetails', vertices=24)
    cyl('ServiceFlue_Collar', (x, y, z + .07), (x, y, z + .20), .115, 'black', 'ExteriorDetails', top=.074)
    cyl('ServiceFlue_RainCap', (x, y, 5.20), (x, y, 5.27), .093, 'black', 'ExteriorDetails')
    for x in (-1.27, 3.43):
        sconce('FrontLamp_' + str(x), 'x', -2.55, x)
    for y in (-1.43, .63):
        sconce('GableLamp_' + str(y), 'y', -5.65, y)


def sconce(name, axis, plane, u):
    def pos(offset, z):
        return (u, plane - offset, z) if axis == 'x' else (plane - offset, u, z)
    dims = (.10, .035, .27) if axis == 'x' else (.035, .10, .27)
    box(name + '_OpaqueBackplate', pos(0, 2.51), dims, 'black', 'ExteriorDetails')
    dims = (.085, .095, .20) if axis == 'x' else (.095, .085, .20)
    box(name + '_Housing', pos(.055, 2.51), dims, 'black', 'ExteriorDetails')
    dims = (.060, .065, .008) if axis == 'x' else (.065, .060, .008)
    box(name + '_Diffuser', pos(.058, 2.407), dims, 'glow', 'ExteriorDetails')


def landing(name, axis, plane, u, width, depth, height):
    count = math.ceil(depth / .14)
    for i in range(count):
        p = plane - (i + .5) * depth / count
        loc = (u, p, height - .025) if axis == 'x' else (p, u, height - .025)
        size = (width, depth / count - .005, .05) if axis == 'x' else (depth / count - .005, width, .05)
        box(f'{name}_Board_{i}', loc, size, 'deck', 'ExteriorDetails', .003)
    for sign in (-1, 1):
        loc = (u + sign * (width / 2 - .12), plane - depth / 2, height / 2) if axis == 'x' else (plane - depth / 2, u + sign * (width / 2 - .12), height / 2)
        size = (.095, depth - .08, height - .055) if axis == 'x' else (depth - .08, .095, height - .055)
        box(name + '_Support_' + str(sign), loc, size, 'base', 'ExteriorDetails')
    loc = (u, plane - depth + .02, height - .08) if axis == 'x' else (plane - depth + .02, u, height - .08)
    size = (width, .04, .10) if axis == 'x' else (.04, width, .10)
    box(name + '_Fascia', loc, size, 'deck', 'ExteriorDetails')


def decks():
    landing('FrontLongLanding', 'x', -2.49, 1.33, 5.02, .74, .405)
    for axis, plane, u, width, name in [('x', -2.50, 4.25, 1.80, 'BedroomSteps'), ('y', -5.60, -.4, 1.88, 'GableSteps')]:
        landing(name + '_Top', axis, plane, u, width, .64, .405)
        landing(name + '_Middle', axis, plane - .64, u, width + .12, .28, .27)
        landing(name + '_Lower', axis, plane - .92, u, width + .24, .29, .135)


def partition_door(name, x, y, width=.83):
    # Door lies along Y, within the bedroom's X partition.
    h = 2.18
    for s in (-1, 1):
        box(name + '_WoodJamb_' + str(s), (x, y + s * (width / 2 + .035), F + h / 2), (.20, .07, h + .07))
        box(name + '_Stop_' + str(s), (x + .03, y + s * (width / 2 - .007), F + h / 2), (.025, .025, h))
    box(name + '_WoodHead', (x, y, F + h + .035), (.20, width + .14, .07))
    box(name + '_HeadStop', (x + .03, y, F + h - .007), (.025, width, .025))
    box(name + '_ClosedLeaf', (x, y, F + h / 2), (.045, width - .006, h - .006))
    for s in (-1, 1):
        cyl(name + '_Rosette_' + str(s), (x + s * .025, y - width / 2 + .12, F + 1.02), (x + s * .04, y - width / 2 + .12, F + 1.02), .032)
        tube(name + '_Lever_' + str(s), [(x + s * .04, y - width / 2 + .12, F + 1.02), (x + s * .085, y - width / 2 + .12, F + 1.02),
                                      (x + s * .085, y - width / 2 + .25, F + 1.02)], .011)


def partitions():
    # Toilet: rear-central, no sanitary fixtures or other furniture inside.
    front = box('Toilet_FrontPartition', (1.39, .60, 1.825), (1.86, .13, 2.81), 'plaster', 'Architecture', 0)
    box('Toilet_LeftPartition', (.46, 1.49, 1.825), (.13, 1.91, 2.81), 'plaster', 'Architecture', 0)
    cut(front, (1.36, .60, F + 1.08), (.83, .5, 2.16))
    # The toilet door faces the central aisle; joinery includes all wooden trim.
    for s in (-1, 1):
        box('Toilet_WoodJamb_' + str(s), (1.36 + s * .447, .60, F + 1.08), (.064, .20, 2.22))
        box('Toilet_WoodStop_' + str(s), (1.36 + s * .410, .63, F + 1.08), (.024, .025, 2.16))
    box('Toilet_WoodHeader', (1.36, .60, F + 2.192), (.958, .20, .064))
    box('Toilet_WoodHeadStop', (1.36, .63, F + 2.153), (.83, .025, .024))
    box('Toilet_ClosedWoodDoor', (1.36, .60, F + 1.08), (.824, .045, 2.154))
    for s in (-1, 1):
        box('Toilet_HandlePlate_' + str(s), (1.65, .60 + s * .035, F + 1.03), (.038, .016, .13), 'black')
        tube('Toilet_Handle_' + str(s), [(1.65, .60 + s * .04, F + 1.06), (1.65, .60 + s * .09, F + 1.06),
                                       (1.53, .60 + s * .09, F + 1.06)], .011)
    bedroom = box('Bedroom_FullPartition', (2.35, 0, 1.825), (.13, 4.60, 2.81), 'plaster', 'Architecture', 0)
    cut(bedroom, (2.35, -1.52, F + 1.09), (.6, .90, 2.18))
    partition_door('BedroomInteriorDoor', 2.35, -1.52, .90)
    # Thick, opaque pleated cloth completely masks the toilet window.
    verts, faces = [], []
    for j in range(3):
        z = 1.68 + j * .55
        for i in range(65):
            x = .91 + i * 1.08 / 64
            y = 2.245 - .034 * math.cos(i * math.tau / 8)
            verts.append((x, y, z + (.008 * math.cos(i * math.tau / 8) if j == 0 else 0)))
    for j in range(2):
        for i in range(64):
            k = j * 65 + i
            faces.append((k, k + 1, k + 66, k + 65))
    curtain = mesh('Toilet_OpaquePleatedCurtain', verts, faces, 'linen', 'ShallowInterior')
    mod = curtain.modifiers.new('Opaque cloth thickness', 'SOLIDIFY')
    mod.thickness = .009
    tube('Toilet_CurtainRail', [(.84, 2.24, 2.84), (2.06, 2.24, 2.84)], .015)
    for i in range(9):
        box('Toilet_CurtainTab_' + str(i), (.93 + i * .13, 2.24, 2.80), (.035, .014, .07), 'linen')


def pull(name, x, y, z, length=.14):
    for s in (-1, 1):
        cyl(name + '_Mount_' + str(s), (x + s * length * .35, y, z), (x + s * length * .35, y - .035, z), .008)
    cyl(name + '_Grip', (x - length / 2, y - .035, z), (x + length / 2, y - .035, z), .009)


def books(name, x, y, z, count=4, upright=False):
    for i in range(count):
        color = ['paper', 'olive', 'terra', 'linen'][i % 4]
        if upright:
            box(f'{name}_{i}_Cover', (x + i * .042, y, z + .13), (.038, .15, .26 + (i % 3) * .02), color, bevel=.002)
            box(f'{name}_{i}_Pages', (x + i * .042, y - .003, z + .13), (.026, .153, .245 + (i % 3) * .02), 'paper', bevel=.001)
        else:
            box(f'{name}_{i}_Cover', (x + i * .008, y, z + .017 + i * .038), (.25, .18, .035), color, bevel=.002)
            box(f'{name}_{i}_Pages', (x + i * .008, y - .002, z + .017 + i * .038), (.242, .183, .024), 'paper', bevel=.001)


def plant(name, x, y, z, size=.38):
    pot = size * .21
    cyl(name + '_Pot', (x, y, z), (x, y, z + size * .36), pot * .77, 'ceramic', top=pot, vertices=20)
    cyl(name + '_Soil', (x, y, z + size * .345), (x, y, z + size * .352), pot * .91, 'soil')
    for i in range(9):
        a = i * 2.39996
        r = size * (.20 + .11 * (i % 3))
        end = (x + math.cos(a) * r, y + math.sin(a) * r, z + size * (.60 + .06 * (i % 5)))
        tube(name + '_Stem_' + str(i), [(x, y, z + size * .3), ((x + end[0]) / 2, (y + end[1]) / 2, end[2] - size * .15), end], size * .006, 'soil')
        leaf = sphere(name + '_Leaf_' + str(i), end, (size * .075, size * .17, size * .018), 'leaf', 12, 6)
        leaf.rotation_euler = (.3, .35, -a)


def mug(name, x, y, z):
    # Open cup with a visible dark inset, not a capped cylinder.
    cyl(name + '_Body', (x, y, z), (x, y, z + .09), .035, 'white', top=.043, vertices=20)
    cyl(name + '_Coffee', (x, y, z + .088), (x, y, z + .090), .035, 'soil', vertices=20)
    points = [(x + .038 + .030 * math.sin(t * math.pi / 8), y, z + .047 + .032 * math.cos(t * math.pi / 8)) for t in range(9)]
    tube(name + '_Handle', points, .007, 'white')


def kitchen():
    # Rear run: tall fridge, oven, sink and wide drawer bank.
    box('Kitchen_ToeKick', (-1.09, 1.99, F + .07), (2.96, .48, .14), 'black')
    carcass = box('Kitchen_BaseCarcass', (-1.09, 1.99, F + .49), (2.96, .58, .76))
    cut(carcass, (-1.22, 1.99, F + .835), (.75, .47, .33))
    for i, x in enumerate((-2.25, -1.59, -.93, -.15)):
        width = .61 if i < 3 else .88
        if i == 0:
            box('Oven_Fascia', (x, 1.679, F + .57), (.58, .05, .62), 'appliance')
            box('Oven_Glass', (x, 1.648, F + .49), (.49, .015, .39), 'screen')
            pull('Oven_Handle', x, 1.624, F + .725, .42)
            for s in (-1, 1):
                cyl('Oven_Dial_' + str(s), (x + s * .17, 1.64, F + .815), (x + s * .17, 1.618, F + .815), .025, 'steel')
            box('Oven_Display', (x, 1.641, F + .815), (.11, .007, .025), 'screen')
            box('Oven_LowerDrawer', (x, 1.681, F + .175), (.61, .035, .12))
        elif i in (1, 2):
            box(f'SinkCabinet_Door_{i}', (x, 1.679, F + .49), (width, .035, .70))
            pull(f'SinkCabinet_Pull_{i}', x, 1.652, F + .75)
        else:
            for j in range(3):
                zz = F + .245 + j * .237
                box(f'Kitchen_Drawer_{j}', (x, 1.679, zz), (width, .035, .225))
                pull(f'Kitchen_DrawerPull_{j}', x, 1.652, zz + .065, .23)
    top = box('Kitchen_LimestoneWorktop', (-1.09, 1.98, F + .905), (3.02, .68, .055), 'stone', bevel=.005)
    cut(top, (-1.22, 1.99, F + .9), (.72, .45, .30))
    # Sink basin is a recessed five-sided assembly with a flange around an actual hole.
    for x in (-1.61, -.83):
        box('Sink_RimSide_' + str(x), (x, 1.99, F + .939), (.035, .51, .014), 'steel', bevel=.003)
        box('Sink_BasinSide_' + str(x), (x + (.02 if x < -1.2 else -.02), 1.99, F + .81), (.02, .43, .23), 'steel')
    for y in (1.75, 2.23):
        box('Sink_RimEnd_' + str(y), (-1.22, y, F + .939), (.78, .033, .014), 'steel')
        box('Sink_BasinEnd_' + str(y), (-1.22, y + (.02 if y < 2 else -.02), F + .81), (.72, .02, .23), 'steel')
    box('Sink_BasinBottom', (-1.22, 1.99, F + .697), (.72, .43, .02), 'steel')
    cyl('Sink_Drain', (-1.22, 1.99, F + .708), (-1.22, 1.99, F + .714), .031, 'black')
    tube('Tap_Gooseneck', [(-1.22, 2.27, F + .93), (-1.22, 2.27, F + 1.23), (-1.22, 2.25, F + 1.30),
                           (-1.22, 2.17, F + 1.33), (-1.22, 2.07, F + 1.30), (-1.22, 2.05, F + 1.24)], .018, 'steel')
    tube('Tap_Lever', [(-1.20, 2.27, F + 1.01), (-1.15, 2.27, F + 1.01), (-1.15, 2.27, F + 1.12)], .009, 'steel')
    box('Kitchen_Hob', (-2.25, 1.98, F + .939), (.57, .51, .014), 'screen', bevel=.006)
    for x in (-2.40, -2.10):
        for y in (1.84, 2.10):
            points = [(x + .09 * math.cos(i * math.tau / 32), y + .09 * math.sin(i * math.tau / 32), F + .95) for i in range(33)]
            tube(f'Hob_Ring_{x}_{y}', points, .0018, 'steel')
    box('Kitchen_BackSplash', (-1.09, 2.285, F + 1.04), (3.02, .025, .22), 'stone')
    # Tall housing with fitted doors and overhead storage.
    box('Fridge_Housing', (-2.99, 1.98, F + 1.16), (.76, .65, 2.32))
    box('Fridge_MainFace', (-2.99, 1.637, F + 1.29), (.665, .055, 1.47), 'appliance', bevel=.015)
    box('Fridge_FreezerFace', (-2.99, 1.637, F + .32), (.665, .055, .45), 'appliance', bevel=.015)
    for z, h in [(F + 1.17, .49), (F + .33, .27)]:
        tube('Fridge_VerticalPull_' + str(z), [(-3.23, 1.60, z - h / 2), (-3.23, 1.56, z - h / 2),
                                            (-3.23, 1.56, z + h / 2), (-3.23, 1.60, z + h / 2)], .012, 'steel')
    box('Fridge_OverheadDoor', (-2.99, 1.638, F + 2.16), (.68, .036, .28))
    pull('Fridge_OverheadPull', -2.99, 1.607, F + 2.08)
    for i, x in enumerate((-2.35, -.01)):
        box(f'Kitchen_UpperCarcass_{i}', (x, 2.095, 2.48), (.63, .36, .71))
        box(f'Kitchen_UpperDoor_{i}', (x, 1.897, 2.48), (.595, .033, .675))
        pull(f'Kitchen_UpperPull_{i}', x, 1.87, 2.21)
        box(f'Kitchen_UnderCabinetDiffuser_{i}', (x, 2.035, 2.114), (.51, .025, .007), 'glow')
    box('Kitchen_ChoppingBoard', (-.32, 2.01, F + .954), (.33, .25, .024), bevel=.015)
    cyl('Kitchen_UtensilPot', (.12, 2.12, F + .94), (.12, 2.12, F + 1.08), .061, 'ceramic')
    for i in range(3):
        cyl('Kitchen_Utensil_' + str(i), (.09 + .03 * i, 2.12, F + 1.0), (.07 + .043 * i, 2.11, F + 1.25), .008, 'wood')
    # Electric kettle with handle, spout and lid.
    cyl('Kettle_Body', (-1.86, 2.17, F + .94), (-1.86, 2.17, F + 1.13), .08, 'ceramic', top=.06)
    cyl('Kettle_Lid', (-1.86, 2.17, F + 1.13), (-1.86, 2.17, F + 1.15), .061)
    tube('Kettle_Handle', [(-1.80, 2.17, F + 1.12), (-1.73, 2.17, F + 1.13), (-1.72, 2.17, F + .98), (-1.79, 2.17, F + .97)], .012)
    cyl('Kettle_Spout', (-1.92, 2.17, F + 1.02), (-1.99, 2.17, F + 1.10), .023, 'ceramic', top=.015)


def chair(name, x, y, angle=0):
    start = set(bpy.context.scene.objects)
    box(name + '_Seat', (0, 0, F + .46), (.46, .44, .045), bevel=.023, segments=3)
    box(name + '_SeatPad', (0, 0, F + .49), (.415, .395, .035), 'linen', bevel=.016, segments=3)
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl(name + f'_Leg{sx}{sy}', (sx * .215, sy * .19, F + .02), (sx * .175, sy * .16, F + .445), .018, 'wood', top=.023)
        cyl(name + '_BackPost' + str(sx), (sx * .19, .17, F + .43), (sx * .20, .23, F + .87), .019, 'wood')
    box(name + '_Back', (0, .225, F + .795), (.46, .055, .155), bevel=.027, segments=3)
    c, s = math.cos(angle), math.sin(angle)
    for obj in set(bpy.context.scene.objects) - start:
        ox, oy = obj.location.x, obj.location.y
        obj.location.x, obj.location.y = x + c * ox - s * oy, y + s * ox + c * oy
        obj.rotation_euler.z += angle


def dining():
    start = set(bpy.context.scene.objects)
    box('Dining_TableTop', (-.12, -.18, F + .765), (1.65, .85, .055), bevel=.04, segments=3)
    for x in (-.78, .54):
        for y in (-.46, .10):
            cyl('Dining_Leg_' + str((x, y)), (x, y, F + .01), (x, y, F + .73), .039, 'wood', top=.045)
    for x in (-.60, .36):
        chair('Dining_ChairRear_' + str(x), x, .55)
        chair('Dining_ChairFront_' + str(x), x, -.90, math.pi)
    cyl('Dining_CenterTray', (-.12, -.18, F + .795), (-.12, -.18, F + .815), .145, 'wood', vertices=32)
    plant('Dining_Plant', -.12, -.18, F + .817, .28)
    for x in (-.67, .43):
        cyl('Dining_Plate_' + str(x), (x, -.26, F + .797), (x, -.26, F + .805), .12, 'white', vertices=32)
        mug('Dining_Mug_' + str(x), x + .15, -.15, F + .795)
    for x in (-.54, .30):
        cyl('Dining_PendantCord_' + str(x), (x, -.18, 3.18), (x, -.18, 2.40), .007)
        cyl('Dining_PendantShade_' + str(x), (x, -.18, 2.25), (x, -.18, 2.43), .17, 'ceramic', top=.065, vertices=24)
        cyl('Dining_PendantDiffuser_' + str(x), (x, -.18, 2.245), (x, -.18, 2.251), .143, 'glow', vertices=24)
    # The rear chairs clear the toilet partition and leave the entrance aisle open.
    for obj in set(bpy.context.scene.objects) - start:
        obj.location.y -= .28


def art(name, x, y, z, width=.55, height=.72):
    box(name + '_Frame', (x, y, z), (width, .035, height), 'wood', bevel=.003)
    box(name + '_Mat', (x, y - .022, z), (width - .045, .008, height - .045), 'linen', bevel=0)
    box(name + '_Print', (x, y - .028, z), (width - .13, .003, height - .13), 'paper', bevel=0)
    # Restrained abstract relief graphic, real geometry with no camera baking.
    shape = sphere(name + '_OchreMotif', (x - .07, y - .032, z + .045), (width * .20, .003, height * .24), 'ceramic')
    sphere(name + '_SageMotif', (x + .08, y - .036, z - .12), (width * .16, .003, height * .10), 'olive')
    return shape


def lounge():
    box('Lounge_Rug', (-3.64, -.32, F + .014), (2.78, 2.62, .028), 'rug', bevel=.022)
    # Sofa faces +Y, leaving the gable entrance aisle clear along its left side.
    box('Sofa_Base', (-3.55, -1.25, F + .24), (2.20, .86, .26), 'sofa', bevel=.07, segments=3)
    box('Sofa_Back', (-3.55, -1.61, F + .65), (2.24, .20, .63), 'sofa', bevel=.065, segments=3)
    for x in (-4.61, -2.49):
        box('Sofa_Arm_' + str(x), (x, -1.24, F + .46), (.19, .91, .52), 'sofa', bevel=.07, segments=3)
    for i in range(3):
        x = -4.22 + i * .67
        box(f'Sofa_SeatCushion_{i}', (x, -1.18, F + .445), (.65, .68, .18), 'linen', bevel=.065, segments=4)
        box(f'Sofa_BackCushion_{i}', (x, -1.49, F + .755), (.66, .18, .46), 'linen', bevel=.07, rotation=(.12, 0, 0), segments=4)
    for i, x in enumerate((-4.33, -2.76)):
        box(f'Sofa_SagePillow_{i}', (x, -1.28, F + .78), (.35, .14, .35), 'olive', bevel=.075, rotation=(.24, .12, (-1 if i else 1) * .18), segments=4)
    for x in (-4.38, -2.73):
        for y in (-1.50, -.99):
            cyl(f'Sofa_Foot_{x}_{y}', (x, y, F + .03), (x, y, F + .15), .027)
    cyl('CoffeeTable_Top', (-3.60, -.12, F + .40), (-3.60, -.12, F + .44), .47, 'wood', vertices=48)
    for i in range(3):
        a = i * math.tau / 3
        cyl('CoffeeTable_Leg_' + str(i), (-3.60 + .36 * math.cos(a), -.12 + .36 * math.sin(a), F + .03),
            (-3.60 + .30 * math.cos(a), -.12 + .30 * math.sin(a), F + .40), .026, 'wood')
    books('CoffeeTable_Books', -3.76, -.12, F + .44, 2)
    plant('CoffeeTable_Plant', -3.39, .01, F + .44, .29)
    mug('CoffeeTable_Mug', -3.42, -.33, F + .44)
    # TV console opposite the sofa, beside the kitchen tall unit.
    box('MediaConsole_Carcass', (-4.27, 1.98, F + .40), (1.68, .40, .46))
    for i in range(3):
        x = -4.81 + i * .54
        box('MediaConsole_Front_' + str(i), (x, 1.764, F + .40), (.526, .026, .415))
    for x in (-4.95, -3.59):
        for y in (1.83, 2.10):
            cyl('MediaConsole_Leg_' + str((x, y)), (x, y, F + .03), (x, y, F + .18), .018)
    box('TV_Housing', (-4.26, 2.16, 1.77), (1.40, .048, .80), 'black', bevel=.018)
    box('TV_Screen', (-4.26, 2.131, 1.77), (1.36, .006, .76), 'screen', bevel=.009)
    box('TV_Soundbar', (-4.27, 1.91, F + .665), (.65, .095, .055), 'appliance', bevel=.016)
    plant('MediaConsole_Plant', -4.93, 1.99, F + .635, .33)
    books('MediaConsole_Books', -3.66, 1.98, F + .635, 2)
    # Laptop workspace at the left-rear side, away from the gable door swing.
    box('Workspace_Desktop', (-4.84, .97, F + .755), (.99, .62, .055), bevel=.012)
    box('Workspace_DrawerCarcass', (-5.14, .98, F + .39), (.35, .55, .68))
    for i in range(3):
        z = F + .205 + i * .21
        box('Workspace_Drawer_' + str(i), (-5.14, .686, z), (.321, .027, .198))
        pull('Workspace_Pull_' + str(i), -5.14, .66, z + .04, .11)
    for y in (.74, 1.21):
        cyl('Workspace_RightLeg_' + str(y), (-4.42, y, F + .02), (-4.42, y, F + .725), .018)
    box('Laptop_Base', (-4.70, .98, F + .794), (.32, .23, .016), 'appliance', bevel=.007)
    box('Laptop_Keyboard', (-4.70, .965, F + .804), (.275, .105, .004), 'black', bevel=.002)
    box('Laptop_Lid', (-4.70, 1.09, F + .90), (.32, .012, .205), 'appliance', bevel=.006, rotation=(-.16, 0, 0))
    box('Laptop_Screen', (-4.70, 1.081, F + .90), (.293, .004, .177), 'screen', bevel=.002, rotation=(-.16, 0, 0))
    chair('Workspace_Chair', -4.65, .37, math.pi)
    mug('Workspace_Mug', -5.10, 1.08, F + .785)
    # Side-wall floating shelves above the desk.
    for z in (1.96, 2.40):
        box('Workspace_WallShelf_' + str(z), (-5.23, 1.07, z), (.26, .92, .035))
    plant('Workspace_ShelfPlant', -5.23, .83, 1.98, .29)
    books('Workspace_ShelfBooks', -5.23, 1.30, 1.98, 3)
    plant('Living_FloorPlant', -2.03, 1.05, F, .89)


def bedroom():
    # A 160 x 200 cm bed points toward the interior partition; headboard at right gable.
    box('Bedroom_Rug', (4.10, -.01, F + .014), (2.48, 2.42, .028), 'rug', bevel=.025)
    box('Bed_TimberFrame', (4.19, -.02, F + .23), (2.13, 1.72, .26), bevel=.025)
    box('Bed_Headboard', (5.27, -.02, F + .70), (.10, 1.88, 1.16), bevel=.025)
    box('Bed_Mattress', (4.19, -.02, F + .46), (2.04, 1.62, .24), 'linen', bevel=.09, segments=4)
    box('Bed_Duvet', (4.00, -.02, F + .595), (1.63, 1.66, .16), 'linen', bevel=.10, segments=4)
    for i, y in enumerate((-.43, .39)):
        box(f'Bed_Pillow_{i}', (4.91, y, F + .66), (.49, .68, .16), 'linen', bevel=.10, rotation=(0, -.1, 0), segments=4)
        box(f'Bed_SageCushion_{i}', (4.64, y, F + .755), (.20, .39, .32), 'olive', bevel=.075, rotation=(0, -.20, 0), segments=4)
    # Folded runner with shallow cloth undulations over the foot of the mattress.
    verts, faces = [], []
    for i in range(9):
        x = 3.30 + i * .056
        for j in range(25):
            y = -.89 + j * 1.74 / 24
            edge = max(0, abs(y + .02) - .73)
            z = F + .690 + .009 * math.sin(j * 1.2 + i * .6) - edge * 1.25
            verts.append((x, y, z))
    for i in range(8):
        for j in range(24):
            k = i * 25 + j
            faces.append((k, k + 25, k + 26, k + 1))
    runner = mesh('Bed_FoldedRunner', verts, faces, 'sofa', 'ShallowInterior')
    mod = runner.modifiers.new('Cloth thickness', 'SOLIDIFY')
    mod.thickness = .008
    for i, y in enumerate((-1.25, 1.21)):
        box(f'Bedside_{i}_Carcass', (5.02, y, F + .30), (.49, .46, .50), bevel=.014)
        # Drawer faces point toward the bed foot, along -X.
        for j in range(2):
            z = F + .20 + j * .23
            box(f'Bedside_{i}_Drawer_{j}', (4.758, y, z), (.03, .424, .214))
            cyl(f'Bedside_{i}_Knob_{j}', (4.74, y, z), (4.712, y, z), .014)
        cyl(f'Bedside_{i}_LampBase', (5.02, y, F + .56), (5.02, y, F + .58), .09, 'ceramic', vertices=24)
        cyl(f'Bedside_{i}_LampStem', (5.02, y, F + .58), (5.02, y, F + .78), .017, 'steel')
        cyl(f'Bedside_{i}_Shade', (5.02, y, F + .73), (5.02, y, F + .92), .13, 'linen', top=.095, vertices=24)
        cyl(f'Bedside_{i}_Diffuser', (5.02, y, F + .725), (5.02, y, F + .731), .114, 'glow')
    # Wardrobe at rear, providing believable storage without obstructing either entrance.
    box('Wardrobe_Carcass', (4.18, 1.985, F + 1.14), (2.11, .57, 2.28), bevel=.008)
    box('Wardrobe_RecessedPlinth', (4.18, 1.99, F + .05), (2.0, .48, .10), 'black')
    for i in range(4):
        x = 3.40 + i * .52
        box('Wardrobe_Door_' + str(i), (x, 1.681, F + 1.18), (.505, .035, 2.15))
        cyl('Wardrobe_Pull_' + str(i), (x + (.17 if i % 2 == 0 else -.17), 1.636, F + 1.04),
            (x + (.17 if i % 2 == 0 else -.17), 1.636, F + 1.27), .01)
    # Fixed concealed service riser above joinery, aligned in X with exterior flue.
    box('FixedServiceRiser', (4.35, .70, 3.39), (.22, .22, .32), 'plaster', 'Architecture')
    art('Bedroom_Print', 3.00, 2.255, 2.20, .52, .70)
    plant('Bedroom_Plant', 2.77, 1.94, F, .74)
    # Low luggage bench beside the entrance, leaving a clear route to the bed.
    box('Bedroom_EntryBench', (3.06, -2.02, F + .43), (.85, .36, .055), bevel=.015)
    for x in (2.74, 3.38):
        for y in (-2.14, -1.90):
            cyl('Bedroom_BenchLeg_' + str((x, y)), (x, y, F + .02), (x, y, F + .40), .022, 'wood')


def lighting_camera():
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 48
    scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = 1358, 553
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'
    world = bpy.data.worlds.new('Veyra_NeutralWorld')
    world.use_nodes = True
    world.node_tree.nodes.get('Background').inputs['Color'].default_value = (.73, .79, .85, 1)
    world.node_tree.nodes.get('Background').inputs['Strength'].default_value = .32
    scene.world = world
    def area(name, loc, target, energy, size, color, size_y=None):
        data = bpy.data.lights.new(name, 'AREA')
        data.energy, data.color = energy, color
        data.shape = 'RECTANGLE' if size_y else 'DISK'
        data.size = size
        if size_y:
            data.size_y = size_y
        data.use_shadow = True
        obj = bpy.data.objects.new(name, data)
        COL['Lights'].objects.link(obj)
        obj.location = loc
        obj.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    area('Studio_Key', (-6, -9, 10), (0, 0, 1.5), 2300, 8, (1, .90, .77))
    area('Studio_Fill', (5, -5, 7), (0, 0, 1.5), 1450, 7, (.82, .9, 1))
    area('Studio_GableFill', (-10, -1, 6), (-5, 0, 2), 1050, 6, (1, .94, .83))
    area('Studio_Rim', (1, 6, 9), (0, 0, 2), 2100, 6, (1, .94, .83))
    for name, x, y, power, size in [('Lounge', -3.7, .0, 95, 1.4), ('Kitchen', -1.25, 1.20, 80, 1.0),
                                     ('Dining', -.12, -.46, 42, .45), ('Bedroom', 4.05, -.3, 75, 1.2)]:
        z = 2.22 if name == 'Dining' else 3.15
        area('Interior_' + name, (x, y, z), (x, y, F), power, size, (1, .80, .56))
    for x, y, axis in [(-1.27, -2.64, 'front'), (3.43, -2.64, 'front'), (-5.74, -1.43, 'side'), (-5.74, .63, 'side')]:
        area(f'SconceLight_{x}_{y}', (x, y, 2.399), (x, y, 1.3), 3.5, .065, (1, .65, .30))
    for x in (-4.0, -1.6, 1.7, 3.2, 4.9):
        for y in (-1.1, 1.1):
            # Flush mounted trim and emissive lens, no protruding ceiling lamp.
            cyl(f'Downlight_Trim_{x}_{y}', (x, y, 3.184), (x, y, 3.195), .048, 'white')
            cyl(f'Downlight_Lens_{x}_{y}', (x, y, 3.181), (x, y, 3.185), .035, 'glow')
    def camera(name, loc, target, lens):
        data = bpy.data.cameras.new(name)
        obj = bpy.data.objects.new(name, data)
        COL['ReviewStaging'].objects.link(obj)
        obj.location = loc
        obj.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        obj['target_blender'] = target
        data.lens, data.sensor_width, data.sensor_fit = lens, 36, 'HORIZONTAL'
        data.clip_start, data.clip_end = .05, 300
        return obj
    scene.camera = camera('Veyra_CanonicalCamera', (-14.0, -29.0, 5.65), (0, -.15, 2.40), 73)
    scene.camera.data.shift_y = -.012
    camera('Veyra_InteriorReview', (-4.88, -1.95, 1.96), (-.2, 1.30, 1.50), 22)
    camera('Veyra_BedroomReview', (2.73, -2.00, 1.92), (4.42, .50, 1.1), 21)
    for screen in bpy.data.screens:
        for area_obj in screen.areas:
            if area_obj.type == 'VIEW_3D':
                space = area_obj.spaces.active
                space.shading.type = 'MATERIAL'
                space.shading.use_scene_world = True
                space.shading.use_scene_lights = True
                space.overlay.show_overlays = False
                space.region_3d.view_perspective = 'CAMERA'


def consolidate(prefix, name):
    """Batch small static parts of one semantic assembly; retain material slots."""
    objects = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name.startswith(prefix)]
    if len(objects) < 2:
        return
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        for mod in list(obj.modifiers):
            bpy.ops.object.modifier_apply(modifier=mod.name)
        obj.select_set(False)
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    objects[0].name = objects[0].data.name = name
    bpy.ops.object.select_all(action='DESELECT')


def build():
    if len(bpy.data.objects) or bpy.data.filepath:
        raise RuntimeError('Build only in a NEW empty unsaved file. Never run in Aster or Niva.')
    scene = bpy.context.scene
    scene.name = 'Veyra_Source'
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1
    scene['revision'] = 'Initial authored candidate; awaiting user visual review'
    scene['architecture'] = 'Exterior reference authoritative; interior authored following user clarification; empty toilet.'
    for group in ('Architecture', 'Glazing', 'ExteriorDetails', 'ShallowInterior', 'Lights', 'ReviewStaging'):
        col = bpy.data.collections.new('Veyra_' + group)
        scene.collection.children.link(col)
        COL[group] = col
    materials()
    shell()
    roof_and_details()
    decks()
    partitions()
    kitchen()
    dining()
    lounge()
    bedroom()
    lighting_camera()
    # Sensible assembly granularity, rather than a draw call per book page or leaf.
    for prefix in ('SolarGrid_', 'Roof_Seam_-1_', 'Roof_Seam_1_', 'Base_', 'Downlight_',
                   'Hob_Ring_', 'Toilet_CurtainTab_', 'CoffeeTable_Leg_', 'Dining_Leg_'):
        consolidate(prefix, prefix.rstrip('_'))
    for prefix in ('Dining_ChairRear_-0.6', 'Dining_ChairRear_0.36', 'Dining_ChairFront_-0.6', 'Dining_ChairFront_0.36',
                   'Workspace_Chair', 'Dining_Plant', 'CoffeeTable_Plant', 'MediaConsole_Plant', 'Workspace_ShelfPlant',
                   'Living_FloorPlant', 'Bedroom_Plant', 'CoffeeTable_Books', 'MediaConsole_Books',
                   'Workspace_ShelfBooks', 'Dining_Mug_', 'CoffeeTable_Mug', 'Workspace_Mug',
                   'FrontLongLanding', 'BedroomSteps', 'GableSteps'):
        consolidate(prefix, prefix.rstrip('_'))
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'veyra-source.blend'), compress=True)
    return {'source': str(ROOT / 'veyra-source.blend'), 'scene': scene.name, 'status': 'authored; no tests run'}
