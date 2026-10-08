const assert = require('node:assert/strict');

global.window = {};
const Engine = require('../warroom/engine.js');
const Scoring = require('../warroom/scoring.js');
const Registry = require('../warroom/incidents.js');
const Incident = require('../warroom/incidents/dba-blocking-01.js');
const Controller = require('../warroom/controller.js');

Registry.registerIncident(Incident);

assert.equal(Incident.id,'DBA-WR-001');
assert.equal(Incident.trackId,'dba');
assert.equal(Incident.moduleId,'dba-04');
assert.ok(Incident.actions.length >= 10);
assert.ok(Object.keys(Incident.evidence).length >= 6);

let run=Engine.createRun(Incident,{runId:'test-run',startedAt:'2026-10-08T14:00:00Z'});

assert.equal(Controller.matchCommand(Incident,'dm_exec_requests').id,'check_requests');
assert.equal(Controller.matchCommand(Incident,'DBCC OPENTRAN').id,'check_open_tran');
assert.equal(Controller.matchCommand(Incident,'session 57').id,'inspect_session57');
assert.equal(Controller.matchCommand(Incident,'comando inexistente'),null);

run=Engine.applyAction(Incident,run,'talk_support').run;
run=Engine.applyAction(Incident,run,'talk_operations').run;
run=Engine.applyAction(Incident,run,'notify_investigation').run;
run=Engine.applyAction(Incident,run,'check_requests').run;
assert.ok(run.evidenceUnlocked.includes('requests'));
run=Engine.applyAction(Incident,run,'check_waits').run;
run=Engine.applyAction(Incident,run,'check_open_tran').run;
run=Engine.applyAction(Incident,run,'inspect_session57').run;

assert.ok(run.flags.root_cause_confirmed);
assert.ok(Engine.availableActions(Incident,run).some(a=>a.id==='kill_blocker'));

run=Engine.applyAction(Incident,run,'kill_blocker').run;
assert.equal(run.resolved,true);
assert.equal(run.result.outcome,'resolved_by_diagnosis');

const score=Incident.score(run,Scoring);
assert.ok(score.score >= 80, 'evidence-led path should score strongly');
assert.ok(score.technical >= 90);

const debrief=Incident.debrief(run,score);
assert.ok(debrief.rootCause.includes('sessão 57'));
assert.ok(debrief.strengths.length >= 4);

let unsafe=Engine.createRun(Incident,{runId:'unsafe'});
unsafe=Engine.applyAction(Incident,unsafe,'restart_sql').run;
assert.equal(unsafe.resolved,true);
assert.equal(unsafe.result.outcome,'mitigated_with_avoidable_outage');
const unsafeScore=Incident.score(unsafe,Scoring);
assert.ok(unsafeScore.score < score.score);
assert.ok(unsafeScore.business < 30);

console.log('warroom-incident.test.js: all assertions passed');
