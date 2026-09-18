const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {server,until,mapFixtures}=require('./helpers.cjs');

(async()=>{
 const {server:s,url}=await server();
 const browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:393,height:851}});
 const fast=[
  {type:'node',id:43001,lat:53.5511,lon:9.9937,tags:{name:'Zum Markt',amenity:'restaurant',opening_hours:'24/7'}},
  {type:'node',id:43002,lat:53.5520,lon:9.9940,tags:{name:'The Lantern',amenity:'bar',cuisine:'pizza;italian',opening_hours:'24/7'}},
  ...Array.from({length:28},(_,i)=>({type:'node',id:43100+i,tags:{name:'Guard '+i,amenity:i%2?'restaurant':'cafe'}}))
 ];
 const late=[
  {type:'node',id:43003,lat:53.5530,lon:9.9950,tags:{name:'Trattoria Verde',amenity:'restaurant',cuisine:'italian',opening_hours:'24/7'}},
  ...Array.from({length:29},(_,i)=>({type:'node',id:43200+i,tags:{name:'Late generic '+i,amenity:'restaurant'}}))
 ];
 let fastQuery='',lateQuery='',slowReleased=false;
 await mapFixtures(page);
 await page.route('**/overpass-api.de/**',async r=>{
  lateQuery=new URLSearchParams(r.request().postData()||'').get('data')||'';
  await new Promise(resolve=>setTimeout(resolve,1800));slowReleased=true;
  return r.fulfill({json:{elements:late}});
 });
 await page.route('**/overpass.private.coffee/**',r=>{
  fastQuery=new URLSearchParams(r.request().postData()||'').get('data')||'';
  return r.fulfill({json:{elements:fast}});
 });
 await page.route('**/overpass.osm.jp/**',async r=>{
  await new Promise(resolve=>setTimeout(resolve,2600));
  return r.fulfill({json:{elements:[]}});
 });
 try{
  await page.goto(url);
  await until(page,()=>window.PizzaScan?.ready);
  await page.locator('#welcome-start').click();
  await until(page,()=>places.some(p=>p.name==='The Lantern')&&!mapLoading,12000);
  const first=await page.evaluate(()=>({names:places.map(p=>p.name),lantern:places.find(p=>p.name==='The Lantern'),build:PizzaScanDiscovery48,contract:PizzaScanDiscovery47,version:PizzaScan.version}));
  assert.equal(first.names.includes('Zum Markt'),false,'Generic restaurant without pizza/Italian evidence must not be shown');
  assert.equal(first.lantern.pizzaEvidence,'confirmed','Pizza bar remains confirmed from cuisine even without Pizza in its name');
  assert.equal(first.build.defaultNearbyRadiusKm,5);
  assert.equal(first.build.emptyOverpassPhotonRecovery,true);
  assert.equal(first.build.statusAboveMap,true);
  assert.equal(first.build.compactControlPanel,true);
  assert.equal(first.contract.queryHitsAuthoritative,true);
  assert.equal(!first.contract.genericRestaurantsVisible,true);
  assert.equal(first.version,'2.3.13');
  assert.equal(await page.evaluate(()=>mapConfig().radius),5,'Build 48 must restore the practical 5 km nearby default');
  assert.match(fastQuery,/around:5000/,'Build 48 default discovery must query the 5 km nearby circle');
  assert.match(fastQuery,/pizzascan-build47-websim-complete/);
  assert.match(fastQuery,/cuisine/);
  assert.doesNotMatch(fastQuery,/amenity.*restaurant\|fast_food\|cafe\|food_truck\|takeaway\|food_court\|bar\|pub\|biergarten/ ,'Build 48 must not request every generic gastro POI');
  assert.equal(first.names.includes('Trattoria Verde'),false,'Slow mirror must not block first paint');
  assert.equal(slowReleased,false,'First relevant results must render before the slow provider returns');
  await until(page,()=>places.some(p=>p.name==='Trattoria Verde'),7000);
  const after=await page.evaluate(()=>({names:places.map(p=>p.name),count:places.length,source:typeof mapSource==='string'?mapSource:''}));
  assert.ok(after.names.includes('The Lantern')&&after.names.includes('Trattoria Verde'),'Later relevant provider results must merge without replacing first-provider venues');
  assert.equal(after.names.includes('Zum Markt'),false);
  assert.match(lateQuery,/pizzascan-build47-websim-complete/);
  assert.ok(after.count>=2);
  console.log('PASS Build 48 browser discovery: 5 km nearby default, no generic restaurants, immediate first provider and progressive merge');
 }finally{await browser.close();s.close();}
})().catch(error=>{console.error(error);process.exit(1);});
