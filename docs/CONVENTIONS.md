# Coordinate and unit conventions

All generator code, the spec and the audit tool use these conventions without exception.

## Units

* Metres. Every length in `src/spec/spec.js` is metric.
* `SPECS.md` records the period imperial value beside the metric one, because the
  period value is the real datum and the metric value is a conversion
  (1 ft = 0.3048 m exactly).
* Angles in degrees in the spec, radians in the geometry code. Convert at the
  boundary with `deg()`.

## Axes

Right-handed, Y up. This matches glTF and matches the host game.

| Axis | Direction |
| --- | --- |
| `-Z` | forward, toward the bow |
| `+Z` | aft, toward the stern |
| `+X` | to starboard |
| `-X` | to port |
| `+Y` | up |

## Origin

* `x = 0` is the centreline.
* `y = 0` is the **design load waterline**, not the keel. The keel is at negative Y.
* `z = 0` is the **midship station**, the station of maximum breadth.

Station positions in the spec are given as `z` in metres from the midship station,
negative forward.

## Why this origin

The host game samples a wave field at the bow, the stern and both beams and puts the
hull on the result. It needs the waterline at `y = 0` so that a ship sitting in still
water needs no vertical offset, and it needs the origin near the centre of flotation
so that pitch and roll about the origin look correct.

## Deck naming

From the bottom up: hold, orlop (partial), gundeck (the main battery deck, called the
upper deck in some sources), then the quarterdeck aft and the forecastle forward, with
the open waist between them at gundeck level.
