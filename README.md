# Platinum Road — GTA VI Trophy Guide & Tracker

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/sarannamakatanya/-gta6-trophy-guide/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/sarannamakatanya/-gta6-trophy-guide/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI — built for the [make.fun GTA 6 trophy guide competition](https://make.fun/c/gta6-trophy-guide-01).

## What it is

- **Complete checklist** of all 55 official trophies (1 Platinum, 2 Gold, 6 Silver, 46 Bronze; 28 hidden, 27 visible; 1,000 Gamerscore), with progress saved in the browser, export and import (which also carry your notes, counters and spoiler setting), and filters by kind (story, missable, collectibles, activities, crime, exploration), grade, and editorial content tags (Strangers, Money incl. robberies, Combat).
- **Personal notes and verified progress counters**: a saved, editable note per trophy, and a counter per countable trophy showing the trophy's own target (42 gold medals for The Shootist, 250 stunts, and so on) with its source and confidence. Single-attempt requirements (Gunslinger, Retail Therapy, Hot Together) are shown as conditions, never as ticking numbers.
- **A guide for every trophy**, written in this entry's own words, each with its sources named beside it.
- **Roadmap to the Platinum**: five stages built from the official descriptions — about 200 hours, difficulty 4/10, one playthrough.
- **Missables**: one potentially-missable trophy (Positive Mental Attitude), flagged with its Chapter 1 warning and no claim about whether skipping it blocks the trophy; four trophies with no established method, so their missability is not established either; the other 50 have no known missable step. Story milestones are earned during required story progression.
- **Spoiler setting**: hides the 28 hidden trophies — name, description and guide — until they are earned.
- **Honest labelling**: four trophies have no confirmed trigger yet (In The Beginning…, Bad Luck I Guess, The Truth Is Out There, Ten Pin) and are labelled “not yet checked in the game”, never presented as fact. Two more requirements are flagged unconfirmed the same way (Fair Game's exact animal; whether the Chapter 1 meditation is required).

## Sources

Trophy names, descriptions and grades are shown as PlayStation publishes them (official list on Exophase / PSNProfiles). Methods played firsthand are credited per trophy to PowerPyx's GTA 6 Trophy Guide & Roadmap (Nov 18, 2026), with GTABase where noted. Unofficial fan guide — not affiliated with Rockstar Games or PlayStation. No Rockstar logo or official artwork appears anywhere.

## Run it

Static files, no build step, no network at runtime:

```sh
node serve.ts
# open http://localhost:8080
```

Or open `app/index.html` from any static server with `app/` at its root.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored `vendor/makefun-frontend.ts` library.

## Licence

MIT — see `LICENSE`.
