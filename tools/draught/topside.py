"""Follow each station up through the wales to the top of the side.

Inside the wale bands the station lines are drawn dotted over hatching, so the line
follower loses them. Here each station is carried upward row by row instead: a curve is
fitted to what has been found so far, extrapolated one row, and the dark crossing nearest
to the prediction (within a few pixels) is taken. Rows with no crossing near enough are
skipped, which is how the dotted stretches are bridged. Output: .cache/draught/topsides.json
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np
import mosaic, overlay

ROOT = mosaic.ROOT
k = np.load(os.path.join(ROOT, '.cache/draught/body_ink.npy'))
T = json.load(open(os.path.join(ROOT, '.cache/draught/body-traces.json')))
seeds = json.load(open(os.path.join(ROOT, 'docs/trace/body-seeds.json')))
C = seeds['centreline_x']


def crossings(y, x0, x1, thr=0.14):
    row = k[y - 1:y + 2, int(min(x0, x1)):int(max(x0, x1))].mean(axis=0)
    out = []
    i = 0
    while i < len(row):
        if row[i] > thr:
            j = i
            while j < len(row) and row[j] > thr:
                j += 1
            seg = row[i:j]
            out.append(min(x0, x1) + i + float((np.arange(len(seg)) * seg).sum() / seg.sum()))
            i = j
        else:
            i += 1
    return out


def climb(name, y_stop=930, tol=4.0, fit_rows=140):
    p = np.array(T[name], float)
    p = p[p[:, 1] < seeds['rabbet_y'] - 60]
    p = p[np.argsort(p[:, 1])]
    # start from the clean part of the trace below the main wale
    start = p[:, 1].min()
    pts = [tuple(q) for q in p if q[1] < start + 220]
    y = int(start) - 1
    misses = 0
    while y > y_stop:
        a = np.array(pts[:fit_rows // 2]) if len(pts) > 10 else np.array(pts)
        a = np.array(sorted(pts, key=lambda q: q[1])[:60])
        c = np.polyfit(a[:, 1], a[:, 0], 2 if len(a) > 20 else 1)
        xp = np.polyval(c, y)
        xs = crossings(y, xp - 12, xp + 12)
        best = min(xs, key=lambda x: abs(x - xp)) if xs else None
        if best is not None and abs(best - xp) <= tol:
            pts.append((best, y)); misses = 0
        else:
            misses += 1
            if misses > 160:
                break
        y -= 1
    return sorted(pts, key=lambda q: -q[1])


if __name__ == '__main__':
    names = sys.argv[2:] or [n for n in T if n.isdigit()]
    out = {}
    lines = []
    for n in names:
        pts = climb(n)
        out[n] = pts
        lines.append({'pts': pts, 'label': n})
        top = min(q[1] for q in pts)
        print(n, len(pts), 'reached y', round(top))
    path = os.path.join(ROOT, '.cache/draught/topsides.json')
    prev = json.load(open(path)) if os.path.exists(path) else {}
    prev.update(out)
    json.dump(prev, open(path, 'w'))
    img, _, _ = mosaic.sheet_a_body()
    overlay.render(img, 0, 850, 2800, 1300, lines=lines, scale=0.5, path=sys.argv[1])
