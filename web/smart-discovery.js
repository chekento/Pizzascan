/* PizzaScan 2.3.5: WebSim-based pizza discovery strengthened for dense cities.
 * The original ZIP selector families remain the baseline. Robust multi-value
 * cuisine/name/menu/product variants and multi-provider merging are additive.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaSmartDiscovery=api;api.install(root);}
})(globalThis,function(){
'use strict';

const MARKER='pizzascan-smart-discovery-v11';
const QUERY_MARKER='pizzascan-websim-dense-search-v2';
const PIZZA=/(pizza|pizzeria|pizzaria|pizzerie|pizze|pizza[ _-]?place)/i;
const ITALIAN=/(^|[;,_\s])(italian|italiano|italiana)($|[;,_\s])/i;
const ITALIAN_NAME=/(^|[^a-z])(ristorante|trattoria|osteria|italian restaurant|italiano|italiana|italiener|italienisch)([^a-z]|$)/i;
const FOOD_AMENITIES=new Set(['restaurant','fast_food','cafe','food_truck','takeaway','food_court','bar','pub','biergarten']);
const FOOD_SHOPS=new Set(['bakery','deli','convenience']);
const FOCUSED_TERMS=['pizza','pizzeria','italian restaurant','ristorante','trattoria','osteria'];
const FOCUSED_TARGET=12;
const FOCUSED_MAX_CALLS=6;
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
function cuisinePizza(tags={}){return PIZZA.test(cuisine(tags));}
function italianCuisine(tags={}){return ITALIAN.test(cuisine(tags));}
function italianName(tags={}){return ITALIAN_NAME.test(text(fields(tags,['name','brand','operator'])));}
function directPizzaEvidence(tags={}){
  return tags['vending:pizza']==='yes'||PIZZA.test(fields(tags,['name','cuisine','brand','operator','speciality','vending','product','products']));
}
function pizzaMenuEvidence(tags={}){
  if(PIZZA.test(fields(tags,['product','products'])))return true;
  return PIZZA.test(nonUrlFields(tags,['menu','website:menu','contact:menu','menu:website']));
}
function pizzaCommentEvidence(tags={}){return PIZZA.test(fields(tags,['description','description:de','description:en','description:it','description:es','description:fr','note','note:de','note:en']));}
function pizzaText(tags={}){return directPizzaEvidence(tags)||pizzaMenuEvidence(tags)||pizzaCommentEvidence(tags);}
function italianEvidence(tags={}){return italianCuisine(tags)||italianName(tags);}
function plausibleFoodObject(tags={}){
  const a=amenity(tags),shop=String(tags.shop||'');
  if(FOOD_AMENITIES.has(a)||a==='vending_machine'||FOOD_SHOPS.has(shop))return true;
  if(a||shop)return false;
  return !(tags.tourism||tags.leisure||tags.healthcare||tags.office||tags.aeroway||tags.railway||tags.public_transport||tags.historic);
}

/* Original WebSim semantics plus common OSM tagging variants seen in dense cities. */
function originalWebsimTags(tags={}){
  const a=amenity(tags),c=cuisine(tags),name=String(tags.name||''),desc=String(tags.description||''),speciality=String(tags.speciality||''),shop=String(tags.shop||'');
  if(c==='pizza')return true;
  if(a==='restaurant'&&c==='italian')return true;
  if(a==='restaurant'&&/(pizza|pizzeria)/i.test(c))return true;
  if(String(tags.vending||'').toLowerCase()==='pizza'||tags['vending:pizza']==='yes')return true;
  if(a==='cafe'&&/(pizza|italian)/i.test(c))return true;
  if(a==='fast_food'&&/(pizza|italian)/i.test(c))return true;
  if(a==='food_truck'&&/(pizza|italian)/i.test(c))return true;
  if(/pizza/i.test(speciality))return true;
  if((a==='bar'||a==='pub')&&/(pizza|italian)/i.test(c))return true;
  if(/pizza|pizzeria|pizze/i.test(name))return true;
  if(/pizza/i.test(desc))return true;
  if(a==='takeaway'&&/(pizza|italian)/i.test(c))return true;

  /* Dense-city strengthening: cuisine is often a semicolon/comma list and many
   * legitimate Italian venues are tagged by name rather than cuisine. */
  if(plausibleFoodObject(tags)&&(cuisinePizza(tags)||italianCuisine(tags)))return true;
  if(FOOD_AMENITIES.has(a)&&italianName(tags))return true;
  if(FOOD_SHOPS.has(shop)&&(directPizzaEvidence(tags)||pizzaMenuEvidence(tags)||pizzaCommentEvidence(tags)))return true;
  if(plausibleFoodObject(tags)&&(pizzaMenuEvidence(tags)||pizzaCommentEvidence(tags)))return true;
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
  const t=placeTags(place),a=amenity(t);
  if(PIZZA.test(String(t.vending||''))||t['vending:pizza']==='yes')return 'vending_pizza';
  if(a==='cafe')return 'cafe';
  if(a==='fast_food'||a==='takeaway')return 'fast_food';
  if(a==='food_truck')return 'food_truck';
  if(strongPizzaPlace(place))return 'pizzeria';
  return 'other';
}
function validBounds(bounds){return bounds&&['south','west','north','east'].every(k=>Number.isFinite(Number(bounds[k])));}
function area(center,radius,bounds){
  if(validBounds(bounds))return [bounds.south,bounds.west,bounds.north,bounds.east].join(',');
  const r=Math.round(Math.min(10,Math.max(.5,Number(radius)||5))*1000);
  return `around:${r},${center.lat},${center.lng}`;
}
function triplet(filter,a){return `node${filter}(${a});way${filter}(${a});relation${filter}(${a});`;}
function websimQuery(center,radius,bounds){
  const a=area(center,radius,bounds);
  return `[out:json][timeout:55];(/* ${QUERY_MARKER} */`+
    `nwr["cuisine"~"pizza|pizzeria|italian|italiano|italiana",i](${a});`+
    `nwr["amenity"~"restaurant|fast_food|cafe|food_truck|takeaway|food_court|bar|pub|biergarten"]["name"~"pizza|pizzeria|pizzaria|pizze|ristorante|trattoria|osteria|italian|italiano|italiana|italien",i](${a});`+
    `nwr["shop"~"bakery|deli|convenience"]["name"~"pizza|pizzeria|pizzaria|pizze",i](${a});`+
    `nwr["speciality"~"pizza",i](${a});`+
    `nwr["product"~"pizza",i](${a});nwr["products"~"pizza",i](${a});`+
    `nwr["menu"~"pizza",i](${a});`+
    `nwr["description"~"pizza",i](${a});nwr["note"~"pizza",i](${a});`+
    `nwr["vending"~"pizza",i](${a});nwr["vending:pizza"="yes"](${a});`+
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
  m=/\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)?,?(-?\d+(?:\.\d+)?)\)/.exec(q);
  const box=/\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\)/.exec(q);
  if(!box)return null;const south=Number(box[1]),west=Number(box[2]),north=Number(box[3]),east=Number(box[4]);return {center:{lat:(south+north)/2,lng:(west+east)/2},radius:10,bounds:{south,west,north,east}};
}
function inside(info,p){if(!info||!p)return false;if(info.bounds){const b=info.bounds;return p.lat>=b.south&&p.lat<=b.north&&(b.west<=b.east?p.lng>=b.west&&p.lng<=b.east:p.lng>=b.west||p.lng<=b.east);}const dy=(Number(p.lat)-info.center.lat)*111.32,dx=(Number(p.lng)-info.center.lng)*111.32*Math.cos(info.center.lat*Math.PI/180);return Math.hypot(dx,dy)<=Math.min(10,info.radius*1.15);}
function familyForTerm(term){return /ristorante|trattoria|osteria|italian/i.test(term)?'italian':'pizza';}
function focusedElement(item,term=''){
  const p=item?.place,m=/^(node|way|relation)-(\d+)$/.exec(p?.placeId||'');if(!p||!m)return null;
  const tags={...(p.tags||{}),name:p.name||item.name||''};
  if(familyForTerm(term)==='italian'&&!tags.cuisine)tags['pizzascan:semantic']='italian-name';
  const element={type:m[1],id:Number(m[2]),lat:p.lat,lon:p.lng,tags};
  return eligibleElement(element)||familyForTerm(term)==='italian'&&italianName(tags)?element:null;
}
async function focusedRecovery(service,query,options={},seed=[]){
  const info=queryAreaInfo(query);let elements=filterCandidates(seed);if(!info||typeof service?.photon!=='function'||elements.length>=FOCUSED_TARGET)return elements;
  options.onStatus?.('Zusätzliche Pizza- und Italien-Orte werden gesucht …');
  for(const term of FOCUSED_TERMS.slice(0,FOCUSED_MAX_CALLS)){
    if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    try{const items=await service.photon(term,info.center,{signal:options.signal,force:true}),extra=[];for(const item of items||[]){const e=focusedElement(item,term);if(e&&inside(info,{lat:e.lat,lng:e.lon}))extra.push(e);}elements=mergeElements(elements,extra);if(elements.length>=FOCUSED_TARGET)break;}catch(error){if(options.signal?.aborted)throw error;}
  }
  return elements;
}
async function preciseProviderRecovery(service,query,options={},seed=[]){
  let elements=filterCandidates(mergeElements(seed)),sources=[];
  if(typeof service?.json!=='function')return {elements,sources};
  for(const endpoint of RECOVERY_PROVIDERS){
    if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    try{const data=await service.json(endpoint,{method:'POST',body:new URLSearchParams({data:query})},options.signal,60000);if(Array.isArray(data?.elements)&&!data.remark){elements=filterCandidates(mergeElements(elements,data.elements));if(data.elements.length)sources.push(new URL(endpoint).hostname);}}catch(error){if(options.signal?.aborted)throw error;}
  }
  return {elements,sources};
}
function bypassLegacyFallback(target){
  if(!target||typeof target.nearbyFallback!=='function'||target.nearbyFallback.__websimBypass)return false;
  const legacy=target.nearbyFallback,bypass=async function(_query,{signal}={}){if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');return [];};
  bypass.__websimBypass=true;bypass.__websimLegacy=legacy;target.nearbyFallback=bypass;return true;
}
function wait(ms,signal){return new Promise((resolve,reject)=>{if(signal?.aborted)return reject(new DOMException('Abgebrochen','AbortError'));const t=setTimeout(resolve,ms);signal?.addEventListener?.('abort',()=>{clearTimeout(t);reject(new DOMException('Abgebrochen','AbortError'));},{once:true});});}
async function firstOriginalProvider(service,query,options={}){
  const errors=[],successes=[];let firstResolve,firstReject,finished=0;
  const first=new Promise((resolve,reject)=>{firstResolve=resolve;firstReject=reject;});
  const tasks=PROVIDERS.map(endpoint=>(async()=>{
    try{
      const data=await service.json(endpoint,{method:'POST',body:new URLSearchParams({data:query})},options.signal,60000);
      if(!Array.isArray(data?.elements)||data.remark)throw Error(data?.remark||'Unvollständige Kartendaten');
      const elements=filterCandidates(data.elements);if(!elements.length)throw Error('Keine passenden Treffer in dieser Kartenquelle');
      successes.push({source:new URL(endpoint).hostname,elements});if(successes.length===1)firstResolve();
    }catch(error){errors.push({source:new URL(endpoint).hostname,message:error?.message||String(error)});if(options.signal?.aborted)throw error;}
    finally{finished++;if(finished===PROVIDERS.length&&!successes.length)firstReject(Error('Keine WebSim-Kartenquelle erreichbar'));}
  })());
  try{
    await first;
    await Promise.race([Promise.allSettled(tasks),wait(3500,options.signal)]);
    const elements=mergeElements(...successes.map(x=>x.elements));
    return {data:{elements},source:successes.map(x=>x.source).join(' + '),sources:successes.map(x=>x.source)};
  }catch(error){
    await Promise.allSettled(tasks);
    const fallback=await focusedRecovery(service,query,options,[]);
    if(fallback.length)return {data:{elements:fallback},source:'photon.komoot.io'};
    const e=Error('Keine Pizza-/Italien-Kartenquelle erreichbar');e.causes=errors;e.cause=error;throw e;
  }
}
function wrapOverpass(target){
  if(!target||typeof target.overpass!=='function'||target.overpass.__websimOriginalZip)return false;
  bypassLegacyFallback(target);const base=target.overpass;
  const wrapped=async function(query,options={}){
    if(!isWebsimDiscoveryQuery(query))return base.call(this,query,options);
    if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    options.onStatus?.('Alle Pizza- und Italien-Orte im Kartenausschnitt werden geladen …');
    return firstOriginalProvider(this,query,options);
  };
  wrapped.__websimOriginalZip=true;wrapped.__websimOriginalZipInner=base;target.overpass=wrapped;return true;
}
function clearOldCaches(root){
  try{
    if(!root.localStorage||root.localStorage.getItem(MARKER))return;
    for(const key of ['pizzascan-map-cache-v3','pizzascan-map-cache-v2','pizzascan-smart-discovery-v10','pizzascan-smart-discovery-v9','pizzascan-smart-discovery-v8','pizzascan-smart-discovery-v7','pizzascan-first-map-discovery-v1','pizzascan-first-map-discovery-v2'])root.localStorage.removeItem(key);
    for(let i=root.localStorage.length-1;i>=0;i--){const k=root.localStorage.key(i);if(k?.startsWith('pizzascan-search-')||k?.startsWith('pizzascan-nearby-photon-'))root.localStorage.removeItem(k);}
    root.localStorage.setItem(MARKER,'1');
  }catch{}
}
function install(root){
  const PD=root.PizzaPlaces;if(!PD)return;clearOldCaches(root);
  const query=function(center,radius,bounds){return websimQuery(center,radius,bounds);};query.__websimRelevant=true;query.__websimOriginalZip=true;PD.query=query;
  if(!PD.filter.__websimOriginalZip){const baseFilter=PD.filter.bind(PD);PD.filter=function(list,cfg,context,hours){return baseFilter(list,cfg,context,hours).filter(place=>placeRelevant(place,root.PizzaRatingsUI));};PD.filter.__websimOriginalZip=true;}
  /* Name-based Italian venues from the strengthened query must survive the base
   * normalizer without inventing cuisine metadata. The query itself is already
   * bounded to pizza/Italian candidate families, so allowNamed is safe here. */
  if(typeof PD.fromOverpass==='function'&&!PD.fromOverpass.__websimDense){const baseFromOverpass=PD.fromOverpass.bind(PD);PD.fromOverpass=function(elements,options={}){const dense=Array.isArray(elements)&&elements.some(eligibleElement);return baseFromOverpass(elements,dense?{...options,allowNamed:true}:options).filter(p=>!dense||placeRelevant(p,root.PizzaRatingsUI));};PD.fromOverpass.__websimDense=true;}
  wrapOverpass(PD.Service?.prototype);if(root.placeService)wrapOverpass(root.placeService);
  if(PD.TYPES?.other)PD.TYPES.other={...PD.TYPES.other,emoji:'🍝',name:'Italienisch / Pizza-relevant'};
  if(PD.TYPES?.pizzeria)PD.TYPES.pizzeria={...PD.TYPES.pizzeria,emoji:'🍕',name:'Pizzeria / Pizza-Ort'};
  root.PizzaScanSmartDiscovery={marker:MARKER,mode:'websim-dense-complete',query:QUERY_MARKER,originalZip:true,viewportBbox:true,genericRestaurantsVisible:false,photonAmbientFallback:true,reviewEvidence:true,menuEvidence:true,mergeProviders:true,providers:PROVIDERS.slice()};
}
return {MARKER,QUERY_MARKER,PIZZA,ITALIAN,ITALIAN_NAME,FOOD_AMENITIES,FOOD_SHOPS,FOCUSED_TERMS,FOCUSED_TARGET,FOCUSED_MAX_CALLS,PROVIDERS,RECOVERY_PROVIDERS,text,directPizzaEvidence,pizzaMenuEvidence,pizzaCommentEvidence,pizzaText,italianEvidence,plausibleFoodObject,originalWebsimTags,websimBaselineTags,deepEvidenceTags,eligibleElement,reviewPizzaMentions,placeRelevant,strongPizzaPlace,italianCandidate,classifyPlace,validBounds,area,triplet,websimQuery,strictQuery,isWebsimDiscoveryQuery,isStrictDiscoveryQuery,mergeElements,filterCandidates,relevantCount,googleReviewHasPizza,queryAreaInfo,inside,focusedElement,focusedRecovery,preciseProviderRecovery,bypassLegacyFallback,firstOriginalProvider,wrapOverpass,clearOldCaches,install};
});