"""Revision 3: requested drainage, bedroom, storage, kitchen and stove changes.

Authoring only. Preserve the live source with prepare(), then call
exterior_bedroom() and living_kitchen() once each. No tests or renders run here.
"""

import math
import runpy
import shutil
from datetime import datetime
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
V2 = runpy.run_path(str(ROOT / 'scripts/revise-layout.py'))
H = V2['H']
F = .42
WC_LEFT = .06
STOVE_X, STOVE_Y = -4.93, 1.73


def bind():
    V2['bind']()


def archive(prefixes=(), exact=()):
    col = bpy.data.collections['Veyra_Archive_PreRevision3']
    for obj in list(V2['live']()):
        if obj.name in exact or any(obj.name.startswith(p) for p in prefixes):
            original = obj.name
            for old in list(obj.users_collection):
                old.objects.unlink(obj)
            col.objects.link(obj)
            obj.name = 'R2__' + original
            obj['superseded_name'] = original


def prepare():
    scene = bpy.context.scene
    if scene.name != 'Veyra_Source' or Path(bpy.data.filepath).parent != ROOT:
        raise RuntimeError('Open Veyra_Source before revision 3.')
    if scene.get('revision3_started'):
        raise RuntimeError('Revision 3 has already started; continue its remaining stage.')
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    folder = ROOT / 'history' / ('before-revision-3-' + datetime.now().strftime('%Y%m%d-%H%M%S'))
    folder.mkdir(parents=True, exist_ok=False)
    for filename in ('veyra-source.blend', 'veyra-configurator.glb', 'veyra-camera.json', 'veyra-presets.json',
                     'veyra-delivery.json', 'veyra-lighting.json', 'README.md', 'web-handoff.md', 'revision-2.md'):
        if (ROOT / filename).exists():
            shutil.copyfile(ROOT / filename, folder / filename)
    bpy.ops.wm.save_as_mainfile(filepath=str(folder / 'veyra-live-before-revision.blend'), copy=True, compress=True)
    col = bpy.data.collections.new('Veyra_Archive_PreRevision3')
    scene.collection.children.link(col)
    col.hide_viewport = col.hide_render = True
    scene['revision3_started'] = True
    scene['revision3_backup'] = folder.relative_to(ROOT).as_posix()
    bind()
    return {'backup': str(folder), 'preserved': 'saved source and unsaved live state'}


def extrude(name, outline, z0, z1, material='wood', group='ShallowInterior'):
    n = len(outline)
    verts = [(x, y, z) for z in (z0, z1) for x, y in outline]
    faces = [tuple(reversed(range(n))), tuple(range(n, 2 * n))]
    faces.extend((i, (i + 1) % n, (i + 1) % n + n, i + n) for i in range(n))
    return H['mesh'](name, verts, faces, material, group)


def place(objects, x, y, angle=0, z=0):
    transform = Matrix.Translation((x, y, z)) @ Matrix.Rotation(angle, 4, 'Z')
    for obj in objects:
        obj.matrix_world = transform @ obj.matrix_world


