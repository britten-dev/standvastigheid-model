# Flags

## What the book says

She first shows a **British blue ensign** as a ruse, answers the private signal with
nonsense, then hauls it down and hoists "her own colours" (ch. 6). O'Brian never says
what they are.

## What was real, 1795–1811

| Years | Dutch naval colours | Source |
| --- | --- | --- |
| 1795–1806, Batavian Republic | Red-white-blue horizontal tricolour with a white canton in the upper hoist showing the Dutch Maiden (Liberty) with a lion. Naval flags only, from 1796 | <https://www.crwflags.com/fotw/flags/nl-batav.html>; RMG plate <https://www.rmg.co.uk/collections/objects/rmgc-object-569> |
| 1806–1810, Kingdom of Holland | The Batavian canton dropped: the plain red-white-blue tricolour, by a law of 1806 (dated 5 June or 7 August — sources differ), named the *Koninklijke Hollandsche Vlag* by decree of 1 December 1807. Louis's proposal to add his quartered arms was dropped when the navy would not accept it. The Zeeland squadron kept the Batavian flag | <https://en.wikipedia.org/wiki/Navy_of_the_Kingdom_of_Holland>; <https://en.wikipedia.org/wiki/Batavian_flag>; <https://www.crwflags.com/fotw/flags/nl-batav.html>, citing H.A. Treu, *Marineblad* 1970 (not read) |
| 1810–1811, annexation | The Kingdom abolished on 9 July 1810; the navy put under the French Ministry of Marine on 1 January 1811; the French tricolour used 1810–13 | <https://www.nimh.nl/militaire-geschiedenis-van-nederland/historische-overzichten/tijdlijn/1795-1814-onder-franse-invloed-reorganisatie-en-centralisatie>; <https://www.fotw.info/flags/nl.html> |
| Java, 1811 | Official news reached Batavia on 19 February 1811; from 20 February Daendels governed for the French. The order to replace the Dutch flag with the French was carried out on forts and ships. Janssens took over on 15 May. Dutch gunboats flew French colours off Merak on 30 July; Java surrendered on 18 September | *De Tijdspiegel* 50 (1893), <https://www.dbnl.org/tekst/_tij008189301_01/_tij008189301_01_0082.php>; <https://en.wikipedia.org/wiki/Invasion_of_Java_(1811)>; <https://en.wikipedia.org/wiki/Jan_Willem_Janssens> |

**What this means for her.** A Dutch 74 at sea in early 1811 had most likely sailed
after the annexation, and on arrival in Java would have hoisted French colours. History
leans **French** (the flags researcher put it at about 80 %). The book leaves it open,
and calls her Dutch throughout.

No source was found for the Kingdom of Holland's jack or commissioning pennant. A
Schouman painting of 1806 shows a ship under French colours with a long
blue-white-red pennant.

## Choice for the model

`buildShip({ ensign })` keeps surprise-model's option name with these values:

| Value | Flies | Why |
| --- | --- | --- |
| `'dutch'` (default) | Plain red-white-blue horizontal tricolour ensign at the peak; long red-white-blue pennant at the main | O'Brian calls her Dutch throughout and has her hoist "her own colours"; a player reads it at once. The flag of the Kingdom of Holland's navy, 1806–1810. RECONSTRUCTED for 1811 |
| `'blue'` | The British blue ensign, post-1801 Union | Her ruse in ch. 6. Drawn by surprise-model's existing flag code |
| `'french'` | The French tricolour, vertical, blue at the hoist; long blue-white-red pennant | The likelier history for 1811 |

The jack: a warship at sea in a chase would not fly one, but surprise-model always
builds a `jack` mesh and the API keeps it, so a host can hide it. It will be a small
tricolour on the jack staff. Its exact Dutch form for 1811 is not documented —
RECONSTRUCTED.
