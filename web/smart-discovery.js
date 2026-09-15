/* PizzaScan 2.3.5: WebSim-first pizza discovery.
 * Ambient markers are limited to WebSim-style pizza/Italian venues plus places
 * with actual pizza evidence from menu/description/reviews. Generic restaurants
 * may be fetched as hidden candidates for deeper review evidence, but are never
 * shown merely because they are restaurants.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaSmartDiscovery=api;api.install(root);}
})(globalThis,function(){
'use strict';

const MARKER='pizzascan-smart-discovery-v5';
const PIZZA=/(?:^|[^a-z])(pizza|pizzeria|pizzaria|pizzerie|pizze|pizzas|pizzaplace|pizza[ _-]?place)(?:[^a-z]|$)/i;
const ITALIAN=/(?:^|[^a-z])(italian|italiano|italiana|ristorante|trattoria|osteria|italiener|italienisch)(?:[^a-z]|$)/i;
const FOOD_AMENITIES=new Set(['restaurant','fast_food','cafe','food_truck','takeaway','food_court','bar','pub','biergarten']);
const FOOD_SHOPS=new Set(['bakery','deli','convenience']);

function text(value){return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').toLowerCase();}
function fields(tags={},keys=[]){return keys.map(k=>tags[k]).filter(Boolean).join(' ');}
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
function italianEvidence(tags={}){return ITALIAN.test(text(fields(tags,['cuisine','name','brand','operator'])));}
function plausibleFoodObject(tags={}){
  const amenity=text(tags.amenity||''),shop=text(tags.shop||'');
  if(FOOD_AMENITIES.has(amenity)||amenity==='vending_machine'||FOOD_SHOPS.has(shop))return true;
  if(amenity||shop)return false;
  return !(tags.tourism||tags.leisure||tags.healthcare||tags.office||tags.aeroway||tags.railway||tags.public_transport||tags.historic);
}

/* Original WebSim families: pizza/pizzeria tags, Italian restaurants,
 * Trattoria/Ristorante/Osteria names, pizza/Italian cafe/fast-food/food-truck,
 * pizza pubs/bars/takeaway, pizza speciality/name/description and vending. */
function websimBaselineTags(tags={}){
  const amenity=text(tags.amenity||''),shop=text(tags.shop||'');
  if(directPizzaEvidence(tags)&&plausibleFoodObject(tags))return true;
  if(amenity==='restaurant'&&italianEvidence(tags))return true;
  if(['cafe','fast_food','food_truck','bar','pub','takeaway'].includes(amenity)&&/pizza|pizzeria|italian|italiano|italiana/i.test(text(tags.cuisine||'')))return true;
  if(FOOD_SHOPS.has(shop)&&directPizzaEvidence(tags))return true;
  if(pizzaCommentEvidence(tags)&&plausibleFoodObject(tags))return true;
  return false;
}

/* Deeper evidence is deliberately strict: a normal restaurant becomes visible
 * only when pizza is actually present in structured menu/product text or an
 * explicit pizza description/note. A menu URL containing the word pizza is not
 * evidence by itself. Review-derived evidence is handled separately. */
