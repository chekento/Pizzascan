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
/* The original WebSim source uses [timeout:60]. Keep the Android bridge alive
 * long enough for that same query instead of cutting it off at ~28 seconds. */
const NATIVE_TIMEOUT=65000;
const DIRECT_FALLBACK_TIMEOUT=60000;
const pending=new Map();
function allowed(url){try{return ENDPOINTS.includes(new URL(url).href);}catch{return false;}}
function queryFrom(options={}){const body=options.body;if(body instanceof URLSearchParams)return body.get('data')||'';if(typeof body==='string')return new URLSearchParams(body).get('data')||'';return '';}
function isAndroidNative(root){return typeof root.PizzaScanNative?.postMessage==='function'&&/PizzaScan\/[0-9]/.test(root.navigator?.userAgent||'');}
function hookReplies(root){
 const bridge=root.PizzaScanBridge;
 if(!bridge||typeof bridge.reply!=='function')return false;
 if(bridge.__overpassReplyHook)return true;
 const original=bridge.reply.bind(bridge);
 bridge.reply=function(payload){
  const wait=pending.get(payload?.id);
  if(!wait)return original(payload);
  clearTimeout(wait.timer);pending.delete(payload.id);
  payload.error?wait.reject(Error(payload.error)):wait.resolve(payload.value);
 };
 bridge.__overpassReplyHook=true;
 return true;
}
function rawNative(root,payload,signal){
 if(!root.PizzaScanNative?.postMessage||!hookReplies(root))return null;
 if(signal?.aborted)return Promise.reject(new DOMException('Abgebrochen','AbortError'));
 const id=root.crypto?.randomUUID?.()||('overpass-'+Date.now()+'-'+Math.random().toString(16).slice(2));
 return new Promise((resolve,reject)=>{
  const finishAbort=()=>{const wait=pending.get(id);if(!wait)return;clearTimeout(wait.timer);pending.delete(id);reject(new DOMException('Abgebrochen','AbortError'));};
  const timer=setTimeout(()=>{pending.delete(id);signal?.removeEventListener('abort',finishAbort);reject(Error('Native Overpass timeout'));},NATIVE_TIMEOUT+1500);
  pending.set(id,{resolve:value=>{signal?.removeEventListener('abort',finishAbort);resolve(value);},reject:error=>{signal?.removeEventListener('abort',finishAbort);reject(error);},timer});
  signal?.addEventListener('abort',finishAbort,{once:true});
  try{root.PizzaScanNative.postMessage(JSON.stringify({type:'overpass',id,...payload}));}
  catch(error){clearTimeout(timer);pending.delete(id);signal?.removeEventListener('abort',finishAbort);reject(error);}
 });
}
async function nativeRequest(root,url,query,signal){
 const payload={endpoint:new URL(url).href,query,timeout:NATIVE_TIMEOUT};
 const raw=rawNative(root,payload,signal);
 if(raw)return raw;
 if(typeof root.bridge==='function')return root.bridge('overpass',payload);
 throw Error('Native Overpass bridge unavailable');
}
function makeWrapped(root,base){
 const wrapped=async function(url,options={},signal,timeout=18000){
  const query=queryFrom(options),native=isAndroidNative(root),post=String(options.method||'GET').toUpperCase()==='POST';
  if(!native||!post||!allowed(url)||!query)return base.call(this,url,options,signal,timeout);
  if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');

  /* Packaged Android must not depend on WebView CORS for POI data. Keep the
   * WebSim query byte-for-byte identical, but if the primary Overpass host is
   * unreachable, retry that same query through trusted OSM mirrors natively. */
  const ordered=[new URL(url).href,...ENDPOINTS.filter(endpoint=>endpoint!==new URL(url).href)];
  const nativeErrors=[];
  for(const endpoint of ordered){
   if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
   try{
    const raw=await nativeRequest(root,endpoint,query,signal);
    if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
    const data=JSON.parse(String(raw||''));
    if(!data||!Array.isArray(data.elements))throw Error('Ungültige native Kartendaten');
    root.PizzaScanNativeOverpass={...(root.PizzaScanNativeOverpass||{}),active:true,nativeFirst:true,mirrorFailover:true,lastEndpoint:endpoint,lastErrors:nativeErrors.slice(),endpoints:ENDPOINTS.slice()};
    return data;
   }catch(error){
    if(signal?.aborted||error?.name==='AbortError')throw error;
    nativeErrors.push({endpoint,message:error?.message||String(error)});
   }
  }

  /* One last direct attempt is allowed for browser/WebView stacks where CORS is
   * available. Do not leak its generic "Failed to fetch" over the native cause. */
  try{
   return await base.call(this,url,options,signal,Math.max(DIRECT_FALLBACK_TIMEOUT,Number(timeout)||0));
  }catch(directError){
   const detail=nativeErrors.map(x=>new URL(x.endpoint).hostname+': '+x.message).join(' · ');
   const error=Error('Kartendaten konnten nicht geladen werden'+(detail?': '+detail:''));
   error.cause=directError;
   error.nativeErrors=nativeErrors;
   throw error;
  }
 };
 wrapped.__nativeOverpass=true;wrapped.__nativeOverpassInner=base;return wrapped;
}
function install(root){
 let installed=false;
 /* native-overpass.js is loaded before script.js. Patch the Service prototype so
  * the later-created placeService inherits the native transport. */
 const proto=root.PizzaPlaces?.Service?.prototype;
 if(proto&&typeof proto.json==='function'&&!proto.json.__nativeOverpass){proto.json=makeWrapped(root,proto.json);installed=true;}
 if(root.placeService&&typeof root.placeService.json==='function'&&!root.placeService.json.__nativeOverpass){root.placeService.json=makeWrapped(root,root.placeService.json);installed=true;}
 if(installed||proto?.json?.__nativeOverpass||root.placeService?.json?.__nativeOverpass){
  root.PizzaScanNativeOverpass={active:true,nativeFirst:true,longTimeout:true,mirrorFailover:true,prototype:true,endpoints:ENDPOINTS.slice()};
  return true;
 }
 return false;
}
return {ENDPOINTS,NATIVE_TIMEOUT,DIRECT_FALLBACK_TIMEOUT,allowed,queryFrom,isAndroidNative,hookReplies,rawNative,nativeRequest,makeWrapped,install};
});
