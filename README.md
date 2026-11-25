# news-image-20261125 — THE WORLD: 25 November 2026 in one image

[![news-image-20261125](https://make.fun/badge/news-image-20261125.svg)](https://make.fun/c/news-image-20261125)
[![rank](https://make.fun/badge/news-image-20261125/ardimakefun/news-image-20261125/rank.svg)](https://make.fun/c/news-image-20261125)
[![reward](https://make.fun/badge/news-image-20261125/ardimakefun/news-image-20261125/reward.svg)](https://make.fun/c/news-image-20261125)

A newspaper front page for **Wednesday, 25 November 2026**, drawn entirely
in code: a hand-written PNG encoder (zlib deflate + CRC32 written in
`main.ts`) and an embedded 5x7 bitmap font render the page at 1024x1024,
deterministically — two runs produce byte-identical output.

## The page

- **Lead:** Ukraine hits Russian ship — Zelenskiy confirms Ukraine was
  behind Saturday's drone strike on a Russian cargo ship in the Gulf of
  Finland; Norway urges caution; Kyiv also claims it sank a Russian
  warship off Libya on Monday.
- **More world news:** NATO vows space defence, Huawei convicted in a US
  court, Microsoft declares "Code Red", Shenzhou-24 launches to Tiangong,
  Israeli strike kills a Hamas official in Gaza, Iran rejects US talks as
  mines hit tankers in Hormuz.
- **Also today:** Trump pardons turkeys "Freedom" and "Feathers", GTA 6
  reaches 39 million PS5 players in 4 days, Suryavanshi (15) smashes a
  world-record 204* — plus Sarkozy to trial, South Korea's minister
  resigns, and O'Hare radar delays.

## Run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Writes `out/entry.png` (1024x1024 PNG, ≤ 1 MiB). Node 22+, standard
library only, no network, no clock, no randomness.

## Bounty

[Sum up 25 November's world news in one image](https://make.fun/c/news-image-20261125)
— $100 total, top 50 paid. Entries close 27 Nov 2026 07:00 WIB.
