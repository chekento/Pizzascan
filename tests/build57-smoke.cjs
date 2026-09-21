const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {server,until,mapFixtures}=require('./helpers.cjs');

(async()=>{
 const {server:s,url}=await server(),browser=await chromium.launch();
 const context=await browser.newContext({viewport:{width:393,height:851},permissions:['geolocation']});
 const page=await context.newPage(),mapRequests=[];
 page.on('request',request=>{if(request.url().startsWith('https://overpass-api.de/'))mapRequests.push(request);});
 await context.addInitScript(()=>{
  localStorage.setItem('pizzascan-language-v1','en');
  window.PizzaScanNative={postMessage(raw){const message=JSON.parse(raw);setTimeout(()=>window.PizzaScanBridge?.reply({id:message.id,value:'ok'}),0);}};
 });
 await mapFixtures(page);
 try{
  await page.goto(url);await until(page,()=>PizzaScan.ready);await page.locator('#welcome-start').click();
  await until(page,()=>places.length===2&&!mapLoading&&!PizzaRatingsUI.loading);
  const placeId=await page.locator('.venue-card [data-action=place]').first().getAttribute('data-id');
  await page.locator(`.venue-card [data-action=place][data-id="${placeId}"]`).click();
  await until(page,()=>document.querySelector('#visit-rating'));
  await page.locator('#visit-rating').fill('8.4');
  assert.equal(await page.evaluate(id=>PizzaPersonalRatings.get(placeById(id)),placeId),8.4);
  await page.locator('[data-action=visit-review]').click();
  await until(page,()=>document.querySelector('#review-rating'));
  assert.equal(await page.locator('#review-rating').inputValue(),'8.4');
  assert.equal(await page.locator('#review-notes').getAttribute('placeholder'),'What else would you like to share?');
  await page.locator('#review-rating').fill('9.1');
  assert.equal(await page.evaluate(id=>PizzaPersonalRatings.get(placeById(id)),placeId),9.1);
  await page.locator('#sheet-close').click();
  await page.locator(`.venue-card [data-action=place][data-id="${placeId}"]`).click();
  await until(page,()=>document.querySelector('#visit-rating'));
  assert.equal(await page.locator('#visit-rating').inputValue(),'9.1');
  await page.locator('#sheet-close').click();
  await page.evaluate(()=>markers.getLayers()[0].openPopup());
  await until(page,()=>document.querySelector('.venue-popup-score'));
  assert.match(await page.locator('.venue-popup-score').innerText(),/9\.1/);

  await context.setGeolocation({latitude:40.7128,longitude:-74.006});
  await page.locator('#gps').click();
  const isNewYorkRequest=request=>{const body=request.postData()||'';return /40\.6\d+,-74\.0\d+,40\.7\d+,-73\.9\d+/.test(body)||/40\.6\d+%2C-74\.0\d+%2C40\.7\d+%2C-73\.9\d+/.test(body);};
  const gpsDeadline=Date.now()+10000;while(!mapRequests.some(isNewYorkRequest)&&Date.now()<gpsDeadline)await new Promise(resolve=>setTimeout(resolve,100));
  assert.ok(mapRequests.some(isNewYorkRequest),'GPS centering must trigger an Overpass request for the new viewport');
  const gps=await page.evaluate(()=>({lat:map.getCenter().lat,lng:map.getCenter().lng}));
  assert.ok(Math.abs(gps.lat-40.7128)<0.05&&Math.abs(gps.lng+74.006)<0.05,`GPS center did not move to the requested location: ${JSON.stringify(gps)}`);

  await page.locator('#settings-open').click();
  const settings=await page.locator('#sheet-body').innerText();
  assert.doesNotMatch(settings,/DATEN & BACKUP|Freiwilliges Veröffentlichen|Besuchte Orte stammen/);
  console.log('PASS Build 57 shared visit/review/popup score, GPS viewport scan and English late-runtime localization');
 }finally{await browser.close();s.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
