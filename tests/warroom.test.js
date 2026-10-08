const assert = require('node:assert/strict');

global.window = {};
const Engine = require('../warroom/engine.js');
const Scoring = require('../warroom/scoring.js');
const Incidents = require('../warroom/incidents.js');

const incident = {
  id:'TEST-001',
  title:'Incidente de teste',
  trackId:'dba',
  moduleId:'dba-04',
  initialState:'triage',
  slaMinutes:30,
  actions:[
    {id:'inspect',once:true,timeCost:4,requires:{states:['triage']},unlocksEvidence:['blocking'],nextState:'diagnosis'},
    {id:'communicate',communication:true,timeCost:2,requires:{states:['diagnosis']},setFlags:{stakeholder_informed:true}},
    {id:'resolve',timeCost:5,requires:{states:['diagnosis'],evidence:['blocking'],flags:{stakeholder_informed:true}},nextState:'resolved'}
  ],
  evaluate(run,action){
    if(action.id==='resolve')return {resolved:true,result:{rootCause:'test'}};
    return null;
  }
};

const run0=Engine.createRun(incident,{runId:'run-test',startedAt:'2026-10-08T12:00:00Z'});
assert.equal(run0.state,'triage');
assert.deepEqual(Engine.availableActions(incident,run0).map(x=>x.id),['inspect']);

const step1=Engine.applyAction(incident,run0,'inspect');
assert.equal(step1.run.state,'diagnosis');
assert.equal(step1.run.elapsedMinutes,4);
assert.deepEqual(step1.run.evidenceUnlocked,['blocking']);
assert.throws(()=>Engine.applyAction(incident,step1.run,'resolve'),/unavailable/);

const step2=Engine.applyAction(incident,step1.run,'communicate');
assert.equal(step2.run.flags.stakeholder_informed,true);
assert.equal(step2.run.communicationChoices.length,1);

const step3=Engine.applyAction(incident,step2.run,'resolve');
assert.equal(step3.run.resolved,true);
assert.equal(step3.run.elapsedMinutes,11);
assert.equal(step3.event.sequence,3);

const score=Scoring.weightedScore({technical:90,communication:80,architecture:70,business:60});
assert.equal(score.score,78);
assert.equal(Scoring.slaPenalty(41,30),6);

Incidents.registerIncident(incident);
assert.equal(Incidents.getIncident('TEST-001').title,'Incidente de teste');
assert.equal(Incidents.listIncidents().length,1);
assert.throws(()=>Incidents.registerIncident(incident),/duplicate/);

console.log('warroom.test.js: all assertions passed');
