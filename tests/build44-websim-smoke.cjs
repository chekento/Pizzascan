const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {server,until,mapFixtures}=require('./helpers.cjs');

(async()=>{
 const {server:s,url}=await server();
 const browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:393,height:851}});
 await mapFixtures(page);
 let fastQueries=0,enrichQueries=0,slowReleased=false;
 const first=[
  {type:'node',id:44001,lat:53.5512,lon:9.9938,tags:{name:'Zum Markt',amenity:'restaurant',cuisine:'german',opening_hours:'24/7'}},
  {type:'node',id:44002,lat:53.5515,lon:9.9941,tags:{name:'The Lantern',amenity:'bar',cuisine:'pizza;italian',opening_hours:'24/7'}}
 ];
 const late=[{type:'node',id:44003,lat:53.5522,lon:9.995,tags:{name:'Trattoria Verde',amenity:'restaurant',cuisine:'italian',opening_hours:'24/7'}}];
 const enriched=[{type:'node',id:44004,lat:53.5528,lon:9.996,tags:{name:'Forno 44',amenity:'restaurant',product:'pizza',opening_hours:'24/7'}}];

 const handler=(kind,delay,elements)=>async route=>{
   const query=new URLSearchParams(route.request().postData()||'').get('data')||'';
   if(query.includes('pizzascan-build44-evidence-enrich')){
     enrichQueries++;
     if(kind==='primary')return route.fulfill({json:{elements:enriched}});
     return route.fulfill({json:{elements:[]}});
   }
   if(query.includes('pizzascan-build44-websim-fast')){
     fastQueries++;
     if(delay)await new Promise(r=>setTimeout(r,delay));
     if(kind==='slow')slowReleased=true;
     return route.fulfill({json:{elements}});
   }
   return route.fulfill({json:{elements:[]}});
 };
 await page.route('**/overpass-api.de/**',handler('empty',0,[]));
 await page.route('**/overpass.private.coffee/**',handler('primary',180,first));
 await page.route('**/overpass.osm.jp/**',handler('slow',1350,late));

 try{
   await page.goto(url);
   await until(page,()=>window.PizzaScan?.ready);
   if(await page.locator('#welcome').evaluate(el=>el.open))await page.locator('#welcome-start').click();

   await until(page,()=>places.some(p=>p.name==='The Lantern')&&!mapLoading,12000);
   const early=await page.evaluate(()=>({
     names:places.map(p=>p.name),
     build:window.PizzaScanDiscovery44,
     version:window.PizzaScan.version,
     toolbar:!!document.querySelector('#build40-tools[data-build44="true"]'),
     heights:[...document.querySelectorAll('#build40-tools .build44-mini-tool')].map(x=>x.getBoundingClientRect().height),
     refresh:document.getElementById('map-refresh').textContent.trim(),
     cacheNote:!!document.getElementById('cache-mode-note')
   }));
   assert.equal(early.version,'2.3.9');
   assert.equal(early.build.build,44);
   assert.equal(early.build.originalSelectorParity,true);
   assert.equal(early.build.firstNonEmptyProvider,true);
   assert.ok(early.names.includes('The Lantern'));
   assert.equal(early.names.includes('Zum Markt'),false,'generic restaurants must remain excluded');
   assert.equal(slowReleased,false,'slow mirror must not block first visible markers');
   assert.equal(early.toolbar,true);
   assert.ok(early.heights.length===2&&early.heights.every(h=>h<=36),'toolbar buttons stay compact on a 393px phone');
   assert.equal(early.refresh,'Hier suchen');
   assert.equal(early.cacheNote,false,'bulky Build 40 cache paragraph is removed from the main map');

   await until(page,()=>places.some(p=>p.name==='Trattoria Verde'),7000);
   await until(page,()=>places.some(p=>p.name==='Forno 44'),7000);
   const after=await page.evaluate(()=>places.map(p=>p.name));
   assert.ok(after.includes('The Lantern')&&after.includes('Trattoria Verde')&&after.includes('Forno 44'));
   assert.ok(fastQueries>=3,'all three fast mirrors are queried progressively');
   assert.ok(enrichQueries>=1,'background enrichment starts after first paint');

   const before=fastQueries;
   await page.locator('#map-refresh').click();
   await until(page,()=>fastQueries>before,5000);
   assert.equal(page.url().startsWith(url),true);
   console.log('PASS Build 44 WebSim-first search: first non-empty mirror, progressive union, background enrichment and compact toolbar');
 }finally{await browser.close();s.close();}
})().catch(error=>{console.error(error);process.exit(1);});
