/* Android Overpass transport. Prefer the same direct HTTPS path used by the original
 * WebSim app; fall back to the native bridge only when WebView/network transport fails. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else{root.PizzaNativeOverpass=api;api.install(root);}
})(globalThis,function(){
'use strict';
const ENDPOINTS=[
 'https://overpass-api.de/api/interpreter',
 'https://overpass.private.coffee/api/interpreter',
 'https://overpass.osm.jp/api/interpreter',
 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];
const DIRECT_MIN_TIMEOUT=22000;
function allowed(url){try{return ENDPOINTS.includes(new URL(url).href);}catch{return false;}}
function queryFrom(options={}){const body=options.body;if(body instanceof URLSearchParams)return body.get('data')||'';if(typeof body==='string')return new URLSearchParams(body).get('data')||'';return '';}
function isAndroidNative(root){return !!root.PizzaScanNative&&typeof root.bridge==='function'&&/PizzaScan\/[0-9]/.test(root.navigator?.userAgent||'');}
function install(root){
 if(!root.placeService||root.placeService.json?.__nativeOverpass)return false;
 const base=root.placeService.json.bind(root.placeService);
 const wrapped=async function(url,options={},signal,timeout=18000){
  const query=queryFrom(options),native=isAndroidNative(root),post=String(options.method||'GET').toUpperCase()==='POST';
  if(!native||!post||!allowed(url)||!query)return base(url,options,signal,timeout);
  if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');

  /* The old WebSim build got its dense result sets straight from Overpass. Keep
   * that route primary on Android too. The native bridge remains a CORS/network
   * safety net, not the first and only transport. */
  try{
   const direct=await base(url,options,signal,Math.max(DIRECT_MIN_TIMEOUT,Number(timeout)||0));
   if(direct&&Array.isArray(direct.elements))return direct;
  }catch(error){
   if(signal?.aborted||error?.name==='AbortError')throw error;
  }

  if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
  const abort=new Promise((_,reject)=>signal?.addEventListener('abort',()=>reject(new DOMException('Abgebrochen','AbortError')),{once:true}));
  const request=root.bridge('overpass',{endpoint:new URL(url).href,query,timeout:Math.max(10000,Math.min(14000,Number(timeout)||12000))}).then(raw=>{
   if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
   const data=JSON.parse(String(raw||''));
   if(!data||!Array.isArray(data.elements))throw Error('Ungültige native Kartendaten');
   return data;
  });
  return signal?Promise.race([request,abort]):request;
 };
 wrapped.__nativeOverpass=true;wrapped.__nativeOverpassInner=base;root.placeService.json=wrapped;
 root.PizzaScanNativeOverpass={active:true,directFirst:true,endpoints:ENDPOINTS.slice()};
 return true;
}
return {ENDPOINTS,DIRECT_MIN_TIMEOUT,allowed,queryFrom,isAndroidNative,install};
});
