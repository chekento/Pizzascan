const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../web/poi-discovery.js');

test('recovery query always includes all named food POIs before pizza enrichment',()=>{
  const q=D.robustQuery('around:10000,53.675,10.240');
  assert.match(q,/\["amenity"~"restaurant\|fast_food\|cafe\|food_truck\|takeaway\|food_court\|bar\|pub\|biergarten"\]\["name"\]/,'recovery itself must stay broad when primary Overpass servers fail');
  assert.match(q,/cuisine.*pizza/);
  assert.match(q,/cuisine.*italian/);
  assert.match(q,/name.*pizza/);
  assert.match(q,/name.*trattoria/);
  assert.match(q,/name.*ristorante/);
  assert.match(q,/name.*osteria/);
  assert.match(q,/brand.*pizza/);
  assert.match(q,/operator.*pizza/);
  assert.match(q,/speciality.*pizza/);
  assert.match(q,/description.*pizza/);
  assert.match(q,/vending:pizza/);
  assert.match(q,/amenity"="vending_machine/);
});

test('last-resort text search covers generic restaurants as well as pizza and Italian terminology',()=>{
  for(const term of ['restaurant','cafe','fast food','takeaway','bar','pub','biergarten','food court','pizzeria','pizza','italian restaurant','ristorante','trattoria','osteria','italienisches restaurant'])assert.ok(D.FALLBACK_TERMS.includes(term),term);
  assert.ok(D.FALLBACK_TERMS.length>=18);
  assert.equal(D.SPARSE_BELOW,12);
  assert.equal(D.ADEQUATE_POIS,24);
  assert.equal(D.FALLBACK_TARGET,24);
  assert.equal(D.MARKER,'pizzascan-poi-discovery-v8');
  assert.match(D.RECOVERY_PROVIDERS[0],/maps\.mail\.ru/,'healthy global recovery mirror is attempted before the certificate-problematic backup seen in CI');
});

test('area extraction supports radius and map bounds',()=>{
  assert.equal(D.extractArea('[out:json];nwr["amenity"](around:5000,53.6,10.2);out;'),'around:5000,53.6,10.2');
  assert.equal(D.extractArea('[out:json];nwr["amenity"](53.5,10.1,53.7,10.4);out;'),'53.5,10.1,53.7,10.4');
  assert.deepEqual(D.areaInfo('53.5,10.1,53.7,10.4').center,{lat:53.6,lng:10.25});
});

test('Italian identity is a POI candidate but never fabricated as confirmed pizza evidence',()=>{
  assert.equal(D.evidence({name:'Ristorante Roma',pizzaEvidence:'search',tags:{amenity:'restaurant'}}),'search');
  assert.equal(D.evidence({name:'Trattoria da Luigi',pizzaEvidence:'search',tags:{amenity:'restaurant'}}),'search');
  assert.equal(D.evidence({name:'Osteria Bella',pizzaEvidence:'search',tags:{amenity:'restaurant'}}),'search');
  assert.equal(D.evidence({name:'Pizzeria Napoli',pizzaEvidence:'search',tags:{amenity:'restaurant'}}),'confirmed');
  assert.equal(D.evidence({name:'Cafe Nord',cuisine:'pizza',pizzaEvidence:'search',tags:{amenity:'cafe'}}),'confirmed');
});

test('dense Overpass restaurant sets render immediately; thin or Photon sets get broad recovery',()=>{
  const generic=Array.from({length:40},(_,i)=>({type:'node',id:i,tags:{name:'Restaurant '+i,amenity:'restaurant'}}));
  const sparse=Array.from({length:8},(_,i)=>({type:'node',id:50+i,tags:{name:'Restaurant '+i,amenity:'restaurant'}}));
  const pizza=Array.from({length:D.SPARSE_BELOW},(_,i)=>({type:'node',id:100+i,tags:{name:'Pizza '+i,amenity:'restaurant',cuisine:'pizza'}}));
  assert.equal(D.pizzaCount(generic),0);
  assert.equal(D.isSparse({data:{elements:generic},source:'overpass-api.de'}),false,'dense broad Overpass POIs must render immediately');
  assert.equal(D.isSparse({data:{elements:sparse},source:'overpass-api.de'}),true);
  assert.equal(D.isSparse({data:{elements:pizza},source:'overpass-api.de'}),false);
  assert.equal(D.isSparse({data:{elements:pizza},source:'photon.komoot.io'}),true);
});

test('fallback terms become correctly typed generic, Italian and pizza POI elements',()=>{
 const place={placeId:'node-9',name:'Kaffeeküche',lat:53.67,lng:10.24,tags:{}};
 const restaurant=D.placeToElement({...place,name:'Restaurant Nord'},'restaurant');
 assert.equal(restaurant.tags.amenity,'restaurant');
 assert.equal(D.elementPizza(restaurant),false);
 const court=D.placeToElement({...place,name:'Food Hall'},'food court');
 assert.equal(court.tags.amenity,'food_court');
 const cafe=D.placeToElement(place,'pizza cafe');
 assert.equal(cafe.tags.amenity,'cafe');
 assert.match(cafe.tags.cuisine,/pizza/);
 assert.equal(D.elementPizza(cafe),true);
 const trattoria=D.placeToElement({...place,name:'Trattoria Roma'},'trattoria');
 assert.equal(trattoria.tags.amenity,'restaurant');
 assert.match(trattoria.tags.cuisine,/italian/);
 assert.equal(D.elementPizza(trattoria),false,'Italian candidate is not automatically pizza-confirmed');
 const vending=D.placeToElement(place,'pizza vending');
 assert.equal(vending.tags.amenity,'vending_machine');
 assert.equal(vending.tags['vending:pizza'],'yes');
});

test('element merge deduplicates OSM identities',()=>{
  const a={type:'node',id:1,tags:{name:'A'}},b={type:'node',id:1,tags:{name:'B'}},c={type:'way',id:1};
  const out=D.mergeElements([a],[b,c]);
  assert.equal(out.length,2);
  assert.equal(out.find(x=>x.type==='node').tags.name,'B');
});
