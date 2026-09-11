"""Write handoff metadata and copy the candidate-aligned poster. No Blender or web changes."""

import hashlib
import json
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def finalize():
    export = json.loads((ROOT / 'validation/export-stats.json').read_text())
    optimization = json.loads((ROOT / 'validation/texture-optimization.json').read_text())
    comparison = json.loads((ROOT / 'validation/web-candidate/image-comparison.json').read_text())
    progress = json.loads((ROOT / 'validation/web-candidate/progress.json').read_text())
    assert progress['state'] == 'complete' and optimization['visual_comparison']['state'] == 'completed'
    shutil.copyfile(ROOT / 'validation/web-candidate/candidate-canonical.png', ROOT / 'renders/niva-web-poster.png')
    paths = {'editable_source': 'niva.blend', 'full_quality_baseline': 'niva.glb',
             'web_candidate': 'niva-web-candidate.glb', 'candidate_poster': 'renders/niva-web-poster.png'}
    if (ROOT / 'validation/niva-master-at-export.blend').exists():
        paths['editable_source_at_export'] = 'validation/niva-master-at-export.blend'
    assets = {key: {'path': path, 'bytes': (ROOT / path).stat().st_size,
                    'sha256': hashlib.sha256((ROOT / path).read_bytes()).hexdigest()} for key, path in paths.items()}
    source_resave = None
    if assets['editable_source']['sha256'] != optimization['source_blend_sha256']:
        source_resave = json.loads((ROOT / 'validation/source-resave-check.json').read_text())
        assert assets['editable_source_at_export']['sha256'] == optimization['source_blend_sha256']
        assert source_resave['current_source_sha256'] == assets['editable_source']['sha256']
        assert source_resave['baseline_sha256'] == assets['full_quality_baseline']['sha256']
        assert all(source_resave[key] for key in ('indexed_positions_and_normals_identical',
                   'material_node_image_semantics_unchanged', 'texture_bytes_unchanged',
                   'lighting_values_unchanged', 'camera_matrix_unchanged'))
    assert assets['full_quality_baseline']['sha256'] == optimization['baseline_sha256']
    assert assets['web_candidate']['sha256'] == optimization['candidate_sha256']
    assert (ROOT / 'validation/niva-unoptimized.glb').read_bytes() == (ROOT / 'niva.glb').read_bytes()
    report = {'status': 'Blender review and texture-only web-asset preparation complete; browser implementation not started',
              'assets': assets, 'handoff': 'web-handoff.md', 'triangles': export['triangles'], 'meshes': export['mesh_count'],
              'nodes': export['node_count'], 'material_count': len(export['material_names']),
              'configurable_materials': ['ExteriorCladding', 'InteriorJoinery'],
              'glb_forward': '+Z', 'glb_up': '+Y', 'origin': 'ground level near shell footprint center',
              'camera': export['canonical'], 'background_srgb': '#f7f5f0', 'hdri_bytes': 0,
              'baseline_size_bytes': optimization['baseline_bytes'], 'candidate_size_bytes': optimization['candidate_bytes'],
              'texture_optimization_percent': optimization['reduction_percent'],
              'texture_images': optimization['images'],
              'geometry_buffers_byte_identical': optimization['geometry_buffers_byte_identical'],
              'material_and_node_semantics_identical': optimization['nonimage_semantics_identical'],
              'worst_matched_view_mean_rgb_difference': comparison['worst_object_mean_absolute_rgb_normalized'],
              'alpha_identical_all_matched_views': comparison['all_alpha_channels_identical'],
              'lighting_reference': 'validation/export-stats.json',
              'source_resave_verification': 'validation/source-resave-check.json' if source_resave else None,
              'browser_validation': 'pending', 'production_performance_approval': False}
    (ROOT / 'delivery-manifest.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps({'assets': assets, 'candidate_reduction_percent': optimization['reduction_percent']}, indent=2))


if __name__ == '__main__':
    finalize()
