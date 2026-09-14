/* Review-driven restaurant discovery. Public review text is inspected transiently; only derived pizza evidence is cached. */
(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./core.js'):root.PizzaCore);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaReviewDiscovery=api;api.install(root);}
})(globalThis,function(C){
'use strict';
const KEY='pizzascan-pizza-review-evidence-v1',MARKER='pizzascan-review-discovery-v1',MAX_AGE=7*86400000,MAX_ROWS=2200;
const FOOD=/^(restaurant|fast_food|cafe|food_truck|bar|pub|biergarten|takeaway|food_court)$/;
const LICENSES=new Set(['CC-BY-4.0','CC-BY-SA-4.0']);
const norm=v=>String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function mentionsPizza(value){const s=norm(value);if(!s)return false;return s.split(/\s+/).some(w=>/^pizza(?:s|en|teig|belag|ofen|stueck)?$/.test(w)||/^pizzer(?:ia|ias|ie)$/.test(w)||/^pizzaria(?:s)?$/.test(w));}
function osmId(v){const m=/^(?:https?:\/\/(?:www\.)?openstreetmap\.org\/)?(node|way|relation)[/-](\d+)(?:\/\d+)?$/.exec(String(v||''));return m?m[1]+'-'+m[2]:'';}
function geo(subject){try{const u=new URL(subject);if(u.protocol!=='geo:')return null;const parts=u.pathname.split(';')[0].split(',');if(parts.length!==2)return null;const lat=Number(parts[0]),lng=Number(parts[1]);if(!C?.coords(lat,lng))return null;return {lat,lng,name:u.searchParams.get('q')||''};}catch{return null;}}
function reviewRow(review,now=Date.now()){
 const p=review?.payload,m=p?.metadata||{};if(!p||!Number.isInteger(p.rating)||p.rating<0||p.rating>100)return null;if(p.action&&p.action!=='edit')return null;
 const position=geo(p.sub)||geo(review.original_sub),license=m.license||'CC-BY-4.0';if(!position||!LICENSES.has(license)||m.data_source||m.is_generated===true||m.is_affiliated===true)return null;
 if(!Number.isFinite(p.iat)||p.iat<1577836800||p.iat*1000>now+86400000)return null;if(!/^[A-Za-z0-9_-]{20,200}$/.test(review.signature||''))return null;
 const actor=typeof review.did==='string'&&review.did.startsWith('did:')?review.did:typeof review.kid==='string'?review.kid.replace(/\s/g,''):'';if(!actor||actor.length>1600)return null;
 return {signature:review.signature,actor,osmId:osmId(m.osm_id),lat:position.lat,lng:position.lng,name:String(position.name||'').slice(0,200),iat:p.iat,mentionsPizza:mentionsPizza(p.opinion),seenAt:now};
}
function samePlace(row,place,known=[place]){const d=C.distance(row,place);if(row.osmId)return row.osmId===place.placeId&&d<=.2;if(d>.025||norm(row.name)!==norm(place.name))return false;return !known.some(other=>other.placeId!==place.placeId&&norm(other.name)===norm(row.name)&&C.distance(row,other)<=.025);}
function evidence(rows,place,known=[place]){const authors=new Map();for(const row of rows||[]){if(!samePlace(row,place,known))continue;const old=authors.get(row.actor);if(!old||row.iat>old.iat||row.iat===old.iat&&row.signature>old.signature)authors.set(row.actor,row);}const selected=[...authors.values()].filter(r=>r.mentionsPizza);return {pizzaMentions:selected.length,latest:selected.length?Math.max(...selected.map(r=>r.iat))*1000:null};}
function readRows(storage=globalThis.localStorage,now=Date.now()){try{const data=JSON.parse(storage?.getItem(KEY)||'null');if(data?.version!==1||!Array.isArray(data.rows))return [];return data.rows.filter(r=>r&&typeof r.signature==='string'&&typeof r.actor==='string'&&C.coords(r.lat,r.lng)&&Number.isFinite(r.iat)&&Number.isFinite(r.seenAt)&&now-r.seenAt<=MAX_AGE&&typeof r.mentionsPizza==='boolean').slice(-MAX_ROWS);}catch{return [];}}
function mergeRows(oldRows,newRows,now=Date.now()){const map=new Map();for(const r of [...oldRows,...newRows]){if(!r||now-r.seenAt>MAX_AGE)continue;const before=map.get(r.signature);if(!before||r.seenAt>=before.seenAt)map.set(r.signature,r);}return [...map.values()].sort((a,b)=>a.seenAt-b.seenAt).slice(-MAX_ROWS);}
function writeRows(rows,storage=globalThis.localStorage){try{storage?.setItem(KEY,JSON.stringify({version:1,rows:rows.slice(-MAX_ROWS)}));return true;}catch{return false;}}
function queryScope(q){const around=/(around:\d+,-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?)/.exec(String(q));if(around)return around[1];const box=/\]\((-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?)\)/.exec(String(q));return box?box[1]:'';}
function expandQuery(q){const text=String(q||''),scope=queryScope(text);if(!scope||text.includes('pizzascan:review-candidate'))return text;const extra=`nwr["amenity"~"restaurant|fast_food|cafe|food_truck|bar|pub|biergarten|takeaway|food_court",i](${scope});`;return text.replace(/\);out body center;\s*$/,`${extra});out body center;`);}
function genericFood(element){const t=element?.tags||{};return FOOD.test(t.amenity||'')&&!!(t.name||t.brand);}
function categoryQuery(q){const words=norm(q).split(/\s+/).filter(Boolean);return words.length>0&&words.every(w=>['restaurant','restaurants','restaurante','restaurantes','ristorante','ristoranti','food','essen','lokal','lokale'].includes(w));}
function mergeElements(primary=[],secondary=[]){const map=new Map();for(const e of [...primary,...secondary]){const key=e&&`${e.type}-${e.id}`;if(!key||key==='undefined-undefined')continue;if(!map.has(key))map.set(key,e);}return [...map.values()];}
function install(root){
 const PD=root.PizzaPlaces,UI=root.PizzaRatingsUI,Ratings=root.PizzaRatings;if(!PD||!UI||!Ratings||!C)return;
 let service=null;try{if(typeof placeService!=='undefined')service=placeService;}catch{}
 try{if(root.localStorage&&!root.localStorage.getItem(MARKER)){root.localStorage.removeItem('pizzascan-map-cache-v3');root.localStorage.removeItem('pizzascan-open-ratings-v1');root.localStorage.setItem(MARKER,'1');}}catch{}
 let rows=readRows(root.localStorage);const getRows=()=>rows;
 const proto=Ratings.Service?.prototype;
 if(proto&&!proto.request.__pizzaReviewDiscovery){
   const baseRequest=proto.request;
   proto.request=async function(url,signal){const reviews=await baseRequest.call(this,url,signal);try{const derived=(reviews||[]).map(r=>reviewRow(r)).filter(Boolean);if(derived.length){rows=mergeRows(rows,derived);writeRows(rows,root.localStorage);}}catch{}return reviews;};
   proto.request.__pizzaReviewDiscovery=true;
   const baseGet=proto.get;
   proto.get=function(place,known=[place]){const result=baseGet.call(this,place,known),ev=evidence(getRows(),place,known);return {...result,...ev};};
 }
 if(!PD.query.__pizzaReviewDiscovery){const base=PD.query.bind(PD);PD.query=function(...args){return expandQuery(base(...args));};PD.query.__pizzaReviewDiscovery=true;}
 if(!PD.fromOverpass.__pizzaReviewDiscovery){const base=PD.fromOverpass.bind(PD);PD.fromOverpass=function(elements,options){const normal=base(elements,options);if(options?.allowNamed||!Array.isArray(elements))return normal;const candidates=elements.filter(genericFood).map(e=>PD.normalize(e,{allowNamed:true})).filter(Boolean).map(p=>p.pizzaEvidence==='search'?{...p,dataSource:'OpenStreetMap · Restaurant-Kandidat'}:p);return PD.merge(normal,candidates);};PD.fromOverpass.__pizzaReviewDiscovery=true;}
 if(service&&!service.overpass.__pizzaReviewDiscovery){const base=service.overpass.bind(service);service.overpass=async function(query,options={}){const result=await base(query,options);if(String(result?.source||'').includes('photon.komoot.io'))return result;let strong=0;try{strong=(result?.data?.elements||[]).map(e=>PD.normalize(e)).filter(Boolean).length;}catch{}if(strong>=6)return result;try{const extra=await this.nearbyFallback(query,options);if(!extra?.length)return result;return {data:{...(result.data||{}),elements:mergeElements(result?.data?.elements||[],extra)},source:String(result.source||'OpenStreetMap')+' + photon.komoot.io'};}catch(error){if(options.signal?.aborted)throw error;return result;}};service.overpass.__pizzaReviewDiscovery=true;}
 if(!PD.filter.__pizzaReviewDiscovery){const base=PD.filter.bind(PD);PD.filter=function(list,cfg,context,hours){const normal=base(list,cfg,context,hours);if(cfg?.ratingsEnabled===false)return normal;const known=list||[],extra=known.filter(p=>p?.pizzaEvidence==='search'&&Array.isArray(cfg?.types)&&cfg.types.includes(p.type)).filter(p=>{if(cfg.onlyOpen){const state=hours(p).state;if(state!=='open'&&!(cfg.unknownHours&&state==='unknown'))return false;}if(cfg.hideVisited&&context?.visited?.has(p.placeId))return false;return (UI.summary(p)?.pizzaMentions||0)>0;});return PD.merge(normal,extra);};PD.filter.__pizzaReviewDiscovery=true;}
 if(!PD.suggestions.__pizzaReviewDiscovery){const base=PD.suggestions.bind(PD);PD.suggestions=function(list,q,center){const normal=base(list,q,center);if(!categoryQuery(q))return normal;let cfg=PD.defaults;try{if(typeof mapConfig==='function')cfg=mapConfig();}catch{}const extra=(list||[]).filter(p=>Array.isArray(cfg.types)&&cfg.types.includes(p.type)).sort((a,b)=>{const ea=a.pizzaEvidence==='confirmed'?4:(UI.summary(a)?.pizzaMentions||0)>0?3:a.pizzaEvidence==='possible'?2:1,eb=b.pizzaEvidence==='confirmed'?4:(UI.summary(b)?.pizzaMentions||0)>0?3:b.pizzaEvidence==='possible'?2:1;return eb-ea||C.distance(center,a)-C.distance(center,b);});return [...new Map([...normal,...extra].map(p=>[p.placeId,p])).values()].slice(0,12);};PD.suggestions.__pizzaReviewDiscovery=true;}
 const basePrivacy=UI.privacyHtml?.bind(UI);if(basePrivacy&&!UI.privacyHtml.__pizzaReviewDiscovery){UI.privacyHtml=function(){return basePrivacy()+`<p><strong>Pizza-Erkennung aus offenen Rezensionen:</strong> Wenn offene Bewertungen aktiviert sind, prüft PizzaScan den öffentlichen Meinungstext beim Abruf lokal darauf, ob Pizza ausdrücklich erwähnt wird. Der Rezensionstext selbst wird dafür nicht dauerhaft gespeichert; gespeichert wird nur ein abgeleitetes Ja/Nein-Signal mit Ortsbezug, öffentlicher Bewertungskennung und Zeitstempel. Dieses Signal kann ein sonst nicht als Pizzeria getaggtes Restaurant als Pizza-Kandidaten sichtbar machen.</p>`;};UI.privacyHtml.__pizzaReviewDiscovery=true;}
 const baseCard=UI.card?.bind(UI);if(baseCard&&!UI.card.__pizzaReviewDiscovery){UI.card=function(p){const html=baseCard(p),n=UI.summary(p)?.pizzaMentions||0;return n?html+`<p class="hint evidence" translate="no">🍕 Pizza in ${n} offener${n===1?'':'n'} Rezension${n===1?'':'en'} erwähnt</p>`:html;};UI.card.__pizzaReviewDiscovery=true;}
}
return {KEY,mentionsPizza,osmId,geo,reviewRow,samePlace,evidence,readRows,mergeRows,writeRows,queryScope,expandQuery,genericFood,categoryQuery,mergeElements,install};
});
