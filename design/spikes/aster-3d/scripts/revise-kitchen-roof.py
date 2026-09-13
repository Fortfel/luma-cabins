"""Revision 6: continuous kitchen joinery and roof weathering details.

Apply to a preserved revision 5. Validation is an explicit subsequent step.
"""

import importlib.util
import math
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('aster_layout', ROOT / 'scripts/revise-layout.py')
r = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r)
b = r.b


def slab(name, outline, bottom, top, material='joinery', group='ShallowInterior'):
    n = len(outline)
    verts = [(x, y, z) for z in (bottom, top) for x, y in outline]
    faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, n * 2))]
    faces.extend((i, (i + 1) % n, (i + 1) % n + n, i + n) for i in range(n))
    return b.mesh(name, verts, faces, material, group)


def kitchen():
    s = bpy.context.scene
    # Viewer-right is -Y. Align the outside of the right cheek to the partition
    # end at Y=-.150; one 25mm cheek per side, without the former extra fillers.
    for obj in s.objects:
        if obj.name.startswith(('FridgeBody', 'RefrigeratorDoor', 'RefrigeratorRecessedPull',
                                'FreezerDoor', 'FreezerRecessedPull', 'FridgeTopCabinet_',
                                'FridgeTopFittedFascia')):
            obj.location.y -= 0.08
    r.remove_prefixes('FridgeFittedSidePanel', 'FridgeBaseReturnInfill',
                      'FridgeTopCabinetBottomInfill', 'KitchenReturnDrawers_',
                      'KitchenUpperCabinets_', 'KitchenUpperWoodenUnderside',
                      'KitchenContinuousLWorktop', 'KitchenCornerInfill')
    for label, y in (('Left', 0.5775), ('Right', -0.1375)):
        b.box('FridgeSurround' + label, (0.9775, y, 1.68), (0.725, 0.025, 2.52), 'joinery', bevel=0.001)
    b.box('FridgeTopBottomPanel', (1.0, 0.22, 2.4725), (0.66, 0.69, 0.025), 'joinery', bevel=0.001)
    r.cabinet('KitchenReturnDrawers', 1.01, 1.04, 0.90, 0.60, 0.81, 0.52, -math.pi / 2, True)
    # Continuous stone corner/return reaches the single left surround panel.
    top = slab('KitchenContinuousLWorktop', [(-1.11, 1.47), (0.655, 1.47),
               (0.655, 0.59), (1.34, 0.59), (1.34, 2.15), (-1.11, 2.15)], 1.33, 1.37, 'stone')
    b.cut(top, (-0.60, 1.78, 1.35), (0.53, 0.40, 0.30))

    # Two equal sink doors occupy all the space left of the oven, no filler plank.
    r.remove_prefixes('KitchenSinkCabinet_', 'KitchenCornerCabinet_Carcass', 'OvenBayLeftFiller')
    r.cabinet('KitchenSinkCabinet', -0.54, 1.82, 1.10, 0.60, 0.81, 0.52)
    b.cut(s.objects['KitchenSinkCabinet_Carcass'], (-0.60, 1.78, 1.32), (0.57, 0.44, 0.40))
    carcass = b.box('KitchenOvenCornerCarcass', (0.675, 1.825, 0.925), (1.33, 0.61, 0.81), 'joinery', bevel=0)
    b.cut(carcass, (0.33, 1.82, 0.945), (0.62, 0.80, 0.75))

    # A real L-shaped upper carcass closes the wall corner without overlapping
    # two complete cabinet boxes. The rear arm starts clear of the kitchen window.
    slab('KitchenUpperCornerCarcass', [(0.24, 1.78), (0.96, 1.78), (0.96, 0.59),
         (1.34, 0.59), (1.34, 2.10), (0.24, 2.10)], 2.20, 2.94)
    for i in range(2):
        x = 0.24 + (i + 0.5) * 0.36
        b.box('KitchenCornerRearDoor_' + str(i), (x, 1.761, 2.57), (0.348, 0.035, 0.72), 'joinery', bevel=0.003)
        hx = 0.60 + (-0.05 if i == 0 else 0.05)
        b.cylinder('KitchenCornerRearKnobStem_' + str(i), (hx, 1.745, 2.285), (hx, 1.711, 2.285), 0.009, 'joinery')
        b.cylinder('KitchenCornerRearKnob_' + str(i), (hx, 1.715, 2.285), (hx, 1.698, 2.285), 0.020, 'joinery', vertices=20)
        y = 0.59 + (i + 0.5) * 0.595
        b.box('KitchenCornerReturnDoor_' + str(i), (0.941, y, 2.57), (0.035, 0.583, 0.72), 'joinery', bevel=0.003)
        hy = 1.185 + (-0.05 if i == 0 else 0.05)
        b.cylinder('KitchenCornerReturnKnobStem_' + str(i), (0.925, hy, 2.285), (0.895, hy, 2.285), 0.009, 'joinery')
        b.cylinder('KitchenCornerReturnKnob_' + str(i), (0.900, hy, 2.285), (0.882, hy, 2.285), 0.020, 'joinery', vertices=20)


