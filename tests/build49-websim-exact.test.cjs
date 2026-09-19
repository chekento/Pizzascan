const test=require('node:test');
const assert=require('node:assert/strict');
const B=require('../web/build49-runtime.js');

test('Build 49 version and source-original mode',()=>{
  assert.equal(B.VERSION,'2.3.14');
  assert.equal(B.BUILD,49);
  assert.equal(B.ENDPOINT,'https://overpass-api.de/api/interpreter');
  assert.equal(B.NOMINATIM,'https://nominatim.openstreetmap.org/search');
});

test('Build 49 always searches the visible map bbox like WebSim',()=>{
  const q=B.websimQuery({south:53.8,west:10.6,north:53.9,east:10.8});
  assert.match(q,/53\.8,10\.6,53\.9,10\.8/);
  assert.doesNotMatch(q,/around:/);
  assert.match(q,/pizzascan-build49-websim-source-exact/);
  assert.match(q,/out body; >; out skel qt;/);
});

test('Build 49 keeps the exact source-original PizzaScan selector families',()=>{
  const q=B.websimQuery({south:1,west:2,north:3,east:4});
  const required=[
    '["cuisine"="pizza"]',
    '["amenity"="restaurant"]["cuisine"="italian"]',
    '["amenity"="restaurant"]["cuisine"~"pizza|pizzeria"]',
    '["vending"="pizza"]',
    '["vending:pizza"="yes"]',
    '["amenity"="cafe"]["cuisine"~"pizza|italian"]',
    '["amenity"="fast_food"]["cuisine"~"pizza|italian"]',
    '["amenity"="food_truck"]["cuisine"~"pizza|italian"]',
    '["speciality"~"pizza",i]',
    '["amenity"~"bar|pub"]["cuisine"~"pizza|italian"]',
    '["name"~"pizza|pizzeria|pizze",i]',
    '["description"~"pizza",i]',
    '["amenity"="takeaway"]["cuisine"~"pizza|italian"]'
  ];
  for(const fragment of required)assert.ok(q.includes(fragment),fragment);
  assert.doesNotMatch(q,/ristorante|trattoria|osteria|brand|operator|dish|alt_name/);
});

test('Build 49 restores WebSim viewport auto-search instead of fixed 5 km',()=>{
  const cfg=B.migrationConfig({radius:5,autoSearch:false,onlyOpen:true,minRating:4.6});
  assert.equal(cfg.radius,0);
  assert.equal(cfg.autoSearch,true);
  assert.equal(cfg.onlyOpen,true);
  assert.equal(cfg.minRating,4.6);
  assert.equal(cfg.includeItalian,true);
  assert.equal(cfg.includeUnconfirmed,true);
});

test('Build 49 does not add extra result-shaping beyond the WebSim response',()=>{
  assert.equal(Object.prototype.hasOwnProperty.call(B,'centerizeWebsim'),false);
});
