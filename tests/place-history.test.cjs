'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const H=require('../web/place-history.js');

function place(id=1,name='Trattoria Roma'){return {placeId:`node-${id}`,name,lat:53.67+id/10000,lng:10.23+id/10000,type:'other',address:'Teststraße 1',tags:{amenity:'restaurant',cuisine:'italian'}};}

test('Markdown visit archive round-trips visited places and ratings',()=>{
  const row=H.mergeVisitRecords(null,{placeId:'node-1',place:place(1),events:[{id:'photo:a',rating:8.7,notes:'Sehr gute Pizza',source:'photo',updatedAt:'2026-09-16T10:00:00.000Z'}]});
  const md=H.archiveToMarkdown([row]);
  assert.match(md,/PizzaScan Besuchsarchiv/);
  assert.match(md,/8\.7\/10/);
  const restored=H.archiveFromMarkdown(md);
  assert.equal(restored.length,1);
  assert.equal(restored[0].placeId,'node-1');
  assert.equal(restored[0].events[0].rating,8.7);
});

test('Visited records keep earlier events and update matching event ids',()=>{
  const first=H.mergeVisitRecords(null,{placeId:'node-2',place:place(2),events:[{id:'photo:x',rating:7.1,source:'photo'}]});
  const next=H.mergeVisitRecords(first,{placeId:'node-2',place:{...place(2),address:'Neue Adresse'},events:[{id:'photo:x',rating:9.2,source:'photo'},{id:'draft:node-2',rating:8.4,source:'review'}]});
  assert.equal(next.events.length,2);
  assert.equal(next.events.find(x=>x.id==='photo:x').rating,9.2);
  assert.equal(next.place.address,'Neue Adresse');
  assert.equal(next.firstVisitedAt,first.firstVisitedAt);
});

test('Element union has no artificial count limit and deduplicates OSM identity',()=>{
  const a=Array.from({length:3200},(_,i)=>({type:'node',id:i+1,tags:{name:'Pizza '+i}}));
  const b=Array.from({length:3200},(_,i)=>({type:'node',id:i+1601,tags:{name:'Pizza newer '+i}}));
  const merged=H.dedupeElements(a,b);
  assert.equal(merged.length,4800);
  assert.equal(merged.find(x=>x.id===1601).tags.name,'Pizza newer 0');
});

test('Cached PizzaScan place can be reconstructed as an Overpass element',()=>{
  const e=H.placeToElement(place(55,'Osteria Verde'));
  assert.equal(e.type,'node');
  assert.equal(e.id,55);
  assert.equal(e.tags.cuisine,'italian');
  assert.equal(e.tags.name,'Osteria Verde');
});

test('Archive parser rejects arbitrary Markdown',()=>{
  assert.throws(()=>H.archiveFromMarkdown('# unrelated'),/kein PizzaScan/);
});

test('Build 38 finalizer restores IndexedDB history after map initialization without aborting first discovery',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../web/runtime-finalize.js'),'utf8');
  assert.match(source,/installCompleteProviderUnion\(\)/);
  assert.match(source,/await waitForMap\(\)/);
  assert.match(source,/const restored=await loadAllHistory\(\)/);
  assert.match(source,/objectStore\(store\)\.getAll\(\)/);
  assert.match(source,/mapPool=PlaceData\.merge\(mapPool/);
  assert.doesNotMatch(source,/mapRequest\?\.abort/);
  assert.match(source,/await waitForIdle\(\)/);
  assert.match(source,/loadPlaces\(\{force:true\}\)/);
});

test('Build 38 finalizer waits for every Overpass mirror and unions cached discoveries without a count cap',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../web/runtime-finalize.js'),'utf8');
  assert.match(source,/Promise\.allSettled\(tasks\)/);
  assert.match(source,/smart\.PROVIDERS/);
  assert.match(source,/cachedElementsFor\(query,smart\)/);
  assert.match(source,/smart\.mergeElements/);
  assert.doesNotMatch(source,/slice\(0,\s*(?:12|20|50|100)\)/);
  assert.doesNotMatch(source,/3500/);
});

test('Build 57 collection archive keeps one shared rating and location for 12000 places',()=>{
 const ratings={};
 for(let i=0;i<12000;i++){const id='node-'+(900000+i);ratings[id]={rating:Math.round(((i%100)+1)/10*10)/10,updatedAt:'2026-09-19T00:00:00.000Z',place:{placeId:id,name:'Ort '+i,lat:50+i/10000,lng:8+i/10000,address:'Test '+i,type:'restaurant'}};}
 const data=H.archiveObject([],{ratings});
 assert.equal(data.version,2);
 assert.equal(data.places.length,12000);
 assert.equal(Object.keys(data.ratings).length,12000);
 assert.equal(data.ratings['node-900000'].rating,0.1);
 assert.equal(data.ratings['node-900000'].place.placeId,'node-900000');
 const restored=H.archiveFromMarkdown(H.archiveToMarkdown([],{ratings}));
 assert.equal(restored.bundle.places.length,12000);
 assert.equal(restored.bundle.ratings['node-911999'].place.lng,9.1999);
});
