"""Revision 5: cabinet access intent, handle placement and fruit support.

Preserves saved/live source. No tests or renders are invoked; validation is a
separate authorized step. Doors remain static in the exported asset.
"""

import math
import runpy
import shutil
from datetime import datetime
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
R4 = runpy.run_path(str(ROOT / 'scripts/refine-kitchen.py'))
V2, H = R4['V2'], R4['H']


def archive(prefixes=(), exact=()):
    col = bpy.data.collections['Veyra_Archive_PreRevision5']
    for obj in list(V2['live']()):
        if obj.name in exact or any(obj.name.startswith(p) for p in prefixes):
            original = obj.name
            for old in list(obj.users_collection):
                old.objects.unlink(obj)
            col.objects.link(obj)
            obj.name = 'R4__' + original
            obj['superseded_name'] = original


def preserve():
    scene = bpy.context.scene
    if scene.name != 'Veyra_Source' or Path(bpy.data.filepath).parent != ROOT:
        raise RuntimeError('Open Veyra_Source first.')
    if scene.get('revision5_started'):
        raise RuntimeError('Revision 5 has already started.')
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    folder = ROOT / 'history' / ('before-revision-5-' + datetime.now().strftime('%Y%m%d-%H%M%S'))
    folder.mkdir(parents=True, exist_ok=False)
    for name in ('veyra-source.blend','veyra-configurator.glb','veyra-camera.json','veyra-presets.json',
                 'veyra-delivery.json','veyra-lighting.json','README.md','web-handoff.md','revision-4.md'):
        if (ROOT/name).exists():
            shutil.copyfile(ROOT/name,folder/name)
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/'veyra-live-before-revision.blend'),copy=True,compress=True)
    col = bpy.data.collections.new('Veyra_Archive_PreRevision5')
    scene.collection.children.link(col)
    col.hide_viewport = col.hide_render = True
    scene['revision5_started'] = True
    scene['revision5_backup'] = folder.relative_to(ROOT).as_posix()
    V2['bind']()
    return str(folder)


def lower_cabinet():
    archive(prefixes=('Kitchen_ReturnDrawer_',))
    low, high = .567, 1.301
    height = (high-low-.006)/3
    for i in range(3):
        z0 = low+i*(height+.003)
        R4['return_front'](f'Kitchen_ReturnDrawer_{i}',.549,1.237,z0,z0+height,knobs=False)
        R4['knob'](f'Kitchen_ReturnDrawer_{i}_WoodKnob',(-.721,.893,z0+height-.058),(-1,0,0))
    door = R4['return_front']('Kitchen_ReturnAccessDoor',1.242,1.475,low,high,knobs=False)
    R4['knob']('Kitchen_ReturnAccessDoor_WoodKnob',(-.721,1.421,1.243),(-1,0,0))
    # A fixed blind-corner strip keeps the leaf's swing away from the oven/towel.
    R4['return_front']('Kitchen_ReturnBlindCornerFiller',1.478,1.586,low,high,knobs=False)
    H['box']('Kitchen_ReturnBayDivider',(-.3645,1.240,.925),(.659,.018,.758),bevel=.001)
    pivot = (-.725,1.240,.567)
    door['hinge_pivot_blender'] = pivot
    door['hinge_axis_blender'] = (0,0,1)
    door['opening_angle_degrees'] = 90.0
    door['moving_parts_prefix'] = 'Kitchen_ReturnAccessDoor'
    door['fixed_obstacle_prefixes'] = 'Kitchen_Oven,Kitchen_ReturnDrawer_'
    door['hinge_intent'] = 'Away from oven, effective outboard pivot; positive Z rotation opens into aisle.'
    door['fixed_corner_filler_m'] = .108
    for i,z in enumerate((.72,1.15)):
        H['cyl'](f'Kitchen_ReturnAccessHinge_{i}',(-.725,1.240,z-.017),(-.725,1.240,z+.017),.0045,'steel',vertices=12)


def upper_handles():
    for i in range(3):
        archive(prefixes=(f'Kitchen_UpperReturnDoor_{i}_WoodKnob',))
    width = (1.869-.548-.006)/3
    for i in range(3):
        a = .548+i*(width+.003)
        b = a+width
        obj = bpy.data.objects[f'Kitchen_UpperReturnDoor_{i}']
        # Viewed head-on: panel 2 is the left single, panels 1/0 the right pair.
        knob_y = b-.050 if i==0 else a+.050
        R4['knob'](f'Kitchen_UpperReturnDoor_{i}_WoodKnob',(-.402,knob_y,2.150),(-1,0,0))
        obj['door_group'] = 'left-single' if i==2 else 'right-pair'
        obj['hinge_side_viewed_from_front'] = 'right' if i==0 else 'left'
        obj['free_edge_knob_y_blender'] = knob_y
        obj['static_door'] = True


