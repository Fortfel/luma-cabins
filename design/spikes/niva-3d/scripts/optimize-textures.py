"""Produce a separate texture-only GLB candidate. Never modify the blend or baseline.

uv run --no-project --with pillow python design/spikes/niva-3d/scripts/optimize-textures.py
"""

import copy
import hashlib
import io
import json
import struct
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
BASELINE = ROOT / 'niva.glb'
CANDIDATE = ROOT / 'niva-web-candidate.glb'
MAX_TEXTURE_SIZE = 1024


def digest(payload):
    return hashlib.sha256(payload).hexdigest()


def unpack(payload):
    magic, version, length = struct.unpack_from('<4sII', payload)
    assert magic == b'glTF' and version == 2 and length == len(payload)
    json_size, json_type = struct.unpack_from('<II', payload, 12)
    assert json_type == 0x4E4F534A
    document = json.loads(payload[20:20 + json_size])
    bin_offset = 20 + json_size
    bin_size, bin_type = struct.unpack_from('<II', payload, bin_offset)
    assert bin_type == 0x004E4942
    binary = payload[bin_offset + 8:bin_offset + 8 + bin_size]
    assert len(document['buffers']) == 1 and 'uri' not in document['buffers'][0]
    return document, binary


def pack(document, binary):
    encoded = json.dumps(document, ensure_ascii=True, separators=(',', ':')).encode('utf-8')
    encoded += b' ' * ((-len(encoded)) % 4)
    binary += b'\0' * ((-len(binary)) % 4)
    length = 12 + 8 + len(encoded) + 8 + len(binary)
    return (struct.pack('<4sII', b'glTF', 2, length) + struct.pack('<II', len(encoded), 0x4E4F534A) +
            encoded + struct.pack('<II', len(binary), 0x004E4942) + binary)


def view_bytes(document, binary, index):
    view = document['bufferViews'][index]
    offset = view.get('byteOffset', 0)
    return binary[offset:offset + view['byteLength']]


def optimize():
    source = BASELINE.read_bytes()
    blend_digest = digest((ROOT / 'niva.blend').read_bytes())
    original, source_binary = unpack(source)
    result = copy.deepcopy(original)
    image_views = {image['bufferView'] for image in original['images']}
    assert len(image_views) == len(original['images'])
    assert all(accessor.get('bufferView') not in image_views for accessor in original['accessors'])
    optimized_images, image_report = {}, []
    for image in original['images']:
        index = image['bufferView']
        encoded = view_bytes(original, source_binary, index)
        loaded = Image.open(io.BytesIO(encoded))
        original_size = loaded.size
        if max(loaded.size) > MAX_TEXTURE_SIZE:
            loaded.thumbnail((MAX_TEXTURE_SIZE, MAX_TEXTURE_SIZE), Image.Resampling.LANCZOS)
            stream = io.BytesIO()
            if image['mimeType'] == 'image/jpeg':
                # No new decoder or material extension; normal maps remain normal-map inputs.
                loaded.convert('RGB').save(stream, format='JPEG', quality=90, subsampling=0, optimize=True)
            else:
                assert image['mimeType'] == 'image/png'
                # Keep packed roughness/metalness channels lossless. No quantization or channel edits.
                loaded.save(stream, format='PNG', optimize=True, compress_level=9)
            candidate = stream.getvalue()
        else:
            candidate = encoded
        optimized_images[index] = candidate
        image_report.append({'name': image.get('name'), 'format': image['mimeType'],
                             'baseline_resolution': original_size, 'candidate_resolution': loaded.size,
                             'baseline_bytes': len(encoded), 'candidate_bytes': len(candidate),
                             'candidate_sha256': digest(candidate)})
    binary = bytearray()
    for index, view in enumerate(result['bufferViews']):
        binary.extend(b'\0' * ((-len(binary)) % 4))
        contents = optimized_images.get(index, view_bytes(original, source_binary, index))
        view['byteOffset'], view['byteLength'] = len(binary), len(contents)
        binary.extend(contents)
    result['buffers'][0]['byteLength'] = len(binary)
    candidate = pack(result, bytes(binary))
    candidate_document, candidate_binary = unpack(candidate)

    # Prove the optimization scope, including names, assignments, samplers, alpha and extensions.
    for key in original:
        if key not in ('buffers', 'bufferViews'):
            assert candidate_document[key] == original[key], f'Unexpected semantic change: {key}'
    preserved_views = 0
    for index, view in enumerate(original['bufferViews']):
        old_semantics = {key: value for key, value in view.items() if key not in ('byteOffset', 'byteLength')}
        new_semantics = {key: value for key, value in candidate_document['bufferViews'][index].items()
                         if key not in ('byteOffset', 'byteLength')}
        assert old_semantics == new_semantics
        if index not in image_views:
            assert view_bytes(original, source_binary, index) == view_bytes(candidate_document, candidate_binary, index)
            preserved_views += 1
    assert len(candidate) < len(source)
    assert BASELINE.read_bytes() == source
    assert digest((ROOT / 'niva.blend').read_bytes()) == blend_digest
    CANDIDATE.write_bytes(candidate)
    base_tex_bytes = sum(image['baseline_bytes'] for image in image_report)
    web_tex_bytes = sum(image['candidate_bytes'] for image in image_report)
    base_pixels = sum(image['baseline_resolution'][0] * image['baseline_resolution'][1] for image in image_report)
    web_pixels = sum(image['candidate_resolution'][0] * image['candidate_resolution'][1] for image in image_report)
    report = {'baseline_file': BASELINE.name, 'candidate_file': CANDIDATE.name,
              'baseline_bytes': len(source), 'candidate_bytes': len(candidate),
              'reduction_percent': (1 - len(candidate) / len(source)) * 100,
              'baseline_sha256': digest(source), 'candidate_sha256': digest(candidate),
              'source_blend_sha256': blend_digest, 'texture_count': len(image_report), 'images': image_report,
              'baseline_texture_bytes': base_tex_bytes, 'candidate_texture_bytes': web_tex_bytes,
              'preserved_nonimage_buffer_views': preserved_views,
              'geometry_buffers_byte_identical': True, 'nonimage_semantics_identical': True,
              'materials_names_slots_samplers_extensions_identical': True,
              'estimated_rgba8_texture_bytes_base_level': {'baseline': base_pixels * 4, 'candidate': web_pixels * 4},
              'estimated_rgba8_texture_bytes_with_mips': {'baseline': round(base_pixels * 4 * 4 / 3),
                                                         'candidate': round(web_pixels * 4 * 4 / 3)},
              'settings': {'maximum_dimension': MAX_TEXTURE_SIZE, 'resize': 'Lanczos', 'jpeg_quality': 90,
                           'jpeg_subsampling': 0, 'png': 'lossless after resize', 'geometry_optimization': False},
              'visual_comparison': 'pending equivalent Blender baseline/candidate renders',
              'browser_validation': 'not performed'}
    (ROOT / 'validation/texture-optimization.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    optimize()
