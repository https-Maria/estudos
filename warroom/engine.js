(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.ForgeWarRoomEngine=api;
})(typeof self!=='undefined'?self:this,function(){
  const clone=(v)=>JSON.parse(JSON.stringify(v));

  function createRun(incident,opts={}){
    if(!incident?.id)throw new Error('incident.id is required');
    if(!incident.initialState)throw new Error('incident.initialState is required');
    return {
      incidentId:incident.id,
      runId:opts.runId||null,
      state:incident.initialState,
      elapsedMinutes:0,
      evidenceUnlocked:[],
      actionsTaken:[],
      communicationChoices:[],
      resolved:false,
      failed:false,
      result:null,
      flags:{},
      startedAt:opts.startedAt||new Date().toISOString()
    };
  }

  function actionAvailable(action,run){
    const req=action.requires||{};
    if(req.states&& !req.states.includes(run.state))return false;
    if(req.evidence&& !req.evidence.every(id=>run.evidenceUnlocked.includes(id)))return false;
    if(req.flags&& !Object.entries(req.flags).every(([k,v])=>run.flags?.[k]===v))return false;
    if(action.once&&run.actionsTaken.some(x=>x.actionId===action.id))return false;
    return true;
  }

  function availableActions(incident,run){
    return (incident.actions||[]).filter(a=>actionAvailable(a,run));
  }

  function applyAction(incident,run,actionId,input={}){
    if(run.resolved||run.failed)throw new Error('run already finished');
    const action=(incident.actions||[]).find(a=>a.id===actionId);
    if(!action)throw new Error('unknown action');
    if(!actionAvailable(action,run))throw new Error('action unavailable');

    const next=clone(run);
    const timeCost=Math.max(0,Number(action.timeCost||0));
    next.elapsedMinutes+=timeCost;

    if(action.unlocksEvidence){
      for(const id of action.unlocksEvidence){
        if(!next.evidenceUnlocked.includes(id))next.evidenceUnlocked.push(id);
      }
    }
    if(action.setFlags)Object.assign(next.flags,action.setFlags);
    if(action.nextState)next.state=action.nextState;
    if(action.communication)next.communicationChoices.push(action.id);

    const event={
      sequence:next.actionsTaken.length+1,
      actionId:action.id,
      eventType:action.eventType||'action',
      timeCost,
      stateBefore:run.state,
      stateAfter:next.state,
      input:clone(input),
      consequence:clone(action.consequence||null),
      evidenceUnlocked:clone(action.unlocksEvidence||[])
    };
    next.actionsTaken.push(event);

    if(typeof incident.evaluate==='function'){
      const verdict=incident.evaluate(clone(next),action,input)||null;
      if(verdict){
        if(verdict.state)next.state=verdict.state;
        if(verdict.resolved===true)next.resolved=true;
        if(verdict.failed===true)next.failed=true;
        if(verdict.result!==undefined)next.result=clone(verdict.result);
        if(verdict.flags)Object.assign(next.flags,verdict.flags);
      }
    }
    return {run:next,event};
  }

  function serialize(run){return JSON.stringify(run);}
  function deserialize(raw){return typeof raw==='string'?JSON.parse(raw):clone(raw);}
  return {createRun,availableActions,applyAction,serialize,deserialize};
});