const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app-v5.js'), 'utf8');
const controller = fs.readFileSync(path.join(root, 'warroom/controller.js'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'supabase_war_room_learning_integration.sql'), 'utf8');

for (const token of ['saveWarAssessment','integrateWarResult','scheduleRecallFromWar','source_type','source_id','breakfix_done','assessment_score','validated_level']) {
  assert.ok(app.includes(token), 'learning integration missing app token ' + token);
}

for (const token of ['onComplete','integrateRun','syncPendingIntegrations','integrated_at']) {
  assert.ok(controller.includes(token), 'retry-safe integration missing controller token ' + token);
}

for (const token of ['source_type','source_id','idx_assessments_user_source','integrated_at']) {
  assert.ok(migration.includes(token), 'learning integration migration missing ' + token);
}

assert.ok(app.includes("a.source_type==='war_room'?'WAR ROOM':'CHAT'"), 'assessment source badge missing');
assert.ok(app.includes("War Room encontrou um gap"), 'War Room gap recommendation missing');
assert.ok(app.includes("Number(score.score)>=70"), 'War Room pass threshold should be 70');

console.log('warroom-integration.test.js: all assertions passed');


assert.ok(app.includes('incident.recallPlan'), 'War Room must derive targeted Recall plan from incident outcome');
assert.ok(app.includes('next_review_at'), 'War Room must persist Recall review scheduling');
assert.ok(controller.includes('Trilha e Recall atualizados'), 'War Room completion should confirm Recall integration');
