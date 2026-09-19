/* PizzaScan Build 52: WebSim-complete discovery, stable map geometry and Android transport failover. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaBuild49=api;api.install(root);}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const VERSION='2.3.17';
const BUILD=52;
const MIGRATION='pizzascan-build52-search-migration-v1';
const QUERY_MARKER='pizzascan-build52-websim-coverage-complete';
const ENDPOINT='https://overpass-api.de/api/interpreter';
const ENDPOINTS=[ENDPOINT,'https://overpass.private.coffee/api/interpreter','https://overpass.osm.jp/api/interpreter','https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
const NOMINATIM='https://nominatim.openstreetmap.org/search';

function validBounds(b){
  return !!b&&['south','west','north','east'].every(k=>Number.isFinite(Number(b[k])));
}
function bbox(bounds){
  if(!validBounds(bounds))throw Error('Ungültiger Kartenausschnitt');
  return [bounds.south,bounds.west,bounds.north,bounds.east].map(Number).join(',');
}

/* Selector families and output clause are copied from source-original/script.js.
 * Build 49 deliberately keeps the returned element semantics literal too. */
function websimQuery(bounds){
  const b=bbox(bounds),q=[];
  const food='restaurant|fast_food|cafe|food_truck|bar|pub|biergarten|takeaway|food_court';
  const pizza='pizza|pizzeria|pizzaria|pizze';
  const italian='italian|italiano|italiana|italien|italienne|italienisch|pasta|mediterranean';
  const italianWords='trattoria|ristorante|osteria|tavola|taverna|enoteca|italian|italiano|italiana|italien';
  const nameWords=pizza+'|'+italianWords;
  q.push('[out:json][timeout:60];(');
  q.push('/* '+QUERY_MARKER+' */');
  q.push('nwr["amenity"~"'+food+'"]["name"]('+b+');');
  q.push('nwr["amenity"="food_truck"]["mobile"="yes"]('+b+');');
  q.push('nwr["cuisine"~"'+pizza+'|'+italian+'",i]('+b+');');
  q.push('nwr["cuisine:it"~"'+pizza+'|'+italian+'",i]('+b+');');
  q.push('nwr["restaurant:type"~"'+pizza+'|'+italianWords+'",i]('+b+');');
  q.push('nwr["amenity"="restaurant"]["cuisine"~"'+pizza+'|'+italian+'",i]('+b+');');
  q.push('nwr["amenity"~"'+food+'"]["cuisine"~"'+pizza+'|'+italian+'",i]('+b+');');
  q.push('nwr["amenity"~"'+food+'"]["name"~"'+nameWords+'",i]('+b+');');
  q.push('nwr["amenity"~"'+food+'"]["brand"~"'+nameWords+'",i]('+b+');');
  q.push('nwr["amenity"~"'+food+'"]["official_name"~"'+nameWords+'",i]('+b+');');
  q.push('nwr["amenity"~"'+food+'"]["alt_name"~"'+nameWords+'",i]('+b+');');
  q.push('nwr["amenity"~"'+food+'"]["operator"~"'+nameWords+'",i]('+b+');');
  q.push('nwr["amenity"~"'+food+'"]["description"~"'+nameWords+'",i]('+b+');');
  q.push('nwr["amenity"~"'+food+'"]["speciality"~"'+pizza+'",i]('+b+');');
  q.push('nwr["shop"~"bakery|deli|convenience|food"]["name"~"'+nameWords+'",i]('+b+');');
  q.push('nwr["shop"~"bakery|deli|convenience|food"]["product"~"'+pizza+'",i]('+b+');');
  q.push('nwr["vending"~"pizza",i]('+b+');');
  q.push('nwr["vending:pizza"="yes"]('+b+');');
  q.push(');out body center;');
  return q.join('\\n');
}

function migrationConfig(previous={},types=[]){
  const existing=Array.isArray(previous.types)?previous.types:[];
  const available=Array.isArray(types)?types:[];
  const merged=[...new Set([...existing,...available])];
  return {...previous,radius:0,autoSearch:true,includeItalian:true,includeUnconfirmed:true,includeUnrated:true,types:merged};
}
function migrate(root){
  try{
    if(!root.localStorage||root.localStorage.getItem(MIGRATION)||typeof settings==='undefined'||!settings)return false;
    settings.filters=migrationConfig(settings.filters||{},Object.keys(root.PizzaPlaces?.TYPES||{}));
    try{saveSettings();}catch{}
    ['pizzascan-map-cache-v3','pizzascan-map-cache-v2','pizzascan-first-map-discovery-v1','pizzascan-first-map-discovery-v2'].forEach(k=>root.localStorage.removeItem(k));
    root.localStorage.setItem('pizzascan-build48-nearby-finalized-v1','1');
    try{if(typeof mapAreas!=='undefined')mapAreas=[];if(typeof mapPool!=='undefined'&&Array.isArray(mapPool))mapPool=[];}catch{}
    root.localStorage.setItem(MIGRATION,'1');
    return true;
  }catch(error){console.warn('Build49 WebSim migration skipped',error);return false;}
}

