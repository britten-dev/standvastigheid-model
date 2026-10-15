"""Assemble the cached IIIF tiles of the Washington draught into working mosaics.

The scans are the Nationaal Archief's, 4.MST inv. 59 (two photographs of one sheet).
They are fetched into .cache/draught/ by tools/draught/fetch.sh and are not part of
this repository; only what is measured from them is.
"""
import os
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CACHE = os.path.join(ROOT, '.cache', 'draught')
Image.MAX_IMAGE_PIXELS = None


def tile(name):
    return np.asarray(Image.open(os.path.join(CACHE, name)).convert('L'), dtype=np.float32)


def sheet_b():
    """The bow-half photograph, which shows the whole sheer and half-breadth plans.

    Returns (image, x0, y0): the mosaic and the full-scan pixel of its top-left corner.
    """
    rows = []
    for y0, h in ((2400, 3400), (5700, 1800)):
        parts = [tile(f'B_{x}_{y0}_3800_{h}.jpg') for x in (0, 3800, 7600)]
        hh = min(p.shape[0] for p in parts)
        rows.append(np.concatenate([p[:hh] for p in parts], axis=1))
    w = min(r.shape[1] for r in rows)
    # The two rows overlap by 100 px (5700 < 2400 + 3400); drop the overlap.
    top = rows[0][: 5700 - 2400, :w]
    return np.concatenate([top, rows[1][:, :w]], axis=0), 0, 2400


def sheet_a_body():
    """The body plan, cut from the stern-half photograph."""
    return tile('A_400_2600_2800_3000.jpg'), 400, 2600


def ink(img, radius=40):
    """Darkness relative to the local paper colour, 0 (paper) to 1 (black ink).

    The scan has stains and fold shadows, so a single threshold will not do; divide by a
    coarse local background estimated as a blurred maximum.
    """
    from PIL import ImageFilter
    pil = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    bg = pil.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.BoxBlur(radius))
    bg = np.asarray(bg, dtype=np.float32)
    return np.clip(1.0 - img / np.maximum(bg, 1.0), 0.0, 1.0)
