"""Turn the traced lines of the Washington's draught into the offset table.

Inputs (all measured off Nationaal Archief 4.MST inv. 59 by the other scripts here):
  .cache/draught/body-traces.json   station sections, body-plan pixels (trace_body.py)
  .cache/draught/sheer_lines.json   long lines of the sheer plan, sheet-B pixels
  .cache/draught/stem_lines.json    the stem rabbet and the stem's fore edge
  docs/trace/body-seeds.json        body-plan calibration and seeds
  docs/trace/sheer-readings.json    ports, masts, breaks and stations read by eye

Output: docs/offsets.json, in the shape surprise-model's hull reads, plus the feature
lines a two-decker needs. Every length is converted from Amsterdam feet (0.283133 m).

Datum: y = 0 at the load waterline, which the drawing does not mark. It is set by the
Dutch Admiralties' own rule for their 74s of this generation — the lower port sills
6 1/2 ft above the water amidships, laden for six months with 550 men (A. Ruijter,
*In dienst van twee republieken*, RCE, citing the 1780s resolution). z = 0 at station 10,
the dead flat; -z forward.
"""
import json, os, sys
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
import calib  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
AFT = 0.283133                       # metres per Amsterdam foot
PX_BODY = 49.87                      # body plan, px per foot: 1217.5 px = 24 5/11 ft half-breadth
PX_SHEER = 49.65                     # sheer plan, px per foot vertically: the scale of feet, 15-179 ft
SILL_ABOVE_LWL = 6.5                 # Dutch rule for 74s, Ruijter p.7
LOWER_DECK_BELOW_SILL = 2.1          # capstan bases and the 22 ft depth of hold, see 07-tracing.md
UPPER_DECK_BELOW_SILL = 2.1
QD_DECK_BELOW_SILL = 1.75
FC_DECK_BELOW_RAIL = 1.0           # the forecastle is laid about level with the waist rail, see 07-tracing.md
KEEL_DEPTH_FT = 102 / PX_BODY        # rabbet to underside of the main keel, body plan
FALSE_KEEL_FT = 22 / PX_BODY         # main keel to underside of the false keel
RABBET_HALF_FT = 32.5 / PX_BODY      # half the keel's breadth at the rabbet
KEEL_HALF_FT = 53.0 / PX_BODY        # half-siding of the keel below the rabbet


def load(p):
    return json.load(open(os.path.join(ROOT, p)))


seeds = load('docs/trace/body-seeds.json')
read = load('docs/trace/sheer-readings.json')
traces = load('.cache/draught/body-traces.json')
sheer = load('.cache/draught/sheer_lines.json')
stem = load('.cache/draught/stem_lines.json')
edges = load('.cache/draught/wale_edges.json')

C = seeds['centreline_x']
KB = seeds['keel_bottom_y']

# ------------------------------------------------------------------ the sheer plan
def line(name, x0=150, x1=9120):
    p = np.array(sheer[name], float)
    p = p[(p[:, 0] > x0) & (p[:, 0] < x1)]
    o = np.argsort(p[:, 0])
    xs, ys = p[o, 0], p[o, 1]
    # A light running median takes out the odd pixel where a crossing line pulled the trace.
    k = 9
    ys = np.array([np.median(ys[max(0, i - k):i + k + 1]) for i in range(len(ys))])
    return xs, ys


kx, ky = line('keel_bot', 300, 8300)
keel_fit = np.polyfit(kx, ky, 1)             # the keel is drawn straight; this is its line on the scan
keel_y = lambda x: np.polyval(keel_fit, x)   # noqa: E731


def h_sheer(x, y):
    """Feet above the underside of the main keel, measured square to the keel."""
    return (keel_y(x) - y) / PX_SHEER


def s_of(x):
    return calib.px_to_ft(x)


ports = {k: read[k] for k in ('lower_ports', 'upper_ports', 'quarterdeck_ports')}


def tier_line(tier, which):
    """A smooth line through the port sills (or heads) of one tier: (s, h) arrays."""
    pts = []
    for a, b, hd, sl in ports[tier]:
        x = (a + b) / 2
        y = sl if which == 'sill' else hd
        pts.append((s_of(x), h_sheer(x, y)))
    pts.sort()
    s, h = np.array(pts).T
    fit = np.polyfit(s, h, 2)                # a sheer is a fair curve; three terms are enough for one tier
    return fit, float(np.std(h - np.polyval(fit, s)))


