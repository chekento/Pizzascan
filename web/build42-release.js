/* PizzaScan Build 42 release metadata and evidence-marker overlay. */
(function(root){
 'use strict';
 const VERSION='2.3.7',BUILD=42,R=root.PizzaReleaseInfo;
 if(R?.RELEASE){
  Object.assign(R.RELEASE,{version:VERSION,build:BUILD,apk:'https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.7.apk'});
  const text={
   de:'Build 42 ersetzt die zu enge Pizza-/Italien-Filterpipeline durch progressive, breite OSM-Gastro-Discovery: alle benannten Restaurants, Fast-Food-Orte, Cafés, Foodtrucks, Takeaways, Food Courts, Bars, Pubs und Biergärten im aktiven Suchgebiet werden als Kandidaten geladen. Erste OSM-Treffer erscheinen sofort; weitere Spiegel ergänzen im Hintergrund. Pizza im Namen ist keine Voraussetzung.',
   en:'Build 42 replaces the overly narrow pizza/Italian filter pipeline with progressive broad OSM food-venue discovery: every named restaurant, fast-food venue, café, food truck, takeaway, food court, bar, pub and beer garden in the active search area is loaded as a candidate. First OSM results render immediately; additional mirrors merge in the background. Pizza in the name is not required.',
   it:'La build 42 usa una ricerca OSM progressiva e ampia: tutti i ristoranti, fast food, caffè, food truck, takeaway, food court, bar, pub e biergarten nominati nell’area attiva sono candidati. I primi risultati appaiono subito e le altre fonti OSM vengono unite in seguito.',
   es:'La build 42 usa descubrimiento OSM progresivo y amplio: todos los restaurantes, comida rápida, cafés, food trucks, takeaway, food courts, bares, pubs y biergarten con nombre del área activa se cargan como candidatos. Los primeros resultados aparecen de inmediato y otros espejos OSM se fusionan después.',
   fr:'La build 42 utilise une découverte OSM progressive et large : tous les restaurants, fast-foods, cafés, food trucks, plats à emporter, food courts, bars, pubs et biergartens nommés de la zone active sont chargés comme candidats. Les premiers résultats apparaissent immédiatement, puis les autres miroirs OSM sont fusionnés.'
  };
  for(const [lang,copy] of Object.entries(R.COPY||{})){copy.nextText=text[lang]||text.en;copy.historyText=(copy.historyText||'').replace('2.3.5','2.3.6');}
 }
 function syncVersion(){
  try{if(root.PizzaScan)root.PizzaScan.version=VERSION;}catch{}
  try{R?.syncVersion?.();R?.decorate?.();}catch{}
  try{const badge=root.document?.querySelector?.('.brand small');if(badge)badge.textContent=VERSION;}catch{}
 }
 function disableLegacyCoverageAudit(){
  try{
   // Build 41 wrapped loadPlaces with a second complete OSM scan after the main lookup.
   // Build 42 already queries every named gastro POI in its primary progressive discovery,
   // so keeping that wrapper only duplicates network traffic and delays perceived completion.
   if(root.loadPlaces?.__coverageAudit&&typeof root.loadPlaces.__inner==='function')root.loadPlaces=root.loadPlaces.__inner;
   if(root.PizzaCoverageAudit){root.PizzaCoverageAudit.legacyDisabledByBuild42=true;root.PizzaCoverageAudit.audit=async()=>({skipped:true,reason:'build42-primary-discovery'});}
   if(root.PizzaSmartDiscovery){root.PizzaSmartDiscovery.coverageMode='build42-primary-progressive';root.PizzaSmartDiscovery.coverageNote='Broad named-gastro coverage is part of the primary OSM request; no duplicate audit request.';}
  }catch(error){console.warn('PizzaScan Build 42 legacy coverage audit cleanup unavailable',error);}
 }
 function installMarkers(){
  try{
   if(typeof drawMarkers!=='function'||typeof L==='undefined'||typeof PlaceData==='undefined'||drawMarkers.__build42)return;
   const original=drawMarkers;
   drawMarkers=function(){
    if(!markers)return;
    markers.clearLayers();
    const visited=new Set(reports.filter(r=>r.visited&&r.place).map(r=>r.place.placeId));
    for(const p of visiblePlaces()){
     const h=Hours.status(p),isSaved=saved.some(x=>x.placeId===p.placeId);
     const markerEmoji=p.pizzaEvidence==='possible'?'🍝':(PlaceData.TYPES[p.type]?.emoji||'🍕');
     const icon=L.divIcon({className:'emoji-marker '+h.state,html:`<span>${markerEmoji}</span>${isSaved?'<b>⭐</b>':visited.has(p.placeId)?'<b>✓</b>':''}`,iconSize:[38,42],iconAnchor:[19,36],popupAnchor:[0,-30]});
     const content=document.createElement('div');content.className='venue-popup';content.innerHTML=`<strong translate="no">${esc(p.name)}</strong><p>${esc(p.address||PlaceData.TYPES[p.type]?.name||'Gastro-Ort')}</p>${statusBadge(p)}<small>${esc(h.note)}</small><div class="card-actions"><button data-action="place" data-id="${esc(p.placeId)}">Details ansehen</button><button data-action="directions" data-id="${esc(p.placeId)}">Route</button></div>`;
     L.marker([p.lat,p.lng],{icon,title:p.name,alt:p.name}).addTo(markers).bindPopup(content,{maxWidth:290});
    }
   };
   drawMarkers.__build42=true;drawMarkers.__inner=original;
  }catch(error){console.warn('PizzaScan Build 42 marker overlay unavailable',error);}
 }
 function sync(){disableLegacyCoverageAudit();syncVersion();installMarkers();try{if(typeof drawMarkers==='function'&&root.PizzaScan?.ready)drawMarkers();}catch{}}
 sync();
 if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});
  else queueMicrotask(sync);
 }
 root.setTimeout?.(sync,0);
})(typeof window!=='undefined'?window:globalThis);
