const test=require('node:test');
const assert=require('node:assert/strict');
const B=require('../web/build40-runtime.js');

test('complete discovery query has no numerical result limit and covers WebSim pizza/Italian families',()=>{
 const q=B.completePizzaQuery({lat:40.727,lng:-73.985},5,{south:40.70,west:-74.02,north:40.75,east:-73.95});
 assert.match(q,/\[out:json\]\[timeout:60\]/);
 assert.match(q,/cuisine/);assert.match(q,/ristorante\|trattoria\|osteria/);assert.match(q,/vending:pizza/);assert.match(q,/speciality/);assert.match(q,/description/);
 assert.doesNotMatch(q,/\blimit\b/i);
 assert.match(q,/40\.7,-74\.02,40\.75,-73\.95/);
});

test('provider union keeps thousands of unique OSM places without a cap',()=>{
 const a=Array.from({length:3000},(_,i)=>({type:'node',id:i+1}));
 const b=Array.from({length:3000},(_,i)=>({type:'node',id:i+2001}));
 const merged=B.mergeElements(a,b);
 assert.equal(merged.length,5000);
});

test('existence checks preserve node way relation identities and batch without dropping entries',()=>{
 const places=[{placeId:'node-1'},{placeId:'way-2'},{placeId:'relation-3'},{placeId:'node-4'}];
 const q=B.existenceQuery(places);
 assert.match(q,/node\(id:1,4\)/);assert.match(q,/way\(id:2\)/);assert.match(q,/relation\(id:3\)/);assert.match(q,/out ids/);
 const many=Array.from({length:1001},(_,i)=>i);const batches=B.chunk(many,180);assert.equal(batches.flat().length,1001);assert.equal(batches.length,6);
});

test('deprecated provider is excluded while free HTTPS mirrors remain',()=>{
 const out=B.usableEndpoints(['https://overpass-api.de/api/interpreter','https://maps.mail.ru/osm/tools/overpass/api/interpreter','http://example.com','https://overpass.osm.jp/api/interpreter']);
 assert.deepEqual(out,['https://overpass-api.de/api/interpreter','https://overpass.osm.jp/api/interpreter']);
});
