const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const B=require('../web/build46-runtime.js');

test('Build 46 version and search policy',()=>{
  assert.equal(B.VERSION,'2.3.11');
  assert.equal(B.BUILD,46);
  const cfg=B.migrationConfig({radius:5,onlyOpen:true,includeItalian:false,minRating:4.8,types:['cafe']},['pizzeria','cafe','fast_food','food_truck','vending_pizza','other']);
  assert.equal(cfg.radius,0);
  assert.equal(cfg.onlyOpen,false);
  assert.equal(cfg.includeItalian,true);
  assert.equal(cfg.minRating,0);
});

test('Build 46 keeps the targeted WebSim families',()=>{
  const q=B.websimQuery({lat:53.55,lng:10},0,{south:53.5,west:9.9,north:53.6,east:10.1});
  assert.match(q,/pizzascan-build46-websim-source/);
  assert.match(q,/cuisine/);
  assert.match(q,/restaurant/);
  assert.match(q,/cafe\|fast_food\|food_truck\|takeaway/);
  assert.match(q,/ristorante\|trattoria\|osteria/);
  assert.match(q,/speciality/);
  assert.match(q,/vending:pizza/);
});

test('generic restaurants stay excluded',()=>{
  assert.equal(B.pizzaEvidence({amenity:'restaurant',name:'Restaurant Nord',cuisine:'german'}),false);
  assert.equal(B.italianEvidence({amenity:'restaurant',name:'Restaurant Nord',cuisine:'german'}),false);
});

test('Pizza and Italian places do not require Pizza in the name',()=>{
  assert.equal(B.pizzaEvidence({amenity:'bar',name:'The Lantern',cuisine:'pizza;italian'}),true);
  assert.equal(B.italianEvidence({amenity:'restaurant',name:'Trattoria Roma'}),true);
});

test('empty-provider path is fail-fast and does not delegate to legacy search chains',()=>{
  const src=fs.readFileSync(require.resolve('../web/build46-runtime.js'),'utf8');
  assert.match(src,/emptyProvidersFailFast:true/);
  assert.match(src,/return \{data:\{elements:\[\]\},source:'OpenStreetMap'/);
  assert.doesNotMatch(src,/catch\(error\)\{this\.lastErrors=errors;return previous\(query,options\);\}/);
});