lower_sill, lower_sill_err = tier_line('lower_ports', 'sill')
lower_head, _ = tier_line('lower_ports', 'head')
upper_sill, upper_sill_err = tier_line('upper_ports', 'sill')
upper_head, _ = tier_line('upper_ports', 'head')
qd_sill, qd_sill_err = tier_line('quarterdeck_ports', 'sill')

S_MID = s_of(read['station_x']['10'])
h_lwl = float(np.polyval(lower_sill, S_MID)) - SILL_ABOVE_LWL


def y_m(h):
    return (h - h_lwl) * AFT


def z_m(s):
    return -(s - S_MID) * AFT


def band(name):
    xs, ys = line(name)
    s = np.array([s_of(x) for x in xs])
    h = np.array([h_sheer(x, y) for x, y in zip(xs, ys)])
    return s, h


BANDS = {n: band(n) for n in ('rail_top', 'upper_band_bot', 'middle_band_top', 'middle_band_bot',
                              'main_wale_top', 'main_wale_bot', 'qd_rail', 'qd_hammock_rail')}


def band_h(name, s):
    bs, bh = BANDS[name]
    return float(np.interp(s, bs, bh))


# The stem: its rabbet (where the planking lands) and its fore edge, as s(h).
def profile(name, xmin, xmax):
    p = np.array(stem[name], float)
    p = p[(p[:, 0] > xmin) & (p[:, 0] < xmax)]
    s = np.array([s_of(x) for x in p[:, 0]])
    h = np.array([h_sheer(x, y) for x, y in p])
    o = np.argsort(h)
    return h[o], s[o]


stem_h, stem_s = profile('inner_b', 8300, 9100)
# Only the rising part, up to the lower deck; above that the traced line turns aft into the head.
keep = stem_h < 26.0
stem_h, stem_s = stem_h[keep], stem_s[keep]
# monotone: the rabbet only goes forward as it rises
stem_s = np.maximum.accumulate(stem_s)
cut_h, cut_s = profile('stem_outer', 7800, 9900)


def stem_rabbet_s(h):
    return float(np.interp(h, stem_h, stem_s, left=stem_s[0], right=stem_s[-1]))


(px0, py0), (px1, py1) = read['sternpost_rabbet']
post_h = [h_sheer(px1, py1), h_sheer(px0, py0)]
post_s = [s_of(px1), s_of(px0)]


def post_rabbet_s(h):
    return float(np.interp(h, post_h, post_s))


# ------------------------------------------------------------------ the body plan
def section(name):
    p = np.array(traces[name], float)
    # Below the rabbet the trace has run on into the keel; drop it.
    p = p[p[:, 1] <= seeds['rabbet_y'] + 2]
    fore = np.median(p[:, 0]) > C
    # Keep the part below the main wale band, where every station is a clean single line.
    ek = 'fore_low_bot' if fore else 'aft_low_bot'
    e = np.array(edges[ek]); o = np.argsort(e[:, 0])
    band_y = np.interp(p[:, 0], e[o, 0], e[o, 1])
    p = p[p[:, 1] > band_y + 4]
    hb = np.abs(p[:, 0] - C) / PX_BODY
    h = (KB - p[:, 1]) / PX_BODY
    o = np.argsort(h)
    h, hb = h[o], hb[o]
    # Bin to 0.1 ft and take the median, which removes the jitter of the pen line.
    bins = np.round(h * 10) / 10
    uh = np.unique(bins)
    mh = np.array([np.median(hb[bins == u]) for u in uh])
    return uh, mh


STATIONS = [str(i) for i in range(0, 22)]
S_OF = {st: s_of(read['station_x'][st]) for st in read['station_x']}
sections = {}
for st in STATIONS:
    name = st
    if st == '13':
        # The tracer jumped to station 12 near the numbers; keep only the floor of 13.
        h, b = section('13')
        k = h < 6.0
        h12, b12 = section('12'); h14, b14 = section('14')
        hh = np.arange(6.0, 19.0, 0.1)
        bb = 0.5 * (np.interp(hh, h12, b12) + np.interp(hh, h14, b14))
        sections[st] = (np.concatenate([h[k], hh]), np.concatenate([b[k], bb]))
        continue
    sections[st] = section(name)

