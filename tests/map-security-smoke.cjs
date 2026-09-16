const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {server,until}=require('./helpers.cjs');

(async()=>{
 const {server:s,url}=await server();
 const browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:393,height:851}});
 const tile=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z1SIAAAAASUVORK5CYII=','base64');
 await page.route('**/tile.openstreetmap.org/**',r=>r.fulfill({contentType:'image/png',body:tile}));
 /* Build 38 deliberately queries every trusted Overpass mirror in parallel. Give
    the startup search a deterministic result before testing the transport in
    isolation, otherwise background provider calls pollute the retry counter. */
 await page.route(/(?:overpass-api\.de|overpass\.private\.coffee|overpass\.osm\.jp|maps\.mail\.ru).*interpreter/,r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({elements:[{type:'node',id:990001,lat:53.6735,lon:10.2377,tags:{name:'Security Test Pizza',amenity:'restaurant',cuisine:'pizza'}}]})}));
 try{
  await page.goto(url);
  await until(page,()=>PizzaScan.ready&&!!globalThis.PizzaMapNetwork&&!PizzaScan.diagnostics().mapLoading,30000);
  /* runtime-finalize.js may intentionally schedule one complete all-provider pass
     after the first idle frame. Wait until that finalizer has completed before
     replacing placeService.fetcher, otherwise those legitimate background calls
     are incorrectly counted as retries of the isolated request below. */
  await until(page,()=>globalThis.PizzaBuild38Runtime?.installed===true&&!PizzaScan.diagnostics().mapLoading,80000);
  const result=await page.evaluate(async()=>{
   const calls=[];
   placeService.fetcher=async (requestUrl,options)=>{
    calls.push({url:requestUrl,method:options.method,credentials:options.credentials,referrerPolicy:options.referrerPolicy,redirect:options.redirect,cache:options.cache,accept:options.headers?.Accept});
    if(requestUrl.includes('photon.komoot.io')&&calls.filter(x=>x.url.includes('photon.komoot.io')).length===1)throw new TypeError('simulated Photon transport failure');
    if(requestUrl.includes('overpass-api.de'))throw new TypeError('simulated Overpass transport failure');
    return {ok:true,status:200,url:requestUrl,redirected:false,headers:{get:name=>name==='content-type'?'application/json':name==='content-length'?'60':''},json:async()=>({elements:[]})};
   };
   const blocked=[];
   for(const bad of ['http://overpass-api.de/api/interpreter','https://example.invalid/api']){
    try{await placeService.json(bad,{},null,1000);blocked.push(false);}catch{blocked.push(true);}
   }
   let overpassFailed=false;
   try{await placeService.json('https://overpass-api.de/api/interpreter',{method:'POST',body:'data=test'},null,3000);}catch{overpassFailed=true;}
   const photonPayload=await placeService.json('https://photon.komoot.io/api/',{},null,3000);
   return {blocked,calls,overpassFailed,photonPayload,hosts:PizzaMapNetwork.trustedHosts,health:PizzaMapNetwork.health(),safe:PizzaMapNetwork.safeUrl('https://photon.komoot.io/api/')};
  });
  assert.deepEqual(result.blocked,[true,true],'HTTP and untrusted map hosts must be blocked');
  assert.equal(result.overpassFailed,true,'A failed Overpass host must return control immediately so provider failover can continue');
  assert.equal(result.calls.filter(x=>x.url==='https://overpass-api.de/api/interpreter').length,1,'Overpass must not waste time retrying the same failed provider');
  assert.equal(result.calls.filter(x=>x.url==='https://photon.komoot.io/api/').length,2,'Photon transport failure receives exactly one bounded retry');
  assert.deepEqual(result.photonPayload,{elements:[]});
  for(const call of result.calls){
   assert.equal(call.credentials,'omit');
   assert.equal(call.referrerPolicy,'no-referrer');
   assert.equal(call.redirect,'error');
   assert.equal(call.cache,'no-store');
   assert.equal(call.accept,'application/json');
  }
  for(const host of ['overpass-api.de','overpass.private.coffee','overpass.osm.jp','maps.mail.ru','photon.komoot.io'])assert.ok(result.hosts.includes(host),host+' must be explicitly trusted');
  assert.equal(result.safe,'https://photon.komoot.io/api/');

  const root=path.join(__dirname,'..');
  const manifest=fs.readFileSync(path.join(root,'app/src/main/AndroidManifest.xml'),'utf8');
  assert.match(manifest,/android:usesCleartextTraffic="false"/,'Android must reject cleartext traffic');
  const proxy=fs.readFileSync(path.join(root,'web/geocoder-proxy.js'),'utf8');
  assert.match(proxy,/credentials:'omit'/);assert.match(proxy,/referrerPolicy:'no-referrer'/);assert.match(proxy,/redirect:'error'/);assert.match(proxy,/nominatim\.openstreetmap\.org/);
  console.log('PASS secure map network: HTTPS allowlist, immediate Overpass failover, bounded Photon retry, no credentials/referrer, redirect blocking, Android cleartext block');
 }finally{await browser.close();s.close();}
})().catch(error=>{console.error(error);process.exit(1);});