function deepEvidenceTags(tags={}){
  if(!plausibleFoodObject(tags))return false;
  return pizzaMenuEvidence(tags)||pizzaCommentEvidence(tags);
}
function eligibleElement(element){const tags=element?.tags||{};return websimBaselineTags(tags)||deepEvidenceTags(tags);}
function reviewPizzaMentions(place,ratingsUI=globalThis.PizzaRatingsUI){
  try{return Number(ratingsUI?.summary?.(place)?.pizzaMentions||0)>0;}catch{return false;}
}
function placeRelevant(place,ratingsUI=globalThis.PizzaRatingsUI){
  if(!place)return false;
  const tags={...(place.tags||{})};
  if(place.name&&!tags.name)tags.name=place.name;
  if(place.cuisine&&!tags.cuisine)tags.cuisine=place.cuisine;
  if(place.description&&!tags.description)tags.description=place.description;
  if(place.menu&&!tags.menu)tags.menu=place.menu;
  if(place.pizzaEvidenceSource==='google-review-session')return true;
  return websimBaselineTags(tags)||deepEvidenceTags(tags)||reviewPizzaMentions(place,ratingsUI);
}
function strongPizzaPlace(place){
  if(!place)return false;
  const tags={...(place.tags||{})};
  if(place.name&&!tags.name)tags.name=place.name;
  if(place.cuisine&&!tags.cuisine)tags.cuisine=place.cuisine;
  if(place.description&&!tags.description)tags.description=place.description;
  if(place.menu&&!tags.menu)tags.menu=place.menu;
  if(place.pizzaEvidenceSource==='google-review-session')return true;
  return directPizzaEvidence(tags)||pizzaMenuEvidence(tags)||pizzaCommentEvidence(tags)||reviewPizzaMentions(place);
}
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
  return `[out:json][timeout:24];(/* pizzascan-websim-search-v5 */`+
    `nwr["cuisine"~"pizza|pizzeria",i](${a});`+
    `nwr["amenity"="restaurant"]["cuisine"~"italian|italiano|italiana",i](${a});`+
    `nwr["amenity"="restaurant"]["name"~"pizza|pizzeria|pizzaria|pizzaplace|pizza place|ristorante|trattoria|osteria|italian|italien",i](${a});`+
    `nwr["amenity"="restaurant"]["brand"~"pizza|pizzeria|ristorante|trattoria|osteria|italian",i](${a});`+
    `nwr["amenity"="restaurant"]["operator"~"pizza|pizzeria|ristorante|trattoria|osteria|italian",i](${a});`+
    `nwr["amenity"~"cafe|fast_food|food_truck|takeaway"]["cuisine"~"pizza|pizzeria|italian|italiano|italiana",i](${a});`+
    `nwr["amenity"~"bar|pub"]["cuisine"~"pizza|pizzeria|italian|italiano|italiana",i](${a});`+
    `nwr["amenity"~"bar|pub"]["name"~"pizza|pizzeria|pizzaria|pizza pub|pizza bar",i](${a});`+
    `nwr["shop"~"bakery|deli"]["name"~"pizza|pizzeria|pizzaria|pizzaplace|pizza place",i](${a});`+
    `nwr["shop"~"bakery|deli"]["product"~"pizza",i](${a});`+
    `nwr["speciality"~"pizza",i](${a});`+
    `nwr["name"~"pizza|pizzeria|pizzaria|pizzerie|pizze|pizzaplace|pizza place",i](${a});`+
    `nwr["description"~"pizza",i](${a});`+
    `nwr["note"~"pizza",i](${a});`+
    `nwr["menu"~"pizza",i](${a});`+
    `nwr["product"~"pizza",i](${a});nwr["products"~"pizza",i](${a});`+
    `nwr["vending"~"pizza",i](${a});nwr["vending:pizza"="yes"](${a});`+
    /* Hidden candidate pool for deeper review evidence. These restaurants are
     * fetched, but placeRelevant() keeps them off the map until pizza evidence
     * from reviews/menu/metadata exists. */
    `nwr["amenity"="restaurant"]["name"](${a});`+
    `);out body center;`;
}
const strictQuery=websimQuery;
function isWebsimDiscoveryQuery(query){return String(query||'').includes('pizzascan-websim-search-v5');}
const isStrictDiscoveryQuery=isWebsimDiscoveryQuery;
function mergeElements(...groups){const out=new Map();for(const group of groups)for(const e of group||[])if(e&&['node','way','relation'].includes(e.type)&&e.id!=null)out.set(`${e.type}-${e.id}`,e);return [...out.values()];}
function filterCandidates(elements){return (elements||[]).filter(eligibleElement);}
function googleReviewHasPizza(container){return [...(container?.querySelectorAll?.('*')||[])].some(node=>PIZZA.test(text(node?.textContent||'')));}

function clearOldCaches(root){
  try{
    if(!root.localStorage||root.localStorage.getItem(MARKER))return;
    root.localStorage.removeItem('pizzascan-map-cache-v3');
    root.localStorage.removeItem('pizzascan-map-cache-v2');
    root.localStorage.removeItem('pizzascan-smart-discovery-v4');
    for(let i=root.localStorage.length-1;i>=0;i--){const k=root.localStorage.key(i);if(k?.startsWith('pizzascan-search-')||k?.startsWith('pizzascan-nearby-photon-'))root.localStorage.removeItem(k);}
    root.localStorage.setItem(MARKER,'1');
  }catch{}
}

function install(root){
  const PD=root.PizzaPlaces;if(!PD)return;clearOldCaches(root);
  /* Keep broad recovery as a hidden candidate supplier, but restore the ambient
   * query to the WebSim families plus normal restaurants only for deeper evidence. */
  if(!PD.query.__websimRelevant){
    const query=function(center,radius,bounds){return websimQuery(center,radius,bounds);};
    query.__websimRelevant=true;PD.query=query;
  }
  if(!PD.filter.__websimRelevant){
    const baseFilter=PD.filter.bind(PD);
    PD.filter=function(list,cfg,context,hours){
      return baseFilter(list,cfg,context,hours).filter(place=>placeRelevant(place,root.PizzaRatingsUI));
    };
    PD.filter.__websimRelevant=true;
  }
  /* Improve semantic markers: ordinary Italian candidates use an Italian flag;
   * actual pizza pubs/bars/bakeshops classify as pizzeria and keep the pizza icon. */
  if(PD.TYPES?.other)PD.TYPES.other={...PD.TYPES.other,emoji:'🇮🇹',name:'Italiener / Pizza-Kandidat'};
  if(PD.TYPES?.pizzeria)PD.TYPES.pizzeria={...PD.TYPES.pizzeria,emoji:'🍕',name:'Pizzeria / Pizza-Ort'};
  root.PizzaScanSmartDiscovery={marker:MARKER,mode:'websim-relevant-only',query:'websim-plus-hidden-review-candidates',genericRestaurantsVisible:false,reviewEvidence:true,menuEvidence:true};
}

return {MARKER,PIZZA,ITALIAN,FOOD_AMENITIES,FOOD_SHOPS,text,directPizzaEvidence,pizzaMenuEvidence,pizzaCommentEvidence,pizzaText,italianEvidence,plausibleFoodObject,websimBaselineTags,deepEvidenceTags,eligibleElement,reviewPizzaMentions,placeRelevant,strongPizzaPlace,classifyPlace,area,websimQuery,strictQuery,isWebsimDiscoveryQuery,isStrictDiscoveryQuery,mergeElements,filterCandidates,googleReviewHasPizza,clearOldCaches,install};
});