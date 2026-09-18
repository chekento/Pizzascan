const test=require('node:test');
const assert=require('node:assert/strict');
const B=require('../web/build45-runtime.js');

test('Build 45 version',()=>{assert.equal(B.VERSION,'2.3.10');assert.equal(B.BUILD,45);});

test('default migration restores complete WebSim-style search state',()=>{
  const cfg=B.migrationConfig({radius:5,onlyOpen:true,includeItalian:false,hideVisited:true,minRating:4.7,types:['cafe']},['pizzeria','cafe','fast_food','food_truck','vending_pizza','other']);
  assert.equal(cfg.radius,0);
  assert.equal(cfg.onlyOpen,false);
  assert.equal(cfg.includeItalian,true);
  assert.equal(cfg.hideVisited,false);
  assert.equal(cfg.minRating,0);
  assert.equal(cfg.autoSearch,true);
  assert.deepEqual(cfg.types,['pizzeria','cafe','fast_food','food_truck','vending_pizza','other']);
});

test('query uses viewport when radius is zero and retains original WebSim families',()=>{
  const q=B.websimQuery({lat:53.87,lng:10.69},0,{south:53.8,west:10.6,north:53.9,east:10.8});
  assert.match(q,/53\.8,10\.6,53\.9,10\.8/);
  assert.match(q,/amenity"="restaurant"/);
  assert.match(q,/cafe\|fast_food\|food_truck\|takeaway/);
  assert.match(q,/bar\|pub/);
  assert.match(q,/speciality/);
  assert.match(q,/vending:pizza/);
  assert.match(q,/pizzascan-build45-websim-source/);
});

test('tagged query hit is kept even if JS evidence parser is stricter',()=>{
  const tags={amenity:'restaurant',name:'Unusual Italian Venue','pizzascan:build45-query':'yes'};
  assert.equal(B.isQueryHit(tags),true);
  assert.equal(B.relevantPlace({pizzaEvidence:'search',tags}),true);
});

test('generic restaurant is still excluded unless returned by targeted query',()=>{
  const tags={amenity:'restaurant',name:'Burger House',cuisine:'burger'};
  assert.equal(B.pizzaEvidence(tags),false);
  assert.equal(B.italianEvidence(tags),false);
  assert.equal(B.isQueryHit(tags),false);
});

test('pizza and Italian places remain relevant without pizza in name',()=>{
  assert.equal(B.pizzaEvidence({amenity:'bar',name:'Lantern',cuisine:'pizza;italian'}),true);
  assert.equal(B.italianEvidence({amenity:'restaurant',name:'Trattoria Roma'}),true);
});

test('firstSuccess returns immediately on first successful provider',async()=>{
  let slowDone=false;
  const fast=new Promise(r=>setTimeout(()=>r('fast'),5));
  const slow=new Promise(r=>setTimeout(()=>{slowDone=true;r('slow');},120));
  const t=Date.now();
  assert.equal(await B.firstSuccess([slow,fast]),'fast');
  assert.ok(Date.now()-t<100);
  assert.equal(slowDone,false);
});
