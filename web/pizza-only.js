/* Pizza evidence and discovery helpers.
 * Pizza-specific discovery is additive: never remove restaurants/POIs already returned
 * by the normal place search. poi-discovery.js may add missing pizza places afterwards. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaOnlyPolicy=api;api.install(root);}
})(globalThis,function(){
'use strict';

const MARKER='pizzascan-pizza-only-v6';
const PIZZA_WORD=/(?:^|[^a-z])(pizza|pizzeria|pizzaria|pizzerie|pizzas)(?:[^a-z]|$)/i;
function text(value){return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').toLowerCase();}
function directPizza(place){
  if(!place)return false;
  const t=place.tags||{};
  if(place.pizzaEvidence==='confirmed'||t['vending:pizza']==='yes')return true;
  const hay=text([place.name,place.cuisine,t.cuisine,t.brand,t.operator,t.speciality,t.vending,t.product,t.products].filter(Boolean).join(' '));
  return PIZZA_WORD.test(hay);
}
function reviewPizza(place,root=globalThis){
  try{return Number(root.PizzaRatingsUI?.summary?.(place)?.pizzaMentions||0)>0;}catch{return false;}
}
function eligible(place,root=globalThis){return directPizza(place)||reviewPizza(place,root);}
function currentLocationItem(item,query,helper){
  if(item?.kind!=='location'||item?.place)return false;
  const states=new Set(item.searchStates||[]);
  return states.has('location')&&!!helper?.stateIntent?.(query)?.includes('location');
}
function geographicLocationItem(item){
  return item?.kind==='location'&&!item?.place&&Number.isFinite(Number(item.lat))&&Number.isFinite(Number(item.lng));
}
function explicitPizzaSearch(query,helper){
  const categories=helper?.categoryIntent?.(query)||[];
  return categories.includes('pizza')||categories.includes('vending_pizza')||PIZZA_WORD.test(text(query));
}
function stateOnlySearch(query,helper){
  const states=helper?.stateIntent?.(query)||[];
  if(!states.length)return false;
  const categories=helper?.categoryIntent?.(query)||[];
  const words=helper?.tokens?.(query)||[];
  const generic=helper?.GENERIC;
  return !categories.length&&words.length>0&&words.every(word=>generic?.has?.(word));
}
function restrictSearchToPizza(){
  /* Deprecated compatibility hook. Pizza evidence must enrich results, never remove
   * primary restaurant/POI results. Query-specific ranking remains in poi-search.js. */
  return false;
}
function pizzaOnlyGroups(groups){
  /* Compatibility name retained for older callers. This is intentionally pass-through.
   * Primary results stay intact; supplemental pizza discovery is merged separately. */
  return (groups||[]).map(group=>[...(group||[])]);
}
function asVenue(place){return {...place,kind:'venue',place,osmId:place.placeId};}
function wrapPoiHelper(helper){
  /* Do not wrap mergeRanked destructively. poi-search.js already handles query intent
   * and poi-discovery.js adds missing pizza places by OSM identity. */
  return helper;
}
function installPoiSetter(){/* no destructive search wrapper */}
function installAutocompleteGuard(){/* normal Photon/Nominatim/Overpass autocomplete stays active */}
function installUiPolicy(){/* normal restaurant-search wording/settings stay visible */}
function clearOldCaches(root){
  try{
    if(!root.localStorage||root.localStorage.getItem(MARKER))return;
    root.localStorage.removeItem('pizzascan-map-cache-v3');
    root.localStorage.removeItem('pizzascan-open-ratings-v1');
    for(let i=root.localStorage.length-1;i>=0;i--){const key=root.localStorage.key(i);if(key?.startsWith('pizzascan-search-'))root.localStorage.removeItem(key);}
    root.localStorage.setItem(MARKER,'1');
  }catch{}
}
function install(root){
  const PD=root.PizzaPlaces;if(!PD)return;
  clearOldCaches(root);
  /* Crucial: do not override PD.filter or PD.suggestions. The normal restaurant/POI
   * set is the baseline. Pizza discovery is an additive second pass only. */
  root.PizzaScanPizzaEnrichment={marker:MARKER,eligible:place=>eligible(place,root),directPizza};
  /* Legacy alias retained for diagnostics/backward compatibility. */
  root.PizzaScanPizzaOnly=root.PizzaScanPizzaEnrichment;
}
return {MARKER,PIZZA_WORD,text,directPizza,reviewPizza,eligible,currentLocationItem,geographicLocationItem,explicitPizzaSearch,stateOnlySearch,restrictSearchToPizza,pizzaOnlyGroups,asVenue,wrapPoiHelper,installPoiSetter,installAutocompleteGuard,installUiPolicy,install};
});