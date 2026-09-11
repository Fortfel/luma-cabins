"""Authored Niva feasibility model. Run inside Blender, never against unrelated work.

MCP: exec(compile(open(script_path).read(), script_path, 'exec'))
The entry point builds only. Review rendering/export are explicit subsequent calls.
All geometry is inferred concept geometry, not architectural documentation.
"""

import importlib.util
import math
from pathlib import Path
from types import SimpleNamespace

import bmesh
import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[1]
WIDTH = 3.7
DEPTH = 4.5
FLOOR = 0.55
EAVE = 3.8
PEAK = 6.0
SLOPE = (PEAK - EAVE) / (WIDTH / 2)
COLLECTIONS = ('Architecture', 'Glazing', 'ExteriorDetails', 'ShallowInterior', 'Lights', 'ReviewStaging')
MODEL_COLLECTIONS = COLLECTIONS[:4]
SCENE_NAME = 'Niva_Source'


def material(name, color, roughness=0.5, metallic=0, emission=None, strength=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    if emission:
        shader.inputs['Emission Color'].default_value = (*emission, 1)
        shader.inputs['Emission Strength'].default_value = strength
    mat.diffuse_color = (*color, 1)
    return mat


def wood_textures():
    files = {
        'cladding': 'niva-natural-cladding-2k.jpg',
        'oak': 'niva-light-oak-2k.jpg',
        'oak_normal': 'polyhaven/oak_veneer_01/oak_veneer_01_nor_gl_2k.jpg',
        'oak_orm': 'oak_veneer_01-orm.png',
        'floor': 'polyhaven/wood_floor/wood_floor_diff_2k.jpg',
        'floor_normal': 'polyhaven/wood_floor/wood_floor_nor_gl_2k.jpg',
        'floor_orm': 'wood_floor-orm.png',
        'fabric': 'niva-sage-linen-512.jpg',
    }
    images = {}
    for key, filename in files.items():
        path = ROOT / 'textures' / filename
        if not path.exists():
            raise RuntimeError('Run scripts/prepare-textures.py before the Blender build')
        image = bpy.data.images.load(str(path), check_existing=False)
        image.colorspace_settings.name = 'Non-Color' if key.endswith(('_normal', '_orm')) else 'sRGB'
        image.pack()
        images[key] = image
    return images


def texture_material(mat, color_image, normal_image=None, orm_image=None):
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    shader = nodes.get('Principled BSDF')
    tex = nodes.new('ShaderNodeTexImage')
    tex.image = color_image
    tex.label = 'CC0 Poly Haven / documented material-only derivative'
    links.new(tex.outputs['Color'], shader.inputs['Base Color'])
    if normal_image:
        tex_normal = nodes.new('ShaderNodeTexImage')
        tex_normal.image = normal_image
        normal = nodes.new('ShaderNodeNormalMap')
        normal.inputs['Strength'].default_value = 0.25
        links.new(tex_normal.outputs['Color'], normal.inputs['Color'])
        links.new(normal.outputs['Normal'], shader.inputs['Normal'])
    if orm_image:
        tex_orm = nodes.new('ShaderNodeTexImage')
        tex_orm.image = orm_image
        separate = nodes.new('ShaderNodeSeparateColor')
        links.new(tex_orm.outputs['Color'], separate.inputs['Color'])
        links.new(separate.outputs['Green'], shader.inputs['Roughness'])
        links.new(separate.outputs['Blue'], shader.inputs['Metallic'])


def move_to(obj, collection):
    for existing in list(obj.users_collection):
        existing.objects.unlink(obj)
    bpy.data.collections[collection].objects.link(obj)
    return obj


def finish(obj, name, mat, collection='Architecture', bevel=0):
    obj.name = name
    obj.data.name = name
    move_to(obj, collection)
    obj.data.materials.append(mat)
    if bevel:
        modifier = obj.modifiers.new('Small edge highlights', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 2
    return obj


def box(name, location, scale, mat, collection='Architecture', bevel=0.008, rotation=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if rotation:
        obj.rotation_euler = rotation
    return finish(obj, name, mat, collection, bevel)


def cylinder(name, a, b, radius, mat, collection='ExteriorDetails', vertices=16):
    direction = Vector(b) - Vector(a)
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=direction.length,
                                      location=(Vector(a) + Vector(b)) / 2)
    obj = bpy.context.object
    obj.rotation_euler = direction.to_track_quat('Z', 'Y').to_euler()
    finish(obj, name, mat, collection, 0 if radius < 0.015 or direction.length < 0.012 else 0.003)
    for poly in obj.data.polygons:
        poly.use_smooth = len(poly.vertices) == 4
    return obj


def beam(name, a, b, width, depth, mat, collection='ExteriorDetails'):
    direction = Vector(b) - Vector(a)
    obj = box(name, (Vector(a) + Vector(b)) / 2, (width, depth, direction.length), mat, collection)
    obj.rotation_euler = direction.to_track_quat('Z', 'Y').to_euler()
    return obj


def prism(name, outline, y_center, thickness, mat):
    n = len(outline)
    vertices = [(x, y_center + side * thickness / 2, z) for side in (-1, 1) for x, z in outline]
    faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))]
    faces.extend((i, (i + 1) % n, (i + 1) % n + n, i + n) for i in range(n))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.data.collections['Architecture'].objects.link(obj)
    obj.data.materials.append(mat)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(mesh)
    bm.free()
    return obj


def cut(obj, location, dimensions):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    cutter = bpy.context.object
    cutter.scale = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    modifier = obj.modifiers.new('Documented opening', 'BOOLEAN')
    modifier.operation = 'DIFFERENCE'
    modifier.solver = 'EXACT'
    modifier.object = cutter
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


