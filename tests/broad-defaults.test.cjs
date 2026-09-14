const {test}=require('node:test');
const assert=require('node:assert/strict');
const B=require('../web/broad-defaults.js');
const TYPES={pizzeria:{},cafe:{},fast_food:{},food_truck:{},vending_pizza:{},other:{}};

test('fresh installs default to all pizza-place types without unconfirmed generic venues',()=>{
 const cfg=B.normalizeConfig({sort:'distance',travelMode:'walking'}, {}, TYPES);
 assert.deepEqual(cfg.types,Object.keys(TYPES));
 assert.equal(cfg.radius,10);
 assert.equal(cfg.onlyOpen,false);
 assert.equal(cfg.unknownHours,false);
 assert.equal(cfg.includeItalian,true);
 assert.equal(cfg.includeUnconfirmed,false);
 assert.equal(cfg.hideVisited,false);
 assert.equal(cfg.ratingsEnabled,true);
 assert.equal(cfg.minRating,0);
 assert.equal(cfg.includeUnrated,false);
});

test('explicit user filters still narrow pizza-place defaults',()=>{
 const cfg=B.normalizeConfig({}, {types:['pizzeria'],radius:3,onlyOpen:true,unknownHours:false,includeItalian:false,includeUnconfirmed:true,hideVisited:true,ratingsEnabled:true,minRating:4.6,includeUnrated:false}, TYPES);
 assert.deepEqual(cfg.types,['pizzeria']);
 assert.equal(cfg.radius,3);
 assert.equal(cfg.onlyOpen,true);
 assert.equal(cfg.includeUnconfirmed,true,'legacy/debug setting may exist but pizza-only policy still blocks generic venues');
 assert.equal(cfg.minRating,4.6);
 assert.equal(cfg.includeUnrated,false);
});

test('migration restores broad pizza categories but disables generic unconfirmed visibility',()=>{
 const next=B.broadMigration({sort:'name',travelMode:'bicycling',autoSearch:true,minRating:4.8,onlyOpen:true,types:['pizzeria'],includeUnconfirmed:true},TYPES);
 assert.equal(next.sort,'name');
 assert.equal(next.travelMode,'bicycling');
 assert.equal(next.autoSearch,true);
 assert.deepEqual(next.types,Object.keys(TYPES));
 assert.equal(next.onlyOpen,false);
 assert.equal(next.unknownHours,false);
 assert.equal(next.minRating,0);
 assert.equal(next.includeUnrated,false);
 assert.equal(next.includeUnconfirmed,false);
 assert.equal(next.radius,10);
});

test('ordinary food candidates are never made visible merely because they are restaurants or cafés',()=>{
 const place={placeId:'node-1',type:'other',pizzaEvidence:'search'};
 const broad=B.normalizeConfig({}, {}, TYPES);
 assert.equal(B.candidateVisible(place,broad,{visited:new Set()},()=>({state:'open'})),false);
 assert.equal(B.candidateVisible(place,{...broad,includeUnconfirmed:true},{visited:new Set()},()=>({state:'open'})),false);
});

test('generic food expansion is internal-only and requires explicit enablement',()=>{
 const base='[out:json][timeout:15];(nwr["cuisine"~"pizza",i](around:10000,53.67,10.24);nwr["vending:pizza"="yes"](around:10000,53.67,10.24););out body center;';
 const expanded=B.expandDiscoveryQuery(base,true);
 assert.match(expanded,/pizzascan-broad-discovery/);
 assert.match(expanded,/restaurant\|fast_food\|cafe\|food_truck\|takeaway\|food_court\|bar\|pub\|biergarten/);
 assert.match(expanded,/\["name"\]/);
 assert.match(expanded,/mobile"="yes/);
 assert.match(expanded,/around:10000,53\.67,10\.24/);
 assert.equal(B.expandDiscoveryQuery(base,false),base);
 assert.equal(B.MARKER,'pizzascan-broad-defaults-v7');
});

test('only truly sparse provider results are supplemented and element ids are deduplicated',()=>{
 assert.equal(B.SUPPLEMENT_BELOW,4);
 assert.equal(B.shouldSupplement([{id:1},{id:2},{id:3}]),true);
 assert.equal(B.shouldSupplement([{id:1},{id:2},{id:3},{id:4}]),false);
 const merged=B.mergeElements([{type:'node',id:1,tags:{name:'A'}},{type:'node',id:2}], [{type:'node',id:1,tags:{name:'A newer'}},{type:'way',id:3}]);
 assert.equal(merged.length,3);
 assert.equal(merged.find(x=>x.type==='node'&&x.id===1).tags.name,'A newer');
});
