// Platinum Road v2 — GTA VI trophy tracker. Loads app/data/trophies.json, saves
// earned trophies, per-trophy notes and progress counters in localStorage, and
// renders checklist, guide pane, roadmap, missables and save views. Offline.
const STORAGE_KEY = 'platinum-road-gta6-v1';
const SPOILER_KEY = 'platinum-road-gta6-spoilers';
const NOTES_KEY = 'platinum-road-gta6-v2-notes';
const COUNTS_KEY = 'platinum-road-gta6-v2-counts';
const POWERPYX_URL = 'https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/';

const listEl = document.getElementById('trophyList');
const paneEl = document.getElementById('guidePane');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade');
const noteEl = document.getElementById('filterNote');

const params = new URLSearchParams(location.search);
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

// Screenshot / deep-link state from the URL: ?view=roadmap, ?trophy=28,
// ?earned=1,2,3 (ids), ?spoilers=on. The earned list is in-memory only until
// the reader ticks a trophy; it never overwrites a saved list on its own.
let earned = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'));
if (params.has('earned')) {
  const ids = params.get('earned').split(',').map((s) => Number(s.trim())).filter(Number.isFinite);
  if (ids.length) earned = new Set(trophies.filter((t) => ids.includes(t.id)).map((t) => t.name));
}
let spoilersOn = localStorage.getItem(SPOILER_KEY) === '1';
if (params.get('spoilers') === 'on') spoilersOn = true;
if (params.get('spoilers') === 'off') spoilersOn = false;

// v2: personal notes (id -> text) and progress counters (id -> number).
// Both persist in localStorage and travel with export/import.
let notes = {};
let counts = {};
try { notes = JSON.parse(localStorage.getItem(NOTES_KEY) ?? '{}'); } catch { notes = {}; }
try { counts = JSON.parse(localStorage.getItem(COUNTS_KEY) ?? '{}'); } catch { counts = {}; }

let activeKind = 'all';
let activeTag = null;
let selectedId = Number(params.get('trophy')) || trophies[0].id;
let currentView = params.get('view') || 'checklist';
if (!['checklist', 'roadmap', 'missables', 'save'].includes(currentView)) currentView = 'checklist';

const STAGES = {
  1: { title: 'Stage 1 — Play the story', text: 'Chapters 1–5, the 12 story trophies, plus the final mission. Play the missions in order; chapter trophies can pop a mission or two late. Do the Chapter 1 balcony meditation for Positive Mental Attitude while you are here (see Missables).' },
  2: { title: 'Stage 2 — Character strands & strangers', text: 'Andy, Kenton, Billy, Randy, Tyrone, Bret, and the 8 Strangers & Freaks strands. Quest givers return after the story (PowerPyx), so strands can be finished in free roam. Meditation spots (18) belong here too — meditate with both characters together once Coffee Break unlocks them.' },
  3: { title: 'Stage 3 — Activities & exploration', text: 'Stunts, shooting ranges, drone races, races, fishing, arcade, challenges, vehicles, map exploration, gym and Criminal Profile. Most count toward the 100% checklist.' },
  4: { title: 'Stage 4 — Crime & robbery', text: 'Partner robberies, bank vaults, armored trucks, gang operations, the tank, the plane, the showroom and the bowling alley. Needs the Key Cloner, the Snap Gun and the Dye Pack Jammer from Chapter 3, and the Chapter 4 mission That’s Where The Money Is… for the banks.' },
  5: { title: 'Stage 5 — Collectibles, 100% & the Platinum', text: 'Card sets, WAiNK locations, garages, vehicle registration, the four unknown-method trophies, and finally A Long Road (100%) — then the Platinum pops.' },
};

