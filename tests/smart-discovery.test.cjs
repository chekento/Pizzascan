const {test}=require('node:test');
const assert=require('node:assert/strict');
const S=require('../web/smart-discovery.js');

const el=(id,tags)=>({type:'node',id,lat:53.67,lon:10.24,tags});

test('WebSim pizza and Italian families remain the primary baseline',()=>{
 const baseline=[
  {cuisine:'pizza'},
  {amenity:'restaurant',cuisine:'italian'},
  {amenity:'restaurant',cuisine:'pizza;italian'},
  {amenity:'restaurant',name:'Ristorante Roma'},
  {amenity:'restaurant',name:'Trattoria Bella'},
  {amenity:'restaurant',name:'Osteria Uno'},
  {amenity:'cafe',cuisine:'pizza'},
  {amenity:'fast_food',cuisine:'italian'},
  {amenity:'food_truck',cuisine:'pizza'},
  {amenity:'bar',cuisine:'pizza'},
  {amenity:'pub',name:'Pizza Pub',cuisine:'pizza'},
  {amenity:'takeaway',cuisine:'pizza'},
  {shop:'bakery',name:'Italian Bakeshop'},
  {shop:'deli',product:'pizza'},
  {speciality:'pizza'},
  {name:'Pizza Max'},
  {description:'Hausgemachte Pizza aus dem Steinofen'},
  {amenity:'vending_machine',vending:'pizza'}
 ];
 assert.ok(baseline.every(S.websimBaselineTags));
});

test('ordinary restaurants are hidden without pizza evidence',()=>{
 for(const tags of [
  {amenity:'restaurant',name:'Restaurant Nord'},
  {amenity:'restaurant',name:'Gasthaus Mitte',cuisine:'german'},
  {amenity:'restaurant',name:'BLOCK HOUSE',cuisine:'steak'},
  {amenity:'restaurant',name:'New Long',cuisine:'chinese'},
  {amenity:'fast_food',name:'Snack Point'},
  {amenity:'takeaway',name:'Takeaway Central'}
 ])assert.equal(S.eligibleElement(el(1,tags)),false,JSON.stringify(tags));
});

test('normal restaurants may enter through real menu or description evidence',()=>{
 const evidence=[
  {amenity:'restaurant',name:'Restaurant Nord',menu:'Pizza Margherita; Pasta'},
  {amenity:'restaurant',name:'Gasthaus Mitte',description:'Freitags Steinofen-Pizza'},
  {amenity:'restaurant',name:'Asia Haus',menu:'Pizza Hawaii; Pizza Funghi'}
 ];
 for(const tags of evidence)assert.equal(S.eligibleElement(el(2,tags)),true,JSON.stringify(tags));
 assert.equal(S.pizzaMenuEvidence({'website:menu':'https://example.test/pizza-menu'}),false);
 assert.equal(S.pizzaText({website:'https://pizza.example.test'}),false);
});

test('review evidence can reveal a hidden generic restaurant',()=>{
 const p={name:'Restaurant Nord',type:'other',pizzaEvidence:'search',tags:{amenity:'restaurant',name:'Restaurant Nord'}};
 const yes={summary:()=>({pizzaMentions:2})},no={summary:()=>({pizzaMentions:0})};
 assert.equal(S.placeRelevant(p,no),false);
 assert.equal(S.placeRelevant(p,yes),true);
});

test('non-food POIs do not enter merely because their text contains pizza',()=>{
 assert.equal(S.eligibleElement(el(3,{amenity:'school',description:'Pizza day on Friday'})),false);
 assert.equal(S.eligibleElement(el(4,{tourism:'hotel',note:'Pizza nearby'})),false);
});

test('marker category distinguishes Italian candidates from actual pizza places',()=>{
 const place=(amenity,tags={})=>({name:'Test',type:'other',pizzaEvidence:'confirmed',tags:{amenity,cuisine:'pizza',...tags}});
 assert.equal(S.classifyPlace(place('restaurant')),'pizzeria');
 assert.equal(S.classifyPlace(place('cafe')),'cafe');
 assert.equal(S.classifyPlace(place('fast_food')),'fast_food');
 assert.equal(S.classifyPlace(place('takeaway')),'fast_food');
 assert.equal(S.classifyPlace(place('food_truck')),'food_truck');
 assert.equal(S.classifyPlace(place('bar')),'pizzeria');
 assert.equal(S.classifyPlace({name:'Ristorante Roma',tags:{amenity:'restaurant',cuisine:'italian'}}),'other');
 assert.equal(S.classifyPlace({name:'Box',tags:{amenity:'vending_machine',vending:'pizza'}}),'vending_pizza');
});

