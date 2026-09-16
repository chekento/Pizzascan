/* PizzaScan 2.3.5: original WebSim/ZIP discovery algorithm.
 * The ambient map uses the exact OSM selector families from the uploaded
 * PizzaScan_Android_2026 source. Newer evidence features are additive only.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaSmartDiscovery=api;api.install(root);}
})(globalThis,function(){
'use strict';

const MARKER='pizzascan-smart-discovery-v10';
const QUERY_MARKER='pizzascan-original-zip-search-v1';
const PIZZA=/(pizza|pizzeria|pizzaria|pizzerie|pizze)/i;
const ITALIAN=/(^|[;,\s])(italian|italiano|italiana)($|[;,\s])/i;
const FOOD_AMENITIES=new Set(['restaurant','fast_food','cafe','food_truck','takeaway','food_court','bar','pub','biergarten']);
const FOOD_SHOPS=new Set(['bakery','deli','convenience']);
const FOCUSED_TERMS=[];
const FOCUSED_TARGET=0;
const FOCUSED_MAX_CALLS=0;
const PROVIDERS=[
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.osm.jp/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];
const RECOVERY_PROVIDERS=PROVIDERS.slice(2);

function text(value){return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').toLowerCase();}
function fields(tags={},keys=[]){return keys.map(k=>tags[k]).filter(Boolean).join(' ');}
function isUrlLike(value){return /^\s*(?:https?:\/\/|www\.)/i.test(String(value||''));}
function nonUrlFields(tags={},keys=[]){return keys.map(k=>tags[k]).filter(v=>v&&!isUrlLike(v)).join(' ');}
function cuisine(tags={}){return String(tags.cuisine||'');}
function amenity(tags={}){return String(tags.amenity||'');}
function directPizzaEvidence(tags={}){
  return tags['vending:pizza']==='yes'||String(tags.vending||'')==='pizza'||PIZZA.test(fields(tags,['name','cuisine','brand','operator','speciality','product','products']));
}
function pizzaMenuEvidence(tags={}){
  if(PIZZA.test(fields(tags,['product','products'])))return true;
  return PIZZA.test(nonUrlFields(tags,['menu','website:menu','contact:menu']));
}
function pizzaCommentEvidence(tags={}){return PIZZA.test(fields(tags,['description','description:de','description:en','description:it','description:es','description:fr','note','note:de','note:en']));}
function pizzaText(tags={}){return directPizzaEvidence(tags)||pizzaMenuEvidence(tags)||pizzaCommentEvidence(tags);}
function italianEvidence(tags={}){return ITALIAN.test(cuisine(tags));}
function plausibleFoodObject(tags={}){
  const a=amenity(tags),shop=String(tags.shop||'');
  if(FOOD_AMENITIES.has(a)||a==='vending_machine'||FOOD_SHOPS.has(shop))return true;
  if(a||shop)return false;
  return !(tags.tourism||tags.leisure||tags.healthcare||tags.office||tags.aeroway||tags.railway||tags.public_transport||tags.historic);
}

/* Exact selector semantics from app/src/main/assets/script.js in the uploaded ZIP. */
function originalWebsimTags(tags={}){
  const a=amenity(tags),c=cuisine(tags),name=String(tags.name||''),desc=String(tags.description||''),speciality=String(tags.speciality||'');
  if(c==='pizza')return true;
  if(a==='restaurant'&&c==='italian')return true;
  if(a==='restaurant'&&/(pizza|pizzeria)/.test(c))return true;
  if(String(tags.vending||'')==='pizza'||tags['vending:pizza']==='yes')return true;
  if(a==='cafe'&&/(pizza|italian)/.test(c))return true;
  if(a==='fast_food'&&/(pizza|italian)/.test(c))return true;
  if(a==='food_truck'&&/(pizza|italian)/.test(c))return true;
  if(/pizza/i.test(speciality))return true;
  if((a==='bar'||a==='pub')&&/(pizza|italian)/.test(c))return true;
  if(/pizza|pizzeria|pizze/i.test(name))return true;
  if(/pizza/i.test(desc))return true;
  if(a==='takeaway'&&/(pizza|italian)/.test(c))return true;
  return false;
}
const websimBaselineTags=originalWebsimTags;
function deepEvidenceTags(tags={}){return plausibleFoodObject(tags)&&(pizzaMenuEvidence(tags)||pizzaCommentEvidence(tags));}
function eligibleElement(element){const tags=element?.tags||{};return originalWebsimTags(tags)||deepEvidenceTags(tags);}
function reviewPizzaMentions(place,ratingsUI=globalThis.PizzaRatingsUI){try{return Number(ratingsUI?.summary?.(place)?.pizzaMentions||0)>0;}catch{return false;}}
function placeTags(place){const tags={...(place?.tags||{})};for(const k of ['name','cuisine','description','menu'])if(place?.[k]&&!tags[k])tags[k]=place[k];return tags;}
function placeRelevant(place,ratingsUI=globalThis.PizzaRatingsUI){if(!place)return false;const tags=placeTags(place);if(place.pizzaEvidenceSource==='google-review-session')return true;return originalWebsimTags(tags)||deepEvidenceTags(tags)||reviewPizzaMentions(place,ratingsUI);}
function strongPizzaPlace(place){if(!place)return false;const tags=placeTags(place);return directPizzaEvidence(tags)||pizzaMenuEvidence(tags)||pizzaCommentEvidence(tags)||reviewPizzaMentions(place);}
function italianCandidate(place){return italianEvidence(placeTags(place));}
function classifyPlace(place){
  const t=placeTags(place),a=amenity(t),c=cuisine(t);
  if(String(t.vending||'')==='pizza'||t['vending:pizza']==='yes')return 'vending_pizza';
  if(c==='pizza'||(a==='restaurant'&&c==='italian')){
    if(a==='cafe')return 'cafe';
    if(a==='fast_food')return 'fast_food';
    if(a==='food_truck')return 'food_truck';
    return 'pizzeria';
  }
  if(/pizza/i.test(String(t.name||'')))return 'pizzeria';
  if(a==='cafe')return 'cafe';
  if(a==='fast_food'||a==='takeaway')return 'fast_food';
  if(a==='food_truck')return 'food_truck';
  return 'other';
}
function validBounds(bounds){return bounds&&['south','west','north','east'].every(k=>Number.isFinite(Number(bounds[k])));}
function area(center,radius,bounds){
  /* The original ZIP searches the current Leaflet viewport bbox, not a synthetic
   * category radius. Prefer real map bounds whenever the current app provides them. */
  if(validBounds(bounds))return [bounds.south,bounds.west,bounds.north,bounds.east].join(',');
  const r=Math.round(Math.min(10,Math.max(.5,Number(radius)||5))*1000);
  return `around:${r},${center.lat},${center.lng}`;
}
function triplet(filter,a){return `node${filter}(${a});way${filter}(${a});relation${filter}(${a});`;}
function websimQuery(center,radius,bounds){
  const a=area(center,radius,bounds);
  return `[out:json][timeout:60];(/* ${QUERY_MARKER} */`+
    triplet('["cuisine"="pizza"]',a)+
    triplet('["amenity"="restaurant"]["cuisine"="italian"]',a)+
    triplet('["amenity"="restaurant"]["cuisine"~"pizza|pizzeria"]',a)+
    `node["vending"="pizza"](${a});node["vending:pizza"="yes"](${a});`+
    triplet('["amenity"="cafe"]["cuisine"~"pizza|italian"]',a)+
    triplet('["amenity"="fast_food"]["cuisine"~"pizza|italian"]',a)+
    triplet('["amenity"="food_truck"]["cuisine"~"pizza|italian"]',a)+
    triplet('["speciality"~"pizza",i]',a)+
    triplet('["amenity"~"bar|pub"]["cuisine"~"pizza|italian"]',a)+
    triplet('["name"~"pizza|pizzeria|pizze",i]',a)+
    triplet('["description"~"pizza",i]',a)+
    triplet('["amenity"="takeaway"]["cuisine"~"pizza|italian"]',a)+
    `);out body center;`;
}
const strictQuery=websimQuery;
function isWebsimDiscoveryQuery(query){return String(query||'').includes(QUERY_MARKER);}
const isStrictDiscoveryQuery=isWebsimDiscoveryQuery;
function mergeElements(...groups){const out=new Map();for(const group of groups)for(const e of group||[])if(e&&['node','way','relation'].includes(e.type)&&e.id!=null)out.set(`${e.type}-${e.id}`,e);return [...out.values()];}
function filterCandidates(elements){return (elements||[]).filter(eligibleElement);}
function relevantCount(elements){return filterCandidates(elements).length;}
function googleReviewHasPizza(container){return [...(container?.querySelectorAll?.('*')||[])].some(node=>PIZZA.test(String(node?.textContent||'')));}
function queryAreaInfo(query){
  const q=String(query||'');let m=/around:(\d+),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(q);
  if(m)return {center:{lat:Number(m[2]),lng:Number(m[3])},radius:Math.max(.5,Number(m[1])/1000)};
  m=/\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\)/.exec(q);
  if(!m)return null;const south=Number(m[1]),west=Number(m[2]),north=Number(m[3]),east=Number(m[4]);return {center:{lat:(south+north)/2,lng:(west+east)/2},radius:10,bounds:{south,west,north,east}};
}
function inside(info,p){if(!info||!p)return false;if(info.bounds){const b=info.bounds;return p.lat>=b.south&&p.lat<=b.north&&(b.west<=b.east?p.lng>=b.west&&p.lng<=b.east:p.lng>=b.west||p.lng<=b.east);}const dy=(Number(p.lat)-info.center.lat)*111.32,dx=(Number(p.lng)-info.center.lng)*111.32*Math.cos(info.center.lat*Math.PI/180);return Math.hypot(dx,dy)<=Math.min(10,info.radius*1.15);}
/* Compatibility exports: ambient discovery no longer uses text-search inference. */
function focusedElement(){return null;}
async function focusedRecovery(_service,_query,_options={},seed=[]){return filterCandidates(seed);}
async function preciseProviderRecovery(service,query,options={},seed=[]){
  let elements=filterCandidates(mergeElements(seed)),sources=[];
  if(typeof service?.json!=='function')return {elements,sources};
  for(const endpoint of RECOVERY_PROVIDERS){
    if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    try{const data=await service.json(endpoint,{method:'POST',body:new URLSearchParams({data:query})},options.signal,65000);if(Array.isArray(data?.elements)&&!data.remark){elements=filterCandidates(mergeElements(elements,data.elements));if(data.elements.length)sources.push(new URL(endpoint).hostname);}}catch(error){if(options.signal?.aborted)throw error;}
  }
  return {elements,sources};
}
function bypassLegacyFallback(target){
  if(!target||typeof target.nearbyFallback!=='function'||target.nearbyFallback.__websimBypass)return false;
  const legacy=target.nearbyFallback,bypass=async function(_query,{signal}={}){if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');return [];};
  bypass.__websimBypass=true;bypass.__websimLegacy=legacy;target.nearbyFallback=bypass;return true;
}
async function firstOriginalProvider(service,query,options={}){
  const errors=[];
  const attempts=PROVIDERS.map(endpoint=>(async()=>{
    try{
      const data=await service.json(endpoint,{method:'POST',body:new URLSearchParams({data:query})},options.signal,65000);
      if(!Array.isArray(data?.elements)||data.remark)throw Error(data?.remark||'Unvollständige Kartendaten');
      if(!data.elements.length)throw Error('Keine Treffer in dieser Kartenquelle');
      return {data:{...data,elements:filterCandidates(data.elements)},source:new URL(endpoint).hostname};
    }catch(error){errors.push({source:new URL(endpoint).hostname,message:error?.message||String(error)});throw error;}
  })());
  try{return await Promise.any(attempts);}catch(error){const e=Error('Keine Original-WebSim-Kartenquelle erreichbar');e.causes=errors;e.cause=error;throw e;}
}
function wrapOverpass(target){
  if(!target||typeof target.overpass!=='function'||target.overpass.__websimOriginalZip)return false;
  bypassLegacyFallback(target);const base=target.overpass;
  const wrapped=async function(query,options={}){
    if(!isWebsimDiscoveryQuery(query))return base.call(this,query,options);
    if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    options.onStatus?.('Pizza-Orte werden mit dem ursprünglichen WebSim-Algorithmus geladen …');
    const result=await firstOriginalProvider(this,query,options);
    return result;
  };
  wrapped.__websimOriginalZip=true;wrapped.__websimOriginalZipInner=base;target.overpass=wrapped;return true;
}
function clearOldCaches(root){
  try{
    if(!root.localStorage||root.localStorage.getItem(MARKER))return;
    for(const key of ['pizzascan-map-cache-v3','pizzascan-map-cache-v2','pizzascan-smart-discovery-v9','pizzascan-smart-discovery-v8','pizzascan-smart-discovery-v7','pizzascan-first-map-discovery-v1','pizzascan-first-map-discovery-v2'])root.localStorage.removeItem(key);
    for(let i=root.localStorage.length-1;i>=0;i--){const k=root.localStorage.key(i);if(k?.startsWith('pizzascan-search-')||k?.startsWith('pizzascan-nearby-photon-'))root.localStorage.removeItem(k);}
    root.localStorage.setItem(MARKER,'1');
  }catch{}
}
function install(root){
  const PD=root.PizzaPlaces;if(!PD)return;clearOldCaches(root);
  const query=function(center,radius,bounds){return websimQuery(center,radius,bounds);};query.__websimRelevant=true;query.__websimOriginalZip=true;PD.query=query;
  if(!PD.filter.__websimOriginalZip){const baseFilter=PD.filter.bind(PD);PD.filter=function(list,cfg,context,hours){return baseFilter(list,cfg,context,hours).filter(place=>placeRelevant(place,root.PizzaRatingsUI));};PD.filter.__websimOriginalZip=true;}
  wrapOverpass(PD.Service?.prototype);if(root.placeService)wrapOverpass(root.placeService);
  if(PD.TYPES?.other)PD.TYPES.other={...PD.TYPES.other,emoji:'🍝',name:'Italienisch / Pizza-relevant'};
  if(PD.TYPES?.pizzeria)PD.TYPES.pizzeria={...PD.TYPES.pizzeria,emoji:'🍕',name:'Pizzeria / Pizza-Ort'};
  root.PizzaScanSmartDiscovery={marker:MARKER,mode:'original-zip-exact',query:QUERY_MARKER,originalZip:true,viewportBbox:true,genericRestaurantsVisible:false,photonAmbientFallback:false,reviewEvidence:true,menuEvidence:true,providers:PROVIDERS.slice()};
}
return {MARKER,QUERY_MARKER,PIZZA,ITALIAN,FOOD_AMENITIES,FOOD_SHOPS,FOCUSED_TERMS,FOCUSED_TARGET,FOCUSED_MAX_CALLS,PROVIDERS,RECOVERY_PROVIDERS,text,directPizzaEvidence,pizzaMenuEvidence,pizzaCommentEvidence,pizzaText,italianEvidence,plausibleFoodObject,originalWebsimTags,websimBaselineTags,deepEvidenceTags,eligibleElement,reviewPizzaMentions,placeRelevant,strongPizzaPlace,italianCandidate,classifyPlace,validBounds,area,triplet,websimQuery,strictQuery,isWebsimDiscoveryQuery,isStrictDiscoveryQuery,mergeElements,filterCandidates,relevantCount,googleReviewHasPizza,queryAreaInfo,inside,focusedElement,focusedRecovery,preciseProviderRecovery,bypassLegacyFallback,firstOriginalProvider,wrapOverpass,clearOldCaches,install};
});
