/* PizzaScan Build 44: WebSim-parity search speed, coverage and compact map controls. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaBuild44=api;api.install(root);}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='2.3.9',BUILD=44;
const PROVIDERS=[
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.osm.jp/api/interpreter'
];
const PROVIDER_TIMEOUT=10000;
const PIZZA_RE=/(pizza|pizzeria|pizzaria|pizzerie|pizze|pizza[ _-]?(?:bar|restaurant)|ピザ|披萨|披薩|比萨|比薩|بيتزا|пицц|πίτσα|פיצה|피자|พิซซ่า)/iu;
const ITALIAN_CUISINE_RE=/(^|[;,/|\s])(italian|italiano|italiana|italienne|italienisch|pasta)(?=$|[;,/|\s])/iu;
const ITALIAN_NAME_RE=/(ristorante|trattoria|osteria|cucina\s+italiana|italiano|italiana|bella\s+italia|forno\s+italiano|italian\s+restaurant)/iu;
const EVIDENCE_KEYS=/^(?:name(?::.*)?|brand|operator|cuisine|speciality|product|products|description(?::.*)?|note(?::.*)?|menu(?::.*)?|website:menu|contact:menu|vending)$/i;

function validCenter(c){return c&&Number.isFinite(Number(c.lat))&&Number.isFinite(Number(c.lng));}
function validBounds(b){return b&&['south','west','north','east'].every(k=>Number.isFinite(Number(b[k])));}
function area(center,radius,bounds){
  const r=Number(radius)||0;
  if(r>0){if(!validCenter(center))throw Error('Ungültiger Suchmittelpunkt');return `around:${Math.round(Math.max(.5,Math.min(10,r))*1000)},${Number(center.lat)},${Number(center.lng)}`;}
  if(validBounds(bounds))return `${Number(bounds.south)},${Number(bounds.west)},${Number(bounds.north)},${Number(bounds.east)}`;
  if(validCenter(center))return `around:5000,${Number(center.lat)},${Number(center.lng)}`;
  throw Error('Ungültiger Suchbereich');
}
/* Superset of the original source-original/script.js Overpass query.
   Every original Pizza/Italian family is retained; only additional structured
   pizza/Italian evidence is added. Generic restaurants are never requested. */