test('WebSim query has precise venue families plus hidden restaurant candidates for deep review evidence',()=>{
 const q=S.websimQuery({lat:53.675,lng:10.24},5,{south:53.6,west:10.1,north:53.7,east:10.3});
 assert.match(q,/pizzascan-websim-search-v6/);
 assert.match(q,/cuisine\"~\"pizza\|pizzeria/);
 assert.match(q,/amenity\"=\"restaurant\"\]\[\"cuisine\"~\"italian\|italiano\|italiana/);
 assert.match(q,/ristorante\|trattoria\|osteria/);
 assert.match(q,/pizza pub\|pizza bar/);
 assert.match(q,/shop\"~\"bakery\|deli/);
 assert.match(q,/menu\"~\"pizza/);
 assert.match(q,/description\"~\"pizza/);
 assert.match(q,/vending:pizza\"=\"yes/);
 assert.match(q,/amenity\"=\"restaurant\"\]\[\"name\"\]\(around:/);
 assert.equal(S.isWebsimDiscoveryQuery(q),true);
});

test('focused fallback still searches Italian families when broad recovery already returned many generic restaurants',async()=>{
 const seed=Array.from({length:25},(_,i)=>el(100+i,{amenity:'restaurant',name:'Generic '+i}));
 const calls=[];
 const item=(id,name)=>({place:{placeId:'node-'+id,name,lat:53.675,lng:10.24,tags:{amenity:'restaurant',name}}});
 const service={async photon(term){calls.push(term);if(term==='pizzeria')return [item(1,'Da Anna')];if(term==='italian restaurant')return [item(2,'Bella Italia')];if(term==='trattoria')return [item(3,'Trattoria Roma')];if(term==='osteria')return [item(4,'Osteria Uno')];return [];}};
 const q=S.websimQuery({lat:53.675,lng:10.24},5,{south:53.6,west:10.1,north:53.7,east:10.3});
 const out=await S.focusedRecovery(service,q,{},seed);
 assert.ok(calls.includes('italian restaurant'));
 assert.ok(calls.includes('trattoria'));
 assert.ok(calls.includes('osteria'));
 assert.ok(S.relevantCount(out)>=4);
 assert.ok(out.some(x=>/italian/.test(x.tags.cuisine||'')));
});

test('focused fallback terms cover requested WebSim venue vocabulary',()=>{
 for(const term of ['pizzeria','pizza','italian restaurant','italienisches restaurant','ristorante','trattoria','osteria','pizza cafe','pizza takeaway','pizza pub','pizza bar','pizza bakery','pizza bakeshop','pizza food truck','pizza vending'])assert.ok(S.FOCUSED_TERMS.includes(term),term);
 assert.equal(S.FOCUSED_TARGET,8);
});

test('installed map filter hides generic candidate pool and exposes review-confirmed restaurants',()=>{
 const pizza={name:'Pizza Max',type:'pizzeria',pizzaEvidence:'confirmed',tags:{amenity:'restaurant',name:'Pizza Max',cuisine:'pizza'}};
 const neutral={name:'Restaurant Nord',type:'other',pizzaEvidence:'search',tags:{amenity:'restaurant',name:'Restaurant Nord'}};
 const reviewed={name:'Restaurant Review',type:'other',pizzaEvidence:'search',tags:{amenity:'restaurant',name:'Restaurant Review'}};
 const PD={TYPES:{pizzeria:{emoji:'🍕',name:'Pizzeria'},other:{emoji:'🍽️',name:'Weitere Orte'}},query(){return 'old';},filter(list){return list;}};
 const ratings={summary:p=>({pizzaMentions:p.name==='Restaurant Review'?1:0})};
 const root={PizzaPlaces:PD,PizzaRatingsUI:ratings,localStorage:null};
 S.install(root);
 const visible=PD.filter([pizza,neutral,reviewed],{},null,()=>({state:'unknown'}));
 assert.deepEqual(visible.map(p=>p.name),['Pizza Max','Restaurant Review']);
 assert.equal(PD.TYPES.other.emoji,'🇮🇹');
 assert.equal(PD.TYPES.pizzeria.emoji,'🍕');
});

test('Google review evidence only counts actual review text',()=>{
 const pizzaText={querySelectorAll:()=>[{textContent:'Great pizza and friendly staff'}]};
 const noPizza={querySelectorAll:()=>[{textContent:'Great coffee and cake'}]};
 assert.equal(S.googleReviewHasPizza(pizzaText),true);
 assert.equal(S.googleReviewHasPizza(noPizza),false);
});

test('relevance cache marker advances for installed clients',()=>{
 assert.equal(S.MARKER,'pizzascan-smart-discovery-v6');
});