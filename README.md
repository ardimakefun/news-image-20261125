# news-image-20261125 — THE WORLD: 25 November 2026 in one image

[![news-image-20261125](https://make.fun/badge/news-image-20261125.svg)](https://make.fun/c/news-image-20261125)
[![rank](https://make.fun/badge/news-image-20261125/ardimakefun/news-image-20261125/rank.svg)](https://make.fun/c/news-image-20261125)
[![reward](https://make.fun/badge/news-image-20261125/ardimakefun/news-image-20261125/reward.svg)](https://make.fun/c/news-image-20261125)

A newspaper front page for **Wednesday, 25 November 2026**, drawn entirely
in code: a hand-written PNG encoder (zlib deflate + CRC32 written in
`main.ts`) and an embedded 5x7 bitmap font render the page at 1024x1024,
deterministically — two runs produce byte-identical output.

## The page

- **Lead:** "Zelenskiy: we hit Russian ship" — Zelenskiy confirms Ukraine was
  behind Saturday's drone strike on a Russian cargo ship in the Gulf of
  Finland; Norway urges caution; Kyiv also claims it sank a Russian
  warship off Libya on Monday.
- **More world news:** NATO vows space defence, Huawei convicted in a US
  court, Microsoft declares "Code Red", Shenzhou-24 launches to Tiangong,
  Iran sentences singer Parastoo Ahmadi to 74 lashes for performing
  in an online concert, Iran rejects US talks as
  mines hit tankers in Hormuz.
- **Also today:** Trump pardons turkeys "Freedom" and "Feathers", GTA 6
  reaches 39 million PS5 players in 4 days, Suryavanshi (15) smashes a
  world-record 204* — plus Sarkozy to trial, South Korea's minister
  resigns, and an Israeli strike in Gaza.

## Counts (Chunk A — all arithmetic must match)

- **13 stories:** 3 leads + 4 secondary + 3 "Also today" + 3 in the ticker.
- **10 fields:** war, space, court, tech, human rights, energy, culture,
  politics, games, sport.
- **Regions (sum 13):** Europe 3 (lead ship, NATO space, Sarkozy), Asia 3
  (Shenzhou, cricket, South Korea), Middle East 3 (Ahmadi, Hormuz, Gaza),
  Americas 4 (Huawei US court, Microsoft, Thanksgiving, GTA 6).
- **Numbers strip (all from stories on the page):** 74 lashes (Ahmadi),
  39M GTA 6 PS5 players, 204\* Suryavanshi runs, 53 balls for that 204\*,
  3 tankers hit in Hormuz, 2027 (Sarkozy trial, 1 Apr 2027).
- **DATE CHECK:** the ship drone strike was Saturday 21 Nov (confirmed by
  Zelenskiy 25 Nov) and the Libya warship claim was Monday 23 Nov — neither
  is a 25 Nov event, and the footer says so.

## Verification badges (Chunk C1)

Every story carries a verification badge + source on its own small line
(green = OFFICIAL, navy = CONFIRMED, red = REPORTED). Legend in the
footer: OFFICIAL = on the record, CONFIRMED = 2+ outlets, REPORTED = one
outlet. Badges follow the coordinator brief: official statements, verdicts
and launches are OFFICIAL; Ahmadi/Hormuz are CONFIRMED; the leaked
Microsoft memo is REPORTED; GTA 6 and cricket are CONFIRMED (multiple
outlets), not REPORTED — the legend defines REPORTED as one outlet only.
Gaza is REPORTED (Daily Debrief only). "MULTIPLE OUTLETS" is used where
the brief names no outlet.

- Leads: ship OFFICIAL - REUTERS; NATO OFFICIAL - WH NEWS; Shenzhou-24
  OFFICIAL - MULTIPLE OUTLETS.
- Secondary: Huawei OFFICIAL - REUTERS; Microsoft REPORTED - THE HINDU;
  Ahmadi CONFIRMED - MULTIPLE OUTLETS; Hormuz CONFIRMED - MULTIPLE OUTLETS.
- Also today: Thanksgiving OFFICIAL - MULTIPLE OUTLETS; GTA 6 CONFIRMED -
  MULTIPLE OUTLETS; cricket CONFIRMED - MULTIPLE OUTLETS.
- Ticker: Sarkozy OFFICIAL - REUTERS; South Korea OFFICIAL - MULTIPLE
  OUTLETS; Gaza REPORTED - DAILY DEBRIEF.

## World map (Chunk C2)

A full-width world-map band sits between the secondary grid and the numbers
strip: continents drawn from scratch as unions of green discs on a light-blue
ocean (no copied map), with numbered red pins for the stories that have a
clear land location. The label "WHERE IT HAPPENED" sits in a chip inside
the band, bottom left over the empty South Pacific.

- **Pins (11):** 1 Gulf of Finland, 3 China, 4 US east coast, 5 US west
  coast, 6 Iran, 7 Strait of Hormuz (Oman coast), 8 central US, 10 India,
  11 France, 12 South Korea, 13 Gaza. Every pin centre is on land and no
  two pins touch (closest pair 1–13, 35.5 px between centres; pins 32 px
  diameter with a 2 px white ring).
- **No pin:** 2 NATO (space defence, orbit — no land location) and 9 GTA 6
  (no event location). Better no pin than an invented one.
- **Room for the band:** lead art 150 → 100 px (the three scenes re-fitted:
  ship hull/mast shortened, drones moved above the containers, rocket flame
  shortened with smoke at its base, satellite moon/orbit kept in-frame),
  masthead title scale 9 → 7, dateline scale 3 → 2, gaps tightened to
  1–2 px. The band is 120 px tall, not 150: the page was already full
  (1021/1024 px used) and a 150 px band would only fit by shrinking text
  below its current sizes, which would hurt readability. No story, badge,
  number, or region value was changed or removed.

## Run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Writes `out/entry.png` (1024x1024 PNG, ≤ 1 MiB). Node 22+, standard
library only, no network, no clock, no randomness.

## Bounty

[Sum up 25 November's world news in one image](https://make.fun/c/news-image-20261125)
— $100 total, top 50 paid. Entries close 27 Nov 2026 07:00 WIB.
