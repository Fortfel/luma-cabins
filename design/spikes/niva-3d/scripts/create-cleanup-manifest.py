"""Inventory only. Copy provenance and write a keep-list; never delete any files."""

import collections
import datetime
import json
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def create():
    provenance = ROOT / 'validation/polyhaven-assets.json'
    if provenance.exists():
        shutil.copy2(provenance, ROOT / 'texture-sources.json')
    sources = json.loads((ROOT / 'texture-sources.json').read_text(encoding='utf-8'))
    keep = {}

    def retain(paths, category):
        for path in paths:
            keep[path] = category

    retain(('niva-final.blend', 'niva-configurator.glb', 'niva-camera.json', 'niva-presets.json',
            'niva-configurator-delivery.json', 'renders/niva-configurator-poster.png',
            'finishes/textures/exterior-whitewashed-timber-basecolor.jpg',
            'finishes/textures/exterior-charred-black-oil-basecolor.jpg',
            'finishes/textures/interior-warm-ash-basecolor.jpg',
            'finishes/textures/interior-dark-walnut-basecolor.jpg'), 'Current source and runtime delivery')
    retain(('README.md', 'web-handoff.md', 'texture-sources.json', 'cleanup-keep.md', 'cleanup-manifest.json'),
           'Documentation and provenance')
    retain(('niva.glb', 'niva-web-candidate.glb'), 'Preserved full-quality and approved web baselines')
    retain(('renders/niva-finishes-canonical-sheet.png', 'renders/niva-finishes-orbit-sheet.png',
            'renders/niva-interior-finish-detail.png', 'renders/finishes/handle-handle-detail.png',
            'validation/finish-review.json', 'validation/finish-readability.json',
            'validation/configurator-package.json'), 'Compact earlier review evidence (before final WC trim correction)')
    retain((path.relative_to(ROOT).as_posix() for path in (ROOT / 'scripts').glob('*.py')), 'Python source scripts')
    retain(('textures/niva-natural-cladding-2k.jpg', 'textures/niva-light-oak-2k.jpg',
            'textures/oak_veneer_01-orm.png', 'textures/wood_floor-orm.png', 'textures/niva-sage-linen-512.jpg'),
           'Reusable full-quality texture inputs')
    for asset in sources['assets']:
        retain((item['file'].replace('\\', '/') for item in asset['maps'].values()), 'Reusable full-quality texture inputs')

    manifest_names = {'cleanup-keep.md', 'cleanup-manifest.json'}
    inventory = []
    for path in sorted(ROOT.rglob('*')):
        if not path.is_file():
            continue
        relative = path.relative_to(ROOT).as_posix()
        if relative in manifest_names:
            continue
        inventory.append({'path': relative, 'bytes': path.stat().st_size,
                          'recommendation': 'keep' if relative in keep else 'not-needed-for-current-delivery',
                          'category': keep.get(relative, 'Historical/intermediate/generated output')})
    present = {item['path'] for item in inventory}
    missing = sorted(path for path in keep if path not in present and path not in manifest_names)
    kept = [item for item in inventory if item['recommendation'] == 'keep']
    removable = [item for item in inventory if item['recommendation'] != 'keep']
    grouped = collections.defaultdict(lambda: {'files': 0, 'bytes': 0})
    for item in removable:
        directory = item['path'].split('/')[0] if '/' in item['path'] else '(root intermediates)'
        grouped[directory]['files'] += 1
        grouped[directory]['bytes'] += item['bytes']
    summary = {'inventory_files': len(inventory), 'recommended_keep_files': len(kept) + 2,
               'recommended_keep_bytes_excluding_manifests': sum(item['bytes'] for item in kept),
               'not_needed_files': len(removable), 'not_needed_bytes': sum(item['bytes'] for item in removable)}
    report = {'generated_at': datetime.datetime.now().isoformat(timespec='seconds'),
              'scope': 'Only design/spikes/niva-3d; no application/public assets or other cabins',
              'action_taken': 'Inventory and documentation only; zero deletions; no model tests or renders',
              'summary': summary, 'inventory_totals_exclude_two_generated_manifests': True,
              'keep_files': sorted(keep), 'missing_keep_files': missing,
              'outside_scope_keep': ['design/spikes/cabin-3d-pipeline.md'],
              'not_needed_by_directory': dict(grouped), 'files': inventory}
    (ROOT / 'cleanup-manifest.json').write_text(json.dumps(report, indent=2), encoding='utf-8')

    mib = lambda value: f'{value / 1048576:,.1f} MiB'
    lines = ['# Niva Cleanup Keep-List', '',
             '**No files were deleted. No model tests or renders were run.** This is a recommendation for your manual cleanup.', '',
             f"Inventory: {summary['inventory_files']} files plus these two generated manifests. Keep the {summary['recommended_keep_files']} files listed below "
             f"({mib(summary['recommended_keep_bytes_excluding_manifests'])}, excluding these two manifest files). "
             f"The other {summary['not_needed_files']} inventoried files occupy {mib(summary['not_needed_bytes'])} and are not needed for this retained set.", '',
             '## Rules', '',
             '- Paths below are relative to `design/spikes/niva-3d/`. Keep their parent folders.',
             '- `niva-final.blend` is the current editable master; `niva-configurator.glb` is the current runtime export.',
             '- Keep the two baseline GLBs for rollback/reference. Do not use them instead of the final export.',
             '- Keep the compact review evidence as historical reference: it predates the final WC trim change.',
             '- Keep source scripts and the listed texture inputs for reuse/provenance. Some scripts represent earlier stages; the final WC-frame stage must be applied last if rebuilding.',
             '- Do not run regeneration/check scripts just to clean the folder. Runtime consumption needs only the final GLB, camera/preset JSON, poster and four finish JPEGs.',
             '- This manifest applies only to files enumerated in `cleanup-manifest.json`. Do not treat later work as automatically disposable.',
             '- Outside this folder, also keep `design/spikes/cabin-3d-pipeline.md`. Do not clean application/public files or other cabins using this list.', '',
             '## Exact Files To Keep', '']
    for category in dict.fromkeys(keep.values()):
        lines.extend(['### ' + category, '', '```text'])
        lines.extend(sorted(path for path, reason in keep.items() if reason == category))
        lines.extend(['```', ''])
    lines.extend(['## Everything Else In This Inventory', '',
                  'The JSON lists each remaining file as `not-needed-for-current-delivery`; no deletion has been performed. This includes older/intermediate blends and `.blend1` backups, old delivery metadata, diagnostic GLBs, dated backup trees, individual render batches/turntable frames, old comparison outputs, unused construction textures and Python bytecode caches.', '',
                  '| Area | Files not needed | Space |', '| --- | ---: | ---: |'])
    for directory, values in sorted(grouped.items()):
        lines.append(f"| `{directory}` | {values['files']} | {mib(values['bytes'])} |")
    if missing:
        lines.extend(['', '## Missing keep-paths', '', *[f'- `{path}`' for path in missing]])
    lines.extend(['', 'Source texture provenance was copied to `texture-sources.json`, so the large historical validation trees are not needed for license/source information.',
                  'The retained review JSON may reference individual frames omitted from the keep-set; the retained contact sheets are the compact visual reference. Re-render only in a later authorized task if individual frames are needed.'])
    (ROOT / 'cleanup-keep.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(json.dumps({'summary': summary, 'missing_keep_files': missing, 'deleted_files': 0}, indent=2))


if __name__ == '__main__':
    create()
