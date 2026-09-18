/* PizzaScan 2.3.9 · Build 44
 * WebSim-first map discovery: fast focused first paint, progressive mirror union,
 * background evidence enrichment and compact map controls.
 */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaBuild44=api;api.install(root);}
})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';

const VERSION='2.3.9',BUILD=44;
const FAST_MARKER='pizzascan-build44-websim-fast';
const ENRICH_MARKER='pizzascan-build44-evidence-enrich';
const MIGRATION_KEY='pizzascan-build44-search-migration-v1';
const PROVIDERS=[
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.osm.jp/api/interpreter'
];
const FAST_TIMEOUT=9000;
const ENRICH_TIMEOUT=12000;
const PIZZA='pizza|pizzeria|pizzaria|pizze|pizzerie|ピザ|披萨|披薩|比萨|比薩|بيتزا|пицц|πίτσα|פיצה|피자|พิซซ่า';
const ITALIAN='italian|italiano|italiana|italienne|italienisch';

function validCenter(c){return c&&Number.isFinite(Number(c.lat))&&Number.isFinite(Number(c.lng));}
function validBounds(b){return b&&['south','west','north','east'].every(k=>Number.isFinite(Number(b[k])));}
function areaToken(center,radius,bounds){
  const r=Number(radius)||0;
  if(r>0){
    if(!validCenter(center))throw Error('Ungültiger Suchmittelpunkt');
    return `around:${Math.round(Math.max(.5,Math.min(10,r))*1000)},${Number(center.lat)},${Number(center.lng)}`;
  }
  if(validBounds(bounds))return `${Number(bounds.south)},${Number(bounds.west)},${Number(bounds.north)},${Number(bounds.east)}`;
  if(validCenter(center))return `around:5000,${Number(center.lat)},${Number(center.lng)}`;
  throw Error('Ungültiger Suchbereich');
}

/* Direct semantic equivalent of the original WebSim selector families.
 * Expensive free-text evidence is intentionally moved to enrichQuery so it cannot
 * delay the first visible set of markers. */
function fastQuery(center,radius,bounds){
  const a=areaToken(center,radius,bounds);
  return `[out:json][timeout:10];(/* ${FAST_MARKER} */`+
    `nwr["cuisine"="pizza"](${a});`+
    `nwr["amenity"="restaurant"]["cuisine"="italian"](${a});`+
    `nwr["amenity"="restaurant"]["cuisine"~"${PIZZA}|${ITALIAN}",i](${a});`+
    `nwr["vending"~"pizza",i](${a});nwr["vending:pizza"="yes"](${a});`+
    `nwr["amenity"="cafe"]["cuisine"~"${PIZZA}|${ITALIAN}",i](${a});`+
    `nwr["amenity"="fast_food"]["cuisine"~"${PIZZA}|${ITALIAN}",i](${a});`+
    `nwr["amenity"="food_truck"]["cuisine"~"${PIZZA}|${ITALIAN}",i](${a});`+
    `nwr["speciality"~"${PIZZA}",i](${a});`+
    `nwr["amenity"~"bar|pub"]["cuisine"~"${PIZZA}|${ITALIAN}",i](${a});`+
    `nwr["name"~"${PIZZA}",i](${a});`+
    `nwr["description"~"${PIZZA}",i](${a});`+
    `nwr["amenity"="takeaway"]["cuisine"~"${PIZZA}|${ITALIAN}",i](${a});`+
    `);out body center qt;`;
}

/* Additive only. These selectors catch pizza evidence that the original project
 * could see through descriptions plus newer structured OSM fields. */
function enrichQuery(center,radius,bounds){
  const a=areaToken(center,radius,bounds);
  return `[out:json][timeout:12];(/* ${ENRICH_MARKER} */`+
    `nwr["description"~"italian restaurant|italian cuisine|cucina italiana",i](${a});`+
    `nwr["note"~"${PIZZA}",i](${a});`+
    `nwr["product"~"${PIZZA}",i](${a});nwr["products"~"${PIZZA}",i](${a});`+
    `nwr["menu"~"${PIZZA}",i](${a});nwr["website:menu"~"${PIZZA}",i](${a});`+
    `nwr["brand"~"${PIZZA}|ristorante|trattoria|osteria|bella italia",i](${a});`+
    `nwr["operator"~"${PIZZA}|ristorante|trattoria|osteria|cucina italiana",i](${a});`+
    `nwr["shop"~"bakery|deli|convenience|food"]["name"~"${PIZZA}",i](${a});`+
    `);out body center qt;`;
}
function isFastQuery(q){return String(q||'').includes(FAST_MARKER);}
function isEnrichQuery(q){return String(q||'').includes(ENRICH_MARKER);}
function endpointHost(value){try{return new URL(String(value)).hostname;}catch{return String(value||'OSM');}}
function providerOrder(service){
  let preferred='';
  try{preferred=String(service?.read?.('pizzascan-map-provider-v1')||'');}catch{}
  return [...new Set([preferred,...PROVIDERS].filter(x=>PROVIDERS.includes(x)))];
}
function relevantCount(PD,elements){
  try{return PD?.fromOverpass?.(Array.isArray(elements)?elements:[])?.length||0;}catch{return 0;}
}
async function fetchGroup(service,endpoint,query,signal,timeout){
  const data=await service.json(endpoint,{method:'POST',body:new URLSearchParams({data:query})},signal,timeout);
  if(!data||!Array.isArray(data.elements)||data.remark)throw Error(data?.remark||'Unvollständige OpenStreetMap-Antwort');
  return {endpoint,source:endpointHost(endpoint),elements:data.elements};
}

