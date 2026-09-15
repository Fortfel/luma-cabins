"""Veyra revision 2: user-directed layout and intersection repairs.

Run prepare(), exterior_layout(), then interiors(). Prior saved and live source
are preserved; replaced objects are archived outside the runtime collections.
This is authoring code, not a validation/test suite. Export separately.
"""

import math
import runpy
import shutil
from datetime import datetime
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
H = runpy.run_path(str(ROOT / 'scripts/build-veyra.py'))
F, E, R = .42, 3.35, 4.75
SLOPE = .56
GROUPS = ('Architecture', 'Glazing', 'ExteriorDetails', 'ShallowInterior', 'Lights', 'ReviewStaging')
DOOR_Y = -.80
WC_FRONT = -.20
DINING_DELTA = Vector((-1.18, .21, 0))
SOFA_DELTA = Vector((-.545, -.48, 0))
COFFEE_DELTA = Vector((-.545, -.35, 0))


def bind():
    H['COL'].update({g: bpy.data.collections['Veyra_' + g] for g in GROUPS})
    names = {
        'clad': 'ExteriorCladding', 'wood': 'InteriorJoinery', 'deck': 'FixedDeckTimber',
        'floor': 'FixedInteriorFloor', 'plaster': 'FixedWarmPlaster', 'roof': 'StandingSeamGraphite',
        'black': 'PowderCoatedFrames', 'base': 'FoundationSteel', 'glass': 'Glazing',
        'linen': 'FixedIvoryLinen', 'sofa': 'FixedFlaxUpholstery', 'olive': 'FixedSageTextile',
        'rug': 'FixedOatmealWeave', 'stone': 'FixedPaleLimestone', 'appliance': 'ApplianceCharcoal',
        'screen': 'DarkDisplayGlass', 'steel': 'BrushedStainless', 'ceramic': 'WarmCeramic',
        'white': 'Porcelain', 'leaf': 'Foliage', 'soil': 'SoilAndStems', 'paper': 'BookPaper',
        'terra': 'TerracottaAndBookCloth', 'solar': 'SolarCells', 'grid': 'SolarConductors',
        'glow': 'WarmLightDiffusers',
    }
    H['M'].update({key: bpy.data.materials[name] for key, name in names.items()})


def live():
    return set(o for g in GROUPS for o in bpy.data.collections['Veyra_' + g].objects)


def archive(prefixes=(), exact=()):
    collection = bpy.data.collections['Veyra_Archive_PreRevision2']
    for obj in list(live()):
        if obj.name in exact or any(obj.name.startswith(p) for p in prefixes):
            name = obj.name
            for col in list(obj.users_collection):
                col.objects.unlink(obj)
            collection.objects.link(obj)
            obj['superseded_name'] = name
            obj.name = 'R1__' + name


def move(prefixes, delta):
    for obj in live():
        if any(obj.name.startswith(p) for p in prefixes):
            obj.location += Vector(delta)


def prepare():
    if bpy.context.scene.name != 'Veyra_Source' or Path(bpy.data.filepath).parent != ROOT:
        raise RuntimeError('Open the independent Veyra source before revising it.')
    if bpy.context.scene.get('revision2_started'):
        raise RuntimeError('Revision 2 has already started; continue its remaining stages instead.')
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    path = ROOT / 'history' / ('before-revision-2-' + datetime.now().strftime('%Y%m%d-%H%M%S'))
    path.mkdir(parents=True, exist_ok=False)
    for filename in ('veyra-source.blend', 'veyra-configurator.glb', 'veyra-camera.json',
                     'veyra-presets.json', 'veyra-delivery.json', 'veyra-lighting.json', 'README.md', 'web-handoff.md'):
        source = ROOT / filename
        if source.exists():
            shutil.copyfile(source, path / filename)
    if (ROOT / 'renders').exists():
        shutil.copytree(ROOT / 'renders', path / 'renders')
    bpy.ops.wm.save_as_mainfile(filepath=str(path / 'veyra-live-before-revision.blend'), copy=True, compress=True)
    archive_col = bpy.data.collections.new('Veyra_Archive_PreRevision2')
    bpy.context.scene.collection.children.link(archive_col)
    archive_col.hide_render = True
    archive_col.hide_viewport = True
    bpy.context.scene['revision2_started'] = True
    bpy.context.scene['revision2_backup'] = str(path.relative_to(ROOT))
    bind()
    return {'backup': str(path), 'status': 'saved/live source preserved before edits'}


def soft_edges(obj, width=.003, segments=2):
    bevel = obj.modifiers.new('Finished edge radius', 'BEVEL')
    bevel.width, bevel.segments = width, segments
    weighted = obj.modifiers.new('Weighted face normals', 'WEIGHTED_NORMAL')
    weighted.keep_sharp = True


