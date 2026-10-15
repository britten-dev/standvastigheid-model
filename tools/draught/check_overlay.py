"""Draw the offset table back over the body plan it was measured from."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np
import mosaic, overlay

ROOT = mosaic.ROOT
AFT = 0.283133
d = json.load(open(os.path.join(ROOT, 'docs/offsets.json')))
seeds = json.load(open(os.path.join(ROOT, 'docs/trace/body-seeds.json')))
img, _, _ = mosaic.sheet_a_body()
C, KB, PX = seeds['centreline_x'], seeds['keel_bottom_y'], 49.87
h_lwl = d['dimensions']['lwl_above_keel_m'] / AFT
lines = []
for lab, z, row in zip(d['stationLabel'], d['stationZ'], d['halfBreadth']):
    if not lab.isdigit():
        continue
    side = 1 if z < 0 or lab == '10' else -1
    pts = []
    for wy, v in zip(d['waterlineY'], row):
        if v is None:
            continue
        h = wy / AFT + h_lwl
        pts.append((C + side * v / AFT * PX, KB - h * PX))
    lines.append({'pts': pts, 'colour': (220, 30, 30)})
wl_y = KB - h_lwl * PX
lines.append({'pts': [(50, wl_y), (2750, wl_y)], 'colour': (30, 90, 220), 'label': 'LWL'})
overlay.render(img, 0, 900, 2800, 2050, lines=lines, scale=0.5, path=sys.argv[1])
