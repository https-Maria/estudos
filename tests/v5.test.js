const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app-v5.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles-v5.css'), 'utf8');
const sql = fs.readFileSync(path.join(root, 'supabase_v5_migration.sql'), 'utf8');

new Function(app);

const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
assert.equal(ids.length, new Set(ids).size, 'HTML contains duplicate ids');

const dynamic = new Set(['roomStartBtn', 'bossExportBtn']);
const refs = [...app.matchAll(/\$\((['"])(#[A-Za-z0-9_-]+)\1\)/g)].map(m => m[2].slice(1));
const missing = [...new Set(refs.filter(id => !ids.includes(id) && !dynamic.has(id)))];
assert.deepEqual(missing, [], 'app-v5 references missing HTML ids');

for (const asset of ['styles-v5.css','config.js','analytics.js','curriculum.js','app-v5.js']) {
  assert.ok(html.includes('./' + asset), 'missing asset ' + asset);
}

global.window = {};
require('../curriculum.js');
const C = window.StudyCurriculum;
assert.equal(C.tracks.length, 3);
for (const track of C.tracks) {
  assert.equal(track.modules.length, 12, track.id + ' should have 12 modules');
  for (const mod of track.modules) {
    for (const field of ['title','mission','evidence','breakfix','portfolio']) {
      assert.ok(mod[field], mod.id + ' missing ' + field);
    }
    assert.ok(mod.topics.length > 0, mod.id + ' missing topics');
  }
}

for (const token of ['module_progress','assessments','enable row level security','auth.uid()']) {
  assert.ok(sql.toLowerCase().includes(token.toLowerCase()), 'migration missing ' + token);
}

for (const token of ['--copper','--amber','--emerald']) {
  assert.ok(css.includes(token), 'theme missing ' + token);
}

console.log('v5.test.js: all assertions passed');


for (const id of ['topBackfillBtn','dbIssueBanner','openBackfillBtn','backfillForm','pastLabComplete','pastEvidenceComplete']) {
  assert.ok(ids.includes(id), 'V5.2 missing UI element ' + id);
}
for (const token of ['displayMission()','emailRedirectTo','addAnother=e.submitter','permission denied','⏱ CONTINUAR']) {
  assert.ok(app.includes(token), 'V5.2 missing behavior ' + token);
}


for (const asset of ['warroom/engine.js','warroom/scoring.js','warroom/incidents.js']) {
  assert.ok(html.includes('./' + asset), 'War Room foundation missing asset ' + asset);
}
for (const id of ['warroomView','warroomCount']) {
  assert.ok(ids.includes(id), 'War Room foundation missing UI element ' + id);
}
assert.ok(app.includes("renderWarRoom()"), 'War Room foundation is not wired into renderAll');
assert.ok(app.includes("warroom:'WAR ROOM'"), 'War Room breadcrumb is missing');
