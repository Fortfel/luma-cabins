"""Patch only the repaired handle into the approved web asset and author independent finishes."""

import copy
import hashlib
import importlib.util
import io
import json
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('glb_helpers', ROOT / 'scripts/optimize-textures.py')
glb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(glb)


def prepare():
    approved_bytes = (ROOT / 'niva-web-candidate.glb').read_bytes()
    approved, binary = glb.unpack(approved_bytes)
    patch, patch_binary = glb.unpack((ROOT / 'validation/stove-handle-fixed.glb').read_bytes())
    assert len(patch['meshes']) == 1 and not patch.get('images')
    document = copy.deepcopy(approved)
    node_index = next(index for index, node in enumerate(document['nodes']) if node.get('name') == 'StoveDoorHandle')
    mesh_index = document['nodes'][node_index]['mesh']
    patch_node = next(node for node in patch['nodes'] if 'mesh' in node)
    patch_parent = next(node for node in patch['nodes'] if 'children' in node)
    parent = next(node for node in document['nodes'] if node_index in node.get('children', []))
    for key in ('translation', 'rotation', 'scale', 'matrix'):
        assert parent.get(key) == patch_parent.get(key), f'Handle parent transform differs: {key}'
    output_binary = bytearray(binary)
    view_map = {}
    for index, view in enumerate(patch['bufferViews']):
        output_binary.extend(b'\0' * ((-len(output_binary)) % 4))
        contents = glb.view_bytes(patch, patch_binary, index)
        new_view = copy.deepcopy(view)
        new_view.update(buffer=0, byteOffset=len(output_binary), byteLength=len(contents))
        view_map[index] = len(document['bufferViews'])
        document['bufferViews'].append(new_view)
        output_binary.extend(contents)
    accessor_map = {}
    for index, accessor in enumerate(patch['accessors']):
        assert 'sparse' not in accessor
        new_accessor = copy.deepcopy(accessor)
        new_accessor['bufferView'] = view_map[accessor['bufferView']]
        accessor_map[index] = len(document['accessors'])
        document['accessors'].append(new_accessor)
    materials = {material['name']: index for index, material in enumerate(document['materials'])}
    new_mesh = copy.deepcopy(patch['meshes'][patch_node['mesh']])
    new_mesh['name'] = document['meshes'][mesh_index].get('name', 'StoveDoorHandle')
    for primitive in new_mesh['primitives']:
        primitive['indices'] = accessor_map[primitive['indices']]
        primitive['attributes'] = {name: accessor_map[index] for name, index in primitive['attributes'].items()}
        primitive['material'] = materials[patch['materials'][primitive['material']]['name']]
    document['meshes'][mesh_index] = new_mesh
    for key in ('translation', 'rotation', 'scale', 'matrix'):
        document['nodes'][node_index].pop(key, None)
        if key in patch_node:
            document['nodes'][node_index][key] = patch_node[key]
    document['buffers'][0]['byteLength'] = len(output_binary)
    output = glb.pack(document, bytes(output_binary))
    final, final_binary = glb.unpack(output)
    assert final['materials'] == approved['materials'] and final['images'] == approved['images']
    assert final['textures'] == approved['textures'] and final['samplers'] == approved['samplers']
    for index, node in enumerate(approved['nodes']):
        assert index == node_index or final['nodes'][index] == node
    for index, mesh in enumerate(approved['meshes']):
        assert index == mesh_index or final['meshes'][index] == mesh
    for index in range(len(approved['bufferViews'])):
        assert glb.view_bytes(approved, binary, index) == glb.view_bytes(final, final_binary, index)
    assert (ROOT / 'niva-web-candidate.glb').read_bytes() == approved_bytes
    (ROOT / 'niva-configurator.glb').write_bytes(output)

    def baseline_map(material_name):
        material = approved['materials'][materials[material_name]]
        texture = approved['textures'][material['pbrMetallicRoughness']['baseColorTexture']['index']]
        image = approved['images'][texture['source']]
        return Image.open(io.BytesIO(glb.view_bytes(approved, binary, image['bufferView']))).convert('RGB')

    folder = ROOT / 'finishes/textures'
    folder.mkdir(parents=True, exist_ok=True)
    definitions = (
        ('exterior', 'whitewashed-timber', 'Whitewashed Timber', 'ExteriorCladding', (176, 173, 162), (240, 238, 227), 1.0),
        ('exterior', 'charred-black-oil', 'Charred Black Oil', 'ExteriorCladding', (18, 20, 19), (49, 48, 42), 0.86),
        ('interior', 'warm-ash', 'Warm Ash', 'InteriorJoinery', (155, 141, 115), (218, 205, 177), 1.0),
        ('interior', 'dark-walnut', 'Dark Walnut', 'InteriorJoinery', (43, 27, 18), (106, 69, 40), 0.92),
    )
    groups = {
        'exterior': {'material': 'ExteriorCladding', 'default': 'natural-timber', 'presets': [
            {'id': 'natural-timber', 'label': 'Natural Timber', 'baseColorTexture': {'source': 'embedded-default'}, 'roughnessMultiplier': 1.0}]},
        'interior': {'material': 'InteriorJoinery', 'default': 'light-oak', 'presets': [
            {'id': 'light-oak', 'label': 'Light Oak', 'baseColorTexture': {'source': 'embedded-default'}, 'roughnessMultiplier': 1.0}]},
    }
    texture_records = []
    for group, identifier, label, material, dark, light, roughness in definitions:
        grain = ImageOps.autocontrast(ImageOps.grayscale(baseline_map(material)), cutoff=2)
        finished = ImageOps.colorize(grain, black=dark, white=light)
        path = folder / f'{group}-{identifier}-basecolor.jpg'
        finished.save(path, quality=94, subsampling=0, optimize=True)
        uri = path.relative_to(ROOT).as_posix()
        groups[group]['presets'].append({'id': identifier, 'label': label,
                                         'baseColorTexture': {'source': 'external', 'uri': uri},
                                         'roughnessMultiplier': roughness})
        texture_records.append({'path': uri, 'resolution': list(finished.size), 'format': 'image/jpeg',
                                 'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                                 'derived_from_material': material, 'colorize_srgb_endpoints': [dark, light]})
    manifest = {'schemaVersion': 1, 'asset': 'niva-configurator.glb', 'camera': 'niva-camera.json',
                'poster': 'renders/niva-configurator-poster.png',
                'defaults': {'exterior': 'natural-timber', 'interior': 'light-oak'},
                'groups': groups, 'textureSettings': {'colorSpace': 'srgb', 'flipY': False,
                 'samplerAndUvTransform': 'inherit the original embedded base-color map'},
                'operation': 'Change only target material.map and baseline roughness times roughnessMultiplier. Restore embedded-default from cached original map.',
                'unchanged': ['normalMap', 'normalScale', 'roughnessMap', 'metalnessMap', 'metalness', 'color',
                              'opacity', 'transparent', 'side', 'emissive', 'all non-target materials'],
                'textureFiles': texture_records,
                'authoring': 'Colorized material-only derivatives of the approved Poly Haven oak maps; no camera/lighting bake. Palette names describe finish tones, not verified wood species.'}
    (ROOT / 'niva-presets.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    triangles = lambda doc: sum(doc['accessors'][p['indices']]['count'] // 3 for mesh in doc['meshes'] for p in mesh['primitives'])
    report = {'approved_baseline': 'niva-web-candidate.glb', 'approved_baseline_sha256': hashlib.sha256(approved_bytes).hexdigest(),
              'updated_asset': 'niva-configurator.glb', 'updated_sha256': hashlib.sha256(output).hexdigest(),
              'baseline_bytes': len(approved_bytes), 'updated_glb_bytes': len(output),
              'baseline_triangles': triangles(approved), 'updated_triangles': triangles(final),
              'meshes': len(final['meshes']), 'nodes': len(final['nodes']), 'materials': len(final['materials']),
              'embedded_images': len(final['images']), 'external_finish_images': len(texture_records),
              'external_finish_texture_bytes': sum(item['bytes'] for item in texture_records),
              'changed_geometry_objects': ['StoveDoorHandle'], 'all_other_nodes_and_meshes_identical': True,
              'all_approved_buffer_views_retained_byte_identical': True, 'all_original_materials_and_textures_identical': True,
              'unused_old_handle_accessors_retained': 'A few kilobytes are retained to avoid remapping unrelated approved buffers; only the replacement handle is referenced by the mesh.'}
    (ROOT / 'validation/configurator-package.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    prepare()
