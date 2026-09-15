/* Broad restaurant/POI baseline. Pizza recovery is additive and must never remove
 * ordinary restaurants already returned by the primary OpenStreetMap search. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaBroadDefaults=api;api.install(root);}
})(globalThis,function(){
'use strict';
const MARKER='pizzascan-broad-defaults-v10';
const BROAD_AMENITIES='restaurant|fast_food|cafe|food_truck|takeaway|food_court|bar|pub|biergarten';
const SUPPLEMENT_BELOW=4;

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
    /* Match the original PizzaScan/WebSim behaviour: the visible map viewport is
     * the search area and moving the map automatically regenerates the results. */
    radius:has('radius')&&[0,1,3,5,10].includes(Number(raw.radius))?Number(raw.radius):0,
    autoSearch:has('autoSearch')?raw.autoSearch!==false:true,
    hideVisited:has('hideVisited')?raw.hideVisited===true:false,
    ratingsEnabled:has('ratingsEnabled')?raw.ratingsEnabled!==false:true,
    minRating:has('minRating')&&Number.isFinite(Number(raw.minRating))?Math.max(0,Math.min(5,Number(raw.minRating))):0,
    includeUnrated:has('includeUnrated')?raw.includeUnrated===true:false
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
    radius:0,
    autoSearch:true,
    hideVisited:false,
    ratingsEnabled:true,
    minRating:0,
    includeUnrated:false
  };
}
function candidateVisible(place,cfg={},context={},hours=()=>({state:'unknown'})){
  if(!place||cfg.includeUnconfirmed===false)return false;
  if(Array.isArray(cfg.types)&&!cfg.types.includes(place.type))return false;
  if(cfg.hideVisited&&context.visited?.has?.(place.placeId))return false;
  if(cfg.onlyOpen){const state=hours(place)?.state;if(state!=='open'&&!(cfg.unknownHours&&state==='unknown'))return false;}
  return place.pizzaEvidence==='search'||place.pizzaEvidence==='possible';
}
function queryAreaToken(query){
  const m=String(query||'').match(/\]\((around:[^)]+|-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?)\);/);
  return m?.[1]||'';
}
function expandDiscoveryQuery(query,enabled=true){
  const q=String(query||'');
  if(!enabled)return q;
  const area=queryAreaToken(q);
  if(!area||q.includes('pizzascan-legacy-result-coverage'))return q;
  /* Keep the broad named-food query intact. This is what restores the large
   * result set. The original PizzaScan/WebSim pizza selectors are added on top
   * so pizza-specific objects are not lost when their amenity tagging is sparse. */
  const extra=`/* pizzascan-legacy-result-coverage */`+
    `nwr["speciality"~"pizza",i](${area});`+
    `nwr["brand"~"pizza|pizzeria|pizzaria",i](${area});`+
    `nwr["name"~"pizza|pizzeria|pizzaria|pizze",i](${area});`+
    `nwr["description"~"pizza",i](${area});`+
    `nwr["amenity"="restaurant"]["cuisine"~"italian|italiano|italiana",i](${area});`+
    `nwr["amenity"~"cafe|fast_food|food_truck|takeaway|bar|pub"]["cuisine"~"pizza|pizzeria|italian|italiano|italiana",i](${area});`;
  if(q.includes(');out body center;'))return q.replace(');out body center;',extra+');out body center;');
  return q;
}
function mergeElements(primary=[],extra=[]){
  const result=new Map();
  for(const element of [...(primary||[]),...(extra||[])]){
    if(!element||!element.type||element.id==null)continue;
    result.set(`${element.type}-${element.id}`,element);
  }
  return [...result.values()];
}
function shouldSupplement(elements,min=SUPPLEMENT_BELOW){return !Array.isArray(elements)||elements.length<min;}
function currentConfig(){
  try{if(typeof mapConfig==='function')return mapConfig();}catch{}
  try{if(typeof settings!=='undefined')return settings?.filters||{};}catch{}
  return {};
}
function install(root){
  const PD=root.PizzaPlaces;if(!PD)return;
  let migrated=false;
  function migrateOnce(){
    if(migrated)return;migrated=true;
    try{
      if(typeof settings==='undefined'||!settings||!root.localStorage||root.localStorage.getItem(MARKER))return;
      settings.filters=broadMigration(settings.filters||{},PD.TYPES);
      /* v10 intentionally drops old sparse/Photon map results once so an update
       * immediately repopulates the current viewport from the restored broad query. */
      root.localStorage.removeItem('pizzascan-map-cache-v3');
      root.localStorage.removeItem('pizzascan-map-cache-v2');
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
  if(!PD.query.__pizzaBroadDefaults){
    const baseQuery=PD.query.bind(PD);
    PD.query=function(center,radius,bounds){
      const cfg=currentConfig();
      return expandDiscoveryQuery(baseQuery(center,radius,bounds),cfg.includeUnconfirmed!==false);
    };
    PD.query.__pizzaBroadDefaults=true;
  }
  if(!PD.fromOverpass.__pizzaBroadDefaults){
    const baseFromOverpass=PD.fromOverpass.bind(PD);
    PD.fromOverpass=function(elements,options={}){
      const cfg=currentConfig();
      return baseFromOverpass(elements,{allowNamed:cfg.includeUnconfirmed!==false,...options});
    };
    PD.fromOverpass.__pizzaBroadDefaults=true;
  }
  if(!PD.filter.__pizzaBroadDefaults){
    const baseFilter=PD.filter.bind(PD);
    PD.filter=function(list,cfg,context,hours){
      const normal=baseFilter(list,cfg,context,hours),extra=(list||[]).filter(place=>candidateVisible(place,cfg,context,hours));
      return PD.merge(normal,extra);
    };
    PD.filter.__pizzaBroadDefaults=true;
  }
  try{
    if(typeof placeService!=='undefined'&&placeService&&!placeService.overpass.__pizzaBroadDefaults){
      const baseOverpass=placeService.overpass.bind(placeService);
      const wrappedOverpass=async function(q,options={}){
        const primary=await baseOverpass(q,options),elements=primary?.data?.elements||[];
        if(!shouldSupplement(elements)||String(primary?.source||'').includes('photon'))return primary;
        try{
          options.onStatus?.('Weitere Pizza-Orte werden ergänzt …');
          const extra=await this.nearbyFallback(q,options);
          if(extra?.length)return {data:{...primary.data,elements:mergeElements(elements,extra)},source:[primary.source,'photon.komoot.io'].filter(Boolean).join(' + ')};
        }catch(error){if(options.signal?.aborted)throw error;}
        return primary;
      };
      wrappedOverpass.__pizzaBroadDefaults=true;
      placeService.overpass=wrappedOverpass.bind(placeService);
      placeService.overpass.__pizzaBroadDefaults=true;
    }
  }catch(error){console.warn('PizzaScan discovery supplement skipped',error);}
  root.PizzaScanBroadPolicy={marker:MARKER,defaults:()=>normalizeConfig({}, {}, PD.TYPES)};
}
return {MARKER,BROAD_AMENITIES,SUPPLEMENT_BELOW,allTypes,normalizeConfig,broadMigration,candidateVisible,queryAreaToken,expandDiscoveryQuery,mergeElements,shouldSupplement,install};
});
