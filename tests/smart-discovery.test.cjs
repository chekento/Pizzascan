const {test}=require('node:test');
const assert=require('node:assert/strict');
const S=require('../web/smart-discovery.js');

const el=(id,tags)=>({type:'node',id,lat:53.67,lon:10.24,tags});

test('original WebSim pizza/Italian POI families remain baseline when cuisine is plausible',()=>{
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

test('explicit incompatible cuisines veto weak pizza hints but direct pizza evidence still wins',()=>{
 const rejected=[
  {amenity:'restaurant',name:'Asia Haus',cuisine:'asian',note:'Pizza nearby'},
  {amenity:'restaurant',name:'Sushi Bar',cuisine:'sushi',description:'Guests also mention pizza'},
  {amenity:'restaurant',name:'Thai & Italian',cuisine:'thai;italian'},
  {amenity:'restaurant',name:'China Town',cuisine:'chinese','website:menu':'https://example.test/pizza-menu'}
 ];
 for(const tags of rejected)assert.equal(S.eligibleElement(el(20,tags)),false,JSON.stringify(tags));
 const direct=[
  {amenity:'restaurant',name:'Asia Pizza',cuisine:'asian'},
  {amenity:'restaurant',name:'Fusion',cuisine:'asian;pizza'},
  {amenity:'restaurant',name:'Thai Bistro',cuisine:'thai',product:'pizza'}
 ];
 for(const tags of direct)assert.equal(S.eligibleElement(el(21,tags)),true,JSON.stringify(tags));
});

test('real menu/comment/product evidence can add plausible food POIs, URLs alone cannot',()=>{
 const extras=[
  {amenity:'restaurant',name:'Restaurant Nord',note:'Freitags gibt es Pizza'},
  {amenity:'bar',name:'Bar Central',description:'Cocktails, snacks and pizza'},
  {amenity:'biergarten',name:'Garten',products:'beer;pizza'},
  {amenity:'cafe',name:'Café Test',menu:'Pizza Margherita; Kuchen'},
  {shop:'bakery',name:'Backstube',product:'pizza'}
 ];
 assert.ok(extras.every(tags=>S.eligibleElement(el(2,tags))));
 assert.equal(S.eligibleElement(el(22,{amenity:'cafe',name:'Café URL','website:menu':'https://example.test/pizza-menu'})),false);
 assert.equal(S.pizzaMenuEvidence({'website:menu':'https://example.test/pizza-menu'}),false);
 assert.equal(S.pizzaText({website:'https://pizza.example.test'}),false);
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

test('strict nearby query keeps pizza and Italian discovery without generic restaurant sweep or URL-menu selectors',()=>{
 const q=S.strictQuery({lat:53.675,lng:10.24},3,{south:53.6,west:10.1,north:53.7,east:10.3});
 assert.match(q,/amenity\"=\"restaurant/);
 assert.match(q,/cuisine\"~\"pizza\|pizzeria\|italian/);
 assert.match(q,/description\"~\"pizza/);
 assert.match(q,/note\"~\"pizza/);
 assert.match(q,/menu\"~\"pizza/);
 assert.doesNotMatch(q,/website:menu\"~\"pizza/);
 assert.doesNotMatch(q,/contact:menu\"~\"pizza/);
 assert.doesNotMatch(q,/amenity\"~\"restaurant\|fast_food\|cafe[^\]]*\]\[\"name\"\]/);
});

test('Google review evidence only counts actual review text',()=>{
 const pizzaText={querySelectorAll:()=>[{textContent:'Great pizza and friendly staff'}]};
 const noPizza={querySelectorAll:()=>[{textContent:'Great coffee and cake'}]};
 assert.equal(S.googleReviewHasPizza(pizzaText),true);
 assert.equal(S.googleReviewHasPizza(noPizza),false);
});

test('precision cache marker advances for installed clients',()=>{
 assert.equal(S.MARKER,'pizzascan-smart-discovery-v2');
});
