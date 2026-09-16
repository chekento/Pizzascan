'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const O=require('../web/open-reviews-publish.js');

const venue={placeId:'node-123',name:'Trattoria Roma',lat:40.727,lng:-73.989};

test('PizzaScan 0.1-10 rating maps to Open Reviews 0-100 scale',()=>{
  assert.equal(O.rating100(.1),1);
  assert.equal(O.rating100(4.6),46);
  assert.equal(O.rating100(10),100);
  assert.throws(()=>O.rating100(0));
});

test('New review payload uses geo subject and OSM identity metadata',()=>{
  const p=O.payloadFor(venue,8.7,'Great pizza',1760000000000);
  assert.equal(p.rating,87);
  assert.match(p.sub,/^geo:40\.727,-73\.989\?q=Trattoria%20Roma&u=30$/);
  assert.equal(p.metadata.osm_id,'node-123');
  assert.equal(p.metadata.license,'CC-BY-4.0');
  assert.equal(p.opinion,'Great pizza');
});

test('Edit payload targets the previous Mangrove signature',()=>{
  const sig='A'.repeat(64),p=O.editPayload(sig,9.3,'Updated');
  assert.equal(p.sub,'urn:maresi:'+sig);
  assert.equal(p.action,'edit');
  assert.equal(p.rating,93);
});

test('Publishing helper refuses overlong public opinion text',()=>{
  assert.throws(()=>O.payloadFor(venue,8,'x'.repeat(O.MAX_OPINION+1)),/höchstens/);
});

test('ES256 JWT contains Mangrove kid and payload and yields a stable signature segment',async()=>{
  const c=globalThis.crypto||require('node:crypto').webcrypto;
  const pair=await c.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
  const payload=O.payloadFor(venue,7.5,'Test');
  const jwt=await O.signJwt(c,pair,payload),parts=jwt.split('.');
  assert.equal(parts.length,3);
  assert.ok(O.signatureFromJwt(jwt));
  const decode=s=>JSON.parse(Buffer.from(s.replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8'));
  const header=decode(parts[0]),body=decode(parts[1]);
  assert.equal(header.alg,'ES256');
  assert.match(header.kid,/BEGIN PUBLIC KEY/);
  assert.equal(body.rating,75);
  assert.equal(body.metadata.osm_id,'node-123');
});

test('submit uses Mangrove PUT endpoint without credentials',async()=>{
  let call;
  const fetcher=async(url,options)=>{call={url,options};return {ok:true,text:async()=>''};};
  await O.submit(fetcher,'a.b.'+'C'.repeat(64));
  assert.match(call.url,/api\.mangrove\.reviews\/submit\//);
  assert.equal(call.options.method,'PUT');
  assert.equal(call.options.credentials,'omit');
});
