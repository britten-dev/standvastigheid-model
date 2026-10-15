"""Draw the built hull's profile lines back over the Washington's sheer plan."""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np
import calib, mosaic, overlay

ROOT = mosaic.ROOT
AFT = 0.283133
data = json.loads(subprocess.check_output(['node', os.path.join(ROOT, 'tools/draught/model-lines.mjs')]))
b = np.load(os.path.join(ROOT, '.cache/draught/sheetb.npy'))
sheer = json.load(open(os.path.join(ROOT, '.cache/draught/sheer_lines.json')))
kx, ky = np.array(sheer['keel_bot'], float).T
k = (kx > 300) & (kx < 8300)
fit = np.polyfit(kx[k], ky[k], 1)
pts = calib.scale_points()
xs = np.array([p[0] for p in pts], float); fs = np.array([p[1] for p in pts], float)
S10 = data['station10_s_ft']; H_LWL = data['lwl_above_keel_m'] / AFT


def to_px(z, y):
    s = S10 - z / AFT
    x = float(np.interp(s, fs, xs, left=xs[0] + (s - fs[0]) * 49.65, right=xs[-1] + (s - fs[-1]) * 49.65))
    h = y / AFT + H_LWL
    return (x, float(np.polyval(fit, x)) - h * 49.65)


lines = []
colours = {'keel_bottom': (220, 30, 30), 'rabbet': (220, 120, 0), 'wale_bottom': (30, 140, 30), 'wale_top': (30, 140, 30),
           'middle_wale_bottom': (30, 140, 30), 'middle_wale_top': (30, 140, 30), 'lower_deck': (30, 60, 220),
           'upper_deck': (30, 60, 220), 'rail': (200, 0, 160), 'standing_deck': (0, 150, 150), 'waterline': (0, 120, 255),
           'stem_fore_edge': (220, 30, 30)}
for key, col in colours.items():
    lines.append({'pts': [to_px(z, y) for z, y in data[key]], 'colour': col})
for p in data['ports']:
    lines.append({'pts': [to_px(z, y) for z, y in p], 'colour': (255, 0, 0)})
overlay.render(b, 0, 400, 11000, 2900, lines=lines, scale=0.2, path=sys.argv[1])
if len(sys.argv) > 2:
    overlay.render(b, 7400, 700, 2400, 2500, lines=lines, scale=0.5, path=sys.argv[2])
