const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {server,until,mapFixtures}=require('./helpers.cjs');

(async()=>{
 const {server:s,url}=await server();
 const browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:393,height:851}});
 const fast=[
  {type:'node',id:42001,lat:53.5511,lon:9.9937,tags:{name:'Zum Markt',amenity:'restaurant',opening_hours:'24/7'}},
  {type:'node',id:42002,lat:53.5520,lon:9.9940,tags:{name:'The Lantern',amenity:'bar',cuisine:'pizza;italian',opening_hours:'24/7'}},
  ...Array.from({length:28},(_,i)=>({type:'node',id:42100+i,tags:{name:'Guard '+i,amenity:i%2?'restaurant':'cafe'}}))
 ];
 const late=[
  {type:'node',id:42003,lat:53.5530,lon:9.9950,tags:{name:'Late Bistro',amenity:'restaurant',opening_hours:'24/7'}},
  ...Array.from({length:29},(_,i)=>({type:'node',id:42200+i,tags:{name:'Late guard '+i,amenity:'restaurant'}}))
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
  await until(page,()=>places.some(p=>p.name==='Zum Markt')&&!mapLoading,12000);
  const first=await page.evaluate(()=>({
   names:places.map(p=>p.name),
   generic:places.find(p=>p.name==='Zum Markt'),
   lantern:places.find(p=>p.name==='The Lantern'),
   build:PizzaScanDiscovery42
  }));
  assert.ok(first.names.includes('Zum Markt'),'A generic named restaurant must be visible without Pizza in its name or tags');
  assert.equal(first.generic.pizzaEvidence,'search','Generic restaurant remains explicitly unconfirmed rather than being fabricated as pizza');
  assert.equal(first.lantern.pizzaEvidence,'confirmed','Pizza bar is confirmed from cuisine even though Pizza is absent from its name');
  assert.equal(first.build.noPizzaNameRequirement,true);
  assert.equal(first.build.firstPaintProgressive,true);
  assert.equal(first.build.liveResultCap,null);
  assert.match(fastQuery,/around:5000/,'Default fixed-radius discovery must use the actual 5 km circle');
  assert.match(fastQuery,/restaurant\|fast_food\|cafe\|food_truck\|takeaway\|food_court\|bar\|pub\|biergarten/);
  assert.equal(first.names.includes('Late Bistro'),false,'Slow mirror must not block first paint');
  assert.equal(slowReleased,false,'First results must render before the deliberately slow provider returns');
  await until(page,()=>places.some(p=>p.name==='Late Bistro'),7000);
  const after=await page.evaluate(()=>({names:places.map(p=>p.name),count:places.length,source:typeof mapSource==='string'?mapSource:''}));
  assert.ok(after.names.includes('Zum Markt')&&after.names.includes('Late Bistro'),'Later provider results must merge without replacing first-provider venues');
  assert.match(lateQuery,/around:5000/);
  assert.ok(after.count>=3);
  console.log('PASS Build 42 browser discovery: generic restaurant, pizza bar without Pizza in name, immediate first provider and progressive mirror merge');
 }finally{await browser.close();s.close();}
})().catch(error=>{console.error(error);process.exit(1);});
