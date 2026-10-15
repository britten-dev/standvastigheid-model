"""Draw traced lines and marks over a scan crop, for checking by eye."""
import numpy as np
from PIL import Image, ImageDraw, ImageFont

COLOURS = [(220, 30, 30), (30, 140, 30), (30, 60, 220), (200, 120, 0), (160, 0, 160), (0, 150, 150)]


def render(img, x0, y0, w, h, lines=(), marks=(), scale=1.0, path=None):
    crop = np.clip(img[y0:y0 + h, x0:x0 + w], 0, 255).astype(np.uint8)
    im = Image.fromarray(crop).convert('RGB')
    if scale != 1.0:
        im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    for i, ln in enumerate(lines):
        pts = ln['pts'] if isinstance(ln, dict) else ln
        col = (ln.get('colour') if isinstance(ln, dict) else None) or COLOURS[i % len(COLOURS)]
        xy = [((x - x0) * scale, (y - y0) * scale) for x, y in pts]
        if len(xy) > 1:
            d.line(xy, fill=col, width=max(1, int(2 * scale)))
        if isinstance(ln, dict) and ln.get('label') and xy:
            d.text(xy[-1], str(ln['label']), fill=col)
    for m in marks:
        x, y, label = m[0], m[1], (m[2] if len(m) > 2 else '')
        cx, cy = (x - x0) * scale, (y - y0) * scale
        d.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], outline=(220, 0, 0), width=2)
        if label != '':
            d.text((cx + 5, cy - 12), str(label), fill=(220, 0, 0))
    if path:
        im.save(path)
    return im
