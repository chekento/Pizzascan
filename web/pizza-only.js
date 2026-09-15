/* Pizza-only map visibility with broad explicit POI search. Categories describe the type of pizza place on the ambient map, while an explicit restaurant/name search may return ordinary food POIs. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaOnlyPolicy=api;api.install(root);}
})(globalThis,function(){
'use strict';

const MARKER='pizzascan-pizza-only-v5';
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
  /* Cities, addresses and GPS positions are navigation/search targets, not food venues.
   * They must remain selectable even while every ambient map marker stays pizza-only. */
  return item?.kind==='location'&&!item?.place&&Number.isFinite(Number(item.lat))&&Number.isFinite(Number(item.lng));
}
function explicitPizzaSearch(query,helper){
  const categories=helper?.categoryIntent?.(query)||[];
  if(categories.includes('pizza')||categories.includes('vending_pizza'))return true;
  return PIZZA_WORD.test(text(query));
}
function stateOnlySearch(query,helper){
  const states=helper?.stateIntent?.(query)||[];
  if(!states.length)return false;
  const categories=helper?.categoryIntent?.(query)||[];
  const words=helper?.tokens?.(query)||[];
  const generic=helper?.GENERIC;
  return !categories.length&&words.length>0&&words.every(word=>generic?.has?.(word));
}
function restrictSearchToPizza(query,helper){
  /* The ambient map is pizza-only, but the search box is also a restaurant/POI finder.
   * Preserve the old 2.2 behaviour for explicit restaurant/category/name searches:
   * - pizza-specific queries stay strict;
   * - saved/visited state-only searches stay strict;
   * - restaurant/cafe/fast-food/category searches and named POI searches may return
   *   ordinary food venues, which are search results rather than ambient map markers. */
  if(explicitPizzaSearch(query,helper))return true;
  if(stateOnlySearch(query,helper))return true;
  return false;
}
function pizzaOnlyGroups(groups,query,helper,root=globalThis){
  if(!restrictSearchToPizza(query,helper))return (groups||[]).map(group=>[...(group||[])]);
  return (groups||[]).map(group=>(group||[]).filter(item=>geographicLocationItem(item)||currentLocationItem(item,query,helper)||eligible(item?.place||item,root)));
}
function asVenue(place){return {...place,kind:'venue',place,osmId:place.placeId};}
function wrapPoiHelper(helper,root){
  if(!helper||helper.__pizzaOnly)return helper;
  const baseMerge=helper.mergeRanked?.bind(helper);
  if(baseMerge)helper.mergeRanked=function(groups,query,center,distance){return baseMerge(pizzaOnlyGroups(groups,query,helper,root),query,center,distance);};
  helper.__pizzaOnly=true;
  return helper;
}
function installPoiSetter(root){
  try{
    let value=wrapPoiHelper(root.PizzaPoiSearch,root);
    const existing=Object.getOwnPropertyDescriptor(root,'PizzaPoiSearch');
    if(existing&&!existing.configurable){if(value)wrapPoiHelper(value,root);return;}
    Object.defineProperty(root,'PizzaPoiSearch',{configurable:true,enumerable:true,get(){return value;},set(next){value=wrapPoiHelper(next,root);}});
  }catch(error){console.warn('PizzaScan pizza-only POI helper guard skipped',error);}
}
function installAutocompleteGuard(root,PD){
  const input=root.document?.getElementById('search');
  if(!input||input.dataset.pizzaOnlyGuard)return;
  input.dataset.pizzaOnlyGuard='1';
  input.addEventListener('input',event=>{
    const q=input.value.trim();
    /* Only intercept pizza-specific autocomplete. For restaurant names/categories,
     * let the normal search-ui listener run Photon/Nominatim + precise POI lookup,
     * restoring the broader and more useful 2.2-style restaurant autocomplete. */
    if(!PIZZA_WORD.test(text(q)))return;
    event.stopImmediatePropagation();
    if(q.length<2){try{root.showSearchResults?.([]);}catch{}const status=root.document.getElementById('search-status');if(status)status.textContent='';return;}
    let pool=[];
    try{if(typeof places!=='undefined')pool=PD.merge(pool,places||[]);}catch{}
    try{if(typeof mapPool!=='undefined')pool=PD.merge(pool,mapPool||[]);}catch{}
    try{if(typeof saved!=='undefined')pool=PD.merge(pool,saved||[]);}catch{}
    let center=null;try{if(typeof mapCenter==='function')center=mapCenter();}catch{}
    const list=PD.suggestions(pool,q,center).slice(0,8).map(asVenue);
    try{root.showSearchResults?.(list,true);}catch{}
    const status=root.document.getElementById('search-status');
    if(status)status.textContent=list.length?`${list.length} Pizza-Ort${list.length===1?'':'e'} aus der geladenen Karte · „Suchen“ prüft weitere Pizza-Orte und Ortsziele.`:'„Suchen“ prüft weitere Pizza-Orte, Städte und Adressen.';
  },true);
}
function installUiPolicy(root){
  try{
    if(typeof root.filterForm==='function'&&!root.filterForm.__pizzaOnly){
      const base=root.filterForm;
      const wrapped=function(...args){
        let html=base(...args);
        html=html.replace('Karte & Restaurantsuche','Karte & Pizza-Orte');
        html=html.replace(/<label class="check"><input id="filter-italian"[^>]*><span>Auch italienische Restaurants anzeigen, deren Pizza-Angebot noch nicht bestätigt ist<\/span><\/label>/,'<input id="filter-italian" type="checkbox" hidden>');
        return html;
      };
      wrapped.__pizzaOnly=true;root.filterForm=wrapped;
    }
  }catch(error){console.warn('PizzaScan pizza-only filter UI guard skipped',error);}
  try{
    if(typeof root.detailsHtml==='function'&&!root.detailsHtml.__pizzaOnly){
      const base=root.detailsHtml;
      const wrapped=function(place,...args){
        let html=base(place,...args);
        html=html.replace('Dieser Ort passt zur Restaurantsuche. Sein Pizza-Angebot ist in den Kartendaten nicht ausdrücklich bestätigt.','Pizza-Angebot wurde aus den verfügbaren Orts- oder offenen Bewertungsdaten erkannt; in den OpenStreetMap-Ortsdaten ist es nicht ausdrücklich als Pizza getaggt.');
        return html;
      };
      wrapped.__pizzaOnly=true;root.detailsHtml=wrapped;
    }
  }catch(error){console.warn('PizzaScan pizza-only detail wording guard skipped',error);}
}
function clearOldCaches(root){
  try{
    if(!root.localStorage||root.localStorage.getItem(MARKER))return;
    root.localStorage.removeItem('pizzascan-map-cache-v3');
    for(let i=root.localStorage.length-1;i>=0;i--){const key=root.localStorage.key(i);if(key?.startsWith('pizzascan-search-'))root.localStorage.removeItem(key);}
    root.localStorage.setItem(MARKER,'1');
  }catch{}
}
function install(root){
  const PD=root.PizzaPlaces;if(!PD)return;
  clearOldCaches(root);
  if(!PD.filter.__pizzaOnly){
    const base=PD.filter.bind(PD);
    PD.filter=function(list,cfg,context,hours){return base(list,cfg,context,hours).filter(place=>eligible(place,root));};
    PD.filter.__pizzaOnly=true;
  }
  if(!PD.suggestions.__pizzaOnly){
    const base=PD.suggestions.bind(PD);
    PD.suggestions=function(list,q,center){return base((list||[]).filter(place=>eligible(place,root)),q,center);};
    PD.suggestions.__pizzaOnly=true;
  }
  installPoiSetter(root);
  installAutocompleteGuard(root,PD);
  installUiPolicy(root);
  root.PizzaScanPizzaOnly={marker:MARKER,eligible:place=>eligible(place,root)};
}
return {MARKER,PIZZA_WORD,text,directPizza,reviewPizza,eligible,currentLocationItem,geographicLocationItem,explicitPizzaSearch,stateOnlySearch,restrictSearchToPizza,pizzaOnlyGroups,asVenue,wrapPoiHelper,installUiPolicy,install};
});