const {test} = require('node:test');
const assert = require('node:assert/strict');
const C = require('../web/core.js');
test('Coordinates include zero, reject strings, infinity and out-of-range values', () => {
  assert.equal(C.coords(0,0),true);
  for (const pair of [[91,0],[0,-181],['53',9],[NaN,0],[0,Infinity]]) assert.equal(C.coords(...pair),false);
});
test('OSM way/relation centers are included; geometry nodes and non-pizza Italian places are excluded', () => {
  const p=C.fromOverpass([
    {type:'way',id:1,center:{lat:53.55,lon:10},tags:{name:'Pizza One',cuisine:'italian;pizza'}},
    {type:'relation',id:2,center:{lat:0,lon:0},tags:{name:'Zero Pizza',cuisine:'pizza'}},
    {type:'node',id:3,lat:53,lon:9},
    {type:'node',id:4,lat:53,lon:9,tags:{name:'Italian restaurant',cuisine:'italian'}},
    {type:'node',id:5,lat:53,lon:9,tags:{name:'Machine',vending:'pizza'}},
    {type:'node',id:6,lat:53,lon:9,tags:{name:'Old Pizza',disused:'yes'}}
  ]);
  assert.deepEqual(p.map(p=>p.placeId),['way-1','relation-2','node-5']);
  assert.equal(p[2].type,'vending_pizza');
});
test('Import validates every entry and deduplicates IDs before the caller commits', () => {
  const p={placeId:'a',name:'Pizzeria',lat:53,lng:10};
  assert.equal(C.importPlaces([p,p]).length,1);
  assert.throws(()=>C.importPlaces([p,{...p,lat:'53'}]));
  assert.throws(()=>C.importPlaces({places:[p]}));
  assert.throws(()=>C.importPlaces(Array(5001).fill(p)));
});
test('Names are escaped and unsafe website schemes are rejected', () => {
  assert.equal(C.esc('<img src=x onerror="bad()">'), '&lt;img src=x onerror=&quot;bad()&quot;&gt;');
  for (const url of ['javascript:alert(1)','data:text/html,abc','file:///etc/passwd','https://user:pass@host.test']) assert.equal(C.website(url),'');
  assert.equal(C.website('example.com/menu'),'https://example.com/menu');
});
test('Rating weights change the result and remain on a ten-point scale', () => {
  const r={ambiance:5,service:5,cleanliness:5,value:5,crust:1,sauce:1,cheese:1,toppings:1,bake:1,restaurantWeight:80};
  assert.equal(C.ratingScore(r),8.4);
  assert.equal(C.ratingScore({...r,restaurantWeight:20}),3.6);
  const perfect=Object.fromEntries(Object.keys(r).map(k=>[k,k==='restaurantWeight'?50:5]));
  assert.equal(C.ratingScore(perfect),10);
});
test('Distance is symmetric and crawl visits unique nearest stops', () => {
  const start={lat:0,lng:0}, a={lat:0,lng:.01}, b={lat:0,lng:.03};
  assert.ok(Math.abs(C.distance(start,a)-1.11195)<.001);
  assert.equal(C.distance(start,a),C.distance(a,start));
  assert.deepEqual(C.crawl(start,[b,a],2),[a,b]);
});
test('Navigation preserves travel mode and multi-stop waypoints', () => {
  const stops=[{lat:53,lng:10},{lat:54,lng:11}];
  for(const mode of ['walking','bicycling','driving','transit']) {
    const u=new URL(C.directions(stops,mode));
    assert.equal(u.searchParams.get('travelmode'),mode);
    assert.equal(u.searchParams.has('waypoints'),mode!=='transit');
  }
  assert.throws(()=>C.directions([{lat:100,lng:0}]));
});
