const {test}=require('node:test');
const assert=require('node:assert/strict');
const S=require('../web/smart-discovery.js');
const el=(id,tags)=>({type:'node',id,lat:53.67,lon:10.24,tags});

test('original WebSim selector families remain supported',()=>{
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

test('dense-city variants include multi-value cuisine and Italian venue names',()=>{
 const yes=[
  {amenity:'restaurant',cuisine:'italian;pizza',name:'Lucali'},
  {amenity:'restaurant',cuisine:'pizza;italian',name:'Village Square'},
  {amenity:'restaurant',name:'Trattoria Roma'},
  {amenity:'restaurant',name:'Ristorante Uno'},
  {amenity:'restaurant',name:'Osteria Verde'},
  {shop:'bakery',name:'Corner Bakery',product:'bread;pizza'},
  {amenity:'food_court',name:'Italian Restaurant'},
  {amenity:'restaurant',name:'Dinner House',menu:'Pizza Margherita; Pasta'}
 ];
 for(const tags of yes)assert.equal(S.originalWebsimTags(tags),true,JSON.stringify(tags));
});

test('ordinary unrelated restaurants remain excluded',()=>{
 for(const tags of [
  {amenity:'restaurant',name:'BLOCK HOUSE',cuisine:'steak'},
  {amenity:'restaurant',name:'New Long',cuisine:'chinese'},
  {amenity:'restaurant',name:'Restaurant Nord'},
  {amenity:'restaurant',name:'Bangkok',cuisine:'thai'},
  {amenity:'restaurant',name:'Sushi Garden',cuisine:'sushi'}
 ])assert.equal(S.originalWebsimTags(tags),false,JSON.stringify(tags));
});

test('menu and review evidence remain additive',()=>{
 const generic={amenity:'restaurant',name:'Restaurant Nord'};
 assert.equal(S.originalWebsimTags(generic),false);
 assert.equal(S.deepEvidenceTags({...generic,menu:'Pasta; Pizza Margherita'}),true);
 const place={name:'Restaurant Nord',tags:generic};
 assert.equal(S.placeRelevant(place,{summary:()=>({pizzaMentions:1})}),true);
});

test('dense query keeps viewport bbox and broad pizza/Italian OSM evidence',()=>{
 const q=S.websimQuery({lat:40.728,lng:-73.985},5,{south:40.72,west:-74.00,north:40.74,east:-73.97});
 assert.match(q,/timeout:55/);
 assert.match(q,/pizzascan-websim-dense-search-v2/);
 assert.match(q,/nwr\["cuisine"~"pizza\|pizzeria\|italian\|italiano\|italiana",i\]\(40\.72,-74,40\.74,-73\.97\)/);
 assert.match(q,/ristorante\|trattoria\|osteria/);
 assert.match(q,/shop"~"bakery\|deli\|convenience/);
 assert.match(q,/product"~"pizza",i/);
 assert.match(q,/products"~"pizza",i/);
 assert.match(q,/menu"~"pizza",i/);
 assert.match(q,/description"~"pizza",i/);
 assert.match(q,/note"~"pizza",i/);
 assert.match(q,/vending:pizza/);
 assert.doesNotMatch(q,/amenity"="restaurant"\]\["name"\]/);
});

test('current viewport bbox wins over synthetic radius',()=>{
 assert.equal(S.area({lat:53.67,lng:10.24},5,{south:1,west:2,north:3,east:4}),'1,2,3,4');
});

test('provider aggregation merges unique OSM hits from multiple mirrors',async()=>{
 const calls=[];
 const service={async json(endpoint,options){
  calls.push({endpoint,query:options.body.get('data')});
  if(endpoint.includes('overpass-api.de'))return {elements:[el(1,{amenity:'restaurant',cuisine:'italian',name:'Da Franco'})]};
  if(endpoint.includes('private.coffee'))return {elements:[el(2,{amenity:'restaurant',cuisine:'pizza;italian',name:'Lucali'})]};
  throw Error('offline');
 }};
 const q=S.websimQuery({lat:53.67,lng:10.24},5,{south:53.62,west:10.17,north:53.72,east:10.31});
 const out=await S.firstOriginalProvider(service,q,{});
 assert.deepEqual(out.data.elements.map(x=>x.id).sort((a,b)=>a-b),[1,2]);
 assert.equal(calls.length,4);
 assert.ok(out.source.includes('overpass-api.de'));
 assert.ok(out.source.includes('overpass.private.coffee'));
 assert.ok(calls.every(x=>x.query.includes(S.QUERY_MARKER)));
});

test('install keeps generic restaurants hidden but preserves named Italian candidates',()=>{
 class Service{async overpass(){return {data:{elements:[]},source:'base'};}async nearbyFallback(){return [el(9,{amenity:'restaurant',name:'Generic'})];}async json(){return {elements:[el(10,{amenity:'restaurant',name:'Trattoria Roma'})]};}}
 const baseFrom=(elements,options={})=>elements.map(e=>({placeId:e.type+'-'+e.id,name:e.tags.name||'x',tags:e.tags,pizzaEvidence:options.allowNamed?'search':'possible'}));
 const PD={Service,TYPES:{pizzeria:{emoji:'🍕'},other:{emoji:'🍽️'}},query(){return 'broad';},filter(list){return list;},fromOverpass:baseFrom};
 const root={PizzaPlaces:PD,PizzaRatingsUI:{summary:()=>({pizzaMentions:0})},localStorage:null};
 S.install(root);
 const q=PD.query({lat:53.67,lng:10.24},5,{south:53.62,west:10.17,north:53.72,east:10.31});
 assert.ok(q.includes(S.QUERY_MARKER));
 const visible=PD.filter([
  {name:'Trattoria Roma',tags:{amenity:'restaurant',name:'Trattoria Roma'}},
  {name:'BLOCK HOUSE',tags:{amenity:'restaurant',name:'BLOCK HOUSE',cuisine:'steak'}}
 ],{},null,()=>({state:'unknown'}));
 assert.deepEqual(visible.map(x=>x.name),['Trattoria Roma']);
 const normalized=PD.fromOverpass([el(10,{amenity:'restaurant',name:'Trattoria Roma'})]);
 assert.equal(normalized.length,1);
 assert.equal(normalized[0].pizzaEvidence,'search');
 assert.equal(Service.prototype.nearbyFallback.__websimBypass,true);
 assert.equal(root.PizzaScanSmartDiscovery.mode,'websim-dense-complete');
 assert.equal(root.PizzaScanSmartDiscovery.mergeProviders,true);
});

test('cache marker advances so installed builds discard stale search results',()=>{
 assert.equal(S.MARKER,'pizzascan-smart-discovery-v11');
});