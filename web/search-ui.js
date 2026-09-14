/* Compact restaurant/pizzeria search with precise submitted POI lookup, remote autocomplete and submit-only fallback. */
'use strict';
(()=>{
 let autocompleteTimer=null,autocompleteAbort=null,autocompleteRevision=0;
 let fallbackFrame=null,fallbackFrameReady=null,fallbackNext=null,fallbackSequence=0;
 const fallbackPending=new Map();
 const byId=id=>document.getElementById(id);
 const POI_ENDPOINTS=['https://overpass-api.de/api/interpreter','https://overpass.private.coffee/api/interpreter','https://overpass.osm.jp/api/interpreter','https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
 function currentCenter(){try{return mapCenter();}catch{return {lat:53.5511,lng:9.9937};}}
 function inFullscreen(){try{return !!mapFullscreen;}catch{return document.body.classList.contains('map-fullscreen');}}
 function closeAutocomplete(clearStatus=true){clearTimeout(autocompleteTimer);clearTimeout(searchTimer);autocompleteAbort?.abort();autocompleteAbort=null;try{showSearchResults([]);}catch{}if(clearStatus&&byId('search-status'))byId('search-status').textContent='';}
 function openSearch(){const panel=byId('search-panel'),toggle=byId('search-toggle');if(!panel)return;if(inFullscreen()){document.body.classList.add('fs-search-open');byId('fs-search')?.setAttribute('aria-expanded','true');}else{panel.classList.remove('search-panel-collapsed');toggle?.setAttribute('aria-expanded','true');}setTimeout(()=>byId('search')?.focus(),30);}
 function closeSearch(){const panel=byId('search-panel'),toggle=byId('search-toggle');if(!panel)return;closeAutocomplete();document.body.classList.remove('fs-search-open');byId('fs-search')?.setAttribute('aria-expanded','false');panel.classList.add('search-panel-collapsed');toggle?.setAttribute('aria-expanded','false');byId('search')?.blur();}
 function dedupe(items){const seen=new Set();return items.filter(item=>{const p=item.place||item,key=p?.placeId||item.osmId||[item.kind,item.name,item.address,Number(item.lat).toFixed(5),Number(item.lng).toFixed(5)].join('|');if(seen.has(key))return false;seen.add(key);return true;});}
 function decorate(items){const buttons=[...document.querySelectorAll('#search-results .search-result')];buttons.forEach((button,index)=>{const item=items[index];if(!item)return;const label=button.querySelector('span:nth-child(2)');if(!label)return;const kind=document.createElement('span');kind.className='search-kind';const type=item.place?.type||item.type;kind.textContent=item.kind==='venue'?(PlaceData.TYPES[type]?.name||'Restaurant'):'Ort / Adresse';label.appendChild(kind);});const box=byId('search-results');if(box&&!box.hidden){const note=document.createElement('p');note.className='search-autocomplete-note';note.textContent='Tippe weiter oder wähle einen Treffer. Beim Suchbutton werden POIs zusätzlich direkt mit OpenStreetMap abgeglichen.';box.appendChild(note);}}
 async function remoteAutocomplete(){const input=byId('search');if(!input)return;const q=input.value.trim();if(q.length<2){closeAutocomplete();return;}const revision=++autocompleteRevision;autocompleteAbort?.abort();const ctl=autocompleteAbort=new AbortController();const center=currentCenter();const local=PlaceData.suggestions([...places,...saved,...mapPool],q,center).map(p=>({...p,kind:'venue',place:p,osmId:p.placeId}));try{const remote=await placeService.photon(q,center,{signal:ctl.signal});if(revision!==autocompleteRevision||ctl.signal.aborted||input.value.trim()!==q)return;const venues=remote.filter(x=>x.kind==='venue'),locations=remote.filter(x=>x.kind!=='venue');const combined=dedupe([...local,...venues,...locations]).slice(0,10);showSearchResults(combined,combined.length>0&&combined.every(x=>x.kind==='venue'&&local.some(l=>(l.placeId||l.place?.placeId)===(x.placeId||x.place?.placeId))));decorate(combined);if(combined.length)byId('search-status').textContent=`${combined.length} Vorschläge · mit „Suchen“ erfolgt der genaue POI-Abgleich.`;}
 catch(error){if(!ctl.signal.aborted&&revision===autocompleteRevision&&local.length){showSearchResults(local,true);decorate(local);byId('search-status').textContent='Lokale Treffer verfügbar · genauer POI-Abgleich erfolgt beim Suchbutton.';}}
 }
 function scheduleAutocomplete(){clearTimeout(autocompleteTimer);const q=byId('search')?.value.trim()||'';if(q.length<2){closeAutocomplete();return;}autocompleteTimer=setTimeout(remoteAutocomplete,420);}
 function osmType(value){return {N:'node',W:'way',R:'relation',node:'node',way:'way',relation:'relation'}[value]||'';}
 function fallbackItems(rows){if(!Array.isArray(rows))throw Error('Ungültige Antwort des Fallback-Ortsdienstes');const foodTypes=new Set(['restaurant','fast_food','cafe','food_truck','pub','bar','takeaway','biergarten','food_court','vending_machine']);return rows.flatMap(row=>{const lat=Number(row.lat),lng=Number(row.lon),address=row.address||{},type=osmType(row.osm_type),category=row.category||row.class||'',osmValue=row.type||row.addresstype||'',food=category==='amenity'&&foodTypes.has(osmValue);if(!PizzaCore.coords(lat,lng))return [];const name=row.namedetails?.name||row.name||address.amenity||String(row.display_name||'').split(',')[0].trim()||'Ort';const tags={name,'addr:street':address.road||address.pedestrian||address.street||'','addr:housenumber':address.house_number||'','addr:postcode':address.postcode||'','addr:city':address.city||address.town||address.village||address.municipality||'','addr:country':address.country_code||'','addr:state':address.state||''};if(category)tags[category]=osmValue;const place=food&&type&&row.osm_id?PlaceData.normalize({type,id:row.osm_id,lat,lon:lng,tags},{allowNamed:true}):null;return [{name,lat,lng,address:row.display_name||PlaceData.address(tags),kind:food?'venue':'location',place,osmId:type&&row.osm_id?type+'-'+row.osm_id:'',country:String(address.country_code||'').toLowerCase(),state:address.state||'',fallbackSource:'Nominatim'}];});}
 function ensureFallbackFrame(){if(fallbackFrameReady)return fallbackFrameReady;fallbackFrameReady=new Promise((resolve,reject)=>{fallbackFrame=document.createElement('iframe');fallbackFrame.hidden=true;fallbackFrame.setAttribute('aria-hidden','true');fallbackFrame.tabIndex=-1;fallbackFrame.src='geocoder-proxy.html';const timer=setTimeout(()=>reject(Error('Fallback-Ortsdienst konnte nicht vorbereitet werden')),5000);fallbackFrame.onload=()=>{clearTimeout(timer);resolve(fallbackFrame.contentWindow);};fallbackFrame.onerror=()=>{clearTimeout(timer);reject(Error('Fallback-Ortsdienst konnte nicht geladen werden'));};document.body.appendChild(fallbackFrame);});return fallbackFrameReady;}
 function fallbackRequest(query,center,signal){const key='pizzascan-search-fallback-v1-'+PlaceData.text(query)+'|'+center.lat.toFixed(2)+'|'+center.lng.toFixed(2),stored=placeService.read(key);if(stored&&Date.now()-stored.time<86400000&&Array.isArray(stored.items))return Promise.resolve(stored.items);return ensureFallbackFrame().then(target=>new Promise((resolve,reject)=>{if(signal?.aborted)return reject(new DOMException('Abgebrochen','AbortError'));const id='geo-'+Date.now()+'-'+(++fallbackSequence),timer=setTimeout(()=>{fallbackPending.delete(id);reject(Error('Fallback-Ortssuche hat zu lange gedauert'));},18000);const abort=()=>{clearTimeout(timer);fallbackPending.delete(id);reject(new DOMException('Abgebrochen','AbortError'));};signal?.addEventListener('abort',abort,{once:true});fallbackPending.set(id,{resolve:rows=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);try{const items=fallbackItems(rows);placeService.write(key,{time:Date.now(),items});resolve(items);}catch(error){reject(error);}},reject:error=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);reject(error);}});target.postMessage({type:'pizzascan-geocode',id,query,language:(document.documentElement.lang||'de').slice(0,2)},location.origin);}));}
 function installFallback(){addEventListener('message',event=>{if(event.origin!==location.origin||!fallbackFrame||event.source!==fallbackFrame.contentWindow)return;const message=event.data||{};if(message.type!=='pizzascan-geocode-result')return;const pending=fallbackPending.get(message.id);if(!pending)return;fallbackPending.delete(message.id);message.ok?pending.resolve(message.data):pending.reject(Error(message.error||'Fallback-Suche fehlgeschlagen'));});const originalPhoton=placeService.photon.bind(placeService);placeService.photon=async function(query,center,options={}){const token=fallbackNext&&fallbackNext.query===query&&Date.now()-fallbackNext.time<6000?fallbackNext:null;if(token)fallbackNext=null;try{const items=await originalPhoton(query,center,options);if(token&&!options.signal?.aborted&&Array.isArray(items)&&items.length===0){const status=byId('search-status');if(status)status.textContent='Primäre Ortssuche ohne Treffer · alternative OpenStreetMap-Suche läuft …';return fallbackRequest(query,center,options.signal);}return items;}catch(error){if(!token||options.signal?.aborted)throw error;const status=byId('search-status');if(status)status.textContent='Primäre Ortssuche nicht erreichbar · alternative OpenStreetMap-Suche läuft …';return fallbackRequest(query,center,options.signal);}};}
 async function directPoiSearch(query,center,signal){
  const cfg=typeof mapConfig==='function'?mapConfig():{radius:10};
  const overpass=PizzaPoiSearch?.buildQuery(query,center,cfg.radius||10);if(!overpass)return [];
  let lastError=null;
  for(const endpoint of POI_ENDPOINTS){
   if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
   try{
    const data=await placeService.json(endpoint,{method:'POST',body:new URLSearchParams({data:overpass})},signal,10000);
    if(!Array.isArray(data?.elements)||data.remark)throw Error(data?.remark||'Unvollständige POI-Antwort');
    return PlaceData.fromOverpass(data.elements,{allowNamed:true}).map(p=>({...p,kind:'venue',place:p,osmId:p.placeId,poiSource:new URL(endpoint).hostname}));
   }catch(error){lastError=error;if(signal?.aborted)throw error;}
  }
  if(lastError)console.warn('Precise POI search unavailable',lastError);
  return [];
 }
 async function preciseSearch(event){
  event?.preventDefault();clearTimeout(searchTimer);clearTimeout(autocompleteTimer);autocompleteAbort?.abort();autocompleteAbort=null;
  const input=byId('search'),q=input?.value.trim()||'';if(q.length<2)return toast('Bitte mindestens zwei Zeichen eingeben');
  const revision=++searchRevision;searchAbort?.abort();const ctl=searchAbort=new AbortController(),center=currentCenter();
  byId('search-submit').disabled=true;byId('search-status').textContent='POIs werden nach Name, Adresse und OpenStreetMap-ID abgeglichen …';
  const local=PlaceData.suggestions([...places,...saved,...mapPool],q,center).map(p=>({...p,kind:'venue',place:p,osmId:p.placeId}));showSearchResults(local,true);
  fallbackNext={query:q,time:Date.now()};
  try{
   const [geoResult,poiResult]=await Promise.allSettled([placeService.photon(q,center,{signal:ctl.signal}),directPoiSearch(q,center,ctl.signal)]);
   if(revision!==searchRevision||ctl.signal.aborted)return;
   const geo=geoResult.status==='fulfilled'?geoResult.value:[],poi=poiResult.status==='fulfilled'?poiResult.value:[];
   const combined=PizzaPoiSearch.mergeRanked([local,poi,geo],q,center,PizzaCore.distance);
   showSearchResults(combined);decorate(combined);
   const venueCount=combined.filter(x=>x.kind==='venue'||x.place).length;
   byId('search-status').textContent=combined.length?`${combined.length} genaue Treffer · ${venueCount} POI${venueCount===1?'':'s'} · nach Namens-, Adress- und Ortsübereinstimmung sortiert.`:'Keine passende POI-/Ort-Übereinstimmung. Ergänze Restaurantname und Stadt oder verschiebe die Karte.';
   if(combined.length===1&&combined[0].kind==='location')selectSearch(0);
  }catch(error){
   if(revision===searchRevision&&!ctl.signal.aborted)byId('search-status').textContent=local.length?'Onlinedienste nicht erreichbar. Die bereits geladenen genauen Treffer bleiben auswählbar.':'POI-Suche momentan nicht erreichbar. Karte verschieben und „Hier suchen“ erneut verwenden.';
  }finally{if(revision===searchRevision)byId('search-submit').disabled=false;}
 }
 function install(){const panel=byId('search-panel'),toggle=byId('search-toggle'),collapse=byId('search-collapse'),input=byId('search'),form=byId('search-form');if(!panel||!toggle||!collapse||!input||!form)return;
  panel.classList.add('search-panel-collapsed');toggle.setAttribute('aria-expanded','false');toggle.onclick=openSearch;collapse.onclick=closeSearch;
  input.addEventListener('input',scheduleAutocomplete);form.addEventListener('submit',()=>{clearTimeout(autocompleteTimer);autocompleteAbort?.abort();autocompleteAbort=null;});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.classList.contains('search-panel-collapsed')&&!document.querySelector('#sheet[open]')){event.preventDefault();closeSearch();}});
  const oldSelect=selectSearch;selectSearch=function(index){const out=oldSelect(index);closeSearch();return out;};
  toggleFullscreenSearch=function(){const opening=!document.body.classList.contains('fs-search-open');if(opening)openSearch();else closeSearch();};
  installFallback();globalThis.searchCity=preciseSearch;form.onsubmit=preciseSearch;
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
 globalThis.PizzaScanSearchUI={open:openSearch,close:closeSearch,autocomplete:remoteAutocomplete,submit:preciseSearch,directPoiSearch,fromNominatim:fallbackItems};
})();
