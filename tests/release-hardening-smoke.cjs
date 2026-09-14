const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {server,until}=require('./helpers.cjs');

async function untilNode(fn,timeout=5000){const end=Date.now()+timeout;while(Date.now()<end){if(fn())return;await new Promise(r=>setTimeout(r,100));}throw Error('Timed out waiting for Node-side condition');}

(async()=>{
 const {server:s,url}=await server();
 const browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:393,height:851}});
 const tile=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z1SIAAAAASUVORK5CYII=','base64');
 let overpassCalls=0,emptyMode=false;
 await page.route('**/tile.openstreetmap.org/**',r=>r.fulfill({contentType:'image/png',body:tile}));
 await page.route('**/api.mangrove.reviews/**',r=>r.fulfill({json:{reviews:[]}}));
 await page.route('**/photon.komoot.io/**',r=>r.fulfill({json:{features:[]}}));
 await page.route(/https:\/\/(overpass-api\.de|overpass\.private\.coffee)\//,r=>{overpassCalls++;return r.fulfill({json:{elements:emptyMode?[]:[{type:'node',id:501,lat:53.5511,lon:9.9937,tags:{name:'Recovery Pizza',cuisine:'pizza',amenity:'restaurant',opening_hours:'24/7'}}]}});});
 try{
  await page.goto(url);
  await until(page,()=>PizzaScan.ready);
  await page.locator('#welcome-start').click();
  await until(page,()=>PizzaScan.diagnostics().places===1&&!PizzaScan.diagnostics().mapLoading);
  assert.ok(await page.evaluate(()=>!!localStorage.getItem('pizzascan-first-map-discovery-v1')),'Successful first discovery is persisted');

  await page.evaluate(()=>{
   settings.filters={...mapConfig(),radius:1,autoSearch:false};
   saveSettings();
   localStorage.removeItem('pizzascan-map-cache-v3');
   localStorage.removeItem('pizzascan-map-cache-v2');
  });
  const beforeReload=overpassCalls;
  emptyMode=true;
  await page.reload();
  await until(page,()=>PizzaScan.ready);
  await page.evaluate(()=>loadPlaces({force:true}));
  await until(page,()=>!PizzaScan.diagnostics().mapLoading);
  assert.equal(await page.evaluate(()=>PizzaScan.diagnostics().mapConfig.radius),1,'Later app starts keep the user-selected radius');
  assert.ok(overpassCalls>beforeReload,'Reload performs a map lookup');

  const beforeOnline=overpassCalls;
  emptyMode=false;
  await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await untilNode(()=>overpassCalls>beforeOnline,5000);
  await until(page,()=>PizzaScan.diagnostics().places===1&&!PizzaScan.diagnostics().mapLoading,10000);
  assert.equal(await page.evaluate(()=>PizzaScan.diagnostics().mapConfig.radius),1,'Network recovery does not alter filters');
  console.log('PASS one-time discovery preserves later filters and online recovery refreshes the map');
 }finally{await browser.close();s.close();}
})().catch(error=>{console.error(error);process.exit(1);});
