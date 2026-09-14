const test=require('node:test');
const assert=require('node:assert/strict');
const Poi=require('../web/poi-search.js');

const distance=(a,b)=>Math.hypot(a.lat-b.lat,a.lng-b.lng)*111;
const center={lat:53.6735,lng:10.2377};
const venue=(id,type,name,evidence='search',states=[])=>({name,address:'Ahrensburg',kind:'venue',osmId:'node-'+id,lat:53.67+id/10000,lng:10.24,searchStates:states,place:{placeId:'node-'+id,name,address:'Ahrensburg',lat:53.67+id/10000,lng:10.24,type,pizzaEvidence:evidence,tags:{}}});

test('submitted POI query is bounded, food-only and regex-safe',()=>{
 const q=Poi.buildQuery('Pizza Max (Ahrensburg)',center,10);
 assert.match(q,/around:10000,53\.6735,10\.2377/);
 assert.match(q,/restaurant\|fast_food\|cafe/);
 assert.match(q,/Pizza Max/i);
 assert.ok(!q.includes('Pizza Max (Ahrensburg)'),'raw regex metacharacters are not inserted unescaped');
 assert.match(q,/out body center/);
});

test('generic restaurant search returns named food POIs instead of arbitrary map objects',()=>{
 const q=Poi.buildQuery('Restaurant',center,5);
 assert.match(q,/around:5000/);
 assert.match(q,/restaurant\|takeaway\|food_court\|bar\|pub\|biergarten/);
 assert.match(q,/\["name"\]/);
 assert.doesNotMatch(q,/tourism|supermarket/);
});

test('every legend POI category has an explicit submitted-search query',()=>{
 const cases={
  'Pizzeria':/cuisine.*pizza|name.*pizza/,
  'Café':/amenity"="cafe/,
  'Imbiss':/amenity"="fast_food/,
  'Foodtruck':/amenity"="food_truck|mobile"="yes/,
  'Pizzaautomat':/vending.*pizza/,
  'Weitere Orte':/restaurant\|takeaway\|food_court\|bar\|pub\|biergarten/
 };
 for(const [query,pattern] of Object.entries(cases)){const built=Poi.buildQuery(query,center,10);assert.ok(built,query+' must build a query');assert.match(built,pattern,query);}
});

test('category intent filters local venues by semantic type rather than name substring',()=>{
 const location={name:'Ahrensburg',address:'Schleswig-Holstein',kind:'location',lat:53.67,lng:10.24};
 const items=[venue(1,'cafe','Kaffeeküche'),venue(2,'fast_food','Döner Ecke'),venue(3,'food_truck','Rolling Kitchen'),venue(4,'vending_pizza','24/7 Box','confirmed'),venue(5,'other','Sakura'),venue(6,'pizzeria','Roma','confirmed'),location];
 assert.deepEqual(Poi.mergeRanked([items],'Café',center,distance).map(x=>x.osmId),['node-1']);
 assert.deepEqual(Poi.mergeRanked([items],'Imbiss',center,distance).map(x=>x.osmId),['node-2']);
 assert.deepEqual(Poi.mergeRanked([items],'Foodtruck',center,distance).map(x=>x.osmId),['node-3']);
 assert.deepEqual(Poi.mergeRanked([items],'Pizzaautomat',center,distance).map(x=>x.osmId),['node-4']);
 assert.deepEqual(Poi.mergeRanked([items],'Pizza',center,distance).map(x=>x.osmId).sort(),['node-4','node-6']);
 const restaurants=Poi.mergeRanked([items],'Restaurant',center,distance);
 assert.ok(restaurants.some(x=>x.osmId==='node-5'));
 assert.ok(restaurants.some(x=>x.osmId==='node-6'));
 assert.ok(!restaurants.some(x=>x.osmId==='node-1'),'Café remains a separate category');
 assert.ok(!restaurants.some(x=>x.kind==='location'),'category searches never admit unrelated geocoder locations');
});

test('saved, visited and current location are searchable local states',()=>{
 const items=[venue(1,'other','Sakura','search',['saved']),venue(2,'pizzeria','Roma','confirmed',['visited']),{name:'Dein Standort',address:'Aktuelle GPS-Position',kind:'location',lat:53.67,lng:10.24,searchStates:['location']}];
 assert.deepEqual(Poi.mergeRanked([items],'Gemerkt',center,distance).map(x=>x.osmId||x.name),['node-1']);
 assert.deepEqual(Poi.mergeRanked([items],'Besucht',center,distance).map(x=>x.osmId||x.name),['node-2']);
 assert.deepEqual(Poi.mergeRanked([items],'Mein Standort',center,distance).map(x=>x.osmId||x.name),['Dein Standort']);
 assert.equal(Poi.buildQuery('Gemerkt',center,10),'');
 assert.equal(Poi.buildQuery('Mein Standort',center,10),'');
});

test('exact name plus city outranks partial and unrelated results',()=>{
 const items=[
  {name:'Pizza Max',address:'Ahrensburg',kind:'venue',osmId:'node-1',lat:53.67,lng:10.24,place:{placeId:'node-1',name:'Pizza Max',address:'Ahrensburg',lat:53.67,lng:10.24,type:'pizzeria',pizzaEvidence:'confirmed'}},
  {name:'Pizza Max',address:'Hamburg',kind:'venue',osmId:'node-2',lat:53.55,lng:10.0,place:{placeId:'node-2',name:'Pizza Max',address:'Hamburg',lat:53.55,lng:10.0,type:'pizzeria',pizzaEvidence:'confirmed'}},
  {name:'Max Café',address:'Ahrensburg',kind:'venue',osmId:'node-3',lat:53.68,lng:10.23,place:{placeId:'node-3',name:'Max Café',address:'Ahrensburg',lat:53.68,lng:10.23,type:'cafe',pizzaEvidence:'search'}},
  {name:'Ahrensburg',address:'Schleswig-Holstein',kind:'location',lat:53.67,lng:10.24}
 ];
 const ranked=Poi.mergeRanked([items],'Pizza Max Ahrensburg',center,distance);
 assert.equal(ranked[0].osmId,'node-1');
 assert.ok(ranked.findIndex(x=>x.osmId==='node-2')>0);
 assert.ok(!ranked.some(x=>x.kind==='location'));
});

test('OSM identity deduplicates the same POI across sources',()=>{
 const a={name:'Luigi',address:'Ahrensburg',kind:'venue',osmId:'node-9',lat:53.67,lng:10.24,place:{placeId:'node-9',name:'Luigi',address:'Ahrensburg',lat:53.67,lng:10.24,type:'other',pizzaEvidence:'search'}};
 const b={...a,address:'Ahrensburg, Deutschland'};
 const ranked=Poi.mergeRanked([[a],[b]],'Luigi Ahrensburg',center,distance);
 assert.equal(ranked.filter(x=>x.osmId==='node-9').length,1);
});