def bowl_inner_height(radius):
    # The actual revolved bowl's inside profile (local Z above the countertop).
    profile = ((0,.012),(.065,.012),(.118,.050),(.151,.077))
    for (a,z0),(b,z1) in zip(profile,profile[1:]):
        if radius <= b:
            return z0+(z1-z0)*(radius-a)/(b-a)
    return .077


def support_on_bowl(obj, bx, by, bz):
    # Author the placement from the fruit surface, not its center alone.
    points = [obj.matrix_world@v.co for v in obj.data.vertices]
    points.extend(obj.matrix_world@p.center for p in obj.data.polygons)
    dz = max(bz+bowl_inner_height(math.hypot(p.x-bx,p.y-by))-p.z for p in points)+.002
    obj.location.z += dz
    obj['bowl_support_margin_m'] = .002
    return dz


def fruit():
    archive(exact=('Kitchen_Fruit',))
    for key,name in (('fruit_red','FixedKitchenAppleRed'),('fruit_green','FixedKitchenAppleGreen'),('fruit_gold','FixedKitchenPearGold')):
        H['M'][key] = bpy.data.materials[name]
    x,y,z = -.39,.975,1.354
    V2['lathe']('Kitchen_FruitBowl',[(0,0),(.065,0),(.071,.009),(.123,.045),(.157,.072),
                 (.157,.077),(.151,.077),(.118,.050),(.065,.012),(0,.012)],(x,y,z),'steel',40)
    # Keep individual bodies identifiable for the collision/clearance checks.
    for i,(dx,dy,material) in enumerate(((-.060,-.029,'fruit_red'),(.042,-.037,'fruit_green'),(-.008,.052,'fruit_red'))):
        obj = H['sphere'](f'Kitchen_FruitApple_{i}',(x+dx,y+dy,z+.055),(.043,.042,.043),material,20,12)
        bpy.context.view_layer.update()
        dz = support_on_bowl(obj,x,y,z)
        H['cyl'](f'Kitchen_FruitStem_{i}',(x+dx,y+dy,z+.091+dz),(x+dx+.003,y+dy,z+.104+dz),.0018,'soil',vertices=8)
    pear = V2['lathe']('Kitchen_FruitPear',[(0,0),(.025,.004),(.034,.025),(.031,.05),(.017,.076),(.011,.094),(0,.097)],
                       (x+.080,y+.075,z+.022),'fruit_gold',24)
    bpy.context.view_layer.update()
    dz = support_on_bowl(pear,x,y,z)
    H['cyl']('Kitchen_FruitPearStem',(x+.080,y+.075,z+.115+dz),(x+.084,y+.075,z+.131+dz),.002,'soil',vertices=8)


def author():
    backup = preserve()
    cx = -1.81
    for name,factor in (('Kitchen_ShortRomanBlind',1.50/1.352),('Kitchen_BlindHem',1.50/1.35)):
        obj = bpy.data.objects[name]
        transform = Matrix.Translation((cx,0,0)) @ Matrix.Diagonal((factor,1,1,1)) @ Matrix.Translation((-cx,0,0))
        obj.matrix_world = transform@obj.matrix_world
    bpy.data.objects['Kitchen_BlindTrack'].dimensions.x = 1.54
    archive(exact=('Kitchen_OutletRear','Kitchen_Botanical'))
    R4['outlet']('Kitchen_OutletCorner','y',-.012,1.50,1.688)
    H['consolidate']('Kitchen_OutletCorner','Kitchen_OutletCorner')
    lower_cabinet()
    upper_handles()
    bpy.data.objects['Kitchen_FridgeMainHandle'].location += Vector((0,.490,-.256))
    bpy.data.objects['Kitchen_FridgeFreezerHandle'].location += Vector((0,.490,0))
    fruit()
    bpy.context.scene['revision_number'] = 5
    bpy.context.scene['revision'] = 'Revision 5: cabinet access, handle ergonomics and fruit support; validation authorized'
    bpy.context.scene['poster_current'] = False
    bpy.context.view_layer.update()
    for obj in V2['live']():
        if obj.type != 'MESH' or not obj.name.startswith(('Kitchen_Return','Kitchen_UpperReturnDoor_')):
            continue
        if len(obj.data.materials) != 1 or obj.data.materials[0].name != 'InteriorJoinery':
            continue
        uv = obj.data.uv_layers.active
        if uv is None:
            continue
        for face in obj.data.polygons:
            normal = obj.matrix_world.to_3x3() @ face.normal
            for index in face.loop_indices:
                co = obj.matrix_world @ obj.data.vertices[obj.data.loops[index].vertex_index].co
                a,b = (co.y,co.x) if abs(normal.z) > .5 else ((co.y,co.z) if abs(normal.x)>abs(normal.y) else (co.x,co.z))
                uv.data[index].uv = (a/1.83,b/1.83)
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'veyra-source.blend'),compress=True)
    return {'backup':backup,'status':'authored, ready for authorized validation'}