def gutter_revision():
    archive(prefixes=('Gutter_', 'Drainpipe_', 'EaveDrip_'))
    center, height = 2.82, 3.235
    for sign in (-1, 1):
        section = []
        for rr, indices in ((.080, range(21)), (.074, reversed(range(21)))):
            for j in indices:
                a = math.pi + j * math.pi / 20
                section.append((sign * center + rr * math.cos(a), height + rr * math.sin(a)))
        n = len(section)
        verts = [(x, y, z) for x in (-5.835, 5.835) for y, z in section]
        faces = [tuple(reversed(range(n))), tuple(range(n, 2 * n))]
        faces.extend((j, (j + 1) % n, (j + 1) % n + n, j + n) for j in range(n))
        gutter = H['mesh']('Gutter_' + str(sign), verts, faces, 'black', 'ExteriorDetails')
        for face in gutter.data.polygons:
            face.use_smooth = len(face.vertices) == 4
        x = -4.98 if sign < 0 else 5.18
        V2['cylinder_cut'](gutter, (x, sign * center, 3.16), .038, .16)
        # Curved low-profile flange follows the trough; its sleeve is below it.
        rings = [(.052, 'top'), (.037, 'top'), (.035, 'throat'), (.043, 'throat'),
                 (.044, 'under'), (.052, 'under')]
        vv, ff, sides = [], [], 40
        for rr, kind in rings:
            for i in range(sides):
                a = i * math.tau / sides
                xx, yy = x + rr * math.cos(a), sign * center + rr * math.sin(a)
                floor = height - math.sqrt(.074 ** 2 - (yy - sign * center) ** 2)
                zz = 3.10 if kind == 'throat' else floor + (.0015 if kind == 'top' else -.0035)
                vv.append((xx, yy, zz))
        for k in range(len(rings)):
            nxt = (k + 1) % len(rings)
            for i in range(sides):
                j = (i + 1) % sides
                ff.append((k * sides + i, k * sides + j, nxt * sides + j, nxt * sides + i))
        flange = H['mesh'](f'Gutter_Outlet_{sign}', vv, ff, 'black', 'ExteriorDetails')
        for face in flange.data.polygons:
            face.use_smooth = True
        path = [(x, sign * center, 3.125), (x, sign * center, 3.00), (x, sign * 2.625, 2.82),
                (x, sign * 2.625, .34), (x, sign * 2.69, .18), (x, sign * 2.88, .14)]
        V2['sweep']('Drainpipe_' + str(x), V2['rounded_path'](path, .06), .042, 'black', 'ExteriorDetails', inner=.035)
        # Folded apron conveys roof runoff into the slightly outboard full-length gutter.
        vv = [(xx, sign * yy, zz) for xx in (-5.69, 5.69)
              for yy, zz in ((2.63, 3.29), (2.72, 3.255), (2.775, 3.238))]
        apron = H['mesh']('EaveDrip_Apron_' + str(sign), vv, [(0, 3, 4, 1), (1, 4, 5, 2)], 'roof', 'ExteriorDetails')
        mod = apron.modifiers.new('Folded flashing thickness', 'SOLIDIFY')
        mod.thickness = .002
        for xx in (-5.20, -3.1, -1.05, 1.05, 3.1, 5.20):
            pts = [(xx, sign * 2.56, 3.30), (xx, sign * 2.56, 3.225)]
            pts.extend((xx, sign * (center + .088 * math.cos(a)), height + .088 * math.sin(a))
                       for a in [math.pi + j * math.pi / 14 for j in range(15)])
            V2['sweep'](f'Gutter_Hanger_{sign}_{xx}', V2['rounded_path'](pts, .006, 3), .004, 'black', 'ExteriorDetails', sides=8)
    for prefix in ('CentralDoubleDoors', 'BedroomExteriorDoor', 'LeftGableDoubleDoors'):
        canopy = bpy.data.objects[prefix + '_Canopy']
        canopy.location.z = 3.045
        canopy.dimensions.z = .12
        bpy.data.objects[prefix + '_CanopyUnderside'].location.z = 2.975
    H['consolidate']('Gutter_Hanger_', 'Gutter_Hangers')


def shelf_cabinet(name, width, depth, height, drawers=4):
    """Local cabinet facing -Y, with actual open shelf bays and separate fronts."""
    start = V2['live']()
    bottom, top = F + .06, F + height
    for sign in (-1, 1):
        H['box'](f'{name}_Side_{sign}', (sign * (width - .026) / 2, 0, (bottom + top) / 2), (.026, depth, top - bottom))
    H['box'](name + '_Back', (0, depth / 2 - .011, (bottom + top) / 2), (width - .045, .021, top - bottom))
    for suffix, z in (('Base', bottom), ('Top', top)):
        H['box'](name + '_' + suffix, (0, 0, z), (width, depth, .028))
    H['box'](name + '_Plinth', (0, .018, F + .028), (width - .08, depth - .08, .056), 'black')
    drawer_top = F + .90
    for i in range(drawers):
        z = F + .17 + i * .205
        H['box'](f'{name}_Drawer_{i}', (0, -depth / 2 - .016, z), (width - .064, .030, .193))
        H['pull'](f'{name}_Pull_{i}', 0, -depth / 2 - .035, z + .028, .13)
    shelves = [drawer_top + i * (top - drawer_top) / 4 for i in range(4)]
    for i, z in enumerate(shelves):
        H['box'](f'{name}_Shelf_{i}', (0, .002, z), (width - .047, depth - .035, .028))
    H['books'](name + '_Books', -width * .32, -.015, shelves[0] + .018, 4, upright=True)
    H['books'](name + '_Stack', -width * .15, -.02, shelves[1] + .018, 2)
    V2['lathe'](name + '_Vase', [(0, 0), (.028, 0), (.046, .05), (.031, .10), (.025, .12)],
                (width * .29, -.01, shelves[1] + .018), 'ceramic')
    for i in range(2):
        H['box'](f'{name}_FoldedCloth_{i}', (0, .025, shelves[2] + .045 + i * .05),
                 (width * .62, depth * .73, .046), 'olive' if i else 'terra', bevel=.016, segments=3)
    for i in range(3):
        H['box'](f'{name}_Towel_{i}', (0, .025, shelves[3] + .043 + i * .05),
                 (width * .62, depth * .73, .045), 'linen', bevel=.016, segments=3)
    return V2['live']() - start


