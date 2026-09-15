const {test}=require('node:test');
const assert=require('node:assert/strict');
const S=require('../web/smart-discovery.js');

const el=(id,tags)=>({type:'node',id,lat:53.67,lon:10.24,tags});

test('original WebSim pizza/Italian POI families remain baseline',()=>{
 const baseline=[
  {cuisine:'pizza'},
  {amenity:'restaurant',cuisine:'italian'},
  {amenity:'restaurant',cuisine:'pizza;italian'},
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

test('generic restaurants are not auto-added without pizza evidence',()=>{
 for(const tags of [
  {amenity:'restaurant',name:'Restaurant Nord',cuisine:'german'},
  {amenity:'bar',name:'Bar Central'},
  {amenity:'cafe',name:'Kaffeeküche',cuisine:'coffee_shop'},
  {amenity:'fast_food',name:'Döner Ecke',cuisine:'kebab'}
 ])assert.equal(S.eligibleElement(el(1,tags)),false,JSON.stringify(tags));
});

test('additional food POIs are admitted when menu/comment/product evidence says pizza',()=>{
 const extras=[
  {amenity:'restaurant',name:'Restaurant Nord',note:'Freitags gibt es Pizza'},
  {amenity:'bar',name:'Bar Central',description:'Cocktails, snacks and pizza'},
  {amenity:'biergarten',name:'Garten',products:'beer;pizza'},
  {amenity:'cafe',name:'Café Test','website:menu':'https://example.test/pizza-menu'},
  {shop:'bakery',name:'Backstube',product:'pizza'}
 ];
 assert.ok(extras.every(tags=>S.eligibleElement(el(2,tags))));
});

test('non-food POIs do not enter the map merely because their text contains pizza',()=>{
 assert.equal(S.eligibleElement(el(3,{amenity:'school',description:'Pizza day on Friday'})),false);
 assert.equal(S.eligibleElement(el(4,{tourism:'hotel',note:'Pizza nearby'})),false);
});

test('marker category follows the same semantic legend categories',()=>{
 const place=(amenity,tags={})=>({name:'Test',type:'other',pizzaEvidence:'confirmed',tags:{amenity,cuisine:'pizza',...tags}});
 assert.equal(S.classifyPlace(place('restaurant')),'pizzeria');
 assert.equal(S.classifyPlace(place('cafe')),'cafe');
 assert.equal(S.classifyPlace(place('fast_food')),'fast_food');
 assert.equal(S.classifyPlace(place('takeaway')),'fast_food');
 assert.equal(S.classifyPlace(place('food_truck')),'food_truck');
 assert.equal(S.classifyPlace(place('bar')),'other');
 assert.equal(S.classifyPlace({name:'Box',tags:{amenity:'vending_machine',vending:'pizza'}}),'vending_pizza');
});

test('Italian-only WebSim restaurant stays available but is not mislabeled as a pizzeria',()=>{
 const p={name:'Ristorante Test',pizzaEvidence:'possible',cuisine:'italian',tags:{amenity:'restaurant',cuisine:'italian'}};
 assert.equal(S.websimBaselineTags(p.tags),true);
 assert.equal(S.strongPizzaPlace(p),false);
 assert.equal(S.classifyPlace(p),'other');
});

test('strict nearby query contains WebSim baseline plus explicit menu/comment evidence and no generic named restaurant sweep',()=>{
 const q=S.strictQuery({lat:53.675,lng:10.24},3,{south:53.6,west:10.1,north:53.7,east:10.3});
 assert.match(q,/amenity\"=\"restaurant/);
 assert.match(q,/cuisine\"~\"pizza\|pizzeria\|italian/);
 assert.match(q,/description\"~\"pizza/);
 assert.match(q,/note\"~\"pizza/);
 assert.match(q,/website:menu\"~\"pizza/);
 assert.doesNotMatch(q,/amenity\"~\"restaurant\|fast_food\|cafe[^\]]*\]\[\"name\"\]/);
});

test('Google review evidence only counts actual review text',()=>{
 const pizzaText={querySelectorAll:()=>[{textContent:'Great pizza and friendly staff'}]};
 const noPizza={querySelectorAll:()=>[{textContent:'Great coffee and cake'}]};
 assert.equal(S.googleReviewHasPizza(pizzaText),true);
 assert.equal(S.googleReviewHasPizza(noPizza),false);
});
