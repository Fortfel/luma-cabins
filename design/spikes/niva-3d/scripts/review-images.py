"""Build image-only comparison sheets and encode the Eevee orbit, not a web renderer.

Run from the repo: uv run --no-project --with pillow python design/spikes/niva-3d/scripts/review-images.py
Requires ffmpeg and ffprobe on PATH. Does not install or modify JavaScript dependencies.
"""

import json
import math
import subprocess
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat


ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[2]
RENDERS = ROOT / 'renders'
VALIDATION = ROOT / 'validation'
RATIO = 954 / 866
FONT_PATH = Path('C:/Windows/Fonts/arial.ttf')
VIEWPORTS = ((1536, 960), (1280, 800), (1279, 900), (1024, 1366), (768, 1024), (375, 812), (350, 780))


def background_color():
    # CSS oklch(0.97 0.007 88.642), resolved to display sRGB without a tone-mapping transform.
    lightness, chroma, hue = 0.97, 0.007, math.radians(88.642)
    a, b = chroma * math.cos(hue), chroma * math.sin(hue)
    l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (lightness - 0.0894841775 * a - 1.2914855480 * b) ** 3
    linear = (4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
              -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
              -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)
    srgb = [12.92 * channel if channel <= 0.0031308 else 1.055 * channel ** (1 / 2.4) - 0.055 for channel in linear]
    return tuple(round(max(0, min(1, channel)) * 255) for channel in srgb), srgb


BACKGROUND, BACKGROUND_FLOAT = background_color()
INK, MUTED = (38, 41, 36), (91, 93, 83)


def font(size):
    return ImageFont.truetype(str(FONT_PATH), size) if FONT_PATH.exists() else ImageFont.load_default(size=size)


def composite(image):
    result = Image.new('RGBA', image.size, (*BACKGROUND, 255))
    return Image.alpha_composite(result, image.convert('RGBA')).convert('RGB')


def media_size(viewport):
    if viewport >= 1280:
        height = min(320, max(260, -2.5 * 16 + 0.23438 * viewport))
    else:
        height = min(300, max(96, 1.197 * 16 + 0.21959 * viewport))
    return height * RATIO, height


def place_contain(sheet, image, x, y, width, height):
    # Match object-contain at DPR 1. Fractional CSS boxes round only at raster output.
    scale = min(width / image.width, height / image.height)
    dimensions = (round(image.width * scale), round(image.height * scale))
    resized = composite(image).resize(dimensions, Image.Resampling.LANCZOS)
    sheet.paste(resized, (round(x + (width - dimensions[0]) / 2), round(y + (height - dimensions[1]) / 2)))


def side_by_side(left, right, output, labels, native=False):
    image_width, image_height = (954, 866) if native else (353, 320)
    width, height = image_width * 2 + 96, image_height + 128
    sheet = Image.new('RGB', (width, height), BACKGROUND)
    draw = ImageDraw.Draw(sheet)
    draw.text((32, 18), 'NIVA / REVISED BLENDER BUILD', font=font(22), fill=INK)
    for index, (image, label) in enumerate(zip((left, right), labels)):
        x = 32 + index * (image_width + 32)
        draw.text((x, 58), label, font=font(16), fill=MUTED)
        place_contain(sheet, image, x, 88, image_width, image_height)
    sheet.save(output)
    return list(sheet.size)


