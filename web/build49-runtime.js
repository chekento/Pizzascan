/* PizzaScan Build 49: source-original WebSim search parity + ultra-compact map controls. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaBuild49=api;api.install(root);}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const VERSION='2.3.14';
const BUILD=49;
const MIGRATION='pizzascan-build49-websim-exact-v1';
const QUERY_MARKER='pizzascan-build49-websim-source-exact';
const ENDPOINT='https://overpass-api.de/api/interpreter';
const NOMINATIM='https://nominatim.openstreetmap.org/search';

function validBounds(b){
  return !!b&&['south','west','north','east'].every(k=>Number.isFinite(Number(b[k])));
}
function bbox(bounds){
  if(!validBounds(bounds))throw Error('Ungültiger Kartenausschnitt');
  return [bounds.south,bounds.west,bounds.north,bounds.east].map(Number).join(',');
}

/* Selector families copied from source-original/script.js.
 * Only the output form uses center data so Android can render ways/relations. */
function websimQuery(bounds){
  const b=bbox(bounds),q=[];
  q.push('[out:json][timeout:60];(');
  q.push('/* '+QUERY_MARKER+' */');
  q.push('node["cuisine"="pizza"]('+b+');way["cuisine"="pizza"]('+b+');relation["cuisine"="pizza"]('+b+');');
  q.push('node["amenity"="restaurant"]["cuisine"="italian"]('+b+');way["amenity"="restaurant"]["cuisine"="italian"]('+b+');relation["amenity"="restaurant"]["cuisine"="italian"]('+b+');');
  q.push('node["amenity"="restaurant"]["cuisine"~"pizza|pizzeria"]('+b+');way["amenity"="restaurant"]["cuisine"~"pizza|pizzeria"]('+b+');relation["amenity"="restaurant"]["cuisine"~"pizza|pizzeria"]('+b+');');
  q.push('node["vending"="pizza"]('+b+');node["vending:pizza"="yes"]('+b+');');
  q.push('node["amenity"="cafe"]["cuisine"~"pizza|italian"]('+b+');way["amenity"="cafe"]["cuisine"~"pizza|italian"]('+b+');relation["amenity"="cafe"]["cuisine"~"pizza|italian"]('+b+');');
  q.push('node["amenity"="fast_food"]["cuisine"~"pizza|italian"]('+b+');way["amenity"="fast_food"]["cuisine"~"pizza|italian"]('+b+');relation["amenity"="fast_food"]["cuisine"~"pizza|italian"]('+b+');');
  q.push('node["amenity"="food_truck"]["cuisine"~"pizza|italian"]('+b+');way["amenity"="food_truck"]["cuisine"~"pizza|italian"]('+b+');relation["amenity"="food_truck"]["cuisine"~"pizza|italian"]('+b+');');
  q.push('node["speciality"~"pizza",i]('+b+');way["speciality"~"pizza",i]('+b+');relation["speciality"~"pizza",i]('+b+');');
  q.push('node["amenity"~"bar|pub"]["cuisine"~"pizza|italian"]('+b+');way["amenity"~"bar|pub"]["cuisine"~"pizza|italian"]('+b+');relation["amenity"~"bar|pub"]["cuisine"~"pizza|italian"]('+b+');');
  q.push('node["name"~"pizza|pizzeria|pizze",i]('+b+');way["name"~"pizza|pizzeria|pizze",i]('+b+');relation["name"~"pizza|pizzeria|pizze",i]('+b+');');
  q.push('node["description"~"pizza",i]('+b+');way["description"~"pizza",i]('+b+');relation["description"~"pizza",i]('+b+');');
  q.push('node["amenity"="takeaway"]["cuisine"~"pizza|italian"]('+b+');way["amenity"="takeaway"]["cuisine"~"pizza|italian"]('+b+');relation["amenity"="takeaway"]["cuisine"~"pizza|italian"]('+b+');');
  q.push(');out body center qt;');
  return q.join('\n');
}

