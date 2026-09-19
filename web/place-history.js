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
const DB_VERSION=2;
const PLACE_STORE='places';
const VISIT_STORE='visits';
const RATING_STORE='ratings';
const ARCHIVE_FORMAT='pizzascan-visited';
const ARCHIVE_VERSION=2;
const SUPPORTED_ARCHIVE_VERSIONS=new Set([1,2]);
const PROVIDER_TIMEOUT=65000;
const MAX_ARCHIVE_RECORDS=1000000;
const MAX_ARCHIVE_BYTES=512*1024*1024;

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
function cleanOptionalPlaces(groups){const out=new Map();for(const place of groups||[])try{const clean=cleanPlace(place);out.set(clean.placeId,clean);}catch{}return [...out.values()];}
function cleanRatingEntry(key,value,fallbackPlaces=[]){
 const source=typeof value==='number'?{rating:value}:value&&typeof value==='object'?value:{},rating=Number(source.rating);
 if(!Number.isFinite(rating)||rating<.1||rating>10)return null;
 const wanted=String(source.place?.placeId||key||'');
 let place=source.place;
 if(!place&&Array.isArray(fallbackPlaces))place=fallbackPlaces.find(candidate=>String(candidate?.placeId||'')===wanted);
 try{place=cleanPlace(place);}catch{return null;}
 return {placeId:place.placeId,rating:Math.round(rating*10)/10,updatedAt:source.updatedAt||new Date().toISOString(),place};
}
function cleanRatingBundle(input,fallbackPlaces=[]){
 const out={};for(const [key,value] of Object.entries(input&&typeof input==='object'&&!Array.isArray(input)?input:{})){const clean=cleanRatingEntry(key,value,fallbackPlaces);if(clean)out[clean.placeId]=clean;}return out;
}
function archiveObject(records,bundle={}){
 const visits=(records||[]).map(r=>mergeVisitRecords(null,r)),basePlaces=[...(bundle.places||[]),...(bundle.saved||[]),...visits.map(r=>r.place)],ratings=cleanRatingBundle(bundle.ratings,basePlaces),places=cleanOptionalPlaces([...basePlaces,...Object.values(ratings).map(row=>row.place)]);
 return {format:ARCHIVE_FORMAT,version:ARCHIVE_VERSION,exportedAt:new Date().toISOString(),visits,places,saved:cleanOptionalPlaces(bundle.saved||[]),reports:Array.isArray(bundle.reports)?bundle.reports:[],drafts:bundle.drafts&&typeof bundle.drafts==='object'?bundle.drafts:{},ratings,settings:bundle.settings&&typeof bundle.settings==='object'?bundle.settings:{}};
}
function archiveToMarkdown(records,bundle={}){const data=archiveObject(records,bundle),lines=['# PizzaScan Besuchsarchiv','','<!-- pizzascan-visited-v1 -->','',`Exportiert: ${data.exportedAt}`,'',`Gesammelte Orte: ${data.places.length}`,`Besuchte/bewertete Orte: ${data.visits.length}`,''];for(const record of data.visits){lines.push(`## ${record.place.name.replace(/[\r\n#]+/g,' ').trim()}`,'',`- PizzaScan-ID: \`${record.placeId}\``,`- Position: ${record.place.lat.toFixed(6)}, ${record.place.lng.toFixed(6)}`);if(record.place.address)lines.push(`- Adresse: ${String(record.place.address).replace(/[\r\n]+/g,' ')}`);if(record.events.length)lines.push(`- Bewertungen: ${record.events.map(e=>`${e.rating.toFixed(1)}/10`).join(', ')}`);lines.push('');}lines.push('## Maschinenlesbares Backup','','```json',JSON.stringify(data,null,2),'```','');return lines.join('\n');}
function archiveFromMarkdown(text){
  const source=String(text||'');
  if(!source.includes('pizzascan-visited-v1'))throw Error('Das ist kein PizzaScan-Besuchsarchiv.');
  const match=/```json\s*([\s\S]*?)\s*```/i.exec(source);if(!match)throw Error('Maschinenlesbare Archivdaten fehlen.');
  let data;try{data=JSON.parse(match[1]);}catch{throw Error('Archivdaten sind beschädigt.');}
  if(data?.format!==ARCHIVE_FORMAT||!SUPPORTED_ARCHIVE_VERSIONS.has(Number(data?.version))||!Array.isArray(data.visits))throw Error('Nicht unterstützte PizzaScan-Archivversion.');
  if(data.visits.length>MAX_ARCHIVE_RECORDS)throw Error('Das Archiv enthält ungewöhnlich viele Einträge.');
  const rows=data.visits.map(r=>mergeVisitRecords(null,r));Object.defineProperty(rows,'bundle',{value:data,enumerable:false});return rows;
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
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(PLACE_STORE))db.createObjectStore(PLACE_STORE,{keyPath:'placeId'});if(!db.objectStoreNames.contains(VISIT_STORE))db.createObjectStore(VISIT_STORE,{keyPath:'placeId'});if(!db.objectStoreNames.contains(RATING_STORE))db.createObjectStore(RATING_STORE,{keyPath:'placeId'});};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('PizzaScan-Speicher konnte nicht geöffnet werden.'));
  });
}
function request(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Speicherzugriff fehlgeschlagen.'));});}
function all(db,store){return request(db.transaction(store,'readonly').objectStore(store).getAll());}
function countStore(db,store){return request(db.transaction(store,'readonly').objectStore(store).count());}
function putMany(db,store,items){return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite'),os=tx.objectStore(store);for(const item of items||[])os.put(item);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||Error('Speichern fehlgeschlagen.'));tx.onabort=()=>reject(tx.error||Error('Speichern abgebrochen.'));});}
function getOne(db,store,key){return request(db.transaction(store,'readonly').objectStore(store).get(key));}
function removeOne(db,store,key){return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).delete(key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||Error('Löschen fehlgeschlagen.'));tx.onabort=()=>reject(tx.error||Error('Löschen abgebrochen.'));});}
async function upsertVisit(db,place,event){
  const p=cleanPlace(place),old=await getOne(db,VISIT_STORE,p.placeId),record=mergeVisitRecords(old,{placeId:p.placeId,place:p,events:[cleanEvent(event)],updatedAt:new Date().toISOString()});
  await putMany(db,VISIT_STORE,[record]);return record;
}

