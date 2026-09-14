'use strict';
(()=>{
 let lastRequest=0;
 const cache=new Map(),TRANSIENT=new Set([408,425,429,500,502,503,504]),MAX_BYTES=2*1024*1024;
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 function safeLang(value){return /^(de|en|it|es|fr)$/i.test(value||'')?value.toLowerCase():'de';}
 function trustedUrl(value){const url=new URL(value);if(url.protocol!=='https:'||url.hostname!=='nominatim.openstreetmap.org'||url.username||url.password)throw Error('Unsichere Fallback-Kartenquelle blockiert');return url;}
 async function request(url){
  const endpoint=trustedUrl(url);
  for(let attempt=0;attempt<2;attempt++){
   const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),14000);
   try{
    const response=await fetch(endpoint.href,{signal:ctl.signal,headers:{Accept:'application/json'},credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',cache:'no-store'});
    if(response.redirected)throw Error('Weiterleitung der Fallback-Kartenquelle blockiert');
    if(response.url&&trustedUrl(response.url).hostname!==endpoint.hostname)throw Error('Unerwartete Fallback-Kartenquelle blockiert');
    const length=Number(response.headers?.get('content-length')||0);if(length>MAX_BYTES)throw Error('Fallback-Kartendaten sind ungewöhnlich groß');
    const type=String(response.headers?.get('content-type')||'');if(type&&!/(application\/json|text\/json|\+json)/i.test(type))throw Error('Fallback-Ortsdienst lieferte keinen JSON-Inhalt');
    if(!response.ok){const error=Error('Fallback-Ortsdienst antwortet mit HTTP '+response.status);error.status=response.status;throw error;}
    return await response.json();
   }catch(error){
    if(attempt===0&&(error?.name==='AbortError'||error?.name==='TypeError'||TRANSIENT.has(Number(error?.status)))){await sleep(350);continue;}
    if(error?.name==='AbortError')throw Error('Fallback-Ortssuche hat zu lange gedauert');
    throw error;
   }finally{clearTimeout(timer);}
  }
  throw Error('Fallback-Ortssuche nicht erreichbar');
 }
 async function search(query,language){
  const q=String(query||'').trim();
  if(q.length<2||q.length>160)throw Error('Ungültige Suchanfrage');
  const key=safeLang(language)+'|'+q.toLocaleLowerCase();
  const cached=cache.get(key);
  if(cached&&Date.now()-cached.time<86400000)return cached.data;
  const wait=Math.max(0,1050-(Date.now()-lastRequest));
  if(wait)await sleep(wait);
  lastRequest=Date.now();
  const url=new URL('https://nominatim.openstreetmap.org/search');
  url.search=new URLSearchParams({q,format:'jsonv2',addressdetails:'1',namedetails:'1',limit:'8','accept-language':safeLang(language)});
  const data=await request(url.href);
  if(!Array.isArray(data)||data.length>50)throw Error('Ungültige Antwort des Fallback-Ortsdienstes');
  cache.set(key,{time:Date.now(),data});
  return data;
 }
 addEventListener('message',async event=>{
  if(event.origin!==location.origin||event.source!==parent)return;
  const message=event.data||{};
  if(message.type!=='pizzascan-geocode'||typeof message.id!=='string')return;
  try{
   const data=await search(message.query,message.language);
   parent.postMessage({type:'pizzascan-geocode-result',id:message.id,ok:true,data},location.origin);
  }catch(error){
   parent.postMessage({type:'pizzascan-geocode-result',id:message.id,ok:false,error:error?.message||'Fallback-Suche fehlgeschlagen'},location.origin);
  }
 });
})();