def project_uv(obj, side=False, horizontal=False, raw=False):
    uv = obj.data.uv_layers.get('UVMap') or obj.data.uv_layers.new(name='UVMap')
    for polygon in obj.data.polygons:
        for loop_id in polygon.loop_indices:
            co = obj.matrix_world @ obj.data.vertices[obj.data.loops[loop_id].vertex_index].co
            if 'ContinuousTimberBarge' in obj.name:
                u = (co.z + abs(co.x) * SLOPE - 5.82) / 1.83
                v = abs(co.x) * math.sqrt(1 + SLOPE * SLOPE) / 1.83
            elif horizontal:
                u, v = co.y / 1.83, co.x / 1.83
            else:
                if abs(polygon.normal.z) < 0.5 and abs(polygon.normal.x) >= abs(polygon.normal.y):
                    u = co.y / 1.83
                elif abs(polygon.normal.z) < 0.5:
                    u = co.x / 1.83
                else:
                    u = (co.y if side else co.x) / 1.83
                v = co.z / 1.83
            uv.data[loop_id].uv = (u, v)


def window(name, center, width, height, mats, side=False, double=False):
    x, y, z = center
    frame = 0.075 if double else 0.065
    def part(suffix, u, v, w, h, mat, depth=0.12, collection='ExteriorDetails'):
        location = (x, y + u, z + v) if side else (x + u, y, z + v)
        dimensions = (depth, w, h) if side else (w, depth, h)
        return box(f'{name}_{suffix}', location, dimensions, mat, collection, 0.007)
    for sign, label in ((-1, 'Left'), (1, 'Right')):
        part(label, sign * (width - frame) / 2, 0, frame, height, mats['frame'])
        part('Sill' if sign < 0 else 'Head', 0, sign * (height - frame) / 2, width, frame, mats['frame'])
    inner_width = width - frame * 2
    if double:
        part('CentralMeetingStile', 0, 0, 0.095, height - frame * 2, mats['frame'])
        for sign in (-1, 1):
            part(f'Glass_{sign}', sign * (inner_width + 0.095) / 4, 0,
                 (inner_width - 0.095) / 2, height - 2 * frame, mats['glass'], 0.008, 'Glazing')
            part(f'Lever_{sign}', sign * 0.105, -0.18, 0.024, 0.24, mats['frame'], 0.20)
    else:
        part('Glass', 0, 0, inner_width, height - 2 * frame, mats['glass'], 0.008, 'Glazing')
    part('DripSill', 0, -height / 2 - 0.018, width + 0.055, 0.032, mats['frame'], 0.19)


def area(name, location, target, power, size, color=(1, 1, 1), size_y=None):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy, data.color = power, color
    data.shape = 'RECTANGLE' if size_y else 'DISK'
    data.size = size
    if size_y:
        data.size_y = size_y
    obj = bpy.data.objects.new(name, data)
    bpy.data.collections['Lights'].objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()
    return obj


def camera_view(angle=-32.641288, distance=16.321986, elevation=-3.339708, target=(0, -0.27, 3.02)):
    cam = bpy.data.objects['Niva_CanonicalCamera']
    theta, phi = math.radians(angle), math.radians(elevation)
    cam.location = Vector(target) + Vector((math.sin(theta) * math.cos(phi),
                                           -math.cos(theta) * math.cos(phi), math.sin(phi))) * distance
    cam.rotation_euler = (Vector(target) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.view_layer.update()
    return cam


def setup_scene():
    # Preflight proved the connected scene untouched and preserved it before this call.
    if bpy.data.filepath and not Path(bpy.data.filepath).is_relative_to(ROOT):
        raise RuntimeError('Refusing to replace a file outside the Niva spike')
    if not bpy.data.filepath and bpy.data.is_dirty:
        raise RuntimeError('Preserve the unsaved Blender work before building Niva')
    scene = bpy.data.scenes.new(SCENE_NAME)
    bpy.context.window.scene = scene
    for old in list(bpy.data.scenes):
        if old != scene:
            bpy.data.scenes.remove(old)
    scene.name = SCENE_NAME
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for collection in list(bpy.data.collections):
        bpy.data.collections.remove(collection)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)
    for image in list(bpy.data.images):
        if image.name.startswith('niva-'):
            bpy.data.images.remove(image)
    for name in COLLECTIONS:
        scene.collection.children.link(bpy.data.collections.new(name))
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x, scene.render.resolution_y = 954, 866
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.film_transparent = True
    scene.render.use_motion_blur = False
    scene.eevee.taa_render_samples = 96
    scene.eevee.use_raytracing = True
    scene.eevee.use_fast_gi = True
    scene.eevee.fast_gi_method = 'AMBIENT_OCCLUSION_ONLY'
    scene.eevee.fast_gi_distance = 3
    scene.eevee.fast_gi_quality = 0.75
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    scene.world = bpy.data.worlds.new('Niva_NeutralStudio')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.68, 0.73, 0.8, 1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.18
    return scene


