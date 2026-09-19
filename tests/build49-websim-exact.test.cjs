const test=require('node:test');
const assert=require('node:assert/strict');
const B=require('../web/build49-runtime.js');

test('Build 55 version and WebSim-complete mode',()=>{
  assert.equal(B.VERSION,'2.3.20');
  assert.equal(B.BUILD,55);
  assert.equal(B.ENDPOINT,'https://overpass-api.de/api/interpreter');
  assert.equal(B.NOMINATIM,'https://nominatim.openstreetmap.org/search');
});

test('Build 55 always searches the visible map bbox like WebSim',()=>{
  const q=B.websimQuery({south:53.8,west:10.6,north:53.9,east:10.8});
  assert.match(q,/53\.8,10\.6,53\.9,10\.8/);
  assert.doesNotMatch(q,/around:/);
  assert.match(q,/pizzascan-build54-websim-coverage-complete/);
  assert.match(q,/out body center;/);
});

test('Build 55 keeps the WebSim selector families and restores named Italian venues',()=>{
  const q=B.websimQuery({south:1,west:2,north:3,east:4});
  const required=[
    '["cuisine"~"pizza',
    '["cuisine:it"',
    '["restaurant:type"',
    '["amenity"~"restaurant|fast_food|cafe|food_truck|bar|pub|biergarten|takeaway|food_court"]["name"]',
    '["amenity"="food_truck"]["mobile"="yes"]',
    '["vending"~"pizza"',
    '["vending:pizza"="yes"]',
    'speciality',
    'trattoria',
    'ristorante',
    'osteria',
    'official_name',
    'alt_name',
    'operator',
    'description',
    'shop'
  ];
  for(const fragment of required)assert.ok(q.includes(fragment),fragment);
  assert.doesNotMatch(q,/burger|doner|sushi/i);
});

test('Build 55 restores viewport auto-search without erasing unrelated filter choices',()=>{
  const cfg=B.migrationConfig({radius:5,autoSearch:false,onlyOpen:true,minRating:4.6,types:['pizzeria']},['pizzeria','trattoria']);
  assert.equal(cfg.radius,0);
  assert.equal(cfg.autoSearch,true);
  assert.equal(cfg.onlyOpen,true);
  assert.equal(cfg.minRating,4.6);
  assert.equal(cfg.includeItalian,true);
  assert.equal(cfg.includeUnconfirmed,true);
  assert.equal(cfg.includeUnrated,true);
  assert.deepEqual(cfg.types,['pizzeria','trattoria']);
});

test('Build 55 locks the coverage-complete query against legacy runtime reassignment',()=>{
  const root={PizzaPlaces:{query(){return 'legacy';}}};
  assert.equal(B.lockQuery(root),true);
  const q1=root.PizzaPlaces.query(null,null,{south:1,west:2,north:3,east:4});
  root.PizzaPlaces.query=()=> 'broad legacy';
  const q2=root.PizzaPlaces.query(null,null,{south:1,west:2,north:3,east:4});
  assert.match(q1,/pizzascan-build54-websim-coverage-complete/);
  assert.equal(q2,q1);
});
