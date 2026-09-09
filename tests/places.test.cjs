const {test}=require('node:test'),assert=require('node:assert/strict');
const P=require('../web/places.js');
const center={lat:53.5511,lng:9.9937};
const element=(id,tags={},type='node')=>({type,id,lat:center.lat+id/100000,lon:center.lng,tags:{name:'Pizza '+id,amenity:'restaurant',cuisine:'pizza',...tags}});
const good=data=>({ok:true,status:200,json:async()=>data});
const bad={ok:false,status:503};
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i],get length(){return m.size;}};};
test('Original food categories and Italian candidates return with explicit pizza evidence',()=>{
 const list=P.fromOverpass([element(1),element(2,{amenity:'cafe'}),element(3,{amenity:'fast_food'}),element(4,{amenity:'food_truck'}),element(5,{amenity:'vending_machine','vending:pizza':'yes'}),element(6,{amenity:'pub'}),element(7,{name:'Trattoria Roma',cuisine:'italian'}),element(8,{name:'Sushi Bar',cuisine:'japanese'}),element(9,{disused:'yes'}),element(10,{amenity:'construction'})]);
 assert.deepEqual(list.map(p=>p.type),['pizzeria','cafe','fast_food','food_truck','vending_pizza','other','pizzeria']);
 assert.equal(list[6].pizzaEvidence,'possible');assert.equal(list[0].pizzaEvidence,'confirmed');assert.equal(new Set(Object.values(P.TYPES).map(x=>x.emoji)).size,6);
 assert.match(P.query(center,3),/italian/);assert.match(P.query(center,3),/around:3000/);assert.match(P.query(center,3),/vending:pizza/);
});
test('Contact, address, dietary, accessibility and menu fields survive refresh and storage',()=>{
 const full=P.normalize(element(1,{'addr:street':'Straße','addr:housenumber':'12','addr:postcode':'22926','addr:city':'Ahrensburg','contact:phone':'+49 123','contact:website':'example.org','website:menu':'https://example.org/menu',opening_hours:'24/7',wheelchair:'yes','diet:vegan':'yes',delivery:'yes','payment:cash':'yes'}));
 const partial=P.normalize(element(1));const merged=P.merge([full],[partial])[0];assert.equal(merged.address,'Straße 12, 22926 Ahrensburg');assert.equal(merged.phone,'+49 123');assert.equal(merged.menu,'https://example.org/menu');assert.equal(merged.openingHours,'24/7');assert.ok(P.features(merged).some(([k,v])=>k==='Vegan'&&v==='Ja'));assert.ok(P.features(merged).some(([k,v])=>k==='Bezahlung'&&v==='Bargeld'));
 assert.equal(P.merge([full],[partial,partial]).length,1);
});
test('Name and address search ranks exact names and accents without merging nearby branches',()=>{
 const list=P.fromOverpass([element(1,{name:'Pizza Max'}),element(2,{name:'Max Pizza'}),element(3,{name:'Pizza Max Hamburg'}),element(4,{name:'Pizzá Café','addr:street':'Hauptstraße','addr:housenumber':'7'})]);
 assert.equal(P.suggestions(list,'pizza max',center)[0].placeId,'node-1');assert.equal(P.suggestions(list,'cafe',center)[0].placeId,'node-4');assert.equal(P.suggestions(list,'hauptstrasse 7',center)[0].placeId,'node-4');assert.equal(P.suggestions(list,'sushi',center).length,0);assert.equal(P.merge([],list).length,4);
});
test('Only-open filter rejects unknown and closed places unless explicitly including unknown',()=>{
 const list=P.fromOverpass([element(1),element(2),element(3),element(4,{name:'Italia',cuisine:'italian'})]);const states={'node-1':'open','node-2':'closed','node-3':'unknown','node-4':'open'},hours=p=>({state:states[p.placeId]});
 const config={...P.defaults,onlyOpen:true};assert.deepEqual(P.filter(list,config,{},hours).map(p=>p.placeId),['node-1','node-4']);assert.equal(P.filter(list,{...config,unknownHours:true},{},hours).length,3);assert.equal(P.filter(list,{...config,includeItalian:false},{},hours).length,1);assert.equal(P.filter(list,{...config,hideVisited:true},{visited:new Set(['node-1'])},hours).length,1);assert.equal(P.filter(list,{...config,types:[]},{},hours).length,0);
});
test('Radius bounds and viewport handle zero coordinates and international date line',()=>{
 assert.equal(P.within({lat:0,lng:0},{lat:0,lng:0},1),true);assert.equal(P.within({lat:0,lng:.1},{lat:0,lng:0},1),false);assert.equal(P.within({lat:0,lng:-179},{},0,{south:-1,north:1,west:178,east:-178}),true);assert.throws(()=>P.detailQuery('node-2;out;'));assert.equal(P.detailQuery('way-12').includes('way(12)'),true);
});
test('A clean first request falls back on failure and remembers the working provider',async()=>{
 const called=[],service=new P.Service(async url=>{called.push(url);return url.includes('private.coffee')?bad:good({elements:[element(1)]});},memory());const result=await service.overpass(P.query(center,3));assert.equal(result.source,'overpass-api.de');assert.equal(result.data.elements.length,1);assert.equal(called.length,2);await service.overpass(P.query(center,3));assert.equal(called.length,3);assert.ok(called[2].includes('overpass-api.de'));
});
test('Partial server results and total outages do not become zero-match successes',async()=>{
 let calls=0;const service=new P.Service(async()=>{calls++;return calls===1?good({remark:'runtime error: timed out',elements:[]}):bad;},memory());await assert.rejects(service.overpass('query'),/Beide Kartenquellen/);assert.equal(calls,2);
});
test('Cancellation cannot start a fallback or overwrite results of a newer search',async()=>{
 let calls=0;const ctl=new AbortController(),service=new P.Service(async(url,o)=>{calls++;return new Promise((_,reject)=>o.signal.addEventListener('abort',()=>reject(new DOMException('Stopped','AbortError')),{once:true}));},memory());const promise=service.overpass('query',{signal:ctl.signal});ctl.abort();await assert.rejects(promise);assert.equal(calls,1);
});
test('Full storage is independent of successful network data',async()=>{
 const storage={setItem(){throw Error('QuotaExceededError');},getItem(){throw Error('Storage blocked');}},s=new P.Service(async()=>good({elements:[element(1)]}),storage);assert.equal(s.read('cache'),null);assert.equal(s.write('cache',{}),false);assert.equal((await s.overpass('query')).data.elements.length,1);
});
test('Detail address matching uses exact OSM identity, never a different branch',async()=>{
 const base=P.normalize(element(1,{name:'Pizza Max'})),geo=id=>({features:[{geometry:{coordinates:[center.lng,center.lat]},properties:{name:'Pizza Max',osm_type:'N',osm_id:id,osm_key:'amenity',osm_value:'restaurant',street:'Hamburger Straße',housenumber:'42',postcode:'22926',city:'Ahrensburg',countrycode:'DE',state:'Schleswig-Holstein'}}]});
 for(const [id,expected] of [[1,'Hamburger Straße 42, 22926 Ahrensburg'],[2,'']]){const s=new P.Service(async url=>url.includes('photon')?good(geo(id)):good({elements:[element(1,{name:'Pizza Max',phone:'+49 123',opening_hours:'24/7'})]}),memory());const r=await s.details(base);assert.equal(r.place.address,expected);assert.equal(r.place.phone,'+49 123');assert.equal(r.place.openingHours,'24/7');assert.equal(r.place.name,'Pizza Max');if(id===1)assert.equal(r.place.state,'Schleswig-Holstein');}
});
test('Submitted search cache avoids repeat remote lookup and preserves venue identity',async()=>{
 let calls=0;const s=new P.Service(async()=>{calls++;return good({features:[{geometry:{coordinates:[9.99,53.55]},properties:{name:'Roma',osm_type:'W',osm_id:99,osm_key:'amenity',osm_value:'restaurant'}}]});},memory());const a=await s.photon('Roma',center),b=await s.photon('Roma',center);assert.equal(calls,1);assert.equal(a[0].kind,'venue');assert.equal(b[0].place.placeId,'way-99');assert.equal(b[0].place.pizzaEvidence,'search');
});
