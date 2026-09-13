"""User-directed Aster revision 2. Run apply_revision() after preserving the file.

Reuses base authoring helpers, not Niva geometry. Deliberately does not run tests.
For reproduction: build-aster.py build(), then this module's apply_revision().
"""

import importlib.util
import math
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('aster_base', ROOT / 'scripts/build-aster.py')
b = importlib.util.module_from_spec(spec)
spec.loader.exec_module(b)
F = b.FLOOR


def setup():
    for group in (*b.MODEL_GROUPS, 'Lights', 'ReviewStaging'):
        b.COLLECTIONS[group] = bpy.data.collections['Aster_' + group]
    names = {
        'cladding': 'ExteriorCladding', 'joinery': 'InteriorJoinery', 'deck': 'FixedStepTimber',
        'floor': 'FixedInteriorFloor', 'lining': 'FixedInteriorLining', 'roof': 'StandingSeamRoof',
        'frame': 'BlackFramesAndFixtures', 'base': 'FoundationSteel', 'glass': 'Glazing',
        'privacy': 'BathroomPrivacyGlass', 'sofa': 'FixedFlaxUpholstery', 'linen': 'FixedIvoryLinen',
        'throw': 'FixedOatmealThrow', 'rug': 'FixedWovenRug', 'stone': 'WarmStoneWorktop',
        'dark': 'ApplianceCharcoal', 'screen': 'ApplianceGlass', 'metal': 'BrushedSteel',
        'ceramic': 'WarmCeramic', 'white': 'Porcelain', 'leaf': 'Foliage', 'stem': 'PlantStems',
        'soil': 'PotSoil', 'solar': 'SolarCells', 'grid': 'SolarCellConductors', 'diffuser': 'WarmDiffusers',
    }
    # Reopened sources may have purged unused materials from earlier revisions.
    b.M.update({key: bpy.data.materials[name] for key, name in names.items() if name in bpy.data.materials})


def remove_objects(objects):
    for obj in list(objects):
        bpy.data.objects.remove(obj, do_unlink=True)


def remove_prefixes(*prefixes):
    remove_objects(o for o in bpy.context.scene.objects if o.name.startswith(prefixes))


def wall(name, axis, plane, span, openings, gable=False):
    b.elevation('Cladding_' + name, axis, plane, span, openings, gable)
    p = plane - math.copysign(0.125, plane)
    if gable:
        outline = [(-b.HALF_Y, F - 0.04), (b.HALF_Y, F - 0.04),
                   (b.HALF_Y, b.EAVE), (0, b.RIDGE - 0.02), (-b.HALF_Y, b.EAVE)]
        verts = [(p + d, u, z) for d in (-0.1, 0.1) for u, z in outline]
        obj = b.mesh('Lining_' + name, verts,
                     [(4, 3, 2, 1, 0), (5, 6, 7, 8, 9)] +
                     [(i, (i + 1) % 5, (i + 1) % 5 + 5, i + 5) for i in range(5)], 'lining')
    else:
        obj = b.box('Lining_' + name, (0, p, (F + b.EAVE) / 2),
                    (span, 0.2, b.EAVE - F), 'lining', 'Architecture', 0)
    for left, right, bottom, top in openings:
        pos = ((left + right) / 2, plane, (bottom + top) / 2) if axis == 'x' else (plane, (left + right) / 2, (bottom + top) / 2)
        dims = (right - left, 0.8, top - bottom + 0.008) if axis == 'x' else (0.8, right - left, top - bottom + 0.008)
        b.cut(obj, pos, dims)