function migrationConfig(previous={}){
  return {...previous,radius:0,autoSearch:true,includeItalian:true,includeUnconfirmed:true};
}
function migrate(root){
  try{
    if(!root.localStorage||root.localStorage.getItem(MIGRATION)||typeof settings==='undefined'||!settings)return false;
    settings.filters=migrationConfig(settings.filters||{});
    try{saveSettings();}catch{}
    ['pizzascan-map-cache-v3','pizzascan-map-cache-v2','pizzascan-build48-nearby-finalized-v1'].forEach(k=>root.localStorage.removeItem(k));
    try{if(typeof mapAreas!=='undefined')mapAreas=[];if(typeof mapPool!=='undefined'&&Array.isArray(mapPool))mapPool=[];}catch{}
    root.localStorage.setItem(MIGRATION,'1');
    return true;
  }catch(error){console.warn('Build49 WebSim migration skipped',error);return false;}
}

function tagHits(elements,root){
  const B47=root.PizzaBuild47,hit=B47?.HIT||'pizzascan:build47-query';
  return (Array.isArray(elements)?elements:[]).map(e=>({...e,tags:{...(e.tags||{}),[hit]:'yes','pizzascan:source':'websim-source-exact'}}));
}

function installOverpass(root){
  const PD=root.PizzaPlaces;
  let service=null;
  try{service=typeof placeService!=='undefined'?placeService:root.placeService;}catch{}
  if(!PD||!service||typeof service.json!=='function'||service.overpass?.__build49)return false;
  const previous=service.overpass?.bind(service);
  service.overpass=async function(query,options={}){
    if(!String(query||'').includes(QUERY_MARKER)){
      if(previous)return previous(query,options);
      throw Error('Kartenabfrage nicht verfügbar');
    }
    if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    options.onStatus?.('WebSim-Suche · Pizza-Orte werden geladen …');
    try{
      const data=await this.json(ENDPOINT,{method:'POST',body:new URLSearchParams({data:query})},options.signal,65000);
      if(!Array.isArray(data?.elements)||data.remark)throw Error(data?.remark||'Unvollständige Kartendaten');
      const elements=tagHits(data.elements,root);
      this.lastErrors=[];
      options.onStatus?.(elements.length?String(elements.length)+' WebSim-Treffer · OpenStreetMap':'Keine Pizza-Orte im sichtbaren Kartenausschnitt');
      return {data:{elements},source:'overpass-api.de · WebSim',sources:['overpass-api.de'],complete:true,progressive:false,websimExact:true};
    }catch(error){
      if(options.signal?.aborted||error?.name==='AbortError')throw error;
      this.lastErrors=[{source:'overpass-api.de',message:error?.message||String(error)}];
      throw error;
    }
  };
  service.overpass.__build49=true;
  service.overpass.__inner=previous;
  return true;
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
      input?.addEventListener('input',()=>{try{clearTimeout(searchTimer);}catch{};searchTimer=setTimeout(localSuggestions,120);},true);
    }
  }catch(error){console.warn('Build49 Nominatim parity install skipped',error);return false;}
  root.__pizzaBuild49Search=true;return true;
}