def comparisons():
    reference = Image.open(REPO / 'apps/nextjs/public/images/huts/niva/Niva-wood.png').convert('RGBA')
    canonical = Image.open(RENDERS / 'niva-canonical.png').convert('RGBA')
    assert reference.size == canonical.size == (954, 866)
    bbox = canonical.getchannel('A').getbbox()
    assert bbox and bbox[0] > 0 and bbox[1] > 0 and bbox[2] < 954 and bbox[3] < 866, 'Canonical is clipped'
    rows = []
    for viewport_width, viewport_height in VIEWPORTS:
        width, height = media_size(viewport_width)
        rows.append({'viewport': [viewport_width, viewport_height], 'media_box_css_px': [width, height],
                     'image_raster_px_dpr1': [round(width), round(height)]})
    height = 118 + sum(math.ceil(row['media_box_css_px'][1]) + 76 for row in rows) + 60
    sheet = Image.new('RGB', (1100, height), BACKGROUND)
    draw = ImageDraw.Draw(sheet)
    draw.text((36, 24), 'NIVA / SHOWCASE-SIZE COMPARISON', font=font(28), fill=INK)
    draw.text((36, 67), 'Shipped PNG (left)  |  Authored Eevee render (right)  |  1 image pixel = 1 CSS px', font=font(17), fill=MUTED)
    y = 118
    for row in rows:
        viewport_width, viewport_height = row['viewport']
        width, height = row['media_box_css_px']
        draw.line((36, y, 1064, y), fill=(213, 212, 204))
        draw.text((36, y + 13), f'VIEWPORT {viewport_width} x {viewport_height} / media {width:.3f} x {height:.3f} px',
                  font=font(16), fill=INK)
        for image, center_x in ((reference, 292), (canonical, 808)):
            place_contain(sheet, image, center_x - width / 2, y + 46, width, height)
        y += math.ceil(height) + 76
    draw.text((36, y + 12), 'Image-only sizing evidence. Browser GLB appearance and performance have not been tested.', font=font(16), fill=MUTED)
    sheet.save(RENDERS / 'niva-showcase-comparison.png')
    native_dimensions = side_by_side(reference, canonical, RENDERS / 'niva-native-comparison.png',
                                    ('SHIPPED PNG / 954 x 866', 'AUTHORED EEVEE / 954 x 866'), native=True)
    desktop_dimensions = side_by_side(reference, canonical, RENDERS / 'niva-desktop-comparison.png',
                                     ('SHIPPED PNG / desktop maximum', 'AUTHORED EEVEE / desktop maximum'))
    manifest = {'background_token': 'oklch(0.97 0.007 88.642)', 'background_srgb_float': BACKGROUND_FLOAT,
                'background_rgb8': BACKGROUND, 'background_hex': '#%02x%02x%02x' % BACKGROUND,
                'source_canvas': [954, 866], 'source_alpha_extrema': reference.getchannel('A').getextrema(),
                'source_alpha_bbox': reference.getchannel('A').getbbox(),
                'canonical_alpha_bbox': canonical.getchannel('A').getbbox(),
                'root_font_px': 16, 'dpr': 1, 'object_fit': 'contain', 'rows': rows,
                'native_sheet_px': native_dimensions, 'desktop_sheet_px': desktop_dimensions,
                'showcase_sheet_px': list(sheet.size), 'verification_scope': 'CSS-derived image sizing, not a browser runtime check'}
    (VALIDATION / 'comparison-settings.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    return manifest


def roundtrip_differences():
    details = ['interior-front', 'interior-right', 'roof-apex-detail', 'loft-window-detail', 'stove-detail',
               'sink-detail', 'ceiling-detail', 'loft-interior']
    angles = ['canonical', 'front', 'front-left', 'left', 'rear-left', 'rear', 'rear-right', 'right', 'front-right', 'no-interior-lights', *details]
    reports = []
    for angle in angles:
        source = Image.open(RENDERS / f'niva-{angle}.png').convert('RGBA')
        imported = Image.open(VALIDATION / f'niva-roundtrip-{angle}.png').convert('RGBA')
        assert source.size == imported.size == ((1280, 960) if angle in details else (954, 866))
        diff = ImageChops.difference(composite(source), composite(imported))
        mask = ImageChops.lighter(source.getchannel('A'), imported.getchannel('A')).point(lambda x: 255 if x else 0)
        stat = ImageStat.Stat(diff, mask)
        alpha_diff = ImageChops.difference(source.getchannel('A'), imported.getchannel('A'))
        reports.append({'angle': angle, 'object_mean_absolute_rgb_8bit': stat.mean,
                        'object_mean_absolute_rgb_normalized': sum(stat.mean) / (3 * 255),
                        'alpha_max_difference_8bit': alpha_diff.getextrema()[1],
                        'source_alpha_bbox': source.getchannel('A').getbbox(),
                        'roundtrip_alpha_bbox': imported.getchannel('A').getbbox()})
        if angle == 'canonical':
            side_by_side(source, imported, RENDERS / 'niva-roundtrip-comparison.png',
                         ('EDITABLE SOURCE / EEVEE', 'REIMPORTED GLB / SAME EEVEE STAGING'), native=True)
    (VALIDATION / 'round-trip-image-differences.json').write_text(json.dumps(reports, indent=2), encoding='utf-8')
    return reports


def contact_sheets():
    sheet = Image.new('RGB', (1280, 568), BACKGROUND)
    draw = ImageDraw.Draw(sheet)
    for index, (name, label) in enumerate((('interior-front', 'FRONT / WC - VERTICAL LADDER - KITCHEN'),
                                          ('interior-right', 'RIGHT / SOFA - CLOSED WC - LADDER'))):
        x = index * 640
        draw.text((x + 20, 22), label, font=font(17), fill=INK)
        place_contain(sheet, Image.open(RENDERS / f'niva-{name}.png'), x + 16, 64, 608, 456)
    sheet.save(RENDERS / 'niva-interior-contact-sheet.png')
    sheet = Image.new('RGB', (1440, 432), BACKGROUND)
    draw = ImageDraw.Draw(sheet)
    for index, (name, label) in enumerate((('roof-apex-detail', 'CLOSED ROOF APEX'),
                                          ('loft-window-detail', 'SMALLER LOFT WINDOW / CLEAR TRIM'),
                                          ('stove-detail', 'CORNER STOVE / CONNECTED FLUE'))):
        x = index * 480
        draw.text((x + 16, 20), label, font=font(16), fill=INK)
        place_contain(sheet, Image.open(RENDERS / f'niva-{name}.png'), x + 12, 60, 456, 342)
    sheet.save(RENDERS / 'niva-fixes-contact-sheet.png')
    angles = ['front', 'front-left', 'left', 'rear-left', 'rear', 'rear-right', 'right', 'front-right']
    sheet = Image.new('RGB', (1280, 740), BACKGROUND)
    draw = ImageDraw.Draw(sheet)
    for index, angle in enumerate(angles):
        x, y = (index % 4) * 320, (index // 4) * 370
        draw.text((x + 20, y + 16), angle.upper(), font=font(17), fill=INK)
        image = Image.open(RENDERS / f'niva-{angle}.png')
        place_contain(sheet, image, x + 8, y + 46, 304, 292)
    sheet.save(RENDERS / 'niva-angle-contact-sheet.png')
    sheet = Image.new('RGB', (1272, 990), BACKGROUND)
    draw = ImageDraw.Draw(sheet)
    for index in range(12):
        x, y = (index % 4) * 318, (index // 4) * 330
        frame = index * 12 + 1
        image = Image.open(RENDERS / 'turntable-frames' / f'{frame:04}.png')
        draw.text((x + 16, y + 10), f'ORBIT {index * 30:03} DEG / frame {frame}', font=font(14), fill=INK)
        place_contain(sheet, image, x, y + 34, 318, 289)
    sheet.save(RENDERS / 'niva-turntable-contact-sheet.png')


def encode_turntable():
    frames = sorted((RENDERS / 'turntable-frames').glob('*.png'))
    assert len(frames) == 144, f'Expected 144 frames, found {len(frames)}'
    frame_metadata = []
    for frame in frames:
        image = Image.open(frame)
        assert image.size == (636, 578)
        bbox = image.getchannel('A').getbbox()
        assert bbox and bbox[0] > 0 and bbox[1] > 0 and bbox[2] < 636 and bbox[3] < 578, f'Clipped orbit: {frame.name}'
        frame_metadata.append({'frame': frame.name, 'alpha_bbox': bbox})
    background = '#%02x%02x%02x' % BACKGROUND
    command = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
               '-f', 'lavfi', '-i', f'color=c={background}:s=636x578:r=24',
               '-framerate', '24', '-i', str(RENDERS / 'turntable-frames' / '%04d.png'),
               '-filter_complex', '[0:v][1:v]overlay=shortest=1:format=auto,format=yuv420p',
               '-frames:v', '144', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium',
               '-movflags', '+faststart', str(RENDERS / 'niva-turntable.mp4')]
    subprocess.run(command, check=True)
    probe = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0',
                            '-show_entries', 'stream=codec_name,width,height,nb_read_frames,r_frame_rate,duration',
                            '-of', 'json', str(RENDERS / 'niva-turntable.mp4')], check=True, capture_output=True, text=True)
    metadata = json.loads(probe.stdout)
    stream = metadata['streams'][0]
    assert int(stream['nb_read_frames']) == 144 and stream['r_frame_rate'] == '24/1'
    metadata['encoded_bytes'] = (RENDERS / 'niva-turntable.mp4').stat().st_size
    metadata['full_orbit_degrees'] = 360
    metadata['step_degrees'] = 2.5
    metadata['motion_blur'] = False
    metadata['frames'] = frame_metadata
    (VALIDATION / 'turntable-stats.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')
    return stream


if __name__ == '__main__':
    progress = json.loads((VALIDATION / 'render-progress.json').read_text(encoding='utf-8'))
    assert progress['state'] == 'complete', 'Wait until Blender finishes all render jobs'
    manifest = comparisons()
    differences = roundtrip_differences()
    contact_sheets()
    stream = encode_turntable()
    print(json.dumps({'background': manifest['background_hex'], 'showcase_rows': manifest['rows'],
                      'worst_roundtrip_mean_rgb': max(row['object_mean_absolute_rgb_normalized'] for row in differences),
                      'turntable': stream}, indent=2))
