"""Contact sheets: the four sail states, and the three levels of detail.

Two things are easier to judge as a set than one at a time. Whether the storm canvas
really looks like a gale next to the full suit, and whether the game and distant levels
keep the silhouette the hero level has, are both questions about the differences between
images rather than about any one of them.
"""
import os, sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = os.path.join(ROOT, 'renders')

def sheet(name, tiles, cols, cell_h=520):
    imgs = []
    for path, label in tiles:
        p = os.path.join(R, path)
        if not os.path.exists(p):
            print(f'  missing {path}', file=sys.stderr)
            continue
        im = Image.open(p).convert('RGB')
        w = int(im.width * cell_h / im.height)
        imgs.append((im.resize((w, cell_h), Image.LANCZOS), label))
    if not imgs:
        return
    cw = max(i.width for i, _ in imgs)
    rows = (len(imgs) + cols - 1) // cols
    pad, bar = 12, 30
    canvas = Image.new('RGB', (cols * cw + pad * (cols + 1),
                               rows * (cell_h + bar) + pad * (rows + 1)), (22, 24, 28))
    d = ImageDraw.Draw(canvas)
    for k, (im, label) in enumerate(imgs):
        r, c = divmod(k, cols)
        x = pad + c * (cw + pad) + (cw - im.width) // 2
        y = pad + r * (cell_h + bar + pad)
        d.text((pad + c * (cw + pad) + 2, y + 8), label, fill=(190, 198, 208))
        canvas.paste(im, (x, y + bar))
    out = os.path.join(R, name)
    canvas.save(out)
    print(f'wrote renders/{name}  ({canvas.width} x {canvas.height})')

sheet('sail-states.png', [
    ('beam.png', 'FULL SUIT — courses, topsails, topgallants, staysails, three headsails, spanker'),
    ('beam-hero-topsails.png', 'TOPSAILS — the usual cruising rig'),
    ('beam-hero-storm.png', 'STORM — reefed foresail and close-reefed main topsail'),
    ('beam-hero-furled.png', 'FURLED — every sail handed and stowed on its yard'),
], cols=2)

sheet('levels-of-detail.png', [
    ('quarter.png', 'HERO — 237 k triangles'),
    ('quarter-game-full.png', 'GAME — 60 k triangles, hull 38 m'),
    ('quarter-distant-full.png', 'DISTANT — 4.5 k triangles, a silhouette'),
], cols=3)

sheet('views.png', [
    ('bow.png', 'BOW'), ('beam.png', 'BEAM'), ('quarter.png', 'QUARTER'),
    ('stern.png', 'STERN'), ('masthead.png', 'MASTHEAD'), ('deck.png', 'DECK'),
], cols=3, cell_h=440)