def bedroom_revision():
    archive(prefixes=('Bed_SageCushion_', 'BedroomCorner_'))
    rug = bpy.data.objects['Bedroom_Rug']
    # Covers both bedside carcasses: Y=-1.71 through +1.21, plus a margin.
    rug.location = (4.08, -.245, F + .014)
    rug.dimensions = (2.55, 3.15, .028)
    objs = shelf_cabinet('BedroomCornerCabinet', .74, .37, 2.18)
    place(objs, 2.63, -1.87, math.pi / 2)
    guitar()


def guitar():
    start = V2['live']()
    top_mat = H['M']['wood'].copy()
    top_mat.name = 'FixedGuitarSpruce'
    H['M']['guitar_top'] = top_mat
    H['material']('guitar_side', 'FixedGuitarWalnut', (.085, .039, .018), .46)
    H['material']('guitar_board', 'FixedGuitarFingerboard', (.017, .012, .008), .54)
    # Catmull-Rom authored acoustic outline with two bouts and a narrow waist.
    half = [(0, 0), (.095, .008), (.156, .050), (.177, .116), (.153, .186),
            (.106, .245), (.098, .287), (.130, .340), (.116, .388), (.060, .421), (0, .430)]
    anchors = half + [(-x, z) for x, z in reversed(half[1:-1])]
    outline = []
    for i in range(len(anchors)):
        p0, p1, p2, p3 = [Vector(anchors[j % len(anchors)]) for j in (i - 1, i, i + 1, i + 2)]
        for j in range(4):
            t = j / 4
            p = .5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t*t + (-p0 + 3*p1 - 3*p2 + p3) * t*t*t)
            outline.append(tuple(p))
    n = len(outline)
    vv = [(x, y, z) for y in (-.045, .045) for x, z in outline]
    sides = [(i, (i + 1) % n, (i + 1) % n + n, i + n) for i in range(n)]
    body = H['mesh']('BedroomGuitar_BodyRim', vv, sides + [tuple(reversed(range(n)))], 'guitar_side', 'ShallowInterior')
    for p in body.data.polygons:
        p.use_smooth = len(p.vertices) == 4
    vv = [(x, y, z) for y in (.043, .050) for x, z in outline]
    plate = H['mesh']('BedroomGuitar_Soundboard', vv,
                      [tuple(reversed(range(n))), tuple(range(n, 2*n))] + sides, 'guitar_top', 'ShallowInterior')
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=.040, depth=.04, location=(0, .050, .293), rotation=(math.pi/2, 0, 0))
    cutter = bpy.context.object
    bpy.context.view_layer.objects.active = plate
    mod = plate.modifiers.new('Acoustic sound hole', 'BOOLEAN')
    mod.operation, mod.solver, mod.object = 'DIFFERENCE', 'EXACT', cutter
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)
    H['uv'](plate)
    # Thin rosette lies in front of the soundboard, with an open center.
    vv = [(rr*math.cos(i*math.tau/40), .052, .293 + rr*math.sin(i*math.tau/40)) for rr in (.043, .048) for i in range(40)]
    H['mesh']('BedroomGuitar_Rosette', vv, [(i, (i+1)%40, 40+(i+1)%40, 40+i) for i in range(40)], 'guitar_side', 'ShallowInterior')
    H['box']('BedroomGuitar_Neck', (0, .020, .641), (.052, .041, .49), 'guitar_side', bevel=.010, segments=3)
    H['box']('BedroomGuitar_Fingerboard', (0, .048, .641), (.050, .014, .49), 'guitar_board', bevel=.002)
    H['box']('BedroomGuitar_Headstock', (0, .019, .949), (.071, .026, .137), 'guitar_side', bevel=.011, segments=3)
    H['box']('BedroomGuitar_Bridge', (0, .058, .125), (.116, .017, .028), 'guitar_board', bevel=.004)
    H['box']('BedroomGuitar_Saddle', (0, .069, .132), (.078, .004, .005), 'white', bevel=.001)
    H['box']('BedroomGuitar_Nut', (0, .059, .884), (.053, .005, .006), 'white', bevel=.001)
    for i in range(16):
        z = .87 - .030 * i + .00040 * i*i
        H['cyl'](f'BedroomGuitar_Fret_{i}', (-.024, .057, z), (.024, .057, z), .0008, 'steel', vertices=8)
    for i in range(6):
        xx = -.018 + i * .0072
        H['cyl'](f'BedroomGuitar_String_{i}', (xx, .073, .132), (xx, .064, .884), .00035 + i*.00005, 'steel', vertices=6)
        H['sphere'](f'BedroomGuitar_BridgePin_{i}', (xx, .069, .118), (.003, .003, .003), 'white', 8, 4)
    for sign in (-1, 1):
        for i in range(3):
            z = .911 + .036*i
            H['cyl'](f'BedroomGuitar_TunerShaft_{sign}_{i}', (sign*.025, .02, z), (sign*.052, .02, z), .003, 'steel', vertices=10)
            H['sphere'](f'BedroomGuitar_TunerButton_{sign}_{i}', (sign*.055, .02, z), (.007, .010, .007), 'steel', 10, 6)
    # Lean gently toward the front wall; the stand remains upright on the floor.
    transform = Matrix.Translation((5.07, -1.99, F + .13)) @ Matrix.Rotation(math.radians(7), 4, 'X')
    for obj in V2['live']() - start:
        obj.matrix_world = transform @ obj.matrix_world
    for sign in (-1, 1):
        V2['sweep'](f'GuitarStand_Foot_{sign}', [(5.07, -2.12, F+.055), (5.07 + sign*.15, -1.86, F+.03)], .012, 'black')
        V2['sweep'](f'GuitarStand_Cradle_{sign}', V2['rounded_path']([(5.07 + sign*.10, -2.09, F+.17),
                      (5.07 + sign*.10, -1.96, F+.17), (5.07 + sign*.10, -1.94, F+.21)], .015), .010, 'black')
    V2['sweep']('GuitarStand_Backbone', [(5.07, -2.12, F+.045), (5.07, -2.14, 1.17)], .012, 'black')
    V2['sweep']('GuitarStand_NeckYoke', V2['rounded_path']([(5.03,-2.075,1.17), (5.03,-2.14,1.17),
                  (5.11,-2.14,1.17), (5.11,-2.075,1.17)], .012), .009, 'black')
    for prefix in ('BedroomGuitar_Fret_', 'BedroomGuitar_String_', 'BedroomGuitar_Tuner', 'BedroomGuitar_BridgePin_', 'GuitarStand_'):
        H['consolidate'](prefix, prefix.rstrip('_'))


