/* Hybrid search policy: discover enough pizza candidates first, then apply the active PizzaScan settings. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaSettingsSearch=api;api.install(root);}
})(globalThis,function(){
  'use strict';

  const genericSearchWords=new Set(['restaurant','restaurants','ristorante','trattoria','pizzeria','pizzerias','pizzaria','pizza','cafe','cafes','imbiss','fast','food']);
  const pizzaWords=/pizza|pizzeria|pizzaria/i;

  function evidenceAllowed(place,cfg,explicit=false){
    const evidence=place?.pizzaEvidence||'';
    if(evidence==='confirmed')return true;
    if(evidence==='possible')return !!cfg?.includeItalian;
    return explicit&&evidence==='search';
  }

  function normalizedWords(value){
    return String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  }

  function explicitQueryMatches(place,query){
    const words=normalizedWords(query);
    if(!words.length)return true;
    const normalized=normalizedWords(String(place?.name||'')+' '+String(place?.address||'')).join(' ');
    const asksPizza=words.some(w=>w==='pizza'||w==='pizzeria'||w==='pizzaria');
    if(asksPizza&&place?.pizzaEvidence==='search'&&!/(^| )(pizza|pizzeria|pizzaria)( |$)/.test(normalized))return false;
    const meaningful=words.filter(w=>!genericSearchWords.has(w));
    if(meaningful.length)return meaningful.every(w=>normalized.includes(w));
    return words.some(w=>normalized.includes(w));
  }

  function parseArea(query){
    const text=String(query||'');
    const around=/around:(\d+),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(text);
    if(around)return {center:{lat:Number(around[2]),lng:Number(around[3])},radius:Number(around[1])/1000,bounds:null};
    const box=/\]\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\)/.exec(text);
    if(!box)return null;
    const bounds={south:Number(box[1]),west:Number(box[2]),north:Number(box[3]),east:Number(box[4])};
    return {center:{lat:(bounds.south+bounds.north)/2,lng:(bounds.west+bounds.east)/2},radius:0,bounds};
  }

  function fallbackTerms(cfg){
    const types=new Set(Array.isArray(cfg?.types)?cfg.types:[]),terms=[];
    if(types.size===0)return [];
    if(types.has('pizzeria')){
      terms.push('pizza','pizzeria','pizza restaurant');
      if(cfg?.includeItalian)terms.push('italian restaurant');
    }
    if(types.has('cafe'))terms.push('pizza cafe');
    if(types.has('fast_food'))terms.push('pizza fast food');
    if(types.has('food_truck'))terms.push('pizza food truck');
    if(types.has('vending_pizza'))terms.push('pizza vending machine');
    if(types.has('other'))terms.push('pizza bakery');
    return [...new Set(terms)];
  }

  function inScope(place,area,cfg,distance){
    if(!place||!area)return false;
    const radius=Number(cfg?.radius);
    if(radius>0)return distance(area.center,place)<=radius+0.02;
    const b=area.bounds;
    if(!b)return true;
    const lat=Number(place.lat),lng=Number(place.lng);
    if(!(lat>=b.south&&lat<=b.north))return false;
    return b.west<=b.east?lng>=b.west&&lng<=b.east:lng>=b.west||lng<=b.east;
  }

  function fallbackElement(item,term,cfg){
    const place=item?.place;
    if(!place||!Array.isArray(cfg?.types)||!cfg.types.includes(place.type))return null;
    const match=/^(node|way|relation)-(\d+)$/.exec(place.placeId||'');
    if(!match)return null;
    const tags={...(place.tags||{}),name:place.name||item.name};
    if(!tags.amenity&&place.type==='pizzeria')tags.amenity='restaurant';
    if(place.pizzaEvidence==='search'&&pizzaWords.test(term||''))tags['pizzascan:evidence']='possible';
    if(place.pizzaEvidence==='search'&&!tags['pizzascan:evidence'])return null;
    return {type:match[1],id:Number(match[2]),lat:place.lat,lon:place.lng,tags};
  }

  function mergeElements(primary=[],secondary=[]){
    const result=new Map();
    for(const element of [...primary,...secondary]){
      const key=element&&`${element.type}-${element.id}`;
      if(!key||key==='undefined-undefined')continue;
      if(!result.has(key))result.set(key,element);
    }
    return [...result.values()];
  }

  function install(root){
    const PD=root.PizzaPlaces,Core=root.PizzaCore;
    if(!PD||!Core)return;
    let service=null;
    try{if(typeof placeService!=='undefined')service=placeService;}catch{}
    if(!service)return;

    const currentConfig=()=>{try{return typeof mapConfig==='function'?mapConfig():PD.defaults;}catch{return PD.defaults;}};
    const currentBounds=()=>{try{return typeof boundsObject==='function'?boundsObject():null;}catch{return null;}};
    const visited=()=>{try{return new Set((typeof reports!=='undefined'?reports:[]).filter(r=>r.visited&&r.place).map(r=>r.place.placeId));}catch{return new Set();}};
    const hoursState=place=>{try{return typeof Hours!=='undefined'?Hours.status(place).state:'unknown';}catch{return 'unknown';}};
    const ratingPass=(place,cfg)=>{try{return typeof PizzaRatingsUI!=='undefined'?PizzaRatingsUI.passes(place,cfg):true;}catch{return true;}};

    function venueAllowed(place,query,center,explicit=true){
      if(!place)return false;
      const cfg=currentConfig();
      if(!Array.isArray(cfg.types)||!cfg.types.includes(place.type))return false;
      if(!evidenceAllowed(place,cfg,explicit))return false;
      if(cfg.onlyOpen){const state=hoursState(place);if(state!=='open'&&!(cfg.unknownHours&&state==='unknown'))return false;}
      if(cfg.hideVisited&&visited().has(place.placeId))return false;
      const scope={center,bounds:cfg.radius?null:currentBounds()};
      if(cfg.radius>0&&Core.distance(center,place)>cfg.radius+0.02)return false;
      if(cfg.radius===0&&scope.bounds&&!inScope(place,scope,cfg,Core.distance))return false;
      if(cfg.ratingsEnabled&&cfg.minRating>0&&!ratingPass(place,cfg))return false;
      if(place.pizzaEvidence==='search'&&explicit&&!explicitQueryMatches(place,query))return false;
      return true;
    }

    const baseFromOverpass=PD.fromOverpass.bind(PD);
    PD.fromOverpass=function(elements,options){
      const normal=baseFromOverpass(elements,options);
      if(!Array.isArray(elements)||options?.allowNamed)return normal;
      const possible=elements
        .filter(element=>element?.tags?.['pizzascan:evidence']==='possible')
        .map(element=>PD.normalize(element,{allowNamed:true}))
        .filter(Boolean)
        .map(place=>({...place,pizzaEvidence:'possible',dataSource:'Photon · PizzaScan Kandidat'}));
      return PD.merge(normal,possible);
    };

    const baseFilter=PD.filter.bind(PD);
    PD.filter=function(list,cfg,context,hours){
      const broad=baseFilter(list,{...cfg,includeItalian:true},context,hours);
      return broad.filter(place=>evidenceAllowed(place,cfg,false));
    };

    const baseSuggestions=PD.suggestions.bind(PD);
    PD.suggestions=function(list,query,center){
      return baseSuggestions(list,query,center).filter(place=>venueAllowed(place,query,center,true));
    };

    const rawPhoton=service.photon.bind(service);
    function wrapPhoton(){
      const current=service.photon;
      if(current?.__pizzaSettingsExact)return;
      const wrapped=async function(query,center,options={}){
        const items=await current.call(this,query,center,options);
        if(!Array.isArray(items))return items;
        return items.filter(item=>item?.kind!=='venue'||venueAllowed(item.place||item,query,center,true));
      };
      wrapped.__pizzaSettingsExact=true;
      wrapped.__pizzaSettingsInner=current;
      service.photon=wrapped;
    }
    wrapPhoton();

    service.nearbyFallback=async function(query,{signal,onStatus}={}){
      const area=parseArea(query),cfg=currentConfig();
      if(!area||!Array.isArray(cfg.types)||cfg.types.length===0)return [];
      const found=new Map();
      onStatus?.('Weitere passende Pizza-Orte werden ergänzt …');
      for(const term of fallbackTerms(cfg)){
        if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
        try{
          const items=await rawPhoton(term,area.center,{signal});
          for(const item of items||[]){
            const place=item?.place;
            if(!place||!inScope(place,area,cfg,Core.distance))continue;
            const element=fallbackElement(item,term,cfg);
            if(!element)continue;
            const key=element.type+'-'+element.id;
            if(!found.has(key))found.set(key,element);
          }
          if(found.size>=12)break;
        }catch(error){
          if(signal?.aborted)throw error;
          this.lastErrors=this.lastErrors||[];
          this.lastErrors.push({source:'photon.komoot.io',message:error.message,detail:error.detail||''});
        }
      }
      return [...found.values()];
    };

    const rawOverpass=service.overpass.bind(service);
    service.overpass=async function(query,options={}){
      const result=await rawOverpass(query,options);
      const area=parseArea(query);
      if(!area||result?.source==='photon.komoot.io')return result;
      let count=0;
      try{count=PD.fromOverpass(result?.data?.elements||[]).length;}catch{}
      if(count>=6)return result;
      try{
        const extra=await this.nearbyFallback(query,options);
        if(!extra.length)return result;
        const elements=mergeElements(result?.data?.elements||[],extra);
        return {data:{...(result.data||{}),elements},source:result.source+' + photon.komoot.io'};
      }catch(error){
        if(options.signal?.aborted)throw error;
        return result;
      }
    };

    try{
      const marker='pizzascan-hybrid-discovery-v2';
      if(root.localStorage&&!root.localStorage.getItem(marker)){
        root.localStorage.removeItem('pizzascan-map-cache-v3');
        const remove=[];
        for(let i=0;i<root.localStorage.length;i++){
          const key=root.localStorage.key(i);
          if(key?.startsWith('pizzascan-search-'))remove.push(key);
        }
        remove.forEach(key=>root.localStorage.removeItem(key));
        root.localStorage.setItem(marker,'1');
      }
    }catch{}

    const wrapAfterSearchUi=()=>wrapPhoton();
    if(root.document?.readyState==='loading')root.addEventListener('DOMContentLoaded',wrapAfterSearchUi,{once:true});
    else wrapAfterSearchUi();
  }

  return {evidenceAllowed,normalizedWords,explicitQueryMatches,parseArea,fallbackTerms,inScope,fallbackElement,mergeElements,install};
});