function tagHits(elements,root){
  const B47=root.PizzaBuild47,hit=B47?.HIT||'pizzascan:build47-query';
  return (Array.isArray(elements)?elements:[]).map(e=>({...e,tags:{...(e.tags||{}),[hit]:'yes','pizzascan:source':'websim-source-exact'}}));
}

function lockQuery(root){
  const PD=root.PizzaPlaces;if(!PD)return false;
  const exact=function(center,radius,bounds){return websimQuery(bounds);};
  exact.__build49=true;
  try{
    const current=Object.getOwnPropertyDescriptor(PD,'query');
    if(current?.get?.__build49)return true;
    const get=function(){return exact;};get.__build49=true;
    Object.defineProperty(PD,'query',{configurable:true,enumerable:true,get,set(){}});
    return true;
  }catch(error){
    try{PD.query=exact;return PD.query===exact;}catch{return false;}
  }
}

function installMapPolicy(root){
  try{
    if(typeof mapConfig==='function'&&!mapConfig.__build49){
      const previous=mapConfig;
      const wrapped=function(){return {...previous(),radius:0,autoSearch:true};};
      wrapped.__build49=true;wrapped.__inner=previous;mapConfig=wrapped;
    }
  }catch(error){console.warn('Build49 map policy install skipped',error);return false;}
  return true;
}

function makeOverpass(root,previous){
  const wrapped=async function(query,options={}){
    if(!String(query||'').includes(QUERY_MARKER)){
      if(typeof previous==='function')return previous.call(this,query,options);
      throw Error('Kartenabfrage nicht verfügbar');
    }
    if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    options.onStatus?.('PizzaScan-Suche · Pizza, Trattoria & italienische Orte werden geladen …');
    /* Always retain mirror failover at the WebSim service layer too. On
     * Android the native transport may be unavailable on older WebViews; in
     * that case a single primary endpoint must never collapse the map to 0 POIs. */
    const endpoints=ENDPOINTS;
    const errors=[];
    for(const endpoint of endpoints){
      if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
      try{
        const data=await this.json(endpoint,{method:'POST',body:new URLSearchParams({data:query})},options.signal,65000);
        if(!Array.isArray(data?.elements)||data.remark)throw Error(data?.remark||'Unvollständige Kartendaten');
        const elements=tagHits(data.elements,root);
        this.lastErrors=errors;
        options.onStatus?.(elements.length?String(elements.length)+' relevante Treffer · OpenStreetMap':'Keine relevanten Orte im sichtbaren Kartenausschnitt');
        return {data:{elements},source:new URL(endpoint).hostname+' · WebSim',sources:[new URL(endpoint).hostname],complete:true,progressive:false,websimExact:true};
      }catch(error){
        if(options.signal?.aborted||error?.name==='AbortError')throw error;
        errors.push({source:new URL(endpoint).hostname,message:error?.message||String(error)});
      }
    }
    this.lastErrors=errors;
    const detail=errors.map(e=>e.source+': '+e.message).join(' · ');
    throw Error('Kartendaten konnten nicht geladen werden'+(detail?': '+detail:''));
  };
  wrapped.__build49=true;
  wrapped.__build51=true;wrapped.__build52=true;
  wrapped.__inner=previous;
  return wrapped;
}

function installOverpass(root){
  const PD=root.PizzaPlaces;
  if(!PD)return false;
  let installed=false;
  const proto=PD.Service?.prototype;
  if(proto&&typeof proto.overpass==='function'&&!proto.overpass.__build49){
    proto.overpass=makeOverpass(root,proto.overpass);
    installed=true;
  }
  let service=null;
  try{service=typeof placeService!=='undefined'?placeService:root.placeService;}catch{}
  if(service&&typeof service.json==='function'&&typeof service.overpass==='function'&&!service.overpass.__build49){
    service.overpass=makeOverpass(root,service.overpass);
    installed=true;
  }
  return installed||!!proto?.overpass?.__build49||!!service?.overpass?.__build49;
}