def door(name, axis, plane, u):
    width, height = 0.95, 2.47
    # Exterior viewer's left is -X on front, +Y on the left gable.
    left_sign = -1 if axis == 'x' else 1
    def part(label, du, z, w, h, depth=0.17, offset=0, material='frame', group='ExteriorDetails'):
        pos = (u + du, plane + offset, z) if axis == 'x' else (plane + offset, u + du, z)
        dims = (w, depth, h) if axis == 'x' else (depth, w, h)
        return b.box(name + '_' + label, pos, dims, material, group, 0.005)
    mid = F + height / 2
    for sign in (-1, 1):
        part('OuterJamb_' + str(sign), sign * (width / 2 - 0.035), mid, 0.07, height, 0.23)
        part('LeafStile_' + str(sign), sign * (width / 2 - 0.126), mid, 0.105, height - 0.14, 0.095, -0.014)
    part('OuterHead', 0, F + height - 0.035, width, 0.07, 0.23)
    part('Threshold', 0, F + 0.022, width, 0.044, 0.25)
    part('LeafHead', 0, F + height - 0.125, width - 0.14, 0.10, 0.095, -0.014)
    part('LeafBottomRail', 0, F + 0.135, width - 0.14, 0.18, 0.095, -0.014)
    part('ClearPane', 0, F + 1.26, width - 0.36, 2.08, 0.008, -0.014, 'glass', 'Glazing')
    du = left_sign * (width / 2 - 0.128)
    part('HandleBackplate', du, F + 1.02, 0.035, 0.20, 0.012, -0.069)
    part('HandleSpindle', du, F + 1.06, 0.025, 0.025, 0.068, -0.102)
    part('Lever', du - left_sign * 0.048, F + 1.06, 0.135, 0.023, 0.027, -0.137)
    part('KeyEscutcheon', du, F + 0.965, 0.019, 0.026, 0.018, -0.081)
    for z in (F + 0.35, F + 1.18, F + 2.13):
        part('Hinge_' + str(z), -left_sign * (width / 2 - 0.075), z, 0.025, 0.11, 0.13)
    part('Canopy', 0, F + height + 0.16, width + 0.52, 0.14, 0.5, -0.13)


def exterior_changes():
    remove_prefixes('Cladding_Rear', 'Cladding_LeftGable', 'Cladding_RightGable',
                    'Lining_Rear', 'Lining_LeftGable', 'Lining_RightGable',
                    'FrontEntrance_', 'LeftEntrance_', 'LeftSteps_', 'RearKitchenWindow_',
                    'RightBathroomWindow_', 'Chimney', 'FlueWeatherCollar', 'FlueBand_', 'FlueRainCap')
    wall('Rear', 'x', b.HALF_Y, b.WIDTH, [(-1.00, 0.20, 1.55, 2.60)])
    wall('LeftGable', 'y', -b.HALF_X, b.DEPTH, [(0.075, 1.025, F, 2.89)], True)
    wall('RightGable', 'y', b.HALF_X, b.DEPTH,
         [(0.70, 1.90, 1.55, 2.60), (-1.98, -0.78, 1.40, 2.45)], True)
    door('FrontEntrance', 'x', -b.HALF_Y - 0.025, 2.575)
    door('LeftEntrance', 'y', -b.HALF_X - 0.025, 0.55)
    b.steps('LeftSteps', 'y', 0.55, -b.HALF_X - 0.02)
    b.opening('RearKitchenWindow', 'x', b.HALF_Y + 0.015, -0.40, 1.55, 1.20, 1.05)
    b.opening('RightBathroomWindow', 'y', b.HALF_X + 0.015, 1.30, 1.55, 1.20, 1.05)
    b.opening('WorkspaceWindow', 'y', b.HALF_X + 0.015, -1.38, 1.40, 1.20, 1.05)
    for name in ('LeftSconce', 'LeftSconce_Diffuser', 'LeftSconce_ReviewLight'):
        obj = bpy.context.scene.objects.get(name)
        if obj:
            obj.location.y += 0.45
    # One vertical flue: no bends, former right-hand roof penetration removed.
    x, y = -3.55, 1.64
    roof_z = b.RIDGE - y * b.SLOPE
    b.box('ChimneyFlashing', (x, y, roof_z + 0.085), (0.45, 0.48, 0.045), 'roof', 'ExteriorDetails',
          0.006, (-math.atan(b.SLOPE), 0, 0))
    b.cylinder('FlueWeatherCollar', (x, y, roof_z + 0.1), (x, y, roof_z + 0.29), 0.145, 'frame', 'ExteriorDetails', 24, 0.09)
    b.cylinder('Chimney', (x, y, roof_z + 0.14), (x, y, 5.12), 0.085, 'dark', 'ExteriorDetails', 24)
    b.cylinder('FlueRainCap', (x, y, 5.12), (x, y, 5.17), 0.15, 'roof', 'ExteriorDetails', 24, 0.085)


