const {test}=require('node:test');
const assert=require('node:assert/strict');
const R=require('../web/release-info.js');

test('release panel identifies current 2.3.19 direct build and Play closed track as next milestone',()=>{
 assert.equal(R.RELEASE.version,'2.3.19');
 assert.equal(R.RELEASE.build,55);
 assert.equal(R.RELEASE.next,'Google Play Closed Track');
});

test('release panel exposes changelog, archive and production-named current APK in all supported languages',()=>{
 for(const lang of ['de','en','it','es','fr']){
  const html=R.html(lang);
  assert.match(html,/pizzascan-release-info/);
  assert.match(html,/PizzaScan 2.3.19 · Build 54/);
  assert.match(html,/CHANGELOG\.md/);
  assert.match(html,/downloads\/README\.md/);
  assert.match(html,/PizzaScan-2.3.19.apk/);
  assert.doesNotMatch(html,/PizzaScan-2\.3\.6-Test\.apk/);
  assert.match(html,/2\.3\.0/);
  assert.match(html,/2\.3\.5/);
 }
});

test('coverage audit queries every named food venue family, including bars and pubs, without a result cap',()=>{
 const q=R.coverageQuery('around:5000,53.55,10.00');
 assert.match(q,/amenity/);
 for(const type of ['restaurant','fast_food','cafe','food_truck','takeaway','food_court','bar','pub','biergarten'])assert.ok(q.includes(type),type);
 assert.match(q,/shop/);
 assert.match(q,/vending/);
 assert.doesNotMatch(q,/\bout\s+\d+\b/i,'no artificial numeric result limit');
 assert.match(q,/out body center/);
});

test('coverage evidence recognizes pizza restaurants and pizza bars across common scripts and localized tags',()=>{
 const cases=[
  {amenity:'restaurant',cuisine:'pizza'},
  {amenity:'bar',cuisine:'pizza;italian'},
  {amenity:'pub','description:ja':'石窯ピザあり'},
  {amenity:'restaurant','description:zh':'披萨和意大利菜'},
  {amenity:'bar','note:ar':'بيتزا متاحة'},
  {amenity:'restaurant','description:ru':'пицца из дровяной печи'}
 ];
 for(const tags of cases){assert.equal(R.foodObject(tags),true);assert.equal(R.pizzaEvidence(tags),true,JSON.stringify(tags));assert.equal(R.coverageRelevant({tags}),true,JSON.stringify(tags));}
 assert.equal(R.coverageRelevant({tags:{amenity:'bar',name:'Cocktail Bar'}}),false,'ordinary non-pizza bar stays excluded');
});

test('provider policy keeps OSM as the mergeable primary index and exposes Google/Microsoft only as external cross-checks',()=>{
 assert.deepEqual(R.OSM_PROVIDERS,['https://overpass-api.de/api/interpreter','https://overpass.private.coffee/api/interpreter','https://overpass.osm.jp/api/interpreter']);
 const html=R.externalCoverageLinks({name:'Pizza Test',address:'1 Main St',lat:48.1,lng:11.5});
 assert.match(html,/google\.com\/maps\/search/);
 assert.match(html,/bing\.com\/maps/);
 assert.match(html,/nicht in die OSM-Datenbank kopiert/);
});
