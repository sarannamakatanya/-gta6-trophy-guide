const SK = 'platinum-road-gta6-v1';
const SPK = 'platinum-road-gta6-spoilers';
const NK = 'platinum-road-gta6-v2-notes';
const CK = 'platinum-road-gta6-v2-counts';
const FK = 'platinum-road-gta6-v2-focus';
const PP = 'https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/';
const EXO = 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/';
const N1920 = 'Nov 19–20, 2026';
const PTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };
const $ = (id) => document.getElementById(id);
function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
function badge(txt, cls) { return el('span', 'badge' + (cls ? ' ' + cls : ''), txt); }
function gb(t) { return badge(t.grade, 'grade-' + t.grade); }
const listEl = $('trophyList'), paneEl = $('guidePane'), searchEl = $('search'), gradeEl = $('grade'), noteEl = $('filterNote');
const params = new URLSearchParams(location.search);
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies, stages7 = doc.stages7, srcs = doc.srcs;
let earned = new Set(JSON.parse(localStorage.getItem(SK) ?? '[]'));
if (params.has('earned')) {
  const ids = params.get('earned').split(',').map((s) => Number(s.trim())).filter(Number.isFinite);
  if (ids.length) earned = new Set(trophies.filter((t) => ids.includes(t.id)).map((t) => t.name));
}
let spoilersOn = localStorage.getItem(SPK) === '1';
if (params.get('spoilers') === 'on') spoilersOn = true;
if (params.get('spoilers') === 'off') spoilersOn = false;
let notes = {}, counts = {};
try { notes = JSON.parse(localStorage.getItem(NK) ?? '{}'); } catch { notes = {}; }
try { counts = JSON.parse(localStorage.getItem(CK) ?? '{}'); } catch { counts = {}; }
let focusId = Number(localStorage.getItem(FK) ?? '0') || null;
if (!trophies.some((t) => t.id === focusId)) focusId = null;
let activeKind = 'all', activeTag = null;
let selectedId = Number(params.get('trophy')) || trophies[0].id;
let currentView = params.get('view') || 'checklist';
if (!['checklist', 'roadmap', 'missables', 'matrix', 'nextup', 'save'].includes(currentView)) currentView = 'checklist';
function kindLabel(k) { return { story: 'Story', collectibles: 'Collectibles', activities: 'Activities', crime: 'Crime', exploration: 'Exploration', meta: 'Meta' }[k] || k; }
function stageName(n) { const s = stages7.find((x) => x.n === n); return s ? s.name : 'Stage ' + n; }
function verificationLabel(v) { return { official: 'Official list', community: 'Community-verified', unconfirmed: 'Unconfirmed — not yet checked in the game' }[v] || v; }
function missText(t) { return 'Missability: ' + { auto: 'Automatic during story. Timing: earned during required story progression.', none: 'No known missable step.', potentially: 'Potentially missable. Timing: do the Chapter 1 step in Chapter 1 to be safe.', unknown: 'Not established. Timing and method: not established.' }[t.miss]; }
function isHidden(t) { return spoilersOn && t.hidden && !earned.has(t.name); }
function srcName(code) { const s = srcs.find((x) => x.c === code); return s ? s.n + ' (' + s.d + ')' : code; }
function saveProgress() {
  localStorage.setItem(SK, JSON.stringify([...earned]));
  localStorage.setItem(SPK, spoilersOn ? '1' : '0');
  localStorage.setItem(NK, JSON.stringify(notes));
  localStorage.setItem(CK, JSON.stringify(counts));
  if (focusId) localStorage.setItem(FK, String(focusId)); else localStorage.removeItem(FK);
}
function gradeCountsText() {
  const total = (g) => trophies.filter((t) => t.grade === g).length;
  const got = (g) => trophies.filter((t) => t.grade === g && earned.has(t.name)).length;
  const cap = (g) => g[0].toUpperCase() + g.slice(1);
  return ['platinum', 'gold', 'silver', 'bronze'].map((g) => `${cap(g)}: ${got(g)} of ${total(g)} earned`).join(' · ');
}
function renderProgress() {
  $('earnedCount').textContent = earned.size;
  $('earnedGamerscore').textContent = trophies.filter((t) => earned.has(t.name)).reduce((s, t) => s + (t.gamerscore || 0), 0);
  $('points').textContent = trophies.filter((t) => earned.has(t.name)).reduce((s, t) => s + (PTS[t.grade] || 0), 0);
  $('progressFill').style.width = `${Math.round((earned.size / trophies.length) * 100)}%`;
  $('gradeCounts').textContent = gradeCountsText();
}
function renderAudit() {
  const steps = trophies.reduce((s, t) => s + (t.steps || []).length, 0);
  const cited = trophies.reduce((s, t) => s + (t.steps || []).filter((x) => x.s).length, 0);
  const guides = trophies.filter((t) => (t.sources || []).length).length;
  const hidden = trophies.filter((t) => t.hidden).length;
  const disp = trophies.filter((t) => t.dispute).length;
  const unk = trophies.filter((t) => t.verification === 'unconfirmed');
  const miss = trophies.filter((t) => t.missable).length, timed = trophies.filter((t) => t.timed).length;
  $('audit').textContent = `✓ ${guides}/55 guides · ${cited}/${steps} steps · ${hidden}/28 hidden · ${srcs.length} sources ${N1920} · ${disp} disputes · ${miss} missable · ${timed} timed · ${unk.length} unknown: ${unk.map((t) => t.name).join(', ') || 'none'}`;
}
function renderNextStrip() {
  const host = $('stageStrip');
  host.replaceChildren();
  host.append(el('span', 'tag-label', 'Next up —'));
  for (const [t, why] of nextItems().slice(0, 4)) {
    const c = el('button', 'chip');
    c.type = 'button';
    c.append(el('b', null, t.name + ' '), document.createTextNode(why.split(' — ')[0]));
    c.addEventListener('click', () => { selectedId = t.id; renderAll(); });
    host.append(c);
  }
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
  for (const s of stages7) {
    const ts = shown.filter((t) => t.s7 === s.n);
    if (!ts.length) continue;
    const got = trophies.filter((t) => t.s7 === s.n && earned.has(t.name)).length, tot = trophies.filter((t) => t.s7 === s.n).length;
    listEl.append(el('h3', 'chapter-head', `${s.name} — ${s.sub} · ${got}/${tot}`));
    for (const t of ts) {
    const row = el('button', 'trophy-row' + (earned.has(t.name) ? ' earned' : '') + (t.id === selectedId ? ' selected' : ''));
    row.type = 'button';
    const box = document.createElement('input');
    box.type = 'checkbox'; box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Earned: ${t.name}`);
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => { if (box.checked) earned.add(t.name); else earned.delete(t.name); saveProgress(); renderAll(); });
    const body = el('span');
    const hidden = isHidden(t);
    const name = el('span', 'trophy-name', hidden ? 'Hidden trophy' : t.name);
    if (hidden) name.append(el('span', 'hidden-tag', ' — hidden until earned'));
    const desc = el('span', 'trophy-desc', hidden ? 'Turn spoilers off, or earn this trophy to reveal it.' : t.description);
    const meta = el('span', 'trophy-meta');
    meta.append(gb(t), badge(kindLabel(t.kind)));
    if (!hidden && t.gamerscore) meta.append(badge(`${t.gamerscore}G`));
    if (t.hidden && !hidden) meta.append(badge('Hidden', 'hidden-badge'));
    if (t.missable) meta.append(badge('Missable', 'missable'));
    if (t.verification === 'unconfirmed') meta.append(badge('Not yet checked', 'unconfirmed'));
    if (t.dispute) meta.append(badge('Disputed', 'unconfirmed'));
    if (notes[t.id]) meta.append(badge('Note', 'note-badge'));
    body.append(name, desc, meta);
    if (!hidden && t.counter) body.append(el('span', 'trophy-desc', `Counter: ${countOf(t).toLocaleString()} / ${t.counter.target.toLocaleString()} ${t.counter.unit}`));
    const dot = el('span', `grade-dot grade-${t.grade}`, { platinum: '◆', gold: '●', silver: '●', bronze: '●' }[t.grade]);
    dot.style.color = { platinum: '#5b7a99', gold: '#b78a1f', silver: '#6b7280', bronze: '#b9784c' }[t.grade];
    row.append(box, body, dot);
    row.addEventListener('click', () => { selectedId = t.id; renderAll(); });
    listEl.append(row);
    }
  }
  if (!shown.length) listEl.append(el('p', null, 'No trophies match these filters.'));
}
function srcLink(code) {
  if (code === 'P') return { text: srcName(code), href: PP };
  if (code === 'O') return { text: srcName(code), href: EXO };
  return { text: srcName(code), href: null };
}
function renderGuidePane() {
  const t = trophies.find((x) => x.id === selectedId) || trophies[0];
  paneEl.replaceChildren();
  if (isHidden(t)) {
    paneEl.append(el('h2', null, 'Hidden trophy'), el('p', 'empty-pane', 'One of the 28 hidden trophies. Its name, description and guide stay hidden while spoilers are on and it is unearned — earn it and tick it here to reveal the guide.'));
    return;
  }
  paneEl.append(el('h2', null, t.name));
  const badges = el('p', 'trophy-meta');
  badges.append(gb(t), badge(`${t.gamerscore}G · ${kindLabel(t.kind)}`));
  if (t.hidden) badges.append(badge('Hidden on PlayStation', 'hidden-badge'));
  if (t.missable) badges.append(badge('Potentially missable', 'missable'));
  paneEl.append(badges);
  paneEl.append(el('p', 'official-desc', `Official description: “${t.description}”`));
  paneEl.append(el('p', 'guide-lead', t.guide.split('. ')[0] + '.'));
  paneEl.append(el('p', t.missable ? 'verification-note' : 'miss-line', missText(t)));
  if (t.counter) {
    const box = el('div', 'counter-box');
    const line = el('div', 'counter-line');
    const minus = el('button', null, '−'); minus.type = 'button'; minus.setAttribute('aria-label', 'Decrease counter');
    const input = document.createElement('input');
    input.type = 'number'; input.min = '0'; input.max = String(t.counter.target); input.step = String(t.counter.step || 1);
    input.value = String(countOf(t)); input.setAttribute('aria-label', `Your progress, out of ${t.counter.target} ${t.counter.unit}`);
    const unit = el('span', null, `/ ${t.counter.target.toLocaleString()} ${t.counter.unit}`);
    const plus = el('button', null, '+'); plus.type = 'button'; plus.setAttribute('aria-label', 'Increase counter');
    const set = (v) => { counts[t.id] = Math.max(0, Math.min(t.counter.target, Math.round(v) || 0)); saveProgress(); renderAll(); };
    minus.addEventListener('click', () => set(countOf(t) - (t.counter.step || 1)));
    plus.addEventListener('click', () => set(countOf(t) + (t.counter.step || 1)));
    input.addEventListener('change', () => set(Number(input.value)));
    line.append(minus, input, unit, plus);
    box.append(line);
    if (t.counter.extra) box.append(el('p', 'counter-src', t.counter.extra));
    box.append(el('p', 'counter-src', `Source: ${t.counter.src} — community-reported.`));
    paneEl.append(box);
  }
  if (t.condition) {
    const box = el('div', 'condition-box');
    box.append(el('h3', null, 'Condition — not a counter'));
    box.append(el('p', null, t.condition));
    box.append(el('p', 'counter-src', `Source: ${t.condition_src} — community-reported. One attempt only, not a lifetime total.`));
    paneEl.append(box);
  }
  if (t.dispute) {
    const d = el('div', 'dispute');
    d.append(el('h3', null, `SOURCES DIFFER — ${t.dispute.q}`));
    d.append(el('p', null, `A: ${t.dispute.a}`));
    d.append(el('p', null, `B: ${t.dispute.b}`));
    d.append(el('p', null, `Guide's call: ${t.dispute.call}`));
    paneEl.append(d);
  }
  paneEl.append(el('h3', null, 'Guide'));
  paneEl.append(el('p', 'guide-text', t.guide));
  paneEl.append(el('h3', null, 'Steps — each with its source'));
  if ((t.steps || []).length) {
    const ol = el('ol', 'steps');
    for (const [i, s] of t.steps.entries()) {
      const li = el('li', null, `${i + 1}. ${s.t} `);
      li.append(el('span', 'step-src', `[${s.s}]`));
      ol.append(li);
    }
    paneEl.append(ol);
  } else {
    paneEl.append(el('p', 'nosteps', 'No steps yet — the method is not yet established. See the dispute below; this guide lists no method until a firsthand report confirms one.'));
  }
  paneEl.append(el('h3', null, 'Sources'));
  const src = el('p', 'sources');
  (t.sc || []).forEach((code, i) => {
    const link = srcLink(code);
    if (i) src.append(document.createTextNode(' · '));
    if (link.href) { const a = el('a', null, link.text); a.href = link.href; a.target = '_blank'; a.rel = 'noopener'; src.append(a); }
    else src.append(document.createTextNode(link.text));
  });
  paneEl.append(src);
  paneEl.append(el('h3', null, 'My note'));
  const noteBox = el('div', 'note-box');
  const ta = document.createElement('textarea');
  ta.value = notes[t.id] || '';
  ta.placeholder = 'Your own note — saved here. Personal, not guide evidence.';
  ta.setAttribute('aria-label', `Personal note for ${t.name}`);
  const saved = el('p', 'note-saved', notes[t.id] ? 'Note saved.' : '');
  ta.addEventListener('input', () => {
    if (ta.value.trim()) notes[t.id] = ta.value; else delete notes[t.id];
    saveProgress();
    saved.textContent = ta.value.trim() ? 'Note saved.' : '';
    renderProgress();
  });
  noteBox.append(ta, saved);
  paneEl.append(noteBox);
  const focusBtn = el('button', 'focus-btn', focusId === t.id ? '★ Your next-up focus — tap to clear' : 'Set as next up');
  focusBtn.type = 'button';
  focusBtn.addEventListener('click', () => { focusId = focusId === t.id ? null : t.id; saveProgress(); renderAll(); });
  paneEl.append(focusBtn);
  paneEl.append(el('p', 'verification-note' + (t.verification === 'unconfirmed' ? ' unconfirmed' : ''), `Status: ${verificationLabel(t.verification)}.`));
  paneEl.append(el('p', 'sources', `Roadmap: ${stageName(t.s7)}.`));
}
function renderRoadmap() {
  const host = $('roadmapStages');
  host.replaceChildren();
  for (const s of stages7) {
    const ts = trophies.filter((t) => t.s7 === s.n);
    const got = ts.filter((t) => earned.has(t.name)).length;
    const card = el('div', 'stage-card');
    card.append(el('h3', null, `${s.name} — ${got}/${ts.length} earned`));
    card.append(el('p', null, s.text));
    card.append(el('p', 'stage-trophies', ts.map((t) => (earned.has(t.name) ? '✓ ' : '') + (isHidden(t) ? 'Hidden trophy' : t.name)).join(' · ')));
    host.append(card);
  }
}
function missableCard(t, title) {
  const card = el('div', 'stage-card missable-card');
  card.append(el('h3', null, title));
  card.append(el('p', 'official-desc', `Official description: “${t.description}”`));
  card.append(el('p', 'miss-line', missText(t)));
  card.append(el('p', null, t.guide));
  card.append(el('p', 'sources', `Sources: official trophy list (Exophase / PSNProfiles); PowerPyx — GTA 6 Trophy Guide & Roadmap (${N1920}); GTABase.`));
  return card;
}
function renderMissables() {
  const host = $('missablesList');
  host.replaceChildren();
  const pma = trophies.find((t) => t.miss === 'potentially');
  if (pma) host.append(missableCard(pma, `⚠ ${pma.name} — the only potentially missable trophy`));
  const unknown = trophies.filter((t) => t.miss === 'unknown');
  if (unknown.length) {
    host.append(el('h3', null, 'Not established — method unknown, missability unknown'));
    for (const t of unknown) host.append(missableCard(t, t.name));
  }
  const ok = el('div', 'stage-card');
  const n = trophies.length - (pma ? 1 : 0) - unknown.length;
  ok.append(el('h3', null, `The other ${n} trophies: no known missable step`));
  ok.append(el('p', null, `${n} trophies have no known missable step: 12 are story milestones, earned during required story progression; the rest have no reported missable condition. This guide does not claim every one can be earned in free roam after the story.`));
  host.append(ok);
}
function renderMatrix() {
  const host = $('matrixHost');
  host.replaceChildren();
  const table = el('table', 'matrix');
  const head = el('tr');
  for (const h of ['#', 'Trophy', 'Stage', 'Sources']) head.append(el('th', null, h));
  table.append(head);
  for (const t of trophies) {
    const row = el('tr');
    row.append(el('td', null, String(t.id)));
    row.append(el('td', null, isHidden(t) ? 'Hidden trophy' : t.name));
    row.append(el('td', null, stageName(t.s7)));
    row.append(el('td', 'codes', (t.sc || []).join(' · ')));
    table.append(row);
  }
  host.append(table);
  const leg = $('srcLegend');
  leg.replaceChildren();
  const ol = el('ol');
  for (const s of srcs) ol.append(el('li', null, `[${s.c}] ${s.n} — ${s.d}`));
  leg.append(ol);
}
function nextItems() {
  const un = (t) => t && !earned.has(t.name);
  const items = [];
  const push = (t, why) => { if (un(t) && !items.some(([x]) => x === t)) items.push([t, why]); };
  push(trophies.find((t) => t.id === focusId), 'Your focus — set from its guide pane.');
  push(trophies.find((t) => t.miss === 'potentially'), 'Chapter 1 only — the only potentially missable trophy.');
  push(trophies.find((t) => t.timed), 'Timed invitation — accept when it appears; save first.');
  for (const s of stages7) push(trophies.find((t) => t.s7 === s.n && un(t)), `${s.name} — next in this stage.`);
  return items.slice(0, 8);
}
function renderNextUp() {
  const host = $('nextHost');
  host.replaceChildren();
  const items = nextItems();
  for (const [t, why] of items) {
    const card = el('div', 'next-card' + (t.id === focusId ? ' focus' : ''));
    card.append(el('h3', null, (t.id === focusId ? '★ ' : '') + t.name));
    const meta = el('p', 'trophy-meta');
    meta.append(gb(t), badge(stageName(t.s7)));
    if (t.missable) meta.append(badge('Missable', 'missable'));
    card.append(meta);
    card.append(el('p', 'next-why', why));
    card.append(el('p', null, (t.steps && t.steps[0]) ? `First step [${t.steps[0].s}]: ${t.steps[0].t}` : t.guide));
    const open = el('button', 'focus-btn', 'Open guide');
    open.type = 'button';
    open.addEventListener('click', () => { selectedId = t.id; setView('checklist'); renderAll(); });
    card.append(open);
    host.append(card);
  }
  if (!items.length) host.append(el('p', null, 'Everything is earned — the Platinum should have popped.'));
}
function exportProgress() {
  const data = { version: 3, earned: [...earned], notes, counts, focus: focusId, spoilers: spoilersOn };
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
      if (data.notes && typeof data.notes === 'object') for (const [k, v] of Object.entries(data.notes)) { const id = Number(k); if (byId.has(id) && typeof v === 'string' && v.trim()) notes[id] = v; }
      counts = {};
      if (data.counts && typeof data.counts === 'object') for (const [k, v] of Object.entries(data.counts)) { const id = Number(k); const t = byId.get(id); if (t && t.counter && Number.isFinite(Number(v))) counts[id] = Math.max(0, Math.min(t.counter.target, Math.round(Number(v)))); }
      focusId = byId.has(Number(data.focus)) ? Number(data.focus) : null;
      if (typeof data.spoilers === 'boolean') spoilersOn = data.spoilers;
    }
    saveProgress(); syncSpoilerBoxes(); renderAll();
    noteEl.textContent = `Imported ${earned.size} earned, ${Object.keys(notes).length} notes, ${Object.keys(counts).length} counters${focusId ? `, focus: ${byId.get(focusId).name}` : ''}.`;
  } catch {
    noteEl.textContent = 'That file could not be imported — it must be a JSON export from this guide.';
  }
}
function setView(view) {
  currentView = view;
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('hidden', v.id !== `view-${view}`));
  document.querySelector('.controls').style.display = view === 'checklist' ? '' : 'none';
  noteEl.style.display = view === 'checklist' ? '' : 'none';
  if (view === 'roadmap') renderRoadmap();
  if (view === 'missables') renderMissables();
  if (view === 'matrix') renderMatrix();
  if (view === 'nextup') renderNextUp();
}
function renderAll() {
  renderProgress(); renderAudit(); renderNextStrip(); renderChecklist(); renderGuidePane();
  if (currentView === 'roadmap') renderRoadmap();
  if (currentView === 'missables') renderMissables();
  if (currentView === 'matrix') renderMatrix();
  if (currentView === 'nextup') renderNextUp();
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
$('exportBtn').addEventListener('click', exportProgress);
$('exportBtn2').addEventListener('click', exportProgress);
$('importFile').addEventListener('change', (e) => importProgressFile(e.target.files[0]));
$('importFile2').addEventListener('change', (e) => importProgressFile(e.target.files[0]));
$('resetBtn').addEventListener('click', () => {
  if (confirm('Reset all progress? This clears every earned tick, note, counter and focus.')) {
    earned = new Set(); notes = {}; counts = {}; focusId = null; saveProgress(); renderAll();
  }
});
function syncSpoilerBoxes() { $('spoilers').checked = spoilersOn; $('spoilers2').checked = spoilersOn; }
$('spoilers').addEventListener('change', (e) => { spoilersOn = e.target.checked; saveProgress(); syncSpoilerBoxes(); renderAll(); });
$('spoilers2').addEventListener('change', (e) => { spoilersOn = e.target.checked; saveProgress(); syncSpoilerBoxes(); renderAll(); });
syncSpoilerBoxes();
setView(currentView);
renderAll();
