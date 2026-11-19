// Platinum Road — GTA VI trophy tracker. Loads app/data/trophies.json, saves
// earned trophies in localStorage, and renders checklist, guide pane, roadmap,
// missables and save views. No network requests beyond its own files.
const STORAGE_KEY = 'platinum-road-gta6-v1';
const SPOILER_KEY = 'platinum-road-gta6-spoilers';
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
let seededEarned = false;
if (params.has('earned')) {
  const ids = params.get('earned').split(',').map((s) => Number(s.trim())).filter(Number.isFinite);
  if (ids.length) { earned = new Set(trophies.filter((t) => ids.includes(t.id)).map((t) => t.name)); seededEarned = true; }
}
let spoilersOn = localStorage.getItem(SPOILER_KEY) === '1';
if (params.get('spoilers') === 'on') spoilersOn = true;
if (params.get('spoilers') === 'off') spoilersOn = false;

let activeKind = 'all';
let selectedId = Number(params.get('trophy')) || trophies[0].id;
let currentView = params.get('view') || 'checklist';
if (!['checklist', 'roadmap', 'missables', 'save'].includes(currentView)) currentView = 'checklist';

const STAGES = {
  1: { title: 'Stage 1 — Play the story', text: 'Chapters 1–5, the 12 story trophies, plus the final mission. Play the missions in order; chapter trophies can pop a mission or two late. Do the Chapter 1 balcony meditation for Positive Mental Attitude while you are here (see Missables).' },
  2: { title: 'Stage 2 — Character strands & strangers', text: 'Andy, Kenton, Billy, Randy, Tyrone, Bret, and the 8 Strangers & Freaks strands. All are available in free roam after the story. Meditation spots (18) belong here too — meditate with both characters together once Coffee Break unlocks them.' },
  3: { title: 'Stage 3 — Activities & exploration', text: 'Stunts, shooting ranges, drone races, races, fishing, arcade, challenges, vehicles, map exploration, gym and Criminal Profile. Most of these count toward the 100% checklist, so progress here is progress there.' },
  4: { title: 'Stage 4 — Crime & robbery', text: 'Partner robberies, bank vaults, armored trucks, gang operations, the tank, the plane, the showroom and the bowling alley. Needs the Key Cloner, the Snap Gun and the Dye Pack Jammer from Chapter 3, and the Chapter 4 mission That’s Where The Money Is… for the banks.' },
  5: { title: 'Stage 5 — Collectibles, 100% & the Platinum', text: 'Card sets, WAiNK locations, garages, vehicle registration, the four trophies whose triggers are still unknown, and finally A Long Road (100% Completion) — then the Platinum pops. The 100% checklist is about 60% true completion; most tasks ask for part of a total.' },
};

