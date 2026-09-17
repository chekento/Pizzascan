/* PizzaScan worldwide hardening: neutral first launch, Unicode search and global geocoding. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaGlobalHardening=api;api.install(root);}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const AWAIT_KEY='pizzascan-global-awaiting-center-v1';
const MAP_KEY='pizzascan-map-view-v1';
const PHOTON_LANGS=new Set(['de','en','fr','it']);

function unicodeText(value){
  return String(value??'').normalize('NFD').replace(/(\p{Script=Latin})\p{M}+/gu,'$1').normalize('NFC').replace(/ß/g,'ss').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
}
function safeJson(value,fallback=null){try{return JSON.parse(value??'null')??fallback;}catch{return fallback;}}
function validCenter(center,Core){return !!center&&Core?.coords?.(Number(center.lat),Number(center.lng));}
function appLanguage(root){return String(root?.document?.documentElement?.lang||'').toLowerCase().slice(0,2);}
function overpassEscape(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/"/g,'\\"').replace(/[\r\n]+/g,' ');}
function tokens(value){return unicodeText(value).split(' ').filter(Boolean).slice(0,12);}
function variants(value,generic){
  const words=tokens(value);if(!words.length)return [];
  const out=[];const push=v=>{v=unicodeText(v);if(v.length>=2&&!out.includes(v))out.push(v);};
  push(words.join(' '));
  for(let size=Math.min(4,words.length);size>=2;size--)for(let i=0;i+size<=words.length;i++)push(words.slice(i,i+size).join(' '));
  for(const word of words)if(word.length>=2&&!generic.has(word))push(word);
  return out.slice(0,18);
}

function hardenPlaces(Places,Core,root={}){
  if(!Places||!Core)return Places;
  Places.text=unicodeText;
  Places.rank=function(place,query,center){
    const name=unicodeText(place?.name),address=unicodeText(place?.address),q=unicodeText(query),words=tokens(query);let score=name===q?1000:0;
    for(const word of words){if(name.split(' ').includes(word))score+=100;else if(name.includes(word))score+=45;else if(address.includes(word))score+=15;else return -1;}
    if(validCenter(center,Core)&&Core.coords(place?.lat,place?.lng))score-=Math.min(20,Core.distance(center,place));
    return score;
  };
  Places.suggestions=function(list,query,center){return [...new Map((list||[]).map(p=>[p.placeId,p])).values()].map(p=>({p,score:Places.rank(p,query,center)})).filter(x=>x.score>=0).sort((a,b)=>b.score-a.score).slice(0,8).map(x=>x.p);};

  const proto=Places.Service?.prototype;
  if(proto&&!proto.photon?.__worldwide){
    const worldwidePhoton=async function(query,center,{signal,force=false}={}){
      const q=String(query??'').trim();if(q.length<2||q.length>160)throw Error('Ungültige Suchanfrage');
      const hasCenter=validCenter(center,Core)&&!root.PizzaScanGlobalFresh;
      const language=appLanguage(root),centerKey=hasCenter?`${Number(center.lat).toFixed(3)}|${Number(center.lng).toFixed(3)}`:'global';
      const key=`${unicodeText(q)}|${centerKey}|${language||'native'}`,stored=this.cache.get(key)||this.read('pizzascan-search-'+key);
      if(!force&&stored&&Date.now()-stored.time<86400000)return stored.items;
      const run=async()=>{
        if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
        await new Promise(r=>setTimeout(r,Math.max(0,1100-(Date.now()-this.lastPhoton))));
        if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
        this.lastPhoton=Date.now();
        const url=new URL('https://photon.komoot.io/api/'),params=new URLSearchParams({q,limit:'8'});
        if(hasCenter){params.set('lat',String(center.lat));params.set('lon',String(center.lng));}
        if(PHOTON_LANGS.has(language))params.set('lang',language);
        url.search=params;
        const data=await this.json(url.href,{},signal,8000),items=Places.fromPhoton(data),entry={time:Date.now(),items};
        this.cache.set(key,entry);this.write('pizzascan-search-'+key,entry);return items;
      };
      const promise=this.photonQueue.then(run,run);this.photonQueue=promise.catch(()=>{});return promise;
    };
    worldwidePhoton.__worldwide=true;proto.photon=worldwidePhoton;
  }
  return Places;
}

function hardenPoi(Poi,Core){
  if(!Poi||!Core||Poi.__worldwide)return Poi;
  const generic=new Set([...(Poi.GENERIC||[]),
    'pizza','pizzeria','pizzaria','pizze','restaurant','restaurants','restaurante','restaurantes','ristorante','ristoranti','restauracao','restauration','ristorazione',
    'italian','italiano','italiana','italien','italienne','italienisch','ristorante','trattoria','osteria','pasta',
    'cafe','caffe','cafeteria','coffee','kaffee','bar','pub','biergarten','imbiss','fast','food','rapida','rapide','snack','takeaway','foodtruck','truck','camion','camioncino','street',
    'pizzaautomat','automat','vending','machine','maquina','expendedora','distributore','distributeur','weitere','orte','places','lugares','luoghi','lieux',
    'gemerkt','gespeichert','favorit','favoriten','saved','favorite','favorites','bookmarked','salvato','salvati','preferito','preferiti','guardado','guardados','favorito','favoritos','enregistre','enregistres','favori','favoris',
    'besucht','bewertet','visited','rated','visitato','visitati','valutato','valutati','visitado','visitados','valorado','valorados','visite','visites','evalue','evaluer',
    'standort','position','gps','location','current','my','mein','meine','dein','deine','posizione','mia','ubicacion','actual','mi','emplacement','actuel','ma'
  ]);
  Poi.GENERIC=generic;Poi.text=unicodeText;Poi.tokens=tokens;Poi.variants=value=>variants(value,generic);
  Poi.categoryIntent=function(query){
    const q=' '+unicodeText(query)+' ',out=[];const add=x=>{if(!out.includes(x))out.push(x);};
    if(/ pizzaautomat | vending pizza | pizza vending | pizza vending machine | maquina (?:expendedora )?de pizza | distributore (?:automatico )?di pizza | distributeur (?:automatique )?de pizza | automat /.test(q))add('vending_pizza');
    if(/ foodtruck | food truck | imbisswagen | street food | camion de comida | camion restaurant | camioncino /.test(q))add('food_truck');
    if(/ cafe | caffe | coffee | kaffee | cafeteria /.test(q))add('cafe');
    if(/ imbiss | fast food | schnellrestaurant | snack | comida rapida | restauration rapide | ristorazione rapida /.test(q))add('fast_food');
    if(/ pizza | pizzeria | pizzaria | pizze | ピザ | 披萨 | 披薩 | بيتزا | пицц/.test(q))add('pizza');
    if(/ italian | italiano | italiana | italiener | italienisch | italien | italienne | ristorante | trattoria | osteria | итальян | 意大利 /.test(q))add('italian');
    if(/ restaurant | restaurants | restaurante | restaurantes | ristorante | ristoranti | takeaway | food court | bar | pub | biergarten | weitere orte | otros lugares | altri luoghi | autres lieux /.test(q))add('other');
    if(out.includes('vending_pizza'))return ['vending_pizza'];return out;
  };
  Poi.stateIntent=function(query){
    const q=' '+unicodeText(query)+' ',out=[];
    if(/ gemerkt | gespeichert | favorit | favoriten | saved | favorite | favorites | bookmarked | salvato | salvati | preferito | preferiti | guardado | guardados | favorito | favoritos | enregistre | enregistres | favori | favoris /.test(q))out.push('saved');
    if(/ besucht | bewertet | visited | rated | visitato | visitati | valutato | valutati | visitado | visitados | valorado | valorados | visite | visites | evalue /.test(q))out.push('visited');
    if(/ mein standort | meine position | my location | current location | gps | standort | mia posizione | posizione attuale | mi ubicacion | ubicacion actual | mon emplacement | emplacement actuel /.test(q))out.push('location');
    return out;
  };
  Poi.genericOnly=query=>{const words=tokens(query);return !!words.length&&words.every(x=>generic.has(x));};
  Poi.buildQuery=function(query,center,radiusKm=10){
    const lat=Number(center?.lat),lng=Number(center?.lng),radius=Math.round(Math.max(.5,Math.min(10,Number(radiusKm)||10))*1000);
    if(!Core.coords(lat,lng))return '';
    const raw=String(query||'').trim();if(raw.length<2||raw.length>160)return '';
    const area=`around:${radius},${lat},${lng}`,categories=Poi.categoryIntent(raw),states=Poi.stateIntent(raw),meaningful=tokens(raw).filter(word=>!generic.has(word));
    if(states.length&&!categories.length&&!meaningful.length)return '';
    const pattern=variants(raw,generic).map(overpassEscape).join('|');
    if(categories.length){let body=Poi.categoryQuery(categories,area,meaningful.length?pattern:'');if(meaningful.length)body+=Poi.exactNameQuery(area,pattern);return body?`[out:json][timeout:20];(${body});out body center;`:'';}
    if(Poi.genericOnly(raw))return `[out:json][timeout:20];(nwr["amenity"~"${Poi.FOOD_AMENITIES}"]["name"](${area});nwr["vending"~"pizza",i](${area});nwr["vending:pizza"="yes"](${area}););out body center;`;
    if(!pattern)return '';return `[out:json][timeout:20];(${Poi.exactNameQuery(area,pattern)});out body center;`;
  };
  Poi.matchesCategory=function(item,query){
    const intents=Poi.categoryIntent(query);if(!intents.length)return true;const p=item?.place||item||{};if(item?.kind==='location'&&!p?.placeId)return false;
    const type=p.type||item?.type||'',hay=unicodeText([p.name,p.cuisine,p.pizzaEvidence,p.tags?.cuisine,p.tags?.vending,p.tags?.speciality].filter(Boolean).join(' '));
    return intents.some(intent=>intent==='cafe'?type==='cafe':intent==='fast_food'?type==='fast_food':intent==='food_truck'?type==='food_truck':intent==='vending_pizza'?type==='vending_pizza':intent==='pizza'?(p.pizzaEvidence==='confirmed'||type==='vending_pizza'||/pizza|pizzeria|pizzaria|pizze|ピザ|披萨|披薩|بيتزا|пицц/.test(hay)):intent==='italian'?(/italian|italiano|italiana|ristorante|trattoria|osteria|italien|italienne|italienisch|pasta|итальян|意大利/.test(hay)):intent==='other'?['pizzeria','other'].includes(type):true);
  };
  Poi.matchesState=function(item,query){const intents=Poi.stateIntent(query);if(!intents.length)return true;const states=new Set(item?.searchStates||[]);return intents.some(x=>states.has(x));};
  Poi.score=function(item,query,center,distance){
    const p=item?.place||item||{},name=unicodeText(item?.name||p.name),address=unicodeText(item?.address||p.address),q=unicodeText(query),words=tokens(query),hay=(name+' '+address).trim();
    if(!name||!Poi.matchesCategory(item,query)||!Poi.matchesState(item,query))return -1;
    const categories=Poi.categoryIntent(query),states=Poi.stateIntent(query),isGeneric=Poi.genericOnly(query),meaningfulWords=words.filter(word=>!generic.has(word));let exact=false,score=item?.kind==='venue'||p?.placeId?700:0;
    if(name===q){score+=10000;exact=true;}else if(q.startsWith(name+' ')){score+=9200;exact=true;}else if(name.startsWith(q+' ')){score+=9000;exact=true;}else if(name.includes(q)){score+=8200;exact=true;}
    let hits=0,nameHits=0,meaningfulHits=0;for(const word of words){const inHay=hay.includes(word),inName=name.includes(word);if(inHay)hits++;if(inName)nameHits++;if(!generic.has(word)&&inHay)meaningfulHits++;}
    if(meaningfulWords.length&&!exact&&meaningfulHits===0)return -1;if(!isGeneric&&!categories.length&&!states.length&&!exact&&!meaningfulWords.length&&hits===0)return -1;
    if(words.length){score+=Math.round(2600*(hits/words.length))+nameHits*250;if(hits===words.length)score+=1200;}if(categories.length)score+=2400;if(states.length)score+=3000;if(item?.osmId||p?.placeId)score+=300;
    if(typeof distance==='function'&&validCenter(center,Core)&&Core.coords(Number(p.lat??item?.lat),Number(p.lng??item?.lng)))try{score-=Math.min(120,Math.max(0,distance(center,{lat:p.lat??item.lat,lng:p.lng??item.lng})*3));}catch{}
    return score;
  };
  Poi.mergeRanked=function(groups,query,center,distance){
    const map=new Map();for(const group of groups||[])for(const item of group||[]){if(!item)continue;const p=item?.place||item,key=p?.placeId||item?.osmId||[unicodeText(item?.name||p?.name),Number(item?.lat??p?.lat).toFixed(5),Number(item?.lng??p?.lng).toFixed(5)].join('|'),existing=map.get(key);if(!existing){map.set(key,item);continue;}if(Poi.score(item,query,center,distance)>Poi.score(existing,query,center,distance)||(!existing.place&&item.place))map.set(key,item);}
    return [...map.values()].map(item=>({item,score:Poi.score(item,query,center,distance)})).filter(x=>x.score>=0).sort((a,b)=>b.score-a.score||String(a.item.name||'').localeCompare(String(b.item.name||''))).slice(0,80).map(x=>x.item);
  };
  Poi.__worldwide=true;return Poi;
}

function installPoiHook(root,Core){
  if(root.PizzaPoiSearch){hardenPoi(root.PizzaPoiSearch,Core);return;}
  let value;try{Object.defineProperty(root,'PizzaPoiSearch',{configurable:true,enumerable:true,get(){return value;},set(next){value=hardenPoi(next,Core);}});}catch{}
}
function installMapPolicy(root,Core){
  const stored=safeJson(root.localStorage?.getItem(MAP_KEY),{}),awaiting=root.localStorage?.getItem(AWAIT_KEY)==='1'||!validCenter(stored,Core);
  root.PizzaScanGlobalFresh=awaiting;if(awaiting)try{root.localStorage?.setItem(AWAIT_KEY,'1');}catch{}
  if(typeof root.initMap==='function'&&!root.initMap.__worldwide){const old=root.initMap;root.initMap=function(){const out=old.apply(this,arguments);if(root.PizzaScanGlobalFresh)try{map.setView([20,0],2,{animate:false});root.localStorage?.removeItem(MAP_KEY);const status=root.document?.getElementById('map-status');if(status)status.textContent='GPS verwenden, weltweit nach Ort/Adresse suchen oder in eine Region hineinzoomen.';map.on('zoomend dragend',()=>{if(root.PizzaScanGlobalFresh&&map.getZoom()>=11){root.PizzaScanGlobalFresh=false;root.localStorage?.removeItem(AWAIT_KEY);}});}catch{}return out;};root.initMap.__worldwide=true;}
  if(typeof root.loadPlaces==='function'&&!root.loadPlaces.__worldwide){const old=root.loadPlaces;root.loadPlaces=async function(){if(root.PizzaScanGlobalFresh){let zoom=0;try{zoom=map?.getZoom?.()||0;}catch{}if(zoom<11){const status=root.document?.getElementById('map-status');if(status)status.textContent='Weltweite Suche bereit · GPS, Orts-/Adresssuche oder Karte verwenden.';return {awaitingLocation:true};}root.PizzaScanGlobalFresh=false;try{root.localStorage?.removeItem(AWAIT_KEY);}catch{}}return old.apply(this,arguments);};root.loadPlaces.__worldwide=true;}
}
function install(root){const Core=root.PizzaCore,Places=root.PizzaPlaces;if(!Core||!Places)return false;hardenPlaces(Places,Core,root);installPoiHook(root,Core);installMapPolicy(root,Core);return true;}
return {AWAIT_KEY,MAP_KEY,unicodeText,validCenter,hardenPlaces,hardenPoi,install};
});
