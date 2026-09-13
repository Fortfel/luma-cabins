"""Copy only reusable, licensed material inputs. Never imports or edits Niva geometry.

Run with Python or Blender Python. The initial source is read-only; after this
one-time preparation Aster builds independently from its own textures directory.
"""

import hashlib
import json
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'niva-3d'


def prepare():
    payload = (SOURCE / 'niva-configurator.glb').read_bytes()
    length = struct.unpack_from('<I', payload, 12)[0]
    doc = json.loads(payload[20:20 + length])
    binary = payload[28 + length:]
    names = {
        'oak_veneer_01_nor_gl_2k': 'oak-normal-1k.jpg',
        'niva-light-oak-2k': 'light-oak-basecolor-1k.jpg',
        'oak_veneer_01-orm': 'oak-orm-1k.png',
        'niva-natural-cladding-2k': 'natural-cladding-basecolor-1k.jpg',
        'wood_floor_nor_gl_2k': 'floor-normal-1k.jpg',
        'wood_floor_diff_2k': 'floor-basecolor-1k.jpg',
        'wood_floor-orm': 'floor-orm-1k.png',
    }
    (ROOT / 'textures').mkdir(parents=True, exist_ok=True)
    records = []
    for image in doc['images']:
        if image['name'] not in names:
            continue
        view = doc['bufferViews'][image['bufferView']]
        offset = view.get('byteOffset', 0)
        data = binary[offset:offset + view['byteLength']]
        path = ROOT / 'textures' / names[image['name']]
        if path.exists():
            raise FileExistsError(path)
        path.write_bytes(data)
        records.append({'path': path.relative_to(ROOT).as_posix(), 'resolution': [1024, 1024],
                        'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
    presets = json.loads((SOURCE / 'niva-presets.json').read_text(encoding='utf-8'))
    presets.update(asset='aster-configurator.glb', camera='aster-camera.json',
                   poster='renders/aster-configurator-poster.png')
    for item in presets['textureFiles']:
        path = ROOT / item['path']
        path.parent.mkdir(parents=True, exist_ok=True)
        if path.exists():
            raise FileExistsError(path)
        path.write_bytes((SOURCE / item['path']).read_bytes())
    (ROOT / 'aster-presets.json').write_text(json.dumps(presets, indent=2) + '\n', encoding='utf-8')
    metadata = {
        'license': 'CC0',
        'assets': [
            {'asset_id': 'oak_veneer_01', 'author': 'Jenelle van Heerden',
             'url': 'https://polyhaven.com/a/oak_veneer_01', 'original_resolution': '2k',
             'runtime_resolution': '1k', 'uses': ['cladding', 'joinery', 'fixed step timber']},
            {'asset_id': 'wood_floor', 'author': 'Dimitrios Savva',
             'url': 'https://polyhaven.com/a/wood_floor', 'original_resolution': '2k',
             'runtime_resolution': '1k', 'uses': ['fixed interior floor']},
        ],
        'provenance': 'Material images extracted byte-for-byte from the approved Niva-class runtime material set. No geometry imported.',
        'derivations': {'cladding': 'Oak diffuse saturation 0.86; seeded 12-board groove/tone mask; no light bake.',
                        'joinery': 'Oak diffuse saturation 0.86.',
                        'orm': 'R=255; G=roughness with minimum 110; B=0.',
                        'alternatives': 'Same grain and documented sRGB colorization endpoints as preset textureFiles.'},
        'files': records, 'hdri': None, 'hdri_bytes': 0,
    }
    (ROOT / 'texture-sources.json').write_text(json.dumps(metadata, indent=2) + '\n', encoding='utf-8')
    return {'copied_base_maps': len(records), 'alternative_maps': len(presets['textureFiles'])}


if __name__ == '__main__':
    prepare()
