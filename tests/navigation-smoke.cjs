const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {version}=require('../package.json');
const {server,until,mapFixtures}=require('./helpers.cjs');
(async()=>{
 fs.mkdirSync('test-results',{recursive:true});const {server:s,url}=await server(),browser=await chromium.launch();
 try{for(const lang of ['de','en','it','es','fr']){
  const ctx=await browser.newContext({viewport:{width:393,height:851}}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await mapFixtures(page);
  await ctx.addInitScript(language=>{localStorage.setItem('pizzascan-language-v1',language);window.openedReviewPortals=[];window.PizzaScanNative={postMessage(raw){const p=JSON.parse(raw);if(p.type==='open')window.openedReviewPortals.push(p.url);setTimeout(()=>window.PizzaScanBridge?.reply({id:p.id,value:p.type==='modelStats'?{models:[],bytes:0}:'ok'}),0);}};},lang);await page.route('https://places.googleapis.com/**',async route=>{const req=route.request(),body=JSON.parse(req.postData()||'{}'),center=body.locationBias?.circle?.center||{latitude:0,longitude:0},name=String(body.textQuery||'PizzaScan Test').split(',')[0];await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({places:[{id:'mock-google-place',displayName:{text:name},formattedAddress:String(body.textQuery||name),location:center,rating:4.8,userRatingCount:321,reviews:[],googleMapsUri:'https://www.google.com/maps'}]})});});
  try{
   await page.goto(url);await until(page,()=>window.PizzaScan?.ready);assert.equal(await page.evaluate(()=>Boolean(globalThis.GoogleReviewsUI)),true);assert.equal(await page.locator('link[href="google-reviews.css"]').count(),1);const csp=await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');assert.match(csp,/https:\/\/places\.googleapis\.com/);await page.locator('#welcome-start').click();await until(page,()=>places.length>0&&!mapLoading&&!PizzaRatingsUI.loading);
   assert.equal(await page.evaluate(()=>PizzaScan.version),version);assert.equal(await page.locator('.brand small').innerText(),version);
   const defaults=await page.evaluate(()=>mapConfig());assert.equal(defaults.radius,5,'Packaged app defaults to the restored 5 km restaurant discovery baseline');assert.equal(defaults.autoSearch,true,'Moving the map regenerates results like the original PizzaScan flow');assert.equal(defaults.onlyOpen,false);assert.equal(defaults.hideVisited,false);assert.equal(defaults.ratingsEnabled,true);assert.equal(defaults.minRating,0);assert.equal(defaults.includeUnrated,false);assert.equal(defaults.includeItalian,true);assert.equal(defaults.includeUnconfirmed,true);assert.deepEqual(defaults.types.sort(),['cafe','fast_food','food_truck','other','pizzeria','vending_pizza']);
   assert.equal(await page.locator('#rating-filter-open').isVisible(),true);assert.equal(await page.locator('.app-footer a').count(),2);
   assert.deepEqual(await page.locator('.app-footer a').evaluateAll(links=>links.map(a=>a.href)),['https://kosch.cloud/','https://pizzascan.on.websim.com/']);
   const height=await page.locator('.app-bottom-bar').evaluate(e=>e.getBoundingClientRect().height);assert.ok(height<=76,'Compact bottom navigation: '+height);
   if(lang==='de')await page.screenshot({path:'test-results/navigation-current-de.png'});
   await page.locator('#nav-photo').click();assert.equal(await page.locator('#nav-photo').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#photo-view').isVisible(),true);
   await page.locator('#nav-map').click();assert.equal(await page.locator('#nav-map').getAttribute('aria-pressed'),'true');
   await page.locator('#rating-filter-open').click();assert.equal(await page.locator('#filter-min-rating').isVisible(),true);assert.equal(await page.locator('#filter-min-rating').getAttribute('step'),'0.1');
   await page.locator('#filter-min-rating').focus();await page.locator('#filter-min-rating').press('Home');for(let i=0;i<46;i++)await page.locator('#filter-min-rating').press('ArrowRight');
   if(lang==='de')await page.screenshot({path:'test-results/rating-shortcut-current-de.png'});
   await page.locator('#rating-apply').click();assert.equal(await page.evaluate(()=>mapConfig().minRating),4.6);assert.equal(await page.locator('#rating-filter-open').getAttribute('aria-pressed'),'true');
   await page.reload();await until(page,()=>window.PizzaScan?.ready&&!mapLoading&&!PizzaRatingsUI.loading);assert.equal(await page.evaluate(()=>mapConfig().minRating),4.6);
   await page.locator('#rating-filter-open').click();await page.locator('#filter-min-rating').focus();await page.locator('#filter-min-rating').press('Home');await page.locator('#rating-apply').click();
   await page.evaluate(()=>localStorage.setItem('pizzascan-google-places-key-v1','AIzaSyPizzaScanMockKey123456789012345'));await page.locator('.venue-card [data-action=place]').first().click();
   assert.equal(await page.locator('.google-reviews-panel').count(),1);await page.locator('[data-google-action=load]').click();await page.locator('.google-rating').waitFor();assert.match(await page.locator('.google-rating').innerText(),/4\.8/);
   const portals=page.locator('#venue-ratings .rating-portals button');assert.equal(await portals.count(),3);
   for(let i=0;i<3;i++)await portals.nth(i).click();
   await until(page,()=>openedReviewPortals.length===3);assert.deepEqual(await page.evaluate(()=>openedReviewPortals.map(u=>new URL(u).hostname)),['www.google.com','www.tripadvisor.com','www.yelp.com']);
   if(lang==='de')await page.screenshot({path:'test-results/review-portals-current-de.png'});
   await page.locator('#sheet-close').click();await page.locator('#settings-open').click();assert.equal(await page.locator('#filter-min-rating').count(),1);assert.equal(await page.locator('#google-reviews-settings').count(),1);await page.locator('#settings-save').click();await page.evaluate(()=>showPrivacy());await page.locator('.google-reviews-privacy').waitFor();assert.equal(await page.locator('.google-reviews-privacy').count(),1);await page.locator('#sheet-close').click();
   await page.setViewportSize({width:320,height:640});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   assert.ok(await page.locator('.app-bottom-bar').evaluate(e=>e.getBoundingClientRect().height<=76));
   await page.locator('#nav-photo').click();await page.locator('#history').scrollIntoViewIfNeeded();
   assert.equal(await page.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('main')).paddingBottom)>=document.querySelector('.app-bottom-bar').getBoundingClientRect().height),true);
   if(lang==='de'){await page.evaluate(()=>{settings.dark=true;saveSettings();});await page.screenshot({path:'test-results/navigation-current-dark-320.png'});}
   assert.deepEqual(errors,[]);
  }catch(e){await page.screenshot({path:'test-results/navigation-failure-'+lang+'.png'});console.error('UI errors:',errors);throw e;}finally{await ctx.close();}
 }
 console.log(`PASS ${version} packaged UI: 5 km broad restaurant results plus additive PizzaScan discovery, automatic map regeneration, zero rating threshold, saved 4.6 slider, three Android portal links, active mocked Google Reviews fetch/privacy, compact navigation, five languages`);
 }finally{await browser.close();s.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
