const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {server,until,mapFixtures}=require('./helpers.cjs');
const elements=[
 {type:'node',id:11,lat:53.5511,lon:9.9937,tags:{name:'Pizza Anchor',cuisine:'pizza',amenity:'restaurant',opening_hours:'24/7'}},
 {type:'node',id:12,lat:53.5531,lon:9.9977,tags:{name:'Pizza North',cuisine:'pizza',amenity:'restaurant',opening_hours:'24/7'}}
];
// Thirty raw elements keep marker/i18n tests independent from sparse-POI recovery while only two render.
const providerElements=[...elements,...Array.from({length:28},(_,i)=>({type:'node',id:1900+i,tags:{name:'Marker guard '+i,amenity:i%4===0?'restaurant':i%4===1?'cafe':i%4===2?'pub':'fast_food'}}))];
const expected={de:'Gute Pizza. Ganz nah.',en:'Great pizza. Right nearby.',it:'Buona pizza. Proprio qui vicino.',es:'Buena pizza. Muy cerca.',fr:'Bonne pizza. Tout près.'};
(async()=>{const {server:s,url}=await server(),browser=await chromium.launch();try{
 for(const language of Object.keys(expected)){
  const ctx=await browser.newContext({viewport:{width:393,height:851}});await ctx.addInitScript(code=>{if(!localStorage.getItem('pizzascan-language-v1'))localStorage.setItem('pizzascan-language-v1',code);},language);const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await mapFixtures(page);
  await page.route(/https:\/\/(overpass-api\.de|overpass\.private\.coffee|overpass\.osm\.jp|maps\.mail\.ru)\//,r=>r.fulfill({json:{elements:providerElements}}));await page.route('**/photon.komoot.io/**',r=>r.fulfill({json:{features:[]}}));
  await page.goto(url);await until(page,()=>PizzaScan.ready);await page.locator('#welcome-start').click();await until(page,()=>PizzaScan.diagnostics().places===2&&!PizzaScan.diagnostics().mapLoading);
  assert.equal(await page.locator('#map-view h1').innerText(),expected[language],language+' main heading');assert.equal(await page.evaluate(()=>document.documentElement.lang),language);assert.equal(await page.locator('#pizzascan-language-select').count(),0);
  await page.locator('#settings-open').click();await until(page,()=>document.getElementById('pizzascan-language-select'));assert.equal(await page.locator('#pizzascan-language-select option').count(),14);assert.equal(await page.locator('#pizzascan-language-select').inputValue(),language);await page.locator('#sheet-close').click();
  if(language==='en'){
   assert.equal(await page.locator('#search').getAttribute('placeholder'),'Pizzeria, trattoria, Italian restaurant, pizza …');
   const before=await page.evaluate(()=>{const layer=markers.getLayers().find(m=>Math.abs(m.getLatLng().lat-53.5511)<1e-7&&Math.abs(m.getLatLng().lng-9.9937)<1e-7);if(!layer)throw Error('anchor marker missing');const el=layer.getElement(),visual=el.matches('.emoji-marker')?el:el.querySelector('.emoji-marker'),mapRect=document.getElementById('map').getBoundingClientRect(),point=map.latLngToContainerPoint(layer.getLatLng()),er=el.getBoundingClientRect(),vr=visual.getBoundingClientRect();return {lat:layer.getLatLng().lat,lng:layer.getLatLng().lng,anchorDx:(er.left+19)-(mapRect.left+point.x),anchorDy:(er.top+36)-(mapRect.top+point.y),visualDx:(vr.left+19)-(mapRect.left+point.x),visualDy:(vr.top+36)-(mapRect.top+point.y)};});
   assert.ok(Math.abs(before.anchorDx)<1.1&&Math.abs(before.anchorDy)<1.1,'Leaflet anchor aligns before pan');assert.ok(Math.abs(before.visualDx)<1.1&&Math.abs(before.visualDy)<1.1,'visible marker aligns before pan');
   await page.evaluate(()=>map.panBy([110,55],{animate:false}));await page.waitForTimeout(120);
   const after=await page.evaluate(()=>{const layer=markers.getLayers().find(m=>Math.abs(m.getLatLng().lat-53.5511)<1e-7&&Math.abs(m.getLatLng().lng-9.9937)<1e-7);const el=layer.getElement(),visual=el.matches('.emoji-marker')?el:el.querySelector('.emoji-marker'),mapRect=document.getElementById('map').getBoundingClientRect(),point=map.latLngToContainerPoint(layer.getLatLng()),er=el.getBoundingClientRect(),vr=visual.getBoundingClientRect();return {lat:layer.getLatLng().lat,lng:layer.getLatLng().lng,anchorDx:(er.left+19)-(mapRect.left+point.x),anchorDy:(er.top+36)-(mapRect.top+point.y),visualDx:(vr.left+19)-(mapRect.left+point.x),visualDy:(vr.top+36)-(mapRect.top+point.y)};});
   assert.equal(after.lat,before.lat);assert.equal(after.lng,before.lng);assert.ok(Math.abs(after.anchorDx)<1.1&&Math.abs(after.anchorDy)<1.1,'Leaflet anchor aligns after pan');assert.ok(Math.abs(after.visualDx)<1.1&&Math.abs(after.visualDy)<1.1,'visible marker remains attached to coordinate after pan');
   await ctx.grantPermissions(['geolocation']);await ctx.setGeolocation({latitude:53.552,longitude:9.995,accuracy:12});
   await page.locator('#gps').click();await until(page,()=>!!window.gpsMarker&&!PizzaScan.diagnostics().mapLoading);
   async function verifyAnchors(stage,{requireVenues=false}={}){
    const offsets=await page.evaluate(()=>[...markers.getLayers(),window.gpsMarker].filter(Boolean).map(marker=>{const el=marker.getElement();if(!el)return null;const rect=el.getBoundingClientRect(),bounds=map.getContainer().getBoundingClientRect(),point=map.latLngToContainerPoint(marker.getLatLng()),anchor=marker.options.icon.options.iconAnchor;return {name:marker.options.title||'GPS',isGps:marker===window.gpsMarker,dx:rect.left+anchor[0]-bounds.left-point.x,dy:rect.top+anchor[1]-bounds.top-point.y};}).filter(Boolean));
    assert.ok(offsets.some(o=>o.isGps),stage+' keeps the GPS marker');
    if(requireVenues)assert.ok(offsets.filter(o=>!o.isGps).length>=2,stage+' starts with both venue fixtures');
    for(const o of offsets)assert.ok(Math.abs(o.dx)<1.1&&Math.abs(o.dy)<1.1,stage+' '+JSON.stringify(o));
   }
   await verifyAnchors('GPS',{requireVenues:true});
   await page.locator('#map-fullscreen').click();await verifyAnchors('fullscreen',{requireVenues:true});
   const box=await page.locator('#map').boundingBox();await page.mouse.move(box.width*.7,box.height*.65);await page.mouse.down();
   for(let i=1;i<=4;i++){await page.mouse.move(box.width*.7-i*22,box.height*.65-i*12);await verifyAnchors('during drag '+i);}await page.mouse.up();await page.waitForTimeout(350);await verifyAnchors('after drag');
   await page.evaluate(()=>map.panBy([-70,35],{animate:true,duration:.3}));await page.waitForTimeout(450);await verifyAnchors('animated pan');
   /* Viewport search intentionally regenerates venues after zoom. A venue may leave
    * the visible bounds; marker anchoring must remain correct for every marker that
    * is still rendered, while GPS remains present independently. */
   for(const zoom of [15,13,16]){await page.evaluate(z=>map.setZoom(z,{animate:true}),zoom);await page.waitForTimeout(450);await verifyAnchors('zoom '+zoom);}
   await page.setViewportSize({width:851,height:393});await page.waitForTimeout(300);await verifyAnchors('landscape resize');
   await page.locator('#fs-back').click();await page.setViewportSize({width:393,height:851});await page.waitForTimeout(300);await verifyAnchors('normal map');
   await page.locator('#settings-open').click();await until(page,()=>document.getElementById('pizzascan-language-select'));
   await Promise.all([page.waitForEvent('load'),page.locator('#pizzascan-language-select').selectOption('it')]);await until(page,()=>PizzaScan.ready&&document.documentElement.lang==='it');
   assert.equal(await page.locator('#map-view h1').innerText(),expected.it,'actual settings language switch');
   await page.reload();await until(page,()=>PizzaScan.ready);assert.equal(await page.evaluate(()=>PizzaI18n.language),'it','language survives restart');
  }
  assert.deepEqual(errors,[],language+' page errors');await ctx.close();
 }
 console.log('PASS viewport-aware venue/GPS anchors during drag, pan, zoom, fullscreen and resize; five languages and persistent language switch');
 }finally{await browser.close();s.close();}})().catch(e=>{console.error(e);process.exit(1)});
