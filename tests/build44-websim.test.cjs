const test=require('node:test');
const assert=require('node:assert/strict');
const B=require('../web/build44-runtime.js');

test('Build 44 reports 2.3.9 / 44',()=>{
  assert.equal(B.VERSION,'2.3.9');
  assert.equal(B.BUILD,44);
});

test('query preserves original WebSim pizza and Italian families',()=>{
  const q=B.websimQuery({lat:53.87,lng:10.69},5,{south:53.8,west:10.6,north:53.9,east:10.8});
  assert.match(q,/cuisine/);
  assert.match(q,/pizza\|pizzeria/);
  assert.match(q,/italian/);
  assert.match(q,/amenity"="restaurant"/);
  assert.match(q,/cafe\|fast_food\|food_truck\|takeaway/);
  assert.match(q,/bar\|pub/);
  assert.match(q,/speciality/);
  assert.match(q,/vending:pizza/);
  assert.match(q,/description/);
  assert.match(q,/pizzascan-build44-websim-parity/);
  assert.doesNotMatch(q,/amenity"~"restaurant\|fast_food\|cafe[^\]]*"\]\["name"/);
});

test('generic restaurants are not relevant',()=>{
  assert.equal(B.relevantTags({amenity:'restaurant',name:'Restaurant Nord',cuisine:'german'}),false);
  assert.equal(B.relevantTags({amenity:'restaurant',name:'Burger House',cuisine:'burger'}),false);
});

test('pizza can be proven without pizza in the name',()=>{
  assert.equal(B.relevantTags({amenity:'bar',name:'The Lantern',cuisine:'pizza;italian'}),true);
  assert.equal(B.pizzaEvidence({amenity:'bar',name:'The Lantern',speciality:'pizza'}),true);
});

test('Italian restaurants remain in the original WebSim pizza filter family',()=>{
  assert.equal(B.italianEvidence({amenity:'restaurant',name:'Trattoria Roma'}),true);
  assert.equal(B.classify({amenity:'restaurant',name:'Trattoria Roma'},false,true),'pizzeria');
  assert.equal(B.classify({amenity:'restaurant',cuisine:'italian'},false,true),'pizzeria');
});

test('fixed radius is exact and viewport mode uses bbox',()=>{
  assert.match(B.websimQuery({lat:53.87,lng:10.69},5,{south:1,west:2,north:3,east:4}),/around:5000,53\.87,10\.69/);
  assert.match(B.websimQuery({lat:53.87,lng:10.69},0,{south:53.8,west:10.6,north:53.9,east:10.8}),/53\.8,10\.6,53\.9,10\.8/);
});

test('firstSuccess resolves on the first successful provider, not all providers',async()=>{
  let slowDone=false;
  const fast=new Promise(resolve=>setTimeout(()=>resolve('fast'),5));
  const slow=new Promise(resolve=>setTimeout(()=>{slowDone=true;resolve('slow');},120));
  const started=Date.now();
  const result=await B.firstSuccess([slow,fast]);
  assert.equal(result.v,'fast');
  assert.ok(Date.now()-started<100);
  assert.equal(slowDone,false);
});
