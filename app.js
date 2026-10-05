(() => {
  const A = window.StudyAnalytics;
  const R = window.StudyRoadmap;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const qs = new URLSearchParams(location.search);
  const DEMO = qs.get('demo') === '1';
  const cfg = window.APP_CONFIG || {};

  if (!DEMO && (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_URL.includes('SEU-PROJETO'))) {
    document.body.innerHTML = `<div style="font-family:system-ui;background:#0b0f14;color:#fff;min-height:100vh;display:grid;place-items:center;padding:24px"><div style="max-width:720px;border:1px solid #253140;border-radius:18px;padding:24px;background:#111720"><h1>Falta configurar o Supabase.</h1><p>Copie <code>config.example.js</code> para <code>config.js</code> e preencha SUPABASE_URL e SUPABASE_ANON_KEY.</p><p>Para visualizar o painel sem banco, abra <code>?demo=1</code> no final da URL.</p></div></div>`;
    return;
  }

  const defaultSkills = {
    'DBA / DP-300':['Fundamentos SQL Server','Índices','Execution Plan','Performance','Transações','Locks / Blocking','Deadlocks','DMVs / Waits','Backup / Restore','Segurança','Automação','HA / DR','Azure SQL'],
    'AWS / Data Lake':['S3','Parquet','Glue Data Catalog','Athena','Glue ETL','PySpark','Bronze / Silver / Gold','Step Functions','Lake Formation'],
    'Inglês':['There is / There are','Simple Present','Present Continuous','Simple Past','Present Perfect','Future','Modals','Questions','Prepositions','Writing','Speaking']
  };

  let currentUser=null,currentSession=null,timerHandle=null,selectedMood=null,selectedArea='DBA / DP-300',authMode='signin';
  let sessions=[],evidences=[],competencies=[],parking=[];
  let checklist={opened:false,practical:false,evidence:false,logged:false};

  const uid=()=>currentUser?.id;
  const formatDateBR=(d=new Date())=>new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(d);
  const escapeHtml=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const clock=(ms)=>{const s=Math.max(0,Math.floor(ms/1000));return `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`};
  const minutesBetween=(a,b)=>Math.max(1,Math.round((new Date(b)-new Date(a))/60000));
  const todayKey=()=>A.key(new Date());
  const moodIcon=(m)=>m==='sim'?'😄':m==='nao'?'💀':'😐';
  const formatMinutes=(m)=>m>=60?`${Math.floor(m/60)}h${m%60?` ${m%60}m`:''}`:`${m}m`;

  function makeDemoData(){
    const now=new Date();
    const areas=['DBA / DP-300','AWS / Data Lake','Inglês'];
    const tasks={
      'DBA / DP-300':['Índices e INCLUDE','Blocking no laboratório','Query Store','Backup e restore','Execution Plan'],
      'AWS / Data Lake':['Abrir Parquet','Consultar Athena','Explorar Glue Catalog','Mapear S3 Bronze'],
      'Inglês':['There is / are','Present Perfect','5 frases técnicas','Resumo do dia']
    };
    const ss=[]; const ev=[]; let id=1;
    for(let i=330;i>=1;i--){
      if([0,3,6].includes(i%7) && i%5!==0) continue;
      if(i%3===0 || i%4===0){
        const area=areas[i%3];
        const start=new Date(now); start.setDate(start.getDate()-i); start.setHours(area==='AWS / Data Lake'?10:19+(i%2),10+(i%40),0,0);
        const dur=[12,24,38,52,68][i%5]; const finish=new Date(start.getTime()+dur*60000);
        const mood=i%5===0?'nao':i%3===0?'mais-ou-menos':'sim'; const practical=i%7!==1;
        const sid=`demo-${id++}`;
        ss.push({id:sid,user_id:'demo',area,task_title:tasks[area][i%tasks[area].length],started_at:start.toISOString(),finished_at:finish.toISOString(),duration_minutes:dur,mood,practical_done:practical,start_latency_minutes:[3,8,14,22,37,55][i%6],learned:practical?'Aprendi algo aplicado.':null,doubt:i%4===0?'Revisar este ponto.':null,next_action:practical?'Continuar do ponto salvo.':null});
        if(practical && i%4!==1) ev.push({id:`ev-${sid}`,session_id:sid,user_id:'demo',area,description:`Evidência prática de ${tasks[area][i%tasks[area].length]}.`,created_at:finish.toISOString()});
      }
    }
    const comps=[]; let c=1;
    Object.entries(defaultSkills).forEach(([area,names])=>names.forEach((name,pos)=>comps.push({id:`c-${c++}`,user_id:'demo',area,name,position:pos,level:area==='DBA / DP-300'?Math.min(5,(pos%5)+1):area==='AWS / Data Lake'?Math.min(4,pos%4):Math.min(4,(pos+1)%5)})));
    return {sessions:ss,evidences:ev,competencies:comps,parking:[{id:'p1',user_id:'demo',topic:'Kubernetes',created_at:now.toISOString()},{id:'p2',user_id:'demo',topic:'Oracle',created_at:now.toISOString()}]};
  }

  function createStore(){
    if(DEMO){
      const d=makeDemoData();
      return {
        async getSession(){return {user:{id:'demo',email:'demo@local'}}}, async signIn(){return {user:{id:'demo'}}},async signUp(){return {user:{id:'demo'}}},async signOut(){location.reload()},
        onAuthChange(){},async getSessions(){return d.sessions},async getEvidence(){return d.evidences},async getCompetencies(){return d.competencies},async getParking(){return d.parking},async seedSkills(){},
        async insertSession(obj){const row={...obj,id:`demo-${Date.now()}`};d.sessions.push(row);return row},
        async updateSession(id,patch){const x=d.sessions.find(s=>s.id===id);Object.assign(x,patch);return x},
        async insertEvidence(obj){const row={...obj,id:`ev-${Date.now()}`,created_at:new Date().toISOString()};d.evidences.push(row);return row},
        async updateCompetency(id,level){const x=d.competencies.find(c=>c.id===id);x.level=level;x.updated_at=new Date().toISOString();return x},
        async insertParking(topic){const row={id:`p-${Date.now()}`,user_id:'demo',topic,created_at:new Date().toISOString()};d.parking.push(row);return row},
        async deleteParking(id){d.parking=d.parking.filter(x=>x.id!==id)}
      };
    }
    const db=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
    return {
      async getSession(){const {data,error}=await db.auth.getSession();if(error)throw error;return data.session},
      async signIn(email,password){const {data,error}=await db.auth.signInWithPassword({email,password});if(error)throw error;return data},
      async signUp(email,password){const {data,error}=await db.auth.signUp({email,password});if(error)throw error;return data},
      async signOut(){await db.auth.signOut()},onAuthChange(fn){db.auth.onAuthStateChange((_e,s)=>fn(s))},
      async getSessions(){const from=new Date();from.setDate(from.getDate()-370);const {data,error}=await db.from('study_sessions').select('*').gte('started_at',from.toISOString()).order('started_at',{ascending:true});if(error)throw error;return data||[]},
      async getEvidence(){const from=new Date();from.setDate(from.getDate()-370);const {data,error}=await db.from('evidence').select('*').gte('created_at',from.toISOString()).order('created_at',{ascending:true});if(error)throw error;return data||[]},
      async getCompetencies(){const {data,error}=await db.from('competencies').select('*').order('area').order('position');if(error)throw error;return data||[]},
      async getParking(){const {data,error}=await db.from('parking_lot').select('*').order('created_at',{ascending:false});if(error)throw error;return data||[]},
      async seedSkills(userId){const {data,error}=await db.from('competencies').select('id').limit(1);if(error)throw error;if(data?.length)return;const rows=[];Object.entries(defaultSkills).forEach(([area,names])=>names.forEach((name,position)=>rows.push({user_id:userId,area,name,level:0,position})));const r=await db.from('competencies').insert(rows);if(r.error)throw r.error},
      async insertSession(obj){const {data,error}=await db.from('study_sessions').insert(obj).select().single();if(error)throw error;return data},
      async updateSession(id,patch){const {data,error}=await db.from('study_sessions').update(patch).eq('id',id).select().single();if(error)throw error;return data},
      async insertEvidence(obj){const {data,error}=await db.from('evidence').insert(obj).select().single();if(error)throw error;return data},
      async updateCompetency(id,level){const {data,error}=await db.from('competencies').update({level,updated_at:new Date().toISOString()}).eq('id',id).select().single();if(error)throw error;return data},
      async insertParking(topic){const {data,error}=await db.from('parking_lot').insert({user_id:uid(),topic}).select().single();if(error)throw error;return data},
      async deleteParking(id){const {error}=await db.from('parking_lot').delete().eq('id',id);if(error)throw error}
    };
  }
  const store=createStore();

  async function boot(){
    $('#dateLabel').textContent=formatDateBR().toUpperCase();
    if(DEMO){currentUser={id:'demo',email:'demo@local'};await enterApp(currentUser);return;}
    const session=await store.getSession();
    if(session?.user) await enterApp(session.user); else showAuth();
    store.onAuthChange(async session=>{if(session?.user&&!currentUser)await enterApp(session.user);if(!session?.user)showAuth()});
  }

  function showAuth(){currentUser=null;$('#authView').classList.remove('hidden');$('#appView').classList.add('hidden')}
  async function enterApp(user){currentUser=user;$('#authView').classList.add('hidden');$('#appView').classList.remove('hidden');await store.seedSkills(user.id);await refreshData();switchView('dashboard')}

  async function refreshData(){
    [sessions,evidences,competencies,parking]=await Promise.all([store.getSessions(),store.getEvidence(),store.getCompetencies(),store.getParking()]);
    const todays=sessions.filter(s=>A.key(s.started_at)===todayKey());currentSession=todays.find(s=>!s.finished_at)||null;
    checklist.opened=!!todays.length;checklist.practical=todays.some(s=>s.practical_done);checklist.evidence=evidences.some(e=>A.key(e.created_at)===todayKey());checklist.logged=todays.some(s=>s.learned||s.doubt||s.next_action);
    const lastFinished=[...sessions].reverse().find(s=>s.finished_at&&s.next_action);
    if(lastFinished && !currentSession && $('#taskTitleInput').value==='Abrir o SSMS e consultar sys.databases') $('#taskTitleInput').value=lastFinished.next_action;
    renderAll();
  }

  function renderAll(){renderSessionState();renderChecklist();renderEvidence();renderDashboard();renderJourney();renderInsights();renderSkills();renderHistory();renderParking()}

  function switchView(view){
    $$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===view));$$('.view').forEach(v=>v.classList.add('hidden'));$(`#${view}View`)?.classList.remove('hidden');
    const btn=$(`.nav-item[data-view="${view}"]`);$('#viewTitle').textContent=btn?.textContent||view;
  }

  function renderSessionState(){
    const chip=$('#sessionChip');
    if(currentSession){$('#startSessionBtn').classList.add('hidden');$('#runningPanel').classList.remove('hidden');chip.textContent='sessão ativa';chip.classList.add('live');clearInterval(timerHandle);const tick=()=>$('#timer').textContent=clock(Date.now()-new Date(currentSession.started_at).getTime());tick();timerHandle=setInterval(tick,1000)}
    else{$('#startSessionBtn').classList.remove('hidden');$('#runningPanel').classList.add('hidden');chip.textContent='sem sessão ativa';chip.classList.remove('live');clearInterval(timerHandle)}
  }

  function renderChecklist(){Object.entries(checklist).forEach(([k,v])=>{const el=$(`[data-check="${k}"]`);if(!el)return;el.textContent=v?'●':'○';el.classList.toggle('done',v)})}
  function renderEvidence(){const items=evidences.filter(e=>A.key(e.created_at)===todayKey()).reverse();$('#evidenceList').innerHTML=items.length?items.map(x=>`<div class="evidence-item">${escapeHtml(x.description)}</div>`).join(''):'<div class="micro-note">Nenhuma evidência hoje ainda.</div>'}

  function renderJourney(){
    if(!R) return;
    const state=R.state(competencies);
    const current=state.currentWeek;
    const currentProgress=state.progress[state.currentIndex]||0;

    $('#journeyOverall').textContent=`${state.overall}%`;
    $('#journeySnapshotTitle').textContent=state.complete?'Jornada-base concluída':`Semana ${current.week} · ${current.title}`;
    $('#journeySnapshotText').textContent=state.complete?'Agora o mapa vira revisão, aprofundamento e prova prática.':current.why;
    $('#journeySnapshotBar').style.width=`${state.overall}%`;
    $('#journeyNowTitle').textContent=state.complete?'12 semanas construídas':`Semana ${current.week} · ${current.title}`;
    $('#journeyNowWhy').textContent=state.complete?'Você já atravessou o mapa-base. A partir daqui, o foco é consolidar, revisar lacunas e praticar cenários reais.':current.why;
    $('#journeyNowPercent').textContent=`${state.complete?100:currentProgress}%`;

    let lastPhase='';
    const html=state.weeks.map((week,index)=>{
      const progress=state.progress[index]||0;
      const status=state.complete||index<state.currentIndex?'done':index===state.currentIndex?'current':'future';
      const phaseHeader=week.phase!==lastPhase
        ? `<div class="journey-phase"><span>${escapeHtml(week.phase)}</span><div></div></div>`
        : '';
      lastPhase=week.phase;
      const tracks=Object.entries(week.tracks).map(([area,track])=>{
        const lane=area.startsWith('DBA')?'dba':area.startsWith('AWS')?'aws':'english';
        return `<div class="journey-track ${lane}">
          <div class="journey-track-head"><span class="lane-dot ${lane}"></span><strong>${escapeHtml(area)}</strong></div>
          <p>${escapeHtml(track.task)}</p>
        </div>`;
      }).join('');
      const actions=index===state.currentIndex && !state.complete
        ? `<div class="journey-actions">${Object.keys(week.tracks).map(area=>`<button class="ghost small" data-roadmap-week="${index}" data-roadmap-area="${escapeHtml(area)}">LEVAR ${area.startsWith('DBA')?'DBA':area.startsWith('AWS')?'AWS':'INGLÊS'} PARA HOJE</button>`).join('')}</div>`
        : '';
      return `${phaseHeader}<article class="journey-week ${status}">
        <div class="journey-node"><span>${week.week}</span></div>
        <div class="journey-week-card">
          <div class="journey-week-head">
            <div><span class="journey-status">${status==='done'?'CONSTRUÍDO':status==='current'?'AGORA':'DEPOIS'}</span><h3>Semana ${week.week} · ${escapeHtml(week.title)}</h3></div>
            <strong class="journey-week-percent">${progress}%</strong>
          </div>
          <p class="journey-why">${escapeHtml(week.why)}</p>
          <div class="journey-week-progress"><div style="width:${progress}%"></div></div>
          <div class="journey-tracks">${tracks}</div>
          <div class="journey-evidence"><span>EVIDÊNCIA DA SEMANA</span><p>${escapeHtml(week.evidence)}</p></div>
          ${actions}
        </div>
      </article>`;
    }).join('');

    $('#journeyTimeline').innerHTML=html;
    $('#journeyTimeline [data-roadmap-week]').forEach(btn=>btn.onclick=()=>{
      const week=R.weeks[Number(btn.dataset.roadmapWeek)];
      const area=btn.dataset.roadmapArea;
      const track=week.tracks[area];
      selectedArea=area;
      $('.area-btn').forEach(x=>x.classList.toggle('active',x.dataset.area===area));
      $('#areaBadge').textContent=area;
      $('#taskTitleInput').value=track.task;
      switchView('today');
    });
  }

  function renderDashboard(){
    const s=A.summary(sessions,evidences,competencies,{weeklyTarget:4});
    $('#attendanceValue').textContent=`${s.attendance}%`;$('#attendanceRing').style.background=`conic-gradient(var(--accent) ${s.attendance*3.6}deg,#0d131a 0)`;
    $('#dashSessions').textContent=s.sessions7;$('#dashSessionsDelta').textContent=`meta ${s.target} · ${s.activeDays7} dia(s) ativo(s)`;
    $('#dashTime').textContent=formatMinutes(s.minutes7);$('#dashTimeDelta').textContent=`${s.momentumMinutes>=0?'+':''}${s.momentumMinutes}% vs. 7 dias anteriores`;
    $('#dashPractical').textContent=`${s.practicalRate}%`;$('#dashEvidence').textContent=`${s.evidenceRate}%`;$('#dashClosure').textContent=`${s.closureRate}%`;$('#dashLatency').textContent=s.avgLatency===null?'—':`${s.avgLatency}m`;
    if(s.sessions7===0){$('#heroMessage').textContent='O próximo dado ainda não existe.';$('#heroSub').textContent='Vá em Hoje, bata o ponto e crie a primeira evidência.'}
    else if(s.attendance>=100){$('#heroMessage').textContent='Você compareceu ao que combinou.';$('#heroSub').textContent=`${s.sessions7} sessões nesta semana. Agora olhamos a qualidade da execução.`}
    else{$('#heroMessage').textContent=`Você já apareceu ${s.sessions7} vez(es) esta semana.`;$('#heroSub').textContent=`Faltam ${Math.max(0,s.target-s.sessions7)} sessão(ões) para a referência semanal — sem compensar em maratona.`}

    const trend=A.weeklyTrend(sessions,8);const max=Math.max(30,...trend.map(x=>x.minutes));$('#weeklyTrend').innerHTML=trend.map(x=>`<div class="trend-col"><div class="trend-bar-wrap" title="${x.minutes} min"><div class="trend-bar" style="height:${Math.max(2,x.minutes/max*100)}%"></div></div><strong>${x.label}</strong><span>${x.minutes}m</span></div>`).join('');
    $('#executionFunnel').innerHTML=A.funnel(sessions,evidences,30).map(x=>`<div class="funnel-row"><span>${x.label}</span><div class="funnel-track"><div class="funnel-fill" style="width:${x.rate}%"></div></div><strong>${x.rate}%</strong></div>`).join('');
    $('#noMoodProof').textContent=s.noMoodPractical;$('#noMoodTitle').textContent=s.noMoodCount?`${s.noMoodSuccessRate}% virou prática`:'Ainda sem dados';$('#noMoodText').textContent=s.noMoodCount?`${s.noMoodCount} sessão(ões) começaram no 💀 nos últimos 30 dias; ${s.noMoodPractical} ainda assim executaram algo.`:'Quando houver sessões no 💀, eu vou medir quantas ainda viraram prática.';
    renderBars('#areaBreakdown',A.areaBreakdown(sessions,30).map(x=>({label:x.area,value:x.share,text:`${x.minutes}m`})));
    renderHabitMap();
    const insights=A.generateInsights(sessions,evidences,competencies,{weeklyTarget:4});renderInsightList('#dashboardInsights',insights.slice(0,3));
    const cs=A.competencySummary(competencies);$('#competencyMini').innerHTML=cs.map(x=>`<div class="comp-mini-row"><div class="comp-mini-head"><span>${escapeHtml(x.area)}</span><span>${x.progress}% · média ${x.average}</span></div><div class="bar-track"><div class="bar-fill" style="width:${x.progress}%"></div></div></div>`).join('');
  }

  function renderHabitMap(){
    const h=A.habitMap(sessions,evidences,365);
    const monthAt=new Map(h.months.map(m=>[m.week,m.label]));
    const monthLabels=h.weeks.map((_,i)=>`<span>${monthAt.get(i)||''}</span>`).join('');
    const columns=h.weeks.map(week=>`<div class="habit-week">${week.map(d=>{
      const outside=d.inPeriod?'':' outside';
      const title=d.inPeriod
        ? `${new Date(d.date+'T12:00:00').toLocaleDateString('pt-BR')}: ${d.sessions} sessão(ões) · ${d.minutes} min · ${d.practical} prática(s) · ${d.evidence} evidência(s)`
        : '';
      return `<button class="habit-cell l${d.level}${outside}" type="button" aria-label="${escapeHtml(title)}" data-tip="${escapeHtml(title)}"></button>`;
    }).join('')}</div>`).join('');
    $('#activityHeatmap').innerHTML=`
      <div class="habit-summary">
        <div><strong>${h.activeDays}</strong><span>dias ativos</span></div>
        <div><strong>${h.currentStreak}</strong><span>sequência atual</span></div>
        <div><strong>${h.bestStreak}</strong><span>maior sequência</span></div>
        <div><strong>${formatMinutes(h.totalMinutes)}</strong><span>tempo no ano</span></div>
      </div>
      <div class="habit-scroll">
        <div class="habit-month-row"><span class="habit-axis-spacer"></span><div class="habit-months">${monthLabels}</div></div>
        <div class="habit-body">
          <div class="habit-weekdays"><span>seg</span><span></span><span>qua</span><span></span><span>sex</span><span></span><span>dom</span></div>
          <div class="habit-weeks">${columns}</div>
        </div>
      </div>
      <div class="habit-footer">
        <span class="micro-note">Passe o mouse sobre um dia para ver o que aconteceu.</span>
        <div class="habit-legend"><span>menos</span>${[0,1,2,3,4].map(n=>`<i class="habit-cell l${n}"></i>`).join('')}<span>mais</span></div>
      </div>`;

    const map=$('#activityHeatmap');
    let tip=map.querySelector('.habit-tooltip');
    if(!tip){tip=document.createElement('div');tip.className='habit-tooltip';map.appendChild(tip);}
    map.querySelectorAll('.habit-cell[data-tip]').forEach(cell=>{
      const show=(ev)=>{const t=cell.dataset.tip;if(!t)return;tip.textContent=t;tip.classList.add('show');const r=map.getBoundingClientRect();tip.style.left=`${Math.min(Math.max(8,ev.clientX-r.left+10),Math.max(8,r.width-285))}px`;tip.style.top=`${Math.max(8,ev.clientY-r.top-54)}px`;};
      cell.addEventListener('mousemove',show);cell.addEventListener('mouseenter',show);cell.addEventListener('mouseleave',()=>tip.classList.remove('show'));cell.addEventListener('focus',()=>{tip.textContent=cell.dataset.tip;tip.classList.add('show');tip.style.left='52px';tip.style.top='90px'});cell.addEventListener('blur',()=>tip.classList.remove('show'));
    });
  }

  function renderInsights(){
    const insights=A.generateInsights(sessions,evidences,competencies,{weeklyTarget:4});renderInsightList('#allInsights',insights);
    renderBars('#moodBreakdown',A.moodBreakdown(sessions,30).map(x=>({label:x.label,value:x.rate,text:`${x.practical}/${x.sessions}`})));
    renderBars('#durationBreakdown',A.durationBuckets(sessions,60).map(x=>({label:x.label,value:x.rate,text:`${x.sessions} sess.`})));
    const lat=A.latencyDistribution(sessions,60);const max=Math.max(1,...lat.map(x=>x.count));renderBars('#latencyBreakdown',lat.map(x=>({label:x.label,value:Math.round(x.count/max*100),text:String(x.count)})));
  }

  function renderInsightList(sel,items){$(sel).innerHTML=items.length?items.map(x=>`<div class="insight ${x.tone||'neutral'}"><h4>${escapeHtml(x.title)}</h4><p>${escapeHtml(x.text)}</p></div>`).join(''):'<div class="micro-note">Ainda não há dados suficientes para formar um padrão.</div>'}
  function renderBars(sel,rows){$(sel).innerHTML=rows.map(x=>`<div class="bar-row"><span class="label">${escapeHtml(x.label)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max(0,Math.min(100,x.value||0))}%"></div></div><span class="value">${escapeHtml(x.text??`${x.value}%`)}</span></div>`).join('')}

  function renderSkills(){
    const summary=A.competencySummary(competencies);$('#skillSummaryCards').innerHTML=summary.map(x=>`<div class="stat-card"><span>${escapeHtml(x.area)}</span><strong>${x.progress}%</strong><small>${x.autonomous} autônoma(s) · ${x.untouched} ainda em zero</small></div>`).join('');
    const grouped={};competencies.forEach(s=>(grouped[s.area]??=[]).push(s));
    $('#skillsGrid').innerHTML=Object.entries(grouped).map(([area,skills])=>`<div class="skill-group"><div class="eyebrow">${escapeHtml(area)}</div><h3>${skills.length} competências</h3>${skills.map(s=>`<div class="skill-row"><span>${escapeHtml(s.name)}</span><div class="level-buttons">${[0,1,2,3,4,5].map(n=>`<button class="${n===Number(s.level)?'active':''}" data-skill="${s.id}" data-level="${n}">${n}</button>`).join('')}</div></div>`).join('')}</div>`).join('');
    $$('#skillsGrid [data-skill]').forEach(btn=>btn.onclick=async()=>{await store.updateCompetency(btn.dataset.skill,Number(btn.dataset.level));await refreshData()});
  }

  function renderHistory(){
    const rows=[...sessions].filter(s=>s.finished_at).sort((a,b)=>new Date(b.started_at)-new Date(a.started_at)).slice(0,60);
    $('#historyList').innerHTML=`<div class="history-head"><span>Data</span><span>Área</span><span>Tarefa</span><span>Tempo</span><span>Humor</span><span>Prática</span></div>`+(rows.length?rows.map(s=>`<div class="history-row"><span>${new Date(s.started_at).toLocaleDateString('pt-BR')}</span><span>${escapeHtml(s.area)}</span><span>${escapeHtml(s.task_title||'sessão')}</span><span>${A.minutes(s)}m</span><span class="mood-cell">${moodIcon(s.mood)}</span><span class="${s.practical_done?'ok':'no'}">${s.practical_done?'sim':'não'}</span></div>`).join(''):'<div class="micro-note">Ainda não há sessões encerradas.</div>')
  }

  function renderParking(){
    $('#parkingList').innerHTML=parking.length?parking.map(x=>`<div class="parking-item"><span>${escapeHtml(x.topic)}</span><button data-delete-parking="${x.id}">×</button></div>`).join(''):'<div class="micro-note">Nada estacionado. Ótimo.</div>';
    $$('[data-delete-parking]').forEach(btn=>btn.onclick=async()=>{await store.deleteParking(btn.dataset.deleteParking);await refreshData()})
  }

  $$('.tab').forEach(btn=>btn.addEventListener('click',()=>{$$('.tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');authMode=btn.dataset.authTab;$('#authSubmit').textContent=authMode==='signin'?'Entrar':'Criar conta';$('#authMessage').textContent=''}));
  $('#authForm').addEventListener('submit',async e=>{e.preventDefault();const email=$('#email').value.trim(),password=$('#password').value;$('#authMessage').textContent='processando...';try{const result=authMode==='signin'?await store.signIn(email,password):await store.signUp(email,password);if(result?.user)await enterApp(result.user);else $('#authMessage').textContent='Conta criada. Se a confirmação de email estiver ativa, confirme antes de entrar.'}catch(err){$('#authMessage').textContent=err.message}});
  $('#logoutBtn').onclick=()=>store.signOut();$$('.nav-item').forEach(btn=>btn.onclick=()=>switchView(btn.dataset.view));$('#goTodayBtn').onclick=()=>switchView('today');$$('[data-jump]').forEach(btn=>btn.onclick=()=>switchView(btn.dataset.jump));
  $$('.area-btn').forEach(btn=>btn.onclick=()=>{selectedArea=btn.dataset.area;$$('.area-btn').forEach(x=>x.classList.toggle('active',x===btn));$('#areaBadge').textContent=selectedArea});
  $$('.mood').forEach(btn=>btn.onclick=()=>{selectedMood=btn.dataset.mood;$$('.mood').forEach(x=>x.classList.toggle('selected',x===btn))});

  $('#startSessionBtn').onclick=async()=>{
    selectedMood ||= 'mais-ou-menos';const now=new Date();let planned=null,latency=null;const time=$('#plannedStartTime').value;
    if(time){const [h,m]=time.split(':').map(Number);planned=new Date(now);planned.setHours(h,m,0,0);latency=Math.max(0,Math.round((now-planned)/60000))}
    try{currentSession=await store.insertSession({user_id:uid(),area:selectedArea,task_title:$('#taskTitleInput').value.trim()||'Sessão de estudo',started_at:now.toISOString(),planned_start_at:planned?.toISOString()||null,start_latency_minutes:latency,mood:selectedMood,practical_done:false});await refreshData()}catch(err){alert(err.message)}
  };
  $('#finishSessionBtn').onclick=()=>$('#finishDialog').showModal();
  $('#confirmFinishBtn').onclick=async e=>{e.preventDefault();if(!currentSession)return;const finished=new Date().toISOString();try{await store.updateSession(currentSession.id,{finished_at:finished,duration_minutes:minutesBetween(currentSession.started_at,finished),practical_done:$('#didPractical').checked,notes:$('#sessionNotes').value.trim()});$('#finishDialog').close();$('#didPractical').checked=false;$('#sessionNotes').value='';currentSession=null;await refreshData()}catch(err){alert(err.message)}};

  $('#evidenceForm').addEventListener('submit',async e=>{e.preventDefault();const description=$('#evidenceText').value.trim();if(!description)return;const todaySessions=sessions.filter(s=>A.key(s.started_at)===todayKey());const target=currentSession||todaySessions[todaySessions.length-1];try{await store.insertEvidence({user_id:uid(),session_id:target?.id||null,area:target?.area||selectedArea,description});$('#evidenceText').value='';await refreshData()}catch(err){alert(err.message)}});
  $('#saveClosureBtn').onclick=async()=>{const learned=$('#learnedInput').value.trim(),doubt=$('#doubtInput').value.trim(),next=$('#nextInput').value.trim();if(!learned&&!doubt&&!next)return;const todaySessions=sessions.filter(s=>A.key(s.started_at)===todayKey());const target=currentSession||todaySessions[todaySessions.length-1];if(!target){alert('Bata o ponto primeiro. Fechamento sem sessão não conta.');return}try{await store.updateSession(target.id,{learned,doubt,next_action:next});$('#learnedInput').value=$('#doubtInput').value=$('#nextInput').value='';await refreshData()}catch(err){alert(err.message)}};
  $('#parkingForm').addEventListener('submit',async e=>{e.preventDefault();const topic=$('#parkingInput').value.trim();if(!topic)return;await store.insertParking(topic);$('#parkingInput').value='';await refreshData()});

  boot().catch(err=>{console.error(err);alert(`Erro ao iniciar: ${err.message}`)});
})();