function websimQuery(center,radius,bounds){
  const a=area(center,radius,bounds);
  const pizza='pizza|pizzeria|pizzaria|pizze|ピザ|披萨|披薩|比萨|比薩|بيتزا|пицц|πίτσα|פיצה|피자|พิซซ่า';
  const italian='italian|italiano|italiana|italienne|italienisch|pasta';
  return `[out:json][timeout:18];(/* pizzascan-build44-websim-parity */
nwr["cuisine"~"${pizza}|${italian}",i](${a});
nwr["amenity"="restaurant"]["cuisine"~"pizza|pizzeria|italian|italiano|italiana|pasta",i](${a});
nwr["amenity"~"cafe|fast_food|food_truck|takeaway|food_court|bar|pub|biergarten"]["cuisine"~"pizza|pizzeria|italian|italiano|italiana|pasta",i](${a});
nwr["name"~"${pizza}|ristorante|trattoria|osteria|cucina italiana|bella italia|forno italiano|italian restaurant",i](${a});
nwr["brand"~"${pizza}|ristorante|trattoria|osteria|italian",i](${a});
nwr["operator"~"${pizza}|ristorante|trattoria|osteria|italian",i](${a});
nwr["speciality"~"${pizza}",i](${a});
nwr["product"~"${pizza}",i](${a});nwr["products"~"${pizza}",i](${a});
nwr["menu"~"${pizza}",i](${a});
nwr["description"~"${pizza}|italian restaurant|italian cuisine|cucina italiana",i](${a});
nwr["note"~"${pizza}|italian restaurant|italian cuisine|cucina italiana",i](${a});
nwr["vending"~"pizza",i](${a});nwr["vending:pizza"="yes"](${a});
);out body center qt;`;
}
function tagText(tags={}){const out=[];for(const [k,v] of Object.entries(tags))if(v!=null&&EVIDENCE_KEYS.test(k))out.push(String(v));return out.join(' ');}
function pizzaEvidence(tags={}){return tags['vending:pizza']==='yes'||PIZZA_RE.test(String(tags.vending||''))||PIZZA_RE.test(tagText(tags));}
function italianEvidence(tags={}){return ITALIAN_CUISINE_RE.test(String(tags.cuisine||''))||ITALIAN_NAME_RE.test([tags.name,tags.brand,tags.operator,tags.description,tags.note].filter(Boolean).join(' '));}
function relevantTags(tags={}){return pizzaEvidence(tags)||italianEvidence(tags);}
function address(tags={}){return tags['addr:full']||[[tags['addr:street']||tags['addr:place'],tags['addr:housenumber']].filter(Boolean).join(' '),[tags['addr:postcode'],tags['addr:city']||tags['addr:town']||tags['addr:village']].filter(Boolean).join(' ')].filter(Boolean).join(', ');}
function classify(tags={},confirmed=false,italian=false){
  const a=String(tags.amenity||'');
  if(tags['vending:pizza']==='yes'||/pizza/i.test(String(tags.vending||'')))return 'vending_pizza';
  if(a==='food_truck'||tags.mobile==='yes')return 'food_truck';
  if(a==='cafe')return 'cafe';
  if(a==='fast_food')return 'fast_food';
  /* Original WebSim put Italian restaurants into the pizza layer. Keep that
     filter behavior while the UI still marks them as unconfirmed with 🍝. */
  if(['restaurant','takeaway','bar','pub','biergarten','food_court'].includes(a)&&(confirmed||italian))return 'pizzeria';
  if(confirmed||italian)return 'pizzeria';
  return 'other';
}
function normalizeElement(element,Core){
  const tags=element?.tags||{},lat=element?.lat??element?.center?.lat,lng=element?.lon??element?.center?.lon;
  if(!Core?.coords?.(lat,lng)||!['node','way','relation'].includes(element?.type)||!/^[0-9]+$/.test(String(element?.id)))return null;
  if(tags.disused==='yes'||tags.abandoned==='yes'||['disused','abandoned','demolished','construction'].includes(tags.amenity)||!relevantTags(tags))return null;
  const confirmed=pizzaEvidence(tags),italian=!confirmed&&italianEvidence(tags);
  const name=String(tags.name||tags.brand||tags.operator||(confirmed?'Pizza-Ort ohne Namen':'Italienischer Ort ohne Namen')).trim();
  if(!name)return null;
  return Core.place({placeId:`${element.type}-${element.id}`,name,lat:Number(lat),lng:Number(lng),type:classify(tags,confirmed,italian),openingHours:tags.opening_hours||'',website:tags.website||tags['contact:website'],phone:tags.phone||tags['contact:phone']||tags.mobile_phone,address:address(tags),cuisine:tags.cuisine||'',menu:tags['website:menu']||tags['contact:menu']||tags['menu:website']||'',description:tags.description||'',tags,country:tags['addr:country']||'',state:tags['addr:state']||'',pizzaEvidence:confirmed?'confirmed':'possible',updatedAt:new Date().toISOString(),dataSource:'OpenStreetMap'});
}
function normalizeElements(elements,Core){const out=new Map();for(const e of Array.isArray(elements)?elements:[]){const p=normalizeElement(e,Core);if(p)out.set(p.placeId,p);}return [...out.values()];}
function relevantPlace(p){if(!p)return false;if(p.pizzaEvidence==='confirmed'||p.pizzaEvidence==='possible')return true;return relevantTags(p.tags||{name:p.name,cuisine:p.cuisine,description:p.description});}
function filterPlaces(list,cfg={},context={},hours=()=>({state:'unknown'})){
  const types=Array.isArray(cfg.types)?cfg.types:null;
  return (list||[]).filter(p=>{
    if(!relevantPlace(p))return false;
    /* Italian candidates use the pizzeria filter family, matching original WebSim. */
    if(types&&!types.includes(p.type))return false;
    if(cfg.includeItalian===false&&p.pizzaEvidence==='possible')return false;
    if(cfg.hideVisited&&context.visited?.has?.(p.placeId))return false;
    if(cfg.onlyOpen){const state=hours(p)?.state;if(state!=='open'&&!(cfg.unknownHours&&state==='unknown'))return false;}
    return true;
  });
}
function exactConfiguredRadius(root,fallback){try{const r=Number(root.mapConfig?.().radius);if(Number.isFinite(r)&&r>=0&&r<=10)return r;}catch{}return Number(fallback)||0;}
function firstSuccess(promises){return new Promise((resolve,reject)=>{let left=promises.length;const errors=[];if(!left)return reject(Error('Keine Kartenquelle konfiguriert'));promises.forEach((p,i)=>Promise.resolve(p).then(v=>resolve({i,v}),e=>{errors[i]=e;if(--left===0)reject(errors.find(Boolean)||Error('Keine Kartenquelle erreichbar'));}));});}
function syncVersion(root){
  try{if(root.PizzaScan)root.PizzaScan.version=VERSION;}catch{}
  try{const R=root.PizzaReleaseInfo;if(R?.RELEASE)Object.assign(R.RELEASE,{version:VERSION,build:BUILD,apk:'https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.9.apk'});R?.syncVersion?.();R?.decorate?.();}catch{}
  try{const badge=root.document?.querySelector?.('.brand small');if(badge)badge.textContent=VERSION;}catch{}
}
function compactUi(root){
  const d=root.document;if(!d)return;
  if(!d.getElementById('build44-ui')){
    const s=d.createElement('style');s.id='build44-ui';s.textContent=`
      .map-filters{gap:7px!important;align-items:center!important}
      .map-filters .build44-action{height:34px!important;min-height:34px!important;padding:0 12px!important;border:1px solid var(--line)!important;border-radius:999px!important;background:var(--surface)!important;color:var(--text)!important;font-size:12px!important;font-weight:750!important;box-shadow:none!important;width:auto!important;min-width:0!important;margin:0!important}
      .map-caption{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;margin:6px 2px 8px!important;padding:0!important;background:transparent!important;border:0!important;min-height:20px!important}
      .map-caption #map-status{font-size:11px!important;line-height:1.3!important;color:var(--muted)!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;max-width:100%!important}
      .map-caption #map-refresh{display:none!important}
      .build44-cache-note{font-size:10px!important;line-height:1.3!important;color:var(--muted)!important;opacity:.75!important;margin:3px 2px 7px!important;padding:0!important;max-width:100%!important}
      .build44-obsolete-action{display:none!important}
      #map-view .map-legend{margin-top:6px!important}
      #map-view .map-legend summary{font-size:11px!important;color:var(--muted)!important}
      #sheet .settings-jumps{display:flex!important;gap:6px!important;position:sticky!important;top:0!important;z-index:3!important;background:var(--surface)!important;padding:4px 0 8px!important}
      #sheet .settings-jumps button{min-height:34px!important;padding:6px 12px!important;border-radius:999px!important}
    `;d.head.appendChild(s);
  }
  const filters=d.querySelector('.map-filters'),refresh=d.getElementById('map-refresh');
  if(filters&&refresh&&!refresh.dataset.build44Moved){
    refresh.className='filter-chip build44-action';
    refresh.textContent='↻ Aktualisieren';
    refresh.title='Pizza-Orte im aktuellen Suchbereich aktualisieren';
    filters.appendChild(refresh);
    refresh.dataset.build44Moved='1';
  }
  const norm=x=>String(x||'').replace(/\s+/g,' ').trim().toLowerCase();
  for(const b of [...d.querySelectorAll('button')]){
    const t=norm(b.textContent);
    if((t.includes('vollständig aktualisieren')||t==='ort suchen'||t==='🔎 ort suchen')&&!['search-toggle','map-refresh'].includes(b.id)){
      b.classList.add('build44-obsolete-action');
    }
  }
  for(const el of [...d.querySelectorAll('p,small,div')]){
    const t=norm(el.textContent);
    if(!el.querySelector('button')&&t.startsWith('gespeicherte orte werden sofort geladen')){
      el.textContent='Cache: gespeicherte Pizza-Orte sofort · OSM-Abgleich im Hintergrund.';
      el.classList.add('build44-cache-note');
    }
  }
}
function install(root){
  const PD=root.PizzaPlaces,Core=root.PizzaCore;if(!root.document||!PD||!Core)return false;
  PD.query=(center,radius,bounds)=>websimQuery(center,exactConfiguredRadius(root,radius),bounds);PD.normalize=e=>normalizeElement(e,Core);PD.fromOverpass=els=>normalizeElements(els,Core);PD.filter=filterPlaces;
  if(PD.TYPES?.pizzeria)PD.TYPES.pizzeria={...PD.TYPES.pizzeria,emoji:'🍕',name:'Pizza / Italienisch'};
  try{if(typeof mapPool!=='undefined'&&Array.isArray(mapPool))mapPool=mapPool.filter(relevantPlace).map(p=>p?.pizzaEvidence==='possible'&&p?.type==='other'?Core.place({...p,type:'pizzeria'}):p);if(typeof places!=='undefined'&&Array.isArray(places))places=places.filter(relevantPlace).map(p=>p?.pizzaEvidence==='possible'&&p?.type==='other'?Core.place({...p,type:'pizzeria'}):p);}catch{}
  let service=null;try{service=typeof placeService!=='undefined'?placeService:root.placeService;}catch{}
  if(service&&typeof service.json==='function'){
    const previous=service.overpass?.bind(service),serial={value:0};
    service.overpass=async function(query,options={}){
      if(!String(query||'').includes('pizzascan-build44-websim-parity'))return previous?previous(query,options):Promise.reject(Error('Kartenabfrage nicht verfügbar'));
      if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
      const requestId=++serial.value,errors=[];
      options.onStatus?.('Pizza-Orte werden geladen …');
      const tasks=PROVIDERS.map(endpoint=>(async()=>{try{
        const data=await this.json(endpoint,{method:'POST',body:new URLSearchParams({data:query})},options.signal,PROVIDER_TIMEOUT);
        if(!Array.isArray(data?.elements)||data.remark)throw Error(data?.remark||'Unvollständige Kartendaten');
        const elements=data.elements.filter(e=>relevantTags(e?.tags||{}));
        if(!elements.length)throw Error('Keine relevanten Treffer');
        return {endpoint,source:new URL(endpoint).hostname,elements};
      }catch(e){errors.push({source:new URL(endpoint).hostname,message:e?.message||String(e)});throw e;}})());
      let first;
      try{first=(await firstSuccess(tasks)).v;}catch(error){
        this.lastErrors=errors;
        const smart=root.PizzaSmartDiscovery;
        if(typeof smart?.focusedRecovery==='function'){
          const elements=await smart.focusedRecovery(this,query,options,[]);
          if(elements?.length)return {data:{elements},source:'photon.komoot.io',sources:['photon.komoot.io']};
        }
        throw error;
      }
      try{this.write?.('pizzascan-map-provider-v1',first.endpoint);}catch{}
      options.onStatus?.(`Erste Treffer · ${first.source}`);
      const late=group=>{if(!group||requestId!==serial.value||options.signal?.aborted)return;try{
        const found=PD.fromOverpass(group.elements);if(!found.length)return;
        if(typeof mapPool!=='undefined'&&Array.isArray(mapPool))mapPool=PD.merge(mapPool,found);
        if(typeof mapSource!=='undefined'){const parts=String(mapSource||'').split(' + ').filter(Boolean);if(!parts.includes(group.source))parts.push(group.source);mapSource=parts.join(' + ');}
        if(typeof mapUpdated!=='undefined')mapUpdated=new Date().toISOString();
        if(typeof storeMapCache==='function')storeMapCache();
        if(typeof refreshArea==='function')refreshArea();
      }catch(e){console.warn('Build44 progressive merge skipped',e);}};
      tasks.forEach(t=>t.then(g=>{if(g!==first)root.setTimeout(()=>late(g),0);}).catch(()=>{}));
      Promise.allSettled(tasks).then(()=>{this.lastErrors=errors;});
      return {data:{elements:first.elements},source:first.source,sources:[first.source],progressive:true,complete:false};
    };
    service.overpass.__build44=true;
  }
  try{
    if(typeof drawMarkers==='function'&&!drawMarkers.__build44){
      const old=drawMarkers;
      drawMarkers=function(){const out=old();try{
        if(!markers)return out;
        for(const layer of markers.getLayers?.()||[]){const p=placeById?.(layer.options?.title)||null;void p;}
      }catch{}return out;};
      drawMarkers.__build44=true;drawMarkers.__inner=old;
    }
  }catch{}
  syncVersion(root);compactUi(root);
  root.setTimeout(()=>{syncVersion(root);compactUi(root);},0);
  root.setTimeout(()=>{syncVersion(root);compactUi(root);},250);
  root.setTimeout(()=>{syncVersion(root);compactUi(root);},1200);
  const obs=new MutationObserver(()=>compactUi(root));obs.observe(root.document.documentElement,{childList:true,subtree:true});root.setTimeout(()=>obs.disconnect(),15000);
  root.PizzaScanDiscovery44={version:VERSION,build:BUILD,mode:'websim-parity-progressive',websimMinimum:true,genericRestaurantsVisible:false,firstProviderImmediate:true,lateProviderMerge:true,italianUsesPizzaFilterFamily:true};
  return true;
}
return {VERSION,BUILD,PROVIDERS,PROVIDER_TIMEOUT,PIZZA_RE,ITALIAN_CUISINE_RE,ITALIAN_NAME_RE,area,websimQuery,tagText,pizzaEvidence,italianEvidence,relevantTags,classify,normalizeElement,normalizeElements,relevantPlace,filterPlaces,exactConfiguredRadius,firstSuccess,install};
});
