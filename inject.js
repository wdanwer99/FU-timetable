const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace the old timetable.html link with a scroll button
html = html.replace(
  /<a href="timetable\.html"[^>]*>.*?<\/a>/,
  `<button class="btn" onclick="document.getElementById('batchNav').scrollIntoView({behavior:'smooth'})">&#9783; Batch Timetables</button>`
);

// 2. Remove any previously injected batchNav section + its <style> block to avoid duplicates
html = html.replace(/<style>\s*\.nav-card[\s\S]*?<\/style>\s*<section id="batchNav"[\s\S]*?<\/section>/g, '');

// 3. Remove stray Batch Timetables button injected by previous inject.js run
html = html.replace(/<button class="btn" onclick="document\.getElementById\('batchNav'\)[^"]*">&#9783; Batch Timetables<\/button>\s*/g, '');

// 4. Re-add the scroll button cleanly after btnList (only once)
html = html.replace(
  /(<button[^>]+id="btnList"[^>]*>[\s\S]*?<\/button>)(\s*<\/div>\s*<\/header>)/,
  `$1\n    <button class="btn" onclick="document.getElementById('batchNav').scrollIntoView({behavior:'smooth'})">&#9783; Batch Timetables</button>$2`
);

// 5. Build the nav section
const navSection = `
<style>
  .nav-card{background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:'DM Mono',monospace;font-size:0.75rem;padding:8px 16px;text-decoration:none;transition:all 0.15s;letter-spacing:0.3px;display:inline-block;}
  .nav-card:hover{border-color:var(--accent);color:var(--accent);}
  .nav-group{margin-bottom:24px;}
  .nav-group-title{font-family:'Syne',sans-serif;font-size:0.7rem;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:10px;}
  .nav-cards{display:flex;flex-wrap:wrap;gap:8px;}
</style>

<section id="batchNav" style="background:var(--surface);border-top:1px solid var(--border);padding:32px;">
  <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.1rem;color:var(--text);margin-bottom:20px;display:flex;align-items:center;gap:10px;">
    <span style="width:3px;height:20px;background:var(--accent);border-radius:2px;display:inline-block;"></span>
    Batch Timetables
  </div>

  <div class="nav-group">
    <div class="nav-group-title">Batch 2021</div>
    <div class="nav-cards">
      <a href="batch-2021-semester-10-cairo-online.html" class="nav-card">Sem 10 &middot; Cairo &amp; Online</a>
      <a href="batch-2021-it-km-khartoum-centre.html" class="nav-card">IT &amp; KM &middot; Khartoum &middot; KM</a>
      <a href="batch-2021-it-km-khartoum-centre-it.html" class="nav-card">IT &amp; KM &middot; Khartoum &middot; IT</a>
    </div>
  </div>

  <div class="nav-group">
    <div class="nav-group-title">Batch 2022</div>
    <div class="nav-cards">
      <a href="batch-2022-it-km-khartoum-centre.html" class="nav-card">IT &amp; KM &middot; Khartoum &middot; Sem 8</a>
      <a href="batch-2022-semester-8-cairo-online.html" class="nav-card">Sem 8 &middot; Cairo &amp; Online</a>
    </div>
  </div>

  <div class="nav-group">
    <div class="nav-group-title">Batch 2023</div>
    <div class="nav-cards">
      <a href="batch-2023-all-programs-khartoum-centre.html" class="nav-card">All Programs &middot; Khartoum</a>
      <a href="batch-2023-semester-2-all-programs-cairo.html" class="nav-card">Sem 2 &middot; Cairo</a>
      <a href="batch-2023-semester-2-all-programs-online.html" class="nav-card">Sem 2 &middot; Online</a>
    </div>
  </div>

  <div class="nav-group">
    <div class="nav-group-title">Batch 2024</div>
    <div class="nav-cards">
      <a href="batch-2024-all-programs-khartoum-centre.html" class="nav-card">All Programs &middot; Khartoum</a>
      <a href="batch-2024-semester-2-all-programs-online.html" class="nav-card">Sem 2 &middot; Online</a>
      <a href="batch-2024-semester-2-all-programs-cairo.html" class="nav-card">Sem 2 &middot; Cairo</a>
    </div>
  </div>

  <div class="nav-group">
    <div class="nav-group-title">Batch E2022A &middot; Sem 6 &middot; Cairo &amp; Online</div>
    <div class="nav-cards">
      <a href="batch-e2022a-semester-6-cairo-online.html" class="nav-card">IT</a>
      <a href="batch-e2022a-semester-6-cairo-online-km.html" class="nav-card">KM</a>
      <a href="batch-e2022a-semester-6-cairo-online-dit.html" class="nav-card">DIT</a>
      <a href="batch-e2022a-semester-6-cairo-online-dit-b-a.html" class="nav-card">DIT B/A</a>
      <a href="batch-e2022a-semester-6-cairo-online-dec.html" class="nav-card">DEC</a>
      <a href="batch-e2022a-semester-6-cairo-online-dwd.html" class="nav-card">DWD</a>
    </div>
  </div>

  <div class="nav-group">
    <div class="nav-group-title">Batch E2022B &middot; Sem 4 &middot; Cairo &amp; Online</div>
    <div class="nav-cards">
      <a href="batch-e2022b-semester-4-cairo-online.html" class="nav-card">IT &middot; Cairo</a>
      <a href="batch-e2022b-semester-4-cairo-online-it-online.html" class="nav-card">IT &middot; Online</a>
      <a href="batch-e2022b-semester-4-cairo-online-km-cairo-online.html" class="nav-card">KM</a>
      <a href="batch-e2022b-semester-4-cairo-online-dit-cairo.html" class="nav-card">DIT &middot; Cairo</a>
      <a href="batch-e2022b-semester-4-cairo-online-dit-online.html" class="nav-card">DIT &middot; Online</a>
      <a href="batch-e2022b-semester-4-cairo-online-dit-b-a-cairo-online.html" class="nav-card">DIT B/A</a>
      <a href="batch-e2022b-semester-4-cairo-online-dec-cairo-online.html" class="nav-card">DEC</a>
      <a href="batch-e2022b-semester-4-cairo-online-cairo-online-dwd.html" class="nav-card">DWD</a>
    </div>
  </div>

  <div class="nav-group">
    <div class="nav-group-title">Centre Timetable</div>
    <div class="nav-cards">
      <a href="timetable.html" class="nav-card">Centre Timetable &middot; Excel View</a>
    </div>
  </div>
</section>
`;

// 6. Inject before </body>
html = html.replace('</body>', navSection + '\n</body>');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Done. Verifying...');

const out = fs.readFileSync('index.html', 'utf8');
console.log('batchNav section:', out.includes('id="batchNav"'));
console.log('Batch Timetables button:', out.includes('Batch Timetables'));
console.log('batch-2021 link:', out.includes('batch-2021-semester-10'));
console.log('batch-e2022b link:', out.includes('batch-e2022b-semester-4-cairo-online-cairo-online-dwd'));
