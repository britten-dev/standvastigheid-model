"""Find the vertical tick lines of the drawing's scale of feet in a horizontal band."""
import numpy as np
import mosaic


def ticks(band, min_rise=0.035, win=41):
    k = mosaic.ink(band)
    col = k.mean(axis=0)
    base = np.convolve(col, np.ones(win) / win, mode='same')
    d = col - base
    return [i for i in range(2, len(d) - 2) if d[i] > min_rise and d[i] == d[i - 2:i + 3].max()]