def sweep(name, points, radius, mat='black', group='ShallowInterior', inner=0, sides=20):
    """Constant-section tube with parallel-transport frames; no flipping rings."""
    pts = [Vector(p) for p in points]
    tangents = [(pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized() for i in range(len(pts))]
    seed = min((Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))), key=lambda v: abs(v.dot(tangents[0])))
    u = (seed - tangents[0] * seed.dot(tangents[0])).normalized()
    frames = []
    for i, tangent in enumerate(tangents):
        if i:
            u = tangents[i - 1].rotation_difference(tangent) @ u
        u = (u - tangent * u.dot(tangent)).normalized()
        frames.append((u.copy(), tangent.cross(u).normalized()))
    verts, faces = [], []
    radii = (radius, inner) if inner else (radius,)
    stride = len(pts) * sides
    for layer, rr in enumerate(radii):
        for p, (u, v) in zip(pts, frames):
            for k in range(sides):
                a = k * math.tau / sides
                verts.append(tuple(p + rr * (math.cos(a) * u + math.sin(a) * v)))
        for i in range(len(pts) - 1):
            for k in range(sides):
                a = layer * stride + i * sides + k
                b = layer * stride + i * sides + (k + 1) % sides
                face = (a, b, b + sides, a + sides)
                faces.append(tuple(reversed(face)) if layer else face)
    if inner:
        for i in (0, len(pts) - 1):
            for k in range(sides):
                a, b = i * sides + k, i * sides + (k + 1) % sides
                faces.append((a, a + stride, b + stride, b))
    else:
        faces.extend([tuple(reversed(range(sides))), tuple(range(stride - sides, stride))])
    obj = H['mesh'](name, verts, faces, mat, group)
    for face in obj.data.polygons:
        face.use_smooth = len(face.vertices) == 4
    return obj


def rounded_path(points, trim=.05, steps=8):
    points = [Vector(p) for p in points]
    output = [points[0]]
    for a, b, c in zip(points, points[1:], points[2:]):
        dist = min(trim, (a - b).length * .35, (c - b).length * .35)
        p = b + (a - b).normalized() * dist
        q = b + (c - b).normalized() * dist
        for j in range(steps + 1):
            t = j / steps
            output.append((1 - t) ** 2 * p + 2 * (1 - t) * t * b + t ** 2 * q)
    output.append(points[-1])
    return output


def cylinder_cut(obj, center, radius, depth):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=radius, depth=depth, location=center)
    cutter = bpy.context.object
    bpy.context.view_layer.objects.active = obj
    modifier = obj.modifiers.new('Outlet opening', 'BOOLEAN')
    modifier.operation, modifier.solver, modifier.object = 'DIFFERENCE', 'EXACT', cutter
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.data.objects.remove(cutter, do_unlink=True)
    H['uv'](obj)


def drainage():
    archive(prefixes=('Gutter_', 'Drainpipe_', 'Drainclip_'))
    for sign in (-1, 1):
        fascia = bpy.data.objects['Eave_Fascia_' + str(sign)]
        fascia.dimensions.x = 11.41
        # Hollow half-round profile with integrated end caps, clear of the barges.
        section = []
        for rr, indices in ((.080, range(17)), (.074, reversed(range(17)))):
            for j in indices:
                a = math.pi + j * math.pi / 16
                section.append((sign * 2.715 + rr * math.cos(a), 3.235 + rr * math.sin(a)))
        n = len(section)
        verts = [(x, y, z) for x in (-5.66, 5.66) for y, z in section]
        faces = [tuple(reversed(range(n))), tuple(range(n, 2 * n))]
        faces.extend((j, (j + 1) % n, (j + 1) % n + n, j + n) for j in range(n))
        gutter = H['mesh']('Gutter_' + str(sign), verts, faces, 'black', 'ExteriorDetails')
        for face in gutter.data.polygons:
            face.use_smooth = len(face.vertices) == 4
        x = -4.98 if sign < 0 else 5.18
        cylinder_cut(gutter, (x, sign * 2.715, 3.16), .036, .20)
        path = [(x, sign * 2.715, 3.195), (x, sign * 2.715, 3.035),
                (x, sign * 2.625, 2.915), (x, sign * 2.625, .34),
                (x, sign * 2.69, .18), (x, sign * 2.88, .14)]
        sweep('Drainpipe_' + str(x), rounded_path(path, .065), .042, 'black', 'ExteriorDetails', inner=.035)
        for z in (.60, 2.65):
            # Short annular clips plus wall stand-offs, rather than boxes through the bore.
            sweep(f'Drainclip_{x}_{z}', [(x, sign * 2.625, z - .012), (x, sign * 2.625, z + .012)],
                  .049, 'black', 'ExteriorDetails', inner=.0422)
            H['box'](f'Drainclip_WallPad_{x}_{z}', (x, sign * 2.539, z), (.073, .020, .076), 'black', 'ExteriorDetails', .003)
            H['cyl'](f'Drainclip_StandOff_{x}_{z}', (x, sign * 2.55, z), (x, sign * 2.58, z), .012, 'black', 'ExteriorDetails')
    gutter_hangers()


