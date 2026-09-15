const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../web/poi-discovery.js');

test('recovery query always includes all named food POIs before pizza enrichment',()=>{
  const q=D.robustQuery('around:10000,53.675,10.240');
  assert.match(q,/\["amenity"~"restaurant\|fast_food\|cafe\|food_truck\|takeaway\|food_court\|bar\|pub\|biergarten"\]\["name"\]/,'recovery itself must stay broad when primary Overpass servers fail');
  assert.match(q,/cuisine.*pizza/);
  assert.match(q,/cuisine.*italian/);
  assert.match(q,/name.*pizza/);
  assert.match(q,/name.*trattoria/);
  assert.match(q,/name.*ristorante/);
  assert.match(q,/name.*osteria/);
  assert.match(q,/brand.*pizza/);
  assert.match(q,/operator.*pizza/);
  assert.match(q,/speciality.*pizza/);
  assert.match(q,/description.*pizza/);
  assert.match(q,/vending:pizza/);
  assert.match(q,/amenity"="vending_machine/);
});

test('last-resort text and structured Photon search both cover generic restaurants',()=>{
  for(const term of ['restaurant','cafe','fast food','takeaway','bar','pub','biergarten','food court','pizzeria','pizza','italian restaurant','ristorante','trattoria','osteria','italienisches restaurant'])assert.ok(D.FALLBACK_TERMS.includes(term),term);
  for(const tag of ['amenity:restaurant','amenity:fast_food','amenity:cafe','amenity:food_court','amenity:pub','amenity:bar','amenity:biergarten'])assert.ok(D.PHOTON_TAGS.includes(tag),tag);
  assert.equal(D.PHOTON_LIMIT,50);
  assert.equal(D.SPARSE_BELOW,12);
  assert.equal(D.ADEQUATE_POIS,24);
  assert.equal(D.FALLBACK_TARGET,24);
  assert.equal(D.MIN_GENERIC_POIS,3);
  assert.equal(D.MARKER,'pizzascan-poi-discovery-v10');
  assert.match(D.RECOVERY_PROVIDERS[0],/maps\.mail\.ru/,'healthy global recovery mirror is attempted before the certificate-problematic backup seen in CI');
});

test('structured Photon request is tag-filtered and converts only nearby named food POIs',()=>{
 const info=D.areaInfo('around:5000,53.6735,10.2377');
 const url=new URL(D.photonNearbyUrl('amenity:restaurant',info.center));
 assert.equal(url.origin,'https://photon.komoot.io');
 assert.equal(url.pathname,'/reverse');
 assert.equal(url.searchParams.get('osm_tag'),'amenity:restaurant');
 assert.equal(url.searchParams.get('limit'),'50');
 const data={features:[
  {geometry:{coordinates:[10.238,53.674]},properties:{name:'Restaurant Nord',osm_type:'N',osm_id:1,osm_key:'amenity',osm_value:'restaurant',city:'Ahrensburg',countrycode:'DE'}},
  {geometry:{coordinates:[10.239,53.675]},properties:{name:'Cafe Mitte',osm_type:'N',osm_id:2,osm_key:'amenity',osm_value:'cafe',city:'Ahrensburg',countrycode:'DE'}},
  {geometry:{coordinates:[11.5,54.5]},properties:{name:'Zu weit weg',osm_type:'N',osm_id:3,osm_key:'amenity',osm_value:'restaurant'}},
  {geometry:{coordinates:[10.238,53.674]},properties:{name:'Kein Gastro-POI',osm_type:'N',osm_id:4,osm_key:'shop',osm_value:'supermarket'}}
 ]};
 const out=D.photonFeatureElements(data,info);
 assert.deepEqual(out.map(x=>x.id),[1,2]);
 assert.equal(out[0].tags.amenity,'restaurant');
 assert.equal(out[1].tags.amenity,'cafe');
});

test('structured Photon fallback merges categories until a useful broad result set exists',async()=>{
 const info=D.areaInfo('around:5000,53.6735,10.2377'),calls=[];
 const service={
  read(){return null;},write(){return true;},
  async json(url){calls.push(url);const tag=new URL(url).searchParams.get('osm_tag'),base=tag==='amenity:restaurant'?100:200;return {features:Array.from({length:20},(_,i)=>({geometry:{coordinates:[10.2377+(i%5)*.001,53.6735+Math.floor(i/5)*.001]},properties:{name:`${tag} ${i}`,osm_type:'N',osm_id:base+i,osm_key:'amenity',osm_value:tag.split(':')[1],city:'Ahrensburg',countrycode:'DE'}}))};}
 };
 const out=await D.structuredPhoton(service,info,{},[]);
 assert.ok(out.length>=24,'structured tag recovery should not stop at the old one-to-three free-text result set');
 assert.equal(new URL(calls[0]).searchParams.get('osm_tag'),'amenity:restaurant');
 assert.ok(calls.length>=2,'a second food category is fetched when restaurants alone are still below the target');
 assert.ok(D.genericFoodCount(out)>=D.MIN_GENERIC_POIS);
});

