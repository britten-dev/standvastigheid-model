"""Render a crop with a labelled pixel grid, for reading seed points by eye."""
import sys, numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, __import__('os').path.dirname(__file__))
import overlay


def grid(img, x0, y0, w, h, step, scale, path, lines=()):
    im = overlay.render(img, x0, y0, w, h, lines=lines, scale=scale)
    d = ImageDraw.Draw(im)
    for x in range((x0 // step + 1) * step, x0 + w, step):
        X = (x - x0) * scale; d.line([(X, 0), (X, h * scale)], fill=(255, 0, 0)); d.text((X + 2, 2), str(x), fill=(255, 0, 0))
    for y in range((y0 // step + 1) * step, y0 + h, step):
        Y = (y - y0) * scale; d.line([(0, Y), (w * scale, Y)], fill=(0, 0, 255)); d.text((2, Y + 2), str(y), fill=(0, 0, 255))
    im.save(path)
