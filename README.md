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
  without a headscarf in an online concert, Iran rejects US talks as
  mines hit tankers in Hormuz.
- **Also today:** Trump pardons turkeys "Freedom" and "Feathers", GTA 6
  reaches 39 million PS5 players in 4 days, Suryavanshi (15) smashes a
  world-record 204* — plus Sarkozy to trial, South Korea's minister
  resigns, and an Israeli strike in Gaza.

## Counts (Chunk A — all arithmetic must match)

- **13 stories:** 1 lead + 6 secondary + 3 "Also today" + 3 in the ticker.
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
and launches are OFFICIAL; Huawei/Ahmadi/Hormuz are CONFIRMED; the leaked
Microsoft memo, GTA 6 and cricket are REPORTED; Gaza is REPORTED (Daily
Debrief only). "MULTIPLE OUTLETS" is used where the brief names no outlet.

- Leads: ship OFFICIAL - REUTERS; NATO OFFICIAL - WH NEWS; Shenzhou-24
  OFFICIAL - MULTIPLE OUTLETS.
- Secondary: Huawei OFFICIAL - REUTERS; Microsoft REPORTED - THE HINDU;
  Ahmadi CONFIRMED - MULTIPLE OUTLETS; Hormuz CONFIRMED - MULTIPLE OUTLETS.
- Also today: Thanksgiving OFFICIAL - MULTIPLE OUTLETS; GTA 6 REPORTED -
  MULTIPLE OUTLETS; cricket REPORTED - MULTIPLE OUTLETS.
- Ticker: Sarkozy OFFICIAL - REUTERS; South Korea OFFICIAL - MULTIPLE
  OUTLETS; Gaza REPORTED - DAILY DEBRIEF.

## Run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Writes `out/entry.png` (1024x1024 PNG, ≤ 1 MiB). Node 22+, standard
library only, no network, no clock, no randomness.

## Bounty

[Sum up 25 November's world news in one image](https://make.fun/c/news-image-20261125)
— $100 total, top 50 paid. Entries close 27 Nov 2026 07:00 WIB.
