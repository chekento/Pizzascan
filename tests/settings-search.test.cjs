const {test}=require('node:test');
const assert=require('node:assert/strict');
const S=require('../web/settings-search.js');

const distance=(a,b)=>Math.hypot((a.lat-b.lat)*111,(a.lng-b.lng)*67);

test('pizza evidence follows the active unconfirmed-candidate setting exactly',()=>{
 const confirmed={pizzaEvidence:'confirmed'},possible={pizzaEvidence:'possible'},search={pizzaEvidence:'search'};
 assert.equal(S.evidenceAllowed(confirmed,{includeItalian:false}),true);
 assert.equal(S.evidenceAllowed(possible,{includeItalian:false}),false);
 assert.equal(S.evidenceAllowed(possible,{includeItalian:true}),true);
 assert.equal(S.evidenceAllowed(search,{includeItalian:true}),false,'generic search hits are never displayed automatically as confirmed pizza places');
 assert.equal(S.evidenceAllowed(search,{includeItalian:false},true),true,'an explicitly named restaurant may still be searched');
});

test('fallback terms are broad enough to supplement sparse map data but still follow place settings',()=>{
 const broad=S.fallbackTerms({types:['pizzeria','cafe','vending_pizza'],includeItalian:true});
 assert.deepEqual(broad,['pizza','pizzeria','pizza restaurant','italian restaurant','pizza cafe','pizza vending machine']);
 const strict=S.fallbackTerms({types:['pizzeria'],includeItalian:false});
 assert.deepEqual(strict,['pizza','pizzeria','pizza restaurant']);
 assert.equal(strict.includes('italian restaurant'),false);
 assert.deepEqual(S.fallbackTerms({types:[]}),[],'no enabled place types means no automatic fallback search');
});

test('radius fallback obeys the configured radius instead of expanding to five kilometres',()=>{
 const area=S.parseArea('[out:json];nwr["cuisine"~"pizza"](around:3600,53.6735,10.2377);out body center;');
 assert.equal(area.radius,3.6);
 const cfg={radius:3};
 assert.equal(S.inScope({lat:53.682,lng:10.2377},area,cfg,distance),true);
 assert.equal(S.inScope({lat:53.711,lng:10.2377},area,cfg,distance),false);
});

test('viewport mode keeps fallback results inside the current map bounds',()=>{
 const area=S.parseArea('[out:json];nwr["cuisine"~"pizza"](53.65,10.20,53.70,10.28);out body center;');
 assert.deepEqual(area.bounds,{south:53.65,west:10.20,north:53.70,east:10.28});
 assert.equal(S.inScope({lat:53.67,lng:10.24},area,{radius:0},distance),true);
 assert.equal(S.inScope({lat:53.71,lng:10.24},area,{radius:0},distance),false);
});

test('Photon venue candidates stay explicitly unconfirmed instead of being promoted to pizzerias',()=>{
 const item={name:'Roma',place:{placeId:'node-7',name:'Roma',lat:53.67,lng:10.24,type:'pizzeria',pizzaEvidence:'search',tags:{amenity:'restaurant'}}};
 const element=S.fallbackElement(item,'pizza',{types:['pizzeria']});
 assert.equal(element.type,'node');
 assert.equal(element.id,7);
 assert.equal(element.tags['pizzascan:evidence'],'possible');
 assert.equal(element.tags.speciality,undefined);
 assert.equal(element.tags.cuisine,undefined);
});

test('hybrid discovery merges sparse primary and fallback data without duplicate OSM identities',()=>{
 const primary=[{type:'node',id:1},{type:'node',id:2}];
 const fallback=[{type:'node',id:2,tags:{x:1}},{type:'way',id:3}];
 const merged=S.mergeElements(primary,fallback);
 assert.deepEqual(merged.map(x=>`${x.type}-${x.id}`),['node-1','node-2','way-3']);
 assert.equal(merged[1].tags,undefined,'the precise primary record wins on duplicate identity');
});