test('area extraction supports radius and map bounds',()=>{
  assert.equal(D.extractArea('[out:json];nwr["amenity"](around:5000,53.6,10.2);out;'),'around:5000,53.6,10.2');
  assert.equal(D.extractArea('[out:json];nwr["amenity"](53.5,10.1,53.7,10.4);out;'),'53.5,10.1,53.7,10.4');
  assert.deepEqual(D.areaInfo('53.5,10.1,53.7,10.4').center,{lat:53.6,lng:10.25});
});

test('Italian identity is a POI candidate but never fabricated as confirmed pizza evidence',()=>{
  assert.equal(D.evidence({name:'Ristorante Roma',pizzaEvidence:'search',tags:{amenity:'restaurant'}}),'search');
  assert.equal(D.evidence({name:'Trattoria da Luigi',pizzaEvidence:'search',tags:{amenity:'restaurant'}}),'search');
  assert.equal(D.evidence({name:'Osteria Bella',pizzaEvidence:'search',tags:{amenity:'restaurant'}}),'search');
  assert.equal(D.evidence({name:'Pizzeria Napoli',pizzaEvidence:'search',tags:{amenity:'restaurant'}}),'confirmed');
  assert.equal(D.evidence({name:'Cafe Nord',cuisine:'pizza',pizzaEvidence:'search',tags:{amenity:'cafe'}}),'confirmed');
});

test('restaurant diversity, not pizza density, determines whether recovery is complete',()=>{
  const generic=Array.from({length:40},(_,i)=>({type:'node',id:i,tags:{name:'Restaurant '+i,amenity:'restaurant'}}));
  const sparse=Array.from({length:8},(_,i)=>({type:'node',id:50+i,tags:{name:'Restaurant '+i,amenity:'restaurant'}}));
  const pizza=Array.from({length:D.SPARSE_BELOW},(_,i)=>({type:'node',id:100+i,tags:{name:'Pizza '+i,amenity:'restaurant',cuisine:'pizza'}}));
  const mixed=[...pizza.slice(0,9),...Array.from({length:3},(_,i)=>({type:'node',id:300+i,tags:{name:'Generic '+i,amenity:'restaurant'}}))];
  assert.equal(D.pizzaCount(generic),0);
  assert.equal(D.genericFoodCount(generic),40);
  assert.equal(D.isSparse({data:{elements:generic},source:'overpass-api.de'}),false,'dense broad Overpass POIs must render immediately');
  assert.equal(D.isSparse({data:{elements:sparse},source:'overpass-api.de'}),true);
  assert.equal(D.isSparse({data:{elements:pizza},source:'overpass-api.de'}),true,'a dozen pizza-only hits must still be supplemented with ordinary restaurants');
  assert.equal(D.isSparse({data:{elements:mixed},source:'overpass-api.de'}),false,'12 results with several ordinary restaurants are broad enough to show');
  assert.equal(D.isSparse({data:{elements:Array.from({length:24},(_,i)=>({type:'node',id:500+i,tags:{name:'Restaurant '+i,amenity:'restaurant'}}))},source:'photon.komoot.io'}),false,'a broad structured Photon set is already sufficient');
  assert.equal(D.isSparse({data:{elements:pizza},source:'photon.komoot.io'}),true);
});

test('fallback terms become correctly typed generic, Italian and pizza POI elements',()=>{
 const place={placeId:'node-9',name:'Kaffeeküche',lat:53.67,lng:10.24,tags:{}};
 const restaurant=D.placeToElement({...place,name:'Restaurant Nord'},'restaurant');
 assert.equal(restaurant.tags.amenity,'restaurant');
 assert.equal(D.elementPizza(restaurant),false);
 const court=D.placeToElement({...place,name:'Food Hall'},'food court');
 assert.equal(court.tags.amenity,'food_court');
 const cafe=D.placeToElement(place,'pizza cafe');
 assert.equal(cafe.tags.amenity,'cafe');
 assert.match(cafe.tags.cuisine,/pizza/);
 assert.equal(D.elementPizza(cafe),true);
 const trattoria=D.placeToElement({...place,name:'Trattoria Roma'},'trattoria');
 assert.equal(trattoria.tags.amenity,'restaurant');
 assert.match(trattoria.tags.cuisine,/italian/);
 assert.equal(D.elementPizza(trattoria),false,'Italian candidate is not automatically pizza-confirmed');
 const vending=D.placeToElement(place,'pizza vending');
 assert.equal(vending.tags.amenity,'vending_machine');
 assert.equal(vending.tags['vending:pizza'],'yes');
});

test('element merge deduplicates OSM identities',()=>{
  const a={type:'node',id:1,tags:{name:'A'}},b={type:'node',id:1,tags:{name:'B'}},c={type:'way',id:1};
  const out=D.mergeElements([a],[b,c]);
  assert.equal(out.length,2);
  assert.equal(out.find(x=>x.type==='node').tags.name,'B');
});
