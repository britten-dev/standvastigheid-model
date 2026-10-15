"""Trace the stations of the Washington's body plan.

Input: docs/trace/body-seeds.json — one seed point per station, chosen by eye on the
body plan where that station is clear of its neighbours, the diagonals and the labels.
Output: .cache/draught/body-traces.json (pixel polylines) and a check image.

Each station is followed down to the keel and up as far as it can be followed, and cut
where the trace turns abruptly (which means it has jumped to another line, usually the
edge of a wale band).
"""
import sys, json, math, os
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np
import tracker, overlay, mosaic

ROOT = mosaic.ROOT


def clip_turns(pts, seed, max_turn=0.45, span=8):
    def head(a, b):
        return math.atan2(b[1] - a[1], b[0] - a[0])
    n = len(pts)
    bad = [False] * n
    for i in range(span, n - span):
        h1 = head(pts[i - span], pts[i]); h2 = head(pts[i], pts[i + span])
        if abs((h2 - h1 + math.pi) % (2 * math.pi) - math.pi) > max_turn:
            bad[i] = True
    si = min(range(n), key=lambda j: (pts[j][0] - seed[0]) ** 2 + (pts[j][1] - seed[1]) ** 2)
    a = si
    while a > 0 and not bad[a - 1]: a -= 1
    b = si
    while b < n - 1 and not bad[b + 1]: b += 1
    return pts[a:b + 1]


def run(seeds_path, out_json, out_png, only=None):
    k = np.load(os.path.join(ROOT, '.cache/draught/body_ink.npy'))
    img, _, _ = mosaic.sheet_a_body()
    spec = json.load(open(seeds_path))
    out = json.load(open(out_json)) if (only and os.path.exists(out_json)) else {}
    lines = []
    for name, s in spec['stations'].items():
        if only and name not in only: continue
        x, y = s['seed']
        o = tracker.orientation(k, x, y)
        if o[1] < 0: o = -o  # point toward the keel
        lim = s.get('top', 1300)
        win = s.get('win', 2.5)
        fore = x > spec['centreline_x']
        lo = spec['fore_keel_x'] if fore else spec['aft_outer_x']
        hi = spec['fore_outer_x'] if fore else spec['aft_keel_x']
        inside = lambda X, Y: lo < X < hi
        down = tracker.follow(k, (x, y), o, step=2.0, win=win, thr=0.11,
                              keep=lambda X, Y: Y < spec['rabbet_y'] + 25 and inside(X, Y))
        up = tracker.follow(k, (x, y), -o, step=2.0, win=win, thr=0.11,
                            keep=lambda X, Y: Y > lim and inside(X, Y))
        pts = up[::-1] + down[1:]
        pts = clip_turns(pts, (x, y), max_turn=s.get('max_turn', 0.45))
        out[name] = pts
        lines.append({'pts': pts, 'label': name})
    json.dump(out, open(out_json, 'w'))
    if only:
        lines = [{'pts': out[n], 'label': n} for n in only if n in out]
        overlay.render(img, 0, 1600, 1400, 1300, lines=lines, scale=0.8, path=out_png)
    else:
        overlay.render(img, 0, 1100, 2800, 1800, lines=lines, scale=0.5, path=out_png)
    return out


if __name__ == '__main__':
    run(os.path.join(ROOT, 'docs/trace/body-seeds.json'), os.path.join(ROOT, '.cache/draught/body-traces.json'),
        sys.argv[1], only=sys.argv[2:] or None)