def exterior_bedroom():
    bind()
    if bpy.context.scene.get('revision3_bedroom_done'):
        raise RuntimeError('Bedroom/exterior stage is already complete.')
    gutter_revision()
    bedroom_revision()
    bpy.context.scene['revision3_bedroom_done'] = True
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'veyra-source.blend'), compress=True)
    return {'status': 'drainage/canopies and bedroom revisions authored; no tests'}


def toilet_revision():
    archive(exact=('Toilet_FrontPartition', 'Toilet_LeftPartition'), prefixes=('ToiletDoor_',))
    # A single extruded L removes the stepped/split corner from the old two boxes.
    outline = [(-.005, -.265), (2.35, -.265), (2.35, -.135), (.125, -.135), (.125, 2.445), (-.005, 2.445)]
    wall = extrude('Toilet_BedroomJoinedPartitions', outline, F, 3.23, 'plaster', 'Architecture')
    bedroom = bpy.data.objects['Bedroom_FullPartition']
    bpy.context.view_layer.objects.active = wall
    mod = wall.modifiers.new('Continuous bedroom/toilet wall junction', 'BOOLEAN')
    mod.operation, mod.solver, mod.object = 'UNION', 'EXACT', bedroom
    bpy.ops.object.modifier_apply(modifier=mod.name)
    archive(exact=('Bedroom_FullPartition',))
    H['cut'](wall, (.635, -.20, F + 2.255 / 2), (.98, .70, 2.255))
    V2['fitted_door']('ToiletDoor', 'x', -.20, .635, .83)


