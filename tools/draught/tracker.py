"""Follow a single drawn line across an ink image, from a seed, in both directions.

The draught is a pen drawing: every station, waterline, wale and deck is a thin dark
line. A line is followed by stepping along its own direction and, at each step, looking
across it (along the normal) for the dark peak nearest to where the line was predicted
to be. Crossing lines — diagonals, other stations — cut the search window briefly and
are passed over because the nearest peak to the prediction is still our own line.
"""
import numpy as np


def sample(k, xs, ys):
    """Bilinear sample of image k at float coordinates."""
    h, w = k.shape
    xs = np.clip(xs, 0, w - 1.001)
    ys = np.clip(ys, 0, h - 1.001)
    x0 = np.floor(xs).astype(int); y0 = np.floor(ys).astype(int)
    fx = xs - x0; fy = ys - y0
    a = k[y0, x0]; b = k[y0, x0 + 1]; c = k[y0 + 1, x0]; d = k[y0 + 1, x0 + 1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def peak_near(profile, offsets, thr):
    """The dark peak nearest offset 0, refined to sub-pixel; None if nothing is dark enough."""
    best = None
    for i in range(1, len(profile) - 1):
        v = profile[i]
        if v < thr or v < profile[i - 1] or v < profile[i + 1]:
            continue
        den = profile[i - 1] - 2 * v + profile[i + 1]
        sub = 0.0 if abs(den) < 1e-9 else 0.5 * (profile[i - 1] - profile[i + 1]) / den
        o = offsets[i] + sub * (offsets[1] - offsets[0])
        if best is None or abs(o) < abs(best):
            best = o
    return best


def follow(k, seed, heading, step=3.0, win=4.0, thr=0.10, max_gap=8, max_steps=4000,
           keep=None, turn_limit=0.35):
    """Follow a line from `seed` along `heading` (a 2-vector). Returns [(x, y), ...].

    keep(x, y) -> bool stops the trace when it returns False.
    turn_limit is the largest change of heading allowed per step (radians).
    """
    p = np.array(seed, dtype=float)
    d = np.array(heading, dtype=float); d /= np.linalg.norm(d)
    pts = [p.copy()]
    offs = np.arange(-win, win + 0.25, 0.25)
    gap = 0
    for _ in range(max_steps):
        q = p + step * d
        n = np.array([-d[1], d[0]])
        prof = sample(k, q[0] + offs * n[0], q[1] + offs * n[1])
        o = peak_near(prof, offs, thr)
        if o is None:
            gap += 1
            if gap > max_gap:
                break
            p = q
            continue
        gap = 0
        newp = q + o * n
        nd = newp - p; nd /= np.linalg.norm(nd)
        ang = np.arctan2(d[0] * nd[1] - d[1] * nd[0], d @ nd)
        if abs(ang) > turn_limit:
            nd = rot(d, np.sign(ang) * turn_limit)
            newp = p + step * nd
        # Smooth the heading over the last few points so one noisy step cannot steer it.
        pts.append(newp.copy())
        if len(pts) > 5:
            back = pts[-1] - pts[-5]
            nd = back / np.linalg.norm(back)
        d = nd
        p = newp
        if keep is not None and not keep(p[0], p[1]):
            break
    # Trailing gap points were not on ink; drop them.
    return [tuple(x) for x in pts]


def rot(v, a):
    c, s = np.cos(a), np.sin(a)
    return np.array([c * v[0] - s * v[1], s * v[0] + c * v[1]])


def trace(k, seed, heading, **kw):
    """Both directions from the seed, joined into one polyline ordered along `heading`."""
    fwd = follow(k, seed, heading, **kw)
    back = follow(k, seed, (-heading[0], -heading[1]), **kw)
    return back[::-1][:-1] + fwd


def crossings(k, y, x0, x1, thr=0.12):
    """Centres of dark runs along a horizontal scanline (averaged over 3 rows)."""
    row = k[y - 1:y + 2, x0:x1].mean(axis=0)
    out = []
    i = 0
    while i < len(row):
        if row[i] > thr:
            j = i
            while j < len(row) and row[j] > thr:
                j += 1
            seg = row[i:j]
            out.append(x0 + i + float((np.arange(len(seg)) * seg).sum() / seg.sum()))
            i = j
        else:
            i += 1
    return out


def orientation(k, x, y, r=6):
    """Direction of the line through (x, y), from the local gradient structure tensor."""
    xi, yi = int(round(x)), int(round(y))
    patch = k[yi - r - 1:yi + r + 2, xi - r - 1:xi + r + 2].astype(float)
    gy, gx = np.gradient(patch)
    gx = gx[1:-1, 1:-1]; gy = gy[1:-1, 1:-1]
    j = np.array([[(gx * gx).sum(), (gx * gy).sum()], [(gx * gy).sum(), (gy * gy).sum()]])
    w, v = np.linalg.eigh(j)
    d = v[:, 0]  # smallest eigenvalue: along the line
    return d / np.linalg.norm(d)


def along(k, p0, p1, thr=0.18, step=0.5):
    """Dark-run centres along a straight segment from p0 to p1, as (t, x, y)."""
    p0 = np.array(p0, float); p1 = np.array(p1, float)
    n = int(np.linalg.norm(p1 - p0) / step)
    ts = np.linspace(0, 1, n)
    pts = p0[None] + ts[:, None] * (p1 - p0)[None]
    v = sample(k, pts[:, 0], pts[:, 1])
    out = []
    i = 0
    while i < n:
        if v[i] > thr:
            j = i
            while j < n and v[j] > thr:
                j += 1
            seg = v[i:j]
            c = i + float((np.arange(len(seg)) * seg).sum() / seg.sum())
            t = c / (n - 1)
            pp = p0 + t * (p1 - p0)
            out.append((t, float(pp[0]), float(pp[1])))
            i = j
        else:
            i += 1
    return out
