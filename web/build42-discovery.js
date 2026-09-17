/* PizzaScan Build 42: professional progressive global discovery.
 * Fast first paint, broad OSM gastro coverage, no pizza-name prerequisite,
 * correct fixed-radius semantics and progressive provider union.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else{root.PizzaBuild42=api;api.install(root);}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const VERSION='2.3.7',BUILD=42;
const PROVIDERS=[
 'https://overpass-api.de/api/interpreter',
 'https://overpass.private.coffee/api/interpreter',
 'https://overpass.osm.jp/api/interpreter'
];
const FOOD_AMENITIES='restaurant|fast_food|cafe|food_truck|takeaway|food_court|bar|pub|biergarten';
const FOOD_SHOPS='bakery|deli|convenience|food';
const QUERY_MARKER='pizzascan-build42-broad-discovery';
const PROVIDER_TIMEOUT=18000;
const CACHE_SNAPSHOT=5000;
const INITIAL_CARDS=120;
const MORE_CARDS=200;
const PIZZA_RE=/(pizza|pizzeria|pizzaria|pizzerie|pizze|pizza[ _-]?bar|ピザ|披萨|披薩|比萨|比薩|بيتزا|пицц|πίτσα|פיצה|피자|พิซซ่า)/iu;
const ITALIAN_RE=/(italian|italiano|italiana|ristorante|trattoria|osteria|italien|italienne|italienisch|итальян|意大利)/iu;

function unicodeText(value){return String(value??'').normalize('NFD').replace(/(\p{Script=Latin})\p{M}+/gu,'$1').normalize('NFC').replace(/ß/g,'ss').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
function endpointHost(value){try{return new URL(String(value)).hostname.toLowerCase();}catch{return '';}}
function validBounds(b){return b&&['south','west','north','east'].every(k=>Number.isFinite(Number(b[k])));}
function areaToken(center,radius,bounds){
 const r=Number(radius)||0;
 if(r>0){if(!center||!Number.isFinite(Number(center.lat))||!Number.isFinite(Number(center.lng)))throw Error('Ungültiger Suchmittelpunkt');return `around:${Math.round(Math.max(.5,Math.min(10,r))*1000)},${Number(center.lat)},${Number(center.lng)}`;}
 if(validBounds(bounds))return `${Number(bounds.south)},${Number(bounds.west)},${Number(bounds.north)},${Number(bounds.east)}`;
 if(center&&Number.isFinite(Number(center.lat))&&Number.isFinite(Number(center.lng)))return `around:5000,${Number(center.lat)},${Number(center.lng)}`;
 throw Error('Ungültiger Suchbereich');
}
function broadQuery(center,radius,bounds){
 const area=areaToken(center,radius,bounds);
 return `[out:json][timeout:20];(/* ${QUERY_MARKER} */`+
  `nwr["amenity"~"^(${FOOD_AMENITIES})$"]["name"](${area});`+
  `nwr["amenity"~"^(${FOOD_AMENITIES})$"]["brand"](${area});`+
  `nwr["amenity"~"^(${FOOD_AMENITIES})$"]["operator"](${area});`+
  `nwr["cuisine"~"pizza|pizzeria|pizzaria|italian|italiano|italiana",i](${area});`+
  `nwr["shop"~"^(${FOOD_SHOPS})$"]["name"~"pizza|pizzeria|pizzaria|pizze|ピザ|披萨|披薩|بيتزا|пицц",i](${area});`+
  `nwr["speciality"~"pizza|pizzeria|ピザ|披萨|披薩|بيتزا|пицц",i](${area});`+
  `nwr["product"~"pizza|pizzeria|ピザ|披萨|披薩|بيتزا|пицц",i](${area});`+
  `nwr["products"~"pizza|pizzeria|ピザ|披萨|披薩|بيتزا|пицц",i](${area});`+
  `nwr["description"~"pizza|pizzeria|ピザ|披萨|披薩|بيتزا|пицц",i](${area});`+
  `nwr["note"~"pizza|pizzeria|ピザ|披萨|披薩|بيتزا|пицц",i](${area});`+
  `nwr["vending"~"pizza",i](${area});nwr["vending:pizza"="yes"](${area});`+
  `);out body center qt;`;
}
function isDiscoveryQuery(query){return String(query||'').includes(QUERY_MARKER);}
function queryAreaInfo(query){
 const q=String(query||'');let m=/around:(\d+),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(q);
 if(m)return {center:{lat:Number(m[2]),lng:Number(m[3])},radius:Number(m[1])/1000,bounds:null};
 m=/\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\)/.exec(q);
 if(!m)return null;const south=Number(m[1]),west=Number(m[2]),north=Number(m[3]),east=Number(m[4]);return {center:{lat:(south+north)/2,lng:(west+east)/2},radius:0,bounds:{south,west,north,east}};
}
function tagText(tags={}){const values=[];for(const [key,value] of Object.entries(tags)){if(value==null)continue;if(/^(?:name(?::.*)?|brand|operator|cuisine|speciality|product|products|description(?::.*)?|note(?::.*)?|menu(?::.*)?|website:menu|contact:menu|vending)$/i.test(key))values.push(String(value));}return values.join(' ');}
function pizzaEvidence(tags={}){return tags['vending:pizza']==='yes'||PIZZA_RE.test(String(tags.vending||''))||PIZZA_RE.test(tagText(tags));}
function italianEvidence(tags={}){return ITALIAN_RE.test([tags.cuisine,tags.name,tags.brand,tags.operator].filter(Boolean).join(' '));}
function foodObject(tags={}){const a=String(tags.amenity||''),shop=String(tags.shop||'');return new RegExp(`^(?:${FOOD_AMENITIES})$`).test(a)||new RegExp(`^(?:${FOOD_SHOPS})$`).test(shop)||pizzaEvidence(tags);}
function address(tags={}){return tags['addr:full']||[[tags['addr:street']||tags['addr:place'],tags['addr:housenumber']].filter(Boolean).join(' '),[tags['addr:postcode'],tags['addr:city']||tags['addr:town']||tags['addr:village']].filter(Boolean).join(' ')].filter(Boolean).join(', ');}
function firstTag(tags,prefix){for(const [key,value] of Object.entries(tags||{}))if(key.startsWith(prefix)&&value)return String(value);return '';}
function classify(tags={},confirmed=false){const a=String(tags.amenity||'');if(String(tags.vending||'').toLowerCase().includes('pizza')||tags['vending:pizza']==='yes')return 'vending_pizza';if(a==='food_truck'||tags.mobile==='yes')return 'food_truck';if(a==='cafe')return 'cafe';if(a==='fast_food'||a==='takeaway')return 'fast_food';if(confirmed&&a==='restaurant')return 'pizzeria';return 'other';}
function normalizeElement(element,Core){
 const tags=element?.tags||{},lat=element?.lat??element?.center?.lat,lng=element?.lon??element?.center?.lon;
 if(!Core?.coords?.(lat,lng)||!['node','way','relation'].includes(element?.type)||!/^\d+$/.test(String(element?.id)))return null;
 if(tags.disused==='yes'||tags.abandoned==='yes'||['disused','abandoned','demolished','construction'].includes(tags.amenity))return null;
 const confirmed=pizzaEvidence(tags),possible=!confirmed&&italianEvidence(tags),food=foodObject(tags);
 if(!food)return null;
 const name=String(tags.name||tags.brand||tags.operator||(confirmed?'Pizza-Ort ohne Namen':'')).trim();
 if(!name&&!confirmed)return null;
 const type=classify(tags,confirmed),description=tags.description||firstTag(tags,'description:');
 return Core.place({
  placeId:`${element.type}-${element.id}`,name:name||'Pizza-Ort ohne Namen',lat:Number(lat),lng:Number(lng),type,
  openingHours:tags.opening_hours||'',website:tags.website||tags['contact:website'],phone:tags.phone||tags['contact:phone']||tags.mobile_phone,
  address:address(tags),cuisine:tags.cuisine||'',menu:tags['website:menu']||tags['contact:menu']||tags['menu:website']||'',description,
  tags,country:tags['addr:country']||'',state:tags['addr:state']||'',pizzaEvidence:confirmed?'confirmed':possible?'possible':'search',updatedAt:new Date().toISOString(),dataSource:'OpenStreetMap'
 });
}
function normalizeElements(elements,Core){if(!Array.isArray(elements))throw Error('Ungültige Kartendaten');const out=new Map();for(const element of elements){const p=normalizeElement(element,Core);if(p)out.set(p.placeId,p);}return [...out.values()];}
function mergeElements(...groups){const out=new Map();for(const group of groups||[])for(const e of group||[]){if(!e||!['node','way','relation'].includes(e.type)||e.id==null)continue;out.set(`${e.type}-${e.id}`,e);}return [...out.values()];}
function filterPlaces(list,cfg={},context={},hours=()=>({state:'unknown'})){
 const types=Array.isArray(cfg.types)?cfg.types:null;
 return (list||[]).filter(p=>{
  if(!p)return false;if(types&&!types.includes(p.type))return false;
  if(cfg.includeUnconfirmed===false&&p.pizzaEvidence==='search')return false;
  if(cfg.includeItalian===false&&p.pizzaEvidence==='possible')return false;
  if(cfg.hideVisited&&context.visited?.has?.(p.placeId))return false;
  if(cfg.onlyOpen){const state=hours(p)?.state;if(state!=='open'&&!(cfg.unknownHours&&state==='unknown'))return false;}
  return true;
 });
}
function firstSuccess(promises){return new Promise((resolve,reject)=>{let left=promises.length;const errors=[];if(!left)return reject(Error('Keine Datenquelle konfiguriert'));promises.forEach((promise,index)=>Promise.resolve(promise).then(value=>resolve({index,value}),error=>{errors[index]=error;if(--left===0)reject(errors.find(Boolean)||Error('Keine Datenquelle erreichbar'));}));});}
function providerOrder(service){const preferred=(()=>{try{return service?.read?.('pizzascan-map-provider-v1');}catch{return '';}})();return preferred&&PROVIDERS.includes(preferred)?[preferred,...PROVIDERS.filter(x=>x!==preferred)]:PROVIDERS.slice();}

function install(root){
 if(!root.document)return false;
 const PD=root.PizzaPlaces,Core=root.PizzaCore;if(!PD||!Core)return false;
 let service=null;try{service=typeof placeService!=='undefined'?placeService:root.placeService;}catch{}
 let requestSerial=0,activeRequest=0,cardLimit=INITIAL_CARDS;

 // Remove the old pizza-only discovery/filter bottleneck. Every named gastro POI is a
 // candidate; pizza/Italian tags now affect evidence/ranking, not basic visibility.
 PD.query=broadQuery;
 PD.normalize=(element)=>normalizeElement(element,Core);
 PD.fromOverpass=(elements)=>normalizeElements(elements,Core);
 PD.filter=filterPlaces;
 PD.text=unicodeText;
 if(PD.TYPES?.other)PD.TYPES.other={...PD.TYPES.other,emoji:'🍽️',name:'Restaurant / Bar / Gastro-Ort'};
 if(typeof PD.suggestions==='function')PD.suggestions=function(list,q,center){const unique=[...new Map((list||[]).map(p=>[p.placeId,p])).values()],rank=typeof PD.rank==='function'?PD.rank:(p,x)=>unicodeText(p.name).includes(unicodeText(x))?1:-1;return unique.map(p=>({p,score:rank(p,q,center)})).filter(x=>x.score>=0).sort((a,b)=>b.score-a.score).slice(0,30).map(x=>x.p);};

 function status(text){const el=root.document.getElementById('map-status');if(el)el.textContent=text;}
 function applyLate(group,requestId){
  if(requestId!==activeRequest||!group?.elements?.length)return;
  try{
   const found=PD.fromOverpass(group.elements);
   if(!found.length)return;
   if(typeof mapPool!=='undefined'&&Array.isArray(mapPool))mapPool=PD.merge(mapPool,found);
   if(typeof mapSource!=='undefined'){const parts=String(mapSource||'').split(' + ').filter(Boolean);if(!parts.includes(group.source))parts.push(group.source);mapSource=parts.join(' + ');}
   if(typeof mapUpdated!=='undefined')mapUpdated=new Date().toISOString();
   if(typeof storeMapCache==='function')storeMapCache();
   if(typeof refreshArea==='function')refreshArea();
  }catch(error){console.warn('PizzaScan progressive merge skipped',error);}
 }

 if(service&&typeof service.json==='function'){
  const previous=service.overpass.bind(service);
  service.overpass=async function(query,options={}){
   if(!isDiscoveryQuery(query))return previous(query,options);
   if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
   const requestId=++requestSerial;activeRequest=requestId;cardLimit=INITIAL_CARDS;
   const endpoints=providerOrder(this),errors=[];
   options.onStatus?.('Gastro-Orte werden geladen · erster Treffer wird sofort angezeigt …');
   const tasks=endpoints.map(endpoint=>(async()=>{
    try{
     const data=await this.json(endpoint,{method:'POST',body:new URLSearchParams({data:query})},options.signal,PROVIDER_TIMEOUT);
     if(!Array.isArray(data?.elements)||data.remark)throw Error(data?.remark||'Unvollständige OpenStreetMap-Antwort');
     return {source:endpointHost(endpoint),endpoint,elements:data.elements};
    }catch(error){errors.push({source:endpointHost(endpoint),message:error?.message||String(error)});throw error;}
   })());
   let first;
   try{first=(await firstSuccess(tasks)).value;}
   catch(error){this.lastErrors=errors;return previous(query,options);}
   if(first.elements.length)try{this.write?.('pizzascan-map-provider-v1',first.endpoint);}catch{}
   this.lastErrors=errors;
   options.onStatus?.(`Erste Treffer · ${first.source} · weitere OSM-Spiegel werden ergänzt …`);
   tasks.forEach(task=>task.then(group=>{if(group!==first)root.setTimeout(()=>applyLate(group,requestId),0);}).catch(()=>{}));
   Promise.allSettled(tasks).then(results=>{
    if(requestId!==activeRequest||options.signal?.aborted)return;
    const successes=results.filter(r=>r.status==='fulfilled').map(r=>r.value),sources=[...new Set(successes.map(x=>x.source))];
    this.lastErrors=errors;
    root.setTimeout(()=>{if(requestId!==activeRequest)return;let count=0;try{count=typeof places!=='undefined'&&Array.isArray(places)?places.length:0;}catch{}status(`${count} Gastro-Orte · ${sources.length}/${endpoints.length} OSM-Quellen`);},0);
   });
   return {data:{elements:first.elements},source:first.source,sources:[first.source],progressive:true,complete:false};
  };
  service.overpass.__build42=true;
 }

 // Never truncate the live mapPool while serializing the lightweight localStorage cache.
 // Only the snapshot is bounded; the current live search keeps every merged POI.
 try{if(typeof storeMapCache==='function'&&!storeMapCache.__build42){const old=storeMapCache;storeMapCache=function(){try{if(!Array.isArray(mapPool)||typeof placeService==='undefined')return old();if(Array.isArray(mapAreas))mapAreas=mapAreas.slice(-16);const snapshot=mapPool.slice(-CACHE_SNAPSHOT);placeService.write('pizzascan-map-cache-v3',{places:snapshot,areas:Array.isArray(mapAreas)?mapAreas:[]});}catch{return old();}};storeMapCache.__build42=true;storeMapCache.__inner=old;}}catch{}

 // Keep the UI responsive with chunked cards while making the complete result set
 // accessible. Markers and result counts always use the complete in-memory list.
 try{if(typeof placeCards==='function'&&!placeCards.__build42){const oldCards=placeCards;placeCards=function(list){const subset=(list||[]).slice(0,cardLimit);let html='';for(let i=0;i<subset.length;i+=100)html+=oldCards(subset.slice(i,i+100));return html;};placeCards.__build42=true;placeCards.__inner=oldCards;}}catch{}
 try{if(typeof renderPlaces==='function'&&!renderPlaces.__build42){const oldRender=renderPlaces;renderPlaces=function(){const out=oldRender();try{const list=typeof visiblePlaces==='function'?visiblePlaces():[],confirmed=list.filter(p=>p.pizzaEvidence==='confirmed').length,possible=list.filter(p=>p.pizzaEvidence==='possible').length,unknown=Math.max(0,list.length-confirmed-possible),cfg=typeof mapConfig==='function'?mapConfig():{};const title=root.document.getElementById('places-title'),count=root.document.getElementById('result-count'),container=root.document.getElementById('places');if(title)title.textContent=cfg.radius?`Gastro-Orte & Pizza · ${cfg.radius} km`:'Gastro-Orte & Pizza · Kartenausschnitt';if(count)count.textContent=`${list.length} Orte · ${confirmed} Pizza bestätigt · ${possible} Italienisch · ${unknown} ungeprüft`;if(container&&list.length>cardLimit)container.insertAdjacentHTML('beforeend',`<button class="secondary full build42-more" type="button" data-build42-more>Weitere ${Math.min(MORE_CARDS,list.length-cardLimit)} von ${list.length-cardLimit} Orten anzeigen</button>`);}catch{}return out;};renderPlaces.__build42=true;renderPlaces.__inner=oldRender;}}catch{}
 root.document.addEventListener('click',event=>{const button=event.target?.closest?.('[data-build42-more]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();cardLimit+=MORE_CARDS;try{renderPlaces();}catch{}},{capture:true});

 root.PizzaScanDiscovery42={version:VERSION,build:BUILD,mode:'progressive-broad-osm',providers:PROVIDERS.slice(),foodAmenities:FOOD_AMENITIES,noPizzaNameRequirement:true,firstPaintProgressive:true,fixedRadiusUsesCircle:true,liveResultCap:null,cacheSnapshot:CACHE_SNAPSHOT};
 try{if(root.PizzaScan)root.PizzaScan.version=VERSION;}catch{}
 return true;
}

return {VERSION,BUILD,PROVIDERS,FOOD_AMENITIES,FOOD_SHOPS,QUERY_MARKER,PROVIDER_TIMEOUT,CACHE_SNAPSHOT,PIZZA_RE,ITALIAN_RE,unicodeText,areaToken,broadQuery,isDiscoveryQuery,queryAreaInfo,tagText,pizzaEvidence,italianEvidence,foodObject,address,classify,normalizeElement,normalizeElements,mergeElements,filterPlaces,firstSuccess,providerOrder,install};
});
