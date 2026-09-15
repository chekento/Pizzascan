/* PizzaScan 2.3.5: strict WebSim-baseline + evidence-driven Pizza discovery.
 * The nearby map keeps every POI category the original WebSim query intentionally
 * returned. Additional POIs need an explicit pizza signal in structured data,
 * description/comment-style text or menu metadata. Manual restaurant search stays broad. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaSmartDiscovery=api;api.install(root);}
})(globalThis,function(){
'use strict';

const MARKER='pizzascan-smart-discovery-v1';
const PIZZA=/(?:^|[^a-z])(pizza|pizzeria|pizzaria|pizzerie|pizze|pizzas)(?:[^a-z]|$)/i;
const ITALIAN=/(?:^|[^a-z])(italian|italiano|italiana)(?:[^a-z]|$)/i;
const FOOD_AMENITIES=new Set(['restaurant','fast_food','cafe','food_truck','takeaway','food_court','bar','pub','biergarten']);
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
function pizzaText(tags={}){
  return PIZZA.test(text(fields(tags,[
    'name','cuisine','brand','operator','speciality','description','description:de','description:en','description:it','description:es','description:fr',
    'note','note:de','note:en','product','products','vending','menu','website:menu','contact:menu','url','website'
  ])));
}
function pizzaMenuEvidence(tags={}){return PIZZA.test(text(fields(tags,['menu','website:menu','contact:menu','product','products'])));}
function pizzaCommentEvidence(tags={}){return PIZZA.test(text(fields(tags,['description','description:de','description:en','description:it','description:es','description:fr','note','note:de','note:en'])));}
function isPizzaVending(tags={}){return tags['vending:pizza']==='yes'||PIZZA.test(text(tags.vending||''));}

/* Mirrors the POI families used by the original WebSim app. This is the protected
 * baseline: later discovery logic may enrich it, but must not replace it with every
 * generic restaurant in the area. */
function websimBaselineTags(tags={}){
  const amenity=text(tags.amenity||'');
  if(pizzaCuisine(tags)||isPizzaVending(tags))return true;
  if(amenity==='restaurant'&&(italianCuisine(tags)||pizzaCuisine(tags)))return true;
  if(['cafe','fast_food','food_truck','takeaway'].includes(amenity)&&(pizzaCuisine(tags)||italianCuisine(tags)))return true;
  if(['bar','pub'].includes(amenity)&&(pizzaCuisine(tags)||italianCuisine(tags)))return true;
  if(PIZZA.test(text(tags.speciality||'')))return true;
  if(PIZZA.test(text(tags.name||'')))return true;
  if(PIZZA.test(text(tags.description||'')))return true;
  return false;
}
function supplementalEvidenceTags(tags={}){
  const amenity=text(tags.amenity||'');
  const food=FOOD_AMENITIES.has(amenity)||['deli','bakery','convenience'].includes(text(tags.shop||''));
  return food&&(pizzaText(tags)||pizzaMenuEvidence(tags)||pizzaCommentEvidence(tags));
}
function eligibleElement(element){const tags=element?.tags||{};return websimBaselineTags(tags)||supplementalEvidenceTags(tags);}
function evidenceKind(tags={}){
  if(isPizzaVending(tags))return 'vending';
  if(pizzaMenuEvidence(tags))return 'menu';
  if(pizzaCommentEvidence(tags))return 'comment';
  if(pizzaText(tags))return 'pizza';
  if(websimBaselineTags(tags))return 'websim';
  return '';
}
function promoteElement(element){
  if(!element||!element.tags)return element;
  const kind=evidenceKind(element.tags);
  if(!kind)return element;
  const tags={...element.tags,'pizzascan:evidence':kind};
  /* places.js already understands speciality=pizza. Promote only evidence fields it
   * could otherwise miss; do not rewrite Italian-only WebSim baseline POIs as pizza. */
  if((pizzaMenuEvidence(tags)||pizzaCommentEvidence(tags))&&!PIZZA.test(text(fields(tags,['name','cuisine','brand','vending','speciality'])))){
    tags.speciality=[tags.speciality,'pizza'].filter(Boolean).join(';');
  }
  return {...element,tags};
}
function strongPizzaPlace(place){
  const tags={...(place?.tags||{}),name:place?.name||'',cuisine:place?.cuisine||'',description:place?.description||'',menu:place?.menu||''};
  return pizzaText(tags)||isPizzaVending(tags)||place?.pizzaEvidenceSource==='google-review-session';
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
    `nwr["menu"~"pizza",i](${a});nwr["website:menu"~"pizza",i](${a});nwr["contact:menu"~"pizza",i](${a});`+
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
      if(!elements.length){errors.push({source:new URL(endpoint).hostname,message:'Keine belegten Pizza-POIs'});continue;}
      return {data:{...data,elements},source:new URL(endpoint).hostname};
    }catch(error){if(signal?.aborted)throw error;errors.push({source:new URL(endpoint).hostname,message:error?.message||String(error)});}
  }
  service.lastErrors=errors;
  const error=new Error('Keine belegten Pizza-Orte aus den Kartenquellen erreichbar.');
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
    if(PD.TYPES.other)PD.TYPES.other.name='Restaurant / Bar / weiterer Pizza-Ort';
    if(PD.TYPES.fast_food)PD.TYPES.fast_food.name='Imbiss / Takeaway';
  }
  const service=serviceFor(root);
  if(service){const bound=(query,options={})=>strictOverpass(service,query,options);bound.__smartDiscovery=true;service.overpass=bound;}
  installGoogleObserver(root);
}

return {MARKER,PIZZA,ITALIAN,PROVIDERS,text,pizzaCuisine,italianCuisine,pizzaText,pizzaMenuEvidence,pizzaCommentEvidence,isPizzaVending,websimBaselineTags,supplementalEvidenceTags,eligibleElement,evidenceKind,promoteElement,strongPizzaPlace,classifyPlace,strictQuery,strictOverpass,googleReviewHasPizza,applyGoogleReviewEvidence,clearStaleCaches,install};
});