def enclosure():
    remove_prefixes('BathroomLeftPartition', 'BathroomFrontPartition')
    # Same fixed material on ceiling, all wall linings and new roof-height partitions.
    lining = b.M['lining']
    shader = lining.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (0.72, 0.70, 0.65, 1)
    lining.diffuse_color = (0.72, 0.70, 0.65, 1)
    for obj in bpy.context.scene.objects:
        if obj.name.startswith(('FixedCeiling_', 'Lining_')):
            obj.data.materials.clear()
            obj.data.materials.append(lining)
    outline = [(-0.15, F), (2.19, F), (2.19, b.RIDGE - 2.19 * b.SLOPE - 0.15),
               (0, b.RIDGE - 0.15), (-0.15, b.RIDGE - 0.15 * b.SLOPE - 0.15)]
    verts = [(1.40 + d, y, z) for d in (-0.06, 0.06) for y, z in outline]
    b.mesh('BathroomLeftPartition', verts,
           [(4, 3, 2, 1, 0), (5, 6, 7, 8, 9)] +
           [(i, (i + 1) % 5, (i + 1) % 5 + 5, i + 5) for i in range(5)], 'lining')
    top = b.RIDGE - 0.15 * b.SLOPE - 0.15
    front = b.box('BathroomFrontPartition', (2.75, -0.15, (F + top) / 2), (2.82, 0.12, top - F), 'lining', 'Architecture', 0)
    b.cut(front, (2.15, -0.15, F + 1.02), (0.84, 0.4, 2.045))
    b.box('BathroomDoorLeaf', (2.15, -0.15, F + 1.0), (0.80, 0.046, 2.0), 'joinery')
    for sign in (-1, 1):
        b.box('BathroomWoodenJamb_' + str(sign), (2.15 + sign * 0.446, -0.15, F + 1.04), (0.065, 0.18, 2.08), 'joinery')
    b.box('BathroomWoodenHead', (2.15, -0.15, F + 2.075), (0.96, 0.18, 0.07), 'joinery')
    b.cylinder('BathroomHandleSpindle', (2.43, -0.185, F + 1.0), (2.43, -0.27, F + 1.0), 0.015, 'frame')
    b.cylinder('BathroomLever', (2.31, -0.27, F + 1.0), (2.45, -0.27, F + 1.0), 0.013, 'frame')
    # Opaque pleated curtain fully covers the bathroom pane. Room otherwise empty.
    verts, faces = [], []
    for i in range(65):
        y = 0.59 + i * 1.42 / 64
        x = 3.895 + 0.035 * math.cos(i * math.pi / 2)
        verts.extend([(x, y, 1.36), (x, y, 2.73)])
        if i:
            n = i * 2
            faces.append((n - 2, n, n + 1, n - 1))
    curtain = b.mesh('BathroomOpaqueCurtain', verts, faces, 'linen', 'Architecture')
    solid = curtain.modifiers.new('Opaque cloth thickness', 'SOLIDIFY')
    solid.thickness = 0.005
    b.cylinder('BathroomCurtainRail', (3.885, 0.52, 2.77), (3.885, 2.08, 2.77), 0.017, 'frame', 'Architecture')


def lamp(name, x, y, z):
    b.cylinder(name + '_Base', (x, y, z), (x, y, z + 0.025), 0.085, 'frame', vertices=24)
    b.cylinder(name + '_Stem', (x, y, z + 0.02), (x, y, z + 0.25), 0.013, 'frame')
    b.cylinder(name + '_Shade', (x, y, z + 0.24), (x, y, z + 0.43), 0.13, 'linen', vertices=32, radius_top=0.075)
    b.cylinder(name + '_Diffuser', (x, y, z + 0.237), (x, y, z + 0.243), 0.105, 'diffuser', vertices=24)
    b.area(name + '_Light', (x, y, z + 0.232), (x, y, z), 2.5, 0.13, (1, 0.83, 0.65))


