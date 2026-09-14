const {test}=require('node:test');
const assert=require('node:assert/strict');
const B=require('../web/broad-defaults.js');
const TYPES={pizzeria:{},cafe:{},fast_food:{},food_truck:{},vending_pizza:{},other:{}};

test('fresh installs default to all place types and all rating scores',()=>{
 const cfg=B.normalizeConfig({sort:'distance',travelMode:'walking'}, {}, TYPES);
 assert.deepEqual(cfg.types,Object.keys(TYPES));
 assert.equal(cfg.radius,10);
 assert.equal(cfg.onlyOpen,false);
 assert.equal(cfg.unknownHours,false);
 assert.equal(cfg.includeItalian,true);
 assert.equal(cfg.includeUnconfirmed,true);
 assert.equal(cfg.hideVisited,false);
 assert.equal(cfg.ratingsEnabled,true);
 assert.equal(cfg.minRating,0,'zero threshold shows every score and unrated place');
 assert.equal(cfg.includeUnrated,false,'unrated inclusion above a chosen threshold remains an explicit opt-in');
});

test('explicit user filters still narrow broad defaults',()=>{
 const cfg=B.normalizeConfig({}, {types:['pizzeria'],radius:3,onlyOpen:true,unknownHours:false,includeItalian:false,includeUnconfirmed:false,hideVisited:true,ratingsEnabled:true,minRating:4.6,includeUnrated:false}, TYPES);
 assert.deepEqual(cfg.types,['pizzeria']);
 assert.equal(cfg.radius,3);
 assert.equal(cfg.onlyOpen,true);
 assert.equal(cfg.includeUnconfirmed,false);
 assert.equal(cfg.minRating,4.6);
 assert.equal(cfg.includeUnrated,false);
});

test('migration resets only discovery filters and preserves unrelated choices',()=>{
 const next=B.broadMigration({sort:'name',travelMode:'bicycling',autoSearch:true,minRating:4.8,onlyOpen:true,types:['pizzeria']},TYPES);
 assert.equal(next.sort,'name');
 assert.equal(next.travelMode,'bicycling');
 assert.equal(next.autoSearch,true);
 assert.deepEqual(next.types,Object.keys(TYPES));
 assert.equal(next.onlyOpen,false);
 assert.equal(next.unknownHours,false);
 assert.equal(next.minRating,0);
 assert.equal(next.includeUnrated,false);
 assert.equal(next.includeUnconfirmed,true);
 assert.equal(next.radius,10);
});

test('ordinary restaurant candidates are visible by default but remain filterable',()=>{
 const place={placeId:'node-1',type:'other',pizzaEvidence:'search'};
 const broad=B.normalizeConfig({}, {}, TYPES);
 assert.equal(B.candidateVisible(place,broad,{visited:new Set()},()=>({state:'unknown'})),true);
 assert.equal(B.candidateVisible(place,{...broad,includeUnconfirmed:false},{visited:new Set()},()=>({state:'open'})),false);
 assert.equal(B.candidateVisible(place,{...broad,onlyOpen:true},{visited:new Set()},()=>({state:'unknown'})),false);
 assert.equal(B.candidateVisible(place,{...broad,hideVisited:true},{visited:new Set(['node-1'])},()=>({state:'open'})),false);
});

test('broad discovery includes named restaurants and every default food category regardless of cuisine',()=>{
 const base='[out:json][timeout:15];(nwr["cuisine"~"pizza|italian",i](around:10000,53.67,10.24);nwr["vending:pizza"="yes"](around:10000,53.67,10.24););out body center;';
 const expanded=B.expandDiscoveryQuery(base,true);
 assert.match(expanded,/pizzascan-broad-discovery/);
 assert.match(expanded,/amenity/);
 assert.match(expanded,/restaurant\|fast_food\|cafe\|food_truck\|takeaway\|food_court\|bar\|pub\|biergarten/);
 assert.match(expanded,/\["name"\]/,'all named venues are candidates even without pizza/Italian tags');
 assert.match(expanded,/mobile"="yes/);
 assert.match(expanded,/vending:pizza/);
 assert.match(expanded,/around:10000,53\.67,10\.24/);
 assert.equal(B.expandDiscoveryQuery(base,false),base);
 assert.equal(B.MARKER,'pizzascan-broad-defaults-v6','existing installs receive the complete category defaults once after the POI repair');
});

test('only truly sparse provider results are supplemented and element ids are deduplicated',()=>{
 assert.equal(B.SUPPLEMENT_BELOW,4);
 assert.equal(B.shouldSupplement([{id:1},{id:2},{id:3}]),true);
 assert.equal(B.shouldSupplement([{id:1},{id:2},{id:3},{id:4}]),false);
 assert.equal(B.shouldSupplement(Array.from({length:7},(_,i)=>({id:i}))),false,'normal map responses do not trigger the base Photon supplement; POI recovery has its own higher completeness threshold');
 const merged=B.mergeElements([{type:'node',id:1,tags:{name:'A'}},{type:'node',id:2}], [{type:'node',id:1,tags:{name:'A newer'}},{type:'way',id:3}]);
 assert.equal(merged.length,3);
 assert.equal(merged.find(x=>x.type==='node'&&x.id===1).tags.name,'A newer');
});
