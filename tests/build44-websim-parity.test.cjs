const test=require('node:test');
const assert=require('node:assert/strict');
const B=require('../web/build44-websim.js');

test('Build 44 fast query covers every original WebSim pizza/Italian selector family',()=>{
  const q=B.fastQuery({lat:53.67,lng:10.24},5,{south:53.6,west:10.1,north:53.8,east:10.4});
  assert.match(q,/pizzascan-build44-websim-fast/);
  assert.match(q,/around:5000,53\.67,10\.24/);
  assert.match(q,/\["cuisine"="pizza"\]/);
  assert.match(q,/\["amenity"="restaurant"\]\["cuisine"="italian"\]/);
  assert.match(q,/\["amenity"="restaurant"\]\["cuisine"~/);
  assert.match(q,/\["vending"~"pizza"/);
  assert.match(q,/\["vending:pizza"="yes"\]/);
  for(const amenity of ['cafe','fast_food','food_truck','takeaway'])assert.match(q,new RegExp('amenity"="'+amenity));
  assert.match(q,/amenity"~"bar\|pub/);
  assert.match(q,/speciality/);
  assert.match(q,/name/);
  assert.match(q,/description/,'original WebSim description=pizza selector remains in the fast baseline');
  assert.doesNotMatch(q,/restaurant\|fast_food\|cafe\|food_truck\|takeaway\|food_court\|bar\|pub\|biergarten/,'must not regress to the all-gastro scan');
});

test('description, product, menu and note evidence enrich after first paint',()=>{
  const q=B.enrichQuery({lat:53.67,lng:10.24},5,null);
  assert.match(q,/pizzascan-build44-evidence-enrich/);
  for(const key of ['description','note','product','products','menu','website:menu','brand','operator'])assert.match(q,new RegExp(key.replace(':','\\:')));
});

test('firstUseful ignores an empty fast mirror and resolves on the first useful result',async()=>{
  let slowFinished=false;
  const empty=Promise.resolve({endpoint:'empty',elements:[]});
  const useful=new Promise(r=>setTimeout(()=>r({endpoint:'useful',elements:[{id:1}]}),15));
  const slow=new Promise(r=>setTimeout(()=>{slowFinished=true;r({endpoint:'slow',elements:[{id:2}]});},80));
  const first=await B.firstUseful([empty,useful,slow],g=>g.elements.length>0);
  assert.equal(first.endpoint,'useful');
  assert.equal(slowFinished,false);
});

test('provider union helper keeps unique OSM identities without a numerical result cap',()=>{
  const a=Array.from({length:3500},(_,i)=>({type:'node',id:i}));
  const b=Array.from({length:3500},(_,i)=>({type:'node',id:i+3000}));
  const merged=B.mergeGroups(a,b);
  assert.equal(merged.length,6500);
});

test('0 km uses viewport while fixed radius stays exact',()=>{
  const bounds={south:53.6,west:10.1,north:53.8,east:10.4};
  assert.equal(B.areaToken({lat:53.67,lng:10.24},0,bounds),'53.6,10.1,53.8,10.4');
  assert.equal(B.areaToken({lat:53.67,lng:10.24},4.5,bounds),'around:4500,53.67,10.24');
});