def books(name, x, y, z, count=3):
    for i in range(count):
        b.box(name + '_Pages_' + str(i), (x, y, z + i * 0.032 + 0.016), (0.18, 0.25, 0.026), 'linen', bevel=0.001)
        b.box(name + '_Cover_' + str(i), (x, y, z + i * 0.032 + 0.031), (0.185, 0.258, 0.005), 'throw', bevel=0.001)


def mug(name, x, y, z):
    # Open top with inset coffee surface, connected U-shaped handle.
    b.cylinder(name + '_Body', (x, y, z), (x, y, z + 0.09), 0.038, 'white', vertices=24)
    b.cylinder(name + '_Coffee', (x, y, z + 0.089), (x, y, z + 0.091), 0.031, 'soil', vertices=24)
    points = [(x + 0.03, y, z + 0.075), (x + 0.065, y, z + 0.075),
              (x + 0.069, y, z + 0.025), (x + 0.03, y, z + 0.025)]
    for i, (a, c) in enumerate(zip(points, points[1:])):
        b.cylinder(name + '_Handle_' + str(i), a, c, 0.006, 'white', vertices=10)


def bedroom_stove_tv():
    x, y = -2.75, -1.06
    b.box('StudioBedFrame', (x, y, F + 0.19), (1.63, 2.02, 0.24), 'joinery', bevel=0.025)
    b.box('StudioMattress', (x, y, F + 0.41), (1.56, 1.98, 0.23), 'linen', bevel=0.11, segments=4)
    b.box('StudioDuvet', (x, y + 0.22, F + 0.56), (1.58, 1.54, 0.15), 'linen', bevel=0.10, segments=4)
    b.box('BedFootThrow', (x, y + 0.54, F + 0.64), (1.60, 0.52, 0.075), 'throw', bevel=0.028, segments=3)
    b.box('BedHeadboard', (x, -2.08, F + 0.54), (1.66, 0.06, 0.82), 'joinery', bevel=0.022)
    for sign in (-1, 1):
        b.box('BedPillow_' + str(sign), (x + sign * 0.40, y - 0.68, F + 0.58), (0.66, 0.43, 0.17), 'linen', bevel=0.085, segments=4)
        nx = x + sign * 1.055
        b.cylinder('BedsideTop_' + str(sign), (nx, -1.81, F + 0.48), (nx, -1.81, F + 0.52), 0.19, 'joinery', vertices=32)
        b.cylinder('BedsideStem_' + str(sign), (nx, -1.81, F + 0.035), (nx, -1.81, F + 0.49), 0.035, 'joinery')
        b.cylinder('BedsideFoot_' + str(sign), (nx, -1.81, F + 0.01), (nx, -1.81, F + 0.045), 0.14, 'joinery', vertices=24)
    lamp('BedsideLamp', -3.805, -1.81, F + 0.52)
    books('BedsideReading', -1.695, -1.81, F + 0.52, 2)
    b.plant('BedsideFlowers', -1.65, -1.72, F + 0.584, 0.16)
    # Low console opposite the bed, set off from the stove hearth.
    b.box('TVConsoleCarcass', (-2.33, 1.86, F + 0.32), (1.42, 0.48, 0.52), 'joinery')
    for i in range(3):
        xx = -2.80 + i * 0.47
        b.box('TVConsoleDrawer_' + str(i), (xx, 1.607, F + 0.32), (0.45, 0.034, 0.46), 'joinery')
        b.box('TVConsolePull_' + str(i), (xx, 1.58, F + 0.45), (0.15, 0.022, 0.016), 'frame')
    for xx in (-2.87, -1.79):
        for yy in (1.70, 2.02):
            b.cylinder('TVConsoleFoot_' + str((xx, yy)), (xx, yy, F), (xx, yy, F + 0.09), 0.018, 'frame')
    b.box('TVBody', (-2.33, 1.87, F + 1.04), (1.04, 0.06, 0.63), 'frame', bevel=0.012)
    b.box('TVScreen', (-2.33, 1.832, F + 1.04), (0.987, 0.008, 0.57), 'screen', bevel=0.008)
    for sign in (-1, 1):
        b.cylinder('TVFoot_' + str(sign), (-2.33 + sign * 0.35, 1.87, F + 0.75),
                   (-2.33 + sign * 0.42, 1.73, F + 0.595), 0.012, 'frame')
    x, y = -3.55, 1.64
    b.box('StoveHearth', (x, y, F + 0.02), (0.72, 0.80, 0.04), 'dark')
    b.box('CompactStove', (x, y, F + 0.48), (0.46, 0.44, 0.73), 'dark', bevel=0.026, segments=3)
    for dx in (-0.16, 0.16):
        for dy in (-0.15, 0.15):
            b.box('StoveFoot_' + str((dx, dy)), (x + dx, y + dy, F + 0.09), (0.04, 0.04, 0.14), 'dark')
    b.box('StoveDoor', (x, y - 0.23, F + 0.47), (0.37, 0.034, 0.54), 'frame', bevel=0.02)
    b.box('StoveDoorGlass', (x, y - 0.25, F + 0.48), (0.29, 0.012, 0.40), 'screen', bevel=0.02)
    b.cylinder('StoveDoorSpindle', (x + 0.15, y - 0.245, F + 0.53), (x + 0.15, y - 0.30, F + 0.53), 0.012, 'frame')
    b.cylinder('StoveDoorHandle', (x + 0.15, y - 0.30, F + 0.43), (x + 0.15, y - 0.30, F + 0.56), 0.012, 'frame')
    b.cylinder('StoveFlueInterior', (x, y, F + 0.84), (x, y, b.RIDGE - y * b.SLOPE + 0.17), 0.072, 'dark', vertices=24)


