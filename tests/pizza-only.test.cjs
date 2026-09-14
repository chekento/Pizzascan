const {test}=require('node:test');
const assert=require('node:assert/strict');
const O=require('../web/pizza-only.js');

const place=(id,type,name,cuisine='',tags={})=>({placeId:'node-'+id,type,name,cuisine,pizzaEvidence:/pizza/i.test(name+' '+cuisine)?'confirmed':'search',tags});

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
 ])assert.equal(O.directPizza(p),false,p.name+' must not become a PizzaScan place');
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
 const noRoot={PizzaRatingsUI:{summary:()=>({pizzaMentions:0})}};
 assert.equal(O.eligible(candidate,yesRoot),true);
 assert.equal(O.eligible(candidate,noRoot),false);
});

test('search groups remove generic venues and generic geocoder locations',()=>{
 const helper={stateIntent:q=>/standort/i.test(q)?['location']:[]};
 const groups=[[
  {kind:'venue',name:'Pizza Uno',place:place(1,'pizzeria','Pizza Uno','pizza')},
  {kind:'venue',name:'Café ohne Pizza',place:place(2,'cafe','Café ohne Pizza','coffee_shop')},
  {kind:'location',name:'Ahrensburg',address:'Schleswig-Holstein'},
  {kind:'location',name:'Dein Standort',searchStates:['location']}
 ]];
 const pizza=O.pizzaOnlyGroups(groups,'pizza',helper,{PizzaRatingsUI:{summary:()=>({pizzaMentions:0})}})[0];
 assert.deepEqual(pizza.map(x=>x.name),['Pizza Uno']);
 const gps=O.pizzaOnlyGroups(groups,'mein Standort',helper,{PizzaRatingsUI:{summary:()=>({pizzaMentions:0})}})[0];
 assert.deepEqual(gps.map(x=>x.name),['Pizza Uno','Dein Standort']);
});

test('saved and visited state do not bypass pizza eligibility',()=>{
 const helper={stateIntent:()=>['saved']};
 const groups=[[
  {kind:'venue',name:'Pizza Saved',searchStates:['saved'],place:place(1,'pizzeria','Pizza Saved','pizza')},
  {kind:'venue',name:'Generic Saved',searchStates:['saved'],place:place(2,'cafe','Generic Saved','coffee_shop')}
 ]];
 const filtered=O.pizzaOnlyGroups(groups,'gemerkt',helper,{PizzaRatingsUI:{summary:()=>({pizzaMentions:0})}})[0];
 assert.deepEqual(filtered.map(x=>x.name),['Pizza Saved']);
});