# The aft half of the dead flat is drawn too; check the two halves agree.
h10a, b10a = section('10a')
h10, b10 = sections['10']
common = np.arange(3, 18.5, 0.5)
dead_flat_spread = float(np.max(np.abs(np.interp(common, h10a, b10a) - np.interp(common, h10, b10))))

# The midship topside above the main wale, read off the body plan (docs/research/07-tracing.md
# §4): the outermost frame line between the wales and above the middle wale.
TOP_MID = [(19.85, 24.44), (24.0, 24.38), (27.9, 24.17), (29.1, 24.0), (30.0, 23.7),
           (31.3, 23.3), (35.5, 21.15), (36.6, 21.0), (37.8, 20.8), (38.9, 20.4)]
tm_h = np.array([p[0] for p in TOP_MID]); tm_b = np.array([p[1] for p in TOP_MID])


def topside_drop(h_from, h_to):
    """How much the midship section tumbles home between two heights."""
    f = lambda h: np.interp(h, tm_h, tm_b, right=tm_b[-1] - (h - tm_h[-1]) * 0.36)  # noqa: E731
    return float(f(h_from) - f(h_to))


# ------------------------------------------------------------------ stations
# Real stations 0..21, then synthetic ones at both ends where the drawing has no section:
# station 22 (lost behind the stern transoms on the scan) and the run to the sternpost,
# and three between station 0 and the stem. Each synthetic section closes every waterline
# on the rabbet line at its own height, with a fullness exponent chosen so the waterline
# endings stay as bluff as the last measured station implies.
WL_H = [2.4, 2.7, 3.0, 3.5, 4.0, 5.0, 6.0, 7.0, 8.0, 10.0, 12.0, 14.0, 16.0, 18.0,
        round(h_lwl, 2), 22.0, 24.0, 26.0, 28.0, 30.0, 32.0, 34.0, 36.0, 38.0, 40.0, 42.0]


S_QD_BREAK = s_of(read['quarterdeck_break_scroll_x'])
S_FC_BREAK = s_of(read['forecastle_break_scroll_x'])


def rail_h(s):
    """Top of the planked side: the quarterdeck rail abaft the break, the waist rail elsewhere."""
    waist = band_h('rail_top', s)
    if s <= S_QD_BREAK:
        return max(waist, band_h('qd_rail', s))
    return waist


def measured_hb(st, h):
    sh, sb = sections[st]
    if h < sh[0] - 1e-6:
        return None
    if h <= sh[-1]:
        return float(np.interp(h, sh, sb))
    # Above the traced part (the wales hide the stations on the scan): carry the station's
    # own flare on, dying away over about six feet, and tumble it home as the midship
    # section does in proportion to how upright the station already is at the wale. The
    # dead flat keeps its measured tumblehome; a flaring bow or quarter section keeps
    # flaring. RECONSTRUCTED, see 07-tracing.md section 4.
    m, D = flare_slope(st), 6.0
    dh = h - sh[-1]
    w = min(1.0, max(0.0, 1.0 - m / 0.25))
    b = float(sb[-1] + m * D * (1 - np.exp(-dh / D)) - w * topside_drop(sh[-1], h))
    # No station stands outside the dead flat at the same height: she is widest there.
    return min(b, dead_flat_at(h)) if st != '10' else b


def dead_flat_at(h):
    sh, sb = sections['10']
    if h <= sh[-1]:
        return float(np.interp(h, sh, sb))
    return float(sb[-1] - topside_drop(sh[-1], h))


_slopes = {}


def flare_slope(st):
    if st not in _slopes:
        sh, sb = sections[st]
        k = sh > sh[-1] - 2.0
        _slopes[st] = max(0.0, float(np.polyfit(sh[k], sb[k], 1)[0])) if k.sum() > 3 else 0.0
    return _slopes[st]


def end_hb(s, h, ref_st, ref_s, end_fn, power):
    """Half-breadth at s between a measured station and the rabbet at the end of the ship."""
    b0 = measured_hb(ref_st, h)
    if b0 is None:
        return None
    se = end_fn(h)
    if (se - s) * (se - ref_s) <= 0:
        return None          # beyond the rabbet at this height
    t = (se - s) / (se - ref_s)
    return max(KEEL_HALF_FT, b0 * t ** power)


