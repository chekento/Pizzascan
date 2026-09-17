/* PizzaScan Build 43: pizza/Italian relevance, fast progressive OSM discovery and compact map tools. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else{root.PizzaBuild43=api;api.install(root);}
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const VERSION='2.3.8',BUILD=43;
 const BUILD42_MARKER='pizzascan-build42-broad-discovery';
 const BUILD43_MARKER='pizzascan-build43-relevant-discovery';
 const PIZZA_RE=/(pizza|pizzeria|pizzaria|pizzerie|pizze|pizza[ _-]?bar|pizza[ _-]?restaurant|ピザ|披萨|披薩|比萨|比薩|بيتزا|пицц|πίτσα|פיצה|피자|พิซซ่า)/iu;
 const ITALIAN_CUISINE_RE=/(^|[;,/|\s])(italian|italiano|italiana|italienne|italienisch|italian_style|pasta)(?=$|[;,/|\s])/iu;
 const ITALIAN_NAME_RE=/(ristorante|trattoria|osteria|cucina\s+italiana|italiano|italiana|bella\s+italia|italia\s+(?:restaurant|bar)|pasta\s+(?:bar|restaurant)|forno\s+italiano)/iu;
 const EVIDENCE_KEYS=/^(?:name(?::.*)?|brand|operator|cuisine|speciality|product|products|description(?::.*)?|note(?::.*)?|menu(?::.*)?|website:menu|contact:menu|vending)$/i;

 function areaToken(center,radius,bounds){
  const r=Number(radius)||0;
  if(r>0&&center&&Number.isFinite(Number(center.lat))&&Number.isFinite(Number(center.lng)))return `around:${Math.round(Math.max(.5,Math.min(10,r))*1000)},${Number(center.lat)},${Number(center.lng)}`;
  if(bounds&&['south','west','north','east'].every(k=>Number.isFinite(Number(bounds[k]))))return `${Number(bounds.south)},${Number(bounds.west)},${Number(bounds.north)},${Number(bounds.east)}`;
  if(center&&Number.isFinite(Number(center.lat))&&Number.isFinite(Number(center.lng)))return `around:5000,${Number(center.lat)},${Number(center.lng)}`;
  throw Error('Ungültiger Suchbereich');
 }
 function relevantQuery(center,radius,bounds){
  const a=areaToken(center,radius,bounds);
  const pizza='pizza|pizzeria|pizzaria|pizze|ピザ|披萨|披薩|比萨|比薩|بيتزا|пицц|πίτσα|פיצה|피자|พิซซ่า';
  const italian='italian|italiano|italiana|italienne|italienisch|pasta';
  const italianName='ristorante|trattoria|osteria|cucina italiana|bella italia|forno italiano';
  return `[out:json][timeout:16];(/* ${BUILD42_MARKER} ${BUILD43_MARKER} */`+
   `nwr["cuisine"~"${pizza}|${italian}",i](${a});`+
   `nwr["name"~"${pizza}|${italianName}",i](${a});`+
   `nwr["brand"~"${pizza}|${italianName}",i](${a});`+
   `nwr["operator"~"${pizza}|${italianName}",i](${a});`+
   `nwr["speciality"~"${pizza}|${italian}",i](${a});`+
   `nwr["product"~"${pizza}",i](${a});nwr["products"~"${pizza}",i](${a});`+
   `nwr["description"~"${pizza}|italian restaurant|italian cuisine|cucina italiana",i](${a});`+
   `nwr["note"~"${pizza}|italian restaurant|italian cuisine|cucina italiana",i](${a});`+
   `nwr["vending"~"pizza",i](${a});nwr["vending:pizza"="yes"](${a});`+
   `);out body center qt;`;
 }
 function tagText(tags={}){const out=[];for(const [k,v] of Object.entries(tags)){if(v!=null&&EVIDENCE_KEYS.test(k))out.push(String(v));}return out.join(' ');}
 function pizzaEvidence(tags={}){return tags['vending:pizza']==='yes'||PIZZA_RE.test(String(tags.vending||''))||PIZZA_RE.test(tagText(tags));}
 function italianEvidence(tags={}){return ITALIAN_CUISINE_RE.test(String(tags.cuisine||''))||ITALIAN_NAME_RE.test([tags.name,tags.brand,tags.operator,tags.description,tags.note].filter(Boolean).join(' '));}
 function relevantTags(tags={}){return pizzaEvidence(tags)||italianEvidence(tags);}
 function firstTag(tags,prefix){for(const [k,v] of Object.entries(tags||{}))if(k.startsWith(prefix)&&v)return String(v);return '';}
 function address(tags={}){return tags['addr:full']||[[tags['addr:street']||tags['addr:place'],tags['addr:housenumber']].filter(Boolean).join(' '),[tags['addr:postcode'],tags['addr:city']||tags['addr:town']||tags['addr:village']].filter(Boolean).join(' ')].filter(Boolean).join(', ');}
 function classify(tags={},pizza=false){const a=String(tags.amenity||'');if(String(tags.vending||'').toLowerCase().includes('pizza')||tags['vending:pizza']==='yes')return 'vending_pizza';if(a==='food_truck'||tags.mobile==='yes')return 'food_truck';if(a==='cafe')return 'cafe';if(a==='fast_food'||a==='takeaway')return 'fast_food';if(pizza&&a==='restaurant')return 'pizzeria';return 'other';}
 function normalizeElement(element,Core){
  const tags=element?.tags||{},lat=element?.lat??element?.center?.lat,lng=element?.lon??element?.center?.lon;
  if(!Core?.coords?.(lat,lng)||!['node','way','relation'].includes(element?.type)||!/^\d+$/.test(String(element?.id)))return null;
  if(tags.disused==='yes'||tags.abandoned==='yes'||['disused','abandoned','demolished','construction'].includes(tags.amenity)||!relevantTags(tags))return null;
  const confirmed=pizzaEvidence(tags),possible=!confirmed&&italianEvidence(tags),name=String(tags.name||tags.brand||tags.operator||(confirmed?'Pizza-Ort ohne Namen':'Italienischer Ort ohne Namen')).trim();
  if(!name)return null;
  return Core.place({placeId:`${element.type}-${element.id}`,name,lat:Number(lat),lng:Number(lng),type:classify(tags,confirmed),openingHours:tags.opening_hours||'',website:tags.website||tags['contact:website'],phone:tags.phone||tags['contact:phone']||tags.mobile_phone,address:address(tags),cuisine:tags.cuisine||'',menu:tags['website:menu']||tags['contact:menu']||tags['menu:website']||'',description:tags.description||firstTag(tags,'description:'),tags,country:tags['addr:country']||'',state:tags['addr:state']||'',pizzaEvidence:confirmed?'confirmed':'possible',updatedAt:new Date().toISOString(),dataSource:'OpenStreetMap'});
 }
 function normalizeElements(elements,Core){const out=new Map();for(const e of Array.isArray(elements)?elements:[]){const p=normalizeElement(e,Core);if(p)out.set(p.placeId,p);}return [...out.values()];}
 function relevantPlace(p){if(!p)return false;if(p.pizzaEvidence==='confirmed'||p.pizzaEvidence==='possible')return true;return relevantTags(p.tags||{cuisine:p.cuisine,name:p.name,description:p.description});}
 function filterPlaces(list,cfg={},context={},hours=()=>({state:'unknown'})){
  const types=Array.isArray(cfg.types)?cfg.types:null;
  return (list||[]).filter(p=>{if(!relevantPlace(p))return false;if(types&&!types.includes(p.type))return false;if(cfg.includeItalian===false&&p.pizzaEvidence==='possible')return false;if(cfg.hideVisited&&context.visited?.has?.(p.placeId))return false;if(cfg.onlyOpen){const state=hours(p)?.state;if(state!=='open'&&!(cfg.unknownHours&&state==='unknown'))return false;}return true;});
 }
 function syncVersion(root){
  try{if(root.PizzaScan)root.PizzaScan.version=VERSION;}catch{}
  try{const R=root.PizzaReleaseInfo;if(R?.RELEASE)Object.assign(R.RELEASE,{version:VERSION,build:BUILD,apk:'https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.8.apk'});R?.syncVersion?.();R?.decorate?.();}catch{}
  try{const badge=root.document?.querySelector?.('.brand small');if(badge)badge.textContent=VERSION;}catch{}
 }
 function injectCompactStyles(doc){
  if(doc.getElementById('build43-compact-style'))return;
  const style=doc.createElement('style');style.id='build43-compact-style';style.textContent=`
   .build43-compact-tools{display:flex!important;flex-direction:row!important;align-items:center!important;gap:7px!important;flex-wrap:wrap!important;margin:5px 0 8px!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}
   .build43-compact-action-wrap{display:contents!important}
   button.build43-compact-action{width:auto!important;min-width:0!important;min-height:34px!important;height:34px!important;padding:4px 11px!important;margin:0!important;border:1px solid var(--line)!important;border-radius:18px!important;background:var(--surface)!important;box-shadow:none!important;font-size:11.5px!important;font-weight:700!important;line-height:1!important}
   .build43-cache-note{flex:1 1 100%!important;width:100%!important;margin:0 2px!important;padding:0!important;font-size:10px!important;line-height:1.35!important;color:var(--muted)!important;opacity:.82!important;display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;overflow:hidden!important}
   #result-count{font-size:10px!important}.map-legend summary{font-size:10.5px!important}
  `;doc.head.appendChild(style);
 }
 function compactLegacyTools(doc){
  injectCompactStyles(doc);
  const norm=s=>String(s||'').replace(/\s+/g,' ').trim().toLowerCase();
  const buttons=[...doc.querySelectorAll('button')];
  const place=buttons.find(b=>/^(?:🔎\s*)?(?:ort suchen|search place|cerca luogo|buscar lugar|rechercher un lieu)$/.test(norm(b.textContent)));
  const refresh=buttons.find(b=>/(vollständig aktualisieren|refresh completely|aggiorna completamente|actualizar completamente|actualiser complètement)/.test(norm(b.textContent)));
  for(const b of [place,refresh].filter(Boolean)){b.classList.add('build43-compact-action');if(b.parentElement)b.parentElement.classList.add('build43-compact-action-wrap');}
  if(place&&refresh){let a=place.parentElement;const ancestors=new Set();while(a&&a!==doc.body){ancestors.add(a);a=a.parentElement;}let c=refresh.parentElement;while(c&&c!==doc.body&&!ancestors.has(c))c=c.parentElement;if(c&&c!==doc.body&&!c.matches('main,#map-view'))c.classList.add('build43-compact-tools');}
  const notes=[...doc.querySelectorAll('p,small,div')].filter(el=>{const t=norm(el.textContent);return !el.querySelector('button')&&(t.includes('gespeicherte orte werden sofort geladen')||t.includes('saved places are loaded immediately'));});
  if(notes[0])notes[0].classList.add('build43-cache-note');
 }
 function updateCopy(root){
  const d=root.document;if(!d)return;
  const legend=d.querySelector('.map-legend');if(legend){const ps=legend.querySelectorAll('p');if(ps[1])ps[1].innerHTML='<strong>Build 43:</strong> PizzaScan zeigt nur Orte mit direktem Pizza-Bezug oder belastbarer italienischer Evidenz. Die Abfrage ist wieder gezielt wie im ursprünglichen WebSim-Projekt, ergänzt aber Pizza-Bars, Cafés, Takeaways, Foodtrucks, Automaten sowie mehrsprachige Pizza-/Italien-Tags. Der erste erfolgreiche OSM-Spiegel wird sofort angezeigt; weitere Spiegel ergänzen danach.';}
  const map=d.getElementById('map');if(map)map.setAttribute('aria-label','Karte mit Pizza- und italienisch relevanten Orten');
 }
 function installMarkers(root){
  try{if(typeof drawMarkers!=='function'||typeof L==='undefined'||typeof PlaceData==='undefined'||drawMarkers.__build43)return;const old=drawMarkers;drawMarkers=function(){if(!markers)return;markers.clearLayers();const visited=new Set(reports.filter(r=>r.visited&&r.place).map(r=>r.place.placeId));for(const p of visiblePlaces()){const h=Hours.status(p),isSaved=saved.some(x=>x.placeId===p.placeId),emoji=p.pizzaEvidence==='possible'?'🍝':(PlaceData.TYPES[p.type]?.emoji||'🍕'),icon=L.divIcon({className:'emoji-marker '+h.state,html:`<span>${emoji}</span>${isSaved?'<b>⭐</b>':visited.has(p.placeId)?'<b>✓</b>':''}`,iconSize:[38,42],iconAnchor:[19,36],popupAnchor:[0,-30]});const content=document.createElement('div');content.className='venue-popup';content.innerHTML=`<strong translate="no">${esc(p.name)}</strong><p>${esc(p.address||PlaceData.TYPES[p.type]?.name||'Pizza / Italienisch')}</p>${statusBadge(p)}<small>${esc(h.note)}</small><div class="card-actions"><button data-action="place" data-id="${esc(p.placeId)}">Details ansehen</button><button data-action="directions" data-id="${esc(p.placeId)}">Route</button></div>`;L.marker([p.lat,p.lng],{icon,title:p.name,alt:p.name}).addTo(markers).bindPopup(content,{maxWidth:290});}};drawMarkers.__build43=true;drawMarkers.__inner=old;}catch(e){console.warn('Build 43 marker setup unavailable',e);}
 }
 function install(root){
  if(!root.document)return false;const PD=root.PizzaPlaces,Core=root.PizzaCore;if(!PD||!Core)return false;
  PD.query=relevantQuery;PD.normalize=e=>normalizeElement(e,Core);PD.fromOverpass=els=>normalizeElements(els,Core);PD.filter=filterPlaces;
  if(PD.TYPES?.other)PD.TYPES.other={...PD.TYPES.other,emoji:'🍝',name:'Italienischer Kandidat'};
  try{if(typeof mapPool!=='undefined'&&Array.isArray(mapPool))mapPool=mapPool.filter(relevantPlace);if(typeof places!=='undefined'&&Array.isArray(places))places=places.filter(relevantPlace);}catch{}
  try{if(typeof renderPlaces==='function'&&!renderPlaces.__build43){const old=renderPlaces;renderPlaces=function(){const out=old();try{const list=typeof visiblePlaces==='function'?visiblePlaces():[],confirmed=list.filter(p=>p.pizzaEvidence==='confirmed').length,italian=list.filter(p=>p.pizzaEvidence==='possible').length,cfg=typeof mapConfig==='function'?mapConfig():{};const title=root.document.getElementById('places-title'),count=root.document.getElementById('result-count');if(title)title.textContent=cfg.radius?`Pizza & Italienisch · ${cfg.radius} km`:'Pizza & Italienisch · Kartenausschnitt';if(count)count.textContent=`${list.length} Orte · ${confirmed} Pizza · ${italian} Italienisch`;}catch{}return out;};renderPlaces.__build43=true;renderPlaces.__inner=old;}}catch{}
  try{if(typeof root.mapConfig==='function'&&!root.mapConfig.__build43){const old=root.mapConfig;const wrap=function(){const cfg=old();return {...cfg,includeUnconfirmed:false};};wrap.__build43=true;wrap.__inner=old;root.mapConfig=wrap;}}catch{}
  installMarkers(root);syncVersion(root);updateCopy(root);compactLegacyTools(root.document);
  root.PizzaScanDiscovery43={version:VERSION,build:BUILD,mode:'progressive-relevance-osm',pizzaOrItalianRequired:true,noGenericRestaurants:true,firstPaintProgressive:true,fixedRadiusUsesCircle:true};
  const observer=new MutationObserver(()=>compactLegacyTools(root.document));observer.observe(root.document.documentElement,{childList:true,subtree:true});root.setTimeout(()=>observer.disconnect(),12000);
  root.addEventListener('load',()=>{try{if(typeof refreshArea==='function')refreshArea();}catch{}compactLegacyTools(root.document);},{once:true});
  return true;
 }
 return {VERSION,BUILD,PIZZA_RE,ITALIAN_CUISINE_RE,ITALIAN_NAME_RE,areaToken,relevantQuery,tagText,pizzaEvidence,italianEvidence,relevantTags,normalizeElement,normalizeElements,relevantPlace,filterPlaces,install};
});
