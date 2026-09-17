const {test}=require('node:test');
const assert=require('node:assert/strict');
const H=require('../web/build41-hardening.js');

test('continuous search radius is clamped and quantized to 0.5 km',()=>{
  assert.equal(H.normalizeRadius(0),0);
  assert.equal(H.normalizeRadius(.2),.5);
  assert.equal(H.normalizeRadius(4.24),4);
  assert.equal(H.normalizeRadius(4.26),4.5);
  assert.equal(H.normalizeRadius(99),10);
});

test('data confidence rises with sample size and falls for stale/error state',()=>{
  const one=H.dataConfidence({rating:4.8,count:1});
  const many=H.dataConfidence({rating:4.8,count:300});
  assert.ok(many>one);
  assert.ok(H.dataConfidence({rating:4.8,count:30,stale:true})<H.dataConfidence({rating:4.8,count:30}));
  assert.equal(H.dataConfidence({rating:null,count:20}),0);
});

test('fusion keeps scores on 0-10 and reports increasing coverage for multiple sources',()=>{
  const one=H.fusion([{score:8,weight:1,count:1}]);
  const several=H.fusion([{score:8,weight:2,count:50},{score:9,weight:3,count:400},{score:7,weight:.5,count:1}]);
  assert.ok(several.score>=0&&several.score<=10);
  assert.ok(several.coverage>one.coverage);
  assert.equal(several.sources,3);
});

test('radar score favors open, closer and better-supported places',()=>{
  const strong=H.radarScore({distance:.4,rating:4.7,confidence:90,open:'open',confirmed:true});
  const weak=H.radarScore({distance:5,rating:3.5,confidence:30,open:'closed',confirmed:false});
  assert.ok(strong>weak);
});

test('local percentile is deterministic',()=>{
  assert.equal(H.localPercentile([2,4,6,8],7),75);
  assert.equal(H.localPercentile([],7),null);
});