def gutter_hangers():
    for sign in (-1, 1):
        for x in (-5.10, -3.1, -1.05, 1.05, 3.1, 5.10):
            points = [(x, sign * 2.56, 3.30), (x, sign * 2.56, 3.235)]
            points.extend((x, sign * (2.715 + .088 * math.cos(a)), 3.235 + .088 * math.sin(a))
                          for a in [math.pi + j * math.pi / 12 for j in range(13)])
            sweep(f'Gutter_Hanger_{sign}_{x}', rounded_path(points, .008, 3), .004, 'black', 'ExteriorDetails', sides=8)


def flue_boot():
    archive(exact=('ServiceFlue_Collar', 'ServiceFlue_Flashing', 'Roof_Seam_1'))
    cx, cy = 4.35, .70
    def roof_z(y):
        return R - SLOPE * y
    n = 48
    verts, faces = [], []
    # Square-to-round annular flashing, sloped on both sides and actually pierced.
    for offset, outer in ((.098, True), (.098, False), (.080, True), (.080, False)):
        for i in range(n):
            a = i * math.tau / n
            rr = min(.25 / max(abs(math.cos(a)), 1e-6), .28 / max(abs(math.sin(a)), 1e-6)) if outer else .070
            x, y = cx + rr * math.cos(a), cy + rr * math.sin(a)
            verts.append((x, y, roof_z(y) + offset))
    for i in range(n):
        j = (i + 1) % n
        faces.extend(((i, j, n + j, n + i), (2 * n + i, 3 * n + i, 3 * n + j, 2 * n + j),
                      (i, 2 * n + i, 2 * n + j, j), (n + i, n + j, 3 * n + j, 3 * n + i)))
    H['mesh']('ServiceFlue_Flashing', verts, faces, 'roof', 'ExteriorDetails')
    verts, faces = [], []
    for rr, top in ((.135, False), (.074, True), (.129, False), (.068, True)):
        for i in range(n):
            a = i * math.tau / n
            x, y = cx + rr * math.cos(a), cy + rr * math.sin(a)
            verts.append((x, y, roof_z(cy) + .30 if top else roof_z(y) + .097))
    for i in range(n):
        j = (i + 1) % n
        faces.extend(((i, j, n + j, n + i), (2 * n + i, 3 * n + i, 3 * n + j, 2 * n + j),
                      (n + i, n + j, 3 * n + j, 3 * n + i), (i, 2 * n + i, 2 * n + j, j)))
    boot = H['mesh']('ServiceFlue_Collar', verts, faces, 'black', 'ExteriorDetails')
    for face in boot.data.polygons:
        face.use_smooth = True
    for i in range(27):
        x = -5.65 + i * 11.3 / 26
        intervals = [(0, .365), (1.035, 2.69)] if abs(x - cx) < .27 else [(0, 2.69)]
        for j, (a, b) in enumerate(intervals):
            y = (a + b) / 2
            H['box'](f'Roof_Seam_Rear_{i}_{j}', (x, y, roof_z(y) + .08),
                     (.018, (b - a) * math.sqrt(1 + SLOPE ** 2), .033), 'roof', 'ExteriorDetails',
                     .003, (-math.atan(SLOPE), 0, 0))
    H['consolidate']('Roof_Seam_Rear_', 'Roof_Seam_1')


def front_landing():
    archive(exact=('FrontLongLanding',))
    x, width, depth = -.54, 3.10, .80
    for i in range(6):
        H['box'](f'CentralLanding_Board_{i}', (x, -2.51 - (i + .5) * depth / 6, .383),
                 (width, depth / 6 - .005, .044), 'deck', 'ExteriorDetails', .003)
    for y in (-2.64, -3.19):
        H['box'](f'CentralLanding_Frame_{y}', (x, y, .318), (width - .10, .070, .085), 'base', 'ExteriorDetails', .003)
        for xx in (x - 1.28, x + 1.28):
            H['box'](f'CentralLanding_Leg_{xx}_{y}', (xx, y, .158), (.085, .085, .316), 'base', 'ExteriorDetails', .003)
    for xx in (x - 1.28, x, x + 1.28):
        H['box'](f'CentralLanding_Joist_{xx}', (xx, -2.91, .324), (.060, .66, .070), 'base', 'ExteriorDetails', .003)
    H['consolidate']('CentralLanding_', 'CentralLanding')