function installSearch(root){
  const d=root.document;
  if(!d||root.__pizzaBuild49Search)return false;
  try{
    localSuggestions=function(){
      const input=d.getElementById('search'),q=String(input?.value||'').trim().toLowerCase();
      if(q.length<3){showSearchResults([]);return;}
      let loaded=[];try{loaded=Array.isArray(places)?places:[];}catch{}
      const items=loaded.filter(p=>String(p?.name||'').toLowerCase().includes(q)).slice(0,5);
      showSearchResults(items.map(p=>({...p,kind:'venue',place:p})),true);
    };
    selectSearch=function(index){
      const result=searchResults[index];
      if(!result)return;
      showSearchResults([]);
      const input=d.getElementById('search'),status=d.getElementById('search-status');
      if(status)status.textContent='';
      if(input){input.value=result.name||'';input.blur();}
      document.body.classList.remove('fs-search-open');
      d.getElementById('fs-search')?.setAttribute('aria-expanded','false');
      d.getElementById('search-panel')?.classList.add('search-panel-collapsed');
      d.getElementById('search-toggle')?.setAttribute('aria-expanded','false');
      try{mapRequest?.abort();}catch{}
      if(Number.isFinite(Number(result.lat))&&Number.isFinite(Number(result.lng)))map.setView([Number(result.lat),Number(result.lng)],15);
    };
    searchCity=async function(event){
      event?.preventDefault?.();
      try{clearTimeout(searchTimer);}catch{}
      const input=d.getElementById('search'),button=d.getElementById('search-submit'),status=d.getElementById('search-status');
      const q=String(input?.value||'').trim();if(!q)return;
      try{searchAbort?.abort();}catch{}
      const ctl=new AbortController();try{searchAbort=ctl;}catch{}
      if(button)button.disabled=true;if(status)status.textContent='Suche „'+q+'“ …';
      try{
        const url=new URL(NOMINATIM);url.search=new URLSearchParams({format:'json',q,limit:'5'}).toString();
        const response=await fetch(url.href,{signal:ctl.signal,headers:{Accept:'application/json'}});
        if(!response.ok)throw Error('Nominatim antwortet mit HTTP '+response.status);
        const results=await response.json();
        if(!Array.isArray(results)||!results.length){if(status)status.textContent='Keine Ergebnisse für „'+q+'“.';showSearchResults([]);return;}
        const mapped=results.slice(0,5).map(x=>({name:x.display_name||x.name||q,address:x.display_name||'',lat:Number(x.lat),lng:Number(x.lon),kind:'location',place:null})).filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lng));
        if(!mapped.length)throw Error('Ort ohne gültige Koordinaten');
        const best=mapped[0];
        input.value=best.name;showSearchResults([]);if(status)status.textContent='';
        try{mapRequest?.abort();}catch{}
        map.setView([best.lat,best.lng],15);
        loadPlaces({force:true});
      }catch(error){if(!ctl.signal.aborted&&status)status.textContent='Suche fehlgeschlagen. Bitte erneut versuchen.';}
      finally{if(button)button.disabled=false;}
    };
    const form=d.getElementById('search-form');
    if(form&&!form.__build49){
      form.__build49=true;
      form.addEventListener('submit',e=>{e.stopImmediatePropagation();searchCity(e);},true);
      const input=d.getElementById('search');
      input?.addEventListener('input',e=>{e.stopImmediatePropagation();try{clearTimeout(searchTimer);}catch{};searchTimer=setTimeout(localSuggestions,120);},true);
    }
  }catch(error){console.warn('Build49 Nominatim parity install skipped',error);return false;}
  root.__pizzaBuild49Search=true;return true;
}