def cabinet(name, x, y, width, depth, height, z=F, rotation=0, drawers=False):
    # Front is -Y before rotation. Build locally so each drawer and handle connects.
    made = []
    def part(label, location, size, material='joinery', bevel=0.006):
        obj = b.box(name + '_' + label, location, size, material, bevel=bevel)
        made.append(obj)
        return obj
    part('Carcass', (0, 0, height / 2), (width, depth, height))
    count = 3 if drawers else 2
    for i in range(count):
        if drawers:
            px, pz, w, h = 0, (i + 0.5) * height / count, width - 0.02, height / count - 0.016
        else:
            px, pz, w, h = (i - 0.5) * width / 2, height / 2, width / 2 - 0.013, height - 0.02
        part('Front_' + str(i), (px, -depth / 2 - 0.018, pz), (w, 0.035, h))
        part('Pull_' + str(i), (px, -depth / 2 - 0.044, pz + h / 2 - 0.065), (min(0.16, w * 0.6), 0.024, 0.018), 'frame', 0.004)
    c, s = math.cos(rotation), math.sin(rotation)
    for obj in made:
        px, py, pz = obj.location
        obj.location = (x + c * px - s * py, y + s * px + c * py, z + pz)
        obj.rotation_euler.z = rotation


def sink(x, y, z):
    # An open vessel: continuous rim, sloped inner walls, visible steel bottom.
    rings = [(0.295, 0.23, z + 0.009), (0.255, 0.19, z + 0.009),
             (0.22, 0.155, z - 0.16)]
    verts = []
    for w, d, zz in rings:
        verts.extend([(x - w, y - d, zz), (x + w, y - d, zz), (x + w, y + d, zz), (x - w, y + d, zz)])
    faces = []
    for ring in range(2):
        for i in range(4):
            a, c = ring * 4 + i, ring * 4 + (i + 1) % 4
            faces.append((a, c, c + 4, a + 4))
    faces.append((8, 9, 10, 11))
    basin = b.mesh('KitchenSinkBasin', verts, faces, 'metal', 'ShallowInterior', 0.008)
    solid = basin.modifiers.new('Steel bowl thickness', 'SOLIDIFY')
    solid.thickness = 0.004
    b.cylinder('SinkDrainRim', (x, y, z - 0.159), (x, y, z - 0.151), 0.033, 'frame', vertices=24)
    b.cylinder('SinkDrainInsert', (x, y, z - 0.150), (x, y, z - 0.148), 0.024, 'metal', vertices=24)
    # One continuous curved faucet tube, converted to mesh for GLB.
    points = [(x, y + 0.27, z)]
    for i in range(13):
        a = i * math.pi / 12
        points.append((x, y + 0.15 + 0.12 * math.cos(a), z + 0.28 + 0.12 * math.sin(a)))
    points.append((x, y + 0.03, z + 0.20))
    curve = bpy.data.curves.new('KitchenFaucet', 'CURVE')
    curve.dimensions, curve.bevel_depth, curve.bevel_resolution = '3D', 0.016, 3
    spline = curve.splines.new('POLY')
    spline.points.add(len(points) - 1)
    for p, co in zip(spline.points, points):
        p.co = (*co, 1)
    obj = bpy.data.objects.new('KitchenFaucet', curve)
    b.COLLECTIONS['ShallowInterior'].objects.link(obj)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target='MESH')
    b.finish(bpy.context.object, 'KitchenFaucet', 'metal', 'ShallowInterior')
    b.cylinder('FaucetLever', (x + 0.07, y + 0.27, z + 0.05), (x + 0.07, y + 0.27, z + 0.17), 0.012, 'metal')


