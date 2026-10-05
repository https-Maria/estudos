(() => {
  const A = window.StudyAnalytics;
  const C = window.StudyCurriculum;
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
    const d={sessions:[],evidence:[],competencies:[],parking:[],progress:[],assessments:[]};
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
        async signIn(){return {user:{id:'demo'}}}, async signUp(){return {user:{id:'demo'}}}, async signOut(){location.reload()}, onAuth(){},
        async sessions(){return d.sessions}, async evidence(){return d.evidence}, async competencies(){return d.competencies}, async parking(){return d.parking},
        async progress(){return {ok:true,data:d.progress}}, async assessments(){return {ok:true,data:d.assessments}}, async seed(){},
        async insertSession(obj){const row={...obj,id:`s-${Date.now()}`}; d.sessions.push(row); return row;},
        async updateSession(id,patch){const x=d.sessions.find(s=>s.id===id); Object.assign(x,patch); return x;},
        async insertEvidence(obj){const row={...obj,id:`e-${Date.now()}`,created_at:new Date().toISOString()}; d.evidence.push(row); return row;},
        async upsertProgress(obj){let x=d.progress.find(r=>r.track_id===obj.track_id&&r.module_id===obj.module_id); if(x)Object.assign(x,obj,{updated_at:new Date().toISOString()}); else {x={...obj,id:`p-${Date.now()}`,updated_at:new Date().toISOString()};d.progress.push(x);} return x;},
        async addAssessment(obj){const row={...obj,id:`a-${Date.now()}`,created_at:new Date().toISOString()}; d.assessments.push(row); return row;},
        async addParking(topic){const row={id:`pk-${Date.now()}`,user_id:'demo',topic,created_at:new Date().toISOString()}; d.parking.push(row); return row;},
        async delParking(id){d.parking=d.parking.filter(x=>x.id!==id)}
      };
    }

    const db=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
    const safe=async(name,builder)=>{try{const r=await builder(db.from(name));if(r.error)throw r.error;return {ok:true,data:r.data||[]};}catch(e){console.warn(name,e.message);return {ok:false,data:[]};}};
    return {
      async session(){const {data,error}=await db.auth.getSession();if(error)throw error;return data.session},
      onAuth(fn){db.auth.onAuthStateChange((_e,s)=>fn(s))},
      async signIn(email,password){const {data,error}=await db.auth.signInWithPassword({email,password});if(error)throw error;return data},
      async signUp(email,password){const {data,error}=await db.auth.signUp({email,password});if(error)throw error;return data},
      async signOut(){await db.auth.signOut()},
      async sessions(){const from=new Date(Date.now()-370*DAY).toISOString();const {data,error}=await db.from('study_sessions').select('*').gte('started_at',from).order('started_at',{ascending:true});if(error)throw error;return data||[]},
      async evidence(){const from=new Date(Date.now()-370*DAY).toISOString();const {data,error}=await db.from('evidence').select('*').gte('created_at',from).order('created_at',{ascending:true});if(error)throw error;return data||[]},
      async competencies(){const {data,error}=await db.from('competencies').select('*').order('area').order('position');if(error)throw error;return data||[]},
      async parking(){const {data,error}=await db.from('parking_lot').select('*').order('created_at',{ascending:false});if(error)throw error;return data||[]},
      async progress(){return safe('module_progress',q=>q.select('*').order('updated_at',{ascending:true}))},
      async assessments(){return safe('assessments',q=>q.select('*').order('created_at',{ascending:true}))},
      async seed(userId){const {data,error}=await db.from('competencies').select('id').limit(1);if(error)throw error;if(data?.length)return;const rows=[];Object.entries(defaultSkills).forEach(([area,names])=>names.forEach((name,position)=>rows.push({user_id:userId,area,name,level:0,position})));const r=await db.from('competencies').insert(rows);if(r.error)throw r.error},
      async insertSession(obj){const payload={user_id:obj.user_id,area:obj.area,task_title:obj.task_title,started_at:obj.started_at,planned_start_at:obj.planned_start_at,start_latency_minutes:obj.start_latency_minutes,mood:obj.mood,practical_done:false};if(features.v5){payload.track_id=obj.track_id;payload.module_id=obj.module_id;}const {data,error}=await db.from('study_sessions').insert(payload).select().single();if(error)throw error;return data},
      async updateSession(id,patch){const {data,error}=await db.from('study_sessions').update(patch).eq('id',id).select().single();if(error)throw error;return data},
      async insertEvidence(obj){const {data,error}=await db.from('evidence').insert(obj).select().single();if(error)throw error;return data},
      async upsertProgress(obj){if(!features.v5)throw new Error('migration_v5_required');const payload={...obj,user_id:uid(),updated_at:new Date().toISOString()};const {data,error}=await db.from('module_progress').upsert(payload,{onConflict:'user_id,track_id,module_id'}).select().single();if(error)throw error;return data},
      async addAssessment(obj){if(!features.v5)throw new Error('migration_v5_required');const {data,error}=await db.from('assessments').insert({...obj,user_id:uid()}).select().single();if(error)throw error;return data},
      async addParking(topic){const {data,error}=await db.from('parking_lot').insert({user_id:uid(),topic}).select().single();if(error)throw error;return data},
      async delParking(id){const {error}=await db.from('parking_lot').delete().eq('id',id);if(error)throw error}
    };
  }
  const store=createStore();

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

  function renderAll(){renderProfile();renderHome();renderJourney();renderToday();renderAssessments();renderReports();renderPortfolio();renderHistory();renderParking();renderSessionState()}
  function renderProfile(){const l=levelInfo();$('#homeLevel').textContent=l.level;$('#homeXp').textContent=`${l.xp} XP`;$('#sidebarRank').textContent=`${l.rank} · Lv. ${l.level}`;$('#sidebarXpBar').style.width=`${l.pct}%`;const circumference=314;$('#levelRing').style.strokeDashoffset=String(circumference-(circumference*l.pct/100))}

  function renderHome(){
    const m=currentMission(),st=stepState(m.track.id,m.module.id);
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
    $('#missionRoomBody').innerHTML=`<div class="room-section"><div class="room-section-head"><span>01 · ENTENDER</span><b>Fundamentos</b></div><h3>Conteúdo necessário</h3><div class="topic-list">${m.topics.map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div></div>${roomSection('02 · LAB / MISSÃO','Construir',m.mission,'lab_done',st.lab)}${roomSection('03 · BRE