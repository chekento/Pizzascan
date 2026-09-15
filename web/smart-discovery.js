/* PizzaScan 2.3.5: precise WebSim-baseline + evidence-driven Pizza discovery.
 * Nearby discovery may keep plausible Italian/WebSim candidates, but it must not
 * add obviously incompatible restaurants merely because a URL, weak note or broad
 * restaurant source happens to contain the word pizza. Manual POI search stays broad. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaSmartDiscovery=api;api.install(root);}
})(globalThis,function(){
'use strict';

const MARKER='pizzascan-smart-discovery-v2';
const PIZZA=/(?:^|[^a-z])(pizza|pizzeria|pizzaria|pizzerie|pizze|pizzas)(?:[^a-z]|$)/i;
const ITALIAN=/(?:^|[^a-z])(italian|italiano|italiana)(?:[^a-z]|$)/i;
const INCOMPATIBLE=/(?:^|[^a-z])(asian|chinese|japanese|thai|vietnamese|korean|indian|sushi|ramen|nepalese|indonesian|malaysian|filipino|pakistani|bangladeshi|sri[_ -]?lankan|mongolian|cantonese|sichuan|dim[_ -]?sum)(?:[^a-z]|$)/i;
const FOOD_AMENITIES=new Set(['restaurant','fast_food','cafe','food_truck','takeaway','food_court','bar','pub','biergarten']);
const FOOD_SHOPS=new Set(['deli','bakery','convenience']);
const PROVIDERS=[
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.osm.jp/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];

function text(value){return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').toLowerCase();}
function fields(tags={},keys=[]){return keys.map(k=>tags[k]).filter(Boolean).join(' ');}
function cuisine(tags={}){return text(tags.cuisine||'');}
function pizzaCuisine(tags={}){return PIZZA.test(cuisine(tags));}
function italianCuisine(tags={}){return ITALIAN.test(cuisine(tags));}
function incompatibleCuisine(tags={}){return !pizzaCuisine(tags)&&INCOMPATIBLE.test(cuisine(tags));}
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
  return true;
}

/* Direct pizza evidence always wins. Italian-only WebSim candidates remain useful,
 * but an explicit incompatible cuisine is a veto unless the same OSM object also
 * carries direct pizza evidence. This prevents Asia/sushi/Thai/etc. restaurants from
 * becoming ambient PizzaScan candidates on weak metadata alone. */
