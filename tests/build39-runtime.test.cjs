const {test}=require('node:test');
const assert=require('node:assert/strict');
const B=require('../web/build39-runtime.js');

test('Build 39 provider policy removes only the disabled Mail.ru mirror',()=>{
 const providers=['https://overpass-api.de/api/interpreter','https://overpass.private.coffee/api/interpreter','https://overpass.osm.jp/api/interpreter','https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
 B.stripProviderArray(providers);
 assert.deepEqual(providers,['https://overpass-api.de/api/interpreter','https://overpass.private.coffee/api/interpreter','https://overpass.osm.jp/api/interpreter']);
 assert.equal(B.blockedProvider('https://maps.mail.ru/osm/tools/overpass/api/interpreter'),true);
 assert.equal(B.blockedProvider('https://overpass-api.de/api/interpreter'),false);
});

test('review portal hub builds Google, Yelp, TripAdvisor and Mangrove destinations',()=>{
 const place={name:'Pizza Test',address:'Example Street 1, Hamburg',lat:53.55,lng:10.0};
 const urls=B.portalUrls(place);
 assert.equal(new URL(urls.google).hostname,'www.google.com');
 assert.equal(new URL(urls.yelp).hostname,'www.yelp.com');
 assert.equal(new URL(urls.tripadvisor).hostname,'www.tripadvisor.com');
 assert.equal(new URL(urls.mangrove).hostname,'mangrove.reviews');
 assert.match(new URL(urls.mangrove).searchParams.get('sub'),/^geo:53\.55,10\?q=Pizza%20Test&u=30$/);
});

test('visited-place helper always uses the newest valid personal rating event',()=>{
 const row={events:[{rating:8.2,updatedAt:'2026-01-01T00:00:00Z'},{rating:9.1,updatedAt:'2026-09-01T00:00:00Z'},{rating:'nope',updatedAt:'2026-10-01T00:00:00Z'}]};
 assert.equal(B.latestEvent(row).rating,9.1);
});
