(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'),require('./review-builder.js'));else root.PizzaDrafts=factory(root.PizzaCore,root.PizzaReview);})(typeof globalThis!=='undefined'?globalThis:this,function(C,R){
 'use strict';
 function entry(value){
  if(!value||typeof value!=='object'||!value.state||typeof value.state!=='object'||Array.isArray(value.state))throw Error('Der Entwurf enthält keine gültigen Bausteine.');
  const p=value.place;
  if(!p||typeof p.placeId!=='string'||!p.placeId||p.placeId.length>120||['__proto__','prototype','constructor'].includes(p.placeId))throw Error('Die Restaurantzuordnung ist ungültig.');
  let checked;try{checked=C.place(p);}catch{throw Error('Name oder Koordinaten des Restaurants sind ungültig.');}
  const own=value.state.own;if(own!==null&&own!==undefined&&(!Number.isFinite(own)||own<.1||own>10))throw Error('Die Gesamtbewertung muss zwischen 0,1 und 10,0 liegen.');
  if(typeof value.text!=='string'||value.text.length>4000)throw Error('Der Rezensionstext fehlt oder ist länger als 4000 Zeichen.');
  if(typeof value.state.notes==='string'&&value.state.notes.length>1500)throw Error('Die eigene Ergänzung ist zu lang.');
  if(typeof value.state.dish==='string'&&value.state.dish.length>100)throw Error('Die Bestellungsbeschreibung ist zu lang.');
  const state=R.normalize(value.state),manual=value.manual===true;
  return {place:{placeId:checked.placeId,name:checked.name,lat:checked.lat,lng:checked.lng,address:checked.address,type:checked.type},state,manual,text:manual?value.text:R.generate(state),updatedAt:typeof value.updatedAt==='string'&&Number.isFinite(Date.parse(value.updatedAt))?new Date(value.updatedAt).toISOString():''};
 }
 function hasContent(value){const s=R.normalize(value.state);return s.own!==null||!!s.notes.trim()||!!s.dish.trim()||!!s.returnVisit||Object.keys(s.selected).length>0||value.manual===true&&!!value.text?.trim();}
 function backup(value){return {format:'pizzascan-review',version:1,draft:entry(value)};}
 function restore(value){if(!value||value.format!=='pizzascan-review'||value.version!==1)throw Error('Bitte einen mit PizzaScan exportierten Rezensionsentwurf auswählen.');const d=entry(value.draft);if(!hasContent(d))throw Error('Die Datei enthält einen leeren Entwurf.');return d;}
 return {entry,hasContent,backup,restore};
});
