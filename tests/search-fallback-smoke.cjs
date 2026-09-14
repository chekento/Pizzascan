const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {server,until}=require('./helpers.cjs');

(async()=>{
 const {server:s,url}=await server();
 const browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:393,height:851}});
 const tile=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z1SIAAAAASUVORK5CYII=','base64');
 let photonCalls=0,nominatimCalls=0;
 const place={type:'node',id:1,lat:53.5511,lon:9.9937,tags:{name:'Fixture Pizza',cuisine:'pizza',amenity:'restaurant',opening_hours:'24/7'}};
 await page.route('**/tile.openstreetmap.org/**',r=>r.fulfill({contentType:'image/png',body:tile}));
 await page.route('**/api.mangrove.reviews/**',r=>r.fulfill({json:{reviews:[]}}));
 await page.route(/https:\/\/(overpass-api\.de|overpass\.private\.coffee)\//,r=>r.fulfill({json:{elements:[place]}}));
 // Keep POI recovery deterministic and prevent it from consuming Photon calls reserved for submitted geocoding.
 // Thirty raw elements satisfy the product completeness target; only the first has coordinates and is rendered.
 const recovery=[place,...Array.from({length:29},(_,i)=>({type:'node',id:8000+i,tags:{name:'Non-geocoded recovery fixture '+i,amenity:'restaurant'}}))];
 await page.route(/https:\/\/(overpass\.osm\.jp|maps\.mail\.ru)\//,r=>r.fulfill({json:{elements:recovery}}));
 await page.route('**/photon.komoot.io/**',r=>{photonCalls++;const q=new URL(r.request().url()).searchParams.get('q')||'';if(q.toLowerCase().includes('ahrensburg'))return r.fulfill({status:404,contentType:'text/html',headers:{'access-control-allow-origin':'*'},body:'<h1>404 Not Found</h1>'});return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},json:{features:[]}});});
 await page.route('**/nominatim.openstreetmap.org/**',r=>{nominatimCalls++;const q=new URL(r.request().url()).searchParams.get('q')||'';const bargteheide=q.toLowerCase().includes('bargteheide');return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},json:[{place_id:bargteheide?100:99,lat:bargteheide?'53.7286':'53.6759',lon:bargteheide?'10.2663':'10.2393',osm_type:'relation',osm_id:bargteheide?2703417:2400214,category:'place',type:'town',name:bargteheide?'Bargteheide':'Ahrensburg',display_name:(bargteheide?'Bargteheide':'Ahrensburg')+', Stormarn, Schleswig-Holstein, Deutschland',address:{town:bargteheide?'Bargteheide':'Ahrensburg',county:'Stormarn',state:'Schleswig-Holstein',country:'Deutschland',country_code:'de'}}]});});
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
  assert.equal(nominatimCalls,1,'Fallback geocoder runs once after a Photon HTTP failure');
  assert.equal(await page.locator('#search').isVisible(),false,'Single fallback location is selected and search collapses');

  await page.locator('#search-toggle').click();
  await page.locator('#search').fill('Bargteheide');
  await page.locator('#search-submit').click();
  await until(page,()=>Math.abs(map.getCenter().lat-53.7286)<0.01&&Math.abs(map.getCenter().lng-10.2663)<0.01,20000);
  assert.equal(nominatimCalls,2,'Fallback geocoder also runs when Photon succeeds but returns no usable result');
  assert.equal(await page.locator('#search').isVisible(),false,'Empty-primary fallback selection also collapses search');
  console.log('PASS submitted place search falls back after Photon HTTP errors and empty Photon results while POI recovery remains isolated');
 }finally{await browser.close();s.close();}
})().catch(error=>{console.error(error);process.exit(1)});