function installStyles(root){
  const d=root.document;if(!d||d.getElementById('build49-ui'))return;
  const style=d.createElement('style');style.id='build49-ui';
  style.textContent=[
    '#map-view .map-control-panel{margin:10px 0 8px!important;padding:5px!important;border:1px solid var(--line)!important;border-radius:18px!important;background:rgba(255,255,255,.72)!important;box-shadow:0 8px 24px rgba(23,32,31,.08)!important}',
    '#map-view .map-control-panel .map-filters{display:flex!important;flex-flow:row nowrap!important;align-items:center!important;gap:7px!important;width:100%!important;overflow-x:auto!important;overscroll-behavior-x:contain!important;scrollbar-width:none!important;padding:0!important;margin:0!important}',
    '#map-view .map-control-panel .map-filters::-webkit-scrollbar{display:none!important}',
    '#map-view .map-control-panel .map-filters .filter-chip,#map-view .map-control-panel .map-filters .build44-action{flex:1 1 0!important;min-width:max-content!important;width:auto!important;height:36px!important;min-height:36px!important;padding:0 12px!important;margin:0!important;border:1px solid var(--line)!important;border-radius:12px!important;background:rgba(255,255,255,.82)!important;color:var(--ink)!important;box-shadow:0 2px 8px rgba(23,32,31,.05)!important;font-size:11px!important;font-weight:780!important;line-height:1!important;white-space:nowrap!important;text-align:center!important;transition:transform .16s ease,background .16s ease,border-color .16s ease!important}',
    '#map-view .map-control-panel .map-filters .filter-chip:active{transform:scale(.98)!important}',
    '#map-view .map-control-panel .map-filters .filter-chip.active,#map-view .map-control-panel .map-filters .filter-chip[aria-pressed="true"]{border-color:var(--green)!important;background:#e1f1e4!important;color:#246939!important}',
    '#map-view .map-control-meta{display:none!important}#map-view .build44-cache-note{display:none!important}',
    '#map-view .map-caption{display:grid!important;grid-template-columns:minmax(0,1fr) auto auto!important;align-items:center!important;gap:8px!important;min-height:42px!important;margin:0 0 10px!important;padding:7px 8px 7px 13px!important;border:1px solid var(--line)!important;border-radius:16px!important;background:rgba(255,255,255,.72)!important;box-shadow:0 6px 22px rgba(23,32,31,.06)!important}',
    '#map-view .map-caption::before{display:none!important}',
    '#map-view .map-caption #map-status{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;color:var(--muted)!important;font-size:10px!important;line-height:1.2!important}',
    '#map-view .map-caption #result-count{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:25px!important;padding:0 8px!important;margin:0!important;border-radius:9px!important;background:var(--bg)!important;color:var(--muted)!important;font-size:10px!important;font-weight:800!important;white-space:nowrap!important}',
    '#map-view .map-caption #map-refresh{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:88px!important;width:auto!important;height:32px!important;min-height:32px!important;padding:0 11px!important;margin:0!important;border:0!important;border-radius:10px!important;background:var(--ink)!important;color:var(--bg)!important;box-shadow:0 4px 12px rgba(23,32,31,.16)!important;font-size:10px!important;font-weight:800!important;white-space:nowrap!important}',
    '#map-view #map-frame{margin-top:0!important}',
    '@media(max-width:500px){#map-view .map-control-panel .map-filters .filter-chip,#map-view .map-control-panel .map-filters .build44-action{padding:0 10px!important;font-size:10px!important}}',
    '@media(max-width:350px){#map-view .map-control-panel .map-filters .filter-chip,#map-view .map-control-panel .map-filters .build44-action{padding:0 8px!important;font-size:9.5px!important}#map-view .map-caption #map-refresh{min-width:76px!important;padding:0 8px!important}}',
    '.dark #map-view .map-control-panel{background:rgba(28,37,36,.78)!important}.dark #map-view .map-control-panel .map-filters .filter-chip,.dark #map-view .map-caption{background:rgba(28,37,36,.86)!important}.dark #map-view .map-control-panel .map-filters .filter-chip.active,.dark #map-view .map-control-panel .map-filters .filter-chip[aria-pressed="true"]{background:#274a31!important;color:#d3f7d9!important}'
  ].join('');
  d.head.appendChild(style);
}

