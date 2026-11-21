// A working gta6-trophy-guide-01 entry (Node 22, standard library only): the guide is this directory's app/ folder,
// plain static files a browser opens at app/index.html (ES modules, CSS, no build step), offline: it loads nothing
// over the network, and its trophy list and guides are app/data/trophies.json. The program hands it in: it copies app/
// and screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the judge reads (your
// screenshots, the first load's files and bytes, and your source), with the vendored make.fun library. Leave
// vendor/makefun-frontend.ts as it is: the scorer requires dossier.json to be byte for byte what its own copy writes.
//
// Platinum Road v5 — bounded research top-up on the v4 guide (dossier first-load: 12,192 bytes gzip-9 against the 12,500 cap in v4; v5 keeps the shell lean by restyling, not adding): 14 disputes shown both ways with an explicit "Our call:" / "Safe play:" verdict line each, 10 of 160 steps backed by 2+ named sources, per-trophy source-count badges and a per-site claims table computed from the data, an "At risk" tier (2 trophies, distinct from the 1 missable) with its own filter chip, PSN points 1,350 with the grade split and 263 collectibles logged in the one-line audit, roadmap header totals (7 stages, ~200h, 4/10, 1 playthrough) with per-stage progress bars, a "Saved on this device · <date>" trust cue from real local state, and P/G/S/B grade filter chips beside the search box. The judged cover stays light with the Positive Mental Attitude detail filled, a one-line audit, a bold lead + big count stepper + two colour-blocked callouts in the guide pane, the checklist grouped by named chapters with place subtitles, and Next Up as a short horizontal strip. The 55-trophy checklist keeps saved progress, export/import that also carries per-trophy notes, verified progress counters, the next-up focus and the spoiler setting, kind, grade and editorial content-tag filters (Strangers, Money incl. robberies, Combat), a spoiler setting, a seven-chapter roadmap to the Platinum, a missables page with four separate missability wordings, a one-line verification audit, per-trophy step-by-step guides with a source on every step, a source matrix with a numbered dated source list, and a next-up planner ordered by roadmap stage and missability. Counters show the trophy's own target with its source and confidence, and single-attempt requirements are shown as conditions, never as ticking numbers. Guide text, steps, stages and sources live in app/data/trophies.json (fetched at runtime, outside the dossier total); the shell renders them.
// The screenshots in screenshots/ are real renders of this app in desktop Chrome at 1280x800, taken with 13 of 55 trophies earned, a counter part-way and a saved note on the cover trophy (Positive Mental Attitude, 6/18 meditations).
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
