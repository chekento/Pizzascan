const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../web/poi-discovery.js');

test('robust POI query includes every broad food category, mobile food and pizza vending',()=>{
  const q=D.robustQuery('around:10000,53.675,10.240');
  assert.match(q,/restaurant\|fast_food\|cafe\|food_truck\|takeaway\|food_court\|bar\|pub\|biergarten/);
  assert.match(q,/ristorante\|trattoria\|osteria/);
  assert.match(q,/italian/);
  assert.match(q,/mobile"="yes/);
  assert.match(q,/vending:pizza/);
  assert.match(q,/amenity"="vending_machine/);
});

test('fallback terms explicitly cover all visible POI categories',()=>{
  for(const term of ['pizza','pizzeria','restaurant','cafe','imbiss','food truck','pizza vending','takeaway','bar','pub','biergarten','food court'])assert.ok(D.FALLBACK_TERMS.includes(term),term);
  assert.ok(D.FALLBACK_TARGET>=30);
});

test('area extraction supports radius and map bounds',()=>{
  assert.equal(D.extractArea('[out:json];nwr["amenity"](around:5000,53.6,10.2);out;'),'around:5000,53.6,10.2');
  assert.equal(D.extractArea('[out:json];nwr["amenity"](53.5,10.1,53.7,10.4);out;'),'53.5,10.1,53.7,10.4');
  assert.deepEqual(D.areaInfo('53.5,10.1,53.7,10.4').center,{lat:53.6,lng:10.25});
});

test('Italian restaurant names become possible pizza candidates while pizzerias are confirmed',()=>{
  assert.equal(D.evidence({name:'Ristorante Roma',pizzaEvidence:'search',tags:{amenity:'restaurant'}}),'possible');
  assert.equal(D.evidence({name:'Trattoria da Luigi',pizzaEvidence:'search',tags:{amenity:'restaurant'}}),'possible');
  assert.equal(D.evidence({name:'Osteria Bella',pizzaEvidence:'search',tags:{amenity:'restaurant'}}),'possible');
  assert.equal(D.evidence({name:'Pizzeria Napoli',pizzaEvidence:'search',tags:{amenity:'restaurant'}}),'confirmed');
  assert.equal(D.evidence({name:'Zum Markt',pizzaEvidence:'search',tags:{amenity:'restaurant'}}),'search');
});

test('thin and Photon responses trigger recovery at the higher completeness threshold',()=>{
  assert.equal(D.isSparse({data:{elements:[1,2]},source:'overpass-api.de'}),true);
  assert.equal(D.isSparse({data:{elements:Array.from({length:D.SPARSE_BELOW-1},(_,i)=>({id:i}))},source:'overpass-api.de'}),true);
  assert.equal(D.isSparse({data:{elements:Array.from({length:D.SPARSE_BELOW},(_,i)=>({id:i}))},source:'overpass-api.de'}),false);
  assert.equal(D.isSparse({data:{elements:Array.from({length:30},(_,i)=>({id:i}))},source:'photon.komoot.io'}),true);
});

test('element merge deduplicates OSM identities',()=>{
  const a={type:'node',id:1,tags:{name:'A'}},b={type:'node',id:1,tags:{name:'B'}},c={type:'way',id:1};
  const out=D.mergeElements([a],[b,c]);
  assert.equal(out.length,2);
  assert.equal(out.find(x=>x.type==='node').tags.name,'B');
});