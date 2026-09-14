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
 const place={placeId:'node-1',type:'pizzeria',pizzaEvidence:'search'};
 const broad=B.normalizeConfig({}, {}, TYPES);
 assert.equal(B.candidateVisible(place,broad,{visited:new Set()},()=>({state:'unknown'})),true);
 assert.equal(B.candidateVisible(place,{...broad,includeUnconfirmed:false},{visited:new Set()},()=>({state:'open'})),false);
 assert.equal(B.candidateVisible(place,{...broad,onlyOpen:true},{visited:new Set()},()=>({state:'unknown'})),false);
 assert.equal(B.candidateVisible(place,{...broad,hideVisited:true},{visited:new Set(['node-1'])},()=>({state:'open'})),false);
});