function installStyles(root){
  const d=root.document;if(!d||d.getElementById('build49-ui'))return;
  const style=d.createElement('style');style.id='build49-ui';
  style.textContent=[
    '#map-view .map-control-panel{margin:4px 0 3px!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}',
    '#map-view .map-control-panel .map-filters{display:flex!important;flex-flow:row nowrap!important;align-items:center!important;gap:5px!important;width:100%!important;overflow-x:auto!important;overscroll-behavior-x:contain!important;scrollbar-width:none!important;padding:0 0 1px!important;margin:0!important}',
    '#map-view .map-control-panel .map-filters::-webkit-scrollbar{display:none!important}',
    '#map-view .map-control-panel .map-filters .filter-chip,#map-view .map-control-panel .map-filters .build44-action{flex:1 1 0!important;min-width:max-content!important;width:auto!important;height:31px!important;min-height:31px!important;padding:0 8px!important;margin:0!important;border:1px solid var(--line)!important;border-radius:999px!important;background:var(--surface)!important;color:var(--ink)!important;box-shadow:none!important;font-size:10.5px!important;font-weight:780!important;line-height:1!important;white-space:nowrap!important;text-align:center!important}',
    '#map-view .map-control-panel .map-filters .filter-chip.active,#map-view .map-control-panel .map-filters .filter-chip[aria-pressed="true"]{border-color:var(--green)!important;background:#e1f1e4!important;color:#246939!important}',
    '#map-view .map-control-meta{display:none!important}#map-view .build44-cache-note{display:none!important}',
    '#map-view .map-caption{display:grid!important;grid-template-columns:minmax(0,1fr) auto auto!important;align-items:center!important;gap:5px!important;min-height:30px!important;margin:3px 0 5px!important;padding:3px 4px 3px 8px!important;border:1px solid var(--line)!important;border-radius:10px!important;background:var(--surface)!important;box-shadow:none!important}',
    '#map-view .map-caption::before{display:none!important}',
    '#map-view .map-caption #map-status{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;color:var(--muted)!important;font-size:9.8px!important;line-height:1.15!important}',
    '#map-view .map-caption #result-count{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:21px!important;padding:0 6px!important;margin:0!important;border-radius:999px!important;background:var(--bg)!important;color:var(--muted)!important;font-size:9px!important;font-weight:800!important;white-space:nowrap!important}',
    '#map-view .map-caption #map-refresh{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:58px!important;width:auto!important;height:23px!important;min-height:23px!important;padding:0 7px!important;margin:0!important;border:0!important;border-radius:8px!important;background:var(--ink)!important;color:var(--bg)!important;box-shadow:none!important;font-size:9.5px!important;font-weight:800!important;white-space:nowrap!important}',
    '#map-view #map-frame{margin-top:0!important}',
    '@media(max-width:350px){#map-view .map-control-panel .map-filters .filter-chip,#map-view .map-control-panel .map-filters .build44-action{padding:0 6px!important;font-size:9.8px!important}#map-view .map-caption #map-refresh{min-width:50px!important;padding:0 5px!important}}',
    '.dark #map-view .map-control-panel .map-filters .filter-chip.active,.dark #map-view .map-control-panel .map-filters .filter-chip[aria-pressed="true"]{background:#274a31!important;color:#d3f7d9!important}'
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
  const ps=[...d.querySelectorAll('.map-legend p')];if(ps[1])ps[1].innerHTML='<strong>Build 49:</strong> WebSim-Originalsuche: sichtbarer Kartenausschnitt, identische Pizza-/Italien-OSM-Suchfamilien, Suche nach Kartenbewegung und Nominatim für Ort/Adresse.';
}

function syncVersion(root){
  try{
    const app=root.PizzaScan;if(app){const get=()=>VERSION;get.__build49=true;Object.defineProperty(app,'version',{configurable:true,enumerable:true,get,set(){}});}
  }catch{}
  try{
    const badge=root.document?.querySelector('.brand small');
    if(badge){if(badge.textContent!==VERSION)badge.textContent=VERSION;if(!badge.__build49Observer){badge.__build49Observer=true;new MutationObserver(()=>{if(badge.textContent!==VERSION)badge.textContent=VERSION;}).observe(badge,{childList:true,characterData:true,subtree:true});}}
  }catch{}
  try{const R=root.PizzaReleaseInfo;if(R?.RELEASE)Object.assign(R.RELEASE,{version:VERSION,build:BUILD,apk:'https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.14.apk'});R?.syncVersion?.();R?.decorate?.();}catch{}
}

function install(root){
  if(!root.document||!root.PizzaPlaces)return false;
  const PD=root.PizzaPlaces;
  PD.query=(center,radius,bounds)=>websimQuery(bounds);
  root.PizzaScanDiscovery49={version:VERSION,build:BUILD,mode:'source-original-websim-exact',viewportBBox:true,exactSelectorFamilies:12,nominatimSearch:true,photonDiscovery:false,slimToolbar:true};
  let attempts=0,refresh=false;
  const ready=()=>{
    attempts++;if(migrate(root))refresh=true;
    syncVersion(root);compactUi(root);installOverpass(root);installSearch(root);
    let mapReady=false;try{mapReady=typeof map!=='undefined'&&!!map&&typeof loadPlaces==='function';}catch{}
    if(refresh&&mapReady){refresh=false;root.setTimeout(()=>{try{loadPlaces({force:true});}catch{}},80);}
    if((typeof settings==='undefined'||!mapReady)&&attempts<120)root.setTimeout(ready,50);
  };
  ready();
  [0,120,300,700,1500,3000,6000].forEach(ms=>root.setTimeout(()=>{syncVersion(root);compactUi(root);installOverpass(root);installSearch(root);},ms));
  return true;
}

return {VERSION,BUILD,MIGRATION,QUERY_MARKER,ENDPOINT,NOMINATIM,validBounds,bbox,websimQuery,migrationConfig,migrate,tagHits,installOverpass,installSearch,compactUi,syncVersion,install};
});