function compactUi(root){
  const d=root.document;if(!d)return;installStyles(root);
  const caption=d.querySelector('.map-caption'),count=d.getElementById('result-count'),meta=d.querySelector('.map-control-meta'),refresh=d.getElementById('map-refresh');
  const open=d.getElementById('open-filter');if(open){open.textContent='◷ Offen';open.setAttribute('aria-label','Nur jetzt geöffnete Pizza-Orte');}
  const rating=d.getElementById('rating-filter-open');if(rating){rating.textContent='★ Rating';rating.setAttribute('aria-label','Bewertungsfilter');}
  const filter=d.getElementById('filter-open');if(filter)filter.textContent='☷ Filter';
  const radar=d.getElementById('radar-open');if(radar)radar.textContent='🍕 Radar';
  if(refresh){refresh.textContent='↻ Suchen';refresh.classList.remove('filter-chip','build44-action');refresh.classList.add('map-status-action');delete refresh.dataset.build44Moved;if(caption&&refresh.parentElement!==caption)caption.appendChild(refresh);}
  if(count&&caption&&count.parentElement!==caption)caption.insertBefore(count,refresh||null);
  if(meta)meta.hidden=true;
  const radii=[...d.querySelectorAll('#filter-radius')];
  const radius=radii.find(el=>el.matches?.('input[type="range"]'))||radii[0]||null;
  if(radius){
    const keepField=radius.closest?.('.field');
    for(const extra of radii){
      if(extra===radius)continue;
      const field=extra.closest?.('.field');
      if(field&&field!==keepField)field.remove();else extra.remove();
    }
    radius.value='0';radius.disabled=true;
    if(keepField&&!keepField.querySelector('.build49-radius-note')){
      const note=d.createElement('p');note.className='hint build49-radius-note';note.textContent='WebSim-Modus: gesucht wird immer im aktuell sichtbaren Kartenausschnitt.';keepField.appendChild(note);
    }
  }
  const auto=d.getElementById('filter-auto');
  if(auto){
    auto.checked=true;auto.disabled=true;
    const label=auto.closest?.('label');if(label)label.title='WebSim-Modus: Nach Kartenbewegungen wird automatisch neu gesucht.';
  }
  const ps=[...d.querySelectorAll('.map-legend p')];if(ps[1])ps[1].innerHTML='<strong>Build 52:</strong> WebSim-komplette Kartenausschnittsuche für Pizza, Trattoria, Ristorante, Osteria, italienische Küche und verwandte Gastro-Treffer; Wege und Relationen werden mit Mittelpunkt übernommen.';
}

function installSheetHook(root){
  try{
    if(typeof openSheet!=='function'||openSheet.__build49)return false;
    const previous=openSheet;
    const wrapped=function(){
      const out=previous.apply(this,arguments);
      compactUi(root);
      return out;
    };
    wrapped.__build49=true;wrapped.__inner=previous;openSheet=wrapped;
    return true;
  }catch{return false;}
}

function syncVersion(root){
  try{
    const app=root.PizzaScan;if(app){const get=()=>VERSION;get.__build49=true;Object.defineProperty(app,'version',{configurable:true,enumerable:true,get,set(){}});}
  }catch{}
  try{
    const badge=root.document?.querySelector('.brand small');
    if(badge){if(badge.textContent!==VERSION)badge.textContent=VERSION;if(!badge.__build49Observer){badge.__build49Observer=true;new MutationObserver(()=>{if(badge.textContent!==VERSION)badge.textContent=VERSION;}).observe(badge,{childList:true,characterData:true,subtree:true});}}
  }catch{}
  try{const R=root.PizzaReleaseInfo;if(R?.RELEASE)Object.assign(R.RELEASE,{version:VERSION,build:BUILD,apk:'https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.17.apk'});R?.syncVersion?.();R?.decorate?.();}catch{}
}

function install(root){
  if(!root.document||!root.PizzaPlaces)return false;
  lockQuery(root);
  root.PizzaScanDiscovery49={version:VERSION,build:BUILD,mode:'source-original-websim-coverage-complete',viewportBBox:true,exactSelectorFamilies:20,trattoriaSearch:true,stableElementCenters:true,nominatimSearch:true,photonDiscovery:false,localSuggestionZoom:15,slimToolbar:false,providers:ENDPOINTS.slice()};root.PizzaScanDiscovery50=root.PizzaScanDiscovery49;root.PizzaScanDiscovery51=root.PizzaScanDiscovery49;root.PizzaScanDiscovery52=root.PizzaScanDiscovery49;
  let attempts=0,refresh=false;
  const ready=()=>{
    attempts++;if(migrate(root))refresh=true;
    syncVersion(root);lockQuery(root);installMapPolicy(root);installSheetHook(root);compactUi(root);installOverpass(root);installSearch(root);
    let mapReady=false;try{mapReady=typeof map!=='undefined'&&!!map&&typeof loadPlaces==='function';}catch{}
    if(refresh&&mapReady){refresh=false;root.setTimeout(()=>{try{loadPlaces({force:true});}catch{}},80);}
    if((typeof settings==='undefined'||!mapReady)&&attempts<120)root.setTimeout(ready,50);
  };
  ready();
  [0,60,120,300,700,1500,3000,6000].forEach(ms=>root.setTimeout(()=>{syncVersion(root);lockQuery(root);installMapPolicy(root);installSheetHook(root);compactUi(root);installOverpass(root);installSearch(root);},ms));
  return true;
}

return {VERSION,BUILD,MIGRATION,QUERY_MARKER,ENDPOINT,NOMINATIM,validBounds,bbox,websimQuery,migrationConfig,migrate,tagHits,lockQuery,installMapPolicy,makeOverpass,installOverpass,installSearch,compactUi,installSheetHook,syncVersion,install};
});
