const {chromium} = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root=path.resolve(__dirname,'../web');
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.woff':'font/woff'};
const server=http.createServer((req,res)=>{
  const name=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
  if(!name.startsWith(root+path.sep)||!fs.existsSync(name)||!fs.statSync(name).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',types[path.extname(name)]||'application/octet-stream');fs.createReadStream(name).pipe(res);
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  fs.mkdirSync('test-results',{recursive:true});
  const browser=await chromium.launch({headless:true});
  const ctx=await browser.newContext({viewport:{width:393,height:760},deviceScaleFactor:1});
  const page=await ctx.newPage(), errors=[], missing=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)missing.push(r.url());});
  const tile=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z1SIAAAAASUVORK5CYII=','base64');
  await page.route('**/tile.openstreetmap.org/**',r=>r.fulfill({contentType:'image/png',body:tile}));
  await page.route('**/nominatim.openstreetmap.org/**',r=>r.fulfill({json:[{lat:'53.5511',lon:'9.9937',display_name:'Hamburg'}]}));
  await page.route('**/overpass-api.de/**',r=>r.fulfill({json:{elements:[
    {type:'way',id:1,center:{lat:53.5511,lon:9.9937},tags:{name:'Fixture Pizza One',cuisine:'pizza',opening_hours:'24/7'}},
    {type:'node',id:2,lat:53.552,lon:9.998,tags:{name:'Pizza <img src=x onerror=alert(1)>',cuisine:'pizza',amenity:'fast_food'}},
    {type:'node',id:3,lat:53.55,lon:9.995,tags:{name:'Fixture Pizza Three',cuisine:'pizza'}}
  ]}}));
  page.on('dialog',d=>d.accept(d.type()==='prompt'?'Test crawl':undefined));
  try {
    await page.goto(base); await page.waitForFunction(()=>window.PizzaScan?.ready);
    await page.locator('#deny-location').click();
    await page.waitForFunction(()=>window.PizzaScan.diagnostics().places===3);
    await page.locator('#dock-menu').click(); await page.locator('#ai-search-button').click();
    assert.equal(await page.locator('#discovery-results .place-card').count(),3);
    assert.equal(await page.locator('#discovery-results img').count(),0,'Untrusted venue name must stay text');
    await page.locator('#discovery-results [data-action=save]').first().click();
    assert.equal(await page.evaluate(()=>PizzaScan.diagnostics().saved),1);
    await page.locator('#discovery-results [data-action=visit]').first().click();
    await page.locator('#discovery-results [data-action=rate]').first().click();
    await page.locator('#comment').fill('Smoke test rating'); await page.locator('#submit-rating').click();
    assert.equal(await page.evaluate(()=>PizzaScan.diagnostics().ratings),1);
    await page.reload();await page.waitForFunction(()=>window.PizzaScan?.ready);
    assert.deepEqual(await page.evaluate(()=>{const d=PizzaScan.diagnostics();return [d.saved,d.visited,d.ratings];}),[1,1,1]);
    await page.locator('#dock-menu').click();await page.locator('#ratings-database-button').click();
    assert.match(await page.locator('#ratings-table').innerText(),/Smoke test rating/);
    await page.evaluate(()=>PizzaScan.back());
    await page.locator('#dock-menu').click();await page.locator('#pizza-crawl-button').click();
    await page.locator('#generate-crawl').click();await page.locator('#save-crawl').click();
    await page.evaluate(()=>PizzaScan.back());await page.locator('#dock-menu').click();await page.locator('#saved-spots-button').click();
    assert.match(await page.locator('#saved-spots-list').innerText(),/Test crawl/);
    await page.evaluate(()=>PizzaScan.back());await page.locator('#dock-menu').click();await page.locator('#photo-analyzer-button').click();
    await page.locator('#photo-upload').setInputFiles({name:'pizza.png',mimeType:'image/png',buffer:tile});
    await page.waitForFunction(()=>document.getElementById('preview-image').src.startsWith('blob:'));
    assert.equal(await page.locator('#analyze-photo').isDisabled(),true);
    await page.evaluate(()=>PizzaScan.back());await page.locator('#dock-saved').click();
    const invalid=Buffer.from(JSON.stringify([{name:'Bad',lat:1000,lng:2}]));
    await page.locator('#import-json-input').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:invalid});
    await page.waitForFunction(()=>document.getElementById('map-message-area').textContent.includes('Import failed'));
    assert.equal(await page.evaluate(()=>PizzaScan.diagnostics().saved),1);
    const download=page.waitForEvent('download');await page.locator('#export-json-button').click();
    const file=await download;await file.saveAs('test-results/export.json');
    assert.equal(JSON.parse(fs.readFileSync('test-results/export.json','utf8')).length,1);
    await page.locator('#map-message-area').click();
    await page.screenshot({path:'test-results/saved-places-mobile.png'});
    await page.evaluate(()=>PizzaScan.back());await page.locator('#theme-toggle').click();
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('dark-mode')),true);
    await ctx.setOffline(true);await page.reload();
    // A browser HTTP reload needs network; restore transport and abort remote APIs only.
  } catch(e) {
    if(!String(e.message).includes('ERR_INTERNET_DISCONNECTED')) throw e;
  } finally {
    await ctx.setOffline(false);
    await page.unroute('**/overpass-api.de/**');await page.route('**/overpass-api.de/**',r=>r.abort());
    await page.goto(base);await page.waitForFunction(()=>window.PizzaScan?.ready);
    assert.equal(await page.evaluate(()=>PizzaScan.diagnostics().saved),1);
    await page.locator('#dock-saved').click();
    assert.match(await page.locator('#want-to-visit-list').innerText(),/Fixture Pizza One/);
    await page.setViewportSize({width:740,height:393});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Landscape must not overflow horizontally');
    await page.screenshot({path:'test-results/saved-places-landscape.png'});
    assert.deepEqual(errors,[],'No JavaScript runtime errors');assert.deepEqual(missing,[],'All packaged resources exist');
    await browser.close();server.close();
  }
  console.log('PASS: startup, source data, injection safety, save/visit/rate, restart persistence, crawl, photo preview, invalid import, export, theme, remote outage, landscape.');
})().catch(e=>{console.error(e);server.close();process.exit(1);});
