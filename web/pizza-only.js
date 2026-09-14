/* Pizza-only visibility/search policy. Categories describe the type of pizza place, never generic food venues. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaOnlyPolicy=api;api.install(root);}
})(globalThis,function(){
'use strict';

const MARKER='pizzascan-pizza-only-v1';
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
function pizzaOnlyGroups(groups,query,helper,root=globalThis){
  return (groups||[]).map(group=>(group||[]).filter(item=>currentLocationItem(item,query,helper)||eligible(item?.place||item,root)));
}
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
    event.stopImmediatePropagation();
    const q=input.value.trim();
    if(q.length<2){try{root.showSearchResults?.([]);}catch{}const status=root.document.getElementById('search-status');if(status)status.textContent='';return;}
    let pool=[];
    try{if(typeof places!=='undefined')pool=PD.merge(pool,places||[]);}catch{}
    try{if(typeof mapPool!=='undefined')pool=PD.merge(pool,mapPool||[]);}catch{}
    try{if(typeof saved!=='undefined')pool=PD.merge(pool,saved||[]);}catch{}
    let center=null;try{if(typeof mapCenter==='function')center=mapCenter();}catch{}
    const list=PD.suggestions(pool,q,center).slice(0,8);
    try{root.showSearchResults?.(list,true);}catch{}
    const status=root.document.getElementById('search-status');
    if(status)status.textContent=list.length?`${list.length} Pizza-Ort${list.length===1?'':'e'} aus der geladenen Karte · „Suchen“ prüft weitere Pizza-Orte.`:'„Suchen“ prüft weitere Pizza-Orte in der Umgebung.';
  },true);
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
  root.PizzaScanPizzaOnly={marker:MARKER,eligible:place=>eligible(place,root)};
}
return {MARKER,PIZZA_WORD,text,directPizza,reviewPizza,eligible,currentLocationItem,pizzaOnlyGroups,wrapPoiHelper,install};
});