def wall(name, plane, holes):
    archive(exact=('Cladding_' + name, 'Lining_' + name), prefixes=('Baseboard_' + name + '_',))
    H['elevation'](name, 'x', plane, 11.2, holes)
    lining = H['box']('Lining_' + name, (0, plane - math.copysign(.135, plane), (F + E) / 2),
                      (11.2, .22, E - F), 'plaster', 'Architecture', 0)
    for a, b, z0, z1 in holes:
        H['cut'](lining, ((a + b) / 2, plane, (z0 + z1) / 2), (b - a, .9, z1 - z0 + .002))
    intervals = [(-5.36, 5.36)]
    for a, b, z0, z1 in holes:
        if z0 < F + .10:
            intervals = [(lo, hi) for p, q in intervals for lo, hi in ((p, min(q, a)), (max(p, b), q)) if hi > lo]
    for i, (a, b) in enumerate(intervals):
        H['box'](f'Baseboard_{name}_{i}', ((a + b) / 2, plane - math.copysign(.262, plane), F + .055),
                 (b - a, .022, .11), 'plaster', 'Architecture', .003)


def fitted_door(name, axis, plane, center, clear_width=.90, height=2.18):
    """Leaf, liner and rear stops occupy separate depth planes with 3 mm reveals."""
    def part(suffix, u, z, width, high, depth, offset=0):
        loc = (u, plane + offset, z) if axis == 'x' else (plane + offset, u, z)
        dims = (width, depth, high) if axis == 'x' else (depth, width, high)
        return H['box'](name + '_' + suffix, loc, dims, 'wood', bevel=.002)
    for sign in (-1, 1):
        part('WoodJamb_' + str(sign), center + sign * (clear_width / 2 + .035), F + height / 2, .07, height, .15)
        part('WoodStop_' + str(sign), center + sign * (clear_width / 2 - .005), F + height / 2, .028, height, .025, .0385)
    head = part('WoodHeader', center, F + height + .035, clear_width + .14, .07, .15)
    stop = part('WoodHeadStop', center, F + height - .006, clear_width, .028, .025, .0385)
    leaf = part('ClosedLeaf', center, F + .008 + (height - .011) / 2, clear_width - .006, height - .011, .042)
    # Trim covers the rough-opening tolerance, with separate front/back depths.
    for side in (-1, 1):
        for sign in (-1, 1):
            part(f'Casing_{side}_{sign}', center + sign * (clear_width / 2 + .055), F + height / 2,
                 .080, height, .027, side * .080)
        part(f'CasingHead_{side}', center, F + height + .040, clear_width + .19, .080, .027, side * .080)
        u = center + clear_width / 2 - .12
        def position(uu, dd, zz):
            return (uu, plane + dd, zz) if axis == 'x' else (plane + dd, uu, zz)
        H['cyl'](f'{name}_Rosette_{side}', position(u, side * .023, F + 1.055),
                 position(u, side * .035, F + 1.055), .027, 'black')
        sweep(f'{name}_Lever_{side}', rounded_path([position(u, side * .035, F + 1.055),
              position(u, side * .083, F + 1.055), position(u - .115, side * .083, F + 1.055)], .012), .010)
    for obj in (head, stop):
        for loop in obj.data.uv_layers.active.data:
            loop.uv = (loop.uv.y, loop.uv.x)
    return leaf


def partitions():
    archive(prefixes=('BedroomInteriorDoor_',), exact=('Bedroom_FullPartition', 'Toilet_FrontPartition', 'Toilet_LeftPartition'))
    archive(prefixes=('Toilet_Wood', 'Toilet_Closed', 'Toilet_Handle'))
    bedroom = H['box']('Bedroom_FullPartition', (2.35, 0, 1.825), (.13, 4.60, 2.81), 'plaster', 'Architecture', 0)
    H['cut'](bedroom, (2.35, DOOR_Y, F + 2.255 / 2), (.6, 1.05, 2.255))
    fitted_door('BedroomInteriorDoor', 'y', 2.35, DOOR_Y)
    front = H['box']('Toilet_FrontPartition', (1.405, WC_FRONT, 1.825), (1.89, .13, 2.81), 'plaster', 'Architecture', 0)
    H['cut'](front, (1.36, WC_FRONT, F + 2.255 / 2), (.98, .6, 2.255))
    H['box']('Toilet_LeftPartition', (.46, (WC_FRONT + 2.445) / 2, 1.825),
             (.13, 2.445 - WC_FRONT, 2.81), 'plaster', 'Architecture', 0)
    fitted_door('ToiletDoor', 'x', WC_FRONT, 1.36, .83)


