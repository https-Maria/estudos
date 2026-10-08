(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.ForgeWarRoomController=api;
})(typeof self!=='undefined'?self:this,function(){
  const normalize=(v)=>String(v||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().trim().replace(/\s+/g,' ');

  function matchCommand(incident,input){
    const q=normalize(input);
    if(!q)return null;
    return (incident.actions||[]).filter(a=>a.kind==='command').find(a=>{
      const candidates=[a.command,a.label,...(a.aliases||[])].map(normalize);
      return candidates.some(x=>x===q||q.includes(x)||x.includes(q));
    })||null;
  }

  function createController(opts={}){
    const Engine=opts.engine,Scoring=opts.scoring,Incidents=opts.incidents;
    if(!Engine||!Scoring||!Incidents)throw new Error('War Room dependencies are required');

    const $=s=>document.querySelector(s);
    const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
    const fmtDate=v=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(v));
    let runs=[],activeDbRun=null,run=null,incident=null,busy=false,consoleMessage='';

    async function integrateRun(dbRow){
      if(!opts.onComplete||dbRow?.integrated_at||!['resolved','failed'].includes(dbRow?.status))return dbRow;
      const found=Incidents.getIncident(dbRow.incident_id);
      if(!found||!dbRow.runtime||!Object.keys(dbRow.runtime).length)return dbRow;
      const runtime=Engine.deserialize(dbRow.runtime);
      runtime.runId=dbRow.id;
      const score=found.score(runtime,Scoring);
      const debrief=found.debrief(runtime,score);
      await opts.onComplete({incident:found,run:runtime,score,debrief,dbRun:dbRow});
      const integrated_at=new Date().toISOString();
      const updated=await opts.updateRun(dbRow.id,{integrated_at,updated_at:integrated_at});
      return {...dbRow,...updated,integrated_at};
    }

    async function syncPendingIntegrations(){
      for(let i=0;i<runs.length;i++){
        const row=runs[i];
        if(!row.integrated_at&&['resolved','failed'].includes(row.status)){
          try{runs[i]=await integrateRun(row)}
          catch(err){console.warn('War Room integration',err);opts.toast('Incidente salvo, mas a integração com a trilha será tentada novamente.')}
        }
      }
    }

    async function refreshRuns(){
      runs=await opts.listRuns();
      await syncPendingIntegrations();
      const active=runs.find(r=>r.status==='active'&&r.runtime&&Object.keys(r.runtime).length);
      if(active){
        const found=Incidents.getIncident(active.incident_id);
        if(found){
          incident=found;activeDbRun=active;run=Engine.deserialize(active.runtime);
          run.runId=active.id;
        }
      }
      render();
    }

    function latestRunFor(id){
      return runs.filter(r=>r.incident_id===id).sort((a,b)=>new Date(b.started_at)-new Date(a.started_at))[0]||null;
    }

    function statusLabel(db){
      if(!db)return 'NÃO INICIADO';
      if(db.status==='active')return 'EM ANDAMENTO';
      if(db.status==='resolved')return db.score>=70?'RESOLVIDO':'CONCLUÍDO';
      if(db.status==='failed')return 'FALHOU';
      return String(db.status||'').toUpperCase();
    }

    function renderCatalog(){
      const list=Incidents.listIncidents();
      if($('#warroomCount'))$('#warroomCount').textContent=String(list.length);
      const el=$('#warroomCatalog');
      if(!el)return;
      el.innerHTML=list.map(i=>{
        const last=latestRunFor(i.id);
        const active=last?.status==='active';
        return `<article class="war-ticket ${active?'active':''}">
          <div class="war-ticket-top">
            <span class="war-priority">${escapeHtml(i.priority)}</span>
            <span class="war-status">${statusLabel(last)}</span>
          </div>
          <span class="kicker">${escapeHtml(i.id)} · ${escapeHtml(i.competency)}</span>
          <h3>${escapeHtml(i.title)}</h3>
          <p>${escapeHtml(i.subtitle)}</p>
          <div class="war-ticket-meta"><span>SLA <b>${i.slaMinutes}m</b></span><span>${escapeHtml(i.difficulty)}</span>${last?.score!=null?`<span>score <b>${last.score}</b></span>`:''}</div>
          <button class="btn ${active?'btn-danger':'btn-secondary'}" data-war-open="${i.id}">${active?'RETOMAR INCIDENTE':last?'NOVA TENTATIVA':'ABRIR CHAMADO'}</button>
        </article>`;
      }).join('');
      el.querySelectorAll('[data-war-open]').forEach(b=>b.onclick=()=>openIncident(b.dataset.warOpen));
    }

    function renderAttemptHistory(){
      const el=$('#warroomHistory');if(!el)return;
      const completed=runs.filter(r=>r.status!=='active').slice(0,12);
      el.innerHTML=completed.length?completed.map(r=>{
        const i=Incidents.getIncident(r.incident_id);
        const source=r.integrated_at?'TRILHA ATUALIZADA':'PENDENTE DE INTEGRAÇÃO';
        return `<div class="war-history-row">
          <div><strong>${escapeHtml(i?.title||r.incident_id)}</strong><span>${escapeHtml(r.incident_id)} · ${fmtDate(r.finished_at||r.started_at)}</span></div>
          <span>${r.elapsed_minutes||0}m</span>
          <span class="war-history-score">${r.score??'—'}</span>
          <span class="war-history-status">${escapeHtml(source)}</span>
        </div>`;
      }).join(''):'<article class="panel war-history-empty"><p class="muted">Nenhuma tentativa encerrada ainda.</p></article>';
    }

    async function openIncident(id){
      const found=Incidents.getIncident(id);if(!found)return;
      const existing=runs.find(r=>r.status==='active'&&r.incident_id===id&&r.runtime&&Object.keys(r.runtime).length);
      if(existing){
        incident=found;activeDbRun=existing;run=Engine.deserialize(existing.runtime);run.runId=existing.id;consoleMessage='';render();return;
      }
      if(busy)return;busy=true;
      try{
        incident=found;
        const runtime=Engine.createRun(incident);
        const db=await opts.createRun({
          incident_id:incident.id,
          track_id:incident.trackId,
          module_id:incident.moduleId,
          status:'active',
          current_state:runtime.state,
          elapsed_minutes:0,
          sla_minutes:incident.slaMinutes,
          runtime
        });
        runtime.runId=db.id;
        activeDbRun=db;run=runtime;
        await opts.updateRun(db.id,{runtime});
        runs=[db,...runs];
        consoleMessage='Incidente iniciado. A causa raiz não está visível: investigue por evidências.';
        render();
      }catch(err){opts.toast(err.message||String(err))}
      finally{busy=false}
    }

    function render(){
      renderCatalog();
      renderAttemptHistory();
      const wrap=$('#warroomWorkspace');if(!wrap)return;
      if(!incident||!run){
        wrap.innerHTML=`<article class="panel warroom-empty"><div class="warroom-empty-icon">☣</div><div><span class="kicker">FILA DE INCIDENTES</span><h3>Escolha um chamado para começar.</h3><p>O cenário não entrega a causa raiz. Você decide o que investigar, quanto tempo gastar e quando intervir.</p></div></article>`;
        return;
      }
      if(run.resolved||run.failed){renderDebrief(wrap);return}

      const remaining=Math.max(0,incident.slaMinutes-run.elapsedMinutes);
      const pct=Math.min(100,Math.round(run.elapsedMinutes/incident.slaMinutes*100));
      const available=Engine.availableActions(incident,run);
      const conversations=incident.actions.filter(a=>a.kind==='conversation');
      const decisions=incident.actions.filter(a=>a.kind==='decision');
      const unlocked=run.evidenceUnlocked.map(id=>incident.evidence[id]).filter(Boolean);

      const timeline=run.actionsTaken.length?run.actionsTaken.map(ev=>{
        const a=incident.actions.find(x=>x.id===ev.actionId);
        return `<div class="war-timeline-item"><span>${String(ev.sequence).padStart(2,'0')}</span><div><strong>${escapeHtml(a?.label||ev.actionId)}</strong><small>+${ev.timeCost} min · ${escapeHtml(a?.kind||'ação')}</small></div></div>`;
      }).join(''):'<p class="muted">Nenhuma ação tomada. O relógio só anda quando você age.</p>';

      wrap.innerHTML=`
        <div class="war-toolbar">
          <div><span class="war-priority">${escapeHtml(incident.priority)}</span><span class="kicker">${escapeHtml(incident.id)} · ${escapeHtml(incident.brief.environment)}</span><h2>${escapeHtml(incident.title)}</h2></div>
          <div class="war-sla"><span>SLA</span><strong>${remaining}m</strong><small>${run.elapsedMinutes}m consumidos</small><div><i style="width:${pct}%"></i></div></div>
        </div>

        <div class="war-layout">
          <section class="war-main">
            <article class="panel war-brief">
              <div class="war-brief-head"><span class="kicker">CHAMADO ABERTO POR ${escapeHtml(incident.brief.openedBy)}</span><span>${escapeHtml(incident.brief.company)} · ${escapeHtml(incident.brief.system)}</span></div>
              <h3>${escapeHtml(incident.brief.impact)}</h3>
              <p>${escapeHtml(incident.brief.message)}</p>
            </article>

            <article class="panel war-section">
              <div class="war-section-title"><span class="kicker">COMUNICAÇÃO</span><h3>Falar com alguém</h3></div>
              <div class="war-action-grid">
                ${conversations.map(a=>{
                  const done=run.actionsTaken.some(x=>x.actionId===a.id),enabled=available.some(x=>x.id===a.id);
                  return `<button class="war-action-card ${done?'done':''}" data-war-action="${a.id}" ${(!enabled||done)?'disabled':''}><span>${escapeHtml(a.speaker||'')}</span><strong>${escapeHtml(a.label)}</strong><small>+${a.timeCost} min</small></button>`;
                }).join('')}
              </div>
            </article>

            <article class="panel war-console">
              <div class="war-console-head"><div><span class="kicker">CONSOLE SIMULADO · SQL SERVER</span><h3>Investigue por comando</h3></div><span class="war-console-dot">●</span></div>
              <div id="warConsoleOutput" class="war-console-output">${renderConsoleOutput()}</div>
              <form id="warConsoleForm" class="war-console-form">
                <span>sql&gt;</span><input id="warConsoleInput" autocomplete="off" placeholder="Ex.: dm_exec_requests, DBCC OPENTRAN, session 57"><button class="btn btn-secondary" type="submit">EXECUTAR</button>
              </form>
              <div class="war-command-hints">${available.filter(a=>a.kind==='command').slice(0,3).map(a=>`<button type="button" data-war-command-hint="${escapeHtml(a.aliases?.[0]||a.label)}">${escapeHtml(a.label)}</button>`).join('')}</div>
            </article>

            <article class="panel war-section">
              <div class="war-section-title"><span class="kicker">DECISÕES</span><h3>Intervir no ambiente</h3></div>
              <div class="war-decision-list">
                ${decisions.map(a=>{
                  const enabled=available.some(x=>x.id===a.id),done=run.actionsTaken.some(x=>x.actionId===a.id);
                  return `<button class="war-decision ${a.danger?'danger':''} ${done?'done':''}" data-war-action="${a.id}" ${(!enabled||done&&a.once)?'disabled':''}><div><strong>${escapeHtml(a.label)}</strong><p>${escapeHtml(a.description||'')}</p></div><span>+${a.timeCost}m</span></button>`;
                }).join('')}
              </div>
            </article>
          </section>

          <aside class="war-side">
            <article class="panel war-evidence">
              <span class="kicker">EVIDÊNCIAS · ${unlocked.length}/${Object.keys(incident.evidence).length}</span>
              <h3>O que você já provou</h3>
              <div class="war-evidence-list">${unlocked.length?unlocked.map(e=>`<div class="war-evidence-item"><span>${escapeHtml(e.type)}</span><strong>${escapeHtml(e.title)}</strong><p>${escapeHtml(e.body)}</p></div>`).join(''):'<p class="muted">Nenhuma evidência coletada.</p>'}</div>
            </article>
            <article class="panel war-timeline">
              <span class="kicker">LINHA DE INVESTIGAÇÃO</span>
              <h3>Suas decisões</h3>
              <div>${timeline}</div>
            </article>
          </aside>
        </div>`;

      bindWorkspace();
    }

    function renderConsoleOutput(){
      const last=[...run.actionsTaken].reverse().find(ev=>{
        const a=incident.actions.find(x=>x.id===ev.actionId);return a?.kind==='command'||a?.kind==='decision';
      });
      const action=last?incident.actions.find(x=>x.id===last.actionId):null;
      const body=consoleMessage||action?.output||'FORGE SQL CONSOLE\nAmbiente simulado. Execute uma investigação; comandos reais não são enviados a nenhum servidor.';
      return `<pre>${escapeHtml(body)}</pre>`;
    }

    function bindWorkspace(){
      $('#warConsoleForm').onsubmit=async e=>{
        e.preventDefault();
        const input=$('#warConsoleInput').value.trim();
        if(!input)return;
        const action=matchCommand(incident,input);
        if(!action){consoleMessage=`> ${input}\nComando não reconhecido neste cenário. Tente consultar requests, waits, transações abertas ou contexto de sessão.`;render();return}
        const available=Engine.availableActions(incident,run).some(x=>x.id===action.id);
        if(!available){consoleMessage=`> ${input}\nO comando é válido, mas a investigação ainda não tem contexto suficiente para esta etapa.`;render();return}
        await takeAction(action.id,{typedCommand:input});
      };
      document.querySelectorAll('[data-war-action]').forEach(b=>b.onclick=()=>takeAction(b.dataset.warAction));
      document.querySelectorAll('[data-war-command-hint]').forEach(b=>b.onclick=()=>{const input=$('#warConsoleInput');input.value=b.dataset.warCommandHint;input.focus()});
    }

    async function takeAction(actionId,input={}){
      if(busy)return;busy=true;
      try{
        const applied=Engine.applyAction(incident,run,actionId,input);
        run=applied.run;
        const action=incident.actions.find(x=>x.id===actionId);
        consoleMessage=action?.output||action?.conversation||'Ação registrada.';
        await opts.addEvent({
          run_id:activeDbRun.id,
          sequence:applied.event.sequence,
          event_type:applied.event.eventType,
          action_id:actionId,
          payload:applied.event,
          time_cost:applied.event.timeCost
        });

        const patch={current_state:run.state,elapsed_minutes:run.elapsedMinutes,runtime:run,updated_at:new Date().toISOString()};
        if(run.resolved||run.failed){
          const score=incident.score(run,Scoring);
          const debrief=incident.debrief(run,score);
          Object.assign(patch,{
            status:run.failed?'failed':'resolved',
            finished_at:new Date().toISOString(),
            score:score.score,
            technical_score:score.technical,
            communication_score:score.communication,
            architecture_score:score.architecture,
            business_score:score.business,
            result:run.result?.outcome||null,
            debrief
          });
          activeDbRun={...activeDbRun,...patch};
        }
        const saved=await opts.updateRun(activeDbRun.id,patch);
        const idx=runs.findIndex(r=>r.id===activeDbRun.id);
        if(idx>=0)runs[idx]={...runs[idx],...patch,...saved};else runs.unshift({...activeDbRun,...patch,...saved});
        activeDbRun=idx>=0?runs[idx]:runs[0];
        if(run.resolved||run.failed){
          try{
            activeDbRun=await integrateRun(activeDbRun);
            const pos=runs.findIndex(r=>r.id===activeDbRun.id);
            if(pos>=0)runs[pos]=activeDbRun;
          }catch(err){
            console.warn('War Room integration',err);
            opts.toast('Incidente salvo. A integração com a trilha será tentada novamente.');
          }
        }
        render();
        if(run.resolved)opts.toast(activeDbRun?.integrated_at?'Incidente encerrado e integrado à sua trilha.':'Incidente encerrado. Debrief liberado.');
      }catch(err){opts.toast(err.message||String(err))}
      finally{busy=false}
    }

    function renderDebrief(wrap){
      const score=incident.score(run,Scoring);
      const d=incident.debrief(run,score);
      const outcome=run.result?.outcome==='resolved_by_diagnosis';
      wrap.innerHTML=`
        <article class="war-debrief panel ${outcome?'good':'warn'}">
          <div class="war-debrief-head"><div><span class="kicker">POST-INCIDENT REVIEW · ${escapeHtml(incident.id)}</span><h2>${outcome?'Incidente resolvido por diagnóstico.':'Incidente encerrado com impacto evitável.'}</h2><p>${escapeHtml(d.summary)}</p></div><div class="war-final-score"><span>SCORE</span><strong>${score.score}</strong><small>/100</small></div></div>
          <div class="war-score-grid">
            ${[['Técnica',score.technical],['Comunicação',score.communication],['Arquitetura',score.architecture],['Negócio',score.business]].map(([n,v])=>`<div><span>${n}</span><strong>${v}</strong><i><b style="width:${v}%"></b></i></div>`).join('')}
          </div>
          <div class="war-debrief-grid">
            <section><span class="kicker">CAUSA RAIZ</span><p>${escapeHtml(d.rootCause)}</p></section>
            <section><span class="kicker">TEMPO</span><p>${run.elapsedMinutes} min consumidos · SLA ${incident.slaMinutes} min${score.slaPenalty?` · penalidade SLA ${score.slaPenalty}`:''}.</p></section>
            <section><span class="kicker">ACERTOS</span>${d.strengths.length?'<ul>'+d.strengths.map(x=>`<li>${escapeHtml(x)}</li>`).join('')+'</ul>':'<p>Nenhum ponto forte registrado.</p>'}</section>
            <section><span class="kicker">GAPS</span>${d.gaps.length?'<ul>'+d.gaps.map(x=>`<li>${escapeHtml(x)}</li>`).join('')+'</ul>':'<p>Nenhum gap relevante neste cenário.</p>'}</section>
          </div>
          <div class="war-next-study"><span class="kicker">PRÓXIMA REVISÃO</span><strong>${escapeHtml(d.nextStudy)}</strong></div>
          <div class="war-debrief-actions"><button class="btn btn-secondary" id="warBackQueue">VOLTAR À FILA</button><button class="btn btn-danger" id="warRetry">REFAZER INCIDENTE</button></div>
        </article>`;
      $('#warBackQueue').onclick=()=>{incident=null;run=null;activeDbRun=null;render()};
      $('#warRetry').onclick=async()=>{const id=incident.id;incident=null;run=null;activeDbRun=null;await openIncident(id)};
    }

    return {mount:refreshRuns,refresh:refreshRuns,render,openIncident};
  }

  return {createController,normalizeCommand:normalize,matchCommand};
});