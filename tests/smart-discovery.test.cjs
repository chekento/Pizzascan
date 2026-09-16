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

test('ordinary restaurants are hidden without pizza or Italian evidence',()=>{
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

test('WebSim query restores the original families without listing every restaurant',()=>{
 const q=S.websimQuery({lat:53.675,lng:10.24},5,{south:53.6,west:10.1,north:53.7,east:10.3});
 assert.match(q,/pizzascan-websim-search-v9/);
 assert.match(q,/cuisine\"~\"pizza\|pizzeria/);
 assert.match(q,/amenity\"=\"restaurant\"\]\[\"cuisine\"~\"italian\|italiano\|italiana/);
 assert.match(q,/ristorante\|trattoria\|osteria/);
 assert.match(q,/bar\|pub\|biergarten/);
 assert.match(q,/shop\"~\"bakery\|deli/);
 assert.match(q,/menu\"~\"pizza/);
 assert.match(q,/description\"~\"pizza/);
 assert.match(q,/vending:pizza\"=\"yes/);
 assert.doesNotMatch(q,/amenity\"=\"restaurant\"\]\[\"name\"\]\(around:/,'primary WebSim query must not fetch every named restaurant');
 assert.equal(S.isWebsimDiscoveryQuery(q),true);
});

test('focused fallback preserves semantic Italian candidates when Photon omits cuisine metadata',async()=>{
 const calls=[];
 const item=(id,name,tags={})=>({place:{placeId:'node-'+id,name,lat:53.675,lng:10.24,tags:{amenity:'restaurant',name,...tags}}});
 const service={async photon(term){
  calls.push(term);
  if(term==='pizzeria')return [item(1,'Pizza Max')];
  if(term==='italian restaurant')return [item(2,'Casa Verde')];
  if(term==='ristorante')return [item(3,'Da Franco')];
  if(term==='trattoria')return [item(4,'Trattoria Roma')];
  if(term==='osteria')return [item(5,'Osteria Uno')];
  return [];
 }};
 const q=S.websimQuery({lat:53.675,lng:10.24},5,{south:53.6,west:10.1,north:53.7,east:10.3});
 const out=await S.focusedRecovery(service,q,{},[]);
 assert.ok(calls.includes('italian restaurant'));
 assert.ok(calls.includes('ristorante'));
 assert.ok(calls.includes('trattoria'));
 const casa=out.find(x=>x.tags.name==='Casa Verde');
 assert.ok(casa,'neutral-name Italian search result must survive as a candidate');
 assert.equal(casa.tags[S.SEARCH_FAMILY],'italian');
 assert.equal(S.directPizzaEvidence(casa.tags),false,'semantic candidate is not fabricated as confirmed pizza evidence');
 assert.equal(S.italianEvidence(casa.tags),false,'semantic candidate does not fabricate cuisine=italian');
 assert.equal(S.italianCandidate({name:casa.tags.name,tags:casa.tags}),true);
 assert.ok(S.relevantCount(out)>=5);
});

test('semantic fallback rejects obvious cuisine contradictions',()=>{
 const candidates=[
  S.focusedElement({place:{placeId:'node-21',name:'New Long',lat:53.67,lng:10.24,tags:{amenity:'restaurant',name:'New Long',cuisine:'chinese'}}},'italian restaurant'),
  S.focusedElement({place:{placeId:'node-22',name:'Bangkok',lat:53.67,lng:10.24,tags:{amenity:'restaurant',name:'Bangkok'}}},'ristorante'),
  S.focusedElement({place:{placeId:'node-23',name:'BLOCK HOUSE',lat:53.67,lng:10.24,tags:{amenity:'restaurant',name:'BLOCK HOUSE',cuisine:'steak'}}},'italienisches restaurant'),
  S.focusedElement({place:{placeId:'node-24',name:'PokeBowl Sushi House',lat:53.67,lng:10.24,tags:{amenity:'restaurant',name:'PokeBowl Sushi House'}}},'trattoria')
 ];
 assert.deepEqual(candidates,[null,null,null,null]);
});

test('focused fallback terms cover requested WebSim venue vocabulary',()=>{
 for(const term of ['pizzeria','pizza','italian restaurant','italienisches restaurant','ristorante','trattoria','osteria','pizza cafe','pizza takeaway','pizza pub','pizza bar','pizza bakery','pizza bakeshop','pizza food truck','pizza vending'])assert.ok(S.FOCUSED_TERMS.includes(term),term);
 assert.equal(S.FOCUSED_TARGET,8);
});

test('precise provider recovery filters ordinary restaurants but keeps Italian cuisine',async()=>{
 const service={async json(){return {elements:[el(61,{amenity:'restaurant',name:'BLOCK HOUSE',cuisine:'steak'}),el(62,{amenity:'restaurant',name:'Da Franco',cuisine:'italian'}),el(63,{amenity:'restaurant',name:'Pizza Uno',cuisine:'pizza'})]};}};
 const q=S.websimQuery({lat:53.67,lng:10.24},5,{south:53.6,west:10.1,north:53.7,east:10.3});
 const out=await S.preciseProviderRecovery(service,q,{},[]);
 assert.ok(out.elements.some(x=>x.tags.name==='Da Franco'));
 assert.ok(out.elements.some(x=>x.tags.name==='Pizza Uno'));
 assert.ok(!out.elements.some(x=>x.tags.name==='BLOCK HOUSE'));
});

test('install patches Service.prototype so the later-created app service really gets focused recovery',async()=>{
 class Service{
  async overpass(){return {data:{elements:[el(50,{amenity:'restaurant',name:'Restaurant Nord'})]},source:'base'};}
  async photon(term){if(term==='italian restaurant')return [{place:{placeId:'node-51',name:'Casa Verde',lat:53.67,lng:10.24,tags:{amenity:'restaurant',name:'Casa Verde'}}}];return [];}
 }
 const PD={Service,TYPES:{pizzeria:{emoji:'🍕',name:'Pizzeria'},other:{emoji:'🍽️',name:'Weitere Orte'}},query(){return 'old';},filter(list){return list;}};
 const root={PizzaPlaces:PD,PizzaRatingsUI:{summary:()=>({pizzaMentions:0})},localStorage:null};
 S.install(root);
 const service=new Service();
 const q=PD.query({lat:53.67,lng:10.24},5,{south:53.6,west:10.1,north:53.7,east:10.3});
 const result=await service.overpass(q);
 const hit=result.data.elements.find(x=>x.tags?.name==='Casa Verde');
 assert.ok(hit);
 assert.equal(hit.tags[S.SEARCH_FAMILY],'italian');
 assert.equal(service.overpass.__websimFocused,true);
});

test('legacy generic Photon fallback is bypassed before a future Service instance is created',()=>{
 class Service{async overpass(){return {data:{elements:[]},source:'base'};}async nearbyFallback(){return [el(70,{amenity:'fast_food',name:'Burger Only'})];}}
 const PD={Service,TYPES:{pizzeria:{emoji:'🍕'},other:{emoji:'🍽️'}},query(){return 'old';},filter(list){return list;}};
 S.install({PizzaPlaces:PD,PizzaRatingsUI:{summary:()=>({pizzaMentions:0})},localStorage:null});
 assert.equal(Service.prototype.nearbyFallback.__websimBypass,true);
});

test('installed map filter hides generic candidate pool and exposes relevant semantic/review candidates',()=>{
 const pizza={name:'Pizza Max',type:'pizzeria',pizzaEvidence:'confirmed',tags:{amenity:'restaurant',name:'Pizza Max',cuisine:'pizza'}};
 const neutral={name:'Restaurant Nord',type:'other',pizzaEvidence:'search',tags:{amenity:'restaurant',name:'Restaurant Nord'}};
 const semantic={name:'Casa Verde',type:'other',pizzaEvidence:'search',tags:{amenity:'restaurant',name:'Casa Verde',[S.SEARCH_FAMILY]:'italian'}};
 const reviewed={name:'Restaurant Review',type:'other',pizzaEvidence:'search',tags:{amenity:'restaurant',name:'Restaurant Review'}};
 const PD={TYPES:{pizzeria:{emoji:'🍕',name:'Pizzeria'},other:{emoji:'🍽️',name:'Weitere Orte'}},query(){return 'old';},filter(list){return list;}};
 const ratings={summary:p=>({pizzaMentions:p.name==='Restaurant Review'?1:0})};
 const root={PizzaPlaces:PD,PizzaRatingsUI:ratings,localStorage:null};
 S.install(root);
 const visible=PD.filter([pizza,neutral,semantic,reviewed],{},null,()=>({state:'unknown'}));
 assert.deepEqual(visible.map(p=>p.name),['Pizza Max','Casa Verde','Restaurant Review']);
 assert.equal(PD.TYPES.other.emoji,'🍝');
 assert.equal(PD.TYPES.pizzeria.emoji,'🍕');
});

test('Google review evidence only counts actual review text',()=>{
 const pizzaText={querySelectorAll:()=>[{textContent:'Great pizza and friendly staff'}]};
 const noPizza={querySelectorAll:()=>[{textContent:'Great coffee and cake'}]};
 assert.equal(S.googleReviewHasPizza(pizzaText),true);
 assert.equal(S.googleReviewHasPizza(noPizza),false);
});

test('relevance cache marker advances for installed clients',()=>{
 assert.equal(S.MARKER,'pizzascan-smart-discovery-v9');
});