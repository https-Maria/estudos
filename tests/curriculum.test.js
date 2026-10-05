const assert = require('node:assert/strict');
global.window={};
require('../curriculum.js');
const C=window.StudyCurriculum;

assert.ok(C);
assert.equal(C.tracks.length,3);
assert.deepEqual(C.tracks.map(t=>t.id),['dba','aws','english']);

for(const track of C.tracks){
  assert.equal(track.modules.length,12, track.id+' must have 12 modules');
  assert.ok(track.description);
  assert.ok(track.sources.length>=2);
  for(const module of track.modules){
    assert.ok(module.title);
    assert.ok(module.topics.length>=3);
    assert.ok(module.mission);
    assert.ok(module.evidence);
    assert.ok(module.skills.length>=1);
  }
}

const comps=[
  {area:'DBA / DP-300',name:'Fundamentos SQL Server',level:5},
  {area:'DBA / DP-300',name:'Transações',level:2}
];
const dba=C.getTrack('dba');
assert.equal(C.moduleProgress(dba.modules[0],dba,comps),100);
assert.equal(C.moduleProgress(dba.modules[1],dba,comps),40);
assert.equal(C.currentModuleIndex(dba,comps),1);
assert.ok(C.trackProgress(dba,comps)>0);

console.log('curriculum.test.js: all assertions passed');