rows = []   # (s, label, {h: hb}, rabbet_h)
for st in STATIONS:
    s = S_OF[st]
    sh, _ = sections[st]
    rows.append((s, st, {h: measured_hb(st, h) for h in WL_H}, float(sh[0])))

# Stern: station 22 and the run to the post.
s21 = S_OF['21']
for s, label in ((S_OF['22'], '22'), (2.2, 'post_a'), (1.0, 'post_b')):
    d = {h: end_hb(s, h, '21', s21, post_rabbet_s, 0.55) for h in WL_H}
    # The rabbet rises toward the post as the deadwood fills the run.
    rab = float(sections['21'][0][0]) + (s21 - s) / (s21 - 0.5) * 6.0
    d = {h: (v if (v is not None and h >= rab) else None) for h, v in d.items()}
    rows.append((s, label, d, rab))

# Bow: three stations between station 0 and the stem rabbet.
s0 = S_OF['0']
for s, label in ((174.0, 'stem_a'), (176.3, 'stem_b'), (178.2, 'stem_c')):
    d = {h: end_hb(s, h, '0', s0, stem_rabbet_s, 0.45) for h in WL_H}
    rab = float(np.interp(s, stem_s, stem_h))
    d = {h: (v if (v is not None and h >= rab) else None) for h, v in d.items()}
    rows.append((s, label, d, rab))

rows.sort(key=lambda r: -r[0])   # forward first, as the hull module expects


def tumble(st_row):
    s = st_row[0]
    return np.tan(np.radians(20.0))


out_station_z = [round(z_m(r[0]), 4) for r in rows]
out_wl = [round(y_m(h), 4) for h in WL_H]
hb_table, rab_y, rab_x, top_y, rail_x, tumb, deck_y, deck_x = [], [], [], [], [], [], [], []
features = {k: [] for k in ('main_wale_bottom', 'main_wale_top', 'lower_deck', 'lower_port_sill',
                            'lower_port_head', 'middle_wale_bottom', 'middle_wale_top', 'upper_deck',
                            'upper_port_sill', 'upper_port_head', 'quarterdeck', 'quarterdeck_port_sill',
                            'forecastle', 'waist_rail', 'quarterdeck_rail', 'hammock_rail', 'rail')}
for s, label, d, rab in rows:
    top = rail_h(s)
    rowv = []
    for h in WL_H:
        v = d[h]
        if v is None or h > top + 1e-6:
            rowv.append(None)
        else:
            rowv.append(round(v * AFT, 4))
    hb_table.append(rowv)
    rab_y.append(round(y_m(rab), 4))
    rab_x.append(round(RABBET_HALF_FT * AFT, 4))
    top_y.append(round(y_m(top), 4))
    # Rail half-breadth: the station's breadth at the top of the side.
    if label not in sections:
        rb = d[WL_H[-1]] if d[WL_H[-1]] else None
        base = None
        for h in reversed(WL_H):
            if d[h] is not None and h <= top:
                base = d[h] - topside_drop(h, top) if h < top else d[h]
                break
        rb = base if base is not None else KEEL_HALF_FT
    else:
        rb = measured_hb(label, top) if label in sections else None
    rail_x.append(round(max(KEEL_HALF_FT, rb) * AFT, 4))
    tumb.append(round(float(np.tan(np.radians(18.0))), 4))
    sill_l = float(np.polyval(lower_sill, s))
    sill_u = float(np.polyval(upper_sill, s))
    ld = sill_l - LOWER_DECK_BELOW_SILL
    deck_y.append(round(y_m(ld), 4))
    ldx = None
    if label in sections:
        ldx = measured_hb(label, ld)
    else:
        ldx = d.get(min(WL_H, key=lambda h: abs(h - ld)))
    deck_x.append(round((ldx if ldx else KEEL_HALF_FT) * AFT, 4))
    f = features
    f['main_wale_bottom'].append(round(y_m(band_h('main_wale_bot', s)), 4))
    f['main_wale_top'].append(round(y_m(band_h('main_wale_top', s)), 4))
    f['lower_deck'].append(round(y_m(ld), 4))
    f['lower_port_sill'].append(round(y_m(sill_l), 4))
    f['lower_port_head'].append(round(y_m(float(np.polyval(lower_head, s))), 4))
    f['middle_wale_bottom'].append(round(y_m(band_h('middle_band_bot', s)), 4))
    f['middle_wale_top'].append(round(y_m(band_h('middle_band_top', s)), 4))
    f['upper_deck'].append(round(y_m(sill_u - UPPER_DECK_BELOW_SILL), 4))
    f['upper_port_sill'].append(round(y_m(sill_u), 4))
    f['upper_port_head'].append(round(y_m(float(np.polyval(upper_head, s))), 4))
    f['quarterdeck'].append(round(y_m(float(np.polyval(qd_sill, s)) - QD_DECK_BELOW_SILL), 4))
    f['quarterdeck_port_sill'].append(round(y_m(float(np.polyval(qd_sill, s))), 4))
    f['forecastle'].append(round(y_m(band_h('rail_top', s) - FC_DECK_BELOW_RAIL), 4))
    f['waist_rail'].append(round(y_m(band_h('rail_top', s)), 4))
    f['quarterdeck_rail'].append(round(y_m(band_h('qd_rail', s)), 4))
    f['hammock_rail'].append(round(y_m(band_h('qd_hammock_rail', s)), 4))
    f['rail'].append(round(y_m(top), 4))