def front_storage():
    # Faces +Y into the aisle opposite the toilet; stops short of central door trim.
    start = V2['live']()
    width, depth, height = 1.61, .52, 2.33
    for x in (-width/2, .22, width/2):
        H['box']('EntryStorage_Upright_' + str(x), (x, 0, F+height/2), (.028, depth, height))
    H['box']('EntryStorage_Back', (0, depth/2-.01, F+height/2), (width, .02, height))
    for z in (F+.05, F+height):
        H['box']('EntryStorage_Shelf_' + str(z), (0, 0, z), (width+.028, depth, .028))
    for i, x in enumerate((-.54, -.035)):
        H['box'](f'EntryStorage_WardrobeDoor_{i}', (x, -depth/2-.018, F+height/2+.025), (.49,.032,height-.055))
        H['cyl'](f'EntryStorage_Handle_{i}', (x+(.17 if i==0 else -.17),-depth/2-.057,F+1.03),
                 (x+(.17 if i==0 else -.17),-depth/2-.057,F+1.25), .010,'black')
    for i in range(2):
        z=F+.20+i*.28
        H['box'](f'EntryStorage_Drawer_{i}', (.51,-depth/2-.018,z), (.54,.032,.267))
        H['pull'](f'EntryStorage_DrawerPull_{i}',.51,-depth/2-.040,z+.055,.14)
    for i,z in enumerate((F+.65,F+1.06,F+1.47,F+1.88)):
        H['box'](f'EntryStorage_OpenShelf_{i}',(.51,0,z),(.56,depth-.025,.028))
    H['books']('EntryStorage_Books',.31,0,F+.671,4,upright=True)
    H['books']('EntryStorage_Stack',.48,0,F+1.081,2)
    for i in range(2):
        H['box'](f'EntryStorage_Linen_{i}',(.51,.015,F+1.52+i*.065),(.36,.34,.061),'linen',bevel=.018,segments=3)
    H['plant']('EntryStorage_Plant',.51,0,F+1.90,.30)
    place(V2['live']()-start,1.42,-1.98,math.pi)
    for prefix in ('EntryStorage_Books','EntryStorage_Stack','EntryStorage_Plant'):
        H['consolidate'](prefix,prefix)


def dining():
    archive(prefixes=('Dining_',))
    x,y=-1.45,-.55
    top=H['cyl']('Dining_RoundTop',(x,y,F+.715),(x,y,F+.765),.52,'wood',vertices=64)
    for mod in top.modifiers:
        if mod.type=='BEVEL':
            mod.width,mod.segments=.010,3
    H['cyl']('Dining_Pedestal',(x,y,F+.08),(x,y,F+.72),.073,'wood',vertices=24)
    H['cyl']('Dining_Base',(x,y,F+.024),(x,y,F+.065),.29,'black',vertices=40)
    H['chair']('Dining_ChairFront',x,y-.82,math.pi)
    H['chair']('Dining_ChairRear',x,y+.82)
    H['plant']('Dining_Plant',x,y,F+.766,.23)
    V2['cup']('Dining_CupFront',x+.24,y-.19,F+.767)
    V2['cup']('Dining_CupRear',x-.24,y+.19,F+.767)
    H['cyl']('Dining_PendantCord',(x,y,3.18),(x,y,2.27),.007,'black')
    H['cyl']('Dining_PendantShade',(x,y,2.075),(x,y,2.30),.19,'ceramic',top=.064,vertices=28)
    H['cyl']('Dining_PendantDiffuser',(x,y,2.069),(x,y,2.077),.162,'glow',vertices=28)
    light=bpy.data.objects['Interior_Dining']
    light.location=(x,y,2.063)
    light.data.energy,light.data.size=36,.27
    for prefix in ('Dining_ChairFront','Dining_ChairRear','Dining_Plant'):
        H['consolidate'](prefix,prefix)


