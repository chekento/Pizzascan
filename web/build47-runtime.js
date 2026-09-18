/* PizzaScan Build 47: complete WebSim search parity.
 * Exact targeted OSM query families stay authoritative; the compact app map gets
 * a WebSim-sized discovery envelope and safe OSM/Photon name supplementation.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else{root.PizzaBuild47=api;api.install(root);}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='2.3.12',BUILD=47;
const MIGRATION='pizzascan-build47-search-migration-v1';
const QUERY_MARKER='pizzascan-build47-websim-complete';
const HIT='pizzascan:build47-query';
const PROVIDERS=[
 'https://overpass-api.de/api/interpreter',
 'https://overpass.private.coffee/api/interpreter',
 'https://overpass.osm.jp/api/interpreter'
];
const SUPPLEMENT_TERMS=['pizza','pizzeria','ristorante','trattoria','osteria','italian restaurant'];
const PIZZA=/(pizza|pizzeria|pizzaria|pizzerie|pizze|pizza[ _-]?(?:bar|restaurant)|ピザ|披萨|披薩|比萨|比薩|بيتزا|пицц|πίτσα|פיצה|피자|พิซซ่า)/iu;
const ITALIAN=/(italian|italiano|italiana|italienne|italienisch|ristorante|trattoria|osteria|cucina\s+italiana|bella\s+italia|forno\s+italiano|pasta)/iu;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const validCenter=c=>c&&Number.isFinite(Number(c.lat))&&Number.isFinite(Number(c.lng));
const validBounds=b=>b&&['south','west','north','east'].every(k=>Number.isFinite(Number(b[k])));

function expandBounds(bounds,widthFactor=1,heightFactor=1){
 if(!validBounds(bounds)||Number(bounds.west)>Number(bounds.east))return bounds;
 const south=Number(bounds.south),north=Number(bounds.north),west=Number(bounds.west),east=Number(bounds.east);
 const cy=(south+north)/2,cx=(west+east)/2;
 const hy=(north-south)/2*clamp(Number(heightFactor)||1,1,3);
 const hx=(east-west)/2*clamp(Number(widthFactor)||1,1,1.6);
 return {south:clamp(cy-hy,-85,85),west:clamp(cx-hx,-180,180),north:clamp(cy+hy,-85,85),east:clamp(cx+hx,-180,180)};
}
function websimSizedBounds(root,bounds){
 if(!validBounds(bounds))return bounds;
 try{
  const rect=root.document?.getElementById('map')?.getBoundingClientRect?.();
  const vh=Number(root.innerHeight)||rect?.height||1,vw=Number(root.innerWidth)||rect?.width||1;
  const hf=rect?.height?clamp((vh*.82)/rect.height,1,2.6):1.7;
  const wf=rect?.width?clamp((vw*.94)/rect.width,1,1.35):1.05;
  return expandBounds(bounds,wf,hf);
 }catch{return expandBounds(bounds,1.05,1.7);}
}
function area(center,radius,bounds){
 const r=Number(radius)||0;
 if(r>0){if(!validCenter(center))throw Error('Ungültiger Suchmittelpunkt');return `around:${Math.round(clamp(r,.5,10)*1000)},${Number(center.lat)},${Number(center.lng)}`;}
 if(validBounds(bounds))return `${Number(bounds.south)},${Number(bounds.west)},${Number(bounds.north)},${Number(bounds.east)}`;
 if(validCenter(center))return `around:5000,${Number(center.lat)},${Number(center.lng)}`;
 throw Error('Ungültiger Suchbereich');
}
function websimQuery(center,radius,bounds){
 const a=area(center,radius,bounds);
 const pizza='pizza|pizzeria|pizzaria|pizze|ピザ|披萨|披薩|比萨|比薩|بيتزا|пицц|πίτσα|פיצה|피자|พิซซ่า';
 return `[out:json][timeout:20];(/* ${QUERY_MARKER} */
