/* Resilient POI recovery for sparse map responses. Loaded after broad-defaults.js. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaPoiDiscovery=api;api.install(root);}
})(globalThis,function(){
'use strict';

const MARKER='pizzascan-poi-discovery-v2';
const FOOD_AMENITIES='restaurant|fast_food|cafe|food_truck|takeaway|food_court|bar|pub|biergarten';
const ITALIAN_NAMES='pizza|pizzeria|pizzaria|ristorante|trattoria|osteria|italian|italiano|italiana|italienisch|napoli|napoletan';
const FALLBACK_TERMS=['pizza','pizzeria','pizza takeaway','ristorante','trattoria','osteria','italian restaurant','italienisches restaurant','italiano','italiana','restaurant'];
const RECOVERY_PROVIDERS=[
  'https://overpass.osm.jp/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];
const SPARSE_BELOW=6;
const FALLBACK_TARGET=18;

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

function robustQuery(area){
  if(!area)return '';
  return `[out:json][timeout:20];(`+
    `nwr["amenity"~"${FOOD_AMENITIES}"]["name"](${area});`+
    `nwr["amenity"~"${FOOD_AMENITIES}"]["cuisine"~"pizza|pizzeria|italian|pasta",i](${area});`+
    `nwr["amenity"~"${FOOD_AMENITIES}"]["name"~"${ITALIAN_NAMES}",i](${area});`+
    `nwr["amenity"~"${FOOD_AMENITIES}"]["brand"~"${ITALIAN_NAMES}",i](${area});`+
    `nwr["amenity"~"${FOOD_AMENITIES}"]["operator"~"${ITALIAN_NAMES}",i](${area});`+
    `nwr["shop"~"deli|bakery|convenience"]["name"~"pizza|pizzeria|pizzaria",i](${area});`+
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

function text(value){return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function evidence(place){
  const t=place?.tags||{};
  const hay=text([place?.name,place?.cuisine,t.brand,t.operator,t.speciality,t.vending].filter(Boolean).join(' '));
  if(/pizza|pizzeria|pizzaria/.test(hay)||t['vending:pizza']==='yes')return 'confirmed';
  if(/italian|italiano|italiana|italienisch|ristorante|trattoria|osteria|napoli|napoletan/.test(hay))return 'possible';
  return place?.pizzaEvidence||'search';
}
function isSparse(result){
  const n=result?.data?.elements?.length||0,source=String(result?.source||'').toLowerCase();
  return n<SPARSE_BELOW||source.includes('photon');
}
function placeToElement(place){
  const m=/^(node|way|relation)-(\d+)$/.exec(place?.placeId||'');
  if(!m||!Number.isFinite(place?.lat)||!Number.isFinite(place?.lng))return null;
  return {type:m[1],id:Number(m[2]),lat:place.lat,lon:place.lng,tags:{...(place.tags||{}),name:place.name||place.tags?.name||''}};
}
function inside(info,p){
  if(info?.bounds){const b=info.bounds;return p.lat>=b.south&&p.lat<=b.north&&(b.west<=b.east?p.lng>=b.west&&p.lng<=b.east:p.lng>=b.west||p.lng<=b.east);}
  const d=globalThis.PizzaCore?.distance?.(info.center,p);
  return Number.isFinite(d)&&d<=Math.min(10,info.radius*1.15);
}

async function recoverProviders(service,query,options={},seed=[]){
  const area=extractArea(query),rq=robustQuery(area);if(!rq)return {elements:seed,sources:[]};
  let elements=mergeElements(seed),sources=[];
  for(const endpoint of RECOVERY_PROVIDERS){
    if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    try{
      options.onStatus?.('Zusätzliche Restaurant- und Pizzeriaquelle wird abgefragt …');
      const data=await service.json(endpoint,{method:'POST',body:new URLSearchParams({data:rq})},options.signal,12000);
      if(Array.isArray(data?.elements)&&!data.remark&&data.elements.length){
        elements=mergeElements(elements,data.elements);sources.push(new URL(endpoint).hostname);
        if(elements.length>=FALLBACK_TARGET)break;
      }
    }catch(error){if(options.signal?.aborted)throw error;}
  }
  return {elements,sources};
}

async function recoverPhoton(service,query,options={},seed=[]){
  const info=areaInfo(extractArea(query));if(!info)return seed;
  let elements=mergeElements(seed);
  options.onStatus?.('Pizzeria-, Ristorante- und Trattoria-Treffer werden ergänzt …');
  for(const term of FALLBACK_TERMS){
    if(options.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    try{
      const items=await service.photon(term,info.center,{signal:options.signal});
      const extra=[];
      for(const item of items||[]){const p=item?.place;if(p&&inside(info,p)){const e=placeToElement(p);if(e)extra.push(e);}}
      elements=mergeElements(elements,extra);
      if(elements.length>=FALLBACK_TARGET)break;
    }catch(error){if(options.signal?.aborted)throw error;}
  }
  return elements;
}

function clearOldCaches(root){
  try{
    if(!root.localStorage||root.localStorage.getItem(MARKER))return;
    root.localStorage.removeItem('pizzascan-map-cache-v3');
    for(let i=root.localStorage.length-1;i>=0;i--){const k=root.localStorage.key(i);if(k?.startsWith('pizzascan-search-'))root.localStorage.removeItem(k);}
    root.localStorage.setItem(MARKER,'1');
  }catch{}
}

function install(root){
  const PD=root.PizzaPlaces;if(!PD)return;clearOldCaches(root);
  if(!PD.fromOverpass.__poiDiscovery){
    const base=PD.fromOverpass.bind(PD);
    PD.fromOverpass=function(elements,options={}){
      return base(elements,{allowNamed:true,...options}).map(p=>{
        const next=evidence(p);return next===p.pizzaEvidence?p:root.PizzaCore.place({...p,pizzaEvidence:next});
      });
    };
    PD.fromOverpass.__poiDiscovery=true;
  }
  try{
    if(typeof placeService!=='undefined'&&placeService&&!placeService.overpass.__poiDiscovery){
      const service=placeService,base=service.overpass.bind(service);
      const wrapped=async function(query,options={}){
        let primary=null,primaryError=null;
        try{primary=await base(query,options);}catch(error){primaryError=error;if(options.signal?.aborted)throw error;}
        if(primary&&!isSparse(primary))return primary;
        const seed=primary?.data?.elements||[];
        const recovered=await recoverProviders(service,query,options,seed);
        let elements=recovered.elements;
        if(elements.length<FALLBACK_TARGET)elements=await recoverPhoton(service,query,options,elements);
        if(elements.length){
          const sources=[primary?.source,...recovered.sources,elements.length>recovered.elements.length?'photon.komoot.io':''].filter(Boolean);
          return {data:{...(primary?.data||{}),elements},source:[...new Set(sources)].join(' + ')};
        }
        if(primary)return primary;
        throw primaryError||Error('Keine Restaurant- oder Pizzeria-Datenquelle erreichbar.');
      };
      wrapped.__poiDiscovery=true;service.overpass=wrapped;
    }
  }catch(error){console.warn('PizzaScan POI discovery recovery skipped',error);}
  root.PizzaScanPoiDiscovery={marker:MARKER,terms:FALLBACK_TERMS.slice(),providers:RECOVERY_PROVIDERS.slice()};
}

return {MARKER,FOOD_AMENITIES,ITALIAN_NAMES,FALLBACK_TERMS,RECOVERY_PROVIDERS,SPARSE_BELOW,FALLBACK_TARGET,extractArea,areaInfo,robustQuery,mergeElements,evidence,isSparse,install};
});
