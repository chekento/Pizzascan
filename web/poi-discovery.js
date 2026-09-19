/* Resilient broad restaurant/POI recovery. Loaded after broad-defaults.js.
 * Every recovery path keeps ordinary named food venues as the baseline; pizza and
 * Italian selectors are additive so provider failures can never collapse the map
 * into a pizza/Italian-only result set. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaPoiDiscovery=api;api.install(root);}
})(globalThis,function(){
'use strict';

const MARKER='pizzascan-poi-discovery-v11';
const FOOD_AMENITIES='restaurant|fast_food|cafe|food_truck|bar|pub|biergarten|takeaway|food_court';
const FOOD_SET=new Set(FOOD_AMENITIES.split('|'));
const PIZZA_WORDS='pizza|pizzeria|pizzaria|pizzerie|pizze';
const ITALIAN_CUISINE='italian|italiano|italiana|pasta';
const ITALIAN_NAME_WORDS='ristorante|trattoria|osteria|italian|italiano|italiana|italiener|italienisch';
/* Alternate Overpass sources are attempted before Photon. Photon is the rescue
 * path when broad OSM queries cannot produce a useful, diverse restaurant set. */
const FALLBACK_TERMS=[
  'restaurant','pizzeria','pizza','cafe','fast food','takeaway','bar','pub','biergarten','food court','food truck',
  'italian restaurant','ristorante','trattoria','osteria','italienisches restaurant',
  'pizza cafe','pizza imbiss','pizza food truck','pizza vending','pizza takeaway'
];
const PHOTON_TAGS=[
  'amenity:restaurant','amenity:fast_food','amenity:cafe','amenity:food_court',
  'amenity:pub','amenity:bar','amenity:biergarten'
];
const RECOVERY_PROVIDERS=[
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.osm.jp/api/interpreter'
];
const SPARSE_BELOW=12;
const ADEQUATE_POIS=24;
const FALLBACK_TARGET=24;
const PHOTON_LIMIT=50;
const MIN_GENERIC_POIS=3;

