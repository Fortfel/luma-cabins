"""Compare imported baseline/candidate GLBs under identical Eevee staging.

Does not export assets or save changes to niva.blend. A validation copy is saved separately.
"""

import hashlib
import importlib.util
import json
import time
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'validation' / 'web-candidate'
spec = importlib.util.spec_from_file_location('web_review_settings', ROOT / 'scripts/review-niva.py')
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)
QUEUE = []
STARTED = 0
TOTAL = 0
SOURCE_HASH = ''
SCENES = {'baseline': 'Niva_BaselineValidation', 'candidate': 'Niva_WebCandidateValidation'}
DETAILS = ('interior-front', 'interior-right', 'loft-interior', 'sink-detail', 'ceiling-detail')


def write_json(name, value):
    (OUTPUT / name).write_text(json.dumps(value, indent=2), encoding='utf-8')


def begin():
    global STARTED, TOTAL, SOURCE_HASH, QUEUE
    assert not QUEUE
    assert all(name not in bpy.data.scenes for name in SCENES.values()), 'Validation scenes already exist'
    OUTPUT.mkdir(parents=True, exist_ok=True)
    source = bpy.data.scenes['Niva_Source']
    SOURCE_HASH = hashlib.sha256((ROOT / 'niva.blend').read_bytes()).hexdigest()
    validation = {}
    for kind, filename in (('baseline', 'niva.glb'), ('candidate', 'niva-web-candidate.glb')):
        scene = source.copy()
        scene.name = SCENES[kind]
        for collection in list(scene.collection.children):
            if collection.name in (*review.build.MODEL_COLLECTIONS, 'ReviewStaging'):
                scene.collection.children.unlink(collection)
        camera = source.camera.copy()
        camera.data = source.camera.data.copy()
        camera.name = f'{kind}_ValidationCamera'
        scene.collection.objects.link(camera)
        scene.camera = camera
        bpy.context.window.scene = scene
        bpy.ops.import_scene.gltf(filepath=str(ROOT / filename))
        meshes = [obj for obj in scene.objects if obj.type == 'MESH']
        triangles, invalid = 0, []
        for obj in meshes:
            obj.data.calc_loop_triangles()
            triangles += len(obj.data.loop_triangles)
            bm = bmesh.new()
            bm.from_mesh(obj.data)
            is_bad = any(face.calc_area() < 1e-12 for face in bm.faces) or bm.calc_volume(signed=True) < -1e-8
            bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-6)
            if is_bad or any(not edge.is_manifold for edge in bm.edges):
                invalid.append(obj.name)
            bm.free()
        assert not invalid, invalid
        glass = next(mat for obj in meshes for mat in obj.data.materials if mat and mat.name.startswith('Glazing'))
        shader = next(node for node in glass.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
        validation[kind] = {'file': filename, 'mesh_count': len(meshes), 'triangles': triangles,
                            'invalid_meshes': invalid, 'glass_method': glass.surface_render_method,
                            'glass_alpha': shader.inputs['Alpha'].default_value}
    assert validation['baseline']['triangles'] == validation['candidate']['triangles']
    assert validation['baseline']['mesh_count'] == validation['candidate']['mesh_count']
    assert validation['baseline']['glass_method'] == validation['candidate']['glass_method']
    assert validation['baseline']['glass_alpha'] == validation['candidate']['glass_alpha']
    write_json('import-validation.json', validation)
    views = [('canonical', None), *review.ANGLES, *((name, None) for name in DETAILS)]
    QUEUE = [(kind, name, angle) for name, angle in views for kind in SCENES]
    TOTAL, STARTED = len(QUEUE), time.monotonic()
    if bpy.app.background:
        while QUEUE:
            render_next()
        render_next()
    else:
        bpy.app.timers.register(render_next, first_interval=0.1)
    print(f'Scheduled {TOTAL} baseline/candidate comparison renders')


def render_next():
    if not QUEUE:
        bpy.context.window.scene = bpy.data.scenes['Niva_Source']
        assert hashlib.sha256((ROOT / 'niva.blend').read_bytes()).hexdigest() == SOURCE_HASH
        bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT / 'niva-web-validation.blend'), copy=True)
        assert hashlib.sha256((ROOT / 'niva.blend').read_bytes()).hexdigest() == SOURCE_HASH
        write_json('progress.json', {'state': 'complete', 'renders': TOTAL, 'seconds': time.monotonic() - STARTED,
                                     'original_blend_unchanged': True, 'source_blend_sha256': SOURCE_HASH})
        return None
    kind, name, angle = QUEUE.pop(0)
    try:
        scene = bpy.data.scenes[SCENES[kind]]
        bpy.context.window.scene = scene
        camera = scene.camera
        scene.render.resolution_x, scene.render.resolution_y = (1280, 960) if name in DETAILS else (954, 866)
        scene.render.resolution_percentage = 100
        scene.eevee.taa_render_samples = 96
        scene.render.engine = 'BLENDER_EEVEE'
        scene.render.film_transparent = True
        if name == 'canonical':
            settings = json.loads((ROOT / 'validation/export-stats.json').read_text())['canonical']
            camera.matrix_world = Matrix(settings['matrix_world'])
            camera.data.lens = settings['lens_mm']
            camera.data.sensor_width = settings['sensor_width_mm']
            camera.data.shift_x, camera.data.shift_y = settings['shift_x'], settings['shift_y']
            camera.data.clip_start, camera.data.clip_end = settings['clip_start'], settings['clip_end']
        else:
            if name in DETAILS:
                location, target, lens = review.DETAIL_VIEWS[name]
                camera.location, target = Vector(location), Vector(target)
            else:
                import math
                theta, phi = math.radians(angle), math.radians(5.5)
                target, lens = Vector((0, -0.50, 2.96)), 64
                camera.location = target + Vector((math.sin(theta) * math.cos(phi),
                                                    -math.cos(theta) * math.cos(phi), math.sin(phi))) * 20.5
            camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
            camera.data.lens = lens
            camera.data.shift_x = camera.data.shift_y = 0
        scene.render.image_settings.file_format = 'PNG'
        scene.render.image_settings.color_mode = 'RGBA'
        scene.render.filepath = str(OUTPUT / f'{kind}-{name}.png')
        bpy.ops.render.render(write_still=True)
        write_json('progress.json', {'state': 'rendering', 'last': [kind, name], 'completed': TOTAL - len(QUEUE), 'total': TOTAL})
    except Exception as error:
        write_json('progress.json', {'state': 'failed', 'last': [kind, name], 'error': repr(error)})
        QUEUE.clear()
        bpy.context.window.scene = bpy.data.scenes['Niva_Source']
        raise
    return 0.1


if __name__ == '__main__':
    begin()
