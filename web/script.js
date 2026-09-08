/* PizzaScan Android edition. Adapted from the supplied HTML/CSS prototype.
 * Local data only; no WebSim account, mock venues, API keys or cloud ratings.
 */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const C = window.PizzaCore, $ = id => document.getElementById(id);
  const KEY = 'pizzascan-state-v1', CACHE = 'pizzascan-map-cache-v1';
  const on = (id, event, fn) => { if ($(id)) $(id).addEventListener(event, fn); };
  const text = (id, value) => { if ($(id)) $(id).textContent = value; };
  let noticeTimer, priorFocus, photoUrl;
  function notify(message, type = 'info', ms = 6500) {
    clearTimeout(noticeTimer);
    const el = $('map-message-area');
    el.textContent = message;
    el.className = 'map-message ' + type;
    el.style.display = 'block';
    if (ms) noticeTimer = setTimeout(() => { el.style.display = 'none'; }, ms);
  }
  on('map-message-area', 'click', () => { $('map-message-area').style.display = 'none'; });
  const defaultState = () => ({version: 1, want: [], visited: [], ratings: [], crawls: [],
    profile: {name: 'Pizza Explorer', favoriteStyle: 'neapolitan', favoriteToppings: [], joinDate: new Date().toISOString()},
    dark: false, welcomed: false, navigation: 'walking', map: {lat: 53.5511, lng: 9.9937, zoom: 13}});
  const ratingFields = ['ambiance','service','cleanliness','value','crust','sauce','cheese','toppings','bake'];
  function validateRating(r) {
    const p = C.place(r.place);
    if (!ratingFields.every(k => typeof r[k] === 'number' && Number.isFinite(r[k]) && r[k] >= 1 && r[k] <= 5)
      || !Number.isFinite(r.restaurantWeight) || r.restaurantWeight < 20 || r.restaurantWeight > 80
      || !Number.isFinite(r.firstBite) || r.firstBite < .1 || r.firstBite > 10) throw new Error('Invalid rating in backup.');
    const result = {id: String(r.id || p.placeId).slice(0,150), place:p,
      createdAt: Number.isFinite(Date.parse(r.createdAt)) ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      comment: String(r.comment || '').slice(0,2000), restaurantWeight:r.restaurantWeight, firstBite:r.firstBite};
    ratingFields.forEach(k => { result[k] = r[k]; });
    result.score = C.ratingScore(result);
    return result;
  }
  function validateState(data) {
    if (!data || data.version !== 1) throw new Error('This is not a supported PizzaScan backup.');
    const d = defaultState();
    d.want = C.importPlaces(data.want);
    d.visited = C.importPlaces(data.visited);
    if (!Array.isArray(data.ratings) || data.ratings.length > 5000 || !Array.isArray(data.crawls) || data.crawls.length > 200) throw new Error('Invalid ratings or crawls in backup.');
    d.ratings = data.ratings.map(validateRating);
    d.crawls = data.crawls.map(c => {
      const stops = C.importPlaces(c.stops);
      if (stops.length < 1 || stops.length > 3) throw new Error('A crawl must have 1–3 stops.');
      return {id:String(c.id).slice(0,120),name:String(c.name || 'Pizza crawl').slice(0,100),stops,
        mode: ['walking','bicycling','driving','transit'].includes(c.mode) ? c.mode : 'walking',
        origin: c.origin && C.coords(c.origin.lat,c.origin.lng) ? {lat:c.origin.lat,lng:c.origin.lng} : null};
    });
    if (data.profile && typeof data.profile === 'object') {
      d.profile.name = String(data.profile.name || 'Pizza Explorer').slice(0,80);
      d.profile.favoriteStyle = String(data.profile.favoriteStyle || 'neapolitan').slice(0,50);
      d.profile.favoriteToppings = Array.isArray(data.profile.favoriteToppings) ? data.profile.favoriteToppings.map(t=>String(t).slice(0,60)).slice(0,20) : [];
      if (Number.isFinite(Date.parse(data.profile.joinDate))) d.profile.joinDate = new Date(data.profile.joinDate).toISOString();
    }
    d.dark = data.dark === true; d.welcomed = data.welcomed === true;
    d.navigation = ['walking','bicycling','driving','transit'].includes(data.navigation) ? data.navigation : 'walking';
    if (data.map && C.coords(data.map.lat,data.map.lng) && Number.isFinite(data.map.zoom)) d.map = {lat:data.map.lat,lng:data.map.lng,zoom:Math.max(3,Math.min(19,data.map.zoom))};
    return d;
  }
  let state = defaultState();
  try { const raw = localStorage.getItem(KEY); if (raw) state = validateState(JSON.parse(raw)); }
  catch { notify('Saved data could not be read. You can restore a JSON backup in My Ratings.', 'error', 0); }
  function commit(next) {
    try { localStorage.setItem(KEY, JSON.stringify(next)); state = next; return true; }
    catch { notify('Storage is full or unavailable. Your change could not be saved. Export a backup before freeing space.', 'error', 0); return false; }
  }
  function native(message) {
    if (!window.PizzaScanNative?.postMessage) return false;
    try { window.PizzaScanNative.postMessage(JSON.stringify(message)); return true; }
    catch { notify('The Android action could not start.', 'error'); return false; }
  }
  function openExternal(url) {
    if (!/^(https?:|tel:|geo:)/.test(url)) return;
    if (!native({type:'open',url})) window.open(url, '_blank', 'noopener,noreferrer');
  }
  function exportJSON(data, name) {
    const value = JSON.stringify(data, null, 2);
    if (native({type:'save',text:value,name})) return;
    const url = URL.createObjectURL(new Blob([value],{type:'application/json'}));
    const a = document.createElement('a'); a.href=url; a.download=name; document.body.append(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 30000);
  }
  async function share(value) {
    if (native({type:'share',text:value})) return;
    try {
      if (navigator.share) await navigator.share({text:value});
      else { await navigator.clipboard.writeText(value); notify('Copied to clipboard.'); }
    } catch (e) { if (e.name !== 'AbortError') notify('Sharing is unavailable. Please try again.', 'error'); }
  }
  function menu(open) {
    $('control-panel').classList.toggle('minimized', !open);
    $('dock-menu').setAttribute('aria-expanded',String(open));
    $('modal-backdrop').hidden = !open;
    if (open) $('filter-controls').classList.add('collapsed');
  }
  function closePanels() {
    document.querySelectorAll('.panel-modal').forEach(p => { p.style.display='none'; });
    $('rating-popup-overlay').style.display='none';
    $('social-share-overlay').style.display='none';
    menu(false);
    priorFocus?.focus?.();
  }
  function panel(id) {
    priorFocus = document.activeElement;
    closePanels();
    const p = $(id); if (!p) return;
    p.style.display='flex';
    $('filter-controls').classList.add('collapsed');
    $('modal-backdrop').hidden=false;
    p.querySelector('.modal-content')?.scrollTo(0,0);
    p.querySelector('button')?.focus();
  }
  document.querySelectorAll('.panel-modal .close-button').forEach(b=>b.addEventListener('click',closePanels));
  on('modal-backdrop','click',closePanels);
  on('panel-toggle-btn','click',()=>menu(false));
  on('dock-menu','click',()=>{ const open=$('control-panel').classList.contains('minimized'); closePanels(); menu(open); });
  on('collapse-filters','click',()=>{
    const collapsed=$('filter-controls').classList.toggle('collapsed');
    $('collapse-filters').setAttribute('aria-expanded',String(!collapsed));
    $('collapse-filters').innerHTML=`<i class="fas fa-chevron-${collapsed?'down':'up'}"></i>`;
  });
  function applyTheme() {
    document.body.classList.toggle('dark-mode',state.dark);
    $('theme-toggle').innerHTML=`<i class="fas fa-${state.dark?'sun':'moon'}"></i>`;
    $('theme-toggle').setAttribute('aria-label',state.dark?'Use light theme':'Use dark theme');
  }
  applyTheme();
  on('theme-toggle','click',()=>{ if(commit({...state,dark:!state.dark})) applyTheme(); });
  $('navigation-mode').value=state.navigation;
  on('navigation-mode','change',()=>commit({...state,navigation:$('navigation-mode').value}));
  if (!window.L) { notify('The map library could not load. Reinstall this APK or update Android System WebView.', 'error',0); return; }
  const map=L.map('map',{zoomControl:false,minZoom:3,maxZoom:19}).setView([state.map.lat,state.map.lng],state.map.zoom);
  L.control.zoom({position:'bottomright'}).addTo(map);
  const tile=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19, attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
  }).addTo(map);
  let lastTileNotice=0;
  tile.on('tileerror',()=>{ if(Date.now()-lastTileNotice>60000) { lastTileNotice=Date.now(); notify('Some map tiles could not load. Check your connection; saved places remain available.','error'); } });
  let places=[], markers=new Map(), userLocation=null, userMarker=null, routeLine=null, currentCrawl=null;
  let requestController=null, requestSerial=0, fetchTimer, lastQuery='', lastQueryAt=0, searchBusy=false;
  try {
    const cache=JSON.parse(localStorage.getItem(CACHE));
    if(cache && Array.isArray(cache.places)) places=C.importPlaces(cache.places);
  } catch { /* A corrupt map cache never blocks the local app. */ }
  const types={pizzeria:'Pizzeria',cafe:'Cafe',fast_food:'Fast food',food_truck:'Food truck',vending_pizza:'Pizza vending machine',other:'Pizza place'};
  const emojis={pizzeria:'🍕',cafe:'☕',fast_food:'🍟',food_truck:'🚚',vending_pizza:'🏧',other:'🍕'};
  const average = id => { const r=state.ratings.filter(r=>r.place.placeId===id); return r.length?r.reduce((a,r)=>a+r.score,0)/r.length:null; };
  function findPlace(id) { return [...places,...state.want,...state.visited,...state.ratings.map(r=>r.place),...(currentCrawl?.stops||[])].find(p=>p.placeId===id); }
  const has = (list,id) => state[list].some(p=>p.placeId===id);
  function markerIcon(p) {
    const visited=has('visited',p.placeId),saved=has('want',p.placeId);
    return L.divIcon({className:'',html:`<div class="pizza-marker ${visited?'visited':saved?'saved':''}"><span>${visited?'✓':saved?'⭐':emojis[p.type]||'🍕'}</span></div>`,iconSize:[36,36],iconAnchor:[18,36],popupAnchor:[0,-34]});
  }
  function action(label, name, id, className='') {
    return `<button class="${className}" data-action="${name}" data-id="${C.esc(id)}">${label}</button>`;
  }
  function placeActions(p, popup=false) {
    return `<div class="place-actions">${popup?'':action('Map','map',p.placeId)}${action(has('want',p.placeId)?'★ Saved':'☆ Save', 'save',p.placeId)}${action(has('visited',p.placeId)?'✓ Visited':'Mark visited','visit',p.placeId)}${action('Rate','rate',p.placeId)}${action('Directions','navigate',p.placeId)}${action('Share','share',p.placeId)}</div>`;
  }
  function popup(p) {
    const score=average(p.placeId),site=C.website(p.website);
    const hours=p.openingHours==='24/7'?'Listed as 24/7':p.openingHours?`Opening hours: ${C.esc(p.openingHours)}`:'Opening hours unknown';
    return `<div class="popup-content"><h3>${C.esc(p.name)}</h3><p>${C.esc(types[p.type]||p.type)}</p><p>${C.esc(p.address)}</p><p>${hours}</p><p class="muted">Check current opening hours with the venue.</p>${site?`<p><a data-external="${C.esc(site)}" href="${C.esc(site)}">Website ↗</a></p>`:''}${p.phone?`<p><a href="tel:${C.esc(p.phone.replace(/[^+\d*#(), -]/g,''))}" data-external="tel:${C.esc(p.phone.replace(/[^+\d*#(), -]/g,''))}">${C.esc(p.phone)}</a></p>`:''}<p>${score===null?'No personal rating':`My rating: ${score.toFixed(1)}/10`}</p>${placeActions(p,true)}</div>`;
  }
  function renderMarkers() {
    markers.forEach(m=>map.removeLayer(m)); markers.clear();
    const enabled=new Set([...document.querySelectorAll('.filter-checkbox:checked')].map(c=>c.dataset.type));
    const combined=new Map();
    if($('saved-spots-checkbox').checked) for(const p of places) {
      if(!enabled.has(p.type in types?p.type:'other')) continue;
      if(!$('show-closed-checkbox').checked && /^(off|closed)$/i.test(p.openingHours.trim())) continue;
      if(has('visited',p.placeId) && !$('show-visited-checkbox').checked) continue;
      combined.set(p.placeId,p);
    }
    if($('want-to-visit-checkbox').checked) state.want.forEach(p=>combined.set(p.placeId,p));
    if($('show-visited-checkbox').checked) state.visited.forEach(p=>combined.set(p.placeId,p));
    for(const p of combined.values()) {
      const m=L.marker([p.lat,p.lng],{icon:markerIcon(p),title:p.name}).bindPopup(()=>popup(p),{maxWidth:290}).addTo(map);
      markers.set(p.placeId,m);
    }
  }
  document.querySelectorAll('#filter-controls input').forEach(i=>i.addEventListener('change',renderMarkers));
  function cards(list, empty='No places found here yet.') {
    return list.length ? list.map(p=>`<article class="place-card"><h3>${C.esc(p.name)}</h3><p class="place-meta">${C.esc(types[p.type]||p.type)} · ${C.distance(userLocation||map.getCenter(),p).toFixed(2)} km straight line</p>${placeActions(p)}</article>`).join('') : `<p class="empty-state">${C.esc(empty)}</p>`;
  }
  function renderList(list) { $(list==='want'?'want-to-visit-list':'visited-places-list').innerHTML=cards(state[list],list==='want'?'Save a pizza place from the map to find it here.':'Mark a pizza place as visited to find it here.'); }
  function togglePlace(list,p) {
    const existed=has(list,p.placeId);
    const entries=existed?state[list].filter(x=>x.placeId!==p.placeId):[...state[list],{...p,[list==='visited'?'visitedAt':'addedAt']:new Date().toISOString()}];
    if(entries.length>5000) { notify('This list has reached 5,000 places.','error'); return; }
    if(commit({...state,[list]:entries})) { renderMarkers(); renderList(list); updateStats(); notify(existed?'Place removed.':list==='want'?'Place saved on this device.':'Visit saved on this device.'); }
  }
  async function fetchPlaces(force=false) {
    if(map.getZoom()<12) { requestController?.abort(); requestSerial++; notify('Zoom in to search for pizza places.'); return; }
    const b=map.getBounds();
    if(b.getEast()-b.getWest()>2 || b.getNorth()-b.getSouth()>2) { notify('Zoom in to a smaller area.'); return; }
    const bbox=[b.getSouth(),b.getWest(),b.getNorth(),b.getEast()].map(x=>x.toFixed(5)).join(',');
    if(!force && bbox===lastQuery && Date.now()-lastQueryAt<20000) return;
    lastQuery=bbox; lastQueryAt=Date.now();
    requestController?.abort(); requestController=new AbortController();
    const own=requestController, serial=++requestSerial;
    const timeout=setTimeout(()=>own.abort(),30000);
    notify('Finding pizza places in this area…','loading',0);
    const query=`[out:json][timeout:25];(nwr["cuisine"~"pizza|pizzeria",i](${bbox});nwr["vending"~"pizza",i](${bbox});nwr["vending:pizza"="yes"](${bbox});nwr["amenity"~"restaurant|fast_food|cafe|food_truck|bar|pub"]["name"~"pizza|pizzeria|pizze",i](${bbox}););out center tags;`;
    try {
      const response=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',body:new URLSearchParams({data:query}),signal:own.signal});
      if(!response.ok) throw new Error(response.status===429?'The map service is busy. Wait briefly and refresh.':`Map service error (${response.status}).`);
      const data=await response.json();
      if(data.remark) throw new Error('The map service could not complete the search. Zoom in or retry.');
      const result=C.fromOverpass(data.elements);
      if(serial!==requestSerial) return;
      places=result; renderMarkers();
      try { localStorage.setItem(CACHE,JSON.stringify({places:places.slice(0,3000),updatedAt:new Date().toISOString()})); } catch { /* cache is optional */ }
      notify(result.length?`${result.length} pizza places loaded from OpenStreetMap.`:'No pizza places mapped here. Try another area.');
      if($('ai-results-area').style.display==='flex') $('discovery-results').innerHTML=cards(places);
    } catch(e) {
      if(serial!==requestSerial) return;
      lastQueryAt=0;
      notify(e.name==='AbortError'?'Search timed out. Try a smaller map area.':navigator.onLine?e.message+' Previously loaded and saved places remain available.':'Offline. Previously loaded and saved places remain available.','error');
    } finally { clearTimeout(timeout); }
  }
  function scheduleFetch() { clearTimeout(fetchTimer); fetchTimer=setTimeout(()=>fetchPlaces(),750); }
  map.on('moveend',()=>{
    const center=map.getCenter();
    commit({...state,map:{lat:center.lat,lng:center.lng,zoom:map.getZoom()}});
    scheduleFetch();
  });
  async function search() {
    const query=$('map-search-input').value.trim();
    if(!query) { notify('Enter a place, city or address to search.','error'); $('map-search-input').focus(); return; }
    if(searchBusy) return;
    searchBusy=true; $('map-search-btn').disabled=true;
    const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),15000);
    notify(`Searching for “${query}”…`,'loading',0);
    try {
      const url=new URL('https://nominatim.openstreetmap.org/search');
      url.search=new URLSearchParams({format:'jsonv2',q:query,limit:'5'});
      const response=await fetch(url,{signal:controller.signal});
      if(!response.ok) throw new Error('The address service is unavailable. Try again later.');
      const results=await response.json();
      if(!Array.isArray(results) || !results.length) { notify('No address found. Try adding a city or country.'); return; }
      const p=results[0],lat=Number(p.lat),lng=Number(p.lon);
      if(!C.coords(lat,lng)) throw new Error('The address service returned invalid coordinates.');
      $('map-search-input').blur(); $('searchbar-suggestions').style.display='none';
      map.setView([lat,lng],15); scheduleFetch(); notify('Address found. Loading nearby pizza places.');
    } catch(e) { notify(e.name==='AbortError'?'Address search timed out. Try again.':e.message,'error'); }
    finally { clearTimeout(timeout); searchBusy=false; $('map-search-btn').disabled=false; }
  }
  on('map-search-btn','click',search);
  on('map-search-input','keydown',e=>{ if(e.key==='Enter') search(); });
  on('map-search-input','input',()=>{
    const q=$('map-search-input').value.trim().toLowerCase(), el=$('searchbar-suggestions');
    if(q.length<2) { el.style.display='none'; return; }
    const matches=places.filter(p=>p.name.toLowerCase().includes(q)).slice(0,5);
    el.innerHTML=matches.map(p=>action(C.esc(p.name),'map',p.placeId)).join('');
    el.style.display=matches.length?'block':'none';
  });
  function location() {
    closePanels();
    if(!navigator.geolocation) { notify('Location is unavailable. Search for your city instead.','error'); return; }
    notify('Finding your location…','loading',0);
    navigator.geolocation.getCurrentPosition(p=>{
      userLocation={lat:p.coords.latitude,lng:p.coords.longitude};
      if(!C.coords(userLocation.lat,userLocation.lng)) { notify('Invalid GPS coordinates.','error'); return; }
      if(userMarker) map.removeLayer(userMarker);
      userMarker=L.circleMarker([userLocation.lat,userLocation.lng],{radius:9,color:'#fff',weight:3,fillColor:'#167fdf',fillOpacity:1}).addTo(map).bindPopup('Your location');
      map.setView([userLocation.lat,userLocation.lng],14); scheduleFetch();
      notify(`Location found (accuracy about ${Math.round(p.coords.accuracy)} m).`);
    },e=>{
      notify(e.code===1?'Location permission was denied. You can search by city or retry Location.':'Location unavailable. Enable GPS or search by city.','error');
      scheduleFetch();
    },{enableHighAccuracy:true,timeout:12000,maximumAge:60000});
  }
  on('location-button','click',location); on('dock-location','click',location);
  on('refresh-button','click',()=>{closePanels();fetchPlaces(true);});
  on('dock-explore','click',()=>{closePanels();fetchPlaces(true);});
  on('dock-saved','click',()=>{renderList('want');panel('want-to-visit-area');});
  const panels={'want-to-visit-button':'want-to-visit-area','visited-places-button':'visited-places-area',
    'ai-search-button':'ai-results-area','ai-recommendation-button':'ai-recommendation-area',
    'pizza-crawl-button':'pizza-crawl-area','photo-analyzer-button':'photo-analyzer-area',
    'trend-insights-button':'trend-insights-area','saved-spots-button':'saved-spots-area',
    'ratings-database-button':'ratings-database-area','achievements-button':'achievements-area',
    'leaderboard-button':'leaderboard-area','profile-button':'profile-area'};
  Object.entries(panels).forEach(([button,id])=>on(button,'click',()=>{
    renderList('want'); renderList('visited'); renderRatings(); updateStats(); renderCrawls();
    $('discovery-results').innerHTML=cards(places);
    $('area-summary').innerHTML=Object.entries(types).map(([type,name])=>`<div class="place-card">${C.esc(name)} <strong>${places.filter(p=>p.type===type).length}</strong></div>`).join('');
    panel(id);
  }));
  document.addEventListener('click',e=>{
    const link=e.target.closest('[data-external]');
    if(link) {e.preventDefault();openExternal(link.dataset.external);return;}
    const b=e.target.closest('[data-action]'); if(!b) return;
    const p=findPlace(b.dataset.id);
    if(p) switch(b.dataset.action) {
      case 'map': closePanels();$('searchbar-suggestions').style.display='none';map.setView([p.lat,p.lng],16);renderMarkers();markers.get(p.placeId)?.openPopup();break;
      case 'save': togglePlace('want',p);break;
      case 'visit': togglePlace('visited',p);break;
      case 'rate': openRating(p);break;
      case 'navigate': openExternal(C.directions([p],state.navigation,userLocation));break;
      case 'share': share(`${p.name}\nhttps://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=17/${p.lat}/${p.lng}`);break;
    }
    if(b.dataset.action==='delete-rating') {
      if(confirm('Delete this local rating?') && commit({...state,ratings:state.ratings.filter(r=>r.id!==b.dataset.id)})) {renderRatings();renderMarkers();updateStats();}
    }
    if(b.dataset.action.startsWith('crawl-')) {
      const c=state.crawls.find(c=>c.id===b.dataset.id); if(!c) return;
      if(b.dataset.action==='crawl-export') exportJSON(c,'pizzascan-crawl.json');
      if(b.dataset.action==='crawl-go') openExternal(C.directions(c.stops,c.mode,c.origin));
      if(b.dataset.action==='crawl-delete' && confirm('Delete this saved crawl?') && commit({...state,crawls:state.crawls.filter(x=>x.id!==c.id)})) renderCrawls();
    }
  });
  let ratingPlace=null;
  function sliders() {
    $('pizza-weight').value=100-Number($('restaurant-weight').value);
    document.querySelectorAll('#rating-form input[type="range"]').forEach(i=>{ const span=i.parentElement.querySelector('.rating-value');if(span) span.textContent=i.value+(i.id.endsWith('weight')?'%':''); });
  }
  function openRating(p) {
    closePanels(); ratingPlace=p; $('rating-form').reset(); sliders();
    text('rating-place-name',p.name); $('rating-place-id').value=p.placeId;$('rating-lat').value=p.lat;$('rating-lng').value=p.lng;
    $('rating-popup-overlay').style.display='flex';$('rating-popup-content').scrollTop=0;
  }
  document.querySelectorAll('#rating-form input[type="range"]').forEach(i=>i.addEventListener('input',sliders));
  on('close-rating','click',closePanels);
  on('rating-popup-overlay','click',e=>{if(e.target===$('rating-popup-overlay')) closePanels();});
  on('rating-form','submit',e=>{
    e.preventDefault(); if(!ratingPlace) return;
    const r={id:crypto.randomUUID(),place:ratingPlace,createdAt:new Date().toISOString(),firstBite:Number($('first-bite').value),restaurantWeight:Number($('restaurant-weight').value),comment:$('comment').value.slice(0,2000)};
    ratingFields.forEach(k=>{r[k]=Number($(k).value);});r.score=C.ratingScore(r);
    if(state.ratings.length>=5000) {notify('The rating limit has been reached. Export a backup before deleting old ratings.','error');return;}
    if(commit({...state,ratings:[...state.ratings,validateRating(r)]})) {closePanels();renderMarkers();updateStats();notify(`Rating saved: ${r.score.toFixed(1)}/10.`);}
  });
  function renderRatings() {
    const q=$('rating-search-input').value.trim().toLowerCase(), sort=$('rating-sort-select').value;
    const list=state.ratings.filter(r=>(r.place.name+' '+r.comment).toLowerCase().includes(q)).slice();
    list.sort((a,b)=> sort.startsWith('rating')?(a.score-b.score)*(sort.endsWith('desc')?-1:1):sort.startsWith('name')?a.place.name.localeCompare(b.place.name)*(sort.endsWith('desc')?-1:1):(Date.parse(a.createdAt)-Date.parse(b.createdAt))*(sort.endsWith('desc')?-1:1));
    const card=r=>`<article class="rating-card"><h3>${C.esc(r.place.name)} · ${r.score.toFixed(1)}/10</h3><p class="muted">First bite: ${r.firstBite}/10 · ${new Date(r.createdAt).toLocaleDateString()}</p><p>${C.esc(r.comment)}</p><div class="place-actions">${action('Map','map',r.place.placeId)}${action('Delete','delete-rating',r.id)}</div></article>`;
    $('ratings-table').innerHTML=list.length?list.map(card).join(''):'<p class="empty-state">No matching ratings.</p>';
    const grouped=new Map();state.ratings.forEach(r=>grouped.set(r.place.placeId,r.place));
    const top=[...grouped.values()].sort((a,b)=>average(b.placeId)-average(a.placeId)).slice(0,5);
    $('top-rated-table').innerHTML=top.length?top.map(p=>`<p class="place-card">${C.esc(p.name)} · <strong>${average(p.placeId).toFixed(1)}/10</strong></p>`).join(''):'<p class="empty-state">No ratings yet. Open a place and tap Rate.</p>';
  }
  on('rating-search-input','input',renderRatings);on('rating-search-btn','click',renderRatings);on('rating-sort-select','change',renderRatings);
  const achievements=[
    {name:'First slice',text:'Visit your first pizza place',points:10,test:s=>s.visited.length>=1},
    {name:'Pizza explorer',text:'Visit 5 pizza places',points:25,test:s=>s.visited.length>=5},
    {name:'Pizza connoisseur',text:'Visit 20 pizza places',points:50,test:s=>s.visited.length>=20},
    {name:'First impression',text:'Save your first rating',points:15,test:s=>s.ratings.length>=1},
    {name:'Pizza critic',text:'Save 10 ratings',points:30,test:s=>s.ratings.length>=10},
    {name:'Wish list',text:'Save 5 places to visit',points:15,test:s=>s.want.length>=5}
  ];
  function updateStats() {
    const unlocked=achievements.filter(a=>a.test(state)),points=unlocked.reduce((n,a)=>n+a.points,0);
    text('total-visited-count',state.visited.length);text('total-ratings-count',state.ratings.length);text('achievement-points',points);
    text('profile-visited',state.visited.length);text('profile-ratings',state.ratings.length);text('profile-achievements',unlocked.length);
    text('profile-username',state.profile.name);text('profile-join-date','Local profile since '+new Date(state.profile.joinDate).toLocaleDateString());
    text('profile-rank',state.visited.length>=20?'Pizza Connoisseur':state.visited.length>=5?'Pizza Explorer':'Pizza Newbie');
    $('profile-avatar').textContent='🍕';
    $('achievements-list').innerHTML=achievements.map(a=>`<article class="achievement-card ${a.test(state)?'':'locked'}"><strong>${a.test(state)?'🏆':'🔒'} ${C.esc(a.name)}</strong><p>${C.esc(a.text)} · ${a.points} points</p></article>`).join('');
    $('leaderboard-container').innerHTML=`<div class="stats-grid"><div class="stat-card"><strong>${state.visited.length}</strong><p>Visits</p></div><div class="stat-card"><strong>${state.ratings.length}</strong><p>Ratings</p></div><div class="stat-card"><strong>${points}</strong><p>Points</p></div></div>`;
    $('favorite-style').value=state.profile.favoriteStyle;
    [...$('favorite-toppings').options].forEach(o=>{o.selected=state.profile.favoriteToppings.includes(o.value);});
  }
  on('save-preferences','click',()=>{if(commit({...state,profile:{...state.profile,favoriteStyle:$('favorite-style').value,favoriteToppings:[...$('favorite-toppings').selectedOptions].map(o=>o.value)}})) notify('Preferences saved on this device.');});
  on('generate-recommendations','click',()=>{
    const origin=userLocation||map.getCenter(),max=Number($('distance-preference').value);
    const list=places.filter(p=>C.distance(origin,p)<=max).sort((a,b)=>C.distance(origin,a)-C.distance(origin,b)).slice(0,10);
    $('recommendations-results').innerHTML=cards(list,'No loaded places within this distance. Move or refresh the map.');
  });
  on('generate-crawl','click',()=>{
    const origin=userLocation||map.getCenter(),stops=Number($('crawl-stops').value),mode=$('crawl-transport').value;
    const focus=$('crawl-focus').value;
    let available=places.filter(p=>C.distance(origin,p)<=10);
    if(focus==='ratings') available=available.filter(p=>average(p.placeId)!==null).sort((a,b)=>average(b.placeId)-average(a.placeId)).slice(0,stops);
    if(available.length<stops) {notify(focus==='ratings'?'Not enough personally rated places within 10 km. Choose Nearby stops.':'Not enough loaded places within 10 km. Refresh the map or choose fewer stops.','error');return;}
    if(mode==='transit') {notify('For public transit, open Directions for each stop. Multi-stop transit links are not supported.');return;}
    const selected=C.crawl(origin,available,stops);
    currentCrawl={id:crypto.randomUUID(),name:'Pizza crawl · '+new Date().toLocaleDateString(),stops:selected,mode,origin:{lat:origin.lat,lng:origin.lng}};
    if(routeLine) map.removeLayer(routeLine);
    routeLine=L.polyline([origin,...selected].map(p=>[p.lat,p.lng]),{color:'#ff4b2b',weight:4,dashArray:'8 8'}).addTo(map);
    $('crawl-results').innerHTML='<p class="feature-description">Dashed lines show the stop order only. Open Navigation for actual roads and travel times.</p>'+selected.map((p,i)=>`<div class="place-card"><h3>${i+1}. ${C.esc(p.name)}</h3><p>${C.distance(origin,p).toFixed(2)} km straight line from start</p>${placeActions(p)}</div>`).join('');
    $('crawl-actions').style.display='flex';
  });
  on('save-crawl','click',()=>{if(!currentCrawl)return;const name=prompt('Name your pizza crawl:',currentCrawl.name);if(!name?.trim())return;
    if(state.crawls.length>=200) {notify('Up to 200 crawls can be saved. Export or delete an older crawl.','error');return;}
    if(commit({...state,crawls:[...state.crawls.filter(c=>c.id!==currentCrawl.id),{...currentCrawl,name:name.trim().slice(0,100)}]})) notify('Crawl saved. Find it under Saved Crawls.');
  });
  on('share-crawl','click',()=>{if(currentCrawl)openExternal(C.directions(currentCrawl.stops,currentCrawl.mode,currentCrawl.origin));});
  function renderCrawls() {
    $('saved-spots-list').innerHTML=state.crawls.length?state.crawls.map(c=>`<article class="crawl-card"><h3>${C.esc(c.name)}</h3><p>${c.stops.map(p=>C.esc(p.name)).join(' → ')}</p><div class="place-actions">${action('Navigate','crawl-go',c.id)}${action('Export JSON','crawl-export',c.id)}${action('Delete','crawl-delete',c.id)}</div></article>`).join(''):'<p class="empty-state">No saved crawls. Create one in the Pizza Crawl Planner.</p>';
  }
  async function importList(input,list) {
    const file=input.files?.[0];if(!file)return;
    try {
      if(file.size>2*1024*1024)throw new Error('Choose a JSON file smaller than 2 MB.');
      const imported=C.importPlaces(JSON.parse(await file.text()));
      const merged=C.importPlaces([...state[list],...imported]);
      if(commit({...state,[list]:merged})) {renderList(list);renderMarkers();updateStats();notify(`${imported.length} places imported. Existing places were retained.`);}
    } catch(e) {notify('Import failed: '+e.message,'error');} finally {input.value='';}
  }
  for(const [list,exportId,importId,inputId,sortId] of [
    ['want','export-json-button','import-json-button','import-json-input','sort-distance-button'],
    ['visited','export-visited-json-button','import-visited-json-button','import-visited-json-input','sort-visited-distance-button']]) {
    on(exportId,'click',()=>exportJSON(state[list],`pizzascan-${list}.json`));
    on(importId,'click',()=>$(inputId).click());on(inputId,'change',()=>importList($(inputId),list));
    on(sortId,'click',()=>{const origin=userLocation||map.getCenter();if(commit({...state,[list]:[...state[list]].sort((a,b)=>C.distance(origin,a)-C.distance(origin,b))}))renderList(list);});
  }
  on('backup-all','click',()=>exportJSON(state,'pizzascan-backup.json'));
  on('restore-all','click',()=>$('backup-input').click());
  on('backup-input','change',async()=>{
    const input=$('backup-input'),file=input.files?.[0];if(!file)return;
    try {
      if(file.size>3*1024*1024)throw new Error('Backup must be smaller than 3 MB.');
      const restored=validateState(JSON.parse(await file.text()));
      if(confirm('Replace this device’s saved places, ratings, crawls and preferences with this backup?')&&commit(restored)) {
        applyTheme();renderMarkers();renderRatings();updateStats();$('navigation-mode').value=state.navigation;
        notify('Backup restored.');
      }
    }catch(e){notify('Restore failed: '+e.message,'error');}finally{input.value='';}
  });
  function showPhoto(file) {
    if(!file)return;
    if(!file.type.startsWith('image/')||file.size>20*1024*1024){notify('Choose an image smaller than 20 MB.','error');return;}
    if(photoUrl)URL.revokeObjectURL(photoUrl);
    photoUrl=URL.createObjectURL(file);$('preview-image').src=photoUrl;$('photo-preview').style.display='block';
    $('analysis-results').style.display='block';text('analysis-results','Photo preview only. AI image analysis is not connected. No photo has been uploaded.');
  }
  on('drop-zone','click',()=>{$('photo-upload').removeAttribute('capture');$('photo-upload').click();});
  on('take-photo','click',()=>{$('photo-upload').setAttribute('capture','environment');$('photo-upload').click();});
  on('photo-upload','change',()=>showPhoto($('photo-upload').files?.[0]));
  on('drop-zone','dragover',e=>e.preventDefault());on('drop-zone','drop',e=>{e.preventDefault();showPhoto(e.dataTransfer.files?.[0]);});
  function finishWelcome(useLocation) {
    if(!commit({...state,welcomed:true}))return;
    $('settings-popup-overlay').style.display='none';
    if(useLocation) location();else scheduleFetch();
  }
  on('allow-location','click',()=>finishWelcome(true));on('deny-location','click',()=>finishWelcome(false));on('close-settings','click',()=>finishWelcome(false));
  on('privacy-button','click',()=>alert('PizzaScan 1.0.0\n\nSaved places, ratings, preferences and crawls are stored on this device. Exported files go to a location you choose. Photos are displayed locally and are not uploaded.\n\nOpenStreetMap receives map tile requests. Overpass receives the visible map bounds. Nominatim receives submitted address searches (no remote autocomplete). These services also receive your IP address. GPS is optional and used only after you tap Allow Location or Location.\n\nDirections open Google Maps/the installed navigation app. Websites, sharing and navigation use the selected external service. There is no WebSim login, analytics, advertisement SDK, connected AI service or community backend in this version.\n\nOpenStreetMap data: © OpenStreetMap contributors, ODbL. https://osmfoundation.org/wiki/Privacy_Policy'));
  function back() {
    if($('settings-popup-overlay').style.display==='flex'){finishWelcome(false);return true;}
    if($('rating-popup-overlay').style.display==='flex'||[...document.querySelectorAll('.panel-modal')].some(p=>p.style.display==='flex')||!$('control-panel').classList.contains('minimized')){closePanels();return true;}
    if($('searchbar-suggestions').style.display==='block'){$('searchbar-suggestions').style.display='none';return true;}
    if(!$('filter-controls').classList.contains('collapsed')){$('filter-controls').classList.add('collapsed');return true;}
    if(map._popup){map.closePopup();return true;}
    if(routeLine){map.removeLayer(routeLine);routeLine=null;return true;}
    return false;
  }
  document.addEventListener('keydown',e=>{if(e.key==='Escape')back();});
  window.addEventListener('offline',()=>notify('Offline. Saved places and ratings remain available.','info',0));
  window.addEventListener('online',()=>{notify('Connection restored.');fetchPlaces(true);});
  window.addEventListener('resize',()=>map.invalidateSize());
  // Small public interface for Android back handling and diagnostics.
  window.PizzaScan={back,ready:true,version:'1.0.0',diagnostics:()=>({places:places.length,saved:state.want.length,visited:state.visited.length,ratings:state.ratings.length,native:!!window.PizzaScanNative}),refresh:()=>fetchPlaces(true)};
  closePanels();renderMarkers();renderList('want');renderList('visited');renderRatings();updateStats();renderCrawls();sliders();
  $('loading-overlay').style.display='none';
  $('settings-popup-overlay').style.display=state.welcomed?'none':'flex';
  if(state.welcomed)scheduleFetch();
});
