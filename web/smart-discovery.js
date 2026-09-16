/* PizzaScan 2.3.5: original WebSim-style pizza discovery, with evidence-only deep additions.
 * The ambient map is intentionally NOT a generic restaurant map. It starts from
 * the original WebSim OSM families (pizza + Italian + relevant food venue types)
 * and only admits ordinary restaurants when actual pizza evidence exists.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaSmartDiscovery=api;api.install(root);}
})(globalThis,function(){
'use strict';

const MARKER='pizzascan-smart-discovery-v9';
const SEARCH_FAMILY='pizzascan:search_family';
const PIZZA=/(?:^|[^a-z])(pizza|pizzeria|pizzaria|pizzerie|pizze|pizzas|pizzaplace|pizza[ _-]?place)(?:[^a-z]|$)/i;
const ITALIAN=/(?:^|[^a-z])(italian|italiano|italiana|italia|ristorante|trattoria|osteria|italiener|italienisch)(?:[^a-z]|$)/i;
const FOOD_AMENITIES=new Set(['restaurant','fast_food','cafe','food_truck','takeaway','food_court','bar','pub','biergarten']);
const FOOD_SHOPS=new Set(['bakery','deli','convenience']);
const FOCUSED_TERMS=['pizzeria','pizza','italian restaurant','italienisches restaurant','ristorante','trattoria','osteria','pizza cafe','pizza fast food','pizza takeaway','pizza pub','pizza bar','pizza bakery','pizza bakeshop','pizza food truck','pizza vending'];
const FOCUSED_TARGET=8;
const FOCUSED_MAX_CALLS=8;
const RECOVERY_PROVIDERS=['https://maps.mail.ru/osm/tools/overpass/api/interpreter','https://overpass.osm.jp/api/interpreter'];
const CONFLICT_CUISINE=/(?:^|[;,\s])(asian|chinese|japanese|thai|vietnamese|korean|indian|sushi|ramen|kebab|doner|doener|döner|burger|steak)(?:$|[;,\s])/i;
const CONFLICT_NAME=/(?:\basia\b|\basian\b|\bsushi\b|\bramen\b|\bthai\b|\bbangkok\b|\bchina\b|\bchinese\b|\bmongol|\bindia\b|\bindian\b|\btandoori\b|\bkebab\b|\bdöner\b|\bdoener\b|\bburger\b|\bsteak\b|\bblock house\b|\bpoke\s*bowl\b|\bfuji sushi\b)/i;

function text(value){return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').toLowerCase();}
function fields(tags={},keys=[]){return keys.map(k=>tags[k]).filter(Boolean).join(' ');}
function isUrlLike(value){return /^\s*(?:https?:\/\/|www\.)/i.test(String(value||''));}
function nonUrlFields(tags={},keys=[]){return keys.map(k=>tags[k]).filter(v=>v&&!isUrlLike(v)).join(' ');}
function searchFamily(tags={}){return text(tags[SEARCH_FAMILY]||'');}
function directPizzaEvidence(tags={}){
  if(tags['vending:pizza']==='yes')return true;
  return PIZZA.test(text(fields(tags,['name','cuisine','brand','operator','speciality','vending','product','products'])));
}
function pizzaMenuEvidence(tags={}){
  if(PIZZA.test(text(fields(tags,['product','products']))))return true;
  return PIZZA.test(text(nonUrlFields(tags,['menu','website:menu','contact:menu'])));
}
function pizzaCommentEvidence(tags={}){return PIZZA.test(text(fields(tags,['description','description:de','description:en','description:it','description:es','description:fr','note','note:de','note:en'])));}
function pizzaText(tags={}){return directPizzaEvidence(tags)||pizzaMenuEvidence(tags)||pizzaCommentEvidence(tags);}
function italianEvidence(tags={}){return ITALIAN.test(text(fields(tags,['cuisine','name','brand','operator'])));}
function plausibleFoodObject(tags={}){
  const amenity=text(tags.amenity||''),shop=text(tags.shop||'');
  if(FOOD_AMENITIES.has(amenity)||amenity==='vending_machine'||FOOD_SHOPS.has(shop))return true;
  if(amenity||shop)return false;
  return !(tags.tourism||tags.leisure||tags.healthcare||tags.office||tags.aeroway||tags.railway||tags.public_transport||tags.historic);
}
function conflictingFoodIdentity(tags={}){
  if(directPizzaEvidence(tags)||italianEvidence(tags))return false;
  return CONFLICT_CUISINE.test(text(tags.cuisine||''))||CONFLICT_NAME.test(text(tags.name||''));
}
function semanticFamilyCandidate(tags={}){
  const family=searchFamily(tags);
  return (family==='italian'||family==='pizza')&&plausibleFoodObject(tags)&&!conflictingFoodIdentity(tags);
}
function websimBaselineTags(tags={}){
  const amenity=text(tags.amenity||''),shop=text(tags.shop||'');
  if(directPizzaEvidence(tags)&&plausibleFoodObject(tags))return true;
  if(amenity==='restaurant'&&italianEvidence(tags))return true;
  if(['cafe','fast_food','food_truck','bar','pub','biergarten','takeaway','food_court'].includes(amenity)&&/pizza|pizzeria|italian|italiano|italiana/i.test(text(tags.cuisine||'')))return true;
  if(FOOD_SHOPS.has(shop)&&(directPizzaEvidence(tags)||italianEvidence(tags)))return true;
  if(pizzaCommentEvidence(tags)&&plausibleFoodObject(tags))return true;
  /* Photon often returns only amenity/name for a text hit and drops cuisine.
   * Keep the semantic search family as candidate metadata instead of fabricating
   * cuisine=italian/pizza. Strong contradictory identities are still rejected. */
  if(semanticFamilyCandidate(tags))return true;
  return false;
}
function deepEvidenceTags(tags={}){
  if(!plausibleFoodObject(tags))return false;
  return pizzaMenuEvidence(tags)||pizzaCommentEvidence(tags);
}
function eligibleElement(element){const tags=element?.tags||{};return websimBaselineTags(tags)||deepEvidenceTags(tags);}
function reviewPizzaMentions(place,ratingsUI=globalThis.PizzaRatingsUI){
  try{return Number(ratingsUI?.summary?.(place)?.pizzaMentions||0)>0;}catch{return false;}
}
function placeTags(place){
  const tags={...(place?.tags||{})};
  if(place?.name&&!tags.name)tags.name=place.name;
  if(place?.cuisine&&!tags.cuisine)tags.cuisine=place.cuisine;
  if(place?.description&&!tags.description)tags.description=place.description;
  if(place?.menu&&!tags.menu)tags.menu=place.menu;
  return tags;
}
function placeRelevant(place,ratingsUI=globalThis.PizzaRatingsUI){
  if(!place)return false;
  const tags=placeTags(place);
  if(place.pizzaEvidenceSource==='google-review-session')return true;
  return websimBaselineTags(tags)||deepEvidenceTags(tags)||reviewPizzaMentions(place,ratingsUI);
}
function strongPizzaPlace(place){
  if(!place)return false;
  const tags=placeTags(place);
  if(place.pizzaEvidenceSource==='google-review-session')return true;
  return directPizzaEvidence(tags)||pizzaMenuEvidence(tags)||pizzaCommentEvidence(tags)||reviewPizzaMentions(place);
}
function italianCandidate(place){const tags=placeTags(place);return italianEvidence(tags)||searchFamily(tags)==='italian';}
function classifyPlace(place){
  const t=place?.tags||{},amenity=text(t.amenity||'');
  if(t['vending:pizza']==='yes'||PIZZA.test(text(t.vending||'')))return 'vending_pizza';
  if(amenity==='cafe')return 'cafe';
  if(amenity==='food_truck'||t.mobile==='yes')return 'food_truck';
  if(amenity==='fast_food'||amenity==='takeaway')return 'fast_food';
  if(strongPizzaPlace(place))return 'pizzeria';
  return 'other';
}
function area(center,radius,bounds){
  if(radius)return `around:${Math.round(Math.min(10,Math.max(.5,Number(radius)||.5))*1000)},${center.lat},${center.lng}`;
  return [bounds.south,bounds.west,bounds.north,bounds.east].join(',');
}
function websimQuery(center,radius,bounds){
  const a=area(center,radius,bounds);
  return `[out:json][timeout:24];(/* pizzascan-websim-search-v9 */`+
    `nwr["cuisine"~"pizza|pizzeria",i](${a});`+
    `nwr["amenity"="restaurant"]["cuisine"~"italian|italiano|italiana",i](${a});`+
    `nwr["amenity"="restaurant"]["name"~"pizza|pizzeria|pizzaria|pizze|ristorante|trattoria|osteria|italian|italiano|italiana|italien",i](${a});`+
    `nwr["amenity"~"cafe|fast_food|food_truck|takeaway|food_court"]["cuisine"~"pizza|pizzeria|italian|italiano|italiana",i](${a});`+
    `nwr["amenity"~"bar|pub|biergarten"]["cuisine"~"pizza|pizzeria|italian|italiano|italiana",i](${a});`+
    `nwr["amenity"~"bar|pub|biergarten"]["name"~"pizza|pizzeria|pizzaria|pizza pub|pizza bar|italian|italien|ristorante|trattoria|osteria",i](${a});`+
    `nwr["shop"~"bakery|deli"]["name"~"pizza|pizzeria|pizzaria|pizzaplace|pizza place|italian|italiano|italiana|italien",i](${a});`+
    `nwr["shop"~"bakery|deli"]["product"~"pizza",i](${a});`+
    `nwr["shop"~"bakery|deli"]["cuisine"~"pizza|italian|italiano|italiana",i](${a});`+
    `nwr["speciality"~"pizza",i](${a});`+
    `nwr["name"~"pizza|pizzeria|pizzaria|pizzerie|pizze|pizzaplace|pizza place",i](${a});`+
    `nwr["description"~"pizza",i](${a});`+
    `nwr["note"~"pizza",i](${a});`+
    `nwr["menu"~"pizza",i](${a});`+
    `nwr["product"~"pizza",i](${a});nwr["products"~"pizza",i](${a});`+
    `nwr["vending"~"pizza",i](${a});nwr["vending:pizza"="yes"](${a});`+
    `);out body center;`;
}
const strictQuery=websimQuery;
function isWebsimDiscoveryQuery(query){return String(query||'').includes('pizzascan-websim-search-v9');}
const isStrictDiscoveryQuery=isWebsimDiscoveryQuery;
function mergeElements(...groups){const out=new Map();for(const group of groups)for(const e of group||[])if(e&&['node','way','relation'].includes(e.type)&&e.id!=null)out.set(`${e.type}-${e.id}`,e);return [...out.values()];}
function filterCandidates(elements){return (elements||[]).filter(eligibleElement);}
function relevantCount(elements){return filterCandidates(elements).length;}
function googleReviewHasPizza(container){return [...(container?.querySelectorAll?.('*')||[])].some(node=>PIZZA.test(text(node?.textContent||'')));}
function queryAreaInfo(query){
  const q=String(query||'');let m=/around:(\d+),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(q);
  if(m)return {center:{lat:Number(m[2]),lng:Number(m[3])},radius:Math.max(.5,Number(m[1])/1000)};
  m=/\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\)/.exec(q);
  if(!m)return null;const south=Number(m[1]),west=Number(m[2]),north=Number(m[3]),east=Number(m[4]);
  return {center:{lat:(south+north)/2,lng:(west+east)/2},radius:10,bounds:{south,west,north,east}};
}
function inside(info,p){
  if(!info||!p)return false;if(info.bounds){const b=info.bounds;return p.lat>=b.south&&p.lat<=b.north&&(b.west<=b.east?p.lng>=b.west&&p.lng<=b.east:p.lng>=b.west||p.lng<=b.east);}
  const dy=(Number(p.lat)-info.center.lat)*111.32,dx=(Number(p.lng)-info.center.lng)*111.32*Math.cos(info.center.lat*Math.PI/180);return Math.hypot(dx,dy)<=Math.min(10,info.radius*1.15);
}
function familyForTerm(term){
  const t=text(term);
  if(/italian restaurant|italienisches restaurant|ristorante|trattoria|osteria/.test(t))return 'italian';
  if(/pizza|pizzeria/.test(t))return 'pizza';
  return '';
}
function focusedElement(item,term=''){
  const p=item?.place,m=/^(node|way|relation)-(\d+)$/.exec(p?.placeId||'');if(!p||!m)return null;
  const tags={...(p.tags||{}),name:p.name||item.name||''},family=familyForTerm(term);
  if(family&&!directPizzaEvidence(tags)&&!italianEvidence(tags))tags[SEARCH_FAMILY]=family;
  const element={type:m[1],id:Number(m[2]),lat:p.lat,lon:p.lng,tags};
  return eligibleElement(element)?element:null;
}
async function focusedRecovery(service,query,options={},seed=[]){
  const info=queryAreaInfo(query);if(!info||typeof service?.photon!=='function')return filterCandidates(seed);
  let elements=filterCandidates(mergeElements(seed));if(relevantCount(elements)>=FOCUSED_TARGET)return elements;
  options.onStatus?.('Weitere Pizzerien, Italiener, Ristoranti und Trattorien werden gesucht …');
  for(const term of FOCUSED_TERMS.slice(0,FOCUSED_MAX_CALLS)){
    if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    try{
      const items=await service.photon(term,info.center,{signal:options.signal}),extra=[];
      for(const item of items||[]){const e=focusedElement(item,term);if(e&&inside(info,{lat:e.lat,lng:e.lon}))extra.push(e);}
      elements=filterCandidates(mergeElements(elements,extra));
      if(relevantCount(elements)>=FOCUSED_TARGET)break;
    }catch(error){if(options.signal?.aborted)throw error;}
  }
  return elements;
}
async function preciseProviderRecovery(service,query,options={},seed=[]){
  let elements=filterCandidates(mergeElements(seed)),sources=[];
  if(typeof service?.json!=='function')return {elements,sources};
  for(const endpoint of RECOVERY_PROVIDERS){
    if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    try{
      options.onStatus?.('Weitere OpenStreetMap-Quelle für Pizza & Italiener wird geprüft …');
      const data=await service.json(endpoint,{method:'POST',body:new URLSearchParams({data:query})},options.signal,18000);
      if(Array.isArray(data?.elements)&&!data.remark){elements=filterCandidates(mergeElements(elements,data.elements));if(data.elements.length)sources.push(new URL(endpoint).hostname);}
      if(relevantCount(elements)>=FOCUSED_TARGET)break;
    }catch(error){if(options.signal?.aborted)throw error;}
  }
  return {elements,sources};
}
function bypassLegacyFallback(target){
  if(!target||typeof target.nearbyFallback!=='function'||target.nearbyFallback.__websimBypass)return false;
  const legacy=target.nearbyFallback;
  const bypass=async function(_query,{signal}={}){if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');return [];};
  bypass.__websimBypass=true;bypass.__websimLegacy=legacy;target.nearbyFallback=bypass;return true;
}
function wrapOverpass(target){
  if(!target||typeof target.overpass!=='function'||target.overpass.__websimFocused)return false;
  bypassLegacyFallback(target);
  const base=target.overpass;
  const wrapped=async function(query,options={}){
    let result=null,baseError=null;
    try{result=await base.call(this,query,options);}catch(error){baseError=error;if(options.signal?.aborted)throw error;}
    if(!isWebsimDiscoveryQuery(query)){if(result)return result;throw baseError;}
    let elements=filterCandidates(result?.data?.elements||[]),sources=[result?.source].filter(Boolean);
    if(relevantCount(elements)<FOCUSED_TARGET){
      try{const recovered=await preciseProviderRecovery(this,query,options,elements);elements=recovered.elements;sources=sources.concat(recovered.sources);}catch(error){if(options.signal?.aborted)throw error;}
    }
    if(relevantCount(elements)<FOCUSED_TARGET){
      try{elements=await focusedRecovery(this,query,options,elements);if(elements.length)sources.push('photon.komoot.io');}catch(error){if(options.signal?.aborted)throw error;}
    }
    if(elements.length)return {data:{...(result?.data||{}),elements},source:[...new Set(sources.filter(Boolean))].join(' + ')||'WebSim pizza discovery'};
    if(baseError)throw baseError;
    return {data:{...(result?.data||{}),elements:[]},source:result?.source||''};
  };
  wrapped.__websimFocused=true;wrapped.__websimFocusedInner=base;target.overpass=wrapped;return true;
}
function clearOldCaches(root){
  try{
    if(!root.localStorage||root.localStorage.getItem(MARKER))return;
    root.localStorage.removeItem('pizzascan-map-cache-v3');
    root.localStorage.removeItem('pizzascan-map-cache-v2');
    root.localStorage.removeItem('pizzascan-smart-discovery-v8');
    root.localStorage.removeItem('pizzascan-smart-discovery-v7');
    root.localStorage.removeItem('pizzascan-smart-discovery-v6');
    for(let i=root.localStorage.length-1;i>=0;i--){const k=root.localStorage.key(i);if(k?.startsWith('pizzascan-search-')||k?.startsWith('pizzascan-nearby-photon-'))root.localStorage.removeItem(k);}
    root.localStorage.setItem(MARKER,'1');
  }catch{}
}
function install(root){
  const PD=root.PizzaPlaces;if(!PD)return;clearOldCaches(root);
  const query=function(center,radius,bounds){return websimQuery(center,radius,bounds);};query.__websimRelevant=true;PD.query=query;
  if(!PD.filter.__websimRelevant){const baseFilter=PD.filter.bind(PD);PD.filter=function(list,cfg,context,hours){return baseFilter(list,cfg,context,hours).filter(place=>placeRelevant(place,root.PizzaRatingsUI));};PD.filter.__websimRelevant=true;}
  wrapOverpass(PD.Service?.prototype);
  if(root.placeService)wrapOverpass(root.placeService);
  if(PD.TYPES?.other)PD.TYPES.other={...PD.TYPES.other,emoji:'🍝',name:'Italiener / Pizza-Kandidat'};
  if(PD.TYPES?.pizzeria)PD.TYPES.pizzeria={...PD.TYPES.pizzeria,emoji:'🍕',name:'Pizzeria / Pizza-Ort'};
  root.PizzaScanSmartDiscovery={marker:MARKER,mode:'original-websim-families',query:'websim-original-plus-semantic-recovery-menu-review-evidence',focusedFallback:true,preciseProviderRecovery:true,legacyGenericFallback:false,genericRestaurantsVisible:false,reviewEvidence:true,menuEvidence:true,semanticCandidateFamilies:true,prototypeRecovery:true};
}
return {MARKER,SEARCH_FAMILY,PIZZA,ITALIAN,FOOD_AMENITIES,FOOD_SHOPS,FOCUSED_TERMS,FOCUSED_TARGET,FOCUSED_MAX_CALLS,RECOVERY_PROVIDERS,CONFLICT_CUISINE,CONFLICT_NAME,text,searchFamily,directPizzaEvidence,pizzaMenuEvidence,pizzaCommentEvidence,pizzaText,italianEvidence,plausibleFoodObject,conflictingFoodIdentity,semanticFamilyCandidate,websimBaselineTags,deepEvidenceTags,eligibleElement,reviewPizzaMentions,placeTags,placeRelevant,strongPizzaPlace,italianCandidate,classifyPlace,area,websimQuery,strictQuery,isWebsimDiscoveryQuery,isStrictDiscoveryQuery,mergeElements,filterCandidates,relevantCount,googleReviewHasPizza,queryAreaInfo,inside,familyForTerm,focusedElement,focusedRecovery,preciseProviderRecovery,bypassLegacyFallback,wrapOverpass,clearOldCaches,install};
});