def kitchen():
    # Retain the repaired basin geometry, moving it forward to leave a real tap deck.
    archive(prefixes=('Kitchen_', 'Fridge_', 'Oven_', 'SinkCabinet_', 'Tap_', 'Kettle_'), exact=('Hob_Ring',))
    V2['move'](('Sink_',),(-.08,-.14,0))
    counter_outline=[(-2.55,1.575),(-.715,1.575),(-.715,.56),(-.035,.56),(-.035,2.245),(-2.55,2.245)]
    top=extrude('Kitchen_LWorktop',counter_outline,1.304,1.353,'stone')
    H['cut'](top,(-1.30,1.85,1.33),(.76,.48,.25))
    V2['soft_edges'](top,.003,3)
    rear=H['box']('Kitchen_RearCarcass',(-1.635,1.948,F+.49),(1.83,.57,.76),bevel=0)
    H['cut'](rear,(-1.30,1.85,1.26),(.79,.52,.46))
    V2['soft_edges'](rear,.003)
    H['box']('Kitchen_CornerCarcass',(-.385,1.91,F+.49),(.67,.67,.76))
    H['box']('Kitchen_ReturnCarcass',(-.375,1.10,F+.49),(.65,.94,.76))
    H['box']('Kitchen_RearToeKick',(-1.31,1.99,F+.07),(2.40,.44,.14),'black')
    H['box']('Kitchen_ReturnToeKick',(-.31,1.10,F+.07),(.47,.97,.14),'black')
    # Rear sink doors and three left drawers.
    for i,x in enumerate((-1.54,-1.04)):
        H['box'](f'Kitchen_SinkDoor_{i}',(x,1.644,F+.49),(.484,.032,.70))
        H['pull'](f'Kitchen_SinkPull_{i}',x,1.623,F+.76,.14)
    for i in range(3):
        zz=F+.245+i*.237
        H['box'](f'Kitchen_LeftDrawer_{i}',(-2.205,1.644,zz),(.64,.032,.225))
        H['pull'](f'Kitchen_LeftPull_{i}',-2.205,1.623,zz+.061,.16)
    H['box']('Kitchen_CornerFiller',(-.749,1.644,F+.49),(.090,.032,.70))
    # Fronts on the perpendicular return face -X.
    for i in range(3):
        zz=F+.245+i*.237
        H['box'](f'Kitchen_ReturnDrawer_{i}',(-.718,.707,zz),(.032,.268,.225))
        V2['sweep'](f'Kitchen_ReturnPull_{i}',[(-.739,.66,zz+.06),(-.77,.66,zz+.06),(-.77,.75,zz+.06),(-.739,.75,zz+.06)],.008,'black')
    H['box']('Kitchen_OvenFace',(-.726,1.182,F+.57),(.045,.568,.625),'appliance',bevel=.012)
    H['box']('Kitchen_OvenGlass',(-.752,1.182,F+.50),(.008,.49,.39),'screen',bevel=.005)
    V2['sweep']('Kitchen_OvenHandle',[(-.756,.985,F+.742),(-.805,.985,F+.742),(-.805,1.379,F+.742),(-.756,1.379,F+.742)],.011,'steel')
    for yy in (1.01,1.35):
        H['cyl']('Kitchen_OvenDial_'+str(yy),(-.754,yy,F+.82),(-.774,yy,F+.82),.023,'steel')
    H['box']('Kitchen_OvenDisplay',(-.754,1.182,F+.82),(.007,.105,.027),'screen')
    H['box']('Kitchen_Hob',(-.375,1.18,1.363),(.51,.575,.012),'screen',bevel=.006)
    for xx in (-.505,-.245):
        for yy in (1.035,1.325):
            pts=[(xx+.080*math.cos(i*math.tau/32),yy+.080*math.sin(i*math.tau/32),1.371) for i in range(33)]
            V2['sweep'](f'Kitchen_HobRing_{xx}_{yy}',pts,.0015,'steel',sides=6)
    # Solid blind-corner door and filler, clear of oven handle ends.
    H['box']('Kitchen_CornerAccessDoor',(-.718,1.823,F+.49),(.032,.57,.70))
    V2['sweep']('Kitchen_CornerPull',[(-.739,1.88,F+.76),(-.775,1.88,F+.76),(-.775,2.02,F+.76),(-.739,2.02,F+.76)],.009,'black')
    # Tall fridge ends the return at the toilet corner, facing -X.
    H['box']('Kitchen_FridgeHousing',(-.365,.175,F+1.195),(.68,.74,2.39))
    H['box']('Kitchen_FridgeMainFace',(-.730,.175,F+1.34),(.051,.648,1.44),'appliance',bevel=.012)
    H['box']('Kitchen_FridgeFreezerFace',(-.730,.175,F+.34),(.051,.648,.52),'appliance',bevel=.012)
    for label,zz,length in (('Main',F+1.24,.46),('Freezer',F+.34,.27)):
        V2['sweep']('Kitchen_Fridge'+label+'Handle',[(-.76,-.058,zz-length/2),(-.80,-.058,zz-length/2),
                     (-.80,-.058,zz+length/2),(-.76,-.058,zz+length/2)],.011,'steel')
    H['box']('Kitchen_FridgeOverheadDoor',(-.725,.175,F+2.235),(.034,.668,.272))
    V2['sweep']('Kitchen_FridgeOverheadPull',[(-.746,.10,F+2.155),(-.778,.10,F+2.155),(-.778,.25,F+2.155),(-.746,.25,F+2.155)],.009,'black')
    # Upper cupboards follow the L, with a common top and short rear-wall return.
    for i,yy in enumerate((.865,1.45,1.995)):
        span=.51 if i==2 else .55
        H['box'](f'Kitchen_UpperReturnCarcass_{i}',(-.175,yy,2.425),(.27,span,.77))
        H['box'](f'Kitchen_UpperReturnDoor_{i}',(-.331,yy,2.425),(.032,span-.028,.737))
        V2['sweep'](f'Kitchen_UpperReturnPull_{i}',[(-.351,yy-.06,2.13),(-.38,yy-.06,2.13),(-.38,yy+.06,2.13),(-.351,yy+.06,2.13)],.008,'black')
    # Keep the existing rear window fully clear.
    H['box']('Kitchen_UpperRearCarcass',(-2.185,2.06,2.425),(.67,.35,.77))
    H['box']('Kitchen_UpperRearDoor',(-2.185,1.866,2.425),(.642,.032,.737))
    H['pull']('Kitchen_UpperRearPull',-2.185,1.844,2.13,.14)
    H['box']('Kitchen_ReturnBackSplash',(-.018,1.43,1.455),(.023,1.59,.205),'stone')
    H['box']('Kitchen_RearBackSplash',(-1.31,2.233,1.455),(2.44,.023,.205),'stone')
    # Faucet sits on the counter deck in front of the actual inner wall (Y=2.255).
    H['cyl']('Kitchen_TapBase',(-1.30,2.155,1.354),(-1.30,2.155,1.375),.025,'steel',vertices=24)
    path=[(-1.30,2.155,1.37),(-1.30,2.155,1.65)]
    path.extend((-1.30,2.055+.10*math.cos(i*math.pi/20),1.65+.10*math.sin(i*math.pi/20)) for i in range(1,21))
    path.append((-1.30,1.955,1.62))
    V2['sweep']('Kitchen_TapSpout',path,.015,'steel',inner=.010,sides=24)
    H['cyl']('Kitchen_TapLeverHub',(-1.288,2.155,1.435),(-1.245,2.155,1.435),.019,'steel')
    V2['sweep']('Kitchen_TapLever',V2['rounded_path']([(-1.245,2.155,1.435),(-1.215,2.155,1.435),(-1.215,2.155,1.555)],.012),.008,'steel')
    H['box']('Kitchen_Board',(-2.29,1.96,1.37),(.29,.24,.028),bevel=.015)
    H['plant']('Kitchen_Herb',-2.33,2.07,1.386,.24)
    H['cyl']('Kitchen_UtensilPot',(-.37,1.90,1.357),(-.37,1.90,1.50),.053,'ceramic')
    for i in range(3):
        H['cyl']('Kitchen_Utensil_'+str(i),(-.40+.027*i,1.90,1.45),(-.42+.047*i,1.90,1.67),.007,'wood')
    for prefix in ('Kitchen_HobRing_','Kitchen_Herb'):
        H['consolidate'](prefix,prefix.rstrip('_'))
    light=bpy.data.objects['Interior_Kitchen']
    light.location=(-1.05,1.23,3.15)


