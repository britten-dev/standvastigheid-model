import sys, json
sys.path.insert(0, 'tools/draught')
import tracker, overlay, mosaic, numpy as np
k = np.load('.cache/draught/body_ink.npy')
img, _, _ = mosaic.sheet_a_body()
half, y, x0, x1, sign = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
out = sys.argv[6]
c = tracker.along(k, (x0, y), (x1, y), thr=0.15)
seeds = []
for t, x, yy in c:
    d = tracker.orientation(k, x, yy)
    if d[0] < 0: d = -d
    if sign * d[1] < -0.15:
        if seeds and x - seeds[-1][0] < 4: continue
        seeds.append((x, yy, d))


def keep(X, Y):
    return 5 < X < 2795 and 600 < Y < 2830


def clip_turns(pts, max_turn=0.5, span=8):
    # A station is a smooth curve. If the trace swings by more than max_turn radians over
    # `span` steps it has jumped to another line (usually a wale edge); cut it there,
    # keeping the part either side of the seed.
    import math
    def head(a, b):
        return math.atan2(b[1] - a[1], b[0] - a[0])
    n = len(pts)
    bad = [False] * n
    for i in range(span, n - span):
        h1 = head(pts[i - span], pts[i]); h2 = head(pts[i], pts[i + span])
        dd = abs((h2 - h1 + math.pi) % (2 * math.pi) - math.pi)
        if dd > max_turn: bad[i] = True
    return bad


lines = []
for i, (x, yy, d) in enumerate(seeds):
    pts = tracker.trace(k, (x, yy), (d[0], d[1]), step=2.5, win=3.0, thr=0.12, keep=keep)
    bad = clip_turns(pts)
    si = min(range(len(pts)), key=lambda j: (pts[j][0] - x) ** 2 + (pts[j][1] - yy) ** 2)
    a = si
    while a > 0 and not bad[a - 1]: a -= 1
    b = si
    while b < len(pts) - 1 and not bad[b + 1]: b += 1
    pts = pts[a:b + 1]
    lines.append({'pts': pts, 'label': i, 'seed': [x, yy]})
    print(i, f'seed {x:.0f}', len(pts), f'y {min(p[1] for p in pts):.0f}..{max(p[1] for p in pts):.0f}')
json.dump(lines, open(f'.cache/draught/{half}_try.json', 'w'))
bx0 = 1380 if half == 'fore' else 0
overlay.render(img, bx0, 800, 1420, 2100, lines=lines, scale=0.7, path=out)
