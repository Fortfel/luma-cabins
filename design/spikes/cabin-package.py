"""Current-source packaging shared by the three cabin entry points.

No authoring, source saves, poster generation, or historical revision dependencies.
Use --output-root for a disposable delivery; --accounting-only needs only Python.
"""

import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import struct
import sys
import tempfile


def read_glb(path):
    raw = path.read_bytes()
    if struct.unpack_from('<4sII', raw) != (b'glTF', 2, len(raw)):
        raise ValueError(f'Invalid GLB header: {path}')
    length, kind = struct.unpack_from('<II', raw, 12)
    if kind != 0x4E4F534A:
        raise ValueError('GLB must start with JSON')
    binary_length, kind = struct.unpack_from('<II', raw, 20 + length)
    if kind != 0x004E4942:
        raise ValueError('Expected an embedded BIN chunk')
    return json.loads(raw[20:20 + length]), raw[28 + length:28 + length + binary_length]


def view_bytes(document, binary, index):
    view = document['bufferViews'][index]
    start = view.get('byteOffset', 0)
    return binary[start:start + view['byteLength']]


def image_key(name):
    return re.sub(r'\.\d{3}$', '', re.sub(r'\.(jpg|png).*$', '', name))


def optimized_niva_payload(raw_path, baseline_path):
    """Keep the committed delivery's exact optimized images, never a revision backup."""
    previous, previous_binary = read_glb(baseline_path)
    images = {image_key(image['name']): (image, view_bytes(previous, previous_binary, image['bufferView']))
              for image in previous['images']}
    if len(images) != len(previous['images']):
        raise ValueError('Ambiguous optimized image names in Niva baseline')
    document, source_binary = read_glb(raw_path)
    replacements = {}
    for image in document['images']:
        key = image_key(image['name'])
        if key not in images:
            raise ValueError(f'No optimized baseline for {image["name"]}; approve/update the texture baseline first')
        old, payload = images[key]
        image['name'], image['mimeType'] = old['name'], old['mimeType']
        replacements[image['bufferView']] = payload
    binary = bytearray()
    for index, view in enumerate(document['bufferViews']):
        binary.extend(b'\0' * (-len(binary) % 4))
        payload = replacements.get(index, view_bytes(document, source_binary, index))
        view['byteOffset'], view['byteLength'] = len(binary), len(payload)
        binary.extend(payload)
    document['buffers'][0]['byteLength'] = len(binary)
    encoded = json.dumps(document, separators=(',', ':')).encode()
    encoded += b' ' * (-len(encoded) % 4)
    binary.extend(b'\0' * (-len(binary) % 4))
    return (struct.pack('<4sII', b'glTF', 2, 28 + len(encoded) + len(binary))
            + struct.pack('<II', len(encoded), 0x4E4F534A) + encoded
            + struct.pack('<II', len(binary), 0x004E4942) + binary)


def source_name(cabin):
    return 'niva-final.blend' if cabin == 'niva' else f'{cabin}-source.blend'


def export_objects(bpy, cabin):
    if cabin == 'niva':
        return [obj for obj in bpy.context.scene.objects
                if obj.type in {'MESH', 'EMPTY'} and not obj.hide_render
                and not any('Archive' in collection.name or collection.hide_render
                            for collection in obj.users_collection)]
    return list({obj for group in ('Architecture', 'Glazing', 'ExteriorDetails', 'ShallowInterior')
                 for obj in bpy.data.collections[f'{cabin.title()}_{group}'].all_objects
                 if obj.type == 'MESH' and not obj.hide_render})


def export_delivery(root, output, cabin):
    import bpy

    if not bpy.app.background:
        raise RuntimeError('Use background Blender; save your edited master before exporting')
    bpy.ops.wm.open_mainfile(filepath=str(root / source_name(cabin)))
    bpy.context.window.scene = bpy.data.scenes[f'{cabin.title()}_Source']
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.context.view_layer.update()
    objects = export_objects(bpy, cabin)
    if not objects:
        raise RuntimeError('No runtime objects selected')
    # Packed images make source files portable. Do not silently export missing textures.
    for material in {slot.material for obj in objects if obj.type == 'MESH' for slot in obj.material_slots}:
        if material and material.use_nodes:
            for node in material.node_tree.nodes:
                if node.type == 'TEX_IMAGE' and node.image and not node.image.packed_file:
                    if not Path(bpy.path.abspath(node.image.filepath)).is_file():
                        raise RuntimeError(f'Missing source image: {node.image.name}; pack it into the source')
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = next(obj for obj in objects if obj.type == 'MESH')
    asset = f'{cabin}-configurator.glb'
    with tempfile.TemporaryDirectory(prefix=f'{cabin}-export-') as directory:
        raw_path = Path(directory) / asset
        bpy.ops.export_scene.gltf(
            filepath=str(raw_path), export_format='GLB', use_selection=True, use_active_scene=True,
            export_apply=True, export_yup=True, export_cameras=False, export_lights=False,
            export_animations=False, export_texcoords=True, export_normals=True, export_tangents=False,
            export_materials='EXPORT', export_image_format='AUTO', export_extras=False,
            export_draco_mesh_compression_enable=False,
        )
        payload = optimized_niva_payload(raw_path, root / asset) if cabin == 'niva' else raw_path.read_bytes()
        (output / asset).write_bytes(payload)


