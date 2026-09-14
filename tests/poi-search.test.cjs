const test=require('node:test');
const assert=require('node:assert/strict');
const Poi=require('../web/poi-search.js');

const distance=(a,b)=>Math.hypot(a.lat-b.lat,a.lng-b.lng)*111;
const center={lat:53.6735,lng:10.2377};

test('submitted POI query is bounded, food-only and regex-safe',()=>{
 const q=Poi.buildQuery('Pizza Max (Ahrensburg)',center,10);
 assert.match(q,/around:10000,53\.6735,10\.2377/);
 assert.match(q,/restaurant\|fast_food\|cafe/);
 assert.match(q,/Pizza Max/i);
 assert.ok(!q.includes('Pizza Max (Ahrensburg)'),'raw regex metacharacters are not inserted unescaped');
 assert.match(q,/out body center/);
});

test('generic restaurant search returns named food POIs instead of arbitrary map objects',()=>{
 const q=Poi.buildQuery('Restaurant',center,5);
 assert.match(q,/around:5000/);
 assert.match(q,/\["amenity"~"restaurant\|fast_food/);
 assert.match(q,/\["name"\]/);
 assert.doesNotMatch(q,/tourism|shop"~"supermarket/);
});

test('exact name plus city outranks partial and unrelated results',()=>{
 const items=[
  {name:'Pizza Max',address:'Ahrensburg',kind:'venue',osmId:'node-1',lat:53.67,lng:10.24,place:{placeId:'node-1',name:'Pizza Max',address:'Ahrensburg',lat:53.67,lng:10.24}},
  {name:'Pizza Max',address:'Hamburg',kind:'venue',osmId:'node-2',lat:53.55,lng:10.0,place:{placeId:'node-2',name:'Pizza Max',address:'Hamburg',lat:53.55,lng:10.0}},
  {name:'Max Café',address:'Ahrensburg',kind:'venue',osmId:'node-3',lat:53.68,lng:10.23,place:{placeId:'node-3',name:'Max Café',address:'Ahrensburg',lat:53.68,lng:10.23}},
  {name:'Ahrensburg',address:'Schleswig-Holstein',kind:'location',lat:53.67,lng:10.24}
 ];
 const ranked=Poi.mergeRanked([items],'Pizza Max Ahrensburg',center,distance);
 assert.equal(ranked[0].osmId,'node-1');
 assert.ok(ranked.findIndex(x=>x.osmId==='node-2')>0);
});

test('OSM identity deduplicates the same POI across sources',()=>{
 const a={name:'Luigi',address:'Ahrensburg',kind:'venue',osmId:'node-9',lat:53.67,lng:10.24,place:{placeId:'node-9',name:'Luigi',address:'Ahrensburg',lat:53.67,lng:10.24}};
 const b={...a,address:'Ahrensburg, Deutschland'};
 const ranked=Poi.mergeRanked([[a],[b]],'Luigi Ahrensburg',center,distance);
 assert.equal(ranked.filter(x=>x.osmId==='node-9').length,1);
});
