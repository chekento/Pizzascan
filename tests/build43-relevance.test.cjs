const test=require('node:test');
const assert=require('node:assert/strict');
const B=require('../web/build42-release.js');
const Core=require('../web/core.js');

test('Build 43 targeted query keeps the fast progressive marker but does not query every gastro venue',()=>{
 const q=B.relevantQuery({lat:53.67,lng:10.24},5,{south:53.6,west:10.1,north:53.8,east:10.4});
 assert.match(q,/pizzascan-build42-broad-discovery/);
 assert.match(q,/pizzascan-build43-relevant-discovery/);
 assert.match(q,/around:5000,53\.67,10\.24/);
 assert.match(q,/cuisine/);
 assert.match(q,/pizza/);
 assert.match(q,/italian/);
 assert.doesNotMatch(q,/amenity.*restaurant\|fast_food\|cafe\|food_truck\|takeaway\|food_court\|bar\|pub\|biergarten/);
});

test('generic restaurant without Italian or pizza evidence is rejected',()=>{
 const p=B.normalizeElement({type:'node',id:1,lat:53.67,lon:10.24,tags:{amenity:'restaurant',name:'Zum Markt'}},Core);
 assert.equal(p,null);
});

test('pizza bar is kept even when Pizza is absent from its name',()=>{
 const p=B.normalizeElement({type:'node',id:2,lat:51.5,lon:-0.1,tags:{amenity:'bar',name:'The Lantern',cuisine:'pizza;italian'}},Core);
 assert.ok(p);assert.equal(p.pizzaEvidence,'confirmed');
});

test('Italian restaurant remains as an Italian candidate without pretending pizza is confirmed',()=>{
 const p=B.normalizeElement({type:'node',id:3,lat:45.46,lon:9.19,tags:{amenity:'restaurant',name:'Trattoria Roma',cuisine:'italian'}},Core);
 assert.ok(p);assert.equal(p.pizzaEvidence,'possible');assert.equal(p.type,'other');
});

test('multiscript pizza cuisine remains supported',()=>{
 for(const cuisine of ['ピザ','披萨','披薩','بيتزا','пицца','πίτσα','פיצה','피자','พิซซ่า'])assert.equal(B.pizzaEvidence({cuisine}),true,cuisine);
});

test('relevance filter purges stale Build 42 generic cache entries',()=>{
 const rows=[
  {placeId:'node-1',name:'Generic',type:'other',pizzaEvidence:'search',tags:{amenity:'restaurant'}},
  {placeId:'node-2',name:'Italian',type:'other',pizzaEvidence:'possible',tags:{cuisine:'italian'}},
  {placeId:'node-3',name:'Pizza',type:'pizzeria',pizzaEvidence:'confirmed',tags:{cuisine:'pizza'}}
 ];
 const filtered=B.filterPlaces(rows,{types:['other','pizzeria'],includeItalian:true},{},()=>({state:'unknown'}));
 assert.deepEqual(filtered.map(x=>x.placeId),['node-2','node-3']);
 assert.deepEqual(B.filterPlaces(rows,{types:['other','pizzeria'],includeItalian:false},{},()=>({state:'unknown'})).map(x=>x.placeId),['node-3']);
});