def build():
    for directory in ('textures', 'renders', 'validation'):
        (ROOT / directory).mkdir(parents=True, exist_ok=True)
    scene = setup_scene()
    images = wood_textures()
    mats = {
        'cladding': material('ExteriorCladding', (0.52, 0.29, 0.13), 0.67),
        'joinery': material('InteriorJoinery', (0.64, 0.45, 0.23), 0.54),
        'timber': material('FixedArchitecturalTimber', (0.43, 0.23, 0.095), 0.6),
        'deck': material('DeckTimber', (0.42, 0.23, 0.105), 0.66),
        'roof': material('StandingSeamRoof', (0.018, 0.022, 0.025), 0.62, 0),
        'frame': material('BlackFramesAndFixtures', (0.014, 0.018, 0.018), 0.34, 0.52),
        'base': material('FoundationSteel', (0.018, 0.021, 0.019), 0.7, 0.35),
        'solar': material('SolarCells', (0.012, 0.017, 0.027), 0.52, 0),
        'solarline': material('SolarCellConductors', (0.035, 0.041, 0.049), 0.8, 0),
        'glass': material('Glazing', (0.07, 0.11, 0.13), 0.16),
        'wall': material('FixedInteriorLining', (0.72, 0.69, 0.60), 0.84, emission=(0.45, 0.39, 0.28), strength=0.025),
        'floor': material('FixedInteriorFloor', (0.36, 0.21, 0.105), 0.68),
        'fabric': material('LinenUpholstery', (0.22, 0.27, 0.23), 0.95),
        'bedding': material('LoftBedding', (0.74, 0.64, 0.46), 0.93, emission=(0.38, 0.25, 0.12), strength=0.035),
        'ceramic': material('WarmCeramic', (0.43, 0.28, 0.14), 0.75),
        'leaves': material('Foliage', (0.09, 0.15, 0.032), 0.76),
        'light': material('WarmDiffusers', (0.95, 0.65, 0.31), 0.5, emission=(1.0, 0.58, 0.22), strength=2.5),
        'counter': material('DarkStoneWorktop', (0.021, 0.024, 0.025), 0.38),
        'curtain': material('OpaqueFlaxPrivacyBlind', (0.56, 0.48, 0.34), 0.95),
        'rug': material('FixedWovenRug', (0.50, 0.43, 0.31), 0.98),
        'rugstripe': material('FixedTerracottaRugStripe', (0.24, 0.095, 0.056), 0.97),
        'stove': material('StoveCastIron', (0.025, 0.029, 0.029), 0.57, 0.18),
        'fireglass': material('StoveDoorGlass', (0.008, 0.012, 0.012), 0.20, 0.1),
        'paper': material('PaperAndLinenDetails', (0.82, 0.79, 0.68), 0.92),
    }
    texture_material(mats['cladding'], images['cladding'], images['oak_normal'], images['oak_orm'])
    for key in ('joinery', 'timber', 'deck'):
        texture_material(mats[key], images['oak'], images['oak_normal'], images['oak_orm'])
    texture_material(mats['floor'], images['floor'], images['floor_normal'], images['floor_orm'])
    texture_material(mats['fabric'], images['fabric'])
    for key in ('roof', 'solar'):
        mats[key].node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value = 0.12
    mats['solar'].node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value = 0.025
    mats['solarline'].node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value = 0.08
    glass_shader = mats['glass'].node_tree.nodes.get('Principled BSDF')
    glass_shader.inputs['Alpha'].default_value = 0.09
    glass_shader.inputs['IOR'].default_value = 1.45
    mats['glass'].surface_render_method = 'BLENDED'
    mats['glass'].use_transparency_overlap = False
    mats['glass'].diffuse_color = (0.07, 0.11, 0.13, 0.09)
    half_width, half_depth = WIDTH / 2, DEPTH / 2
    outline = [(-half_width, FLOOR), (half_width, FLOOR), (half_width, EAVE), (0, PEAK), (-half_width, EAVE)]
    front = prism('Front_GableCladding', outline, -half_depth, 0.16, mats['cladding'])
    cut(front, (0, -half_depth, 1.91), (2.52, 0.8, 2.68))
    cut(front, (0, -half_depth, 4.55), (0.78, 0.8, 1.12))
    rear = prism('Rear_KitchenWindowCladding', outline, half_depth, 0.16, mats['cladding'])
    cut(rear, (0.63, half_depth, 2.28), (0.66, 0.8, 0.80))
    project_uv(front)
    project_uv(rear)
    for sign, label in ((-1, 'Left'), (1, 'Right')):
        side = box(f'{label}_SideCladding', (sign * (half_width - 0.08), 0, (FLOOR + EAVE) / 2),
                   (0.16, DEPTH, EAVE - FLOOR), mats['cladding'], bevel=0)
        # Revised brief: a screened WC window at left/rear, living window at right/front.
        window_y, window_width, window_height = (1.38, 0.62, 0.80) if sign < 0 else (-0.86, 1.25, 1.42)
        cut(side, (sign * half_width, window_y, 2.28), (0.8, window_width, window_height))
        project_uv(side, side=True)
        window(f'{label}_Window', (sign * (half_width + 0.012), window_y, 2.28), window_width, window_height, mats, side=True)
        lining = box(f'{label}_InteriorLining', (sign * (half_width - 0.17), 0, (FLOOR + EAVE) / 2),
                     (0.04, DEPTH - 0.16, EAVE - FLOOR), mats['wall'], 'ShallowInterior', 0)
        cut(lining, (sign * half_width, window_y, 2.28), (0.9, window_width, window_height))
    window('Front_DoubleDoor', (0, -half_depth - 0.045, 1.91), 2.52, 2.68, mats, double=True)
    window('Front_LoftWindow', (0, -half_depth - 0.045, 4.55), 0.78, 1.12, mats)
    window('Rear_KitchenWindow', (0.63, half_depth + 0.045, 2.28), 0.66, 0.80, mats)
    rear_lining = box('Interior_RearLining', (0, half_depth - 0.11, 2.17), (WIDTH - 0.3, 0.055, 3.24), mats['wall'], 'ShallowInterior', 0)
    cut(rear_lining, (0.63, half_depth, 2.28), (0.66, 0.8, 0.80))
    front_lining = prism('Interior_FrontLining', outline, -half_depth + 0.11, 0.04, mats['wall'])
    move_to(front_lining, 'ShallowInterior')
    cut(front_lining, (0, -half_depth, 1.91), (2.52, 0.8, 2.68))
    cut(front_lining, (0, -half_depth, 4.55), (0.78, 0.8, 1.12))
    box('FloorStructure', (0, 0, FLOOR - 0.12), (WIDTH, DEPTH, 0.24), mats['base'])
    box('Interior_Floor', (0, 0, FLOOR + 0.016), (WIDTH - 0.2, DEPTH - 0.2, 0.032), mats['floor'], 'ShallowInterior')
    for x in (-1.56, 0, 1.56):
        for y in (-1.92, 0, 1.92):
            box(f'FoundationPier_{x}_{y}', (x, y, 0.19), (0.20, 0.23, 0.38), mats['base'])
    for x in (-1.5, 1.5):
        box(f'FoundationRunner_{x}', (x, 0, 0.39), (0.14, DEPTH + 0.02, 0.18), mats['base'])
    for index in range(6):
        deck = box(f'DeckBoard_{index:02}', (0, -half_depth - 0.095 - index * 0.158, FLOOR - 0.035),
                   (WIDTH + 0.28, 0.151, 0.10), mats['deck'], bevel=0.009)
        project_uv(deck, horizontal=True)
    box('DeckFrontFascia', (0, -3.16, 0.40), (WIDTH + 0.28, 0.12, 0.23), mats['base'])
    for x in (-1.72, 1.72):
        box(f'DeckSupport_{x}', (x, -3.04, 0.22), (0.19, 0.2, 0.44), mats['base'])
    for index, top in enumerate((0.38, 0.205, 0.055)):
        y = -3.27 - index * 0.265
        box(f'StairRiser_{index}', (0.99, y, top / 2), (1.9, 0.28, top), mats['deck'])
        obj = box(f'StairTread_{index}', (0.99, y - 0.025, top), (1.98, 0.31, 0.06), mats['deck'])
        project_uv(obj, horizontal=True)
    roof_angle = math.atan(SLOPE)
    roof_half = half_width + 0.20
    roof_length = math.hypot(roof_half, roof_half * SLOPE)
    for sign, label in ((-1, 'Left'), (1, 'Right')):
        x = sign * roof_half / 2
        z = PEAK - roof_half / 2 * SLOPE + 0.04
        box(f'{label}_RoofPlane', (x, 0, z), (roof_length, DEPTH + 0.4, 0.105), mats['roof'],
            rotation=(0, sign * roof_angle, 0))
        box(f'{label}_InteriorRoofLining', (sign * half_width / 2, 0, PEAK - half_width / 2 * SLOPE - 0.085),
            (math.hypot(half_width, half_width * SLOPE), DEPTH - 0.15, 0.045), mats['wall'], 'ShallowInterior',
            rotation=(0, sign * roof_angle, 0))
        for i in range(14):
            y = -2.39 + i * (4.78 / 13)
            beam(f'{label}_StandingSeam_{i:02}', (sign * 0.06, y, PEAK - 0.06 * SLOPE + 0.16),
                 (sign * roof_half, y, PEAK - roof_half * SLOPE + 0.16), 0.029, 0.029, mats['roof'])
        gutter_z = PEAK - roof_half * SLOPE + 0.02
        cylinder(f'{label}_Gutter', (sign * (roof_half + 0.035), -2.48, gutter_z),
                 (sign * (roof_half + 0.035), 2.48, gutter_z), 0.062, mats['roof'])
        cylinder(f'{label}_Downspout', (sign * 1.93, 2.14, 0.46), (sign * 1.93, 2.14, gutter_z - 0.16), 0.042, mats['roof'])
        cylinder(f'{label}_GutterElbow', (sign * (roof_half + 0.035), 2.14, gutter_z),
                 (sign * 1.93, 2.14, gutter_z - 0.16), 0.044, mats['roof'])
        cylinder(f'{label}_DownspoutOutlet', (sign * 1.93, 2.14, 0.46),
                 (sign * 2.04, 2.28, 0.34), 0.042, mats['roof'])
    cylinder('RidgeCap', (0, -2.48, PEAK + 0.08), (0, 2.48, PEAK + 0.08), 0.065, mats['roof'])
    # Closed V-shaped extrusions eliminate the short, square-ended barge-board apex gap.
    for sign, end in ((-1, 'Front'), (1, 'Rear')):
        for label, upper, lower, depth, y, mat in (
            ('ContinuousTimberBarge', 6.08, 5.82, 0.18, sign * 2.46, mats['timber']),
            ('ContinuousMetalRoofEdge', 6.17, 6.065, 0.075, sign * 2.575, mats['roof']),
        ):
            edge = 2.08
            contour = [(-edge, upper - edge * SLOPE), (0, upper), (edge, upper - edge * SLOPE),
                       (edge, lower - edge * SLOPE), (0, lower), (-edge, lower - edge * SLOPE)]
            fascia = prism(f'{end}_{label}', contour, y, depth, mat)
            move_to(fascia, 'ExteriorDetails')
            project_uv(fascia)
    # A modest array follows the left roof, not a camera-facing decal.
    for row in range(2):
        x = -0.66 - row * 0.63
        for col in range(4):
            y = -1.56 + col * 1.04
            z = PEAK + x * SLOPE + 0.145
            rotation = (0, -roof_angle, 0)
            box(f'SolarModule_{row}_{col}_Frame', (x, y, z), (0.925, 0.985, 0.046), mats['roof'],
                'ExteriorDetails', 0.003, rotation)
            panel = box(f'SolarModule_{row}_{col}_Cells', (x - 0.031, y, z + 0.026), (0.88, 0.943, 0.008),
                        mats['solar'], 'ExteriorDetails', 0.002, rotation)
            matrix = panel.rotation_euler.to_matrix()
            for line in range(1, 6):
                loc = panel.location + matrix @ Vector((0, -0.943 / 2 + line * 0.943 / 6, 0.006))
                box(f'SolarGrid_{row}_{col}_{line}', loc, (0.876, 0.005, 0.003), mats['solarline'],
                    'ExteriorDetails', 0, rotation)
            for line in (-1, 0, 1):
                loc = panel.location + matrix @ Vector((line * 0.22, 0, 0.006))
                box(f'SolarBus_{row}_{col}_{line}', loc, (0.003, 0.94, 0.003), mats['solarline'],
                    'ExteriorDetails', 0, rotation)
    chimney_x, chimney_y = 1.6, -2.0
    roof_z = PEAK - chimney_x * SLOPE
    box('ChimneyFlashing', (chimney_x, chimney_y, roof_z + 0.09), (0.48, 0.42, 0.045), mats['roof'],
        'ExteriorDetails', rotation=(0, roof_angle, 0))
    cylinder('Chimney', (chimney_x, chimney_y, roof_z), (chimney_x, chimney_y, 5.57), 0.079, mats['roof'])
    cylinder('ChimneyCowlStem', (chimney_x, chimney_y, 5.57), (chimney_x, chimney_y, 5.65), 0.055, mats['frame'])
    cylinder('ChimneyCowl', (chimney_x, chimney_y, 5.65), (chimney_x, chimney_y, 5.715), 0.115, mats['roof'])
    box('FrontCanopy', (0, -2.45, 3.48), (2.96, 0.48, 0.15), mats['roof'], 'ExteriorDetails')
    box('FrontCanopyTimberSoffit', (0, -2.45, 3.385), (2.88, 0.43, 0.04), mats['timber'], 'ExteriorDetails')
    for x in (-1.48, 1.48):
        box(f'SconceHousing_{x}', (x, -2.38, 2.9), (0.085, 0.105, 0.22), mats['frame'], 'ExteriorDetails')
        box(f'SconceDiffuser_{x}', (x, -2.385, 2.782), (0.062, 0.068, 0.014), mats['light'], 'ExteriorDetails')
        area(f'SconceReviewLight_{x}', (x, -2.40, 2.77), (x, -2.3, 2.0), 5, 0.08, (1, 0.61, 0.27))
    build_interior(mats)
    area('Studio_Key', (-5, -6, 9), (0, 0, 2.4), 900, 6.0, (1, 0.91, 0.79))
    area('Studio_Fill', (5, -4, 6), (0, 0, 2.8), 650, 5.0, (0.80, 0.88, 1))
    area('Studio_RearSoftbox', (0, 6, 8), (0, 0, 2.8), 1200, 5.0, (1, 0.94, 0.84))
    data = bpy.data.cameras.new('Niva_CanonicalCamera')
    # Approximate fit to five source landmarks; the small lens reduction avoids edge clipping.
    data.lens = 66.441177
    data.shift_x = 0.09328
    data.shift_y = -0.00103594
    camera = bpy.data.objects.new('Niva_CanonicalCamera', data)
    bpy.data.collections['ReviewStaging'].objects.link(camera)
    scene.camera = camera
    camera_view()
    root = bpy.data.objects.new('Niva', None)
    bpy.data.collections['Architecture'].objects.link(root)
    root.scale = (1.1436876, 1.2007907, 1)
    root['axis_convention'] = 'Blender: front -Y, up +Z; glTF: front +Z, up +Y'
    root['concept_only'] = True
    root['InteriorJoinery_contract'] = 'Proposed 3D boundary; not existing website behavior'
    for name in MODEL_COLLECTIONS:
        for obj in bpy.data.collections[name].objects:
            if obj != root:
                obj.parent = root
    for obj in bpy.data.collections['Lights'].objects:
        if obj.name.startswith(('Sconce', 'Interior_', 'Loft_')):
            obj.location.x *= root.scale.x
            obj.location.y *= root.scale.y
    bpy.ops.object.select_all(action='DESELECT')
    root.select_set(True)
    bpy.context.view_layer.objects.active = root
    for screen in bpy.data.screens:
        for space in screen.areas:
            if space.type == 'VIEW_3D':
                space.spaces.active.region_3d.view_perspective = 'CAMERA'
    # Keep the latest user-requested layout reproducible without replacing inspected scene work.
    helpers = SimpleNamespace(box=box, prism=prism, cut=cut, project_uv=project_uv, cylinder=cylinder, material=material, area=area)
    for filename in ('adjust-layout-review.py', 'fix-surface-review.py', 'fix-ceiling-review.py'):
        spec = importlib.util.spec_from_file_location('niva_' + filename.replace('-', '_'), ROOT / 'scripts' / filename)
        adjustment = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(adjustment)
        adjustment.apply(helpers)
    towel = bpy.data.objects.get('KitchenHangingTeaTowel')
    if towel:
        bpy.data.objects.remove(towel, do_unlink=True)
    root['kitchen_towel_removed'] = True
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'niva.blend'))
    print('NIVA_BUILD_COMPLETE')


