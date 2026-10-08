(() => {
  const A = window.StudyAnalytics;
  const C = window.StudyCurriculum;
  const WRI = window.ForgeWarRoomIncidents;
  const WRE = window.ForgeWarRoomEngine;
  const WRS = window.ForgeWarRoomScoring;
  const WRC = window.ForgeWarRoomController;
  const RE = window.ForgeRecallEngine;
  const RB = window.ForgeRecallItems;
  const RC = window.ForgeRecallController;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const qs = new URLSearchParams(location.search);
  const DEMO = qs.get('demo') === '1';
  const cfg = window.APP_CONFIG || {};
  const REPO_URL = 'https://github.com/https-Maria/estudos';
  const DAY = 86400000;

  if (!DEMO && (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_URL.includes('SEU-PROJETO'))) {
    document.body.innerHTML = '<main style="max-width:700px;margin:80px auto;font-family:system-ui;background:#111;color:#eee;padding:28px;border-radius:18px"><h1>Falta configurar o Supabase.</h1><p>Preencha config.js ou abra <code>?demo=1</code>.</p></main>';
    return;
  }

  const defaultSkills = {
    'DBA / DP-300': ['Fundamentos SQL Server','Índices','Execution Plan','Performance','Transações','Locks / Blocking','Deadlocks','DMVs / Waits','Backup / Restore','Segurança','Automação','HA / DR','Azure SQL'],
    'AWS / Data Lake': ['S3','Parquet','Glue Data Catalog','Athena','Glue ETL','PySpark','Bronze / Silver / Gold','Step Functions','Lake Formation'],
    'Inglês': ['There is / There are','Simple Present','Present Continuous','Simple Past','Present Perfect','Future','Modals','Questions','Prepositions','Writing','Speaking']
  };

  let user = null;
  let currentSession = null;
  let timer = null;
  let authMode = 'signin';
  let selectedMood = 'mais-ou-menos';
  let selectedTrackId = 'aws';
  let selectedModuleId = 'aws-01';
  let reportDays = 7;
  let sessions = [], evidence = [], competencies = [], parking = [], moduleProgress = [], assessments = [];
  let features = { v5: false };
  let checklist = { opened:false, practical:false, evidence:false, logged:false };

  const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const dateKey = (v) => A?.key ? A.key(v) : new Date(v).toISOString().slice(0,10);
  const fmtDate = (v) => new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(v));
  const fmtLong = (v) => new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long'}).format(new Date(v));
  const fmtMinutes = (m) => m >= 60 ? `${Math.floor(m/60)}h${m%60 ? ` ${m%60}m` : ''}` : `${m}m`;
  const clock = (ms) => { const s=Math.max(0,Math.floor(ms/1000)); return `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; };
  const uid = () => user?.id;
  const track = (id) => C.getTrack(id);
  const allModules = () => C.tracks.flatMap((t) => t.modules.map((m,i) => ({track:t,module:m,index:i})));
  const recFor = (trackId,moduleId) => moduleProgress.find((r) => r.track_id===trackId && r.module_id===moduleId) || null;

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('show'), 2600);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    toast('Copiado para a área de transferência.');
  }

  function makeDemo() {
    const d={sessions:[],evidence:[],competencies:[],parking:[],progress:[],assessments:[],warRuns:[],warEvents:[],recallProgress:[],recallAttempts:[]};
    const areas=['DBA / DP-300','AWS / Data Lake','Inglês'];
    for(let i=1;i<=80;i++){
      if(i%4===0||i%7===0){
        const start=new Date(Date.now()-i*DAY); start.setHours(i%3===1?10:19,12,0,0);
        const dur=[22,34,48,67][i%4], area=areas[i%3], id=`demo-s-${i}`;
        d.sessions.push({id,user_id:'demo',area,task_title:['Investigar índice','Bitrix → NiFi','Technical writing'][i%3],started_at:start.toISOString(),finished_at:new Date(start.getTime()+dur*60000).toISOString(),duration_minutes:dur,mood:i%5===0?'nao':'mais-ou-menos',practical_done:i%6!==0,learned:'Aprendi algo prático.',next_action:'Continuar a missão.',created_at:start.toISOString()});
        if(i%6!==0) d.evidence.push({id:`e-${i}`,session_id:id,user_id:'demo',area,description:'Evidência prática registrada.',created_at:new Date(start.getTime()+dur*60000).toISOString()});
      }
    }
    let ci=0;
    Object.entries(defaultSkills).forEach(([area,names])=>names.forEach((name,position)=>d.competencies.push({id:`c-${++ci}`,user_id:'demo',area,name,position,level:position<2?3:position<4?2:0})));
    [
      ['aws','aws-01',true,true,true,false,82,4],
      ['dba','dba-01',true,true,true,true,88,4],
      ['english','eng-01',true,false,true,false,null,null],
      ['dba','dba-02',true,false,true,false,null,null]
    ].forEach((x,i)=>d.progress.push({id:`p-${i}`,user_id:'demo',track_id:x[0],module_id:x[1],lab_done:x[2],breakfix_done:x[3],evidence_done:x[4],portfolio_done:x[5],assessment_score:x[6],validated_level:x[7],updated_at:new Date().toISOString()}));
    d.assessments.push({id:'a1',user_id:'demo',track_id:'dba',module_id:'dba-01',score:88,validated_level:4,summary:'Boa autonomia prática.',strengths:['estrutura','execução'],gaps:['filegroups'],created_at:new Date(Date.now()-8*DAY).toISOString()});
    return d;
  }

  function createStore() {
    if (DEMO) {
      const d=makeDemo();
      return {
        async session(){return {user:{id:'demo',email:'demo@local'}}},
        async signIn(){return {user:{id:'demo',email:'demo@local'},session:{user:{id:'demo',email:'demo@local'}}}}, async signUp(){return {user:{id:'demo',email:'demo@local'},session:{user:{id:'demo',email:'demo@local'}}}}, async signOut(){location.reload()}, onAuth(){}, async resetPassword(){return true}, async updatePassword(){return true},
        async sessions(){return d.sessions}, async evidence(){return d.evidence}, async competencies(){return d.competencies}, async parking(){return d.parking},
        async progress(){return {ok:true,data:d.progress}}, async assessments(){return {ok:true,data:d.assessments}}, async seed(){},
        async insertSession(obj){const row={...obj,id:`s-${Date.now()}`}; d.sessions.push(row); return row;},
        async insertPastSession(obj){const row={...obj,id:`past-${Date.now()}`,created_at:obj.started_at}; d.sessions.push(row); return row;},
        async updateSession(id,patch){const x=d.sessions.find(s=>s.id===id); Object.assign(x,patch); return x;},
        async insertEvidence(obj){const row={...obj,id:`e-${Date.now()}`,created_at:new Date().toISOString()}; d.evidence.push(row); return row;},
        async upsertProgress(obj){let x=d.progress.find(r=>r.track_id===obj.track_id&&r.module_id===obj.module_id); if(x)Object.assign(x,obj,{updated_at:new Date().toISOString()}); else {x={...obj,id:`p-${Date.now()}`,updated_at:new Date().toISOString()};d.progress.push(x);} return x;},
        async addAssessment(obj){const row={...obj,source_type:obj.source_type||'boss_chat',id:`a-${Date.now()}`,created_at:new Date().toISOString()}; d.assessments.push(row); return row;},
        async saveWarAssessment(obj){let row=d.assessments.find(a=>a.source_type==='war_room'&&a.source_id===obj.source_id);if(row)Object.assign(row,obj,{source_type:'war_room'});else{row={...obj,source_type:'war_room',id:`a-war-${Date.now()}`,created_at:new Date().toISOString()};d.assessments.push(row)}return row},
        async addParking(topic){const row={id:`pk-${Date.now()}`,user_id:'demo',topic,created_at:new Date().toISOString()}; d.parking.push(row); return row;},
        async delParking(id){d.parking=d.parking.filter(x=>x.id!==id)},
        async warRuns(){return [...d.warRuns].sort((a,b)=>new Date(b.started_at)-new Date(a.started_at))},
        async createWarRun(obj){const row={...obj,id:`wr-${Date.now()}`,user_id:'demo',started_at:new Date().toISOString(),created_at:new Date().toISOString(),updated_at:new Date().toISOString()};d.warRuns.unshift(row);return row},
        async updateWarRun(id,patch){const x=d.warRuns.find(r=>r.id===id);if(!x)throw new Error('War Room run não encontrado.');Object.assign(x,patch);return x},
        async addWarEvent(obj){const row={...obj,id:`we-${Date.now()}-${obj.sequence}`,user_id:'demo',created_at:new Date().toISOString()};d.warEvents.push(row);return row},
        async recallProgress(){return [...d.recallProgress]},
        async recallAttempts(){return [...d.recallAttempts].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))},
        async addRecallAttempt(obj){const row={...obj,id:`ra-${Date.now()}-${Math.random().toString(16).slice(2)}`,user_id:'demo',created_at:new Date().toISOString()};d.recallAttempts.unshift(row);return row},
        async upsertRecallProgress(obj){let row=d.recallProgress.find(x=>x.item_id===obj.item_id);if(row)Object.assign(row,obj,{updated_at:new Date().toISOString()});else{row={...obj,id:`rp-${Date.now()}`,user_id:'demo',created_at:new Date().toISOString(),updated_at:new Date().toISOString()};d.recallProgress.push(row)}return row}
      };
    }

    const db=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
    const safe=async(name,builder)=>{try{const r=await builder(db.from(name));if(r.error)throw r.error;return {ok:true,data:r.data||[]};}catch(e){console.warn(name,e.message);return {ok:false,data:[]};}};
    return {
      async session(){const {data,error}=await db.auth.getSession();if(error)throw error;return data.session},
      onAuth(fn){db.auth.onAuthStateChange((event,s)=>fn(s,event))},
      async signIn(email,password){const {data,error}=await db.auth.signInWithPassword({email,password});if(error)throw error;return data},
      async signUp(email,password){const {data,error}=await db.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});if(error)throw error;return data},
      async resetPassword(email){const redirectTo=location.origin+location.pathname;const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo});if(error)throw error;return true},
      async updatePassword(password){const {data,error}=await db.auth.updateUser({password});if(error)throw error;return data},
      async signOut(){await db.auth.signOut()},
      async sessions(){const from=new Date(Date.now()-370*DAY).toISOString();const {data,error}=await db.from('study_sessions').select('*').gte('started_at',from).order('started_at',{ascending:true});if(error)throw error;return data||[]},
      async evidence(){const from=new Date(Date.now()-370*DAY).toISOString();const {data,error}=await db.from('evidence').select('*').gte('created_at',from).order('created_at',{ascending:true});if(error)throw error;return data||[]},
      async competencies(){const {data,error}=await db.from('competencies').select('*').order('area').order('position');if(error)throw error;return data||[]},
      async parking(){const {data,error}=await db.from('parking_lot').select('*').order('created_at',{ascending:false});if(error)throw error;return data||[]},
      async progress(){return safe('module_progress',q=>q.select('*').order('updated_at',{ascending:true}))},
      async assessments(){return safe('assessments',q=>q.select('*').order('created_at',{ascending:true}))},
      async seed(userId){const {data,error}=await db.from('competencies').select('id').limit(1);if(error)throw error;if(data?.length)return;const rows=[];Object.entries(defaultSkills).forEach(([area,names])=>names.forEach((name,position)=>rows.push({user_id:userId,area,name,level:0,position})));const r=await db.from('competencies').insert(rows);if(r.error)throw r.error},
      async insertSession(obj){const payload={user_id:obj.user_id,area:obj.area,task_title:obj.task_title,started_at:obj.started_at,planned_start_at:obj.planned_start_at,start_latency_minutes:obj.start_latency_minutes,mood:obj.mood,practical_done:false};if(features.v5){payload.track_id=obj.track_id;payload.module_id=obj.module_id;}const {data,error}=await db.from('study_sessions').insert(payload).select().single();if(error)throw error;return data},
      async insertPastSession(obj){const payload={user_id:obj.user_id,area:obj.area,task_title:obj.task_title,started_at:obj.started_at,finished_at:obj.finished_at,duration_minutes:obj.duration_minutes,mood:obj.mood||'mais-ou-menos',practical_done:!!obj.practical_done,notes:obj.notes||null,learned:obj.learned||null};if(features.v5){payload.track_id=obj.track_id;payload.module_id=obj.module_id;}const {data,error}=await db.from('study_sessions').insert(payload).select().single();if(error)throw error;return data},
      async updateSession(id,patch){const {data,error}=await db.from('study_sessions').update(patch).eq('id',id).select().single();if(error)throw error;return data},
      async insertEvidence(obj){const {data,error}=await db.from('evidence').insert(obj).select().single();if(error)throw error;return data},
      async upsertProgress(obj){if(!features.v5)throw new Error('migration_v5_required');const payload={...obj,user_id:uid(),updated_at:new Date().toISOString()};const {data,error}=await db.from('module_progress').upsert(payload,{onConflict:'user_id,track_id,module_id'}).select().single();if(error)throw error;return data},
      async addAssessment(obj){if(!features.v5)throw new Error('migration_v5_required');const {data,error}=await db.from('assessments').insert({...obj,source_type:obj.source_type||'boss_chat',user_id:uid()}).select().single();if(error)throw error;return data},
      async saveWarAssessment(obj){if(!features.v5)throw new Error('migration_v5_required');const existing=await db.from('assessments').select('*').eq('source_type','war_room').eq('source_id',obj.source_id).maybeSingle();if(existing.error)throw existing.error;if(existing.data){const {data,error}=await db.from('assessments').update({...obj,source_type:'war_room'}).eq('id',existing.data.id).select().single();if(error)throw error;return data}const {data,error}=await db.from('assessments').insert({...obj,source_type:'war_room',user_id:uid()}).select().single();if(error)throw error;return data},
      async addParking(topic){const {data,error}=await db.from('parking_lot').insert({user_id:uid(),topic}).select().single();if(error)throw error;return data},
      async delParking(id){const {error}=await db.from('parking_lot').delete().eq('id',id);if(error)throw error},
      async warRuns(){const {data,error}=await db.from('war_runs').select('*').order('started_at',{ascending:false});if(error)throw error;return data||[]},
      async createWarRun(obj){const {data,error}=await db.from('war_runs').insert({...obj,user_id:uid()}).select().single();if(error)throw error;return data},
      async updateWarRun(id,patch){const {data,error}=await db.from('war_runs').update(patch).eq('id',id).select().single();if(error)throw error;return data},
      async addWarEvent(obj){const {data,error}=await db.from('war_events').insert({...obj,user_id:uid()}).select().single();if(error)throw error;return data},
      async recallProgress(){const {data,error}=await db.from('recall_progress').select('*').order('next_review_at',{ascending:true});if(error)throw error;return data||[]},
      async recallAttempts(){const {data,error}=await db.from('recall_attempts').select('*').order('created_at',{ascending:false}).limit(200);if(error)throw error;return data||[]},
      async addRecallAttempt(obj){const {data,error}=await db.from('recall_attempts').insert({...obj,user_id:uid()}).select().single();if(error)throw error;return data},
      async upsertRecallProgress(obj){const payload={...obj,user_id:uid(),updated_at:new Date().toISOString()};const {data,error}=await db.from('recall_progress').upsert(payload,{onConflict:'user_id,item_id'}).select().single();if(error)throw error;return data}
    };
  }
  const store=createStore();
  const warController=WRC?.createController({
    engine:WRE,
    scoring:WRS,
    incidents:WRI,
    listRuns:()=>store.warRuns(),
    createRun:(obj)=>store.createWarRun(obj),
    updateRun:(id,patch)=>store.updateWarRun(id,patch),
    addEvent:(obj)=>store.addWarEvent(obj),
    onComplete:(ctx)=>integrateWarResult(ctx),
    toast
  })||null;

  const recallController=RC?.createController({
    engine:RE,
    bank:RB,
    listProgress:()=>store.recallProgress(),
    listAttempts:()=>store.recallAttempts(),
    addAttempt:(obj)=>store.addRecallAttempt(obj),
    upsertProgress:(obj)=>store.upsertRecallProgress(obj),
    onChanged:async()=>{},
    toast
  })||null;

  async function integrateWarResult({incident,score,debrief,dbRun}){
    if(!features.v5)throw new Error('migration_v5_required');
    const validatedLevel=score.score>=95?5:score.score>=85?4:score.score>=70?3:score.score>=50?2:1;
    const assessment=await store.saveWarAssessment({
      track_id:incident.trackId,
      module_id:incident.moduleId,
      score:Number(score.score),
      validated_level:validatedLevel,
      summary:debrief.summary,
      strengths:debrief.strengths||[],
      gaps:debrief.gaps||[],
      source_id:dbRun.id
    });
    const ai=assessments.findIndex(a=>a.source_type==='war_room'&&a.source_id===dbRun.id);
    if(ai>=0)assessments[ai]=assessment;else assessments.push(assessment);

    const old=recFor(incident.trackId,incident.moduleId)||{
      track_id:incident.trackId,module_id:incident.moduleId,
      lab_done:false,evidence_done:false,breakfix_done:false,portfolio_done:false,
      assessment_score:null,validated_level:null
    };
    const bestScore=Math.max(Number(old.assessment_score||0),Number(score.score||0));
    const bestLevel=Math.max(Number(old.validated_level||0),validatedLevel);
    const progress=await store.upsertProgress({
      ...old,
      track_id:incident.trackId,
      module_id:incident.moduleId,
      breakfix_done:!!old.breakfix_done||Number(score.score)>=70,
      assessment_score:bestScore||null,
      validated_level:bestLevel||null
    });
    const pi=moduleProgress.findIndex(r=>r.track_id===incident.trackId&&r.module_id===incident.moduleId);
    if(pi>=0)moduleProgress[pi]=progress;else moduleProgress.push(progress);
    renderAll();
    return {assessment,progress};
  }

  function stepState(trackId,moduleId){
    const r=recFor(trackId,moduleId)||{};
    return {lab:!!r.lab_done,evidence:!!r.evidence_done,breakfix:!!r.breakfix_done,portfolio:!!r.portfolio_done,boss:Number(r.assessment_score||0)>=70,score:Number(r.assessment_score||0),level:Number(r.validated_level||0)};
  }
  function modulePercent(trackId,moduleId){const s=stepState(trackId,moduleId);return (s.lab?20:0)+(s.evidence?15:0)+(s.breakfix?20:0)+(s.portfolio?15:0)+(s.boss?30:0)}
  function moduleXp(trackId,moduleId){const s=stepState(trackId,moduleId);return (s.lab?50:0)+(s.evidence?20:0)+(s.breakfix?40:0)+(s.portfolio?30:0)+(s.boss?80:0)}
  function totalXp(){return allModules().reduce((n,x)=>n+moduleXp(x.track.id,x.module.id),0)+sessions.filter(s=>s.finished_at).length*5}
  function levelInfo(){const xp=totalXp(),level=1+Math.floor(xp/500),within=xp%500,ranks=['Aprendiz','Operadora','Especialista','Engenheira','Arquiteta','Mentora'];return {xp,level,within,pct:Math.round(within/500*100),rank:ranks[Math.min(ranks.length-1,Math.floor((level-1)/2))]}}
  function trackPercent(t){return Math.round(t.modules.reduce((n,m)=>n+modulePercent(t.id,m.id),0)/t.modules.length)}
  function currentIndex(t){const i=t.modules.findIndex(m=>modulePercent(t.id,m.id)<80);return i<0?t.modules.length-1:i}
  function moduleStatus(t,i){const p=modulePercent(t.id,t.modules[i].id),cur=currentIndex(t);return p>=80?'done':i===cur?'current':i<cur?'done':'future'}
  function recommendedTrack(){const d=new Date(),day=d.getDay(),h=d.getHours();if(day>=1&&day<=5&&h>=7&&h<18)return track('aws');if(day===3||day===5)return track('english');return track('dba')}
  function currentMission(t=recommendedTrack()){const i=currentIndex(t);return {track:t,module:t.modules[i],index:i}}
  function displayMission(){
    if(currentSession?.track_id&&currentSession?.module_id){
      const t=track(currentSession.track_id),i=t?.modules.findIndex(m=>m.id===currentSession.module_id);
      if(t&&i>=0)return {track:t,module:t.modules[i],index:i};
    }
    return currentMission();
  }
  function phaseData(){const phases=[['BASE',0,3],['OPERAÇÃO',3,6],['BREAK & FIX',6,9],['CLOUD & AUTONOMIA',9,12]];return phases.map(([name,a,b],idx)=>{const entries=C.tracks.flatMap(t=>t.modules.slice(a,b).map(m=>modulePercent(t.id,m.id)));const pct=Math.round(entries.reduce((x,y)=>x+y,0)/entries.length);return {name,a,b,idx,pct}})}
  function overallPercent(){const vals=allModules().map(x=>modulePercent(x.track.id,x.module.id));return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length)}

  async function refresh(){
    const [s,e,c,p,mp,as]=await Promise.all([store.sessions(),store.evidence(),store.competencies(),store.parking(),store.progress(),store.assessments()]);
    sessions=s;evidence=e;competencies=c;parking=p;features.v5=mp.ok;moduleProgress=mp.data;assessments=as.data;
    const today=dateKey(new Date()),todays=sessions.filter(x=>dateKey(x.started_at)===today);
    currentSession=todays.find(x=>!x.finished_at)||null;
    if(currentSession?.track_id&&currentSession?.module_id){selectedTrackId=currentSession.track_id;selectedModuleId=currentSession.module_id;}
    checklist={opened:todays.length>0,practical:todays.some(x=>x.practical_done),evidence:evidence.some(x=>dateKey(x.created_at)===today),logged:todays.some(x=>x.learned||x.doubt||x.next_action)};
    renderAll();
  }

  function renderAll(){renderProfile();renderHome();renderJourney();renderToday();renderRecall();renderWarRoom();renderAssessments();renderReports();renderPortfolio();renderHistory();renderParking();renderSessionState()}
  function renderRecall(){if(recallController)recallController.render()}
  function renderWarRoom(){if(warController)warController.render();else if($('#warroomCount'))$('#warroomCount').textContent=String(WRI?.listIncidents?.().length||0)}
  function renderProfile(){const l=levelInfo();$('#homeLevel').textContent=l.level;$('#homeXp').textContent=`${l.xp} XP`;$('#sidebarRank').textContent=`${l.rank} · Lv. ${l.level}`;if($('#sidebarEmail'))$('#sidebarEmail').textContent=user?.email||'';$('#sidebarXpBar').style.width=`${l.pct}%`;const circumference=314;$('#levelRing').style.strokeDashoffset=String(circumference-(circumference*l.pct/100))}

  function renderHome(){
    const m=displayMission(),st=stepState(m.track.id,m.module.id);
    $('#missionGlyph').textContent=m.track.id==='dba'?'▣':m.track.id==='aws'?'◈':'◎';
    $('#missionWorld').textContent=m.track.label.toUpperCase();$('#missionTitle').textContent=m.module.title;$('#missionText').textContent=m.module.mission;$('#missionXp').textContent=`+${220-moduleXp(m.track.id,m.module.id)} XP restantes`;
    const steps=[['LAB',st.lab],['EVIDÊNCIA',st.evidence],['BREAK & FIX',st.breakfix],['GIT',st.portfolio],['BOSS',st.boss]];
    $('#missionSteps').innerHTML=steps.map(([n,done],i)=>`<span class="quest-step ${done?'done':(!done&&steps.slice(0,i).every(x=>x[1])?'current':'')}">${done?'✓ ':''}${n}</span>`).join('');
    $('#continueMissionBtn').onclick=()=>startModule(m.track.id,m.module.id);$('#openMissionBtn').onclick=()=>openMission(m.track.id,m.module.id);
    $('#worldCards').innerHTML=C.tracks.map(t=>{const i=currentIndex(t),mod=t.modules[i],pct=trackPercent(t);return `<button class="world-card ${t.id}" data-open-track="${t.id}"><div class="world-card-top"><span class="world-symbol">${t.id==='dba'?'DB':t.id==='aws'?'AWS':'EN'}</span><span class="world-percent">${pct}%</span></div><h3>${escapeHtml(t.label)}</h3><p>${escapeHtml(t.description)}</p><div class="progress-track"><div style="width:${pct}%"></div></div><div class="world-now"><span>AGORA</span><strong>${escapeHtml(mod.title)}</strong></div></button>`}).join('');
    $$('[data-open-track]').forEach(b=>b.onclick=()=>openTrack(b.dataset.openTrack));
    renderHabit();
    const phases=phaseData(),cur=phases.findIndex(x=>x.pct<80),current=cur<0?3:cur;
    $('#homeQuestline').innerHTML=phases.map((p,i)=>`<div class="questline-row ${p.pct>=80?'done':i===current?'current':''}"><div class="questline-node">${p.pct>=80?'✓':i+1}</div><div><strong>${p.name}</strong><span>${i===current?'VOCÊ ESTÁ AQUI':p.pct>=80?'construído':'próxima região'}</span></div><span>${p.pct}%</span></div>`).join('');
    const recent=[...sessions].filter(s=>s.finished_at).sort((a,b)=>new Date(b.started_at)-new Date(a.started_at)).slice(0,5);
    $('#homeRecent').innerHTML=recent.length?recent.map(s=>`<div class="recent-item"><div class="recent-item-top"><strong>${escapeHtml(s.task_title||'Sessão')}</strong><span>${fmtDate(s.started_at)} · ${A.minutes(s)}m</span></div><p>${escapeHtml(s.area)}${s.practical_done?' · prática':''}</p></div>`).join(''):'<div class="recent-item"><p>A primeira evidência ainda não existe. Comece a missão.</p></div>';
  }

  function renderHabit(){
    const h=A.habitMap(sessions,evidence,365,new Date());
    $('#habitCurrentStreak').textContent=h.currentStreak;$('#habitBestStreak').textContent=h.bestStreak;$('#habitHours').textContent=fmtMinutes(h.totalMinutes);
    const monthAt=new Map(h.months.map(m=>[m.week,m.label]));const months=h.weeks.map((_,i)=>`<span>${monthAt.get(i)||''}</span>`).join('');
    const weeks=h.weeks.map(w=>`<div class="habit-week">${w.map(d=>`<button type="button" class="habit-cell l${d.level}${d.inPeriod?'':' outside'}" ${d.inPeriod?`data-day="${d.date}"`:''} aria-label="${d.date}"></button>`).join('')}</div>`).join('');
    $('#habitMap').innerHTML=`<div class="habit-scroll"><div class="habit-month-row"><span class="habit-axis-spacer"></span><div class="habit-months">${months}</div></div><div class="habit-body"><div class="habit-weekdays"><span>seg</span><span></span><span>qua</span><span></span><span>sex</span><span></span><span>dom</span></div><div class="habit-weeks">${weeks}</div></div></div><div class="habit-footer"><span>clique em um dia para abrir o log</span><div class="habit-legend"><span>menos</span>${[0,1,2,3,4].map(n=>`<i class="habit-cell l${n}"></i>`).join('')}<span>mais</span></div></div>`;
    $$('#habitMap [data-day]').forEach(b=>b.onclick=()=>openDay(b.dataset.day));
  }

  function openDay(day){
    const ss=sessions.filter(s=>dateKey(s.started_at)===day),ev=evidence.filter(e=>dateKey(e.created_at)===day),mins=ss.reduce((n,s)=>n+A.minutes(s),0);
    $('#dayDetail').innerHTML=`<span class="kicker">${new Date(day+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}</span><h3>${ss.length} sessão(ões) · ${fmtMinutes(mins)}</h3>${ss.length?ss.map(s=>`<div class="room-section"><div class="room-section-head"><span>${escapeHtml(s.area)}</span><b>${A.minutes(s)}m</b></div><h3>${escapeHtml(s.task_title||'Sessão')}</h3><p>${s.practical_done?'✓ prática executada':'○ sem prática marcada'} · ${ev.filter(e=>e.session_id===s.id).length} evidência(s)</p></div>`).join(''):'<p class="muted">Nenhuma sessão concluída nesse dia.</p>'}`;
    $('#dayDialog').showModal();
  }

  function renderJourney(){
    $('#journeyPercent').textContent=`${overallPercent()}%`;const phases=phaseData(),first=phases.findIndex(p=>p.pct<80),cur=first<0?phases.length-1:first;
    $('#journeyMap').innerHTML=phases.map((p,i)=>{const state=p.pct>=80?'done':i===cur?'current':'future';return `<article class="journey-phase ${state}"><div class="phase-head"><div><span>REGIÃO ${String(i+1).padStart(2,'0')}</span><h3>${p.name}</h3></div><strong>${p.pct}%</strong></div><div class="phase-worlds">${C.tracks.map(t=>`<div class="phase-world ${t.id}"><h4>${escapeHtml(t.label)}</h4><ul>${t.modules.slice(p.a,p.b).map(m=>`<li>${modulePercent(t.id,m.id)>=80?'✓':'◇'} ${escapeHtml(m.title)}</li>`).join('')}</ul></div>`).join('')}</div></article>`}).join('');
  }

  function openTrack(id){selectedTrackId=id;renderTrack(id);setView('track',id)}
  function renderTrack(id){
    const t=track(id),pct=trackPercent(t);$('#trackSources').innerHTML=t.sources.map(s=>`<span>${escapeHtml(s)}</span>`).join('');$('#trackKicker').textContent=`MUNDO · ${t.short.toUpperCase()}`;$('#trackTitle').textContent=t.label;$('#trackDescription').textContent=t.description;$('#trackPercent').textContent=`${pct}%`;
    if(id==='aws')renderPipeline(t);else if(id==='dba')renderDbaTree(t);else renderEnglishTree(t);
    $('#trackModules').innerHTML=t.modules.map((m,i)=>{const p=modulePercent(t.id,m.id),status=moduleStatus(t,i),st=stepState(t.id,m.id);return `<button class="module-card ${status}" data-module="${m.id}"><div class="module-head"><div><span class="module-status">${status==='done'?'CONSTRUÍDO':status==='current'?'AGORA':'PRÓXIMO'}</span><h3>${String(i+1).padStart(2,'0')} · ${escapeHtml(m.title)}</h3></div><b>${p}%</b></div><p>${escapeHtml(m.mission)}</p><div class="module-progress"><div style="width:${p}%"></div></div><div class="module-foot"><span>${st.boss?'★ validado':st.breakfix?'⚔ break/fix feito':st.lab?'lab feito':'não iniciado'}</span><b>${moduleXp(t.id,m.id)} XP</b></div></button>`}).join('');
    $$('#trackModules [data-module]').forEach(b=>b.onclick=()=>openMission(id,b.dataset.module));
  }
  function renderDbaTree(t){$('#trackVisual').innerHTML=`<div class="dba-tree">${t.modules.map((m,i)=>`<button class="tree-node ${moduleStatus(t,i)}" data-vmod="${m.id}"><span>${String(i+1).padStart(2,'0')} · ${moduleStatus(t,i).toUpperCase()}</span><strong>${escapeHtml(m.title)}</strong></button>`).join('')}</div>`;$$('[data-vmod]').forEach(b=>b.onclick=()=>openMission(t.id,b.dataset.vmod))}
  function renderPipeline(t){$('#trackVisual').innerHTML=`<div class="pipeline">${t.modules.map((m,i)=>`${i?'<span class="pipeline-arrow">→</span>':''}<button class="pipeline-node ${moduleStatus(t,i)}" data-vmod="${m.id}"><span>${String(i+1).padStart(2,'0')}</span><strong>${escapeHtml(m.title)}</strong></button>`).join('')}</div>`;$$('[data-vmod]').forEach(b=>b.onclick=()=>openMission(t.id,b.dataset.vmod))}
  function renderEnglishTree(t){const groups=[['FOUNDATION',0,4],['DOCUMENT & INVESTIGATE',4,8],['COMMUNICATE',8,12]];$('#trackVisual').innerHTML=`<div class="comm-tree">${groups.map(([name,a,b])=>`<div class="comm-column"><h4>${name}</h4><div class="comm-list">${t.modules.slice(a,b).map((m,k)=>`<button class="comm-node ${moduleStatus(t,a+k)}" data-vmod="${m.id}"><span>${String(a+k+1).padStart(2,'0')}</span><strong>${escapeHtml(m.title)}</strong></button>`).join('')}</div></div>`).join('')}</div>`;$$('[data-vmod]').forEach(b=>b.onclick=()=>openMission(t.id,b.dataset.vmod))}

  function roomSection(code,title,text,field,done){return `<div class="room-section"><div class="room-section-head"><span>${code}</span><button class="room-toggle ${done?'done':''}" data-toggle-progress="${field}">${done?'✓ CONCLUÍDO':'MARCAR CONCLUÍDO'}</button></div><h3>${title}</h3><p>${escapeHtml(text)}</p></div>`}
  function openMission(trackId,moduleId){
    const t=track(trackId),i=t.modules.findIndex(m=>m.id===moduleId),m=t.modules[i],st=stepState(trackId,moduleId),p=modulePercent(trackId,moduleId);selectedTrackId=trackId;selectedModuleId=moduleId;
    $('#missionRoomHead').innerHTML=`<span class="kicker">${escapeHtml(t.label)} · QUEST ${String(i+1).padStart(2,'0')}</span><h2>${escapeHtml(m.title)}</h2><p>${escapeHtml(m.mission)}</p><div class="room-progress">${[['LAB',st.lab],['EVIDÊNCIA',st.evidence],['BREAK & FIX',st.breakfix],['PORTFÓLIO',st.portfolio],['BOSS',st.boss]].map(([n,d])=>`<span class="room-step ${d?'done':''}">${d?'✓ ':''}${n}</span>`).join('')}<span class="room-step">${p}%</span></div>`;
    const bossUnlocked=st.lab&&st.evidence&&st.breakfix;
    $('#missionRoomBody').innerHTML=`<div class="room-section"><div class="room-section-head"><span>01 · ENTENDER</span><b>Fundamentos</b></div><h3>Conteúdo necessário</h3><div class="topic-list">${m.topics.map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div></div>${roomSection('02 · LAB / MISSÃO','Construir',m.mission,'lab_done',st.lab)}${roomSection('03 · BREAK & FIX','Quebrar e recuperar',m.breakfix,'breakfix_done',st.breakfix)}${roomSection('04 · EVIDÊNCIA','Provar',m.evidence,'evidence_done',st.evidence)}${roomSection('05 · PORTFÓLIO / GIT','Registrar',m.portfolio,'portfolio_done',st.portfolio)}<div class="room-section"><div class="room-section-head"><span>06 · BOSS BATTLE</span><b>${st.boss?'VALIDADO':bossUnlocked?'DISPONÍVEL':'BLOQUEADO'}</b></div><h3>Avaliação comigo no ChatGPT</h3><p>Conceito + prática + diagnóstico + explicação. O resultado volta para o site e valida o nível da competência.</p><div class="room-actions"><button class="btn ${bossUnlocked?'btn-danger':'btn-ghost'}" id="bossExportBtn" ${bossUnlocked?'':'disabled'}>${st.boss?'REAVALIAR':'COPIAR PACOTE PARA AVALIAÇÃO'}</button>${st.score?`<span class="room-step done">score ${st.score} · nível ${st.level}</span>`:''}</div></div><div class="room-actions"><button class="btn btn-primary" id="roomStartBtn">⚡ CONTINUAR ESTA MISSÃO</button></div>`;
    $$('#missionRoomBody [data-toggle-progress]').forEach(b=>b.onclick=()=>toggleProgress(trackId,moduleId,b.dataset.toggleProgress));
    $('#roomStartBtn').onclick=()=>{startModule(trackId,moduleId);$('#missionDialog').close()};
    const boss=$('#bossExportBtn');if(boss&&!boss.disabled)boss.onclick=()=>exportAssessmentContext(trackId,moduleId);
    $('#missionDialog').showModal();
  }

  async function toggleProgress(trackId,moduleId,field){
    if(!features.v5){toast('Rode supabase_v5_migration.sql para salvar progresso RPG.');return}
    const old=recFor(trackId,moduleId)||{track_id:trackId,module_id:moduleId,lab_done:false,evidence_done:false,breakfix_done:false,portfolio_done:false};
    const row=await store.upsertProgress({track_id:trackId,module_id:moduleId,lab_done:!!old.lab_done,evidence_done:!!old.evidence_done,breakfix_done:!!old.breakfix_done,portfolio_done:!!old.portfolio_done,assessment_score:old.assessment_score||null,validated_level:old.validated_level||null,[field]:!old[field]});
    const idx=moduleProgress.findIndex(r=>r.track_id===trackId&&r.module_id===moduleId);if(idx>=0)moduleProgress[idx]=row;else moduleProgress.push(row);
    renderAll();openMission(trackId,moduleId);
  }

  function startModule(trackId,moduleId){selectedTrackId=trackId;selectedModuleId=moduleId;const t=track(trackId),m=t.modules.find(x=>x.id===moduleId);$('#taskTitleInput').value=m.mission;$('#taskTitleInput').dataset.auto='0';renderToday();setView('today')}
  function renderToday(){
    const t=track(selectedTrackId),m=t.modules.find(x=>x.id===selectedModuleId)||t.modules[currentIndex(t)],i=t.modules.indexOf(m);$('#todayWorldPill').textContent=t.short.toUpperCase();$('#todayWorldPill').className=`world-pill ${t.id}`;$('#todayModuleLabel').textContent=`Módulo ${String(i+1).padStart(2,'0')}`;$('#todayMissionTitle').textContent=m.title;$('#todayMissionDescription').textContent=m.mission;
    if(!currentSession&&(!$('#taskTitleInput').value||$('#taskTitleInput').dataset.auto==='1')){$('#taskTitleInput').value=m.mission;$('#taskTitleInput').dataset.auto='1'}
    const today=dateKey(new Date());$('#todayMinutes').textContent=fmtMinutes(sessions.filter(s=>s.finished_at&&dateKey(s.started_at)===today).reduce((n,s)=>n+A.minutes(s),0));
    Object.entries(checklist).forEach(([k,v])=>{const row=$(`#todayChecklist [data-check="${k}"]`);if(row){row.classList.toggle('done',v);row.querySelector('i').textContent=v?'●':'○'}});
    const ev=evidence.filter(e=>dateKey(e.created_at)===today).reverse();$('#todayEvidenceList').innerHTML=ev.map(x=>`<div class="evidence-item">${escapeHtml(x.description)}</div>`).join('');
  }
  function renderSessionState(){const chip=$('#sessionChip'),quick=$('#quickStartBtn');if(currentSession){chip.classList.add('live');chip.querySelector('span').textContent='sessão ativa';quick.textContent='⏱ CONTINUAR';$('#startSessionBtn').classList.add('hidden');$('#runningPanel').classList.remove('hidden');clearInterval(timer);const tick=()=>$('#timer').textContent=clock(Date.now()-new Date(currentSession.started_at).getTime());tick();timer=setInterval(tick,1000)}else{chip.classList.remove('live');chip.querySelector('span').textContent='sem sessão ativa';quick.textContent='⚡ COMEÇAR';$('#startSessionBtn').classList.remove('hidden');$('#runningPanel').classList.add('hidden');clearInterval(timer)}}

  async function exportAssessmentContext(trackId,moduleId){
    const t=track(trackId),m=t.modules.find(x=>x.id===moduleId),recentEvidence=evidence.filter(e=>{const s=sessions.find(x=>x.id===e.session_id);return s?.track_id===trackId&&s?.module_id===moduleId}).slice(-6).map(e=>e.description);
    const packet={action:'BOSS_BATTLE',track_id:trackId,module_id:moduleId,track:t.label,module:m.title,topics:m.topics,lab:m.mission,breakfix:m.breakfix,evidence_expected:m.evidence,evidence_recorded:recentEvidence,instructions:'Me avalie uma questão por vez em conceito, prática, diagnóstico e explicação. Ao final gere JSON com track_id,module_id,score,validated_level,summary,strengths,gaps.'};
    await copyText(JSON.stringify(packet,null,2));toast('Pacote da Boss Battle copiado. Cole no nosso chat.');
  }

  function renderAssessments(){
    const ready=allModules().filter(x=>{const s=stepState(x.track.id,x.module.id);return s.lab&&s.evidence&&s.breakfix&&!s.boss});const passed=assessments.filter(a=>Number(a.score)>=70),avg=assessments.length?Math.round(assessments.reduce((n,a)=>n+Number(a.score||0),0)/assessments.length):0;
    $('#assessmentStats').innerHTML=[['Validações aprovadas',passed.length],['Bosses disponíveis',ready.length],['Score médio',assessments.length?`${avg}%`:'—'],['Nível 4+',assessments.filter(a=>Number(a.validated_level)>=4).length]].map(([a,b])=>`<div class="stat-tile"><span>${a}</span><strong>${b}</strong></div>`).join('');
    const candidates=ready.length?ready:allModules().filter(x=>moduleStatus(x.track,x.index)==='current').slice(0,3);
    $('#bossGrid').innerHTML=candidates.map(x=>{const st=stepState(x.track.id,x.module.id),available=st.lab&&st.evidence&&st.breakfix;return `<article class="boss-card ${available?'available':''}"><div class="boss-icon">⚔</div><span class="boss-difficulty">${available?'BOSS AVAILABLE':'PREPARE A MISSÃO'}</span><h3>${escapeHtml(x.module.title)}</h3><p>${escapeHtml(x.track.label)} · conceito + prática + diagnóstico + explicação</p><button class="btn ${available?'btn-danger':'btn-ghost'}" data-boss="${x.track.id}|${x.module.id}" ${available?'':'disabled'}>${available?'COPIAR PARA O CHAT':'BLOQUEADO'}</button></article>`}).join('');
    $$('[data-boss]').forEach(b=>{if(!b.disabled)b.onclick=()=>{const [t,m]=b.dataset.boss.split('|');exportAssessmentContext(t,m)}});
    $('#assessmentHistory').innerHTML=assessments.length?[...assessments].reverse().map(a=>{const t=track(a.track_id),m=t?.modules.find(x=>x.id===a.module_id),source=a.source_type==='war_room'?'WAR ROOM':'CHAT';return `<div class="assessment-row"><strong>${escapeHtml(m?.title||a.module_id)} <small class="assessment-source">${source}</small></strong><span>${escapeHtml(t?.short||a.track_id)}</span><span class="assessment-score">${a.score}%</span><span>Nível ${a.validated_level||'—'} · ${fmtDate(a.created_at)}</span></div>`}).join(''):'<div class="panel" style="padding:14px"><p class="muted">Nenhuma avaliação registrada ainda.</p></div>';
  }

  async function importAssessment(obj){
    if(!features.v5){toast('Rode supabase_v5_migration.sql antes de importar avaliações.');return}
    if(!obj.track_id||!obj.module_id||!Number.isFinite(Number(obj.score)))throw new Error('JSON precisa de track_id, module_id e score.');
    const row=await store.addAssessment({track_id:obj.track_id,module_id:obj.module_id,score:Number(obj.score),validated_level:Number(obj.validated_level||0),summary:obj.summary||null,strengths:obj.strengths||[],gaps:obj.gaps||[]});assessments.push(row);
    const old=recFor(obj.track_id,obj.module_id)||{track_id:obj.track_id,module_id:obj.module_id,lab_done:true,evidence_done:true,breakfix_done:true,portfolio_done:false};
    const p=await store.upsertProgress({...old,track_id:obj.track_id,module_id:obj.module_id,assessment_score:Number(obj.score),validated_level:Number(obj.validated_level||0)});const i=moduleProgress.findIndex(r=>r.track_id===obj.track_id&&r.module_id===obj.module_id);if(i>=0)moduleProgress[i]=p;else moduleProgress.push(p);renderAll();toast('Boss Battle importada e progresso atualizado.');
  }

  function sessionsIn(days){const cutoff=Date.now()-days*DAY;return sessions.filter(s=>s.finished_at&&new Date(s.started_at).getTime()>=cutoff)}
  function renderReports(){
    const ss=sessionsIn(reportDays),mins=ss.reduce((n,s)=>n+A.minutes(s),0),practical=ss.filter(s=>s.practical_done).length,evIds=new Set(evidence.filter(e=>new Date(e.created_at).getTime()>=Date.now()-reportDays*DAY).map(e=>e.session_id)),docs=moduleProgress.filter(r=>r.portfolio_done).length,bf=moduleProgress.filter(r=>r.breakfix_done).length;
    $('#reportSummary').innerHTML=[['Sessões',ss.length],['Tempo',fmtMinutes(mins)],['Labs práticos',practical],['Artefatos Git',docs]].map(([a,b])=>`<div class="stat-tile"><span>${a}</span><strong>${b}</strong></div>`).join('');
    const areaMins=C.tracks.map(t=>({t,min:ss.filter(s=>s.area===t.area).reduce((n,s)=>n+A.minutes(s),0)})),max=Math.max(1,...areaMins.map(x=>x.min));
    $('#reportWorldBars').innerHTML=areaMins.map(x=>`<div class="metric-row"><span>${escapeHtml(x.t.short)}</span><div class="metric-bar"><div style="width:${Math.round(x.min/max*100)}%;background:${x.t.id==='dba'?'var(--copper)':x.t.id==='aws'?'var(--amber)':'var(--emerald)'}"></div></div><strong>${fmtMinutes(x.min)}</strong></div>`).join('');
    $('#reportQuality').innerHTML=[['Prática',ss.length?Math.round(practical/ss.length*100):0],['Evidência',ss.length?Math.round(ss.filter(s=>evIds.has(s.id)).length/ss.length*100):0],['Break & Fix total',bf],['Bosses',assessments.length]].map(([a,b])=>`<div class="quality-cell"><span>${a}</span><strong>${typeof b==='number'&&a!=='Break & Fix total'&&a!=='Bosses'?b+'%':b}</strong></div>`).join('');
    const insights=[];const english=areaMins.find(x=>x.t.id==='english')?.min||0,aws=areaMins.find(x=>x.t.id==='aws')?.min||0,dba=areaMins.find(x=>x.t.id==='dba')?.min||0;
    if(ss.length===0)insights.push(['warn','Sem execução no período','O próximo dado precisa vir de uma sessão real, não de reorganização.']);
    if(english===0&&ss.length>=2)insights.push(['warn','Inglês técnico ficou zerado','Acople 10–15 minutos de documentação em inglês a um lab já feito.']);
    if(moduleProgress.filter(r=>r.lab_done&&!r.breakfix_done).length)insights.push(['warn','Há labs sem Break & Fix',`${moduleProgress.filter(r=>r.lab_done&&!r.breakfix_done).length} módulo(s) têm execução, mas ainda não provaram troubleshooting.`]);
    if(moduleProgress.filter(r=>r.evidence_done&&!r.portfolio_done).length)insights.push(['','Conhecimento ainda não virou portfólio',`${moduleProgress.filter(r=>r.evidence_done&&!r.portfolio_done).length} módulo(s) têm evidência e ainda não têm artefato Git.`]);
    if(aws>dba*2&&dba>0)insights.push(['','AWS está puxando a semana','Natural no horário de trabalho. Preserve ao menos um bloco de DBA fora do expediente.']);
    if(practical&&practical===ss.length)insights.push(['good','100% das sessões foram práticas','O padrão execução > planejamento está funcionando neste período.']);
    const latestWar=[...assessments].filter(a=>a.source_type==='war_room').sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0];
    if(latestWar?.gaps?.length)insights.push(['warn','War Room encontrou um gap',String(latestWar.gaps[0])]);
    else if(latestWar&&Number(latestWar.score)>=85)insights.push(['good','War Room validou autonomia prática',`Último incidente: ${latestWar.score}% e nível ${latestWar.validated_level||'—'}.`]);
    if(!insights.length)insights.push(['good','Baseline sendo construído','Continue registrando sessões; os padrões ficam melhores com mais amostra.']);
    $('#reportInsights').innerHTML=insights.map(([tone,title,text])=>`<article class="insight-card ${tone}"><h4>${title}</h4><p>${text}</p></article>`).join('');
  }

  function portfolioPath(m){const mt=String(m.portfolio||'').match(/(docs\/[A-Za-z0-9_\-\/]+\.md)/);return mt?mt[1]:null}
  function renderPortfolio(){
    $('#portfolioProjects').innerHTML=C.tracks.map(t=>{const done=t.modules.filter(m=>recFor(t.id,m.id)?.portfolio_done).length;return `<article class="portfolio-card"><span class="kicker">${t.short}</span><h3>${escapeHtml(t.label)}</h3><p>${escapeHtml(t.description)}</p><span class="project-count">${done}/${t.modules.length}</span><div class="progress-track"><div style="width:${Math.round(done/t.modules.length*100)}%;background:${t.id==='dba'?'var(--copper)':t.id==='aws'?'var(--amber)':'var(--emerald)'}"></div></div></article>`}).join('');
    $('#portfolioArtifacts').innerHTML=allModules().map(x=>{const path=portfolioPath(x.module),done=!!recFor(x.track.id,x.module.id)?.portfolio_done;return `<div class="artifact-row"><strong>${done?'✓':'○'} ${escapeHtml(x.module.title)}</strong><span>${escapeHtml(x.track.short)}</span>${path?`<a href="${REPO_URL}/blob/main/${path}" target="_blank" rel="noopener">${done?'ABRIR':'CAMINHO'} ↗</a>`:'<span>documento integrado</span>'}</div>`}).join('');
  }

  function renderHistory(){const rows=[...sessions].filter(s=>s.finished_at).sort((a,b)=>new Date(b.started_at)-new Date(a.started_at)).slice(0,80);$('#historyList').innerHTML=`<div class="history-head"><span>Data</span><span>Mundo</span><span>Missão</span><span>Tempo</span><span>Humor</span><span>Prática</span></div>`+(rows.length?rows.map(s=>`<div class="history-row"><span>${fmtDate(s.started_at)}</span><span>${escapeHtml(s.area)}</span><strong>${escapeHtml(s.task_title||'Sessão')}</strong><span>${A.minutes(s)}m</span><span>${s.mood==='sim'?'😄':s.mood==='nao'?'💀':'😐'}</span><span>${s.practical_done?'✓':'○'}${s.notes==='Registro retroativo pelo FORGE'?' · retro':''}</span></div>`).join(''):'<p class="muted" style="padding:12px">Nenhuma sessão encerrada ainda.</p>')}
  function renderParking(){$('#parkingList').innerHTML=parking.length?parking.map(x=>`<div class="parking-item"><span>${escapeHtml(x.topic)}</span><button data-del-parking="${x.id}">×</button></div>`).join(''):'<p class="muted">Nada estacionado.</p>';$$('[data-del-parking]').forEach(b=>b.onclick=async()=>{await store.delParking(b.dataset.delParking);await refresh()})}

  function setView(name,trackId=null){$$('.view').forEach(v=>v.classList.add('hidden'));$(`#${name}View`)?.classList.remove('hidden');$$('.nav-item').forEach(n=>n.classList.toggle('active',trackId?n.dataset.track===trackId:n.dataset.view===name));const labels={home:'INÍCIO',journey:'MAPA DA JORNADA',today:'MODO EXECUÇÃO',recall:'RECALL',warroom:'WAR ROOM',assessments:'AVALIAÇÕES',reports:'RELATÓRIOS',portfolio:'PORTFÓLIO',history:'HISTÓRICO',parking:'DEPOIS',track:trackId?track(trackId).label.toUpperCase():'MUNDO'};$('#breadcrumb').textContent=`FORGE / ${labels[name]||name.toUpperCase()}`}

  function friendlyAuthError(err){
    const msg=String(err?.message||err||'Erro de autenticação');
    const low=msg.toLowerCase();
    if(low.includes('invalid login credentials')) return 'Email ou senha incorretos. Se você ainda não confirmou o email, confirme primeiro.';
    if(low.includes('email not confirmed')) return 'Seu email ainda não foi confirmado. Abra o email do Supabase e confirme a conta.';
    if(low.includes('user already registered')) return 'Essa conta já existe. Use a aba Entrar ou recupere a senha.';
    if(low.includes('password should be')) return 'A senha precisa ter pelo menos 6 caracteres.';
    if(low.includes('rate limit')) return 'Muitas tentativas em sequência. Aguarde um pouco e tente novamente.';
    return msg;
  }

  function setAuthMessage(text,tone='info'){
    $('#authMessage').textContent=text||'';
    $('#authMessage').dataset.tone=tone;
  }

  function populatePastModules(trackId,selected=null){
    const t=track(trackId),sel=$('#pastModule');
    sel.innerHTML=t.modules.map(m=>`<option value="${m.id}">${escapeHtml(m.title)}</option>`).join('');
    if(selected&&t.modules.some(m=>m.id===selected))sel.value=selected;
  }

  function openBackfill(preset=null){
    const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
    $('#pastDate').value=dateKey(yesterday);
    $('#pastTrack').value='aws';
    populatePastModules('aws','aws-01');
    $('#pastStartTime').value='09:00';
    $('#pastDuration').value='';
    $('#pastTitle').value='';
    $('#pastEvidence').value='';
    $('#pastLearned').value='';
    $('#pastPractical').checked=true;
    $('#pastLabComplete').checked=false;
    $('#pastEvidenceComplete').checked=false;
    $('#pastBreakfix').checked=false;
    if(preset)applyPastPreset(preset);
    $('#backfillDialog').showModal();
  }

  function applyPastPreset(preset){
    $('#pastTrack').value='aws';
    const presets={
      'nifi-setup':{module:'aws-01',title:'Configuração do Apache NiFi',evidence:'Apache NiFi instalado/configurado e ambiente funcionando localmente.',learned:'Preparei o ambiente de ingestão e validei que o NiFi estava operacional.'},
      'bitrix-leads':{module:'aws-01',title:'Consumo de leads do Bitrix no Apache NiFi',evidence:'Fluxo no NiFi consumindo dados de leads do Bitrix e recebendo payloads/FlowFiles.',learned:'Avancei da configuração para uma ingestão real da API do Bitrix.'},
      's3-prefix':{module:'aws-03',title:'Organização local de pastas simulando prefixos do S3',evidence:'Estrutura local organizada em pastas para simular bucket/prefixos e visualizar como os dados serão separados no S3.',learned:'Pratiquei a organização lógica de objetos/prefixos antes de gravar no S3 real.'}
    };
    const p=presets[preset];if(!p)return;
    populatePastModules('aws',p.module);
    $('#pastTitle').value=p.title;$('#pastEvidence').value=p.evidence;$('#pastLearned').value=p.learned;
  }

  async function saveBackfill(e){
    e.preventDefault();
    const addAnother=e.submitter?.dataset.backfillAfter==='again';
    const t=track($('#pastTrack').value),moduleId=$('#pastModule').value,m=t.modules.find(x=>x.id===moduleId);
    const duration=Number($('#pastDuration').value);
    if(!duration||duration<1){toast('Informe uma duração aproximada em minutos.');return}
    const start=new Date(`${$('#pastDate').value}T${$('#pastStartTime').value}:00`);
    if(Number.isNaN(start.getTime())){toast('Data ou hora inválida.');return}
    if(start.getTime()>Date.now()+5*60000){toast('Registro retroativo não pode começar no futuro.');return}
    const finish=new Date(start.getTime()+duration*60000);
    const practical=$('#pastPractical').checked,labComplete=$('#pastLabComplete').checked,evidenceComplete=$('#pastEvidenceComplete').checked,breakfix=$('#pastBreakfix').checked,evidenceText=$('#pastEvidence').value.trim();
    try{
      const row=await store.insertPastSession({user_id:uid(),area:t.area,track_id:t.id,module_id:m.id,task_title:$('#pastTitle').value.trim(),started_at:start.toISOString(),finished_at:finish.toISOString(),duration_minutes:duration,mood:'mais-ou-menos',practical_done:practical,notes:'Registro retroativo pelo FORGE',learned:$('#pastLearned').value.trim()||null});
      if(evidenceText)await store.insertEvidence({user_id:uid(),session_id:row.id,area:t.area,description:evidenceText,created_at:finish.toISOString()});
      if(features.v5){
        const old=recFor(t.id,m.id)||{track_id:t.id,module_id:m.id,lab_done:false,evidence_done:false,breakfix_done:false,portfolio_done:false};
        await store.upsertProgress({...old,track_id:t.id,module_id:m.id,lab_done:old.lab_done||labComplete,evidence_done:old.evidence_done||evidenceComplete,breakfix_done:old.breakfix_done||breakfix});
      }
      await refresh();
      if(addAnother){
        const keepDate=$('#pastDate').value,keepTrack=$('#pastTrack').value,keepModule=$('#pastModule').value,keepTime=$('#pastStartTime').value;
        $('#pastDuration').value='';$('#pastTitle').value='';$('#pastEvidence').value='';$('#pastLearned').value='';$('#pastBreakfix').checked=false;$('#pastLabComplete').checked=false;$('#pastEvidenceComplete').checked=false;
        $('#pastDate').value=keepDate;$('#pastTrack').value=keepTrack;populatePastModules(keepTrack,keepModule);$('#pastStartTime').value=keepTime;
        toast('Salvo. Pode registrar a próxima atividade.');
      }else{
        $('#backfillDialog').close();setView('history');toast('Atividade passada registrada no histórico e no mapa de hábito.');
      }
    }catch(err){toast(err.message)}
  }

  function initBindings(){
    document.querySelectorAll('.auth-tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.auth-tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');authMode=b.dataset.authMode;$('#authSubmit').textContent=authMode==='signin'?'Entrar':'Criar conta';$('#forgotPasswordBtn').classList.toggle('hidden',authMode!=='signin');setAuthMessage('')});
    $('#togglePasswordBtn').onclick=()=>{const input=$('#password'),show=input.type==='password';input.type=show?'text':'password';$('#togglePasswordBtn').textContent=show?'ocultar':'mostrar'};
    $('#forgotPasswordBtn').onclick=async()=>{const email=$('#email').value.trim();if(!email){setAuthMessage('Digite seu email acima para eu enviar a recuperação.','warn');return}try{await store.resetPassword(email);setAuthMessage('Enviei o link de recuperação. Abra o email e volte por ele para definir uma nova senha.','ok')}catch(err){setAuthMessage(friendlyAuthError(err),'warn')}};
    $('#authForm').onsubmit=async e=>{e.preventDefault();setAuthMessage('Verificando sua conta...');const email=$('#email').value.trim(),password=$('#password').value;try{
      if(authMode==='signin'){const r=await store.signIn(email,password);if(r?.session?.user)await enter(r.session.user);else setAuthMessage('O login não criou uma sessão válida. Confirme seu email e tente novamente.','warn')}
      else{const r=await store.signUp(email,password);if(r?.session?.user)await enter(r.session.user);else setAuthMessage('Conta criada. Agora confirme o email enviado pelo Supabase e depois use a aba Entrar.','ok')}
    }catch(err){setAuthMessage(friendlyAuthError(err),'warn')}};
    $('#logoutBtn').onclick=()=>store.signOut();$$('.nav-item').forEach(b=>b.onclick=()=>b.dataset.track?openTrack(b.dataset.track):setView(b.dataset.view));$$('[data-view-jump]').forEach(b=>b.onclick=()=>setView(b.dataset.viewJump));
    $('#quickStartBtn').onclick=()=>{if(currentSession){renderToday();setView('today');return}const m=displayMission();startModule(m.track.id,m.module.id)};
    $('#topBackfillBtn').onclick=()=>openBackfill();
    $$('.mood-btn').forEach(b=>b.onclick=()=>{selectedMood=b.dataset.mood;$$('.mood-btn').forEach(x=>x.classList.toggle('active',x===b))});
    $('#startSessionBtn').onclick=startSession;$('#finishSessionBtn').onclick=()=>$('#finishDialog').showModal();$('#finishForm').onsubmit=finishSession;$('#evidenceForm').onsubmit=saveEvidence;$('#saveClosureBtn').onclick=saveClosure;
    $('#parkingForm').onsubmit=async e=>{e.preventDefault();const topic=$('#parkingInput').value.trim();if(!topic)return;await store.addParking(topic);$('#parkingInput').value='';await refresh()};
    $('#openBackfillBtn').onclick=()=>openBackfill();
    $('#pastTrack').onchange=()=>populatePastModules($('#pastTrack').value);
    document.querySelectorAll('[data-past-preset]').forEach(b=>b.onclick=()=>applyPastPreset(b.dataset.pastPreset));
    $('#backfillForm').onsubmit=saveBackfill;
    $('#passwordRecoveryForm').onsubmit=async e=>{e.preventDefault();try{await store.updatePassword($('#newPassword').value);$('#newPassword').value='';$('#passwordDialog').close();toast('Senha atualizada. Seu login está pronto.')}catch(err){toast(friendlyAuthError(err))}};
    $$('[data-close-dialog]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.closeDialog).close());$('#importAssessmentBtn').onclick=()=>$('#assessmentDialog').showModal();
    $('#assessmentImportForm').onsubmit=async e=>{e.preventDefault();try{const obj=JSON.parse($('#assessmentJson').value);await importAssessment(obj);$('#assessmentJson').value='';$('#assessmentDialog').close()}catch(err){toast(err.message)}};
    $$('[data-report-days]').forEach(b=>b.onclick=()=>{reportDays=Number(b.dataset.reportDays);$$('[data-report-days]').forEach(x=>x.classList.toggle('active',x===b));renderReports()});
  }

  async function startSession(){
    const t=track(selectedTrackId),m=t.modules.find(x=>x.id===selectedModuleId)||t.modules[currentIndex(t)],started=new Date();let planned=null,latency=null;const time=$('#plannedStartTime').value;if(time){const [h,min]=time.split(':').map(Number);planned=new Date(started);planned.setHours(h,min,0,0);latency=Math.max(0,Math.round((started-planned)/60000))}
    try{currentSession=await store.insertSession({user_id:uid(),area:t.area,track_id:t.id,module_id:m.id,task_title:$('#taskTitleInput').value.trim()||m.mission,started_at:started.toISOString(),planned_start_at:planned?.toISOString()||null,start_latency_minutes:latency,mood:selectedMood});await refresh();toast('Ponto batido. Agora executa.')}catch(err){toast(err.message)}
  }
  async function finishSession(e){
    e.preventDefault();if(!currentSession)return;const finished=new Date(),practical=$('#didPractical').checked;
    try{await store.updateSession(currentSession.id,{finished_at:finished.toISOString(),duration_minutes:Math.max(1,Math.round((finished-new Date(currentSession.started_at))/60000)),practical_done:practical,notes:$('#sessionNotes').value.trim()||null});if(practical&&features.v5){const t=currentSession.track_id||selectedTrackId,m=currentSession.module_id||selectedModuleId,old=recFor(t,m)||{track_id:t,module_id:m,lab_done:false,evidence_done:false,breakfix_done:false,portfolio_done:false};await store.upsertProgress({...old,track_id:t,module_id:m,lab_done:true})}$('#finishDialog').close();$('#didPractical').checked=false;$('#sessionNotes').value='';currentSession=null;await refresh();toast('Sessão encerrada e registrada.')}catch(err){toast(err.message)}
  }
  async function saveEvidence(e){
    e.preventDefault();const description=$('#evidenceText').value.trim();if(!description)return;const todays=sessions.filter(s=>dateKey(s.started_at)===dateKey(new Date())),target=currentSession||todays[todays.length-1];if(!target){toast('Bata o ponto antes de registrar evidência.');return}
    try{await store.insertEvidence({user_id:uid(),session_id:target.id,area:target.area,description});if(features.v5){const t=target.track_id||selectedTrackId,m=target.module_id||selectedModuleId,old=recFor(t,m)||{track_id:t,module_id:m,lab_done:false,evidence_done:false,breakfix_done:false,portfolio_done:false};await store.upsertProgress({...old,track_id:t,module_id:m,evidence_done:true})}$('#evidenceText').value='';await refresh();toast('Evidência salva.')}catch(err){toast(err.message)}
  }
  async function saveClosure(){
    const learned=$('#learnedInput').value.trim(),doubt=$('#doubtInput').value.trim(),next=$('#nextInput').value.trim();if(!learned&&!doubt&&!next)return;const todays=sessions.filter(s=>dateKey(s.started_at)===dateKey(new Date())),target=currentSession||todays[todays.length-1];if(!target){toast('Não há sessão para fechar.');return}
    try{await store.updateSession(target.id,{learned,doubt,next_action:next});$('#learnedInput').value=$('#doubtInput').value=$('#nextInput').value='';await refresh();toast('Fechamento salvo.')}catch(err){toast(err.message)}
  }

  async function enter(u){
    user=u;$('#authView').classList.add('hidden');$('#appView').classList.remove('hidden');$('#dbIssueBanner')?.classList.add('hidden');
    try{
      await store.seed(u.id);await refresh();if(warController)await warController.mount();if(recallController)await recallController.mount();setView('home');
      if(!features.v5&&!DEMO)setTimeout(()=>toast('V5 carregada. Rode supabase_v5_migration.sql para salvar progresso RPG, Bosses e XP.'),700);
    }catch(err){
      console.error(err);
      const msg=String(err?.message||err);
      if(/permission denied|row-level security|42501/i.test(msg)){
        $('#dbIssueBanner')?.classList.remove('hidden');setView('home');toast('Sua conta entrou, mas o Supabase ainda está bloqueando as tabelas.');
      }else toast('Não consegui carregar seus dados: '+msg);
    }
  }
  async function boot(){
    $('#dateLabel').textContent=fmtLong(new Date()).toUpperCase();initBindings();
    if(DEMO){await enter({id:'demo',email:'demo@local'});return}
    const s=await store.session();if(s?.user)await enter(s.user);else{$('#authView').classList.remove('hidden');$('#appView').classList.add('hidden')}
    store.onAuth(async (s,event)=>{if(s?.user&&!user)await enter(s.user);if(event==='PASSWORD_RECOVERY'){if(s?.user&&!user)await enter(s.user);setTimeout(()=>$('#passwordDialog').showModal(),100)}if(!s?.user){user=null;$('#appView').classList.add('hidden');$('#authView').classList.remove('hidden')}});
  }
  boot().catch(err=>{console.error(err);toast(`Erro ao iniciar: ${err.message}`)});
})();
