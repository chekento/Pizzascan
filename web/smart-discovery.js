/* PizzaScan 2.3.5: precise, resilient pizza discovery.
 * Nearby discovery keeps the original WebSim pizza/Italian baseline, excludes
 * obviously incompatible cuisines, and falls back to pizza-specific Photon data
 * instead of failing the whole map when Overpass is unavailable. Manual POI and
 * detail queries keep using the normal broad service pipeline. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaSmartDiscovery=api;api.install(root);}
})(globalThis,function(){
'use strict';

const MARKER='pizzascan-smart-discovery-v3';
const PIZZA=/(?:^|[^a-z])(pizza|pizzeria|pizzaria|pizzerie|pizze|pizzas)(?:[^a-z]|$)/i;
const ITALIAN=/(?:^|[^a-z])(italian|italiano|italiana)(?:[^a-z]|$)/i;
const ITALIAN_NAME=/(?:^|[^a-z])(ristorante|trattoria|osteria|italiener|italienisch|italian|italiano|italiana)(?:[^a-z]|$)/i;
const INCOMPATIBLE=/(?:^|[^a-z])(asian|chinese|japanese|thai|vietnamese|korean|indian|sushi|ramen|nepalese|indonesian|malaysian|filipino|pakistani|bangladeshi|sri[_ -]?lankan|mongolian|cantonese|sichuan|dim[_ -]?sum)(?:[^a-z]|$)/i;
const FOOD_AMENITIES=new Set(['restaurant','fast_food','cafe','food_truck','takeaway','food_court','bar','pub','biergarten']);
const FOOD_SHOPS=new Set(['deli','bakery','convenience']);
const PROVIDERS=[
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.osm.jp/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];
const PHOTON_TAGS=['cuisine:pizza','cuisine:italian'];
const PHOTON_TERMS=['pizza','pizzeria','ristorante','trattoria','osteria','italian restaurant','italienisches restaurant'];

function text(value){return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').toLowerCase();}
function fields(tags={},keys=[]){return keys.map(k=>tags[k]).filter(Boolean).join(' ');}
function cuisine(tags={}){return text(tags.cuisine||'');}
function pizzaCuisine(tags={}){return PIZZA.test(cuisine(tags));}
function italianCuisine(tags={}){return ITALIAN.test(cuisine(tags));}
function incompatibleCuisine(tags={}){return !pizzaCuisine(tags)&&INCOMPATIBLE.test(cuisine(tags));}
function italianNameEvidence(tags={}){return ITALIAN_NAME.test(text(fields(tags,['name','brand','operator'])));}
function isUrlLike(value){return /^\s*(?:https?:\/\/|www\.)/i.test(String(value||''));}
function nonUrlFields(tags={},keys=[]){return keys.map(k=>tags[k]).filter(v=>v&&!isUrlLike(v)).join(' ');}
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
function isPizzaVending(tags={}){return tags['vending:pizza']==='yes'||PIZZA.test(text(tags.vending||''));}
function plausibleFoodObject(tags={}){
  const amenity=text(tags.amenity||''),shop=text(tags.shop||'');
  if(FOOD_AMENITIES.has(amenity)||amenity==='vending_machine'||FOOD_SHOPS.has(shop)||isPizzaVending(tags))return true;
  if(amenity)return false;
  if(shop&&!FOOD_SHOPS.has(shop))return false;
  if(tags.tourism||tags.leisure||tags.healthcare||tags.office||tags.aeroway||tags.railway||tags.public_transport||tags.historic)return false;
  return true;
}
function websimBaselineTags(tags={}){
  const amenity=text(tags.amenity||''),direct=directPizzaEvidence(tags),conflict=incompatibleCuisine(tags);
  if(isPizzaVending(tags))return true;
  if(direct&&plausibleFoodObject(tags))return true;
  if(conflict)return false;
  if(amenity==='restaurant'&&(italianCuisine(tags)||italianNameEvidence(tags)))return true;
  if(['cafe','fast_food','food_truck','takeaway'].includes(amenity)&&italianCuisine(tags))return true;
  if(['bar','pub'].includes(amenity)&&italianCuisine(tags))return true;
  if(pizzaCommentEvidence(tags)&&plausibleFoodObject(tags))return true;
  return false;
}
function supplementalEvidenceTags(tags={}){
  const amenity=text(tags.amenity||''),food=FOOD_AMENITIES.has(amenity)||FOOD_SHOPS.has(text(tags.shop||''));
  if(!food)return false;
  if(directPizzaEvidence(tags))return true;
  if(incompatibleCuisine(tags))return false;
  return pizzaMenuEvidence(tags)||pizzaCommentEvidence(tags);
}
function eligibleElement(element){const tags=element?.tags||{};return websimBaselineTags(tags)||supplementalEvidenceTags(tags);}
function evidenceKind(tags={}){
  if(isPizzaVending(tags))return 'vending';
  if(directPizzaEvidence(tags))return 'pizza';
  if(incompatibleCuisine(tags))return '';
  if(pizzaMenuEvidence(tags))return 'menu';
  if(pizzaCommentEvidence(tags))return 'comment';
  if(websimBaselineTags(tags))return 'websim';
  return '';
}
function promoteElement(element){
  if(!element||!element.tags)return element;
  const kind=evidenceKind(element.tags);if(!kind)return element;
  const tags={...element.tags,'pizzascan:evidence':kind};
  const coreDirect=PIZZA.test(text(fields(tags,['name','cuisine','brand','vending','speciality'])));
  if(!incompatibleCuisine(tags)&&(pizzaMenuEvidence(tags)||pizzaCommentEvidence(tags)||PIZZA.test(text(fields(tags,['product','products']))))&&!coreDirect)tags.speciality=[tags.speciality,'pizza'].filter(Boolean).join(';');
  return {...element,tags};
}
function strongPizzaPlace(place){
  const tags={...(place?.tags||{})};
  if(place?.name&&!tags.name)tags.name=place.name;
  if(place?.cuisine&&!tags.cuisine)tags.cuisine=place.cuisine;
  if(place?.description&&!tags.description)tags.description=place.description;
  if(place?.menu&&!tags.menu)tags.menu=place.menu;
  if(place?.pizzaEvidenceSource==='google-review-session')return true;
  if(directPizzaEvidence(tags)||isPizzaVending(tags))return true;
  return !incompatibleCuisine(tags)&&(pizzaMenuEvidence(tags)||pizzaCommentEvidence(tags));
}
function classifyPlace(place){
  const t=place?.tags||{},amenity=text(t.amenity||'');
  if(isPizzaVending(t))return 'vending_pizza';
  if(amenity==='cafe')return 'cafe';
  if(amenity==='food_truck'||t.mobile==='yes')return 'food_truck';
  if(amenity==='fast_food'||amenity==='takeaway')return 'fast_food';
  if(amenity==='restaurant'&&strongPizzaPlace(place))return 'pizzeria';
  return 'other';
}

function area(center,radius,bounds){
  if(radius)return `around:${Math.round(Math.min(10,Math.max(.5,Number(radius)||.5))*1000)},${center.lat},${center.lng}`;
  return [bounds.south,bounds.west,bounds.north,bounds.east].join(',');
}
function strictQuery(center,radius,bounds){
  const a=area(center,radius,bounds);
  return `[out:json][timeout:24];(`+
    `nwr["cuisine"~"pizza|pizzeria",i](${a});`+
    `nwr["amenity"="restaurant"]["cuisine"~"pizza|pizzeria|italian|italiano|italiana",i](${a});`+
    `nwr["amenity"="restaurant"]["name"~"pizza|pizzeria|pizzaria|ristorante|trattoria|osteria|italien",i](${a});`+
    `nwr["amenity"~"cafe|fast_food|food_truck|takeaway"]["cuisine"~"pizza|pizzeria|italian|italiano|italiana",i](${a});`+
    `nwr["amenity"~"bar|pub"]["cuisine"~"pizza|pizzeria|italian|italiano|italiana",i](${a});`+
    `nwr["speciality"~"pizza",i](${a});`+
    `nwr["name"~"pizza|pizzeria|pizzaria|pizzerie|pizze",i](${a});`+
    `nwr["description"~"pizza",i](${a});`+
    `nwr["note"~"pizza",i](${a});`+
    `nwr["product"~"pizza",i](${a});nwr["products"~"pizza",i](${a});`+
    `nwr["menu"~"pizza",i](${a});`+
    `nwr["amenity"="vending_machine"]["vending"~"pizza",i](${a});nwr["vending"~"pizza",i](${a});nwr["vending:pizza"="yes"](${a});`+
    `);out body center;`;
}
function isStrictDiscoveryQuery(query){const q=String(query||'');return q.includes('["speciality"~"pizza"')&&q.includes('["note"~"pizza"')&&q.includes('["menu"~"pizza"')&&q.includes('["vending:pizza"="yes"]');}
function queryArea(query){
  const q=String(query||'');
  let m=/around:(\d+),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(q);
  if(m)return {center:{lat:Number(m[2]),lng:Number(m[3])},radius:Math.max(.5,Math.min(10,Number(m[1])/1000))};
  m=/\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\)/.exec(q);
  if(!m)return null;
  const south=Number(m[1]),west=Number(m[2]),north=Number(m[3]),east=Number(m[4]);
  return {center:{lat:(south+north)/2,lng:(west+east)/2},radius:10,bounds:{south,west,north,east}};
}
function inside(info,lat,lng){
  if(info?.bounds){const b=info.bounds;return lat>=b.south&&lat<=b.north&&(b.west<=b.east?lng>=b.west&&lng<=b.east:lng>=b.west||lng<=b.east);}
  const dy=(lat-info.center.lat)*111.32,dx=(lng-info.center.lng)*111.32*Math.cos(info.center.lat*Math.PI/180);
  return Math.hypot(dx,dy)<=Math.min(10,info.radius*1.15);
}
function mergeElements(...groups){const out=new Map();for(const group of groups)for(const e of group||[])if(e&&['node','way','relation'].includes(e.type)&&e.id!=null)out.set(`${e.type}-${e.id}`,e);return [...out.values()];}
function photonTagUrl(tag,center){const u=new URL('https://photon.komoot.io/reverse');u.search=new URLSearchParams({lon:String(center.lng),lat:String(center.lat),osm_tag:tag,limit:'50',lang:'de'});return u.href;}
function photonTagElements(data,tag,info){
  const [filterKey,filterValue]=String(tag).split(':');if(!Array.isArray(data?.features))return [];
  return data.features.flatMap(feature=>{
    const p=feature?.properties||{},coords=feature?.geometry?.coordinates||[],lng=Number(coords[0]),lat=Number(coords[1]);
    const type={N:'node',W:'way',R:'relation',node:'node',way:'way',relation:'relation'}[p.osm_type],id=Number(p.osm_id);
    if(!type||!Number.isInteger(id)||id<=0||!Number.isFinite(lat)||!Number.isFinite(lng)||!p.name||!inside(info,lat,lng))return [];
    const tags={name:p.name,amenity:p.osm_key==='amenity'?p.osm_value||'restaurant':'restaurant'};if(p.osm_key)tags[p.osm_key]=p.osm_value||'';if(filterKey&&filterValue)tags[filterKey]=filterValue;
    const element={type,id,lat,lon:lng,tags};return eligibleElement(element)?[element]:[];
  });
}
function photonItemElement(item,info){
  const p=item?.place,m=/^(node|way|relation)-(\d+)$/.exec(p?.placeId||'');if(!p||!m||!Number.isFinite(p.lat)||!Number.isFinite(p.lng)||!inside(info,p.lat,p.lng))return null;
  const tags={...(p.tags||{}),name:p.name||item.name||''};if(!tags.amenity&&!tags.shop)tags.amenity='restaurant';if(italianNameEvidence(tags)&&!italianCuisine(tags))tags.cuisine=[tags.cuisine,'italian'].filter(Boolean).join(';');
  const element={type:m[1],id:Number(m[2]),lat:p.lat,lon:p.lng,tags};return eligibleElement(element)?element:null;
}
async function precisePhotonFallback(service,query,{signal,onStatus}={}){
  const info=queryArea(query);if(!info)return [];if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');onStatus?.('Alternative Pizza- und Italiener-Suche wird geladen …');
  const tagResults=await Promise.allSettled(PHOTON_TAGS.map(async tag=>{const data=await service.json(photonTagUrl(tag,info.center),{},signal,9000);return photonTagElements(data,tag,info);}));
  let elements=mergeElements(...tagResults.filter(x=>x.status==='fulfilled').map(x=>x.value));if(elements.length>=6)return elements;
  for(const term of PHOTON_TERMS){if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');try{const items=await service.photon(term,info.center,{signal});elements=mergeElements(elements,(items||[]).map(item=>photonItemElement(item,info)).filter(Boolean));if(elements.length>=8)break;}catch(error){if(signal?.aborted)throw error;}}
  return elements;
}
async function overpassCandidate(service,endpoint,query,options={},timeout=10000){
  if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');const data=await service.json(endpoint,{method:'POST',body:new URLSearchParams({data:query})},options.signal,timeout);
  if(!Array.isArray(data?.elements)||data.remark)throw new Error(data?.remark||'Unvollständige Kartendaten');const elements=data.elements.filter(eligibleElement);if(!elements.length)throw new Error('Keine plausiblen Pizza-POIs');return {data:{...data,elements},source:new URL(endpoint).hostname};
}
async function strictOverpass(service,query,{signal,onStatus}={}){
  const options={signal,onStatus},errors=[];onStatus?.('Pizza-Orte und Italiener werden geprüft …');
  try{return await Promise.any([
    overpassCandidate(service,PROVIDERS[0],query,options,10000),
    overpassCandidate(service,PROVIDERS[1],query,options,10000),
    precisePhotonFallback(service,query,options).then(elements=>{if(!elements.length)throw new Error('Keine passenden Photon-Treffer');return {data:{elements},source:'photon.komoot.io'};})
  ]);}catch(group){for(const e of group?.errors||[])errors.push({source:'primary',message:e?.message||String(e)});}
  onStatus?.('Weitere Pizza-Datenquelle wird geprüft …');
  try{return await Promise.any([overpassCandidate(service,PROVIDERS[2],query,options,13000),overpassCandidate(service,PROVIDERS[3],query,options,13000)]);}catch(group){for(const e of group?.errors||[])errors.push({source:'recovery',message:e?.message||String(e)});}
  service.lastErrors=errors;const error=new Error('Keine plausiblen Pizza-Orte aus den Kartenquellen erreichbar.');error.sources=errors;throw error;
}

function googleReviewHasPizza(panel){if(!panel)return false;return [...panel.querySelectorAll('.google-review-text,.google-review-original p')].some(node=>PIZZA.test(text(node.textContent||'')));}
function applyGoogleReviewEvidence(root,panel){
  if(!googleReviewHasPizza(panel))return false;const id=panel.dataset.googlePlace;if(!id)return false;let p=null;try{p=typeof root.placeById==='function'?root.placeById(id):null;}catch{}if(!p)return false;
  const updated={...p,pizzaEvidence:'confirmed',pizzaEvidenceSource:'google-review-session'};updated.type=classifyPlace(updated);try{if(typeof root.ingestPlace==='function')root.ingestPlace(updated);else Object.assign(p,updated);}catch{try{Object.assign(p,updated);}catch{}}panel.dataset.pizzaEvidence='review';return true;
}
function installGoogleObserver(root){if(typeof document==='undefined'||typeof MutationObserver==='undefined')return;const scan=()=>document.querySelectorAll('.google-reviews-panel[data-google-place]').forEach(panel=>applyGoogleReviewEvidence(root,panel));const start=()=>{scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();}
function clearStaleCaches(root){
  try{if(!root.localStorage||root.localStorage.getItem(MARKER))return;root.localStorage.removeItem('pizzascan-map-cache-v3');root.localStorage.removeItem('pizzascan-map-cache-v2');root.localStorage.removeItem('pizzascan-first-map-discovery-v1');root.localStorage.removeItem('pizzascan-first-map-discovery-v2');for(let i=root.localStorage.length-1;i>=0;i--){const k=root.localStorage.key(i);if(k?.startsWith('pizzascan-nearby-photon-')||k?.startsWith('pizzascan-search-'))root.localStorage.removeItem(k);}root.localStorage.setItem(MARKER,'1');}catch{}
}
function serviceFor(root){try{if(typeof placeService!=='undefined'&&placeService)return placeService;}catch{}return root.placeService||null;}
function install(root){
  const PD=root.PizzaPlaces;if(!PD)return;clearStaleCaches(root);PD.query=strictQuery;
  if(PD.TYPES){if(PD.TYPES.other)PD.TYPES.other.name='Restaurant / Bar / möglicher Pizza-Ort';if(PD.TYPES.fast_food)PD.TYPES.fast_food.name='Imbiss / Takeaway';}
  const service=serviceFor(root);
  if(service&&!service.overpass.__smartDiscovery){
    const upstream=service.overpass.bind(service);
    const bound=(query,options={})=>isStrictDiscoveryQuery(query)?strictOverpass(service,query,options):upstream(query,options);
    bound.__smartDiscovery=true;bound.__smartDiscoveryUpstream=upstream;service.overpass=bound;
  }
  installGoogleObserver(root);
}

return {MARKER,PIZZA,ITALIAN,ITALIAN_NAME,INCOMPATIBLE,PROVIDERS,PHOTON_TAGS,PHOTON_TERMS,text,pizzaCuisine,italianCuisine,incompatibleCuisine,italianNameEvidence,isUrlLike,directPizzaEvidence,pizzaText,pizzaMenuEvidence,pizzaCommentEvidence,isPizzaVending,plausibleFoodObject,websimBaselineTags,supplementalEvidenceTags,eligibleElement,evidenceKind,promoteElement,strongPizzaPlace,classifyPlace,strictQuery,isStrictDiscoveryQuery,queryArea,inside,mergeElements,photonTagUrl,photonTagElements,photonItemElement,precisePhotonFallback,overpassCandidate,strictOverpass,googleReviewHasPizza,applyGoogleReviewEvidence,clearStaleCaches,install};
});