function install(root){
  if(typeof root.indexedDB==='undefined'||typeof root.document==='undefined')return;
  let dbPromise=openDatabase(root.indexedDB),visitedIds=new Set(),hydrated=false;
  const runtime={db:()=>dbPromise,visitedIds,hydrated:()=>hydrated,exportMarkdown:async()=>archiveToMarkdown(await all(await dbPromise,VISIT_STORE)),rememberRating:async row=>{const clean=cleanRatingEntry(row?.placeId||row?.place?.placeId,row);if(!clean)return null;await putMany(await dbPromise,RATING_STORE,[clean]);await rememberPlaces([clean.place]);return clean;},forgetRating:async placeId=>{if(validPlaceId(placeId))await removeOne(await dbPromise,RATING_STORE,placeId);}};
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
      const db=await dbPromise,[cached,visits,ratingRows]=await Promise.all([all(db,PLACE_STORE),all(db,VISIT_STORE),all(db,RATING_STORE)]);
      if(ratingRows.length){const current=cleanRatingBundle(localJson('pizzascan-place-ratings-v1',{}),ratingRows.map(row=>row.place));for(const row of ratingRows)current[row.placeId]=row;placeService.write('pizzascan-place-ratings-v1',current);}
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

  function localJson(key,fallback){try{return JSON.parse(root.localStorage?.getItem(key)||'null')??fallback;}catch{return fallback;}}
  function compactReports(){return (reports||[]).filter(r=>r&&typeof r.id==='string').map(r=>{const copy={...r,photo:''};try{if(copy.place)copy.place=cleanPlace(copy.place);}catch{delete copy.place;}return copy;});}
  async function collectionBundle(rows){
    const db=await dbPromise;
    const [cached,ratingRows]=await Promise.all([all(db,PLACE_STORE),all(db,RATING_STORE)]);
    const savedPlaces=Array.isArray(saved)?saved:[],basePlaces=[...cached,...savedPlaces];
    const ratings=cleanRatingBundle(localJson('pizzascan-place-ratings-v1',{}),basePlaces);
    for(const row of ratingRows||[]){
      const clean=cleanRatingEntry(row?.placeId||row?.place?.placeId,row,[...basePlaces,row?.place]);
      if(clean&&(!ratings[clean.placeId]||Date.parse(clean.updatedAt||'')>=Date.parse(ratings[clean.placeId].updatedAt||'')))ratings[clean.placeId]=clean;
    }
    const settingsCopy=(()=>{try{return JSON.parse(JSON.stringify(settings||{}));}catch{return {};}})();
    return {places:cleanOptionalPlaces([...basePlaces,...Object.values(ratings).map(row=>row.place)]),saved:savedPlaces,reports:compactReports(),drafts:localJson('pizzascan-drafts-v1',{}),ratings,settings:settingsCopy};
  }
  async function exportArchive(){const rows=await all(await dbPromise,VISIT_STORE),bundle=await collectionBundle(rows),name='PizzaScan-Sammlung-'+new Date().toISOString().slice(0,10)+'.json',text=JSON.stringify(archiveObject(rows,bundle));await bridge('save',{name,text});toast(`${bundle.places.length} gesammelte Orte, ${Object.keys(bundle.ratings).length} eigene Bewertungen, ${rows.length} Besuchseinträge und Entwürfe als Sammlung gesichert.`);}
  async function importArchive(){
    const input=document.createElement('input');
    input.type='file';input.accept='.md,.json,text/markdown,application/json,text/plain';
    input.onchange=async()=>{
      try{
        const file=input.files?.[0];if(!file)return;
        if(Number(file.size)>MAX_ARCHIVE_BYTES)throw Error('Diese Sammlung ist größer als 512 MB und kann auf diesem Gerät nicht geladen werden.');
        const raw=await file.text();let incoming;
        if(raw.includes('pizzascan-visited-v1'))incoming=archiveFromMarkdown(raw);
        else{
          const data=JSON.parse(raw);
          if(data?.format!==ARCHIVE_FORMAT||!SUPPORTED_ARCHIVE_VERSIONS.has(Number(data?.version))||!Array.isArray(data.visits))throw Error('Nicht unterstützte PizzaScan-Sammlung.');
          if(data.visits.length>MAX_ARCHIVE_RECORDS)throw Error('Das Archiv enthält ungewöhnlich viele Besuchseinträge.');
          const rows=(data.visits||[]).map(r=>mergeVisitRecords(null,r));
          Object.defineProperty(rows,'bundle',{value:data,enumerable:false});incoming=rows;
        }
        const bundle=incoming.bundle||{},db=await dbPromise;
        const existingVisits=await all(db,VISIT_STORE),byPlace=new Map(existingVisits.map(row=>[row.placeId,row])),merged=[];
        for(const row of incoming){const next=mergeVisitRecords(byPlace.get(row.placeId)||null,row);byPlace.set(next.placeId,next);merged.push(next);visitedIds.add(next.placeId);}
        await putMany(db,VISIT_STORE,merged);
        const fallbackPlaces=[...(bundle.places||[]),...(bundle.saved||[]),...merged.map(x=>x.place)];
        const importedRatings=cleanRatingBundle(bundle.ratings||{},fallbackPlaces);
        const storedRatings=await all(db,RATING_STORE);
        const currentRatings=cleanRatingBundle(localJson('pizzascan-place-ratings-v1',{}),fallbackPlaces);
        for(const row of storedRatings||[]){const clean=cleanRatingEntry(row?.placeId||row?.place?.placeId,row,fallbackPlaces);if(clean)currentRatings[clean.placeId]=clean;}
        const mergedRatings={...currentRatings};
        for(const [id,row] of Object.entries(importedRatings)){const old=mergedRatings[id];if(!old||Date.parse(row.updatedAt||'')>=Date.parse(old.updatedAt||''))mergedRatings[id]=row;}
        const placeMap=new Map();
        for(const place of [...fallbackPlaces,...Object.values(mergedRatings).map(row=>row.place)])try{const clean=cleanPlace(place);placeMap.set(clean.placeId,clean);}catch{}
        await putMany(db,PLACE_STORE,[...placeMap.values()]);
        if(Array.isArray(bundle.saved)){const imported=[];for(const place of bundle.saved)try{imported.push(cleanPlace(place));}catch{}saved=PlaceData.merge(saved,imported);placeService.write('pizzascan-saved-v2',saved);}
        if(Object.keys(importedRatings).length){placeService.write('pizzascan-place-ratings-v1',mergedRatings);await putMany(db,RATING_STORE,Object.values(importedRatings));}
        if(bundle.drafts&&typeof bundle.drafts==='object'){const drafts=localJson('pizzascan-drafts-v1',{});for(const [id,value] of Object.entries(bundle.drafts))try{const clean=PizzaDrafts.entry(value);if(PizzaDrafts.hasContent(clean))drafts[id]=clean;}catch{}placeService.write('pizzascan-drafts-v1',drafts);}
        if(bundle.settings&&typeof bundle.settings==='object'){settings={...settings,...bundle.settings,filters:{...settings.filters,...(bundle.settings.filters||{})}};saveSettings();}
        if(Array.isArray(bundle.reports)&&typeof transaction==='function'){
          const importedReports=bundle.reports.filter(r=>r&&typeof r.id==='string');
          await transaction('readwrite',store=>{for(const report of importedReports)store.put(report);});
          reports=await transaction('readonly',store=>store.getAll());
        }
        mapPool=PlaceData.merge(mapPool,[...placeMap.values()]);refreshArea();renderPlaces();renderDraftBadge();renderArchiveStats();
        toast(placeMap.size+' Orte, '+merged.length+' Besuchs-/Bewertungseinträge und die zugehörigen Einstellungen geladen.');
      }catch(error){toast(error.message||'PizzaScan-Sammlung konnte nicht geladen werden.');}
    };
    input.click();
  }
  async function renderArchiveStats(){
    const target=document.getElementById('history-stats');if(!target)return;
    try{
      const db=await dbPromise;
      const [placeCount,visitCount,ratingCount]=await Promise.all([countStore(db,PLACE_STORE),countStore(db,VISIT_STORE),countStore(db,RATING_STORE)]);
      const reportCount=Array.isArray(reports)?reports.length:0;
      target.textContent=placeCount.toLocaleString()+' Orte · '+ratingCount.toLocaleString()+' eigene Bewertungen · '+visitCount.toLocaleString()+' Besuche · '+reportCount.toLocaleString()+' Fotoanalysen';
    }catch{target.textContent='Lokaler Speicher wird geprüft …';}
  }
  function injectArchiveSettings(){
    const body=document.getElementById('sheet-body');if(!body||document.getElementById('pizzascan-history-settings'))return;wireVisitFilters();
    const section=document.createElement('section');section.id='pizzascan-history-settings';section.innerHTML='<div class="eyebrow">DATEN & BACKUP</div><h2>Sammlung exportieren / importieren</h2><p class="hint">Alle Orte, Koordinaten, Besuche, Favoriten, eigenen Bewertungen, Rezensionsentwürfe, Fotoanalysen und relevanten Einstellungen werden zusammengeführt. Das Backup ist für deutlich mehr als 10.000 Einträge ausgelegt.</p><div class="card-actions"><button id="history-export" class="primary">⬇️ Gesamte Sammlung exportieren</button><button id="history-import" class="secondary">⬆️ Sammlung importieren</button></div><p id="history-stats" class="hint" role="status">Speicher wird geprüft …</p><details data-persist-key="settings:archive-info"><summary>Was wird übertragen?</summary><p>Übertragen werden Orts-ID, Name, Adresse, Position, Bewertung von 0,1 bis 10,0, Besuche, Notizen, Entwürfe, Fotoanalysewerte und Einstellungen. Fotos sowie API-Schlüssel bleiben aus Datenschutz- und Dateigründen auf dem Gerät.</p></details>';
    const anchor=body.querySelector('.settings-jumps')||body.querySelector('h1');
    if(anchor)anchor.insertAdjacentElement('afterend',section);else body.prepend(section);
    document.getElementById('history-export').onclick=()=>guarded(exportArchive);
    document.getElementById('history-import').onclick=()=>guarded(importArchive);
    renderArchiveStats();
  }
  if(typeof showSettings==='function'){
    const baseShowSettings=showSettings;showSettings=function(section){const out=baseShowSettings(section);injectArchiveSettings();return out;};
  }

  /* Full WebSim/dense-city result union. Return the first successful
   * provider immediately, then merge all remaining successful mirrors through
   * loadPlaces({onBatch}) so the map stays fast without losing coverage. */
  try{
    const baseOverpass=placeService.overpass.bind(placeService);
    placeService.overpass=async function(query,options={}){
      const smart=root.PizzaSmartDiscovery;
      if(!smart?.isWebsimDiscoveryQuery?.(query))return baseOverpass(query,options);
      if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
      options.onStatus?.('PizzaScan-Suche · erste Kartenquelle wird geladen …');
      const endpoints=smart.PROVIDERS||[],sources=[],groups=[];
      const info=smart.queryAreaInfo?.(query),cached=[];
      if(info)for(const p of mapPool||[]){const e=placeToElement(p);if(!e)continue;const point={lat:e.lat,lng:e.lng};if(smart.inside?.(info,point)&&smart.placeRelevant?.(p))cached.push(e);}
      const fetchEndpoint=async endpoint=>{
        const data=await this.json(endpoint,{method:'POST',body:new URLSearchParams({data:query})},options.signal,PROVIDER_TIMEOUT);
        if(!Array.isArray(data?.elements)||data.remark)throw Error(data?.remark||'Unvollständige Kartendaten');
        const elements=data.elements;sources.push(new URL(endpoint).hostname);groups.push(elements);return {endpoint,elements};
      };
      const tasks=endpoints.map(fetchEndpoint);
      let first;
      try{first=await Promise.any(tasks);}catch{return baseOverpass(query,options);}
      const initial=dedupeElements(first.elements,cached),source=[...new Set(sources)];
      options.onStatus?.(initial.length+' relevante Treffer · weitere Kartenquellen werden zusammengeführt …');
      Promise.allSettled(tasks).then(()=>{
        if(options.signal?.aborted)return;
        const merged=dedupeElements(...groups,cached),allSource=[...new Set(sources)];
        options.onBatch?.({data:{elements:merged},source:allSource.join(' + ')+(cached.length?' + lokaler Cache':''),sources:allSource,complete:true,progressive:true});
      }).catch(()=>{});
      return {data:{elements:initial},source:source.join(' + ')+(cached.length?' + lokaler Cache':''),sources:source,complete:false,progressive:true};
    };
    placeService.overpass.__pizzascanCompleteWebsim=true;
    placeService.overpass.__pizzascanProgressive=true;
  }catch{}
  const baseInitMap=typeof initMap==='function'?initMap:null;
  if(baseInitMap)initMap=function(){const out=baseInitMap();hydrate();return out;};else hydrate();
}

return {DB_NAME,DB_VERSION,PLACE_STORE,VISIT_STORE,RATING_STORE,ARCHIVE_FORMAT,ARCHIVE_VERSION,MAX_ARCHIVE_RECORDS,MAX_ARCHIVE_BYTES,validPlaceId,validCoords,cleanPlace,cleanEvent,mergeVisitRecords,cleanRatingEntry,cleanRatingBundle,archiveObject,archiveToMarkdown,archiveFromMarkdown,dedupeElements,placeToElement,install};
});
