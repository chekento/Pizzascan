const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {server,until}=require('./helpers.cjs');

(async()=>{
 const {server:s,url}=await server();
 const browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:393,height:851}});
 const tile=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z1SIAAAAASUVORK5CYII=','base64');
 await page.route('**/tile.openstreetmap.org/**',r=>r.fulfill({contentType:'image/png',body:tile}));
 try{
  await page.goto(url);
  await until(page,()=>PizzaScan.ready&&!!globalThis.PizzaMapNetwork);
  const result=await page.evaluate(async()=>{
   const calls=[];let attempts=0;
   placeService.fetcher=async (requestUrl,options)=>{
    calls.push({url:requestUrl,method:options.method,credentials:options.credentials,referrerPolicy:options.referrerPolicy,redirect:options.redirect,cache:options.cache,accept:options.headers?.Accept});
    attempts++;
    if(attempts===1)throw new TypeError('simulated transport failure');
    return {ok:true,status:200,url:requestUrl,redirected:false,headers:{get:name=>name==='content-type'?'application/json':name==='content-length'?'60':''},json:async()=>({elements:[]})};
   };
   const blocked=[];
   for(const bad of ['http://overpass-api.de/api/interpreter','https://example.invalid/api']){
    try{await placeService.json(bad,{},null,1000);blocked.push(false);}catch{blocked.push(true);}
   }
   const payload=await placeService.json('https://overpass-api.de/api/interpreter',{method:'POST',body:'data=test'},null,3000);
   return {blocked,calls,payload,hosts:PizzaMapNetwork.trustedHosts,health:PizzaMapNetwork.health(),safe:PizzaMapNetwork.safeUrl('https://photon.komoot.io/api/')};
  });
  assert.deepEqual(result.blocked,[true,true],'HTTP and untrusted map hosts must be blocked');
  assert.equal(result.calls.length,2,'Transient transport failure must receive exactly one bounded retry');
  assert.deepEqual(result.payload,{elements:[]});
  for(const call of result.calls){
   assert.equal(call.url,'https://overpass-api.de/api/interpreter');
   assert.equal(call.method,'POST');
   assert.equal(call.credentials,'omit');
   assert.equal(call.referrerPolicy,'no-referrer');
   assert.equal(call.redirect,'error');
   assert.equal(call.cache,'no-store');
   assert.equal(call.accept,'application/json');
  }
  assert.ok(result.hosts.includes('overpass-api.de')&&result.hosts.includes('overpass.private.coffee')&&result.hosts.includes('photon.komoot.io'));
  assert.equal(result.safe,'https://photon.komoot.io/api/');

  const root=path.join(__dirname,'..');
  const manifest=fs.readFileSync(path.join(root,'app/src/main/AndroidManifest.xml'),'utf8');
  assert.match(manifest,/android:usesCleartextTraffic="false"/,'Android must reject cleartext traffic');
  const proxy=fs.readFileSync(path.join(root,'web/geocoder-proxy.js'),'utf8');
  assert.match(proxy,/credentials:'omit'/);assert.match(proxy,/referrerPolicy:'no-referrer'/);assert.match(proxy,/redirect:'error'/);assert.match(proxy,/nominatim\.openstreetmap\.org/);
  console.log('PASS secure map network: HTTPS allowlist, no credentials/referrer, redirect blocking, bounded transport retry, Android cleartext block');
 }finally{await browser.close();s.close();}
})().catch(error=>{console.error(error);process.exit(1);});