# The floor, within a few feet of the rabbet, is where the pen lines of a dozen stations
# run almost on top of one another, and one stray step of the tracer shows. A hull only
# narrows away from the dead flat, so below 6 ft each waterline is made non-increasing
# outward from station 10.
i10 = [r[1] for r in rows].index('10')
for j, h in enumerate(WL_H):
    if h > 6.0:
        continue
    for rng in (range(i10 - 1, -1, -1), range(i10 + 1, len(rows))):
        prev = hb_table[i10][j]
        for i in rng:
            v = hb_table[i][j]
            if v is not None and prev is not None and v > prev:
                hb_table[i][j] = prev
            if hb_table[i][j] is not None:
                prev = hb_table[i][j]


def port_list(tier):
    out = []
    for a, b, hd, sl in ports[tier]:
        x = (a + b) / 2
        out.append({
            'z': round(z_m(s_of(x)), 4),
            'width': round((s_of(b) - s_of(a)) * AFT, 4),
            'sill': round(y_m(h_sheer(x, sl)), 4),
            'head': round(y_m(h_sheer(x, hd)), 4),
        })
    return sorted(out, key=lambda p: p['z'])


masts = {}
for name, m in read['masts'].items():
    a, b = m['x']
    masts[name] = {'z': round(z_m(s_of((a + b) / 2)), 4),
                   'diameter_above_rail': round((s_of(b) - s_of(a)) * AFT, 4)}


# ------------------------------------------------------------------ checks
def displacement():
    """Integrate the immersed volume: sections to the LWL, Simpson in z."""
    zs, areas, bmax = [], [], []
    for (s, label, d, rab), z in zip(rows, out_station_z):
        hs = [h for h in np.arange(rab, h_lwl + 1e-9, 0.1)]
        if len(hs) < 2:
            zs.append(z); areas.append(0.0); bmax.append(0); continue
        bs = []
        for h in hs:
            if label in sections:
                v = measured_hb(label, h)
            else:
                ks = [k for k in WL_H if d[k] is not None]
                v = float(np.interp(h, ks, [d[k] for k in ks])) if ks else 0.0
            bs.append(0.0 if v is None else v)
        area = 2 * np.trapezoid(np.array(bs) * AFT, np.array(hs) * AFT)
        # the keel and deadwood below the rabbet
        area += 2 * KEEL_HALF_FT * AFT * (rab - 0.0) * AFT
        zs.append(z); areas.append(area); bmax.append(max(bs))
    zs = np.array(zs); areas = np.array(areas)
    vol = float(np.trapezoid(areas, zs))
    return vol, zs, areas


vol, zs, areas = displacement()
L_wl = (stem_rabbet_s(h_lwl) - post_rabbet_s(h_lwl)) * AFT
B_wl = 2 * max(measured_hb(st, h_lwl) or 0 for st in sections) * AFT
T = h_lwl * AFT + FALSE_KEEL_FT * AFT
T_mould = (h_lwl - KEEL_DEPTH_FT) * AFT
Am = float(max(areas))
Cb = vol / (L_wl * B_wl * T_mould)
Cm = Am / (B_wl * T_mould)
Cp = vol / (Am * L_wl)
lcb = float(np.trapezoid(areas * zs, zs) / np.trapezoid(areas, zs))