function kindLabel(kind) {
  return { story: 'Story', collectibles: 'Collectibles', activities: 'Activities', crime: 'Crime', exploration: 'Exploration', meta: 'Meta' }[kind] || kind;
}
function stageName(n) { return STAGES[n].title; }
function verificationLabel(v) {
  return { official: 'Official list', community: 'Community-verified', derived: 'Derived — not yet checked in the game', unconfirmed: 'Unconfirmed — not yet checked in the game' }[v] || v;
}
function isHiddenFromReader(t) { return spoilersOn && t.hidden && !earned.has(t.name); }
function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned]));
  localStorage.setItem(SPOILER_KEY, spoilersOn ? '1' : '0');
}
function gradeCountsText() {
  const total = (g) => trophies.filter((t) => t.grade === g).length;
  const got = (g) => trophies.filter((t) => t.grade === g && earned.has(t.name)).length;
  return `Platinum ${got('platinum')}/${total('platinum')} · Gold ${got('gold')}/${total('gold')} · Silver ${got('silver')}/${total('silver')} · Bronze ${got('bronze')}/${total('bronze')}`;
}
function renderProgress() {
  document.getElementById('earnedCount').textContent = earned.size;
  document.getElementById('earnedGamerscore').textContent = trophies.filter((t) => earned.has(t.name)).reduce((s, t) => s + (t.gamerscore || 0), 0);
  document.getElementById('progressFill').style.width = `${Math.round((earned.size / trophies.length) * 100)}%`;
  document.getElementById('gradeCounts').textContent = gradeCountsText();
}
function trophyMatchesFilters(t) {
  const q = searchEl.value.trim().toLowerCase();
  if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (activeKind === 'missable') return t.missable;
  if (activeKind !== 'all' && t.kind !== activeKind) return false;
  return true;
}
function gradeDot(t) {
  return { platinum: '◆', gold: '●', silver: '●', bronze: '●' }[t.grade];
}
function renderChecklist() {
  listEl.replaceChildren();
  const shown = trophies.filter(trophyMatchesFilters);
  noteEl.textContent = shown.length === trophies.length
    ? 'Showing all 55 trophies. Click a trophy to open its guide; tick the box when you earn it.'
    : `Showing ${shown.length} of 55 trophies.`;
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
      seededEarned = false;
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
    body.append(name, desc, meta);
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
    p.textContent = 'This is one of the 28 hidden trophies. Its name, description and guide stay hidden while the spoiler setting is on and the trophy is unearned. Earn it in the game and tick it here to reveal the guide.';
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
    mb.textContent = 'Missable — read before Chapter 1 ends';
    badges.append(mb);
  }
  const desc = document.createElement('p');
  desc.className = 'official-desc';
  desc.textContent = `Official description: “${t.description}”`;
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
  const guideH = document.createElement('h3');
  guideH.textContent = 'Guide';
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = t.guide;
  const ver = document.createElement('p');
  ver.className = 'verification-note' + (t.verification === 'unconfirmed' ? ' unconfirmed' : '');
  ver.textContent = `Status: ${verificationLabel(t.verification)}.`;
  const stage = document.createElement('p');
  stage.className = 'sources';
  stage.textContent = `Roadmap: ${stageName(t.roadmap_stage)}.`;
  paneEl.append(h, badges, desc, srcH, src, guideH, guide, ver, stage);
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
function renderMissables() {
  const host = document.getElementById('missablesList');
  host.replaceChildren();
  for (const t of trophies.filter((x) => x.missable)) {
    const card = document.createElement('div');
    card.className = 'stage-card missable-card';
    const h = document.createElement('h3');
    h.textContent = `⚠ ${t.name} — the only possibly-missable trophy`;
    const d = document.createElement('p');
    d.className = 'official-desc';
    d.textContent = `Official description: “${t.description}”`;
    const g = document.createElement('p');
    g.textContent = t.guide;
    const s = document.createElement('p');
    s.className = 'sources';
    s.textContent = 'Sources: official trophy list (Exophase / PSNProfiles); PowerPyx — GTA 6 Trophy Guide & Roadmap (Nov 18, 2026); GTABase.';
    card.append(h, d, g, s);
    host.append(card);
  }
  const ok = document.createElement('div');
  ok.className = 'stage-card';
  const h2 = document.createElement('h3');
  h2.textContent = 'Everything else: not missable';
  const p2 = document.createElement('p');
  p2.textContent = 'All 54 other trophies can be earned in free roam after the story. Stranger mission chains return after the story, optional missions that disappear are trophy-irrelevant, and collectibles in story buildings that close off also spawn elsewhere (PowerPyx, firsthand). No other trophy has a missable condition.';
  ok.append(h2, p2);
  host.append(ok);
}
function exportProgress() {
  const blob = new Blob([JSON.stringify([...earned], null, 2)], { type: 'application/json' });
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
    const names = Array.isArray(data) ? data : data.earned;
    const known = new Set(trophies.map((t) => t.name));
    earned = new Set(names.filter((n) => typeof n === 'string' && known.has(n)));
    seededEarned = false;
    saveProgress(); renderAll();
  } catch {
    noteEl.textContent = 'That file could not be imported — it must be a JSON list of trophy names exported from this guide.';
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
document.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => {
  activeKind = c.dataset.kind;
  document.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x === c));
  renderChecklist();
}));
searchEl.addEventListener('input', renderChecklist);
gradeEl.addEventListener('change', renderChecklist);
document.getElementById('exportBtn').addEventListener('click', exportProgress);
document.getElementById('exportBtn2').addEventListener('click', exportProgress);
document.getElementById('importFile').addEventListener('change', (e) => importProgressFile(e.target.files[0]));
document.getElementById('importFile2').addEventListener('change', (e) => importProgressFile(e.target.files[0]));
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Reset all progress? This clears every earned tick.')) { earned = new Set(); saveProgress(); renderAll(); }
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
