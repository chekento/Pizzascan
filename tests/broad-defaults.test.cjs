const {test}=require('node:test');
const assert=require('node:assert/strict');
const B=require('../web/broad-defaults.js');
const TYPES={pizzeria:{},cafe:{},fast_food:{},food_truck:{},vending_pizza:{},other:{}};

test('fresh installs default to viewport auto-search with all broad place types enabled',()=>{
 const cfg=B.normalizeConfig({sort:'distance',travelMode:'walking',autoSearch:false,radius:5}, {}, TYPES);
 assert.deepEqual(cfg.types,Object.keys(TYPES));
 assert.equal(cfg.radius,0);
 assert.equal(cfg.autoSearch,true);
 assert.equal(cfg.onlyOpen,false);
 assert.equal(cfg.unknownHours,false);
 assert.equal(cfg.includeItalian,true);
 assert.equal(cfg.includeUnconfirmed,true);
 assert.equal(cfg.hideVisited,false);
 assert.equal(cfg.ratingsEnabled,true);
 assert.equal(cfg.minRating,0);
 assert.equal(cfg.includeUnrated,false);
});

test('explicit user filters still narrow broad place defaults',()=>{
 const cfg=B.normalizeConfig({}, {types:['pizzeria'],radius:3,autoSearch:false,onlyOpen:true,unknownHours:false,includeItalian:false,includeUnconfirmed:false,hideVisited:true,ratingsEnabled:true,minRating:4.6,includeUnrated:false}, TYPES);
 assert.deepEqual(cfg.types,['pizzeria']);
 assert.equal(cfg.radius,3);
 assert.equal(cfg.autoSearch,false);
 assert.equal(cfg.onlyOpen,true);
 assert.equal(cfg.includeUnconfirmed,false,'explicit user choice may still narrow generic POIs');
 assert.equal(cfg.minRating,4.6);
 assert.equal(cfg.includeUnrated,false);
});

test('migration restores broad categories, viewport search and automatic result regeneration',()=>{
 const next=B.broadMigration({sort:'name',travelMode:'bicycling',autoSearch:false,minRating:4.8,onlyOpen:true,types:['pizzeria'],includeUnconfirmed:false,radius:1},TYPES);
 assert.equal(next.sort,'name');
 assert.equal(next.travelMode,'bicycling');
 assert.equal(next.autoSearch,true);
 assert.deepEqual(next.types,Object.keys(TYPES));
 assert.equal(next.onlyOpen,false);
 assert.equal(next.unknownHours,false);
 assert.equal(next.minRating,0);
 assert.equal(next.includeUnrated,false);
 assert.equal(next.includeUnconfirmed,true);
 assert.equal(next.radius,0);
});

test('ordinary named food candidates remain visible when the broad baseline is enabled',()=>{
 const place={placeId:'node-1',type:'other',pizzaEvidence:'search'};
 const broad=B.normalizeConfig({}, {}, TYPES);
 assert.equal(B.candidateVisible(place,broad,{visited:new Set()},()=>({state:'open'})),true);
 assert.equal(B.candidateVisible(place,{...broad,includeUnconfirmed:false},{visited:new Set()},()=>({state:'open'})),false);
});

test('map query keeps broad named food results and adds original PizzaScan coverage',()=>{
 const base='[out:json][timeout:20];(nwr["amenity"~"restaurant|fast_food|cafe|food_truck|takeaway|food_court|bar|pub|biergarten"]["name"](53.60,10.10,53.80,10.40);nwr["vending:pizza"="yes"](53.60,10.10,53.80,10.40););out body center;';
 const restored=B.expandDiscoveryQuery(base,true);
 assert.match(restored,/\["amenity"~"restaurant\|fast_food\|cafe\|food_truck\|takeaway\|food_court\|bar\|pub\|biergarten"\]\["name"\]/,'broad named food venues must remain primary results');
 assert.match(restored,/pizzascan-legacy-result-coverage/);
 assert.match(restored,/speciality.*pizza/i);
 assert.match(restored,/name.*pizza\|pizzeria\|pizzaria\|pizze/i);
 assert.match(restored,/description.*pizza/i);
 assert.match(restored,/cuisine.*italian\|italiano\|italiana/i);
 assert.match(restored,/53\.60,10\.10,53\.80,10\.40/);
 assert.equal(B.expandDiscoveryQuery(base,false),base);
 assert.equal(B.MARKER,'pizzascan-broad-defaults-v10');
});

test('supplemental pizza discovery keeps primary ids and deduplicates supplements',()=>{
 assert.equal(B.SUPPLEMENT_BELOW,4);
 assert.equal(B.shouldSupplement([{id:1},{id:2},{id:3}]),true);
 assert.equal(B.shouldSupplement([{id:1},{id:2},{id:3},{id:4}]),false);
 const merged=B.mergeElements([{type:'node',id:1,tags:{name:'Restaurant A'}},{type:'node',id:2,tags:{name:'Restaurant B'}}], [{type:'node',id:1,tags:{name:'Restaurant A',cuisine:'pizza'}},{type:'way',id:3,tags:{name:'Pizza Extra'}}]);
 assert.equal(merged.length,3);
 assert.equal(merged.find(x=>x.type==='node'&&x.id===1).tags.cuisine,'pizza');
 assert.equal(merged.find(x=>x.type==='node'&&x.id===2).tags.name,'Restaurant B','unrelated primary restaurant must remain untouched');
});
