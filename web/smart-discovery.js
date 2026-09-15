/* PizzaScan 2.3.5: WebSim-first hybrid discovery.
 * The ambient map again starts from the original WebSim pizza/Italian query.
 * If that set is sparse, the already-installed broad recovery chain may add
 * neutral restaurant candidates. Obvious specialised non-pizza cuisines are
 * removed unless the place carries direct pizza evidence.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaSmartDiscovery=api;api.install(root);}
})(globalThis,function(){
'use strict';

const MARKER='pizzascan-smart-discovery-v4';
const PIZZA=/(?:^|[^a-z])(pizza|pizzeria|pizzaria|pizzerie|pizze|pizzas)(?:[^a-z]|$)/i;
const ITALIAN=/(?:^|[^a-z])(italian|italiano|italiana|ristorante|trattoria|osteria|italiener|italienisch)(?:[^a-z]|$)/i;
const OBVIOUS_NON_PIZZA=/(?:^|[^a-z])(asian|asia|chinese|china|japanese|sushi|ramen|thai|vietnamese|viet|korean|indian|curry|tandoori|nepalese|indonesian|malaysian|filipino|pakistani|bangladeshi|sri[_ -]?lankan|mongolian|cantonese|sichuan|dim[_ -]?sum|kebab|doner|doener|turkish|greek|burger|steak[_ -]?house|mexican)(?:[^a-z]|$)/i;
const FOOD_AMENITIES=new Set(['restaurant','fast_food','cafe','food_truck','takeaway','food_court','bar','pub','biergarten']);
const GENERIC_CANDIDATES=new Set(['restaurant','fast_food','food_truck','takeaway']);

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
function incompatibleEvidence(tags={}){
  if(directPizzaEvidence(tags))return false;
  return OBVIOUS_NON_PIZZA.test(text(fields(tags,['cuisine','name','brand','operator'])));
}
function plausibleFoodObject(tags={}){
  const amenity=text(tags.amenity||''),shop=text(tags.shop||'');
  if(FOOD_AMENITIES.has(amenity)||amenity==='vending_machine'||['deli','bakery','convenience'].includes(shop))return true;
  if(amenity||shop)return false;
  return !(tags.tourism||tags.leisure||tags.healthcare||tags.office||tags.aeroway||tags.railway||tags.public_transport||tags.historic);
}

/* Exact families used by the original WebSim app: pizza cuisine; Italian
 * restaurants; pizza/Italian cafés, fast food, food trucks, bars/pubs and
 * takeaways; pizza speciality/name/description; and pizza vending machines. */
function websimBaselineTags(tags={}){
  const amenity=text(tags.amenity||'');
  if(directPizzaEvidence(tags)&&plausibleFoodObject(tags))return true;
  if(incompatibleEvidence(tags))return false;
  if(amenity==='restaurant'&&italianEvidence(tags))return true;
  if(['cafe','fast_food','food_truck','bar','pub','takeaway'].includes(amenity)&&/pizza|italian|italiano|italiana/i.test(text(tags.cuisine||'')))return true;
  if(pizzaCommentEvidence(tags)&&plausibleFoodObject(tags))return true;
  return false;
}

/* Sparse fallback from the successful pre-precision build is retained, but only
 * neutral restaurant-like candidates survive. A tagged/name-obvious Asian,
 * sushi, kebab, burger, steakhouse etc. venue is rejected unless it explicitly
 * says pizza. Generic restaurants with no contradictory evidence remain visible
 * as possible candidates, which avoids collapsing the map to 1-2 results. */