def kitchen():
    # Short rear run plus return against the toilet partition, open to the studio.
    cabinet('KitchenSinkCabinet', -0.60, 1.82, 0.90, 0.60, 0.81, F + 0.10)
    cabinet('KitchenCornerCabinet', 0.52, 1.82, 1.32, 0.60, 0.81, F + 0.10)
    b.box('KitchenToeKick', (0.04, 1.87, F + 0.05), (2.24, 0.47, 0.10), 'dark')
    worktop = b.box('KitchenRearWorktop', (0.04, 1.81, F + 0.93), (2.30, 0.68, 0.04), 'stone', bevel=0)
    b.cut(worktop, (-0.60, 1.78, F + 0.93), (0.53, 0.40, 0.30))
    # Recess carcass as well: no wooden top can appear through the basin.
    b.cut(bpy.context.scene.objects['KitchenSinkCabinet_Carcass'], (-0.60, 1.78, F + 0.90), (0.57, 0.44, 0.40))
    sink(-0.60, 1.78, F + 0.95)
    # Oven in rear run beside the sink, with proper front fascia and controls.
    b.box('OvenFascia', (0.33, 1.471, F + 0.50), (0.55, 0.035, 0.64), 'metal')
    b.box('OvenGlass', (0.33, 1.447, F + 0.43), (0.47, 0.012, 0.42), 'screen')
    b.cylinder('OvenHandle', (0.12, 1.401, F + 0.67), (0.54, 1.401, F + 0.67), 0.012, 'metal')
    for xx in (0.13, 0.53):
        b.cylinder('OvenHandleMount_' + str(xx), (xx, 1.475, F + 0.67), (xx, 1.40, F + 0.67), 0.01, 'metal')
        b.cylinder('OvenDial_' + str(xx), (xx, 1.45, F + 0.77), (xx, 1.428, F + 0.77), 0.025, 'frame')
    b.box('InductionCooktop', (0.33, 1.80, F + 0.958), (0.57, 0.48, 0.012), 'screen')
    for dx in (-0.14, 0.14):
        for dy in (-0.12, 0.12):
            b.cylinder('HobZone_' + str((dx, dy)), (0.33 + dx, 1.80 + dy, F + 0.965),
                       (0.33 + dx, 1.80 + dy, F + 0.968), 0.085, 'dark', vertices=24)
    cabinet('KitchenReturnDrawers', 1.01, 1.10, 0.78, 0.60, 0.81, F + 0.10, -math.pi / 2, True)
    b.box('KitchenReturnWorktop', (0.995, 1.10, F + 0.93), (0.68, 0.79, 0.04), 'stone')
    # Upper cupboards exclusively on the dividing wall; no shelf across the window.
    cabinet('KitchenUpperCabinets', 1.15, 1.37, 1.40, 0.35, 0.74, 2.17, -math.pi / 2)
    b.box('UnderCabinetDiffuser', (1.11, 1.37, 2.156), (0.20, 1.30, 0.013), 'diffuser')
    b.area('KitchenUnderCabinetLight', (1.06, 1.38, 2.13), (0.89, 1.38, 1.3), 7, 0.22, (1, 0.9, 0.75), 1.1)
    # Tall refrigerator/freezer at the end of the return, doors face the room (-X).
    b.box('FridgeBody', (1.0, 0.30, F + 1.02), (0.66, 0.69, 2.04), 'dark', bevel=0.025)
    for label, z, h in (('Freezer', F + 0.36, 0.66), ('Refrigerator', F + 1.37, 1.31)):
        b.box(label + 'Door', (0.65, 0.30, z), (0.065, 0.665, h), 'metal', bevel=0.018)
        b.box(label + 'RecessedPull', (0.613, 0.30, z + h / 2 - 0.045), (0.016, 0.55, 0.025), 'frame')
    b.plant('KitchenHerbs', 0.99, 1.16, F + 0.96, 0.22)
    b.cylinder('UtensilPot', (0.89, 1.94, F + 0.95), (0.89, 1.94, F + 1.11), 0.055, 'ceramic')
    for i in range(4):
        b.cylinder('WoodenUtensil_' + str(i), (0.86 + i * 0.02, 1.94, F + 1.03),
                   (0.84 + i * 0.033, 1.93, F + 1.28), 0.009, 'joinery', vertices=10)