function websimBaselineTags(tags={}){
  const amenity=text(tags.amenity||''),direct=directPizzaEvidence(tags),conflict=incompatibleCuisine(tags);
  if(isPizzaVending(tags))return true;
  if(direct&&plausibleFoodObject(tags))return true;
  if(conflict)return false;
  if(amenity==='restaurant'&&italianCuisine(tags))return true;
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
  if(!incompatibleCuisine(tags)&&(pizzaMenuEvidence(tags)||pizzaCommentEvidence(tags)||PIZZA.test(text(fields(tags,['product','products']))))&&!coreDirect){
    tags.speciality=[tags.speciality,'pizza'].filter(Boolean).join(';');
  }
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

async function strictOverpass(service,query,{signal,onStatus}={}){
  const errors=[];
  for(let i=0;i<PROVIDERS.length;i++){
    if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    const endpoint=PROVIDERS[i];
    try{
      onStatus?.(i===0?'Pizza-Orte werden geprüft …':'Weitere Pizza-Datenquelle wird geprüft …');
      const data=await service.json(endpoint,{method:'POST',body:new URLSearchParams({data:query})},signal,i<2?10000:13000);
      if(!Array.isArray(data?.elements)||data.remark)throw new Error(data?.remark||'Unvollständige Kartendaten');
      const elements=data.elements.filter(eligibleElement);
      if(!elements.length){errors.push({source:new URL(endpoint).hostname,message:'Keine plausiblen Pizza-POIs'});continue;}
      return {data:{...data,elements},source:new URL(endpoint).hostname};
    }catch(error){if(signal?.aborted)throw error;errors.push({source:new URL(endpoint).hostname,message:error?.message||String(error)});}
  }
  service.lastErrors=errors;
  const error=new Error('Keine plausiblen Pizza-Orte aus den Kartenquellen erreichbar.');
  error.sources=errors;throw error;
}

function googleReviewHasPizza(panel){
  if(!panel)return false;
  return [...panel.querySelectorAll('.google-review-text,.google-review-original p')].some(node=>PIZZA.test(text(node.textContent||'')));
}
function applyGoogleReviewEvidence(root,panel){
  if(!googleReviewHasPizza(panel))return false;
  const id=panel.dataset.googlePlace;if(!id)return false;
  let p=null;try{p=typeof root.placeById==='function'?root.placeById(id):null;}catch{}
  if(!p)return false;
  const updated={...p,pizzaEvidence:'confirmed',pizzaEvidenceSource:'google-review-session'};
  updated.type=classifyPlace(updated);
  try{if(typeof root.ingestPlace==='function')root.ingestPlace(updated);else Object.assign(p,updated);}catch{try{Object.assign(p,updated);}catch{}}
  panel.dataset.pizzaEvidence='review';
  return true;
}
function installGoogleObserver(root){
  if(typeof document==='undefined'||typeof MutationObserver==='undefined')return;
  const scan=()=>document.querySelectorAll('.google-reviews-panel[data-google-place]').forEach(panel=>applyGoogleReviewEvidence(root,panel));
  const start=()=>{scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
function clearStaleCaches(root){
  try{
    if(!root.localStorage||root.localStorage.getItem(MARKER))return;
    root.localStorage.removeItem('pizzascan-map-cache-v3');
    root.localStorage.removeItem('pizzascan-map-cache-v2');
    root.localStorage.removeItem('pizzascan-first-map-discovery-v1');
    root.localStorage.removeItem('pizzascan-first-map-discovery-v2');
    for(let i=root.localStorage.length-1;i>=0;i--){const k=root.localStorage.key(i);if(k?.startsWith('pizzascan-nearby-photon-'))root.localStorage.removeItem(k);}
    root.localStorage.setItem(MARKER,'1');
  }catch{}
}
function serviceFor(root){try{if(typeof placeService!=='undefined'&&placeService)return placeService;}catch{}return root.placeService||null;}
function install(root){
  const PD=root.PizzaPlaces;if(!PD)return;
  clearStaleCaches(root);
  const oldFrom=PD.fromOverpass.bind(PD);
  if(!PD.fromOverpass.__smartDiscovery){
    const wrapped=function(elements,options={}){
      const manual=options?.allowNamed===true;
      const prepared=(manual?elements:(elements||[]).filter(eligibleElement)).map(promoteElement);
      return oldFrom(prepared,options).map(p=>{
        const type=classifyPlace(p),strong=strongPizzaPlace(p);
        const next={...p,type,pizzaEvidence:strong?'confirmed':p.pizzaEvidence};
        try{return root.PizzaCore?.place?root.PizzaCore.place(next):next;}catch{return next;}
      });
    };
    wrapped.__smartDiscovery=true;PD.fromOverpass=wrapped;
  }
  PD.query=strictQuery;
  if(PD.TYPES){
    if(PD.TYPES.other)PD.TYPES.other.name='Restaurant / Bar / möglicher Pizza-Ort';
    if(PD.TYPES.fast_food)PD.TYPES.fast_food.name='Imbiss / Takeaway';
  }
  const service=serviceFor(root);
  if(service){const bound=(query,options={})=>strictOverpass(service,query,options);bound.__smartDiscovery=true;service.overpass=bound;}
  installGoogleObserver(root);
}

return {MARKER,PIZZA,ITALIAN,INCOMPATIBLE,PROVIDERS,text,pizzaCuisine,italianCuisine,incompatibleCuisine,isUrlLike,directPizzaEvidence,pizzaText,pizzaMenuEvidence,pizzaCommentEvidence,isPizzaVending,plausibleFoodObject,websimBaselineTags,supplementalEvidenceTags,eligibleElement,evidenceKind,promoteElement,strongPizzaPlace,classifyPlace,strictQuery,strictOverpass,googleReviewHasPizza,applyGoogleReviewEvidence,clearStaleCaches,install};
});