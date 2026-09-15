const {test}=require('node:test');
const assert=require('node:assert/strict');
const N=require('../web/native-overpass.js');

test('native Overpass transport uses only the fixed HTTPS allowlist',()=>{
 for(const endpoint of N.ENDPOINTS)assert.equal(N.allowed(endpoint),true);
 assert.equal(N.allowed('http://overpass-api.de/api/interpreter'),false);
 assert.equal(N.allowed('https://example.com/api/interpreter'),false);
 assert.ok(N.NATIVE_TIMEOUT>=10000&&N.NATIVE_TIMEOUT<15000);
 assert.ok(N.DIRECT_FALLBACK_TIMEOUT>=20000);
});

test('native Overpass extracts only the Overpass POST query',()=>{
 const body=new URLSearchParams({data:'[out:json];node(1);out;'});
 assert.equal(N.queryFrom({body}),'[out:json];node(1);out;');
 assert.equal(N.queryFrom({body:'data=%5Bout%3Ajson%5D%3Bout%3B'}),'[out:json];out;');
 assert.equal(N.queryFrom({body:{data:'x'}}),'');
});

test('packaged Android uses native HTTPS before WebView Overpass',async()=>{
 let called=null,webCalls=0;
 const root={
  navigator:{userAgent:'Mozilla/5.0 PizzaScan/2.3.4 (+https://github.com/chekento/Pizzascan)'},
  PizzaScanNative:{},
  bridge:async(type,payload)=>{called={type,payload};return JSON.stringify({elements:[{type:'node',id:1,lat:53.67,lon:10.24,tags:{name:'Test Restaurant',amenity:'restaurant'}}]});},
  placeService:{json:async()=>{webCalls++;throw Error('WebView transport should not be primary');}}
 };
 assert.equal(N.install(root),true);
 const query='[out:json];nwr["amenity"="restaurant"](around:10000,53.67,10.24);out;';
 const result=await root.placeService.json(N.ENDPOINTS[0],{method:'POST',body:new URLSearchParams({data:query})},null,8000);
 assert.equal(webCalls,0);
 assert.equal(called.type,'overpass');
 assert.equal(called.payload.endpoint,N.ENDPOINTS[0]);
 assert.equal(called.payload.query,query);
 assert.equal(called.payload.timeout,N.NATIVE_TIMEOUT);
 assert.equal(result.elements.length,1);
});

test('packaged Android falls back to direct Overpass when native bridge fails',async()=>{
 let bridgeCalls=0,webCalls=0,seenTimeout=0;
 const root={
  navigator:{userAgent:'Mozilla/5.0 PizzaScan/2.3.4 (+https://github.com/chekento/Pizzascan)'},
  PizzaScanNative:{},
  bridge:async()=>{bridgeCalls++;throw Error('native provider failure');},
  placeService:{json:async(url,options,signal,timeout)=>{webCalls++;seenTimeout=timeout;return {elements:[{type:'node',id:1}]};}}
 };
 N.install(root);
 const query='[out:json];nwr["amenity"="restaurant"](around:10000,53.67,10.24);out;';
 const result=await root.placeService.json(N.ENDPOINTS[0],{method:'POST',body:new URLSearchParams({data:query})},null,8000);
 assert.equal(bridgeCalls,1);
 assert.equal(webCalls,1);
 assert.ok(seenTimeout>=N.DIRECT_FALLBACK_TIMEOUT);
 assert.equal(result.elements.length,1);
});

test('ordinary browser keeps the existing web transport',async()=>{
 let webCalls=0;
 const root={navigator:{userAgent:'Mozilla/5.0 Chrome'},PizzaScanNative:{},bridge:async()=>{throw Error('must not run');},placeService:{json:async()=>{webCalls++;return {elements:[1]};}}};
 N.install(root);
 const result=await root.placeService.json(N.ENDPOINTS[0],{method:'POST',body:new URLSearchParams({data:'x'})});
 assert.equal(webCalls,1);
 assert.deepEqual(result,{elements:[1]});
});
