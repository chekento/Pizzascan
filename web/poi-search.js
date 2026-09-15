/* Precise submitted POI search helpers. Every PizzaScan map category and the
 * original Italian/pizza discovery vocabulary are searchable as real OSM POIs. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PizzaPoiSearch=api;
})(globalThis,function(){
'use strict';

const FOOD_AMENITIES='restaurant|fast_food|cafe|food_truck|takeaway|food_court|bar|pub|biergarten';
const ITALIAN_CUISINE='italian|italiano|italiana|pasta';
const ITALIAN_NAMES='ristorante|trattoria|osteria|italian|italiano|italiana|italiener|italienisch';
const GENERIC=new Set(['pizza','pizzeria','pizzaria','restaurant','restaurants','ristorante','trattoria','osteria','italian','italiano','italiana','italiener','italienisch','cafe','coffee','kaffee','bar','pub','biergarten','imbiss','fast','food','schnellrestaurant','snack','takeaway','foodtruck','truck','street','pizzaautomat','automat','vending','weitere','orte','gemerkt','gespeichert','favorit','favoriten','besucht','bewertet','standort','gps','mein','meine','dein','deine']);

function text(value){return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function escapeRegex(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function tokens(value){return text(value).split(' ').filter(Boolean).slice(0,10);}
function variants(query){
  const words=tokens(query);if(!words.length)return [];
  const out=[];
  const push=v=>{v=text(v);if(v.length>=2&&!out.includes(v))out.push(v);};
  push(words.join(' '));
  for(let size=Math.min(4,words.length);size>=2;size--)for(let i=0;i+size<=words.length;i++)push(words.slice(i,i+size).join(' '));
  for(const word of words)if(word.length>=4&&!GENERIC.has(word))push(word);
  if(out.length===1&&words.length===1)push(words[0]);
  return out.slice(0,16);
}
function categoryIntent(query){
  const q=' '+text(query)+' ',out=[];
  const add=x=>{if(!out.includes(x))out.push(x);};
  if(/ pizzaautomat | pizza autom| pizza vending | vending pizza | pizza vending machine | automat /.test(q))add('vending_pizza');
  if(/ foodtruck | food truck | imbisswagen | street food /.test(q))add('food_truck');
  if(/ cafe | coffee | kaffee | cafeteria /.test(q))add('cafe');
  if(/ imbiss | fast food | schnellrestaurant | snack /.test(q))add('fast_food');
  if(/ pizza | pizzeria | pizzaria | pizze /.test(q))add('pizza');
  if(/ italian | italiano | italiana | italiener | italienisch | ristorante | trattoria | osteria /.test(q))add('italian');
  if(/ restaurant | restaurants | takeaway | food court | bar | pub | biergarten | weitere orte /.test(q))add('other');
  if(out.includes('vending_pizza'))return ['vending_pizza'];
  return out;
}
function stateIntent(query){
  const q=' '+text(query)+' ',out=[];
  if(/ gemerkt | gespeichert | favorit | favoriten /.test(q))out.push('saved');
  if(/ besucht | bewertet /.test(q))out.push('visited');
  if(/ mein standort | meine position | dein standort | gps | standort /.test(q))out.push('location');
  return out;
}
function genericOnly(query){const w=tokens(query);return !!w.length&&w.every(x=>GENERIC.has(x));}
function categoryQuery(categories,area,pattern=''){
  const named=(base)=>pattern?`${base}["name"~"${pattern}",i](${area});${base}["brand"~"${pattern}",i](${area});${base}["operator"~"${pattern}",i](${area});`:`${base}["name"](${area});`;
  let out='';
  for(const category of categories){
    if(category==='cafe')out+=named('nwr["amenity"="cafe"]');
    else if(category==='fast_food')out+=named('nwr["amenity"="fast_food"]');
    else if(category==='food_truck')out+=named('nwr["amenity"="food_truck"]')+named('nwr["amenity"~"restaurant|fast_food|cafe"]["mobile"="yes"]');
    else if(category==='vending_pizza')out+=`nwr["amenity"="vending_machine"]["vending"~"pizza",i](${area});nwr["vending"~"pizza",i](${area});nwr["vending:pizza"="yes"](${area});`;
    else if(category==='pizza')out+=`nwr["amenity"~"${FOOD_AMENITIES}"]["cuisine"~"pizza|pizzeria",i](${area});nwr["amenity"~"${FOOD_AMENITIES}"]["name"~"pizza|pizzeria|pizzaria|pizze",i](${area});nwr["shop"~"deli|bakery|convenience"]["name"~"pizza|pizzeria|pizzaria|pizze",i](${area});nwr["vending"~"pizza",i](${area});nwr["vending:pizza"="yes"](${area});`;
    else if(category==='italian')out+=`nwr["amenity"~"${FOOD_AMENITIES}"]["cuisine"~"${ITALIAN_CUISINE}",i](${area});nwr["amenity"~"${FOOD_AMENITIES}"]["name"~"${ITALIAN_NAMES}",i](${area});nwr["amenity"~"${FOOD_AMENITIES}"]["brand"~"${ITALIAN_NAMES}",i](${area});nwr["amenity"~"${FOOD_AMENITIES}"]["operator"~"${ITALIAN_NAMES}",i](${area});`;
    else if(category==='other')out+=named('nwr["amenity"~"restaurant|takeaway|food_court|bar|pub|biergarten"]');
  }
  return out;
}
function exactNameQuery(area,pattern){
  if(!pattern)return '';
  return `nwr["amenity"~"${FOOD_AMENITIES}"]["name"~"${pattern}",i](${area});`+
    `nwr["amenity"~"${FOOD_AMENITIES}"]["brand"~"${pattern}",i](${area});`+
    `nwr["amenity"~"${FOOD_AMENITIES}"]["operator"~"${pattern}",i](${area});`+
    `nwr["shop"~"deli|bakery|convenience"]["name"~"${pattern}",i](${area});`+
    `nwr["amenity"="vending_machine"]["name"~"${pattern}",i](${area});`;
}
function buildQuery(query,center,radiusKm=10){
  const lat=Number(center?.lat),lng=Number(center?.lng),radius=Math.round(Math.max(.5,Math.min(10,Number(radiusKm)||10))*1000);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<-90||lat>90||lng<-180||lng>180)return '';
  const q=String(query||'').trim();if(q.length<2||q.length>100)return '';
  const area=`around:${radius},${lat},${lng}`,categories=categoryIntent(q),states=stateIntent(q);
  const meaningful=tokens(q).filter(word=>!GENERIC.has(word));
  if(states.length&&!categories.length&&!meaningful.length)return '';
  const pattern=variants(q).map(escapeRegex).join('|');
  if(categories.length){
    let body=categoryQuery(categories,area,meaningful.length?pattern:'');
    if(meaningful.length)body+=exactNameQuery(area,pattern);
    return body?`[out:json][timeout:20];(${body});out body center;`:'';
  }
  if(genericOnly(q))return `[out:json][timeout:20];(nwr["amenity"~"${FOOD_AMENITIES}"]["name"](${area});nwr["vending"~"pizza",i](${area});nwr["vending:pizza"="yes"](${area}););out body center;`;
  if(!pattern)return '';
  return `[out:json][timeout:20];(${exactNameQuery(area,pattern)});out body center;`;
}
function key(item){
  const p=item?.place||item;
  return p?.placeId||item?.osmId||[text(item?.name||p?.name),Number(item?.lat??p?.lat).toFixed(5),Number(item?.lng??p?.lng).toFixed(5)].join('|');
}
function matchesCategory(item,query){
  const intents=categoryIntent(query);if(!intents.length)return true;
  const p=item?.place||item||{};
  if(item?.kind==='location'&&!p?.placeId)return false;
  const type=p.type||item?.type||'',hay=text([p.name,p.cuisine,p.pizzaEvidence,p.tags?.cuisine,p.tags?.vending,p.tags?.speciality].filter(Boolean).join(' '));
  return intents.some(intent=>intent==='cafe'?type==='cafe':intent==='fast_food'?type==='fast_food':intent==='food_truck'?type==='food_truck':intent==='vending_pizza'?type==='vending_pizza':intent==='pizza'?(p.pizzaEvidence==='confirmed'||type==='vending_pizza'||/pizza|pizzeria|pizzaria|pizze/.test(hay)):intent==='italian'?(/italian|italiano|italiana|ristorante|trattoria|osteria|italiener|italienisch|pasta/.test(hay)):intent==='other'?['pizzeria','other'].includes(type):true);
}
function matchesState(item,query){const intents=stateIntent(query);if(!intents.length)return true;const states=new Set(item?.searchStates||[]);return intents.some(x=>states.has(x));}
function score(item,query,center,distance){
  const p=item?.place||item||{},name=text(item?.name||p.name),address=text(item?.address||p.address),q=text(query),words=tokens(query),hay=(name+' '+address).trim();
  if(!name||!matchesCategory(item,query)||!matchesState(item,query))return -1;
  const categories=categoryIntent(query),states=stateIntent(query),isGeneric=genericOnly(query),meaningfulWords=words.filter(word=>!GENERIC.has(word));
  let exact=false,s=item?.kind==='venue'||p?.placeId?700:0;
  if(name===q){s+=10000;exact=true;}
  else if(q.startsWith(name+' ')){s+=9200;exact=true;}
  else if(name.startsWith(q+' ')){s+=9000;exact=true;}
  else if(name.includes(q)){s+=8200;exact=true;}
  let hits=0,nameHits=0,meaningfulHits=0;
  for(const word of words){const inHay=hay.includes(word),inName=name.includes(word);if(inHay)hits++;if(inName)nameHits++;if(!GENERIC.has(word)&&inHay)meaningfulHits++;}
  if(meaningfulWords.length&&!exact&&meaningfulHits===0)return -1;
  if(!isGeneric&&!categories.length&&!states.length&&!exact&&!meaningfulWords.length&&hits===0)return -1;
  if(words.length){const coverage=hits/words.length;s+=Math.round(2600*coverage)+nameHits*250;if(hits===words.length)s+=1200;}
  if(categories.length)s+=2400;if(states.length)s+=3000;if(item?.osmId||p?.placeId)s+=300;
  if(typeof distance==='function'&&center&&Number.isFinite(p.lat??item?.lat)&&Number.isFinite(p.lng??item?.lng)){
    try{s-=Math.min(120,Math.max(0,distance(center,{lat:p.lat??item.lat,lng:p.lng??item.lng})*3));}catch{}
  }
  return s;
}
function mergeRanked(groups,query,center,distance){
  const map=new Map();
  for(const group of groups||[])for(const item of group||[]){
    if(!item)continue;const k=key(item),existing=map.get(k);
    if(!existing){map.set(k,item);continue;}
    const oldScore=score(existing,query,center,distance),newScore=score(item,query,center,distance);
    if(newScore>oldScore||(!existing.place&&item.place))map.set(k,item);
  }
  return [...map.values()].map(item=>({item,score:score(item,query,center,distance)})).filter(x=>x.score>=0).sort((a,b)=>b.score-a.score||String(a.item.name||'').localeCompare(String(b.item.name||''))).slice(0,80).map(x=>x.item);
}

return {FOOD_AMENITIES,ITALIAN_CUISINE,ITALIAN_NAMES,GENERIC,text,tokens,variants,categoryIntent,stateIntent,genericOnly,categoryQuery,exactNameQuery,buildQuery,matchesCategory,matchesState,score,mergeRanked};
});
