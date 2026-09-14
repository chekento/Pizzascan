const {test}=require('node:test');
const assert=require('node:assert/strict');
const P=require('../web/places.js');

const center={lat:53.6735,lng:10.2377};
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i],get length(){return m.size;}};};
const bad={ok:false,status:503,text:async()=>''};
function features(offset,label='Venue'){return Array.from({length:6},(_,i)=>({
 geometry:{coordinates:[center.lng+(i+1+offset/100)*0.001,center.lat+(i+1+offset/100)*0.0005]},
 properties:{name:`${label} ${i+1}`,osm_type:'N',osm_id:7000+offset+i,osm_key:'amenity',osm_value:'restaurant',street:'Fallbackweg',housenumber:String(i+1),postcode:'22926',city:'Ahrensburg',countrycode:'DE',state:'Schleswig-Holstein'}
}));}
function installPhoton(service,terms){
 service.photon=async q=>{terms.push(q);const index=Math.max(0,P.fallbackTerms.indexOf(q));return P.fromPhoton({features:features(index*20,q)});};
}

test('nearby discovery survives both Overpass providers and fills multiple POI categories',async()=>{
 const calls=[],terms=[];
 const service=new P.Service(async url=>{calls.push(url);return bad;},memory());
 installPhoton(service,terms);
 const result=await service.overpass(P.query(center,3));
 assert.equal(result.source,'photon.komoot.io');
 const places=P.fromOverpass(result.data.elements,{allowNamed:true});
 assert.ok(places.length>=18,'fallback should collect a useful multi-category candidate set');
 assert.ok(terms.length>=3,'fallback should not stop after a small pizza-only sample');
 assert.ok(terms.includes('restaurant')||terms.includes('cafe'),'generic food categories are queried');
 assert.equal(calls.filter(url=>P.providers.includes(url)).length,2);
});

test('empty Overpass responses also trigger nearby discovery instead of a false zero-result success',async()=>{
 let overpassCalls=0;const terms=[];
 const service=new P.Service(async url=>{
  if(P.providers.includes(url)){overpassCalls++;return {ok:true,status:200,json:async()=>({elements:[]})};}
  return bad;
 },memory());
 installPhoton(service,terms);
 const result=await service.overpass(P.query(center,5));
 assert.equal(result.source,'photon.komoot.io');
 assert.equal(overpassCalls,2);
 assert.ok(P.fromOverpass(result.data.elements,{allowNamed:true}).length>=18);
 assert.ok(terms.length>=3);
});