def stove_and_flue():
    archive(prefixes=('ServiceFlue_',),exact=('FixedServiceRiser','Roof_Seam_1'))
    V2['move'](('MediaConsole_','TV_'),(.99,0,0))
    H['box']('Stove_Hearth',(STOVE_X,STOVE_Y,F+.022),(.79,.86,.044),'black',bevel=.008)
    for xx in (STOVE_X-.17,STOVE_X+.17):
        for yy in (STOVE_Y-.16,STOVE_Y+.16):
            H['box']('Stove_Foot_'+str((xx,yy)),(xx,yy,F+.11),(.045,.055,.14),'black',bevel=.004)
    H['box']('Stove_Body',(STOVE_X,STOVE_Y,F+.61),(.47,.49,.88),'appliance',bevel=.025,segments=3)
    H['box']('Stove_Top',(STOVE_X,STOVE_Y,F+1.065),(.50,.515,.040),'black',bevel=.012)
    H['box']('Stove_DoorFrame',(STOVE_X,STOVE_Y-.258,F+.635),(.38,.037,.68),'black',bevel=.012)
    H['box']('Stove_SmokedGlass',(STOVE_X,STOVE_Y-.280,F+.665),(.30,.008,.53),'screen',bevel=.007)
    V2['sweep']('Stove_DoorHandle',[(STOVE_X+.155,STOVE_Y-.285,F+.53),(STOVE_X+.155,STOVE_Y-.329,F+.53),
                  (STOVE_X+.155,STOVE_Y-.329,F+.72),(STOVE_X+.155,STOVE_Y-.285,F+.72)],.010,'black')
    H['box']('Stove_AshDrawer',(STOVE_X,STOVE_Y-.27,F+.265),(.32,.027,.08),'black',bevel=.004)
    H['box']('Stove_AirControl',(STOVE_X,STOVE_Y-.294,F+.265),(.11,.016,.012),'steel',bevel=.002)
    for i in range(4):
        H['box']('Stove_Vent_'+str(i),(STOVE_X-.09+i*.06,STOVE_Y-.25,F+.20),(.029,.009,.008),'black',bevel=.001)
    H['cyl']('Stove_ContinuousFlue',(STOVE_X,STOVE_Y,F+1.065),(STOVE_X,STOVE_Y,5.24),.065,'black','ExteriorDetails',vertices=32)
    H['cyl']('Stove_CeilingTrim',(STOVE_X,STOVE_Y,3.179),(STOVE_X,STOVE_Y,3.195),.11,'black',vertices=32)
    H['cyl']('Stove_RainCap',(STOVE_X,STOVE_Y,5.22),(STOVE_X,STOVE_Y,5.29),.096,'black','ExteriorDetails',vertices=24)
    roof_boot()


