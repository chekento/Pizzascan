const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const P=require('../web/places.js');
const B=require('../web/broad-defaults.js');

test('runtime no longer loads settings-aware search narrowing before POI discovery',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../web/index.html'),'utf8');
 assert.doesNotMatch(html,/src="settings-search\.js"/,'settings-search must stay out of the runtime search pipeline');
 const map=html.indexOf('src="map-ui.js"');
 const native=html.indexOf('src="native-overpass.js"');
 const review=html.indexOf('src="review-discovery.js"');
 const broad=html.indexOf('src="broad-defaults.js"');
 const poi=html.indexOf('src="poi-discovery.js"');
 const app=html.indexOf('src="script.js"');
 assert.ok(map>=0&&native>map&&review>native&&broad>review&&poi>broad&&app>poi,'native transport and additive discovery must install before app initialization');
});

test('broad default migration restores a non-restrictive map configuration',()=>{
 const cfg=B.broadMigration({types:['pizzeria'],onlyOpen:true,includeItalian:false,includeUnconfirmed:false,radius:1,hideVisited:true,minRating:4.9},P.TYPES);
 assert.deepEqual(cfg.types,Object.keys(P.TYPES));
 assert.equal(cfg.onlyOpen,false);
 assert.equal(cfg.includeItalian,true);
 assert.equal(cfg.includeUnconfirmed,true);
 assert.equal(cfg.radius,10);
 assert.equal(cfg.hideVisited,false);
 assert.equal(cfg.minRating,0);
 assert.equal(B.MARKER,'pizzascan-broad-defaults-v5');
});

test('default candidate set is monotonic: pizza, Italian and generic food POIs all survive normalization and filtering',()=>{
 const elements=[
  {type:'node',id:1,lat:53.67,lon:10.24,tags:{name:'Pizza Uno',amenity:'restaurant',cuisine:'pizza'}},
  {type:'node',id:2,lat:53.671,lon:10.241,tags:{name:'Ristorante Roma',amenity:'restaurant',cuisine:'italian'}},
  {type:'node',id:3,lat:53.672,lon:10.242,tags:{name:'Restaurant Nord',amenity:'restaurant',cuisine:'german'}},
  {type:'node',id:4,lat:53.673,lon:10.243,tags:{name:'Cafe Mitte',amenity:'cafe'}},
  {type:'node',id:5,lat:53.674,lon:10.244,tags:{name:'Pub West',amenity:'pub'}}
 ];
 const list=P.fromOverpass(elements,{allowNamed:true});
 assert.equal(list.length,5);
 const cfg=B.normalizeConfig(P.defaults,{},P.TYPES);
 const visible=P.filter(list,cfg,{visited:new Set()},()=>({state:'unknown'}));
 assert.equal(visible.length,5,'new filter/review features must not shrink the default baseline candidate set');
});

test('broad Overpass query asks for every named food category before filtering',()=>{
 const base=P.query({lat:53.67,lng:10.24},10,{south:53.6,west:10.1,north:53.8,east:10.4});
 const q=B.expandDiscoveryQuery(base,true);
 assert.match(q,/pizzascan-broad-discovery/);
 for(const amenity of ['restaurant','fast_food','cafe','food_truck','takeaway','food_court','bar','pub','biergarten'])assert.match(q,new RegExp(amenity));
 assert.match(q,/\["name"\]/);
});
