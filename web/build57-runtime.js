/* PizzaScan Build 57: one live personal score, complete late-runtime i18n and
 * a guaranteed viewport scan after GPS has moved the map. */
(function(root){
 'use strict';
 const LANGS=['de','en','it','es','fr'];
 const COPY={
  openNow:['◷ Jetzt geöffnet','◷ Open now','◷ Aperto ora','◷ Abierto ahora','◷ Ouvert maintenant'],
  openOnly:['🟢 Nur geöffnet','🟢 Open only','🟢 Solo aperti','🟢 Solo abiertos','🟢 Ouverts uniquement'],
  ratings:['★ Bewertungen','★ Ratings','★ Valutazioni','★ Valoraciones','★ Notes'],
  filter:['Filter','Filters','Filtri','Filtros','Filtres'],
  searchHere:['Hier suchen','Search here','Cerca qui','Buscar aquí','Rechercher ici'],
  openNowShort:['◷ Offen','◷ Open','◷ Aperto','◷ Abierto','◷ Ouvert'],
  openOnlyShort:['🟢 Offen','🟢 Open','🟢 Aperto','🟢 Abierto','🟢 Ouvert'],
  ratingsShort:['★ Rating','★ Rating','★ Valut.','★ Valor.','★ Note'],
  filterShort:['☷ Filter','☷ Filter','☷ Filtri','☷ Filtro','☷ Filtre'],
  searchHereShort:['↻ Suchen','↻ Search','↻ Cerca','↻ Buscar','↻ Chercher'],
  saved:['♡ Gemerkt','♡ Saved','♡ Salvati','♡ Guardados','♡ Enregistrés'],
  allPlaces:['Alle Orte','All places','Tutti i luoghi','Todos los lugares','Tous les lieux'],
  savedTitle:['Gemerkt · Pizza & italienische Orte','Saved · pizza & Italian places','Salvati · pizza e locali italiani','Guardados · pizza y lugares italianos','Enregistrés · pizzas et lieux italiens'],
  viewportTitle:['Pizza, Trattorie & Restaurants · Kartenausschnitt','Pizza, trattorias & restaurants · visible map area','Pizzerie, trattorie e ristoranti · area visibile','Pizzerías, trattorias y restaurantes · área visible','Pizzerias, trattorias et restaurants · zone visible'],
  nearbyTitle:['Pizza, Trattorie & Restaurants · {radius} km','Pizza, trattorias & restaurants · {radius} km','Pizzerie, trattorie e ristoranti · {radius} km','Pizzerías, trattorias y restaurantes · {radius} km','Pizzerias, trattorias et restaurants · {radius} km'],
  fullscreenTitle:['Restaurant- & Pizzakarte','Restaurant & pizza map','Mappa di ristoranti e pizzerie','Mapa de restaurantes y pizzerías','Carte des restaurants et pizzerias'],
  buildLegend:['Build 57: POIs werden im sichtbaren Kartenausschnitt automatisch geladen; GPS-Zentrierung startet den Scan nach der Kartenbewegung.','Build 57: POIs load automatically in the visible map area; GPS centering starts the scan after the map movement.','Build 57: i POI vengono caricati automaticamente nell’area visibile; il centraggio GPS avvia la scansione dopo lo spostamento della mappa.','Build 57: los POI se cargan automáticamente en el área visible; el centrado GPS inicia el escaneo después del movimiento del mapa.','Build 57 : les POI sont chargés automatiquement dans la zone visible ; le centrage GPS lance le scan après le déplacement de la carte.'],
  count:['{shown} von {total} Orten','{shown} of {total} places','{shown} di {total} luoghi','{shown} de {total} lugares','{shown} sur {total} lieux'],
  countCompact:['{shown}/{total}','{shown}/{total}','{shown}/{total}','{shown}/{total}','{shown}/{total}']
 };
 function lang(){const value=String(root.PizzaI18n?.language||root.document?.documentElement?.lang||'de').slice(0,2);return LANGS.includes(value)?value:'de';}
 function text(key,values={}){const row=COPY[key],index=LANGS.indexOf(lang());return String(row?.[index<0?0:index]||key).replace(/\{(\w+)\}/g,(_,name)=>String(values[name]??''));}
 function validRating(value){const n=Number(value);return Number.isFinite(n)&&n>=.1&&n<=10?Math.round(n*10)/10:null;}
 function mapRef(){try{return typeof map!=='undefined'&&map?map:null;}catch{return null;}}
 function placeFor(id){
  const key=String(id||'');if(!key)return null;
  try{if(typeof placeById==='function'){const found=placeById(key);if(found)return found;}}catch{}
  for(const source of [
   (()=>{try{return typeof places!=='undefined'?places:[];}catch{return [];}})(),
   (()=>{try{return typeof mapPool!=='undefined'?mapPool:[];}catch{return [];}})(),
   (()=>{try{return typeof saved!=='undefined'?saved:[];}catch{return [];}})()
  ]){const found=(source||[]).find(p=>String(p?.placeId||'')===key);if(found)return found;}
  return null;
 }
 function currentPlaceId(){
  return String(
   root.document?.querySelector?.('[data-action="visit-save"]')?.dataset?.id||
   root.__pizzaBuild57ReviewPlaceId||
   root.document?.getElementById?.('report-place')?.value||
   (()=>{try{return currentReport?.place?.placeId||'';}catch{return '';}})()||''
  );
 }
 function sharedValue(place){return validRating(root.PizzaPersonalRatings?.get?.(place));}
 function setShared(place,value){
  if(!place||!root.PizzaPersonalRatings)return false;
  const next=validRating(value),before=sharedValue(place);
  if(next===before)return true;
  return next===null?!!root.PizzaPersonalRatings.clear?.(place):!!root.PizzaPersonalRatings.set?.(place,next);
 }
 function updateScoreSurfaces(placeId,value){
  const id=String(placeId||''),score=validRating(value),shown=score===null?'':score.toFixed(1),doc=root.document;if(!id||!doc)return;
  try{if(typeof updatePersonalRatingSurfaces==='function')updatePersonalRatingSurfaces(id,score);}catch{}
  const own=doc.getElementById('own-rating');
  if(own&&String(doc.getElementById('report-place')?.value||'')===id&&doc.activeElement!==own){own.value=shown;const output=doc.getElementById('own-value');if(output)output.textContent=shown;}
  const visit=doc.getElementById('visit-rating');
  if(visit&&currentPlaceId()===id&&doc.activeElement!==visit)visit.value=shown;
  const review=doc.getElementById('review-rating');
  if(review&&currentPlaceId()===id&&doc.activeElement!==review&&review.value!==shown){
   review.value=shown;
   root.__pizzaBuild57Syncing=true;
   try{review.dispatchEvent(new Event('input',{bubbles:true}));}finally{root.__pizzaBuild57Syncing=false;}
  }
  const scoreNodes=doc.querySelectorAll('[data-score-place]');
  scoreNodes.forEach(node=>{if(String(node.dataset.scorePlace)===id)node.textContent=shown||'—';});
 }
 function getVisitDatabase(){
  try{const runtime=root.PizzaPlaceHistoryRuntime;if(runtime?.db&&root.PizzaPlaceHistory)return runtime.db();}catch{}
  return null;
 }
 function requestValue(request){return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||Error('Speicherzugriff fehlgeschlagen.'));});}
 function writeVisit(db,record){return new Promise((resolve,reject)=>{const tx=db.transaction(root.PizzaPlaceHistory.VISIT_STORE,'readwrite');tx.objectStore(root.PizzaPlaceHistory.VISIT_STORE).put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Besuchsarchiv konnte nicht aktualisiert werden.'));tx.onabort=()=>reject(tx.error||Error('Besuchsarchiv konnte nicht aktualisiert werden.'));});}
 function latestEvent(record){
  return [...(record?.events||[])].filter(event=>validRating(event?.rating)!==null).sort((a,b)=>Date.parse(b.updatedAt||0)-Date.parse(a.updatedAt||0))[0]||null;
 }
 async function syncVisitArchive(placeId,value){
  const dbPromise=getVisitDatabase();if(!dbPromise)return false;
  const db=await dbPromise;const H=root.PizzaPlaceHistory,id=String(placeId||'');if(!H||!id)return false;
  const record=await requestValue(db.transaction(H.VISIT_STORE,'readonly').objectStore(H.VISIT_STORE).get(id));if(!record)return false;
  const next=validRating(value),now=new Date().toISOString(),events=[...(record.events||[])];
  if(next===null){record.events=[];}else{
   const event=latestEvent(record);
   if(event){const index=events.findIndex(item=>item.id===event.id);events[index]={...event,rating:next,updatedAt:now};}
   else events.push({id:'manual:'+id,rating:next,notes:'',source:'manual',updatedAt:now});
   record.events=events;
  }
  record.updatedAt=now;await writeVisit(db,record);return true;
 }
 async function migrateVisitScores(){
  const dbPromise=getVisitDatabase();if(!dbPromise)return;
  const db=await dbPromise,H=root.PizzaPlaceHistory;const rows=await requestValue(db.transaction(H.VISIT_STORE,'readonly').objectStore(H.VISIT_STORE).getAll());
  for(const record of rows||[]){
   const event=latestEvent(record),place=record?.place;if(!event||!place)continue;
   let stored=null;try{stored=JSON.parse(root.localStorage?.getItem('pizzascan-place-ratings-v1')||'{}')?.[record.placeId]||null;}catch{}
   const visitTime=Date.parse(event.updatedAt||0),storedTime=Date.parse(stored?.updatedAt||0);
   if(!stored||visitTime>storedTime){setShared(place,event.rating);}
   else if(validRating(stored?.rating)!==null&&stored.rating!==event.rating){await syncVisitArchive(record.placeId,stored.rating);}
  }
 }
 function installDetailsBridge(){
  try{
   if(typeof detailsHtml!=='function'||detailsHtml.__build57SharedScore)return;
   const base=detailsHtml;
   detailsHtml=function(place){
    let html=base.apply(this,arguments);const score=sharedValue(place);
    if(score!==null){
     const marker=/<input\b[^>]*\bid=["']visit-rating["'][^>]*>/i;
     if(marker.test(html))html=html.replace(marker,tag=>/\svalue=["'][^"']*["']/i.test(tag)?tag.replace(/\svalue=["'][^"']*["']/i,' value="'+esc(score.toFixed(1))+'"'):tag.replace(/>$/,' value="'+esc(score.toFixed(1))+'">'));
    }
    return html;
   };
   detailsHtml.__build57SharedScore=true;detailsHtml.__inner=base;
  }catch(error){console.warn('PizzaScan Score-Brücke konnte nicht verbunden werden',error);}
 }
 function installActionBridge(){
  try{
   if(typeof handleMapAction!=='function'||handleMapAction.__build57SharedScore)return;
   const base=handleMapAction;
   handleMapAction=async function(button){
    const action=button?.dataset?.action,id=button?.dataset?.id;
    if(action==='visit-review'){
     const place=placeFor(id),input=root.document.getElementById('visit-rating');if(place&&input?.value)setShared(place,input.value);
    }
    const result=await base.apply(this,arguments);
    if(action==='visit-save'){
     const place=placeFor(id),input=root.document.getElementById('visit-rating');if(place&&input)setShared(place,input.value);
    }
    return result;
   };
   handleMapAction.__build57SharedScore=true;handleMapAction.__inner=base;
  }catch(error){console.warn('PizzaScan Besuchsaktion konnte nicht verbunden werden',error);}
 }
 function installReviewBridge(){
  try{
   if(typeof showDraft!=='function'||showDraft.__build57ReviewPlace)return;
   const base=showDraft;
   showDraft=function(source){const place=source?.place||source;root.__pizzaBuild57ReviewPlaceId=String(place?.placeId||'');return base.apply(this,arguments);};
   showDraft.__build57ReviewPlace=true;showDraft.__inner=base;
  }catch(error){console.warn('PizzaScan Rezension konnte nicht mit dem gemeinsamen Score verbunden werden',error);}
 }
 function onEditorInput(event){
  if(root.__pizzaBuild57Syncing)return;
  const target=event.target;if(!target||target.id!=='visit-rating')return;
  const place=placeFor(currentPlaceId());if(!place)return;
  if(target.value.trim()===''){setShared(place,null);return;}
  const score=validRating(target.value);if(score!==null)setShared(place,score);
 }
 function installScoreSync(){
  if(root.__pizzaBuild57ScoreSync)return;
  root.__pizzaBuild57ScoreSync=true;
  root.addEventListener('pizzascan:personal-rating-change',event=>{
   if(root.__pizzaBuild57Syncing)return;
   const detail=event.detail||{},id=String(detail.placeId||'');if(!id)return;
   updateScoreSurfaces(id,detail.rating);
   syncVisitArchive(id,detail.rating).catch(error=>console.warn('PizzaScan Besuchsscore konnte nicht gespiegelt werden',error));
  });
  root.document.addEventListener('input',onEditorInput);
  root.document.addEventListener('change',onEditorInput);
  installDetailsBridge();installActionBridge();installReviewBridge();
  migrateVisitScores().catch(error=>console.warn('PizzaScan Besuchsscores konnten nicht übernommen werden',error));
 }
 function closeEnough(center,point){return !!center&&!!point&&Math.abs(Number(center.lat)-Number(point.lat))<.02&&Math.abs(Number(center.lng)-Number(point.lng))<.02;}
 function scanCurrentViewport(){
  try{if(typeof refreshArea==='function')refreshArea();}catch{}
  try{if(typeof loadPlaces==='function')return loadPlaces({force:true});}catch(error){console.warn('PizzaScan GPS-Kartenscan fehlgeschlagen',error);}
  return null;
 }
 function installGpsBridge(){
  try{
   if(typeof gps!=='function'||gps.__build57GpsScan)return;
   const base=gps;
   const wrapped=function(){
    const current=mapRef(),started=Date.now();let fired=false,timer=0;
    const scan=()=>{if(fired)return;fired=true;clearTimeout(timer);root.setTimeout(scanCurrentViewport,0);};
    current?.once?.('moveend',scan);
    const waitForPosition=()=>{
     let point=null;try{point=typeof position!=='undefined'?position:null;}catch{}
     if(closeEnough(current?.getCenter?.(),point)||Date.now()-started>6000){scan();return;}
     timer=root.setTimeout(waitForPosition,100);
    };
    timer=root.setTimeout(waitForPosition,60);
    return base.apply(this,arguments);
   };
   wrapped.__build57GpsScan=true;wrapped.__inner=base;gps=wrapped;root.gps=wrapped;
   const regular=root.document.getElementById('gps'),fullscreen=root.document.getElementById('fs-gps');if(regular)regular.onclick=wrapped;if(fullscreen)fullscreen.onclick=wrapped;
  }catch(error){console.warn('PizzaScan GPS-Scan konnte nicht verbunden werden',error);}
 }
 function localizeTree(){
  const translate=root.PizzaI18n?.translate,doc=root.document;if(typeof translate!=='function'||!doc||lang()==='de')return;
  const skip='script,style,textarea,code,[translate="no"],[data-i18n-ignore]';
  const attrs=['aria-label','placeholder','title','alt'];
  const localizeAttributes=element=>{if(!(element instanceof Element))return;for(const attribute of attrs){const value=element.getAttribute(attribute);if(!value)continue;const next=translate(value);if(next!==value)element.setAttribute(attribute,next);}};
  const apply=node=>{if(!node||node.parentElement?.closest(skip))return;const raw=node.nodeValue;if(!raw||!raw.trim())return;const lead=raw.match(/^\s*/)[0],tail=raw.match(/\s*$/)[0],body=raw.slice(lead.length,raw.length-tail.length),next=translate(body);if(next!==body)node.nodeValue=lead+next+tail;};
  const rootNode=doc.body;if(!rootNode)return;localizeAttributes(rootNode);const walker=doc.createTreeWalker(rootNode,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){if(node.nodeType===Node.ELEMENT_NODE)localizeAttributes(node);else apply(node);}
 }
 function localizedMapChrome(){
  const doc=root.document;if(!doc)return;
  const set=(id,value)=>{const node=doc.getElementById(id);if(node&&node.textContent!==value)node.textContent=value;};
  ['rating-filter-open','fs-rating-filter','ratings-status'].forEach(id=>doc.getElementById(id)?.removeAttribute('translate'));
  const cfg=(()=>{try{return mapConfig();}catch{return {};}})();
  const compact=globalThis.PizzaScanDiscovery49?.build>=49;
  const legacyTools=doc.getElementById('build40-tools');if(legacyTools){legacyTools.hidden=compact;if(compact)legacyTools.style.setProperty('display','none','important');}
  set('open-filter',cfg.onlyOpen?(compact?text('openOnlyShort'):text('openOnly')):(compact?text('openNowShort'):text('openNow')));set('rating-filter-open',compact?text('ratingsShort'):text('ratings'));set('filter-open',compact?text('filterShort'):text('filter'));set('map-refresh',compact?text('searchHereShort'):text('searchHere'));
  const savedToggle=doc.getElementById('saved-toggle');if(savedToggle)savedToggle.textContent=typeof onlySaved!=='undefined'&&onlySaved?text('allPlaces'):text('saved');
  const title=doc.getElementById('places-title');if(title){if(typeof onlySaved!=='undefined'&&onlySaved)title.textContent=text('savedTitle');else if(Number(cfg.radius))title.textContent=text('nearbyTitle',{radius:Number(cfg.radius)});else title.textContent=text('viewportTitle');}
  const count=doc.getElementById('result-count');if(count){try{const visible=typeof visiblePlaces==='function'?visiblePlaces():[];const total=(typeof onlySaved!=='undefined'&&onlySaved?saved:places).length;count.textContent=globalThis.PizzaScanDiscovery49?.build>=49?text('countCompact',{shown:visible.length,total}):text('count',{shown:visible.length,total});}catch{}}
  const fsTitle=doc.querySelector('.fs-title');if(fsTitle)fsTitle.textContent=text('fullscreenTitle');
  const legend=doc.querySelectorAll('.map-legend p');if(legend[1])legend[1].innerHTML='<strong>'+esc(text('buildLegend').split(':')[0])+':</strong> '+esc(text('buildLegend').split(':').slice(1).join(':').trim());
  localizeTree();
 }
 function installLocalization(){
  if(root.__pizzaBuild57I18n)return;root.__pizzaBuild57I18n=true;
  root.PizzaI18nPatterns=[...(root.PizzaI18nPatterns||[]),
   ['^(\\d+) relevante Treffer · OpenStreetMap$','$1 relevant places · OpenStreetMap','$1 luoghi rilevanti · OpenStreetMap','$1 lugares relevantes · OpenStreetMap','$1 lieux pertinents · OpenStreetMap'],
   ['^(\\d+) relevante Treffer · weitere Kartenquellen werden zusammengeführt …$','$1 relevant places · more map sources are being merged …','$1 luoghi rilevanti · altre fonti cartografiche vengono unite …','$1 lugares relevantes · se están combinando más fuentes cartográficas …','$1 lieux pertinents · d’autres sources cartographiques sont fusionnées …'],
   ['^Vollständige Suche · (\\d+)/(\\d+) Kartenquellen …$','Full search · $1/$2 map sources …','Ricerca completa · $1/$2 fonti cartografiche …','Búsqueda completa · $1/$2 fuentes cartográficas …','Recherche complète · $1/$2 sources cartographiques …'],
   ['^Suche „(.+)“ …$','Searching “$1” …','Ricerca di “$1” …','Buscando “$1” …','Recherche de « $1 » …'],
   ['^Keine Ergebnisse für „(.+)“\\.$','No results for “$1”.','Nessun risultato per “$1”.','No hay resultados para « $1 ».','Aucun résultat pour « $1 ».'],
   ['^(\\d+) Treffer – wähle den passenden Ort\\.$','$1 results — choose the right place.','$1 risultati — scegli il luogo corretto.','$1 resultados — elige el lugar correcto.','$1 résultats — choisissez le bon lieu.'],
   ['^Bereit · (\\d+) Zeichen(?: · Mangrove-Direktupload möglich| · für Mangrove-Direktupload auf 1000 Zeichen kürzen)\\.$','Ready · $1 characters.','Pronto · $1 caratteri.','Listo · $1 caracteres.','Prêt · $1 caractères.']
  ];
  const run=()=>{try{localizedMapChrome();}catch(error){console.warn('PizzaScan Sprachanzeige konnte nicht aktualisiert werden',error);}};
  [0,80,250,700,1500,3000,6000].forEach(delay=>root.setTimeout(run,delay));
  const target=root.document.body;if(target&&!target.__pizzaBuild57I18nObserver){target.__pizzaBuild57I18nObserver=true;let pending=false;new MutationObserver(()=>{if(pending)return;pending=true;root.setTimeout(()=>{pending=false;run();},40);}).observe(target,{childList:true,subtree:true,characterData:true});}
 }
 function install(){installScoreSync();installGpsBridge();installDetailsBridge();installActionBridge();installReviewBridge();installLocalization();}
 root.PizzaBuild57={build:57,version:'2.3.22',scanCurrentViewport,updateScoreSurfaces,install};
 if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})(globalThis);
