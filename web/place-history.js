/* PizzaScan persistent discovery + visit archive.
 * Keeps every discovered PizzaScan place in IndexedDB, restores it on startup,
 * adds an only-visited filter and provides a human-readable Markdown backup.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaPlaceHistory=api;api.install(root);}
})(globalThis,function(){
'use strict';

const DB_NAME='pizzascan-state-v3';
const DB_VERSION=1;
const PLACE_STORE='places';
const VISIT_STORE='visits';
const ARCHIVE_FORMAT='pizzascan-visited';
const ARCHIVE_VERSION=1;
const PROVIDER_TIMEOUT=65000;

function validPlaceId(value){return /^(node|way|relation)-\d+$/.test(String(value||''));}
function validCoords(p){return p&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng))&&Math.abs(Number(p.lat))<=90&&Math.abs(Number(p.lng))<=180;}
function cleanPlace(p){
  if(!p||!validPlaceId(p.placeId)||!validCoords(p)||typeof p.name!=='string'||!p.name.trim())throw Error('Ungültiger PizzaScan-Ort im Archiv.');
  return {...p,placeId:String(p.placeId),name:p.name.slice(0,300),lat:Number(p.lat),lng:Number(p.lng)};
}
function cleanEvent(event){
  if(!event||typeof event!=='object'||typeof event.id!=='string'||!event.id||event.id.length>180)throw Error('Ungültiger Besuchseintrag.');
  const rating=Number(event.rating);
  if(!Number.isFinite(rating)||rating<.1||rating>10)throw Error('Bewertung muss zwischen 0,1 und 10,0 liegen.');
  return {id:event.id.slice(0,180),rating:Math.round(rating*10)/10,notes:String(event.notes||'').slice(0,4000),source:String(event.source||'visit').slice(0,40),updatedAt:Number.isFinite(Date.parse(event.updatedAt||''))?new Date(event.updatedAt).toISOString():new Date().toISOString()};
}
function mergeVisitRecords(oldRecord,newRecord){
  const incoming={...newRecord,place:cleanPlace(newRecord.place)},old=oldRecord&&oldRecord.placeId===incoming.place.placeId?oldRecord:null;
  const events=new Map();
  for(const event of old?.events||[])try{const e=cleanEvent(event);events.set(e.id,e);}catch{}
  for(const event of incoming.events||[])try{const e=cleanEvent(event);events.set(e.id,e);}catch{}
  const now=new Date().toISOString();
  return {placeId:incoming.place.placeId,place:incoming.place,firstVisitedAt:old?.firstVisitedAt||incoming.firstVisitedAt||now,updatedAt:incoming.updatedAt||now,events:[...events.values()].sort((a,b)=>a.updatedAt.localeCompare(b.updatedAt)),openReviews:{...(old?.openReviews||{}),...(incoming.openReviews||{})}};
}
function archiveObject(records){
  return {format:ARCHIVE_FORMAT,version:ARCHIVE_VERSION,exportedAt:new Date().toISOString(),visits:(records||[]).map(r=>mergeVisitRecords(null,r))};
}
function archiveToMarkdown(records){
  const data=archiveObject(records),lines=['# PizzaScan Besuchsarchiv','','<!-- pizzascan-visited-v1 -->','',`Exportiert: ${data.exportedAt}`,'',`Besuchte/bewertete Orte: ${data.visits.length}`,''];
  for(const record of data.visits){
    lines.push(`## ${record.place.name.replace(/[\r\n#]+/g,' ').trim()}`,'',`- PizzaScan-ID: \`${record.placeId}\``,`- Position: ${record.place.lat.toFixed(6)}, ${record.place.lng.toFixed(6)}`);
    if(record.place.address)lines.push(`- Adresse: ${String(record.place.address).replace(/[\r\n]+/g,' ')}`);
    if(record.events.length)lines.push(`- Bewertungen: ${record.events.map(e=>`${e.rating.toFixed(1)}/10`).join(', ')}`);
    lines.push('');
  }
  lines.push('## Maschinenlesbares Backup','','```json',JSON.stringify(data,null,2),'```','');
  return lines.join('\n');
}
function archiveFromMarkdown(text){
  const source=String(text||'');
  if(!source.includes('pizzascan-visited-v1'))throw Error('Das ist kein PizzaScan-Besuchsarchiv.');
  const match=/```json\s*([\s\S]*?)\s*```/i.exec(source);if(!match)throw Error('Maschinenlesbare Archivdaten fehlen.');
  let data;try{data=JSON.parse(match[1]);}catch{throw Error('Archivdaten sind beschädigt.');}
  if(data?.format!==ARCHIVE_FORMAT||data?.version!==ARCHIVE_VERSION||!Array.isArray(data.visits))throw Error('Nicht unterstützte PizzaScan-Archivversion.');
  if(data.visits.length>100000)throw Error('Das Archiv enthält ungewöhnlich viele Einträge.');
  return data.visits.map(r=>mergeVisitRecords(null,r));
}
function dedupeElements(...groups){
  const map=new Map();
  for(const group of groups)for(const e of group||[]){if(!e||!['node','way','relation'].includes(e.type)||e.id==null)continue;map.set(`${e.type}-${e.id}`,e);}
  return [...map.values()];
}
function placeToElement(place){
  const m=/^(node|way|relation)-(\d+)$/.exec(String(place?.placeId||''));if(!m||!validCoords(place))return null;
  const tags={...(place.tags||{}),name:place.name||place.tags?.name||'',cuisine:place.cuisine||place.tags?.cuisine||'',description:place.description||place.tags?.description||''};
  if(place.menu&&!tags.menu&&!tags['website:menu']&&!tags['contact:menu'])tags.menu=place.menu;
  return {type:m[1],id:Number(m[2]),lat:Number(place.lat),lon:Number(place.lng),tags};
}

function openDatabase(indexedDBImpl){
  return new Promise((resolve,reject)=>{
    const req=indexedDBImpl.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(PLACE_STORE))db.createObjectStore(PLACE_STORE,{keyPath:'placeId'});if(!db.objectStoreNames.contains(VISIT_STORE))db.createObjectStore(VISIT_STORE,{keyPath:'placeId'});};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('PizzaScan-Speicher konnte nicht geöffnet werden.'));
  });
}
function request(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Speicherzugriff fehlgeschlagen.'));});}
function all(db,store){return request(db.transaction(store,'readonly').objectStore(store).getAll());}
function putMany(db,store,items){return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite'),os=tx.objectStore(store);for(const item of items||[])os.put(item);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||Error('Speichern fehlgeschlagen.'));tx.onabort=()=>reject(tx.error||Error('Speichern abgebrochen.'));});}
function getOne(db,store,key){return request(db.transaction(store,'readonly').objectStore(store).get(key));}
async function upsertVisit(db,place,event){
  const p=cleanPlace(place),old=await getOne(db,VISIT_STORE,p.placeId),record=mergeVisitRecords(old,{placeId:p.placeId,place:p,events:[cleanEvent(event)],updatedAt:new Date().toISOString()});
  await putMany(db,VISIT_STORE,[record]);return record;
}

function install(root){
  if(typeof root.indexedDB==='undefined'||typeof root.document==='undefined')return;
  let dbPromise=openDatabase(root.indexedDB),visitedIds=new Set(),hydrated=false;
  const runtime={db:()=>dbPromise,visitedIds,hydrated:()=>hydrated,exportMarkdown:async()=>archiveToMarkdown(await all(await dbPromise,VISIT_STORE))};
  root.PizzaPlaceHistoryRuntime=runtime;

  async function rememberPlaces(list){
    const clean=[];for(const p of list||[])try{clean.push(cleanPlace(p));}catch{}
    if(clean.length)await putMany(await dbPromise,PLACE_STORE,clean);
  }
  async function rememberVisit(place,event){
    if(!place||!event)return null;visitedIds.add(place.placeId);const record=await upsertVisit(await dbPromise,place,event);await rememberPlaces([place]);return record;
  }
  async function rememberCurrentReports(){
    try{for(const r of reports||[])if(r?.visited&&r?.place&&Number.isFinite(Number(r.own)))await rememberVisit(r.place,{id:'photo:'+r.id,rating:Number(r.own),notes:r.notes||'',source:'photo',updatedAt:r.createdAt||new Date().toISOString()});}catch{}
  }
  async function rememberDrafts(value){
    if(!value||typeof value!=='object')return;
    for(const [id,d] of Object.entries(value)){const rating=Number(d?.state?.own);if(d?.state?.visited&&d?.place&&Number.isFinite(rating))await rememberVisit(d.place,{id:'draft:'+id,rating,notes:d.text||d.state?.notes||'',source:'review',updatedAt:d.updatedAt||new Date().toISOString()});}
  }
  async function hydrate(){
    try{
      const db=await dbPromise,[cached,visits]=await Promise.all([all(db,PLACE_STORE),all(db,VISIT_STORE)]);
      visitedIds.clear();for(const v of visits)visitedIds.add(v.placeId);
      const visitPlaces=visits.map(v=>v.place).filter(Boolean);
      if(typeof PlaceData!=='undefined'&&typeof mapPool!=='undefined')mapPool=PlaceData.merge(mapPool,PlaceData.merge(cached,visitPlaces));
      hydrated=true;if(typeof refreshArea==='function')refreshArea();await rememberCurrentReports();
      try{await rememberDrafts(JSON.parse(root.localStorage?.getItem('pizzascan-drafts-v1')||'{}'));}catch{}
    }catch(error){console.warn('PizzaScan history cache unavailable',error);}
  }

  /* Never cut the live discovery pool. LocalStorage stays a small boot fallback;
   * IndexedDB keeps the complete place history. */
  if(typeof storeMapCache==='function'){
    storeMapCache=function(){
      const recentPlaces=mapPool.slice(-500),recentAreas=mapAreas.slice(-12);
      try{placeService.write('pizzascan-map-cache-v3',{places:recentPlaces,areas:recentAreas});}catch{}
      rememberPlaces(mapPool).catch(()=>{});
    };
  }

  /* Existing card renderer intentionally rendered 100 cards. Render every result
   * in 100-item chunks without changing its markup. */
  if(typeof placeCards==='function'){
    const basePlaceCards=placeCards;
    placeCards=function(list){let html='';for(let i=0;i<(list||[]).length;i+=100)html+=basePlaceCards(list.slice(i,i+100));return html;};
  }

  if(typeof visiblePlaces==='function'){
    const baseVisiblePlaces=visiblePlaces;
    visiblePlaces=function(){const list=baseVisiblePlaces();let cfg;try{cfg=mapConfig();}catch{return list;}if(!cfg.onlyVisited)return list;const current=new Set(visitedIds);try{for(const r of reports||[])if(r?.visited&&r?.place)current.add(r.place.placeId);}catch{}return list.filter(p=>current.has(p.placeId));};
  }

  if(typeof filterForm==='function'){
    const baseFilterForm=filterForm;
    filterForm=function(){const cfg=mapConfig(),html=baseFilterForm();const row=`<label class="check"><input id="filter-only-visited" type="checkbox" ${cfg.onlyVisited?'checked':''}><span>Nur bereits besuchte und selbst bewertete Orte anzeigen</span></label>`;return html.replace('<label class="check"><input id="gps-on-start"',row+'<label class="check"><input id="gps-on-start"');};
  }
  if(typeof readFilterForm==='function'){
    const baseReadFilterForm=readFilterForm;
    readFilterForm=function(){baseReadFilterForm();const el=document.getElementById('filter-only-visited');if(!el)return;settings.filters={...(settings.filters||{}),onlyVisited:el.checked,hideVisited:el.checked?false:!!settings.filters?.hideVisited};};
  }
  function wireVisitFilters(){const only=document.getElementById('filter-only-visited'),hide=document.getElementById('filter-visited');if(!only||!hide)return;only.onchange=()=>{if(only.checked)hide.checked=false;};hide.onchange=()=>{if(hide.checked)only.checked=false;};}
  if(typeof showFilters==='function'){
    const baseShowFilters=showFilters;showFilters=function(){const out=baseShowFilters();wireVisitFilters();return out;};
  }
  if(typeof handleMapAction==='function'){
    const baseHandleMapAction=handleMapAction;handleMapAction=async function(button){if(button?.dataset?.action==='clear-filters')settings.filters={...(settings.filters||{}),onlyVisited:false};return baseHandleMapAction(button);};
  }

  if(typeof renderPlaces==='function'){
    const baseRenderPlaces=renderPlaces;renderPlaces=function(){const out=baseRenderPlaces();try{const cfg=mapConfig();if(cfg.onlyVisited){const title=document.getElementById('places-title');if(title)title.textContent='Bereits besuchte & bewertete Pizza-Orte';const b=document.getElementById('filter-open');void b;}const filter=document.getElementById('filter-open');if(filter&&cfg.onlyVisited&&!filter.textContent.includes('•'))filter.textContent+=' •';}catch{}return out;};
  }

  if(typeof persist==='function'){
    const basePersist=persist;persist=async function(r){const value=await basePersist(r);if(r?.visited&&r?.place&&Number.isFinite(Number(r.own)))await rememberVisit(r.place,{id:'photo:'+r.id,rating:Number(r.own),notes:r.notes||'',source:'photo',updatedAt:r.createdAt||new Date().toISOString()});return value;};
  }
  if(typeof renderHistory==='function'){
    const baseRenderHistory=renderHistory;renderHistory=function(){const out=baseRenderHistory();rememberCurrentReports().catch(()=>{});return out;};
  }

  try{
    const rawWrite=placeService.write.bind(placeService);
    placeService.write=function(key,value){const ok=rawWrite(key,value);if(ok&&key==='pizzascan-drafts-v1')rememberDrafts(value).catch(()=>{});return ok;};
  }catch{}

  async function exportArchive(){
    const rows=await all(await dbPromise,VISIT_STORE),name='PizzaScan-Besuchsarchiv-'+new Date().toISOString().slice(0,10)+'.md';
    await bridge('save',{name,text:archiveToMarkdown(rows)});toast(`${rows.length} besuchte Orte als Markdown gesichert.`);
  }
  async function importArchive(){
    const input=document.createElement('input');input.type='file';input.accept='.md,text/markdown,text/plain';
    input.onchange=async()=>{try{const file=input.files?.[0];if(!file)return;const incoming=archiveFromMarkdown(await file.text()),db=await dbPromise,merged=[];for(const row of incoming){const old=await getOne(db,VISIT_STORE,row.placeId),next=mergeVisitRecords(old,row);merged.push(next);visitedIds.add(next.placeId);}await putMany(db,VISIT_STORE,merged);await putMany(db,PLACE_STORE,merged.map(x=>x.place));mapPool=PlaceData.merge(mapPool,merged.map(x=>x.place));refreshArea();toast(`${merged.length} besuchte Orte aus dem Markdown-Archiv geladen.`);}catch(error){toast(error.message||'Archiv konnte nicht geladen werden.');}};
    input.click();
  }
  function injectArchiveSettings(){
    const body=document.getElementById('sheet-body');if(!body||document.getElementById('pizzascan-history-settings'))return;wireVisitFilters();
    const section=document.createElement('section');section.id='pizzascan-history-settings';section.innerHTML=`<hr><h2>Besuchsarchiv & Ortscache</h2><p class="hint">Gefundene Pizza-/Italien-Orte werden dauerhaft lokal zwischengespeichert und beim nächsten Start sofort wieder geladen. Besuchte und selbst bewertete Orte bleiben unabhängig von späteren Kartensuchen erhalten.</p><div class="card-actions"><button id="history-export" class="secondary">Besuchsarchiv als Markdown sichern</button><button id="history-import" class="secondary">Markdown-Archiv laden</button></div><p class="hint">Das Markdown-Backup enthält Ortsdaten und deine eigenen Bewertungen/Notizen, aber keine Fotos und keine privaten Open-Reviews-Schlüssel.</p>`;
    const privacy=[...body.querySelectorAll('details')].find(d=>(d.querySelector('summary')?.textContent||'').toLowerCase().includes('datenschutz'));
    if(privacy)privacy.before(section);else body.append(section);
    document.getElementById('history-export').onclick=()=>guarded(exportArchive);document.getElementById('history-import').onclick=()=>guarded(importArchive);
  }
  if(typeof showSettings==='function'){
    const baseShowSettings=showSettings;showSettings=function(section){const out=baseShowSettings(section);injectArchiveSettings();return out;};
  }

  /* Full WebSim/dense-city result union: no result-count target, no 3.5-second
   * early cutoff. All successful Overpass mirrors are merged by OSM identity.
   * Cached discoveries are unioned too, so a temporarily sparse provider cannot
   * erase places the app already found. */
  try{
    const baseOverpass=placeService.overpass.bind(placeService);
    placeService.overpass=async function(query,options={}){
      const smart=root.PizzaSmartDiscovery;if(!smart?.isWebsimDiscoveryQuery?.(query))return baseOverpass(query,options);
      if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
      options.onStatus?.('Alle Pizza- und Italien-Orte werden aus den Kartenquellen zusammengeführt …');
      const endpoints=smart.PROVIDERS||[],sources=[];
      const tasks=endpoints.map(async endpoint=>{const data=await this.json(endpoint,{method:'POST',body:new URLSearchParams({data:query})},options.signal,PROVIDER_TIMEOUT);if(!Array.isArray(data?.elements)||data.remark)throw Error(data?.remark||'Unvollständige Kartendaten');sources.push(new URL(endpoint).hostname);return data.elements;});
      const settled=await Promise.allSettled(tasks),groups=settled.filter(x=>x.status==='fulfilled').map(x=>x.value);
      const info=smart.queryAreaInfo?.(query),cached=[];
      if(info)for(const p of mapPool||[]){const e=placeToElement(p);if(!e)continue;const point={lat:e.lat,lng:e.lon};if(smart.inside?.(info,point)&&smart.placeRelevant?.(p))cached.push(e);}
      const elements=dedupeElements(...groups,cached);
      if(elements.length)return {data:{elements},source:[...new Set(sources)].join(' + ')+(cached.length?' + lokaler Cache':'')};
      return baseOverpass(query,options);
    };
    placeService.overpass.__pizzascanCompleteWebsim=true;
  }catch{}

  const baseInitMap=typeof initMap==='function'?initMap:null;
  if(baseInitMap)initMap=function(){const out=baseInitMap();hydrate();return out;};else hydrate();
}

return {DB_NAME,DB_VERSION,PLACE_STORE,VISIT_STORE,ARCHIVE_FORMAT,ARCHIVE_VERSION,validPlaceId,validCoords,cleanPlace,cleanEvent,mergeVisitRecords,archiveObject,archiveToMarkdown,archiveFromMarkdown,dedupeElements,placeToElement,install};
});
