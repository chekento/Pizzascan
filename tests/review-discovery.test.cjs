const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const R=require('../web/review-discovery.js');

test('pizza mentions are detected precisely across common pizza words',()=>{
 assert.equal(R.mentionsPizza('Die Pizza Margherita war hervorragend.'),true);
 assert.equal(R.mentionsPizza('Great pizzas and friendly service'),true);
 assert.equal(R.mentionsPizza('Ottima pizzeria, torneremo.'),true);
 assert.equal(R.mentionsPizza('Pasta, Salat und sehr guter Service.'),false);
 assert.equal(R.mentionsPizza('Pizzicato klingt ähnlich, ist aber kein Essen.'),false);
});

test('public review text becomes derived evidence without persisting the text',()=>{
 const row=R.reviewRow({signature:'abcdefghijklmnopqrstuvwx',did:'did:plc:reviewer1',payload:{sub:'geo:53.6735,10.2377?q=Roma',rating:80,iat:1789400000,opinion:'Beste Pizza im Ort',metadata:{osm_id:'node/123',license:'CC-BY-4.0'}}},1789401000000);
 assert.equal(row.mentionsPizza,true);
 assert.equal(row.osmId,'node-123');
 assert.equal(Object.hasOwn(row,'opinion'),false,'review text itself must not enter the evidence cache');
});

test('latest opinion per public reviewer controls review evidence',()=>{
 const place={placeId:'node-123',name:'Roma',lat:53.6735,lng:10.2377};
 const rows=[
  {signature:'a',actor:'did:1',osmId:'node-123',lat:53.6735,lng:10.2377,name:'Roma',iat:10,mentionsPizza:true,seenAt:100},
  {signature:'b',actor:'did:1',osmId:'node-123',lat:53.6735,lng:10.2377,name:'Roma',iat:11,mentionsPizza:false,seenAt:101},
  {signature:'c',actor:'did:2',osmId:'node-123',lat:53.6735,lng:10.2377,name:'Roma',iat:12,mentionsPizza:true,seenAt:102}
 ];
 assert.equal(R.evidence(rows,place,[place]).pizzaMentions,1);
});

test('nearby OSM query also requests ordinary food venues as review candidates',()=>{
 const q='[out:json][timeout:15];(nwr["cuisine"~"pizza",i](around:3000,53.6735,10.2377););out body center;';
 const expanded=R.expandQuery(q);
 assert.match(expanded,/amenity/);
 assert.match(expanded,/restaurant\|fast_food\|cafe/);
 assert.match(expanded,/around:3000,53\.6735,10\.2377/);
});

test('generic restaurant searches are recognized without weakening named searches',()=>{
 assert.equal(R.categoryQuery('Restaurants'),true);
 assert.equal(R.categoryQuery('restaurant'),true);
 assert.equal(R.categoryQuery('Restaurant Roma'),false);
 assert.equal(R.categoryQuery('Pizza'),false);
});

test('settings and review discovery are installed deterministically before app initialization',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../web/index.html'),'utf8');
 const map=html.indexOf('src="map-ui.js"'),hotfix=html.indexOf('src="hotfix-map.js"'),settings=html.indexOf('src="settings-search.js"'),reviews=html.indexOf('src="review-discovery.js"'),app=html.indexOf('src="script.js"');
 assert.ok(map>=0&&hotfix>map&&settings>hotfix&&reviews>settings&&app>reviews,'map hardening, settings policy and review discovery must all load before app initialization');
 assert.equal((html.match(/src="review-discovery\.js"/g)||[]).length,1,'review discovery must have one deterministic loader');
 const staticI18n=fs.readFileSync(path.join(__dirname,'../web/i18n-static.js'),'utf8');
 assert.equal(/loadReviewDiscovery|createElement\(['"]script['"]\)/.test(staticI18n),false,'localization must not dynamically race the search stack');
});