def chair(name, x, y, angle=0, padded=False):
    before = set(bpy.context.scene.objects)
    b.box(name + '_Seat', (0, 0, F + 0.46), (0.43, 0.43, 0.055), 'joinery', bevel=0.055, segments=3)
    if padded:
        b.box(name + '_SeatPad', (0, -0.015, F + 0.50), (0.39, 0.39, 0.055), 'sofa', bevel=0.06, segments=3)
    b.box(name + '_Back', (0, 0.19, F + 0.75), (0.43, 0.055, 0.32), 'joinery', bevel=0.045, segments=3)
    for sign in (-1, 1):
        # Continuous rear legs physically connect the seat to the backrest.
        b.cylinder(name + '_RearLeg_' + str(sign), (sign * 0.19, 0.20, F), (sign * 0.16, 0.19, F + 0.84), 0.016, 'frame')
        b.cylinder(name + '_FrontLeg_' + str(sign), (sign * 0.20, -0.22, F), (sign * 0.16, -0.15, F + 0.46), 0.016, 'frame')
        b.cylinder(name + '_SideRail_' + str(sign), (sign * 0.16, -0.16, F + 0.425), (sign * 0.16, 0.19, F + 0.425), 0.014, 'frame')
    b.cylinder(name + '_CrossRail', (-0.16, 0, F + 0.425), (0.16, 0, F + 0.425), 0.014, 'frame')
    for obj in set(bpy.context.scene.objects) - before:
        px, py, pz = obj.location
        obj.location = (x + px * math.cos(angle) - py * math.sin(angle), y + px * math.sin(angle) + py * math.cos(angle), pz)
        # Preserve primitive cylinder alignment while rotating the whole assembly.
        from mathutils import Matrix
        obj.rotation_euler = (Matrix.Rotation(angle, 3, 'Z') @ obj.rotation_euler.to_matrix()).to_euler()


