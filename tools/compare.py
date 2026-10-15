"""Lay the verification render beside the reference photograph.

The point of this is not to produce a pretty picture. It is to make the two images the
same height, put them next to each other, and draw the same horizontal guides across
both, so that the eye can compare the things that actually matter — where the waterline
sits, how high the mastheads are, how far the sheer dips, how the paint bands divide the
hull — instead of forming a general impression.
"""
import sys, os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# The Rijksmuseum's photograph of its model of the Dutch 74 Vrijheid (NG-MC-500), which is
# in the public domain. See reference/README.md.
PHOTO = os.path.join(ROOT, 'reference', 'vrijheid-NG-MC-500.jpg')
if not os.path.exists(PHOTO):
    print('No reference photograph at reference/vrijheid-NG-MC-500.jpg — see reference/README.md.', file=sys.stderr)
    raise SystemExit(0)
RENDER = os.path.join(ROOT, 'renders', sys.argv[1] if len(sys.argv) > 1 else 'reference.png')
OUT = os.path.join(ROOT, 'renders', 'comparison.png')

photo = Image.open(PHOTO).convert('RGB')
render = Image.open(RENDER).convert('RGB')

H = 900
def fit(im):
    w = int(im.width * H / im.height)
    return im.resize((w, H), Image.LANCZOS)

photo, render = fit(photo), fit(render)
pad = 16
canvas = Image.new('RGB', (photo.width + render.width + pad * 3, H + pad * 2 + 34), (24, 26, 30))
canvas.paste(photo, (pad, pad + 34))
canvas.paste(render, (pad * 2 + photo.width, pad + 34))

d = ImageDraw.Draw(canvas)
d.text((pad + 4, 10), 'REFERENCE: Rijksmuseum NG-MC-500, model of the Dutch 74 Vrijheid, c.1782', fill=(200, 205, 212))
d.text((pad * 2 + photo.width + 4, 10), 'MODEL: Standvastigheid, hero LOD, furled, the same station', fill=(200, 205, 212))

# Horizontal guides at the fractions of frame height where the eye wants to compare:
# the trucks, the tops, the rail and the waterline.
for frac, label in [(0.10, 'trucks'), (0.42, 'tops'), (0.78, 'rail'), (0.90, 'waterline')]:
    y = pad + 34 + int(frac * H)
    d.line([(pad, y), (canvas.width - pad, y)], fill=(90, 110, 130), width=1)
    d.text((canvas.width - pad - 58, y - 12), label, fill=(120, 145, 170))

canvas.save(OUT)
print(f'wrote {os.path.relpath(OUT, ROOT)}  ({canvas.width} x {canvas.height})')
