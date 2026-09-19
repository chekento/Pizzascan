const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {server,until,mapFixtures}=require('./helpers.cjs');

(async()=>{
 const {server:s,url}=await server();
 const browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:393,height:851}});
 const exact=[
  {type:'node',id:43002,lat:53.5520,lon:9.9940,tags:{name:'The Lantern',amenity:'bar',cuisine:'pizza',opening_hours:'24/7'}},
  {type:'node',id:43003,lat:53.5530,lon:9.9950,tags:{name:'Trattoria Verde',amenity:'restaurant',cuisine:'italian',opening_hours:'24/7'}}
 ];
 let query='',fallbackCalls=0,photonCalls=0;
 await mapFixtures(page);
 await page.route('**/overpass-api.de/**',r=>{
  query=new URLSearchParams(r.request().postData()||'').get('data')||'';
  return r.fulfill({json:{elements:exact}});
 });
 await page.route('**/overpass.private.coffee/**',r=>{fallbackCalls++;return r.fulfill({json:{elements:[]}});});
 await page.route('**/overpass.osm.jp/**',r=>{fallbackCalls++;return r.fulfill({json:{elements:[]}});});
 await page.route('https://photon.komoot.io/**',r=>{photonCalls++;return r.fulfill({json:{features:[]}});});
 try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:15000});
  await until(page,()=>window.PizzaScan?.ready);
  await page.locator('#welcome-start').click();
  await until(page,()=>places.some(p=>p.name==='The Lantern')&&places.some(p=>p.name==='Trattoria Verde')&&!mapLoading,12000);
  const state=await page.evaluate(()=>({
    names:places.map(p=>p.name),
    build:PizzaScanDiscovery49,
    version:PizzaScan.version,
    radius:mapConfig().radius,
    toolbar:document.querySelector('.map-control-panel').getBoundingClientRect().height,
    statusBeforeMap:!!(document.querySelector('.map-caption').compareDocumentPosition(document.getElementById('map-frame'))&Node.DOCUMENT_POSITION_FOLLOWING)
  }));
  assert.equal(state.version,'2.3.16');
  assert.equal(state.build.build,51);
  assert.equal(state.build.viewportBBox,true);
  assert.equal(state.build.exactSelectorFamilies,20);
  assert.equal(state.build.nominatimSearch,true);
  assert.equal(state.build.photonDiscovery,false);
  assert.equal(state.radius,0,'Build 50 must use the visible viewport like source-original WebSim');
  assert.ok(state.toolbar>0&&state.toolbar<90,'Modern map control bar must remain compact: '+state.toolbar);
  assert.equal(state.statusBeforeMap,true,'Search status must stay above the map');

  assert.match(query,/pizzascan-build51-websim-coverage-complete/);
  assert.doesNotMatch(query,/around:/);
  for(const re of [
    /amenity"~"restaurant\|fast_food\|cafe\|food_truck\|bar\|pub\|biergarten\|takeaway\|food_court"\]\["name"/,
    /amenity"="food_truck"\]\["mobile"="yes"/,
    /cuisine"~/,/cuisine:it/,/restaurant:type/,
    /official_name/,/alt_name/,/operator/,/description/,/speciality/,
    /shop/,/vending:pizza"="yes"/
  ])assert.match(query,re);
  for(const word of ['ristorante','trattoria','osteria','brand','operator','official_name','alt_name','description'])assert.ok(query.includes(word),word);
  assert.doesNotMatch(query,/burger|doner|sushi/i);
  assert.equal(fallbackCalls,0,'WebSim parity discovery must not fan out to extra Overpass mirrors');
  assert.equal(photonCalls,0,'WebSim parity discovery must not add Photon POIs');
  console.log('PASS Build 51 browser discovery: complete BBOX selectors, provider failover, modern controls');
 }finally{await browser.close();s.close();}
})().catch(error=>{console.error(error);process.exit(1);});
