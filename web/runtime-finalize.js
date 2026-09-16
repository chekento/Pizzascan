/* PizzaScan Build 38 runtime finalizer.
 * Restores the complete local place/visit history after the map has initialized,
 * and replaces sparse early-return discovery with an uncapped all-provider union.
 */
(function(root){
'use strict';
const PROVIDER_TIMEOUT=65000;
let installed=false,completeSearchStarted=false,completeSearchFinished=false;

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
    completeSearchStarted=true;completeSearchFinished=false;
    if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    options.onStatus?.('Vollständige PizzaScan-Suche: alle Kartenquellen und gespeicherten Treffer werden zusammengeführt …');
    const endpoints=[...(smart.PROVIDERS||[])],sources=[];
    try{
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
    } finally { completeSearchFinished=true; }
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
async function waitForIdle(maxMs=70000){
  const started=Date.now();
  while(Date.now()-started<maxMs){if(typeof mapLoading==='undefined'||!mapLoading)return true;await delay(100);}
  return false;
}

async function finalize(){
  if(installed)return;installed=true;
  try{
    /* Install the complete union immediately. script.js is still awaiting its own
       IndexedDB open here on normal startup, so the very first map request already
       uses this transport. */
    installCompleteProviderUnion();
    const mapReady=await waitForMap();
    /* initMap() reloads its small LocalStorage boot cache, so restore the complete
       IndexedDB history only after the map exists. That prevents initMap from
       overwriting the full persistent pool. */
    const restored=await loadAllHistory();
    try{await navigator.storage?.persist?.();}catch{}

    if(mapReady){
      const status=document.getElementById('map-status');
      if(status&&restored.places)status.textContent=`${restored.places} gespeicherte Orte geladen · Kartensuche wird vervollständigt …`;
      /* Do not abort the first-load wrapper. Build 37/early Build 38 could turn an
         intentional abort into a false zero-result state and expand 5 km to 10 km.
         If a legacy request somehow started before our patch, let it finish, then
         replace it once with the complete union. */
      if(!completeSearchStarted){
        await waitForIdle();
        if(!completeSearchFinished&&typeof loadPlaces==='function')await loadPlaces({force:true});
      }
    }
    root.PizzaBuild38Runtime={installed:true,restored,mapReady,completeProviderUnion:true,completeSearchStarted,completeSearchFinished,noResultCap:true,persistentHistory:true};
  }catch(error){
    console.warn('PizzaScan Build 38 finalization failed',error);
    root.PizzaBuild38Runtime={installed:false,error:String(error?.message||error)};
  }
}

if(typeof document==='undefined')return;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(finalize,0),{once:true});
else setTimeout(finalize,0);
})(typeof window!=='undefined'?window:globalThis);
