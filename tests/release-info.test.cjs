const {test}=require('node:test');
const assert=require('node:assert/strict');
const R=require('../web/release-info.js');

test('release panel identifies current 2.3.5 direct build and Play closed track as next milestone',()=>{
 assert.equal(R.RELEASE.version,'2.3.5');
 assert.equal(R.RELEASE.build,28);
 assert.equal(R.RELEASE.next,'Google Play Closed Track');
});

test('release panel exposes changelog, archive and production-named current APK in all supported languages',()=>{
 for(const lang of ['de','en','it','es','fr']){
  const html=R.html(lang);
  assert.match(html,/pizzascan-release-info/);
  assert.match(html,/PizzaScan 2\.3\.5 · Build 28/);
  assert.match(html,/CHANGELOG\.md/);
  assert.match(html,/downloads\/README\.md/);
  assert.match(html,/PizzaScan-2\.3\.5\.apk/);
  assert.doesNotMatch(html,/PizzaScan-2\.3\.5-Test\.apk/);
  assert.match(html,/2\.3\.0/);
  assert.match(html,/2\.3\.4/);
 }
});
