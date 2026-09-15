const {test}=require('node:test');
const assert=require('node:assert/strict');
const S=require('../web/smart-discovery.js');

const el=(id,tags)=>({type:'node',id,lat:53.67,lon:10.24,tags});

test('original WebSim pizza and Italian families remain the primary baseline',()=>{
 const baseline=[
  {cuisine:'pizza'},
  {amenity:'restaurant',cuisine:'italian'},
  {amenity:'restaurant',cuisine:'pizza;italian'},
  {amenity:'restaurant',name:'Ristorante Roma'},
  {amenity:'cafe',cuisine:'pizza'},
  {amenity:'fast_food',cuisine:'italian'},
  {amenity:'food_truck',cuisine:'pizza'},
  {amenity:'bar',cuisine:'pizza'},
  {amenity:'pub',cuisine:'italian'},
  {amenity:'takeaway',cuisine:'pizza'},
  {speciality:'pizza'},
  {name:'Pizza Max'},
  {description:'Hausgemachte Pizza aus dem Steinofen'},
  {amenity:'vending_machine',vending:'pizza'}
 ];
 assert.ok(baseline.every(S.websimBaselineTags));
});

test('neutral restaurant candidates survive sparse recovery instead of collapsing to two results',()=>{
 for(const tags of [
  {amenity:'restaurant',name:'Restaurant Nord'},
  {amenity:'restaurant',name:'Gasthaus Mitte',cuisine:'german'},
  {amenity:'fast_food',name:'Snack Point'},
  {amenity:'takeaway',name:'Takeaway Central'},
  {amenity:'food_truck',name:'Street Food Truck'}
 ])assert.equal(S.supplementalCandidateTags(tags),true,JSON.stringify(tags));
 for(const tags of [
  {amenity:'cafe',name:'Kaffeeküche'},
  {amenity:'bar',name:'Bar Central'},
  {amenity:'pub',name:'Pub Nord'}
 ])assert.equal(S.supplementalCandidateTags(tags),false,JSON.stringify(tags));
});

test('obvious specialised non-pizza cuisines and names are vetoed unless pizza is explicit',()=>{
 const rejected=[
  {amenity:'restaurant',name:'Asia Haus',cuisine:'asian'},
  {amenity:'restaurant',name:'Sushi Bar',cuisine:'sushi'},
  {amenity:'restaurant',name:'Thai Bistro',cuisine:'thai'},
  {amenity:'restaurant',name:'China Town'},
  {amenity:'fast_food',name:'Döner Ecke',cuisine:'kebab'},
  {amenity:'restaurant',name:'Burger House',cuisine:'burger'}
 ];
 for(const tags of rejected)assert.equal(S.eligibleElement(el(20,tags)),false,JSON.stringify(tags));
 const direct=[
  {amenity:'restaurant',name:'Asia Pizza',cuisine:'asian'},
  {amenity:'restaurant',name:'Fusion',cuisine:'asian;pizza'},
  {amenity:'restaurant',name:'Thai Bistro',cuisine:'thai',product:'pizza'},
  {amenity:'fast_food',name:'Döner & Pizza',cuisine:'kebab;pizza'}
 ];
 for(const tags of direct)assert.equal(S.eligibleElement(el(21,tags)),true,JSON.stringify(tags));
});

test('real menu/comment/product evidence counts but URL strings alone do not',()=>{
 assert.equal(S.pizzaMenuEvidence({menu:'Pizza Margherita; Pasta'}),true);
 assert.equal(S.pizzaMenuEvidence({'website:menu':'https://example.test/pizza-menu'}),false);
 assert.equal(S.pizzaText({website:'https://pizza.example.test'}),false);
 assert.equal(S.websimBaselineTags({amenity:'restaurant',name:'Nord',description:'Steinofen Pizza am Abend'}),true);
});

test('non-food POIs do not enter merely because their text contains pizza',()=>{
 assert.equal(S.eligibleElement(el(3,{amenity:'school',description:'Pizza day on Friday'})),false);
 assert.equal(S.eligibleElement(el(4,{tourism:'hotel',note:'Pizza nearby'})),false);
});

