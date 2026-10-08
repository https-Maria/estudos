const assert = require('node:assert/strict');

global.window = {};
const Engine = require('../recall/engine.js');
const Bank = require('../recall/items.js');
require('../recall/controller.js');

assert.ok(Bank.items.length >= 9);
assert.ok(Bank.items.some(x=>x.trackId==='dba'&&x.moduleId==='dba-04'));
assert.ok(Bank.items.some(x=>x.trackId==='aws'&&x.moduleId==='aws-01'));
assert.ok(Bank.items.some(x=>x.trackId==='english'));

const now = new Date('2026-10-08T12:00:00Z');
const first = Engine.nextProgress({},0,now);
assert.equal(first.stage,0);
assert.equal(first.attempts,1);
assert.equal(first.successes,0);
assert.equal(first.next_review_at,'2026-10-09T12:00:00.000Z');

const remembered = Engine.nextProgress(first,2,new Date(first.next_review_at));
assert.equal(remembered.stage,1);
assert.equal(remembered.attempts,2);
assert.equal(remembered.successes,1);
assert.equal(remembered.stability,3);

const strong = Engine.nextProgress(remembered,3,new Date(remembered.next_review_at));
assert.equal(strong.stage,3);
assert.ok(strong.stability >= 20);

const rows=[
  {item_id:'recall-dba04-01',stage:3,attempts:3,successes:2,next_review_at:'2026-10-07T12:00:00Z'},
  {item_id:'recall-aws01-01',stage:2,attempts:2,successes:2,next_review_at:'2026-10-20T12:00:00Z'}
];
const due=Engine.dueItems(Bank.items,rows,now,20);
assert.equal(due[0].item.id,'recall-dba04-01');
assert.ok(due.some(x=>x.progress===null),'new items should enter queue after overdue items');
assert.ok(!due.some(x=>x.item.id==='recall-aws01-01'),'future review should stay out of due queue');

const mastery=Engine.mastery([
  {attempts:3,successes:2,stage:4},
  {attempts:2,successes:2,stage:6}
]);
assert.equal(mastery.retention,80);
assert.equal(mastery.stable,2);
assert.equal(mastery.mastered,1);

assert.equal(Engine.gradeLabel(0),'não lembrei');
assert.equal(Engine.gradeLabel(3),'expliquei');

console.log('recall.test.js: all assertions passed');
