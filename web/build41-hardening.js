/* PizzaScan Build 41: search-center UX, continuous radius, resilience, confidence and diagnostics. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaBuild41=api;api.install(root);}
})(globalThis,function(){
'use strict';

const VERSION='2.3.6',BUILD=41,MAX_RADIUS=10,RADIUS_STEP=.5;
const ERROR_KEY='pizzascan-runtime-errors-v1';

function clamp(n,min,max){return Math.min(max,Math.max(min,n));}
function normalizeRadius(value){
  const n=Number(value);
  if(!Number.isFinite(n))return 3;
  if(n<=0)return 0;
  return clamp(Math.round(n/RADIUS_STEP)*RADIUS_STEP,RADIUS_STEP,MAX_RADIUS);
}
function radiusText(value,lang='de'){
  const r=normalizeRadius(value),l=String(lang||'de').slice(0,2);
  if(r===0)return ({de:'Kartenausschnitt',en:'Map viewport',it:'Area visibile',es:'Área visible',fr:'Zone visible'})[l]||'Map viewport';
  return new Intl.NumberFormat(l,{maximumFractionDigits:1}).format(r)+' km';
}
function dataConfidence(info={}){
  const count=Math.max(0,Number(info.count)||0);
  if(!count||info.rating==null||!Number.isFinite(Number(info.rating)))return 0;
  let value=30+67*(1-Math.exp(-count/32));
  if(info.stale)value-=12;
  if(info.error)value-=18;
  return Math.round(clamp(value,18,97));
}
function localPercentile(values,current){
  const list=(values||[]).map(Number).filter(Number.isFinite);
  const x=Number(current);if(!Number.isFinite(x)||!list.length)return null;
  let below=0,equal=0;for(const n of list){if(n<x)below++;else if(n===x)equal++;}
  return Math.round(100*(below+equal*.5)/list.length);
}
function fusion(sources=[]){
  const valid=(sources||[]).filter(s=>Number.isFinite(Number(s.score))&&Number(s.weight)>0).map(s=>({...s,score:clamp(Number(s.score),0,10),weight:Number(s.weight)}));
  if(!valid.length)return null;
  const weight=valid.reduce((a,s)=>a+s.weight,0),score=valid.reduce((a,s)=>a+s.score*s.weight,0)/weight;
  const observations=valid.reduce((a,s)=>a+Math.max(0,Number(s.count)||0),0);
  const coverage=Math.round(clamp(24+valid.length*17+Math.log10(observations+1)*9,25,96));
  return {score,weight,coverage,sources:valid.length,observations};
}
function radarScore(metrics={}){
  const distance=Math.max(0,Number(metrics.distance)||0),rating=metrics.rating==null?NaN:Number(metrics.rating),confidence=clamp(Number(metrics.confidence)||0,0,100);
  let score=Math.max(0,2.3-distance*.55);
  if(metrics.open==='open')score+=2.4;else if(metrics.open==='unknown')score+=.45;else if(metrics.open==='closed')score-=.8;
  score+=Number.isFinite(rating)?clamp(rating,0,5)*.65:1;
  score+=confidence/100*.9;
  if(metrics.confirmed)score+=.8;
  return score;
}
function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function install(root){
  if(!root.document)return false;
  const doc=root.document;
  let searchCenterMarker=null,searchRadiusCircle=null,searchCenter=null,searchLabel='';

  const getMap=()=>{try{return typeof map!=='undefined'?map:null;}catch{return null;}};
  const getSettings=()=>{try{return typeof settings!=='undefined'?settings:null;}catch{return null;}};
  const getReports=()=>{try{return Array.isArray(reports)?reports:[];}catch{return [];}};
  const getSaved=()=>{try{return Array.isArray(saved)?saved:[];}catch{return [];}};
  const getPool=()=>{try{return Array.isArray(mapPool)?mapPool:[];}catch{return [];}};
  const lang=()=>String(doc.documentElement.lang||'de').slice(0,2);
  const t=(de,en,it,es,fr)=>({de,en,it,es,fr}[lang()]||en||de);

  // Continuous 0–10 km radius while retaining existing settings storage/read paths.
  if(typeof root.mapConfig==='function'&&!root.mapConfig.__build41){
    const old=root.mapConfig;
    const wrapped=function(){const cfg=old();let raw;try{raw=getSettings()?.filters?.radius;}catch{}return {...cfg,radius:normalizeRadius(raw===undefined?cfg.radius:raw)};};
    wrapped.__build41=true;wrapped.__inner=old;root.mapConfig=wrapped;
  }
  if(typeof root.filterForm==='function'&&!root.filterForm.__build41){
    const old=root.filterForm;
    const wrapped=function(){
      const html=old(),cfg=root.mapConfig();
      const replacement=`<div class="field radius-field"><label for="filter-radius">${t('Suchbereich rund um den Kartenmittelpunkt','Search radius around map center','Raggio di ricerca dal centro mappa','Radio de búsqueda desde el centro','Rayon autour du centre')}</label><div class="radius-line"><output id="filter-radius-value" for="filter-radius">${esc(radiusText(cfg.radius,lang()))}</output><span>0–${MAX_RADIUS} km</span></div><input id="filter-radius" type="range" min="0" max="${MAX_RADIUS}" step="${RADIUS_STEP}" value="${cfg.radius}" aria-valuetext="${esc(radiusText(cfg.radius,lang()))}"><p class="hint">${t('0 km = aktueller Kartenausschnitt. Der feste Radius bleibt beim Zoomen erhalten.','0 km = current map viewport. A fixed radius stays constant while zooming.','0 km = area visibile. Il raggio fisso resta costante durante lo zoom.','0 km = área visible. El radio fijo se mantiene al hacer zoom.','0 km = zone visible. Le rayon fixe reste constant pendant le zoom.')}</p></div>`;
      const pattern=/<div class="field"><label for="filter-radius">[\s\S]*?<select id="filter-radius">[\s\S]*?<\/select><\/div>/;
      return pattern.test(html)?html.replace(pattern,replacement):html+replacement;
    };
    wrapped.__build41=true;wrapped.__inner=old;root.filterForm=wrapped;
  }

  function currentCenter(){try{const c=getMap()?.getCenter();return c&&Number.isFinite(c.lat)&&Number.isFinite(c.lng)?{lat:c.lat,lng:c.lng}:null;}catch{return null;}}
  function removeSearchLayers(){const m=getMap();if(!m)return;try{if(searchCenterMarker)m.removeLayer(searchCenterMarker);}catch{}try{if(searchRadiusCircle)m.removeLayer(searchRadiusCircle);}catch{}searchCenterMarker=null;searchRadiusCircle=null;}
  function drawSearchLayers(radiusOverride){
    const m=getMap();if(!m||!root.L||!searchCenter)return;
    removeSearchLayers();
    const radius=radiusOverride===undefined?root.mapConfig().radius:normalizeRadius(radiusOverride);
    const icon=root.L.divIcon({className:'search-center-mini',html:'<span aria-hidden="true"></span>',iconSize:[18,18],iconAnchor:[9,9]});
    searchCenterMarker=root.L.marker([searchCenter.lat,searchCenter.lng],{icon,zIndexOffset:1800,title:t('Suchzentrum','Search center','Centro ricerca','Centro de búsqueda','Centre de recherche')}).addTo(m);
    searchCenterMarker.bindTooltip(`${t('Suchzentrum','Search center','Centro ricerca','Centro de búsqueda','Centre de recherche')}${searchLabel?' · '+esc(searchLabel):''}${radius?` · ${radiusText(radius,lang())}`:''}`);
    if(radius>0)searchRadiusCircle=root.L.circle([searchCenter.lat,searchCenter.lng],{radius:radius*1000,weight:2,opacity:.72,fillOpacity:.035,interactive:false,className:'search-radius-preview'}).addTo(m);
  }
  function markSearchCenter(center,label=''){
    if(!center||!Number.isFinite(Number(center.lat))||!Number.isFinite(Number(center.lng)))return;
    searchCenter={lat:Number(center.lat),lng:Number(center.lng)};searchLabel=String(label||'').slice(0,100);drawSearchLayers();
  }
  function clearSearchCenter(){removeSearchLayers();searchCenter=null;searchLabel='';}

  if(typeof root.selectSearch==='function'&&!root.selectSearch.__build41){
    const old=root.selectSearch;
    const wrapped=function(index){let result=null;try{result=typeof searchResults!=='undefined'?searchResults[index]:null;}catch{}const out=old.apply(this,arguments);if(result)setTimeout(()=>markSearchCenter({lat:result.lat,lng:result.lng},result.name),0);return out;};
    wrapped.__build41=true;wrapped.__inner=old;root.selectSearch=wrapped;
  }

  // Cache-first behavior when the device is offline, and safe fallback if a wrapper throws.
  if(typeof root.loadPlaces==='function'&&!root.loadPlaces.__build41){
    const old=root.loadPlaces;
    const wrapped=async function(options={}){
      if(root.navigator?.onLine===false){
        try{if(typeof mapRequest!=='undefined')mapRequest?.abort?.();if(typeof mapLoading!=='undefined')mapLoading=false;if(typeof mapError!=='undefined')mapError='';if(typeof mapSource!=='undefined')mapSource='Offline-Cache';if(typeof refreshArea==='function')refreshArea();const status=doc.getElementById('map-status');if(status)status.textContent=t('Offline · gespeicherte Orte','Offline · saved places','Offline · luoghi salvati','Sin conexión · lugares guardados','Hors ligne · lieux enregistrés');return {offline:true,cached:getPool().length};}catch(error){logError('offline-fallback',error);}
      }
      try{return await old.apply(this,arguments);}catch(error){
        logError('place-load',error);
        if(getPool().length){try{if(typeof refreshArea==='function')refreshArea();const status=doc.getElementById('map-status');if(status)status.textContent=t('Live-Abruf fehlgeschlagen · Cache bleibt sichtbar','Live refresh failed · cache stays visible','Aggiornamento live fallito · cache visibile','Falló la actualización · caché visible','Échec du direct · cache visible');return {fallback:true,error:error?.message||String(error)};}catch{}}
        throw error;
      }
    };
    wrapped.__build41=true;wrapped.__inner=old;root.loadPlaces=wrapped;
  }

  function logError(kind,error){
    try{
      const current=JSON.parse(root.localStorage?.getItem(ERROR_KEY)||'[]');
      const row={time:new Date().toISOString(),kind:String(kind||'runtime').slice(0,40),name:String(error?.name||'Error').slice(0,60),message:String(error?.message||error||'Unknown error').replace(/https?:\/\/\S+/g,'[url]').slice(0,240)};
      root.localStorage?.setItem(ERROR_KEY,JSON.stringify([row,...(Array.isArray(current)?current:[])].slice(0,20)));
    }catch{}
  }
  root.addEventListener('error',event=>logError('window',event.error||event.message));
  root.addEventListener('unhandledrejection',event=>logError('promise',event.reason));

  function transientCacheKeys(){
    const keys=[];try{for(let i=0;i<root.localStorage.length;i++){const k=root.localStorage.key(i)||'';if(k==='pizzascan-map-cache-v3'||k==='pizzascan-open-ratings-v1'||k==='pizzascan-cache-verify-v1'||k.startsWith('pizzascan-search-'))keys.push(k);}}catch{}return keys;
  }
  async function repairTransientState(){
    for(const k of transientCacheKeys())try{root.localStorage.removeItem(k);}catch{}
    try{if(typeof mapPool!=='undefined')mapPool=[];if(typeof mapAreas!=='undefined')mapAreas=[];if(root.PizzaRatingsUI?.service){root.PizzaRatingsUI.service.areas=[];root.PizzaRatingsUI.service.failures=[];root.PizzaRatingsUI.service.blockedUntil=0;}}catch{}
    try{if(typeof refreshArea==='function')refreshArea();}catch{}
    if(root.navigator?.onLine!==false&&typeof root.loadPlaces==='function')return root.loadPlaces({force:true});
    return {offline:true};
  }

  // Confidence is data-density/freshness metadata, not a truth probability.
  if(root.PizzaRatingsUI&&!root.PizzaRatingsUI.__build41Confidence){
    const oldCard=root.PizzaRatingsUI.card.bind(root.PizzaRatingsUI);
    root.PizzaRatingsUI.card=function(place){
      const html=oldCard(place),info=this.summary(place),confidence=dataConfidence(info);
      if(!html||!confidence)return html;
      const chip=`<span class="rating-confidence" title="${esc(t('Heuristik aus Bewertungsanzahl und Aktualität; keine Wahrheitswahrscheinlichkeit.','Heuristic from review count and freshness; not a truth probability.','Euristica da quantità e attualità; non è una probabilità di verità.','Heurística de cantidad y actualidad; no es probabilidad de verdad.','Heuristique basée sur volume et fraîcheur; pas une probabilité de vérité.'))}">${t('Datenvertrauen','Data confidence','Confidenza dati','Confianza de datos','Confiance données')} ${confidence}%</span>`;
      return html.replace('</p>',` · ${chip}</p>`);
    };
    root.PizzaRatingsUI.__build41Confidence=true;
  }

  function localSignals(place){
    const out=[];
    try{
      const info=root.PizzaRatingsUI?.summary?.(place);if(info&&Number.isFinite(Number(info.rating))&&Number(info.count)>0){const conf=dataConfidence(info);out.push({id:'mangrove',label:'Mangrove',score:Number(info.rating)*2,count:Number(info.count),confidence:conf,weight:(.75+Math.log10(Number(info.count)+1)*.85)*(conf/100)});}
    }catch{}
    const rows=getReports().filter(r=>r?.place?.placeId===place.placeId);
    const own=rows.filter(r=>r.visited&&Number.isFinite(Number(r.own))).map(r=>Number(r.own));
    if(own.length)out.push({id:'own',label:t('Eigene Besuche','Own visits','Visite proprie','Visitas propias','Visites propres'),score:own.reduce((a,n)=>a+n,0)/own.length,count:own.length,confidence:100,weight:Math.min(3,1.5*own.length)});
    const photos=rows.filter(r=>Number.isFinite(Number(r.overall))).map(r=>Number(r.overall));
    if(photos.length)out.push({id:'photo',label:t('Foto-KI','Photo AI','IA foto','IA de foto','IA photo'),score:photos.reduce((a,n)=>a+n,0)/photos.length,count:photos.length,confidence:45,weight:Math.min(1,.4+.2*photos.length)});
    return out;
  }
  function googleSignalFromDom(place){
    try{
      const panel=doc.querySelector(`[data-google-place="${CSS.escape(place.placeId)}"]`),ratingText=panel?.querySelector('.google-rating strong')?.textContent||'',countText=panel?.querySelector('.google-rating span')?.textContent||'';
      const rating=Number((ratingText.match(/([0-5](?:[.,]\d+)?)/)||[])[1]?.replace(',','.')),count=Number(countText.replace(/\D/g,''));
      if(Number.isFinite(rating)&&rating>=0&&rating<=5)return {id:'google',label:'Google Maps',score:rating*2,count:Number.isFinite(count)?count:0,confidence:count?Math.round(clamp(35+62*(1-Math.exp(-count/80)),35,97)):45,weight:Math.min(4,1+Math.log10((count||0)+1))};
    }catch{}
    return null;
  }
  function fusionInner(place,includeGoogle=true){
    const sources=localSignals(place),g=includeGoogle?googleSignalFromDom(place):null;if(g)sources.push(g);
    const result=fusion(sources);
    const chips=sources.map(s=>`<span class="fusion-source"><strong>${esc(s.label)}</strong> ${s.score.toFixed(1)}/10 <small>n=${s.count||0}${s.confidence?` · ${s.confidence}%`:''}</small></span>`).join('');
    const summary=result&&sources.length>=2?`<div class="fusion-score"><strong>${result.score.toFixed(1)}<small>/10</small></strong><span>${t('Signal-Mix','Signal mix','Mix segnali','Mezcla de señales','Mix de signaux')}<small>${t('Datenabdeckung','Data coverage','Copertura dati','Cobertura de datos','Couverture des données')} ${result.coverage}% · ${sources.length} ${t('Quellen','sources','fonti','fuentes','sources')}</small></span></div>`:`<p class="hint">${t('Für einen Signal-Mix werden mindestens zwei verfügbare Datenquellen benötigt.','At least two available data sources are required for a signal mix.','Servono almeno due fonti disponibili per il mix.','Se necesitan al menos dos fuentes disponibles para la mezcla.','Au moins deux sources sont nécessaires pour le mix.')}</p>`;
    return `${summary}<div class="fusion-sources">${chips||`<span class="hint">${t('Noch keine verwertbaren Signale.','No usable signals yet.','Nessun segnale utilizzabile.','Aún no hay señales utilizables.','Aucun signal exploitable.')}</span>`}</div><details><summary>${t('Berechnung & Grenzen','Calculation & limits','Calcolo e limiti','Cálculo y límites','Calcul et limites')}</summary><p>${t('Der Signal-Mix normalisiert verfügbare Bewertungen auf 0–10 und gewichtet sie nach Datenmenge. Eigene bestätigte Besuche zählen stärker; die experimentelle Foto-KI schwächer. Google wird nur einbezogen, wenn du die Daten in dieser Sitzung ausdrücklich geladen hast. Externe Portale werden nicht gescraped. Der Wert ist keine objektive Qualitätsmessung.','The signal mix normalizes available ratings to 0–10 and weights them by data volume. Confirmed own visits count more; experimental photo AI counts less. Google is included only after you explicitly load it in this session. External portals are not scraped. This is not an objective quality measurement.','Il mix normalizza le valutazioni su 0–10 e le pesa per quantità di dati. Le visite proprie confermate pesano di più; l’IA foto sperimentale meno. Google entra solo se caricato esplicitamente nella sessione. I portali esterni non vengono estratti. Non è una misura oggettiva.','La mezcla normaliza valoraciones a 0–10 y las pondera por volumen de datos. Las visitas propias confirmadas pesan más; la IA de foto experimental menos. Google solo entra si lo cargas expresamente en la sesión. No se extraen portales externos. No es una medición objetiva.','Le mix normalise les notes sur 0–10 et les pondère selon le volume. Les visites personnelles confirmées comptent davantage; l’IA photo expérimentale moins. Google n’est inclus qu’après chargement explicite dans la session. Aucun portail externe n’est aspiré. Ce n’est pas une mesure objective.')}</p></details>`;
  }
  if(typeof root.detailsHtml==='function'&&!root.detailsHtml.__build41){
    const old=root.detailsHtml;
    const wrapped=function(place){const html=old.apply(this,arguments);return html+`<section class="fusion-panel" data-fusion-place="${esc(place.placeId)}"><h2>${t('PizzaScan Signal-Mix','PizzaScan signal mix','Mix segnali PizzaScan','Mezcla de señales PizzaScan','Mix de signaux PizzaScan')}</h2><div class="fusion-content">${fusionInner(place,false)}</div></section>`;};
    wrapped.__build41=true;wrapped.__inner=old;root.detailsHtml=wrapped;
  }
  function refreshFusionPanels(){
    for(const section of doc.querySelectorAll('[data-fusion-place]')){
      const id=section.dataset.fusionPlace;let place=null;try{place=typeof root.placeById==='function'?root.placeById(id):null;}catch{}if(!place)continue;
      const html=fusionInner(place,true),hash=id+'|'+html;if(section.dataset.renderHash===hash)continue;section.dataset.renderHash=hash;const content=section.querySelector('.fusion-content');if(content)content.innerHTML=html;
    }
  }

  // Keep all Leaflet layers for compatibility, but visually de-emphasize low-value clutter at wide zooms.
  if(typeof root.drawMarkers==='function'&&!root.drawMarkers.__build41){
    const old=root.drawMarkers;
    const wrapped=function(){const out=old.apply(this,arguments);try{
      const m=getMap(),list=typeof root.visiblePlaces==='function'?root.visiblePlaces():[],layers=typeof markers!=='undefined'?markers.getLayers():[];
      const zoom=m?.getZoom?.()||14,limit=zoom<=12?40:zoom<=13?70:zoom<=14?110:220,center=typeof position!=='undefined'&&position?position:currentCenter();
      const scored=list.map((p,i)=>{let open='unknown',rating=null,confidence=0,distance=99;try{open=Hours.status(p).state;}catch{}try{const r=root.PizzaRatingsUI?.summary?.(p);rating=r?.rating;confidence=dataConfidence(r);}catch{}try{distance=center&&root.PizzaCore?.distance?root.PizzaCore.distance(center,p):99;}catch{}const isSaved=getSaved().some(x=>x.placeId===p.placeId);return {i,id:p.placeId,score:radarScore({distance,rating,confidence,open,confirmed:p.pizzaEvidence==='confirmed'})+(isSaved?3:0)};}).sort((a,b)=>b.score-a.score);
      const priority=new Set(scored.slice(0,limit).map(x=>x.id));layers.forEach((layer,i)=>{const el=layer.getElement?.()||layer._icon,id=list[i]?.placeId;if(el){el.classList.toggle('marker-low-priority',!!id&&!priority.has(id));el.classList.toggle('marker-high-priority',!!id&&priority.has(id));}});
    }catch{}return out;};wrapped.__build41=true;wrapped.__inner=old;root.drawMarkers=wrapped;
  }

  // Local comparison makes the photo score contextual without uploading photos or embeddings.
  if(typeof root.showReport==='function'&&!root.showReport.__build41){
    const old=root.showReport;
    const wrapped=function(id){const out=old.apply(this,arguments);try{
      const current=getReports().find(r=>r.id===id);if(!current)return out;const peers=getReports().filter(r=>r.id!==id&&r.model===current.model&&Number.isFinite(Number(r.overall))).map(r=>Number(r.overall));if(peers.length<2)return out;
      const pct=localPercentile(peers,Number(current.overall)),hero=doc.querySelector('#sheet-body .score-hero');if(hero&&!doc.getElementById('photo-benchmark')){const box=doc.createElement('div');box.id='photo-benchmark';box.className='photo-benchmark';box.innerHTML=`<strong>${t('Lokaler Vergleich','Local comparison','Confronto locale','Comparación local','Comparaison locale')}</strong><span>${t('Diese Analyse liegt ungefähr im','This analysis is approximately at the','Questa analisi è circa al','Este análisis está aproximadamente en el','Cette analyse se situe environ au')} ${pct}. ${t('Perzentil gegenüber','percentile versus','percentile rispetto a','percentil frente a','percentile par rapport à')} ${peers.length} ${t('anderen lokal gespeicherten Analysen mit demselben Modell.','other locally saved analyses using the same model.','altre analisi locali con lo stesso modello.','otros análisis locales con el mismo modelo.','autres analyses locales avec le même modèle.')}</span><small>${t('Nur dein lokaler Verlauf; keine globale Rangliste.','Your local history only; not a global ranking.','Solo cronologia locale; non una classifica globale.','Solo historial local; no es un ranking global.','Historique local uniquement; pas un classement global.')}</small>`;hero.insertAdjacentElement('afterend',box);}
    }catch{}return out;};wrapped.__build41=true;wrapped.__inner=old;root.showReport=wrapped;
  }

  function radarCandidates(){
    let list=[];try{list=typeof root.visiblePlaces==='function'?root.visiblePlaces():[];}catch{}const center=(()=>{try{return typeof position!=='undefined'&&position?position:currentCenter();}catch{return currentCenter();}})();
    return list.map(p=>{let open='unknown',rating=null,confidence=0,distance=99;try{open=Hours.status(p).state;}catch{}try{const r=root.PizzaRatingsUI?.summary?.(p);rating=r?.rating;confidence=dataConfidence(r);}catch{}try{distance=center&&root.PizzaCore?.distance?root.PizzaCore.distance(center,p):99;}catch{}return {p,open,rating,confidence,distance,score:radarScore({open,rating,confidence,distance,confirmed:p.pizzaEvidence==='confirmed'})};}).sort((a,b)=>b.score-a.score).slice(0,5);
  }
  function openRadar(){const rows=radarCandidates();if(!rows.length){try{root.toast?.(t('Noch keine Orte im aktuellen Suchbereich.','No places in the current search area yet.','Nessun luogo nell’area attuale.','Aún no hay lugares en el área actual.','Aucun lieu dans la zone actuelle.'));}catch{}return;}
    const cards=rows.map((r,i)=>`<article class="card radar-card"><div class="radar-rank">${i+1}</div><div><strong>${esc(r.p.name)}</strong><small>${Number.isFinite(r.distance)?(r.distance<1?Math.round(r.distance*1000)+' m':r.distance.toFixed(1)+' km'):''}${r.open==='open'?' · 🟢 '+t('geöffnet','open','aperto','abierto','ouvert'):r.open==='closed'?' · '+t('geschlossen','closed','chiuso','cerrado','fermé'):''}${Number.isFinite(r.rating)?` · ★ ${r.rating.toFixed(1)}/5`:''}</small></div><button class="secondary" data-action="place" data-id="${esc(r.p.placeId)}">${t('Details','Details','Dettagli','Detalles','Détails')}</button></article>`).join('');
    root.openSheet?.('radar',t('PIZZA-RADAR','PIZZA RADAR','RADAR PIZZA','RADAR DE PIZZA','RADAR PIZZA'),`<h1>${t('Interessante Orte aus deinem aktuellen Bereich.','Interesting places in your current area.','Luoghi interessanti nell’area attuale.','Lugares interesantes del área actual.','Lieux intéressants dans la zone actuelle.')}</h1><p class="hint">${t('Radar priorisiert Nähe, Öffnungsstatus, Pizza-Bestätigung und – falls vorhanden – belastbarere offene Bewertungen. Es ist eine Discovery-Sortierung, kein objektives Qualitätsurteil.','Radar prioritizes proximity, opening status, pizza evidence and, when available, better-supported open ratings. It is a discovery sort, not an objective quality verdict.','Il radar privilegia distanza, apertura, conferma pizza e valutazioni aperte più solide. È un ordinamento di scoperta, non un giudizio oggettivo.','El radar prioriza cercanía, apertura, confirmación de pizza y valoraciones abiertas mejor respaldadas. Es orden de descubrimiento, no un veredicto objetivo.','Le radar privilégie proximité, ouverture, preuve pizza et notes ouvertes mieux étayées. C’est un tri de découverte, pas un verdict objectif.')}</p><div class="radar-list">${cards}</div>`);
  }

  async function healthCheck(){
    const rows=[];const push=(id,status,label,detail)=>rows.push({id,status,label,detail});
    push('runtime',root.PizzaScan?.ready?'ok':'warn','PizzaScan Runtime',`${VERSION} · Build ${BUILD}`);
    const m=getMap();push('map',m?'ok':'bad',t('Karte','Map','Mappa','Mapa','Carte'),m?`${getPool().length} ${t('Orte im Cache','cached places','luoghi in cache','lugares en caché','lieux en cache')}`:t('nicht initialisiert','not initialized','non inizializzata','no inicializado','non initialisée'));
    push('network',root.navigator?.onLine===false?'warn':'ok',t('Netzwerk','Network','Rete','Red','Réseau'),root.navigator?.onLine===false?t('Offline-Cache aktiv','Offline cache active','Cache offline attiva','Caché sin conexión activa','Cache hors ligne actif'):t('Gerät meldet online','Device reports online','Dispositivo online','Dispositivo en línea','Appareil en ligne'));
    let gps='unknown';try{if(root.navigator?.permissions?.query)gps=(await root.navigator.permissions.query({name:'geolocation'})).state;}catch{}push('gps',!root.navigator?.geolocation?'bad':gps==='denied'?'warn':'ok','GPS',!root.navigator?.geolocation?t('nicht verfügbar','unavailable','non disponibile','no disponible','indisponible'):gps);
    let storageDetail=t('lokaler Speicher verfügbar','local storage available','memoria locale disponibile','almacenamiento local disponible','stockage local disponible'),storageStatus='ok';try{const k='__ps41';root.localStorage.setItem(k,'1');root.localStorage.removeItem(k);const e=await root.navigator?.storage?.estimate?.();if(e?.quota)storageDetail=`${Math.round((e.usage||0)/1048576)} / ${Math.round(e.quota/1048576)} MB`;}catch{storageStatus='bad';storageDetail=t('Schreibtest fehlgeschlagen','write test failed','test scrittura fallito','falló prueba de escritura','échec test écriture');}push('storage',storageStatus,t('Speicher','Storage','Memoria','Almacenamiento','Stockage'),storageDetail);
    let providerErrors=[];try{providerErrors=Array.isArray(placeService?.lastErrors)?placeService.lastErrors:[];}catch{}let source='';try{source=typeof mapSource!=='undefined'?mapSource:'';}catch{}push('providers',source?'ok':providerErrors.length?'warn':'ok',t('Kartendaten','Map data','Dati mappa','Datos del mapa','Données carte'),source?`${source}${providerErrors.length?' · '+providerErrors.length+' Fallback-Fehler':''}`:providerErrors.length?`${providerErrors.length} ${t('letzte Provider-Fehler','recent provider errors','errori provider recenti','errores recientes','erreurs récentes')}`:t('noch kein Live-Abruf','no live fetch yet','nessun aggiornamento live','sin consulta en vivo','aucun direct encore'));
    const cfg=root.mapConfig?.()||{};push('radius','ok',t('Suchradius','Search radius','Raggio ricerca','Radio de búsqueda','Rayon de recherche'),radiusText(cfg.radius,lang()));
    const ratingAreas=root.PizzaRatingsUI?.service?.areas?.length||0;push('ratings',cfg.ratingsEnabled?(ratingAreas?'ok':'warn'):'ok',t('Offene Bewertungen','Open ratings','Valutazioni aperte','Valoraciones abiertas','Notes ouvertes'),cfg.ratingsEnabled?`${ratingAreas} ${t('lokale Bewertungsbereiche','cached rating areas','aree valutazioni locali','áreas de valoración','zones de notes')}`:t('optional deaktiviert','optional disabled','opzionale disattivato','opcional desactivado','option désactivée'));
    const s=getSettings(),model=s?.model;push('model',s?.cached?.[model]?'ok':'warn',t('Offline-KI','Offline AI','IA offline','IA sin conexión','IA hors ligne'),s?.cached?.[model]?t('gewähltes Modell lokal markiert','selected model marked local','modello selezionato locale','modelo seleccionado local','modèle sélectionné local'):t('Modell noch nicht vollständig vorbereitet','model not fully prepared yet','modello non ancora pronto','modelo aún no preparado','modèle pas encore prêt'));
    let errors=[];try{errors=JSON.parse(root.localStorage?.getItem(ERROR_KEY)||'[]');if(!Array.isArray(errors))errors=[];}catch{}push('recovery',errors.length?'warn':'ok',t('Recovery-Log','Recovery log','Log recovery','Registro de recuperación','Journal recovery'),errors.length?`${errors.length} ${t('lokale Laufzeitfehler gespeichert','local runtime errors stored','errori runtime locali','errores locales','erreurs locales')}`:t('keine gespeicherten Laufzeitfehler','no stored runtime errors','nessun errore salvato','sin errores guardados','aucune erreur enregistrée'));
    return rows;
  }
  function healthRows(rows){return rows.map(r=>`<div class="health-row ${r.status}"><span>${r.status==='ok'?'✓':r.status==='bad'?'×':'!'}</span><strong>${esc(r.label)}</strong><small>${esc(r.detail)}</small></div>`).join('');}
  function injectSettingsDashboard(){
    const body=doc.getElementById('sheet-body');if(!body||doc.getElementById('build41-settings'))return;
    const section=doc.createElement('section');section.id='build41-settings';section.className='build41-settings';section.innerHTML=`<hr><h2>${t('Stabilität & Diagnose','Stability & diagnostics','Stabilità e diagnostica','Estabilidad y diagnóstico','Stabilité et diagnostic')}</h2><p class="hint">PizzaScan ${VERSION} · Build ${BUILD}</p><div id="health-results" class="health-results"><p class="hint">${t('Health Check prüft App-Zustand, Speicher, Berechtigungen und die zuletzt beobachteten Datenquellen – ohne versteckte Netzabfragen.','Health Check inspects app state, storage, permissions and last observed data sources without hidden network requests.','Health Check controlla stato, memoria, permessi e ultime fonti senza richieste nascoste.','Health Check revisa estado, almacenamiento, permisos y fuentes observadas sin consultas ocultas.','Health Check vérifie état, stockage, permissions et dernières sources sans requête cachée.')}</p></div><div class="row"><button id="health-run" class="secondary" type="button">🩺 ${t('Alles testen','Run checks','Test completo','Probar todo','Tout tester')}</button><button id="repair-cache" class="secondary" type="button">↻ ${t('Caches reparieren','Repair caches','Ripara cache','Reparar cachés','Réparer caches')}</button></div><details class="privacy-dashboard"><summary>${t('Privacy Dashboard','Privacy dashboard','Dashboard privacy','Panel de privacidad','Tableau confidentialité')}</summary><div class="privacy-grid"><span>📷 <strong>${t('Fotos','Photos','Foto','Fotos','Photos')}</strong><small>${t('lokal; Analyse auf dem Gerät','local; on-device analysis','locali; analisi sul dispositivo','locales; análisis en dispositivo','locales; analyse appareil')}</small></span><span>📍 <strong>${t('Standort/Karte','Location/map','Posizione/mappa','Ubicación/mapa','Position/carte')}</strong><small>${t('Suchbereich an Kartenanbieter bei Live-Suche','search area sent to map providers during live search','area inviata ai provider durante ricerca','área enviada a proveedores en búsqueda','zone envoyée aux fournisseurs en recherche')}</small></span><span>★ <strong>${t('Bewertungen','Ratings','Valutazioni','Valoraciones','Notes')}</strong><small>${t('Mangrove nur wenn aktiviert; Google nur nach deinem Antippen','Mangrove only when enabled; Google only after your tap','Mangrove se attivo; Google solo su tocco','Mangrove si está activo; Google solo al tocar','Mangrove si activé; Google seulement après action')}</small></span><span>🧠 <strong>${t('Modelle','Models','Modelli','Modelos','Modèles')}</strong><small>${t('Download extern; Fotos bleiben lokal','external download; photos stay local','download esterno; foto locali','descarga externa; fotos locales','téléchargement externe; photos locales')}</small></span></div><button id="clear-runtime-log" class="text-button" type="button">${t('Recovery-Log löschen','Clear recovery log','Cancella log recovery','Borrar registro','Effacer journal recovery')}</button></details>`;
    body.appendChild(section);
    doc.getElementById('health-run').onclick=async()=>{const target=doc.getElementById('health-results');target.innerHTML=`<p class="hint">${t('Prüfung läuft …','Checking …','Controllo …','Comprobando …','Vérification …')}</p>`;try{target.innerHTML=healthRows(await healthCheck());}catch(e){logError('health-check',e);target.innerHTML=`<p class="hint">${esc(e.message||String(e))}</p>`;}};
    doc.getElementById('repair-cache').onclick=async()=>{if(!root.confirm(t('Nur temporäre Such-, Karten- und Bewertungs-Caches neu aufbauen? Favoriten, Fotos, eigene Bewertungen, Einstellungen und KI-Modelle bleiben erhalten.','Rebuild only temporary search, map and rating caches? Favorites, photos, own ratings, settings and AI models stay intact.','Ricostruire solo cache temporanee? Preferiti, foto, valutazioni, impostazioni e modelli restano.','¿Reconstruir solo cachés temporales? Favoritos, fotos, valoraciones, ajustes y modelos permanecen.','Reconstruire seulement les caches temporaires ? Favoris, photos, notes, réglages et modèles restent.')))return;const b=doc.getElementById('repair-cache');b.disabled=true;try{await repairTransientState();root.toast?.(t('Caches wurden neu aufgebaut.','Caches rebuilt.','Cache ricostruite.','Cachés reconstruidas.','Caches reconstruits.'));}catch(e){logError('repair',e);root.toast?.(e.message||String(e));}finally{b.disabled=false;}};
    doc.getElementById('clear-runtime-log').onclick=()=>{try{root.localStorage?.removeItem(ERROR_KEY);}catch{}root.toast?.(t('Recovery-Log gelöscht.','Recovery log cleared.','Log cancellato.','Registro borrado.','Journal effacé.'));};
  }
  if(typeof root.showSettings==='function'&&!root.showSettings.__build41){
    const old=root.showSettings;
    const wrapped=function(){const out=old.apply(this,arguments);injectSettingsDashboard();return out;};wrapped.__build41=true;wrapped.__inner=old;root.showSettings=wrapped;
  }

  function injectRadar(){if(doc.getElementById('radar-open'))return;const filters=doc.querySelector('.map-filters');if(!filters)return;const b=doc.createElement('button');b.id='radar-open';b.className='filter-chip';b.type='button';b.textContent='🍕 '+t('Radar','Radar','Radar','Radar','Radar');b.onclick=openRadar;filters.appendChild(b);}
  function syncVersion(){if(root.PizzaScan)root.PizzaScan.version=VERSION;const badge=doc.querySelector('.brand small');if(badge)badge.textContent=VERSION;}
  function attachMapEvents(){
    const m=getMap();if(m&&!m.__build41Events){m.__build41Events=true;m.on('moveend',()=>{try{if(root.mapConfig?.().autoSearch){clearTimeout(attachMapEvents.autoTimer);attachMapEvents.autoTimer=setTimeout(()=>markSearchCenter(currentCenter(),t('Automatische Suche','Automatic search','Ricerca automatica','Búsqueda automática','Recherche automatique')),1000);}}catch{}});}
  }
  doc.addEventListener('input',event=>{if(event.target?.id==='filter-radius'){const v=normalizeRadius(event.target.value),o=doc.getElementById('filter-radius-value');if(o)o.textContent=radiusText(v,lang());event.target.setAttribute('aria-valuetext',radiusText(v,lang()));if(searchCenter)drawSearchLayers(v);}});
  doc.addEventListener('click',event=>{
    const b=event.target.closest?.('button,[data-action]');if(!b)return;
    if(b.id==='map-refresh'||b.id==='full-map-refresh'||b.dataset.action==='retry-map')markSearchCenter(currentCenter(),t('Kartenmitte','Map center','Centro mappa','Centro del mapa','Centre carte'));
    if(b.id==='search-collapse')clearSearchCenter();
    if(b.id==='search-toggle')setTimeout(()=>{if(b.getAttribute('aria-expanded')==='false')clearSearchCenter();},0);
    if(b.id==='gps'||b.id==='fs-gps')clearSearchCenter();
    if(b.id==='settings-save'||b.id==='filters-save')setTimeout(()=>{if(searchCenter)drawSearchLayers();},0);
  });
  root.addEventListener('offline',()=>{try{root.toast?.(t('Offline: PizzaScan nutzt gespeicherte Orte.','Offline: PizzaScan is using saved places.','Offline: PizzaScan usa luoghi salvati.','Sin conexión: PizzaScan usa lugares guardados.','Hors ligne : PizzaScan utilise les lieux enregistrés.'));}catch{}});
  root.addEventListener('online',()=>{try{root.toast?.(t('Wieder online. Live-Aktualisierung ist wieder verfügbar.','Back online. Live refresh is available again.','Di nuovo online. Aggiornamento live disponibile.','De nuevo en línea. Actualización disponible.','De nouveau en ligne. Actualisation disponible.'));}catch{}});

  function finishInstall(){injectRadar();syncVersion();attachMapEvents();const body=doc.getElementById('sheet-body');if(body&&!body.__build41Observer){body.__build41Observer=true;new MutationObserver(()=>{refreshFusionPanels();if(doc.getElementById('dark-mode'))injectSettingsDashboard();}).observe(body,{childList:true,subtree:true});}}
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',finishInstall,{once:true});else finishInstall();
  setTimeout(finishInstall,0);

  root.PizzaBuild41Runtime={version:VERSION,build:BUILD,markSearchCenter,clearSearchCenter,healthCheck,repairTransientState,radarCandidates,openRadar,get searchCenter(){return searchCenter;}};
  return true;
}

return {VERSION,BUILD,MAX_RADIUS,RADIUS_STEP,normalizeRadius,radiusText,dataConfidence,localPercentile,fusion,radarScore,install};
});
