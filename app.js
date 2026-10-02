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
      async getSessions(){const from=new Date();f