/* Unlike Build 42, an empty mirror is NOT allowed to win the race. */
function firstUseful(tasks,useful){
  return new Promise((resolve,reject)=>{
    if(!tasks.length)return reject(Error('Keine Kartenquelle verfügbar'));
    let remaining=tasks.length,firstEmpty=null,resolved=false;
    const errors=[];
    tasks.forEach(task=>Promise.resolve(task).then(group=>{
      if(resolved)return;
      if(useful(group)){resolved=true;resolve(group);return;}
      if(!firstEmpty)firstEmpty=group;
      if(--remaining===0){resolved=true;resolve(firstEmpty||{elements:[],source:'OpenStreetMap',endpoint:''});}
    }).catch(error=>{
      errors.push(error);
      if(resolved)return;
      if(--remaining===0){resolved=true;firstEmpty?resolve(firstEmpty):reject(errors[0]||Error('Kartensuche fehlgeschlagen'));}
    }));
  });
}
function mergeUnique(elements=[]){
  const out=new Map();
  for(const e of elements||[]){
    const k=e&&`${e.type}-${e.id}`;
    if(k&&k!=='undefined-undefined'&&!out.has(k))out.set(k,e);
  }
  return [...out.values()];
}
function mergeGroups(...groups){return mergeUnique(groups.flatMap(g=>Array.isArray(g)?g:g?.elements||[]));}

function exactRadius(root,fallback){
  try{
    const r=Number(root.mapConfig?.().radius);
    if(Number.isFinite(r)&&r>=0&&r<=10)return r;
  }catch{}
  return Number(fallback)||0;
}
function migrateDiscoveryDefaults(root,PD){
  try{
    if(root.localStorage?.getItem(MIGRATION_KEY))return false;
    if(typeof settings!=='undefined'&&settings){
      const raw=settings.filters||{};
      const types=[...new Set([...(Array.isArray(raw.types)?raw.types:[]),...Object.keys(PD.TYPES||{})])];
      const oldRadius=Number(raw.radius);
      const radius=!Number.isFinite(oldRadius)||oldRadius===5?0:oldRadius;
      settings.filters={...raw,includeItalian:true,types,radius};
      if(typeof saveSettings==='function')saveSettings();
    }
    root.localStorage?.setItem(MIGRATION_KEY,JSON.stringify({build:BUILD,time:Date.now()}));
    return true;
  }catch{return false;}
}
function relevantVisibleFilter(PD){
  const old=PD.filter;
  if(typeof old!=='function'||old.__build44)return;
  const wrapped=function(list,cfg={},context={},hours){
    const filtered=old(list,cfg,context,hours);
    if(cfg?.includeItalian===false)return filtered;
    const present=new Set(filtered.map(p=>p.placeId));
    for(const p of list||[]){
      if(p?.pizzaEvidence!=='possible'||present.has(p.placeId))continue;
      if(cfg.onlyOpen){const state=hours?.(p)?.state;if(state!=='open'&&!(cfg.unknownHours&&state==='unknown'))continue;}
      if(cfg.hideVisited&&context?.visited?.has?.(p.placeId))continue;
      filtered.push(p);present.add(p.placeId);
    }
    return filtered;
  };
  wrapped.__build44=true;wrapped.__inner=old;PD.filter=wrapped;
}

