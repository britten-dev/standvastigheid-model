# Tracing the draught

How `docs/offsets.json` is measured from the Washington's lines plan (NA 4.MST inv. 59).
The method and its results are in `docs/research/07-tracing.md`.

```bash
sh tools/draught/fetch.sh                          # the scan regions, into .cache/draught/
python3 -c "import sys; sys.path.insert(0,'tools/draught'); import mosaic, numpy as np; \
  img,_,_=mosaic.sheet_a_body(); np.save('.cache/draught/body_ink.npy', mosaic.ink(img))"
python3 tools/draught/trace_body.py out.png         # follow every station (docs/trace/body-seeds.json)
python3 tools/draught/extract.py                    # docs/offsets.json
node tools/sync-offsets.js                          # src/spec/offsets.js
python3 tools/draught/check_overlay.py body.png     # the table drawn back over the body plan
python3 tools/draught/lines_overlay.py sheer.png    # the built hull drawn back over the sheer plan
```

The long lines of the sheer plan (`.cache/draught/sheer_lines.json`), the stem and the
wale edges were followed with `tracker.trace` from seeds read off gridded renders
(`grid.py`); the ports, masts, breaks and stations read by eye are in
`docs/trace/sheer-readings.json`. Needs Python 3 with numpy and Pillow.