def roof():
    # Folded ridge capping covers both roof slopes and the full outer barge width.
    r.remove_prefixes('RidgeCap')
    profile = [(-0.25, 4.765), (-0.25, 4.821), (0, 4.982), (0.25, 4.821),
               (0.25, 4.765), (0.228, 4.765), (0.228, 4.809), (0, 4.956),
               (-0.228, 4.809), (-0.228, 4.765)]
    n = len(profile)
    verts = [(x, y, z) for x in (-4.49, 4.49) for y, z in profile]
    faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, n * 2))]
    faces.extend((i, (i + 1) % n, (i + 1) % n + n, i + n) for i in range(n))
    b.mesh('RidgeCap', verts, faces, 'roof', 'ExteriorDetails')
    for obj in bpy.context.scene.objects:
        if obj.name.startswith('EaveFascia_'):
            obj.scale.x *= 8.94 / 8.83
    # Closed end returns finish the eave/barge junction rather than exposing a
    # short roof edge. Keep gutter bodies clear and retain their drainage positions.
    for x in (-4.447, 4.447):
        for sign in (-1, 1):
            b.box('EaveCornerReturn_' + str((x, sign)), (x, sign * 2.535, 3.245),
                  (0.04, 0.13, 0.16), 'roof', 'ExteriorDetails', bevel=0.003)

    r.remove_prefixes('ChimneyFlashing', 'FlueWeatherCollar')
    cx, cy, count = -3.55, 1.64, 48
    def surface(y):
        return b.RIDGE - y * b.SLOPE + 0.111
    # Watertight sloped flashing with an actual circular pipe hole. Unlike the
    # old horizontal cone foot, every lower collar point follows the roof pitch.
    verts = []
    for layer in range(4):
        for i in range(count):
            a = i * math.tau / count
            ux, uy = math.cos(a), math.sin(a)
            radius = min(0.27 / max(abs(ux), 1e-8), 0.30 / max(abs(uy), 1e-8)) if layer in (0, 3) else 0.086
            x, y = cx + radius * ux, cy + radius * uy
            verts.append((x, y, surface(y) - (0.014 if layer >= 2 else 0)))
    faces = []
    for layer in range(4):
        nxt = (layer + 1) % 4
        for i in range(count):
            j = (i + 1) % count
            faces.append((layer * count + i, layer * count + j, nxt * count + j, nxt * count + i))
    b.mesh('ChimneyFlashing', verts, faces, 'roof', 'ExteriorDetails')
    verts = []
    for layer, radius in enumerate((0.18, 0.10, 0.086, 0.086)):
        for i in range(count):
            a = i * math.tau / count
            x, y = cx + radius * math.cos(a), cy + radius * math.sin(a)
            z = surface(y) + 0.002 if layer in (0, 3) else surface(cy) + 0.25
            verts.append((x, y, z))
    collar = b.mesh('FlueWeatherCollar', verts, faces, 'frame', 'ExteriorDetails')
    for poly in collar.data.polygons:
        poly.use_smooth = poly.index // count in (0, 2)


def apply_revision():
    scene = bpy.context.scene
    if scene.name != 'Aster_Source' or scene.get('layout_revision') != 5:
        raise RuntimeError('Use preserved Aster_Source revision 5.')
    r.setup()
    kitchen()
    roof()
    scene['layout_revision'] = 6
    scene['asset_status'] = 'Revision 6 authored; validation authorized and pending.'
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'aster-source.blend'))
    return {'revision': 6, 'status': scene['asset_status']}


if __name__ == '__main__':
    apply_revision()
