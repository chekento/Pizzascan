const {test}=require('node:test');
const assert=require('node:assert/strict');
const S=require('../web/smart-discovery.js');
const el=(id,tags)=>({type:'node',id,lat:53.67,lon:10.24,tags});

test('original ZIP selector families are reproduced exactly',()=>{
 const yes=[
  {cuisine:'pizza'},
  {amenity:'restaurant',cuisine:'italian'},
  {amenity:'restaurant',cuisine:'pizzeria'},
  {vending:'pizza'},
  {'vending:pizza':'yes'},
  {amenity:'cafe',cuisine:'italian'},
  {amenity:'fast_food',cuisine:'pizza'},
  {amenity:'food_truck',cuisine:'italian'},
  {speciality:'Neapolitan pizza'},
  {amenity:'bar',cuisine:'pizza'},
  {amenity:'pub',cuisine:'italian'},
  {name:'Pizze e Pasta'},
  {description:'Stone-baked pizza'},
  {amenity:'takeaway',cuisine:'italian'}
 ];
 for(const tags of yes)assert.equal(S.originalWebsimTags(tags),true,JSON.stringify(tags));
});

test('ordinary restaurants are not ambient ZIP hits',()=>{
 for(const tags of [
  {amenity:'restaurant',name:'BLOCK HOUSE',cuisine:'steak'},
  {amenity:'restaurant',name:'New Long',cuisine:'chinese'},
  {amenity:'restaurant',name:'Restaurant Nord'},
  {amenity:'restaurant',name:'Trattoria Roma'},
  {amenity:'restaurant',name:'Ristorante Uno'}
 ])assert.equal(S.originalWebsimTags(tags),false,JSON.stringify(tags));
});

test('menu and review evidence remain additive without changing original baseline',()=>{
 const generic={amenity:'restaurant',name:'Restaurant Nord'};
 assert.equal(S.originalWebsimTags(generic),false);
 assert.equal(S.deepEvidenceTags({...generic,menu:'Pasta; Pizza Margherita'}),true);
 const place={name:'Restaurant Nord',tags:generic};
 assert.equal(S.placeRelevant(place,{summary:()=>({pizzaMentions:1})}),true);
});

test('query matches uploaded ZIP families and 60-second timeout',()=>{
 const q=S.websimQuery({lat:53.67,lng:10.24},5,{south:53.62,west:10.17,north:53.72,east:10.31});
 assert.match(q,/timeout:60/);
 assert.match(q,/pizzascan-original-zip-search-v1/);
 assert.match(q,/node\["cuisine"="pizza"\]\(53\.62,10\.17,53\.72,10\.31\)/);
 assert.match(q,/amenity"="restaurant"\]\["cuisine"="italian"/);
 assert.match(q,/amenity"="restaurant"\]\["cuisine"~"pizza\|pizzeria"/);
 assert.match(q,/amenity"="cafe"\]\["cuisine"~"pizza\|italian"/);
 assert.match(q,/amenity"="fast_food"\]\["cuisine"~"pizza\|italian"/);
 assert.match(q,/amenity"="food_truck"\]\["cuisine"~"pizza\|italian"/);
 assert.match(q,/speciality"~"pizza",i/);
 assert.match(q,/amenity"~"bar\|pub"\]\["cuisine"~"pizza\|italian"/);
 assert.match(q,/name"~"pizza\|pizzeria\|pizze",i/);
 assert.match(q,/description"~"pizza",i/);
 assert.match(q,/amenity"="takeaway"\]\["cuisine"~"pizza\|italian"/);
 assert.doesNotMatch(q,/trattoria|osteria|ristorante|every named restaurant/i);
});

test('current viewport bbox wins over synthetic radius like the original ZIP',()=>{
 assert.equal(S.area({lat:53.67,lng:10.24},5,{south:1,west:2,north:3,east:4}),'1,2,3,4');
});

test('ambient fallback uses original query on fixed Overpass mirrors, never Photon inference',async()=>{
 const calls=[];
 const service={async json(endpoint,options){calls.push({endpoint,query:options.body.get('data')});if(endpoint.includes('osm.jp'))return {elements:[el(1,{amenity:'restaurant',cuisine:'italian',name:'Da Franco'})]};throw Error('offline');}};
 const q=S.websimQuery({lat:53.67,lng:10.24},5,{south:53.62,west:10.17,north:53.72,east:10.31});
 const out=await S.firstOriginalProvider(service,q,{});
 assert.equal(out.data.elements.length,1);
 assert.equal(out.data.elements[0].tags.name,'Da Franco');
 assert.equal(calls.length,4);
 assert.ok(calls.every(x=>x.query.includes(S.QUERY_MARKER)));
});

test('install replaces broad discovery with original ZIP query and hides generic pool',()=>{
 class Service{async overpass(){return {data:{elements:[]},source:'base'};}async nearbyFallback(){return [el(9,{amenity:'restaurant',name:'Generic'})];}async json(){return {elements:[el(10,{amenity:'restaurant',cuisine:'italian',name:'Da Franco'})]};}}
 const PD={Service,TYPES:{pizzeria:{emoji:'🍕'},other:{emoji:'🍽️'}},query(){return 'broad';},filter(list){return list;}};
 const root={PizzaPlaces:PD,PizzaRatingsUI:{summary:()=>({pizzaMentions:0})},localStorage:null};
 S.install(root);
 const q=PD.query({lat:53.67,lng:10.24},5,{south:53.62,west:10.17,north:53.72,east:10.31});
 assert.ok(q.includes(S.QUERY_MARKER));
 const visible=PD.filter([
  {name:'Da Franco',tags:{amenity:'restaurant',cuisine:'italian'}},
  {name:'BLOCK HOUSE',tags:{amenity:'restaurant',cuisine:'steak'}}
 ],{},null,()=>({state:'unknown'}));
 assert.deepEqual(visible.map(x=>x.name),['Da Franco']);
 assert.equal(Service.prototype.nearbyFallback.__websimBypass,true);
 assert.equal(root.PizzaScanSmartDiscovery.mode,'original-zip-exact');
});

test('cache marker advances so installed builds discard stale restrictive results',()=>{
 assert.equal(S.MARKER,'pizzascan-smart-discovery-v10');
});
