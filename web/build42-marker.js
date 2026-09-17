/* Build 42 marker semantics: generic food venue != Italian candidate != confirmed pizza. */
(function(root){
 'use strict';
 try{
  if(typeof drawMarkers!=='function'||typeof L==='undefined'||typeof PlaceData==='undefined')return;
  const original=drawMarkers;
  drawMarkers=function(){
   if(!markers)return;
   markers.clearLayers();
   const visited=new Set(reports.filter(r=>r.visited&&r.place).map(r=>r.place.placeId));
   for(const p of visiblePlaces()){
    const h=Hours.status(p),isSaved=saved.some(x=>x.placeId===p.placeId);
    const markerEmoji=p.pizzaEvidence==='possible'?'🍝':(PlaceData.TYPES[p.type]?.emoji||'🍕');
    const icon=L.divIcon({className:'emoji-marker '+h.state,html:`<span>${markerEmoji}</span>${isSaved?'<b>⭐</b>':visited.has(p.placeId)?'<b>✓</b>':''}`,iconSize:[38,42],iconAnchor:[19,36],popupAnchor:[0,-30]});
    const content=document.createElement('div');
    content.className='venue-popup';
    content.innerHTML=`<strong translate="no">${esc(p.name)}</strong><p>${esc(p.address||PlaceData.TYPES[p.type]?.name||'Gastro-Ort')}</p>${statusBadge(p)}<small>${esc(h.note)}</small><div class="card-actions"><button data-action="place" data-id="${esc(p.placeId)}">Details ansehen</button><button data-action="directions" data-id="${esc(p.placeId)}">Route</button></div>`;
    L.marker([p.lat,p.lng],{icon,title:p.name,alt:p.name}).addTo(markers).bindPopup(content,{maxWidth:290});
   }
  };
  drawMarkers.__build42=true;
  drawMarkers.__inner=original;
 }catch(error){console.warn('PizzaScan Build 42 marker semantics unavailable',error);}
})(typeof window!=='undefined'?window:globalThis);
