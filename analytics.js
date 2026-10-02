(function(root, factory){
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.StudyAnalytics = api;
})(typeof self !== 'undefined' ? self : this, function(){
  const DAY = 86400000;

  const asDate = (v) => v instanceof Date ? v : new Date(v);
  const startOfDay = (v) => { const d=asDate(v); const x=new Date(d); x.setHours(0,0,0,0); return x; };
  const addDays = (v,n) => { const d=new Date(asDate(v)); d.setDate(d.getDate()+n); return d; };
  const key = (v) => {
    const d=asDate(v); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  };
  const pct = (a,b) => b ? Math.round((a/b)*100) : 0;
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const completed = (sessions) => (sessions||[]).filter(s=>s.finished_at);
  const minutes = (s) => Number.isFinite(Number(s.duration_minutes)) ? Number(s.duration_minutes) : (s.finished_at ? Math.max(1,Math.round((asDate(s.finished_at)-asDate(s.started_at))/60000)) : 0);

  function inRange(items, field, from, to){
    const a=asDate(from), b=asDate(to);
    return (items||[]).filter(x=>{ const d=asDate(x[field]); return d>=a && d<b; });
  }

  function windowDays(items, field, days, now=new Date(), offsetDays=0){
    const end = addDays(startOfDay(now), 1-offsetDays);
    const start = addDays(end, -days);
    return inRange(items,field,start,end);
  }

  function summary(sessions, evidence, competencies, opts={}){
    const now=opts.now ? asDate(opts.now) : new Date();
    const target=opts.weeklyTarget || 4;
    const s7=completed(windowDays(sessions,'started_at',7,now));
    const sPrev=completed(windowDays(sessions,'started_at',7,now,7));
    const e7=windowDays(evidence,'created_at',7,now);
    const s30=completed(windowDays(sessions,'started_at',30,now));
    const active7=new Set(s7.map(s=>key(s.started_at))).size;
    const total7=s7.reduce((a,s)=>a+minutes(s),0);
    const totalPrev=sPrev.reduce((a,s)=>a+minutes(s),0);
    const practical=s7.filter(s=>s.practical_done).length;
    const closures=s7.filter(s=>s.learned || s.doubt || s.next_action).length;
    const sessionIdsWithEvidence = new Set(e7.filter(e=>e.session_id).map(e=>e.session_id));
    const evidencedSessions=s7.filter(s=>sessionIdsWithEvidence.has(s.id)).length;
    const latencyVals=s30.map(s=>Number(s.start_latency_minutes)).filter(Number.isFinite).filter(x=>x>=0);
    const avgLatency=latencyVals.length ? Math.round(latencyVals.reduce((a,b)=>a+b,0)/latencyVals.length) : null;
    const noMood=s30.filter(s=>s.mood==='nao');
    const noMoodPractical=noMood.filter(s=>s.practical_done).length;
    const competencyList=competencies||[];
    const compAvg=competencyList.length ? competencyList.reduce((a,c)=>a+Number(c.level||0),0)/competencyList.length : 0;
    return {
      sessions7:s7.length,
      sessionsPrev:sPrev.length,
      minutes7:total7,
      minutesPrev:totalPrev,
      attendance:pct(Math.min(s7.length,target),target),
      target,
      activeDays7:active7,
      restDays7:7-active7,
      practicalRate:pct(practical,s7.length),
      evidenceRate:pct(evidencedSessions,s7.length),
      closureRate:pct(closures,s7.length),
      evidenceCount7:e7.length,
      avgLatency,
      noMoodCount:noMood.length,
      noMoodPractical,
      noMoodSuccessRate:pct(noMoodPractical,noMood.length),
      momentumMinutes: totalPrev ? Math.round(((total7-totalPrev)/totalPrev)*100) : (total7 ? 100 : 0),
      momentumSessions: sPrev.length ? Math.round(((s7.length-sPrev.length)/sPrev.length)*100) : (s7.length ? 100 : 0),
      competencyAverage:Number(compAvg.toFixed(1)),
      competencyAutonomous:competencyList.filter(c=>Number(c.level)>=4).length,
      competencyStarted:competencyList.filter(c=>Number(c.level)>=1).length,
      competencyTotal:competencyList.length
    };
  }

  function funnel(sessions,evidence,days=30,now=new Date()){
    const ss=completed(windowDays(sessions,'started_at',days,now));
    const ev=windowDays(evidence,'created_at',days,now);
    const ids=new Set(ev.filter(e=>e.session_id).map(e=>e.session_id));
    const started=ss.length;
    return [
      {label:'Sessões',value:started,rate:started?100:0},
      {label:'Prática',value:ss.filter(s=>s.practical_done).length,rate:pct(ss.filter(s=>s.practical_done).length,started)},
      {label:'Evidência',value:ss.filter(s=>ids.has(s.id)).length,rate:pct(ss.filter(s=>ids.has(s.id)).length,started)},
      {label:'Fechamento',value:ss.filter(s=>s.learned||s.doubt||s.next_action).length,rate:pct(ss.filter(s=>s.learned||s.doubt||s.next_action).length,started)}
    ];
  }

  function areaBreakdown(sessions,days=30,now=new Date()){
    const ss=completed(windowDays(sessions,'started_at',days,now));
    const areas=['DBA / DP-300','AWS / Data Lake','Inglês'];
    const total=ss.reduce((a,s)=>a+minutes(s),0);
    return areas.map(area=>{
      const subset=ss.filter(s=>s.area===area);
      const mins=subset.reduce((a,s)=>a+minutes(s),0);
      return {area,minutes:mins,sessions:subset.length,share:pct(mins,total)};
    });
  }

  function moodBreakdown(sessions,days=30,now=new Date()){
    const ss=completed(windowDays(sessions,'started_at',days,now));
    const moods=[['sim','😄 sim'],['mais-ou-menos','😐 mais ou menos'],['nao','💀 não']];
    return moods.map(([mood,label])=>{
      const subset=ss.filter(s=>s.mood===mood);
      const success=subset.filter(s=>s.practical_done).length;
      return {mood,label,sessions:subset.length,practical:success,rate:pct(success,subset.length)};
    });
  }

  function durationBuckets(sessions,days=60,now=new Date()){
    const ss=completed(windowDays(sessions,'started_at',days,now));
    const buckets=[
      {label:'até 15m',min:0,max:15},
      {label:'16–30m',min:16,max:30},
      {label:'31–60m',min:31,max:60},
      {label:'60m+',min:61,max:Infinity}
    ];
    return buckets.map(b=>{
      const subset=ss.filter(s=>{const m=minutes(s); return m>=b.min && m<=b.max;});
      const practical=subset.filter(s=>s.practical_done).length;
      return {label:b.label,sessions:subset.length,practical,rate:pct(practical,subset.length)};
    });
  }

  function bestStartWindow(sessions,days=60,now=new Date()){
    const ss=completed(windowDays(sessions,'started_at',days,now));
    const windows=[
      {label:'manhã cedo',min:5,max:9},
      {label:'manhã',min:9,max:12},
      {label:'tarde',min:12,max:18},
      {label:'início da noite',min:18,max:21},
      {label:'noite',min:21,max:24}
    ];
    const rows=windows.map(w=>{
      const subset=ss.filter(s=>{const h=asDate(s.started_at).getHours(); return h>=w.min && h<w.max;});
      const practical=subset.filter(s=>s.practical_done).length;
      return {label:w.label,sessions:subset.length,rate:pct(practical,subset.length),minutes:subset.reduce((a,s)=>a+minutes(s),0)};
    }).filter(x=>x.sessions>0);
    if(ss.length<5 || !rows.length) return null;
    rows.sort((a,b)=>b.rate-a.rate || b.sessions-a.sessions || b.minutes-a.minutes);
    return rows[0];
  }

  function weeklyTrend(sessions,weeks=8,now=new Date()){
    const completedSessions=completed(sessions||[]);
    const today=startOfDay(now);
    const monday=new Date(today); const day=(monday.getDay()+6)%7; monday.setDate(monday.getDate()-day);
    const result=[];
    for(let i=weeks-1;i>=0;i--){
      const start=addDays(monday,-7*i); const end=addDays(start,7);
      const subset=inRange(completedSessions,'started_at',start,end);
      result.push({
        start:key(start),
        label:start.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),
        sessions:subset.length,
        minutes:subset.reduce((a,s)=>a+minutes(s),0),
        practical:subset.filter(s=>s.practical_done).length
      });
    }
    return result;
  }

  function heatmap(sessions,days=84,now=new Date()){
    const ss=completed(sessions||[]);
    const end=addDays(startOfDay(now),1); const start=addDays(end,-days);
    const map=new Map();
    ss.forEach(s=>{
      const d=asDate(s.started_at); if(d<start||d>=end) return;
      const k=key(d); map.set(k,(map.get(k)||0)+minutes(s));
    });
    const out=[];
    for(let i=0;i<days;i++){
      const d=addDays(start,i); const mins=map.get(key(d))||0;
      out.push({date:key(d),minutes:mins,level:mins===0?0:mins<=15?1:mins<=30?2:mins<=60?3:4});
    }
    return out;
  }

  function habitMap(sessions,evidence,days=365,now=new Date()){
    const ss=completed(sessions||[]);
    const ev=evidence||[];
    const today=startOfDay(now);
    const requestedStart=addDays(today,-(days-1));
    const start=new Date(requestedStart);
    const startOffset=(start.getDay()+6)%7;
    start.setDate(start.getDate()-startOffset);
    const end=new Date(today);
    const endOffset=6-((end.getDay()+6)%7);
    end.setDate(end.getDate()+endOffset);

    const sessionMap=new Map();
    ss.forEach(s=>{
      const d=asDate(s.started_at);
      if(d<start || d>=addDays(end,1)) return;
      const k=key(d);
      const row=sessionMap.get(k)||{sessions:0,minutes:0,practical:0};
      row.sessions+=1;
      row.minutes+=minutes(s);
      if(s.practical_done) row.practical+=1;
      sessionMap.set(k,row);
    });
    const evidenceMap=new Map();
    ev.forEach(e=>{
      const d=asDate(e.created_at);
      if(d<start || d>=addDays(end,1)) return;
      const k=key(d); evidenceMap.set(k,(evidenceMap.get(k)||0)+1);
    });

    const all=[];
    for(let d=new Date(start);d<=end;d=addDays(d,1)){
      const k=key(d), row=sessionMap.get(k)||{sessions:0,minutes:0,practical:0};
      const inPeriod=d>=requestedStart && d<=today;
      const evidenceCount=evidenceMap.get(k)||0;
      const active=inPeriod && row.sessions>0;
      const level=!inPeriod||row.minutes===0?0:row.minutes<=15?1:row.minutes<=30?2:row.minutes<=60?3:4;
      all.push({date:k,minutes:row.minutes,sessions:row.sessions,practical:row.practical,evidence:evidenceCount,active,level,inPeriod});
    }

    const weeks=[];
    for(let i=0;i<all.length;i+=7) weeks.push(all.slice(i,i+7));

    const months=[];
    let lastMonth='';
    weeks.forEach((week,weekIndex)=>{
      const candidate=week.find(d=>d.inPeriod && asDate(d.date+'T12:00:00').getDate()<=7) || week.find(d=>d.inPeriod);
      if(!candidate) return;
      const date=asDate(candidate.date+'T12:00:00');
      const token=`${date.getFullYear()}-${date.getMonth()}`;
      if(token!==lastMonth){
        months.push({week:weekIndex,label:date.toLocaleDateString('pt-BR',{month:'short'}).replace('.','')});
        lastMonth=token;
      }
    });

    const period=all.filter(d=>d.inPeriod);
    const activeDays=period.filter(d=>d.active).length;
    const totalMinutes=period.reduce((a,d)=>a+d.minutes,0);
    const byDate=new Map(period.map(d=>[d.date,d]));
    let cursor=new Date(today);
    if(!(byDate.get(key(cursor))||{}).active) cursor=addDays(cursor,-1);
    let currentStreak=0;
    while(cursor>=requestedStart && (byDate.get(key(cursor))||{}).active){currentStreak++;cursor=addDays(cursor,-1);}

    let bestStreak=0, run=0;
    period.forEach(d=>{if(d.active){run++;bestStreak=Math.max(bestStreak,run)}else run=0;});

    return {weeks,months,currentStreak,bestStreak,activeDays,totalMinutes,days:period.length};
  }

  function competencySummary(competencies){
    const areas=['DBA / DP-300','AWS / Data Lake','Inglês'];
    return areas.map(area=>{
      const cs=(competencies||[]).filter(c=>c.area===area);
      const total=cs.length;
      const points=cs.reduce((a,c)=>a+Number(c.level||0),0);
      return {area,total,average: total ? Number((points/total).toFixed(1)) : 0,progress: total ? Math.round((points/(total*5))*100) : 0,untouched:cs.filter(c=>Number(c.level)===0).length,started:cs.filter(c=>Number(c.level)>=1).length,doing:cs.filter(c=>Number(c.level)>=3).length,autonomous:cs.filter(c=>Number(c.level)>=4).length};
    });
  }

  function latencyDistribution(sessions,days=60,now=new Date()){
    const vals=completed(windowDays(sessions,'started_at',days,now)).map(s=>Number(s.start_latency_minutes)).filter(Number.isFinite).filter(x=>x>=0);
    const buckets=[{label:'no horário',min:0,max:5},{label:'6–15m',min:6,max:15},{label:'16–30m',min:16,max:30},{label:'31–60m',min:31,max:60},{label:'60m+',min:61,max:Infinity}];
    return buckets.map(b=>({label:b.label,count:vals.filter(v=>v>=b.min&&v<=b.max).length}));
  }

  function generateInsights(sessions,evidence,competencies,opts={}){
    const now=opts.now ? asDate(opts.now) : new Date();
    const s=summary(sessions,evidence,competencies,{now,weeklyTarget:opts.weeklyTarget||4});
    const f=funnel(sessions,evidence,30,now);
    const areas=areaBreakdown(sessions,30,now);
    const durations=durationBuckets(sessions,60,now).filter(x=>x.sessions>=2);
    const bestWindow=bestStartWindow(sessions,60,now);
    const out=[];
    const total30=completed(windowDays(sessions,'started_at',30,now)).length;

    if(total30<3){
      out.push({tone:'neutral',title:'Ainda estamos criando o baseline',text:'Com 3 sessões reais o painel já começa a separar sensação de padrão. Por enquanto, o objetivo é simplesmente comparecer.'});
      return out;
    }
    if(s.noMoodPractical>0) out.push({tone:'good',title:'Você não precisa estar com vontade',text:`${s.noMoodPractical} sessão(ões) dos últimos 30 dias começaram no “💀 não” e mesmo assim viraram prática. Isso é evidência contra esperar motivação.`});
    if(s.avgLatency!==null){const tone=s.avgLatency<=15?'good':s.avgLatency<=30?'neutral':'warn';out.push({tone,title:'Sua latência de início está mensurável',text:`Quando você registra um horário planejado, leva em média ${s.avgLatency} min para realmente começar. O alvo inicial não é zero: é reduzir esse intervalo aos poucos.`});}
    if(f[1].rate<70 && f[0].value>=4) out.push({tone:'warn',title:'Bater ponto ainda não está virando prática sempre',text:`Nos últimos 30 dias, ${f[1].rate}% das sessões chegaram a uma tarefa prática. O ponto só conta de verdade quando algo foi executado.`});
    else if(f[1].rate>=85 && f[0].value>=4) out.push({tone:'good',title:'Seu ponto está virando execução',text:`${f[1].rate}% das sessões dos últimos 30 dias chegaram à prática. O ritual de começo está funcionando.`});
    if(f[2].rate<60 && f[0].value>=4) out.push({tone:'neutral',title:'Seu conhecimento está ficando pouco visível',text:`Só ${f[2].rate}% das sessões deixaram uma evidência vinculada. Uma query, print, resumo ou exercício já resolve isso.`});
    if(s.restDays7===0 && s.sessions7>=7) out.push({tone:'warn',title:'Você não teve dia de descanso nesta semana',text:'Consistência não precisa significar estudar sete dias. Um descanso planejado continua sendo parte do plano.'});
    const heavy=areas.find(a=>a.share>=75 && a.minutes>=120); const empty=areas.filter(a=>a.minutes===0);
    if(heavy && empty.length) out.push({tone:'neutral',title:'Sua energia está concentrada em uma frente',text:`${heavy.area} recebeu ${heavy.share}% do tempo dos últimos 30 dias. Isso pode ser intencional; as frentes zeradas foram ${empty.map(x=>x.area).join(' e ')}.`});
    if(durations.length){durations.sort((a,b)=>b.rate-a.rate || b.sessions-a.sessions);const best=durations[0];if(best.sessions>=3) out.push({tone:'good',title:'Existe um tamanho de sessão que funciona melhor',text:`Sessões de ${best.label} tiveram ${best.rate}% de execução prática (${best.sessions} sessões). Esse pode ser seu bloco padrão.`});}
    if(bestWindow && bestWindow.sessions>=2) out.push({tone:'neutral',title:'Seu melhor horário observado',text:`Até agora, “${bestWindow.label}” tem ${bestWindow.rate}% de sessões práticas em ${bestWindow.sessions} registro(s). Isso é observação, não regra.`});
    if(s.competencyAutonomous>0) out.push({tone:'good',title:'Conhecimento que já deixou de ser “novo”',text:`Você já marcou ${s.competencyAutonomous} competência(s) em nível 4 ou 5. O painel existe justamente para isso não desaparecer da sua percepção.`});
    return out.slice(0,6);
  }

  return {key,startOfDay,addDays,minutes,windowDays,summary,funnel,areaBreakdown,moodBreakdown,durationBuckets,bestStartWindow,weeklyTrend,heatmap,habitMap,competencySummary,latencyDistribution,generateInsights};
});