result = {
    'provenance': {
        'grade': 'TRACED — every station of the body plan followed by machine from the draught, ends of the ship closed on the traced stem and sternpost rabbets',
        'plan': "Nationaal Archief 4.MST inv. 59, 'Aftekening van het Schip de Washington à 76 Stukken Canon', I. Vos, 1795: lines plan of the Dutch 74 Washington (Amsterdam, launched 9 August 1796)",
        'url': 'https://www.nationaalarchief.nl/onderzoeken/archief/4.MST/invnr/59',
        'scale': f'Amsterdam feet of 11 inches (0.283133 m). Body plan {PX_BODY} px/ft, sheer plan by its own scale of feet (about 49.7 px/ft, piecewise for the paper\'s folds)',
        'datum': 'y = 0 at the load waterline, 6 1/2 Amsterdam ft below the lower port sills amidships (the Dutch rule for 74s); z = 0 at station 10, the dead flat; -Z forward',
        'uncertainty': f'Dead flat drawn in both halves agrees to {dead_flat_spread:.2f} ft; port-sill sheers fit to {lower_sill_err:.2f} / {upper_sill_err:.2f} ft. Topsides above the main wale and the end stations are reconstructed, see docs/research/07-tracing.md',
        'research': 'docs/research/07-tracing.md',
    },
    'dimensions': {
        'length_lower_deck_m': round(179 * AFT, 4),
        'length_lwl_m': round(L_wl, 4),
        'beam_moulded_m': round(B_wl, 4),
        'draught_m': round(T, 4),
        'draught_moulded_m': round(T_mould, 4),
        'lwl_above_keel_m': round(h_lwl * AFT, 4),
        'keel_below_rabbet_m': round(KEEL_DEPTH_FT * AFT, 4),
        'false_keel_m': round(FALSE_KEEL_FT * AFT, 4),
        'displacement_m3': round(vol, 1),
        'displacement_t_seawater': round(vol * 1.025, 1),
        'Cb': round(Cb, 3), 'Cm': round(Cm, 3), 'Cp': round(Cp, 3),
        'lcb_z_m': round(lcb, 3),
        'station10_s_ft': round(S_MID, 2),
    },
    'stationLabel': [r[1] for r in rows],
    'stationZ': out_station_z,
    'waterlineY': out_wl,
    'halfBreadth': hb_table,
    'deckAtSideY': deck_y,
    'deckAtSideX': deck_x,
    'rabbetY': rab_y,
    'rabbetX': rab_x,
    'topOfSideY': top_y,
    'railX': rail_x,
    'tumblehome': tumb,
    'features': features,
    'ports': {'lower': port_list('lower_ports'), 'upper': port_list('upper_ports'),
              'quarterdeck': port_list('quarterdeck_ports')},
    'masts': masts,
    'breaks': {'quarterdeck_fore_z': round(z_m(S_QD_BREAK), 4),
               'forecastle_aft_z': round(z_m(S_FC_BREAK), 4)},
    'capstan': {'z': round(z_m(s_of(sum(read['capstan']['x']) / 2)), 4)},
    'hawse': [{'z': round(z_m(s_of((a + b) / 2)), 4), 'y': round(y_m(h_sheer((a + b) / 2, (c + d) / 2)), 4),
               'diameter': round((s_of(b) - s_of(a)) * AFT, 4)} for a, b, c, d in read['hawse_holes']],
    'stem': {'rabbet': [[round(z_m(s), 4), round(y_m(h), 4)] for h, s in zip(stem_h[::6], stem_s[::6])],
             'fore_edge': [[round(z_m(s), 4), round(y_m(h), 4)] for h, s in zip(cut_h[::8], cut_s[::8])]},
    'sternpost': {'rabbet': [[round(z_m(s), 4), round(y_m(h), 4)] for h, s in zip(post_h, post_s)]},
    'keel': {'bottom_y': round(y_m(0.0), 4), 'false_keel_bottom_y': round(y_m(-FALSE_KEEL_FT), 4),
             'half_siding': round(KEEL_HALF_FT * AFT, 4)},
}
json.dump(result, open(os.path.join(ROOT, 'docs/offsets.json'), 'w'), indent=1)
d = result['dimensions']
print(json.dumps(d, indent=1))
print('stations', len(rows), ' dead-flat halves agree to', round(dead_flat_spread, 3), 'ft')
