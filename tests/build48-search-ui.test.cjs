const test=require('node:test');
const assert=require('node:assert/strict');
const B=require('../web/build48-runtime.js');

test('Build 48 version and nearby baseline',()=>{
  assert.equal(B.VERSION,'2.3.13');
  assert.equal(B.BUILD,48);
  assert.equal(B.DEFAULT_NEARBY_RADIUS,5);
});

test('Build 48 restores a practical nearby radius after Build 47 viewport migration',()=>{
  assert.equal(B.normalizedRadius(0),5);
  assert.equal(B.normalizedRadius('0'),5);
  assert.equal(B.normalizedRadius(undefined),5);
});

test('Build 48 preserves explicit supported fixed radii',()=>{
  for(const radius of [1,3,5,10])assert.equal(B.normalizedRadius(radius),radius);
});
