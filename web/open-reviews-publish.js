/* Optional Open Reviews / Mangrove publishing for PizzaScan.
 * Nothing is uploaded automatically. The feature is disabled by default and
 * every publication requires an explicit button press by the user.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PizzaOpenReviewsPublish=api;api.install(root);}
})(globalThis,function(){
'use strict';

const API='https://api.mangrove.reviews';
const DB_NAME='pizzascan-openreviews-v1';
const DB_VERSION=1;
const STORE='identity';
const ID='default';
const PUBLISHED_KEY='pizzascan-openreviews-published-v1';
const CLIENT_ID='https://github.com/chekento/Pizzascan';
const MAX_OPINION=1000;

function rating100(value){const n=Number(value);if(!Number.isFinite(n)||n<.1||n>10)throw Error('Bewertung muss zwischen 0,1 und 10,0 liegen.');return Math.max(0,Math.min(100,Math.round(n*10)));}
function subjectFor(place){if(!place||!Number.isFinite(Number(place.lat))||!Number.isFinite(Number(place.lng))||!place.name)throw Error('Der Ort hat keine gültige Position.');return `geo:${Number(place.lat)},${Number(place.lng)}?q=${encodeURIComponent(String(place.name).slice(0,200))}&u=30`;}
function payloadFor(place,rating,opinion='',now=Date.now()){
  const text=String(opinion||'').trim();if(text.length>MAX_OPINION)throw Error(`Open Reviews unterstützt in PizzaScan höchstens ${MAX_OPINION} Zeichen pro veröffentlichter Rezension.`);
  const payload={iat:Math.floor(now/1000),sub:subjectFor(place),rating:rating100(rating),metadata:{osm_id:String(place.placeId||''),license:'CC-BY-4.0',client_id:CLIENT_ID}};
  if(text)payload.opinion=text;return payload;
}
function editPayload(signature,rating,opinion='',now=Date.now()){
  if(!/^[A-Za-z0-9_-]{20,200}$/.test(String(signature||'')))throw Error('Gespeicherte Open-Reviews-Signatur ist ungültig.');
  const text=String(opinion||'').trim();if(text.length>MAX_OPINION)throw Error(`Open Reviews unterstützt in PizzaScan höchstens ${MAX_OPINION} Zeichen pro veröffentlichter Rezension.`);
  const payload={iat:Math.floor(now/1000),sub:'urn:maresi:'+signature,action:'edit',rating:rating100(rating),metadata:{license:'CC-BY-4.0',client_id:CLIENT_ID}};if(text)payload.opinion=text;return payload;
}
function bytesToBase64(bytes){if(typeof Buffer!=='undefined')return Buffer.from(bytes).toString('base64');let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);}
function b64urlBytes(bytes){return bytesToBase64(new Uint8Array(bytes)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');}
function b64urlText(text){return b64urlBytes(new TextEncoder().encode(text));}
function publicToPem(spki){const b64=bytesToBase64(new Uint8Array(spki)),lines=b64.match(/.{1,64}/g)||[];return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`;}
async function signJwt(cryptoImpl,keypair,payload){
  const publicJwk=await cryptoImpl.subtle.exportKey('jwk',keypair.publicKey),spki=await cryptoImpl.subtle.exportKey('spki',keypair.publicKey),pem=publicToPem(spki);
  const header={alg:'ES256',typ:'JWT',kid:pem,jwk:JSON.stringify(publicJwk)},head=b64urlText(JSON.stringify(header)),body=b64urlText(JSON.stringify(payload)),data=`${head}.${body}`;
  const signature=await cryptoImpl.subtle.sign({name:'ECDSA',hash:{name:'SHA-256'}},keypair.privateKey,new TextEncoder().encode(data));
  return `${data}.${b64urlBytes(signature)}`;
}
function signatureFromJwt(jwt){const parts=String(jwt||'').split('.');return parts.length===3&&/^[A-Za-z0-9_-]{20,200}$/.test(parts[2])?parts[2]:'';}

function openDatabase(indexedDBImpl){return new Promise((resolve,reject)=>{const req=indexedDBImpl.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Open-Reviews-Schlüssel konnte nicht geöffnet werden.'));});}
function request(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Open-Reviews-Speicherzugriff fehlgeschlagen.'));});}
async function loadIdentity(db,cryptoImpl){
  const row=await request(db.transaction(STORE,'readonly').objectStore(STORE).get(ID));
  if(row?.publicJwk&&row?.privateJwk){const publicKey=await cryptoImpl.subtle.importKey('jwk',row.publicJwk,{name:'ECDSA',namedCurve:'P-256'},true,['verify']),privateKey=await cryptoImpl.subtle.importKey('jwk',row.privateJwk,{name:'ECDSA',namedCurve:'P-256'},true,['sign']);return {publicKey,privateKey};}
  const pair=await cryptoImpl.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']),publicJwk=await cryptoImpl.subtle.exportKey('jwk',pair.publicKey),privateJwk=await cryptoImpl.subtle.exportKey('jwk',pair.privateKey);
  await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({id:ID,publicJwk,privateJwk,createdAt:new Date().toISOString()});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||Error('Open-Reviews-Schlüssel konnte nicht gespeichert werden.'));});return pair;
}
async function submit(fetcher,jwt){const response=await fetcher(`${API}/submit/${jwt}`,{method:'PUT',credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',headers:{Accept:'application/json'}});if(!response.ok){const detail=(await response.text().catch(()=>'' )).slice(0,500);throw Error(`Open Reviews antwortet mit HTTP ${response.status}${detail?': '+detail:''}`);}return true;}

function install(root){
  if(typeof root.document==='undefined'||!root.crypto?.subtle||!root.indexedDB)return;
  const dbPromise=openDatabase(root.indexedDB);
  function published(){try{return JSON.parse(root.localStorage?.getItem(PUBLISHED_KEY)||'{}')||{};}catch{return {};}}
  function savePublished(value){try{return placeService.write(PUBLISHED_KEY,value);}catch{return false;}}
  function enabled(){return settings?.openReviewsUpload===true;}

  async function publish(place,rating,opinion){
    if(!enabled())throw Error('Open-Reviews-Upload ist in den Einstellungen deaktiviert.');
    if(!place?.placeId)throw Error('Bitte zuerst einen eindeutigen PizzaScan-Ort auswählen.');
    const existing=published()[place.placeId],payload=existing?.signature?editPayload(existing.signature,rating,opinion):payloadFor(place,rating,opinion),pair=await loadIdentity(await dbPromise,root.crypto),jwt=await signJwt(root.crypto,pair,payload);
    await submit(root.fetch.bind(root),jwt);
    const signature=existing?.signature||signatureFromJwt(jwt);if(!signature)throw Error('Open Reviews hat keine verwertbare Signatur erzeugt.');
    const all=published();all[place.placeId]={signature,publishedAt:new Date().toISOString(),rating:Number(rating)};savePublished(all);
    try{PizzaRatingsUI.refresh(place.placeId);}catch{}
    return {signature,edited:!!existing?.signature};
  }

  function injectSettings(){
    const body=document.getElementById('sheet-body');if(!body||document.getElementById('openreviews-publish-settings'))return;
    const section=document.createElement('section');section.id='openreviews-publish-settings';section.innerHTML=`<hr><h2>Open Reviews / Mangrove</h2><label class="check"><input id="openreviews-upload-enabled" type="checkbox" ${enabled()?'checked':''}><span>Freiwilliges Veröffentlichen eigener Bewertungen aktivieren</span></label><p class="hint">Standardmäßig aus. Auch wenn aktiviert, wird niemals automatisch hochgeladen: Erst der Button „Auf Open Reviews veröffentlichen“ sendet deine Bewertung. Dabei werden Bewertung, optionaler Rezensionstext, Ortsname/Koordinaten, OSM-ID und ein pseudonymer öffentlicher Signaturschlüssel an api.mangrove.reviews übertragen. Der private Schlüssel bleibt im lokalen App-Speicher.</p>`;
    const history=document.getElementById('pizzascan-history-settings');if(history)history.after(section);else body.append(section);
    const save=document.getElementById('settings-save'),toggle=document.getElementById('openreviews-upload-enabled');if(save&&toggle){const old=save.onclick;save.onclick=e=>{settings.openReviewsUpload=toggle.checked;saveSettings();return old?.call(save,e);};}
  }
  if(typeof showSettings==='function'){const base=showSettings;showSettings=function(section){const out=base(section);injectSettings();return out;};}

  function addPublishButton(container,place,getRating,getOpinion,getVisited){
    if(!enabled()||!container||container.querySelector('[data-openreviews-publish]'))return;
    const button=document.createElement('button');button.type='button';button.className='secondary full';button.dataset.openreviewsPublish='true';button.textContent='🌿 Auf Open Reviews veröffentlichen';
    button.onclick=()=>guarded(async()=>{if(!getVisited())throw Error('Bitte zuerst bestätigen, dass dies deine eigene Erfahrung ist.');const rating=getRating();if(!Number.isFinite(rating))throw Error('Bitte zuerst deine eigene Bewertung eintragen.');const opinion=getOpinion();if(String(opinion||'').length>MAX_OPINION)throw Error(`Bitte den veröffentlichten Text auf höchstens ${MAX_OPINION} Zeichen kürzen.`);button.disabled=true;button.textContent='🌿 Wird signiert und veröffentlicht …';try{const result=await publish(place,rating,opinion);toast(result.edited?'Open-Reviews-Bewertung wurde aktualisiert.':'Bewertung wurde freiwillig zu Open Reviews beigetragen.');button.textContent='✓ Bei Open Reviews veröffentlicht';}finally{button.disabled=false;}});
    container.append(button);
  }

  if(typeof showReport==='function'){
    const base=showReport;showReport=function(id){const out=base(id);const r=reports.find(x=>x.id===id);if(r?.place){const body=document.getElementById('sheet-body');addPublishButton(body,r.place,()=>Number(r.own),()=>r.notes||'',()=>!!r.visited&&Number.isFinite(Number(r.own)));}return out;};
  }
  if(typeof showDraft==='function'){
    const base=showDraft;showDraft=function(source){const venue=source?.place||source,out=base(source),body=document.getElementById('sheet-body');if(venue?.placeId)addPublishButton(body,venue,()=>{const el=document.getElementById('review-rating'),n=el?.valueAsNumber;return Number.isFinite(n)?n:NaN;},()=>document.getElementById('draft-text')?.value||'',()=>!!document.getElementById('review-visited')?.checked);return out;};
  }

  if(typeof showPrivacy==='function'){
    const base=showPrivacy;showPrivacy=async function(){const out=await base();const body=document.getElementById('sheet-body');if(!body||document.getElementById('privacy-openreviews'))return out;const lang=(document.documentElement.lang||'de').slice(0,2),copy={de:['Freiwillige Veröffentlichung bei Open Reviews / Mangrove','Wenn du diese Funktion in den Einstellungen aktivierst und anschließend für eine konkrete eigene Bewertung ausdrücklich „Auf Open Reviews veröffentlichen“ wählst, sendet PizzaScan Bewertung, optionalen Rezensionstext, Ortsname und Koordinaten, OpenStreetMap-ID sowie einen pseudonymen öffentlichen Signaturschlüssel an api.mangrove.reviews. Es erfolgt kein automatischer Upload. Der zugehörige private P-256-Schlüssel bleibt lokal in der App. Veröffentlichte Beiträge sind Teil des öffentlichen Open-Reviews-Netzwerks und können von Dritten abgerufen werden.'],en:['Optional Open Reviews / Mangrove publishing','If you enable this feature in Settings and then explicitly choose “Publish to Open Reviews” for a specific personal rating, PizzaScan sends the rating, optional review text, venue name and coordinates, OpenStreetMap ID and a pseudonymous public signing key to api.mangrove.reviews. Nothing is uploaded automatically. The related private P-256 key stays in local app storage. Published contributions become part of the public Open Reviews network and can be retrieved by third parties.'],it:['Pubblicazione facoltativa su Open Reviews / Mangrove','Solo dopo l’attivazione nelle impostazioni e una pressione esplicita del pulsante di pubblicazione, PizzaScan invia valutazione, testo facoltativo, nome/coordinate del luogo, ID OpenStreetMap e chiave pubblica pseudonima a api.mangrove.reviews. Nessun caricamento avviene automaticamente; la chiave privata resta locale.'],es:['Publicación opcional en Open Reviews / Mangrove','Solo tras activarla en Ajustes y pulsar expresamente el botón de publicación, PizzaScan envía la valoración, texto opcional, nombre/coordenadas del lugar, ID de OpenStreetMap y clave pública seudónima a api.mangrove.reviews. No hay cargas automáticas; la clave privada permanece local.'],fr:['Publication facultative sur Open Reviews / Mangrove','Uniquement après activation dans les réglages et pression explicite sur le bouton de publication, PizzaScan transmet la note, le texte facultatif, le nom/les coordonnées du lieu, l’identifiant OpenStreetMap et une clé publique pseudonyme à api.mangrove.reviews. Aucun envoi automatique; la clé privée reste locale.']}[lang]||null;if(!copy)return out;const section=document.createElement('section');section.id='privacy-openreviews';section.innerHTML=`<h2>${copy[0]}</h2><p>${copy[1]}</p><p><a href="https://mangrove.reviews" target="_blank" rel="noopener">Mangrove / Open Reviews ↗</a></p>`;const article=body.querySelector('.privacy-localized')||body;article.append(section);return out;};
  }

  root.PizzaOpenReviewsPublishRuntime={enabled,publish,loadIdentity:()=>dbPromise.then(db=>loadIdentity(db,root.crypto))};
}

return {API,DB_NAME,DB_VERSION,STORE,ID,PUBLISHED_KEY,CLIENT_ID,MAX_OPINION,rating100,subjectFor,payloadFor,editPayload,bytesToBase64,b64urlBytes,b64urlText,publicToPem,signJwt,signatureFromJwt,openDatabase,loadIdentity,submit,install};
});
