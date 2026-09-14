const {test}=require('node:test');
const assert=require('node:assert/strict');
const S=require('../web/settings-search.js');

const distance=(a,b)=>Math.hypot((a.lat-b.lat)*111,(a.lng-b.lng)*67);

test('pizza evidence follows the active include-Italian setting exactly',()=>{
 const confirmed={pizzaEvidence:'confirmed'},possible={pizzaEvidence:'possible'},search={pizzaEvidence:'search'};
 assert.equal(S.evidenceAllowed(confirmed,{includeItalian:false}),true);
 assert.equal(S.evidenceAllowed(possible,{includeItalian:false}),false);
 assert.equal(S.evidenceAllowed(possible,{includeItalian:true}),true);
 assert.equal(S.evidenceAllowed(search,{includeItalian:true}),false,'generic search hits are never automatic nearby pizza evidence');
 assert.equal(S.evidenceAllowed(search,{includeItalian:false},true),true,'an explicitly named restaurant may still be searched');
});

test('fallback terms follow enabled place types and never use generic Italian restaurant inference',()=>{
 const terms=S.fallbackTerms({types:['pizzeria','cafe','vending_pizza']});
 assert.deepEqual(terms,['pizza','pizzeria','pizza cafe','pizza vending machine']);
 assert.equal(terms.some(x=>/italian restaurant/i.test(x)),false);
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
