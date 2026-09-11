"""Measure and display the texture-only candidate versus the imported baseline."""

import importlib.util
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageStat


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'validation/web-candidate'
spec = importlib.util.spec_from_file_location('review_image_helpers', ROOT / 'scripts/review-images.py')
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)


def compare():
    assert json.loads((OUTPUT / 'progress.json').read_text())['state'] == 'complete'
    reports = []
    for source_path in sorted(OUTPUT.glob('baseline-*.png')):
        name = source_path.stem.removeprefix('baseline-')
        baseline = Image.open(source_path).convert('RGBA')
        candidate = Image.open(OUTPUT / f'candidate-{name}.png').convert('RGBA')
        assert baseline.size == candidate.size
        mask = ImageChops.lighter(baseline.getchannel('A'), candidate.getchannel('A')).point(lambda value: 255 if value else 0)
        difference = ImageChops.difference(helpers.composite(baseline), helpers.composite(candidate))
        values = ImageStat.Stat(difference, mask).mean
        alpha = ImageChops.difference(baseline.getchannel('A'), candidate.getchannel('A'))
        entry = {'view': name, 'resolution': list(baseline.size), 'object_mean_absolute_rgb_8bit': values,
                 'object_mean_absolute_rgb_normalized': sum(values) / (255 * 3),
                 'alpha_max_difference_8bit': alpha.getextrema()[1],
                 'baseline_bbox': baseline.getchannel('A').getbbox(), 'candidate_bbox': candidate.getchannel('A').getbbox()}
        if name == 'canonical':
            reduced = ImageChops.difference(helpers.composite(baseline).resize((353, 320), Image.Resampling.LANCZOS),
                                            helpers.composite(candidate).resize((353, 320), Image.Resampling.LANCZOS))
            entry['desktop_mean_absolute_rgb_normalized'] = sum(ImageStat.Stat(reduced).mean) / (255 * 3)
            helpers.side_by_side(baseline, candidate, ROOT / 'renders/niva-web-candidate-comparison.png',
                                  ('FULL-QUALITY BASELINE / 2K', 'TEXTURE-ONLY WEB CANDIDATE / 1K'), native=True)
            helpers.side_by_side(baseline, candidate, ROOT / 'renders/niva-web-candidate-desktop.png',
                                  ('BASELINE / desktop maximum', 'WEB CANDIDATE / desktop maximum'))
        reports.append(entry)
    assert len(reports) == 14, f'Expected all 14 camera comparisons; found {len(reports)}'
    sheet = Image.new('RGB', (1280, 1116), helpers.BACKGROUND)
    draw = ImageDraw.Draw(sheet)
    for row, name in enumerate(('interior-front', 'loft-interior')):
        for column, kind in enumerate(('baseline', 'candidate')):
            x, y = column * 640, row * 558
            draw.text((x + 20, y + 20), f'{kind.upper()} / {name.upper()}', font=helpers.font(19), fill=helpers.INK)
            helpers.place_contain(sheet, Image.open(OUTPUT / f'{kind}-{name}.png'), x + 16, y + 64, 608, 456)
    sheet.save(ROOT / 'renders/niva-web-candidate-interior-comparison.png')
    report = {'comparisons': reports, 'worst_object_mean_absolute_rgb_normalized':
              max(entry['object_mean_absolute_rgb_normalized'] for entry in reports),
              'all_alpha_channels_identical': all(entry['alpha_max_difference_8bit'] == 0 for entry in reports),
              'visual_review': 'Review the rendered sheets; pixel differences are supporting evidence, not a browser parity test.'}
    (OUTPUT / 'image-comparison.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    optimization_path = ROOT / 'validation/texture-optimization.json'
    optimization = json.loads(optimization_path.read_text(encoding='utf-8'))
    optimization['visual_comparison'] = {
        'state': 'completed', 'matched_views': len(reports), 'report': 'validation/web-candidate/image-comparison.json',
        'worst_object_mean_absolute_rgb_normalized': report['worst_object_mean_absolute_rgb_normalized'],
        'all_alpha_channels_identical': report['all_alpha_channels_identical'],
        'human_review_notes': 'See README.md and web-handoff.md; browser validation remains pending',
    }
    optimization_path.write_text(json.dumps(optimization, indent=2), encoding='utf-8')
    print(json.dumps({'matched_views': len(reports),
                      'worst_mean_rgb_difference': report['worst_object_mean_absolute_rgb_normalized'],
                      'all_alpha_channels_identical': report['all_alpha_channels_identical']}, indent=2))


if __name__ == '__main__':
    compare()
