# Hull, decks, ports and guns

Grades as in surprise-model: **PRIMARY** (her own draught), **SECONDARY** (published
work), **RECONSTRUCTED** (period rule, named), **FICTIONAL** (O'Brian).

## Hull form — PRIMARY, the Washington draught

Read off NA 4.MST inv. 59 (see `02-the-draught.md`):

- **Bottom.** Nearly flat floors with a hard, short turn of the bilge. This is the Dutch
  answer to shallow home waters (the usual explanation: the Texel, the Zuiderzee, the
  bar at Pampus) and is what makes her "broadsterned" and full. The Rijksmuseum catalogue says the same of its
  1782 half model of a 74 (bottom "almost flat"):
  <https://www.rijksmuseum.nl/en/collection/NG-MC-267>.
- **Tumblehome.** Strong above the maximum breadth; to be measured, not assumed.
- **Bow.** Very full and round below, two hawse holes a side at lower-deck height. At
  the upper deck the profile appears to end in a flat **beakhead bulkhead** with the
  head platform before it — still the Dutch way in 1806: the Rijksmuseum's c.1806 half
  model of a 74 (NG-MC-279) has "a beakhead bulkhead, a platform"
  (<https://www.rijksmuseum.nl/en/collection/NG-MC-279/catalogue-entry>). To be
  confirmed in tracing; it changes the look of her bow more than anything else.
- **Stern.** Round tuck under a hollow counter; two tiers of stern windows; two-tier
  quarter galleries. The Rijksmuseum's *Vrijheid* model (1782) and the stern half
  model NG-MC-90 (*Prins Maurits*, 1783) show the same arrangement:
  <https://www.rijksmuseum.nl/en/collection/NG-MC-500/catalogue-entry>,
  <https://www.rijksmuseum.nl/en/collection/NG-MC-90/catalogue-entry>.
- **Sheer.** Moderate, rising at both ends; the quarterdeck and forecastle rails rise with it.

## Decks

From the bottom up, all PRIMARY from the sheer plan unless stated:

| Deck | Notes |
| --- | --- |
| Hold, orlop | Drawn on the sheet; not modelled (never seen) |
| **Lower deck** (*onder dek* in the title block; the RN "gundeck") | Full length; the 32-pounder tier; hawse holes and the bridle ports forward |
| **Upper deck** | Full length; the 24-pounder tier; open to the sky in the waist |
| **Quarterdeck** and **forecastle** | Over the upper deck at each end, joined by gangways along the sides; a double capstan in the waist below |
| Poop / roundhouse | The stern elevation's upper window tier sits under the taffrail; whether there is a short poop is to be read off the sheer during tracing |

The naming matters for the game: surprise-model calls its one battery deck the
`gundeck`. Here the RN convention is kept — `gundeck` is the **lower** deck, as in the
British measurement "168 ft 5 in on the gundeck" — and the spec adds `upper_deck_*` and
`weather_deck_*` keys. See `PLAN.md`, "What could break" → Names.

## Ports — PRIMARY count, sizes to measure

- **Lower deck:** 14 a side (28 × 32-pdr in British service), just above the main wale.
- **Upper deck:** 14 a side (28 guns), above a second, narrower wale.
- **Quarterdeck:** first reading, five ports a side in a solid bulwark. The quarterdeck
  runs about 76 Amsterdam ft forward from the stern, ending in a carved scroll.
- **Forecastle:** first reading, about 45 Amsterdam ft long, with an open rail on
  timberheads and **no ports drawn** — its guns would fire over or between the
  timberheads. To be confirmed in tracing.
- **Stern chase ports:** two in the counter, on the 1797 model of the Washington herself
  (RMG SLR0591) and on the *Vrijheid* model.

Port sizes, sill heights and spacings are measured off the draught. The British rule
for a line-of-battle ship is a lower-deck sill five to six feet above the water amidships
(Steel, *Elements and Practice of Naval Architecture*,
<https://archive.org/details/elementspractice00stee>); the Dutch figure will be checked
against it.

## Guns

| Tier | Waakzaamheid (the book) | Washington, British fit | Model |
| --- | --- | --- | --- |
| Lower deck | 32-pdrs | 28 × 32-pdr | 28 × long 32-pdr — FICTIONAL, agrees with the British fit |
| Upper deck | 24-pdrs | 28 × 18-pdr | 28 × long 24-pdr — FICTIONAL |
| Quarterdeck and forecastle | — | 2 × 18-pdr + 10 × 32-pdr carronades; 2 × 18-pdr + 4 × 32-pdr carronades | 16 × long 12-pdr — SECONDARY for a Dutch 74: *Willem de Eerste* (1785) carried 28 × 36, 28 × 24 and 16 × 12-pdr on the quarterdeck and forecastle, <https://en.wikipedia.org/wiki/Dutch_ship_Willem_de_Eerste>. The carronades in the Washington's list are most likely her British refit |

The Dutch pound (Amsterdam pound, about 494 g) is heavier than the English (454 g), so a Dutch
"36-pdr" fires a heavier ball than an English 36. O'Brian writes in English pounds;
the model follows him. Gun lengths and carriage dimensions are copied from
surprise-model's period sources and scaled to calibre.

The split of the sixteen 12-pdrs between quarterdeck and forecastle is not recorded;
it will follow the ports counted on the draught.

## Bow chasers — the book against the record

**The book:** she fires her chasers "trained sharp forward from the bridle-ports in her
bluff bows" (ch. 7). A bridle port is a port in the bow on the lower deck, just abaft
the hawse holes, for a mooring bridle or a chase gun.

**The record:** B.E. van Bruggen, *Mededelingen* of the Nederlandse Vereniging voor
Zeegeschiedenis no. 29 (1974), pp. 5–21
(<https://www.zeegeschiedenis.nl/wp-content/uploads/2020/05/1974_29_klein.pdf>), citing
Van Zwijndregt (1757) and Duhamel: Dutch ships once had an unarmed bow port
(*boegpoort*) on the lower deck almost dead ahead, but it disappears from the drawings
between 1757 and 1775. Later Dutch ships chased with **two light guns (*jagers*) on the
forecastle**. Van Zwijndregt proposed bringing the bow port back in 1784. Neither the
Washington's draught, her 1797 model, nor the Rijksmuseum's 74s show bridle ports.

**So the bridle ports are O'Brian's, not the Washington's.** Two ways to build it:

1. **As the book (recommended):** one bridle port a side in the lower-deck bow, abaft
   the hawse holes (there is about 9–10 ft of clear side there), with a long gun in
   each, trained right forward — FICTIONAL, with Van Zwijndregt's 1784 proposal as a
   real Dutch precedent.
2. **As the record:** two light chase guns on the forecastle, firing forward over the
   head — RECONSTRUCTED.

Either way each chaser gets a named muzzle locator, a training axis and a recoil path,
in the same `gunnery` record surprise-model's guns use, so the game can fire them. In
heavy weather the rest of the lower tier is shut, but the bridle ports may stay open
with the chasers manned — the book has her firing them in a full gale, and one of her
port lids jammed open by a Leopard shot.
