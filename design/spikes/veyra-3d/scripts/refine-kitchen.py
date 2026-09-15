"""Revision 4: fitted kitchen and requested furnishing corrections.

Authoring only. Call prepare(), furnishing_fixes(), then kitchen_revision().
No tests, screenshots, finish comparisons or renders are invoked.
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
SINK_X, SINK_Y = -1.81, 1.85
COUNTER_TOP, COUNTER_BOTTOM = 1.353, 1.304
FRONT_BOTTOM, FRONT_TOP = .567, 1.301


def bind():
    V2['bind']()


def archive(prefixes=(), exact=()):
    collection = bpy.data.collections['Veyra_Archive_PreRevision4']
    for obj in list(V2['live']()):
        if obj.name in exact or any(obj.name.startswith(p) for p in prefixes):
            original = obj.name
            for col in list(obj.users_collection):
                col.objects.unlink(obj)
            collection.objects.link(obj)
            obj.name = 'R3__' + original
            obj['superseded_name'] = original


def prepare():
    scene = bpy.context.scene
    if scene.name != 'Veyra_Source' or Path(bpy.data.filepath).parent != ROOT:
        raise RuntimeError('Open the independent Veyra source first.')
    if scene.get('revision4_started'):
        raise RuntimeError('Revision 4 has already started; continue its remaining stage.')
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    folder = ROOT / 'history' / ('before-revision-4-' + datetime.now().strftime('%Y%m%d-%H%M%S'))
    folder.mkdir(parents=True, exist_ok=False)
    for name in ('veyra-source.blend', 'veyra-configurator.glb', 'veyra-presets.json', 'veyra-camera.json',
                 'veyra-delivery.json', 'veyra-lighting.json', 'README.md', 'web-handoff.md', 'revision-3.md'):
        if (ROOT / name).exists():
            shutil.copyfile(ROOT / name, folder / name)
    bpy.ops.wm.save_as_mainfile(filepath=str(folder / 'veyra-live-before-revision.blend'), copy=True, compress=True)
    col = bpy.data.collections.new('Veyra_Archive_PreRevision4')
    scene.collection.children.link(col)
    col.hide_viewport = col.hide_render = True
    scene['revision4_started'] = True
    scene['revision4_backup'] = folder.relative_to(ROOT).as_posix()
    bind()
    return {'backup': str(folder), 'status': 'saved/live state preserved'}


def slab(name, outline, bottom, top, material='wood', group='ShallowInterior'):
    n = len(outline)
    vertices = [(x, y, z) for z in (bottom, top) for x, y in outline]
    faces = [tuple(reversed(range(n))), tuple(range(n, 2*n))]
    faces.extend((i, (i+1) % n, (i+1) % n + n, i+n) for i in range(n))
    return H['mesh'](name, vertices, faces, material, group)


def small_leaf(name, center, size, rotation=0):
    obj = H['sphere'](name, center, size, 'leaf', 12, 6)
    obj.rotation_euler = (.18, .24, rotation)
    return obj


def bedroom_plant():
    archive(exact=('BedroomStorage_TopPlant', 'BedroomStorage_Trailing'))
    x, y, z = 3.80, 1.94, 2.686
    V2['lathe']('BedroomStorage_Plant_Pot', [(0,0),(.056,0),(.060,.008),(.073,.147),
                 (.073,.157),(.066,.157),(.065,.146),(.053,.014),(0,.014)], (x,y,z), 'ceramic')
    H['cyl']('BedroomStorage_Plant_Soil', (x,y,z+.134), (x,y,z+.137), .061, 'soil', vertices=24)
    # Every vine emerges through the opening, clears the top board, then drops
    # ahead of the cabinet face. No stem passes through a pot wall or shelf.
    for i in range(3):
        dx = (i-1)*.041
        path = [(x+dx*.35,y,z+.13),(x+dx,y-.018,z+.215),
                (x-.035+dx,1.77,2.89),(x-.06+dx,1.628,2.79),
                (x-.075+dx,1.604,2.56),(x-.045+dx,1.600,2.17+i*.055)]
        V2['sweep'](f'BedroomStorage_Plant_Vine_{i}', V2['rounded_path'](path,.045), .0021, 'soil', sides=8)
        for j in range(6):
            zz = 2.64 - j*.071 + i*.012
            xx = x-.073+dx + (-1 if j%2 else 1)*.022
            small_leaf(f'BedroomStorage_Plant_TrailingLeaf_{i}_{j}', (xx,1.597,zz), (.029,.008,.020), (-1 if j%2 else 1)*.3)
    for i in range(5):
        a = i*2.399
        end = (x+math.cos(a)*.10,y+math.sin(a)*.085,z+.27+.018*(i%3))
        V2['sweep'](f'BedroomStorage_Plant_Stem_{i}', [(x,y,z+.13),end], .0018, 'soil', sides=8)
        small_leaf(f'BedroomStorage_Plant_UpperLeaf_{i}', end, (.023,.051,.004), a)
    H['consolidate']('BedroomStorage_Plant_', 'BedroomStorage_TrailingPlant')


def furnishing_fixes():
    bind()
    if bpy.context.scene.get('revision4_furnishings_done'):
        raise RuntimeError('Furnishing stage already complete.')
    bedroom_plant()
    transform = Matrix.Translation((2.82,-2.03,0)) @ Matrix.Rotation(math.pi/2,4,'Z') @ Matrix.Translation((-2.63,1.87,0))
    for obj in V2['live']():
        if obj.name.startswith('BedroomCornerCabinet'):
            obj.matrix_world = transform @ obj.matrix_world
    # Fill the gap below the first shelf and use small, even front reveals.
    for i in range(2):
        obj = bpy.data.objects[f'EntryStorage_Drawer_{i}']
        old = obj.location.copy()
        obj.location.x = .9075
        obj.location.z = .62775 + i*.2845
        obj.dimensions.x, obj.dimensions.z = .552, .2815
        for mod in obj.modifiers:
            if mod.type == 'BEVEL':
                mod.width = .0015
        delta = obj.location-old
        V2['move']((f'EntryStorage_DrawerPull_{i}',),delta)
    for i in range(4):
        obj = bpy.data.objects[f'EntryStorage_OpenShelf_{i}']
        obj.location.x, obj.dimensions.x = .9075, .554
        for mod in obj.modifiers:
            if mod.type == 'BEVEL':
                mod.width = .0015
    archive(exact=('Living_LoungePlant',))
    V2['move'](('Dining_',),(-.65,-.05,0))
    bpy.data.objects['Interior_Dining'].location += Vector((-.65,-.05,0))
    # Solid half-disc end stops close the bore, not just the gutter sheet edge.
    for side in (-1,1):
        cy = side*2.82
        outline = [(cy-.081,3.237),(cy+.081,3.237)]
        outline.extend((cy+.081*math.cos(j*math.pi/20),3.237-.081*math.sin(j*math.pi/20)) for j in range(1,20))
        n = len(outline)
        for end in (-1,1):
            verts = [(xx,yy,zz) for xx in (end*5.833,end*5.843) for yy,zz in outline]
            faces = [tuple(reversed(range(n))),tuple(range(n,2*n))]
            faces.extend((i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n))
            H['mesh'](f'Gutter_ClosedEnd_{side}_{end}',verts,faces,'black','ExteriorDetails',.0008)
    bpy.context.scene['revision4_furnishings_done'] = True
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'veyra-source.blend'),compress=True)
    return {'status':'furnishing corrections and closed gutter ends authored; no images or tests'}


def knob(name, position, normal):
    p, n = Vector(position), Vector(normal)
    H['cyl'](name+'_Stem',p-n*.003,p+n*.018,.0065,'wood',vertices=12)
    dims = (.009,.0145,.0145) if abs(n.x)>.5 else (.0145,.009,.0145)
    H['sphere'](name+'_Cap',p+n*.023,dims,'wood',16,8)


def rear_front(name, left, right, bottom, top, knob_x=None):
    obj = H['box'](name,((left+right)/2,1.601,(bottom+top)/2),(right-left,.022,top-bottom),bevel=.0015)
    if knob_x is not None:
        knob(name+'_WoodKnob',(knob_x,1.589,top-.058),(0,-1,0))
    return obj


def return_front(name, near, far, bottom, top, knobs=True):
    obj = H['box'](name,(-.709,(near+far)/2,(bottom+top)/2),(.022,far-near,top-bottom),bevel=.0015)
    if knobs:
        for i,yy in enumerate((near+.235,far-.235)):
            knob(name+f'_WoodKnob_{i}',(-.721,yy,top-.058),(-1,0,0))
    return obj


def window_and_blind():
    archive(exact=('Cladding_Rear','Lining_Rear'),prefixes=('Baseboard_Rear_',))
    holes=[(-2.51,-1.11,1.72,2.67),(1.0,1.90,1.83,2.67),(2.51,3.49,1.30,2.85)]
    H['elevation']('Rear','x',2.5,11.2,holes)
    wall=H['box']('Lining_Rear',(0,2.365,(F+3.35)/2),(11.2,.22,3.35-F),'plaster','Architecture',0)
    for a,b,z0,z1 in holes:
        H['cut'](wall,((a+b)/2,2.5,(z0+z1)/2),(b-a,.9,z1-z0+.002))
    H['box']('Baseboard_Rear_0',(0,2.238,F+.055),(10.72,.022,.11),'plaster','Architecture',.003)
    V2['move'](('KitchenRearWindow_',),(-.76,0,0))
    H['box']('Kitchen_BlindTrack',(SINK_X,2.217,2.700),(1.43,.035,.035),'white',bevel=.003)
    vv,ff=[],[]
    columns,rows=48,15
    for j in range(rows+1):
        t=j/rows
        z=2.435+t*.245
        for i in range(columns+1):
            x=SINK_X-.676+i*1.352/columns
            y=2.186+.008*math.sin(t*3*math.pi)+.0015*math.cos(i*.6)
            vv.append((x,y,z))
    for j in range(rows):
        for i in range(columns):
            k=j*(columns+1)+i
            ff.append((k,k+1,k+columns+2,k+columns+1))
    cloth=H['mesh']('Kitchen_ShortRomanBlind',vv,ff,'linen','ShallowInterior')
    for face in cloth.data.polygons:
        face.use_smooth=True
    mod=cloth.modifiers.new('Opaque woven cloth thickness','SOLIDIFY')
    mod.thickness=.0015
    H['cyl']('Kitchen_BlindHem',(SINK_X-.675,2.182,2.436),(SINK_X+.675,2.182,2.436),.004,'linen',vertices=12)


def fitted_base():
    # Cabinet bottoms/sides/backs, not solid boxes occupying the sink volume.
    for i,xx in enumerate((-2.58,-2.25,-1.325,-.690)):
        H['box'](f'Kitchen_Carcass_RearSide_{i}',(xx,1.928,.925),(.018,.608,.758),bevel=.001)
    H['box']('Kitchen_Carcass_RearBottom',(-1.635,1.928,.556),(1.908,.608,.018),bevel=.001)
    H['box']('Kitchen_Carcass_RearBack',(-1.635,2.224,.925),(1.89,.016,.758),bevel=.001)
    H['box']('Kitchen_Carcass_RearStretcher',(-1.635,2.196,1.282),(1.89,.038,.038),bevel=.001)
    for i,(a,b) in enumerate(((-2.58,-2.25),(-1.325,-.690))):
        H['box'](f'Kitchen_Carcass_FrontStretcher_{i}',((a+b)/2,1.635,1.282),(b-a,.020,.038),bevel=.001)
    for i,yy in enumerate((.545,1.590)):
        H['box'](f'Kitchen_Carcass_ReturnSide_{i}',(-.3645,yy,.925),(.659,.018,.758),bevel=.001)
    H['box']('Kitchen_Carcass_ReturnBottom',(-.3645,1.0675,.556),(.659,1.045,.018),bevel=.001)
    H['box']('Kitchen_Carcass_ReturnTop',(-.3645,1.0675,1.294),(.659,1.045,.016),bevel=.001)
    H['box']('Kitchen_Carcass_ReturnBack',(-.043,1.0675,.925),(.016,1.045,.758),bevel=.001)
    H['box']('Kitchen_Carcass_BlindCorner',(-.3625,1.911,.925),(.655,.642,.758),bevel=.001)
    slab('Kitchen_ContinuousRecessedPlinth',[(-2.57,1.704),(-.618,1.704),(-.618,.545),(-.055,.545),(-.055,2.224),(-2.57,2.224)],F+.005,.553,'black')
    drawer_h=(FRONT_TOP-FRONT_BOTTOM-.006)/3
    for i in range(3):
        low=FRONT_BOTTOM+i*(drawer_h+.003)
        rear_front(f'Kitchen_LeftDrawer_{i}',-2.577,-2.253,low,low+drawer_h,-2.415)
        return_front(f'Kitchen_ReturnDrawer_{i}',.549,1.586,low,low+drawer_h)
    # A fitted false front masks the sink shell above the two lower doors.
    rear_front('Kitchen_SinkFalseFront',-2.247,-1.328,1.130,FRONT_TOP)
    middle=(-2.247-1.328)/2
    rear_front('Kitchen_SinkDoor_Left',-2.247,middle-.0015,FRONT_BOTTOM,1.127,middle-.085)
    rear_front('Kitchen_SinkDoor_Right',middle+.0015,-1.328,FRONT_BOTTOM,1.127,middle+.085)
    H['box']('Kitchen_FittedCornerPost',(-.6915,1.620,.934),(.061,.060,.734),bevel=.0015)
    outline=[(-2.60,1.565),(-.745,1.565),(-.745,.548),(-.010,.548),(-.010,2.245),(-2.60,2.245)]
    top=slab('Kitchen_ContinuousLWorktop',outline,COUNTER_BOTTOM,COUNTER_TOP,'stone')
    H['cut'](top,(SINK_X,SINK_Y,1.33),(.76,.48,.26))
    V2['soft_edges'](top,.002,3)
    # One solid L-shaped upstand, joined at the corner and ending at the fridge.
    upstand=[(-2.60,2.215),(-.040,2.215),(-.040,.548),(-.010,.548),(-.010,2.245),(-2.60,2.245)]
    obj=slab('Kitchen_ContinuousLUpstand',upstand,1.352,1.515,'stone')
    V2['soft_edges'](obj,.0015,2)


def fitted_upper_and_fridge():
    outline=[(-1.03,1.897),(-.375,1.897),(-.375,.545),(-.035,.545),(-.035,2.238),(-1.03,2.238)]
    case=slab('Kitchen_ContinuousUpperCarcass',outline,2.080,2.810)
    V2['soft_edges'](case,.001,2)
    for i,(a,b) in enumerate(((-1.025,-.714),(-.711,-.400))):
        H['box'](f'Kitchen_UpperRearDoor_{i}',((a+b)/2,1.8835,2.445),(b-a,.023,.724),bevel=.0015)
        knob(f'Kitchen_UpperRearDoor_{i}_WoodKnob',((b-.055) if i==0 else (a+.055),1.870,2.150),(0,-1,0))
    lo,hi=.548,1.869
    width=(hi-lo-.006)/3
    for i in range(3):
        a=lo+i*(width+.003)
        b=a+width
        H['box'](f'Kitchen_UpperReturnDoor_{i}',(-.3885,(a+b)/2,2.445),(.023,b-a,.724),bevel=.0015)
        knob(f'Kitchen_UpperReturnDoor_{i}_WoodKnob',(-.402,(a+b)/2,2.150),(-1,0,0))
    # Full-height enclosure and head storage align with the continuous upper run.
    H['box']('Kitchen_FridgeHousing',(-.365,.175,1.615),(.68,.74,2.39),bevel=.002)
    for label,low,high in (('Freezer',.500,1.260),('Main',1.272,2.480)):
        H['box']('Kitchen_Fridge'+label+'Face',(-.735,.175,(low+high)/2),(.050,.662,high-low),'appliance',bevel=.009,segments=3)
        length=.39 if label=='Freezer' else .46
        zz=(low+high)/2
        V2['sweep']('Kitchen_Fridge'+label+'Handle',V2['rounded_path']([(-.762,-.070,zz-length/2),(-.804,-.070,zz-length/2),
                     (-.804,-.070,zz+length/2),(-.762,-.070,zz+length/2)],.013),.010,'steel')
    low,high=-.155,.505
    center=(low+high)/2
    for i,(a,b) in enumerate(((low,center-.0015),(center+.0015,high))):
        H['box'](f'Kitchen_FridgeOverheadDoor_{i}',(-.724,(a+b)/2,2.650),(.023,b-a,.306),bevel=.0015)
        knob(f'Kitchen_FridgeOverheadDoor_{i}_WoodKnob',(-.737,center+(-.052 if i==0 else .052),2.557),(-1,0,0))
    # Small recessed diffusers follow the cabinet underside without entering its faces.
    H['box']('Kitchen_UnderCabinetRearLight',(-.735,2.06,2.077),(.51,.025,.005),'glow',bevel=.001)
    H['box']('Kitchen_UnderCabinetReturnLight',(-.195,1.21,2.077),(.025,1.15,.005),'glow',bevel=.001)


def appliances_and_tap():
    cx=-1.0125
    H['box']('Kitchen_OvenBody',(cx,1.925,.918),(.583,.60,.70),'appliance',bevel=.008)
    H['box']('Kitchen_OvenFrame',(cx,1.592,.930),(.583,.032,.712),'appliance',bevel=.006)
    H['box']('Kitchen_OvenControlPanel',(cx,1.572,1.223),(.555,.012,.126),'steel',bevel=.003)
    H['box']('Kitchen_OvenGlass',(cx,1.570,.883),(.505,.012,.510),'screen',bevel=.005)
    for xx in (cx-.18,cx+.18):
        H['cyl']('Kitchen_OvenDial_'+str(xx),(xx,1.562,1.223),(xx,1.540,1.223),.024,'steel',vertices=24)
        H['box']('Kitchen_OvenDialMark_'+str(xx),(xx,1.538,1.236),(.002,.003,.010),'black',bevel=0)
    H['box']('Kitchen_OvenDisplay',(cx,1.562,1.223),(.096,.003,.033),'screen',bevel=.001)
    for i in range(3):
        H['box']('Kitchen_OvenDisplaySegment_'+str(i),(cx-.028+i*.027,1.560,1.223),(.015,.001,.005),'white',bevel=0)
    V2['sweep']('Kitchen_OvenHandle',V2['rounded_path']([(cx-.215,1.572,1.135),(cx-.215,1.517,1.135),
                  (cx+.215,1.517,1.135),(cx+.215,1.572,1.135)],.014),.011,'steel',sides=20)
    H['box']('Kitchen_Hob',(cx,1.885,1.361),(.545,.46,.014),'screen',bevel=.006)
    for xx in (cx-.13,cx+.13):
        for yy in (1.775,1.995):
            pts=[(xx+.074*math.cos(i*math.tau/32),yy+.074*math.sin(i*math.tau/32),1.370) for i in range(33)]
            V2['sweep'](f'Kitchen_HobRing_{xx}_{yy}',pts,.0015,'steel',sides=6)
    for i in range(3):
        H['cyl']('Kitchen_HobTouch_'+str(i),(cx-.035+i*.035,1.683,1.369),(cx-.035+i*.035,1.683,1.371),.004,'steel',vertices=12)
    H['cyl']('Kitchen_TapBase',(SINK_X,2.155,1.354),(SINK_X,2.155,1.374),.025,'steel',vertices=24)
    path=[(SINK_X,2.155,1.37),(SINK_X,2.155,1.65)]
    path.extend((SINK_X,2.055+.10*math.cos(i*math.pi/20),1.65+.10*math.sin(i*math.pi/20)) for i in range(1,21))
    path.append((SINK_X,1.955,1.62))
    V2['sweep']('Kitchen_TapSpout',path,.015,'steel',inner=.010,sides=24)
    H['cyl']('Kitchen_TapLeverHub',(SINK_X+.012,2.155,1.435),(SINK_X+.055,2.155,1.435),.019,'steel')
    V2['sweep']('Kitchen_TapLever',V2['rounded_path']([(SINK_X+.055,2.155,1.435),(SINK_X+.085,2.155,1.435),
                  (SINK_X+.085,2.155,1.555)],.012),.008,'steel')
    oven_towel(cx)


def oven_towel(cx):
    stripe=bpy.data.materials.get('FixedKitchenTowelStripe') or H['material']('towel_stripe','FixedKitchenTowelStripe',(.36,.095,.067),.96)
    profile=[(1.532,.930),(1.532,1.125)]
    profile.extend((1.517+.013*math.cos(i*math.pi/16),1.135+.013*math.sin(i*math.pi/16)) for i in range(17))
    profile.extend(((1.502,1.02),(1.503,.88),(1.503,.757)))
    cols=40
    vv,ff=[],[]
    for j,(y,z) in enumerate(profile):
        for i in range(cols+1):
            x=cx-.13+i*.26/cols
            fold=.002*math.sin(i*.65)*(1 if j>17 else .35)
            vv.append((x,y+fold,z+.0012*math.cos(i*.45)))
    for j in range(len(profile)-1):
        for i in range(cols):
            k=j*(cols+1)+i
            ff.append((k,k+1,k+cols+2,k+cols+1))
    cloth=H['mesh']('Kitchen_OvenTeaTowel',vv,ff,'linen','ShallowInterior')
    cloth.data.materials.append(stripe)
    for index,face in enumerate(cloth.data.polygons):
        face.material_index=1 if index%cols in (3,5,34,36) else 0
        face.use_smooth=True
    mod=cloth.modifiers.new('Woven towel thickness','SOLIDIFY')
    mod.thickness=.0012


def outlet(name, axis, plane, u, z):
    def p(du,offset,dz):
        return (u+du,plane+offset,z+dz) if axis=='x' else (plane+offset,u+du,z+dz)
    size=(.082,.012,.078) if axis=='x' else (.012,.082,.078)
    H['box'](name+'_Plate',p(0,0,0),size,'white',bevel=.004,segments=3)
    H['cyl'](name+'_Recess',p(0,-.007,0),p(0,-.009,0),.026,'black',vertices=28)
    H['cyl'](name+'_Insert',p(0,-.0095,0),p(0,-.012,0),.0235,'white',vertices=28)
    for sign in (-1,1):
        H['cyl'](name+'_PinHole_'+str(sign),p(sign*.009,-.0125,0),p(sign*.009,-.014,0),.0037,'black',vertices=12)
    dims=(.010,.002,.003) if axis=='x' else (.002,.010,.003)
    for sign in (-1,1):
        H['box'](name+'_EarthTab_'+str(sign),p(0,-.013,sign*.020),dims,'steel',bevel=.0004)


def accessories():
    outlet('Kitchen_OutletRear','x',2.248,-.825,1.688)
    outlet('Kitchen_OutletReturn','y',-.012,1.04,1.688)
    H['box']('Kitchen_ChoppingBoard',(-2.407,1.87,1.368),(.270,.260,.028),bevel=.012,segments=3)
    V2['lathe']('Kitchen_SoapBottle',[(0,0),(.026,0),(.029,.025),(.027,.084),(.015,.106),(.014,.115)],(-2.41,2.115,1.354),'ceramic')
    H['cyl']('Kitchen_SoapPumpStem',(-2.41,2.115,1.468),(-2.41,2.115,1.485),.006,'steel')
    V2['sweep']('Kitchen_SoapPumpNozzle',[(-2.425,2.115,1.485),(-2.365,2.115,1.485),(-2.361,2.115,1.477)],.004,'steel',sides=10)
    # Slender vase between sink and hob, sitting directly on the clear countertop.
    vx,vy=-1.346,2.095
    V2['lathe']('Kitchen_BotanicalVase',[(0,0),(.031,0),(.041,.030),(.035,.132),(.025,.176),
                 (.021,.180),(.019,.172),(.030,.13),(.035,.03),(0,.008)],(vx,vy,1.354),'glass')
    for i in range(7):
        a=i*2.399
        end=Vector((vx+.057*math.cos(a),vy+.063*math.sin(a),1.70+.020*(i%4)))
        start=Vector((vx,vy,1.389))
        V2['sweep'](f'Kitchen_BotanicalStem_{i}',[start,end],.0014,'soil',sides=8)
        for j in (0,1):
            p=start.lerp(end,.70+j*.18)
            p.x+=(-1 if j else 1)*.010
            small_leaf(f'Kitchen_BotanicalLeaf_{i}_{j}',p,(.009,.026,.0024),a+(-.5 if j else .5))
    # Utensils sit on the deep blind-corner portion, clear of all wall faces.
    ux,uy=-.29,2.045
    V2['lathe']('Kitchen_UtensilCup',[(0,0),(.037,0),(.043,.11),(.043,.14),(.037,.14),(.034,.012),(0,.012)],(ux,uy,1.354),'steel')
    for i in range(3):
        xx=ux-.021+i*.021
        H['cyl'](f'Kitchen_UtensilShaft_{i}',(xx,uy,1.390),(xx-.020+i*.012,uy,1.635),.005,'wood')
        spoon=H['sphere'](f'Kitchen_UtensilSpoon_{i}',(xx-.020+i*.012,uy,1.665),(.013,.005,.030),'wood',14,8)
        spoon.rotation_euler.y=(i-1)*.10
    fruit_bowl()
    french_press()


def fruit_bowl():
    H['material']('fruit_red','FixedKitchenAppleRed',(.39,.046,.027),.38)
    H['material']('fruit_gold','FixedKitchenPearGold',(.57,.35,.065),.50)
    H['material']('fruit_green','FixedKitchenAppleGreen',(.29,.38,.07),.42)
    x,y,z=-.39,.975,1.354
    # Thin metal bowl with a real open interior.
    V2['lathe']('Kitchen_FruitBowl',[(0,0),(.065,0),(.071,.009),(.123,.045),(.157,.072),
                 (.157,.077),(.151,.077),(.118,.050),(.065,.012),(0,.012)],(x,y,z),'steel',40)
    for i,(dx,dy,mat) in enumerate(((-.060,-.029,'fruit_red'),(.042,-.037,'fruit_green'),(-.008,.052,'fruit_red'))):
        H['sphere'](f'Kitchen_FruitApple_{i}',(x+dx,y+dy,z+.055),(.043,.042,.043),mat,20,12)
        H['cyl'](f'Kitchen_FruitStem_{i}',(x+dx,y+dy,z+.091),(x+dx+.003,y+dy,z+.104),.0018,'soil',vertices=8)
    V2['lathe']('Kitchen_FruitPear',[(0,0),(.025,.004),(.034,.025),(.031,.05),(.017,.076),(.011,.094),(0,.097)],(x+.06,y+.054,z+.022),'fruit_gold',24)
    H['cyl']('Kitchen_FruitPearStem',(x+.06,y+.054,z+.115),(x+.064,y+.054,z+.131),.002,'soil',vertices=8)


def french_press():
    x,y,z=-1.143,1.995,1.369
    V2['lathe']('Kitchen_CoffeePressGlass',[(0,0),(.044,0),(.048,.008),(.048,.126),(.043,.126),(.042,.012),(0,.012)],(x,y,z),'glass',32)
    H['cyl']('Kitchen_CoffeePressCoffee',(x,y,z+.013),(x,y,z+.077),.040,'soil',vertices=32)
    H['cyl']('Kitchen_CoffeePressBase',(x,y,z-.001),(x,y,z+.008),.050,'steel',vertices=32)
    H['cyl']('Kitchen_CoffeePressLid',(x,y,z+.125),(x,y,z+.136),.052,'steel',vertices=32)
    H['cyl']('Kitchen_CoffeePressRod',(x,y,z+.012),(x,y,z+.170),.003,'steel',vertices=12)
    H['sphere']('Kitchen_CoffeePressKnob',(x,y,z+.174),(.013,.013,.008),'black',14,8)
    V2['sweep']('Kitchen_CoffeePressHandle',V2['rounded_path']([(x+.048,y,z+.111),(x+.082,y,z+.105),
                  (x+.082,y,z+.028),(x+.048,y,z+.022)],.012),.006,'black',sides=12)


def kitchen_revision():
    bind()
    scene=bpy.context.scene
    if not scene.get('revision4_furnishings_done') or scene.get('revision4_kitchen_done'):
        raise RuntimeError('Complete furnishing_fixes() once, then kitchen_revision() once.')
    archive(prefixes=('Kitchen_',))
    # Existing repaired metal bowl/drain stay intact; only their placement changes.
    V2['move'](('Sink_',),(-.51,0,0))
    window_and_blind()
    fitted_base()
    fitted_upper_and_fridge()
    appliances_and_tap()
    accessories()
    bpy.context.view_layer.update()
    # Continuous veneer coordinates across neighboring fronts, retaining the
    # original map scale and independent material preset contract.
    for obj in V2['live']():
        if obj.type!='MESH' or not obj.name.startswith('Kitchen_'):
            continue
        if len(obj.data.materials)!=1 or obj.data.materials[0].name!='InteriorJoinery':
            continue
        layer=obj.data.uv_layers.active
        if layer is None:
            continue
        for face in obj.data.polygons:
            normal=obj.matrix_world.to_3x3()@face.normal
            for index in face.loop_indices:
                co=obj.matrix_world@obj.data.vertices[obj.data.loops[index].vertex_index].co
                a,b=(co.y,co.x) if abs(normal.z)>.5 else ((co.y,co.z) if abs(normal.x)>abs(normal.y) else (co.x,co.z))
                layer.data[index].uv=(a/1.83,b/1.83)
    for prefix in ('Kitchen_Carcass_','Kitchen_Botanical','Kitchen_Fruit','Kitchen_CoffeePress','Kitchen_Utensil',
                   'Kitchen_OutletRear','Kitchen_OutletReturn','Kitchen_HobRing_','Kitchen_OvenDisplaySegment_',
                   'Kitchen_OvenDialMark_','Kitchen_HobTouch_'):
        H['consolidate'](prefix,prefix.rstrip('_'))
    scene['revision4_kitchen_done']=True
    scene['revision_number']=4
    scene['revision']='Revision 4: fitted detailed kitchen, shifted window, storage and plant corrections; awaiting user review'
    scene['poster_current']=False
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'veyra-source.blend'),compress=True)
    return {'status':'revision 4 authored; no renders, screenshots or tests','backup':scene['revision4_backup']}