def exterior_layout():
    bind()
    if bpy.context.scene.get('revision2_exterior_done'):
        raise RuntimeError('Exterior/layout stage already authored.')
    drainage()
    flue_boot()
    front_landing()
    move(('CentralDoubleDoors_', 'FrontLamp_-1.27_',), (-.54, 0, 0))
    lamp = bpy.data.objects.get('SconceLight_-1.27_-2.64')
    if lamp:
        lamp.location.x -= .54
    wall('Front', -2.5, [(-3.95, -3.05, 1.80, 2.94), (-1.54, .46, F, 2.94), (3.75, 4.75, F, 2.94)])
    wall('Rear', 2.5, [(-1.75, -.35, 1.72, 2.67), (1.0, 1.90, 1.83, 2.67), (2.51, 3.49, 1.30, 2.85)])
    H['opening']('BedroomWorkspaceWindow', 'x', 2.51, 3.0, 1.30, .98, 1.55, outside=1)
    partitions()
    move(('Dining_',), DINING_DELTA)
    bpy.data.objects['Interior_Dining'].location += DINING_DELTA
    bpy.context.scene['revision2_exterior_done'] = True
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'veyra-source.blend'), compress=True)
    return {'status': 'exterior, openings and enlarged empty toilet authored; no tests'}


def lathe(name, profile, loc, mat='white', sides=32):
    verts, rings, faces = [], [], []
    for rr, z in profile:
        if rr == 0:
            rings.append([len(verts)])
            verts.append((loc[0], loc[1], loc[2] + z))
        else:
            rings.append(list(range(len(verts), len(verts) + sides)))
            verts.extend((loc[0] + rr * math.cos(i * math.tau / sides), loc[1] + rr * math.sin(i * math.tau / sides), loc[2] + z) for i in range(sides))
    for a, b in zip(rings, rings[1:]):
        for i in range(sides):
            j = (i + 1) % sides
            faces.append((a[0], b[i], b[j]) if len(a) == 1 else ((a[i], b[0], a[j]) if len(b) == 1 else (a[i], b[i], b[j], a[j])))
    obj = H['mesh'](name, verts, faces, mat, 'ShallowInterior')
    for face in obj.data.polygons:
        face.use_smooth = len(face.vertices) == 4
    return obj


def cup(name, x, y, z):
    lathe(name + '_HollowCeramic', [(0, 0), (.032, 0), (.036, .007), (.042, .083), (.042, .091),
                                  (.040, .095), (.037, .095), (.035, .087), (.030, .014), (0, .014)], (x, y, z))
    H['cyl'](name + '_Coffee', (x, y, z + .065), (x, y, z + .067), .0333, 'soil', vertices=32)
    points = [(x + .039 + .033 * math.sin(t * math.pi / 16), y, z + .047 + .032 * math.cos(t * math.pi / 16)) for t in range(17)]
    sweep(name + '_Handle', points, .0065, 'white', sides=12)
    H['consolidate'](name + '_', name)


def sink():
    archive(prefixes=('Sink_', 'Tap_'), exact=('Kitchen_LimestoneWorktop', 'Kitchen_BaseCarcass'))
    carcass = H['box']('Kitchen_BaseCarcass', (-1.09, 1.99, F + .49), (2.96, .58, .76), bevel=0)
    H['cut'](carcass, (-1.22, 1.99, F + .825), (.79, .52, .45))
    soft_edges(carcass)
    top = H['box']('Kitchen_LimestoneWorktop', (-1.09, 1.98, F + .905), (3.02, .68, .055), 'stone', bevel=0)
    H['cut'](top, (-1.22, 1.99, F + .90), (.76, .48, .30))
    soft_edges(top, .003, 3)
    def rectangle(width, depth, radius, z):
        points = []
        for cx, cy, start in ((width / 2 - radius, depth / 2 - radius, 0),
                              (-width / 2 + radius, depth / 2 - radius, 90),
                              (-width / 2 + radius, -depth / 2 + radius, 180),
                              (width / 2 - radius, -depth / 2 + radius, 270)):
            for j in range(8):
                a = math.radians(start + j * 90 / 7)
                points.append((-1.22 + cx + radius * math.cos(a), 1.99 + cy + radius * math.sin(a), z))
        return points
    rings = [(.82, .54, .028, 1.350), (.82, .54, .028, 1.361),
             (.706, .432, .027, 1.361), (.690, .418, .032, 1.342),
             (.626, .356, .045, 1.151), (.604, .334, .05, 1.139)]
    verts = [point for w, d, r, z in rings for point in rectangle(w, d, r, z)]
    faces = [(i * 32 + j, i * 32 + (j + 1) % 32, (i + 1) * 32 + (j + 1) % 32, (i + 1) * 32 + j)
             for i in range(len(rings) - 1) for j in range(32)]
    faces.append(tuple(range((len(rings) - 1) * 32, len(rings) * 32)))
    bowl = H['mesh']('Sink_ContinuousBasinAndRim', verts, faces, 'steel', 'ShallowInterior')
    mod = bowl.modifiers.new('Stainless shell thickness', 'SOLIDIFY')
    mod.thickness, mod.offset = .005, -1
    H['cyl']('Sink_DrainFlange', (-1.22, 1.99, 1.140), (-1.22, 1.99, 1.145), .031, 'black', vertices=32)
    H['cyl']('Sink_DrainCenter', (-1.22, 1.99, 1.146), (-1.22, 1.99, 1.148), .014, 'steel', vertices=24)
    # The faucet clears the backsplash and uses smooth, non-flipping sweep frames.
    bpy.data.objects['Kitchen_BackSplash'].location.y = 2.315
    H['cyl']('Tap_Base', (-1.22, 2.272, 1.353), (-1.22, 2.272, 1.373), .026, 'steel', vertices=24)
    path = [(-1.22, 2.272, 1.37), (-1.22, 2.272, 1.64)]
    path.extend((-1.22, 2.172 + .10 * math.cos(j * math.pi / 16), 1.64 + .10 * math.sin(j * math.pi / 16)) for j in range(1, 17))
    path.append((-1.22, 2.072, 1.615))
    sweep('Tap_Gooseneck', path, .015, 'steel', inner=.010, sides=24)
    H['cyl']('Tap_LeverHub', (-1.204, 2.272, 1.43), (-1.17, 2.272, 1.43), .018, 'steel')
    sweep('Tap_Lever', rounded_path([(-1.17, 2.272, 1.43), (-1.145, 2.272, 1.43), (-1.145, 2.272, 1.54)], .01), .007, 'steel')


