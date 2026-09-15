const {test}=require('node:test');
const assert=require('node:assert/strict');
const O=require('../web/pizza-only.js');

const place=(id,type,name,cuisine='',tags={})=>({placeId:'node-'+id,type,name,cuisine,pizzaEvidence:/pizza/i.test(name+' '+cuisine)?'confirmed':'search',tags});
const helper={
 stateIntent:q=>/standort/i.test(q)?['location']:/gemerkt|favorit/i.test(q)?['saved']:[],
 categoryIntent:q=>{const s=String(q).toLowerCase(),out=[];if(/cafe|kaffee/.test(s))out.push('cafe');if(/imbiss|fast food/.test(s))out.push('fast_food');if(/food ?truck/.test(s))out.push('food_truck');if(/pizza/.test(s))out.push('pizza');else if(/restaurant|ristorante|trattoria|osteria|bar|pub|biergarten/.test(s))out.push('other');return out;},
 tokens:q=>String(q).toLowerCase().split(/\s+/).filter(Boolean),
 GENERIC:new Set(['restaurant','restaurants','cafe','kaffee','imbiss','fast','food','pizza','pizzeria','gemerkt','favorit','standort','mein'])
};
const noReviews={PizzaRatingsUI:{summary:()=>({pizzaMentions:0})}};

test('all map categories are allowed only when the place has pizza evidence',()=>{
 const allowed=[
  place(1,'pizzeria','Pizza Roma','pizza'),
  place(2,'cafe','Café Centro','pizza;coffee_shop'),
  place(3,'fast_food','Snack Eck','pizza;kebab'),
  place(4,'food_truck','Rolling Kitchen','pizza'),
  place(5,'vending_pizza','24/7 Box','',{amenity:'vending_machine',vending:'pizza','vending:pizza':'yes'}),
  place(6,'other','Markthalle','pizza')
 ];
 assert.ok(allowed.every(O.directPizza));
 for(const p of [
  place(10,'cafe','Kaffeeküche','coffee_shop'),
  place(11,'fast_food','Döner Ecke','kebab'),
  place(12,'other','Ristorante Roma','italian'),
  place(13,'other','Restaurant Nord','german')
 ])assert.equal(O.directPizza(p),false,p.name+' must not become a PizzaScan map place');
});

test('Italian identity alone is never treated as proof that pizza is sold',()=>{
 for(const name of ['Ristorante Roma','Trattoria Luigi','Osteria Bella','Napoli Italiano']){
  assert.equal(O.directPizza(place(20,'other',name,'italian')),false,name);
 }
 assert.equal(O.directPizza(place(21,'other','Ristorante Roma','italian;pizza')),true);
});

test('open-review pizza evidence can promote a generic internal candidate without exposing others',()=>{
 const candidate=place(30,'cafe','Café Test','coffee_shop');
 const yesRoot={PizzaRatingsUI:{summary:p=>({pizzaMentions:p.placeId==='node-30'?2:0})}};
 assert.equal(O.eligible(candidate,yesRoot),true);
 assert.equal(O.eligible(candidate,noReviews),false);
});

test('pizza-specific search stays strict while preserving geographic navigation targets',()=>{
 const groups=[[
  {kind:'venue',name:'Pizza Uno',place:place(1,'pizzeria','Pizza Uno','pizza')},
  {kind:'venue',name:'Kaffeeküche',place:place(2,'cafe','Kaffeeküche','coffee_shop')},
  {kind:'location',name:'Ahrensburg',address:'Schleswig-Holstein',lat:53.6759,lng:10.2393},
  {kind:'location',name:'Dein Standort',lat:53.55,lng:10.0,searchStates:['location']}
 ]];
 const pizza=O.pizzaOnlyGroups(groups,'pizza',helper,noReviews)[0];
 assert.deepEqual(pizza.map(x=>x.name),['Pizza Uno','Ahrensburg','Dein Standort']);
 assert.equal(O.restrictSearchToPizza('Pizza',helper),true);
 assert.equal(O.geographicLocationItem({kind:'location',lat:53.6759,lng:10.2393}),true);
 assert.equal(O.geographicLocationItem({kind:'location',lat:'x',lng:10.2393}),false);
});

test('explicit restaurant/category/name searches restore generic food POIs from the 2.2 search behaviour',()=>{
 const groups=[[
  {kind:'venue',name:'Pizza Uno',place:place(1,'pizzeria','Pizza Uno','pizza')},
  {kind:'venue',name:'Restaurant Nord',place:place(2,'other','Restaurant Nord','german',{amenity:'restaurant'})},
  {kind:'venue',name:'Kaffeeküche',place:place(3,'cafe','Kaffeeküche','coffee_shop',{amenity:'cafe'})},
  {kind:'location',name:'Ahrensburg',address:'Schleswig-Holstein',lat:53.6759,lng:10.2393}
 ]];
 for(const query of ['Restaurant','Restaurant Nord','Kaffeeküche','Café']){
  const results=O.pizzaOnlyGroups(groups,query,helper,noReviews)[0];
  assert.deepEqual(results.map(x=>x.name),groups[0].map(x=>x.name),query+' must not discard generic food POIs');
  assert.equal(O.restrictSearchToPizza(query,helper),false,query);
 }
});

test('saved and visited state do not bypass pizza eligibility',()=>{
 const groups=[[
  {kind:'venue',name:'Pizza Saved',searchStates:['saved'],place:place(1,'pizzeria','Pizza Saved','pizza')},
  {kind:'venue',name:'Generic Saved',searchStates:['saved'],place:place(2,'cafe','Generic Saved','coffee_shop')}
 ]];
 const filtered=O.pizzaOnlyGroups(groups,'gemerkt',helper,noReviews)[0];
 assert.deepEqual(filtered.map(x=>x.name),['Pizza Saved']);
});

test('pizza-only cache marker advances so installed clients drop stale search caches once',()=>{
 assert.equal(O.MARKER,'pizzascan-pizza-only-v5');
});