nwr["cuisine"~"${pizza}|italian|italiano|italiana|italienne|italienisch|pasta",i](${a});
nwr["amenity"="restaurant"]["cuisine"~"pizza|pizzeria|italian|italiano|italiana|pasta",i](${a});
nwr["amenity"~"cafe|fast_food|food_truck|takeaway|food_court|bar|pub|biergarten"]["cuisine"~"pizza|pizzeria|italian|italiano|italiana|pasta",i](${a});
nwr["name"~"${pizza}|ristorante|trattoria|osteria|cucina italiana|bella italia|forno italiano|italian restaurant",i](${a});
nwr["alt_name"~"${pizza}|ristorante|trattoria|osteria|italian",i](${a});
nwr["official_name"~"${pizza}|ristorante|trattoria|osteria|italian",i](${a});
nwr["brand"~"${pizza}|ristorante|trattoria|osteria|italian",i](${a});
nwr["operator"~"${pizza}|ristorante|trattoria|osteria|italian",i](${a});
nwr["speciality"~"${pizza}",i](${a});
nwr["dish"~"${pizza}",i](${a});nwr["served_dish"~"${pizza}",i](${a});
nwr["product"~"${pizza}",i](${a});nwr["products"~"${pizza}",i](${a});
nwr["menu"~"${pizza}",i](${a});nwr["website:menu"~"${pizza}",i](${a});nwr["contact:menu"~"${pizza}",i](${a});
nwr["description"~"${pizza}|italian restaurant|italian cuisine|cucina italiana",i](${a});
nwr["note"~"${pizza}|italian restaurant|italian cuisine|cucina italiana",i](${a});
nwr["vending"~"pizza",i](${a});nwr["vending:pizza"="yes"](${a});
);out body center qt;`;
}
function text(tags={}){return Object.entries(tags).filter(([k,v])=>v!=null&&/^(name(?::.*)?|alt_name|official_name|brand|operator|cuisine|speciality|dish|served_dish|product|products|description(?::.*)?|note(?::.*)?|menu(?::.*)?|website:menu|contact:menu|vending)$/i.test(k)).map(([,v])=>String(v)).join(' ');}
function pizzaEvidence(t={}){return t['vending:pizza']==='yes'||PIZZA.test(String(t.vending||''))||PIZZA.test(text(t));}
function italianEvidence(t={}){return ITALIAN.test([t.cuisine,t.name,t.alt_name,t.official_name,t.brand,t.operator,t.description,t.note].filter(Boolean).join(' '));}
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
 const name=String(t.name||t.alt_name||t.official_name||t.brand||t.operator||(confirmed?'Pizza-Ort ohne Namen':possible?'Italienischer Ort ohne Namen':'PizzaScan-Treffer ohne Namen')).trim();
 return Core.place({placeId:`${e.type}-${e.id}`,name,lat:Number(lat),lng:Number(lng),type:classify(t,confirmed),openingHours:t.opening_hours||'',website:t.website||t['contact:website'],phone:t.phone||t['contact:phone']||t.mobile_phone,address:address(t),cuisine:t.cuisine||'',menu:t['website:menu']||t['contact:menu']||t['menu:website']||'',description:t.description||'',tags:t,country:t['addr:country']||'',state:t['addr:state']||'',pizzaEvidence:confirmed?'confirmed':possible?'possible':'search',updatedAt:new Date().toISOString(),dataSource:t['pizzascan:source']==='photon-name'?'OpenStreetMap · Photon':'OpenStreetMap'});
}
function normalizeElements(list,Core){const m=new Map();for(const e of Array.isArray(list)?list:[]){const p=normalizeElement(e,Core);if(p)m.set(p.placeId,p);}return [...m.values()];}
function relevantPlace(p){return !!p&&(p.pizzaEvidence==='confirmed'||p.pizzaEvidence==='possible'||p.pizzaEvidence==='search'||p.tags?.[HIT]==='yes');}
function filterPlaces(list,cfg={},context={},hours=()=>({state:'unknown'})){const types=Array.isArray(cfg.types)?cfg.types:null;return (list||[]).filter(p=>{if(!relevantPlace(p))return false;if(types&&!types.includes(p.type))return false;if(cfg.includeItalian===false&&p.pizzaEvidence==='possible')return false;if(cfg.hideVisited&&context.visited?.has?.(p.placeId))return false;if(cfg.onlyOpen){const s=hours(p)?.state;if(s!=='open'&&!(cfg.unknownHours&&s==='unknown'))return false;}return true;});}
function tagHits(elements){return (Array.isArray(elements)?elements:[]).filter(e=>pizzaEvidence(e?.tags||{})||italianEvidence(e?.tags||{})).map(e=>({...e,tags:{...(e.tags||{}),[HIT]:'yes'}}));}
function firstSuccess(promises){return new Promise((resolve,reject)=>{let left=promises.length,errors=[];if(!left)return reject(Error('Keine Kartenquelle konfiguriert'));promises.forEach((p,i)=>Promise.resolve(p).then(v=>resolve(v),e=>{errors[i]=e;if(--left===0)reject(errors.find(Boolean)||Error('Keine Kartenquelle erreichbar'));}));});}
function queryAreaInfo(query){
 const q=String(query||'');let m=/around:(\d+),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(q);
 if(m)return {center:{lat:Number(m[2]),lng:Number(m[3])},radius:Number(m[1])/1000};
 m=/\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\)/.exec(q);
 if(!m)return null;const bounds={south:Number(m[1]),west:Number(m[2]),north:Number(m[3]),east:Number(m[4])};return {bounds,center:{lat:(bounds.south+bounds.north)/2,lng:(bounds.west+bounds.east)/2}};
}
function inside(info,p,Core){if(!info||!validCenter(p))return false;if(info.bounds)return p.lat>=info.bounds.south&&p.lat<=info.bounds.north&&p.lng>=info.bounds.west&&p.lng<=info.bounds.east;return Core?.distance?Core.distance(info.center,p)<=info.radius:true;}
function nameMatches(term,name=''){const n=String(name);if(/pizza|pizzeria/i.test(term))return PIZZA.test(n);if(/ristorante/i.test(term))return /ristorante/i.test(n);if(/trattoria/i.test(term))return /trattoria/i.test(n);if(/osteria/i.test(term))return /osteria/i.test(n);return /italian|italiano|italiana|cucina/i.test(n);}
function migrate(root,PD){try{if(!root.localStorage||root.localStorage.getItem(MIGRATION)||typeof settings==='undefined'||!settings)return false;settings.filters={...(settings.filters||{}),radius:0,autoSearch:true,onlyOpen:false,unknownHours:false,includeItalian:true,includeUnconfirmed:true,types:Object.keys(PD.TYPES||{}),hideVisited:false,ratingsEnabled:true,minRating:0,includeUnrated:false};try{saveSettings();}catch{}for(const k of ['pizzascan-map-cache-v3','pizzascan-map-cache-v2','pizzascan-first-map-discovery-v1','pizzascan-first-map-discovery-v2'])root.localStorage.removeItem(k);root.localStorage.setItem(MIGRATION,'1');try{if(typeof mapAreas!=='undefined')mapAreas=[];}catch{}return true;}catch(e){console.warn('Build47 migration skipped',e);return false;}}
function sync(root){
 try{
  const app=root.PizzaScan;
  if(app){
   const d=Object.getOwnPropertyDescriptor(app,'version');
   if(d?.configurable!==false)Object.defineProperty(app,'version',{configurable:false,enumerable:true,get:()=>VERSION,set(){}});
  }
 }catch{}
 try{
  const b=root.document?.querySelector('.brand small');
  if(b){
   if(b.textContent!==VERSION)b.textContent=VERSION;
   if(!b.__build47VersionObserver){
    b.__build47VersionObserver=true;
    new MutationObserver(()=>{if(b.textContent!==VERSION)b.textContent=VERSION;}).observe(b,{childList:true,characterData:true,subtree:true});
   }
  }
 }catch{}
 try{
  const R=root.PizzaReleaseInfo;
  if(R?.RELEASE)Object.assign(R.RELEASE,{version:VERSION,build:BUILD,apk:'https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.12.apk'});
  R?.syncVersion?.();R?.decorate?.();
 }catch{}
}
function installStyle(root){const d=root.document;if(!d||d.getElementById('build47-style'))return;const s=d.createElement('style');s.id='build47-style';s.textContent=`#map{height:clamp(360px,52dvh,620px)!important}.map-caption{min-height:18px!important}@media(max-height:500px){#map{height:220px!important}}`;d.head.appendChild(s);}
function install(root){
 const PD=root.PizzaPlaces,Core=root.PizzaCore;if(!PD||!Core)return false;
 PD.query=(center,radius,bounds)=>websimQuery(center,Number(root.mapConfig?.().radius??radius)||0,(Number(root.mapConfig?.().radius??radius)||0)>0?bounds:websimSizedBounds(root,bounds));
 PD.normalize=e=>normalizeElement(e,Core);PD.fromOverpass=els=>normalizeElements(els,Core);PD.filter=filterPlaces;
 let service=null;try{service=typeof placeService!=='undefined'?placeService:root.placeService;}catch{}
 if(service&&typeof service.json==='function'){
  const previous=service.overpass?.bind(service),serial={n:0};
  service.overpass=async function(query,options={}){
   if(!String(query||'').includes(QUERY_MARKER))return previous(query,options);
   if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
   const id=++serial.n,errors=[],info=queryAreaInfo(query);
   options.onStatus?.('Pizza- & Italien-Orte werden gesucht …');
   const tasks=PROVIDERS.map(endpoint=>(async()=>{try{const data=await this.json(endpoint,{method:'POST',body:new URLSearchParams({data:query})},options.signal,9000);if(!Array.isArray(data?.elements)||data.remark)throw Error(data?.remark||'Unvollständige Kartendaten');if(!data.elements.length)throw Error('Keine Treffer');return {source:new URL(endpoint).hostname,endpoint,elements:tagHits(data.elements)};}catch(e){errors.push({source:new URL(endpoint).hostname,message:e?.message||String(e)});throw e;}})());
   let first;try{first=await firstSuccess(tasks);}catch(error){this.lastErrors=errors;return {data:{elements:[]},source:'OpenStreetMap',sources:[],complete:true,empty:true};}
   try{this.write?.('pizzascan-map-provider-v1',first.endpoint);}catch{}
   const mergeGroup=group=>{if(!group||id!==serial.n||options.signal?.aborted)return;try{const found=PD.fromOverpass(group.elements);if(!found.length)return;if(typeof mapPool!=='undefined'&&Array.isArray(mapPool))mapPool=PD.merge(mapPool,found);if(typeof mapSource!=='undefined'){const a=String(mapSource||'').split(' + ').filter(Boolean);if(!a.includes(group.source))a.push(group.source);mapSource=a.join(' + ');}if(typeof mapUpdated!=='undefined')mapUpdated=new Date().toISOString();if(typeof storeMapCache==='function')storeMapCache();if(typeof refreshArea==='function')refreshArea();}catch(e){console.warn('Build47 progressive merge skipped',e);}};
   tasks.forEach(t=>t.then(g=>{if(g!==first)root.setTimeout(()=>mergeGroup(g),0);}).catch(()=>{}));
   if(typeof this.photon==='function'&&typeof PD.photonElement==='function')root.setTimeout(async()=>{for(const term of SUPPLEMENT_TERMS){if(id!==serial.n||options.signal?.aborted)break;try{const items=await this.photon(term,info?.center||{lat:0,lng:0},{signal:options.signal});const elements=[];for(const item of items||[]){if(!nameMatches(term,item?.name||item?.place?.name||''))continue;const e=PD.photonElement(item,term);const lat=e?.lat??e?.center?.lat,lng=e?.lon??e?.center?.lon;if(!e||!inside(info,{lat:Number(lat),lng:Number(lng)},Core))continue;elements.push({...e,tags:{...(e.tags||{}),[HIT]:'yes','pizzascan:source':'photon-name'}});}if(elements.length)mergeGroup({source:'photon.komoot.io',elements});}catch(e){if(options.signal?.aborted)break;}}},0);
   Promise.allSettled(tasks).then(()=>{this.lastErrors=errors;});
   return {data:{elements:first.elements},source:first.source,sources:[first.source],progressive:true,complete:false};
  };
  service.overpass.__build47=true;
 }
 let tries=0;const ready=()=>{tries++;const changed=migrate(root,PD);sync(root);installStyle(root);try{if(typeof map!=='undefined'&&map&&!map.__build47FastMove){map.__build47FastMove=true;map.on('moveend',()=>{try{if(mapConfig().autoSearch){clearTimeout(queryTimer);queryTimer=setTimeout(()=>loadPlaces(),180);}}catch{}});}if(changed&&typeof map!=='undefined'&&map&&typeof loadPlaces==='function')root.setTimeout(()=>loadPlaces({force:true}),50);}catch{}if((typeof settings==='undefined'||typeof map==='undefined'||!map)&&tries<120)root.setTimeout(ready,50);};ready();
 [0,250,700,1400,3000].forEach(ms=>root.setTimeout(()=>{sync(root);installStyle(root);},ms));
 root.PizzaScanDiscovery47={version:VERSION,build:BUILD,mode:'complete-websim-search-parity',queryHitsAuthoritative:true,websimSizedViewport:true,photonNameSupplement:true,searchBar:true,addressSearch:true,localSuggestions:true,gpsSearch:true,autoSearchDelayMs:180,genericRestaurantsVisible:false};
 return true;
}
return {VERSION,BUILD,MIGRATION,QUERY_MARKER,HIT,PROVIDERS,SUPPLEMENT_TERMS,PIZZA,ITALIAN,expandBounds,websimSizedBounds,area,websimQuery,text,pizzaEvidence,italianEvidence,isQueryHit,classify,normalizeElement,normalizeElements,relevantPlace,filterPlaces,tagHits,firstSuccess,queryAreaInfo,inside,nameMatches,install};
});
