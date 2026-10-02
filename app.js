(() => {
  const A = window.StudyAnalytics;
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

  function renderAll(){renderSessionState();renderChecklist();renderEvidence();renderDashboard();renderInsights();renderSkills();renderHistory();renderParking()}

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

  function renderDashboard(){
    const s=A.summary(sessions,evidences,competencies,{weeklyTarget:4});
    $('#attendanceValue').textContent=`${s.attendance}%`;$('#attendanceRing').style.background=`conic-gradient(var(--accent) ${s.attendance*3.6}deg,#0d131a 0)`;
    $('#dashSessions').textContent=s.sessions7;$('#dashSessionsDelta').textContent=`meta ${s.target} · ${s.activeDays7} dia(s) ativo(s)`;
    $('#dashTime').textContent=formatMinutes(s.minutes7);$('#dashTimeDelta').textContent=`${s.momentumMinutes>=0?'+':''}${s.momentumMinutes}% vs. 7 dias anteriores`;
    $('#dashPractical').textContent=`${s.practicalRate}%`;$('#dashEvidence').textContent=`${s.evidenceRate}%`;$('#dashClosure').textContent=`${s.closureRate}%`;$('#dashLatency').textContent=s.avgLatency===null?'—':`${s.avgLatency}m`;
    if(s.sessions7===0){$('#heroMessage').textContent='O próximo dado ainda não existe.';$('#heroSub').textContent='Vá em Hoje, bata o ponto e crie a primeira evidência.'}
    else if(s.attendance>=100){$('#heroMessage').textContent='Você compareceu ao que combinou.';$('#heroSub').textContent=`${s.sessions7} sessões nesta semana. Agora olhamos a qualidade da execução.`}
    else{$('#heroMessage').textContent=`Você já