def bedroom_storage():
    archive(prefixes=('Wardrobe_', 'Bedroom_Print', 'Bedroom_Plant', 'Bedroom_BenchLeg_',
                      'Workspace_', 'Laptop_'), exact=('Bedroom_EntryBench',))
    # Clear the desk chair by shifting the bed ensemble slightly toward the front.
    move(('Bed_', 'Bedside_', 'Bedroom_Rug'), (0, -.23, 0))
    for i, y in enumerate((-.66, .16)):
        pillow = bpy.data.objects['Bed_SageCushion_' + str(i)]
        pillow.location = (4.53, y, 1.269)
        pillow.rotation_euler = (0, .14, 0)
    # Real open carcass: left drawers/shelves, right closed wardrobe, desk on left.
    left, right, bottom, top = 3.54, 5.29, F + .055, F + 2.25
    middle = 4.36
    for i, x in enumerate((left, middle, right)):
        H['box'](f'BedroomStorage_Upright_{i}', (x, 1.955, (bottom + top) / 2), (.028, .56, top - bottom))
    for label, z in (('Bottom', bottom), ('Top', top)):
        H['box']('BedroomStorage_' + label, ((left + right) / 2, 1.955, z), (right - left + .028, .56, .028))
    H['box']('BedroomStorage_Back', ((left + right) / 2, 2.229, (bottom + top) / 2), (right - left, .019, top - bottom))
    H['box']('BedroomStorage_Platform', ((left + right) / 2, 1.97, F + .031), (right - left - .09, .47, .06), 'black')
    for j in range(4):
        z = F + .18 + j * .20
        H['box'](f'BedroomStorage_Drawer_{j}', (3.95, 1.656, z), (.770, .032, .188))
        H['pull'](f'BedroomStorage_DrawerPull_{j}', 3.95, 1.637, z + .035, .14)
    for j, z in enumerate((1.30, 1.64, 1.98, 2.32)):
        H['box'](f'BedroomStorage_OpenShelf_{j}', (3.95, 1.963, z), (.794, .515, .028))
    for i, x in enumerate((4.59, 5.045)):
        H['box'](f'BedroomStorage_ClosetDoor_{i}', (x, 1.656, (bottom + top) / 2), (.438, .032, top - bottom - .018))
        H['cyl'](f'BedroomStorage_ClosetPull_{i}', (x + (.17 if i == 0 else -.17), 1.605, 1.35),
                 (x + (.17 if i == 0 else -.17), 1.605, 1.51), .01, 'black')
    H['books']('BedroomStorage_Books', 3.64, 1.93, 1.318, 4, upright=True)
    for i in range(3):
        H['box'](f'BedroomStorage_FoldedLinen_{i}', (3.89, 1.99, 2.358 + i * .055), (.46, .30, .052),
                 'linen' if i % 2 else 'sofa', bevel=.020, segments=3)
    for i in range(2):
        H['box'](f'BedroomStorage_FoldedClothes_{i}', (3.82, 1.98, 2.018 + i * .052), (.34, .30, .049),
                 'olive' if i else 'terra', bevel=.016, segments=3)
    lathe('BedroomStorage_Vase', [(0, 0), (.040, 0), (.058, .065), (.045, .12), (.029, .14), (.026, .13)], (4.16, 1.96, 1.662), 'ceramic')
    H['books']('BedroomStorage_StackedBooks', 3.79, 1.97, 1.661, 2)
    H['plant']('BedroomStorage_TopPlant', 3.79, 1.98, top + .016, .43)
    # Trailing stems and small leaves drape outside the left side of the cabinet.
    for i in range(3):
        x = 3.59 + i * .055
        points = [(3.77, 1.93, top + .16), (x, 1.77, top + .08), (x - .025, 1.67, top - .15), (x - .04, 1.66, top - .39 + .04 * i)]
        sweep(f'BedroomStorage_TrailingStem_{i}', rounded_path(points, .035), .0025, 'soil', sides=8)
        for j in range(5):
            z = top - .05 - j * .065
            leaf = H['sphere'](f'BedroomStorage_TrailingLeaf_{i}_{j}', (x + (-1 if j % 2 else 1) * .027, 1.65, z), (.036, .009, .025), 'leaf', 12, 6)
            leaf.rotation_euler.y = (-1 if j % 2 else 1) * .3
    desk()
    corner_shelves()