test('marker category keeps semantic legend categories',()=>{
 const place=(amenity,tags={})=>({name:'Test',type:'other',pizzaEvidence:'confirmed',tags:{amenity,cuisine:'pizza',...tags}});
 assert.equal(S.classifyPlace(place('restaurant')),'pizzeria');
 assert.equal(S.classifyPlace(place('cafe')),'cafe');
 assert.equal(S.classifyPlace(place('fast_food')),'fast_food');
 assert.equal(S.classifyPlace(place('takeaway')),'fast_food');
 assert.equal(S.classifyPlace(place('food_truck')),'food_truck');
 assert.equal(S.classifyPlace(place('bar')),'other');
 assert.equal(S.classifyPlace({name:'Box',tags:{amenity:'vending_machine',vending:'pizza'}}),'vending_pizza');
});

test('WebSim query matches the original search families and contains no generic restaurant sweep',()=>{
 const q=S.websimQuery({lat:53.675,lng:10.24},5,{south:53.6,west:10.1,north:53.7,east:10.3});
 assert.match(q,/pizzascan-websim-search-v4/);
 assert.match(q,/cuisine\"=\"pizza/);
 assert.match(q,/amenity\"=\"restaurant\"\]\[\"cuisine\"=\"italian/);
 assert.match(q,/amenity\"=\"cafe\"\]\[\"cuisine\"~\"pizza\|italian/);
 assert.match(q,/amenity\"=\"fast_food\"\]\[\"cuisine\"~\"pizza\|italian/);
 assert.match(q,/amenity\"=\"food_truck\"\]\[\"cuisine\"~\"pizza\|italian/);
 assert.match(q,/speciality\"~\"pizza/);
 assert.match(q,/amenity\"~\"bar\|pub\"\]\[\"cuisine\"~\"pizza\|italian/);
 assert.match(q,/name\"~\"pizza\|pizzeria\|pizze/);
 assert.match(q,/description\"~\"pizza/);
 assert.match(q,/amenity\"=\"takeaway\"\]\[\"cuisine\"~\"pizza\|italian/);
 assert.doesNotMatch(q,/amenity\"~\"restaurant\|fast_food\|cafe[^\]]*\]\[\"name\"\]/);
 assert.equal(S.isWebsimDiscoveryQuery(q),true);
});

test('ambient WebSim query keeps broad recovery but filters obvious mismatches; manual queries stay broad',async()=>{
 const pizza=el(1,{amenity:'restaurant',name:'Pizza Max',cuisine:'pizza'});
 const neutral=el(2,{amenity:'restaurant',name:'Restaurant Nord'});
 const asia=el(3,{amenity:'restaurant',name:'Asia Haus',cuisine:'asian'});
 let delegated=[];
 const service={overpass:async q=>{delegated.push(q);return {data:{elements:[pizza,neutral,asia]},source:'broad-recovery'};}};
 const root={PizzaPlaces:{query(){return 'old';}},placeService:service,localStorage:null};
 global.placeService=service;
 try{
  S.install(root);
  const q=root.PizzaPlaces.query({lat:53.675,lng:10.24},5,{south:53.6,west:10.1,north:53.7,east:10.3});
  const ambient=await service.overpass(q);
  assert.deepEqual(ambient.data.elements.map(x=>x.id),[1,2]);
  const manual=await service.overpass('[out:json];node(1);out;');
  assert.deepEqual(manual.data.elements.map(x=>x.id),[1,2,3]);
  assert.equal(delegated.length,2);
 }finally{delete global.placeService;}
});

test('Google review evidence only counts actual review text',()=>{
 const pizzaText={querySelectorAll:()=>[{textContent:'Great pizza and friendly staff'}]};
 const noPizza={querySelectorAll:()=>[{textContent:'Great coffee and cake'}]};
 assert.equal(S.googleReviewHasPizza(pizzaText),true);
 assert.equal(S.googleReviewHasPizza(noPizza),false);
});

test('hybrid cache marker advances for installed clients',()=>{
 assert.equal(S.MARKER,'pizzascan-smart-discovery-v4');
});
