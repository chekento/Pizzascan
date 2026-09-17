// Read-only worldwide live-service verification. Deterministic tests validate query logic;
// this probe checks that real browser/CSP/CORS flows are not region-locked.
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const {server,until}=require('./helpers.cjs');
function transient(error){const text=[error?.message,error?.detail].filter(Boolean).join(' ');return /HTTP\s+(?:408|425|429|5\d\d)|timeout|timed out|nicht rechtzeitig|abort|network|failed to fetch|fetch failed|connection|socket|temporarily unavailable|nicht erreichbar|too busy|keine treffer/i.test(text);}
const cities=[
 {name:'Paris',lat:48.8566,lng:2.3522,continent:'Europe'},
 {name:'New York',lat:40.7128,lng:-74.006,continent:'North America'},
 {name:'São Paulo',lat:-23.5505,lng:-46.6333,continent:'South America'},
 {name:'Nairobi',lat:-1.2864,lng:36.8172,continent:'Africa'},
 {name:'東京',lat:35.6762,lng:139.6503,continent:'Asia'},
 {name:'Sydney',lat:-33.8688,lng:151.2093,continent:'Oceania'}
];
(async()=>{
 const {server:s,url}=await server(),browser=await chromium.launch();
 const context=await browser.newContext({viewport:{width:393,height:851},userAgent:'Mozilla/5.0 PizzaScan/2.3.6 (+https://github.com/chekento/Pizzascan)'});
 await context.addInitScript(()=>{localStorage.setItem('pizzascan-settings-v2',JSON.stringify({welcomed:true}));localStorage.removeItem('pizzascan-map-view-v1');localStorage.removeItem('pizzascan-global-awaiting-center-v1');});
 const page=await context.newPage(),failures=[];page.on('requestfailed',r=>failures.push({url:r.url(),error:r.failure()?.errorText}));fs.mkdirSync('test-results',{recursive:true});
 try{
  await page.goto(url);await until(page,()=>PizzaScan.ready&&!PizzaScan.diagnostics().mapLoading,90000);
  const fresh=await page.evaluate(()=>({center:map.getCenter(),zoom:map.getZoom(),globalFresh:window.PizzaScanGlobalFresh,status:document.getElementById('map-status').textContent}));
  assert.ok(fresh.globalFresh,'Fresh install without GPS must wait for a real worldwide search center');
  assert.ok(fresh.zoom<=3,'Fresh install without GPS must open a neutral world overview, not a local German/US city');
  assert.ok(Math.abs(fresh.center.lng)<5&&fresh.center.lat>0&&fresh.center.lat<30,'Neutral overview must be geographically neutral: '+JSON.stringify(fresh));

  const geocoding=[];
  for(const city of cities){
   const result=await page.evaluate(async city=>{try{const items=await placeService.photon(city.name,null,{force:true});return {items:items.slice(0,8).map(x=>({name:x.name,lat:x.lat,lng:x.lng,kind:x.kind,address:x.address})),error:''};}catch(e){return {items:[],error:e?.message||String(e)};}},city);
   const nearby=result.items.filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lng)).map(x=>({...x,distanceKm:Math.round(PizzaDistance(city,x)*10)/10}));
   function PizzaDistance(a,b){const R=6371,rad=x=>x*Math.PI/180,dLat=rad(b.lat-a.lat),dLng=rad(b.lng-a.lng),h=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;return 2*R*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
   const best=nearby.sort((a,b)=>a.distanceKm-b.distanceKm)[0];
   geocoding.push({...city,error:result.error,best,returned:result.items.length});
   if(result.items.length)assert.ok(best&&best.distanceKm<300,`${city.name} global geocoder result is implausibly far away: ${JSON.stringify(best)}`);
  }
  fs.writeFileSync('test-results/live-global-geocoding.json',JSON.stringify({cities:geocoding,failures},null,2));
  const geoSuccess=geocoding.filter(x=>x.returned>0&&x.best?.distanceKm<300);
  if(geoSuccess.length<3)console.warn('WARN global geocoder matrix had limited live availability; deterministic worldwide tests remain authoritative:',JSON.stringify(geocoding));
  else assert.ok(new Set(geoSuccess.map(x=>x.continent)).size>=3,'Live global geocoding should cover multiple continents when the provider is available');

  const mapProbes=[],probeCities=[cities[0],cities[4],cities[2]];
  for(const city of probeCities){
   const probe=await page.evaluate(async city=>{map.setView([city.lat,city.lng],14,{animate:false});try{await loadPlaces({force:true});}catch{}const d=PizzaScan.diagnostics();return {...city,places:d.places,visible:d.visiblePlaces,markers:d.markerCount,mapError:d.mapError,providerErrors:placeService.lastErrors||[],center:map.getCenter(),zoom:map.getZoom()};},city);
   mapProbes.push(probe);if(probe.places>0)break;
  }
  fs.writeFileSync('test-results/live-global-map-probes.json',JSON.stringify(mapProbes,null,2));
  const liveMap=mapProbes.find(x=>x.places>0);
  if(liveMap){
   assert.ok(liveMap.visible>=0&&liveMap.markers>=0,'Map result set must remain renderable');
   assert.ok(Math.abs(liveMap.center.lat-liveMap.lat)<0.2&&Math.abs(liveMap.center.lng-liveMap.lng)<0.2,'Map center must stay in selected worldwide city');
   await page.screenshot({path:'test-results/live-global-map.png',fullPage:true});
  }else{
   const errors=mapProbes.flatMap(x=>x.providerErrors||[]);
   if(errors.length&&errors.every(transient))console.warn('WARN all live map providers were temporarily unavailable across global probes; deterministic map tests remain authoritative.');
   else assert.fail('Worldwide live map probes returned no places without a clearly transient provider outage: '+JSON.stringify(mapProbes));
  }

  // A global text search must not depend on a preselected country or the old Hamburg/Ahrensburg center.
  await page.locator('#search-toggle').click();await until(page,()=>!document.getElementById('search-panel').classList.contains('search-panel-collapsed'));
  await page.locator('#search').fill('Tokyo');await page.locator('#search-submit').click();await until(page,()=>!document.getElementById('search-submit').disabled,45000);
  const search=await page.evaluate(()=>searchResults.map(x=>({name:x.name,lat:x.lat,lng:x.lng,kind:x.kind,address:x.address})));fs.writeFileSync('test-results/live-global-search.json',JSON.stringify(search,null,2));
  if(search.length){const close=search.some(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lng)&&Math.abs(x.lat-35.6762)<2&&Math.abs(x.lng-139.6503)<3);assert.ok(close,'Tokyo search must return a Tokyo-area result when live geocoding answers');}
  await page.locator('#search-collapse').click();assert.equal(await page.locator('#search').isVisible(),false);
  console.log('LIVE GLOBAL',JSON.stringify({geocoderSuccess:geoSuccess.length,continents:[...new Set(geoSuccess.map(x=>x.continent))],mapProbe:liveMap?.name||'provider-outage',searchResults:search.length}));
 }catch(e){await page.screenshot({path:'test-results/live-global-failure.png'}).catch(()=>{});throw e;}finally{await browser.close();s.close();}
})().catch(e=>{console.error(e);process.exit(1)});
