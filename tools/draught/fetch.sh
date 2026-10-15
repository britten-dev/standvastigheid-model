#!/bin/sh
# Fetch the regions of the Washington's draught that the tracer reads, from the
# Nationaal Archief's IIIF server, into .cache/draught/ (git-ignored: the scans are the
# archive's and are viewed and measured here, not redistributed).
#   4.MST inv. 59, https://www.nationaalarchief.nl/onderzoeken/archief/4.MST/invnr/59
set -e
cd "$(dirname "$0")/../.."
mkdir -p .cache/draught
B="https://service.archief.nl/iip/iipsrv?IIIF=77/71/37/42/d3/27/45/f4/82/83/bd/d9/63/6f/3a/50"
A=1f49e79d-ab6f-4ee7-8975-00bc5dc1b97b   # deelopname01: body plan, title block, most of the hull
S=3eee70b7-20ff-4248-a26b-33db3b564fb2   # deelopname02: the whole sheer and half-breadth plans
get() { [ -f ".cache/draught/$1" ] || curl -fsS -o ".cache/draught/$1" "$B/$2.jp2/$3/full/0/default.jpg"; }
get A_400_2600_2800_3000.jpg "$A" 400,2600,2800,3000
for x in 0 3800 7600; do
  get "B_${x}_2400_3800_3400.jpg" "$S" "${x},2400,3800,3400"
  get "B_${x}_5700_3800_1800.jpg" "$S" "${x},5700,3800,1800"
done
echo "draught regions in .cache/draught/"
