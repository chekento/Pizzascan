'use strict';
(()=>{
 let lastRequest=0;
 const cache=new Map();
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 function safeLang(value){return /^(de|en|it|es|fr)$/i.test(value||'')?value.toLowerCase():'de';}
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
  const response=await fetch(url.href,{headers:{Accept:'application/json'}});
  if(!response.ok)throw Error('Fallback-Ortsdienst antwortet mit HTTP '+response.status);
  const data=await response.json();
  if(!Array.isArray(data))throw Error('Ungültige Antwort des Fallback-Ortsdienstes');
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
