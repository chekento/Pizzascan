const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {server,until}=require('./helpers.cjs');

(async()=>{
 const {server:s,url}=await server();
 const browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:393,height:851}});
 const tile=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z1SIAAAAASUVORK5CYII=','base64');
 let photonCalls=0,nominatimCalls=0;
 await page.route('**/tile.openstreetmap.org/**',r=>r.fulfill({contentType:'image/png',body:tile}));
 await page.route('**/api.mangrove.reviews/**',r=>r.fulfill({json:{reviews:[]}}));
 await page.route(/https:\/\/(overpass-api\.de|overpass\.private\.coffee)\//,r=>r.fulfill({json:{elements:[{type:'node',id:1,lat:53.5511,lon:9.9937,tags:{name:'Fixture Pizza',cuisine:'pizza',amenity:'restaurant',opening_hours:'24/7'}}]}}));
 await page.route('**/photon.komoot.io/**',r=>{photonCalls++;return r.fulfill({status:404,contentType:'text/html',headers:{'access-control-allow-origin':'*'},body:'<h1>404 Not Found</h1>'});});
 await page.route('**/nominatim.openstreetmap.org/**',r=>{nominatimCalls++;return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},json:[{place_id:99,lat:'53.6759',lon:'10.2393',osm_type:'relation',osm_id:2400214,category:'place',type:'town',name:'Ahrensburg',display_name:'Ahrensburg, Stormarn, Schleswig-Holstein, Deutschland',address:{town:'Ahrensburg',county:'Stormarn',state:'Schleswig-Holstein',country:'Deutschland',country_code:'de'}}]});});
 try{
  await page.goto(url);
  await until(page,()=>PizzaScan.ready);
  await page.locator('#welcome-start').click();
  await until(page,()=>PizzaScan.diagnostics().places===1&&!PizzaScan.diagnostics().mapLoading);
  await page.locator('#search-toggle').click();
  await page.locator('#search').fill('Ahrensburg');
  await page.locator('#search-submit').click();
  await until(page,()=>Math.abs(map.getCenter().lat-53.6759)<0.01&&Math.abs(map.getCenter().lng-10.2393)<0.01,20000);
  assert.ok(photonCalls>=1,'Primary Photon search was attempted');
  assert.equal(nominatimCalls,1,'Fallback geocoder runs once for an explicit submitted search');
  assert.equal(await page.locator('#search').isVisible(),false,'Single fallback location is selected and search collapses');
  console.log('PASS submitted place search falls back to Nominatim when Photon returns 404');
 }finally{await browser.close();s.close();}
})().catch(error=>{console.error(error);process.exit(1);});
