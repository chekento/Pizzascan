const test=require('node:test');
const assert=require('node:assert/strict');
const B=require('../web/build42-discovery.js');
const Core=require('../web/core.js');

test('fixed-radius discovery uses the requested circle even when viewport bounds exist',()=>{
 const q=B.broadQuery({lat:53.67,lng:10.24},5,{south:53.6,west:10.1,north:53.8,east:10.4});
 assert.match(q,/around:5000,53\.67,10\.24/);
 assert.doesNotMatch(q,/53\.6,10\.1,53\.8,10\.4/);
});

test('viewport mode uses bbox and queries all named gastro amenities without requiring pizza in the name',()=>{
 const q=B.broadQuery({lat:40.72,lng:-74},0,{south:40.70,west:-74.03,north:40.75,east:-73.95});
 assert.match(q,/40\.7,-74\.03,40\.75,-73\.95/);
 assert.match(q,/amenity.*restaurant\|fast_food\|cafe\|food_truck\|takeaway\|food_court\|bar\|pub\|biergarten/);
 assert.match(q,/\["name"\]/);
 assert.match(q,/vending:pizza/);
 assert.doesNotMatch(q,/\blimit\b/i);
});

test('generic named restaurant is retained as an unconfirmed candidate',()=>{
 const p=B.normalizeElement({type:'node',id:1,lat:53.67,lon:10.24,tags:{amenity:'restaurant',name:'Zum Markt'}},Core);
 assert.ok(p);assert.equal(p.name,'Zum Markt');assert.equal(p.pizzaEvidence,'search');assert.equal(p.type,'other');
});

test('pizza bar is retained even when Pizza is absent from the venue name',()=>{
 const p=B.normalizeElement({type:'node',id:2,lat:51.5,lon:-0.1,tags:{amenity:'bar',name:'The Lantern',cuisine:'pizza;italian'}},Core);
 assert.ok(p);assert.equal(p.pizzaEvidence,'confirmed');assert.equal(p.type,'other');
});

test('multiscript pizza evidence works without Latin names',()=>{
 for(const cuisine of ['ピザ','披萨','بيتزا','пицца','πίτσα','פיצה','피자'])assert.equal(B.pizzaEvidence({cuisine}),true,cuisine);
});

test('broad filtering keeps unconfirmed venues by default and can hide them explicitly',()=>{
 const rows=[
  {placeId:'node-1',name:'A',type:'other',pizzaEvidence:'search'},
  {placeId:'node-2',name:'B',type:'other',pizzaEvidence:'possible'},
  {placeId:'node-3',name:'C',type:'pizzeria',pizzaEvidence:'confirmed'}
 ];
 const base={types:['other','pizzeria'],includeUnconfirmed:true,includeItalian:true};
 assert.equal(B.filterPlaces(rows,base,{},()=>({state:'unknown'})).length,3);
 assert.deepEqual(B.filterPlaces(rows,{...base,includeUnconfirmed:false}, {},()=>({state:'unknown'})).map(x=>x.placeId),['node-2','node-3']);
 assert.deepEqual(B.filterPlaces(rows,{...base,includeItalian:false}, {},()=>({state:'unknown'})).map(x=>x.placeId),['node-1','node-3']);
});

test('provider union has no live numerical result cap',()=>{
 const a=Array.from({length:3500},(_,i)=>({type:'node',id:i+1}));
 const b=Array.from({length:3500},(_,i)=>({type:'node',id:i+2501}));
 assert.equal(B.mergeElements(a,b).length,6000);
});

test('firstSuccess resolves on the first provider rather than waiting for slow mirrors',async()=>{
 const slow=new Promise(resolve=>setTimeout(()=>resolve('slow'),80));
 const fast=new Promise(resolve=>setTimeout(()=>resolve('fast'),5));
 const started=Date.now(),result=await B.firstSuccess([slow,fast]);
 assert.equal(result.value,'fast');assert.equal(result.index,1);assert.ok(Date.now()-started<60);
});
