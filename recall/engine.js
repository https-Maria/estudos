(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.ForgeRecallEngine=api;
})(typeof self!=='undefined'?self:this,function(){
  const DAY=86400000;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

  function nextProgress(current={},grade,now=new Date()){
    const g=clamp(Number(grade)||0,0,3);
    const prevStage=Number(current.stage||0);
    let stage=prevStage;
    if(g===0)stage=Math.max(0,prevStage-1);
    if(g===1)stage=Math.max(1,prevStage);
    if(g===2)stage=Math.min(6,prevStage+1);
    if(g===3)stage=Math.min(6,prevStage+2);

    const intervals={
      0:[1,1,2,3,5,7,10],
      1:[1,2,3,5,7,14,21],
      2:[1,3,7,14,30,60,90],
      3:[2,5,10,21,45,75,120]
    };
    const days=intervals[g][stage];
    const answered=new Date(now);
    const next=new Date(answered.getTime()+days*DAY);
    const attempts=Number(current.attempts||0)+1;
    const successes=Number(current.successes||0)+(g>=2?1:0);

    return {
      stage,
      stability:days,
      attempts,
      successes,
      last_grade:g,
      last_answered_at:answered.toISOString(),
      next_review_at:next.toISOString(),
      updated_at:answered.toISOString()
    };
  }

  function isDue(progress,now=new Date()){
    if(!progress)return true;
    return new Date(progress.next_review_at||0).getTime()<=new Date(now).getTime();
  }

  function dueItems(items,progressRows,now=new Date(),limit=20){
    const map=new Map((progressRows||[]).map(p=>[p.item_id,p]));
    const due=[],fresh=[];
    for(const item of items||[]){
      const p=map.get(item.id);
      if(!p)fresh.push({item,progress:null,overdueMs:Infinity});
      else if(isDue(p,now))due.push({item,progress:p,overdueMs:new Date(now)-new Date(p.next_review_at)});
    }
    due.sort((a,b)=>b.overdueMs-a.overdueMs||Number(a.progress?.stage||0)-Number(b.progress?.stage||0));
    fresh.sort((a,b)=>(a.item.order||999)-(b.item.order||999));
    return [...due,...fresh].slice(0,limit);
  }

  function retention(progressRows){
    const attempts=(progressRows||[]).reduce((n,p)=>n+Number(p.attempts||0),0);
    const successes=(progressRows||[]).reduce((n,p)=>n+Number(p.successes||0),0);
    return attempts?Math.round(successes/attempts*100):0;
  }

  function mastery(progressRows){
    const rows=progressRows||[];
    return {
      started:rows.filter(p=>Number(p.attempts)>0).length,
      stable:rows.filter(p=>Number(p.stage)>=4).length,
      mastered:rows.filter(p=>Number(p.stage)>=6).length,
      retention:retention(rows)
    };
  }

  function gradeLabel(grade){
    return ['não lembrei','parcial','lembrei','expliquei'][clamp(Number(grade)||0,0,3)];
  }

  return {nextProgress,isDue,dueItems,retention,mastery,gradeLabel};
});