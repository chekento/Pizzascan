/* PizzaScan Build 45: restore the original WebSim discovery contract.
 * The targeted Overpass query decides relevance. App-side filters must not silently
 * throw away query hits, and legacy search settings are reset once to a complete view.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else{root.PizzaBuild45=api;api.install(root);}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='2.3.10',BUILD=45;
const MIGRATION='pizzascan-build45-search-migration-v1';
const QUERY_MARKER='pizzascan-build45-websim-source';
const HIT='pizzascan:build45-query';
const PROVIDERS=[
 'https://overpass-api.de/api/interpreter',
 'https://overpass.private.coffee/api/interpreter',
 'https://overpass.osm.jp/api/interpreter'
];
const PIZZA=/(pizza|pizzeria|pizzaria|pizzerie|pizze|pizza[ _-]?(?:bar|restaurant)|ピザ|披萨|披薩|比萨|比薩|بيتزا|пицц|πίτσα|פיצה|피자|พิซซ่า)/iu;
const ITALIAN=/(italian|italiano|italiana|italienne|italienisch|ristorante|trattoria|osteria|cucina\s+italiana|bella\s+italia|forno\s+italiano|pasta)/iu;
function validCenter(c){return c&&Number.isFinite(Number(c.lat))&&Number.isFinite(Number(c.lng));}
function validBounds(b){return b&&['south','west','north','east'].every(k=>Number.isFinite(Number(b[k])));}
function area(center,radius,bounds){
 const r=Number(radius)||0;
 if(r>0){if(!validCenter(center))throw Error('Ungültiger Suchmittelpunkt');return `around:${Math.round(Math.max(.5,Math.min(10,r))*1000)},${Number(center.lat)},${Number(center.lng)}`;}
 if(validBounds(bounds))return `${Number(bounds.south)},${Number(bounds.west)},${Number(bounds.north)},${Number(bounds.east)}`;
 if(validCenter(center))return `around:5000,${Number(center.lat)},${Number(center.lng)}`;
 throw Error('Ungültiger Suchbereich');
}
function websimQuery(center,radius,bounds){
 const a=area(center,radius,bounds);
 const pizza='pizza|pizzeria|pizzaria|pizze|ピザ|披萨|披薩|比萨|比薩|بيتزا|пицц|πίτσα|פיצה|피자|พิซซ่า';
 return `[out:json][timeout:18];(/* ${QUERY_MARKER} */