def desk():
    x, y, z = 2.99, 1.97, F + .755
    H['box']('BedroomDesk_Top', (x, y, z), (.92, .56, .045), bevel=.012, segments=3)
    for xx in (2.60, 3.38):
        for yy in (1.75, 2.18):
            H['box'](f'BedroomDesk_Leg_{xx}_{yy}', (xx, yy, F + .365), (.046, .046, .73), bevel=.005)
    H['box']('BedroomDesk_RearApron', (x, 2.15, F + .66), (.84, .035, .12))
    H['box']('BedroomDesk_MonitorBase', (x, 2.07, z + .043), (.23, .15, .023), 'appliance', bevel=.008)
    H['box']('BedroomDesk_MonitorStem', (x, 2.10, z + .145), (.044, .043, .20), 'appliance', bevel=.006)
    H['box']('BedroomDesk_MonitorFrame', (x, 2.092, z + .315), (.45, .031, .293), 'appliance', bevel=.010)
    material = H['material']('display', 'BedroomWorkspaceDisplay', (.20, .28, .32), .43)
    shader = material.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Emission Color'].default_value = (.20, .28, .32, 1)
    shader.inputs['Emission Strength'].default_value = .18
    H['box']('BedroomDesk_Display', (x, 2.073, z + .315), (.424, .004, .260), 'display', bevel=.003)
    # Low-poly fixed screen content, each layer has a distinct depth.
    H['box']('BedroomDesk_DisplayWindow', (x + .035, 2.069, z + .315), (.29, .002, .195), 'linen', bevel=.002)
    H['box']('BedroomDesk_DisplaySidebar', (x - .16, 2.069, z + .315), (.052, .002, .21), 'olive', bevel=.001)
    for i in range(4):
        H['box'](f'BedroomDesk_DisplayRow_{i}', (x + .027, 2.067, z + .373 - i * .035), (.22 - .025 * (i % 2), .001, .013),
                 'ceramic' if i == 1 else 'paper', bevel=0)
    H['box']('BedroomDesk_Keyboard', (x, 1.81, z + .033), (.32, .105, .017), 'appliance', bevel=.005)
    for row in range(4):
        for col in range(11):
            H['box'](f'BedroomDesk_Key_{row}_{col}', (x - .138 + col * .026, 1.774 + row * .023, z + .044), (.020, .016, .006), 'white', bevel=.001)
    H['sphere']('BedroomDesk_Mouse', (3.28, 1.80, z + .045), (.029, .043, .014), 'appliance')
    # Connected adjustable task lamp.
    H['cyl']('BedroomDesk_LampBase', (2.63, 2.05, z + .025), (2.63, 2.05, z + .042), .067, 'steel')
    sweep('BedroomDesk_LampArm', rounded_path([(2.63, 2.05, z + .04), (2.63, 2.05, z + .33), (2.73, 1.98, z + .43)], .02), .010, 'steel')
    H['cyl']('BedroomDesk_LampShade', (2.73, 1.98, z + .38), (2.73, 1.98, z + .46), .060, 'white', top=.028, vertices=24)
    H['cyl']('BedroomDesk_LampDiffuser', (2.73, 1.98, z + .375), (2.73, 1.98, z + .382), .050, 'glow')
    cup('BedroomDesk_Cup', 3.32, 2.03, z + .024)
    office_chair()
    H['consolidate']('BedroomDesk_Key_', 'BedroomDesk_Keys')
    H['consolidate']('BedroomDesk_DisplayRow_', 'BedroomDesk_DisplayRows')


