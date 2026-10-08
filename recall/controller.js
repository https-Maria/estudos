(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.ForgeRecallController=api;
})(typeof self!=='undefined'?self:this,function(){
  function createController(opts={}){
    const Engine=opts.engine,Bank=opts.bank;
    if(!Engine||!Bank)throw new Error('Recall dependencies are required');

    const $=s=>document.querySelector(s);
    const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
    const fmtDate=v=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(v));
    let progress=[],attempts=[],selectedTrack='all',activeId=null,revealed=false,draftAnswer='',lastFeedback=null,busy=false;

    async function refresh(){
      const [p,a]=await Promise.all([opts.listProgress(),opts.listAttempts()]);
      progress=p||[];attempts=a||[];
      if(activeId&&!Bank.get(activeId))activeId=null;
      render();
    }

    function progressFor(id){return progress.find(p=>p.item_id===id)||null}
    function trackItems(){
      return selectedTrack==='all'?Bank.items:Bank.items.filter(i=>i.trackId===selectedTrack);
    }
    function dueQueue(){
      return Engine.dueItems(trackItems(),progress,new Date(),50);
    }

    function render(){
      const queue=dueQueue();
      if(!activeId&&queue.length)activeId=queue[0].item.id;
      renderStats();
      renderFilters();
      renderQueue();
      renderQuestion();
      renderHistory();
    }

    function renderStats(){
      const el=$('#recallStats');if(!el)return;
      const mastery=Engine.mastery(progress);
      const due=dueQueue().length;
      const sevenDays=Date.now()-7*86400000;
      const reviewed7=attempts.filter(a=>new Date(a.created_at).getTime()>=sevenDays).length;
      el.innerHTML=[
        ['Revisões agora',due],
        ['Tentativas 7d',reviewed7],
        ['Retenção',progress.length?mastery.retention+'%':'—'],
        ['Estáveis',mastery.stable]
      ].map(([k,v])=>`<div class="stat-tile"><span>${k}</span><strong>${v}</strong></div>`).join('');
    }

    function renderFilters(){
      const el=$('#recallFilters');if(!el)return;
      const defs=[['all','Tudo'],['dba','DBA'],['aws','AWS'],['english','English']];
      el.innerHTML=defs.map(([id,label])=>`<button class="recall-filter ${selectedTrack===id?'active':''}" data-recall-filter="${id}">${label}</button>`).join('');
      el.querySelectorAll('[data-recall-filter]').forEach(b=>b.onclick=()=>{
        selectedTrack=b.dataset.recallFilter;activeId=null;revealed=false;draftAnswer='';lastFeedback=null;render();
      });
    }

    function renderQueue(){
      const el=$('#recallQueue');if(!el)return;
      const queue=dueQueue();
      if(!queue.length){
        const next=progress.filter(p=>selectedTrack==='all'||Bank.get(p.item_id)?.trackId===selectedTrack)
          .sort((a,b)=>new Date(a.next_review_at)-new Date(b.next_review_at))[0];
        el.innerHTML=`<article class="panel recall-empty"><span class="kicker">FILA LIMPA</span><h3>Nada vencido agora.</h3><p>${next?`Próxima revisão: ${fmtDate(next.next_review_at)}.`:'Faça a primeira rodada para criar seu calendário de revisão.'}</p></article>`;
        return;
      }
      el.innerHTML=queue.map(({item,progress:p},index)=>{
        const overdue=p?new Date(p.next_review_at)<=new Date():false;
        return `<button class="recall-queue-item ${activeId===item.id?'active':''}" data-recall-item="${item.id}">
          <span class="recall-queue-order">${String(index+1).padStart(2,'0')}</span>
          <div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.trackId.toUpperCase())} · ${escapeHtml(item.moduleId)} · ${p?overdue?'revisão vencida':`estágio ${p.stage}`:'nova'}</small></div>
          <span class="recall-type">${item.type==='mcq'?'MCQ':'CURTA'}</span>
        </button>`;
      }).join('');
      el.querySelectorAll('[data-recall-item]').forEach(b=>b.onclick=()=>{
        activeId=b.dataset.recallItem;revealed=false;draftAnswer='';lastFeedback=null;render();
      });
    }

    function renderQuestion(){
      const el=$('#recallQuestion');if(!el)return;
      const queue=dueQueue();
      if(!activeId&&queue.length)activeId=queue[0].item.id;
      const item=Bank.get(activeId);
      if(!item){
        el.innerHTML=`<article class="panel recall-empty"><div class="recall-empty-icon">↻</div><div><span class="kicker">RECALL</span><h3>Escolha uma revisão na fila.</h3><p>O sistema traz conteúdo de volta quando ele vence, em vez de deixar conhecimento desaparecer silenciosamente.</p></div></article>`;
        return;
      }

      if(lastFeedback&&lastFeedback.itemId===item.id){
        const p=progressFor(item.id);
        el.innerHTML=`<article class="panel recall-card recall-result">
          <div class="recall-card-head"><span class="kicker">${escapeHtml(item.moduleId)} · RESULTADO</span><span class="recall-stage">estágio ${p?.stage??0}</span></div>
          <h3>${lastFeedback.grade>=2?'Memória recuperada.':'Conteúdo voltou para revisão curta.'}</h3>
          <p>${escapeHtml(lastFeedback.message)}</p>
          ${lastFeedback.explanation?`<div class="recall-rubric"><strong>Explicação</strong><p>${escapeHtml(lastFeedback.explanation)}</p></div>`:''}
          <div class="recall-next"><span>PRÓXIMA REVISÃO</span><strong>${p?fmtDate(p.next_review_at):'—'}</strong></div>
          <button id="recallNextBtn" class="btn btn-primary">PRÓXIMA QUESTÃO</button>
        </article>`;
        $('#recallNextBtn').onclick=()=>{activeId=null;revealed=false;draftAnswer='';lastFeedback=null;render()};
        return;
      }

      const p=progressFor(item.id);
      const head=`<div class="recall-card-head"><span class="kicker">${escapeHtml(item.trackId.toUpperCase())} · ${escapeHtml(item.moduleId)}</span><span class="recall-stage">${p?`estágio ${p.stage}`:'nova'}</span></div>
        <h3>${escapeHtml(item.title)}</h3><p class="recall-prompt">${escapeHtml(item.prompt)}</p>`;

      if(item.type==='mcq'){
        el.innerHTML=`<article class="panel recall-card">${head}
          <form id="recallMcqForm" class="recall-options">
            ${item.options.map(o=>`<label><input type="radio" name="recallOption" value="${escapeHtml(o.id)}"><span><b>${escapeHtml(o.id.toUpperCase())}</b>${escapeHtml(o.text)}</span></label>`).join('')}
            <button class="btn btn-primary" type="submit">RESPONDER</button>
          </form>
        </article>`;
        $('#recallMcqForm').onsubmit=async e=>{
          e.preventDefault();
          const selected=new FormData(e.currentTarget).get('recallOption');
          if(!selected){opts.toast('Escolha uma alternativa.');return}
          const correct=selected===item.correctOption;
          await record(item,{selectedOption:selected,grade:correct?2:0,correct,answerText:null,message:correct?'Resposta correta.':'Resposta incorreta.',explanation:item.explanation});
        };
        return;
      }

      el.innerHTML=`<article class="panel recall-card">${head}
        <label class="field"><span>Responda sem consultar</span><textarea id="recallShortAnswer" rows="5" placeholder="Explique com suas palavras...">${escapeHtml(draftAnswer)}</textarea></label>
        <div class="recall-hint">Dica opcional: ${escapeHtml(item.hint||'')}</div>
        ${revealed?`<div class="recall-rubric"><strong>Compare com estes pontos</strong><ul>${item.rubric.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div>
        <div class="recall-self-grade"><span>Como foi sem olhar?</span>
          ${[[0,'Não lembrei'],[1,'Parcial'],[2,'Lembrei'],[3,'Expliquei bem']].map(([g,l])=>`<button type="button" data-recall-grade="${g}">${l}</button>`).join('')}
        </div>`:`<button id="recallRevealBtn" class="btn btn-secondary">REVELAR RUBRICA</button>`}
      </article>`;

      const answer=$('#recallShortAnswer');
      answer.oninput=()=>{draftAnswer=answer.value};
      if(!revealed){
        $('#recallRevealBtn').onclick=()=>{draftAnswer=answer.value.trim();if(!draftAnswer){opts.toast('Escreva uma tentativa antes de revelar.');return}revealed=true;render()};
      }else{
        document.querySelectorAll('[data-recall-grade]').forEach(b=>b.onclick=()=>record(item,{answerText:draftAnswer,selectedOption:null,grade:Number(b.dataset.recallGrade),correct:null,message:`Autoavaliação: ${Engine.gradeLabel(Number(b.dataset.recallGrade))}.`,explanation:null}));
      }
    }

    async function record(item,result){
      if(busy)return;busy=true;
      try{
        const current=progressFor(item.id)||{};
        const next=Engine.nextProgress(current,result.grade,new Date());
        const feedback={
          grade:result.grade,
          correct:result.correct,
          explanation:result.explanation||null,
          message:result.message||Engine.gradeLabel(result.grade),
          rubric:item.rubric||null
        };
        await opts.addAttempt({
          item_id:item.id,
          track_id:item.trackId,
          module_id:item.moduleId,
          question_type:item.type,
          answer_text:result.answerText||null,
          selected_option:result.selectedOption||null,
          grade:Number(result.grade),
          correct:result.correct,
          feedback
        });
        const saved=await opts.upsertProgress({
          item_id:item.id,
          track_id:item.trackId,
          module_id:item.moduleId,
          ...next
        });
        const pi=progress.findIndex(p=>p.item_id===item.id);
        if(pi>=0)progress[pi]=saved;else progress.push(saved);
        attempts.unshift({
          item_id:item.id,track_id:item.trackId,module_id:item.moduleId,question_type:item.type,
          grade:Number(result.grade),correct:result.correct,feedback,created_at:new Date().toISOString()
        });
        lastFeedback={itemId:item.id,...feedback};
        revealed=false;
        if(opts.onChanged)await opts.onChanged({item,progress:saved,feedback});
        render();
      }catch(err){opts.toast(err.message||String(err))}
      finally{busy=false}
    }

    function renderHistory(){
      const el=$('#recallHistory');if(!el)return;
      const rows=attempts.slice(0,12);
      el.innerHTML=rows.length?rows.map(a=>{
        const item=Bank.get(a.item_id);
        return `<div class="recall-history-row"><div><strong>${escapeHtml(item?.title||a.item_id)}</strong><span>${escapeHtml(a.module_id)} · ${fmtDate(a.created_at)}</span></div><span>${Engine.gradeLabel(a.grade)}</span><b class="recall-grade g${a.grade}">${a.grade}/3</b></div>`;
      }).join(''):'<p class="muted">Nenhuma revisão registrada ainda.</p>';
    }

    function openModule(trackId,moduleId){
      selectedTrack=trackId;
      const items=Bank.byModule(trackId,moduleId);
      const queue=Engine.dueItems(items,progress,new Date(),50);
      activeId=(queue[0]?.item||items[0])?.id||null;
      revealed=false;draftAnswer='';lastFeedback=null;
      render();
    }

    function snapshot(){
      return {progress:[...progress],attempts:[...attempts],selectedTrack,activeId};
    }

    return {mount:refresh,refresh,render,openModule,snapshot};
  }

  return {createController};
});