nwr["cuisine"~"${pizza}|italian|italiano|italiana|italienne|italienisch|pasta",i](${a});
nwr["amenity"="restaurant"]["cuisine"~"pizza|pizzeria|italian|italiano|italiana|pasta",i](${a});
nwr["amenity"~"cafe|fast_food|food_truck|takeaway|food_court|bar|pub|biergarten"]["cuisine"~"pizza|pizzeria|italian|italiano|italiana|pasta",i](${a});
nwr["name"~"${pizza}|ristorante|trattoria|osteria|cucina italiana|bella italia|forno italiano|italian restaurant",i](${a});
nwr["brand"~"${pizza}|ristorante|trattoria|osteria|italian",i](${a});
nwr["operator"~"${pizza}|ristorante|trattoria|osteria|italian",i](${a});
nwr["speciality"~"${pizza}",i](${a});
nwr["product"~"${pizza}",i](${a});nwr["products"~"${pizza}",i](${a});
nwr["menu"~"${pizza}",i](${a});nwr["website:menu"~"${pizza}",i](${a});nwr["contact:menu"~"${pizza}",i](${a});
nwr["description"~"${pizza}|italian restaurant|italian cuisine|cucina italiana",i](${a});
nwr["note"~"${pizza}|italian restaurant|italian cuisine|cucina italiana",i](${a});
nwr["vending"~"pizza",i](${a});nwr["vending:pizza"="yes"](${a});
);out body center qt;`;
}
function text(tags={}){return Object.entries(tags).filter(([k,v])=>v!=null&&/^(name(?::.*)?|brand|operator|cuisine|speciality|product|products|description(?::.*)?|note(?::.*)?|menu(?::.*)?|website:menu|contact:menu|vending)$/i.test(k)).map(([,v])=>String(v)).join(' ');}
function pizzaEvidence(t={}){return t['vending:pizza']==='yes'||PIZZA.test(String(t.vending||''))||PIZZA.test(text(t));}
function italianEvidence(t={}){return ITALIAN.test([t.cuisine,t.name,t.brand,t.operator,t.description,t.note].filter(Boolean).join(' '));}
function isQueryHit(t={}){return t[HIT]==='yes';}
function classify(t={},confirmed=false){
 const a=String(t.amenity||'');
 if(t['vending:pizza']==='yes'||/pizza/i.test(String(t.vending||'')))return 'vending_pizza';
 if(a==='food_truck'||t.mobile==='yes')return 'food_truck';
 if(a==='cafe')return 'cafe';
 if(a==='fast_food')return 'fast_food';
 if(confirmed||italianEvidence(t)||isQueryHit(t))return 'pizzeria';
 return 'other';
}
function address(t={}){return t['addr:full']||[[t['addr:street']||t['addr:place'],t['addr:housenumber']].filter(Boolean).join(' '),[t['addr:postcode'],t['addr:city']||t['addr:town']||t['addr:village']].filter(Boolean).join(' ')].filter(Boolean).join(', ');}
function normalizeElement(e,Core){
 const t=e?.tags||{},lat=e?.lat??e?.center?.lat,lng=e?.lon??e?.center?.lon;
 if(!Core?.coords?.(lat,lng)||!['node','way','relation'].includes(e?.type)||!/^[0-9]+$/.test(String(e?.id)))return null;
 if(t.disused==='yes'||t.abandoned==='yes'||['disused','abandoned','demolished','construction'].includes(t.amenity))return null;
 const confirmed=pizzaEvidence(t),possible=!confirmed&&italianEvidence(t),hit=isQueryHit(t);
 if(!confirmed&&!possible&&!hit)return null;
 const type=classify(t,confirmed),name=String(t.name||t.brand||t.operator||(confirmed?'Pizza-Ort ohne Namen':possible?'Italienischer Ort ohne Namen':'PizzaScan-Treffer ohne Namen')).trim();
 return Core.place({placeId:`${e.type}-${e.id}`,name,lat:Number(lat),lng:Number(lng),type,openingHours:t.opening_hours||'',website:t.website||t['contact:website'],phone:t.phone||t['contact:phone']||t.mobile_phone,address:address(t),cuisine:t.cuisine||'',menu:t['website:menu']||t['contact:menu']||t['menu:website']||'',description:t.description||'',tags:t,country:t['addr:country']||'',state:t['addr:state']||'',pizzaEvidence:confirmed?'confirmed':possible?'possible':'search',updatedAt:new Date().toISOString(),dataSource:'OpenStreetMap'});
}
function normalizeElements(list,Core){const m=new Map();for(const e of Array.isArray(list)?list:[]){const p=normalizeElement(e,Core);if(p)m.set(p.placeId,p);}return [...m.values()];}
function relevantPlace(p){return !!p&&(p.pizzaEvidence==='confirmed'||p.pizzaEvidence==='possible'||p.pizzaEvidence==='search'||p.tags?.[HIT]==='yes');}
function filterPlaces(list,cfg={},context={},hours=()=>({state:'unknown'})){
 const types=Array.isArray(cfg.types)?cfg.types:null;
 return (list||[]).filter(p=>{
  if(!relevantPlace(p))return false;
  if(types&&!types.includes(p.type))return false;
  if(cfg.includeItalian===false&&p.pizzaEvidence==='possible')return false;
  if(cfg.hideVisited&&context.visited?.has?.(p.placeId))return false;
  if(cfg.onlyOpen){const s=hours(p)?.state;if(s!=='open'&&!(cfg.unknownHours&&s==='unknown'))return false;}
  return true;
 });
}
function firstSuccess(promises){return new Promise((resolve,reject)=>{let n=promises.length,errors=[];if(!n)return reject(Error('Keine Kartenquelle konfiguriert'));promises.forEach((p,i)=>Promise.resolve(p).then(v=>resolve(v),e=>{errors[i]=e;if(--n===0)reject(errors.find(Boolean)||Error('Keine Kartenquelle erreichbar'));}));});}
function tagHits(elements){return (Array.isArray(elements)?elements:[]).map(e=>({...e,tags:{...(e.tags||{}),[HIT]:'yes'}}));}
function migrationConfig(prev={},types=[]){return {...prev,radius:0,autoSearch:true,onlyOpen:false,unknownHours:false,includeItalian:true,includeUnconfirmed:true,types:[...types],hideVisited:false,ratingsEnabled:true,minRating:0,includeUnrated:false};}
function migrate(root,PD){
 try{
  if(!root.localStorage||root.localStorage.getItem(MIGRATION))return false;
  if(typeof settings==='undefined'||!settings)return false;
  settings.filters=migrationConfig(settings.filters||{},Object.keys(PD.TYPES||{}));
  try{saveSettings();}catch{}
  for(const k of ['pizzascan-map-cache-v3','pizzascan-map-cache-v2','pizzascan-first-map-discovery-v1','pizzascan-first-map-discovery-v2'])root.localStorage.removeItem(k);
  for(let i=root.localStorage.length-1;i>=0;i--){const k=root.localStorage.key(i);if(k?.startsWith('pizzascan-search-')||k?.startsWith('pizzascan-nearby-photon-'))root.localStorage.removeItem(k);}
  root.localStorage.setItem(MIGRATION,'1');
  try{if(typeof mapAreas!=='undefined')mapAreas=[];}catch{}
  return true;
 }catch(e){console.warn('Build45 search migration skipped',e);return false;}
}
function sync(root){try{if(root.PizzaScan)root.PizzaScan.version=VERSION;}catch{}try{const b=root.document?.querySelector('.brand small');if(b)b.textContent=VERSION;}catch{}try{const R=root.PizzaReleaseInfo;if(R?.RELEASE)Object.assign(R.RELEASE,{version:VERSION,build:BUILD,apk:'https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.10.apk'});R?.syncVersion?.();R?.decorate?.();}catch{}}
function install(root){
 const PD=root.PizzaPlaces,Core=root.PizzaCore;if(!PD||!Core)return false;
 PD.query=(center,radius,bounds)=>websimQuery(center,Number(radius)||0,bounds);
 PD.normalize=e=>normalizeElement(e,Core);PD.fromOverpass=els=>normalizeElements(els,Core);PD.filter=filterPlaces;
 let service=null;try{service=typeof placeService!=='undefined'?placeService:root.placeService;}catch{}
 if(service&&typeof service.json==='function'){
  const previous=service.overpass?.bind(service),serial={n:0};
  service.overpass=async function(query,options={}){
   if(!String(query||'').includes(QUERY_MARKER))return previous(query,options);
   if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
   const id=++serial.n,errors=[];
   options.onStatus?.('Pizza- & Italien-Orte werden gesucht …');
   const tasks=PROVIDERS.map(endpoint=>(async()=>{try{
    const data=await this.json(endpoint,{method:'POST',body:new URLSearchParams({data:query})},options.signal,9000);
    if(!Array.isArray(data?.elements)||data.remark)throw Error(data?.remark||'Unvollständige Kartendaten');
    const elements=tagHits(data.elements);if(!elements.length)throw Error('Keine Treffer');
    return {source:new URL(endpoint).hostname,endpoint,elements};
   }catch(e){errors.push({source:new URL(endpoint).hostname,message:e?.message||String(e)});throw e;}})());
   let first;try{first=await firstSuccess(tasks);}catch(error){this.lastErrors=errors;return previous(query,options);}
   try{this.write?.('pizzascan-map-provider-v1',first.endpoint);}catch{}
   options.onStatus?.(`Erste Treffer · ${first.source}`);
   const mergeLate=group=>{if(!group||id!==serial.n||options.signal?.aborted)return;try{
    const found=PD.fromOverpass(group.elements);if(!found.length)return;
    if(typeof mapPool!=='undefined'&&Array.isArray(mapPool))mapPool=PD.merge(mapPool,found);
    if(typeof mapSource!=='undefined'){const a=String(mapSource||'').split(' + ').filter(Boolean);if(!a.includes(group.source))a.push(group.source);mapSource=a.join(' + ');}
    if(typeof mapUpdated!=='undefined')mapUpdated=new Date().toISOString();
    if(typeof storeMapCache==='function')storeMapCache();
    if(typeof refreshArea==='function')refreshArea();
   }catch(e){console.warn('Build45 late merge skipped',e);}};
   tasks.forEach(t=>t.then(g=>{if(g!==first)root.setTimeout(()=>mergeLate(g),0);}).catch(()=>{}));
   Promise.allSettled(tasks).then(()=>{this.lastErrors=errors;});
   return {data:{elements:first.elements},source:first.source,sources:[first.source],progressive:true,complete:false};
  };
  service.overpass.__build45=true;
 }
 let attempts=0;const ready=()=>{attempts++;const changed=migrate(root,PD);sync(root);
  try{
   if(typeof map!=='undefined'&&map&&!map.__build45FastMove){map.__build45FastMove=true;map.on('moveend',()=>{try{if(mapConfig().autoSearch){clearTimeout(queryTimer);queryTimer=setTimeout(()=>loadPlaces(),250);}}catch{}});}
   if(changed&&typeof map!=='undefined'&&map&&typeof loadPlaces==='function')root.setTimeout(()=>loadPlaces({force:true}),50);
  }catch{}
  if((typeof settings==='undefined'||typeof map==='undefined'||!map)&&attempts<120)root.setTimeout(ready,50);
 };ready();
 root.setTimeout(()=>sync(root),500);root.setTimeout(()=>sync(root),1800);
 root.PizzaScanDiscovery45={version:VERSION,build:BUILD,mode:'websim-query-authoritative',defaultViewport:true,queryHitsAuthoritative:true,legacyFilterReset:true,autoSearchDelayMs:250,genericRestaurantsVisible:false};
 return true;
}
return {VERSION,BUILD,MIGRATION,QUERY_MARKER,HIT,PROVIDERS,PIZZA,ITALIAN,area,websimQuery,text,pizzaEvidence,italianEvidence,isQueryHit,classify,normalizeElement,normalizeElements,relevantPlace,filterPlaces,firstSuccess,tagHits,migrationConfig,install};
});
