const {test}=require('node:test');
const assert=require('node:assert/strict');
const R=require('../web/release-info.js');

test('release panel identifies current maintenance build and planned next release',()=>{
 assert.equal(R.RELEASE.version,'2.3.3');
 assert.equal(R.RELEASE.build,23);
 assert.equal(R.RELEASE.next,'2.3.4');
});

test('release panel exposes changelog, archive and current APK in all supported languages',()=>{
 for(const lang of ['de','en','it','es','fr']){
  const html=R.html(lang);
  assert.match(html,/pizzascan-release-info/);
  assert.match(html,/PizzaScan 2\.3\.3 · Build 23/);
  assert.match(html,/CHANGELOG\.md/);
  assert.match(html,/downloads\/README\.md/);
  assert.match(html,/PizzaScan-2\.3\.3-Test\.apk/);
  assert.match(html,/2\.3\.0, 2\.3\.1/);
 }
});
