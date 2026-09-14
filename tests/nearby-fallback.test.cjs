const {test}=require('node:test');
const assert=require('node:assert/strict');
const P=require('../web/places.js');

const center={lat:53.6735,lng:10.2377};
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i],get length(){return m.size;}};};
const bad={ok:false,status:503,text:async()=>''};
const features=Array.from({length:6},(_,i)=>({
 geometry:{coordinates:[center.lng+(i+1)*0.002,center.lat+(i+1)*0.001]},
 properties:{name:`Pizza Fallback ${i+1}`,osm_type:'N',osm_id:7000+i,osm_key:'amenity',osm_value:'restaurant',street:'Fallbackweg',housenumber:String(i+1),postcode:'22926',city:'Ahrensburg',countrycode:'DE',state:'Schleswig-Holstein'}
}));

test('nearby discovery survives both Overpass providers being unavailable',async()=>{
 const calls=[];
 const service=new P.Service(async url=>{
  calls.push(url);
  if(P.providers.includes(url))return bad;
  const q=new URL(url).searchParams.get('q');
  return {ok:true,status:200,json:async()=>({features:q==='pizza'?features:[]})};
 },memory());
 const result=await service.overpass(P.query(center,3));
 assert.equal(result.source,'photon.komoot.io');
 const places=P.fromOverpass(result.data.elements);
 assert.equal(places.length,6);
 assert.ok(places.every(p=>p.pizzaEvidence==='confirmed'));
 assert.equal(calls.filter(url=>P.providers.includes(url)).length,2);
 assert.equal(calls.filter(url=>url.includes('photon.komoot.io')).length,1,'six safe nearby matches stop extra fallback requests');
});

test('empty Overpass responses also trigger nearby discovery instead of a false zero-result success',async()=>{
 let overpassCalls=0;
 const service=new P.Service(async url=>{
  if(P.providers.includes(url)){overpassCalls++;return {ok:true,status:200,json:async()=>({elements:[]})};}
  return {ok:true,status:200,json:async()=>({features})};
 },memory());
 const result=await service.overpass(P.query(center,5));
 assert.equal(result.source,'photon.komoot.io');
 assert.equal(overpassCalls,2);
 assert.ok(P.fromOverpass(result.data.elements).length>0);
});
