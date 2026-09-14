/* Broad-by-default discovery policy. Find everything first; filters narrow only when the user explicitly chooses them. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaBroadDefaults=api;api.install(root);}
})(globalThis,function(){
'use strict';
const MARKER='pizzascan-broad-defaults-v1';

function allTypes(types){return Object.keys(types||{});}
function normalizeConfig(base={},raw={},types={}){
  const all=allTypes(types),has=(key)=>Object.prototype.hasOwnProperty.call(raw,key);
  return {
    ...base,
    types:Array.isArray(raw.types)?raw.types.filter(x=>all.includes(x)):all,
    onlyOpen:has('onlyOpen')?raw.onlyOpen===true:false,
    unknownHours:has('unknownHours')?raw.unknownHours===true:false,
    includeItalian:has('includeItalian')?raw.includeItalian!==false:true,
    includeUnconfirmed:has('includeUnconfirmed')?raw.includeUnconfirmed!==false:true,
    radius:has('radius')&&[0,1,3,5,10].includes(Number(raw.radius))?Number(raw.radius):10,
    hideVisited:has('hideVisited')?raw.hideVisited===true:false,
    ratingsEnabled:has('ratingsEnabled')?raw.ratingsEnabled!==false:true,
    minRating:has('minRating')&&Number.isFinite(Number(raw.minRating))?Math.max(0,Math.min(5,Number(raw.minRating))):0,
    includeUnrated:has('includeUnrated')?raw.includeUnrated!==false:true
  };
}
function broadMigration(previous={},types={}){
  return {
    ...previous,
    types:allTypes(types),
    onlyOpen:false,
    unknownHours:false,
    includeItalian:true,
    includeUnconfirmed:true,
    radius:10,
    hideVisited:false,
    ratingsEnabled:true,
    minRating:0,
    includeUnrated:true
  };
}
function candidateVisible(place,cfg,context={},hours=()=>({state:'unknown'})){
  if(!place||place.pizzaEvidence!=='search'||cfg?.includeUnconfirmed===false)return false;
  if(!Array.isArray(cfg?.types)||!cfg.types.includes(place.type))return false;
  if(cfg.onlyOpen){const state=hours(place).state;if(state!=='open'&&!(cfg.unknownHours&&state==='unknown'))return false;}
  if(cfg.hideVisited&&context.visited?.has(place.placeId))return false;
  return true;
}
function install(root){
  const PD=root.PizzaPlaces;if(!PD)return;
  let migrated=false;
  function migrateOnce(){
    if(migrated)return;migrated=true;
    try{
      if(typeof settings==='undefined'||!settings||!root.localStorage||root.localStorage.getItem(MARKER))return;
      settings.filters=broadMigration(settings.filters||{},PD.TYPES);
      root.localStorage.removeItem('pizzascan-map-cache-v3');
      root.localStorage.removeItem('pizzascan-open-ratings-v1');
      for(let i=root.localStorage.length-1;i>=0;i--){const key=root.localStorage.key(i);if(key?.startsWith('pizzascan-search-'))root.localStorage.removeItem(key);}
      root.localStorage.setItem(MARKER,'1');
      if(typeof saveSettings==='function')saveSettings();
    }catch(error){console.warn('PizzaScan broad-default migration skipped',error);}
  }
  try{
    if(typeof mapConfig==='function'&&!mapConfig.__pizzaBroadDefaults){
      const baseMapConfig=mapConfig;
      const wrapped=function(){migrateOnce();let raw={};try{if(typeof settings!=='undefined')raw=settings?.filters||{};}catch{}return normalizeConfig(baseMapConfig(),raw,PD.TYPES);};
      wrapped.__pizzaBroadDefaults=true;wrapped.__pizzaBroadDefaultsInner=baseMapConfig;mapConfig=wrapped;
    }
  }catch{}
  if(!PD.filter.__pizzaBroadDefaults){
    const baseFilter=PD.filter.bind(PD);
    PD.filter=function(list,cfg,context,hours){
      const normal=baseFilter(list,cfg,context,hours),extra=(list||[]).filter(place=>candidateVisible(place,cfg,context,hours));
      return PD.merge(normal,extra);
    };
    PD.filter.__pizzaBroadDefaults=true;
  }
  root.PizzaScanBroadPolicy={marker:MARKER,defaults:()=>normalizeConfig({}, {}, PD.TYPES)};
}
return {MARKER,allTypes,normalizeConfig,broadMigration,candidateVisible,install};
});
