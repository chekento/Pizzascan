const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {server,until,mapFixtures}=require('./helpers.cjs');
const elements=[
  {type:'node',id:101,lat:53.5511,lon:9.9937,tags:{name:'Pizza Below',cuisine:'pizza',opening_hours:'24/7'}},
  {type:'node',id:102,lat:53.552,lon:9.995,tags:{name:'Pizza Boundary',cuisine:'pizza',opening_hours:'24/7'}},
  {type:'node',id:103,lat:53.553,lon:9.997,tags:{name:'Pizza Above',cuisine:'pizza',opening_hours:'off'}},
  {type:'node',id:104,lat:53.554,lon:9.999,tags:{name:'Pizza Unrated',cuisine:'pizza',opening_hours:'24/7'}}
];
// Thirty raw elements keep this rating test above POI-recovery thresholds while only four have coordinates.
const providerElements=[...elements,...Array.from({length:26},(_,i)=>({type:'node',id:1900+i,tags:{name:'Non-geocoded rating guard '+i,amenity:i%3===0?'restaurant':i%3===1?'cafe':'fast_food'}}))];
function data(){return {reviews:[...elements.slice(0,3).map((p,i)=>({signature:String(p.id).padStart(30,'a'),kid:'reviewer-'+p.id,payload:{sub:`geo:${p.lat},${p.lon}?q=${encodeURIComponent(p.tags.name)}&u=10`,rating:[87,90,95][i],iat:Math.floor(Date.now()/1000)-3600,opinion:'UNTRUSTED REVIEW TEXT <img src=x onerror=alert(1)>',metadata:{osm_id:`node/${p.id}/2`}}})),{signature:'wrongbranch'.padStart(30,'a'),kid:'reviewer-wrong',payload:{sub:'geo:53.554,9.999?q=Pizza%20Unrated&u=10',rating:100,iat:Math.floor(Date.now()/1000)-3600,metadata:{osm_id:'node/999'}}}]};}
const ids=page=>page.evaluate(()=>visiblePlaces().map(p=>p.placeId).sort());
async function threshold(page,value){const slider=page.locator('#filter-min-rating');await slider.focus();await slider.press('Home');for(let i=0;i<Math.round(value*10);i++)await slider.press('ArrowRight');}
async function setup(browser,url,language='de',failure=false){
  const ctx=await browser.newContext({viewport:{width:393,height:851}});
  await ctx.addInitScript(code=>{if(!localStorage.getItem('pizzascan-language-v1'))localStorage.setItem('pizzascan-language-v1',code);},language);
  const page=await ctx.newPage(),errors=[],requests=[];let calls=0;
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().startsWith('https://'))requests.push(r.url());});
  await mapFixtures(page);await page.route(/https:\/\/(overpass-api\.de|overpass\.private\.coffee|overpass\.osm\.jp|maps\.mail\.ru)\//,r=>r.fulfill({json:{elements:providerElements}}));
  await page.route('**/api.mangrove.reviews/**',r=>{calls++;return failure?r.fulfill({status:503,json:{error:'Unavailable'}}):r.fulfill({json:data()});});
  await page.goto(url);await until(page,()=>PizzaScan.ready);await page.locator('#welcome-start').click();
  await until(page,()=>places.length===4&&!mapLoading&&!PizzaRatingsUI.loading);
  return {page,ctx,errors,requests,get calls(){return calls;}};
}
(async()=>{
  fs.mkdirSync('test-results',{recursive:true});const {server:s,url}=await server(),browser=await chromium.launch();
  try{
    for(const language of ['de','en','it','es','fr']){
      const fixture=await setup(browser,url,language),{page,ctx,errors,requests}=fixture;
      try{
        assert.equal(await page.locator('.venue-card .venue-rating[data-rating="9.0"]').count(),1);
        assert.equal(await page.locator('.venue-card .venue-rating[data-rating=""]').count(),1,'Unknown is not shown as a star score');
        assert.equal(await page.locator('#places img').count(),0,'Remote review markup is not rendered');
        await page.locator('#settings-open').click();
        const label=await page.locator('label[for=filter-min-rating]').innerText();
        assert.equal(label,{de:'Mindestbewertung',en:'Minimum rating',it:'Valutazione minima',es:'Valoración mínima',fr:'Note minimale'}[language]);
        assert.equal(await page.locator('#filter-min-rating').getAttribute('step'),'0.1');await threshold(page,9.0);
        const expected=language==='en'?'9.0':'9,0';assert.ok((await page.locator('#rating-threshold').innerText()).includes(expected));
        await page.locator('.rating-filter').scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/ratings-settings-${language}.png`});
await page.locator('#settings-save').click();const firstIds=await ids(page);assert.deepEqual(firstIds,['node-102','node-103','node-104'],JSON.stringify(await page.evaluate(()=>({cfg:mapConfig(),ratings:places.map(p=>({id:p.placeId,summary:PizzaRatingsUI.summary(p)}))}))));
        assert.equal(await page.evaluate(()=>markers.getLayers().length),3);
        const before=fixture.calls;await page.reload();await until(page,()=>PizzaScan.ready&&places.length===4&&!mapLoading&&!PizzaRatingsUI.loading);
        assert.deepEqual(await ids(page),['node-102','node-103','node-104']);assert.equal(fixture.calls,before,'Fresh persisted ratings do not reload');
        assert.equal(await page.evaluate(()=>mapConfig().minRating),9.0);
        await page.locator('#map-fullscreen').click();assert.ok((await page.locator('#fs-rating-filter').innerText()).includes(expected));
        await page.setViewportSize({width:851,height:393});await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
        await page.locator('#fs-back').click();await page.setViewportSize({width:393,height:851});
        await page.locator('.venue-card [data-action=place][data-id=node-102]').click();
        assert.equal(await page.locator('#venue-ratings [data-action=venue-link]').count(),4);
        assert.equal(await page.locator('#venue-ratings a[href="https://creativecommons.org/licenses/by/4.0/"]').count(),1);
        assert.ok((await page.locator('#venue-ratings').innerText()).includes('Mangrove'));
        assert.ok(!(await page.locator('#venue-ratings').innerText()).includes('UNTRUSTED'));
        await page.screenshot({path:`test-results/ratings-details-${language}.png`});await page.locator('#sheet-close').click();
        await page.locator('#settings-open').click();await page.locator('details').filter({has:page.locator('#privacy-open')}).locator('summary').click();await page.locator('#privacy-open').click();
        await until(page,()=>sheetKind==='privacy');assert.ok((await page.locator('#sheet-body').innerText()).includes('api.mangrove.reviews'),'New privacy information in every language');await page.locator('#privacy-close').click();
        if(language==='de'){
          await page.locator('#settings-open').click();await page.locator('#filter-unrated').check();await page.locator('#settings-save').click();
          assert.deepEqual(await ids(page),['node-102','node-103','node-104']);
          await page.locator('#open-filter').click();assert.deepEqual(await ids(page),['node-102','node-104'],'Opening and rating filters compose');
          await page.locator('#open-filter').click();
          await page.locator('#settings-open').click();await page.locator('#ratings-enabled').uncheck();await page.locator('#settings-save').click();
          assert.deepEqual(await ids(page),['node-101','node-102','node-103','node-104']);assert.equal(await page.locator('.venue-card .venue-rating').count(),0);
          const disabledCalls=fixture.calls;await page.locator('#map-refresh').click();await until(page,()=>!mapLoading);assert.equal(fixture.calls,disabledCalls,'No review network requests when disabled');
          await page.locator('#settings-open').click();await page.locator('#ratings-enabled').check();await page.locator('#filter-unrated').uncheck();await threshold(page,10);await page.locator('#filter-unrated').uncheck();await page.locator('#settings-save').click();assert.deepEqual(await ids(page),[]);assert.equal(await page.evaluate(()=>markers.getLayers().length),0);await page.locator('#places [data-action=clear-rating-filter]').click();assert.equal((await ids(page)).length,4);
          await page.locator('#settings-open').click();await threshold(page,9.0);await page.locator('#settings-save').click();
          await page.locator('.venue-card [data-action=save][data-id=node-102]').click();await page.locator('#saved-toggle').click();assert.deepEqual(await ids(page),['node-102']);await page.locator('#saved-toggle').click();
          await page.route('**/api.mangrove.reviews/**',r=>r.fulfill({status:503,json:{error:'Offline'}}));
          await page.locator('.venue-card [data-action=place][data-id=node-102]').click();await page.locator('#venue-ratings [data-action=refresh-ratings]').click();
          await until(page,()=>!PizzaRatingsUI.loading&&PizzaRatingsUI.errors.length>0);assert.equal(await page.locator('#venue-ratings .venue-rating[data-rating="9.0"]').count(),1);
          assert.ok((await page.locator('#venue-ratings').innerText()).includes('Datenstand:'));
          await page.locator('#sheet-close').click();await page.locator('#settings-open').click();await page.locator('#dark-mode').check();
          await page.locator('.rating-filter').scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/ratings-settings-dark.png'});
          assert.equal(await page.locator('.rating-filter').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(35, 41, 35)');
          await page.setViewportSize({width:320,height:720});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
        }
        assert.deepEqual(errors,[]);assert.ok(!requests.some(u=>/googleapis\.com|api\.yelp|tripadvisor\.com\/api/.test(u)));
      }catch(e){await page.screenshot({path:`test-results/ratings-failure-${language}.png`}).catch(()=>{});throw e;}finally{await ctx.close();}
    }
    const unavailable=await setup(browser,url,'de',true);assert.equal(await unavailable.page.locator('.venue-card .venue-rating[data-rating=""]').count(),4);
    await unavailable.page.locator('#settings-open').click();await unavailable.page.locator('#filter-unrated').uncheck();await threshold(unavailable.page,9.0);await unavailable.page.locator('#settings-save').click();
    assert.deepEqual(await ids(unavailable.page),[]);assert.ok((await unavailable.page.locator('#ratings-status').innerText()).includes('Nicht alle Bewertungen'));await unavailable.ctx.close();
    console.log('PASS rating boundaries, unknown places, saved/open filters, persistence, source opt-out, source attribution, failure handling, five languages, privacy and mobile layouts');
  }finally{await browser.close();s.close();}
})().catch(e=>{console.error(e);process.exit(1)});
