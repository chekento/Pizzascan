/* PizzaScan Build 39 UX/runtime finalizer.
 * IMPORTANT: the proven Build 38/WebSim discovery query and filtering logic are
 * intentionally left untouched. This layer only removes one provider, improves
 * personal visit persistence UI and turns the review builder into a portal hub.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaBuild39=api;api.install(root);}
})(globalThis,function(){
'use strict';

const BLOCKED_PROVIDER_HOST='maps.'+'mail.ru';
const MANUAL_EVENT_PREFIX='manual:';

function hostOf(value){try{return new URL(String(value)).hostname.toLowerCase();}catch{return '';}}
function blockedProvider(value){return hostOf(value)===BLOCKED_PROVIDER_HOST;}
function stripProviderArray(array){if(!Array.isArray(array))return array;for(let i=array.length-1;i>=0;i--)if(blockedProvider(array[i]))array.splice(i,1);return array;}
function latestEvent(record){return [...(record?.events||[])].filter(e=>Number.isFinite(Number(e?.rating))).sort((a,b)=>Date.parse(b.updatedAt||0)-Date.parse(a.updatedAt||0))[0]||null;}
function mangroveSubject(place){if(!place||!Number.isFinite(Number(place.lat))||!Number.isFinite(Number(place.lng))||!place.name)return '';return `geo:${Number(place.lat)},${Number(place.lng)}?q=${encodeURIComponent(String(place.name).slice(0,200))}&u=30`;}
function portalUrls(place){
  const name=String(place?.name||'').trim(),address=String(place?.address||'').trim(),position=Number.isFinite(Number(place?.lat))&&Number.isFinite(Number(place?.lng))?`${Number(place.lat)},${Number(place.lng)}`:'',query=[name,address||position].filter(Boolean).join(' '),sub=mangroveSubject(place);
  return {
    google:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    yelp:`https://www.yelp.com/search?find_desc=${encodeURIComponent(name||'restaurant')}&find_loc=${encodeURIComponent(address||position)}`,
    tripadvisor:`https://www.tripadvisor.com/Search?q=${encodeURIComponent(query)}`,
    mangrove:`https://mangrove.reviews/search?sub=${encodeURIComponent(sub)}`
  };
}
function validArchiveObject(data,history){return !!data&&data.format===history?.ARCHIVE_FORMAT&&Number(data.version)===Number(history?.ARCHIVE_VERSION)&&Array.isArray(data.visits)&&data.visits.length<=100000;}

function install(root){
  if(typeof root.document==='undefined')return false;

  /* Provider policy: preserve the exact search algorithm, but remove the Mail.ru
   * mirror from every mutable runtime provider pool and hard-block it at the
   * final JSON transport layer. The three existing Overpass mirrors continue to
   * be merged exactly as before. */
  stripProviderArray(root.PizzaSmartDiscovery?.PROVIDERS);
  stripProviderArray(root.PizzaSmartDiscovery?.RECOVERY_PROVIDERS);
  stripProviderArray(root.PizzaNativeOverpass?.ENDPOINTS);
  if(root.PizzaScanSmartDiscovery?.providers)root.PizzaScanSmartDiscovery.providers=stripProviderArray([...root.PizzaScanSmartDiscovery.providers]);
  if(root.PizzaScanNativeOverpass?.endpoints)root.PizzaScanNativeOverpass.endpoints=stripProviderArray([...root.PizzaScanNativeOverpass.endpoints]);
  try{
    if(typeof placeService!=='undefined'&&typeof placeService.json==='function'&&!placeService.json.__build39ProviderPolicy){
      const baseJson=placeService.json.bind(placeService);
      const wrapped=async function(url,...args){if(blockedProvider(url))throw Error('Diese Kartenquelle ist in PizzaScan deaktiviert.');return baseJson(url,...args);};
      wrapped.__build39ProviderPolicy=true;wrapped.__inner=baseJson;placeService.json=wrapped;
    }
  }catch{}
  try{if(typeof mapSource==='string'&&mapSource.includes(BLOCKED_PROVIDER_HOST))mapSource=mapSource.split(' + ').filter(x=>!x.includes(BLOCKED_PROVIDER_HOST)).join(' + ');}catch{}

  const history=root.PizzaPlaceHistory,historyRuntime=root.PizzaPlaceHistoryRuntime;
  let visitRecords=new Map();
  const request=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Besuchsarchiv konnte nicht gelesen werden.'));});
  const db=()=>historyRuntime?.db?.();
  async function getVisit(placeId){const d=await db();if(!d)return null;return request(d.transaction(history.VISIT_STORE,'readonly').objectStore(history.VISIT_STORE).get(placeId));}
  async function allVisits(){const d=await db();if(!d)return [];return request(d.transaction(history.VISIT_STORE,'readonly').objectStore(history.VISIT_STORE).getAll());}
  function putMany(d,store,items){return new Promise((resolve,reject)=>{const tx=d.transaction(store,'readwrite'),os=tx.objectStore(store);for(const item of items||[])os.put(item);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Besuchsarchiv konnte nicht gespeichert werden.'));tx.onabort=()=>reject(tx.error||Error('Speichern wurde abgebrochen.'));});}
  async function refreshVisits(redraw=false){
    if(!history||!historyRuntime)return [];
    const rows=await allVisits();visitRecords=new Map(rows.map(r=>[r.placeId,r]));historyRuntime.visitedIds?.clear?.();for(const r of rows)historyRuntime.visitedIds?.add?.(r.placeId);
    const button=root.document.getElementById('visited-library-open');if(button)button.innerHTML=`📍 Besucht & bewertet <span class="badge">${rows.length}</span>`;
    if(redraw&&typeof renderPlaces==='function')renderPlaces();return rows;
  }
  async function saveVisit(place,rating,notes=''){
    if(!history||!historyRuntime)throw Error('Besuchsarchiv ist noch nicht verfügbar.');
    const n=Number(String(rating).replace(',','.'));if(!Number.isFinite(n)||n<.1||n>10)throw Error('Bitte eine Bewertung zwischen 0,1 und 10,0 eingeben.');
    const clean=history.cleanPlace(place),d=await db(),old=await getVisit(clean.placeId),now=new Date().toISOString();
    const next=history.mergeVisitRecords(old,{placeId:clean.placeId,place:clean,updatedAt:now,events:[{id:MANUAL_EVENT_PREFIX+clean.placeId,rating:Math.round(n*10)/10,notes:String(notes||'').trim().slice(0,4000),source:'manual',updatedAt:now}]});
    await putMany(d,history.VISIT_STORE,[next]);await putMany(d,history.PLACE_STORE,[clean]);visitRecords.set(clean.placeId,next);historyRuntime.visitedIds?.add?.(clean.placeId);
    try{if(typeof mapPool!=='undefined')mapPool=PlaceData.merge(mapPool,[clean]);}catch{}
    if(typeof renderPlaces==='function')renderPlaces();return next;
  }
  async function importRows(rows){
    if(!history||!historyRuntime)throw Error('Besuchsarchiv ist noch nicht verfügbar.');
    const d=await db(),merged=[];for(const row of rows||[]){const old=await getVisit(row.placeId),next=history.mergeVisitRecords(old,row);merged.push(next);}await putMany(d,history.VISIT_STORE,merged);await putMany(d,history.PLACE_STORE,merged.map(x=>x.place));try{if(typeof mapPool!=='undefined')mapPool=PlaceData.merge(mapPool,merged.map(x=>x.place));}catch{}await refreshVisits(true);return merged.length;
  }
  function archiveJson(rows){return JSON.stringify(history.archiveObject(rows),null,2);}
  async function exportJson(){const rows=await allVisits(),name='PizzaScan-Besuchsarchiv-'+new Date().toISOString().slice(0,10)+'.json';await bridge('save',{name,text:archiveJson(rows)});toast(`${rows.length} besuchte und bewertete Orte gesichert.`);}
  async function exportMarkdown(){const rows=await allVisits(),name='PizzaScan-Besuchsarchiv-'+new Date().toISOString().slice(0,10)+'.md';await bridge('save',{name,text:history.archiveToMarkdown(rows)});toast(`${rows.length} Orte als lesbares Markdown gesichert.`);}
  async function importJsonFile(){
    const input=root.document.createElement('input');input.type='file';input.accept='.json,application/json';
    input.onchange=async()=>{try{const file=input.files?.[0];if(!file)return;const data=JSON.parse(await file.text());if(!validArchiveObject(data,history))throw Error('Das ist kein gültiges PizzaScan-Besuchsarchiv.');const count=await importRows(data.visits);toast(`${count} besuchte Orte geladen bzw. zusammengeführt.`);showVisitedLibrary();}catch(error){toast(error.message||'Besuchsarchiv konnte nicht geladen werden.');}};input.click();
  }
  function importMarkdownPaste(){
    openSheet('visit-import','BESUCHSARCHIV · MARKDOWN LADEN',`<h1>Markdown-Backup laden</h1><p class="hint">Füge den vollständigen Inhalt eines von PizzaScan erzeugten Markdown-Besuchsarchivs ein. Vorhandene Besuche werden zusammengeführt, nicht überschrieben.</p><textarea id="visit-md-import" class="visit-import-box" placeholder="# PizzaScan Besuchsarchiv …"></textarea><button id="visit-md-import-apply" class="primary full">Archiv prüfen & laden</button>`);
    root.document.getElementById('visit-md-import-apply').onclick=()=>guarded(async()=>{const rows=history.archiveFromMarkdown(root.document.getElementById('visit-md-import').value),count=await importRows(rows);toast(`${count} besuchte Orte aus Markdown geladen.`);showVisitedLibrary();});
  }
  function visitSummary(record){const e=latestEvent(record);return e?`${Number(e.rating).toFixed(1)}/10 · ${new Date(e.updatedAt).toLocaleDateString(root.document.documentElement.lang||'de')}`:'Besucht';}
  async function showVisitedLibrary(){
    const rows=(await refreshVisits()).sort((a,b)=>Date.parse(latestEvent(b)?.updatedAt||b.updatedAt||0)-Date.parse(latestEvent(a)?.updatedAt||a.updatedAt||0));
    const cards=rows.map(r=>{const e=latestEvent(r),note=String(e?.notes||'').trim();return `<article class="visit-library-card"><div><strong translate="no">${esc(r.place?.name||r.placeId)}</strong><small>${esc(visitSummary(r))}</small>${r.place?.address?`<small translate="no">${esc(r.place.address)}</small>`:''}${note?`<p>${esc(note.slice(0,240))}${note.length>240?'…':''}</p>`:''}</div><div class="visit-library-actions"><button class="secondary" data-action="visit-open-place" data-id="${esc(r.placeId)}">Details</button><button class="secondary" data-action="visit-open-review" data-id="${esc(r.placeId)}">Rezension</button></div></article>`;}).join('')||'<div class="empty">Noch keine besuchten und selbst bewerteten Orte gespeichert.</div>';
    openSheet('visited-library','DEINE BESUCHTEN ORTE',`<div class="visit-library-head"><div><h1>Besucht & bewertet.</h1><p class="hint">Diese Orte bleiben lokal erhalten, auch wenn eine spätere Kartensuche sie gerade nicht liefert.</p></div><span class="visit-count-pill">${rows.length}</span></div><div class="visit-backup-grid"><button class="secondary" data-action="visit-export-json">Backup sichern (.json)</button><button class="secondary" data-action="visit-import-json">Backup laden (.json)</button><button class="text-button" data-action="visit-export-md">Lesbare Kopie (.md)</button><button class="text-button" data-action="visit-import-md">Markdown-Inhalt laden</button></div><div class="visit-library-list">${cards}</div>`);
  }

  function injectStyle(){if(root.document.getElementById('build39-style'))return;const style=root.document.createElement('style');style.id='build39-style';style.textContent=`
  .visit-badge{display:inline-flex;align-items:center;gap:.25rem;margin-left:.35rem;padding:.18rem .48rem;border-radius:999px;background:color-mix(in srgb,var(--accent,#ef4b23) 12%,transparent);font-size:.72rem;font-weight:800;white-space:nowrap}.visit-editor{margin:1rem 0;padding:1rem;border:1px solid rgba(120,110,100,.18);border-radius:20px;background:rgba(255,255,255,.62)}.dark .visit-editor{background:rgba(25,25,25,.55)}.visit-editor h2{margin:.1rem 0 .25rem}.visit-editor-grid{display:grid;grid-template-columns:140px 1fr;gap:.75rem;margin:.8rem 0}.visit-editor textarea{min-height:84px}.visit-editor .check{margin:.7rem 0}.visit-library-head{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start}.visit-count-pill{min-width:46px;height:46px;border-radius:16px;display:grid;place-items:center;background:var(--accent,#ef4b23);color:white;font-weight:900}.visit-backup-grid{display:grid;grid-template-columns:1fr 1fr;gap:.55rem;margin:1rem 0}.visit-library-list{display:grid;gap:.65rem}.visit-library-card{display:flex;justify-content:space-between;gap:.8rem;padding:.85rem;border:1px solid rgba(120,110,100,.16);border-radius:18px;background:rgba(255,255,255,.58)}.dark .visit-library-card{background:rgba(25,25,25,.5)}.visit-library-card strong,.visit-library-card small{display:block}.visit-library-card p{margin:.4rem 0 0}.visit-library-actions{display:flex;flex-direction:column;gap:.4rem;justify-content:center}.visit-import-box{min-height:280px}.review-publish-hub{margin:1rem 0;padding:1rem;border-radius:22px;background:linear-gradient(145deg,rgba(239,78,39,.08),rgba(255,255,255,.55));border:1px solid rgba(239,78,39,.16)}.dark .review-publish-hub{background:linear-gradient(145deg,rgba(239,78,39,.13),rgba(20,20,20,.55))}.review-publish-hub h2{margin:.05rem 0 .25rem}.review-copy-row{display:flex;gap:.55rem;align-items:center;margin:.75rem 0}.review-copy-row button{flex:1}.review-portal-grid{display:grid;grid-template-columns:1fr 1fr;gap:.65rem}.review-portal-card{display:flex;flex-direction:column;gap:.45rem;padding:.75rem;border-radius:17px;background:rgba(255,255,255,.72);border:1px solid rgba(120,110,100,.14)}.dark .review-portal-card{background:rgba(25,25,25,.62)}.review-portal-card strong{font-size:.94rem}.review-portal-card small{opacity:.72;line-height:1.3}.review-portal-card button{width:100%;margin-top:auto}.review-portal-card.mangrove{grid-column:1/-1}.review-portal-card.mangrove .mangrove-actions{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}.portal-copy-open{min-height:48px}.portal-state{margin:.65rem 0 0;font-size:.78rem;opacity:.75}@media(max-width:520px){.review-portal-grid,.visit-backup-grid,.visit-editor-grid{grid-template-columns:1fr}.review-portal-card.mangrove .mangrove-actions{grid-template-columns:1fr}.visit-library-card{flex-direction:column}.visit-library-actions{flex-direction:row}.review-copy-row{flex-direction:column}.review-copy-row button{width:100%}}
  `;root.document.head.append(style);}

  injectStyle();
  try{
    const quick=root.document.querySelector('.map-quick-actions');if(quick&&!root.document.getElementById('visited-library-open')){const button=root.document.createElement('button');button.id='visited-library-open';button.className='secondary';button.dataset.action='visit-library';button.innerHTML='📍 Besucht & bewertet <span class="badge">0</span>';quick.append(button);}
  }catch{}

  if(typeof statusBadge==='function'){
    const baseStatusBadge=statusBadge;statusBadge=function(p){const html=baseStatusBadge(p);return html+(visitRecords.has(p?.placeId)?'<span class="visit-badge">✓ besucht</span>':'');};
  }
  if(typeof visiblePlaces==='function'){
    const baseVisiblePlaces=visiblePlaces;visiblePlaces=function(){const list=baseVisiblePlaces();let cfg;try{cfg=mapConfig();}catch{return list;}return cfg.hideVisited?list.filter(p=>!visitRecords.has(p.placeId)):list;};
  }
  if(typeof drawMarkers==='function'){
    const baseDrawMarkers=drawMarkers;drawMarkers=function(){if(typeof reports==='undefined')return baseDrawMarkers();const existing=new Set(reports.filter(r=>r?.visited&&r?.place).map(r=>r.place.placeId)),added=[];try{for(const [id,r] of visitRecords)if(!existing.has(id)&&r?.place)added.push({id:'visit-ui:'+id,visited:true,place:r.place});reports.push(...added);return baseDrawMarkers();}finally{if(added.length)reports.splice(reports.length-added.length,added.length);}};
  }
  if(typeof detailsHtml==='function'){
    const baseDetailsHtml=detailsHtml;detailsHtml=function(p,...args){const base=baseDetailsHtml(p,...args),record=visitRecords.get(p?.placeId),event=latestEvent(record),rating=event?Number(event.rating).toFixed(1):'',notes=event?.notes||'';return base+`<section class="visit-editor" data-visit-place="${esc(p.placeId)}"><h2>📍 Mein Besuch</h2><p class="hint">Markiere den Ort dauerhaft als besucht, indem du deine eigene Bewertung speicherst. Das ist unabhängig von öffentlichen Rezensionen.</p><div class="visit-editor-grid"><div class="field"><label for="visit-rating">Eigene Bewertung / 10</label><input id="visit-rating" type="number" min="0.1" max="10" step="0.1" inputmode="decimal" placeholder="0,1–10,0" value="${esc(rating)}"></div><div class="field"><label for="visit-notes">Notiz zum Besuch</label><textarea id="visit-notes" maxlength="4000" placeholder="Was möchtest du zu diesem Ort behalten?">${esc(notes)}</textarea></div></div><label class="check"><input id="visit-confirm" type="checkbox" ${record?'checked':''}><span>Ich war hier / habe hier bestellt und möchte diesen Ort in meinem persönlichen Besuchsarchiv behalten.</span></label><div class="row"><button class="primary" data-action="visit-save" data-id="${esc(p.placeId)}">${record?'✓ Besuch aktualisieren':'Als besucht & bewertet speichern'}</button><button class="secondary" data-action="visit-review" data-id="${esc(p.placeId)}">Rezension erstellen ↗</button></div></section>`;};
  }

  async function robustCopy(text){
    const value=String(text||'');if(!value.trim())throw Error('Der Rezensionstext ist leer.');
    try{await bridge('copy',{text:value});return true;}catch{}
    try{await root.navigator.clipboard.writeText(value);return true;}catch{}
    const area=root.document.createElement('textarea');area.value=value;area.style.position='fixed';area.style.opacity='0';root.document.body.append(area);area.focus();area.select();let ok=false;try{ok=root.document.execCommand('copy');}finally{area.remove();}if(!ok)throw Error('Text konnte nicht in die Zwischenablage kopiert werden.');return true;
  }
  async function robustOpen(url){try{await bridge('open',{url});return;}catch{}const win=root.open(url,'_blank','noopener');if(!win)throw Error('Portal konnte nicht geöffnet werden.');}
  async function copyAndOpen(url){const text=root.document.getElementById('draft-text')?.value||'';await robustCopy(text);await robustOpen(url);toast('Rezension kopiert · Portal geöffnet.');}
  function syncPortalButtons(){const gate=root.document.getElementById('maps-draft'),invalid=!!gate?.disabled,text=root.document.getElementById('draft-text')?.value||'';for(const b of root.document.querySelectorAll('[data-review-portal]'))b.disabled=invalid;const direct=root.document.querySelector('[data-openreviews-publish]');if(direct)direct.disabled=invalid||text.length>1000;const state=root.document.getElementById('portal-state');if(state)state.textContent=invalid?'Vervollständige zuerst Besuchsart, Bewertung, Text und Bestätigung.':`Bereit · ${text.length} Zeichen kopierbar${text.length<=1000?' · auch direkt zu Mangrove sendbar':' · Mangrove-Direktupload auf 1000 Zeichen begrenzt'}.`;}
  function setupPortalHub(venue){
    const body=root.document.getElementById('sheet-body'),maps=root.document.getElementById('maps-draft'),copy=root.document.getElementById('copy-draft');if(!body||!maps||!copy||body.querySelector('.review-publish-hub'))return;
    const urls=portalUrls(venue),direct=body.querySelector('[data-openreviews-publish]'),hub=root.document.createElement('section');hub.className='review-publish-hub';hub.innerHTML=`<h2>Rezension veröffentlichen</h2><p class="hint">Ein Text, mehrere Portale. PizzaScan kopiert deinen fertigen Entwurf und öffnet den gewählten Ort bzw. die Portalsuche. Veröffentlicht wird erst durch dich.</p><div class="review-copy-row" id="review-copy-row"></div><div class="review-portal-grid"><div class="review-portal-card"><strong>🗺️ Google Maps</strong><small>Text kopieren und Google Maps mit dem Restaurant öffnen.</small><div id="portal-google"></div></div><div class="review-portal-card"><strong>Yelp</strong><small>Text kopieren und die Yelp-Suche für diesen Ort öffnen.</small><button class="secondary portal-copy-open" data-review-portal="yelp">Kopieren & Yelp öffnen ↗</button></div><div class="review-portal-card"><strong>TripAdvisor</strong><small>Text kopieren und die TripAdvisor-Suche für diesen Ort öffnen.</small><button class="secondary portal-copy-open" data-review-portal="tripadvisor">Kopieren & TripAdvisor öffnen ↗</button></div><div class="review-portal-card mangrove"><strong>🌿 Mangrove / Open Reviews</strong><small>Offenes Rating-Netzwerk. Du kannst den Text kopieren und Mangrove öffnen oder – nach freiwilliger Aktivierung in den Einstellungen – direkt signiert aus PizzaScan veröffentlichen.</small><div class="mangrove-actions"><button class="secondary portal-copy-open" data-review-portal="mangrove">Kopieren & Mangrove öffnen ↗</button><div id="mangrove-direct-slot"></div></div></div></div><p id="portal-state" class="portal-state"></p>`;
    maps.parentNode?.insertBefore(hub,maps);root.document.getElementById('review-copy-row').append(copy);copy.textContent='📋 Nur Text kopieren';root.document.getElementById('portal-google').append(maps);maps.textContent='Kopieren & Google Maps öffnen ↗';maps.classList.add('portal-copy-open');
    copy.onclick=()=>guarded(async()=>{if(copy.disabled)return;await robustCopy(root.document.getElementById('draft-text')?.value||'');toast('Rezension in die Zwischenablage kopiert.');});maps.onclick=()=>guarded(()=>copyAndOpen(urls.google));
    for(const button of body.querySelectorAll('[data-review-portal]'))button.onclick=()=>guarded(()=>copyAndOpen(urls[button.dataset.reviewPortal]));
    const slot=root.document.getElementById('mangrove-direct-slot');if(direct){direct.className='primary';direct.textContent='🌿 Direkt bei Mangrove veröffentlichen';slot.append(direct);}else{const enable=root.document.createElement('button');enable.type='button';enable.className='secondary';enable.textContent='Mangrove-Direktupload aktivieren';enable.onclick=()=>{showSettings();};slot.append(enable);}
    const sync=()=>setTimeout(syncPortalButtons,0);body.addEventListener('input',sync);body.addEventListener('change',sync);body.addEventListener('click',sync);syncPortalButtons();
  }

  if(typeof showDraft==='function'){
    const baseShowDraft=showDraft;showDraft=function(source){const venue=source?.place||source,hadDraft=!!(()=>{try{return JSON.parse(root.localStorage?.getItem('pizzascan-drafts-v1')||'{}')?.[venue?.placeId];}catch{return false;}})(),out=baseShowDraft(source);if(venue?.placeId){setupPortalHub(venue);if(!hadDraft)Promise.resolve(getVisit(venue.placeId)).then(record=>{const event=latestEvent(record);if(!event||root.document.querySelector('.review-publish-hub')==null)return;const rating=root.document.getElementById('review-rating'),notes=root.document.getElementById('review-notes'),visited=root.document.getElementById('review-visited');if(rating&&!rating.value){rating.value=Number(event.rating).toFixed(1);rating.dispatchEvent(new Event('input',{bubbles:true}));}if(notes&&!notes.value&&event.notes){notes.value=event.notes;notes.dispatchEvent(new Event('input',{bubbles:true}));}if(visited&&!visited.checked){visited.checked=true;visited.dispatchEvent(new Event('change',{bubbles:true}));}syncPortalButtons();}).catch(()=>{});}return out;};
  }

  if(typeof handleMapAction==='function'){
    const baseHandleMapAction=handleMapAction;handleMapAction=async function(button){const action=button?.dataset?.action,id=button?.dataset?.id;
      if(action==='visit-library')return showVisitedLibrary();
      if(action==='visit-save'){const place=placeById(id)||mapPool.find(p=>p.placeId===id);if(!place)return;if(!root.document.getElementById('visit-confirm')?.checked)throw Error('Bitte bestätige zuerst, dass du den Ort besucht oder dort bestellt hast.');const record=await saveVisit(place,root.document.getElementById('visit-rating')?.value,root.document.getElementById('visit-notes')?.value||'');toast('Besuch und eigene Bewertung dauerhaft gespeichert.');const b=root.document.querySelector('[data-action="visit-save"]');if(b)b.textContent='✓ Besuch aktualisieren';await refreshVisits(true);return record;}
      if(action==='visit-review'){const place=placeById(id)||mapPool.find(p=>p.placeId===id),record=visitRecords.get(id),event=latestEvent(record);return showDraft({place,own:event?.rating??Number(root.document.getElementById('visit-rating')?.value),notes:event?.notes??root.document.getElementById('visit-notes')?.value||'',visited:true});}
      if(action==='visit-open-place'){closeSheet();return showPlace(id);}
      if(action==='visit-open-review'){const record=visitRecords.get(id),event=latestEvent(record);closeSheet();return showDraft({place:record?.place,own:event?.rating,notes:event?.notes||'',visited:true});}
      if(action==='visit-export-json')return exportJson();
      if(action==='visit-import-json')return importJsonFile();
      if(action==='visit-export-md')return exportMarkdown();
      if(action==='visit-import-md')return importMarkdownPaste();
      return baseHandleMapAction(button);
    };
  }

  root.PizzaBuild39Runtime={blockedProvider,portalUrls,latestEvent,refreshVisits,saveVisit,showVisitedLibrary,exportJson,exportMarkdown};
  refreshVisits(true).catch(error=>console.warn('PizzaScan visit UI unavailable',error));
  return true;
}

return {BLOCKED_PROVIDER_HOST,MANUAL_EVENT_PREFIX,hostOf,blockedProvider,stripProviderArray,latestEvent,mangroveSubject,portalUrls,validArchiveObject,install};
});