def record(path, relative):
    raw = path.read_bytes()
    return {'path': relative, 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')


def metadata(root, output, cabin):
    asset = f'{cabin}-configurator.glb'
    document, _ = read_glb(output / asset)
    defaults = [record(output / name, name) for name in (asset, f'{cabin}-camera.json', f'{cabin}-presets.json')]
    manifest = json.loads((output / f'{cabin}-presets.json').read_text(encoding='utf-8'))
    optional = [record(output / item['path'], item['path']) for item in manifest['textureFiles']]
    for item, actual in zip(manifest['textureFiles'], optional):
        if item['sha256'] != actual['sha256'] or item['bytes'] != actual['bytes']:
            raise ValueError(f'Finish texture contract is stale: {item["path"]}')
    asset_hash = defaults[0]['sha256']
    checks = {}
    for key, filename in [('gltf', 'khronos-validator.json'), ('roundtrip', 'blender-roundtrip.json')]:
        path = output / 'validation' / filename
        if path.is_file():
            report = json.loads(path.read_text(encoding='utf-8'))
            matches = report.get('asset_sha256', report.get('assetSha256')) == asset_hash
            source_matches = key != 'roundtrip' or report.get('source_sha256') == record(root / source_name(cabin), '')['sha256']
            passed = report.get('passed', report.get('issues', {}).get('numErrors') == 0)
            checks[key] = {'path': f'validation/{filename}', 'matches_current_asset': matches,
                           'matches_current_source': source_matches, 'passed': bool(matches and source_matches and passed)}
    # Historical authoring poster is optional and never part of runtime totals.
    poster = root / 'renders' / f'{cabin}-configurator-poster.png'
    historical = [record(poster, f'renders/{poster.name}')] if poster.is_file() else []
    default_bytes = sum(item['bytes'] for item in defaults)
    optional_bytes = sum(item['bytes'] for item in optional)
    result = {
        'asset': asset, 'source': record(root / source_name(cabin), source_name(cabin)),
        'scene': f'{cabin.title()}_Source',
        'production_directory': f'apps/nextjs/public/cabin-3d/{cabin}/',
        'production_asset_url': f'/cabin-3d/{cabin}/{asset}',
        'export_entry_point': f'scripts/package-{cabin}.py',
        'shared_exporter': '../cabin-package.py',
        'geometry': {
            'triangles': sum(document['accessors'][p['indices']]['count'] // 3
                             for mesh in document['meshes'] for p in mesh['primitives']),
            'meshes': len(document['meshes']), 'nodes': len(document['nodes']),
            'materials': len(document['materials']),
        },
        'embedded_images': len(document['images']), 'extensions_used': document.get('extensionsUsed', []),
        'default_files': defaults, 'optional_finish_files': optional,
        'default_file_bytes': default_bytes, 'all_optional_texture_bytes': optional_bytes,
        'all_presets_file_bytes': default_bytes + optional_bytes, 'external_finish_images': len(optional),
        'historical_files': historical, 'historical_file_bytes': sum(item['bytes'] for item in historical),
        'poster_policy': 'Web-owned; no posters generated, copied or included in runtime payload totals.',
        'validation': checks, 'browser_verification': 'User-owned; not run by packaging.',
        'texture_strategy': ('Reuse exact optimized embedded images from the committed design GLB (seven 1K maps and one 512px fabric map).'
                             if cabin == 'niva' else 'Export packed 1K source images; keep alternative finishes external.'),
        'accounting_note': 'Design GLB + camera/presets, excluding posters, source, runtime code and HTTP compression. Production presets relocate finish URIs; their JSON byte size may differ. Counts are not performance evidence.',
    }
    filename = 'niva-configurator-delivery.json' if cabin == 'niva' else f'{cabin}-delivery.json'
    write_json(output / filename, result)
    return result


def sync_production(root, output, cabin):
    public = root.parents[2] / 'apps/nextjs/public/cabin-3d'
    destination = public / cabin
    manifest = json.loads((output / f'{cabin}-presets.json').read_text(encoding='utf-8'))
    # Shared finishes must not silently change the appearance of the other cabins.
    for item in manifest['textureFiles']:
        target = public / item['path']
        source = output / item['path']
        if target.exists() and target.read_bytes() != source.read_bytes():
            raise ValueError(f'Shared finish differs: {target}; reconcile all cabin contracts before publishing')
    destination.mkdir(parents=True, exist_ok=True)
    for name in (f'{cabin}-configurator.glb', f'{cabin}-camera.json'):
        shutil.copy2(output / name, destination / name)
    for item in manifest['textureFiles']:
        target = public / item['path']
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(output / item['path'], target)
        item['path'] = '../' + item['path']
    for group in manifest['groups'].values():
        for preset in group['presets']:
            texture = preset['baseColorTexture']
            if texture['source'] == 'external':
                texture['uri'] = '../' + texture['uri']
    write_json(destination / f'{cabin}-presets.json', manifest)


def main(root, cabin):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-root', type=Path, help='Disposable package directory; disables production sync')
    parser.add_argument('--accounting-only', action='store_true', help='Account for existing GLB without Blender/export/sync')
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:])
    output = args.output_root.resolve() if args.output_root else root
    output.mkdir(parents=True, exist_ok=True)
    if output != root:
        for name in (f'{cabin}-camera.json', f'{cabin}-presets.json'):
            shutil.copy2(root / name, output / name)
        shutil.copytree(root / 'finishes', output / 'finishes', dirs_exist_ok=True)
        if args.accounting_only:
            shutil.copy2(root / f'{cabin}-configurator.glb', output / f'{cabin}-configurator.glb')
    if not args.accounting_only:
        export_delivery(root, output, cabin)
    result = metadata(root, output, cabin)
    if not args.output_root and not args.accounting_only:
        sync_production(root, output, cabin)
    print(json.dumps({'asset': result['asset'], 'geometry': result['geometry'],
                      'default_file_bytes': result['default_file_bytes'], 'output': str(output)}, indent=2))
