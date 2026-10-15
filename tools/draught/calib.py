"""The drawing's own scale of feet, read off the bow-half photograph (sheet B).

Each tick of the scale under the keel is matched to the foot it marks, giving a
piecewise-linear map from photograph pixel to Amsterdam feet abaft... forward of the
scale's zero at the stern. Doing it piecewise takes out the stretch of the sheet at its
folds, which reaches about five per cent locally.
"""
import numpy as np
import mosaic, ticks

# Ticks that carry a printed figure, read by eye (pixel, feet). The rest are matched to
# the nearest whole foot (the first fifteen) or five feet (thereafter) between them.
ANCHORS = [(946, 15), (1191, 20), (1442, 25), (1683, 30), (1904, 35), (2155, 40), (2666, 50),
           (3175, 60), (3672, 70), (4170, 80), (4675, 90), (5173, 100), (5670, 110), (6166, 120),
           (6661, 130), (7153, 140), (7641, 150), (8136, 160), (8642, 170), (9086, 179)]


FOOT_TICKS = [(233, 1), (279, 2), (330, 3), (382, 4), (433, 5), (485, 6), (536, 7), (586, 8),
              (638, 9), (691, 10), (743, 11), (796, 12), (846, 13), (894, 14)]
FIVE_TICKS = [(2411, 45), (2923, 55), (3426, 65)]


def scale_points():
    """Every tick of the scale that can be identified, as (pixel, feet). Checked against
    the automatic tick finder in ticks.py: all of these are within two pixels of a found
    tick."""
    return sorted(set(ANCHORS + FOOT_TICKS + FIVE_TICKS))


_PTS = None


def px_to_ft(x):
    global _PTS
    if _PTS is None:
        _PTS = scale_points()
    xs = [p[0] for p in _PTS]; fs = [p[1] for p in _PTS]
    return float(np.interp(x, xs, fs, left=fs[0] + (x - xs[0]) / 49.65, right=fs[-1] + (x - xs[-1]) / 49.65))


if __name__ == '__main__':
    pts = scale_points()
    for (x0, f0), (x1, f1) in zip(pts, pts[1:]):
        print(f'{f0:6.1f} -> {f1:6.1f}: {(x1 - x0) / (f1 - f0):6.2f} px/ft')
    print('zero at', np.interp(0, [p[1] for p in pts], [p[0] for p in pts], left=None))
