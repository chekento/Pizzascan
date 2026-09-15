const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const P=require('../web/places.js');
const B=require('../web/broad-defaults.js');
const D=require('../web/poi-discovery.js');
const O=require('../web/pizza-only.js');

test('pizza enrichment loads after recovery and before app initialization',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../web/index.html'),'utf8');
 assert.doesNotMatch(html,/src="settings-search\.js"/,'settings-search must stay out of the runtime search pipeline');
 const map=html.indexOf('src="map-ui.js"');
 const native=html.indexOf('src="native-overpass.js"');
 const review=html.indexOf('src="review-discovery.js"');
 const broad=html.indexOf('src="broad-defaults.js"');
 const poi=html.indexOf('src="poi-discovery.js"');
 const only=html.indexOf('src="pizza-only.js"');
 const app=html.indexOf('src="script.js"');
 assert.ok(map>=0&&native>map&&review>native&&broad>review&&poi>broad&&only>poi&&app>only,'pizza enrichment must install after broad recovery and before app initialization');
});

test('default migration restores broad 5 km results and automatic search regeneration',()=>{
 const cfg=B.broadMigration({types:['pizzeria'],onlyOpen:true,includeItalian:false,includeUnconfirmed:false,radius:1,autoSearch:false,hideVisited:true,minRating:4.9},P.TYPES);
 assert.deepEqual(cfg.types,Object.keys(P.TYPES));
 assert.equal(cfg.onlyOpen,false);
 assert.equal(cfg.includeItalian,true);
 assert.equal(cfg.includeUnconfirmed,true);
 assert.equal(cfg.radius,5);
 assert.equal(cfg.autoSearch,true);
 assert.equal(cfg.hideVisited,false);
 assert.equal(cfg.minRating,0);
 assert.equal(B.MARKER,'pizzascan-broad-defaults-v12');
 const fresh=B.normalizeConfig({}, {}, P.TYPES);
 assert.equal(fresh.includeUnconfirmed,true,'fresh installs keep broad restaurant visibility');
 assert.equal(fresh.radius,5,'fresh installs restore the original 5 km discovery baseline');
 assert.equal(fresh.autoSearch,true,'moving the map regenerates results by default');
});

test('generic restaurants remain visible while pizza evidence is still classified separately',()=>{
 const elements=[
  {type:'node',id:1,lat:53.67,lon:10.24,tags:{name:'Pizza Uno',amenity:'restaurant',cuisine:'pizza'}},
  {type:'node',id:2,lat:53.671,lon:10.241,tags:{name:'Ristorante Roma',amenity:'restaurant',cuisine:'italian'}},
  {type:'node',id:3,lat:53.672,lon:10.242,tags:{name:'Restaurant Nord',amenity:'restaurant',cuisine:'german'}},
  {type:'node',id:4,lat:53.673,lon:10.243,tags:{name:'Cafe Mitte',amenity:'cafe',cuisine:'pizza;coffee_shop'}},
  {type:'node',id:5,lat:53.674,lon:10.244,tags:{name:'Pub West',amenity:'pub'}}
 ];
 const list=P.fromOverpass(elements,{allowNamed:true});
 assert.equal(list.length,5,'broad named food venues remain normal map results');
 assert.deepEqual(list.filter(O.directPizza).map(p=>p.placeId),['node-1','node-4'],'pizza evidence remains available for enrichment/badges');
 const cfg=B.normalizeConfig({}, {}, P.TYPES);
 for(const id of ['node-2','node-3','node-5'])assert.equal(B.candidateVisible(list.find(p=>p.placeId===id),cfg),true,id+' should stay visible as a primary restaurant/POI');
});

test('primary and recovery queries both keep all named-food venues',()=>{
 const base=P.query({lat:53.67,lng:10.24},5,{south:53.6,west:10.1,north:53.8,east:10.4});
 const q=B.expandDiscoveryQuery(base,true);
 assert.match(q,/\["amenity"~"restaurant\|fast_food\|cafe\|food_truck\|bar\|pub\|biergarten\|takeaway\|food_court"\]\["name"\]/,'all named food venues must remain in the primary result-generating query');
 assert.match(q,/pizzascan-legacy-result-coverage/);
 assert.match(q,/speciality.*pizza/i);
 assert.match(q,/description.*pizza/i);
 assert.match(q,/name.*pizza\|pizzeria\|pizzaria\|pizze/i);
 assert.match(q,/cuisine.*italian\|italiano\|italiana/i);
 assert.match(q,/around:5000,53\.67,10\.24/,'5 km baseline must drive the primary query');
 const recovery=D.robustQuery('around:5000,53.67,10.24');
 assert.match(recovery,/\["amenity"~"restaurant\|fast_food\|cafe\|food_truck\|takeaway\|food_court\|bar\|pub\|biergarten"\]\["name"\]/,'provider recovery must not narrow back to pizza/Italian-only venues');
 const primary=[{type:'node',id:1,tags:{name:'Restaurant Nord'}},{type:'node',id:2,tags:{name:'Pizza Uno'}}];
 const pizzaSupplement=[{type:'node',id:2,tags:{name:'Pizza Uno',cuisine:'pizza'}},{type:'node',id:3,tags:{name:'Pizza Extra',cuisine:'pizza'}}];
 const merged=B.mergeElements(primary,pizzaSupplement);
 assert.deepEqual(merged.map(e=>e.id),[1,2,3]);
 assert.equal(merged.find(e=>e.id===1).tags.name,'Restaurant Nord','primary non-pizza restaurant must never be removed');
 assert.equal(merged.find(e=>e.id===2).tags.cuisine,'pizza','supplement may enrich an already-known OSM object without duplicating it');
});
