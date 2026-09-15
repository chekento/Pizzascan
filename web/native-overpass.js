/* Android-native transport for Overpass. Avoid WebView CORS/provider quirks while keeping a fixed HTTPS allowlist. */
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
const NATIVE_TIMEOUT=14000;
const DIRECT_FALLBACK_TIMEOUT=22000;
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

  /* Packaged Android must not depend on WebView CORS for its primary POI data.
   * The native HTTPS bridge is therefore primary again, matching the last stable
   * Android transport before direct-first routing caused Photon fallbacks. */
  try{
   const abort=new Promise((_,reject)=>signal?.addEventListener('abort',()=>reject(new DOMException('Abgebrochen','AbortError')),{once:true}));
   const request=root.bridge('overpass',{endpoint:new URL(url).href,query,timeout:NATIVE_TIMEOUT}).then(raw=>{
    if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    const data=JSON.parse(String(raw||''));
    if(!data||!Array.isArray(data.elements))throw Error('Ungültige native Kartendaten');
    return data;
   });
   return signal?await Promise.race([request,abort]):await request;
  }catch(error){
   if(signal?.aborted||error?.name==='AbortError')throw error;
  }

  /* Direct fetch is a secondary rescue path only. */
  return base(url,options,signal,Math.max(DIRECT_FALLBACK_TIMEOUT,Number(timeout)||0));
 };
 wrapped.__nativeOverpass=true;wrapped.__nativeOverpassInner=base;root.placeService.json=wrapped;
 root.PizzaScanNativeOverpass={active:true,nativeFirst:true,endpoints:ENDPOINTS.slice()};
 return true;
}
return {ENDPOINTS,NATIVE_TIMEOUT,DIRECT_FALLBACK_TIMEOUT,allowed,queryFrom,isAndroidNative,install};
});