function installFastTransport(root,PD){
  let service=null;try{service=typeof placeService!=='undefined'?placeService:null;}catch{}
  if(!service||typeof service.json!=='function'||typeof service.overpass!=='function')return false;
  if(service.overpass.__build44)return true;
  const previous=service.overpass.bind(service);
  let requestSerial=0;

  function applyLate(group,serial,label='OSM',attempt=0){
    if(!group?.elements?.length)return;
    try{
      if(serial!==requestSerial||typeof mapRequest!=='undefined'&&mapRequest?.signal?.aborted)return;
      if(typeof mapLoading!=='undefined'&&mapLoading&&attempt<12){root.setTimeout(()=>applyLate(group,serial,label,attempt+1),60);return;}
      const found=PD.fromOverpass(group.elements);
      if(!found.length)return;
      mapPool=PD.merge(mapPool,found);
      if(typeof storeMapCache==='function')storeMapCache();
      if(typeof refreshArea==='function')refreshArea();
      const status=root.document?.getElementById('map-status');
      if(status&&!mapLoading)status.textContent=`${places.length} Pizza-/Italien-Orte · ${label}`;
    }catch(error){console.warn('PizzaScan Build 44 late merge skipped',error);}
  }
  function launchEnrichment(query,serial,signal){
    const area=extractArea(query);
    if(!area)return;
    const q=enrichQuery(area.center,area.radius,area.bounds);
    root.setTimeout(()=>{
      if(signal?.aborted||serial!==requestSerial)return;
      const endpoints=providerOrder(service);
      endpoints.forEach(endpoint=>{
        fetchGroup(service,endpoint,q,signal,ENRICH_TIMEOUT)
          .then(group=>applyLate(group,serial,'OSM + Evidenz'))
          .catch(()=>{});
      });
    },180);
  }

  service.overpass=async function(query,options={}){
    if(!isFastQuery(query))return previous(query,options);
    if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    const serial=++requestSerial,endpoints=providerOrder(service),errors=[];
    options.onStatus?.('Pizza-Orte werden gesucht …');
    const tasks=endpoints.map(endpoint=>fetchGroup(service,endpoint,query,options.signal,FAST_TIMEOUT).catch(error=>{
      errors.push({source:endpointHost(endpoint),message:error?.message||String(error)});throw error;
    }));
    let first;
    try{
      first=await firstUseful(tasks,g=>relevantCount(PD,g.elements)>0);
    }catch(error){
      this.lastErrors=errors;
      return previous(query,options);
    }
    if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    try{if(first.endpoint&&first.elements.length)this.write?.('pizzascan-map-provider-v1',first.endpoint);}catch{}
    this.lastErrors=errors;
    const firstCount=relevantCount(PD,first.elements);
    options.onStatus?.(firstCount?`${firstCount} erste Treffer · weitere OSM-Quellen ergänzen …`:'Keine Treffer in der ersten Quelle · weitere Quellen werden geprüft …');

    tasks.forEach(task=>task.then(group=>{
      if(group.endpoint!==first.endpoint)root.setTimeout(()=>applyLate(group,serial,'mehrere OSM-Quellen'),0);
    }).catch(()=>{}));
    launchEnrichment(query,serial,options.signal);

    return {data:{elements:first.elements},source:first.source||'OpenStreetMap',sources:[first.source].filter(Boolean),progressive:true,complete:false,websimFirst:true};
  };
  service.overpass.__build44=true;
  service.overpass.__inner=previous;
  return true;
}

function extractArea(query){
  const q=String(query||'');
  let m=/around:(\d+),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(q);
  if(m)return {center:{lat:Number(m[2]),lng:Number(m[3])},radius:Number(m[1])/1000,bounds:null};
  m=/\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\)/.exec(q);
  if(!m)return null;
  const bounds={south:Number(m[1]),west:Number(m[2]),north:Number(m[3]),east:Number(m[4])};
  return {center:{lat:(bounds.south+bounds.north)/2,lng:(bounds.west+bounds.east)/2},radius:0,bounds};
}

function syncVersion(root){
  try{if(root.PizzaScan)root.PizzaScan.version=VERSION;}catch{}
  try{const badge=root.document?.querySelector?.('.brand small');if(badge)badge.textContent=VERSION;}catch{}
  try{
    const R=root.PizzaReleaseInfo;
    if(R?.RELEASE)Object.assign(R.RELEASE,{version:VERSION,build:BUILD,apk:'https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.9.apk'});
    R?.syncVersion?.();R?.decorate?.();
  }catch{}
}

