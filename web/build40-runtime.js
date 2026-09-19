/* PizzaScan Build 40 runtime: complete discovery, GPS-first startup and durable place cache.
 * Cached places render immediately. Live discovery never has a numeric result cap.
 * A cached place is only evicted after a dedicated OSM existence check confirms it disappeared.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else{root.PizzaBuild40=api;api.install(root);}
})(globalThis,function(){
'use strict';

const BLOCKED_HOSTS=new Set(['maps.mail.ru']);
const PROVIDER_TIMEOUT=60000;
const VERIFY_BATCH=180;
const HISTORY_WAIT_MS=3500;
const CACHE_VERIFY_KEY='pizzascan-cache-verify-v1';

function abortError(){const e=new Error('Abgebrochen');e.name='AbortError';return e;}
function endpointHost(value){try{return new URL(String(value)).hostname.toLowerCase();}catch{return '';}}
function usableEndpoints(list){return [...new Set((list||[]).filter(Boolean))].filter(x=>{const h=endpointHost(x);return h&&!BLOCKED_HOSTS.has(h)&&/^https:/.test(String(x));});}
function mergeElements(...groups){const out=new Map();for(const group of groups)for(const e of group||[]){if(!e||!['node','way','relation'].includes(e.type)||e.id==null)continue;out.set(`${e.type}-${e.id}`,e);}return [...out.values()];}
function chunk(list,size=VERIFY_BATCH){const out=[];for(let i=0;i<(list||[]).length;i+=Math.max(1,size|0))out.push(list.slice(i,i+Math.max(1,size|0)));return out;}
function validBounds(b){return b&&['south','west','north','east'].every(k=>Number.isFinite(Number(b[k])));}
function areaString(center,radius,bounds){if(validBounds(bounds))return `${Number(bounds.south)},${Number(bounds.west)},${Number(bounds.north)},${Number(bounds.east)}`;const r=Math.round(Math.max(.5,Math.min(25,Number(radius)||5))*1000);return `around:${r},${Number(center.lat)},${Number(center.lng)}`;}
function completePizzaQuery(center,radius,bounds){
 const a=areaString(center,radius,bounds);
 return `[out:json][timeout:60];(`+
  `nwr["cuisine"~"(^|[;, _-])(pizza|pizzeria|italian|italiano|italiana)([;, _-]|$)",i](${a});`+
  `nwr["name"~"pizza|pizzeria|pizzaria|pizze|ristorante|trattoria|osteria|italian restaurant|italiano|italiana|italiener|italienisch",i](${a});`+
  `nwr["amenity"~"restaurant|fast_food|cafe|food_truck|takeaway|food_court|bar|pub|biergarten"]["cuisine"~"pizza|pizzeria|italian|italiano|italiana",i](${a});`+
  `nwr["shop"~"bakery|deli|convenience|food"]["name"~"pizza|pizzeria|pizzaria|pizze",i](${a});`+
  `nwr["speciality"~"pizza",i](${a});nwr["product"~"pizza",i](${a});nwr["products"~"pizza",i](${a});`+
  `nwr["menu"~"pizza",i](${a});nwr["description"~"pizza",i](${a});nwr["note"~"pizza",i](${a});`+
  `nwr["vending"~"pizza",i](${a});nwr["vending:pizza"="yes"](${a});`+
  `);out body center;`;
}
function placeKey(place){const m=/^(node|way|relation)-(\d+)$/.exec(String(place?.placeId||''));return m?`${m[1]}-${m[2]}`:'';}
function existenceQuery(places){
 const ids={node:[],way:[],relation:[]};
 for(const p of places||[]){const m=/^(node|way|relation)-(\d+)$/.exec(String(p?.placeId||''));if(m)ids[m[1]].push(m[2]);}
 const parts=[];for(const type of ['node','way','relation'])if(ids[type].length)parts.push(`${type}(id:${[...new Set(ids[type])].join(',')});`);
 return parts.length?`[out:json][timeout:30];(${parts.join('')});out ids;`:'';
}
function currentAreaInfo(smart,query){
 try{const info=smart?.queryAreaInfo?.(query);if(info?.center)return info;}catch{}
 return null;
}
function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

function install(root){
 if(typeof root.document==='undefined')return false;
 const smart=root.PizzaSmartDiscovery;
 let service;try{service=typeof placeService!=='undefined'?placeService:null;}catch{service=null;}
 if(!service)return false;
 const originalOverpass=service.overpass.bind(service);

 async function completeOverpass(query,options={}){
  if(options.signal?.aborted)throw abortError();
  const info=currentAreaInfo(smart,query);
  if(!info||typeof service.json!=='function')return originalOverpass(query,options);
  const fullQuery=completePizzaQuery(info.center,info.radius,info.bounds);
  const endpoints=usableEndpoints(smart?.PROVIDERS||smart?.providers||[]);
  if(!endpoints.length)return originalOverpass(query,options);
  const successes=[],errors=[];let finished=0;
  options.onStatus?.(`Vollständige Suche · 0/${endpoints.length} Kartenquellen …`);
  await Promise.allSettled(endpoints.map(async endpoint=>{
   try{
    const data=await service.json(endpoint,{method:'POST',body:new URLSearchParams({data:fullQuery})},options.signal,PROVIDER_TIMEOUT);
    if(!Array.isArray(data?.elements)||data.remark)throw Error(data?.remark||'Unvollständige Kartendaten');
    successes.push({source:endpointHost(endpoint),elements:data.elements});
   }catch(error){if(options.signal?.aborted)throw error;errors.push({source:endpointHost(endpoint),message:error?.message||String(error)});}
   finally{finished++;options.onStatus?.(`Vollständige Suche · ${finished}/${endpoints.length} Kartenquellen …`);}
  }));
  if(options.signal?.aborted)throw abortError();
  service.lastErrors=errors;
  if(!successes.length)return originalOverpass(query,options);
  let elements=mergeElements(...successes.map(x=>x.elements));
  if(typeof smart?.filterCandidates==='function')elements=smart.filterCandidates(elements);
  if(!elements.length)return originalOverpass(query,options);
  return {data:{elements},source:successes.map(x=>x.source).join(' + '),sources:successes.map(x=>x.source),complete:true};
 }
 completeOverpass.__pizzascanBuild40=true;
 if(!(root.PizzaBuild49||root.PizzaScanDiscovery49?.build>=49))service.overpass=completeOverpass;

 async function historyReady(){
  const started=Date.now();
  while(Date.now()-started<HISTORY_WAIT_MS){try{if(root.PizzaPlaceHistoryRuntime?.hydrated?.())return true;}catch{}await wait(40);}
  return false;
 }
 function makeGate(open){let resolve;const promise=new Promise(r=>resolve=r);const gate={state:open?'open':'pending',promise,resolve};if(open)resolve('open');return gate;}
 let initialGpsWanted=false;try{initialGpsWanted=!!settings?.welcomed&&!!settings?.gpsOnStart&&!!root.navigator?.geolocation;}catch{}
 let gpsGate=makeGate(!initialGpsWanted),gpsWaiters=0,gpsBusy=false;
 function settleGps(state){if(gpsGate.state==='pending'){gpsGate.state=state;gpsGate.resolve(state);}else gpsGate.state=state;}
 function beginGpsGate(){gpsGate=makeGate(false);return gpsGate;}

 const originalLoad=typeof loadPlaces==='function'?loadPlaces:null;
 if(originalLoad){
  loadPlaces=async function(options={}){
   let gpsResult=gpsGate.state;
   if(gpsGate.state==='pending'&&typeof position!=='undefined'&&!position){
    gpsWaiters++;
    try{const status=root.document.getElementById('map-status');if(status)status.textContent='Standort wird zuerst bestimmt …';gpsResult=await gpsGate.promise;}
    finally{gpsWaiters=Math.max(0,gpsWaiters-1);}
   }
   await historyReady();
   let before=[];try{before=Array.isArray(mapPool)?mapPool.slice():[];}catch{}
   const mergedOptions={...options,force:options.force===true||gpsResult==='located'};
   const result=await originalLoad(mergedOptions);
   try{
    if(before.length&&typeof PlaceData!=='undefined'&&Array.isArray(mapPool))mapPool=PlaceData.merge(mapPool,before);
    if(typeof refreshArea==='function')refreshArea();
   }catch{}
   return result;
  };
 }

 async function requestGps(){
  if(gpsBusy)return gpsGate.promise;
  if(!root.navigator?.geolocation){settleGps('unavailable');try{toast('Standort wird auf diesem Gerät nicht unterstützt.');}catch{}return 'unavailable';}
  gpsBusy=true;beginGpsGate();
  const gpsButton=root.document.getElementById('gps'),fsButton=root.document.getElementById('fs-gps');if(gpsButton)gpsButton.disabled=true;if(fsButton)fsButton.disabled=true;
  const status=root.document.getElementById('map-status');if(status)status.textContent='Standort wird bestimmt …';
  return new Promise(resolve=>{
   root.navigator.geolocation.getCurrentPosition(async p=>{
    try{
     position={lat:p.coords.latitude,lng:p.coords.longitude};settings.gpsOnStart=true;saveSettings();
     map.setView([position.lat,position.lng],14);
     if(root.gpsMarker)map.removeLayer(root.gpsMarker);
     root.gpsMarker=L.marker([position.lat,position.lng],{icon:L.divIcon({className:'emoji-marker user-marker',html:'<span>📍</span>',iconSize:[36,40],iconAnchor:[18,36]})}).addTo(map).bindTooltip('Dein Standort · Genauigkeit etwa '+Math.round(p.coords.accuracy)+' m');
     settleGps('located');
     if(gpsWaiters===0&&originalLoad)await loadPlaces({force:true});
     resolve('located');
    }catch(error){console.error(error);settleGps('unavailable');resolve('unavailable');}
    finally{gpsBusy=false;if(gpsButton)gpsButton.disabled=false;if(fsButton)fsButton.disabled=false;}
   },async()=>{
    settleGps('unavailable');gpsBusy=false;if(gpsButton)gpsButton.disabled=false;if(fsButton)fsButton.disabled=false;
    try{toast('Standort nicht verfügbar. Die Suche nutzt den aktuellen Kartenausschnitt.');}catch{}
    if(gpsWaiters===0&&originalLoad)await loadPlaces({force:false});resolve('unavailable');
   },{enableHighAccuracy:true,timeout:18000,maximumAge:60000});
  });
 }
 try{gps=requestGps;}catch{}

 async function allCached(){
  const runtime=root.PizzaPlaceHistoryRuntime,H=root.PizzaPlaceHistory;if(!runtime?.db||!H?.PLACE_STORE)return[];
  const db=await runtime.db();return new Promise((resolve,reject)=>{const req=db.transaction(H.PLACE_STORE,'readonly').objectStore(H.PLACE_STORE).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error||Error('Cache konnte nicht gelesen werden.'));});
 }
 async function deleteCached(ids){
  const runtime=root.PizzaPlaceHistoryRuntime,H=root.PizzaPlaceHistory;if(!ids.length||!runtime?.db||!H?.PLACE_STORE)return;
  const db=await runtime.db();await new Promise((resolve,reject)=>{const tx=db.transaction(H.PLACE_STORE,'readwrite'),store=tx.objectStore(H.PLACE_STORE);for(const id of ids)store.delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Cache konnte nicht aktualisiert werden.'));tx.onabort=()=>reject(tx.error||Error('Cache-Aktualisierung abgebrochen.'));});
 }
 function inCurrentArea(p){try{const cfg=mapConfig(),center=mapCenter(),bounds=boundsObject();return PlaceData.within(p,center,cfg.radius,bounds);}catch{return false;}}
 async function verifyBatch(batchPlaces,endpoints){
  const query=existenceQuery(batchPlaces);if(!query)return {verified:false,existing:new Set()};
  const groups=[];
  await Promise.allSettled(endpoints.map(async endpoint=>{const data=await service.json(endpoint,{method:'POST',body:new URLSearchParams({data:query})},undefined,30000);if(Array.isArray(data?.elements)&&!data.remark)groups.push(data.elements);}));
  const required=Math.min(2,endpoints.length);if(groups.length<required)return {verified:false,existing:new Set()};
  return {verified:true,existing:new Set(mergeElements(...groups).map(e=>`${e.type}-${e.id}`))};
 }
 async function verifyCachedArea(sourcePlaces){
  await historyReady();const endpoints=usableEndpoints(smart?.PROVIDERS||smart?.providers||[]);if(!endpoints.length)return {checked:0,removed:0};
  const source=Array.isArray(sourcePlaces)?sourcePlaces:await allCached();
  const cached=source.filter(inCurrentArea),visited=root.PizzaPlaceHistoryRuntime?.visitedIds||new Set(),candidates=cached.filter(p=>!visited.has(p.placeId));
  const missing=[];let checked=0;
  for(const batchPlaces of chunk(candidates,VERIFY_BATCH)){
   const result=await verifyBatch(batchPlaces,endpoints);if(!result.verified)continue;checked+=batchPlaces.length;for(const p of batchPlaces)if(!result.existing.has(placeKey(p)))missing.push(p.placeId);
  }
  if(missing.length){await deleteCached(missing);const gone=new Set(missing);try{mapPool=mapPool.filter(p=>!gone.has(p.placeId));places=places.filter(p=>!gone.has(p.placeId));refreshArea();}catch{}}
  try{placeService.write(CACHE_VERIFY_KEY,{time:Date.now(),checked,removed:missing.length});}catch{}
  return {checked,removed:missing.length};
 }

 let cacheVerificationPromise=Promise.resolve({checked:0,removed:0});
 function startBootCacheVerification(){
  cacheVerificationPromise=(async()=>{
   try{await historyReady();const cached=await allCached();if(!cached.length)return {checked:0,removed:0};return await verifyCachedArea(cached);}
   catch(error){console.warn('PizzaScan cache verification skipped',error);return {checked:0,removed:0};}
  })();
  return cacheVerificationPromise;
 }

 async function fullRefresh(){
  const b=root.document.getElementById('full-map-refresh'),regular=root.document.getElementById('map-refresh'),status=root.document.getElementById('map-status');
  if(b)b.disabled=true;if(regular)regular.disabled=true;
  try{if(typeof mapLoading!=='undefined')mapLoading=true;}catch{}
  if(status)status.textContent='Vollständiger Neuabruf · gespeicherte Orte werden geprüft …';
  try{
   await cacheVerificationPromise.catch(()=>{});
   const cachedBefore=await allCached().catch(()=>[]);
   const verified=await verifyCachedArea(cachedBefore);
   if(status)status.textContent='Vollständiger Neuabruf aller Kartenquellen …';
   await loadPlaces({force:true,complete:true});
   try{toast(`Vollständig aktualisiert · Cache geprüft: ${verified.checked}, entfernt: ${verified.removed}.`);}catch{}
   return verified;
  } finally {
   try{if(typeof mapLoading!=='undefined')mapLoading=false;}catch{}
   if(b)b.disabled=false;if(regular)regular.disabled=false;
  }
 }
 function openSearch(){const toggle=root.document.getElementById('search-toggle');if(toggle)toggle.click();else root.document.getElementById('search')?.focus();}
 function injectTools(){
  if(root.document.getElementById('build40-tools'))return;
  const anchor=root.document.querySelector('.map-filters');if(!anchor)return;
  const row=root.document.createElement('div');row.id='build40-tools';row.className='build40-tools';row.innerHTML='<button id="quick-place-search" class="secondary" type="button">🔎 Ort suchen</button><button id="full-map-refresh" class="secondary" type="button">⟳ Vollständig aktualisieren</button><small id="cache-mode-note">Gespeicherte Orte werden sofort geladen. Beim nächsten Start wird nur geprüft, ob sie in OpenStreetMap noch existieren.</small>';anchor.after(row);
  root.document.getElementById('quick-place-search').onclick=openSearch;
  root.document.getElementById('full-map-refresh').onclick=()=>fullRefresh().catch(e=>{console.error(e);try{toast(e.message||'Aktualisierung fehlgeschlagen.');}catch{}});
  const regular=root.document.getElementById('map-refresh');if(regular){
   regular.textContent='⟳ Vollständig aktualisieren';regular.title='Alle Kartenquellen neu abfragen und gespeicherte Orte prüfen';
   regular.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();fullRefresh().catch(e=>{console.error(e);try{toast(e.message||'Aktualisierung fehlgeschlagen.');}catch{}});},true);
  }
  const searchInput=root.document.getElementById('search');if(searchInput)searchInput.placeholder='Pizza, Restaurant, Stadt oder Adresse …';
  if(!root.document.getElementById('build40-style')){const s=root.document.createElement('style');s.id='build40-style';s.textContent='.build40-tools{display:grid;grid-template-columns:1fr 1fr;gap:.55rem;margin:.7rem 0 1rem}.build40-tools button{min-height:46px}.build40-tools small{grid-column:1/-1;opacity:.68;line-height:1.35}.map-caption #map-refresh{font-weight:800}@media(max-width:520px){.build40-tools{grid-template-columns:1fr}.build40-tools small{grid-column:1}}';root.document.head.append(s);}
 }
 injectTools();
 startBootCacheVerification();

 /* If startup already raced ahead before this finalizer loaded, cancel the stale
  * default-center request and restart through the GPS gate. */
 setTimeout(()=>{
  try{
   if(settings?.welcomed&&settings?.gpsOnStart&&!position&&root.navigator?.geolocation){
    mapRequest?.abort?.();if(gpsGate.state!=='pending')beginGpsGate();requestGps();
   }
  }catch{}
 },0);

 root.PizzaScanBuild40={completeDiscovery:true,noResultCap:true,gpsBeforeStartupSearch:true,persistentPlaceCache:true,existenceOnlyRevalidation:true,fullRefresh,verifyCachedArea,cacheIdle:()=>cacheVerificationPromise,providerCount:usableEndpoints(smart?.PROVIDERS||[]).length};
 return true;
}

return {BLOCKED_HOSTS,PROVIDER_TIMEOUT,VERIFY_BATCH,HISTORY_WAIT_MS,CACHE_VERIFY_KEY,endpointHost,usableEndpoints,mergeElements,chunk,validBounds,areaString,completePizzaQuery,placeKey,existenceQuery,currentAreaInfo,install};
});