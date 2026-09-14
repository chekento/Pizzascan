const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../web/poi-discovery.js');

test('robust recovery query covers every pizza-place category without generic restaurant discovery',()=>{
  const q=D.robustQuery('around:10000,53.675,10.240');
  assert.match(q,/restaurant\|fast_food\|cafe\|food_truck\|takeaway\|food_court\|bar\|pub\|biergarten/);
  assert.match(q,/cuisine.*pizza/);
  assert.match(q,/name.*pizza/);
  assert.match(q,/brand.*pizza/);
  assert.match(q,/operator.*pizza/);
  assert.match(q,/speciality.*pizza/);
  assert.match(q,/vending:pizza/);
  assert.match(q,/amenity"="vending_machine/);
  assert.doesNotMatch(q,/italian|trattoria|osteria/,'Italian identity alone is not pizza evidence');
  assert.doesNotMatch(q,/\["name"\]\(around/,'unqualified named food venues must not be recovery results');
});

test('Photon fallback has exactly one bounded pizza query per visible remote category',()=>{
  assert.deepEqual(D.FALLBACK_TERMS,['pizzeria','pizza cafe','pizza imbiss','pizza food truck','pizza vending','pizza']);
  assert.equal(D.FALLBACK_TERMS.length,6,'fallback must not serialize a long list of near-duplicate searches');
  assert.equal(D.SPARSE_BELOW,6);
  assert.equal(D.FALLBACK_TARGET,18);
  assert.equal(D.MARKER,'pizzascan-poi-discovery-v5');
});

test('area extraction supports radius and map bounds',()=>{
  assert.equal(D.extractArea('[out:json];nwr["amenity"](around:5000,53.6,10.2);out;'),'around:5000,53.6,10.2');
  assert.equal(D.extractArea('[out:json];nwr["amenity"](53.5,10.1,53.7,10.4);out;'),'53.5,10.1,53.7,10.4');
  assert.deepEqual(D.areaInfo('53.5,10.1,53.7,10.4').center,{lat:53.6,lng:10.25});
});

test('only explicit pizza evidence is confirmed; Italian names alone stay unconfirmed',()=>{
  assert.equal(D.evidence({name:'Ristorante Roma',pizzaEvidence:'search',tags:{amenity:'restaurant'}}),'search');
  assert.equal(D.evidence({name:'Trattoria da Luigi',pizzaEvidence:'search',tags:{amenity:'restaurant'}}),'search');
  assert.equal(D.evidence({name:'Osteria Bella',pizzaEvidence:'search',tags:{amenity:'restaurant'}}),'search');
  assert.equal(D.evidence({name:'Pizzeria Napoli',pizzaEvidence:'search',tags:{amenity:'restaurant'}}),'confirmed');
  assert.equal(D.evidence({name:'Cafe Nord',cuisine:'pizza',pizzaEvidence:'search',tags:{amenity:'cafe'}}),'confirmed');
});

test('sparsity counts pizza evidence, not the number of generic food candidates',()=>{
  const generic=Array.from({length:40},(_,i)=>({type:'node',id:i,tags:{name:'Restaurant '+i,amenity:'restaurant'}}));
  const pizza=Array.from({length:D.SPARSE_BELOW},(_,i)=>({type:'node',id:100+i,tags:{name:'Pizza '+i,amenity:'restaurant',cuisine:'pizza'}}));
  assert.equal(D.pizzaCount(generic),0);
  assert.equal(D.isSparse({data:{elements:generic},source:'overpass-api.de'}),true,'many irrelevant restaurants cannot suppress recovery');
  assert.equal(D.isSparse({data:{elements:pizza},source:'overpass-api.de'}),false);
  assert.equal(D.isSparse({data:{elements:pizza},source:'photon.komoot.io'}),true,'Photon remains a recovery source even when it returns enough items');
});

test('Photon category terms become pizza-tagged elements of the requested venue type',()=>{
 const place={placeId:'node-9',name:'Kaffeeküche',lat:53.67,lng:10.24,tags:{}};
 const cafe=D.placeToElement(place,'pizza cafe');
 assert.equal(cafe.tags.amenity,'cafe');
 assert.match(cafe.tags.cuisine,/pizza/);
 assert.equal(D.elementPizza(cafe),true);
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