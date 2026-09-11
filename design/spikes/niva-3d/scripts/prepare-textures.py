"""Download public CC0 Poly Haven maps and derive export-ready timber inputs."""

import hashlib
import json
import math
import random
import urllib.request
from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance


ROOT = Path(__file__).resolve().parents[1]
TEXTURES = ROOT / 'textures'
HEADERS = {'User-Agent': 'NivaBlenderSpike/1.0 (public CC0 asset download)'}
ASSETS = ('oak_veneer_01', 'wood_floor')


def fetch(url):
    request = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=90) as response:
        return response.read()


def prepare():
    manifest = []
    for asset in ASSETS:
        folder = TEXTURES / 'polyhaven' / asset
        folder.mkdir(parents=True, exist_ok=True)
        metadata = json.loads(fetch(f'https://api.polyhaven.com/info/{asset}'))
        assert not metadata.get('vault'), 'Use publicly available assets only'
        files = json.loads(fetch(f'https://api.polyhaven.com/files/{asset}'))
        maps = {}
        for key, suffix in (('Diffuse', 'diff'), ('Rough', 'rough'), ('nor_gl', 'nor_gl')):
            entry = files[key]['2k']['jpg']
            path = folder / f'{asset}_{suffix}_2k.jpg'
            if not path.exists() or path.stat().st_size != entry['size']:
                path.write_bytes(fetch(entry['url']))
            assert path.stat().st_size == entry['size']
            maps[suffix] = {'file': str(path.relative_to(ROOT)), 'url': entry['url'],
                            'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
        rough = Image.open(folder / f'{asset}_rough_2k.jpg').convert('L')
        # Slightly matte timber, without adding lighting or camera-dependent information.
        rough = rough.point(lambda value: max(110, value))
        Image.merge('RGB', (Image.new('L', rough.size, 255), rough, Image.new('L', rough.size, 0))).save(
            TEXTURES / f'{asset}-orm.png')
        manifest.append({'asset_id': asset, 'license': 'CC0', 'authors': metadata.get('authors'),
                         'dimensions_mm': metadata.get('dimensions'), 'resolution': '2k', 'maps': maps})
    raw = Image.open(TEXTURES / 'polyhaven/oak_veneer_01/oak_veneer_01_diff_2k.jpg').convert('RGB')
    raw = ImageEnhance.Color(raw).enhance(0.86)
    raw.save(TEXTURES / 'niva-light-oak-2k.jpg', quality=95)
    width, height = raw.size
    rng = random.Random(2718)
    variations = [rng.uniform(0.91, 1.04) for _ in range(12)]
    shade = Image.new('RGB', (width, 1))
    pixels = shade.load()
    for x in range(width):
        board = x * 12 / width
        fraction = board % 1
        groove = math.exp(-(min(fraction, 1 - fraction) / 0.021) ** 2)
        value = round(min(1, variations[min(11, int(board))] * (1 - groove * 0.30)) * 255)
        pixels[x, 0] = (value, value, value)
    ImageChops.multiply(raw, shade.resize(raw.size)).save(TEXTURES / 'niva-natural-cladding-2k.jpg', quality=95)
    # A subtle woven textile input, not a photoreal furniture texture projection.
    rng = random.Random(194)
    weave = Image.new('RGB', (512, 512))
    weave.putdata([tuple(max(0, min(255, base + rng.randrange(-10, 11) + (5 if (x + y) % 4 == 0 else 0)))
                         for base in (111, 121, 108)) for y in range(512) for x in range(512)])
    weave.save(TEXTURES / 'niva-sage-linen-512.jpg', quality=93)
    output = {'assets': manifest, 'hdri': None, 'hdri_bytes': 0,
              'derivations': {'cladding': 'oak_veneer_01 diffuse, saturation 0.86, seeded 12-board groove/tone mask; no light bake',
                              'joinery': 'oak_veneer_01 diffuse, saturation 0.86',
                              'orm': 'R=255, G=roughness clamped to minimum 110, B=0',
                              'fabric': 'seed 194, 512px woven-noise color, sage grey'}}
    (ROOT / 'validation/polyhaven-assets.json').write_text(json.dumps(output, indent=2), encoding='utf-8')
    print(json.dumps({'assets': ASSETS, 'download_bytes': sum(m['bytes'] for a in manifest for m in a['maps'].values())}))


if __name__ == '__main__':
    prepare()
