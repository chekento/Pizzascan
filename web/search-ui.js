/* Compact restaurant/pizzeria search with remote autocomplete. */
'use strict';
(()=>{
 let autocompleteTimer=null,autocompleteAbort=null,autocompleteRevision=0;
 const byId=id=>document.getElementById(id);
 function currentCenter(){try{return mapCenter();}catch{return {lat:53.5511,lng:9.9937};}}
 function inFullscreen(){try{return !!mapFullscreen;}catch{return document.body.classList.contains('map-fullscreen');}}
 function closeAutocomplete(clearStatus=true){clearTimeout(autocompleteTimer);autocompleteAbort?.abort();autocompleteAbort=null;try{showSearchResults([]);}catch{}if(clearStatus&&byId('search-status'))byId('search-status').textContent='';}
 function openSearch(){const panel=byId('search-panel'),toggle=byId('search-toggle');if(!panel)return;if(inFullscreen()){document.body.classList.add('fs-search-open');byId('fs-search')?.setAttribute('aria-expanded','true');}else{panel.classList.remove('search-panel-collapsed');toggle?.setAttribute('aria-expanded','true');}setTimeout(()=>byId('search')?.focus(),30);}
 function closeSearch(){const panel=byId('search-panel'),toggle=byId('search-toggle');if(!panel)return;closeAutocomplete();document.body.classList.remove('fs-search-open');byId('fs-search')?.setAttribute('aria-expanded','false');panel.classList.add('search-panel-collapsed');toggle?.setAttribute('aria-expanded','false');byId('search')?.blur();}
 function dedupe(items){const seen=new Set();return items.filter(item=>{const p=item.place||item,key=p?.placeId||item.osmId||[item.kind,item.name,item.address,Number(item.lat).toFixed(5),Number(item.lng).toFixed(5)].join('|');if(seen.has(key))return false;seen.add(key);return true;});}
 function decorate(items){const buttons=[...document.querySelectorAll('#search-results .search-result')];buttons.forEach((button,index)=>{const item=items[index];if(!item)return;const text=button.querySelector('span:nth-child(2)');if(!text)return;const kind=document.createElement('span');kind.className='search-kind';const type=item.place?.type||item.type;kind.textContent=item.kind==='venue'?(PlaceData.TYPES[type]?.name||'Restaurant'):'Ort / Adresse';text.appendChild(kind);});const box=byId('search-results');if(box&&!box.hidden){const note=document.createElement('p');note.className='search-autocomplete-note';note.textContent='Tippe weiter oder wähle einen Treffer. Restaurants und Pizza-Orte werden bevorzugt.';box.appendChild(note);}}
 async function remoteAutocomplete(){const input=byId('search');if(!input)return;const q=input.value.trim();if(q.length<2){closeAutocomplete();return;}const revision=++autocompleteRevision;autocompleteAbort?.abort();const ctl=autocompleteAbort=new AbortController();const center=currentCenter();const local=PlaceData.suggestions([...places,...saved,...mapPool],q,center).map(p=>({...p,kind:'venue',place:p}));try{const remote=await placeService.photon(q,center,{signal:ctl.signal});if(revision!==autocompleteRevision||ctl.signal.aborted||input.value.trim()!==q)return;const venues=remote.filter(x=>x.kind==='venue'),locations=remote.filter(x=>x.kind!=='venue');const combined=dedupe([...local,...venues,...locations]).slice(0,10);showSearchResults(combined,combined.length>0&&combined.every(x=>x.kind==='venue'&&local.some(l=>(l.placeId||l.place?.placeId)===(x.placeId||x.place?.placeId))));decorate(combined);if(combined.length)byId('search-status').textContent=`${combined.length} Vorschläge · Restaurant, Pizzeria oder Ort auswählen.`;}
 catch(error){if(!ctl.signal.aborted&&revision===autocompleteRevision&&local.length){showSearchResults(local,true);decorate(local);byId('search-status').textContent='Lokale Treffer verfügbar · Onlinesuche wird beim Suchbutton erneut versucht.';}}
 }
 function scheduleAutocomplete(){clearTimeout(autocompleteTimer);const q=byId('search')?.value.trim()||'';if(q.length<2){closeAutocomplete();return;}autocompleteTimer=setTimeout(remoteAutocomplete,420);}
 function install(){const panel=byId('search-panel'),toggle=byId('search-toggle'),collapse=byId('search-collapse'),input=byId('search'),form=byId('search-form');if(!panel||!toggle||!collapse||!input||!form)return;
  panel.classList.add('search-panel-collapsed');toggle.setAttribute('aria-expanded','false');toggle.onclick=openSearch;collapse.onclick=closeSearch;
  input.addEventListener('input',scheduleAutocomplete);form.addEventListener('submit',()=>{clearTimeout(autocompleteTimer);autocompleteAbort?.abort();autocompleteAbort=null;});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.classList.contains('search-panel-collapsed')&&!document.querySelector('#sheet[open]')){event.preventDefault();closeSearch();}});
  const oldSelect=selectSearch;selectSearch=function(index){const out=oldSelect(index);closeSearch();return out;};
  toggleFullscreenSearch=function(){const opening=!document.body.classList.contains('fs-search-open');if(opening)openSearch();else closeSearch();};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
 globalThis.PizzaScanSearchUI={open:openSearch,close:closeSearch,autocomplete:remoteAutocomplete};
})();
