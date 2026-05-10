const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');

// ── helpers ──────────────────────────────────────────────────────────────────
function slug(str) {
  return str.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

function clean(v) {
  return String(v).replace(/\r\n|\r|\n/g, ' ').replace(/\s+/g, ' ').trim();
}

function getDept(text) {
  const map = ['TCOM','FARCH','FACC','FENG','FAD','FCS','FIT','FBA','HRM','MRK','BA','Common','IT','ARCH','KM','DIT','DEC','DWD'];
  for (const d of map) if (text.startsWith(d)) return d;
  return '';
}

function getInstructor(text) {
  const m = text.match(/(?:Dr\.|Ust\.|Mrs\.|Mr\.)[\w\s.]+/);
  return m ? m[0].trim() : '';
}

const DEPT_COLORS = {
  FIT:   ['rgba(79,142,247,0.2)',  '#4f8ef7'],
  FCS:   ['rgba(162,79,247,0.2)', '#a24ff7'],
  TCOM:  ['rgba(79,247,162,0.2)', '#4ff7a2'],
  FAD:   ['rgba(247,162,79,0.2)', '#f7a24f'],
  BA:    ['rgba(247,79,79,0.2)',   '#f74f4f'],
  HRM:   ['rgba(247,247,79,0.2)', '#d4d44f'],
  FENG:  ['rgba(79,247,247,0.2)', '#4ff7f7'],
  FARCH: ['rgba(200,79,247,0.2)', '#c84ff7'],
  FACC:  ['rgba(247,120,79,0.2)', '#f7784f'],
  FBA:   ['rgba(247,79,162,0.2)', '#f74fa2'],
  MRK:   ['rgba(247,79,162,0.2)', '#f74fa2'],
  KM:    ['rgba(79,200,247,0.2)', '#4fc8f7'],
  DIT:   ['rgba(150,247,79,0.2)', '#96f74f'],
  DEC:   ['rgba(247,200,79,0.2)', '#f7c84f'],
  DWD:   ['rgba(79,247,200,0.2)', '#4ff7c8'],
  Common:['rgba(150,150,150,0.2)','#aaa'],
  IT:    ['rgba(79,142,247,0.2)', '#4f8ef7'],
  ARCH:  ['rgba(200,79,247,0.2)', '#c84ff7'],
};

// ── parse one sheet ──────────────────────────────────────────────────────────
function parseSheet(ws) {
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const nonEmpty = raw.filter(r => r.some(c => c !== ''));

  // meta: rows before header
  const hIdx = nonEmpty.findIndex(r => /day/i.test(String(r[0])));
  if (hIdx === -1) return null;

  const meta = nonEmpty.slice(0, hIdx).map(r => r.filter(c => c !== '').join(' ')).filter(Boolean);
  const header = nonEmpty[hIdx];
  const slots = header.slice(1).map(clean).filter(Boolean);

  const DAYS = ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday'];
  const result = {};
  let cur = null;

  for (let i = hIdx + 1; i < nonEmpty.length; i++) {
    const row = nonEmpty[i];
    const first = clean(String(row[0]));
    if (DAYS.includes(first)) {
      cur = first;
      if (!result[cur]) result[cur] = Array(slots.length).fill('');
    }
    if (!cur) continue;
    for (let si = 0; si < slots.length; si++) {
      const val = clean(String(row[si + 1] || ''));
      if (val) result[cur][si] = result[cur][si] ? result[cur][si] + ' ' + val : val;
    }
  }

  return { meta, slots, days: result };
}

// ── build HTML ───────────────────────────────────────────────────────────────
function buildHTML(title, subtitle, parsed) {
  const { meta, slots, days } = parsed;
  const DAYS_ORDER = ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday'];

  const deptCSS = Object.entries(DEPT_COLORS).map(([d,[bg,col]]) =>
    `.dept-${d.replace(/[^a-zA-Z]/g,'')} { background:${bg}; color:${col}; }`
  ).join('\n  ');

  const tabsHTML = ['All Days', ...DAYS_ORDER].map((d, i) => {
    const val = i === 0 ? 'all' : d;
    const active = i === 0 ? ' active' : '';
    return `<button class="day-tab${active}" onclick="filterDay(this,'${val}')">${d}</button>`;
  }).join('\n  ');

  // build RAW JS object
  const rawEntries = DAYS_ORDER.map(d => {
    if (!days[d]) return null;
    const cells = days[d].map(c => JSON.stringify(c)).join(',');
    return `  ${d}: [${cells}]`;
  }).filter(Boolean).join(',\n');

  const slotsJS = JSON.stringify(slots);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --bg:#0d0f14; --surface:#14181f; --surface2:#1c2230; --border:#252d3d;
    --accent:#4f8ef7; --accent2:#f7a24f; --accent3:#4ff7a2;
    --text:#e2e8f8; --muted:#7a8aaa;
  }
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:var(--bg);color:var(--text);font-family:'DM Mono',monospace;min-height:100vh;overflow-x:hidden;}

  header{background:var(--surface);border-bottom:1px solid var(--border);padding:20px 32px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;position:sticky;top:0;z-index:100;}
  .header-left h1{font-family:'Syne',sans-serif;font-weight:800;font-size:1.5rem;letter-spacing:-0.5px;background:linear-gradient(90deg,var(--accent),var(--accent3));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
  .header-left p{font-size:0.7rem;color:var(--muted);margin-top:2px;letter-spacing:2px;text-transform:uppercase;}

  .controls{display:flex;gap:12px;align-items:center;flex-wrap:wrap;}
  .search-wrap{position:relative;}
  .search-wrap svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--muted);}
  #searchInput{background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:'DM Mono',monospace;font-size:0.8rem;padding:8px 12px 8px 34px;width:220px;outline:none;transition:border-color 0.2s;}
  #searchInput:focus{border-color:var(--accent);}
  #searchInput::placeholder{color:var(--muted);}
  select{background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:'DM Mono',monospace;font-size:0.8rem;padding:8px 12px;outline:none;cursor:pointer;transition:border-color 0.2s;}
  select:focus{border-color:var(--accent);}
  .btn{background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:'DM Mono',monospace;font-size:0.75rem;padding:8px 16px;cursor:pointer;transition:all 0.15s;letter-spacing:0.5px;text-decoration:none;display:inline-block;}
  .btn:hover{border-color:var(--accent);color:var(--accent);}

  .day-tabs{display:flex;gap:6px;padding:16px 32px;background:var(--surface);border-bottom:1px solid var(--border);overflow-x:auto;}
  .day-tab{background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--muted);font-family:'Syne',sans-serif;font-size:0.8rem;font-weight:600;padding:8px 20px;cursor:pointer;transition:all 0.15s;white-space:nowrap;letter-spacing:0.5px;}
  .day-tab:hover{border-color:var(--accent);color:var(--accent);}
  .day-tab.active{background:var(--accent);border-color:var(--accent);color:#fff;}

  .stats-bar{display:flex;gap:20px;padding:10px 32px;background:var(--surface);border-bottom:1px solid var(--border);flex-wrap:wrap;align-items:center;}
  .stat{display:flex;align-items:center;gap:6px;font-size:0.72rem;color:var(--muted);}
  .stat strong{color:var(--text);font-weight:600;}

  main{padding:24px 32px;}
  .grid-container{overflow-x:auto;}

  .timetable-grid{min-width:700px;border-collapse:collapse;width:100%;}
  .timetable-grid thead tr:first-child th{font-family:'Syne',sans-serif;font-weight:700;font-size:0.72rem;letter-spacing:1px;text-transform:uppercase;color:var(--muted);padding:10px 14px;text-align:center;border-bottom:1px solid var(--border);white-space:nowrap;}
  .th-day{text-align:left !important;min-width:100px;}
  .slot-header{background:var(--surface2);border-left:2px solid var(--accent) !important;}
  .timetable-grid td{vertical-align:top;padding:0;border:1px solid var(--border);}
  .day-label{font-family:'Syne',sans-serif;font-weight:700;font-size:0.85rem;color:var(--text);padding:12px 14px;border-right:1px solid var(--border);background:var(--surface);white-space:nowrap;vertical-align:middle !important;}
  .room-cell{padding:8px 10px;min-width:160px;min-height:70px;transition:background 0.15s;font-size:0.68rem;line-height:1.5;color:var(--text);border-left:2px solid var(--accent) !important;background:rgba(79,142,247,0.04);}
  .room-cell:hover{background:rgba(79,142,247,0.1);}

  .cell-dept{display:inline-block;font-family:'Syne',sans-serif;font-weight:700;font-size:0.6rem;letter-spacing:1px;text-transform:uppercase;border-radius:3px;padding:1px 6px;margin-bottom:4px;}
  ${deptCSS}
  .cell-instructor{font-size:0.6rem;color:var(--accent);margin-top:2px;}
  .empty-cell{color:var(--muted);font-size:0.68rem;text-align:center;padding-top:20px;}
  .highlight{background:rgba(79,142,247,0.25) !important;outline:1px solid var(--accent);}

  @media(max-width:600px){header,.day-tabs,main,.stats-bar{padding-left:16px;padding-right:16px;}#searchInput{width:160px;}}
</style>
</head>
<body>

<header>
  <div class="header-left">
    <h1>${title}</h1>
    <p>${subtitle}</p>
  </div>
  <div class="controls">
    <div class="search-wrap">
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input type="text" id="searchInput" placeholder="Search course, instructor…">
    </div>
    <select id="deptFilter">
      <option value="">All Programs</option>
      <option value="FIT">FIT</option><option value="FCS">FCS</option>
      <option value="KM">KM</option><option value="IT">IT</option>
      <option value="DIT">DIT</option><option value="DEC">DEC</option>
      <option value="DWD">DWD</option><option value="TCOM">TCOM</option>
      <option value="FAD">FAD</option><option value="BA">BA</option>
      <option value="HRM">HRM</option><option value="FENG">FENG</option>
      <option value="FARCH">FARCH</option><option value="FACC">FACC</option>
      <option value="FBA">FBA</option><option value="MRK">MRK</option>
      <option value="Common">Common</option>
    </select>
    <a href="index.html" class="btn">← Back</a>
  </div>
</header>

<div class="day-tabs">
  ${tabsHTML}
</div>

<div class="stats-bar">
  <div class="stat">Sessions shown: <strong id="statCount">—</strong></div>
</div>

<main>
  <div class="grid-container">
    <table class="timetable-grid" id="mainGrid"></table>
  </div>
</main>

<script>
const SLOTS = ${slotsJS};
const RAW = {
${rawEntries}
};
const DAYS_ORDER = ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday'];
let currentDay = 'all', searchTerm = '', deptFilter = '';

function getDept(t) {
  if (!t) return '';
  const map = ['TCOM','FARCH','FACC','FENG','FAD','FCS','FIT','FBA','HRM','MRK','BA','Common','KM','DIT','DEC','DWD','IT','ARCH'];
  for (const d of map) if (t.startsWith(d)) return d;
  return '';
}
function getInstructor(t) {
  const m = t.match(/(?:Dr\\.|Ust\\.|Mrs\\.|Mr\\.)[ \\w.]+/);
  return m ? m[0].trim() : '';
}
function matches(text) {
  if (!text) return false;
  const ms = !searchTerm || text.toLowerCase().includes(searchTerm.toLowerCase());
  const md = !deptFilter  || text.startsWith(deptFilter);
  return ms && md;
}
function cellHTML(text) {
  if (!text || !text.trim()) return '<div class="empty-cell">—</div>';
  const dept = getDept(text.trim());
  const instr = getInstructor(text);
  const dc = dept ? 'dept-' + dept.replace(/[^a-zA-Z]/g,'') : '';
  return '<div>' +
    (dept ? '<span class="cell-dept ' + dc + '">' + dept + '</span><br>' : '') +
    '<span>' + text + '</span>' +
    (instr ? '<div class="cell-instructor">' + instr + '</div>' : '') +
    '</div>';
}
function render() {
  const days = currentDay === 'all' ? DAYS_ORDER.filter(d => RAW[d]) : [currentDay];
  const filtering = searchTerm || deptFilter;
  let count = 0;
  let html = '<thead><tr><th class="th-day">Day</th>';
  for (const s of SLOTS) html += '<th class="slot-header">' + s + '</th>';
  html += '</tr></thead><tbody>';
  for (const day of days) {
    if (!RAW[day]) continue;
    html += '<tr><td class="day-label">' + day + '</td>';
    for (let si = 0; si < SLOTS.length; si++) {
      const text = RAW[day][si] || '';
      const m = matches(text);
      const hl = filtering && m ? ' highlight' : '';
      const op = filtering && !m ? ' style="opacity:.2"' : '';
      if (text && (m || !filtering)) count++;
      html += '<td class="room-cell' + hl + '"' + op + '>' + cellHTML(text) + '</td>';
    }
    html += '</tr>';
  }
  html += '</tbody>';
  document.getElementById('mainGrid').innerHTML = html;
  document.getElementById('statCount').textContent = count;
}
function filterDay(btn, day) {
  currentDay = day;
  document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  render();
}
document.getElementById('searchInput').addEventListener('input', e => { searchTerm = e.target.value.trim(); render(); });
document.getElementById('deptFilter').addEventListener('change', e => { deptFilter = e.target.value; render(); });
render();
</script>
</body>
</html>`;
}

// ── main ─────────────────────────────────────────────────────────────────────
const files = fs.readdirSync('.').filter(f => f.endsWith('.xlsx'));
const pages = []; // { label, file }

files.forEach(f => {
  const wb = XLSX.readFile(f);
  wb.SheetNames.forEach(sn => {
    const ws = wb.Sheets[sn];
    const parsed = parseSheet(ws);
    if (!parsed) return;

    const baseName = path.basename(f, '.xlsx');
    const pageSlug = slug(sn === wb.SheetNames[0] ? baseName : baseName + '-' + sn);
    const htmlFile = pageSlug + '.html';

    // title from meta or filename
    const title = parsed.meta.find(m => /batch|semester/i.test(m)) || baseName;
    const subtitle = [
      parsed.meta.find(m => /faculty/i.test(m)),
      parsed.meta.find(m => /cairo|online|khartoum/i.test(m)),
      sn
    ].filter(Boolean).join(' · ');

    const html = buildHTML(title, subtitle, parsed);
    fs.writeFileSync(htmlFile, html, 'utf8');
    pages.push({ label: baseName + (wb.SheetNames.length > 1 ? ' — ' + sn : ''), file: htmlFile });
    console.log('Created:', htmlFile);
  });
});

// write pages manifest for index
fs.writeFileSync('pages-manifest.json', JSON.stringify(pages, null, 2));
console.log('\nDone. pages-manifest.json written.');