def office_chair():
    x, y = 2.99, 1.12
    H['cyl']('BedroomOfficeChair_Column', (x, y, F + .13), (x, y, F + .44), .033, 'steel')
    H['cyl']('BedroomOfficeChair_ColumnBoot', (x, y, F + .12), (x, y, F + .28), .045, 'black')
    for i in range(5):
        a = i * math.tau / 5
        xx, yy = x + .29 * math.cos(a), y + .29 * math.sin(a)
        sweep(f'BedroomOfficeChair_Spoke_{i}', [(x, y, F + .16), (xx, yy, F + .105)], .018, 'black')
        H['cyl'](f'BedroomOfficeChair_CasterStem_{i}', (xx, yy, F + .075), (xx, yy, F + .12), .010, 'steel')
        for sign in (-1, 1):
            H['cyl'](f'BedroomOfficeChair_Wheel_{i}_{sign}', (xx + sign * .020, yy, F + .046),
                     (xx + sign * .036, yy, F + .046), .041, 'black', vertices=16)
    H['box']('BedroomOfficeChair_SeatShell', (x, y, F + .445), (.49, .45, .056), 'black', bevel=.035, segments=4)
    H['box']('BedroomOfficeChair_SeatCushion', (x, y, F + .486), (.46, .43, .068), 'sofa', bevel=.040, segments=4)
    sweep('BedroomOfficeChair_BackSupport', rounded_path([(x, y + .03, F + .43), (x, y - .245, F + .43),
          (x, y - .285, F + .88)], .035), .024, 'black')
    H['box']('BedroomOfficeChair_BackShell', (x, y - .265, F + .79), (.43, .06, .43), 'black', bevel=.045, rotation=(.11, 0, 0), segments=4)
    H['box']('BedroomOfficeChair_BackCushion', (x, y - .230, F + .79), (.405, .060, .39), 'sofa', bevel=.040, rotation=(.11, 0, 0), segments=4)
    for sign in (-1, 1):
        xx = x + sign * .262
        sweep(f'BedroomOfficeChair_ArmSupport_{sign}', rounded_path([(x + sign * .20, y, F + .43), (xx, y, F + .45), (xx, y, F + .66)], .025), .014, 'black')
        H['box'](f'BedroomOfficeChair_ArmPad_{sign}', (xx, y + .025, F + .68), (.055, .27, .035), 'black', bevel=.016, segments=3)


def corner_shelves():
    for i, z in enumerate((F + .48, F + .91, F + 1.34, F + 1.77)):
        H['box'](f'BedroomCorner_Shelf_{i}', (2.575, -1.87, z), (.30, .67, .034))
    # Books lie along Y, facing the room from the partition-side shelves.
    for i in range(5):
        H['box'](f'BedroomCorner_Book_{i}', (2.59, -2.10 + i * .048, F + 1.075), (.19, .040, .28),
                 ('paper', 'olive', 'terra')[i % 3], bevel=.002)
    H['plant']('BedroomCorner_Plant', 2.59, -1.87, F + 1.787, .29)
    H['box']('BedroomCorner_StorageBox', (2.57, -1.88, F + .61), (.24, .40, .21), 'linen', bevel=.020, segments=3)


def interiors():
    bind()
    if not bpy.context.scene.get('revision2_exterior_done') or bpy.context.scene.get('revision2_interiors_done'):
        raise RuntimeError('Complete exterior_layout() once, then run interiors() once.')
    # Preserve original furniture in the snapshot; only superseded assemblies are archived.
    move(('Sofa_',), SOFA_DELTA)
    move(('CoffeeTable_',), COFFEE_DELTA)
    rug = bpy.data.objects['Lounge_Rug']
    rug.location += Vector((-.42, -.32, 0))
    rug.dimensions.x = 2.46
    move(('MediaConsole_', 'TV_'), (-.22, .055, 0))
    bpy.data.objects['Living_FloorPlant'].location += Vector((1.99, .05, 0))
    bedroom_storage()
    archive(exact=('Dining_Mug', 'CoffeeTable_Mug'))
    for x in (-.52, .58):
        cup('Dining_Cup_' + str(x), x + DINING_DELTA.x, -.43 + DINING_DELTA.y, F + .795)
    cup('CoffeeTable_Cup', -3.42 + COFFEE_DELTA.x, -.33 + COFFEE_DELTA.y, F + .44)
    sink()
    # Assemble decorative subparts at reasonable draw-call granularity.
    for prefix in ('BedroomStorage_Trailing', 'BedroomStorage_Books', 'BedroomStorage_StackedBooks',
                   'BedroomStorage_TopPlant', 'BedroomCorner_Plant', 'BedroomCorner_Book_', 'BedroomOfficeChair_',
                   'Gutter_Hanger_', 'Drainclip_'):
        H['consolidate'](prefix, prefix.rstrip('_'))
    bpy.context.scene['revision2_interiors_done'] = True
    bpy.context.scene['revision'] = 'Revision 2: user layout, storage and intersection fixes; awaiting user review'
    bpy.context.scene['revision_number'] = 2
    bpy.context.scene['poster_current'] = False
    bpy.context.scene['architecture'] = 'Revised user-directed layout; larger empty toilet, bedroom office/window, shorter landing and shifted central doors.'
    camera = bpy.data.objects['Veyra_BedroomReview']
    camera.location = (3.03, -1.65, 1.88)
    target = Vector((4.01, 1.90, 1.65))
    camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera['target_blender'] = list(target)
    camera.data.lens = 23
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'veyra-source.blend'), compress=True)
    return {'status': 'revision 2 authored; stopped before tests', 'backup': bpy.context.scene['revision2_backup']}
