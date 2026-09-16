/* PizzaScan Build 38 runtime finalizer.
 * Fixes the Build 37 startup race: restore the complete local place history first,
 * then run one uncapped all-provider WebSim refresh. Previously discovered places
 * are part of the provider union so a sparse/slow mirror can never shrink the map.
 */
(function(root){
'use strict';
const PROVIDER_TIMEOUT=65000;
let installed=false;

function request(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('PizzaScan-Speicherzugriff fehlgeschlagen.'));});}
function all(db,store){return request(db.transaction(store,'readonly').objectStore(store).getAll());}
function delay(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

async function loadAllHistory(){
  const runtime=root.PizzaPlaceHistoryRuntime;
  if(!runtime?.db||typeof PlaceData==='undefined'||typeof mapPool==='undefined')return {places:0,visits:0};
  const db=await runtime.db();
  const [cached,visits]=await Promise.all([all(db,'places'),all(db,'visits')]);
  for(const row of visits||[])if(row?.placeId)runtime.visitedIds?.add(row.placeId);
  const visitPlaces=(visits||[]).map(row=>row?.place).filter(Boolean);
  mapPool=PlaceData.merge(mapPool,PlaceData.merge(cached||[],visitPlaces));
  if(typeof map!=='undefined'&&map&&typeof refreshArea==='function')refreshArea();
  if(typeof map!=='undefined'&&map&&typeof renderPlaces==='function')renderPlaces();
  return {places:(cached||[]).length,visits:(visits||[]).length};
}

function cachedElementsFor(query,smart){
  const info=smart?.queryAreaInfo?.(query),history=root.PizzaPlaceHistory;
  if(!info||!history?.placeToElement||typeof mapPool==='undefined')return [];
  const out=[];
  for(const place of mapPool||[]){
    if(!smart.placeRelevant?.(place))continue;
    const element=history.placeToElement(place);if(!element)continue;
    if(smart.inside?.(info,{lat:element.lat,lng:element.lon}))out.push(element);
  }
  return out;
}

function installCompleteProviderUnion(){
  if(typeof placeService==='undefined'||!placeService?.overpass||placeService.overpass.__build38CompleteUnion)return false;
  const fallback=placeService.overpass.bind(placeService);
  const wrapped=async function(query,options={}){
    const smart=root.PizzaSmartDiscovery;
    if(!smart?.isWebsimDiscoveryQuery?.(query))return fallback(query,options);
    if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    options.onStatus?.('Vollständige PizzaScan-Suche: alle Kartenquellen und gespeicherten Treffer werden zusammengeführt …');
    const endpoints=[...(smart.PROVIDERS||[])],sources=[];
    const tasks=endpoints.map(async endpoint=>{
      const data=await this.json(endpoint,{method:'POST',body:new URLSearchParams({data:query})},options.signal,PROVIDER_TIMEOUT);
      if(!Array.isArray(data?.elements)||data.remark)throw Error(data?.remark||'Unvollständige Kartendaten');
      sources.push(new URL(endpoint).hostname);
      return data.elements;
    });
    const settled=await Promise.allSettled(tasks);
    if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    const groups=settled.filter(result=>result.status==='fulfilled').map(result=>result.value);
    const cached=cachedElementsFor(query,smart);
    const merged=smart.mergeElements?.(...groups,cached)||[];
    const eligible=smart.filterCandidates?.(merged)||merged;
    if(eligible.length){
      const source=[...new Set(sources)];if(cached.length)source.push('lokaler Cache');
      return {data:{elements:eligible},source:source.join(' + '),sources:source};
    }
    return fallback(query,options);
  };
  wrapped.__build38CompleteUnion=true;
  wrapped.__build38Fallback=fallback;
  placeService.overpass=wrapped;
  return true;
}

async function waitForMap(maxMs=10000){
  const started=Date.now();
  while(Date.now()-started<maxMs){
    if(typeof map!=='undefined'&&map&&typeof loadPlaces==='function')return true;
    await delay(50);
  }
  return false;
}

async function finalize(){
  if(installed)return;installed=true;
  try{
    installCompleteProviderUnion();
    const restored=await loadAllHistory();
    try{await navigator.storage?.persist?.();}catch{}
    const mapReady=await waitForMap();
    if(mapReady){
      /* The Build 37 initial request may already be running with the old 3.5 s
         return path. Cancel it only after the persistent cache is restored, then
         immediately replace it with the complete all-provider union. */
      try{if(typeof mapRequest!=='undefined'&&mapRequest?.abort)mapRequest.abort();}catch{}
      if(typeof refreshArea==='function')refreshArea();
      const status=document.getElementById('map-status');
      if(status)status.textContent=`${restored.places} gespeicherte Orte geladen · vollständige Suche läuft …`;
      setTimeout(()=>loadPlaces({force:true}),0);
    }
    root.PizzaBuild38Runtime={installed:true,restored,mapReady,completeProviderUnion:true,noResultCap:true,persistentHistory:true};
  }catch(error){
    console.warn('PizzaScan Build 38 finalization failed',error);
    root.PizzaBuild38Runtime={installed:false,error:String(error?.message||error)};
  }
}

if(typeof document==='undefined')return;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(finalize,0),{once:true});
else setTimeout(finalize,0);
})(typeof window!=='undefined'?window:globalThis);
