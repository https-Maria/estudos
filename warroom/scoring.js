(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.ForgeWarRoomScoring=api;
})(typeof self!=='undefined'?self:this,function(){
  const clamp=n=>Math.max(0,Math.min(100,Math.round(Number(n)||0)));
  function weightedScore(dimensions,weights={}){
    const w={
      technical:Number(weights.technical??0.4),
      communication:Number(weights.communication??0.2),
      architecture:Number(weights.architecture??0.2),
      business:Number(weights.business??0.2)
    };
    const total=w.technical+w.communication+w.architecture+w.business||1;
    const scores={
      technical:clamp(dimensions.technical),
      communication:clamp(dimensions.communication),
      architecture:clamp(dimensions.architecture),
      business:clamp(dimensions.business)
    };
    const score=Math.round((
      scores.technical*w.technical+
      scores.communication*w.communication+
      scores.architecture*w.architecture+
      scores.business*w.business
    )/total);
    return {...scores,score};
  }
  function slaPenalty(elapsed,sla){
    const e=Number(elapsed)||0,s=Number(sla)||0;
    if(!s||e<=s)return 0;
    return Math.min(30,Math.ceil((e-s)/5)*2);
  }
  return {weightedScore,slaPenalty};
});