const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {server,until,mapFixtures}=require('./helpers.cjs');
const elements=[
 {type:'node',id:11,lat:53.5511,lon:9.9937,tags:{name:'Pizza Anchor',cuisine:'pizza',amenity:'restaurant',opening_hours:'24/7'}},
 {type:'node',id:12,lat:53.5531,lon:9.9977,tags:{name:'Pizza North',cuisine:'pizza',amenity:'restaurant',opening_hours:'24/7'}}
];
const expected={de:'Gute Pizza. Ganz nah.',en:'Great pizza. Right nearby.',it:'Buona pizza. Proprio qui vicino.',es:'Buena pizza. Muy cerca.',fr:'Bonne pizza. Tout près.'};
(async()=>{const {server:s,url}=await server(),browser=await chromium.launch();try{
 for(const language of Object.keys(expected)){
  const ctx=await browser.newContext({viewport:{width:393,height:851}});await ctx.addInitScript(code=>localStorage.setItem('pizzascan-language-v1',code),language);const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await mapFixtures(page);
  await page.route('**/overpass-api.de/**',r=>r.fulfill({json:{elements}}));await page.route('**/overpass.private.coffee/**',r=>r.fulfill({json:{elements}}));await page.route('**/photon.komoot.io/**',r=>r.fulfill({json:{features:[]}}));
  await page.goto(url);await until(page,()=>PizzaScan.ready);await page.locator('#welcome-start').click();await until(page,()=>PizzaScan.diagnostics().places===2&&!PizzaScan.diagnostics().mapLoading);
  assert.equal(await page.locator('#map-view h1').innerText(),expected[language],language+' main heading');assert.equal(await page.evaluate(()=>document.documentElement.lang),language);assert.equal(await page.locator('#pizzascan-language-select').count(),0);
  await page.locator('#settings-open').click();await until(page,()=>document.getElementById('pizzascan-language-select'));assert.equal(await page.locator('#pizzascan-language-select option').count(),5);assert.equal(await page.locator('#pizzascan-language-select').inputValue(),language);await page.locator('#sheet-close').click();
  if(language==='en'){
   assert.equal(await page.locator('#search').getAttribute('placeholder'),'Restaurant, pizzeria or place');
   const before=await page.evaluate(()=>{const layer=markers.getLayers().find(m=>Math.abs(m.getLatLng().lat-53.5511)<1e-7&&Math.abs(m.getLatLng().lng-9.9937)<1e-7);if(!layer)throw Error('anchor marker missing');const el=layer.getElement(),visual=el.querySelector('.emoji-marker'),mapRect=document.getElementById('map').getBoundingClientRect(),point=map.latLngToContainerPoint(layer.getLatLng()),er=el.getBoundingClientRect(),vr=visual.getBoundingClientRect();return {lat:layer.getLatLng().lat,lng:layer.getLatLng().lng,anchorDx:(er.left+19)-(mapRect.left+point.x),anchorDy:(er.top+36)-(mapRect.top+point.y),visualDx:(vr.left+19)-(mapRect.left+point.x),visualDy:(vr.top+36)-(mapRect.top+point.y)};});
   assert.ok(Math.abs(before.anchorDx)<1.1&&Math.abs(before.anchorDy)<1.1,'Leaflet anchor aligns before pan');assert.ok(Math.abs(before.visualDx)<1.1&&Math.abs(before.visualDy)<1.1,'visible marker aligns before pan');
   await page.evaluate(()=>map.panBy([110,55],{animate:false}));await page.waitForTimeout(120);
   const after=await page.evaluate(()=>{const layer=markers.getLayers().find(m=>Math.abs(m.getLatLng().lat-53.5511)<1e-7&&Math.abs(m.getLatLng().lng-9.9937)<1e-7);const el=layer.getElement(),visual=el.querySelector('.emoji-marker'),mapRect=document.getElementById('map').getBoundingClientRect(),point=map.latLngToContainerPoint(layer.getLatLng()),er=el.getBoundingClientRect(),vr=visual.getBoundingClientRect();return {lat:layer.getLatLng().lat,lng:layer.getLatLng().lng,anchorDx:(er.left+19)-(mapRect.left+point.x),anchorDy:(er.top+36)-(mapRect.top+point.y),visualDx:(vr.left+19)-(mapRect.left+point.x),visualDy:(vr.top+36)-(mapRect.top+point.y)};});
   assert.equal(after.lat,before.lat);assert.equal(after.lng,before.lng);assert.ok(Math.abs(after.anchorDx)<1.1&&Math.abs(after.anchorDy)<1.1,'Leaflet anchor aligns after pan');assert.ok(Math.abs(after.visualDx)<1.1&&Math.abs(after.visualDy)<1.1,'visible marker remains attached to coordinate after pan');
  }
  assert.deepEqual(errors,[],language+' page errors');await ctx.close();
 }
 console.log('PASS fixed coordinate-anchored markers and de/en/it/es/fr UI language selection');
 }finally{await browser.close();s.close();}})().catch(e=>{console.error(e);process.exit(1)});