def build_interior(mats):
    collection = 'ShallowInterior'
    def furnishing(name, loc, dims, material_id='joinery', bevel=0.015, rotation=None):
        obj = box(name, loc, dims, mats[material_id], collection, bevel, rotation)
        if material_id in ('fabric', 'bedding') and bevel >= 0.04:
            obj.modifiers['Small edge highlights'].segments = 6
            for polygon in obj.data.polygons:
                polygon.use_smooth = True
            obj.modifiers.new('Soft furniture normals', 'WEIGHTED_NORMAL')
        return obj

    def tube(name, points, radius, mat='frame'):
        curve = bpy.data.curves.new(name, 'CURVE')
        curve.dimensions = '3D'
        curve.bevel_depth, curve.bevel_resolution = radius, 3
        curve.use_fill_caps = True
        is_closed = points[0] == points[-1]
        if is_closed:
            points = points[:-1]
        spline = curve.splines.new('POLY')
        spline.use_cyclic_u = is_closed
        spline.points.add(len(points) - 1)
        for point, position in zip(spline.points, points):
            point.co = (*position, 1)
        obj = bpy.data.objects.new(name, curve)
        bpy.data.collections[collection].objects.link(obj)
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.convert(target='MESH')
        obj.data.materials.append(mats[mat])
        return obj

    def mug(name, position, radius=0.045):
        x, y, z = position
        cylinder(name, (x, y, z), (x, y, z + 0.09), radius, mats['ceramic'], collection, 24)
        cylinder(name + '_Drink', (x, y, z + 0.09), (x, y, z + 0.092), radius * 0.79, mats['counter'], collection, 24)
        points = [(x + radius + 0.021 + math.cos(t * math.tau / 24) * 0.028, y,
                   z + 0.05 + math.sin(t * math.tau / 24) * 0.034) for t in range(25)]
        tube(name + '_Handle', points, 0.007, 'ceramic')

    # Front is -Y. The new brief replaces the old illustrative floor plan entirely.
    wc_front = furnishing('WC_FrontPartition', (-1.105, 0.65, 2.085), (1.23, 0.10, 3.01), 'wall', 0)
    cut(wc_front, (-1.08, 0.65, 1.67), (0.77, 0.5, 2.18))
    furnishing('WC_SidePartition', (-0.49, 1.41, 2.085), (0.10, 1.62, 3.01), 'wall', 0)
    furnishing('WC_ClosedDoor', (-1.08, 0.636, 1.67), (0.748, 0.042, 2.155), 'joinery', 0.005)
    for x in (-1.495, -0.665):
        furnishing(f'WC_DoorJamb_{x}', (x, 0.577, 1.69), (0.065, 0.055, 2.25), 'timber', 0.004)
    furnishing('WC_DoorHead', (-1.08, 0.577, 2.817), (0.895, 0.055, 0.068), 'timber', 0.004)
    cylinder('WC_HandleSpindle', (-0.79, 0.612, 1.56), (-0.79, 0.54, 1.56), 0.023, mats['frame'], collection)
    cylinder('WC_ClosedDoorLever', (-0.79, 0.535, 1.56), (-0.90, 0.535, 1.56), 0.012, mats['frame'], collection)
    # Opaque screen covers the entire WC opening. The enclosed WC has no fixtures.
    furnishing('WC_OpaquePrivacyBlind', (-1.642, 1.38, 2.28), (0.022, 0.71, 0.89), 'curtain', 0.002)
    for index in range(7):
        cylinder(f'WC_BlindFold_{index}', (-1.624, 1.02, 1.875 + index * 0.129),
                 (-1.624, 1.74, 1.875 + index * 0.129), 0.013, mats['curtain'], collection)
    furnishing('WC_BlindHeadrail', (-1.62, 1.38, 2.747), (0.065, 0.77, 0.045), 'timber')

    loft = furnishing('Loft_FixedStructure', (0, -0.03, 3.67), (3.33, 4.15, 0.15), 'timber', 0)
    cut(loft, (-0.12, 1.58, 3.67), (0.70, 0.92, 0.8))
    ceiling = furnishing('Ceiling_PaintedPanels', (0, -0.03, 3.58), (3.31, 4.13, 0.028), 'wall', 0)
    cut(ceiling, (-0.12, 1.58, 3.58), (0.70, 0.92, 0.8))
    # The stove flue passes through both the ceiling and loft rather than through solid slabs.
    for obj in (loft, ceiling):
        cut(obj, (1.60, -2.0, 3.64), (0.205, 0.205, 0.7))
    for index, y in enumerate((-1.85, -1.12, -0.39, 0.34, 1.07, 1.94)):
        if y > 1.1:
            furnishing(f'CeilingBeam_{index}_Left', (-1.07, y, 3.48), (1.19, 0.09, 0.17), 'timber')
            furnishing(f'CeilingBeam_{index}_Right', (0.95, y, 3.48), (1.43, 0.09, 0.17), 'timber')
        else:
            furnishing(f'CeilingBeam_{index}', (0, y, 3.48), (3.32, 0.09, 0.17), 'timber')
    for x in (-0.385, 0.145):
        furnishing(f'VerticalLadderRail_{x}', (x, 1.50, 2.39), (0.064, 0.085, 3.62))
    for index in range(11):
        cylinder(f'VerticalLadderRung_{index:02}', (-0.385, 1.50, 0.80 + index * 0.288),
                 (0.145, 1.50, 0.80 + index * 0.288), 0.024, mats['joinery'], collection, 20)
    for z in (0.86, 3.32):
        for x in (-0.385, 0.145):
            cylinder(f'LadderBracket_{x}_{z}', (x, 1.53, z), (x, 2.09, z), 0.012, mats['frame'], collection)

    furnishing('KitchenCabinetCarcass', (0.945, 1.84, 1.025), (1.39, 0.56, 0.85), 'joinery')
    furnishing('KitchenRecessedToeKick', (0.945, 1.88, 0.65), (1.34, 0.44, 0.14), 'frame')
    for index, x in enumerate((0.485, 0.945, 1.405)):
        sections = ((1.30, 0.24), (1.005, 0.31), (0.715, 0.24)) if index == 1 else ((1.20, 0.43), (0.835, 0.285))
        for drawer, (z, height) in enumerate(sections):
            furnishing(f'KitchenFront_{index}_{drawer}', (x, 1.539, z), (0.448, 0.038, height), 'joinery', 0.004)
            furnishing(f'KitchenPull_{index}_{drawer}', (x, 1.505, z + 0.035), (0.105, 0.025, 0.012), 'frame', 0.004)
    top = furnishing('KitchenStoneWorktop', (0.945, 1.824, 1.472), (1.45, 0.615, 0.045), 'counter', 0.004)
    cut(top, (0.50, 1.80, 1.48), (0.38, 0.34, 0.3))
    furnishing('SinkBasinBottom', (0.50, 1.80, 1.36), (0.38, 0.34, 0.022), 'counter')
    for x in (0.305, 0.695):
        furnishing(f'SinkSide_{x}', (x, 1.80, 1.423), (0.02, 0.38, 0.14), 'counter', 0.007)
    for y in (1.621, 1.979):
        furnishing(f'SinkRim_{y}', (0.50, y, 1.423), (0.405, 0.02, 0.14), 'counter', 0.007)
    faucet = [(0.50, 2.018, 1.50), (0.50, 2.018, 1.82)]
    faucet += [(0.50, 1.928 + math.cos(t * math.pi / 16) * 0.09,
                1.82 + math.sin(t * math.pi / 16) * 0.09) for t in range(17)]
    faucet.append((0.50, 1.838, 1.77))
    tube('KitchenGooseneckFaucet', faucet, 0.017)
    cylinder('FaucetLever', (0.56, 2.01, 1.52), (0.56, 2.01, 1.66), 0.009, mats['frame'], collection)
    furnishing('KitchenSplashUpstand', (0.945, 2.092, 1.55), (1.45, 0.045, 0.16), 'counter')
    furnishing('KitchenInductionHob', (1.30, 1.825, 1.502), (0.40, 0.39, 0.014), 'fireglass', 0.012)
    cylinder('HobRing', (1.30, 1.82, 1.511), (1.30, 1.82, 1.514), 0.114, mats['stove'], collection, 32)
    cylinder('KettleBody', (1.30, 1.82, 1.52), (1.30, 1.82, 1.675), 0.085, mats['ceramic'], collection, 32)
    cylinder('KettleLid', (1.30, 1.82, 1.675), (1.30, 1.82, 1.695), 0.09, mats['stove'], collection, 24)
    cylinder('KettleKnob', (1.30, 1.82, 1.695), (1.30, 1.82, 1.715), 0.025, mats['frame'], collection)
    tube('KettleHandle', [(1.23, 1.82, 1.66), (1.22, 1.82, 1.79), (1.38, 1.82, 1.79), (1.37, 1.82, 1.66)], 0.014)
    cylinder('KettleSpout', (1.36, 1.83, 1.59), (1.44, 1.84, 1.69), 0.021, mats['ceramic'], collection)
    for z in (2.09, 2.58):
        furnishing(f'KitchenFloatingShelf_{z}', (1.31, 1.975, z), (0.67, 0.27, 0.045), 'joinery', 0.004)
        for index in range(3):
            mug(f'KitchenShelfCup_{z}_{index}', (1.10 + index * 0.19, 1.96, z + 0.025), 0.036)
    furnishing('KitchenChoppingBoard', (1.59, 2.024, 1.70), (0.19, 0.025, 0.35), 'joinery', 0.025,
               (math.radians(-8), 0, math.radians(-8)))
    furnishing('KitchenHangingTeaTowel', (0.78, 1.50, 1.27), (0.18, 0.012, 0.41), 'paper', 0.004)

    for x in (-1.53, -0.82):
        for y in (-1.78, -0.10):
            furnishing(f'SofaFoot_{x}_{y}', (x, y, 0.67), (0.07, 0.07, 0.18), 'timber')
    furnishing('SofaBase', (-1.18, -0.94, 0.85), (0.91, 1.98, 0.28), 'fabric', 0.075)
    furnishing('SofaBack', (-1.56, -0.94, 1.24), (0.20, 1.94, 0.65), 'fabric', 0.08)
    for y in (-1.9, 0.02):
        furnishing(f'SofaArm_{y}', (-1.17, y, 1.12), (0.94, 0.16, 0.55), 'fabric', 0.065)
    for index, y in enumerate((-1.395, -0.485)):
        furnishing(f'SofaSeatCushion_{index}', (-1.13, y, 1.041), (0.70, 0.865, 0.18), 'fabric', 0.071)
        furnishing(f'SofaBackCushion_{index}', (-1.40, y, 1.35), (0.19, 0.815, 0.48), 'fabric', 0.067,
                   (0, math.radians(-10), 0))
        # Fine upholstery piping follows each seat's rounded outer perimeter.
        points = []
        for cx, cy, start in ((-0.83, y + 0.37, 0), (-1.43, y + 0.37, 90),
                              (-1.43, y - 0.37, 180), (-0.83, y - 0.37, 270)):
            points.extend((cx + math.cos(math.radians(start + t * 90 / 8)) * 0.035,
                           cy + math.sin(math.radians(start + t * 90 / 8)) * 0.035, 1.083) for t in range(9))
        points.append(points[0])
        tube(f'SofaSeatPiping_{index}', points, 0.0035, 'fabric')
    furnishing('SofaAccentPillow', (-1.20, -1.64, 1.30), (0.23, 0.38, 0.38), 'bedding', 0.065,
               (math.radians(-9), math.radians(-13), math.radians(10)))
    furnishing('LivingRug', (-0.43, -0.90, 0.592), (2.02, 2.39, 0.014), 'rug', 0.012)
    for y in (-1.94, -1.88, 0.08, 0.14):
        furnishing(f'RugWovenStripe_{y}', (-0.43, y, 0.601), (1.99, 0.035, 0.003), 'rugstripe', 0)
    furnishing('CoffeeTableOakTop', (-0.07, -0.94, 0.983), (0.62, 1.24, 0.044), 'joinery', 0.012)
    for x in (-0.33, 0.19):
        for y in (-1.48, -0.40):
            furnishing(f'CoffeeTableSteelLeg_{x}_{y}', (x, y, 0.789), (0.019, 0.022, 0.35), 'frame', 0.003)
        furnishing(f'CoffeeTableRail_{x}', (x, -0.94, 0.755), (0.019, 1.10, 0.019), 'frame', 0.003)
    furnishing('OpenBookLeft', (-0.11, -0.79, 1.015), (0.19, 0.26, 0.022), 'paper', 0.004, (0, -0.07, 0))
    furnishing('OpenBookRight', (0.082, -0.79, 1.015), (0.19, 0.26, 0.022), 'paper', 0.004, (0, 0.07, 0))
    mug('CoffeeTableCup', (-0.08, -1.27, 1.009))
    cylinder('TableCandleGlass', (0.08, -1.07, 1.009), (0.08, -1.07, 1.078), 0.031, mats['ceramic'], collection)
    cylinder('TableCandleWax', (0.08, -1.07, 1.078), (0.08, -1.07, 1.080), 0.025, mats['paper'], collection)
    # Simple wall art and timber reveal details provide scale without invented room layouts.
    furnishing('SofaWallArtFrame', (-1.643, -0.91, 2.33), (0.04, 0.77, 0.62), 'timber', 0.006)
    furnishing('SofaWallArtPaper', (-1.619, -0.91, 2.33), (0.004, 0.68, 0.53), 'paper', 0)
    for index in range(5):
        furnishing(f'WallArtBotanicalLine_{index}', (-1.615, -1.13 + index * 0.105, 2.30),
                   (0.003, 0.022, 0.15 + index * 0.018), 'leaves', 0, (0.2, 0, 0))

    # Front/right stove faces diagonally into the room; its flue joins the existing chimney axis.
    stove_parts = []
    def stove_part(name, loc, dims, mat='stove', bevel=0.01):
        obj = furnishing(name, loc, dims, mat, bevel)
        stove_parts.append(obj)
        return obj
    stove_part('StoveHearth', (0, 0, 0.596), (0.67, 0.70, 0.028), 'counter')
    stove_part('StovePedestal', (0, 0, 0.692), (0.35, 0.32, 0.16))
    stove_part('StoveBody', (0, 0, 1.092), (0.46, 0.44, 0.66), bevel=0.035)
    stove_part('StoveTop', (0, 0, 1.436), (0.49, 0.465, 0.035))
    stove_part('StoveDoorFrame', (0, -0.23, 1.10), (0.37, 0.035, 0.49), 'frame', 0.025)
    stove_part('StoveViewingGlass', (0, -0.251, 1.10), (0.295, 0.010, 0.391), 'fireglass', 0.016)
    stove_part('StoveDoorHandle', (0.18, -0.281, 1.13), (0.018, 0.04, 0.16), 'frame')
    stove_part('StoveAirControl', (0, -0.259, 0.832), (0.21, 0.018, 0.023), 'frame')
    rotation = Matrix.Rotation(math.radians(-135), 3, 'Z')
    for obj in stove_parts:
        obj.location = rotation @ obj.location + Vector((1.31, -1.79, 0))
        obj.rotation_euler.z += math.radians(-135)
    tube('StoveContinuousFlue', [(1.31, -1.79, 1.455), (1.31, -1.79, 1.83),
                               (1.60, -2.0, 2.18), (1.60, -2.0, PEAK - 1.60 * SLOPE + 0.12)], 0.074, 'stove')
    for z in (2.24, 3.54, 3.78):
        cylinder(f'StoveFlueCollar_{z}', (1.60, -2.0, z - 0.016), (1.60, -2.0, z + 0.016), 0.095,
                 mats['stove'], collection, 32)

    furnishing('Bed_FixedBase', (0.15, -0.98, 3.89), (1.46, 1.88, 0.23), 'timber', 0.025)
    furnishing('Bed_Mattress', (0.15, -0.98, 4.09), (1.44, 1.86, 0.22), 'bedding', 0.085)
    furnishing('Bed_Duvet', (0.15, -0.64, 4.233), (1.47, 1.22, 0.13), 'bedding', 0.055)
    furnishing('Bed_FoldedThrow', (0.15, -0.18, 4.30), (1.47, 0.30, 0.035), 'curtain', 0.01)
    for x in (-0.19, 0.49):
        furnishing(f'Bed_Pillow_{x}', (x, -1.62, 4.28), (0.62, 0.39, 0.17), 'bedding', 0.075,
                   (math.radians(10), math.radians(3), math.radians(-4)))
    furnishing('LoftSideTable', (1.20, -1.42, 4.0), (0.37, 0.45, 0.045))
    furnishing('LoftBook', (1.20, -1.42, 4.045), (0.19, 0.25, 0.045), 'paper')
    for y in (-1.10, 0.30, 1.40):
        furnishing(f'InteriorCeilingFixture_{y}', (0.55, y, 3.52), (0.09, 0.23, 0.10), 'frame')
        furnishing(f'InteriorCeilingDiffuser_{y}', (0.55, y, 3.463), (0.06, 0.19, 0.014), 'light', 0.001)
    furnishing('Loft_WarmDiffuser', (0, -0.18, 5.86), (0.06, 0.8, 0.014), 'light', 0.001)
    area('Interior_LivingSoftbox', (0.30, -0.8, 3.38), (-0.6, -0.5, 0.6), 100, 1.8, (1, 0.83, 0.62))
    area('Interior_KitchenSoftbox', (0.7, 1.3, 3.36), (0.8, 1.8, 1.4), 55, 1.1, (1, 0.85, 0.69))
    area('Loft_ReviewSoftbox', (0, -0.48, 5.65), (0, -1.0, 4.0), 35, 1.5, (1, 0.80, 0.57))

    # Physical-scale, dominant-axis UVs keep raw grain coherent on individual pieces.
    for obj in bpy.data.collections[collection].objects:
        if obj.type != 'MESH' or not obj.data.materials:
            continue
        if obj.data.materials[0] not in (mats['joinery'], mats['timber'], mats['floor'], mats['fabric']):
            continue
        layer = obj.data.uv_layers.get('UVMap') or obj.data.uv_layers.new(name='UVMap')
        span = [max(v.co[i] for v in obj.data.vertices) - min(v.co[i] for v in obj.data.vertices) for i in range(3)]
        for polygon in obj.data.polygons:
            normal_axis = max(range(3), key=lambda i: abs(polygon.normal[i]))
            axes = [i for i in range(3) if i != normal_axis]
            v_axis = max(axes, key=lambda i: span[i])
            if obj.name.startswith(('KitchenFront_', 'KitchenCabinet', 'WC_ClosedDoor')) and 2 in axes:
                v_axis = 2
            u_axis = next(i for i in axes if i != v_axis)
            for loop_id in polygon.loop_indices:
                co = obj.data.vertices[obj.data.loops[loop_id].vertex_index].co
                if obj.name.startswith('KitchenFront_'):
                    co = co + obj.location
                layer.data[loop_id].uv = (co[u_axis] / 1.83, co[v_axis] / 1.83)


def render_still(name, percentage=100):
    scene = bpy.context.scene
    scene.render.resolution_percentage = percentage
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.filepath = str(ROOT / 'renders' / f'{name}.png')
    bpy.ops.render.render(write_still=True)
    return scene.render.filepath


def render_clay():
    mat = material('ReviewOnly_Clay', (0.47, 0.47, 0.45), 0.8)
    layer = bpy.context.view_layer
    layer.material_override = mat
    bpy.data.collections['Glazing'].hide_render = True
    bpy.data.collections['ShallowInterior'].hide_render = True
    try:
        render_still('niva-clay-canonical')
    finally:
        layer.material_override = None
        bpy.data.collections['Glazing'].hide_render = False
        bpy.data.collections['ShallowInterior'].hide_render = False


if __name__ == '__main__':
    build()