function compactToolbar(root){
  const d=root.document;if(!d)return;
  const bar=d.getElementById('build44-tools');
  if(bar&&!bar.dataset.bound){
    bar.dataset.bound='true';
    const search=d.getElementById('build44-place-search');
    const refresh=d.getElementById('build44-refresh');
    if(search)search.onclick=event=>{event.preventDefault();d.getElementById('search-toggle')?.click();};
    if(refresh)refresh.onclick=event=>{event.preventDefault();event.stopPropagation();try{loadPlaces({force:true});}catch(error){console.error(error);}};
  }
  const legacy=d.getElementById('build40-tools');
  if(legacy){legacy.hidden=true;legacy.setAttribute('aria-hidden','true');}
  const note=d.getElementById('cache-mode-note');
  if(note){note.hidden=true;note.setAttribute('aria-hidden','true');}

  /* Clone removes Build 40's capture listener that redirected the ordinary
   * "Hier suchen" action into the expensive integrity/full-refresh path. */
  const current=d.getElementById('map-refresh');
  if(current&&!current.dataset.build44){
    const fresh=current.cloneNode(true);
    fresh.dataset.build44='true';fresh.textContent='Hier suchen';fresh.title='Aktuellen Suchbereich schnell neu laden';
    current.replaceWith(fresh);
    fresh.onclick=event=>{event.preventDefault();event.stopPropagation();try{loadPlaces({force:true});}catch(error){console.error(error);}};
  }
}
function decorateFilterSheet(root){
  const d=root.document;if(!d)return;
  const sheet=d.getElementById('sheet'),body=d.getElementById('sheet-body');
  if(!sheet||!body)return;
  sheet.classList.toggle('build44-filter-sheet',typeof sheetKind!=='undefined'&&sheetKind==='filters');
  if(!sheet.classList.contains('build44-filter-sheet')||body.querySelector('.build44-filter-intro'))return;
  const intro=d.createElement('div');intro.className='build44-filter-intro';intro.innerHTML='<strong>🍕 Pizza-Suche</strong><span>Pizza + italienischer Bezug · weitere Optionen kompakt darunter</span>';
  body.querySelector('h1')?.after(intro);

  const movable=[];
  const type=body.querySelector('.type-filters');if(type)movable.push(type);
  for(const id of ['filter-auto','filter-visited','filter-only-visited','gps-on-start','travel-mode']){
    const el=d.getElementById(id),box=el?.closest('.field,label');
    if(box&&!movable.includes(box))movable.push(box);
  }
  if(movable.length){
    const details=d.createElement('details');details.className='build44-advanced-filters';
    details.innerHTML='<summary>Weitere Filter & Kartenoptionen</summary><div class="build44-advanced-body"></div>';
    const first=movable[0];first.parentNode?.insertBefore(details,first);
    const target=details.querySelector('.build44-advanced-body');movable.forEach(el=>target.appendChild(el));
  }
}
function improveFilterMenu(root){
  try{
    if(typeof showFilters!=='function'||showFilters.__build44)return;
    const old=showFilters;
    showFilters=function(){const out=old.apply(this,arguments);root.setTimeout(()=>decorateFilterSheet(root),0);return out;};
    showFilters.__build44=true;showFilters.__inner=old;root.showFilters=showFilters;
    const filterButton=root.document.getElementById('filter-open'),fsFilter=root.document.getElementById('fs-filter');
    if(filterButton)filterButton.onclick=showFilters;if(fsFilter)fsFilter.onclick=showFilters;
  }catch{}
}
function syncAfterBoot(root){
  let tries=0;
  const tick=()=>{
    syncVersion(root);compactToolbar(root);
    if(++tries<80&&!root.PizzaScan?.ready)root.setTimeout(tick,50);
    else for(const ms of [0,250,900,1800])root.setTimeout(()=>{syncVersion(root);compactToolbar(root);},ms);
  };
  tick();
}

function install(root){
  if(!root.document||!root.PizzaPlaces)return false;
  const PD=root.PizzaPlaces;
  migrateDiscoveryDefaults(root,PD);
  relevantVisibleFilter(PD);

  /* Final query policy: exact selected radius (or viewport at 0 km), with the
   * original WebSim selector families as the first-pass baseline. */
  PD.query=(center,radius,bounds)=>fastQuery(center,exactRadius(root,radius),bounds);

  installFastTransport(root,PD);
  improveFilterMenu(root);
  compactToolbar(root);
  syncAfterBoot(root);

  const legend=root.document.querySelector('.map-legend p:nth-of-type(2)');
  if(legend)legend.innerHTML='<strong>Build 44:</strong> Schneller WebSim-first-Pass mit den ursprünglichen Pizza-/Italien-Selektoren. Der erste nicht-leere OSM-Spiegel wird sofort angezeigt; weitere Spiegel und zusätzliche Menü-/Produkt-/Beschreibungs-Evidenz ergänzen danach im Hintergrund. Keine allgemeinen Restaurants ohne Pizza-/Italien-Bezug.';

  root.PizzaScanDiscovery44={
    version:VERSION,build:BUILD,mode:'websim-first-progressive',
    originalSelectorParity:true,firstNonEmptyProvider:true,
    backgroundEnrichment:true,noGenericRestaurants:true,
    ordinaryRefreshIsFast:true,providers:PROVIDERS.slice()
  };
  return true;
}

return {
  VERSION,BUILD,FAST_MARKER,ENRICH_MARKER,MIGRATION_KEY,PROVIDERS,FAST_TIMEOUT,ENRICH_TIMEOUT,
  areaToken,fastQuery,enrichQuery,isFastQuery,isEnrichQuery,endpointHost,providerOrder,
  relevantCount,firstUseful,mergeUnique,mergeGroups,extractArea,exactRadius,install
};
});
