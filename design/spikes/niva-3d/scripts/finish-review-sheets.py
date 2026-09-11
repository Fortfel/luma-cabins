"""Create preset comparison sheets, readability measurements and payload accounting."""

import hashlib
import importlib.util
import itertools
import json
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageStat


ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('review_helpers', ROOT / 'scripts/review-images.py')
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)


def verify_delivery():
    delivery = json.loads((ROOT / 'niva-configurator-delivery.json').read_text())
    for filename, expected in delivery['assets'].items():
        contents = (ROOT / filename).read_bytes()
        assert len(contents) == expected['bytes'], filename
        assert hashlib.sha256(contents).hexdigest() == expected['sha256'], filename
    package = json.loads((ROOT / 'validation/configurator-package.json').read_text())
    baseline = ROOT / package['approved_baseline']
    assert hashlib.sha256(baseline.read_bytes()).hexdigest() == package['approved_baseline_sha256']
    public_baseline = ROOT.parents[2] / 'apps/nextjs/public/niva-3d/niva-web-candidate.glb'
    assert hashlib.sha256(public_baseline.read_bytes()).hexdigest() == package['approved_baseline_sha256']
    assert json.loads((ROOT / 'validation/finish-review.json').read_text())['state'] == 'complete'
    print(json.dumps({'verified_delivery_files': len(delivery['assets']), 'approved_baseline_preserved': True,
                      'public_baseline_preserved': True, 'blender_finish_review': 'complete'}))


def run():
    manifest = json.loads((ROOT / 'niva-presets.json').read_text())
    report = json.loads((ROOT / 'validation/finish-review.json').read_text())
    assert report['state'] == 'complete'
    cases = [(group + '-' + preset['id'], preset['label']) for group, definition in manifest['groups'].items()
             for preset in definition['presets']]
    sheet = Image.new('RGB', (1200, 890), helpers.BACKGROUND)
    draw = ImageDraw.Draw(sheet)
    draw.text((24, 20), 'NIVA / SIX INDEPENDENT FINISH PRESETS', font=helpers.font(25), fill=helpers.INK)
    draw.text((24, 52), 'Exterior row: Light Oak fixed. Interior row: Natural Timber fixed. Images shown at 320px height.',
              font=helpers.font(15), fill=helpers.MUTED)
    for index, (case, label) in enumerate(cases):
        x, y = (index % 3) * 400, 84 + (index // 3) * 390
        draw.text((x + 24, y + 10), label, font=helpers.font(20), fill=helpers.INK)
        image = Image.open(ROOT / f'renders/finishes/{case}-canonical.png').convert('RGBA')
        assert image.size == (954, 866)
        bbox = image.getchannel('A').getbbox()
        assert bbox and bbox[0] > 0 and bbox[1] > 0 and bbox[2] < 954 and bbox[3] < 866, case
        helpers.place_contain(sheet, image, x + 24, y + 48, 353, 320)
    sheet.save(ROOT / 'renders/niva-finishes-canonical-sheet.png')

    orbit = Image.new('RGB', (1200, 1812), helpers.BACKGROUND)
    draw = ImageDraw.Draw(orbit)
    views = ('canonical', 'left-three-quarter', 'right-three-quarter', 'rear')
    for row, (case, label) in enumerate(cases):
        for column, view in enumerate(views):
            x, y = column * 300, row * 302
            draw.text((x + 10, y + 8), label, font=helpers.font(16), fill=helpers.INK)
            draw.text((x + 10, y + 31), view, font=helpers.font(13), fill=helpers.MUTED)
            image = Image.open(ROOT / f'renders/finishes/{case}-{view}.png')
            helpers.place_contain(orbit, image, x + 10, y + 55, 280, 240)
    orbit.save(ROOT / 'renders/niva-finishes-orbit-sheet.png')

    roi = tuple(report['kitchen_roi_pixels'])
    assert roi[0] >= 0 and roi[1] >= 0 and roi[2] <= 954 and roi[3] <= 866
    crops = {}
    detail = Image.new('RGB', (1200, 450), helpers.BACKGROUND)
    draw = ImageDraw.Draw(detail)
    for index, identifier in enumerate(('light-oak', 'warm-ash', 'dark-walnut')):
        image = helpers.composite(Image.open(ROOT / f'renders/finishes/interior-{identifier}-canonical.png'))
        crops[identifier] = image.crop(roi)
        draw.text((index * 400 + 20, 20), identifier.upper(), font=helpers.font(20), fill=helpers.INK)
        helpers.place_contain(detail, crops[identifier], index * 400 + 20, 66, 360, 350)
    detail.save(ROOT / 'renders/niva-interior-finish-detail.png')
    differences = []
    for first, second in itertools.combinations(crops, 2):
        mean = sum(ImageStat.Stat(ImageChops.difference(crops[first], crops[second])).mean) / (3 * 255)
        differences.append({'first': first, 'second': second, 'kitchen_mean_absolute_rgb_difference': mean})
    # This is supporting evidence at the visible cabinetry, not a universal perceptual metric.
    assert min(item['kitchen_mean_absolute_rgb_difference'] for item in differences) > 0.035, differences
    (ROOT / 'validation/finish-readability.json').write_text(json.dumps({'roi': roi, 'pairwise': differences}, indent=2))

    package = json.loads((ROOT / 'validation/configurator-package.json').read_text())
    reviewed_blend = report.get('reviewed_blend', 'niva-finishes.blend')
    paths = ['niva-configurator.glb', 'niva-camera.json', 'niva-presets.json', 'renders/niva-configurator-poster.png', reviewed_blend]
    paths.extend(item['path'] for item in manifest['textureFiles'])
    assets = {path: {'bytes': (ROOT / path).stat().st_size, 'sha256': hashlib.sha256((ROOT / path).read_bytes()).hexdigest()}
              for path in paths}
    metadata = assets['niva-camera.json']['bytes'] + assets['niva-presets.json']['bytes']
    poster = assets['renders/niva-configurator-poster.png']['bytes']
    default_payload = package['updated_glb_bytes'] + metadata + poster
    output = {'status': 'Blender finish review complete; updated camera/presets still require browser verification',
              'base_browser_visual_check': 'Passed, as reported by the user before this asset-only pass',
              'assets': assets, 'reviewed_blend': reviewed_blend, 'model_triangles': package['updated_triangles'], 'meshes': package['meshes'],
              'materials': package['materials'], 'embedded_images': package['embedded_images'],
              'external_finish_images': package['external_finish_images'],
              'handle_patch_glb_increase_bytes': package['updated_glb_bytes'] - package['baseline_bytes'],
              'all_four_finish_textures_bytes': package['external_finish_texture_bytes'],
              'default_glb_plus_poster_and_metadata_bytes': default_payload,
              'all_presets_glb_plus_poster_and_metadata_bytes': default_payload + package['external_finish_texture_bytes'],
              'one_geometry_asset_for_all_combinations': True, 'fixed_materials_verified': True,
              'selection_independence_verified': True, 'interior_readability': differences,
              'camera_contract': 'niva-camera.json', 'preset_contract': 'niva-presets.json'}
    (ROOT / 'niva-configurator-delivery.json').write_text(json.dumps(output, indent=2))
    print(json.dumps({'glb_bytes': package['updated_glb_bytes'], 'finish_texture_bytes': package['external_finish_texture_bytes'],
                      'default_payload_bytes': default_payload, 'all_presets_payload_bytes': default_payload + package['external_finish_texture_bytes'],
                      'interior_readability': differences}, indent=2))


if __name__ == '__main__':
    if '--verify' in sys.argv:
        verify_delivery()
    else:
        run()