function kindLabel(kind) {
  return { story: 'Story', collectibles: 'Collectibles', activities: 'Activities', crime: 'Crime', exploration: 'Exploration', meta: 'Meta' }[kind] || kind;
}
function stageName(n) { return STAGES[n].title; }
function verificationLabel(v) {
  return { official: 'Official list', community: 'Community-verified', derived: 'Derived — not yet checked in the game', unconfirmed: 'Unconfirmed — not yet checked in the game' }[v] || v;
}
// v2 missability: timing and method evidence are separate. Four wordings only.
function missText(t) {
  return 'Missability: ' + { auto: 'Automatic during story. Timing: earned during required story progression.', none: 'No known missable step.', potentially: 'Potentially missable. Timing: do the Chapter 1 step in Chapter 1 to be safe; whether skipping blocks it is not established.', unknown: 'Not established. Timing and method: not established.' }[t.miss];
}
function isHiddenFromReader(t) { return spoilersOn && t.hidden && !earned.has(t.name); }
function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned]));
  localStorage.setItem(SPOILER_KEY, spoilersOn ? '1' : '0');
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  localStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
}
function gradeCountsText() {
  const total = (g) => trophies.filter((t) => t.grade === g).length;
  const got = (g) => trophies.filter((t) => t.grade === g && earned.has(t.name)).length;
  const cap = (g) => g[0].toUpperCase() + g.slice(1);
  return ['platinum', 'gold', 'silver', 'bronze'].map((g) => `${cap(g)}: ${got(g)} of ${total(g)} earned`).join(' · ');
}
function renderProgress() {
  document.getElementById('earnedCount').textContent = earned.size;
  document.getElementById('earnedGamerscore').textContent = trophies.filter((t) => earned.has(t.name)).reduce((s, t) => s + (t.gamerscore || 0), 0);
  document.getElementById('progressFill').style.width = `${Math.round((earned.size / trophies.length) * 100)}%`;
  document.getElementById('gradeCounts').textContent = gradeCountsText();
}
function countOf(t) { return Math.max(0, Math.min(t.counter ? t.counter.target : 0, Number(counts[t.id]) || 0)); }
function trophyMatchesFilters(t) {
  const q = searchEl.value.trim().toLowerCase();
  if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (activeTag && !(t.tags || []).includes(activeTag)) return false;
  if (activeKind === 'missable') return t.missable;
  if (activeKind !== 'all' && t.kind !== activeKind) return false;
  return true;
}
function gradeDot(t) {
  return { platinum: '◆', gold: '●', silver: '●', bronze: '●' }[t.grade];
}
function tagNote() {
  if (activeTag === 'strangers') return 'Strangers tag: character questlines. Only 4 count toward Strangers & Freaks (8 strands).';
  if (activeTag === 'money') return 'Money tag includes robberies. Earn Cash and Hot Together are not Money.';
  if (activeTag === 'combat') return 'Combat tag: Gunslinger, Challenging Tank, Ten Pin only.';
  return '';
}
function renderChecklist() {
  listEl.replaceChildren();
  const shown = trophies.filter(trophyMatchesFilters);
  noteEl.textContent = tagNote() || (shown.length === trophies.length
    ? 'Showing all 55 trophies. Click a trophy to open its guide; tick the box when you earn it.'
    : `Showing ${shown.length} of 55 trophies.`);
  for (const t of shown) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'trophy-row' + (earned.has(t.name) ? ' earned' : '') + (t.id === selectedId ? ' selected' : '');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Earned: ${t.name}`);
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name); else earned.delete(t.name);
      saveProgress(); renderAll();
    });
    const body = document.createElement('span');
    const hidden = isHiddenFromReader(t);
    const name = document.createElement('span');
    name.className = 'trophy-name';
    name.textContent = hidden ? 'Hidden trophy' : t.name;
    if (hidden) {
      const tag = document.createElement('span');
      tag.className = 'hidden-tag';
      tag.textContent = ' — hidden until earned';
      name.append(tag);
    }
    const desc = document.createElement('span');
    desc.className = 'trophy-desc';
    desc.textContent = hidden ? 'Turn spoilers off, or earn this trophy to reveal it.' : t.description;
    const meta = document.createElement('span');
    meta.className = 'trophy-meta';
    const gradeBadge = document.createElement('span');
    gradeBadge.className = `badge grade-${t.grade}`;
    gradeBadge.textContent = t.grade;
    meta.append(gradeBadge);
    const kindBadge = document.createElement('span');
    kindBadge.className = 'badge';
    kindBadge.textContent = kindLabel(t.kind);
    meta.append(kindBadge);
    if (!hidden && t.gamerscore) {
      const g = document.createElement('span');
      g.className = 'badge';
      g.textContent = `${t.gamerscore}G`;
      meta.append(g);
    }
    if (t.hidden && !hidden) {
      const h = document.createElement('span');
      h.className = 'badge hidden-badge';
      h.textContent = 'Hidden';
      meta.append(h);
    }
    if (t.missable) {
      const m = document.createElement('span');
      m.className = 'badge missable';
      m.textContent = 'Missable';
      meta.append(m);
    }
    if (t.verification === 'unconfirmed') {
      const u = document.createElement('span');
      u.className = 'badge unconfirmed';
      u.textContent = 'Not yet checked';
      meta.append(u);
    }
    if (notes[t.id]) {
      const nb = document.createElement('span');
      nb.className = 'badge note-badge';
      nb.textContent = 'Note';
      meta.append(nb);
    }
    body.append(name, desc, meta);
    if (!hidden && t.counter) {
      const c = document.createElement('span');
      c.className = 'trophy-desc';
      c.textContent = `Counter: ${countOf(t).toLocaleString()} / ${t.counter.target.toLocaleString()} ${t.counter.unit}`;
      body.append(c);
    }
    const dot = document.createElement('span');
    dot.className = `grade-dot grade-${t.grade}`;
    dot.textContent = gradeDot(t);
    dot.style.color = { platinum: '#5b7a99', gold: '#b78a1f', silver: '#6b7280', bronze: '#b9784c' }[t.grade];
    row.append(box, body, dot);
    row.addEventListener('click', () => { selectedId = t.id; renderAll(); });
    listEl.append(row);
  }
  if (!shown.length) {
    const p = document.createElement('p');
    p.textContent = 'No trophies match these filters.';
    listEl.append(p);
  }
}
function sourceLink(label) {
  if (label.startsWith('PowerPyx')) return { text: label, href: POWERPYX_URL };
  if (label.startsWith('Official trophy list')) return { text: label, href: 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/' };
  return { text: label, href: null };
}
function renderGuidePane() {
  const t = trophies.find((x) => x.id === selectedId) || trophies[0];
  paneEl.replaceChildren();
  if (isHiddenFromReader(t)) {
    const h = document.createElement('h2');
    h.textContent = 'Hidden trophy';
    const p = document.createElement('p');
    p.className = 'empty-pane';
    p.textContent = 'One of the 28 hidden trophies. Its name, description and guide stay hidden while spoilers are on and it is unearned — earn it and tick it here to reveal the guide.';
    paneEl.append(h, p);
    return;
  }
  const h = document.createElement('h2');
  h.textContent = t.name;
  const badges = document.createElement('p');
  badges.className = 'trophy-meta';
  const gradeBadge = document.createElement('span');
  gradeBadge.className = `badge grade-${t.grade}`;
  gradeBadge.textContent = t.grade;
  badges.append(gradeBadge);
  const g = document.createElement('span');
  g.className = 'badge';
  g.textContent = `${t.gamerscore} Gamerscore · ${kindLabel(t.kind)} · Stage ${t.roadmap_stage}`;
  badges.append(g);
  if (t.hidden) {
    const hb = document.createElement('span');
    hb.className = 'badge hidden-badge';
    hb.textContent = 'Hidden on PlayStation';
    badges.append(hb);
  }
  if (t.missable) {
    const mb = document.createElement('span');
    mb.className = 'badge missable';
    mb.textContent = 'Potentially missable';
    badges.append(mb);
  }
  const desc = document.createElement('p');
  desc.className = 'official-desc';
  desc.textContent = `Official description: “${t.description}”`;
  const miss = document.createElement('p');
  miss.className = 'miss-line';
  miss.textContent = missText(t);
  const guideH = document.createElement('h3');
  guideH.textContent = 'Guide';
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = t.guide;
  const srcH = document.createElement('h3');
  srcH.textContent = 'Sources';
  const src = document.createElement('p');
  src.className = 'sources';
  t.sources.forEach((label, i) => {
    const link = sourceLink(label);
    if (i) src.append(document.createTextNode(' · '));
    if (link.href) {
      const a = document.createElement('a');
      a.href = link.href; a.textContent = link.text; a.target = '_blank'; a.rel = 'noopener';
      src.append(a);
    } else src.append(document.createTextNode(link.text));
  });
  paneEl.append(h, badges, desc, miss, guideH, guide, srcH, src);
  // v2: verified progress counter, with its source right underneath it.
  if (t.counter) {
    const box = document.createElement('div');
    box.className = 'counter-box';
    const ch = document.createElement('h3');
    ch.textContent = 'Progress counter';
    const line = document.createElement('div');
    line.className = 'counter-line';
    const minus = document.createElement('button');
    minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', 'Decrease counter');
    const input = document.createElement('input');
    input.type = 'number'; input.min = '0'; input.max = String(t.counter.target); input.step = String(t.counter.step || 1);
    input.value = String(countOf(t)); input.setAttribute('aria-label', `Your progress, out of ${t.counter.target} ${t.counter.unit}`);
    const unit = document.createElement('span');
    unit.textContent = `/ ${t.counter.target.toLocaleString()} ${t.counter.unit}`;
    const plus = document.createElement('button');
    plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', 'Increase counter');
    const set = (v) => { counts[t.id] = Math.max(0, Math.min(t.counter.target, Math.round(v) || 0)); saveProgress(); renderAll(); };
    minus.addEventListener('click', () => set(countOf(t) - (t.counter.step || 1)));
    plus.addEventListener('click', () => set(countOf(t) + (t.counter.step || 1)));
    input.addEventListener('change', () => set(Number(input.value)));
    line.append(minus, input, unit, plus);
    box.append(ch, line);
    if (t.counter.extra) {
      const ex = document.createElement('p');
      ex.className = 'counter-src';
      ex.textContent = t.counter.extra;
      box.append(ex);
    }
    const s = document.createElement('p');
    s.className = 'counter-src';
    s.textContent = `Source: ${t.counter.src} — community-reported.`;
    box.append(s);
    paneEl.append(box);
  }
  if (t.condition) {
    const box = document.createElement('div');
    box.className = 'condition-box';
    const ch = document.createElement('h3');
    ch.textContent = 'Condition — not a counter';
    const p = document.createElement('p');
    p.textContent = t.condition;
    const s = document.createElement('p');
    s.className = 'counter-src';
    s.textContent = `Source: ${t.condition_src} — community-reported. One attempt only, not a lifetime total.`;
    box.append(ch, p, s);
    paneEl.append(box);
  }
  // v2: personal note — labelled personal, never guide evidence.
  const noteH = document.createElement('h3');
  noteH.textContent = 'My note';
  const noteBox = document.createElement('div');
  noteBox.className = 'note-box';
  const ta = document.createElement('textarea');
  ta.value = notes[t.id] || '';
  ta.placeholder = 'Your own note — saved here. Personal, not guide evidence.';
  ta.setAttribute('aria-label', `Personal note for ${t.name}`);
  const saved = document.createElement('p');
  saved.className = 'note-saved';
  saved.textContent = notes[t.id] ? 'Note saved.' : '';
  ta.addEventListener('input', () => {
    if (ta.value.trim()) notes[t.id] = ta.value; else delete notes[t.id];
    saveProgress();
    saved.textContent = ta.value.trim() ? 'Note saved.' : '';
    renderProgress();
  });
  noteBox.append(ta, saved);
  const ver = document.createElement('p');
  ver.className = 'verification-note' + (t.verification === 'unconfirmed' ? ' unconfirmed' : '');
  ver.textContent = `Status: ${verificationLabel(t.verification)}.`;
  const stage = document.createElement('p');
  stage.className = 'sources';
  stage.textContent = `Roadmap: ${stageName(t.roadmap_stage)}.`;
  paneEl.append(noteH, noteBox, ver, stage);
}
function renderRoadmap() {
  const host = document.getElementById('roadmapStages');
  host.replaceChildren();
  for (const n of [1, 2, 3, 4, 5]) {
    const stageTrophies = trophies.filter((t) => t.roadmap_stage === n);
    const got = stageTrophies.filter((t) => earned.has(t.name)).length;
    const card = document.createElement('div');
    card.className = 'stage-card';
    const h = document.createElement('h3');
    h.textContent = `${STAGES[n].title} — ${got}/${stageTrophies.length} earned`;
    const p = document.createElement('p');
    p.textContent = STAGES[n].text;
    const names = document.createElement('p');
    names.className = 'stage-trophies';
    names.textContent = stageTrophies.map((t) => (earned.has(t.name) ? '✓ ' : '') + (isHiddenFromReader(t) ? 'Hidden trophy' : t.name)).join(' · ');
    card.append(h, p, names);
    host.append(card);
  }
}
function missableCard(t, title) {
  const card = document.createElement('div');
  card.className = 'stage-card missable-card';
  const h = document.createElement('h3');
  h.textContent = title;
  const d = document.createElement('p');
  d.className = 'official-desc';
  d.textContent = `Official description: “${t.description}”`;
  const m = document.createElement('p');
  m.className = 'miss-line';
  m.textContent = missText(t);
  const g = document.createElement('p');
  g.textContent = t.guide;
  const s = document.createElement('p');
  s.className = 'sources';
  s.textContent = 'Sources: official trophy list (Exophase / PSNProfiles); PowerPyx — GTA 6 Trophy Guide & Roadmap (Nov 18, 2026); GTABase.';
  card.append(h, d, m, g, s);
  return card;
}
function renderMissables() {
  const host = document.getElementById('missablesList');
  host.replaceChildren();
  const pma = trophies.find((t) => t.miss === 'potentially');
  if (pma) host.append(missableCard(pma, `⚠ ${pma.name} — the only potentially missable trophy`));
  const unknown = trophies.filter((t) => t.miss === 'unknown');
  if (unknown.length) {
    const head = document.createElement('h3');
    head.textContent = 'Not established — method unknown, missability unknown';
    host.append(head);
    for (const t of unknown) host.append(missableCard(t, t.name));
  }
  const ok = document.createElement('div');
  ok.className = 'stage-card';
  const h2 = document.createElement('h3');
  h2.textContent = 'The other 50 trophies: no known missable step';
  const p2 = document.createElement('p');
  p2.textContent = 'Fifty trophies have no known missable step: 12 are story milestones, earned during required story progression; the rest have no reported missable condition. This guide does not claim every one can be earned in free roam after the story.';
  ok.append(h2, p2);
  host.append(ok);
}
function exportProgress() {
  const data = { version: 2, earned: [...earned], notes, counts, spoilers: spoilersOn };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
async function importProgressFile(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const known = new Set(trophies.map((t) => t.name));
    const byId = new Map(trophies.map((t) => [t.id, t]));
    const names = Array.isArray(data) ? data : data.earned;
    earned = new Set((names || []).filter((n) => typeof n === 'string' && known.has(n)));
    if (!Array.isArray(data) && data && typeof data === 'object') {
      notes = {};
      if (data.notes && typeof data.notes === 'object') {
        for (const [k, v] of Object.entries(data.notes)) {
          const id = Number(k);
          if (byId.has(id) && typeof v === 'string' && v.trim()) notes[id] = v;
        }
      }
      counts = {};
      if (data.counts && typeof data.counts === 'object') {
        for (const [k, v] of Object.entries(data.counts)) {
          const id = Number(k);
          const t = byId.get(id);
          if (t && t.counter && Number.isFinite(Number(v))) counts[id] = Math.max(0, Math.min(t.counter.target, Math.round(Number(v))));
        }
      }
      if (typeof data.spoilers === 'boolean') spoilersOn = data.spoilers;
    }
    saveProgress(); syncSpoilerBoxes(); renderAll();
    noteEl.textContent = `Imported ${earned.size} earned, ${Object.keys(notes).length} notes, ${Object.keys(counts).length} counters.`;
  } catch {
    noteEl.textContent = 'That file could not be imported — it must be a JSON export from this guide.';
  }
}
function setView(view) {
  currentView = view;
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('hidden', v.id !== `view-${view}`));
  // The search / kind / grade / spoiler / export bar belongs to the checklist;
  // other views get the space back so their content fits in one screen.
  document.querySelector('.controls').style.display = view === 'checklist' ? '' : 'none';
  noteEl.style.display = view === 'checklist' ? '' : 'none';
  if (view === 'roadmap') renderRoadmap();
  if (view === 'missables') renderMissables();
}
function renderAll() {
  renderProgress();
  renderChecklist();
  renderGuidePane();
  if (currentView === 'roadmap') renderRoadmap();
  if (currentView === 'missables') renderMissables();
}

document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
document.querySelectorAll('.chip[data-kind]').forEach((c) => c.addEventListener('click', () => {
  activeKind = c.dataset.kind;
  document.querySelectorAll('.chip[data-kind]').forEach((x) => x.classList.toggle('active', x === c));
  renderChecklist();
}));
document.querySelectorAll('.chip[data-tag]').forEach((c) => c.addEventListener('click', () => {
  const was = activeTag === c.dataset.tag;
  activeTag = was ? null : c.dataset.tag;
  document.querySelectorAll('.chip[data-tag]').forEach((x) => x.classList.toggle('active', !was && x === c));
  renderChecklist();
}));
searchEl.addEventListener('input', renderChecklist);
gradeEl.addEventListener('change', renderChecklist);
document.getElementById('exportBtn').addEventListener('click', exportProgress);
document.getElementById('exportBtn2').addEventListener('click', exportProgress);
document.getElementById('importFile').addEventListener('change', (e) => importProgressFile(e.target.files[0]));
document.getElementById('importFile2').addEventListener('change', (e) => importProgressFile(e.target.files[0]));
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Reset all progress? This clears every earned tick, note and counter.')) {
    earned = new Set(); notes = {}; counts = {}; saveProgress(); renderAll();
  }
});
function syncSpoilerBoxes() {
  document.getElementById('spoilers').checked = spoilersOn;
  document.getElementById('spoilers2').checked = spoilersOn;
}
document.getElementById('spoilers').addEventListener('change', (e) => { spoilersOn = e.target.checked; saveProgress(); syncSpoilerBoxes(); renderAll(); });
document.getElementById('spoilers2').addEventListener('change', (e) => { spoilersOn = e.target.checked; saveProgress(); syncSpoilerBoxes(); renderAll(); });

syncSpoilerBoxes();
setView(currentView);
renderAll();
