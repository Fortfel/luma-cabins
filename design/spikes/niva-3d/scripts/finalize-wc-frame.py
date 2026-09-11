"""Reassign only WC timber trim and reserialize that material-only GLB change.

No renders, tests, topology checks or post-change validation are run.
"""

import datetime
import hashlib
import json
import shutil
import struct
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[1]
TRIM = ('WC_DoorJamb_-1.495', 'WC_DoorJamb_-0.665', 'WC_DoorHead')


def finalize():
    scene = bpy.context.scene
    if scene.name != 'Niva_Source':
        raise RuntimeError('Select the editable Niva_Source scene before this operation')
    target = bpy.data.materials['InteriorJoinery']
    objects = [scene.objects[name] for name in TRIM]
    backup = ROOT / 'validation' / ('before-wc-frame-' + datetime.datetime.now().strftime('%Y%m%d-%H%M%S'))
    backup.mkdir(parents=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(backup / 'niva-preserved.blend'), copy=True)
    for filename in ('niva-configurator.glb', 'niva-configurator-delivery.json', 'README.md', 'web-handoff.md'):
        shutil.copy2(ROOT / filename, backup / filename)

    for obj in objects:
        obj.data.materials[0] = target
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'niva-final.blend'))

    # Keep the existing runtime geometry, images and names; change only the three bindings.
    path = ROOT / 'niva-configurator.glb'
    raw = path.read_bytes()
    json_length = struct.unpack_from('<I', raw, 12)[0]
    document = json.loads(raw[20:20 + json_length])
    binary_chunk = raw[20 + json_length:]
    material_index = next(index for index, material in enumerate(document['materials'])
                          if material.get('name') == 'InteriorJoinery')
    nodes = {node.get('name'): node for node in document['nodes']}
    for name in TRIM:
        mesh = document['meshes'][nodes[name]['mesh']]
        for primitive in mesh['primitives']:
            primitive['material'] = material_index
    encoded = json.dumps(document, ensure_ascii=True, separators=(',', ':')).encode('utf-8')
    encoded += b' ' * ((-len(encoded)) % 4)
    output = struct.pack('<4sII', b'glTF', 2, 20 + len(encoded) + len(binary_chunk))
    output += struct.pack('<II', len(encoded), 0x4E4F534A) + encoded + binary_chunk
    path.write_bytes(output)

    delivery_path = ROOT / 'niva-configurator-delivery.json'
    delivery = json.loads(delivery_path.read_text())
    for name in list(delivery['assets']):
        if name.endswith('.blend'):
            del delivery['assets'][name]
    for filename in ('niva-configurator.glb', 'niva-final.blend'):
        contents = (ROOT / filename).read_bytes()
        delivery['assets'][filename] = {'bytes': len(contents), 'sha256': hashlib.sha256(contents).hexdigest()}
    delivery['reviewed_blend'] = None
    delivery['editable_source'] = 'niva-final.blend'
    delivery['status'] = 'Final WC trim material correction exported; user will test it'
    delivery['final_correction'] = {'objects': list(TRIM), 'material': 'InteriorJoinery',
                                     'geometry_changed': False, 'tests_or_renders_run': False}
    delivery['validation_note'] = 'Existing preset review evidence predates this final material reassignment. No checks rerun, by user request.'
    delivery['fixed_materials_verified'] = None
    delivery['selection_independence_verified'] = None
    delivery['default_glb_plus_poster_and_metadata_bytes'] = sum(delivery['assets'][name]['bytes'] for name in
        ('niva-configurator.glb', 'niva-camera.json', 'niva-presets.json', 'renders/niva-configurator-poster.png'))
    delivery['all_presets_glb_plus_poster_and_metadata_bytes'] = (
        delivery['default_glb_plus_poster_and_metadata_bytes'] + delivery['all_four_finish_textures_bytes'])
    delivery_path.write_text(json.dumps(delivery, indent=2), encoding='utf-8')
    print(json.dumps({'assigned_meshes': list(TRIM), 'material': target.name, 'source': 'niva-final.blend',
                      'export': path.name, 'export_bytes': len(output), 'backup': str(backup),
                      'tests_run': False, 'renders_run': False}, indent=2))


if __name__ == '__main__':
    finalize()
