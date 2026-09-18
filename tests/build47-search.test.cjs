const test=require('node:test');
const assert=require('node:assert/strict');
const B=require('../web/build47-runtime.js');

test('Build 47 version',()=>{assert.equal(B.VERSION,'2.3.12');assert.equal(B.BUILD,47);});

test('query contains the original WebSim search families and additive evidence',()=>{
 const q=B.websimQuery({lat:53.87,lng:10.69},0,{south:53.8,west:10.6,north:53.9,east:10.8});
 for(const re of [
  /cuisine.*pizza/,/amenity"="restaurant".*italian/,/cafe\|fast_food\|food_truck/,
  /speciality/,/bar\|pub/,/name.*pizza/,/description/,/takeaway/,/vending:pizza/
 ]) assert.match(q,re);
 assert.match(q,/dish/);assert.match(q,/alt_name/);
});

test('targeted provider hits are authoritative',()=>{
 const raw=[{type:'node',id:1,lat:53.8,lon:10.7,tags:{amenity:'restaurant',name:'Synthetic targeted hit'}}];
 const tagged=B.tagHits(raw);
 assert.equal(tagged.length,1);
 assert.equal(tagged[0].tags[B.HIT],'yes');
});

test('generic restaurants are not independently relevant',()=>{
 assert.equal(B.pizzaEvidence({amenity:'restaurant',name:'Burger House',cuisine:'burger'}),false);
 assert.equal(B.italianEvidence({amenity:'restaurant',name:'Burger House',cuisine:'burger'}),false);
});

test('WebSim-sized bounds expand the compact viewport',()=>{
 const b=B.expandBounds({south:53.84,west:10.65,north:53.88,east:10.71},1.1,2);
 assert.ok(b.south<53.84);assert.ok(b.north>53.88);assert.ok(b.west<10.65);assert.ok(b.east>10.71);
});

test('safe name supplement only accepts direct pizza or Italian names',()=>{
 assert.equal(B.nameMatches('pizza','Mario Pizza'),true);
 assert.equal(B.nameMatches('pizzeria','Pizzeria Roma'),true);
 assert.equal(B.nameMatches('trattoria','Trattoria Bella'),true);
 assert.equal(B.nameMatches('osteria','Osteria Uno'),true);
 assert.equal(B.nameMatches('italian restaurant','Cucina Italiana'),true);
 assert.equal(B.nameMatches('pizza','Burger House'),false);
 assert.equal(B.nameMatches('trattoria','Asia Wok'),false);
});

test('first provider can render without waiting for a slow mirror',async()=>{
 let slow=false;
 const fast=new Promise(r=>setTimeout(()=>r('fast'),5));
 const late=new Promise(r=>setTimeout(()=>{slow=true;r('late');},150));
 const start=Date.now();assert.equal(await B.firstSuccess([late,fast]),'fast');
 assert.ok(Date.now()-start<100);assert.equal(slow,false);
});
