const assert = require('node:assert/strict');
const A = require('../analytics.js');

const now = new Date('2026-10-02T12:00:00Z');
const sessions = [
  {id:'1',area:'DBA / DP-300',started_at:'2026-10-01T19:00:00Z',finished_at:'2026-10-01T19:30:00Z',duration_minutes:30,mood:'nao',practical_done:true,start_latency_minutes:20,learned:'x'},
  {id:'2',area:'Inglês',started_at:'2026-09-30T19:00:00Z',finished_at:'2026-09-30T19:20:00Z',duration_minutes:20,mood:'mais-ou-menos',practical_done:true,start_latency_minutes:5,next_action:'y'},
  {id:'3',area:'AWS / Data Lake',started_at:'2026-09-29T10:00:00Z',finished_at:'2026-09-29T10:40:00Z',duration_minutes:40,mood:'sim',practical_done:false,start_latency_minutes:0},
  {id:'old',area:'DBA / DP-300',started_at:'2026-09-20T19:00:00Z',finished_at:'2026-09-20T20:00:00Z',duration_minutes:60,mood:'sim',practical_done:true,start_latency_minutes:10},
];
const evidence = [
  {id:'e1',session_id:'1',area:'DBA / DP-300',description:'query',created_at:'2026-10-01T19:31:00Z'},
  {id:'e2',session_id:'2',area:'Inglês',description:'frases',created_at:'2026-09-30T19:21:00Z'},
];
const competencies = [
  {area:'DBA / DP-300',name:'Índices',level:4},
  {area:'AWS / Data Lake',name:'S3',level:2},
  {area:'Inglês',name:'There is',level:0},
];

const s = A.summary(sessions,evidence,competencies,{now,weeklyTarget:4});
assert.equal(s.sessions7,3);
assert.equal(s.minutes7,90);
assert.equal(s.attendance,75);
assert.equal(s.practicalRate,67);
assert.equal(s.evidenceRate,67);
assert.equal(s.closureRate,67);
assert.equal(s.avgLatency,9); // inclui 20,5,0,10 nos últimos 30 dias
assert.equal(s.noMoodPractical,1);
assert.equal(s.competencyAutonomous,1);

const funnel = A.funnel(sessions,evidence,30,now);
assert.equal(funnel[0].value,4);
assert.equal(funnel[1].value,3);
assert.equal(funnel[2].value,2);

const areas = A.areaBreakdown(sessions,30,now);
assert.equal(areas.reduce((n,x)=>n+x.minutes,0),150);

const moods = A.moodBreakdown(sessions,30,now);
assert.equal(moods.find(x=>x.mood==='nao').rate,100);

const comps = A.competencySummary(competencies);
assert.equal(comps.find(x=>x.area==='DBA / DP-300').progress,80);

const heat = A.heatmap(sessions,84,now);
assert.equal(heat.length,84);
assert.ok(heat.some(x=>x.minutes===30));

const trend = A.weeklyTrend(sessions,8,now);
assert.equal(trend.length,8);

const habit = A.habitMap(sessions,evidence,365,now);
assert.ok(habit.weeks.length >= 52);
assert.equal(habit.activeDays,4);
assert.equal(habit.totalMinutes,150);
assert.equal(habit.currentStreak,3);
assert.equal(habit.bestStreak,3);
assert.ok(habit.months.length >= 10);

const insights = A.generateInsights(sessions,evidence,competencies,{now,weeklyTarget:4});
assert.ok(insights.length >= 1);
assert.ok(insights.some(x=>x.title.includes('vontade')));

console.log('analytics.test.js: all assertions passed');
