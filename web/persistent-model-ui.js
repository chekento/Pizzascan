/* Android-only UI for durable offline model storage. */
'use strict';
(()=>{
 const SETTINGS='pizzascan-settings-v2',models=globalThis.PizzaAnalysis?.models||[];
 let timer=null,busy=false,last={};
 function config(){try{return JSON.parse(localStorage.getItem(SETTINGS)||'{}');}catch{return {};}}
 function mb(bytes){return Math.round((Number(bytes)||0)/1048576);}
 async function nativeStatus(model){
  if(!globalThis.PizzaScanNative||typeof globalThis.bridge!=='function')return null;
  try{return JSON.parse(await globalThis.bridge('modelStorageStatus',{repo:model.repo}));}catch{return null;}
 }
 function statusText(model,info,cfg){
  if(info?.installed)return `Offline installiert · ${mb(info.bytes)} MB im dauerhaften App-Speicher`;
  if((info?.bytes||0)>0)return `Download noch nicht vollständig · ${mb(info.bytes)} MB dauerhaft gespeichert`;
  if(cfg.cached?.[model.id])return 'Alter Cache erkannt · beim nächsten Einsatz einmalige Übernahme in dauerhaften App-Speicher';
  return `Download beim ersten Einsatz · ca. ${model.downloadMB} MB`;
 }
 function render(cfg){
  const selected=models.find(m=>m.id===(cfg.model||'clip32'))||models[0],hint=document.getElementById('model-download-hint');
  if(selected&&hint&&globalThis.PizzaScanNative){const info=last[selected.id];hint.textContent=info?.installed?`${selected.fullName} · ${mb(info.bytes)} MB dauerhaft in PizzaScans App-Speicher installiert. Kein erneuter Download bei normaler Cache-Bereinigung.`:info?.bytes?`${selected.fullName} · ${mb(info.bytes)} MB bereits dauerhaft gespeichert; der Download wird beim nächsten Einsatz vervollständigt.`:`${selected.fullName} · ca. ${selected.downloadMB} MB einmaliger Download. Danach bleibt das Modell dauerhaft im App-Speicher.`;}
  if(!globalThis.PizzaScanNative)return;
  for(const model of models){const input=document.querySelector(`input[name="model"][value="${model.id}"]`),label=input?.closest('.model-option');if(!label)continue;const smalls=label.querySelectorAll('small');if(smalls.length)smalls[smalls.length-1].textContent=statusText(model,last[model.id],cfg);}
 }
 async function refresh(){if(busy||!models.length||!globalThis.PizzaScanNative)return;busy=true;try{const cfg=config();for(const model of models){const info=await nativeStatus(model);if(info)last[model.id]=info;}render(cfg);}finally{busy=false;}}
 function soon(){if(!globalThis.PizzaScanNative)return;clearTimeout(timer);timer=setTimeout(refresh,350);}
 document.addEventListener('click',e=>{
  if(!globalThis.PizzaScanNative)return;
  const button=e.target.closest?.('#clear-models');if(!button)return;
  e.preventDefault();e.stopImmediatePropagation();
  (async()=>{
   if(!confirm('Alle heruntergeladenen KI-Modelle wirklich entfernen? Fotos und Bewertungen bleiben gespeichert.'))return;
   const cancel=document.getElementById('cancel-analysis'),progress=document.getElementById('analysis-progress');if(cancel&&progress&&!progress.hidden)cancel.click();
   try{const keys=await caches.keys();for(const key of keys)if(key.startsWith('transformers'))await caches.delete(key);if(typeof globalThis.bridge==='function')await globalThis.bridge('clearModelStorage');const cfg=config();cfg.cached={};cfg.modelNotices={};localStorage.setItem(SETTINGS,JSON.stringify(cfg));last={};globalThis.toast?.('Offline-Modelle wurden entfernt.');setTimeout(()=>location.reload(),250);}catch(err){globalThis.toast?.('Modelle konnten nicht vollständig entfernt werden.');console.error(err);}
  })();
 },true);
 const observer=new MutationObserver(soon);observer.observe(document.documentElement,{subtree:true,childList:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)soon();});
 window.addEventListener('load',soon);setInterval(()=>{if(!document.hidden)refresh();},12000);soon();
})();
