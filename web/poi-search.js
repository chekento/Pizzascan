/* Precise submitted POI search helpers. Autocomplete stays lightweight; submitted searches are cross-checked against OpenStreetMap POIs. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PizzaPoiSearch=api;
})(globalThis,function(){
'use strict';

const FOOD_AMENITIES='restaurant|fast_food|cafe|food_truck|takeaway|food_court|bar|pub|biergarten';
const GENERIC=new Set(['pizza','pizzeria','pizzaria','restaurant','ristorante','trattoria','osteria','cafe','café','bar','pub','imbiss','fast','food','takeaway']);

function text(value){
  return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}
function escapeRegex(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function tokens(value){return text(value).split(' ').filter(Boolean).slice(0,8);}
function variants(query){
  const words=tokens(query);if(!words.length)return [];
  const out=[];
  const push=v=>{v=text(v);if(v.length>=2&&!out.includes(v))out.push(v);};
  push(words.join(' '));
  for(let size=Math.min(4,words.length);size>=2;size--)for(let i=0;i+size<=words.length;i++)push(words.slice(i,i+size).join(' '));
  for(const word of words)if(word.length>=4&&!GENERIC.has(word))push(word);
  if(out.length===1&&words.length===1)push(words[0]);
  return out.slice(0,12);
}
function genericOnly(query){const w=tokens(query);return !!w.length&&w.every(x=>GENERIC.has(x));}
function buildQuery(query,center,radiusKm=10){
  const lat=Number(center?.lat),lng=Number(center?.lng),radius=Math.round(Math.max(.5,Math.min(10,Number(radiusKm)||10))*1000);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<-90||lat>90||lng<-180||lng>180)return '';
  const q=String(query||'').trim();if(q.length<2||q.length>100)return '';
  const area=`around:${radius},${lat},${lng}`;
  if(genericOnly(q)){
    const pizza=/pizza|pizzeria|pizzaria/.test(text(q));
    return `[out:json][timeout:15];(`+
      `nwr["amenity"~"${FOOD_AMENITIES}"]["name"](${area});`+
      (pizza?`nwr["amenity"~"${FOOD_AMENITIES}"]["cuisine"~"pizza|pizzeria",i](${area});nwr["shop"~"deli|bakery|convenience"]["name"~"pizza|pizzeria|pizzaria",i](${area});`:'')+
      `);out body center;`;
  }
  const pattern=variants(q).map(escapeRegex).join('|');if(!pattern)return '';
  return `[out:json][timeout:15];(`+
    `nwr["amenity"~"${FOOD_AMENITIES}"]["name"~"${pattern}",i](${area});`+
    `nwr["amenity"~"${FOOD_AMENITIES}"]["brand"~"${pattern}",i](${area});`+
    `nwr["amenity"~"${FOOD_AMENITIES}"]["operator"~"${pattern}",i](${area});`+
    `nwr["shop"~"deli|bakery|convenience"]["name"~"${pattern}",i](${area});`+
    `);out body center;`;
}
function key(item){
  const p=item?.place||item;
  return p?.placeId||item?.osmId||[text(item?.name||p?.name),Number(item?.lat??p?.lat).toFixed(5),Number(item?.lng??p?.lng).toFixed(5)].join('|');
}
function score(item,query,center,distance){
  const p=item?.place||item||{},name=text(item?.name||p.name),address=text(item?.address||p.address),q=text(query),words=tokens(query),hay=(name+' '+address).trim();
  if(!name)return -1;
  const isGeneric=genericOnly(query);
  let exact=false,s=item?.kind==='venue'||p?.placeId?700:0;
  if(name===q){s+=10000;exact=true;}
  else if(q.startsWith(name+' ')){s+=9200;exact=true;}
  else if(name.startsWith(q+' ')){s+=9000;exact=true;}
  else if(name.includes(q)){s+=8200;exact=true;}
  let hits=0,nameHits=0,meaningfulHits=0;
  for(const word of words){
    const inHay=hay.includes(word),inName=name.includes(word);
    if(inHay)hits++;
    if(inName)nameHits++;
    if(!GENERIC.has(word)&&inHay)meaningfulHits++;
  }
  const meaningfulWords=words.filter(word=>!GENERIC.has(word));
  if(!isGeneric&&!exact){
    if(meaningfulWords.length&&meaningfulHits===0)return -1;
    if(!meaningfulWords.length&&hits===0)return -1;
  }
  if(words.length){const coverage=hits/words.length;s+=Math.round(4200*coverage)+nameHits*250;if(hits===words.length)s+=1500;}
  if(item?.osmId||p?.placeId)s+=300;
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
  return [...map.values()].map(item=>({item,score:score(item,query,center,distance)})).filter(x=>x.score>=0).sort((a,b)=>b.score-a.score||String(a.item.name||'').localeCompare(String(b.item.name||''))).slice(0,20).map(x=>x.item);
}

return {FOOD_AMENITIES,text,tokens,variants,genericOnly,buildQuery,score,mergeRanked};
});