function extractArea(query){
  const q=String(query||'');
  const around=q.match(/around:\d+,-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?/);
  if(around)return around[0];
  const box=q.match(/\((-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?)\)/);
  return box?.[1]||'';
}
function areaInfo(area){
  let m=/around:(\d+),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(area||'');
  if(m)return {center:{lat:Number(m[2]),lng:Number(m[3])},radius:Math.max(.5,Number(m[1])/1000)};
  m=/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(area||'');
  if(!m)return null;
  const south=Number(m[1]),west=Number(m[2]),north=Number(m[3]),east=Number(m[4]);
  return {center:{lat:(south+north)/2,lng:(west+east)/2},radius:10,bounds:{south,west,north,east}};
}
function text(value){return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function pizzaTags(tags={}){
  if(tags['vending:pizza']==='yes')return true;
  const hay=text([tags.name,tags.cuisine,tags.brand,tags.operator,tags.speciality,tags.vending,tags.product,tags.products].filter(Boolean).join(' '));
  return /(?:^|[^a-z])(pizza|pizzeria|pizzaria|pizzerie|pizze|pizzas)(?:[^a-z]|$)/i.test(hay);
}
function elementPizza(element){return !!element&&pizzaTags(element.tags||{});}
function pizzaCount(elements){return (elements||[]).filter(elementPizza).length;}
function genericFoodElement(element){
  const tags=element?.tags||{};
  return !!tags.name&&FOOD_SET.has(tags.amenity||'')&&!elementPizza(element);
}
function genericFoodCount(elements){return (elements||[]).filter(genericFoodElement).length;}
function broadEnough(elements){
  const list=Array.isArray(elements)?elements:[];
  return list.length>=ADEQUATE_POIS||(list.length>=SPARSE_BELOW&&genericFoodCount(list)>=MIN_GENERIC_POIS);
}

function robustQuery(area){
  if(!area)return '';
  return `[out:json][timeout:28];(`+
    `nwr["amenity"~"${FOOD_AMENITIES}"]["name"](${area});`+
    `nwr["cuisine"~"${PIZZA_WORDS}",i](${area});`+
    `nwr["amenity"="restaurant"]["cuisine"~"${ITALIAN_CUISINE}",i](${area});`+
    `nwr["amenity"~"${FOOD_AMENITIES}"]["cuisine"~"${PIZZA_WORDS}|${ITALIAN_CUISINE}",i](${area});`+
    `nwr["amenity"~"${FOOD_AMENITIES}"]["name"~"${PIZZA_WORDS}|${ITALIAN_NAME_WORDS}",i](${area});`+
    `nwr["amenity"~"${FOOD_AMENITIES}"]["brand"~"${PIZZA_WORDS}|${ITALIAN_NAME_WORDS}",i](${area});`+
    `nwr["amenity"~"${FOOD_AMENITIES}"]["operator"~"${PIZZA_WORDS}|${ITALIAN_NAME_WORDS}",i](${area});`+
    `nwr["amenity"~"${FOOD_AMENITIES}"]["speciality"~"${PIZZA_WORDS}",i](${area});`+
    `nwr["amenity"~"${FOOD_AMENITIES}"]["description"~"${PIZZA_WORDS}|${ITALIAN_NAME_WORDS}",i](${area});`+
    `nwr["shop"~"deli|bakery|convenience"]["name"~"${PIZZA_WORDS}|${ITALIAN_NAME_WORDS}",i](${area});`+
    `nwr["shop"~"deli|bakery|convenience"]["product"~"${PIZZA_WORDS}",i](${area});`+
    `nwr["amenity"="vending_machine"]["vending"~"pizza",i](${area});`+
    `nwr["vending"~"pizza",i](${area});nwr["vending:pizza"="yes"](${area});`+
    `);out body center;`;
}

function mergeElements(...groups){
  const out=new Map();
  for(const group of groups)for(const e of group||[]){
    if(!e||!['node','way','relation'].includes(e.type)||e.id==null)continue;
    out.set(`${e.type}-${e.id}`,e);
  }
  return [...out.values()];
}
function evidence(place){return place&&pizzaTags({...place.tags,name:place.name,cuisine:place.cuisine})?'confirmed':place?.pizzaEvidence||'search';}
function isSparse(result){return !broadEnough(result?.data?.elements||[]);}
function placeToElement(place,term='pizza'){
  const m=/^(node|way|relation)-(\d+)$/.exec(place?.placeId||'');
  if(!m||!Number.isFinite(place?.lat)||!Number.isFinite(place?.lng))return null;
  const t=text(term),tags={...(place.tags||{}),name:place.name||place.tags?.name||''};
  if(/vending|automat/.test(t)){tags.amenity='vending_machine';tags.vending='pizza';tags['vending:pizza']='yes';}
  else{
    if(/cafe/.test(t))tags.amenity='cafe';
    else if(/food truck/.test(t)){tags.amenity='food_truck';tags.mobile='yes';}
    else if(/food court/.test(t))tags.amenity='food_court';
    else if(/imbiss|fast food/.test(t))tags.amenity='fast_food';
    else if(/takeaway/.test(t))tags.amenity='takeaway';
    else if(/biergarten/.test(t))tags.amenity='biergarten';
    else if(/ pub/.test(' '+t))tags.amenity='pub';
    else if(/ bar/.test(' '+t))tags.amenity='bar';
    else if(/bakery/.test(t)){delete tags.amenity;tags.shop='bakery';}
    else if(/restaurant|ristorante|trattoria|osteria|italiener/.test(t)){
      tags.amenity='restaurant';
      if(/ristorante|trattoria|osteria|italian|italien|italiano|italiana/.test(t))tags.cuisine=[tags.cuisine,'italian'].filter(Boolean).join(';');
    }
    else if(!tags.amenity)tags.amenity='restaurant';
    if(/pizza|pizzeria|pizzaria|pizze/.test(t))tags.cuisine=[tags.cuisine,'pizza'].filter(Boolean).join(';');
  }
  return {type:m[1],id:Number(m[2]),lat:place.lat,lon:place.lng,tags};
}
function inside(info,p){
  if(info?.bounds){const b=info.bounds;return p.lat>=b.south&&p.lat<=b.north&&(b.west<=b.east?p.lng>=b.west&&p.lng<=b.east:p.lng>=b.west||p.lng<=b.east);}
  const d=globalThis.PizzaCore?.distance?.(info.center,p);
  if(Number.isFinite(d))return d<=Math.min(10,info.radius*1.15);
  const dy=(Number(p.lat)-info.center.lat)*111.32,dx=(Number(p.lng)-info.center.lng)*111.32*Math.cos(info.center.lat*Math.PI/180);
  return Math.hypot(dx,dy)<=Math.min(10,info.radius*1.15);
}
function photonNearbyUrl(tag,center,limit=PHOTON_LIMIT){
  const url=new URL('https://photon.komoot.io/reverse');
  url.search=new URLSearchParams({lon:String(center.lng),lat:String(center.lat),osm_tag:tag,limit:String(limit),lang:'de'});
  return url.href;
}
function photonFeatureElements(data,info){
  if(!Array.isArray(data?.features))return [];
  return data.features.flatMap(feature=>{
    const p=feature?.properties||{},coords=feature?.geometry?.coordinates||[],lng=Number(coords[0]),lat=Number(coords[1]);
    const type={N:'node',W:'way',R:'relation',node:'node',way:'way',relation:'relation'}[p.osm_type],id=Number(p.osm_id);
    if(!type||!Number.isInteger(id)||id<=0||!Number.isFinite(lat)||!Number.isFinite(lng)||!p.name)return [];
    const tags={name:p.name,'addr:street':p.street||'','addr:housenumber':p.housenumber||'','addr:postcode':p.postcode||'','addr:city':p.city||p.town||p.village||'','addr:country':p.countrycode||'','addr:state':p.state||''};
    if(p.osm_key)tags[p.osm_key]=p.osm_value||'';
    if(!FOOD_SET.has(tags.amenity||''))return [];
    const element={type,id,lat,lon:lng,tags};
    return inside(info,{lat,lng})?[element]:[];
  });
}
async function structuredPhoton(service,info,options={},seed=[]){
  let elements=mergeElements(seed),lastRequest=0;
  for(const tag of PHOTON_TAGS){
    if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    try{
      const cacheKey=`pizzascan-nearby-photon-v2-${tag}-${info.center.lat.toFixed(2)}-${info.center.lng.toFixed(2)}-${info.radius.toFixed(1)}`;
      const cached=service.read?.(cacheKey);let data=null;
      if(cached&&Date.now()-cached.time<3600000&&cached.data)data=cached.data;
      else{
        const wait=Math.max(0,1100-(Date.now()-lastRequest));if(wait)await new Promise(resolve=>setTimeout(resolve,wait));
        if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
        lastRequest=Date.now();
        data=await service.json(photonNearbyUrl(tag,info.center),{},options.signal,9000);
        service.write?.(cacheKey,{time:Date.now(),data});
      }
      elements=mergeElements(elements,photonFeatureElements(data,info));
      if(elements.length>=FALLBACK_TARGET&&genericFoodCount(elements)>=MIN_GENERIC_POIS)break;
    }catch(error){if(options.signal?.aborted)throw error;}
  }
  return elements;
}

async function recoverProviders(service,query,options={},seed=[]){
  const area=extractArea(query),rq=robustQuery(area);if(!rq)return {elements:seed,sources:[]};
  let elements=mergeElements(seed),sources=[];
  for(const endpoint of RECOVERY_PROVIDERS){
    if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    try{
      options.onStatus?.('Weitere Restaurants werden über eine alternative OpenStreetMap-Quelle geladen …');
      const data=await service.json(endpoint,{method:'POST',body:new URLSearchParams({data:rq})},options.signal,14000);
      if(Array.isArray(data?.elements)&&!data.remark&&data.elements.length){
        elements=mergeElements(elements,data.elements);sources.push(new URL(endpoint).hostname);
        if(broadEnough(elements))break;
      }
    }catch(error){if(options.signal?.aborted)throw error;}
  }
  return {elements,sources};
}

async function recoverPhoton(service,query,options={},seed=[]){
  const info=areaInfo(extractArea(query));if(!info)return seed;
  let elements=mergeElements(seed);
  options.onStatus?.('Weitere Restaurants werden strukturiert aus OpenStreetMap ergänzt …');
  elements=await structuredPhoton(service,info,options,elements);
  if(broadEnough(elements))return elements;
  options.onStatus?.('Weitere Restaurants und Pizza-Orte werden über die Textsuche ergänzt …');
  for(const term of FALLBACK_TERMS){
    if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    try{
      const items=await service.photon(term,info.center,{signal:options.signal});
      const extra=[];
      for(const item of items||[]){const p=item?.place;if(p&&inside(info,p)){const e=placeToElement(p,term);if(e)extra.push(e);}}
      elements=mergeElements(elements,extra);
      if(broadEnough(elements))break;
    }catch(error){if(options.signal?.aborted)throw error;}
  }
  return elements;
}

/* places.js historically runs its own sequential Photon text fallback after the
 * first two Overpass servers fail. Once this module is installed that fallback
 * is redundant and, more importantly, delays the broader alternate-provider
 * recovery by many seconds. Keep the legacy function available for diagnostics
 * but make the base overpass call fail fast into this module's recovery chain. */
function disableLegacyFallback(service){
  if(!service||typeof service.nearbyFallback!=='function'||service.nearbyFallback.__poiDiscoveryBypass)return false;
  const legacy=service.nearbyFallback.bind(service);
  const bypass=async function(_query,{signal}={}){
    if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    return [];
  };
  bypass.__poiDiscoveryBypass=true;
  bypass.__poiDiscoveryLegacy=legacy;
  service.nearbyFallback=bypass;
  return true;
}

function clearOldCaches(root){
  try{
    if(!root.localStorage||root.localStorage.getItem(MARKER))return;
    root.localStorage.removeItem('pizzascan-map-cache-v3');
    root.localStorage.removeItem('pizzascan-map-cache-v2');
    for(let i=root.localStorage.length-1;i>=0;i--){const k=root.localStorage.key(i);if(k?.startsWith('pizzascan-search-')||k?.startsWith('pizzascan-nearby-photon-'))root.localStorage.removeItem(k);}
    root.localStorage.setItem(MARKER,'1');
  }catch{}
}

function install(root){
  const PD=root.PizzaPlaces;if(!PD)return;clearOldCaches(root);
  if(!PD.fromOverpass.__poiDiscovery){
    const base=PD.fromOverpass.bind(PD);
    PD.fromOverpass=function(elements,options={}){
      return base(elements,options).map(p=>{
        const next=evidence(p);return next===p.pizzaEvidence?p:root.PizzaCore.place({...p,pizzaEvidence:next});
      });
    };
    PD.fromOverpass.__poiDiscovery=true;
  }
  try{
    if(typeof placeService!=='undefined'&&placeService&&!placeService.overpass.__poiDiscovery){
      const service=placeService;
      disableLegacyFallback(service);
      const base=service.overpass.bind(service);
      const wrapped=async function(query,options={}){
        let primary=null,primaryError=null;
        try{primary=await base(query,options);}catch(error){primaryError=error;if(options.signal?.aborted)throw error;}
        if(primary&&!isSparse(primary))return primary;
        let elements=primary?.data?.elements||[],sources=[primary?.source].filter(Boolean);

        const recovered=await recoverProviders(service,query,options,elements);
        elements=recovered.elements;sources=sources.concat(recovered.sources);
        if(!broadEnough(elements)){
          const before=elements.length;
          elements=await recoverPhoton(service,query,options,elements);
          if(elements.length>before)sources.push('photon.komoot.io');
        }
        if(elements.length)return {data:{...(primary?.data||{}),elements},source:[...new Set(sources.filter(Boolean))].join(' + ')};
        if(primary)return primary;
        throw primaryError||Error('Keine Restaurant-/Pizza-POI-Datenquelle erreichbar.');
      };
      wrapped.__poiDiscovery=true;service.overpass=wrapped;
    }
  }catch(error){console.warn('PizzaScan broad restaurant/pizza discovery recovery skipped',error);}
  root.PizzaScanPoiDiscovery={marker:MARKER,terms:FALLBACK_TERMS.slice(),photonTags:PHOTON_TAGS.slice(),providers:RECOVERY_PROVIDERS.slice(),legacyFallbackBypassed:true};
}

return {MARKER,FOOD_AMENITIES,PIZZA_WORDS,ITALIAN_CUISINE,ITALIAN_NAME_WORDS,FALLBACK_TERMS,PHOTON_TAGS,RECOVERY_PROVIDERS,SPARSE_BELOW,ADEQUATE_POIS,FALLBACK_TARGET,PHOTON_LIMIT,MIN_GENERIC_POIS,extractArea,areaInfo,text,pizzaTags,elementPizza,pizzaCount,genericFoodElement,genericFoodCount,broadEnough,robustQuery,mergeElements,evidence,isSparse,placeToElement,inside,photonNearbyUrl,photonFeatureElements,structuredPhoton,recoverProviders,recoverPhoton,disableLegacyFallback,install};
});