def roof_boot():
    cx,cy=STOVE_X,STOVE_Y
    roof=lambda y:4.75-.56*y
    n=48
    vv,ff=[],[]
    for offset,outer in ((.098,True),(.098,False),(.080,True),(.080,False)):
        for i in range(n):
            a=i*math.tau/n
            rr=min(.25/max(abs(math.cos(a)),1e-6),.28/max(abs(math.sin(a)),1e-6)) if outer else .068
            x,y=cx+rr*math.cos(a),cy+rr*math.sin(a)
            vv.append((x,y,roof(y)+offset))
    for i in range(n):
        j=(i+1)%n
        ff.extend(((i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),(i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)))
    H['mesh']('Stove_RoofFlashing',vv,ff,'roof','ExteriorDetails')
    vv,ff=[],[]
    for rr,upper in ((.135,False),(.073,True),(.129,False),(.066,True)):
        for i in range(n):
            a=i*math.tau/n
            x,y=cx+rr*math.cos(a),cy+rr*math.sin(a)
            vv.append((x,y,roof(cy)+.30 if upper else roof(y)+.097))
    for i in range(n):
        j=(i+1)%n
        ff.extend(((i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),(n+i,n+j,3*n+j,3*n+i),(i,2*n+i,2*n+j,j)))
    obj=H['mesh']('Stove_RoofBoot',vv,ff,'black','ExteriorDetails')
    for face in obj.data.polygons:
        face.use_smooth=True
    for i in range(27):
        x=-5.65+i*11.3/26
        intervals=[(0,cy-.335),(cy+.335,2.69)] if abs(x-cx)<.27 else [(0,2.69)]
        for j,(a,b) in enumerate(intervals):
            y=(a+b)/2
            H['box'](f'Roof_Seam_Rear_{i}_{j}',(x,y,roof(y)+.08),(.018,(b-a)*math.sqrt(1+.56**2),.033),
                     'roof','ExteriorDetails',.003,(-math.atan(.56),0,0))
    H['consolidate']('Roof_Seam_Rear_','Roof_Seam_1')


def living_kitchen():
    bind()
    if not bpy.context.scene.get('revision3_bedroom_done') or bpy.context.scene.get('revision3_living_done'):
        raise RuntimeError('Complete exterior_bedroom() once, then living_kitchen() once.')
    toilet_revision()
    front_storage()
    dining()
    kitchen()
    stove_and_flue()
    # The previous floor plant occupied the new fridge return.
    archive(exact=('Living_FloorPlant',))
    H['plant']('Living_LoungePlant',-2.64,.60,F,.72)
    H['consolidate']('Living_LoungePlant','Living_LoungePlant')
    for prefix in ('BedroomCornerCabinet_Books','BedroomCornerCabinet_Stack'):
        H['consolidate'](prefix,prefix)
    scene=bpy.context.scene
    scene['revision3_living_done']=True
    scene['revision_number']=3
    scene['revision']='Revision 3: L-kitchen, corner stove, storage and drainage refinements; awaiting user review'
    scene['poster_current']=False
    camera=bpy.data.objects['Veyra_InteriorReview']
    camera.location=(-3.25,-.85,1.95)
    target=Vector((-.65,1.12,1.55))
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
    camera['target_blender']=list(target)
    camera.data.lens=25
    detail=bpy.data.objects.get('Veyra_GuitarDetail')
    if detail is None:
        detail=bpy.data.objects.new('Veyra_GuitarDetail',bpy.data.cameras.new('Veyra_GuitarDetail'))
        H['COL']['ReviewStaging'].objects.link(detail)
    detail.location=(3.85,-.93,1.38)
    target=Vector((5.04,-2.0,1.03))
    detail.rotation_euler=(target-detail.location).to_track_quat('-Z','Y').to_euler()
    detail['target_blender']=list(target)
    detail.data.lens,detail.data.clip_start=42,.03
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'veyra-source.blend'),compress=True)
    return {'status':'revision 3 authored; no tests or renders run','backup':scene['revision3_backup']}