def dining_workspace():
    x, y = -0.20, -0.60
    b.cylinder('DiningTop', (x, y, F + 0.73), (x, y, F + 0.775), 0.46, 'joinery', vertices=48)
    for a in (0, 2.0944, 4.1888):
        dx, dy = math.cos(a), math.sin(a)
        b.cylinder('DiningLeg_' + str(a), (x + dx * 0.35, y + dy * 0.35, F),
                   (x + dx * 0.26, y + dy * 0.26, F + 0.745), 0.026, 'joinery')
    chair('DiningChairFront', x, y - 0.72, math.pi)
    chair('DiningChairLeft', x - 0.73, y + 0.03, math.pi / 2)
    mug('DiningMug', x + 0.13, y, F + 0.777)
    books('DiningBook', x - 0.14, y + 0.04, F + 0.777, 1)
    # Window-facing desk in the front-right corner.
    b.box('WorkspaceTop', (3.70, -1.43, F + 0.75), (0.58, 1.10, 0.045), 'joinery')
    for yy in (-1.87, -0.99):
        for xx in (3.48, 3.90):
            b.cylinder('WorkspaceLeg_' + str((xx, yy)), (xx, yy, F), (xx, yy, F + 0.75), 0.018, 'frame')
        b.cylinder('WorkspaceRail_' + str(yy), (3.48, yy, F + 0.69), (3.90, yy, F + 0.69), 0.015, 'frame')
    b.box('LaptopBase', (3.66, -1.46, F + 0.79), (0.26, 0.35, 0.018), 'metal', bevel=0.009)
    b.box('LaptopDisplayBody', (3.785, -1.46, F + 0.92), (0.018, 0.35, 0.255), 'frame', bevel=0.008, rotation=(0, -0.12, 0))
    b.box('LaptopDisplay', (3.773, -1.46, F + 0.92), (0.005, 0.316, 0.218), 'screen', bevel=0.004, rotation=(0, -0.12, 0))
    for row in range(5):
        for col in range(10):
            b.box('LaptopKey_' + str((row, col)), (3.625 + row * 0.022, -1.593 + col * 0.029, F + 0.802), (0.016, 0.023, 0.003), 'dark', bevel=0.001)
    b.box('LaptopTrackpad', (3.575, -1.46, F + 0.802), (0.045, 0.11, 0.002), 'dark', bevel=0.003)
    lamp('WorkspaceLamp', 3.75, -1.83, F + 0.774)
    books('WorkspaceBooks', 3.69, -1.03, F + 0.774, 3)
    chair('WorkspaceChair', 3.04, -1.43, math.pi / 2, True)
    cabinet('WorkspaceStorage', 3.61, -0.48, 0.91, 0.40, 1.55, F, 0, True)
    b.plant('WorkspacePlant', 3.68, -0.48, F + 1.55, 0.30)


def lighting():
    # Neutral local fill keeps the shared wall/ceiling finish coherent; no emission on plaster.
    for name in ('KitchenCeilingFill', 'LoungeCeilingFill', 'BedCeilingFill', 'PendantReviewLight'):
        obj = bpy.context.scene.objects.get(name)
        if obj:
            bpy.data.objects.remove(obj, do_unlink=True)
    b.area('KitchenCeilingFill', (-0.10, 0.88, 3.05), (-0.10, 1.5, 1.0), 65, 1.75, (1, 0.95, 0.85), 0.7)
    b.area('StudioCeilingBounce', (-0.7, 0.0, 2.95), (-0.7, 0, 4.55), 75, 3.2, (1, 0.97, 0.92), 1.8)
    b.area('BedCeilingFill', (-2.75, -0.65, 3.02), (-2.75, -1.1, 0.8), 35, 1.4, (1, 0.95, 0.86))
    b.area('WorkspaceFill', (3.1, -1.35, 2.95), (3.6, -1.4, 1.0), 25, 0.7, (1, 0.96, 0.9))


def apply_revision():
    scene = bpy.context.scene
    if scene.name != 'Aster_Source' or bpy.context.mode != 'OBJECT':
        raise RuntimeError('Use Aster_Source in Object mode, after saving a preservation copy.')
    if scene.get('layout_revision') == 2:
        raise RuntimeError('Revision 2 is already authored. Preserve before another deliberate revision.')
    setup()
    # User requested the interior rearrangement; retain unrelated scenes and exterior assemblies.
    remove_objects(b.COLLECTIONS['ShallowInterior'].objects)
    exterior_changes()
    enclosure()
    bedroom_stove_tv()
    kitchen()
    dining_workspace()
    lighting()
    scene['layout_revision'] = 2
    scene['asset_status'] = 'User-directed layout revision 2; awaiting manual inspection. No tests run.'
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'aster-source.blend'))
    return {'source': str(ROOT / 'aster-source.blend'), 'revision': 2, 'status': 'Awaiting user inspection; no tests run.'}


if __name__ == '__main__':
    apply_revision()