function supplementalCandidateTags(tags={}){
  if(websimBaselineTags(tags))return true;
  if(incompatibleEvidence(tags))return false;
  const amenity=text(tags.amenity||'');
  if(!tags.name||!GENERIC_CANDIDATES.has(amenity))return false;
  return true;
}
function eligibleElement(element){return !!element&&supplementalCandidateTags(element.tags||{});}
function strongPizzaPlace(place){
  const tags={...(place?.tags||{})};
  if(place?.name&&!tags.name)tags.name=place.name;
  if(place?.cuisine&&!tags.cuisine)tags.cuisine=place.cuisine;
  if(place?.description&&!tags.description)tags.description=place.description;
  if(place?.menu&&!tags.menu)tags.menu=place.menu;
  if(place?.pizzaEvidenceSource==='google-review-session')return true;
  return directPizzaEvidence(tags)||(!incompatibleEvidence(tags)&&(pizzaMenuEvidence(tags)||pizzaCommentEvidence(tags)));
}
function classifyPlace(place){
  const t=place?.tags||{},amenity=text(t.amenity||'');
  if(t['vending:pizza']==='yes'||PIZZA.test(text(t.vending||'')))return 'vending_pizza';
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
function websimQuery(center,radius,bounds){
  const a=area(center,radius,bounds);
  return `[out:json][timeout:24];(/* pizzascan-websim-search-v4 */`+
    `nwr["cuisine"="pizza"](${a});`+
    `nwr["amenity"="restaurant"]["cuisine"="italian"](${a});`+
    `nwr["amenity"="restaurant"]["cuisine"~"pizza|pizzeria",i](${a});`+
    `nwr["vending"="pizza"](${a});nwr["vending:pizza"="yes"](${a});`+
    `nwr["amenity"="cafe"]["cuisine"~"pizza|italian",i](${a});`+
    `nwr["amenity"="fast_food"]["cuisine"~"pizza|italian",i](${a});`+
    `nwr["amenity"="food_truck"]["cuisine"~"pizza|italian",i](${a});`+
    `nwr["speciality"~"pizza",i](${a});`+
    `nwr["amenity"~"bar|pub"]["cuisine"~"pizza|italian",i](${a});`+
    `nwr["name"~"pizza|pizzeria|pizze",i](${a});`+
    `nwr["description"~"pizza",i](${a});`+
    `nwr["amenity"="takeaway"]["cuisine"~"pizza|italian",i](${a});`+
    `);out body center;`;
}
const strictQuery=websimQuery;
function isWebsimDiscoveryQuery(query){return String(query||'').includes('pizzascan-websim-search-v4');}
const isStrictDiscoveryQuery=isWebsimDiscoveryQuery;
function mergeElements(...groups){const out=new Map();for(const group of groups)for(const e of group||[])if(e&&['node','way','relation'].includes(e.type)&&e.id!=null)out.set(`${e.type}-${e.id}`,e);return [...out.values()];}
function filterCandidates(elements){return (elements||[]).filter(eligibleElement);}
function googleReviewHasPizza(container){return [...(container?.querySelectorAll?.('*')||[])].some(node=>PIZZA.test(text(node?.textContent||'')));}

function clearOldCaches(root){
  try{
    if(!root.localStorage||root.localStorage.getItem(MARKER))return;
    root.localStorage.removeItem('pizzascan-map-cache-v3');
    root.localStorage.removeItem('pizzascan-map-cache-v2');
    root.localStorage.removeItem('pizzascan-smart-discovery-v3');
    for(let i=root.localStorage.length-1;i>=0;i--){const k=root.localStorage.key(i);if(k?.startsWith('pizzascan-search-')||k?.startsWith('pizzascan-nearby-photon-'))root.localStorage.removeItem(k);}
    root.localStorage.setItem(MARKER,'1');
  }catch{}
}

function install(root){
  const PD=root.PizzaPlaces;if(!PD)return;clearOldCaches(root);
  /* broad-defaults/poi-discovery are already installed at this point. Replace only
   * the ambient query with the original WebSim query; keep their resilient sparse
   * recovery underneath it. */
  if(!PD.query.__websimHybrid){
    const query=function(center,radius,bounds){return websimQuery(center,radius,bounds);};
    query.__websimHybrid=true;PD.query=query;
  }
  try{
    if(typeof placeService!=='undefined'&&placeService&&!placeService.overpass.__websimHybrid){
      const service=placeService,base=service.overpass.bind(service);
      const wrapped=async function(query,options={}){
        const result=await base(query,options);
        if(!isWebsimDiscoveryQuery(query))return result;
        const filtered=filterCandidates(result?.data?.elements||[]);
        if(filtered.length)return {...result,data:{...(result.data||{}),elements:filtered}};
        return result;
      };
      wrapped.__websimHybrid=true;wrapped.__websimHybridInner=base;service.overpass=wrapped;
    }
  }catch(error){console.warn('PizzaScan WebSim hybrid discovery skipped',error);}
  root.PizzaScanSmartDiscovery={marker:MARKER,mode:'websim-first-hybrid',query:'original-websim',fallback:'broad-neutral',incompatibleCuisineVeto:true};
}

return {MARKER,PIZZA,ITALIAN,OBVIOUS_NON_PIZZA,FOOD_AMENITIES,GENERIC_CANDIDATES,text,directPizzaEvidence,pizzaMenuEvidence,pizzaCommentEvidence,pizzaText,italianEvidence,incompatibleEvidence,plausibleFoodObject,websimBaselineTags,supplementalCandidateTags,eligibleElement,strongPizzaPlace,classifyPlace,area,websimQuery,strictQuery,isWebsimDiscoveryQuery,isStrictDiscoveryQuery,mergeElements,filterCandidates,googleReviewHasPizza,clearOldCaches,install};
});