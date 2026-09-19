const {test}=require('node:test');
const assert=require('node:assert/strict');
const N=require('../web/native-overpass.js');

test('native Overpass transport uses only the fixed HTTPS allowlist',()=>{
 for(const endpoint of N.ENDPOINTS)assert.equal(N.allowed(endpoint),true);
 assert.equal(N.allowed('http://overpass-api.de/api/interpreter'),false);
 assert.equal(N.allowed('https://example.com/api/interpreter'),false);
 assert.ok(N.NATIVE_TIMEOUT>=60000&&N.NATIVE_TIMEOUT<=70000);
 assert.ok(N.DIRECT_FALLBACK_TIMEOUT>=60000);
});

test('native Overpass extracts only the Overpass POST query',()=>{
 const body=new URLSearchParams({data:'[out:json];node(1);out;'});
 assert.equal(N.queryFrom({body}),'[out:json];node(1);out;');
 assert.equal(N.queryFrom({body:'data=%5Bout%3Ajson%5D%3Bout%3B'}),'[out:json];out;');
 assert.equal(N.queryFrom({body:{data:'x'}}),'');
});

test('packaged Android uses the long raw native channel before WebView Overpass',async()=>{
 let posted=null,webCalls=0,bridgeCalls=0;
 const root={
  crypto:{randomUUID:()=> 'native-overpass-test'},
  navigator:{userAgent:'Mozilla/5.0 PizzaScan/2.3.15 (+https://github.com/chekento/Pizzascan)'},
  PizzaScanBridge:{reply(){throw Error('unhandled reply');}},
  PizzaScanNative:{postMessage(message){
   posted=JSON.parse(message);
   setImmediate(()=>root.PizzaScanBridge.reply({id:posted.id,value:JSON.stringify({elements:[{type:'node',id:1,lat:53.67,lon:10.24,tags:{name:'Test Restaurant',amenity:'restaurant'}}]})}));
  }},
  bridge:async()=>{bridgeCalls++;throw Error('short generic bridge must not run');},
  placeService:{json:async()=>{webCalls++;throw Error('WebView transport should not be primary');}}
 };
 assert.equal(N.install(root),true);
 const query='[out:json];nwr["amenity"="restaurant"](around:10000,53.67,10.24);out;';
 const result=await root.placeService.json(N.ENDPOINTS[0],{method:'POST',body:new URLSearchParams({data:query})},null,8000);
 assert.equal(webCalls,0);
 assert.equal(bridgeCalls,0);
 assert.equal(posted.type,'overpass');
 assert.equal(posted.endpoint,N.ENDPOINTS[0]);
 assert.equal(posted.query,query);
 assert.equal(posted.timeout,N.NATIVE_TIMEOUT);
 assert.equal(result.elements.length,1);
});

test('packaged Android retries the identical query natively on a trusted mirror before WebView fetch',async()=>{
 let webCalls=0;const posted=[];
 const root={
  crypto:{randomUUID:()=> 'native-overpass-'+(posted.length+1)},
  navigator:{userAgent:'Mozilla/5.0 PizzaScan/2.3.15 (+https://github.com/chekento/Pizzascan)'},
  PizzaScanBridge:{reply(){throw Error('unhandled reply');}},
  PizzaScanNative:{postMessage(message){
   const payload=JSON.parse(message);posted.push(payload);
   setImmediate(()=>{
    if(payload.endpoint===N.ENDPOINTS[0])root.PizzaScanBridge.reply({id:payload.id,error:'primary unavailable'});
    else root.PizzaScanBridge.reply({id:payload.id,value:JSON.stringify({elements:[{type:'node',id:2}]})});
   });
  }},
  placeService:{json:async()=>{webCalls++;throw Error('WebView CORS path must not run when a native mirror succeeds');}}
 };
 assert.equal(N.isAndroidNative(root),true,'raw native channel does not depend on the generic bridge function');
 N.install(root);
 const query='[out:json][timeout:60];node["cuisine"="pizza"](1,2,3,4);out body; >; out skel qt;';
 const result=await root.placeService.json(N.ENDPOINTS[0],{method:'POST',body:new URLSearchParams({data:query})},null,8000);
 assert.equal(webCalls,0);
 assert.equal(posted.length,2);
 assert.equal(posted[0].endpoint,N.ENDPOINTS[0]);
 assert.equal(posted[1].endpoint,N.ENDPOINTS[1]);
 assert.equal(posted[0].query,query);
 assert.equal(posted[1].query,query,'mirror transport must not alter the WebSim query');
 assert.equal(result.elements[0].id,2);
 assert.equal(root.PizzaScanNativeOverpass.mirrorFailover,true);
 assert.equal(root.PizzaScanNativeOverpass.lastEndpoint,N.ENDPOINTS[1]);
});

test('installer patches the live global placeService instance after hotfix-map shadows the prototype',()=>{
 const previous=globalThis.placeService;
 const service={json:async()=>({elements:[]})};
 globalThis.placeService=service;
 try{
  const root={navigator:{userAgent:'Mozilla/5.0 Chrome'},PizzaScanNative:{}};
  assert.equal(N.install(root),true);
  assert.equal(service.json.__nativeOverpass,true);
 }finally{
  if(previous===undefined)delete globalThis.placeService;else globalThis.placeService=previous;
 }
});

test('ordinary browser keeps the existing web transport',async()=>{
 let webCalls=0;
 const root={navigator:{userAgent:'Mozilla/5.0 Chrome'},PizzaScanNative:{},bridge:async()=>{throw Error('must not run');},placeService:{json:async()=>{webCalls++;return {elements:[1]};}}};
 N.install(root);
 const result=await root.placeService.json(N.ENDPOINTS[0],{method:'POST',body:new URLSearchParams({data:'x'})});
 assert.equal(webCalls,1);
 assert.deepEqual(result,{elements:[1]});
});

test('installer patches Service.prototype before script.js creates placeService',async()=>{
 let webCalls=0;
 class Service{async json(){webCalls++;return {elements:[{type:'node',id:7}]};}}
 const root={PizzaPlaces:{Service},navigator:{userAgent:'Mozilla/5.0 Chrome'},PizzaScanNative:{},bridge:async()=>{throw Error('must not run');}};
 assert.equal(N.install(root),true);
 const service=new Service();
 assert.equal(service.json.__nativeOverpass,true);
 const result=await service.json(N.ENDPOINTS[0],{method:'POST',body:new URLSearchParams({data:'[out:json];node(7);out;'})});
 assert.equal(webCalls,1);
 assert.equal(result.elements[0].id,7);
 assert.equal(root.PizzaScanNativeOverpass.prototype,true);
});