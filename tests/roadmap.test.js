const assert = require('node:assert/strict');

global.window = {};
require('../roadmap.js');
const R = window.StudyRoadmap;

assert.ok(R);
assert.equal(R.weeks.length, 12);
assert.equal(R.weeks[0].week, 1);
assert.equal(R.weeks[11].week, 12);
assert.equal(new Set(R.weeks.map(w => w.phase)).size, 3);

const competencies = [
  {area:'DBA / DP-300',name:'Fundamentos SQL Server',level:5},
  {area:'AWS / Data Lake',name:'S3',level:5},
  {area:'Inglês',name:'There is / There are',level:5},
  {area:'DBA / DP-300',name:'Índices',level:2},
  {area:'AWS / Data Lake',name:'Parquet',level:1},
  {area:'Inglês',name:'Simple Present',level:1}
];

assert.equal(R.weekProgress(R.weeks[0],competencies),100);
assert.equal(R.weekProgress(R.weeks[1],competencies),27);

const state = R.state(competencies);
assert.equal(state.currentWeek.week,2);
assert.equal(state.currentIndex,1);
assert.equal(state.complete,false);
assert.ok(state.overall >= 0 && state.overall <= 100);

for (const week of R.weeks) {
  assert.ok(week.title);
  assert.ok(week.why);
  assert.ok(week.evidence);
  assert.deepEqual(
    Object.keys(week.tracks),
    ['DBA / DP-300','AWS / Data Lake','Inglês']
  );
  for (const track of Object.values(week.tracks)) {
    assert.ok(track.task);
    assert.ok(Array.isArray(track.skills) && track.skills.length > 0);
  }
}

console.log('roadmap.test.js: all assertions passed');
