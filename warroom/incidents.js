(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.ForgeWarRoomIncidents=api;
})(typeof self!=='undefined'?self:this,function(){
  const registry=new Map();
  function validate(incident){
    for(const key of ['id','title','trackId','moduleId','initialState','slaMinutes'])if(!incident?.[key])throw new Error('incident missing '+key);
    if(!Array.isArray(incident.actions))throw new Error('incident.actions must be an array');
    return incident;
  }
  function registerIncident(incident){
    validate(incident);
    if(registry.has(incident.id))throw new Error('duplicate incident '+incident.id);
    registry.set(incident.id,incident);
    return incident;
  }
  function getIncident(id){return registry.get(id)||null;}
  function listIncidents(){return [...registry.values()];}
  return {registerIncident,getIncident,listIncidents};
});